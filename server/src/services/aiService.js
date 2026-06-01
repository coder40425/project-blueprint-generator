const axios = require("axios");

// ─────────────────────────────────────────────────────────────
// PROMPT 1 — Blueprint only (no code, keeps tokens low & stable)
// ─────────────────────────────────────────────────────────────
const BLUEPRINT_PROMPT = `You are a senior software architect and academic project advisor.

Generate a detailed software project blueprint for a university mini-project report.

Return ONLY a valid JSON object. No markdown. No code fences. Raw JSON only.

JSON RULES:
- Syntactically perfect JSON only
- No trailing commas
- No newlines inside string values — use spaces instead
- Escape special characters

{
  "title": "Formal project title e.g. FoodFleet: A Real-Time Food Delivery Management System",
  "tagline": "One-line professional subtitle",
  "description": "Academic abstract 5-6 sentences: what the system does, problem it solves, target users, technologies used, engineering significance.",
  "category": "Web Application or E-Commerce or Food & Delivery or HealthTech or EdTech or Productivity or FinTech or SaaS or Social Platform or AI / Productivity",
  "techStack": {
    "frontend": ["5 specific technologies with versions"],
    "backend": ["5 specific technologies"],
    "database": ["3 specific technologies"],
    "devops": ["5 specific technologies"]
  },
  "features": [
    { "name": "Feature name", "description": "40-50 word description: what it does, how implemented technically, what problem it solves.", "priority": "high" }
  ],
  "database": [
    { "name": "table_name", "columns": [ { "name": "col", "type": "UUID", "note": "PK" } ] }
  ],
  "apis": [
    { "method": "POST", "path": "/api/v1/path", "description": "25-35 word description of what endpoint does, accepts, returns.", "auth": false }
  ],
  "devSteps": [
    { "step": 1, "title": "Phase title", "description": "50-70 word paragraph: what is built, files created, tools configured, patterns applied, deliverable." }
  ],
  "timeline": [
    { "phase": "Phase 1 - Name", "duration": "Week 1-2", "tasks": ["task1", "task2", "task3", "task4"] }
  ],
  "folderStructure": "project/\\n├── client/\\n│   └── src/\\n│       ├── components/\\n│       ├── pages/\\n│       ├── hooks/\\n│       ├── store/\\n│       └── services/\\n├── server/\\n│   └── src/\\n│       ├── controllers/\\n│       ├── routes/\\n│       ├── services/\\n│       ├── models/\\n│       └── middleware/\\n└── README.md"
}

REQUIREMENTS:
- features: 8 items (3-4 high, 2-3 medium, 1-2 low), each 40-50 words
- apis: 10 endpoints (auth + CRUD + domain + admin), each 25-35 words
- devSteps: 8 steps, each 50-70 words
- timeline: 5 phases, 4 tasks each
- database: 4 tables, 6 columns each with SQL types and constraints
- folderStructure: 20+ line ASCII tree for both client and server
- All text specific to the project — no generic placeholders
- Output ONLY the JSON object`;

// ─────────────────────────────────────────────────────────────
// PROMPT 2 — Code files only (separate call, full token budget)
// ─────────────────────────────────────────────────────────────
const CODE_PROMPT = `You are a senior full-stack developer generating starter code files for a university mini-project.

You will receive a project blueprint JSON. Generate realistic starter implementation files.

Return ONLY a valid JSON object with a single key "generatedFiles". No markdown. No code fences. Raw JSON only.

JSON RULES:
- Syntactically perfect JSON only
- No trailing commas
- In file content strings: use \\n for newlines, escape all backslashes as \\\\, escape all double quotes as \\"
- No literal newlines inside any JSON string value

Output format:
{
  "generatedFiles": [
    {
      "path": "server/src/models/User.js",
      "language": "JavaScript",
      "type": "Model",
      "purpose": "Mongoose/Prisma User model with authentication fields",
      "content": "full file content as a single string with \\n for newlines"
    }
  ]
}

LANGUAGE PREFERENCE RULE (highest priority):
  If the user mentioned a specific language or framework (e.g. "in TypeScript", "using Python",
  "with NestJS", "in Java"), generate ALL files in that language/framework — even if the
  blueprint techStack says otherwise. The user's explicit preference always wins.

FILE SELECTION RULES — pick the 8-12 most impactful starter files:
  Always include:
    - Main entry point (server/index.js or main.py etc.)
    - Environment config (.env.example)
    - Database schema or ORM models (all tables)
    - Auth middleware
    - At least one complete controller + route pair
    - README.md with setup instructions

  Include if relevant to the stack:
    - Prisma schema (if Prisma in stack)
    - Docker / docker-compose (if Docker in stack)
    - Main frontend component or App.jsx/tsx
    - API service layer (frontend axios wrapper)
    - Database seed file

LANGUAGE / EXTENSION MAPPING:
  React → .jsx | React + TypeScript → .tsx | Next.js → .tsx
  Express → .js or .ts | NestJS → .ts | FastAPI/Flask/Django → .py
  Spring Boot → .java | PostgreSQL → .sql | Prisma → schema.prisma

CODE QUALITY:
  - Realistic, runnable starter code — not pseudocode
  - Include imports, exports, error handling
  - Add brief inline comments for key logic
  - Use the actual tech stack from the blueprint (exact package names, patterns)
  - Each file should be 30-120 lines

Output ONLY the JSON object with "generatedFiles" array.`;

// ─────────────────────────────────────────────────────────────
// Shared parser / validator
// ─────────────────────────────────────────────────────────────
function parseJSON(rawContent, label = "response") {
  if (!rawContent?.trim()) throw new Error(`Empty ${label} from model`);
  let s = rawContent.trim();
  // Strip accidental markdown fences
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error(`No JSON object found in ${label}`);
  s = s.slice(first, last + 1);
  try {
    return JSON.parse(s);
  } catch (e) {
    console.error(`[${label}] JSON parse error:`, e.message, "\nFirst 500 chars:\n", s.slice(0, 500));
    throw new Error(`${label} is not valid JSON: ${e.message}`);
  }
}

function validateBlueprint(parsed) {
  const required = [
    "title", "tagline", "description", "category",
    "techStack", "features", "database", "apis",
    "devSteps", "timeline", "folderStructure",
  ];
  const missing = required.filter(f => !(f in parsed));
  if (missing.length) throw new Error(`Blueprint missing fields: ${missing.join(", ")}`);
  return parsed;
}

// ─────────────────────────────────────────────────────────────
// OpenAI helper
// ─────────────────────────────────────────────────────────────
async function callOpenAI({ systemPrompt, userMessage, maxTokens = 4000, model = "gpt-4o-mini" }) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      max_tokens: maxTokens,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 120000, // 2 min — code gen can be slow
    }
  );
  return response.data?.choices?.[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
async function generateProjectBlueprint(userPrompt) {
  const sanitized = userPrompt.trim().slice(0, 300);
  if (!sanitized) {
    const e = new Error("Prompt empty");
    e.name = "ValidationError";
    throw e;
  }

  console.log(`\n🎯 Generating blueprint for: "${sanitized}"`);
  const t0 = Date.now();

  // ── CALL 1: Blueprint (structure, tables, APIs, etc.) ──────
  const blueprintRaw = await callOpenAI({
    systemPrompt: BLUEPRINT_PROMPT,
    userMessage: `Create a detailed university mini-project report blueprint for: "${sanitized}". Be specific to this domain. No generic text.`,
    maxTokens: 4000,
  });

  const blueprint = validateBlueprint(parseJSON(blueprintRaw, "blueprint"));
  console.log(`✅ Blueprint done in ${Date.now() - t0}ms — "${blueprint.title}"`);

  // ── CALL 2: Code files (separate budget, no token clash) ───
  console.log(`💻 Generating code files...`);
  const t1 = Date.now();

  let generatedFiles = [];
  try {
    const codeRaw = await callOpenAI({
      systemPrompt: CODE_PROMPT,
      userMessage: `User's original request: "${sanitized}"\n\nIMPORTANT: If the user specified a language, framework, or style preference above (e.g. "in TypeScript", "using Python", "with NestJS"), you MUST honour it — override the techStack below if needed.\n\nGenerate starter code files for this project blueprint:\n${JSON.stringify({
        title: blueprint.title,
        category: blueprint.category,
        techStack: blueprint.techStack,
        features: blueprint.features.slice(0, 4), // top 4 features for context
        database: blueprint.database,
        apis: blueprint.apis.slice(0, 5),          // top 5 endpoints for context
        folderStructure: blueprint.folderStructure,
      }, null, 2)}`,
      maxTokens: 6000, // generous budget for code
    });

    const codeResult = parseJSON(codeRaw, "code files");
    if (Array.isArray(codeResult.generatedFiles)) {
      generatedFiles = codeResult.generatedFiles;
      console.log(`✅ Code files done in ${Date.now() - t1}ms — ${generatedFiles.length} files generated`);
    } else {
      console.warn("⚠️  Code generation returned unexpected shape — skipping files");
    }
  } catch (err) {
    // Code gen failure is non-fatal — blueprint is still returned
    console.error("⚠️  Code generation failed (non-fatal):", err.message);
  }

  return {
    ...blueprint,
    generatedFiles,
  };
}

module.exports = { generateProjectBlueprint };
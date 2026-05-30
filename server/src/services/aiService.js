const axios = require("axios");

const SYSTEM_PROMPT = `You are a senior software architect and academic project advisor.

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
  "folderStructure": "project/\n├── client/\n│   └── src/\n│       ├── components/\n│       ├── pages/\n│       ├── hooks/\n│       ├── store/\n│       └── services/\n├── server/\n│   └── src/\n│       ├── controllers/\n│       ├── routes/\n│       ├── services/\n│       ├── models/\n│       └── middleware/\n└── README.md"
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

function parseAndValidate(rawContent) {
  if (!rawContent?.trim()) throw new Error("Empty response from model");
  let s = rawContent.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const first = s.indexOf("{"), last = s.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON in response");
  s = s.slice(first, last + 1);
  let parsed;
  try { parsed = JSON.parse(s); }
  catch (e) {
    console.error("Parse error:", e.message, "\nRaw:", s.slice(0, 400));
    throw new Error("Response is not valid JSON");
  }
  const required = ["title","tagline","description","category","techStack","features","database","apis","devSteps","timeline","folderStructure"];
  const missing = required.filter(f => !(f in parsed));
  if (missing.length) throw new Error(`Missing: ${missing.join(", ")}`);
  return parsed;
}

async function generateProjectBlueprint(userPrompt) {
  const sanitized = userPrompt.trim().slice(0, 300);
  if (!sanitized) { const e = new Error("Prompt empty"); e.name = "ValidationError"; throw e; }

  console.log(`\n🎯 Generating: "${sanitized}"`);
  const t0 = Date.now();

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      max_tokens: 3500,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a detailed university mini-project report blueprint for: "${sanitized}". Be specific to this domain. No generic text.` },
      ],
    },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      timeout: 90000,  // 90s — enough for 3500 tokens, won't hang forever
    }
  );

  const data = parseAndValidate(response.data?.choices?.[0]?.message?.content);
  console.log(`✅ ${Date.now() - t0}ms — "${data.title}"`);
  return data;
}

module.exports = { generateProjectBlueprint };
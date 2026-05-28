const axios = require("axios");

// ─── System Prompt ────────────────────────────────────────────
// Designed to produce a proper academic/student report style output
// that can be downloaded as a professional Word document.

const SYSTEM_PROMPT = `You are an expert and fast software architect and academic project advisor.
Generate a complete, professional software project blueprint suitable for university submission. (Do it fast)

Respond with ONLY a single valid JSON object — no markdown, no code fences, no explanation. Raw JSON only.

{
  "title": "string — formal project title, e.g. FoodFleet: A Real-Time Food Delivery Management System",
  "tagline": "string — one professional subtitle line",
  "description": "string — 3-4 sentence formal abstract describing the project purpose, scope, and significance",
  "category": "string — one of: Web Application, Mobile App, AI / Productivity, E-Commerce, Food & Delivery, HealthTech, EdTech, Productivity, FinTech, SaaS, Social Platform",
  "techStack": {
    "frontend": ["4-5 technologies with versions where applicable"],
    "backend": ["4-5 technologies"],
    "database": ["2-3 technologies"],
    "devops": ["4-5 technologies"]
  },
  "features": [
    { "name": "feature name", "description": "one clear sentence describing functionality and technical approach", "priority": "high" }
  ],
  "database": [
    {
      "name": "table_name",
      "columns": [
        { "name": "col_name", "type": "SQL_TYPE", "note": "PK or FK or UNIQUE or null" }
      ]
    }
  ],
  "apis": [
    { "method": "GET", "path": "/api/path", "description": "clear description of endpoint purpose", "auth": false }
  ],
  "devSteps": [
    { "step": 1, "title": "Phase Title", "description": "2 detailed sentences describing implementation approach and deliverables" }
  ],
  "timeline": [
    { "phase": "Phase 1 - Foundation", "duration": "Week 1-2", "tasks": ["task1", "task2", "task3", "task4"] }
  ],
  "folderStructure": "project-name/\n├── client/\n│   └── src/\n└── server/"
}

STRICT RULES:
- features: exactly 8 items (3-4 high, 2-3 medium, 1-2 low)
- apis: exactly 8-10 endpoints
- devSteps: exactly 6-8 steps
- timeline: exactly 4-5 phases
- database: 3-5 tables, 5-7 columns each
- Generate a realistic production-grade folder structure specific to the project.
Include meaningful folders and important config files.
- priority values: ONLY "high", "medium", or "low"
- method values: ONLY "GET", "POST", "PUT", "DELETE", or "PATCH"
- auth: boolean true or false
- Be SPECIFIC to the project, use professional academic language
- Output ONLY the JSON object`;

// ─── Parse & Validate ─────────────────────────────────────────
function parseAndValidate(rawContent) {
  if (!rawContent || !rawContent.trim()) throw new Error("Empty response from model");

  let jsonString = rawContent.trim();
  if (jsonString.startsWith("```")) {
    jsonString = jsonString.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  }
  const first = jsonString.indexOf("{");
  const last = jsonString.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("No JSON object in response");
  jsonString = jsonString.slice(first, last + 1);

  console.log(rawContent);
  let parsed;

  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("RAW AI RESPONSE:\n", jsonString);
    throw new Error("Response is not valid JSON");
  }

  const required = ["title", "tagline", "description", "category", "techStack", "features", "database", "apis", "devSteps", "timeline", "folderStructure"];
  const missing = required.filter(f => !(f in parsed));
  if (missing.length > 0) throw new Error(`Missing fields: ${missing.join(", ")}`);
  if (!Array.isArray(parsed.features) || !parsed.features.length) throw new Error("features empty");
  if (!Array.isArray(parsed.apis) || !parsed.apis.length) throw new Error("apis empty");
  if (!Array.isArray(parsed.devSteps) || !parsed.devSteps.length) throw new Error("devSteps empty");
  if (!Array.isArray(parsed.timeline) || !parsed.timeline.length) throw new Error("timeline empty");
  if (!Array.isArray(parsed.database) || !parsed.database.length) throw new Error("database empty");

  return parsed;
}

// ─── Main Generator ───────────────────────────────────────────
async function generateProjectBlueprint(userPrompt) {
  const sanitized = userPrompt.trim().slice(0, 300);
  if (!sanitized) {
    const err = new Error("Prompt cannot be empty");
    err.name = "ValidationError";
    throw err;
  }

  console.log(`\n🎯 Generating: "${sanitized}"`);
  const startTime = Date.now();

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      max_tokens: 2000,
      temperature: 0.5,
      response_format: { type: "json_object" }, // Native JSON mode — always valid JSON, no fences
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a complete professional project blueprint for: "${sanitized}"` },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 120000,
    }
  );

  const data = parseAndValidate(rawContent);
  console.log(`✅ Done in ${Date.now() - startTime}ms — "${data.title}"`);
  return data;
}

module.exports = { generateProjectBlueprint };
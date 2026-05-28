const axios = require("axios");

// ─── System Prompt ────────────────────────────────────────────
// Designed to produce a proper academic/student report style output
// that can be downloaded as a professional Word document.

const SYSTEM_PROMPT = `
You are a fast and professional software architect and academic project advisor.

Generate a professional software project blueprint suitable for university mini-project reports.

Respond with ONLY one valid JSON object.
No markdown.
No explanations.
No code fences.

{
  "title": "Formal project title",
  "tagline": "Professional one-line subtitle",
  "description": "2-3 paragraph-style concise academic abstract explaining project purpose, workflow, and significance",

  "category": "Project category",

  "techStack": {
    "frontend": ["3-5 technologies"],
    "backend": ["3-5 technologies"],
    "database": ["2-3 technologies"],
    "devops": ["2-4 technologies"]
  },

  "features": [
    {
      "name": "Feature name",
      "description": "Clear implementation-focused explanation",
      "priority": "high"
    }
  ],

  "database": [
    {
      "name": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "SQL_TYPE",
          "note": "PK or FK or UNIQUE"
        }
      ]
    }
  ],

  "apis": [
    {
      "method": "GET",
      "path": "/api/example",
      "description": "Purpose of endpoint",
      "auth": true
    }
  ],

  "devSteps": [
    {
      "step": 1,
      "title": "Development phase",
      "description": "Short implementation explanation with deliverables"
    }
  ],

  "timeline": [
    {
      "phase": "Phase Name",
      "duration": "Week range",
      "tasks": ["task1", "task2", "task3"]
    }
  ],

  "folderStructure": "Detailed realistic production-grade folder structure with meaningful directories and important files"
}

RULES:
- features: 6-7 items
- apis: 6-8 endpoints
- devSteps: 5-6 steps
- timeline: 4 phases
- database: 3-4 tables
- each table: 4-6 columns
- Keep descriptions informative but concise
- Keep response optimized for fast generation
- Generate realistic project-specific folder structures
- Include useful folders, config files, and architecture directories
- Use professional academic language
- priority values ONLY: "high", "medium", "low"
- method values ONLY: "GET", "POST", "PUT", "DELETE", "PATCH"
- auth values ONLY: true or false
- Output ONLY valid JSON
`;

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
      max_tokens: 1700,
      temperature: 0.3,
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

  const rawContent = response.data?.choices?.[0]?.message?.content;
  const data = parseAndValidate(rawContent);
  console.log(`✅ Done in ${Date.now() - startTime}ms — "${data.title}"`);
  return data;
}

module.exports = { generateProjectBlueprint };
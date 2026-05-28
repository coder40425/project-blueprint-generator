const axios = require("axios");

// ─── System Prompt ────────────────────────────────────────────
// Designed to produce a proper academic/student report style output
// that can be downloaded as a professional Word document.

const SYSTEM_PROMPT = `
You are a fast professional software architect and academic project advisor.

Generate a professional software project blueprint for university mini-project reports.

Return ONLY ONE valid JSON object.
No markdown.
No explanations.
No code fences.

IMPORTANT:
- Keep text professional but compact.
- Keep every description under 35 words.
- Keep JSON syntactically perfect.
- Never leave trailing commas.
- Never omit closing brackets.
- Do not generate unnecessary text.

JSON FORMAT:

{
  "title": "Formal project title",
  "tagline": "One-line subtitle",

  "description": "Professional academic abstract in 3-5 concise sentences.",

  "category": "Project category",

  "techStack": {
    "frontend": ["technology"],
    "backend": ["technology"],
    "database": ["technology"],
    "devops": ["technology"]
  },

  "features": [
    {
      "name": "Feature name",
      "description": "Implementation-focused feature explanation",
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
          "note": "PK/FK/UNIQUE"
        }
      ]
    }
  ],

  "apis": [
    {
      "method": "GET",
      "path": "/api/example",
      "description": "Endpoint purpose",
      "auth": true
    }
  ],

  "devSteps": [
    {
      "step": 1,
      "title": "Development phase",
      "description": "Implementation summary"
    }
  ],

  "timeline": [
    {
      "phase": "Phase name",
      "duration": "Week range",
      "tasks": ["task1", "task2", "task3"]
    }
  ],

  "folderStructure": "Detailed realistic folder structure"
}

RULES:
- features: 6 items
- apis: 6 endpoints
- devSteps: 5 steps
- timeline: 4 phases
- database: 3 tables
- each table: 5 columns
- Generate realistic folder structures
- Keep folder structure detailed but compact
- Use ONLY valid JSON
- Output ONLY the JSON object
`;

// ─── Parse & Validate ─────────────────────────────────────────
function parseAndValidate(rawContent) {
  if (!rawContent || !rawContent.trim()) throw new Error("Empty response from model");

  let jsonString = rawContent.trim();

  if (jsonString.startsWith("```")) {
    jsonString = jsonString
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
  }

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
      max_tokens: 1600,
      temperature: 0.2,
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
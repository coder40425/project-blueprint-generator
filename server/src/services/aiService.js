const axios = require("axios");

// ─────────────────────────────────────────────────────────────
// PROMPT 1 — Ultra-minimal skeleton
// ─────────────────────────────────────────────────────────────
const SKELETON_PROMPT = `You are a senior software architect.

The user provides a project description with EXACT section names and order.

Return a MINIMAL JSON skeleton — section titles and metadata ONLY.
NO content, NO long strings, NO subsection arrays in this pass.

Return ONLY valid JSON. No markdown. No code fences. Raw JSON only.

STRICT JSON RULES:
- Perfect syntax, no trailing commas
- All strings on one line (no literal newlines)
- Keep every string under 60 characters
- No arrays inside sections except techStack

Output schema (keep it exactly this shape):
{
  "title": "Short formal project title",
  "tagline": "One-line subtitle under 80 chars",
  "category": "Web Application",
  "techStack": {
    "frontend": ["Tech1", "Tech2"],
    "backend": ["Tech1", "Tech2"],
    "database": ["Tech1"],
    "devops": ["Tech1", "Tech2"]
  },
  "coverMeta": {
    "subtitle": "SRS Document",
    "institution": "Department of Computer Science"
  },
  "sections": [
    {
      "id": "s1",
      "number": "1",
      "title": "Introduction",
      "hint": "Purpose, objectives, scope",
      "hasTable": false,
      "hasDiagram": false
    }
  ]
}

RULES:
- sections[] must contain EXACTLY the sections the user listed, same order, same names.
- Each section object has ONLY: id, number, title, hint (1 sentence), hasTable (bool), hasDiagram (bool).
- NO subsections array in the skeleton.
- Set hasTable=true for: tech stack, requirements, DB schema, API docs, test cases, timeline.
- Set hasDiagram=true for: architecture, ER diagram, data flow, system design sections.
- hint must be under 60 characters.

CRITICAL: Output ONLY the JSON object. Keep it SHORT.`;

// ─────────────────────────────────────────────────────────────
// PROMPT 2 — Enrich ONE section
// ─────────────────────────────────────────────────────────────
const ENRICHMENT_PROMPT = `You are a senior software architect writing a professional SRS document.

Expand ONE section into detailed, publication-quality content.

Return ONLY a valid JSON object. No markdown. No code fences.

STRICT JSON RULES:
- Perfect JSON syntax, no trailing commas
- Use \\n for line breaks inside strings — NEVER literal newlines
- Escape backslashes as \\\\ and double quotes as \\"

Output schema:
{
  "id": "same id as input",
  "number": "same number as input",
  "title": "same title as input",
  "content": "200-300 word paragraph if no subsections. Omit if using subsections.",
  "bullets": ["bullet 20-30 words each, up to 6 items"],
  "table": {
    "headers": ["Col A", "Col B", "Col C"],
    "rows": [["r1c1","r1c2","r1c3"]],
    "colPercents": [30, 35, 35]
  },
  "codeBlock": {
    "lines": ["ASCII diagram line 1", "line 2"],
    "caption": "Figure caption"
  },
  "subsections": [
    {
      "id": "s1_1",
      "number": "1.1",
      "title": "Subsection Title",
      "content": "150-200 word professional paragraph.",
      "bullets": ["bullet 1", "bullet 2"],
      "table": { "headers": [], "rows": [], "colPercents": [] },
      "codeBlock": { "lines": [], "caption": "" }
    }
  ]
}

RULES:
1. Subsection content: 150-200 words minimum.
2. Top-level content (no subsections): 200-300 words.
3. Tables: at least 5 data rows.
4. ASCII diagrams: at least 12 lines.
5. Use userSubsections as subsection titles.
6. 100% specific to the actual project — no generic filler.
7. IEEE/SRS technical language.
8. If hasTable=true → always include table.
9. If hasDiagram=true → always include codeBlock.
10. Omit keys you don't use (no nulls, no empty arrays).

CRITICAL: Output ONLY the JSON. Do not truncate.`;

// ─────────────────────────────────────────────────────────────
// Code files prompt
// ─────────────────────────────────────────────────────────────
const CODE_PROMPT = `You are a senior full-stack developer generating starter code files for a university mini-project.

Return ONLY a valid JSON object with key "generatedFiles". No markdown. No code fences.

JSON RULES: perfect syntax, use \\n for newlines in content strings, escape \\\\ and \\".

{
  "generatedFiles": [
    {
      "path": "server/src/models/User.js",
      "language": "JavaScript",
      "type": "Model",
      "purpose": "Brief purpose under 80 chars",
      "content": "full file as single string with \\n"
    }
  ]
}

Generate 8-10 impactful files: entry point, .env.example, DB models, auth middleware, one controller+route pair, README.md.
Code: realistic, runnable, imports, error handling, inline comments, 30-100 lines each.
Output ONLY the JSON.`;

// ─────────────────────────────────────────────────────────────
// JSON repair: truncated JSON often just needs closing brackets
// ─────────────────────────────────────────────────────────────
function repairTruncatedJSON(s) {
  let braces = 0, brackets = 0;
  let inString = false, escape = false;
  for (const ch of s) {
    if (escape)          { escape = false; continue; }
    if (ch === "\\")     { escape = true;  continue; }
    if (ch === '"')      { inString = !inString; continue; }
    if (inString)        continue;
    if (ch === "{")      braces++;
    else if (ch === "}") braces--;
    else if (ch === "[") brackets++;
    else if (ch === "]") brackets--;
  }
  let repaired = s.trimEnd().replace(/,\s*$/, "");
  if (inString) repaired += '"';
  repaired += "]".repeat(Math.max(0, brackets));
  repaired += "}".repeat(Math.max(0, braces));
  return repaired;
}

// ─────────────────────────────────────────────────────────────
// JSON parser with repair fallback
// ─────────────────────────────────────────────────────────────
function parseJSON(rawContent, label = "response") {
  if (!rawContent?.trim()) throw new Error(`Empty ${label} from model`);
  let s = rawContent.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  if (first === -1) throw new Error(`No JSON object found in ${label}`);
  s = last !== -1 ? s.slice(first, last + 1) : s.slice(first);

  try { return JSON.parse(s); } catch (_) {}

  console.warn(`[${label}] JSON truncated — attempting repair...`);
  try {
    const repaired = repairTruncatedJSON(s);
    const parsed = JSON.parse(repaired);
    console.log(`[${label}] Repair succeeded.`);
    return parsed;
  } catch (e) {
    console.error(`[${label}] Repair failed:`, e.message, "\nFirst 400 chars:\n", s.slice(0, 400));
    throw new Error(`${label} is not valid JSON: ${e.message}`);
  }
}

function validateBlueprint(parsed) {
  const required = ["title", "tagline", "category", "techStack", "sections"];
  const missing = required.filter(f => !(f in parsed));
  if (missing.length) throw new Error(`Blueprint missing fields: ${missing.join(", ")}`);
  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0)
    throw new Error("Blueprint must have at least one section");
  return parsed;
}

// ─────────────────────────────────────────────────────────────
// OpenAI helper — uses gpt-4o-mini with stricter timeout
// ─────────────────────────────────────────────────────────────
async function callOpenAI({ systemPrompt, userMessage, maxTokens = 3000, model = "gpt-4o-mini" }) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      max_tokens: maxTokens,
      temperature: 0.3,             // slightly lower = faster & more deterministic
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage   },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 120000,              // reduced from 180 s → 120 s
    }
  );
  return response.data?.choices?.[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────
// Extract subsection hints from the user's raw prompt
// ─────────────────────────────────────────────────────────────
function extractSubsectionHints(userPrompt, sectionTitle, sectionNumber) {
  const lines = userPrompt.split("\n");
  const hints = [];
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isHeading =
      line.toLowerCase().includes(sectionTitle.toLowerCase()) ||
      (sectionNumber && line.includes(`${sectionNumber}.`));
    if (isHeading) { inSection = true; continue; }
    if (inSection && (line.startsWith("#") || /^\d+\./.test(line))) break;
    if (inSection && (line.startsWith("*") || line.startsWith("-") || line.startsWith("•"))) {
      const hint = line.replace(/^[*\-•]\s*/, "").trim();
      if (hint.length > 2) hints.push(hint);
    }
  }

  return hints.slice(0, 6); // cap at 6 to reduce token load
}

// ─────────────────────────────────────────────────────────────
// Detect whether user wants code files
// ─────────────────────────────────────────────────────────────
function wantsCodeFiles(prompt) {
  const lower = prompt.toLowerCase();
  return (
    lower.includes("source file")        ||
    lower.includes("code file")          ||
    lower.includes("generated file")     ||
    lower.includes("starter code")       ||
    lower.includes("implementation file")
  );
}

// ─────────────────────────────────────────────────────────────
// PASS 2 — enrich each section (batches of 6, reduced tokens)
// ─────────────────────────────────────────────────────────────
async function enrichSections(skeleton, userPrompt) {
  const projectCtx = JSON.stringify({
    title:     skeleton.title,
    tagline:   skeleton.tagline,
    category:  skeleton.category,
    techStack: skeleton.techStack,
  });

  // FIX: increased batch size from 4 → 6 for faster parallel processing
  const BATCH_SIZE = 6;
  const sections   = skeleton.sections;
  const enriched   = [];

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    console.log(`  ✏️  Enriching sections ${i + 1}–${Math.min(i + BATCH_SIZE, sections.length)} / ${sections.length}`);

    const batchResults = await Promise.all(
      batch.map(async (section) => {
        const subHints = extractSubsectionHints(userPrompt, section.title, section.number);

        const userMsg =
          `PROJECT: ${projectCtx}\n\n` +
          `EXPAND:\n` +
          `id:${section.id} number:${section.number} title:"${section.title}"\n` +
          `hint:${section.hint || ""}\n` +
          `hasTable:${section.hasTable} hasDiagram:${section.hasDiagram}\n` +
          `subsections:${subHints.length > 0 ? subHints.join(", ") : "infer 2-3 logical subsections"}\n\n` +
          `Write subsections for each item above. Each subsection ≥150 words. ` +
          `100% specific to "${skeleton.title}". IEEE SRS style. Complete JSON only.`;

        try {
          // FIX: reduced from 5000 → 3500 tokens per section (still ample for quality content)
          const raw = await callOpenAI({
            systemPrompt: ENRICHMENT_PROMPT,
            userMessage:  userMsg,
            maxTokens:    3500,
          });
          const parsed = parseJSON(raw, `section-${section.id}`);
          return {
            ...parsed,
            id:     section.id,
            number: section.number,
            title:  section.title,
          };
        } catch (err) {
          console.error(`⚠️  Enrichment failed for "${section.title}":`, err.message);
          return {
            id:      section.id,
            number:  section.number,
            title:   section.title,
            content: section.hint || `${section.title} content could not be generated.`,
          };
        }
      })
    );

    enriched.push(...batchResults);
  }

  return enriched;
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
async function generateProjectBlueprint(userPrompt) {
  const sanitized = userPrompt.trim().slice(0, 5000);
  if (!sanitized) {
    const e = new Error("Prompt empty");
    e.name = "ValidationError";
    throw e;
  }

  console.log(`\n🎯 Generating (${sanitized.length} chars, two-pass)`);
  const t0 = Date.now();

  // ── PASS 1: Skeleton ─────────────────────────────────────
  console.log("📋 Pass 1: Skeleton...");
  const skeletonRaw = await callOpenAI({
    systemPrompt: SKELETON_PROMPT,
    userMessage:
      `Extract the section structure from this project description.\n` +
      `Return ONLY the JSON skeleton — no content, just titles and flags.\n\n` +
      `${sanitized}`,
    maxTokens: 2000, // FIX: skeleton is tiny, was 6000 — wasteful
  });

  const skeleton = validateBlueprint(parseJSON(skeletonRaw, "skeleton"));
  console.log(`✅ Skeleton: "${skeleton.title}" — ${skeleton.sections.length} sections`);

  // ── PASS 2: Enrich sections ──────────────────────────────
  console.log("✏️  Pass 2: Enriching...");
  const enrichedSections = await enrichSections(skeleton, sanitized);
  console.log(`✅ Enriched ${enrichedSections.length} sections in ${Date.now() - t0}ms`);

  const blueprint = { ...skeleton, sections: enrichedSections };

  // ── PASS 3 (optional): Code files ───────────────────────
  let generatedFiles = [];
  if (wantsCodeFiles(sanitized)) {
    console.log("💻 Pass 3: Code files...");
    const t1 = Date.now();
    try {
      const codeRaw = await callOpenAI({
        systemPrompt: CODE_PROMPT,
        userMessage:
          `User request: "${sanitized.slice(0, 400)}"\n\n` +
          `Generate starter files for:\n${JSON.stringify({
            title:     blueprint.title,
            category:  blueprint.category,
            techStack: blueprint.techStack,
          }, null, 2)}`,
        maxTokens: 5000,
      });
      const codeResult = parseJSON(codeRaw, "code files");
      if (Array.isArray(codeResult.generatedFiles)) {
        generatedFiles = codeResult.generatedFiles;
        console.log(`✅ Code files: ${generatedFiles.length} in ${Date.now() - t1}ms`);
      }
    } catch (err) {
      console.error("⚠️  Code generation failed (non-fatal):", err.message);
    }
  }

  return { ...blueprint, generatedFiles };
}

module.exports = { generateProjectBlueprint };
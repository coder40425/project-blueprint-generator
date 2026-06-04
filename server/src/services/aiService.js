const axios = require("axios");

// ─────────────────────────────────────────────────────────────
// PROMPT 1 — Ultra-minimal skeleton (titles + flags ONLY)
// Goal: stay well under 4000 tokens even for 20-section docs
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
- NO subsections array in the skeleton — subsections are inferred during enrichment.
- Set hasTable=true for: tech stack, requirements, DB schema, API docs, test cases, timeline.
- Set hasDiagram=true for: architecture, ER diagram, data flow, system design sections.
- hint must be under 60 characters.

CRITICAL: Output ONLY the JSON object. Keep it SHORT.`;

// ─────────────────────────────────────────────────────────────
// PROMPT 2 — Enrich ONE section with full detail
// ─────────────────────────────────────────────────────────────
const ENRICHMENT_PROMPT = `You are a senior software architect writing a professional SRS and technical design document.

You will expand ONE document section into rich, detailed, publication-quality content.

Return ONLY a valid JSON object for this single section. No markdown. No code fences.

STRICT JSON RULES:
- Perfect JSON syntax, no trailing commas
- Use \\n for line breaks inside strings — NEVER literal newlines
- Escape all backslashes as \\\\ and double quotes as \\"
- Keep each string value on one logical line

Output schema:
{
  "id": "same id as input",
  "number": "same number as input",
  "title": "same title as input",
  "content": "Optional: 200-350 word paragraph if no subsections. Omit if using subsections.",
  "bullets": ["optional bullets, 20-30 words each, up to 8 items"],
  "table": {
    "headers": ["Column A", "Column B", "Column C"],
    "rows": [
      ["row1col1", "row1col2", "row1col3"],
      ["row2col1", "row2col2", "row2col3"]
    ],
    "colPercents": [30, 35, 35]
  },
  "codeBlock": {
    "lines": ["  ASCII diagram line 1", "  line 2"],
    "caption": "Figure caption"
  },
  "subsections": [
    {
      "id": "s1_1",
      "number": "1.1",
      "title": "Subsection Title",
      "content": "150-250 word professional paragraph. Specific, technical, no placeholders.",
      "bullets": ["bullet 1 — detailed 20-30 words", "bullet 2"],
      "table": { "headers": [...], "rows": [[...]], "colPercents": [...] },
      "codeBlock": { "lines": [...], "caption": "..." }
    }
  ]
}

CONTENT RULES:
1. Each subsection.content: minimum 150-250 words of detailed technical prose.
2. Sections without subsections: minimum 200-350 words in content field.
3. Tables must have AT LEAST 6 data rows (not counting header).
4. ASCII diagrams must have AT LEAST 15 lines.
5. Write subsections based on the "userSubsections" hint provided — those are the required subsection names.
6. Be 100% specific to the actual project — ZERO generic filler.
7. Use professional SRS / IEEE-style technical language.
8. Always write the prose paragraph FIRST, then add bullets as supplements.
9. If hasTable=true → always generate the table object.
10. If hasDiagram=true → always generate the codeBlock object.
11. Do NOT truncate or summarise — write the complete section.
12. Omit keys you don't use (no null values, no empty arrays).

CRITICAL: Output ONLY the JSON object. Complete it fully — do not stop mid-object.`;

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
  // Count unclosed brackets/braces
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
  // Remove trailing incomplete token (comma, colon, partial string)
  let repaired = s.trimEnd();
  // Strip trailing comma before we close
  repaired = repaired.replace(/,\s*$/, "");
  // Close any open string
  if (inString) repaired += '"';
  // Close open arrays/objects
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
  // Strip accidental markdown fences
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  const first = s.indexOf("{");
  const last  = s.lastIndexOf("}");
  if (first === -1) throw new Error(`No JSON object found in ${label}`);
  // Use last "}" if present, else repair
  s = last !== -1 ? s.slice(first, last + 1) : s.slice(first);

  // First attempt: direct parse
  try { return JSON.parse(s); } catch (_) {}

  // Second attempt: repair truncation
  console.warn(`[${label}] JSON truncated — attempting repair...`);
  try {
    const repaired = repairTruncatedJSON(s);
    const parsed = JSON.parse(repaired);
    console.log(`[${label}] Repair succeeded.`);
    return parsed;
  } catch (e) {
    console.error(`[${label}] Repair also failed:`, e.message, "\nFirst 400 chars:\n", s.slice(0, 400));
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
// OpenAI helper
// ─────────────────────────────────────────────────────────────
async function callOpenAI({ systemPrompt, userMessage, maxTokens = 4000, model = "gpt-4o-mini" }) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model,
      max_tokens: maxTokens,
      temperature: 0.35,
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
      timeout: 180000,
    }
  );
  return response.data?.choices?.[0]?.message?.content ?? "";
}

// ─────────────────────────────────────────────────────────────
// Extract subsection hints from the user's raw prompt text
// e.g. "### 3. Introduction\nExplain:\n* Purpose\n* Objectives"
// → ["Purpose", "Objectives"]
// ─────────────────────────────────────────────────────────────
function extractSubsectionHints(userPrompt, sectionTitle, sectionNumber) {
  const lines = userPrompt.split("\n");
  const hints = [];
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Detect this section heading
    const isHeading =
      line.toLowerCase().includes(sectionTitle.toLowerCase()) ||
      (sectionNumber && line.includes(`${sectionNumber}.`));
    if (isHeading) { inSection = true; continue; }
    // Stop at next section heading (### or numbered)
    if (inSection && (line.startsWith("#") || /^\d+\./.test(line))) break;
    // Collect bullet/list items as subsection hints
    if (inSection && (line.startsWith("*") || line.startsWith("-") || line.startsWith("•"))) {
      const hint = line.replace(/^[*\-•]\s*/, "").trim();
      if (hint.length > 2) hints.push(hint);
    }
  }

  return hints.slice(0, 8); // cap at 8 subsections
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
// PASS 2 — enrich each section with full detail (1 call each,
// parallelised in batches of 4)
// ─────────────────────────────────────────────────────────────
async function enrichSections(skeleton, userPrompt) {
  const projectCtx = JSON.stringify({
    title:     skeleton.title,
    tagline:   skeleton.tagline,
    category:  skeleton.category,
    techStack: skeleton.techStack,
  });

  const BATCH_SIZE = 4;
  const sections   = skeleton.sections;
  const enriched   = [];

  for (let i = 0; i < sections.length; i += BATCH_SIZE) {
    const batch = sections.slice(i, i + BATCH_SIZE);
    console.log(`  ✏️  Enriching sections ${i + 1}–${Math.min(i + BATCH_SIZE, sections.length)} / ${sections.length}`);

    const batchResults = await Promise.all(
      batch.map(async (section) => {
        // Extract subsection names from user's prompt for this section
        const subHints = extractSubsectionHints(userPrompt, section.title, section.number);

        const userMsg =
          `PROJECT CONTEXT:\n${projectCtx}\n\n` +
          `SECTION TO EXPAND:\n` +
          `- id: ${section.id}\n` +
          `- number: ${section.number}\n` +
          `- title: ${section.title}\n` +
          `- hint: ${section.hint || ""}\n` +
          `- hasTable: ${section.hasTable}\n` +
          `- hasDiagram: ${section.hasDiagram}\n` +
          `- userSubsections: ${subHints.length > 0 ? subHints.join(", ") : "infer 2-4 logical subsections"}\n\n` +
          `MANDATORY REQUIREMENTS:\n` +
          `- Write subsections for each item in userSubsections (use them as subsection titles).\n` +
          `- Each subsection.content: 150-250 words minimum of detailed technical prose.\n` +
          `- If hasTable=true: generate table with 6+ data rows.\n` +
          `- If hasDiagram=true: generate 15+ line ASCII diagram in codeBlock.\n` +
          `- 100% specific to "${skeleton.title}" — no generic text.\n` +
          `- Professional SRS / IEEE documentation style.\n` +
          `- Complete the full JSON — do not truncate.`;

        try {
          const raw = await callOpenAI({
            systemPrompt: ENRICHMENT_PROMPT,
            userMessage:  userMsg,
            maxTokens:    5000,
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

  // ── PASS 1: Ultra-minimal skeleton ──────────────────────────
  console.log("📋 Pass 1: Skeleton...");
  const skeletonRaw = await callOpenAI({
    systemPrompt: SKELETON_PROMPT,
    userMessage:
      `Extract the section structure from this project description.\n` +
      `Return ONLY the JSON skeleton — no content, just titles and flags.\n\n` +
      `${sanitized}`,
    maxTokens: 6000, // skeleton is tiny per-section, high limit as safety net
  });

  const skeleton = validateBlueprint(parseJSON(skeletonRaw, "skeleton"));
  console.log(`✅ Skeleton: "${skeleton.title}" — ${skeleton.sections.length} sections`);

  // ── PASS 2: Enrich sections in parallel batches ──────────────
  console.log("✏️  Pass 2: Enriching...");
  const enrichedSections = await enrichSections(skeleton, sanitized);
  console.log(`✅ Enriched ${enrichedSections.length} sections in ${Date.now() - t0}ms`);

  const blueprint = { ...skeleton, sections: enrichedSections };

  // ── PASS 3 (optional): Code files ────────────────────────────
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
        maxTokens: 6000,
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
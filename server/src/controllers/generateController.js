const { generateProjectBlueprint } = require("../services/aiService");
const { buildProjectDocx } = require("../services/docxGenerator");

// ─── POST /api/generate ───────────────────────────────────────
async function generateProject(req, res, next) {
  try {
    const { prompt } = req.body;

    if (!prompt)
      return res.status(400).json({ success: false, error: "prompt is required" });
    if (typeof prompt !== "string")
      return res.status(400).json({ success: false, error: "prompt must be a string" });

    const trimmed = prompt.trim();

    if (trimmed.length < 10)
      return res.status(400).json({ success: false, error: "Prompt too short. Please provide a detailed description including section names." });
    if (trimmed.length > 5000)
      return res.status(400).json({ success: false, error: "Prompt too long (max 5000 chars)." });

    const projectData = await generateProjectBlueprint(trimmed);

    res.status(200).json({
      success: true,
      data: projectData,
      meta: {
        prompt:       trimmed,
        generatedAt:  new Date().toISOString(),
        model:        "gpt-4o-mini",
        sectionCount: projectData.sections?.length ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/generate/docx ──────────────────────────────────
async function downloadDocx(req, res, next) {
  try {
    const data = req.body;

    // FIX: Validate that body was actually parsed (catches body-size limit rejections)
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({ success: false, error: "Invalid request body. Expected a JSON object." });
    }

    if (!data.title)
      return res.status(400).json({ success: false, error: "ProjectData with title required in request body" });

    if (!Array.isArray(data.sections) || data.sections.length === 0)
      return res.status(400).json({ success: false, error: "ProjectData must contain a non-empty sections array" });

    // FIX: Sanitize sections — guard against null/undefined entries crashing docxGenerator
    data.sections = data.sections
      .filter(s => s && typeof s === "object")
      .map(s => ({
        ...s,
        subsections: Array.isArray(s.subsections)
          ? s.subsections.filter(sub => sub && typeof sub === "object")
          : [],
      }));

    // FIX: Sanitize generatedFiles the same way
    if (data.generatedFiles && !Array.isArray(data.generatedFiles)) {
      data.generatedFiles = [];
    }

    const buffer = await buildProjectDocx(data);

    const safeTitle = (data.title || "project")
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .slice(0, 50);
    const filename = `${safeTitle}_report.docx`;

    // FIX: Add CORS header explicitly so the browser doesn't block the blob download
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    // FIX: Use res.end() instead of res.send() for binary buffers —
    // res.send() with a Buffer is fine in Express but res.end() is more explicit
    // and avoids any potential double-encoding issue.
    res.end(buffer);
  } catch (err) {
    console.error("DOCX generation error:", err);
    // FIX: If headers not yet sent, return a JSON error so frontend can display it
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: "Failed to generate document: " + err.message });
    }
    next(err);
  }
}

module.exports = { generateProject, downloadDocx };
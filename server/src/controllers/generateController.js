const { generateProjectBlueprint } = require("../services/aiService");
const { buildProjectDocx } = require("../services/docxGenerator");

// ─── POST /api/generate ───────────────────────────────────────
async function generateProject(req, res, next) {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: "prompt is required" });
    if (typeof prompt !== "string") return res.status(400).json({ success: false, error: "prompt must be a string" });
    const trimmed = prompt.trim();
    if (trimmed.length < 3) return res.status(400).json({ success: false, error: "Prompt too short." });
    if (trimmed.length > 300) return res.status(400).json({ success: false, error: "Prompt too long (max 300 chars)." });

    const projectData = await generateProjectBlueprint(trimmed);
    res.status(200).json({
      success: true,
      data: projectData,
      meta: { prompt: trimmed, generatedAt: new Date().toISOString(), model: "gpt-4o-mini" },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/generate/docx ──────────────────────────────────
// Accepts full ProjectData in body, returns .docx file download
async function downloadDocx(req, res, next) {
  try {
    const data = req.body;
    if (!data || !data.title) {
      return res.status(400).json({ success: false, error: "ProjectData required in request body" });
    }

    const buffer = await buildProjectDocx(data);
    const safeTitle = data.title.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 50);
    const filename = `${safeTitle}_blueprint.docx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { generateProject, downloadDocx };
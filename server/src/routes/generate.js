const express = require("express");
const router = express.Router();
const { generateProject, downloadDocx } = require("../controllers/generateController");
const { generateLimiter } = require("../middleware/rateLimiter");

// POST /api/generate — generate blueprint JSON
router.post("/", generateLimiter, generateProject);

// POST /api/generate/docx — convert ProjectData to .docx download
// Higher limit since it's just doc conversion, no AI call
router.post("/docx", downloadDocx);

module.exports = router;
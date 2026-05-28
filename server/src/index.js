require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const generateRoutes = require("./routes/generate");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security & Parsing ──────────────────────────────────────
app.use(helmet());
app.use(cors());

app.use(express.json({ limit: "10kb" }));

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/generate", generateRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Mini Project Generator API is running",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`OpenRouter key: ${process.env.OPENAI_API_KEY ? "loaded ✓" : "MISSING ✗"}`);
});
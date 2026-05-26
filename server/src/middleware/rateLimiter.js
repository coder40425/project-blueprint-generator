const rateLimit = require("express-rate-limit");

// ─── Generate Endpoint Limiter ────────────────────────────────
// Max 10 AI generations per IP per 15 minutes
// Prevents API key abuse / runaway billing
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. You can generate up to 10 blueprints per 15 minutes. Please try again later.",
  },
  // Skip rate limiting in development if needed
  skip: () => process.env.NODE_ENV === "development" && process.env.DISABLE_RATE_LIMIT === "true",
});

module.exports = { generateLimiter };
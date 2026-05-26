// ─── Global Error Handler ─────────────────────────────────────
// Catches anything thrown from controllers/services
// Keeps error responses consistent across the whole API

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);

  // OpenRouter / Axios errors
  if (err.isAxiosError) {
    const status = err.response?.status || 502;
    const detail = err.response?.data?.error?.message || err.message;

    if (status === 401) {
      return res.status(401).json({
        success: false,
        error: "Invalid OpenRouter API key. Please check your .env file.",
      });
    }
    if (status === 429) {
      return res.status(429).json({
        success: false,
        error: "OpenRouter rate limit reached. Please wait a moment and try again.",
      });
    }
    if (status === 402) {
      return res.status(402).json({
        success: false,
        error: "OpenRouter credits exhausted. Please top up your account.",
      });
    }

    return res.status(status).json({
      success: false,
      error: `AI API error: ${detail}`,
    });
  }

  // JSON parse errors (malformed AI response)
  if (err.name === "JSONParseError") {
    return res.status(422).json({
      success: false,
      error: "AI returned unexpected output. Please try again or rephrase your prompt.",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Generic fallback
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Something went wrong on our end. Please try again.",
  });
};

module.exports = errorHandler;
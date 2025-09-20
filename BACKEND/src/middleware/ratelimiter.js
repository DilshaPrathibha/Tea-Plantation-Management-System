const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");
require("dotenv").config();

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Initialize Rate Limiter
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 requests per 60 seconds
  analytics: true,
  prefix: "rate-limit",
});

// Middleware function
const applyRateLimit = async (req, res, next) => {
  try {
    const identifier = req.ip || "anonymous";
    const result = await ratelimit.limit(identifier);

    if (!result.success) {
      return res.status(429).json({
        message: "Too many requests, please slow down.",
      });
    }

    next();
  } catch (err) {
    console.error("Rate limiter failed:", err);
    next(); // allow if limiter fails
  }
};

module.exports = applyRateLimit;

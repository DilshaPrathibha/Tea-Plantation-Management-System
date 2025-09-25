// BACKEND/src/middleware/ratelimiter.js
const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");
require("dotenv").config();

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 requests per minute
  analytics: true,
  prefix: "rate-limit",
});

const applyRateLimit = async (req, res, next) => {
  try {
    // Whitelist hot read endpoints used by the UI
    if (
      req.path === "/health" ||
      req.path === "/api/fields" ||
      req.path.startsWith("/api/tasks")
    ) {
      return next();
    }

    const identifier = req.ip || "anonymous";
    const result = await ratelimit.limit(identifier);

    if (!result.success) {
      return res.status(429).json({ message: "Too many requests, please slow down." });
    }
    next();
  } catch (err) {
    console.error("Rate limiter failed:", err);
    next(); // fail open
  }
};

module.exports = applyRateLimit;

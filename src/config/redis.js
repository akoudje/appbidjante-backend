// src/config/redis.js
import Redis from "ioredis";

const IS_DEV = process.env.NODE_ENV !== "production";

let redis;

if (IS_DEV) {
  // Mode développement → pas besoin de Redis installé
  console.log("⚠ Redis mock mode enabled (development only)");

  redis = {
    get: async () => null,
    setex: async () => {},
    exists: async () => false,
    del: async () => {},
    on: () => {},
  };
} else {
  // Production → vrai Redis
  redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  redis.on("connect", () => {
    console.log("🚀 Redis connected successfully");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });
}

export { redis };

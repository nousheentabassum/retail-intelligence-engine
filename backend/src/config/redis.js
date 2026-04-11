import { createClient } from "redis";
import { env } from "./env.js";

export const redisClient = createClient({
  socket: {
    host: env.redis.host,
    port: env.redis.port
  }
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export async function initRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}


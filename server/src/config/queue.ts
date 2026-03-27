import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redisConnection = new IORedis.default(redisUrl, {
  maxRetriesPerRequest: null,
});

export const documentProcessQueue = new Queue("document-process", {
  connection: redisConnection,
});

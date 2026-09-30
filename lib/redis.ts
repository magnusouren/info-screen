import { Redis } from "@upstash/redis";

// Vercel's Upstash marketplace integration injects UPSTASH_REDIS_REST_* env
// vars (older setups may still use the KV_REST_API_* names).
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

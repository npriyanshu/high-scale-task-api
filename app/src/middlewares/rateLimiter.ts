import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis"

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100000; // Increased for high-scale testing

// Lua script for atomic increment and expire
const LUA_LIMITER = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return current
`;

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    try {
        const identifier = (req as any).user?.id ?? req.ip;
        const key = `rate:${identifier}`;

        // Atomic operation reduces network round-trips and prevents race conditions
        const current = await redis.eval(LUA_LIMITER, 1, key, WINDOW_SECONDS) as number;

        if (current > MAX_REQUESTS) {
            return res.status(429).json({
                error: "Too many requests",
                limit: MAX_REQUESTS,
                current,
                ttl: await redis.ttl(key)
            });
        }

        next();
    } catch (error) {
        console.error("Rate Limiter Error:", error);
        // Fail open: allow traffic if Redis is down
        next();
    }
}

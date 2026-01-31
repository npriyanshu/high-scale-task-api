import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on('connect', () => {
    console.log("Connected to Redis");
})
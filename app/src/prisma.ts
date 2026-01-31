import dotenv from "dotenv";
dotenv.config();

import pg from 'pg';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const { Pool } = pg;

/**
 * PostgreSQL connection pool
 * - Explicit pool control
 * - Safe for Kafka consumers & workers
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                     // demo-safe, predictable
  connectionTimeoutMillis: 10_000,
});

/**
 * Prisma adapter using pg pool
 */
const adapter = new PrismaPg(pool);

/**
 * Prisma Client (singleton)
 */
export const prisma = new PrismaClient({
  adapter,
});

/**
 * Optional: graceful shutdown (good habit)
 */
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
});

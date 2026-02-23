import cluster from "cluster";
import os from "os";
import "dotenv/config";
import express from "express";
import taskRoutes from "./modules/task/task.routes";
import healthRoutes from "./routes/health";

import { kafkaProducer, initKafka } from "./kafka";
import { shutdown } from "./utils/shutdown";
import { Server } from "http";
import { prisma } from "./prisma";
import { redis } from "./config/redis";

import authRoutes from "./modules/auth/auth.routes";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// --- SHARED APP LOGIC ---
const app = express();
app.use(express.json());

app.use("/tasks", taskRoutes);
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

let server: Server;

/**
 * Cleanup function for workers to close all infrastructure connections
 */
async function gracefullExit() {
  console.log(`\n[Worker ${process.pid}] Starting graceful exit...`);

  if (server) {
    await shutdown("Express Server", async () => {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  // Close infrastructure connections
  try {
    await shutdown("Kafka Producer", () => kafkaProducer.disconnect());
    await shutdown("Prisma", () => prisma.$disconnect());
    await shutdown("Redis", async () => {
      // Use quit() for a clean close, disconnect() as fallback
      await redis.quit().catch(() => redis.disconnect());
    });
  } catch (err) {
    console.error(`[Worker ${process.pid}] Error during shutdown:`, err);
  }

  console.log(`[Worker ${process.pid}] Shutdown complete.`);
  process.exit(0);
}

// --- CLUSTER LOGIC ---
if (cluster.isPrimary) {
  // Respect WEB_CONCURRENCY env var (common in Docker/Heroku) or fallback to CPU count
  const numCPUs = process.env.WEB_CONCURRENCY 
    ? parseInt(process.env.WEB_CONCURRENCY) 
    : os.cpus().length;

  console.log(`[Primary ${process.pid}] Master process starting...`);
  console.log(`[Primary ${process.pid}] Forking ${numCPUs} worker processes...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker crashes
  cluster.on("exit", (worker, code, signal) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.error(`[Primary] Worker ${worker.process.pid} crashed (code: ${code}, signal: ${signal}). Forking replacement...`);
      cluster.fork();
    }
  });

  // Forward signals to workers for graceful exit
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`[Primary] Received ${signal}. Signaling workers...`);
      for (const id in cluster.workers) {
        cluster.workers[id]?.kill(signal);
      }
    });
  });

} else {
  // --- WORKER LOGIC ---
  async function start() {
    console.log(`[Worker ${process.pid}] Initializing resources...`);

    // 1. Initialize and Connect Kafka
    await initKafka();
    await kafkaProducer.connect();
    
    // 2. Start Express Server
    server = app.listen(PORT, () => {
      console.log(`🚀 [Worker ${process.pid}] HTTP Server ready on http://localhost:${PORT}`);
    });

    // Handle signals at worker level
    process.on("SIGINT", gracefullExit);
    process.on("SIGTERM", gracefullExit);

    // Safety: Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error(`[Worker ${process.pid}] Unhandled Rejection at:`, promise, "reason:", reason);
      gracefullExit();
    });
  }

  start().catch((err) => {
    console.error(`[Worker ${process.pid}] Critical failure during startup:`, err);
    process.exit(1);
  });
}
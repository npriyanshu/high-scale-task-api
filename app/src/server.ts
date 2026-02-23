import cluster from "node:cluster";
import os from "node:os";
import "dotenv/config";
import express from "express";
import taskRoutes from "./modules/task/task.routes";
import healthRoutes from "./routes/health";
import authRoutes from "./modules/auth/auth.routes";

import { kafkaProducer, initKafka } from "./kafka";
import { shutdown } from "./utils/shutdown";
import { Server } from "http";
import { prisma } from "./prisma";
import { redis } from "./config/redis";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// --- SHARED APP LOGIC ---
const app = express();
app.use(express.json());

// Disable X-Powered-By header to save a few bytes per request
app.disable('x-powered-by');

app.use("/tasks", taskRoutes);
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

let server: Server;

async function gracefullExit() {
  if (server) {
    server.close();
  }
  try {
    // Attempt clean disconnects but don't hang if they fail
    await Promise.allSettled([
      kafkaProducer.disconnect(),
      prisma.$disconnect(),
      redis.quit()
    ]);
  } finally {
    process.exit(0);
  }
}

// --- CLUSTER LOGIC ---
if (cluster.isPrimary) {
  // On a 2-core VM, 2 workers is usually best. 
  // If your VM is shared, sometimes 4 workers can help hide I/O wait.
  const numCPUs = process.env.WEB_CONCURRENCY
    ? parseInt(process.env.WEB_CONCURRENCY)
    : os.cpus().length;

  console.log(`[Primary] Spinning up ${numCPUs} workers for 10k connection stress test...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`[Primary] Worker ${worker.process.pid} died. Respawning...`);
    cluster.fork();
  });

} else {
  // --- WORKER LOGIC ---
  async function start() {
    // OPTIMIZATION: Connect to infra IN PARALLEL before starting the server
    await Promise.all([
      initKafka(),
      kafkaProducer.connect(),
      prisma.$connect(),
      redis.ping() // Ensure redis is alive
    ]);

    server = app.listen(PORT, "0.0.0.0", 10000, () => {
      // Keep console logs minimal during load tests to avoid blocking the event loop
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🚀 Worker ${process.pid} ready.`);
      }
    });

    // Set server timeout higher to handle the massive queue
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    process.on("SIGINT", gracefullExit);
    process.on("SIGTERM", gracefullExit);
  }

  start().catch(() => process.exit(1));
}
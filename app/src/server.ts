import "dotenv/config";
import express from "express";
import taskRoutes from "./modules/task/task.routes";
import healthRoutes from "./routes/health";

import { kafkaProducer } from "./kafka";
import { shutdown } from "./utils/shutdown";
import { Server } from "http";
import { prisma } from "./prisma";
import { redis } from "./config/redis";

import authRoutes from "./modules/auth/auth.routes";



const app = express();
let server: Server;
async function gracefullExit() {
  console.log("\nReceived shutdown signal. Starting graceful exit...");

  if (server) {
    await shutdown("Express Server", async () => {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err)
          resolve()
        })
      })
    })
  }

  await shutdown("Kafka Producer", () => kafkaProducer.disconnect())

  await shutdown("Prisma", () => prisma.$disconnect())

  await shutdown("Redis", async () => {
    await redis.quit();
  })

  console.log("Graceful exit completed. Exiting process.");
  process.exit(0);
}

app.use(express.json());

app.use("/tasks", taskRoutes);
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);



async function start() {
  await kafkaProducer.connect();
  console.log("Kafka Producer connected");
  server = app.listen(3000, () => {
    console.log(`🚀 Server running on http://localhost:${3000}`);
  });

}
process.on("SIGINT", gracefullExit);
process.on("SIGTERM", gracefullExit);

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
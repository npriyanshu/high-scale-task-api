import { Router } from "express"
import { redis } from "../config/redis"
import { prisma } from "../prisma"
import { getConsumerLag } from "../utils/kafkaLag";


const router = Router();

router.get("/", async (_, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        await redis.ping();
        const lag = await getConsumerLag("task-ingest-group", "task.ingested");
        res.json({
            status: "ok",
            services: {
                api: "up",
                db: "up",
                redis: "up",
                kafkaLag: lag,
            }
        })
    } catch (error) {
        console.error("Health check failed", error);
        res.status(500).json({ error: "Health check failed" })
    }
})

export default router;

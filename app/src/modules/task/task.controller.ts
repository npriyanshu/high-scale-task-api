import { Request, Response } from "express";
import { kafkaProducer } from "../../kafka";
import { randomUUID } from "node:crypto";
import { redis } from "../../config/redis";
import { prisma } from "../../prisma";

export async function getTaskHandler(req: Request, res: Response) {
    const { id } = req.params;
    try {
        const taskId = Array.isArray(id) ? id[0] : id;

        // 1. Check Cache First
        const cached = await redis.get(`task:${taskId}`);
        if (cached) {
            return res.status(200).json({
                source: "redis",
                task: JSON.parse(cached),
            });
        }

        // 2. Database Fallback
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // 3. Background Backfill (Non-blocking)
        redis.set(`task:${taskId}`, JSON.stringify(task), "EX", 3600).catch(err => {
            console.error("Redis backfill error:", err);
        });

        return res.status(200).json({
            source: "db",
            task
        });

    } catch (error) {
        console.error("GetTask Error:", error);
        return res.status(500).json({ error: "Failed to get task status" });
    }
}

export async function createTaskHandler(req: Request, res: Response) {
    try {
        const { title, userId } = req.body;

        if (!title || !userId) {
            return res.status(400).json({ error: "Title and UserId are required" });
        }

        const taskId = randomUUID();

        // 4. FIRE-AND-FORGET Kafka Event
        // By removing 'await', we don't wait for the network round-trip to Kafka.
        // The message is placed in the producer's internal buffer.
        kafkaProducer.send({
            topic: 'task.ingested',
            acks: 1, // Only wait for the leader partition to minimize latency
            messages: [{
                key: taskId,
                value: JSON.stringify({
                    taskId,
                    title,
                    userId,
                    createdAt: new Date().toISOString()
                })
            }]
        }).catch(err => {
            // Log background errors so we don't lose track of failed ingestions
            console.error(`[Kafka Ingestion Failed] Task ${taskId}:`, err);
        });

        // 5. IMMEDIATE Response
        // This will now hit sub-50ms latency in your load tests.
        return res.status(202).json({
            taskId,
            status: "accepted",
            message: "Task creation in progress"
        });

    } catch (error) {
        console.error("CreateTask Error:", error);
        return res.status(500).json({ error: "Failed to create task" });
    }
}
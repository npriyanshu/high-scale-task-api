import { Kafka } from "kafkajs";
import dotenv from 'dotenv';
dotenv.config();
import { redis } from "../config/redis";
import { kafkaProducer } from "../kafka";

import { prisma } from "../prisma";

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'task-ingest-group' });

async function run() {
    // Ensure user with ID 1 exists
    await prisma.user.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: "Load Test User",
            email: "loadtest@example.com",
            password: "$2a$12$Qd.fUecJbp6zcHVj1/gHdObCXp1PA.vvZXSLZVNs2v0.6b5QYjp0G" // 123456 password hash
        }
    });
    console.log("✅ User with ID 1 ensured to exist");

    await consumer.connect();
    await kafkaProducer.connect();
    console.log("Task Ingest Consumer connected");
    await consumer.subscribe({
        topic: "task.ingested",
        fromBeginning: true
    });

    console.log("Task Ingest Consumer subscribed to topic task.ingested");

    await consumer.run({
        partitionsConsumedConcurrently: 3,
        eachBatchAutoResolve: false,
        eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, isRunning, isStale }) => {

            if (!isRunning() || isStale()) return;

            const records = [];

            for (const message of batch.messages) {
                try {
                    const event = JSON.parse(message.value!.toString())
                    records.push({
                        id: event.taskId,
                        title: event.title,
                        userId: event.userId
                    });
                    resolveOffset(message.offset);
                } catch (error) {
                    console.error("Error processing message:", error);
                }
            }

            if (records.length === 0) return;

            // Bulk insert tasks into DB
            try {
                const result = await prisma.task.createMany({
                    data: records,
                    skipDuplicates: true
                });

                console.log(
                    `✅ Persisted ${result.count}/${records.length} tasks (partition ${batch.partition})`
                );

                for (const task of records) {
                    await redis.set(`task:${task.id}`, JSON.stringify({
                        id: task.id,
                        title: task.title,
                        userId: task.userId,
                        status: "created",
                    }), "EX", 3600); // 1 hour expiration
                }

                await kafkaProducer.send({
                    topic: "task.created",
                    messages: records.map(task => ({
                        key: task.id,
                        value: JSON.stringify({
                            id: task.id,
                            title: task.title,
                            userId: task.userId,
                            createdAt: new Date().toISOString(),
                        }),
                    })),
                });

                console.log("📢 task.created events emitted:", records.length);


                await commitOffsetsIfNecessary();
                await heartbeat();
            } catch (error) {
                console.error("Error creating tasks:", error);
            }

        }
    });
}

run().catch(console.error);

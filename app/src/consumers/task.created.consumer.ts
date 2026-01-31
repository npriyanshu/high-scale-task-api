import { Kafka } from "kafkajs";
import dotenv from 'dotenv';
dotenv.config();
import { getRabbitChannel } from "../config/rabbitmq";

const kafka = new Kafka({
  clientId: "task-created-consumer",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "task-created-group",
});

async function start() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "task.created",
    fromBeginning: false,
  });

  console.log("👂 Listening to task.created");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const event = JSON.parse(message.value.toString());

      const channel = await getRabbitChannel();

      await channel.sendToQueue("task.notifications",
        Buffer.from(
          JSON.stringify({
            taskId: event.id,
            userId: event.userId,
            title: event.title,
            status: "created",
            createdAt: new Date().toISOString(),
          })
        ),
        {
          persistent: true
        }
      );

      console.log("📨 Notification job queued for task:", event.id);
    },
  });
}

start().catch(console.error);

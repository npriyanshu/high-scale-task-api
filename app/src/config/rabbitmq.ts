import amqp from "amqplib";

let channel: amqp.Channel | null = null;

export async function getRabbitChannel() {
    if (channel) return channel;

    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");

    channel = await connection.createChannel();

    // DLQ (Dead Letter Queue)
    await channel.assertQueue("task.notifications.dlq", {
        durable: true,
    })


    // Main Queue
    await channel.assertQueue("task.notifications", {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": "task.notifications.dlq",
        }
    })

    console.log("Connected to RabbitMQ and queue is ready");

    return channel;
}
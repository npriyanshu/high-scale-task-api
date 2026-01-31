import amqp from "amqplib"
import dotenv from 'dotenv';
dotenv.config();

async function start() {

    const connection = await amqp.connect(process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672");

    const channel = await connection.createChannel();

    await channel.assertQueue("task.notifications", {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": "task.notifications.dlq",
        }
    })

    console.log("👷 Notification worker listening...")

    channel.consume("task.notifications", async (msg) => {
        if (!msg) return;

        const job = JSON.parse(msg.content.toString());

        const retries = msg.properties.headers?.['x-retries'] || 0;

        try {
            console.log("📧 Sending email for task:", job.taskId);

            // simulate random failure

            if (Math.random() < 0.3) {
                throw new Error("Failed to send email");
            }

            await new Promise((r) => setTimeout(r, 500));

            console.log("📧 Email sent for task:", job.taskId);

            channel.ack(msg);

        } catch (error) {

            if (retries >= 3) {
                console.log("📧 Failed to send email for task: moving to dlq", job.taskId);
                channel.reject(msg, false);
                return;
            }

            console.log(`Retry ${retries + 1} for task: ${job.taskId}`);

            channel.sendToQueue("task.notifications", Buffer.from(JSON.stringify(job)), {
                persistent: true,
                headers: {
                    "x-retries": retries + 1
                }
            })

            channel.ack(msg)
        }

    })

    process.on("SIGTERM", async () => {
        console.log("🛑 Shutting down RabbitMQ worker...");
        await channel.close();
        await connection.close();
        process.exit(0);
    });
}

start().catch(console.error);

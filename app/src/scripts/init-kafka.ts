import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "admin-init",
    brokers: ["localhost:9092"],
});

const admin = kafka.admin();

async function run() {
    console.log("Connecting to Kafka Admin...");
    await admin.connect();
    console.log("Connected.");

    const topics = ["task.ingested", "task.created"];
    const topicPartitions = topics.map(t => ({ topic: t, count: 3 }));

    console.log("Creating partitions...");
    try {
        await admin.createPartitions({
            topicPartitions: topicPartitions
        });
        console.log("✅ Successfully increased partitions to 3 for:", topics.join(", "));
    } catch (e: any) {
        if (e.message?.includes('Topic already has')) {
            console.log("ℹ️  Partitions already created/sufficient.");
        } else {
            console.error("❌ Error creating partitions:", e);
        }
    }

    await admin.disconnect();
}

run().catch(console.error);

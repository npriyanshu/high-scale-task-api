import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "checker",
    brokers: ["localhost:9092"],
});

const admin = kafka.admin();

async function run() {
    console.log("Connecting to Kafka Admin...");
    await admin.connect();
    console.log("Connected.");

    console.log("Fetching topic list...");
    const topics = await admin.listTopics();
    console.log("Topics found:", topics);

    const targetTopics = ["task.ingested", "task.created"];
    console.log(`Fetching metadata for: ${targetTopics.join(", ")}`);

    const metadata = await admin.fetchTopicMetadata({ topics: targetTopics });

    for (const topic of metadata.topics) {
        console.log(`\nTopic: ${topic.name}`);
        console.log(`  Partition Count: ${topic.partitions.length}`);
        for (const p of topic.partitions) {
            console.log(`    - Partition ID: ${p.partitionId} (Leader: ${p.leader})`);
        }
    }

    await admin.disconnect();
}

run().catch(console.error);

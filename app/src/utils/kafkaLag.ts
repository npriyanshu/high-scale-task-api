import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: "kafka-lag-checker",
    brokers: ["localhost:9092"]
})

export async function getConsumerLag(
    groupId: string,
    topic: string
) {

    const admin = kafka.admin();

    await admin.connect();

    const offset = await admin.fetchTopicOffsets(topic);

    const groupOffsets = await admin.fetchOffsets({ groupId, topics: [topic] })

    await admin.disconnect();

    return offset.map((o) => {
        const topicGroup = groupOffsets.find(g => g.topic === topic);
        const partition = topicGroup?.partitions.find(p => p.partition === o.partition);
        const commited = partition?.offset;

        return {
            partition: o.partition,
            lag: commited === "-1" ? Number(o.high) : Number(o.high) - Number(commited),
        }
    })

}
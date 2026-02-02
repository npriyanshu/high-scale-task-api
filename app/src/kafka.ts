import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
})

export const kafkaProducer = kafka.producer();
export const kafkaAdmin = kafka.admin();

export async function initKafka() {
    try {
        await kafkaAdmin.connect();
        const topics = await kafkaAdmin.listTopics();
        const topicsToCreate = [];

        if (!topics.includes('task.ingested')) {
            topicsToCreate.push({
                topic: 'task.ingested',
                numPartitions: 3,
                replicationFactor: 1
            });
        }

        if (!topics.includes('task.created')) {
            topicsToCreate.push({
                topic: 'task.created',
                numPartitions: 3,
                replicationFactor: 1
            });
        }

        if (topicsToCreate.length > 0) {
            await kafkaAdmin.createTopics({
                topics: topicsToCreate,
            });
            console.log(`Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
        } else {
            console.log('Kafka topics already exist');
        }
    } catch (error) {
        console.error('Error initializing Kafka topics:', error);
    } finally {
        await kafkaAdmin.disconnect();
    }
}

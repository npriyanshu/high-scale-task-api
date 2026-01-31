import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
})

export const kafkaProducer = kafka.producer();

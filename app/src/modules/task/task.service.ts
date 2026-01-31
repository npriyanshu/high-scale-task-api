import {prisma} from "../../prisma"
import { kafkaProducer} from "../../kafka";

interface createTaskInput {
    title: string;
    userId: number;
    id?: string;
}

export async function createTask(input:createTaskInput){

    // 1. Create task in DB

    const task = await prisma.task.create({
        data:{
            ...(input.id && { id: input.id }),
            title:input.title,
            userId: input.userId
        }
    });

    // 2. Send message to Kafka topic
    await  kafkaProducer.send({
        topic: 'task-created',
        messages: [
            {key: String(task.id),
                value: JSON.stringify({
                    taskId: task.id,
                    title: task.title,
                    userId: task.userId,
                    createdAt: task.createdAt
                })
            }
        ]
    })
    return task;
}
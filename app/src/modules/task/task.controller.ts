import {Request,Response} from "express";
// import { createTask } from "./task.service";
import { kafkaProducer } from "../../kafka";
import { randomUUID } from "node:crypto";
import { redis } from "../../config/redis";
import { prisma } from "../../prisma";


export async function getTaskHandler(req:Request,res:Response){
    const {id} = req.params;
    try {
        const taskId = Array.isArray(id) ? id[0] : id;

        const cached = await redis.get(`task:${taskId}`);
        if(cached){
              if (cached) {
    return res.status(200).json({
      source: "redis",
      task: JSON.parse(cached),
    });
  }
        }

        const task = await prisma.task.findUnique({
            where: {id: taskId}
        })

        if(!task){
            return res.status(404).json({error:"Task not found"});
        }

        // backfill cache

        await redis.set(`task:${taskId}`,JSON.stringify(task),"EX",60*60); // 5 minutes

        return res.status(200).json({
            source:"db",
            task
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({error:"Failed to get task status"});
    }
}

export async function createTaskHandler(req:Request,res:Response){
    try {
        
        const {title,userId} = req.body;

        if(!title || !userId){
            return res.status(400).json({error:"Title and UserId are required"});
        }

        // generate tracking Id 

        const taskId = randomUUID();

        // produce kakfa event only

        await kafkaProducer.send({
            topic: 'task.ingested',
            messages:[{
                key: taskId,
                value: JSON.stringify({
                    taskId,
                    title,
                    userId,
                    createdAt: new Date().toISOString()
                })
        }]
        })

        // response immediately
        return res.status(202).json({taskId,
            status: "accepted",
            message: "Task creation in progress"
        })

  
    } catch (error) {
        console.log(error);
        return res.status(500).json({error:"Failed to create task"});
    }
}
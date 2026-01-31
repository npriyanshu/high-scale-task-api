import {Request, Response, NextFunction} from "express";
import {redis} from "../config/redis"

const  WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

export async function rateLimiter(req:Request,res:Response,next:NextFunction){

    const identifier = (req as any).user?.id ?? req.ip;
    const key = `rate:${identifier}`;
    const current = await redis.incr(key);

    if(current ===1){
        await redis.expire(key,WINDOW_SECONDS);
    }

    if (current> MAX_REQUESTS){
        return res.status(429).json({error:"Too many requests"})
    }

    next();

}

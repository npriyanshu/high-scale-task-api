import {Request, Response, NextFunction} from "express"

import jwt from "jsonwebtoken"
import { authConfig } from "../config/auth"

export interface AuthRequest extends Request{
    user?: {
        id: number;
        email: string;

    };
}

export function authMiddleware(req:AuthRequest,res:Response,next:NextFunction){
   
    const header = req.headers.authorization;

    if(!header){
        return res.status(401).json({
            error:"Unauthorized"
        })
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token,authConfig.jwtSecret) as {
            id: number;
            email: string;
        };

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            error:"Unauthorized"
        })
    }
}
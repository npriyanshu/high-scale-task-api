import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { authConfig } from "../config/auth"

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}

// Optimization: Cache verified tokens to avoid expensive crypto on every request
// In a production app, use an LRU cache or Redis for this.
const tokenCache = new Map<string, { user: any, expires: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const token = header.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    // Check cache first
    const cached = tokenCache.get(token);
    const now = Date.now();
    if (cached && cached.expires > now) {
        req.user = cached.user;
        return next();
    }

    try {
        const decoded = jwt.verify(token, authConfig.jwtSecret) as {
            id: number;
            email: string;
        };

        // Cache the result
        tokenCache.set(token, {
            user: decoded,
            expires: now + CACHE_TTL
        });

        // Periodic cache cleanup (lazy)
        if (tokenCache.size > 1000) {
            for (const [key, val] of tokenCache) {
                if (val.expires < now) tokenCache.delete(key);
            }
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" })
    }
}
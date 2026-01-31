import { Request, Response } from "express"
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { authConfig } from "../../config/auth";
import { prisma } from "../../prisma";

export async function login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" })
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiresIn } as SignOptions
    );

    return res.json({ token })


}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
  });
}
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../lib/mongodb.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function authMiddleware(
  req: Request & { user?: { id: string; email: string } },
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!payload?.userId || typeof payload.userId !== 'string') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!mongoose.Types.ObjectId.isValid(payload.userId)) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { id: user._id.toString(), email: user.email ?? '' };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taletogether-dev-secret';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const signToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d',
  });

const extractToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
};

export const attachOptionalUser = (
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction,
) => {
  const token = extractToken(request.headers.authorization);

  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    request.userId = payload.userId;
  } catch {
    request.userId = undefined;
  }

  next();
};

export const requireAuth = (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) => {
  const token = extractToken(request.headers.authorization);

  if (!token) {
    response.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    request.userId = payload.userId;
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired session. Please sign in again.' });
  }
};

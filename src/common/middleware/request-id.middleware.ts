import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export function requestIdMiddleware(
  req: Request & { id?: string },
  res: Response,
  next: NextFunction,
) {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' ? existingId : uuidv4();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}

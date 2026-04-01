import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  logger.error('Unhandled error', { err });
  res.status(500).json({ error: 'Errore interno del server', code: 'INTERNAL_ERROR' });
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (resource: string) =>
  new AppError(404, `${resource} non trovato`, 'NOT_FOUND');

export const unauthorized = () =>
  new AppError(401, 'Non autorizzato', 'UNAUTHORIZED');

export const forbidden = () =>
  new AppError(403, 'Accesso negato', 'FORBIDDEN');

export const badRequest = (msg: string) =>
  new AppError(400, msg, 'BAD_REQUEST');

export const conflict = (msg: string) =>
  new AppError(409, msg, 'CONFLICT');

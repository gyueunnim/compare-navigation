import { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    next();
    return;
  }
  const provided = req.headers['x-api-key'];
  if (provided !== apiKey) {
    res.status(401).json({ error: '인증이 필요합니다.' });
    return;
  }
  next();
}

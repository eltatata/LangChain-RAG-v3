import type { Request, Response, NextFunction } from 'express';

export interface RequestExtended extends Request {
  sessionId?: string;
}

export const validateSessionId = (
  req: RequestExtended,
  res: Response,
  next: NextFunction,
): void => {
  const sessionId =
    req.body?.sessionId || (req.headers['x-session-id'] as string);
  if (!sessionId) {
    res.status(400).json({
      error: 'Session ID is required',
      message:
        'Please provide a sessionId in the request body or x-session-id header',
    });
    return;
  }

  if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    res.status(400).json({
      error: 'Invalid Session ID',
      message: 'Session ID must be a non-empty string',
    });
    return;
  }

  if (sessionId.length < 3 || sessionId.length > 100) {
    res.status(400).json({
      error: 'Invalid Session ID format',
      message: 'Session ID must be between 3 and 100 characters',
    });
    return;
  }

  req.sessionId = sessionId;

  next();
};

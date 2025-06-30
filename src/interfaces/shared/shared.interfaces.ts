import type { Request } from 'express';

export interface RequestExtended extends Request {
  sessionId?: string;
}

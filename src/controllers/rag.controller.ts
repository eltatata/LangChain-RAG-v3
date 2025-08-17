import type { Response } from 'express';
import type { RequestExtended } from '../interfaces';
import { ErrorHandler } from '../config';
import { RagService } from '../services';

export class RagController {
  constructor(private readonly ragService: RagService) {}

  rag = async (req: RequestExtended, res: Response) => {
    if (!req.body || !req.body.message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    this.ragService
      .RagResponse(req.body.message, req.sessionId!)
      .then((response) => res.status(200).json(response))
      .catch((error) => ErrorHandler.handleError(error, res));
  };
}

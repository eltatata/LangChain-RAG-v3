import type { Request, Response } from 'express';
import { RagService } from '../services';
import { ErrorHandler } from '../config';

export class RagController {
  constructor(private readonly ragService: RagService) {}

  rag = async (req: Request, res: Response) => {
    if (!req.body || !req.body.message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    this.ragService
      .RagResponse(req.body.message)
      .then((response) => res.status(201).json(response))
      .catch((error) => ErrorHandler.handleError(error, res));
  };
}

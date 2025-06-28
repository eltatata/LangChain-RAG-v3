import { Router } from 'express';
import { RagController } from '../controllers';
import { RagService } from '../services';

export class RagRoutes {
  static get routes(): Router {
    const router = Router();

    const ragService = new RagService();
    const ragController = new RagController(ragService);

    router.post('/', ragController.rag);

    return router;
  }
}

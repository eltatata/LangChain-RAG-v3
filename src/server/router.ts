import { Router } from 'express';
import { RagRoutes } from '../routes';

export class AppRoutes {
  static get routes() {
    const router = Router();

    router.use('/api/rag', RagRoutes.routes);

    return router;
  }
}

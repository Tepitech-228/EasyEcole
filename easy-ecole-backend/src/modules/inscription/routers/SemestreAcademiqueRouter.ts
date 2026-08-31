import express from 'express';
import SemestreAcademiqueController from '../controllers/SemestreAcademiqueController';
import Authenticate from '../../../core/middlewares/Authenticate';
import { cache } from '../../../core/middlewares/CacheMiddleware';

const router = express.Router();

// Référentiel stable → cache Redis 300 s (liste)
router.get('/', [Authenticate, cache(300)], SemestreAcademiqueController.list);
router.post('/', [Authenticate], SemestreAcademiqueController.create);
router.post('/:id/activate', [Authenticate], SemestreAcademiqueController.activate);
router.post('/:id/close', [Authenticate], SemestreAcademiqueController.close);

export default router;

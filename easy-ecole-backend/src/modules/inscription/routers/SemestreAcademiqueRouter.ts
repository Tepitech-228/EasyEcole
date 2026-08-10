import express from 'express';
import SemestreAcademiqueController from '../controllers/SemestreAcademiqueController';
import Authenticate from '../../../core/middlewares/Authenticate';

const router = express.Router();

router.get('/', [Authenticate], SemestreAcademiqueController.list);
router.post('/', [Authenticate], SemestreAcademiqueController.create);
router.post('/:id/activate', [Authenticate], SemestreAcademiqueController.activate);
router.post('/:id/close', [Authenticate], SemestreAcademiqueController.close);

export default router;

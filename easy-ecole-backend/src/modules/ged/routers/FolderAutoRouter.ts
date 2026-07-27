import express, { Request, Response } from 'express';
import { FolderAutoService } from '../services/FolderAutoService';
import Authenticate from '../../../core/middlewares/Authenticate';

const router = express.Router();

router    /**
     * @openapi
     * /generate/:anneeAcademiqueId:
     *   post:
     *     tags: [GED]
     *     summary: POST /generate/:anneeAcademiqueId
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Success
     */
.post('/generate/:anneeAcademiqueId', [Authenticate], async (req: Request, res: Response) => {
  try {
    const anneeId = Number(req.params.anneeAcademiqueId);
    const userId = (req as any).utilisateurId;
    await FolderAutoService.generateForAcademicYear(anneeId, userId);
    return res.status(200).json({ success: true, message: 'Arborescence générée avec succès' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

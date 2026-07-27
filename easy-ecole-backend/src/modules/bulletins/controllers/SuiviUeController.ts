import { Request, Response } from "express";
import { GestionDetteService } from "../services/GestionDetteService";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { SemestreProgressionService } from "../../../core/services/SemestreProgressionService";
import { logger } from "../../../core/helpers/Logger";

export default class SuiviUeController {

  async getSuivi(req: Request, res: Response) {
    try {
      const cursusApprenantId = Number(req.params.id);
      if (!cursusApprenantId) {
        return res.status(400).json({ message: 'ID du cursus requis' });
      }

      const [result, progression] = await Promise.all([
        GestionDetteService.getSuiviUe(cursusApprenantId),
        SemestreProgressionService.getProgression(cursusApprenantId)
      ]);
      return res.json({ ...result, progression });
    } catch (error: any) {
      if (error.message === 'Cursus non trouvÃ©') {
        return res.status(404).json({ message: error.message });
      }
      logger.error('Erreur suivi UE:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration du suivi' });
    }
  }

  async getMonSuivi(req: Request, res: Response) {
    try {
      const utilisateurId = (req as any).utilisateurId;
      if (!utilisateurId) {
        return res.status(401).json({ message: 'Non authentifiÃ©' });
      }

      const cursus = await CursusApprenant.findOne({
        where: { utilisateurId },
        order: [['createdAt', 'DESC']]
      });

      if (!cursus) {
        return res.status(404).json({ message: 'Aucun cursus trouvÃ©' });
      }

      const cursusId = Number(cursus.id);
      const [result, progression] = await Promise.all([
        GestionDetteService.getSuiviUe(cursusId),
        SemestreProgressionService.getProgression(cursusId)
      ]);
      return res.json({ ...result, progression });
    } catch (error) {
      logger.error('Erreur mon suivi:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration du suivi' });
    }
  }

  async getDettes(req: Request, res: Response) {
    try {
      const cursusApprenantId = Number(req.params.id);
      if (!cursusApprenantId) {
        return res.status(400).json({ message: 'ID du cursus requis' });
      }

      const dettes = await GestionDetteService.getDettesByCursus(cursusApprenantId);
      return res.json(dettes);
    } catch (error) {
      logger.error('Erreur dettes:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des dettes' });
    }
  }

  async getDettesActives(req: Request, res: Response) {
    try {
      const cursusApprenantId = Number(req.params.id);
      if (!cursusApprenantId) {
        return res.status(400).json({ message: 'ID du cursus requis' });
      }

      const dettes = await GestionDetteService.getDettesActivesByCursus(cursusApprenantId);
      return res.json(dettes);
    } catch (error) {
      logger.error('Erreur dettes actives:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des dettes' });
    }
  }

  async verifierEligibilite(req: Request, res: Response) {
    try {
      const cursusApprenantId = Number(req.params.id);
      if (!cursusApprenantId) {
        return res.status(400).json({ message: 'ID du cursus requis' });
      }

      const result = await GestionDetteService.verifierEligibiliteProgression(cursusApprenantId);
      return res.json(result);
    } catch (error) {
      logger.error('Erreur vÃ©rification Ã©ligibilitÃ©:', error);
      return res.status(500).json({ message: 'Erreur lors de la vÃ©rification' });
    }
  }

  async resorberDette(req: Request, res: Response) {
    try {
      const detteId = Number(req.params.detteId);
      const { bulletinId } = req.body;

      if (!detteId || !bulletinId) {
        return res.status(400).json({ message: 'detteId et bulletinId requis' });
      }

      const dette = await GestionDetteService.resorberDette(detteId, bulletinId);
      if (!dette) {
        return res.status(404).json({ message: 'Dette non trouvÃ©e ou dÃ©jÃ  rÃ©sorbÃ©e' });
      }

      return res.json(dette);
    } catch (error) {
      logger.error('Erreur rÃ©sorption dette:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©sorption' });
    }
  }
}


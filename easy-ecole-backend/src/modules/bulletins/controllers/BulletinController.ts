import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { GenerationBulletinService } from "../services/GenerationBulletinService";
import { EchelleNote } from "../models/EchelleNote";
import { logger } from "../../../core/helpers/Logger";

let echellesCache: { noteMin: number; mention: string }[] | null = null;
async function getEchelles(): Promise<{ noteMin: number; mention: string }[]> {
  if (echellesCache) return echellesCache;
  const echelles = await EchelleNote.findAll({
    where: { estActive: true },
    order: [['noteMin', 'DESC']],
    attributes: ['noteMin', 'mention'],
    raw: true
  });
  echellesCache = echelles;
  return echelles;
}

function calculerMention(moyenne: number, echelles: { noteMin: number; mention: string }[]): string {
  for (const e of echelles) {
    if (moyenne >= e.noteMin) return e.mention;
  }
  return 'Insuffisant';
}

export default class BulletinController {
  constructor() {}

  // POST /bulletins/generer
  async generer(req: Request, res: Response) {
    const t = await DatabaseConnection.getInstance().sequelize.transaction();

    try {
      const { classeId, semestre, anneeAcademiqueId } = req.body;

      if (!classeId || !semestre || !anneeAcademiqueId) {
        await t.rollback();
        return res.status(400).json({ message: 'classeId, semestre, anneeAcademiqueId requis' });
      }

      const resultats = await GenerationBulletinService.generer(
        classeId, semestre, anneeAcademiqueId, t
      );

      if (!resultats.length) {
        const cursusCount = await CursusApprenant.count({
          where: { classeId, anneeAcademiqueId }
        });
        if (!cursusCount) {
          await t.rollback();
          return res.status(404).json({ message: 'Aucun apprenant trouvÃ© dans cette classe' });
        }
      }

      const bulletinsCrees = resultats.map(r => Number(r.bulletin.id));

      if (bulletinsCrees.length) {
        await this.calculerRangs(classeId, semestre, anneeAcademiqueId, t);
      }

      await t.commit();

      const bulletins = await Bulletin.findAll({
        where: { id: { [Op.in]: bulletinsCrees } },
        include: [{ association: Bulletin.associations.lignesBulletins }]
      });

      return res.status(201).json(bulletins);
    } catch (error) {
      await t.rollback();
      logger.error('Erreur gÃ©nÃ©ration bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la gÃ©nÃ©ration' });
    }
  }

  private async calculerRangs(classeId: number, semestre: string, anneeAcademiqueId: number, t?: Transaction) {
    const [bulletins, echelles] = await Promise.all([
      Bulletin.findAll({
        where: { classeId, semestre, anneeAcademiqueId, statut: 'brouillon' },
        order: [['moyenneGenerale', 'DESC']],
        transaction: t
      }),
      getEchelles()
    ]);
    const effectif = bulletins.length;
    for (let i = 0; i < bulletins.length; i++) {
      await bulletins[i].update({
        rang: i + 1,
        effectifClasse: effectif,
        mention: bulletins[i].moyenneGenerale != null
          ? calculerMention(bulletins[i].moyenneGenerale!, echelles)
          : null
      }, { transaction: t });
    }
  }

  // GET /bulletins
  async getAll(req: Request, res: Response) {
    try {
      const { classeId, semestre, anneeAcademiqueId, statut, page, limit } = req.query;

      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (semestre) where.semestre = semestre;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (statut) where.statut = statut;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
      const offset = (pageNum - 1) * limitNum;

      const { count, rows: bulletins } = await Bulletin.findAndCountAll({
        where,
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.anneeAcademique },
          { association: Bulletin.associations.lignesBulletins }
        ],
        order: [['createdAt', 'DESC']],
        limit: limitNum,
        offset
      });

      return res.json({
        data: bulletins,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count / limitNum)
        }
      });
    } catch (error) {
      logger.error('Erreur liste bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }

  // GET /bulletins/:id
  async getOne(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(Number(req.params.id), {
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.parcours },
          { association: Bulletin.associations.niveauEtude },
          { association: Bulletin.associations.anneeAcademique },
          {
            association: Bulletin.associations.lignesBulletins,
            include: [{ association: LigneBulletin.associations.cours }]
          }
        ]
      });
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvÃ©' });
      return res.json(bulletin);
    } catch (error) {
      logger.error('Erreur dÃ©tail bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }

  // PUT /bulletins/:id
  async update(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(Number(req.params.id));
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvÃ©' });

      if (bulletin.statut === 'publie') {
        return res.status(400).json({ message: 'Impossible de modifier un bulletin publiÃ©' });
      }

      const { appreciation } = req.body;
      if (appreciation !== undefined) {
        await bulletin.update({ appreciation });
      }

      return res.json(bulletin);
    } catch (error) {
      logger.error('Erreur mise Ã  jour bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise Ã  jour' });
    }
  }

  // PUT /bulletins/:id/publier
  async publier(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(Number(req.params.id));
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvÃ©' });
      if (bulletin.statut === 'publie') return res.status(400).json({ message: 'DÃ©jÃ  publiÃ©' });

      await bulletin.update({
        statut: 'publie',
        datePublication: new Date()
      });

      await ArchiveGedService.archiverBulletin({
        id: Number(bulletin.id),
        anneeAcademiqueId: Number(bulletin.anneeAcademiqueId),
        parcoursId: Number(bulletin.parcoursId),
        niveauEtudeId: Number(bulletin.niveauEtudeId),
        classeId: Number(bulletin.classeId),
        semestre: bulletin.semestre,
        cursusApprenantId: bulletin.cursusApprenantId ? Number(bulletin.cursusApprenantId) : undefined,
        mention: bulletin.mention,
        moyenneGenerale: bulletin.moyenneGenerale
      });

      return res.json(bulletin);
    } catch (error) {
      logger.error('Erreur publication bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la publication' });
    }
  }

  // PUT /bulletins/:id/signer-enseignant
  async signerEnseignant(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(Number(req.params.id));
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvÃ©' });

      const { signature } = req.body;
      if (!signature) return res.status(400).json({ message: 'Signature requise' });

      await bulletin.update({
        signatureEnseignant: signature,
        dateSignatureEnseignant: new Date()
      });

      return res.json(bulletin);
    } catch (error) {
      logger.error('Erreur signature enseignant:', error);
      return res.status(500).json({ message: 'Erreur lors de la signature' });
    }
  }

  // PUT /bulletins/:id/signer-chef
  async signerChef(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(Number(req.params.id));
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvÃ©' });

      const { signature } = req.body;
      if (!signature) return res.status(400).json({ message: 'Signature requise' });

      await bulletin.update({
        signatureChef: signature,
        dateSignatureChef: new Date()
      });

      return res.json(bulletin);
    } catch (error) {
      logger.error('Erreur signature chef:', error);
      return res.status(500).json({ message: 'Erreur lors de la signature' });
    }
  }

  // DELETE /bulletins/:id
  async delete(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(Number(req.params.id));
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvÃ©' });

      await bulletin.destroy();
      return res.status(204).end();
    } catch (error) {
      logger.error('Erreur suppression bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression' });
    }
  }

  // GET /bulletins/moyennes
  async getMoyennes(req: Request, res: Response) {
    try {
      const { anneeAcademiqueId, semestre, classeId } = req.query;
      const where: any = { statut: { [Op.ne]: 'brouillon' } };
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (semestre) where.semestre = semestre;
      if (classeId) where.classeId = classeId;

      const bulletins = await Bulletin.findAll({
        where,
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.classe }
        ]
      });

      const grouped: any = {};
      for (const b of bulletins) {
        const key = String(b.classeId);
        if (!grouped[key]) {
          grouped[key] = {
            classeId: b.classeId,
            classe: b.classe?.libelle || '',
            effectif: 0,
            sommeMoyennes: 0,
            moyenneMin: Infinity,
            moyenneMax: -Infinity,
            admis: 0,
            meilleurEleve: '',
            meilleureMoyenne: -Infinity
          };
        }
        const g = grouped[key];
        g.effectif++;
        if (b.moyenneGenerale != null) {
          g.sommeMoyennes += b.moyenneGenerale;
          g.moyenneMin = Math.min(g.moyenneMin, b.moyenneGenerale);
          g.moyenneMax = Math.max(g.moyenneMax, b.moyenneGenerale);
          if (b.moyenneGenerale >= 10) g.admis++;
          if (b.moyenneGenerale > g.meilleureMoyenne) {
            g.meilleureMoyenne = b.moyenneGenerale;
            g.meilleurEleve = (b.utilisateur?.nom || '') + ' ' + (b.utilisateur?.prenoms || '');
          }
        }
      }

      const resultats = Object.values(grouped).map((g: any) => ({
        classe: g.classe,
        effectif: g.effectif,
        moyenneGenerale: g.effectif > 0 ? +(g.sommeMoyennes / g.effectif).toFixed(2) : 0,
        moyenneMin: g.moyenneMin === Infinity ? 0 : g.moyenneMin,
        moyenneMax: g.moyenneMax === -Infinity ? 0 : g.moyenneMax,
        tauxReussite: g.effectif > 0 ? +((g.admis / g.effectif) * 100).toFixed(1) : 0,
        meilleurEleve: g.meilleurEleve
      }));

      return res.json(resultats);
    } catch (error) {
      logger.error('Erreur moyennes:', error);
      return res.status(500).json({ message: 'Erreur lors du calcul des moyennes' });
    }
  }

  // GET /bulletins/mon-releve
  async monReleve(req: Request, res: Response) {
    try {
      const utilisateurId = req.utilisateurId!;
      if (!utilisateurId) return res.status(401).json({ message: 'Non authentifiÃ©' });

      const bulletin = await Bulletin.findOne({
        where: { utilisateurId, statut: 'publie' },
        include: [
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.anneeAcademique },
          {
            association: Bulletin.associations.lignesBulletins,
            include: [{ association: LigneBulletin.associations.cours }]
          }
        ],
        order: [['datePublication', 'DESC']]
      });
      if (!bulletin) return res.status(404).json({ message: 'Aucun bulletin publiÃ© trouvÃ©' });
      return res.json(bulletin);
    } catch (error) {
      logger.error('Erreur relevÃ©:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }
}


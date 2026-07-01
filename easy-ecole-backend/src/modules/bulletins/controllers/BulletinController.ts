import { Request, Response } from "express";
import { Op } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { ListeNoteEvaluation } from "../../inscription/models/ListeNoteEvaluation";
import { Cours } from "../../inscription/models/Cours";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";

function calculerMention(moyenne: number): string {
  if (moyenne >= 16) return 'Très Bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez Bien';
  if (moyenne >= 10) return 'Passable';
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

      const cursusList = await CursusApprenant.findAll({
        where: { classeId, anneeAcademiqueId },
        include: [{ association: CursusApprenant.associations.utilisateur }]
      });

      if (!cursusList.length) {
        await t.rollback();
        return res.status(404).json({ message: 'Aucun apprenant trouvé dans cette classe' });
      }

      const coursList = await Cours.findAll({
        where: { classeId, semestre }
      });

      if (!coursList.length) {
        await t.rollback();
        return res.status(404).json({ message: 'Aucun cours trouvé pour ce semestre' });
      }

      const bulletinsCrees: number[] = [];

      for (const cursus of cursusList) {
        const existant = await Bulletin.findOne({
          where: { cursusApprenantId: cursus.id, semestre, anneeAcademiqueId }
        });
        if (existant) continue;

        const lignesBulletin: Array<{
          coursId: string;
          moyenneCC: number | null;
          noteDevoir: number | null;
          noteExamen: number | null;
          moyenne: number;
          coefficient: number | null;
        }> = [];

        for (const cours of coursList) {
          const coursParticipant = await CoursParticipant.findOne({
            where: { coursId: cours.id, cursusApprenantId: cursus.id }
          });

          if (!coursParticipant) continue;

          const listesEval = await ListeNoteEvaluation.findAll({
            where: { coursId: cours.id, anneeAcademiqueId },
            include: [
              { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
              {
                association: ListeNoteEvaluation.associations.notesEvaluation,
                where: { coursParticipantId: coursParticipant.id },
                required: false
              }
            ]
          });

          let notesPonderees: { note: number; poids: number }[] = [];
          let noteDevoir: number | null = null;
          let poidsDevoir: number | null = null;
          let noteExamen: number | null = null;
          let poidsExamen: number | null = null;

          for (const evalList of listesEval) {
            if (evalList.notesEvaluation?.length) {
              const note = Number(evalList.notesEvaluation[0].note);
              if (note == null) continue;

              const poids = Number(evalList.poidsTypeNoteEvaluation) || 0;
              const categorie = (evalList as any).typeNoteEvaluation?.categorie;

              if (categorie === 'devoir') {
                noteDevoir = note;
                poidsDevoir = poids;
              } else if (categorie === 'examen') {
                noteExamen = note;
                poidsExamen = poids;
              } else if (poids > 0) {
                notesPonderees.push({ note, poids });
              }
            }
          }

          let sommePonderee = 0;
          let sommePoids = 0;

          for (const np of notesPonderees) {
            sommePonderee += np.note * np.poids;
            sommePoids += np.poids;
          }
          if (noteDevoir != null && poidsDevoir != null) {
            sommePonderee += noteDevoir * poidsDevoir;
            sommePoids += poidsDevoir;
          }
          if (noteExamen != null && poidsExamen != null) {
            sommePonderee += noteExamen * poidsExamen;
            sommePoids += poidsExamen;
          }

          const moyenne = sommePoids > 0
            ? Math.round((sommePonderee / sommePoids) * 100) / 100
            : 0;
          const moyenneCC = notesPonderees.length
            ? Math.round((notesPonderees.reduce((a, n) => a + n.note * n.poids, 0) / notesPonderees.reduce((a, n) => a + n.poids, 0)) * 100) / 100
            : null;

          lignesBulletin.push({
            coursId: cours.id,
            moyenneCC,
            noteDevoir,
            noteExamen,
            moyenne,
            coefficient: cours.credit ?? null
          });
        }

        let sommeNotesCoef = 0;
        let sommeCoefs = 0;
        let creditsValides = 0;
        for (const l of lignesBulletin) {
          if (l.coefficient) {
            sommeNotesCoef += l.moyenne * l.coefficient;
            sommeCoefs += l.coefficient;
            if (l.moyenne >= 10) {
              creditsValides += l.coefficient;
            }
          }
        }
        const moyenneGenerale = sommeCoefs > 0
          ? Math.round((sommeNotesCoef / sommeCoefs) * 100) / 100
          : null;

        const bulletin = await Bulletin.create({
          anneeAcademiqueId,
          semestre,
          cursusApprenantId: cursus.id,
          utilisateurId: cursus.utilisateurId,
          classeId,
          parcoursId: cursus.parcoursId,
          niveauEtudeId: cursus.niveauEtudeId,
          moyenneGenerale,
          totalCredits: sommeCoefs,
          creditsValides,
          statut: 'brouillon',
          dateGeneration: new Date(),
        }, { transaction: t });

        for (const l of lignesBulletin) {
          await LigneBulletin.create({
            bulletinId: bulletin.id,
            coursId: l.coursId,
            moyenneCC: l.moyenneCC,
            noteDevoir: l.noteDevoir,
            noteExamen: l.noteExamen,
            moyenne: l.moyenne,
            coefficient: l.coefficient,
          }, { transaction: t });
        }

        bulletinsCrees.push(bulletin.id);
      }

      await this.calculerRangs(classeId, semestre, anneeAcademiqueId, t);

      await t.commit();

      const bulletins = await Bulletin.findAll({
        where: { id: { [Op.in]: bulletinsCrees } },
        include: [{ association: Bulletin.associations.lignesBulletins }]
      });

      return res.status(201).json(bulletins);
    } catch (error) {
      await t.rollback();
      console.error('Erreur génération bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la génération' });
    }
  }

  private async calculerRangs(classeId: number, semestre: string, anneeAcademiqueId: number, t?: any) {
    const bulletins = await Bulletin.findAll({
      where: { classeId, semestre, anneeAcademiqueId, statut: 'brouillon' },
      order: [['moyenneGenerale', 'DESC']],
      transaction: t
    });
    const effectif = bulletins.length;
    for (let i = 0; i < bulletins.length; i++) {
      await bulletins[i].update({
        rang: i + 1,
        effectifClasse: effectif,
        mention: bulletins[i].moyenneGenerale != null
          ? calculerMention(bulletins[i].moyenneGenerale!)
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
      console.error('Erreur liste bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  // GET /bulletins/:id
  async getOne(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id, {
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
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });
      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur détail bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }

  // PUT /bulletins/:id
  async update(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });

      if (bulletin.statut === 'publie') {
        return res.status(400).json({ message: 'Impossible de modifier un bulletin publié' });
      }

      const { appreciation } = req.body;
      if (appreciation !== undefined) {
        await bulletin.update({ appreciation });
      }

      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur mise à jour bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour' });
    }
  }

  // PUT /bulletins/:id/publier
  async publier(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });
      if (bulletin.statut === 'publie') return res.status(400).json({ message: 'Déjà publié' });

      await bulletin.update({
        statut: 'publie',
        datePublication: new Date()
      });
      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur publication bulletin:', error);
      return res.status(500).json({ message: 'Erreur lors de la publication' });
    }
  }

  // PUT /bulletins/:id/signer-enseignant
  async signerEnseignant(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });

      const { signature } = req.body;
      if (!signature) return res.status(400).json({ message: 'Signature requise' });

      await bulletin.update({
        signatureEnseignant: signature,
        dateSignatureEnseignant: new Date()
      });

      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur signature enseignant:', error);
      return res.status(500).json({ message: 'Erreur lors de la signature' });
    }
  }

  // PUT /bulletins/:id/signer-chef
  async signerChef(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });

      const { signature } = req.body;
      if (!signature) return res.status(400).json({ message: 'Signature requise' });

      await bulletin.update({
        signatureChef: signature,
        dateSignatureChef: new Date()
      });

      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur signature chef:', error);
      return res.status(500).json({ message: 'Erreur lors de la signature' });
    }
  }

  // DELETE /bulletins/:id
  async delete(req: Request, res: Response) {
    try {
      const bulletin = await Bulletin.findByPk(req.params.id);
      if (!bulletin) return res.status(404).json({ message: 'Bulletin non trouvé' });

      await bulletin.destroy();
      return res.status(204).end();
    } catch (error) {
      console.error('Erreur suppression bulletin:', error);
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
            classe: (b as any).classe?.libelle || '',
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
            g.meilleurEleve = ((b as any).utilisateur?.nom || '') + ' ' + ((b as any).utilisateur?.prenoms || '');
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
      console.error('Erreur moyennes:', error);
      return res.status(500).json({ message: 'Erreur lors du calcul des moyennes' });
    }
  }

  // GET /bulletins/mon-releve
  async monReleve(req: Request, res: Response) {
    try {
      const utilisateurId = (req as any).utilisateurId;
      if (!utilisateurId) return res.status(401).json({ message: 'Non authentifié' });

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
      if (!bulletin) return res.status(404).json({ message: 'Aucun bulletin publié trouvé' });
      return res.json(bulletin);
    } catch (error) {
      console.error('Erreur relevé:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération' });
    }
  }
}

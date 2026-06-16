import { Request, Response } from "express";
import { Op } from "sequelize";
import { Bulletin } from "../models/Bulletin";
import { LigneBulletin } from "../models/LigneBulletin";
import { ListeNoteEvaluation } from "../../inscription/models/ListeNoteEvaluation";
import { NoteEvaluation } from "../../inscription/models/NoteEvaluation";
import { Cours } from "../../inscription/models/Cours";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { CursusApprenant } from "../../inscription/models/CursusApprenant";
import { Utilisateur } from "../../auth/models/Utilisateur";

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
    try {
      const { classeId, semestre, anneeAcademiqueId } = req.body;

      if (!classeId || !semestre || !anneeAcademiqueId) {
        return res.status(400).json({ message: 'classeId, semestre, anneeAcademiqueId requis' });
      }

      const cursusList = await CursusApprenant.findAll({
        where: { classeId, anneeAcademiqueId },
        include: [{ association: CursusApprenant.associations.utilisateur }]
      });

      if (!cursusList.length) {
        return res.status(404).json({ message: 'Aucun apprenant trouvé dans cette classe' });
      }

      const coursList = await Cours.findAll({
        where: { classeId, semestre }
      });

      if (!coursList.length) {
        return res.status(404).json({ message: 'Aucun cours trouvé pour ce semestre' });
      }

      const bulletinsCrees: number[] = [];

      for (const cursus of cursusList) {
        const existant = await Bulletin.findOne({
          where: { cursusApprenantId: cursus.id, semestre, anneeAcademiqueId }
        });
        if (existant) continue;

        const lignesBulletin: Array<{
          coursId: number;
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

          let notesCC: number[] = [];
          let noteDevoir: number | null = null;
          let noteExamen: number | null = null;

          for (const evalList of listesEval) {
            if (evalList.notesEvaluation?.length) {
              const note = evalList.notesEvaluation[0].note;
              if (note == null) continue;

              const categorie = (evalList as any).typeNoteEvaluation?.categorie;
              if (categorie === 'devoir') {
                noteDevoir = note;
              } else if (categorie === 'examen') {
                noteExamen = note;
              } else {
                notesCC.push(note);
              }
            }
          }

          const moyenneCC = notesCC.length ? notesCC.reduce((a, b) => a + b, 0) / notesCC.length : null;
          const poidsCC = moyenneCC != null ? 0.2 : 0;
          const poidsDevoir = noteDevoir != null ? 0.3 : 0;
          const poidsExamen = noteExamen != null ? 0.5 : 0;
          const poidsTotal = poidsCC + poidsDevoir + poidsExamen;

          let moyenne = 0;
          if (poidsTotal > 0) {
            moyenne = (
              (moyenneCC ?? 0) * poidsCC +
              (noteDevoir ?? 0) * poidsDevoir +
              (noteExamen ?? 0) * poidsExamen
            ) / poidsTotal;
            moyenne = Math.round(moyenne * 100) / 100;
          }

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
        for (const l of lignesBulletin) {
          if (l.coefficient) {
            sommeNotesCoef += l.moyenne * l.coefficient;
            sommeCoefs += l.coefficient;
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
          creditsValides: null,
          statut: 'brouillon',
          dateGeneration: new Date(),
        });

        for (const l of lignesBulletin) {
          await LigneBulletin.create({
            bulletinId: bulletin.id,
            coursId: l.coursId,
            moyenneCC: l.moyenneCC,
            noteDevoir: l.noteDevoir,
            noteExamen: l.noteExamen,
            moyenne: l.moyenne,
            coefficient: l.coefficient,
          });
        }

        bulletinsCrees.push(bulletin.id);
      }

      await this.calculerRangs(classeId, semestre, anneeAcademiqueId);

      const bulletins = await Bulletin.findAll({
        where: { id: { [Op.in]: bulletinsCrees } },
        include: [{ association: Bulletin.associations.lignesBulletins }]
      });

      return res.status(201).json(bulletins);
    } catch (error) {
      console.error('Erreur génération bulletins:', error);
      return res.status(500).json({ message: 'Erreur lors de la génération' });
    }
  }

  private async calculerRangs(classeId: number, semestre: string, anneeAcademiqueId: number) {
    const bulletins = await Bulletin.findAll({
      where: { classeId, semestre, anneeAcademiqueId, statut: 'brouillon' },
      order: [['moyenneGenerale', 'DESC']]
    });
    const effectif = bulletins.length;
    for (let i = 0; i < bulletins.length; i++) {
      await bulletins[i].update({
        rang: i + 1,
        effectifClasse: effectif,
        mention: bulletins[i].moyenneGenerale != null
          ? calculerMention(bulletins[i].moyenneGenerale!)
          : null
      });
    }
  }

  // GET /bulletins
  async getAll(req: Request, res: Response) {
    try {
      const { classeId, semestre, anneeAcademiqueId, statut } = req.query;
      const where: any = {};
      if (classeId) where.classeId = classeId;
      if (semestre) where.semestre = semestre;
      if (anneeAcademiqueId) where.anneeAcademiqueId = anneeAcademiqueId;
      if (statut) where.statut = statut;

      const bulletins = await Bulletin.findAll({
        where,
        include: [
          { association: Bulletin.associations.utilisateur },
          { association: Bulletin.associations.classe },
          { association: Bulletin.associations.anneeAcademique },
          { association: Bulletin.associations.lignesBulletins }
        ],
        order: [['createdAt', 'DESC']]
      });
      return res.json(bulletins);
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

  // GET /bulletins/mon-releve
  async monReleve(req: Request, res: Response) {
    try {
      const utilisateurId = (req as any).utilisateurId;
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
      console.error('Erreur relevÃ©:', error);
      return res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration' });
    }
  }
}

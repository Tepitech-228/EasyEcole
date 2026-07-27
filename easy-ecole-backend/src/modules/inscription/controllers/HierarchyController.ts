import { Request, Response } from "express";
import { Op } from "sequelize";
import { AnneeAcademique } from "../models/AnneeAcademique";
import { NiveauEtude } from "../models/NiveauEtude";
import { Parcours } from "../models/Parcours";
import { Session } from "../models/Session";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { DemandeInscription } from "../models/DemandeInscription";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { CoursParticipant } from "../models/CoursParticipant";
import { Cours } from "../models/Cours";
import { ParcoursChoisi } from "../models/ParcoursChoisi";

export default class HierarchyController {

  static async getTree(req: Request, res: Response): Promise<Response> {
    try {
      const annees = await AnneeAcademique.findAll({
        order: [['libelle', 'DESC']]
      });

      const tree = await Promise.all(annees.map(async (annee) => {
        const anneeId = (annee as any).id;

        const sessions = await Session.findAll({
          where: { anneeAcademiqueId: anneeId },
          attributes: ['id', 'niveauEtudeId']
        });

        const niveauIds = [...new Set(sessions.map((s: any) => s.niveauEtudeId).filter(Boolean))] as number[];
        const niveaux = niveauIds.length > 0
          ? await NiveauEtude.findAll({ where: { id: { [Op.in]: niveauIds } }, order: [['libelle', 'ASC']] })
          : [];

        const allParcours = await Parcours.findAll({
          where: niveauIds.length > 0 ? { niveauEtudeId: { [Op.in]: niveauIds } } : undefined,
          order: [['titre', 'ASC']]
        });

        const niveauxData = await Promise.all(niveaux.map(async (niveau) => {
          const parcoursNiveau = allParcours.filter(p => p.niveauEtudeId === niveau.id);

          const { count: dCount, rows: dRows } = await DossierEtudiant.findAndCountAll({
            include: [{
              association: DossierEtudiant.associations.coursParticipants,
              required: false,
              include: [{
                association: CoursParticipant.associations.cours,
                required: false
              }]
            }]
          });

          const { count: demCount, rows: demRows } = await DemandeInscription.findAndCountAll({
            include: [{
              association: DemandeInscription.associations.session,
              where: { anneeAcademiqueId: anneeId, niveauEtudeId: niveau.id },
              required: true
            }]
          });

          const { count: bCount, rows: bRows } = await Bordereau.findAndCountAll({
            include: [{
              association: Bordereau.associations.echeance,
              required: true,
              include: [{
                association: Echeance.associations.dossierEtudiant,
                required: true,
                include: [{
                  association: DossierEtudiant.associations.coursParticipants,
                  required: false,
                  include: [{
                    association: CoursParticipant.associations.cours,
                    required: false
                  }]
                }]
              }]
            }]
          });

          const parcoursData = await Promise.all(parcoursNiveau.map(async (p) => {
            const { count: dParcoursCount, rows: dParcoursRows } = await DossierEtudiant.findAndCountAll({
              include: [{
                association: DossierEtudiant.associations.coursParticipants,
                required: false,
                 include: [{
                   association: CoursParticipant.associations.cours,
                   required: false
                 }]
              }]
            });

            const { count: demParcoursCount, rows: demParcoursRows } = await DemandeInscription.findAndCountAll({
              include: [{
                association: DemandeInscription.associations.parcoursChoisis,
                where: { choixFinal: true, parcoursId: p.id },
                required: true
              }, {
                association: DemandeInscription.associations.session,
                where: { anneeAcademiqueId: anneeId },
                required: true
              }]
            });

            const { count: bParcoursCount, rows: bParcoursRows } = await Bordereau.findAndCountAll({
              include: [{
                association: Bordereau.associations.echeance,
                required: true,
                include: [{
                  association: Echeance.associations.dossierEtudiant,
                  required: true,
                  include: [{
                    association: DossierEtudiant.associations.coursParticipants,
                    required: false,
                    include: [{
                      association: CoursParticipant.associations.cours,
                      where: { parcoursId: p.id },
                      required: false
                    }]
                  }]
                }]
              }]
            });

            return {
              id: `parcours-${p.id}`,
              type: 'parcours',
              label: p.titre,
              data: {
                id: p.id,
                dossiers: dParcoursCount,
                demandes: demParcoursCount,
                bordereaux: bParcoursCount
              }
            };
          }));

          return {
            id: `niveau-${niveau.id}`,
            type: 'niveau',
            label: niveau.libelle,
            data: {
              id: niveau.id,
              dossiers: dCount,
              demandes: demCount,
              bordereaux: bCount
            },
            children: parcoursData
          };
        }));

        return {
          id: `annee-${anneeId}`,
          type: 'annee',
          label: (annee as any).libelle,
          data: {
            id: anneeId,
            dossiers: 0,
            demandes: 0,
            bordereaux: 0
          },
          children: niveauxData
        };
      }));

      return res.status(200).json(tree);
    } catch (error: any) {
      console.error('[HierarchyController.getTree]', error);
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }

  static async getDetails(req: Request, res: Response): Promise<Response> {
    try {
      const { type, id, anneeId } = req.params;
      let dossiers: any[] = [];
      let demandes: any[] = [];
      let bordereaux: any[] = [];

      if (type === 'annee') {
        const { count: dCount, rows: dRows } = await DossierEtudiant.findAndCountAll({
          include: [{
            association: DossierEtudiant.associations.coursParticipants,
            required: false,
                   include: [{
                     association: CoursParticipant.associations.cours,
                     required: false
                   }]
          }]
        });
        dossiers = dRows;

        const { count: demCount, rows: demRows } = await DemandeInscription.findAndCountAll({
          include: [{
            association: DemandeInscription.associations.session,
            where: { anneeAcademiqueId: Number(id) },
            required: true
          }, {
            association: DemandeInscription.associations.utilisateur
          }]
        });
        demandes = demRows;

        const { count: borCount, rows: borRows } = await Bordereau.findAndCountAll({
          include: [{
            association: Bordereau.associations.echeance,
            required: true,
              include: [{
                association: Echeance.associations.dossierEtudiant,
                required: true,
                include: [{
                  association: DossierEtudiant.associations.coursParticipants,
                  required: false,
                  include: [{
                    association: CoursParticipant.associations.cours,
                    required: false
                  }]
                }]
              }]
            }]
          });
          bordereaux = borRows;
      } else if (type === 'niveau') {
        const { count: dCount, rows: dRows } = await DossierEtudiant.findAndCountAll({
          include: [{
            association: DossierEtudiant.associations.coursParticipants,
            required: false,
                   include: [{
                     association: CoursParticipant.associations.cours,
                     required: false
                   }]
          }]
        });
        dossiers = dRows;

        const { count: demCount, rows: demRows } = await DemandeInscription.findAndCountAll({
          include: [{
            association: DemandeInscription.associations.session,
            where: { anneeAcademiqueId: Number(anneeId), niveauEtudeId: Number(id) },
            required: true
          }, {
            association: DemandeInscription.associations.utilisateur
          }]
        });
        demandes = demRows;

        const { count: borCount, rows: borRows } = await Bordereau.findAndCountAll({
          include: [{
            association: Bordereau.associations.echeance,
            required: true,
            include: [{
              association: Echeance.associations.dossierEtudiant,
              required: true,
                include: [{
                  association: DossierEtudiant.associations.coursParticipants,
                  required: false,
                  include: [{
                    association: CoursParticipant.associations.cours,
                    required: false
                  }]
                }]
              }]
            }]
          });
          bordereaux = borRows;

      } else if (type === 'parcours') {
        const { count: dCount, rows: dRows } = await DossierEtudiant.findAndCountAll({
          include: [{
            association: DossierEtudiant.associations.coursParticipants,
            required: false,
            include: [{
              association: CoursParticipant.associations.cours,
              where: { parcoursId: Number(id) },
              required: false
            }]
          }]
        });
        dossiers = dRows;

        const { count: demCount, rows: demRows } = await DemandeInscription.findAndCountAll({
          include: [{
            association: DemandeInscription.associations.parcoursChoisis,
            where: { choixFinal: true, parcoursId: Number(id) },
            required: true
          }, {
            association: DemandeInscription.associations.session,
            where: { anneeAcademiqueId: Number(anneeId) },
            required: true
          }, {
            association: DemandeInscription.associations.utilisateur
          }]
        });
        demandes = demRows;

        const { count: borCount, rows: borRows } = await Bordereau.findAndCountAll({
          include: [{
            association: Bordereau.associations.echeance,
            required: true,
            include: [{
              association: Echeance.associations.dossierEtudiant,
              required: true,
              include: [{
                association: DossierEtudiant.associations.coursParticipants,
                required: false,
                include: [{
                  association: CoursParticipant.associations.cours,
                  where: { parcoursId: Number(id) },
                  required: false
                }]
              }]
            }]
          }]
        });
        bordereaux = borRows;
      }

      return res.status(200).json({ dossiers, demandes, bordereaux });
    } catch (error: any) {
      console.error('[HierarchyController.getDetails]', error);
      return res.status(500).json({ success: false, error: error.message || String(error) });
    }
  }
}

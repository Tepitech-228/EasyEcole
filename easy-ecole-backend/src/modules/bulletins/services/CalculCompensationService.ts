import { Mcc } from "../../inscription/models/Mcc";
import { Cours } from "../../inscription/models/Cours";
import { LigneBulletin } from "../models/LigneBulletin";
import { Bulletin } from "../models/Bulletin";
import { CoursParticipant } from "../../inscription/models/CoursParticipant";
import { RegleEvaluation } from "../../inscription/models/RegleEvaluation";
import { Op } from "sequelize";

export interface ResultatCompensation {
    ueId: number
    ueCode: string
    ueLibelle: string
    creditEcts: number
    moyenneUe: number
    estValidee: boolean
    estEliminee: boolean
    compensee: boolean
    ecs: {
        coursId: number
        intitule: string
        moyenne: number | null
        coefficient: number
        estEliminatoire: boolean
        seuilEliminatoire: number | null
        estValide: boolean
    }[]
}

export class CalculCompensationService {

    static async getRegles(parcoursId: number, semestre: string): Promise<Map<string, string>> {
        const regles = await RegleEvaluation.findAll({
            where: { parcoursId, semestre, actif: true }
        });
        const map = new Map<string, string>();
        for (const r of regles) {
            map.set(r.type, r.valeur);
        }
        return map;
    }

    static async calculerCompensation(bulletinId: number, session: string = 'session1'): Promise<{
        ues: ResultatCompensation[]
        moyenneGenerale: number
        creditsValides: number
        totalCredits: number
    }> {
        const bulletin = await Bulletin.findByPk(bulletinId, {
            include: [{ association: Bulletin.associations.lignesBulletins }]
        });
        if (!bulletin) throw new Error("Bulletin non trouvé");

        const regles = await CalculCompensationService.getRegles(Number(bulletin.parcoursId), bulletin.semestre);
        const noteMinimale = parseFloat(regles.get('note_minimale') || '10');
        const seuilEliminatoire = parseFloat(regles.get('seuil_eliminatoire') || '7');
        const compensationActive = regles.get('compensation') === 'true';

        const coursParticipants = await CoursParticipant.findAll({
            where: { cursusApprenantId: bulletin.cursusApprenantId },
            attributes: ['coursId']
        });
        const coursInscritsIds = new Set(coursParticipants.map(cp => String(cp.coursId)));

        const ues = await Cours.findAll({
            where: { parcoursId: bulletin.parcoursId, semestre: bulletin.semestre },
            include: [{
                model: Mcc,
                as: 'mccs',
                where: { session },
                required: false,
                include: [{
                    model: Cours,
                    as: 'cours'
                }]
            }]
        });

        const lignes = bulletin.lignesBulletins || [];
        const ueEntries: { ue: Cours; moyenneUe: number; eliminee: boolean; ecs: ResultatCompensation['ecs'] }[] = [];
        let totalCredits = 0;

        for (const ue of ues) {
            const mccs = (ue as any).mccs || [];
            const ecs: ResultatCompensation['ecs'] = [];
            let sommeNotesCoef = 0;
            let sommeCoef = 0;
            let ueEliminee = false;
            let aDesCoursActifs = false;

            for (const mcc of mccs) {
                const cours = (mcc as any).cours;
                if (cours && !cours.estObligatoire && !coursInscritsIds.has(String(mcc.coursId))) {
                    continue;
                }
                aDesCoursActifs = true;
                const ligne = lignes.find(l => String(l.coursId) === String(mcc.coursId));
                const moyenne = ligne ? ligne.moyenne : null;
                const estValide = moyenne !== null && moyenne >= noteMinimale;

                ecs.push({
                    coursId: Number(mcc.coursId),
                    intitule: (ligne as any)?.cours?.intitule || '',
                    moyenne,
                    coefficient: mcc.coefficient,
                    estEliminatoire: mcc.estEliminatoire,
                    seuilEliminatoire: mcc.seuilEliminatoire,
                    estValide
                });

                if (moyenne !== null) {
                    sommeNotesCoef += moyenne * mcc.coefficient;
                    sommeCoef += mcc.coefficient;
                }

                const seuil = mcc.seuilEliminatoire !== null ? mcc.seuilEliminatoire : seuilEliminatoire;
                if (mcc.estEliminatoire && moyenne !== null && moyenne < seuil) {
                    ueEliminee = true;
                }
            }

            if (aDesCoursActifs) {
                const moyenneUe = sommeCoef > 0 ? sommeNotesCoef / sommeCoef : 0;
                totalCredits += ue.creditEcts || ue.credit || 0;
                ueEntries.push({ ue, moyenneUe, eliminee: ueEliminee, ecs });
            }
        }

        let sommeProduitECTS = 0;
        let sommeECTS = 0;
        for (const e of ueEntries) {
            sommeProduitECTS += e.moyenneUe * (e.ue.creditEcts || e.ue.credit || 0);
            sommeECTS += e.ue.creditEcts || e.ue.credit || 0;
        }
        const moyenneGenerale = sommeECTS > 0 ? sommeProduitECTS / sommeECTS : 0;

        const hasEliminee = ueEntries.some(e => e.eliminee);
        const compensationAppliquee = compensationActive && !hasEliminee && moyenneGenerale >= noteMinimale;

        let creditsValides = 0;
        const resultats: ResultatCompensation[] = [];

        for (const e of ueEntries) {
            const compensee = compensationAppliquee && !e.eliminee && e.moyenneUe < noteMinimale;
            const estValidee = e.eliminee ? false : (compensationAppliquee || e.moyenneUe >= noteMinimale);

            if (estValidee) {
                creditsValides += e.ue.creditEcts || 0;
            }

            resultats.push({
                ueId: Number(e.ue.id),
                ueCode: e.ue.code,
                ueLibelle: e.ue.intitule,
                creditEcts: e.ue.creditEcts || e.ue.credit || 0,
                moyenneUe: e.moyenneUe,
                estValidee,
                estEliminee: e.eliminee,
                compensee,
                ecs: e.ecs
            });
        }

        return {
            ues: resultats,
            moyenneGenerale,
            creditsValides,
            totalCredits
        };
    }
}

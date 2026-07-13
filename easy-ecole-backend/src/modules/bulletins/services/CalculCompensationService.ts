import { Mcc } from "../../inscription/models/Mcc";
import { UniteEnseignement } from "../../inscription/models/UniteEnseignement";
import { LigneBulletin } from "../models/LigneBulletin";
import { Bulletin } from "../models/Bulletin";
import { Op } from "sequelize";

export interface ResultatCompensation {
    ueId: number
    ueCode: string
    ueLibelle: string
    creditEcts: number
    moyenneUe: number
    estValidee: boolean
    estEliminee: boolean
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

    static async calculerCompensation(bulletinId: number): Promise<{
        ues: ResultatCompensation[]
        moyenneGenerale: number
        creditsValides: number
        totalCredits: number
    }> {
        const bulletin = await Bulletin.findByPk(bulletinId, {
            include: [{ association: Bulletin.associations.lignesBulletins }]
        });
        if (!bulletin) throw new Error("Bulletin non trouvé");

        const ues = await UniteEnseignement.findAll({
            where: { parcoursId: bulletin.parcoursId, semestre: bulletin.semestre },
            include: [{
                model: Mcc,
                as: 'mccs',
                where: { session: 'session1' },
                required: false
            }]
        });

        const lignes = bulletin.lignesBulletins || [];
        const resultats: ResultatCompensation[] = [];
        let totalCredits = 0;
        let creditsValides = 0;
        let sommeCoefficients = 0;
        let sommeMoyennesPonderees = 0;

        for (const ue of ues) {
            const mccs = (ue as any).mccs || [];
            const ecs: ResultatCompensation['ecs'] = [];
            let sommeNotesCoef = 0;
            let sommeCoef = 0;
            let ueEliminee = false;

            for (const mcc of mccs) {
                const ligne = lignes.find(l => String(l.coursId) === String(mcc.coursId));
                const moyenne = ligne ? ligne.moyenne : null;
                const estValide = moyenne !== null && moyenne >= 10;

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
                    sommeMoyennesPonderees += moyenne * mcc.coefficient;
                    sommeCoefficients += mcc.coefficient;
                }

                // Vérification note éliminatoire
                if (mcc.estEliminatoire && mcc.seuilEliminatoire !== null && moyenne !== null) {
                    if (moyenne < mcc.seuilEliminatoire) {
                        ueEliminee = true;
                    }
                }
            }

            const moyenneUe = sommeCoef > 0 ? sommeNotesCoef / sommeCoef : 0;
            const estValidee = !ueEliminee && moyenneUe >= 10;

            if (estValidee) {
                creditsValides += ue.creditEcts || 0;
            }
            totalCredits += ue.creditEcts || 0;

            resultats.push({
                ueId: Number(ue.id),
                ueCode: ue.code,
                ueLibelle: ue.libelle,
                creditEcts: ue.creditEcts || 0,
                moyenneUe,
                estValidee,
                estEliminee: ueEliminee,
                ecs
            });
        }

        const moyenneGenerale = sommeCoefficients > 0 ? sommeMoyennesPonderees / sommeCoefficients : 0;

        return {
            ues: resultats,
            moyenneGenerale,
            creditsValides,
            totalCredits
        };
    }
}

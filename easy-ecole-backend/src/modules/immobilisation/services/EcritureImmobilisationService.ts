import { creerEcritureAutomatique } from "../../comptabilite/helpers/ComptabiliteHelper";

export class EcritureImmobilisationService {

    static async ecritureAcquisition(params: {
        immobilisationNom: string;
        montant: number;
        referenceModuleId: string;
    }): Promise<any> {
        return creerEcritureAutomatique({
            journalCode: 'OD',
            compteDebit: '21',
            compteCredit: '404',
            montant: params.montant,
            libelle: `Acquisition ${params.immobilisationNom}`,
            moduleSource: 'immobilisation',
            referenceModuleId: params.referenceModuleId
        });
    }

    static async ecritureAmortissement(params: {
        immobilisationNom: string;
        montant: number;
        annee: number;
        referenceModuleId: string;
    }): Promise<any> {
        return creerEcritureAutomatique({
            journalCode: 'OD',
            compteDebit: '681',
            compteCredit: '281',
            montant: params.montant,
            libelle: `Dotation amortissements ${params.annee} - ${params.immobilisationNom}`,
            moduleSource: 'immobilisation',
            referenceModuleId: params.referenceModuleId
        });
    }

    static async ecritureCession(params: {
        immobilisationNom: string;
        montant: number;
        referenceModuleId: string;
    }): Promise<any> {
        return creerEcritureAutomatique({
            journalCode: 'OD',
            compteDebit: '462',
            compteCredit: '775',
            montant: params.montant,
            libelle: `Cession ${params.immobilisationNom}`,
            moduleSource: 'immobilisation',
            referenceModuleId: params.referenceModuleId
        });
    }

    static async ecritureMiseAuRebut(params: {
        immobilisationNom: string;
        valeurResiduelle: number;
        referenceModuleId: string;
    }): Promise<any> {
        return creerEcritureAutomatique({
            journalCode: 'OD',
            compteDebit: '678',
            compteCredit: '21',
            montant: params.valeurResiduelle,
            libelle: `Mise au rebut ${params.immobilisationNom}`,
            moduleSource: 'immobilisation',
            referenceModuleId: params.referenceModuleId
        });
    }

    static async ecritureInventaire(params: {
        immobilisationNom: string;
        ecart: number;
        referenceModuleId: string;
    }): Promise<any> {
        if (params.ecart >= 0) {
            return creerEcritureAutomatique({
                journalCode: 'OD',
                compteDebit: '21',
                compteCredit: '778',
                montant: Math.abs(params.ecart),
                libelle: `Regularisation inventaire ${params.immobilisationNom}`,
                moduleSource: 'immobilisation',
                referenceModuleId: params.referenceModuleId
            });
        } else {
            return creerEcritureAutomatique({
                journalCode: 'OD',
                compteDebit: '678',
                compteCredit: '21',
                montant: Math.abs(params.ecart),
                libelle: `Moins-value inventaire ${params.immobilisationNom}`,
                moduleSource: 'immobilisation',
                referenceModuleId: params.referenceModuleId
            });
        }
    }
}

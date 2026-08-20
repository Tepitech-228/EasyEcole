import { Transaction } from "sequelize";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { FraisScolarite } from "../models/FraisScolarite";
import { nombreEcheances, ajouterMois, calculerEcheancier } from "./GenerateurEcheancierSessionService";

/**
 * Génère (et enregistre) l'échéancier de SCOLARITÉ d'un dossier étudiant à partir
 * du paramétrage de l'administration (FraisScolarite lié à la session) :
 *
 *   - modalité '1x'  : 1 échéance du montant total, 1ère échéance au mois suivant
 *   - modalité '3x'  : 3 échéances quasi-égales (la dernière absorbe le reste pour
 *                      que la somme corresponde exactement au total), mois suivants
 *                      J+1, J+2, J+3
 *   - modalité '10x' : 10 échéances mensuelles (J+1 à J+10), moisConcerne = 'AAAA-MM'
 *
 * Chaque échéance est de type 'scolarite', statut 'impaye', devise 'XAF'.
 * Le montant de référence est le `montant` du FraisScolarite (source de vérité).
 *
 * NOTE (idempotence) : ce service ne supprime jamais les échéances existantes.
 * La suppression sélective des échéances 'scolarite' impayées appartient à
 * l'appelant (validerBordereau), garant de l'absence de duplication.
 */
export class GenerateurEcheancierScolariteService {

    static async generer(
        dossier: DossierEtudiant,
        fraisScolarite: FraisScolarite,
        transaction?: Transaction,
    ): Promise<Echeance[]> {
        const montantTotal = fraisScolarite.montant;
        if (!Number.isFinite(montantTotal) || montantTotal <= 0) {
            throw new Error("Montant de scolarité introuvable ou invalide pour générer l'échéancier de scolarité");
        }

        const { nb: nbEcheances, montantStandard, montantDerniere } = calculerEcheancier(montantTotal, fraisScolarite.modalite)
        const jourReference = new Date();
        const echeances: Echeance[] = [];

        for (let i = 0; i < nbEcheances; i++) {
            const dateLimite = ajouterMois(jourReference, i + 1);

            const echeance = new Echeance();
            echeance.dossierEtudiantId = dossier.id;
            echeance.type = 'scolarite';
            echeance.numeroEcheance = i + 1;
            echeance.montant = i === nbEcheances - 1 ? montantDerniere : montantStandard;
            echeance.devise = 'XAF';
            echeance.dateLimite = dateLimite;
            echeance.statut = 'impaye';
            echeance.moisConcerne = `${dateLimite.getFullYear()}-${String(dateLimite.getMonth() + 1).padStart(2, '0')}`;

            await echeance.save({ transaction });
            echeances.push(echeance);
        }

        return echeances;
    }
}

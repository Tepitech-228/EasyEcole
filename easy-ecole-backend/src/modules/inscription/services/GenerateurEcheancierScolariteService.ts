import { Transaction } from "sequelize";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { FraisScolarite, ModaliteScolarite } from "../models/FraisScolarite";

/**
 * Nombre d'échéances de scolarité selon la modalité :
 *   '1x'  → 1 versement unique
 *   '3x'  → 3 versements
 *   '10x' → 10 mensualités
 */
export const nombreEcheances = (modalite: ModaliteScolarite): number =>
    modalite === '1x' ? 1 : modalite === '3x' ? 3 : 10;

/**
 * Ajoute `nbMois` mois à une date en conservant le même jour du mois.
 * Gère les mois courts : le 31 janvier + 1 mois = 28/29 février (pas le 3 mars).
 * Même logique que celle utilisée pour l'échéancier d'inscription, mais recopiée
 * localement pour rester indépendant des évolutions de GenerateurEcheancierService.
 */
function ajouterMois(date: Date, nbMois: number): Date {
    const premierJourCible = new Date(date.getFullYear(), date.getMonth() + nbMois, 1);
    const dernierJourMoisCible = new Date(premierJourCible.getFullYear(), premierJourCible.getMonth() + 1, 0).getDate();
    const jourCible = Math.min(date.getDate(), dernierJourMoisCible);
    return new Date(premierJourCible.getFullYear(), premierJourCible.getMonth(), jourCible);
}

const arrondir = (montant: number): number => Math.round(montant * 100) / 100;

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
        if (typeof montantTotal !== 'number' || !Number.isFinite(montantTotal) || montantTotal <= 0) {
            throw new Error("Montant de scolarité introuvable ou invalide pour générer l'échéancier de scolarité");
        }

        const nb = nombreEcheances(fraisScolarite.modalite);
        const montantStandard = arrondir(montantTotal / nb);
        // La dernière échéance absorbe le reste pour que la somme = montant exact.
        const montantDerniere = arrondir(montantTotal - montantStandard * (nb - 1));

        const jourReference = new Date();
        const echeances: Echeance[] = [];

        for (let i = 0; i < nb; i++) {
            // Règle A2 : la 1ère échéance de scolarité est exigible au mois SUIVANT
            // le mois courant (décalage +1 mois), puis un mois par échéance.
            const dateLimite = ajouterMois(jourReference, i + 1);

            const echeance = new Echeance();
            echeance.dossierEtudiantId = dossier.id;
            echeance.type = 'scolarite';
            echeance.numeroEcheance = i + 1;
            echeance.montant = i === nb - 1 ? montantDerniere : montantStandard;
            echeance.devise = 'XAF';
            echeance.dateLimite = dateLimite;
            echeance.statut = 'impaye';
            // Format court 'AAAA-MM' (ex: '2026-09'), même format que les échéances
            // de scolarité historiques (mais avec un rollover correct des mois : 12 → 01).
            echeance.moisConcerne = `${dateLimite.getFullYear()}-${String(dateLimite.getMonth() + 1).padStart(2, '0')}`;

            await echeance.save({ transaction });
            echeances.push(echeance);
        }

        return echeances;
    }
}
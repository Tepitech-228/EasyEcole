import { Transaction } from "sequelize";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { nombreEcheances, ajouterMois, calculerEcheancier } from "./GenerateurEcheancierSessionService";

/**
 * Modalités de paiement supportées pour l'échéancier d'inscription.
 */
export type ModalitePaiement = '1x' | '3x' | '10x';

export const MODALITES_PAIEMENT: readonly ModalitePaiement[] = ['1x', '3x', '10x'] as const;

/**
 * Vérifie qu'une valeur brute (body / query) est une modalité valide.
 */
export const estModalitePaiement = (value: unknown): value is ModalitePaiement =>
    typeof value === 'string' && (MODALITES_PAIEMENT as readonly string[]).includes(value);

/**
 * Conversion d'une valeur brute en modalité (retourne '1x' par défaut si invalide).
 * À n'utiliser que lorsqu'une valeur par défaut est acceptable (ex: ancien
 * bordereau sans modalité).
 */
export const normaliserModalite = (value: unknown): ModalitePaiement =>
    estModalitePaiement(value) ? value : '1x';

const MOIS_FRANCAIS: readonly string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

/**
 * Génère (et enregistre) l'échéancier d'inscription d'un dossier étudiant selon
 * la modalité de paiement :
 *
 * Règle métier A1 : aucun paiement ne doit être considéré comme en retard à
 * l'inscription. Le premier paiement débute un mois après le jour J de la
 * validation (au mois suivant). Toutes les échéances sont donc décalées de +1
 * mois par rapport à J.
 *
 *   - '1x'  : 1 échéance du montant total, échue J+1 mois (moisConcerne = null)
 *   - '3x'  : 3 échéances quasi-égales (la dernière absorbe le reste pour que la
 *             somme corresponde exactement au total), échues J+1, J+2 et J+3 mois
 *   - '10x' : 10 échéances mensuelles (J+1 mois à J+10 mois), moisConcerne = nom du mois
 *
 * Chaque échéance est de type 'inscription', statut 'impaye', devise 'XAF'.
 *
 * Le montant total est prioritairement lu sur le champ `montant` du dossier
 * (s'il existe — pas de champ dédié sur DossierEtudiant à ce jour), sinon il
 * doit être fourni via `montantTotal`. Si aucun montant exploitable n'est
 * trouvé, une erreur est levée (l'appelant la traduit en HTTP 400).
 *
 * NOTE (idempotence) : ce service ne supprime jamais les échéances existantes.
 * La suppression sélective (échéances 'inscription' impayées uniquement) et la
 * purge éventuelle relèvent de la responsabilité de l'appelant, qui doit garantir
 * qu'on ne duplique jamais un échéancier en cours de paiement.
 */
export class GenerateurEcheancierService {

    static async generer(
        dossier: DossierEtudiant,
        modalite: ModalitePaiement,
        transaction?: Transaction,
        montantTotalParam?: number,
    ): Promise<Echeance[]> {
        const montantDossier = (dossier as any).montant;
        const montantTotal = typeof montantDossier === 'number' && Number.isFinite(montantDossier) && montantDossier > 0
            ? montantDossier
            : montantTotalParam;

        if (typeof montantTotal !== 'number' || !Number.isFinite(montantTotal) || montantTotal <= 0) {
            throw new Error("Montant total introuvable pour générer l'échéancier d'inscription");
        }

        const { nb: nbEcheances, montantStandard, montantDerniere } = calculerEcheancier(montantTotal, modalite)
        const jourJ = new Date()
        const echeances: Echeance[] = [];

        for (let i = 0; i < nbEcheances; i++) {
            const dateLimite = ajouterMois(jourJ, i + 1);

            const echeance = new Echeance();
            echeance.dossierEtudiantId = dossier.id;
            echeance.type = 'inscription';
            echeance.numeroEcheance = i + 1;
            echeance.montant = i === nbEcheances - 1 ? montantDerniere : montantStandard;
            echeance.devise = 'XAF';
            echeance.dateLimite = dateLimite;
            echeance.statut = 'impaye';
            echeance.moisConcerne = modalite === '1x'
                ? (null as any)
                : `${MOIS_FRANCAIS[dateLimite.getMonth()]} ${dateLimite.getFullYear()}`;

            await echeance.save({ transaction });
            echeances.push(echeance);
        }

        return echeances;
    }
}
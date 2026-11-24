import { Transaction } from "sequelize";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { Echeance } from "../models/Echeance";
import { FraisScolarite } from "../models/FraisScolarite";
import { genererEcheancesSession } from "./GenerateurEcheancierSessionService";

/**
 * Génère (et enregistre) l'échéancier de SCOLARITÉ d'un dossier étudiant à partir
 * du paramétrage de l'administration (FraisScolarite lié à la session) :
 *
 *   - session avec date de fin : une échéance mensuelle, du mois suivant le début
 *     jusqu'au mois de fin inclus ;
 *   - sans date de fin : nombre d'échéances selon la modalité configurée.
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
        dateDebutSession?: Date | string,
        dateFinSession?: Date | string,
    ): Promise<Echeance[]> {
        const montantTotal = fraisScolarite.montant;
        if (!Number.isFinite(montantTotal) || montantTotal <= 0) {
            throw new Error("Montant de scolarité introuvable ou invalide pour générer l'échéancier de scolarité");
        }

        const echeancesSession = genererEcheancesSession({
            dateDebut: dateDebutSession ?? dossier.demarrageParcours ?? new Date(),
            dateFin: dateFinSession,
            montantTotal,
            modalite: fraisScolarite.modalite,
            type: 'scolarite',
        });
        const echeances: Echeance[] = [];

        for (const echeanceSession of echeancesSession) {
            const echeance = new Echeance();
            echeance.dossierEtudiantId = dossier.id;
            echeance.type = echeanceSession.type;
            echeance.numeroEcheance = echeanceSession.numeroEcheance;
            echeance.montant = echeanceSession.montant;
            echeance.devise = 'XAF';
            echeance.dateLimite = echeanceSession.dateLimite;
            echeance.statut = echeanceSession.statut;
            echeance.moisConcerne = echeanceSession.moisConcerne
                ?? `${echeanceSession.dateLimite.getFullYear()}-${String(echeanceSession.dateLimite.getMonth() + 1).padStart(2, '0')}`;

            await echeance.save({ transaction });
            echeances.push(echeance);
        }

        return echeances;
    }
}

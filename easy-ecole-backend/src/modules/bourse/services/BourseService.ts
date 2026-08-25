import { Op } from "sequelize";
import { BourseConfiguration } from "../models/BourseConfiguration";
import { BourseAttribution } from "../models/BourseAttribution";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { Echeance } from "../../inscription/models/Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";

/**
 * BourseService — Logique métier des bourses.
 *
 * RÈGLE ABSOLUE :
 *  La bourse s'applique UNIQUEMENT aux frais de scolarité.
 *  Les frais d'inscription ne sont JAMAIS réduits.
 *
 *  Calcul : montantBourse = fraisScolarite × taux / 100
 *
 * INTÉGRATION PAIEMENTS :
 *  Au moment de l'attribution, les échéances scolarité impayées/partielles
 *  sont directement réduites du taux de bourse. Le montant original est
 *  conservé dans `montantOriginal` pour permettre la restauration en cas
 *  de suspension, réactivation ou modification.
 *
 *  Le FIFO (ImputationService) traite naturellement les montants réduits,
 *  ce qui garantit que l'étudiant ne paie que le reste effective.
 */
export class BourseService {

    // ══════════════════════════════════════════════════════════════
    // HELPERS PRIVÉS — Application / Restauration des montants
    // ══════════════════════════════════════════════════════════════

    /**
     * Applique la réduction de bourse sur les échéances scolarité
     * impayées/partielles/en_retard d'un dossier.
     *
     * Pour chaque échéance :
     *  - Si montantOriginal est déjà défini → on recalcule depuis l'original
     *  - Sinon → on stocke l'actuel comme original avant réduction
     *  - Nouveau montant = original × (1 - taux/100)
     *  - Garde-fou : montant ne descend jamais sous montantPaye
     *    (un paiement partiel antérieur ne peut être "perdu")
     *
     * @returns nombre d'échéances modifiées
     */
    private static async appliquerBourseSurEcheances(
        dossierEtudiantId: number,
        taux: number,
    ): Promise<number> {
        const echeances = await Echeance.findAll({
            where: {
                dossierEtudiantId,
                type: 'scolarite',
                statut: { [Op.in]: ['impaye', 'partiel', 'en_retard'] },
            },
        });

        let modifiees = 0;
        const tauxReduction = taux / 100; // ex: 20 → 0.20

        for (const e of echeances) {
            // Déterminer le montant original
            const original = (e as any).montantOriginal != null
                ? (e as any).montantOriginal
                : e.montant;

            const nouveauMontant = Math.round(original * (1 - tauxReduction) * 100) / 100;

            // Garde-fou : ne jamais descendre sous le montant déjà payé
            const montantPaye = e.montantPaye || 0;
            const montantFinal = Math.max(nouveauMontant, montantPaye);

            if (montantFinal !== e.montant) {
                (e as any).montantOriginal = original;
                e.montant = montantFinal;
                await e.save();
                modifiees++;
            } else if ((e as any).montantOriginal == null && e.montant === montantFinal) {
                // Pas de réduction nécessaire (montantPaye > nouveauMontant)
                // mais on stocke quand même l'original pour traçabilité
                (e as any).montantOriginal = original;
                await e.save();
            }
        }

        return modifiees;
    }

    /**
     * Restaure les montants originaux des échéances scolarité
     * d'un dossier (supprime l'effet de la bourse).
     *
     * Utilisé lors de la suspension, de l'expiration ou de la
     * modification du taux de bourse.
     *
     * @returns nombre d'échéances restaurées
     */
    private static async restaurerEcheancesOriginales(
        dossierEtudiantId: number,
    ): Promise<number> {
        const echeances = await Echeance.findAll({
            where: {
                dossierEtudiantId,
                type: 'scolarite',
                montantOriginal: { [Op.ne]: null },
            },
        });

        let restaurees = 0;

        for (const e of echeances) {
            const original = (e as any).montantOriginal;
            if (original != null && original !== e.montant) {
                e.montant = original;
                (e as any).montantOriginal = null;
                await e.save();
                restaurees++;
            } else if (original != null) {
                // montant == original → rien à restaurer, on nettoie juste le flag
                (e as any).montantOriginal = null;
                await e.save();
            }
        }

        return restaurees;
    }

    /**
     * Réapplique la bourse sur un dossier ( restaurer → appliquer).
     * Utile lors d'un changement de taux ou de réactivation.
     */
    private static async reappliquerBourse(
        dossierEtudiantId: number,
        nouveauTaux: number,
    ): Promise<void> {
        await this.restaurerEcheancesOriginales(dossierEtudiantId);
        await this.appliquerBourseSurEcheances(dossierEtudiantId, nouveauTaux);
    }

    // ══════════════════════════════════════════════════════════════
    // 1. BOURSE ACTIVE
    // ══════════════════════════════════════════════════════════════

    /**
     * Récupère la bourse active d'un dossier étudiant.
     * Si aucune bourse → objet avec statut "Aucune" et taux=0.
     */
    static async getBourseActive(dossierEtudiantId: number): Promise<any> {
        const attribution = await BourseAttribution.findOne({
            where: {
                dossierEtudiantId,
                statut: 'ACTIVE',
            },
            include: [
                { model: BourseConfiguration, as: 'configuration' },
                { model: Utilisateur, as: 'validePar', attributes: ['id', 'nom', 'prenoms', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        if (!attribution) {
            return {
                aBourse: false,
                statutLabel: 'Non boursier',
                configuration: null,
                type: null,
                taux: 0,
                attribution: null,
            };
        }

        return {
            aBourse: true,
            statutLabel: 'Boursier',
            configuration: attribution.configuration,
            type: attribution.type,
            taux: parseFloat(attribution.taux as any),
            attribution,
        };
    }

    // ══════════════════════════════════════════════════════════════
    // 2. ATTRIBUTION
    // ══════════════════════════════════════════════════════════════

    /**
     * Attribue une bourse à un étudiant.
     * Vérifie :
     *  - Le dossier existe
     *  - La configuration existe et est ACTIVE
     *  - Pas de bourse ACTIVE déjà en cours (une seule par étudiant)
     *
     * EFFET PAIEMENT :
     *  Les échéances scolarité impayées/partielles sont réduites
     *  du taux de bourse. Le FIFO traitera les montants réduits.
     */
    static async attribuer(
        dossierEtudiantId: number,
        configurationId: number,
        dateDebut: string,
        dateFin: string | null,
        motif: string | null,
        valideParId: number
    ): Promise<any> {
        // Vérifier le dossier
        const dossier = await DossierEtudiant.findByPk(dossierEtudiantId);
        if (!dossier) {
            throw new Error(`Dossier étudiant #${dossierEtudiantId} non trouvé`);
        }

        // Vérifier la configuration
        const config = await BourseConfiguration.findByPk(configurationId);
        if (!config) {
            throw new Error(`Configuration de bourse #${configurationId} non trouvée`);
        }
        if (config.statut !== 'ACTIVE') {
            throw new Error(`La configuration "${config.nom}" est désactivée. Activez-la avant de l'attribuer.`);
        }

        // Vérifier qu'il n'y a pas déjà une bourse ACTIVE
        const bourseExistante = await BourseAttribution.findOne({
            where: {
                dossierEtudiantId,
                statut: 'ACTIVE',
            }
        });
        if (bourseExistante) {
            throw new Error(`Cet étudiant a déjà une bourse active (bourse #${bourseExistante.id}). Suspendez-la d'abord avant d'en attribuer une nouvelle.`);
        }

        // Créer l'attribution
        const attribution = await BourseAttribution.create({
            dossierEtudiantId,
            configurationId,
            type: config.type,
            taux: config.taux,
            dateDebut: new Date(dateDebut),
            dateFin: dateFin ? new Date(dateFin) : null,
            motif,
            valideParId,
            statut: 'ACTIVE',
        });

        // ── Appliquer la bourse sur les échéances scolarité ──
        const taux = parseFloat(config.taux as any);
        const nbModifiees = await this.appliquerBourseSurEcheances(dossierEtudiantId, taux);
        if (nbModifiees > 0) {
            console.log(`[BourseService] ${nbModifiees} échéance(s) scolarité réduite(s) de ${taux}% pour le dossier #${dossierEtudiantId}`);
        }

        // Recharger avec les associations
        const result = await BourseAttribution.findByPk(attribution.id, {
            include: [
                { model: BourseConfiguration, as: 'configuration' },
                { model: Utilisateur, as: 'validePar', attributes: ['id', 'nom', 'prenoms', 'email'] },
            ],
        });

        return result;
    }

    // ══════════════════════════════════════════════════════════════
    // 3. MODIFICATION
    // ══════════════════════════════════════════════════════════════

    /**
     * Modifie une attribution de bourse.
     * Si la configuration (et donc le taux) change, les échéances
     * sont restaurées puis réappliquées avec le nouveau taux.
     */
    static async modifier(id: number, data: { configurationId?: number; dateDebut?: string; dateFin?: string | null; motif?: string | null }): Promise<any> {
        const attribution = await BourseAttribution.findByPk(id);
        if (!attribution) {
            throw new Error('Attribution de bourse non trouvée');
        }

        let nouveauTaux = parseFloat(attribution.taux as any);

        // Si changement de configuration, recalculer le taux
        if (data.configurationId && data.configurationId !== attribution.configurationId) {
            const config = await BourseConfiguration.findByPk(data.configurationId);
            if (!config) {
                throw new Error('Configuration de bourse non trouvée');
            }
            if (config.statut !== 'ACTIVE') {
                throw new Error(`La configuration "${config.nom}" est désactivée`);
            }
            attribution.type = config.type;
            attribution.taux = config.taux;
            attribution.configurationId = config.id;
            nouveauTaux = parseFloat(config.taux as any);
        }

        if (data.dateDebut) attribution.dateDebut = new Date(data.dateDebut);
        if (data.dateFin !== undefined) attribution.dateFin = data.dateFin ? new Date(data.dateFin) : null;
        if (data.motif !== undefined) attribution.motif = data.motif;

        await attribution.save();

        // Si la bourse est ACTIVE et le taux a changé → réappliquer
        if (attribution.statut === 'ACTIVE') {
            await this.reappliquerBourse(attribution.dossierEtudiantId, nouveauTaux);
            console.log(`[BourseService] Bourse #${id} modifiée → échéances réappliquées avec taux ${nouveauTaux}%`);
        }

        return BourseAttribution.findByPk(id, {
            include: [
                { model: BourseConfiguration, as: 'configuration' },
                { model: Utilisateur, as: 'validePar', attributes: ['id', 'nom', 'prenoms', 'email'] },
            ],
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 4. SUSPENSION / RÉACTIVATION
    // ══════════════════════════════════════════════════════════════

    /**
     * Suspend une bourse : restaure les montants originaux des échéances
     * avant de marquer la bourse comme SUSPENDUE.
     */
    static async suspendre(id: number, motif: string | null): Promise<any> {
        const attribution = await BourseAttribution.findByPk(id);
        if (!attribution) {
            throw new Error('Attribution de bourse non trouvée');
        }

        // ── Restaurer les montants originaux AVANT suspension ──
        const nbRestaurees = await this.restaurerEcheancesOriginales(attribution.dossierEtudiantId);
        if (nbRestaurees > 0) {
            console.log(`[BourseService] ${nbRestaurees} échéance(s) restaurée(s) suite à la suspension de la bourse #${id}`);
        }

        attribution.statut = 'SUSPENDUE';
        if (motif) attribution.motif = motif;
        await attribution.save();
        return attribution;
    }

    /**
     * Réactive une bourse : applique la réduction sur les échéances
     * après avoir marqué la bourse comme ACTIVE.
     */
    static async reactiver(id: number): Promise<any> {
        const attribution = await BourseAttribution.findByPk(id);
        if (!attribution) {
            throw new Error('Attribution de bourse non trouvée');
        }
        if (attribution.statut === 'EXPIREE') {
            throw new Error('Impossible de réactiver une bourse expirée');
        }

        // Vérifier qu'il n'y a pas déjà une autre bourse ACTIVE sur le même dossier
        const autreActive = await BourseAttribution.findOne({
            where: {
                dossierEtudiantId: attribution.dossierEtudiantId,
                statut: 'ACTIVE',
                id: { [Op.ne]: id },
            }
        });
        if (autreActive) {
            throw new Error('Cet étudiant a déjà une autre bourse active. Suspendez-la d\'abord.');
        }

        attribution.statut = 'ACTIVE';
        await attribution.save();

        // ── Appliquer la bourse sur les échéances ──
        const taux = parseFloat(attribution.taux as any);
        const nbModifiees = await this.appliquerBourseSurEcheances(attribution.dossierEtudiantId, taux);
        if (nbModifiees > 0) {
            console.log(`[BourseService] ${nbModifiees} échéance(s) réduite(s) de ${taux}% suite à la réactivation de la bourse #${id}`);
        }

        return attribution;
    }

    // ══════════════════════════════════════════════════════════════
    // 5. HISTORIQUE
    // ══════════════════════════════════════════════════════════════

    static async getHistorique(dossierEtudiantId: number): Promise<any[]> {
        return BourseAttribution.findAll({
            where: { dossierEtudiantId },
            include: [
                { model: BourseConfiguration, as: 'configuration' },
                { model: Utilisateur, as: 'validePar', attributes: ['id', 'nom', 'prenoms', 'email'] },
            ],
            order: [['createdAt', 'DESC']],
        });
    }

    // ══════════════════════════════════════════════════════════════
    // 6. RÉSUMÉ FINANCIER (avec bourse intégrée)
    // ══════════════════════════════════════════════════════════════

    /**
     * Calcule le résumé financier d'un étudiant en intégrant la bourse.
     *
     * RÈGLE ABSOLUE :
     *  - La bourse ne concerne JAMAIS les frais d'inscription
     *  - montantBourse = fraisScolarite × taux / 100
     *  - resteScolarite = fraisScolarite - montantBourse
     *  - totalRestant = fraisInscription + resteScolarite - totalPaye
     *
     * NOTE : puisque les montants des échéances scolarité ont déjà été
     * réduits au moment de l'attribution, `totalScolarite` reflète déjà
     * le montant après bourse. Le calcul `montantBourse` est repris
     * depuis les montants originaux pour affichage.
     */
    static async getResumeFinancier(dossierEtudiantId: number): Promise<any> {
        const dossier = await DossierEtudiant.findByPk(dossierEtudiantId, {
            include: [
                { model: Echeance, as: 'echeances' },
            ],
        });

        if (!dossier) {
            throw new Error('Dossier étudiant non trouvé');
        }

        // Récupérer la bourse active
        const bourse = await this.getBourseActive(dossierEtudiantId);

        // Calculer les totaux depuis les échéances
        const echeances = (dossier as any).echeances || [];
        let totalInscription = 0;
        let totalScolarite = 0;
        let totalScolariteOriginal = 0;
        let totalPaye = 0;

        for (const e of echeances) {
            const montant = parseFloat(e.montant) || 0;
            const paye = parseFloat(e.montantPaye) || 0;
            const original = e.montantOriginal != null
                ? parseFloat(e.montantOriginal)
                : montant;

            if (e.type === 'inscription') {
                totalInscription += montant;
            } else if (e.type === 'scolarite') {
                totalScolarite += montant;
                totalScolariteOriginal += original;
            }
            totalPaye += paye;
        }

        // Calcul de la bourse (basé sur les montants ORIGINAUX de la scolarité)
        const tauxBourse = bourse.aBourse ? bourse.taux : 0;
        const montantBourse = totalScolariteOriginal * tauxBourse / 100;

        // Les frais d'inscription ne sont JAMAIS réduits
        const resteInscription = totalInscription;

        // Reste de scolarité après bourse (totalScolarite contient déjà les montants réduits)
        const resteScolarite = totalScolarite;

        // Total restant à payer
        const totalRestant = resteInscription + resteScolarite - totalPaye;

        return {
            dossierEtudiantId,
            matricule: dossier.matricule,
            fraisScolarite: totalScolariteOriginal,
            fraisInscription: totalInscription,
            bourse: {
                aBourse: bourse.aBourse,
                statutLabel: bourse.statutLabel,
                configuration: bourse.configuration,
                type: bourse.type,
                taux: tauxBourse,
                montantBourse,
            },
            fraisScolariteApresBourse: totalScolarite,
            resteScolarite,
            resteInscription,
            totalPaye,
            totalRestant: Math.max(0, totalRestant),
        };
    }

    // ══════════════════════════════════════════════════════════════
    // 7. EXPIRATION AUTOMATIQUE
    // ══════════════════════════════════════════════════════════════

    /**
     * Marque comme EXPIRÉES les bourses dont la dateFin est dépassée.
     * Restaure les montants originaux des échéances concernées.
     * À appeler au démarrage du serveur ou via un cron.
     */
    static async expirerBourses(): Promise<number> {
        // Récupérer les bourses qui vont expirer
        const boursesExpirant = await BourseAttribution.findAll({
            where: {
                [Op.and]: [
                    { statut: 'ACTIVE' },
                    { dateFin: { [Op.lt]: new Date() } },
                    { dateFin: { [Op.ne]: null } },
                ],
            } as any,
        });

        let count = 0;

        for (const bourse of boursesExpirant) {
            // ── Restaurer les montants originaux ──
            const nbRestaurees = await this.restaurerEcheancesOriginales(bourse.dossierEtudiantId);
            if (nbRestaurees > 0) {
                console.log(`[BourseService] ${nbRestaurees} échéance(s) restaurée(s) pour expiration de la bourse #${bourse.id}`);
            }

            bourse.statut = 'EXPIREE';
            await bourse.save();
            count++;
        }

        if (count > 0) {
            console.log(`[BourseService] ${count} bourse(s) expirée(s) automatiquement`);
        }
        return count;
    }
}

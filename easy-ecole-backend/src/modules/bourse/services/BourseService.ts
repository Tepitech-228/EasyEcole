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
 */
export class BourseService {

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

    static async modifier(id: number, data: { configurationId?: number; dateDebut?: string; dateFin?: string | null; motif?: string | null }): Promise<any> {
        const attribution = await BourseAttribution.findByPk(id);
        if (!attribution) {
            throw new Error('Attribution de bourse non trouvée');
        }

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
        }

        if (data.dateDebut) attribution.dateDebut = new Date(data.dateDebut);
        if (data.dateFin !== undefined) attribution.dateFin = data.dateFin ? new Date(data.dateFin) : null;
        if (data.motif !== undefined) attribution.motif = data.motif;

        await attribution.save();

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

    static async suspendre(id: number, motif: string | null): Promise<any> {
        const attribution = await BourseAttribution.findByPk(id);
        if (!attribution) {
            throw new Error('Attribution de bourse non trouvée');
        }
        attribution.statut = 'SUSPENDUE';
        if (motif) attribution.motif = motif;
        await attribution.save();
        return attribution;
    }

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
        let totalPaye = 0;

        for (const e of echeances) {
            const montant = parseFloat(e.montant) || 0;
            const paye = parseFloat(e.montantPaye) || 0;

            if (e.type === 'inscription') {
                totalInscription += montant;
            } else if (e.type === 'scolarite') {
                totalScolarite += montant;
            }
            totalPaye += paye;
        }

        // Calcul de la bourse (UNIQUEMENT sur la scolarité)
        const tauxBourse = bourse.aBourse ? bourse.taux : 0;
        const montantBourse = totalScolarite * tauxBourse / 100;

        // Les frais d'inscription ne sont JAMAIS réduits
        const resteInscription = totalInscription;

        // Reste de scolarité après bourse
        const resteScolarite = totalScolarite - montantBourse;

        // Total restant à payer
        const totalRestant = resteInscription + resteScolarite - totalPaye;

        return {
            dossierEtudiantId,
            matricule: dossier.matricule,
            fraisScolarite: totalScolarite,
            fraisInscription: totalInscription,
            bourse: {
                aBourse: bourse.aBourse,
                statutLabel: bourse.statutLabel,
                configuration: bourse.configuration,
                type: bourse.type,
                taux: tauxBourse,
                montantBourse,
            },
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
     * À appeler au démarrage du serveur ou via un cron.
     */
    static async expirerBourses(): Promise<number> {
        const [count] = await BourseAttribution.update(
            { statut: 'EXPIREE' as const },
            {
                where: {
                    [Op.and]: [
                        { statut: 'ACTIVE' },
                        { dateFin: { [Op.lt]: new Date() } },
                        { dateFin: { [Op.ne]: null } },
                    ],
                } as any
            }
        );
        if (count > 0) {
            console.log(`[BourseService] ${count} bourse(s) expirée(s) automatiquement`);
        }
        return count;
    }
}

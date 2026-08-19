import { Request, Response } from "express";
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Echeance } from "../models/Echeance";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { GenerateurEcheancierService, estModalitePaiement, ModalitePaiement } from "../services/GenerateurEcheancierService";
import { VerificationPaiementService } from "../services/VerificationPaiementService";
import { Apprenant } from "../../auth/models/Apprenant";
import { ParentEnfant } from "../../parent/models/ParentEnfant";

export default class EcheanceController {

    constructor() { }

    static async getAllEcheances(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Echeance>> = {
            include: [Echeance.associations.dossierEtudiant]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.include = [{
                association: Echeance.associations.dossierEtudiant,
                where: { utilisateurId: (req as any).utilisateurId }
            }]
        }

        if (req.query.dossierEtudiantId) {
            options.where = { dossierEtudiantId: req.query.dossierEtudiantId as string }
        }

        if (req.query.statut) {
            options.where = { ...options.where, statut: req.query.statut as string }
        }

        try {
            let echeances: Echeance[];
            echeances = await Echeance.findAll(options);

            return res.status(200).send(echeances);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getEcheance(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Echeance>> = {
            where: { id: req.params.id },
            include: [Echeance.associations.dossierEtudiant]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.include = [{
                association: Echeance.associations.dossierEtudiant,
                where: { utilisateurId: (req as any).utilisateurId }
            }]
        }

        try {
            const echeance: Echeance | null = await Echeance.findOne(options);

            if (echeance == null)
                return res.status(404).json({ success: false, message: "Échéance non trouvée" });

            return res.status(200).send(echeance);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createEcheance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const dossier = await DossierEtudiant.findByPk(req.body.dossierEtudiantId)
        if (dossier == null) {
            return res.status(404).json({ success: false, message: "Dossier étudiant non trouvé" });
        }

        let echeance: Echeance = new Echeance();
        echeance.dossierEtudiantId = req.body.dossierEtudiantId
        echeance.type = req.body.type
        echeance.numeroEcheance = req.body.numeroEcheance
        echeance.montant = req.body.montant
        echeance.devise = req.body.devise ?? 'XAF'
        echeance.dateLimite = req.body.dateLimite
        echeance.datePaiement = req.body.datePaiement ?? null
        echeance.statut = req.body.statut ?? 'impaye'
        echeance.moisConcerne = req.body.moisConcerne ?? null

        await echeance.save()
            .then(async (echeance) => {
                return res.status(201).send(echeance);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateEcheance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let echeance: Echeance | null = await Echeance.findByPk(req.params.id);
        if (echeance != null) {
            await echeance.update({
                type: req.body.type ?? echeance.type,
                montant: req.body.montant ?? echeance.montant,
                dateLimite: req.body.dateLimite ?? echeance.dateLimite,
                statut: req.body.statut ?? echeance.statut,
                moisConcerne: req.body.moisConcerne ?? echeance.moisConcerne,
            })
                .then(async (echeance) => {
                    return res.status(200).send(echeance);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Échéance non trouvée" });
        }

        return null
    }

    static async deleteEcheance(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let echeance: Echeance | null = await Echeance.findByPk(req.params.id);
        if (echeance) {
            await echeance.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Échéance supprimée" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Échéance non trouvée" });
        }

        return null
    }

    static async genererEcheances(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        const dossier: DossierEtudiant | null = await DossierEtudiant.findByPk(req.params.dossierEtudiantId)
        if (dossier == null) {
            return res.status(404).json({ success: false, message: "Dossier étudiant non trouvé" });
        }

        // ── Nouveau comportement (chantier 1x/3x/10x) : génération de l'échéancier
        //    d'inscription selon la modalité fournie dans le body ──────────────────
        //    Idempotent : on supprime d'abord les échéances d'inscription impayées.
        //    S'il reste une échéance d'inscription PAYÉE, on refuse (400) : un
        //    échéancier déjà en cours de paiement ne peut pas être régénéré.
        const modalite = req.body?.modalite
        if (modalite) {
            if (!estModalitePaiement(modalite)) {
                return res.status(400).json({ success: false, message: "Modalité invalide (doit être '1x', '3x' ou '10x')" });
            }

            const echeanceInscriptionPayee = await Echeance.findOne({
                where: { dossierEtudiantId: dossier.id, type: 'inscription', statut: 'paye' }
            })
            if (echeanceInscriptionPayee) {
                return res.status(400).json({ success: false, message: "Échéancier déjà en cours de paiement" });
            }

            // Suppression des échéances d'inscription impayées existantes (pas de doublon)
            await Echeance.destroy({
                where: { dossierEtudiantId: dossier.id, type: 'inscription', statut: ['impaye', 'en_retard'] }
            })

            const montantDossier = (dossier as any).montant
            const montantTotal = typeof montantDossier === 'number' && montantDossier > 0
                ? montantDossier
                : req.body?.montantTotal

            if (typeof montantTotal !== 'number' || !Number.isFinite(montantTotal) || montantTotal <= 0) {
                return res.status(400).json({ success: false, message: "Montant total requis (montantTotal) pour générer l'échéancier d'inscription" });
            }

            const echeances = await GenerateurEcheancierService.generer(
                dossier,
                modalite as ModalitePaiement,
                undefined,
                montantTotal
            )

            return res.status(201).json({ success: true, modalite, echeances });
        }

        // ── Comportement historique (sans modalite) : échéances de scolarité ───────
        // Règle métier A1 : la 1ère échéance de scolarité est payable au mois
        // suivant le début du parcours (au mois suivant), d'où le décalage de
        // +1 mois sur la date limite (et le mois concerné reculé d'autant pour
        // conserver la convention dateLimite = mois suivant le moisConcerne).
        const montantParMois = dossier.fraisScolarite / dossier.nbMensualites
        const debut = new Date(dossier.demarrageParcours)
        let echeances = []

        for (let i = 0; i < dossier.nbMensualites; i++) {
            const dateLimite = new Date(debut.getFullYear(), debut.getMonth() + i + 1, 5)
            const moisConcerne = debut.getFullYear() + '-' + String(debut.getMonth() + i + 2).padStart(2, '0')

            let echeance = new Echeance();
            echeance.dossierEtudiantId = dossier.id
            echeance.type = 'scolarite'
            echeance.numeroEcheance = i + 1
            echeance.montant = montantParMois
            echeance.dateLimite = dateLimite
            echeance.statut = 'impaye'
            echeance.moisConcerne = moisConcerne

            echeances.push(await echeance.save())
        }

        return res.status(201).json({ success: true, echeances });
    }

    /**
     * GET /inscription/paiement/statut — statut de paiement de l'utilisateur
     * connecté (rôle APPRENANT ou PARENT).
     *
     * Renvoie :
     *   { statut, message, echeancesEnRetard, echeancesRestantes, montantRestant, prochaineEcheance }
     *
     * Pour un PARENT, le statut est agrégé sur l'ensemble des enfants rattachés
     * (rouge si un seul enfant est en retard, montant restant = somme sur tous les
     * enfants, prochaine échéance = la plus proche toutes filières confondues).
     */
    static async getStatutPaiement(req: Request, res: Response): Promise<Response> {
        const role = (req as any).utilisateurRole
        if (role !== RolesUtilisateur.APPRENANT && role !== RolesUtilisateur.PARENT) {
            return res.status(403).json({ success: false, message: "Accès réservé aux apprenants et aux parents" })
        }

        if (role === RolesUtilisateur.APPRENANT) {
            const resultat = await VerificationPaiementService.verifierEtEnrichir((req as any).utilisateurId)
            return res.status(200).json(resultat)
        }

        // ── PARENT : agrégation des enfants rattachés ──
        const relations = await ParentEnfant.findAll({
            where: { parentUtilisateurId: (req as any).utilisateurId },
            include: [{ model: Apprenant, as: 'apprenant', attributes: ['id', 'utilisateurId'] }]
        })
        const utilisateurIdsEnfants = [...new Set(
            relations
                .map(r => (r as any).apprenant?.utilisateurId)
                .filter((id: unknown): id is number => typeof id === 'number')
        )]

        if (utilisateurIdsEnfants.length === 0) {
            return res.status(200).json({
                statut: 'rouge',
                message: 'Aucun enfant rattaché à ce compte parent',
                echeancesEnRetard: 0,
                echeancesRestantes: [],
                montantRestant: 0,
                prochaineEcheance: null,
            })
        }

        const resultats = await Promise.all(
            utilisateurIdsEnfants.map(uid => VerificationPaiementService.verifierEtEnrichir(uid))
        )

        const statut = resultats.some(r => r.statut === 'rouge') ? 'rouge' : 'vert'
        const echeancesEnRetard = resultats.reduce((somme, r) => somme + r.echeancesEnRetard, 0)
        const montantRestant = resultats.reduce((somme, r) => somme + r.montantRestant, 0)
        const echeancesRestantes = resultats.flatMap(r => r.echeancesRestantes)

        const prochaines = resultats
            .map(r => r.prochaineEcheance)
            .filter((e): e is { dateLimite: string | Date, montant: number } => e != null)
            .sort((a, b) => new Date(a.dateLimite).getTime() - new Date(b.dateLimite).getTime())
        const prochaineEcheance = prochaines[0] ?? null

        const message = statut === 'rouge'
            ? 'Un ou plusieurs enfants ont des échéances en retard'
            : 'Accès autorisé'

        return res.status(200).json({
            statut,
            message,
            echeancesEnRetard,
            echeancesRestantes,
            montantRestant,
            prochaineEcheance,
        })
    }
}

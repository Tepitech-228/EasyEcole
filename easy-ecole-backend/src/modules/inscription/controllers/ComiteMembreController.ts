import { Request, Response } from "express";
import { Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Utilisateur } from "../../auth/models/Utilisateur";
import * as bcrypt from 'bcrypt';
import { ComiteOrientation } from "../../auth/models/ComiteOrientation";

export default class ComiteMembreController {

    /**
     * GET /admin/comite-membres
     * Liste tous les membres du comité (role = comite_orientation, non supprimés).
     */
    static async listerMembres(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role !== RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const membres = await Utilisateur.findAll({
                where: {
                    role: RolesUtilisateur.COMITE_ORIENTATION,
                    deletedAt: null
                },
                attributes: ['id', 'nom', 'prenoms', 'identifiant', 'email', 'contact', 'createdAt'],
                order: [['createdAt', 'DESC']],
            })

            // Le rôle prescripteur vit sur le profil ComiteOrientation, pas sur
            // l'utilisateur : on le récupère à part et on le fusionne, pour ne
            // pas dépendre d'une association inverse.
            const utilisateurIds = membres.map((m: any) => m.id)
            let prescripteurs: Map<number, boolean> = new Map()

            if (utilisateurIds.length > 0) {
                const profils = await ComiteOrientation.findAll({
                    where: { utilisateurId: { [Op.in]: utilisateurIds } },
                    attributes: ['utilisateurId', 'estPrescripteur']
                })
                prescripteurs = new Map(
                    profils.map((p: any) => [Number(p.utilisateurId), Boolean(p.estPrescripteur)])
                )
            }

            const data = membres.map((m: any) => ({
                ...m.toJSON(),
                estPrescripteur: prescripteurs.get(Number(m.id)) ?? false,
            }))

            return res.status(200).json({ data })
        } catch (error) {
            console.error('[ComiteMembre] listerMembres:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    /**
     * POST /admin/comite-membres
     * Crée un nouveau membre du comité (role = comite_orientation).
     * Body : { nom, prenoms, email, identifiant, motDePasse, contact?, estPrescripteur? }
     */
    static async creerMembre(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role !== RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const { nom, prenoms, email, identifiant, motDePasse, contact, estPrescripteur } = req.body

            if (!nom || !prenoms || !email || !identifiant) {
                return res.status(400).json({ success: false, message: "Nom, prénoms, email et identifiant sont requis" })
            }

            if (!motDePasse || motDePasse.length < 6) {
                return res.status(400).json({ success: false, message: "Mot de passe requis (min 6 caractères)" })
            }

            // Vérifier l'unicité de l'email et de l'identifiant
            const existe = await Utilisateur.findOne({
                where: { [Op.or]: [{ email }, { identifiant }] }
            })
            if (existe) {
                return res.status(400).json({ success: false, message: "Email ou identifiant déjà utilisé" })
            }

            const utilisateur = await Utilisateur.create({
                nom,
                prenoms,
                email,
                identifiant,
                motDePasse: bcrypt.hashSync(motDePasse, 12),
                role: RolesUtilisateur.COMITE_ORIENTATION,
                contact: contact || null,
                tokenVersion: 0,
            })

            // Créer le profil ComiteOrientation lié
            try {
                await ComiteOrientation.create({
                    utilisateurId: utilisateur.id,
                    fonction: "Comité d'Orientation",
                    estPrescripteur: Boolean(estPrescripteur),
                })
            } catch (profileError: any) {
                console.error('Erreur création profil ComiteOrientation:', profileError?.message)
            }

            return res.status(201).json({ success: true, message: "Membre du comité créé", utilisateur })
        } catch (error) {
            console.error('[ComiteMembre] creerMembre:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    /**
     * PATCH /admin/comite-membres/:id
     * Bascule le rôle prescripteur d'un membre existant.
     * Body : { estPrescripteur: boolean }
     */
    static async definirPrescripteur(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role !== RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const membreId = Number(req.params.id)
            if (!membreId || isNaN(membreId)) {
                return res.status(400).json({ success: false, message: "Identifiant membre invalide" })
            }

            if (typeof req.body?.estPrescripteur !== 'boolean') {
                return res.status(400).json({ success: false, message: "estPrescripteur doit être un booléen" })
            }

            const membre = await Utilisateur.findByPk(membreId)
            if (!membre || membre.role !== RolesUtilisateur.COMITE_ORIENTATION) {
                return res.status(404).json({ success: false, message: "Membre du comité non trouvé" })
            }

            // Le profil peut manquer (création partielle) : on le recrée au
            // besoin plutôt que d'échouer sur une bascule impossible à faire.
            const [profil, cree] = await ComiteOrientation.findOrCreate({
                where: { utilisateurId: membreId },
                defaults: {
                    utilisateurId: membreId,
                    fonction: "Comité d'Orientation",
                    estPrescripteur: false,
                }
            })

            await profil.update({ estPrescripteur: req.body.estPrescripteur })

            return res.status(200).json({
                success: true,
                message: req.body.estPrescripteur
                    ? "Membre habilité comme prescripteur"
                    : "Habilitation prescripteur retirée",
                estPrescripteur: req.body.estPrescripteur,
                profilCree: cree,
            })
        } catch (error) {
            console.error('[ComiteMembre] definirPrescripteur:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    /**
     * DELETE /admin/comite-membres/:id
     * Soft-delete d'un membre du comité (paranoid).
     */
    static async supprimerMembre(req: Request, res: Response): Promise<Response> {
        try {
            const role = (req as any).utilisateurRole
            if (role !== RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }

            const membreId = Number(req.params.id)
            if (!membreId || isNaN(membreId)) {
                return res.status(400).json({ success: false, message: "Identifiant membre invalide" })
            }

            const requesterId = (req as any).utilisateurId
            if (requesterId && Number(requesterId) === membreId) {
                return res.status(400).json({ success: false, message: "Impossible de supprimer votre propre compte" })
            }

            const membre = await Utilisateur.findByPk(membreId)
            if (!membre) {
                return res.status(404).json({ success: false, message: "Membre non trouvé" })
            }

            if (membre.role !== RolesUtilisateur.COMITE_ORIENTATION) {
                return res.status(400).json({ success: false, message: "Cet utilisateur n'est pas membre du comité" })
            }

            // Soft-delete (paranoid)
            await membre.destroy()

            return res.status(200).json({ success: true, message: "Membre du comité supprimé" })
        } catch (error: any) {
            // Erreur de clé étrangère : l'utilisateur a des votes liés
            if (error?.original?.code === 'ER_ROW_IS_REFERENCED' || error?.parent?.errno === 1451) {
                return res.status(409).json({
                    success: false,
                    message: "Impossible de supprimer ce membre : il a des votes associés. Supprimez les votes d'abord."
                })
            }
            console.error('[ComiteMembre] supprimerMembre:', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }
}

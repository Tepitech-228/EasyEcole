import { Request, Response } from "express";
import { FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Bordereau } from "../models/Bordereau";
import { Echeance } from "../models/Echeance";
import { Utilisateur } from "../../auth/models/Utilisateur";

export default class BordereauController {

    constructor() { }

    static async getAllBordereaux(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Bordereau>> = {
            include: [
                Bordereau.associations.echeance,
                Bordereau.associations.utilisateur,
                Bordereau.associations.validePar
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { utilisateurId: (req as any).utilisateurId }
        }

        if (req.query.statut) {
            options.where = { ...options.where, statut: req.query.statut as string }
        }

        if (req.query.echeanceId) {
            options.where = { ...options.where, echeanceId: req.query.echeanceId as string }
        }

        try {
            let bordereaux: Bordereau[];
            bordereaux = await Bordereau.findAll(options);

            return res.status(200).send(bordereaux);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getBordereau(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Bordereau>> = {
            where: { id: req.params.id },
            include: [
                Bordereau.associations.echeance,
                Bordereau.associations.utilisateur,
                Bordereau.associations.validePar
            ]
        }

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options.where = { ...options.where, utilisateurId: (req as any).utilisateurId }
        }

        try {
            const bordereau: Bordereau | null = await Bordereau.findOne(options);

            if (bordereau == null)
                return res.status(404).json({ success: false, message: "Bordereau non trouvé" });

            return res.status(200).send(bordereau);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async createBordereau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        const echeance = await Echeance.findByPk(req.body.echeanceId)
        if (echeance == null) {
            return res.status(404).json({ success: false, message: "Échéance non trouvée" });
        }

        let fichier: string | null = null
        let files: any = req.files
        if (files && files['fichier']) {
            let fichierFile: Express.Multer.File | undefined = (files['fichier'])[0] as Express.Multer.File | undefined
            if (fichierFile) {
                fichier = fichierFile.filename
            }
        }

        if (fichier == null) {
            return res.status(400).json({ success: false, message: "Fichier bordereau requis" });
        }

        let bordereau: Bordereau = new Bordereau();
        bordereau.echeanceId = req.body.echeanceId
        bordereau.utilisateurId = (req as any).utilisateurId
        bordereau.fichier = fichier
        bordereau.montant = req.body.montant
        bordereau.referenceBancaire = req.body.referenceBancaire ?? null
        bordereau.statut = 'en_attente'
        bordereau.dateSoumission = new Date()

        await bordereau.save()
            .then(async (bordereau) => {
                return res.status(201).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async validerBordereau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.CABINET_COMPTABLE) {
            return res.status(403).json({ success: false })
        }

        let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id, {
            include: [Bordereau.associations.echeance]
        });

        if (bordereau == null) {
            return res.status(404).json({ success: false, message: "Bordereau non trouvé" });
        }

        if (bordereau.statut != 'en_attente') {
            return res.status(400).json({ success: false, message: "Bordereau déjà traité" });
        }

        bordereau.statut = 'valide'
        bordereau.dateValidation = new Date()
        bordereau.valideParId = (req as any).utilisateurId
        bordereau.commentaire = req.body.commentaire ?? null

        await bordereau.save()
            .then(async (bordereau) => {
                if (bordereau.echeance) {
                    bordereau.echeance.statut = 'paye'
                    bordereau.echeance.datePaiement = new Date()
                    await bordereau.echeance.save()
                }

                return res.status(200).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async rejeterBordereau(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.CABINET_COMPTABLE) {
            return res.status(403).json({ success: false })
        }

        let bordereau: Bordereau | null = await Bordereau.findByPk(req.params.id);

        if (bordereau == null) {
            return res.status(404).json({ success: false, message: "Bordereau non trouvé" });
        }

        if (bordereau.statut != 'en_attente') {
            return res.status(400).json({ success: false, message: "Bordereau déjà traité" });
        }

        if (!req.body.commentaire) {
            return res.status(400).json({ success: false, message: "Commentaire requis pour le rejet" });
        }

        bordereau.statut = 'rejete'
        bordereau.dateValidation = new Date()
        bordereau.valideParId = (req as any).utilisateurId
        bordereau.commentaire = req.body.commentaire

        await bordereau.save()
            .then(async (bordereau) => {
                return res.status(200).send(bordereau);
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }
}

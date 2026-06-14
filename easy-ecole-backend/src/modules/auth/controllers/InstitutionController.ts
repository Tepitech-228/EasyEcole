import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Institution } from "../models/Institution";
import { AdresseInstitution } from "../models/AdresseInstitution";

export default class InstitutionController {

    constructor() { }

    static async getAllInstitutions(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Institution>> = {}

        try {
            let institutions: Institution[];
            institutions = await Institution.findAll();

            return res.status(200).send(institutions);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getInstitution(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Institution>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, }
        }
        else {
            return res.status(403).json({ success: false })
        }
        options.include = [
            Institution.associations.adresse,
        ]

        try {
            const institution: Institution | null = await Institution.findOne(options);

            if (institution == null)
                return res.sendStatus(204)

            return res.status(200).send(institution);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async updateInstitution(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Institution>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let institution: Institution | null = await Institution.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.INSTITUTION ? (req as any).utilisateurId : req.body.utilisateurId

        if (institution != null) {
            await institution.update({
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                fonction: req.body.fonction,
            })
                .then(async (institution) => {
                    await AdresseInstitution.update(req.body.adresse, { where: { institutionId: institution.id } })

                    return res.status(200).send(institution);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            await Institution.create({
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                fonction: req.body.fonction,
                adresse: req.body.adresse,
                utilisateurId: req.body.utilisateurId
            }, {
                include: [
                    Institution.associations.adresse,
                ]
            })
                .then((institution) => {
                    return res.status(201).send(institution);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async deleteInstitution(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Institution>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        let institution: Institution | null = await Institution.findOne({ where: { id: req.params.id } });
        if (institution) {
            await institution.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Institution supprimée" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Institution non trouvée" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Institution>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        await Institution.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
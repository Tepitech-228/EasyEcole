import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PersonnelAdministratif } from "../models/PersonnelAdministratif";
import { AdresseEnseignant } from "../models/AdresseEnseignant";
import { Utilisateur } from "../models/Utilisateur";

export default class PersonnelAdministratifController {

    constructor() { }

    static async getAll(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PersonnelAdministratif>> = {
            include: [{ association: PersonnelAdministratif.associations.utilisateur }]
        }

        try {
            const personnels = await PersonnelAdministratif.findAll(options);
            return res.status(200).send(personnels);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async get(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PersonnelAdministratif>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { where: { id: req.params.id } }
        } else {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }

        options.include = [
            PersonnelAdministratif.associations.utilisateur,
        ]

        try {
            const personnel = await PersonnelAdministratif.findOne(options);

            if (personnel == null)
                return res.sendStatus(204)

            return res.status(200).send(personnel);
        } catch (error) {
            return res.status(500).json({ success: false, error });
        }
    }

    static async update(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PersonnelAdministratif>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { where: { id: req.params.id } }
        } else {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }

        const personnel = await PersonnelAdministratif.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.ADMIN ? personnel?.utilisateurId : (req as any).utilisateurId

        if (personnel != null) {
            await personnel.update({
                matricule: req.body.matricule,
                statut: req.body.statut,
                fonction: req.body.fonction,
                directionService: req.body.directionService,
                cni: req.body.cni,
                nifOtr: req.body.nifOtr,
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                sexe: req.body.sexe,
                nationalite: req.body.nationalite,
                contact: req.body.contact,
                plusHautDiplome: req.body.plusHautDiplome,
                statutHandicap: req.body.statutHandicap,
                natureHandicap: req.body.natureHandicap,
            })
                .then(async (personnel) => {
                    if (personnel.utilisateurId && req.body.utilisateur) {
                        await Utilisateur.update(req.body.utilisateur, { where: { id: personnel.utilisateurId } })
                    }

                    return res.status(200).send(personnel);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error });
                });
        } else {
            await PersonnelAdministratif.create({
                ...req.body,
                utilisateurId: req.body.utilisateurId
            }, {
                include: [
                    PersonnelAdministratif.associations.utilisateur,
                ]
            })
                .then((personnel) => {
                    return res.status(201).send(personnel);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error });
                });
        }

        return null
    }

    static async updatePhoto(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PersonnelAdministratif>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { where: { id: req.params.id } }
        } else {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }

        const files: any = req.files
        if (files && files['photo']) {
            const photo = files['photo'][0] as Express.Multer.File | undefined
            const personnel = await PersonnelAdministratif.findOne(options);

            if (personnel != null && photo) {
                await personnel.update({ photo: photo.filename } as any)
                    .then(() => res.status(200).json({ success: true }))
                    .catch((error) => res.status(400).json({ success: false, error }))
                return null
            }
        }

        return res.status(400).json({ success: false })
    }

    static async delete(req: Request, res: Response): Promise<Response | null> {
        const id = req.params.id

        try {
            const personnel = await PersonnelAdministratif.findByPk(id)
            if (!personnel) return res.status(404).json({ success: false, message: "Personnel non trouvé" })

            await personnel.destroy()
            return res.status(200).json({ success: true })
        } catch (error) {
            return res.status(500).json({ success: false, error })
        }
    }
}

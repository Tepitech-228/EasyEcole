import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Enseignant } from "../models/Enseignant";
import { AdresseEnseignant } from "../models/AdresseEnseignant";
import { Cours } from "../../inscription/models/Cours";
import * as path from "path";
import * as fs from "fs";
import QRCode from "qrcode";

export default class EnseignantController {

    constructor() { }

    static async getAllEnseignants(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Enseignant>> = {
            include: [Enseignant.associations.utilisateur]
        }

        try {
            let enseignants: Enseignant[];
            enseignants = await Enseignant.findAll(options);

            return res.status(200).send(enseignants);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async getEnseignant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            let enseignantId = req.params.id

            if (enseignantId) {
                options = { where: { id: req.params.id } }
            }
            else {
                options = { where: { utilisateurId: req.body.utilisateurId } }
            }
        }
        options.include = [
            Enseignant.associations.adresse,
            Enseignant.associations.utilisateur,
            { association: Enseignant.associations.cours, include: [Cours.associations.classe] }
        ]

        try {
            const enseignant: Enseignant | null = await Enseignant.findOne(options);

            if (enseignant == null)
                return res.sendStatus(204)

            return res.status(200).send(enseignant);
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    }

    static async updateEnseignant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }

        let enseignant: Enseignant | null = await Enseignant.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT ? (req as any).utilisateurId : req.body.utilisateurId
        // console.log((req as any).utilisateurId)

        if (enseignant != null) {
            await enseignant.update({
                fonction: req.body.fonction,
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
            })
                .then(async (enseignant) => {
                    await AdresseEnseignant.update(req.body.adresse, { where: { enseignantId: enseignant.id } })

                    return res.status(200).send(enseignant);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            await Enseignant.create({
                fonction: req.body.fonction,
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                adresse: req.body.adresse,
                utilisateurId: req.body.utilisateurId
            }, {
                include: [
                    Enseignant.associations.adresse,
                ]
            })
                .then((enseignant) => {
                    return res.status(201).send(enseignant);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updatePhoto(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let files: any = req.files
        if (files && files['photo']) {
            let photo: Express.Multer.File | undefined = (files['photo'])[0] as Express.Multer.File | undefined

            if (photo) {
                let enseignant: Enseignant | null = await Enseignant.findOne(options);
                if (enseignant != null) {
                    await enseignant.update({
                        photo: photo.filename,
                    })
                        .then(async () => {
                            return res.status(200).json({ success: false });
                        })
                        .catch((error) => {
                            return res.status(400).json({ success: false, error: error });
                        });

                    return null
                }
                else {
                    return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
                }
            }
            else {
                return res.status(400).json({ success: false });
            }
        }
        else {
            return res.status(400).json({ success: false });
        }
    }

    static async deleteEnseignant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Enseignant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            options = { where: { id: req.params.id } }
        }

        let enseignant: Enseignant | null = await Enseignant.findOne({ where: { id: req.params.id } });
        if (enseignant) {
            await enseignant.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Enseignant supprimé" });
                })
                .catch((error) => {
                    return res.status(500).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Enseignant non trouvé" });
        }

        return null
    }

    static async generateQrCodes(req: Request, res: Response): Promise<Response | null> {
        const dir: string = "public/auth/enseignants/qr-codes/"
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        try {
            let whereClause: any = {}
            if (req.body.enseignantId) {
                whereClause.id = req.body.enseignantId
            }

            const enseignants: Enseignant[] = await Enseignant.findAll({
                where: whereClause,
                include: [Enseignant.associations.utilisateur]
            })

            const results: { enseignantId: string, userId: string, qrCode: string }[] = []

            for (const enseignant of enseignants) {
                if (!enseignant.utilisateur) continue

                const userId = String(enseignant.utilisateur.id)
                const fileName = `${userId}.png`
                const filePath = path.join(dir, fileName)

                await QRCode.toFile(filePath, userId, {
                    type: 'png',
                    width: 400,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                })

                await enseignant.update({ qrCode: fileName })

                results.push({
                    enseignantId: enseignant.id,
                    userId: userId,
                    qrCode: fileName
                })
            }

            return res.status(200).json({ success: true, data: results })
        } catch (error) {
            return res.status(500).json({ success: false, error: error })
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Enseignant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.ENSEIGNANT) {
            return res.status(403).json({ success: false })
        }

        await Enseignant.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                return res.status(500).json({ success: false, error: error });
            });

        return null
    }
}
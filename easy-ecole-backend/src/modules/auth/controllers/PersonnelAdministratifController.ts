import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PersonnelAdministratif } from "../models/PersonnelAdministratif";
import { AdresseEnseignant } from "../models/AdresseEnseignant";
import { Utilisateur } from "../models/Utilisateur";
import * as path from "path";
import * as fs from "fs";
import QRCode from "qrcode";
import { QrTokenService } from "../../../core/services/QrTokenService";

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

    static async generateQRs(req: Request, res: Response): Promise<Response | null> {
        const dir: string = path.resolve(process.cwd(), 'storage', 'qr-codes', 'personnel')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        try {
            const whereClause: any = { matricule: { [Op.ne]: null } }
            if (req.body.personnelId) {
                whereClause.id = req.body.personnelId
            }

            const personnels: PersonnelAdministratif[] = await PersonnelAdministratif.findAll({
                where: whereClause,
                include: [PersonnelAdministratif.associations.utilisateur]
            })

            const errors: string[] = []
            let success = 0

            for (const personnel of personnels) {
                if (!personnel.utilisateur) continue

                const userId = String(personnel.utilisateur.id)
                const qrData = QrTokenService.signer(Number(personnel.utilisateur.id))
                const fileName = `${userId}.png`
                const filePath = path.join(dir, fileName)

                try {
                    await QRCode.toFile(filePath, qrData, {
                        type: 'png',
                        width: 400,
                        margin: 4,
                        errorCorrectionLevel: 'Q',
                        color: {
                            dark: '#000000',
                            light: '#ffffff'
                        }
                    })

                    await personnel.update({ qrCode: fileName })
                    success++
                } catch (qrError: any) {
                    errors.push(`personnelId=${personnel.id}: ${qrError?.message || qrError}`)
                }
            }

            return res.status(200).json({ total: personnels.length, success, errors })
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getQrCode(req: Request, res: Response): Promise<Response | null> {
        const { fileName } = req.params;
        const dir = path.resolve(process.cwd(), 'storage', 'qr-codes', 'personnel');
        const filePath = path.join(dir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'QR code non trouvé' });
        }

        res.setHeader('Content-Type', 'image/png');
        res.sendFile(filePath);
        return null;
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

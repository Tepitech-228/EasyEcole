import { Request, Response } from "express";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { Apprenant } from "../models/Apprenant";
import { AdresseApprenant } from "../models/AdresseApprenant";
import { InformationsParentsApprenant } from "../models/InformationsParentsApprenant";
import { IdentiteApprenant } from "../models/IdentiteApprenant";
import { InformationsSalarieApprenant } from "../models/InformationsSalarieApprenant";
import { PersonnePrevenirApprenant } from "../models/PersonnePrevenirApprenant";
import { Utilisateur } from "../models/Utilisateur";
import * as path from "path";
import * as fs from "fs";
import QRCode from "qrcode";
import { QrTokenService } from "../../../core/services/QrTokenService";

export default class ApprenantController {

    constructor() { }

    static async getAllApprenants(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Apprenant>> = {
            include: [{
                association: Apprenant.associations.utilisateur,
                include: [{
                    association: 'cursusApprenant' as any,
                    include: [
                        { association: 'parcours' as any },
                        { association: 'classe' as any },
                        { association: 'anneeAcademique' as any },
                        { association: 'demandeInscription' as any }
                    ]
                }]
            }]
        }

        try {
            let apprenants: Apprenant[];
            apprenants = await Apprenant.findAll(options);

            return res.status(200).send(apprenants);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getApprenant(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<Apprenant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId }, }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }
        options.include = [
            Apprenant.associations.adresse,
            Apprenant.associations.identite,
            Apprenant.associations.informationsSalarie,
            Apprenant.associations.informationsParents,
            Apprenant.associations.personnePrevenir,
            {
                association: Apprenant.associations.utilisateur,
                include: [
                    {
                        association: 'cursusApprenant' as any,
                        include: [
                            { association: 'parcours' as any },
                            { association: 'classe' as any },
                            { association: 'niveauEtude' as any },
                            { association: 'anneeAcademique' as any },
                        ]
                    }
                ]
            }
        ]

        try {
            const apprenant: Apprenant | null = await Apprenant.findOne(options);

            if (apprenant == null)
                return res.sendStatus(204)

            return res.status(200).send(apprenant);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async createApprenant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Apprenant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }

        let apprenant: Apprenant | null = await Apprenant.findOne(options);

        if (apprenant != null) {
            return res.status(400).json({ success: false, message: "Apprenant déjà existant" });
        }
        else {
            await Apprenant.create({
                photo: req.body.photo,
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                sexe: req.body.sexe,
                nationalite: req.body.nationalite,
                cni: req.body.cni,
                statutHandicap: req.body.statutHandicap,
                natureHandicap: req.body.natureHandicap,
                anneeObtentionBac: req.body.anneeObtentionBac,
                serieBac: req.body.serieBac,
                anneePremiereInscription: req.body.anneePremiereInscription,
                nombreInscriptions: req.body.nombreInscriptions,
                statutEtudiant: req.body.statutEtudiant,
                periode: req.body.periode,
                diplomePrepare: req.body.diplomePrepare,
                utilisateurId: (req as any).utilisateurRole == RolesUtilisateur.APPRENANT ? (req as any).utilisateurId : req.body.utilisateurId
            }, {
                include: [
                    Apprenant.associations.adresse,
                    Apprenant.associations.identite,
                    Apprenant.associations.informationsSalarie,
                    Apprenant.associations.informationsParents,
                    Apprenant.associations.personnePrevenir,
                ]
            })
                .then((apprenant) => {
                    return res.status(201).send(apprenant);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updateApprenant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Apprenant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }

        let apprenant: Apprenant | null = await Apprenant.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.APPRENANT ? (req as any).utilisateurId : req.body.utilisateurId
        console.log((req as any).utilisateurId)

        if (apprenant != null) {
            await apprenant.update({
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                sexe: req.body.sexe,
                nationalite: req.body.nationalite,
                cni: req.body.cni,
                statutHandicap: req.body.statutHandicap,
                natureHandicap: req.body.natureHandicap,
                anneeObtentionBac: req.body.anneeObtentionBac,
                serieBac: req.body.serieBac,
                anneePremiereInscription: req.body.anneePremiereInscription,
                nombreInscriptions: req.body.nombreInscriptions,
                statutEtudiant: req.body.statutEtudiant,
                periode: req.body.periode,
                diplomePrepare: req.body.diplomePrepare,
            })
                .then(async (apprenant) => {
                    await AdresseApprenant.update(req.body.adresse, { where: { apprenantId: apprenant.id } })
                    await IdentiteApprenant.update(req.body.identite, { where: { apprenantId: apprenant.id } })
                    await InformationsParentsApprenant.update(req.body.informationsParents, { where: { apprenantId: apprenant.id } })
                    await InformationsSalarieApprenant.update(req.body.informationsSalarie, { where: { apprenantId: apprenant.id } })
                    await PersonnePrevenirApprenant.update(req.body.personnePrevenir, { where: { apprenantId: apprenant.id } })

                    if (apprenant.utilisateurId && req.body.utilisateur) {
                        await Utilisateur.update(req.body.utilisateur, { where: { id: apprenant.utilisateurId } })
                    }

                    return res.status(200).send(apprenant);
                })
                .catch((error) => {
                    if (error?.name === 'SequelizeUniqueConstraintError' || error?.parent?.code === 'ER_DUP_ENTRY') {
                        // Extraire le nom du champ depuis la structure de l'erreur Sequelize ou MySQL
                        const fields = error.fields ?? error.original?.fields ?? error.parent?.fields ?? {};
                        const keys = Object.keys(fields);
                        // Si les clés contiennent le nom du constraint composite (ex: 'nom-prenoms'), extraire le premier champ individuel
                        let champ = keys[0] ?? '';
                        if (champ && champ.includes('-')) {
                            champ = champ.split('-')[0];
                        }
                        if (!champ || champ === 'undefined') {
                            // Dernier recours : parser le message SQL MySQL
                            const sqlMsg = error?.parent?.sqlMessage ?? error?.original?.sqlMessage ?? '';
                            const match = sqlMsg.match(/for key '([^']+)'/);
                            champ = match ? match[1].split('.').pop()?.replace(/-/g, ' / ') ?? 'valeur' : 'valeur';
                        }
                        console.error('[APPRENANT_409] Champ:', champ, '| Fields:', JSON.stringify(fields), '| Error:', error?.message);
                        return res.status(409).json({ success: false, message: `La valeur saisie pour « ${champ} » est déjà utilisée par un autre enregistrement.` });
                    }
                    console.error('[APPRENANT_ERR]', error);
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            await Apprenant.create({
                dateNaissance: req.body.dateNaissance,
                lieuNaissance: req.body.lieuNaissance,
                sexe: req.body.sexe,
                nationalite: req.body.nationalite,
                cni: req.body.cni,
                statutHandicap: req.body.statutHandicap,
                natureHandicap: req.body.natureHandicap,
                anneeObtentionBac: req.body.anneeObtentionBac,
                serieBac: req.body.serieBac,
                anneePremiereInscription: req.body.anneePremiereInscription,
                nombreInscriptions: req.body.nombreInscriptions,
                statutEtudiant: req.body.statutEtudiant,
                periode: req.body.periode,
                diplomePrepare: req.body.diplomePrepare,
                adresse: req.body.adresse,
                identite: req.body.identite,
                informationsParents: req.body.informationsParents,
                informationsSalarie: req.body.informationsSalarie,
                personnePrevenir: req.body.personnePrevenir,
                utilisateurId: req.body.utilisateurId
            }, {
                include: [
                    Apprenant.associations.adresse,
                    Apprenant.associations.identite,
                    Apprenant.associations.informationsSalarie,
                    Apprenant.associations.informationsParents,
                    Apprenant.associations.personnePrevenir,
                ]
            })
                .then((apprenant) => {
                    return res.status(201).send(apprenant);
                })
                .catch((error) => {
                    if (error?.name === 'SequelizeUniqueConstraintError' || error?.parent?.code === 'ER_DUP_ENTRY') {
                        const champ = Object.keys(error.fields ?? error.original?.fields ?? {})[0] ?? 'champ';
                        return res.status(409).json({ success: false, message: `La valeur saisie pour « ${champ} » est déjà utilisée par un autre enregistrement.` });
                    }
                    return res.status(400).json({ success: false, error: error });
                });
        }

        return null
    }

    static async updatePhoto(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Apprenant>> = {}
        const role = (req as any).utilisateurRole

        if (role == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        } else {
            const apprenantId = req.params.apprenantId || req.body.apprenantId
            if (!apprenantId) {
                return res.status(400).json({ success: false, message: "apprenantId requis" })
            }
            options = { where: { id: apprenantId } }
        }

        let files: any = req.files
        if (files && files['photo']) {
            let photo: Express.Multer.File | undefined = (files['photo'])[0] as Express.Multer.File | undefined

            if (photo) {
                const photoFilename = photo.filename
                let apprenant: Apprenant | null = await Apprenant.findOne(options);
                if (apprenant != null) {
                    await apprenant.update({ photo: photoFilename })
                        .then(async () => {
                            return res.status(200).json({ success: true, photo: photoFilename });
                        })
                        .catch((error) => {
                            return res.status(400).json({ success: false, error: error });
                        });

                    return null
                }
                else {
                    return res.status(404).json({ success: false, message: "Apprenant non trouvé" });
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

    static async deleteApprenant(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Apprenant>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { id: req.params.id } }
        }

        let apprenant: Apprenant | null = await Apprenant.findOne({ where: { id: req.params.id } });
        if (apprenant) {
            await apprenant.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Apprenant supprimé" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Apprenant non trouvé" });
        }

        return null
    }

    static async generateQrCodes(req: Request, res: Response): Promise<Response | null> {
        const dir: string = path.resolve(process.cwd(), 'storage', 'qr-codes', 'apprenants')
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        try {
            let whereClause: any = {}
            if (req.body.apprenantId) {
                whereClause.id = req.body.apprenantId
            }

            const apprenants: Apprenant[] = await Apprenant.findAll({
                where: whereClause,
                include: [{
                    association: Apprenant.associations.utilisateur,
                    include: [{
                        association: 'cursusApprenant' as any,
                        include: [
                            { association: 'parcours' as any },
                            { association: 'classe' as any },
                            { association: 'anneeAcademique' as any },
                            { association: 'demandeInscription' as any }
                        ]
                    }]
                }]
            })

            const results: { apprenantId: string, userId: string, qrCode: string }[] = []

            for (const apprenant of apprenants) {
                if (!apprenant.utilisateur) continue

                try {
                    const user = apprenant.utilisateur
                    const qrData = QrTokenService.signer(Number(user.id))

                    const baseName = `${user.id}`;
                    let fileName = `${baseName}.png`;
                    let filePath = path.join(dir, fileName);

                    if (fs.existsSync(filePath)) {
                        try { fs.unlinkSync(filePath) } catch (_) {
                            fileName = `${baseName}_${Date.now()}.png`;
                            filePath = path.join(dir, fileName);
                        }
                    }

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

                    await apprenant.update({ qrCode: fileName })

                    results.push({
                        apprenantId: apprenant.id,
                        userId: String(user.id),
                        qrCode: fileName
                    })
                } catch (apprenantError: any) {
                    console.error(`QR code skip for apprenant ${apprenant.utilisateur?.id}: ${apprenantError.code || apprenantError.message}`)
                }
            }

            return res.status(200).json({ success: true, data: results })
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Apprenant>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await Apprenant.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }

    static async getQrCode(req: Request, res: Response): Promise<Response | null> {
        const { fileName } = req.params;
        const dir = path.resolve(process.cwd(), 'storage', 'qr-codes', 'apprenants');
        const filePath = path.join(dir, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'QR code non trouvé' });
        }

        res.setHeader('Content-Type', 'image/png');
        res.sendFile(filePath);
        return null;
    }
}
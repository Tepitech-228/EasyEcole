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
            return res.status(400).json({ success: false, message: "Apprenant dÃ©jÃ  existant" });
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
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }

        let apprenant: Apprenant | null = await Apprenant.findOne(options);
        req.body.utilisateurId = (req as any).utilisateurRole == RolesUtilisateur.APPRENANT ? (req as any).utilisateurId : req.body.utilisateurId

        /**
         * Angular Reactive Forms envoient `null` pour chaque contrôle vide.
         * Sequelize passe ces valeurs à MySQL qui rejette les NOT NULL.
         * On filtre donc les valeurs nulles / undefined avant chaque update.
         */
        const stripNulls = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return obj
            const out: any = {}
            for (const [k, v] of Object.entries(obj)) {
                if (v !== null && v !== undefined) out[k] = v
            }
            return out
        }

        if (apprenant != null) {
            // Construire dynamiquement le payload d'update pour le modèle Apprenant
            // en n'incluant que les champs présents (Angular envoie null pour les vides)
            const apprenantFields = [
                'dateNaissance', 'lieuNaissance', 'sexe', 'nationalite', 'cni',
                'typePieceIdentite', 'numeroPiece', 'statutHandicap', 'natureHandicap',
                'anneeObtentionBac', 'serieBac', 'anneePremiereInscription',
                'nombreInscriptions', 'statutEtudiant', 'periode', 'diplomePrepare'
            ]
            const apprenantUpdates: any = {}
            for (const f of apprenantFields) {
                if (req.body[f] != null) apprenantUpdates[f] = req.body[f]
            }

            await apprenant.update(apprenantUpdates)
                .then(async (apprenant) => {
                    // Updates des sous-modèles — on strip les nulls et on ignore
                    // les objets vides pour éviter les erreurs NOT NULL
                    const nestedUpdates: { data: any; model: any; label: string }[] = [
                        { data: req.body.adresse,             model: AdresseApprenant,             label: 'adresse' },
                        { data: req.body.identite,             model: IdentiteApprenant,            label: 'identité' },
                        { data: req.body.informationsParents,  model: InformationsParentsApprenant, label: 'infos-parents' },
                        { data: req.body.informationsSalarie,   model: InformationsSalarieApprenant, label: 'infos-salarie' },
                        { data: req.body.personnePrevenir,     model: PersonnePrevenirApprenant,    label: 'personne-prevenir' },
                    ]

                    for (const { data, model, label } of nestedUpdates) {
                        const cleaned = stripNulls(data ?? {})
                        if (Object.keys(cleaned).length > 0) {
                            try {
                                await model.update(cleaned, { where: { apprenantId: apprenant.id } })
                            } catch (e: any) {
                                console.warn(`[APPRENANT_UPDATE] Sous-modèle ${label} non mis à jour :`, e?.message || e)
                            }
                        }
                    }

                    if (apprenant.utilisateurId && req.body.utilisateur) {
                        const cleanedUser = stripNulls(req.body.utilisateur)
                        if (Object.keys(cleanedUser).length > 0) {
                            try {
                                await Utilisateur.update(cleanedUser, { where: { id: apprenant.utilisateurId } })
                            } catch (e: any) {
                                console.warn('[APPRENANT_UPDATE] Utilisateur non mis à jour :', e?.message || e)
                            }
                        }
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
            // ————————————————————————— CREATE path (même logique de stripNulls) —————————
            const apprenantFields = [
                'dateNaissance', 'lieuNaissance', 'sexe', 'nationalite', 'cni',
                'typePieceIdentite', 'numeroPiece', 'statutHandicap', 'natureHandicap',
                'anneeObtentionBac', 'serieBac', 'anneePremiereInscription',
                'nombreInscriptions', 'statutEtudiant', 'periode', 'diplomePrepare'
            ]
            const apprenantUpdates: any = {}
            for (const f of apprenantFields) {
                if (req.body[f] != null) apprenantUpdates[f] = req.body[f]
            }

            await Apprenant.create({
                ...apprenantUpdates,
                adresse: stripNulls(req.body.adresse) || undefined,
                identite: stripNulls(req.body.identite) || undefined,
                informationsParents: stripNulls(req.body.informationsParents) || undefined,
                informationsSalarie: stripNulls(req.body.informationsSalarie) || undefined,
                personnePrevenir: stripNulls(req.body.personnePrevenir) || undefined,
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

        if (req.params.apprenantId) {
            if ((req as any).utilisateurRole != RolesUtilisateur.INSTITUTION && (req as any).utilisateurRole != RolesUtilisateur.ADMIN) {
                return res.status(403).json({ success: false })
            }
            options = { where: { id: req.params.apprenantId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { utilisateurId: (req as any).utilisateurId } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION || (req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            options = { where: { utilisateurId: req.body.utilisateurId } }
        }

        let files: any = req.files
        if (files && files['photo']) {
            const photo: Express.Multer.File | undefined = files['photo'][0] as Express.Multer.File | undefined

            if (photo) {
                const apprenant: Apprenant | null = await Apprenant.findOne(options)
                if (apprenant != null) {
                    await apprenant.update({ photo: photo.filename })
                        .then(async () => {
                            return res.status(200).json({ success: true })
                        })
                        .catch((error) => {
                            return res.status(400).json({ success: false, error: error })
                        })

                    return null
                }
                else {
                    return res.status(404).json({ success: false, message: "Apprenant non trouvé" })
                }
            }
        }

        return res.status(400).json({ success: false })
    }

    static async deleteApprenant(req: Request, res: Response): Promise<Response | null> {
        const apprenantIds = req.body.apprenantIds ?? req.body.ids ?? (req.body.apprenantId ? [req.body.apprenantId] : [])

        if (!Array.isArray(apprenantIds) || apprenantIds.length === 0) {
            return res.status(400).json({ success: false, message: "Aucun apprenant sélectionné" })
        }

        try {
            const deletedCount = await Apprenant.destroy({
                where: {
                    id: {
                        [Op.in]: apprenantIds
                    }
                }
            })

            return res.status(200).json({ success: true, count: deletedCount, message: "Apprenant(s) supprimé(s)" })
        } catch (error) {
            console.error('Erreur', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
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
                include: [Apprenant.associations.utilisateur]
            })

            const results: { apprenantId: string, userId: string, qrCode: string }[] = []

            for (const apprenant of apprenants) {
                if (!apprenant.utilisateur) continue

                const userId = String(apprenant.utilisateur.id)
                const qrData = QrTokenService.signer(Number(apprenant.utilisateur.id))
                const fileName = `${userId}.png`
                const filePath = path.join(dir, fileName)

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
                    userId: userId,
                    qrCode: fileName
                })
            }

            return res.status(200).json({ success: true, data: results })
        } catch (error) {
            console.error('Erreur', error)
            return res.status(500).json({ success: false, message: 'Erreur interne' })
        }
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<Apprenant>> = {}

        await Apprenant.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value })
            })
            .catch((error) => {
                console.error('Erreur', error)
                return res.status(500).json({ success: false, message: 'Erreur interne' })
            })

        return null
    }

    static async getQrCode(req: Request, res: Response): Promise<Response | null> {
        const { fileName } = req.params
        const dir = path.resolve(process.cwd(), 'storage', 'qr-codes', 'apprenants')
        const filePath = path.join(dir, fileName)

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'QR code non trouvé' })
        }

        res.setHeader('Content-Type', 'image/png')
        res.sendFile(filePath)
        return null
    }
}

import { Request, Response } from "express";
import { Utilisateur } from "../models/Utilisateur";
import * as bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { Enseignant } from "../models/Enseignant";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { JWT_SECRET } from "../../../core/config/jwt";

export default class AuthController {

    constructor() { }

    static getEmailConfirmationToken(id: string, email: string): string {
        return jwt.sign(
            {
                // Will expire in 60 * 60 seconds (1 hour)
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
                data: {
                    id: id,
                    email: email
                }
            },
            //TODO change and move in config file
            JWT_SECRET
        );
    }

    static async login(req: Request, res: Response): Promise<Response> {
        try {
            const utilisateur = await Utilisateur.findOne({ where: { [Op.or]: [{ email: req.body.email ?? null }, { identifiant: req.body.identifiant ?? null }] } });

            if (!utilisateur) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            if (bcrypt.compareSync(req.body.motDePasse, utilisateur.motDePasse)) {
                const token = jwt.sign(
                    {
                        id: utilisateur.id,
                        // nom: utilisateur.nom,
                        // prenoms: utilisateur.prenoms,
                        email: utilisateur.email,
                        identifiant: utilisateur.identifiant,
                        role: utilisateur.role,
                    },
                    JWT_SECRET
                );

                return res.status(200).json({ identifiant: utilisateur.identifiant, token: token });
            }
            else {
                return res.status(400).json({ message: 'Erreur' });
            }
        } catch (error) {
            return res.status(500).json({ error: error });
        }
    }

    static async register(req: Request, res: Response): Promise<Response | null> {

        if (req.body.identifiant == undefined || req.body.email == undefined) {
            return res.status(400).json({ emptyField: true });
        }

        let emailAlreadyUsed: boolean = await Utilisateur.findOne({ where: { email: req.body.email } }) != null
        let identifiantAlreadyUsed: boolean = await Utilisateur.findOne({ where: { identifiant: req.body.identifiant } }) != null
        let nomPrenomsAlreadyUsed: boolean = await Utilisateur.findOne({ where: { [Op.and]: [{ nom: req.body.nom }, { prenoms: req.body.prenoms }] } }) != null


        if (emailAlreadyUsed || identifiantAlreadyUsed || nomPrenomsAlreadyUsed) {
            return res.status(400).json({ emailAlreadyUsed: emailAlreadyUsed, identifiantAlreadyUsed: identifiantAlreadyUsed, nomPrenomsAlreadyUsed: nomPrenomsAlreadyUsed });
        }

        let utilisateur: Utilisateur = new Utilisateur();
        utilisateur.nom = req.body.nom;
        utilisateur.prenoms = req.body.prenoms;
        utilisateur.identifiant = req.body.identifiant;
        utilisateur.email = req.body.email;
        utilisateur.motDePasse = bcrypt.hashSync(req.body.motDePasse, 10);
        utilisateur.contact = req.body.contact;

        await utilisateur.save()
            .then(async (utilisateur) => {
                const redirectTo: string = req.query.redirectTo as string
                const token = AuthController.getEmailConfirmationToken(utilisateur.id, utilisateur.email)

                // await EmailSender.getInstance().sendEmailConfirmLink(utilisateur.identifiant, utilisateur.email, redirectTo, token)

                return res.status(201).send({ success: true });
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async registerEnseignant(req: Request, res: Response): Promise<Response | null> {
        if (req.body.utilisateur.identifiant == undefined || req.body.utilisateur.email == undefined) {
            return res.status(400).json({ emptyField: true });
        }

        let emailAlreadyUsed: boolean = await Utilisateur.findOne({ where: { email: req.body.utilisateur.email } }) != null
        let identifiantAlreadyUsed: boolean = await Utilisateur.findOne({ where: { identifiant: req.body.utilisateur.identifiant } }) != null
        let nomPrenomsAlreadyUsed: boolean = await Utilisateur.findOne({ where: { [Op.and]: [{ nom: req.body.utilisateur.nom }, { prenoms: req.body.utilisateur.prenoms }] } }) != null


        if (emailAlreadyUsed || identifiantAlreadyUsed || nomPrenomsAlreadyUsed) {
            return res.status(400).json({ emailAlreadyUsed: emailAlreadyUsed, identifiantAlreadyUsed: identifiantAlreadyUsed, nomPrenomsAlreadyUsed: nomPrenomsAlreadyUsed });
        }

        const tempPassword = IDGenerator.getInstance().generateMotDePasseUtilisateur()
        let utilisateur: Utilisateur = new Utilisateur();
        utilisateur.nom = req.body.utilisateur.nom;
        utilisateur.prenoms = req.body.utilisateur.prenoms;
        utilisateur.identifiant = req.body.utilisateur.identifiant;
        utilisateur.email = req.body.utilisateur.email;
        utilisateur.motDePasse = bcrypt.hashSync(tempPassword, 10);
        utilisateur.contact = req.body.utilisateur.contact;
        utilisateur.role = RolesUtilisateur.ENSEIGNANT

        await utilisateur.save()
            .then(async (utilisateur) => {
                await Enseignant.create({
                    utilisateurId: utilisateur.id
                })
                // const redirectTo: string = req.query.redirectTo as string
                // const token = AuthController.getEmailConfirmationToken(utilisateur.id, utilisateur.email)

                // await EmailSender.getInstance().sendEmailConfirmLink(utilisateur.identifiant, utilisateur.email, redirectTo, token)
                EmailSender.getInstance().sendMessageInscriptionEnseignant(utilisateur.identifiant, tempPassword, utilisateur.email)

                return res.status(201).send({ success: true });
            })
            .catch((error) => {
                return res.status(400).json({ success: false, error: error });
            });

        return null
    }

    static async updateProfile(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole == RolesUtilisateur.ADMIN) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = { where: { id: (req as any).utilisateurId } }

        let files: any = req.files
        if (files && files['profile']) {
            let profile: Express.Multer.File | undefined = (files['profile'])[0] as Express.Multer.File | undefined

            if (profile) {
                let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
                if (utilisateur != null) {
                    await utilisateur.update({
                        photoDeProfil: profile.filename,
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
                    return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
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

    static async sendEmailConfirmLink(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { id: (req as any).utilisateurId } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
        if (utilisateur) {
            if (utilisateur.dateVerificationEmail == undefined) {
                const redirectTo: string = req.query.redirectTo as string
                const token = AuthController.getEmailConfirmationToken(utilisateur.id, utilisateur.email)

                await EmailSender.getInstance().sendEmailConfirmLink(utilisateur.identifiant, utilisateur.email, redirectTo, token)
                    .then(async () => {
                        return res.sendStatus(200);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
            else {
                return res.status(300).json({ success: false, message: "Email déjà vérifié" });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }

        return null
    }

    static async emailConfirm(req: Request, res: Response): Promise<Response | null> {
        const token: string = req.query.token as string
        let decoded: any

        try {
            decoded = jwt.verify(token, JWT_SECRET)
        } catch (error) {
            return res.status(404).json({ success: false, error: error })
        }

        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        options = { where: { id: decoded.data.id, email: decoded.data.email } }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
        if (utilisateur != null) {
            if (utilisateur.dateVerificationEmail == undefined) {
                await utilisateur.update({
                    dateVerificationEmail: new Date()
                })
                    .then(async (utilisateur) => {
                        return res.sendStatus(200);
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
            else {
                return res.status(300).json({ success: false, message: "Email déjà vérifié" });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }

        return null
    }

    static async sendPasswordResetLink(req: Request, res: Response): Promise<Response | null> {
        if (req.query.email && req.query.redirectTo) {
            let options: FindOptions<InferAttributes<Utilisateur>> = {}
            options = { where: { email: req.query.email as string } }

            let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
            if (utilisateur) {
                if (utilisateur.dateVerificationEmail != undefined) {
                    const redirectTo: string = req.query.redirectTo as string
                    const token = jwt.sign(
                        {
                            // Will expire in 15 * 60 seconds (15 minutes)
                            exp: Math.floor(Date.now() / 1000) + (15 * 60),
                            data: {
                                email: utilisateur.email
                            }
                        },
                        //TODO change and move in config file
                        JWT_SECRET
                    );

                    await EmailSender.getInstance().sendPasswordResetLink(utilisateur.identifiant, utilisateur.email, redirectTo, token)
                        .then(async () => {
                            return res.sendStatus(200);
                        })
                        .catch((error) => {
                            return res.status(400).json({ success: false, error: error });
                        });
                }
                else {
                    return res.status(400).json({ success: false, message: "Email non vérifié" });
                }
            }
            else {
                return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
            }
        }
        else {
            return res.status(400).json({ success: false });
        }

        return null
    }

    static async passwordReset(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<Utilisateur>> = {}
        options = { where: { id: (req as any).utilisateurId } }

        let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
        if (utilisateur != null) {
            if (bcrypt.compareSync(req.body.oldPassword, utilisateur.motDePasse)) {
                await utilisateur.update({
                    motDePasse: bcrypt.hashSync(req.body.password, 10)
                })
                    .then(async (utilisateur) => {
                        return res.status(200).json({ success: true })
                    })
                    .catch((error) => {
                        return res.status(400).json({ success: false, error: error });
                    });
            }
            else {
                return res.status(400).json({ passwordWrong: true });
            }
        }
        else {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }

        return null
    }

    static async passwordResetWithToken(req: Request, res: Response): Promise<Response | null> {
        const { token, motDePasse } = req.body
        if (!token || !motDePasse) {
            return res.status(400).json({ success: false, message: "Token et mot de passe requis" })
        }

        let decoded: any
        try {
            decoded = jwt.verify(token, JWT_SECRET)
        } catch (error) {
            return res.status(400).json({ success: false, message: "Token invalide ou expiré" })
        }

        const utilisateur = await Utilisateur.findOne({ where: { email: decoded.data.email } })
        if (!utilisateur) {
            return res.status(404).json({ success: false, message: "Utilisateur non trouvé" })
        }

        await utilisateur.update({
            motDePasse: bcrypt.hashSync(motDePasse, 10)
        })

        return res.status(200).json({ success: true, message: "Mot de passe réinitialisé" })
    }


}
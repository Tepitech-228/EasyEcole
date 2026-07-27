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
import { OtpService } from "../../../core/services/OtpService";

function masquerEmail(email: string): string {
  const [local, domaine] = email.split('@')
  if (local.length <= 2) return `${local[0]}***@${domaine}`
  return `${local[0]}***${local[local.length - 1]}@${domaine}`
}

function signToken(utilisateur: Utilisateur): string {
  return jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + (10 * 60 * 60),
      id: utilisateur.id,
      email: utilisateur.email,
      identifiant: utilisateur.identifiant,
      role: utilisateur.role,
      tokenVersion: utilisateur.tokenVersion,
    },
    JWT_SECRET
  )
}

export default class AuthController {

  constructor() { }

  static getEmailConfirmationToken(id: number | string, email: string): string {
    return jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
        data: {
          id: String(id),
          email: email
        }
      },
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
        try {
          const code = OtpService.generate(utilisateur.email)
          console.log(`[DEV OTP] Code pour ${utilisateur.email}: ${code}`)
          await EmailSender.getInstance().sendOtpCode(utilisateur.email, code)
        } catch (otpError: any) {
          if (otpError.message?.includes('bloqué')) {
            return res.status(423).json({ error: 'account_blocked', message: otpError.message })
          }
          console.error('Erreur envoi OTP:', otpError)
        }

        return res.status(200).json({
          otpRequired: true,
          email: utilisateur.email,
          maskedEmail: masquerEmail(utilisateur.email)
        })
      }
      else {
        return res.status(400).json({ message: 'Identifiants incorrects' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Erreur interne du serveur' });
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
      return res.status(400).json({ emailAlreadyUsed, identifiantAlreadyUsed, nomPrenomsAlreadyUsed });
    }

    let utilisateur: Utilisateur = new Utilisateur();
    utilisateur.nom = req.body.nom;
    utilisateur.prenoms = req.body.prenoms;
    utilisateur.identifiant = req.body.identifiant;
    utilisateur.email = req.body.email;
    utilisateur.motDePasse = bcrypt.hashSync(req.body.motDePasse, 12);
    utilisateur.contact = req.body.contact;

    await utilisateur.save()
      .then(async (utilisateur) => {
        try {
          const code = OtpService.generate(utilisateur.email)
          await EmailSender.getInstance().sendOtpCode(utilisateur.email, code)
        } catch (err) {
          console.error('Erreur envoi OTP inscription:', err)
        }

        return res.status(201).json({
          otpRequired: true,
          email: utilisateur.email,
          maskedEmail: masquerEmail(utilisateur.email),
          mode: 'inscription'
        })
      })
      .catch((error) => {
        return res.status(400).json({ success: false, message: "Erreur lors de l'inscription" });
      });

    return null
  }

  static async verifyOtp(req: Request, res: Response): Promise<Response> {
    const { email, code } = req.body

    if (!email || !code) {
      return res.status(400).json({ error: 'missing_fields', message: 'Email et code requis' })
    }

    const result = OtpService.verify(email, code)

    if (!result.success) {
      switch (result.reason) {
        case 'blocked':
          return res.status(423).json({
            error: 'account_blocked',
            message: `Compte bloqué pour ${result.remainingMinutes} minute(s)`,
            blockedUntil: result.blockedUntil
          })
        case 'expired':
          return res.status(400).json({ error: 'code_expired', message: 'Code expiré, demandez-en un nouveau' })
        case 'incorrect':
          const msg = result.attemptsLeft === 1
            ? 'DERNIÈRE TENTATIVE — Votre compte sera bloqué 10 minutes si le code est incorrect'
            : `Code incorrect — ${result.attemptsLeft} tentatives restantes`
          return res.status(400).json({ error: 'code_incorrect', message: msg, attemptsLeft: result.attemptsLeft })
        case 'not_found':
          return res.status(400).json({ error: 'no_otp', message: 'Aucun code actif, veuillez vous reconnecter' })
      }
    }

    const utilisateur = await Utilisateur.findOne({ where: { email } })
    if (!utilisateur) {
      return res.status(404).json({ error: 'user_not_found', message: 'Utilisateur non trouvé' })
    }

    if (!utilisateur.dateVerificationEmail) {
      await utilisateur.update({ dateVerificationEmail: new Date() })
    }

    const token = signToken(utilisateur)

    return res.status(200).json({
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenoms: utilisateur.prenoms,
        email: utilisateur.email,
        identifiant: utilisateur.identifiant,
        role: utilisateur.role
      }
    })
  }

  static async resendOtp(req: Request, res: Response): Promise<Response> {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'missing_email', message: 'Email requis' })
    }

    const canResend = OtpService.canResend(email)
    if (!canResend.allowed) {
      if (canResend.retryAfter) {
        return res.status(429).json({
          error: 'resend_cooldown',
          message: `Attendez ${Math.ceil(canResend.retryAfter / 1000)}s avant de renvoyer`,
          retryAfter: canResend.retryAfter
        })
      }
      return res.status(423).json({ error: 'account_blocked', message: 'Compte bloqué' })
    }

    try {
      const code = OtpService.resend(email)
      await EmailSender.getInstance().sendOtpCode(email, code)
    } catch (err: any) {
      return res.status(423).json({ error: 'account_blocked', message: err.message })
    }

    const info = OtpService.getAttemptsInfo(email)
    return res.status(200).json({
      success: true,
      message: 'Nouveau code envoyé',
      attemptsLeft: info.maxAttempts - info.attempts
    })
  }

  static async registerEnseignant(req: Request, res: Response): Promise<Response | null> {
    if (req.body.utilisateur.identifiant == undefined || req.body.utilisateur.email == undefined) {
      return res.status(400).json({ emptyField: true });
    }

    let emailAlreadyUsed: boolean = await Utilisateur.findOne({ where: { email: req.body.utilisateur.email } }) != null
    let identifiantAlreadyUsed: boolean = await Utilisateur.findOne({ where: { identifiant: req.body.utilisateur.identifiant } }) != null
    let nomPrenomsAlreadyUsed: boolean = await Utilisateur.findOne({ where: { [Op.and]: [{ nom: req.body.utilisateur.nom }, { prenoms: req.body.utilisateur.prenoms }] } }) != null

    if (emailAlreadyUsed || identifiantAlreadyUsed || nomPrenomsAlreadyUsed) {
      return res.status(400).json({ emailAlreadyUsed, identifiantAlreadyUsed, nomPrenomsAlreadyUsed });
    }

    const tempPassword = IDGenerator.getInstance().generateMotDePasseUtilisateur()
    let utilisateur: Utilisateur = new Utilisateur();
    utilisateur.nom = req.body.utilisateur.nom;
    utilisateur.prenoms = req.body.utilisateur.prenoms;
    utilisateur.identifiant = req.body.utilisateur.identifiant;
    utilisateur.email = req.body.utilisateur.email;
    utilisateur.motDePasse = bcrypt.hashSync(tempPassword, 12);
    utilisateur.contact = req.body.utilisateur.contact;
    utilisateur.role = RolesUtilisateur.ENSEIGNANT

    await utilisateur.save()
      .then(async (utilisateur) => {
        await Enseignant.create({ utilisateurId: utilisateur.id })
        EmailSender.getInstance().sendMessageInscriptionEnseignant(utilisateur.identifiant, tempPassword, utilisateur.email)
        return res.status(201).send({ success: true });
      })
      .catch((error) => {
        return res.status(400).json({ success: false, message: "Erreur lors de l'inscription de l'enseignant" });
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
          await utilisateur.update({ photoDeProfil: profile.filename })
            .then(async () => {
              return res.status(200).json({ success: false });
            })
            .catch((error) => {
              return res.status(400).json({ success: false, message: "Erreur lors de la mise à jour du profil" });
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
            return res.status(400).json({ success: false, message: "Erreur lors de l'envoi du lien" });
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
      return res.status(400).json({ success: false, message: "Token invalide ou expiré" })
    }

    let options: FindOptions<InferAttributes<Utilisateur>> = {}
    options = { where: { id: decoded.data.id, email: decoded.data.email } }

    let utilisateur: Utilisateur | null = await Utilisateur.findOne(options);
    if (utilisateur != null) {
      if (utilisateur.dateVerificationEmail == undefined) {
        await utilisateur.update({ dateVerificationEmail: new Date() })
          .then(async (utilisateur) => {
            return res.sendStatus(200);
          })
          .catch((error) => {
            return res.status(400).json({ success: false, message: "Erreur lors de la confirmation" });
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
              exp: Math.floor(Date.now() / 1000) + (15 * 60),
              data: { email: utilisateur.email }
            },
            JWT_SECRET
          );

          await EmailSender.getInstance().sendPasswordResetLink(utilisateur.identifiant, utilisateur.email, redirectTo, token)
            .then(async () => {
              return res.sendStatus(200);
            })
            .catch((error) => {
              return res.status(400).json({ success: false, message: "Erreur lors de l'envoi du lien de réinitialisation" });
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
        await utilisateur.update({ motDePasse: bcrypt.hashSync(req.body.password, 12) })
          .then(async (utilisateur) => {
            return res.status(200).json({ success: true })
          })
          .catch((error) => {
            return res.status(400).json({ success: false, message: "Erreur lors de la réinitialisation" });
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

    await utilisateur.update({ motDePasse: bcrypt.hashSync(motDePasse, 12) })

    return res.status(200).json({ success: true, message: "Mot de passe réinitialisé" })
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      const utilisateurId = (req as any).utilisateurId;
      await Utilisateur.increment('tokenVersion', { where: { id: utilisateurId } });
      return res.status(200).json({ success: true, message: "Déconnexion réussie" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Erreur lors de la déconnexion" });
    }
  }

}

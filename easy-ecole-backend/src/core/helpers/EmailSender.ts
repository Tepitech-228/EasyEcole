import { createTransport, SendMailOptions, Transporter } from "nodemailer"

const env = process.env.NODE_ENV || 'development';

function getMailConfig() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465', 10),
            username: process.env.SMTP_USER,
            password: process.env.SMTP_PASS
        }
    }
    if (env === 'development') {
        try {
            const config = require('../config/mail.json')[env];
            if (config.host && config.username && config.password) {
                console.warn('WARNING: mail.json contains credentials. Move them to .env for security.')
                return config
            }
        } catch (err: any) {
            // Fichier absent = cas nominal (config par .env) — silence justifié.
            // Toute autre anomalie (JSON corrompu...) doit être visible.
            if (err?.code !== 'MODULE_NOT_FOUND') {
                console.warn('[MAIL] lecture de config/mail.json impossible:', err?.message || err)
            }
        }
    }
    return null
}

type EmailTemplateType = {
    title: string,
    fullname: string,
    paragraph1: string,
    buttonLink: string,
    button: string,
    paragraph2: string,
    link: string
}
export class EmailSender {
    private static instance: EmailSender
    private transporter: Transporter | null = null

    constructor() {
        const config = getMailConfig()
        if (config) {
            this.transporter = createTransport({
                pool: true,
                host: config.host,
                port: config.port,
                secure: true,
                auth: {
                    user: config.username,
                    pass: config.password,
                }
            })
        }
    }

    public static getInstance(): EmailSender {
        if (!EmailSender.instance) {
            EmailSender.instance = new EmailSender()
        }
        return EmailSender.instance
    }

    public isConfigured(): boolean {
        return this.transporter !== null
    }

    private getUsername(): string {
        if (process.env.SMTP_USER) return process.env.SMTP_USER
        try {
            const config = require('../config/mail.json')[env];
            return config.username || ''
        } catch { return '' }
    }

    public test(): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: "armand.kayi@technologybusiness-tb.com",
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Mail test',
            html: this.getEmailTemplate()
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log(err)
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendServerStartingMessage(email: string = 'armand.kayi@technologybusiness-tb.com'): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Démarrage de l\'API',
            html: `<p>Le serveur API de l'application Easy Ecole vient d'être (re)démarré.</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendConfirmationDemandeOrientation(username: string, email: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre demande d\'orientation a été bien reçue',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été bien reçue. <br> Un mail vous sera envoyé à la fin du traitement</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendReponseOrientation(username: string, email: string, message: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Réponse d\'orientation',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été traitée. <br>Veuillez vous connecter à la plateforme pour voir les resultats de la demande</p>
            <p>Message de l'institution:</b>${message}</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendConfirmationDemandeInscription(username: string, email: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre demande d\'inscription a été bien reçue',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été bien reçue. <br> Veuillez suivre les instructions pour la suite du processus. Pour plus, d'informations vous pouvez nous joindre à l'adresse ci-dessous: </p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendReponseInscription(username: string, email: string, message: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Réponse d\'inscription',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été traitée. <br>Veuillez vous connecter à la plateforme pour voir les resultats de la demande</p>
            <p>Message de l'institution:</b>${message}</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendMail(mailOptions: SendMailOptions, retries: number = 2): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        return new Promise((resolve, reject) => {
            const attempt = (remaining: number) => {
                this.transporter!.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        const isTransient = /4\d\d/.test((err as any)?.responseCode ?? '')
                        if (remaining > 0 && isTransient) {
                            setTimeout(() => attempt(remaining - 1), 2000 * (3 - remaining))
                            return
                        }
                        reject(err)
                    }
                    else {
                        resolve()
                    }
                })
            }
            attempt(retries)
        })
    }

    public sendValidationDemandeInscription(username: string, email: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Validation de votre demande d\'inscription',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été validée. <br>Veuillez vous connecter à la plateforme pour voir les détails de la demande</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendMessageInscriptionEnseignant(username: string, tempPassword: string, email: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Création de votre compte Enseignant',
            html: `<p>Hi <b>${username},</b></p> <p>Votre compte a été créé avec succès. Vous pouvez vous connecter avec les identifiants suivants: <br> Nom d'utilisateur: <strong>${username}</strong> <br> Mot de passe: <strong>${tempPassword}</strong> <br><em>Pour des raisons de sécurité, veuillez changer votre mot de passe après s'être connecté à votre compte.</em></p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendPreInscriptionValidee(username: string, email: string, attachmentPath?: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre préinscription a été validée',
            html: `<p>Bonjour <b>${username},</b></p>
            <p>Votre dossier de préinscription a été validé par le comité d'orientation.</p>
            <p>Une autorisation provisoire d'inscription est disponible dans votre espace. Connectez-vous à la plateforme pour la télécharger.</p>
            <p>Vous pouvez maintenant procéder au paiement des frais d'inscription auprès de la banque muni de cette autorisation.</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        if (attachmentPath) {
            mailOptions.attachments = [
                {
                    filename: `autorisation_provisoire_${username}.pdf`,
                    path: attachmentPath,
                }
            ];
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    public sendPreInscriptionRejetee(username: string, email: string, motif: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre préinscription a été rejetée',
            html: `<p>Bonjour <b>${username},</b></p>
            <p>Votre dossier de préinscription a été rejeté par le comité d'orientation.</p>
            <p>Motif: <b>${motif}</b></p>
            <p>Pour plus d'informations, veuillez contacter l'établissement.</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    public sendParentWelcome(email: string, identifiant: string, motDePasse: string, nomParent: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Bienvenue sur l\'Espace Parents',
            html: `<p>Bonjour <b>${nomParent},</b></p>
            <p>Votre compte parent a été créé avec succès pour le suivi de la scolarité de votre enfant.</p>
            <p>Vous pouvez vous connecter à l'Espace Parents avec les identifiants suivants:</p>
            <p>URL de connexion: <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/login">${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/login</a></p>
            <p>Identifiant: <strong>${identifiant}</strong></p>
            <p>Mot de passe: <strong>${motDePasse}</strong></p>
            <p><em>Pour des raisons de sécurité, veuillez changer votre mot de passe après votre première connexion.</em></p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    public sendQuitusEtMatricule(username: string, email: string, matricule: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre dossier étudiant est prêt',
            html: `<p>Bonjour <b>${username},</b></p>
            <p>Votre dossier étudiant a été créé avec succès.</p>
            <p>Votre numéro matricule est: <strong>${matricule}</strong></p>
            <p>Vous pouvez desormais utiliser ce matricule pour toutes vos démarches au sein de l'établissement.</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    public sendEmailConfirmLink(username: string, email: string, redirectTo: string, token: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const template: EmailTemplateType = {
            title: 'Confirmer votre email',
            fullname: username,
            paragraph1: 'Pour confirmer votre email, veuillez cliquer sur le button ci-dessous :',
            buttonLink: redirectTo + '?token=' + token,
            button: 'Confirmer',
            paragraph2: 'Si cela ne marche pas, <br>veuillez copier et coller le lien ci-dessous dans votre navigateur:',
            link: redirectTo + '?token=' + token
        }

        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Confirmer votre email',
            html: this.getEmailTemplate(template)
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendPasswordResetLink(username: string, email: string, redirectTo: string, token: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const template: EmailTemplateType = {
            title: 'Easy Ecole: Réinitialiser le mot de passe',
            fullname: username,
            paragraph1: 'Pour réinitialiser le mot de passe de votre compte, veuillez cliquer sur le button ci-dessous :',
            buttonLink: redirectTo + '?token=' + token,
            button: 'Confirmer',
            paragraph2: 'Si cela ne marche pas, <br>veuillez copier et coller le lien ci-dessous dans votre navigateur:',
            link: redirectTo + '?token=' + token
        }

        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Réinitialiser le mot de passe',
            html: this.getEmailTemplate(template)
        }

        return new Promise((resolve, reject) => {
            this.transporter!.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendOtpCode(email: string, code: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))

        const formattedCode = code

        const mailOptions: SendMailOptions = {
            from: `EasyEcole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'EasyEcole - Votre code de connexion',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px 0;">
                    <h1 style="color: #1F4E79; margin: 0;">EasyEcole</h1>
                </div>
                <div style="background: #f5f7fa; border-radius: 12px; padding: 30px; text-align: center;">
                    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Bonjour,<br>Utilisez le code ci-dessous pour vous connecter :</p>
                    <div style="background: #1F4E79; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <span style="font-family: 'Courier New', monospace; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #fff;">${formattedCode}</span>
                    </div>
                    <p style="font-size: 14px; color: #666; margin: 0;">Ce code expire dans <strong>75 secondes</strong>.</p>
                    <p style="font-size: 13px; color: #999; margin: 15px 0 0 0;">Si vous n'etes pas à l'origine de cette demande, ignorez cet email.</p>
                </div>
                <div style="text-align: center; padding: 15px; color: #999; font-size: 12px;">EasyEcole - Gestion Scolaire &copy; ${new Date().getFullYear()}</div>
            </div>`
        }

        return this.sendMail(mailOptions)
    }

    public sendPdf(email: string, username: string, subject: string, messageHtml: string, pdfPath: string, pdfFilename: string): Promise<void> {
        if (!this.transporter) return Promise.reject(new Error('SMTP non configuré'))
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${this.getUsername()}>`,
            to: email,
            encoding: 'UTF-8',
            subject,
            html: messageHtml,
            attachments: [{ filename: pdfFilename, path: pdfPath }]
        }
        return this.sendMail(mailOptions)
    }

    private getEmailTemplate(template?: EmailTemplateType): string {
        const content = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Email template</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><style>body, body *:not(html):not(style):not(br):not(tr):not(code){ box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;} body{ -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height: 100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;} p, ul, ol, blockquote{ line-height: 1.4; text-align: left;} a{ color: #3869d4;} a img{ border: none;} h1{ color: #3d4852; font-size: 18px; font-weight: bold; margin-top: 0; text-align: left;} h2{ font-size: 16px; font-weight: bold; margin-top: 0; text-align: left;} h3{ font-size: 14px; font-weight: bold; margin-top: 0; text-align: left;} p{ font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;} p.sub{ font-size: 12px;} img{ max-width: 100%;} .wrapper{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; margin: 0; padding: 0; width: 100%;} .content{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 0; padding: 0; width: 100%;} .header{ padding: 25px 0; text-align: center;} .header a{ color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none;} .logo{ height: 80px; max-height: 80px; width: auto;} .body{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; border-bottom: 1px solid #edf2f7; border-top: 1px solid #edf2f7; margin: 0; padding: 0; width: 100%;} .inner-body{ background-color: #ffffff; border-color: #e8e5ef; border-radius: 2px; border-width: 1px; box-shadow: 0 2px 0 rgba(0,0,150,0.025), 2px 4px 0 rgba(0,0,150,0.015); margin: 0 auto; padding: 0; width: 570px;} .body-copy{ font-size: 14px;} .content-cell{ padding: 32px;} .footer{ color: #b0adc5; font-size: 12px; line-height: 1.5; margin-top: 0; text-align: center;} .footer a{ color: #b0adc5; text-decoration: underline;} .btn{ box-sizing: border-box; width: 100%;} .btn>tbody>tr>td{ padding-bottom: 16px;} .btn table{ width: auto;} .btn table td{ background-color: #ffffff; border-radius: 5px; text-align: center;} .btn a{ background-color: #3869d4; border: solid 1px #3869d4; border-radius: 5px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 24px; text-decoration: none; text-transform: capitalize;}</style></head><body><table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center"><table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="header"><a href="https://easyecole.com" style="color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none;">Easy Ecole</a></td></tr><tr><td class="body" width="100%" cellpadding="0" cellspacing="0"><table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="content-cell"><div class="body-copy"><p style="font-size: 14px;">Bonjour <b>${template?.fullname || ''}</b>,</p>${template ? `<p>${template.paragraph1}</p><table class="btn" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center"><table width="auto" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color: #3869d4; border-radius: 5px; text-align: center;"><a href="${template.buttonLink}" style="background-color: #3869d4; border: solid 1px #3869d4; border-radius: 5px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 24px; text-decoration: none; text-transform: capitalize;">${template.button}</a></td></tr></table></td></tr></table><p>${template.paragraph2}</p><p><a href="${template.link}">${template.link}</a></p>` : ''}<p>Coridialement,<br>L'équipe Easy Ecole</p></div></td></tr></table></td></tr><tr><td class="footer"><p>&copy; ${new Date().getFullYear()} Easy Ecole. Tous droits r&eacute;serv&eacute;s.</p></td></tr></table></td></tr></table></body></html>`
        return content
    }
}
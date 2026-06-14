import { createTransport, SendMailOptions, Transporter } from "nodemailer"
const env = process.env.NODE_ENV || 'development';
const config = require('../config/mail.json')[env];

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
    private transporter: Transporter

    constructor() {
        this.transporter = createTransport({
            pool: true,
            host: config.host,
            port: config.port,
            secure: true,
            auth: {
                user: config.username,
                pass: config.password,
            },
            tls: {
                rejectUnauthorized: false,
            },
        })
    }

    public static getInstance(): EmailSender {
        if (!EmailSender.instance) {
            EmailSender.instance = new EmailSender()
        }
        return EmailSender.instance
    }

    public test(): Promise<void> {
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: "armand.kayi@technologybusiness-tb.com",
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Mail test',
            html: this.getEmailTemplate()
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Démarrage de l\'API',
            html: `<p>Le serveur API de l'application Easy Ecole vient d'être (re)démarré.</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre demande d\'orientation a été bien reçue',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été bien reçue. <br> Un mail vous sera envoyé à la fin du traitement</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Réponse d\'orientation',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été traitée. <br>Veuillez vous connecter à la plateforme pour voir les resultats de la demande</p>
            <p>Message de l'institution:</b>${message}</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Votre demande d\'inscription a été bien reçue',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été bien reçue. <br> Veuillez suivre les instructions pour la suite du processus. Pour plus, d'informations vous pouvez nous joindre à l'adresse ci-dessous: </p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Réponse d\'inscription',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été traitée. <br>Veuillez vous connecter à la plateforme pour voir les resultats de la demande</p>
            <p>Message de l'institution:</b>${message}</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendValidationDemandeInscription(username: string, email: string): Promise<void> {
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Validation de votre demande d\'inscription',
            html: `<p>Hi <b>${username},</b></p> <p>Votre demande a été validée. <br>Veuillez vous connecter à la plateforme pour voir les détails de la demande</p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
        const mailOptions: SendMailOptions = {
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Création de votre compte Enseignant',
            html: `<p>Hi <b>${username},</b></p> <p>Votre compte a été créé avec succès. Vous pouvez vous connecter avec les identifiants suivants: <br> Nom d'utilisateur: <strong>${username}</strong> <br> Mot de passe: <strong>${tempPassword}</strong> <br><em>Pour des raisons de sécurité, veuillez changer votre mot de passe après s'être connecté à votre compte.</em></p>
            <p>Coridialement, <br> Easy Ecole</p>`
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    public sendEmailConfirmLink(username: string, email: string, redirectTo: string, token: string): Promise<void> {
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
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Confirmer votre email',
            html: this.getEmailTemplate(template)
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
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
            from: `Easy Ecole <${config.username}>`,
            to: email,
            encoding: 'UTF-8',
            subject: 'Easy Ecole: Réinitialiser le mot de passe',
            html: this.getEmailTemplate(template)
        }

        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    reject(err)
                }
                else {
                    resolve()
                }
            })
        })
    }

    private getEmailTemplate(template?: EmailTemplateType): string {
        // TODO:: Email doesn't display correctly in Courrier (Mailing) Windows Application
        // const content = `<!DOCTYPE html><html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en"><head><title></title><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{ box-sizing: border-box} body{ margin: 0; padding: 0} a[x-apple-data-detectors]{ color: inherit !important; text-decoration: inherit !important} #MessageViewBody a{ color: inherit; text-decoration: none} p{ line-height: inherit} .desktop_hide, .desktop_hide table{ mso-hide: all; display: none; max-height: 0; overflow: hidden} .image_block img+div{ display: none} @media (max-width:620px){ .social_block.desktop_hide .social-table{ display: inline-block !important} .fullMobileWidth, .image_block img.big, .row-content{ width: 100% !important} .mobile_hide{ display: none} .stack .column{ width: 100%; display: block} .mobile_hide{ min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0} .desktop_hide, .desktop_hide table{ display: table !important; max-height: none !important}} </style></head><body style="background-color:#fff;margin:0;padding:0;-webkit-text-size-adjust:none;text-size-adjust:none"><table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff"><tbody><tr><td><table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#132437"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-repeat:no-repeat;background-position:center top;color:#000;background-image:url(https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4016/blue-glow_3.jpg);width:600px" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="padding-bottom:35px;padding-left:30px;padding-right:30px;padding-top:35px;width:100%;color:#fff;"><div class="alignment" align="center" style="line-height:10px"><h1>Easy Ecole</h1></div></td></tr></table><table class="image_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="width:100%;padding-right:0;padding-left:0"><div class="alignment" align="center" style="line-height:10px"><img class="fullMobileWidth" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4016/top-rounded.png" style="display:block;height:auto;border:0;width:600px;max-width:100%" width="600"></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#ff7d14;background-image:url(https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4016/orange-gradient-wide.png);background-repeat:no-repeat"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff;color:#000;width:600px" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><table class="heading_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="padding-bottom:5px;padding-top:25px;text-align:center;width:100%"><h1 style="margin:0;color:#555;direction:ltr;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;font-size:36px;font-weight:400;letter-spacing:normal;line-height:120%;text-align:center;margin-top:0;margin-bottom:0"><strong>{{title}}</strong></h1></td></tr></table><table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad" style="padding-bottom:20px;padding-left:30px;padding-right:30px;padding-top:20px"><div style="font-family:sans-serif"><div class style="font-size:14px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:25.2px;color:#737487;line-height:1.8"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:32.4px"><span style="font-size:18px;">Hello &nbsp;{{username}}, <br>{{paragraph1}}</span></p></div></div></td></tr></table><table class="button_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="padding-bottom:30px;padding-left:15px;padding-right:15px;padding-top:20px;text-align:center"><div class="alignment" align="center"><a href="{{buttonLink}}" target="_blank" style="text-decoration:none;display:inline-block;color:#ffffff;background-color:#ff7d14;border-radius:4px;width:auto;border-top:0px solid transparent;font-weight:undefined;border-right:0px solid transparent;border-bottom:0px solid transparent;border-left:0px solid transparent;padding-top:10px;padding-bottom:10px;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;font-size:16px;text-align:center;mso-border-alt:none;word-break:keep-all;"><span style="padding-left:60px;padding-right:60px;font-size:16px;display:inline-block;letter-spacing:normal;"><span style="word-break: break-word; line-height: 32px;">{{button}}</span></span></a></div></td></tr></table><table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad" style="padding-bottom:20px;padding-left:30px;padding-right:30px;padding-top:20px"><div style="font-family:sans-serif"><div class style="font-size:14px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:25.2px;color:#737487;line-height:1.8"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:32.4px"><span style="font-size:18px;">{{paragraph2}}</span><br><a href="{{link}}">{{link}}</a></p></div></div></td></tr></table><table class="image_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="padding-bottom:40px;width:100%;padding-right:0;padding-left:0"><div class="alignment" align="center" style="line-height:10px"><img class="big" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4016/divider.png" style="display:block;height:auto;border:0;width:541px;max-width:100%" width="541" alt="line" title="line"></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#ff7d14"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#fff;color:#000;width:600px" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><table class="text_block block-4" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad"><div style="font-family:sans-serif"><div class style="font-size:14px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:25.2px;color:#07113e;line-height:1.8"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:32.4px"><span style="font-size:18px;">Rejoignez-nous sur</span></p></div></div></td></tr></table><table class="social_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="padding-bottom:15px;padding-left:15px;padding-right:15px;padding-top:10px;text-align:center"><div class="alignment" align="center"><table class="social-table" width="138px" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;display:inline-block"><tr><td style="padding:0 7px 0 7px"><a href="https://www.facebook.com" target="_blank"><img src="https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/circle-dark-gray/facebook@2x.png" width="32" height="32" alt="Facebook" title="Facebook" style="display:block;height:auto;border:0"></a></td><td style="padding:0 7px 0 7px"><a href="https://www.twitter.com" target="_blank"><img src="https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/circle-dark-gray/twitter@2x.png" width="32" height="32" alt="Twitter" title="Twitter" style="display:block;height:auto;border:0"></a></td><td style="padding:0 7px 0 7px"><a href="https://www.instagram.com" target="_blank"><img src="https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/circle-dark-gray/instagram@2x.png" width="32" height="32" alt="Instagram" title="Instagram" style="display:block;height:auto;border:0"></a></td></tr></table></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table><table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-color:#ff7d14"><tbody><tr><td><table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;background-position:center top;color:#000;width:600px" width="600"><tbody><tr><td class="column column-1" width="100%" style="mso-table-lspace:0;mso-table-rspace:0;font-weight:400;text-align:left;vertical-align:top;border-top:0;border-right:0;border-bottom:0;border-left:0"><table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0"><tr><td class="pad" style="width:100%;padding-right:0;padding-left:0"><div class="alignment" align="center" style="line-height:10px"><img class="fullMobileWidth" src="https://d1oco4z2z1fhwp.cloudfront.net/templates/default/4016/bottom-rounded.png" style="display:block;height:auto;border:0;width:600px;max-width:100%" width="600"></div></td></tr></table><table class="text_block block-2" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad" style="padding-bottom:5px;padding-left:5px;padding-right:5px;padding-top:30px"><div style="font-family:sans-serif"><div class style="font-size:12px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:14.399999999999999px;color:#262b30;line-height:1.2"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span style="font-size:12px;">© 2023 Easy Ecole @ Tous droits réservés</span></p></div></div></td></tr></table><table class="text_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace:0;mso-table-rspace:0;word-break:break-word"><tr><td class="pad" style="padding-bottom:35px;padding-left:10px;padding-right:10px;padding-top:5px"><div style="font-family:sans-serif"><div class style="font-size:12px;font-family:Arial,Helvetica Neue,Helvetica,sans-serif;mso-line-height-alt:14.399999999999999px;color:#262b30;line-height:1.2"><p style="margin:0;font-size:14px;text-align:center;mso-line-height-alt:16.8px"><span style="font-size:12px;">If you prefer not to receive marketing emails form this list, <a style="text-decoration: underline; color: #262b30;" href="http://www.example.com" target="_blank" rel="noopener">click here to unsubscribe</a>.</span></p></div></div></td></tr></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></body></html>`
        // const content = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Email template</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><style>body, body *:not(html):not(style):not(br):not(tr):not(code){ box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;} body{ -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height: 100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;} p, ul, ol, blockquote{ line-height: 1.4; text-align: left;} a{ color: #3869d4;} a img{ border: none;} h1{ color: #3d4852; font-size: 18px; font-weight: bold; margin-top: 0; text-align: left;} h2{ font-size: 16px; font-weight: bold; margin-top: 0; text-align: left;} h3{ font-size: 14px; font-weight: bold; margin-top: 0; text-align: left;} p{ font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;} p.sub{ font-size: 12px;} img{ max-width: 100%;} .wrapper{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; margin: 0; padding: 0; width: 100%;} .content{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 0; padding: 0; width: 100%;} .header{ padding: 25px 0; text-align: center;} .header a{ color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none;} .logo{ height: 50px; max-height: 50px; width: auto;} .body{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; border-bottom: 1px solid #edf2f7; border-top: 1px solid #edf2f7; margin: 0; padding: 0; width: 100%;} .inner-body{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; background-color: #ffffff; border-color: #e8e5ef; border-radius: 2px; border-width: 1px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015); margin: 0 auto; padding: 0; width: 570px;} .subcopy{ border-top: 1px solid #e8e5ef; margin-top: 25px; padding-top: 25px;} .subcopy p{ font-size: 14px;} .footer{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; margin: 0 auto; padding: 0; text-align: center; width: 570px;} .footer p{ color: #b0adc5; font-size: 12px; text-align: center;} .footer a{ color: #b0adc5; text-decoration: underline;} .table table{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 30px auto; width: 100%;} .table th{ border-bottom: 1px solid #edeff2; margin: 0; padding-bottom: 8px;} .table td{ color: #74787e; font-size: 15px; line-height: 18px; margin: 0; padding: 10px 0;} .content-cell{ max-width: 100vw; padding: 32px;} .action{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 30px auto; padding: 0; text-align: center; width: 100%;} .button{ -webkit-text-size-adjust: none; border-radius: 4px; color: #fff; display: inline-block; overflow: hidden; text-decoration: none;} .button-blue, .button-primary{ background-color: #2d3748; border-bottom: 8px solid #2d3748; border-left: 18px solid #2d3748; border-right: 18px solid #2d3748; border-top: 8px solid #2d3748;} .button-green, .button-success{ background-color: #48bb78; border-bottom: 8px solid #48bb78; border-left: 18px solid #48bb78; border-right: 18px solid #48bb78; border-top: 8px solid #48bb78;} .button-red, .button-error{ background-color: #e53e3e; border-bottom: 8px solid #e53e3e; border-left: 18px solid #e53e3e; border-right: 18px solid #e53e3e; border-top: 8px solid #e53e3e;} .panel{ border-left: #2d3748 solid 4px; margin: 21px 0;} .panel-content{ background-color: #edf2f7; color: #718096; padding: 16px;} .panel-content p{ color: #718096;} .panel-item{ padding: 0;} .panel-item p:last-of-type{ margin-bottom: 0; padding-bottom: 0;} .break-all{ word-break: break-all;} @media only screen and (max-width: 600px){ .inner-body{ width: 100% !important;} .footer{ width: 100% !important;}} @media only screen and (max-width: 500px){ .button{ width: 100% !important;}} </style></head><body><table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center"><table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="header"><a href="#" style="display: inline-block;"><img src="./logos/logo-text.svg" class="logo" alt="Logo"></a></td></tr><tr><td class="body" width="100%" cellpadding="0" cellspacing="0" style="border: hidden !important;"><table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="content-cell">Hello world <table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td>Regards, Easy Ecole </td></tr></table></td></tr></table></td></tr><tr><td><table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="content-cell" align="center">© 2023 Easy Ecole. All rights reserved. </td></tr></table></td></tr></table></td></tr></table></body></html>`
        const content = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Email template</title><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><style>body, body *:not(html):not(style):not(br):not(tr):not(code){ box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;} body{ -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height: 100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;} p, ul, ol, blockquote{ line-height: 1.4; text-align: left;} a{ color: #3869d4;} a img{ border: none;} h1{ color: #3d4852; font-size: 18px; font-weight: bold; margin-top: 0; text-align: left;} h2{ font-size: 16px; font-weight: bold; margin-top: 0; text-align: left;} h3{ font-size: 14px; font-weight: bold; margin-top: 0; text-align: left;} p{ font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;} p.sub{ font-size: 12px;} img{ max-width: 100%;} .wrapper{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; margin: 0; padding: 0; width: 100%;} .content{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 0; padding: 0; width: 100%;} .header{ padding: 25px 0; text-align: center;} .header a{ color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none;} .logo{ height: 80px; max-height: 80px; width: auto;} .body{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; border-bottom: 1px solid #edf2f7; border-top: 1px solid #edf2f7; margin: 0; padding: 0; width: 100%;} .inner-body{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; background-color: #ffffff; border-color: #e8e5ef; border-radius: 2px; border-width: 1px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015); margin: 0 auto; padding: 0; width: 570px;} .subcopy{ border-top: 1px solid #e8e5ef; margin-top: 25px; padding-top: 25px;} .subcopy p{ font-size: 14px;} .footer{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; margin: 0 auto; padding: 0; text-align: center; width: 570px;} .footer p{ color: #b0adc5; font-size: 12px; text-align: center;} .footer a{ color: #b0adc5; text-decoration: underline;} .table table{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 30px auto; width: 100%;} .table th{ border-bottom: 1px solid #edeff2; margin: 0; padding-bottom: 8px;} .table td{ color: #74787e; font-size: 15px; line-height: 18px; margin: 0; padding: 10px 0;} .content-cell{ max-width: 100vw; padding: 32px;} .action{ -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 30px auto; padding: 0; text-align: center; width: 100%;} .button{ -webkit-text-size-adjust: none; border-radius: 4px; color: #fff; display: inline-block; overflow: hidden; text-decoration: none;} .button-blue, .button-primary{ background-color: #2d3748; border-bottom: 8px solid #2d3748; border-left: 18px solid #2d3748; border-right: 18px solid #2d3748; border-top: 8px solid #2d3748;} .button-green, .button-success{ background-color: #48bb78; border-bottom: 8px solid #48bb78; border-left: 18px solid #48bb78; border-right: 18px solid #48bb78; border-top: 8px solid #48bb78;} .button-red, .button-error{ background-color: #e53e3e; border-bottom: 8px solid #e53e3e; border-left: 18px solid #e53e3e; border-right: 18px solid #e53e3e; border-top: 8px solid #e53e3e;} .panel{ border-left: #2d3748 solid 4px; margin: 21px 0;} .panel-content{ background-color: #edf2f7; color: #718096; padding: 16px;} .panel-content p{ color: #718096;} .panel-item{ padding: 0;} .panel-item p:last-of-type{ margin-bottom: 0; padding-bottom: 0;} .break-all{ word-break: break-all;} @media only screen and (max-width: 600px){ .inner-body{ width: 100% !important;} .footer{ width: 100% !important;}} @media only screen and (max-width: 500px){ .button{ width: 100% !important;}} </style></head><body><table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center"><table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="header"><a href="#" style="display: inline-block;"><img src="https://laravel.com/img/notification-logo.png" class="logo" alt="Logo"></a></td></tr><tr><td class="body" width="100%" cellpadding="0" cellspacing="0" style="border: hidden !important;"><table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="content-cell">Hello world <br>Cordialement, <br>Easy Ecole <table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td><p>Veuillez ouvrir ce lien dans le navigateur en cas de problème</p></td></tr></table></td></tr></table></td></tr><tr><td><table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation"><tr><td class="content-cell" align="center"><p>© 2023 Easy Ecole. All rights reserved.</p></td></tr></table></td></tr></table></td></tr></table></body></html>`
        return content
        // const replaced = content
        //     .replace(/{{title}}/g, template.title)
        //     .replace(/{{username}}/g, template.fullname)
        //     .replace(/{{paragraph1}}/g, template.paragraph1)
        //     .replace(/{{buttonLink}}/g, template.buttonLink)
        //     .replace(/{{button}}/g, template.button)
        //     .replace(/{{paragraph2}}/g, template.paragraph2)
        //     .replace(/{{link}}/g, template.link)

        // return replaced
    }
}
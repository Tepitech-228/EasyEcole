import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { CountOptions, FindOptions, InferAttributes, Op } from "sequelize";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { PaiementInscription } from "../models/PaiementInscription";
import { TypesPaiement } from "../../../core/enums/TypesPaiement";
import { IDGenerator } from "../../../core/helpers/IDGenerator";
import { DemandeInscription } from "../models/DemandeInscription";
import { Banque } from "../../auth/models/Banque";
import { CaissierBanque } from "../../auth/models/CaissierBanque";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Etablissement } from "../../etablissement/models/Etablissement";
import { creerEcritureComptable, lettrerEcritures411 } from "../../comptabilite/helpers/ComptabiliteHelper";
import { MobileMoneyCinetpay } from "../../../core/helpers/MobileMoneyCinetpay";
import { DocumentPDFGenerator } from "../../../core/helpers/DocumentPDFGenerator";
import { EmailSender } from "../../../core/helpers/EmailSender";
import { ArchiveGedService } from "../../../core/services/ArchiveGedService";
import { DocGenGeneratorService } from "../../docgen/services/DocGenGeneratorService";
import { DocGenType } from "../../docgen/models/DocGenType";
import { DocGenDocument } from "../../docgen/models/DocGenDocument";
import { ParentEnfant } from "../../parent/models/ParentEnfant";

export default class PaiementInscriptionController {

    constructor() { }

    static async getAllPaiementsInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        // if(req.query.matricule) {
        //     options = {
        //         where: {matriculeInscription: req.query.matricule as string}
        //     }
        // }
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { include: [{ association: PaiementInscription.associations.demandeInscription, where: { utilisateurId: (req as any).utilisateurId } }] }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            let banque: Banque | null = await Banque.findOne({
                include: [{ association: Banque.associations.caissiers, where: { utilisateurId: (req as any).utilisateurId } }]
            })

            if (banque == null) {
                return res.status(500).json({ success: false });
            }
            options = {}
        }

        try {
            let paiementsInscription: PaiementInscription[];
            paiementsInscription = await PaiementInscription.findAll(options);

            return res.status(200).send(paiementsInscription);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async getPaiementInscription(req: Request, res: Response): Promise<Response> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = {
                where: { id: req.params.id }, include: [
                    { association: PaiementInscription.associations.demandeInscription, where: { utilisateurId: (req as any).utilisateurId } }
                ]
            }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }

        try {
            const paiementInscription: PaiementInscription | null = await PaiementInscription.findOne(options);

            if (paiementInscription == null)
                return res.status(404).json({ success: false, message: "Paiement non trouvé" });

            return res.status(200).send(paiementInscription);
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }


    static async createPaiementInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { matricule: req.body.matriculeInscription } }
            req.body.type = TypesPaiement.ESPECE
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { matricule: req.body.matriculeInscription } }
            req.body.type = TypesPaiement.EN_LIGNE
        }
        else {
            return res.status(403).json({ success: false })
        }

        let demandeInscription: DemandeInscription | null = await DemandeInscription.findOne(options);
        if (demandeInscription != null) {
            let paiementInscription: PaiementInscription = new PaiementInscription();
            paiementInscription.numero = IDGenerator.getInstance().generateNumeroPaiement()
            paiementInscription.matriculeInscription = req.body.matriculeInscription
            paiementInscription.montant = req.body.montant
            paiementInscription.description = req.body.description
            paiementInscription.datePaiement = req.body.datePaiement ?? new Date()
            paiementInscription.type = req.body.type ?? TypesPaiement.ESPECE
            paiementInscription.utilisateurId = (req as any).utilisateurId

            await paiementInscription.save()
                .then(async (paiementInscription) => {
                    // INSC-1.2: Écriture paiement (Débit 512 / Crédit 411)
                    await creerEcritureComptable({
                        req,
                        journalCode: 'VEN',
                        compteDebitNumero: '512',
                        compteCreditNumero: '411',
                        montant: paiementInscription.montant,
                        libelle: paiementInscription.description || `Paiement inscription #${paiementInscription.numero}`,
                        reference: paiementInscription.numero,
                        moduleSource: 'inscription',
                        referenceModuleId: String(paiementInscription.id)
                    })

                    // INSC-1.3: Lettrage automatique des créances 411
                    await lettrerEcritures411({
                        referenceModuleId: String(demandeInscription!.id),
                        paiementId: String(paiementInscription.id),
                        montant: paiementInscription.montant
                    })

                    const receiptDoc = await DocGenGeneratorService.generer({
                        typeCode: 'INS007',
                        sourceType: 'paiement',
                        sourceId: paiementInscription.id,
                        utilisateurId: paiementInscription.utilisateurId,
                        params: {
                            orientation: 'landscape',
                            margins: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
                        },
                    });

                    const receiptFilename = `${receiptDoc.reference}.pdf`;
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    const receiptUrl = `${baseUrl}/api/v1/inscription/paiementsInscription/${paiementInscription.id}/recu`;
                    const receiptFilePath = receiptDoc.filePath;

                    if (demandeInscription?.utilisateur?.email) {
                        const studentEmail = demandeInscription.utilisateur.email;
                        const studentNameEmail = `${demandeInscription.utilisateur.nom || ''} ${demandeInscription.utilisateur.prenoms || ''}`.trim() || 'Étudiant';
                        const emailHtml = `<p>Bonjour ${studentNameEmail},</p>
                            <p>Votre paiement a bien été enregistré. Vous pouvez télécharger votre reçu en cliquant sur le lien ci-dessous :</p>
                            <p><a href="${receiptUrl}">Télécharger mon reçu</a></p>
                            <p>Montant payé : ${paiementInscription.montant.toLocaleString('fr-FR')} FC</p>
                            <p>Référence : ${paiementInscription.numero}</p>
                            <p>Cordialement,<br/>Easy Ecole</p>`;

                        EmailSender.getInstance().sendMail({
                            from: `Easy Ecole <${process.env.SMTP_USER || 'no-reply@easyecole.com'}>`,
                            to: studentEmail,
                            encoding: 'UTF-8',
                            subject: 'Reçu de paiement Easy Ecole',
                            html: emailHtml,
                            attachments: fs.existsSync(receiptFilePath) ? [{ filename: receiptFilename, path: receiptFilePath }] : []
                        }).catch(err => console.error('Erreur envoi email reçu paiement :', err));
                    }

                    ArchiveGedService.archiverDepuisFichier({
                        fichierSource: receiptFilePath,
                        domaineCode: 'FIN',
                        typeDocumentCode: 'bordereau',
                        processusCode: 'BORDEREAU',
                        processusLibelle: 'Reçu de paiement',
                        processusModule: 'finance',
                        titre: `Reçu paiement inscription - ${paiementInscription.numero}`,
                        dossierGed: 'Bordereaux de paiement',
                        sourceType: 'genere_application',
                        confidentialite: 'confidentiel',
                        cycleVie: 'courant',
                    }).catch(err => console.error('Erreur archivage reçu paiement :', err));

                    return res.status(201).json({ ...paiementInscription.toJSON(), receiptUrl, receiptFilename });
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
        }
        else {
            return res.status(404).json({ matriculeNotExists: true });
        }

        return null
    }

    static async getPaymentReceipt(req: Request, res: Response): Promise<Response | null> {
        const role = (req as any).utilisateurRole;

        const includeDemande: any = {
            association: PaiementInscription.associations.demandeInscription,
            include: [{ association: DemandeInscription.associations.utilisateur }]
        };

        // Scope utilisateur (APPRENANT / PARENT) : un utilisateur ne peut consulter
        // que les reçus qui lui appartiennent (ou à ses enfants). Retour 404 neutre
        // (et non 403) pour ne pas révéler l'existence d'un paiement tiers.
        if (role === RolesUtilisateur.APPRENANT) {
            includeDemande.where = { utilisateurId: (req as any).utilisateurId };
        } else if (role === RolesUtilisateur.PARENT) {
            const enfants = await ParentEnfant.findAll({
                where: { parentUtilisateurId: (req as any).utilisateurId },
                include: [{ association: 'apprenant', attributes: ['utilisateurId'] }]
            });
            const enfantUtilisateurIds = (enfants as any[])
                .map((enfant: any) => enfant.apprenant?.utilisateurId)
                .filter((id: any) => id != null);
            if (enfantUtilisateurIds.length === 0) {
                return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
            }
            includeDemande.where = { utilisateurId: { [Op.in]: enfantUtilisateurIds } };
        }

        const paiementInscription = await PaiementInscription.findOne({
            where: { id: req.params.id },
            include: [includeDemande]
        });
        if (!paiementInscription) {
            return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
        }

        const docgenType = await DocGenType.findOne({ where: { code: 'INS007' } });
        const docgenDoc = docgenType
            ? await DocGenDocument.findOne({
                where: { typeId: docgenType.id, sourceId: paiementInscription.id },
                order: [['createdAt', 'DESC']],
            })
            : null;

        if (docgenDoc && fs.existsSync(docgenDoc.filePath)) {
            const filename = path.basename(docgenDoc.filePath);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            const stream = fs.createReadStream(docgenDoc.filePath);
            stream.pipe(res);
            return null;
        }

        const demande = paiementInscription.demandeInscription;
        const studentName = demande?.utilisateur ? `${demande.utilisateur.nom || ''} ${demande.utilisateur.prenoms || ''}`.trim() : 'Étudiant';
        const logoConfig = await Etablissement.findOne();
        let logoPath: string | undefined = undefined;
        if (logoConfig && (logoConfig as any).logo) {
            const logoValue = (logoConfig as any).logo as string;
            logoPath = logoValue.startsWith('public') ? logoValue : path.resolve('public', logoValue);
            if (!fs.existsSync(logoPath)) {
                logoPath = undefined;
            }
        }

        const filename = DocumentPDFGenerator.generateReceipt(
            paiementInscription.id!,
            paiementInscription.numero,
            studentName,
            paiementInscription.matriculeInscription,
            paiementInscription.montant,
            paiementInscription.datePaiement,
            paiementInscription.type || TypesPaiement.ESPECE,
            paiementInscription.description || '',
            logoPath,
            "public/inscription/recus/"
        );

        const filePath = path.resolve(process.cwd(), 'public/inscription/recus', filename);
        if (!fs.existsSync(filePath)) {
            return res.status(500).json({ success: false, message: 'Erreur génération du reçu' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        return null;
    }

    static async updatePaiementInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { id: req.params.id } }
        }

        let paiementInscription: PaiementInscription | null = await PaiementInscription.findOne(options);
        if (paiementInscription != null) {

            // if (paiementInscription.titre != req.body.titre && await PaiementInscription.findOne({ where: { titre: req.body.titre, sessionId: req.body.sessionId } }) != null) {
            //     return res.status(400).json({ success: false, alreadyExists: true });
            // }
            // else {

            await paiementInscription.update({
                matriculeInscription: req.body.matriculeInscription,
                montant: req.body.montant,
                description: req.body.description,
                type: req.body.type,
            })
                .then(async (paiementInscription) => {
                    return res.status(200).send(paiementInscription);
                })
                .catch((error) => {
                    return res.status(400).json({ success: false, error: error });
                });
            // }
        }
        else {
            return res.status(404).json({ success: false, message: "Paiement d'inscription non trouvé" });
        }

        return null
    }

    static async deletePaiementInscription(req: Request, res: Response): Promise<Response | null> {
        let options: FindOptions<InferAttributes<PaiementInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.INSTITUTION) {
            options = { where: { id: req.params.id } }
        }
        else if ((req as any).utilisateurRole == RolesUtilisateur.CAISSIER_BANQUE) {
            options = { where: { id: req.params.id } }
        }
        else {
            return res.status(403).json({ success: false })
        }

        let paiementInscription: PaiementInscription | null = await PaiementInscription.findOne({ where: { id: req.params.id } });
        if (paiementInscription) {
            await paiementInscription.destroy()
                .then(() => {
                    return res.status(200).json({ success: true, message: "Paiement supprimé" });
                })
                .catch((error) => {
                    console.error('Erreur', error);
                    return res.status(500).json({ success: false, message: 'Erreur interne' });
                });
        }
        else {
            return res.status(404).json({ success: false, message: "Paiement non trouvé" });
        }

        return null
    }

    static async getCount(req: Request, res: Response): Promise<Response | null> {
        let options: CountOptions<InferAttributes<PaiementInscription>> = {}

        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            return res.status(403).json({ success: false })
        }

        await PaiementInscription.count(options)
            .then((value) => {
                return res.status(200).json({ success: true, count: value });
            })
            .catch((error) => {
                console.error('Erreur', error);
                return res.status(500).json({ success: false, message: 'Erreur interne' });
            });

        return null
    }

    static async createMobileMoneyPayment(req: Request, res: Response): Promise<Response | null> {
        if ((req as any).utilisateurRole != RolesUtilisateur.APPRENANT &&
            (req as any).utilisateurRole != RolesUtilisateur.INSTITUTION) {
            return res.status(403).json({ success: false })
        }

        let options: FindOptions<InferAttributes<DemandeInscription>> = {}
        if ((req as any).utilisateurRole == RolesUtilisateur.APPRENANT) {
            options = { where: { matricule: req.body.matriculeInscription, utilisateurId: (req as any).utilisateurId } }
        } else {
            options = { where: { matricule: req.body.matriculeInscription } }
        }

        const demandeInscription = await DemandeInscription.findOne(options)
        if (demandeInscription == null) {
            return res.status(404).json({ matriculeNotExists: true })
        }

        const cinetpay = MobileMoneyCinetpay.getInstance()
        if (!cinetpay.isInitialized()) {
            return res.status(503).json({ success: false, message: 'Mobile money non configuré' })
        }

        const transactionId = cinetpay.generateTransactionId('INSC')

        const paiementInscription = new PaiementInscription()
        paiementInscription.numero = IDGenerator.getInstance().generateNumeroPaiement()
        paiementInscription.matriculeInscription = req.body.matriculeInscription
        paiementInscription.montant = req.body.montant
        paiementInscription.description = req.body.description || `Paiement mobile money inscription`
        paiementInscription.datePaiement = new Date()
        paiementInscription.type = TypesPaiement.MOBILE_MONEY
        paiementInscription.utilisateurId = (req as any).utilisateurId
        paiementInscription.transactionId = transactionId

        try {
            await paiementInscription.save()

            const paymentResult = await cinetpay.createPayment({
                transactionId,
                amount: paiementInscription.montant,
                description: paiementInscription.description,
                customerName: `${demandeInscription.utilisateur?.nom || ''} ${demandeInscription.utilisateur?.prenoms || ''}`,
                customerEmail: demandeInscription.utilisateur?.email,
                customerPhone: req.body.customerPhone,
                redirectUrl: req.body.redirectUrl,
                callbackUrl: req.body.callbackUrl,
            })

            if (!paymentResult.success) {
                return res.status(400).json({ success: false, message: paymentResult.message })
            }

            await creerEcritureComptable({
                req,
                journalCode: 'VEN',
                compteDebitNumero: '512',
                compteCreditNumero: '411',
                montant: paiementInscription.montant,
                libelle: paiementInscription.description || `Paiement mobile money #${paiementInscription.numero}`,
                reference: paiementInscription.numero,
                moduleSource: 'inscription',
                referenceModuleId: String(paiementInscription.id)
            })

            await lettrerEcritures411({
                referenceModuleId: String(demandeInscription.id),
                paiementId: String(paiementInscription.id),
                montant: paiementInscription.montant
            })

            return res.status(201).json({
                ...paiementInscription.toJSON(),
                transactionId,
                paymentUrl: paymentResult.data?.paymentUrl,
                status: paymentResult.data?.status,
            })
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }

    static async checkMobileMoneyPayment(req: Request, res: Response): Promise<Response> {
        const { transactionId } = req.params

        const cinetpay = MobileMoneyCinetpay.getInstance()
        if (!cinetpay.isInitialized()) {
            return res.status(503).json({ success: false, message: 'Mobile money non configuré' })
        }

        try {
            const result = await cinetpay.checkPayment(transactionId)

            if (result.success && result.status === 'accepted') {
                const paiement = await PaiementInscription.findOne({
                    where: { transactionId },
                    include: [{ association: PaiementInscription.associations.demandeInscription, include: [{ association: DemandeInscription.associations.utilisateur }] }]
                })

                if (paiement && !paiement.dateValidation) {
                    await paiement.update({ dateValidation: new Date() })

                    try {
                        const receiptDoc = await DocGenGeneratorService.generer({
                            typeCode: 'INS007',
                            sourceType: 'paiement',
                            sourceId: paiement.id,
                            utilisateurId: paiement.utilisateurId,
                            params: {
                                orientation: 'landscape',
                                margins: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
                            },
                        })

                        const receiptFilename = `${receiptDoc.reference}.pdf`;
                        const baseUrl = `${req.protocol}://${req.get('host')}`;
                        const receiptUrl = `${baseUrl}/api/v1/inscription/paiementsInscription/${paiement.id}/recu`;

                        const demande = paiement.demandeInscription;
                        if (demande?.utilisateur?.email) {
                            const studentNameEmail = `${demande.utilisateur.nom || ''} ${demande.utilisateur.prenoms || ''}`.trim() || 'Étudiant';
                            const emailHtml = `<p>Bonjour ${studentNameEmail},</p>
                                <p>Votre paiement mobile money a été validé. Vous pouvez télécharger votre reçu en cliquant sur le lien ci-dessous :</p>
                                <p><a href="${receiptUrl}">Télécharger mon reçu</a></p>
                                <p>Montant payé : ${paiement.montant.toLocaleString('fr-FR')} FC</p>
                                <p>Référence : ${paiement.numero}</p>
                                <p>Cordialement,<br/>Easy Ecole</p>`;

                            EmailSender.getInstance().sendMail({
                                from: `Easy Ecole <${process.env.SMTP_USER || 'no-reply@easyecole.com'}>`,
                                to: demande.utilisateur.email,
                                encoding: 'UTF-8',
                                subject: 'Reçu de paiement Easy Ecole',
                                html: emailHtml,
                                attachments: fs.existsSync(receiptDoc.filePath) ? [{ filename: receiptFilename, path: receiptDoc.filePath }] : []
                            }).catch(err => console.error('Erreur envoi email reçu paiement :', err));
                        }

                        ArchiveGedService.archiverDepuisFichier({
                            fichierSource: receiptDoc.filePath,
                            domaineCode: 'FIN',
                            typeDocumentCode: 'bordereau',
                            processusCode: 'BORDEREAU',
                            processusLibelle: 'Reçu de paiement',
                            processusModule: 'finance',
                            titre: `Reçu paiement inscription - ${paiement.numero}`,
                            dossierGed: 'Bordereaux de paiement',
                            sourceType: 'genere_application',
                            confidentialite: 'confidentiel',
                            cycleVie: 'courant',
                        }).catch(err => console.error('Erreur archivage reçu paiement :', err));

                        return res.status(200).json({ ...result, receiptUrl, receiptFilename });
                    } catch (receiptErr) {
                        console.error('Erreur génération reçu paiement mobile money :', receiptErr);
                    }
                }
            }

            return res.status(200).json(result)
        } catch (error) {
            console.error('Erreur', error);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
    }
}
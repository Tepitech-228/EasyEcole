import { Request, Response } from "express";
import { RecuCaisse } from "../models/RecuCaisse";
import { DemandeDocument } from "../models/DemandeDocument";
import { TypeDocument } from "../models/TypeDocument";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { SecretariatService } from "../services/SecretariatService";
import { JournalCaisse } from "../models/JournalCaisse";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { RecuCaisseGeneratorService } from "../services/RecuCaisseGeneratorService";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";
import { ROLES_RECOUVREMENT } from "../../../core/middlewares/AuthRecouvrement";
import { DemandeDocumentWorkflowService } from "../services/DemandeDocumentWorkflowService";
import { Op } from "sequelize";
import { DossierEtudiant } from "../../inscription/models/DossierEtudiant";
import { randomBytes } from "crypto";

export default class RecuCaisseController {

  static async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const where: any = {};
      if (req.query.caissierId) where.caissierId = req.query.caissierId;
      if (req.query.modePaiement) where.modePaiement = req.query.modePaiement;

      const { rows, count } = await RecuCaisse.findAndCountAll({
        where,
        include: [
          { association: RecuCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }, { association: DemandeDocument.associations.etudiant }] },
          { association: RecuCaisse.associations.etudiant },
          { association: RecuCaisse.associations.typeDocument },
          { association: RecuCaisse.associations.caissier }
        ],
        order: [['datePaiement', 'DESC']],
        limit,
        offset
      });

      return res.status(200).json({
        data: rows,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
      });
    } catch (error) {
      console.error('[SECRETARIAT][RecuCaisse]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async getById(req: Request, res: Response): Promise<Response> {
    try {
      const recu = await RecuCaisse.findByPk(req.params.id, {
        include: [
          { association: RecuCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }, { association: DemandeDocument.associations.etudiant }] },
          { association: RecuCaisse.associations.etudiant },
          { association: RecuCaisse.associations.typeDocument },
          { association: RecuCaisse.associations.caissier }
        ]
      });
      if (!recu) return res.status(404).json({ success: false, message: "Reçu non trouvé" });
      return res.status(200).json(recu);
    } catch (error) {
      console.error('[SECRETARIAT][RecuCaisse]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  static async print(req: Request, res: Response): Promise<Response> {
    try {
      const recu = await RecuCaisse.findByPk(req.params.id, {
        include: [
          { association: RecuCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }, { association: DemandeDocument.associations.etudiant }] },
          { association: RecuCaisse.associations.etudiant },
          { association: RecuCaisse.associations.typeDocument },
          { association: RecuCaisse.associations.caissier }
        ]
      });
      if (!recu) return res.status(404).json({ success: false, message: "Reçu non trouvé" });

      const montantLettres = SecretariatService.nombreEnLettres(recu.montant);
      const demande = recu.demandeDocument || recu.demande;
      const etudiant = recu.etudiant || demande?.etudiant;
      const typeDocument = recu.typeDocument || demande?.typeDocument;
      const html = `
        <html>
        <head><title>Reçu de caisse</title></head>
        <body style="font-family:Arial,sans-serif;padding:40px;">
          <h2 style="text-align:center;">REÇU DE CAISSE</h2>
          <p><strong>N° Reçu :</strong> ${recu.numero}</p>
          <p><strong>Date :</strong> ${new Date(recu.datePaiement).toLocaleDateString('fr-FR')}</p>
          <p><strong>Étudiant :</strong> ${etudiant?.nom || ''} ${etudiant?.prenoms || ''}</p>
          <p><strong>Document :</strong> ${typeDocument?.libelle || ''}</p>
          <p><strong>Montant :</strong> ${recu.montant.toLocaleString('fr-FR')} FCFA</p>
          <p><strong>En toutes lettres :</strong> ${montantLettres}</p>
          <p><strong>Mode de paiement :</strong> ${recu.modePaiement}</p>
          <p><strong>Caissier :</strong> ${recu.caissier?.nom || ''} ${recu.caissier?.prenoms || ''}</p>
          <p style="margin-top:60px;">Signature caissier : ____________________</p>
        </body>
        </html>
      `;

      return res.status(200).send(html);
    } catch (error) {
      console.error('[SECRETARIAT][RecuCaisse]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur interne" });
    }
  }

  /**
   * GET /recusCaisse/:id/download
   * Télécharge le PDF du reçu de caisse.
   */
  static async download(req: Request, res: Response): Promise<Response> {
    try {
      const role = (req as any).utilisateurRole;
      const utilisateurId = Number((req as any).utilisateurId);
      const estApprenant = role === RolesUtilisateur.APPRENANT;
      if (!estApprenant && !ROLES_RECOUVREMENT.includes(role)) {
        return res.status(403).json({ success: false, message: "Accès réservé au service de recouvrement" });
      }

      let recu = await RecuCaisse.findByPk(req.params.id, estApprenant ? {
        include: [{ association: RecuCaisse.associations.demandeDocument, attributes: ['etudiantId'] }]
      } : undefined);
      if (!recu) return res.status(404).json({ success: false, message: "Reçu non trouvé" });
      if (estApprenant
        && Number(recu.etudiantId || recu.demandeDocument?.etudiantId) !== utilisateurId) {
        return res.status(403).json({ success: false, message: "Ce reçu ne vous appartient pas" });
      }

      let filePath = RecuCaisseGeneratorService.telechargerRecu(recu);
      if (!filePath) {
        await RecuCaisseGeneratorService.genererRecu(recu);
        recu = await RecuCaisse.findByPk(recu.id);
        if (!recu) return res.status(404).json({ success: false, message: "Reçu non trouvé" });
        filePath = RecuCaisseGeneratorService.telechargerRecu(recu);
        if (!filePath) return res.status(404).json({ success: false, message: "PDF du reçu indisponible après génération." });
      }

      res.download(filePath, `RCU-${recu.numero}.pdf`);
      return res;
    } catch (error) {
      console.error('[SECRETARIAT][RecuCaisse][download]', error);
      return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: "Erreur lors du téléchargement" });
    }
  }

    static async getEtudiantsPourPaiement(req: Request, res: Response): Promise<Response> {
      if (!ROLES_RECOUVREMENT.includes((req as any).utilisateurRole)) {
        return res.status(403).json({ success: false, message: "Accès réservé au service de recouvrement" });
      }

      const search = String(req.query.search || '').trim();
      if (search.length < 2 || search.length > 100) {
        return res.status(400).json({ success: false, message: "Saisissez au moins 2 caractères pour rechercher un étudiant" });
      }

      try {
        const like = `%${search}%`;
        const [utilisateursDirects, dossiers] = await Promise.all([
          Utilisateur.findAll({
            where: {
              role: RolesUtilisateur.APPRENANT,
              [Op.or]: [
                { nom: { [Op.like]: like } },
                { prenoms: { [Op.like]: like } },
                { identifiant: { [Op.like]: like } }
              ]
            },
            attributes: ['id', 'nom', 'prenoms', 'identifiant'],
            limit: 30,
            order: [['nom', 'ASC'], ['prenoms', 'ASC']]
          }),
          DossierEtudiant.findAll({
            where: { matricule: { [Op.like]: like } },
            attributes: ['utilisateurId', 'matricule'],
            limit: 30,
            raw: true
          })
        ]);

        const matricules = new Map<number, string>();
        dossiers.forEach((dossier: any) => {
          if (dossier.utilisateurId) matricules.set(Number(dossier.utilisateurId), String(dossier.matricule || ''));
        });
        const ids = new Set<number>([
          ...utilisateursDirects.map((utilisateur: any) => Number(utilisateur.id)),
          ...matricules.keys()
        ]);
        const utilisateurs = ids.size === utilisateursDirects.length
          ? utilisateursDirects
          : await Utilisateur.findAll({
            where: { id: { [Op.in]: [...ids] }, role: RolesUtilisateur.APPRENANT },
            attributes: ['id', 'nom', 'prenoms', 'identifiant'],
            limit: 30,
            order: [['nom', 'ASC'], ['prenoms', 'ASC']]
          });

        return res.status(200).json({
          data: utilisateurs.map((utilisateur: any) => ({
            id: utilisateur.id,
            nom: utilisateur.nom,
            prenoms: utilisateur.prenoms,
            matricule: matricules.get(Number(utilisateur.id)) || utilisateur.identifiant || ''
          }))
        });
      } catch (error) {
        console.error('[RECOUVREMENT][searchStudents]', error);
        return res.status(500).json({ success: false, message: "Impossible de rechercher les étudiants" });
      }
    }

    static async getTypesDocumentsEncaissement(req: Request, res: Response): Promise<Response> {
      if (!ROLES_RECOUVREMENT.includes((req as any).utilisateurRole)) {
        return res.status(403).json({ success: false, message: "Accès réservé au service de recouvrement" });
      }
      try {
        const types = await TypeDocument.findAll({
          where: { actif: true },
          attributes: ['id', 'libelle', 'frais'],
          order: [['libelle', 'ASC']]
        });
        return res.status(200).json(types);
      } catch (error) {
        console.error('[RECOUVREMENT][documentTypes]', error);
        return res.status(500).json({ success: false, message: "Impossible de charger les tarifs des documents" });
      }
    }

    static async collecterPaiementDemandeDocument(req: Request, res: Response): Promise<Response> {
      const utilisateurId = Number((req as any).utilisateurId);
      if (!ROLES_RECOUVREMENT.includes((req as any).utilisateurRole)) {
        return res.status(403).json({ success: false, message: "Accès réservé au service de recouvrement" });
      }

      const etudiantId = Number(req.body.etudiantId);
      const typeDocumentId = Number(req.body.typeDocumentId);
      const modePaiement = req.body.modePaiement;
      const referencePaiement = String(req.body.referencePaiement || '').trim();
      const modesValides = ['especes', 'mobile_money', 'autre'];
      if (!Number.isInteger(etudiantId) || etudiantId <= 0 || !Number.isInteger(typeDocumentId) || typeDocumentId <= 0) {
        return res.status(400).json({ success: false, message: "Étudiant et type de document requis" });
      }
      if (!modesValides.includes(modePaiement)) {
        return res.status(400).json({ success: false, message: `Mode de paiement invalide. Valeurs acceptées : ${modesValides.join(', ')}` });
      }
      if (referencePaiement.length > 100) {
        return res.status(400).json({ success: false, message: "La référence de paiement ne peut pas dépasser 100 caractères" });
      }

      try {
        const [etudiant, typeDocument] = await Promise.all([
          Utilisateur.findOne({
            where: { id: etudiantId, role: RolesUtilisateur.APPRENANT },
            attributes: ['id', 'nom', 'prenoms', 'identifiant']
          }),
          TypeDocument.findOne({ where: { id: typeDocumentId, actif: true } })
        ]);
        if (!etudiant) return res.status(404).json({ success: false, message: "Étudiant introuvable" });
        if (!typeDocument) return res.status(404).json({ success: false, message: "Type de document indisponible" });
        const montant = Number(typeDocument.frais) || 0;
        if (montant <= 0) {
          return res.status(400).json({ success: false, message: "Ce document ne nécessite pas de paiement" });
        }

        const numero = `RCU-DOC-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
        const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
        let recu: RecuCaisse;
        try {
          recu = await RecuCaisse.create({
            numero,
            demandeDocumentId: null,
            etudiantId,
            typeDocumentId,
            montant,
            modePaiement,
            referencePaiement: referencePaiement || null,
            caissierId: utilisateurId,
            datePaiement: new Date()
          }, { transaction });
          await JournalCaisse.create({
            clotureId: null,
            demandeDocumentId: null,
            recuId: recu.id,
            modePaiement,
            montant
          }, { transaction });
          await transaction.commit();
        } catch (error) {
          await transaction.rollback();
          throw error;
        }

        await SecretariatService.logAction(
          'PAIEMENT_DEMANDE_DOCUMENT',
          utilisateurId,
          null,
          `Reçu ${numero} — ${etudiant.nom || ''} ${etudiant.prenoms || ''} — ${typeDocument.libelle} — ${montant} FCFA`
        );

        try {
          await RecuCaisseGeneratorService.genererRecu(recu);
        } catch (error) {
          console.error(`[RECOUVREMENT][receiptPdf] recu=${recu.id}`, error);
          return res.status(500).json({
            success: false,
            code: 'RECEIPT_PDF_FAILED',
            message: `Paiement enregistré sous le reçu ${numero}, mais le PDF n'a pas pu être généré. Réessayez le téléchargement du reçu.`,
            recuId: recu.id,
            numero
          });
        }

        const recuComplet = await RecuCaisse.findByPk(recu.id, {
          include: [
            { association: RecuCaisse.associations.etudiant },
            { association: RecuCaisse.associations.typeDocument },
            { association: RecuCaisse.associations.caissier }
          ]
        });
        return res.status(201).json(recuComplet || recu);
      } catch (error) {
        console.error(`[RECOUVREMENT][collectDocumentPayment] user=${utilisateurId} student=${etudiantId} type=${typeDocumentId}`, error);
        return res.status(500).json({ success: false, code: 'PAYMENT_DATABASE_ERROR', message: "Impossible d'enregistrer le paiement du document" });
      }
    }

  static async getJournalCaisse(req: Request, res: Response): Promise<Response> {
    try {
      const { dateDebut, dateFin } = req.query;
      const sequelize = DatabaseConnection.getInstance().sequelize;

      let sql = `
        SELECT j.id, j.modePaiement, j.montant, j.createdAt,
               d.numeroDemande, u.nom, u.prenoms, td.libelle as document
        FROM scol_journal_caisse j
        LEFT JOIN scol_demandes_document d ON d.id = j.demandeDocumentId
        LEFT JOIN scol_recus_caisse r ON r.id = j.recuId
        LEFT JOIN aut_utilisateurs u ON u.id = r.caissierId
        LEFT JOIN scol_types_document td ON td.id = d.typeDocumentId
        WHERE 1=1
      `;
      const replacements: any = {};

      if (dateDebut) {
        sql += ` AND DATE(j.createdAt) >= :dateDebut`;
        replacements.dateDebut = dateDebut;
      }
      if (dateFin) {
        sql += ` AND DATE(j.createdAt) <= :dateFin`;
        replacements.dateFin = dateFin;
      }

      sql += ` ORDER BY j.createdAt DESC`;

      const [rows]: any[] = await sequelize.query(sql, { replacements });
      return res.status(200).json(rows);
    } catch (error) {
      console.error('[SECRETARIAT][getJournalCaisse]', error);
      return res.status(500).json({ success: false, code: 'DATABASE_ERROR', message: "Erreur lors du chargement du journal de caisse" });
    }
  }

  static async paiementApresCreationDesactive(_req: Request, res: Response): Promise<Response> {
    return res.status(410).json({
      success: false,
      code: 'PAYMENT_MUST_PRECEDE_REQUEST',
      message: "Le paiement après création est désactivé. L'étudiant doit payer au service de recouvrement avant de créer sa demande."
    });
  }
}

import { Request, Response } from "express";
import { RecuCaisse } from "../models/RecuCaisse";
import { DemandeDocument } from "../models/DemandeDocument";
import { SecretariatService } from "../services/SecretariatService";
import { JournalCaisse } from "../models/JournalCaisse";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";

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
          { association: RecuCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }] },
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
          { association: RecuCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }] },
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
          { association: RecuCaisse.associations.demandeDocument, include: [{ association: DemandeDocument.associations.typeDocument }] },
          { association: RecuCaisse.associations.caissier }
        ]
      });
      if (!recu) return res.status(404).json({ success: false, message: "Reçu non trouvé" });

      const montantLettres = SecretariatService.nombreEnLettres(recu.montant);
      const html = `
        <html>
        <head><title>Reçu de caisse</title></head>
        <body style="font-family:Arial,sans-serif;padding:40px;">
          <h2 style="text-align:center;">REÇU DE CAISSE</h2>
          <p><strong>N° Reçu :</strong> ${recu.numero}</p>
          <p><strong>Date :</strong> ${new Date(recu.datePaiement).toLocaleDateString('fr-FR')}</p>
          <p><strong>Étudiant :</strong> ${recu.demande?.etudiant?.nom || ''} ${recu.demande?.etudiant?.prenoms || ''}</p>
          <p><strong>Document :</strong> ${recu.demande?.typeDocument?.libelle || ''}</p>
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

  static async collecterPaiement(req: Request, res: Response): Promise<Response> {
    const utilisateurId = (req as any).utilisateurId;
    const { demandeId, modePaiement, montant } = req.body;

    // ── Validation des entrées ──
    if (!demandeId || !modePaiement || montant === undefined || montant === null) {
      return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message: "demandeId, modePaiement et montant requis" });
    }
    const modesValides = ['especes', 'mobile_money', 'autre'];
    if (!modesValides.includes(modePaiement)) {
      return res.status(400).json({ success: false, code: 'MODE_PAIEMENT_INVALIDE', message: `modePaiement doit être : ${modesValides.join(', ')}` });
    }
    const montantNum = Number(montant);
    if (!Number.isFinite(montantNum) || montantNum <= 0) {
      return res.status(400).json({ success: false, code: 'MONTANT_INVALIDE', message: "Le montant doit être strictement positif" });
    }

    try {
      const demande: DemandeDocument | null = await DemandeDocument.findByPk(demandeId);
      if (!demande) {
        return res.status(404).json({ success: false, code: 'DEMANDE_NOT_FOUND', message: "Demande non trouvée" });
      }

      // Erreur métier : double encaissement interdit
      if (demande.fraisPayes) {
        return res.status(409).json({ success: false, code: 'PAYMENT_ALREADY_REGISTERED', message: "Cette demande a déjà été payée" });
      }
      const attendu = Number(demande.montant) || 0;
      if (attendu > 0 && montantNum !== attendu) {
        return res.status(400).json({ success: false, code: 'MONTANT_INCOHERENT', message: `Montant incohérent : ${attendu} FCFA attendus` });
      }

      const numeroRecu = `RECU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Transaction : reçu + mise à jour demande + journal de caisse doivent être atomiques.
      const transaction = await DatabaseConnection.getInstance().sequelize.transaction();
      try {
        const recu = await RecuCaisse.create({
          numero: numeroRecu,
          demandeDocumentId: demande.id,
          montant: montantNum,
          modePaiement,
          caissierId: utilisateurId,
          datePaiement: new Date()
        }, { transaction });

        await demande.update({
          fraisPayes: true,
          datePaiement: new Date(),
          modePaiement,
          numeroRecu,
          statut: 'paye'
        }, { transaction });

        await JournalCaisse.create({
          clotureId: null,
          demandeDocumentId: demande.id,
          recuId: recu.id,
          modePaiement,
          montant: montantNum
        }, { transaction });

        await SecretariatService.logAction('PAIEMENT_ENCAISSE', utilisateurId, demande.id, `Reçu ${numeroRecu} — ${montantNum} FCFA`);

        await transaction.commit();
        return res.status(201).json(recu);
      } catch (error) {
        await transaction.rollback().catch(rbErr => console.error('[SECRETARIAT][collecterPaiement] rollback échoué:', rbErr));
        throw error;
      }
    } catch (error) {
      console.error(`[SECRETARIAT][collecterPaiement] user=${utilisateurId} demande=${demandeId}`, error);
      return res.status(500).json({ success: false, code: 'PAYMENT_DATABASE_ERROR', message: "Erreur lors de l'enregistrement du paiement" });
    }
  }
}

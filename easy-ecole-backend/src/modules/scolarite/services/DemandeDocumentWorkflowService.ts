import { DemandeDocument } from "../models/DemandeDocument";
import { DemandeDocumentPiece } from "../models/DemandeDocumentPiece";
import { TypeDocument } from "../models/TypeDocument";

export class DemandeDocumentWorkflowService {
  static async promouvoirAuComiteSiPret(demandeId: number): Promise<boolean> {
    const demande = await DemandeDocument.findByPk(demandeId);
    if (!demande) throw new Error(`Demande de document ${demandeId} introuvable`);
    if (!['soumise', 'paye'].includes(demande.statut)) return demande.statut === 'en_comite';

    const typeDocument = await TypeDocument.findByPk(demande.typeDocumentId);
    if (!typeDocument) throw new Error(`Type de document introuvable pour la demande ${demande.id}`);

    const pieces = await DemandeDocumentPiece.findAll({
      where: { demandeId: demande.id, estCourante: true }
    });
    const piecesParCle = new Map(pieces.map(piece => [piece.cle, piece]));
    const obligatoires = (typeDocument.piecesRequises || []).filter(piece => piece.obligatoire !== false);
    if (Number(demande.montant) > 0) {
      obligatoires.push({ cle: 'bordereau', libelle: 'Bordereau de paiement', obligatoire: true });
    }
    if (obligatoires.some(piece => !piecesParCle.has(piece.cle))) return false;
    if (pieces.some(piece => piece.statutAudit !== 'validee')) return false;
    if (Number(demande.montant) > 0 && !demande.fraisPayes) return false;

    await demande.update({ statut: 'en_comite' });
    return true;
  }
}

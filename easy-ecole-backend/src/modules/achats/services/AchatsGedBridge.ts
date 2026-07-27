import { GedIntegrationService } from "../../ged/services/GedIntegrationService";

export class AchatsGedBridge {

  static async verserFacture(facture: any, fournisseurNom: string, userId: number): Promise<void> {
    try {
      const fichier = facture.fichier;
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Facture - ${fournisseurNom} - ${facture.reference || `#${facture.id}`}`,
        fichier,
        taille: facture.taille,
        domaineCode: 'FIN',
        processusCode: 'FACTURE',
        documentTypeCode: 'facture',
        sourceType: 'genere_application',
        externalIssuer: fournisseurNom,
        metadata: { factureId: facture.id, montant: facture.montantTotal, fournisseur: fournisseurNom }
      }, userId);
    } catch (error) {
      console.error('Erreur versement facture GED:', error);
    }
  }

  static async verserBonCommande(commande: any, fournisseurNom: string, userId: number): Promise<void> {
    try {
      const fichier = commande.fichier;
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Bon de commande - ${fournisseurNom} - ${commande.reference || `#${commande.id}`}`,
        fichier,
        domaineCode: 'PAT',
        processusCode: 'BON_COMMANDE',
        documentTypeCode: 'bon_commande',
        sourceType: 'genere_application',
        metadata: { commandeId: commande.id, fournisseur: fournisseurNom, montant: commande.montant }
      }, userId);
    } catch (error) {
      console.error('Erreur versement bon commande GED:', error);
    }
  }

  static async verserBonReception(reception: any, fournisseurNom: string, userId: number): Promise<void> {
    try {
      const fichier = reception.fichier;
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Bon de réception - ${fournisseurNom} - ${reception.reference || `#${reception.id}`}`,
        fichier,
        domaineCode: 'PAT',
        processusCode: 'RECEPTION',
        documentTypeCode: 'bon_commande',
        sourceType: 'genere_application',
        metadata: { receptionId: reception.id, fournisseur: fournisseurNom }
      }, userId);
    } catch (error) {
      console.error('Erreur versement bon réception GED:', error);
    }
  }
}

import { GedIntegrationService } from "../../ged/services/GedIntegrationService";

export class RhGedBridge {

  static async verserBulletinPaie(bulletin: any, userId: number): Promise<void> {
    try {
      const fichier = bulletin.fichier;
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Bulletin de paie - ${bulletin.employe?.nom || `Employé #${bulletin.employeId}`} - ${bulletin.periodePaie?.libelle || ''}`,
        fichier,
        taille: bulletin.taille,
        domaineCode: 'RH',
        processusCode: 'PAIE',
        documentTypeCode: 'bulletin_paie',
        sourceType: 'genere_application',
        metadata: { bulletinId: bulletin.id, periodeId: bulletin.periodeId, salaireNet: bulletin.netAPayer }
      }, userId);
    } catch (error) {
      console.error('Erreur versement bulletin paie GED:', error);
    }
  }

  static async verserContratEnseignant(contrat: any, userId: number): Promise<void> {
    try {
      const fichier = contrat.pieceJointe;
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Contrat - ${contrat.employe?.nom || `Enseignant #${contrat.employeId}`}`,
        fichier,
        domaineCode: 'RH',
        processusCode: 'CONTRAT_ENSEIGNANT',
        documentTypeCode: 'contrat_travail',
        sourceType: 'genere_application',
        metadata: { contratId: contrat.id, type: contrat.typeContrat, statut: contrat.statut }
      }, userId);
    } catch (error) {
      console.error('Erreur versement contrat GED:', error);
    }
  }
}

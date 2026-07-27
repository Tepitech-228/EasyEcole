import { GedIntegrationService } from "./GedIntegrationService";

export class PointageGedBridge {

  static async verserFichePointage(employeNom: string, mois: string, annee: number, fichier: string, userId: number, metadata?: Record<string, any>): Promise<void> {
    try {
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Fiche de pointage - ${employeNom} - ${mois} ${annee}`,
        fichier,
        domaineCode: 'RH',
        processusCode: 'POINTAGE',
        documentTypeCode: 'pointage',
        sourceType: 'genere_application',
        metadata: { employe: employeNom, mois, annee, ...metadata }
      }, userId);
    } catch (error) {
      console.error('Erreur versement fiche pointage GED:', error);
    }
  }

  static async verserRapportPointage(serviceNom: string, mois: string, annee: number, fichier: string, userId: number): Promise<void> {
    try {
      if (!fichier) return;

      await GedIntegrationService.createDocument({
        titre: `Rapport pointage - ${serviceNom} - ${mois} ${annee}`,
        fichier,
        domaineCode: 'RH',
        processusCode: 'POINTAGE',
        documentTypeCode: 'pointage',
        sourceType: 'genere_application',
        metadata: { service: serviceNom, mois, annee, type: 'rapport' }
      }, userId);
    } catch (error) {
      console.error('Erreur versement rapport pointage GED:', error);
    }
  }
}

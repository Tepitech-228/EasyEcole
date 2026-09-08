import { Injectable } from '@angular/core';
import { DossierNode } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { DemandeDocument } from '../models/DemandeDocument.model';
import { Parcours } from '../../inscription/models/Parcours.model';
import { NiveauEtude } from '../../inscription/models/NiveauEtude.model';
import { Classe } from '../../inscription/models/Classe.model';

/**
 * Construit l'arborescence de consultation des demandes de documents :
 *   Parcours (filière) → Niveau → Classe (option Matin / Soir) → demandes.
 * Utilisée par la Caisse et l'Encaissement du secrétariat.
 */
@Injectable({ providedIn: 'root' })
export class DemandeDocumentArbreService {

  construireArbre(
    demandes: DemandeDocument[],
    parcoursList: Parcours[],
    niveaux: NiveauEtude[],
    classes: Classe[]
  ): DossierNode[] {
    const arbre = new Map<string, Map<string, Map<string, any[]>>>();

    for (const d of demandes) {
      const parcoursKey = String(d.parcoursId ?? 'sans-parcours');
      const niveauKey = String(d.niveauEtudeId ?? 'sans-niveau');
      const classeKey = String(d.classeId ?? 'sans-classe');

      if (!arbre.has(parcoursKey)) arbre.set(parcoursKey, new Map());
      if (!arbre.get(parcoursKey)!.has(niveauKey)) arbre.get(parcoursKey)!.set(niveauKey, new Map());
      if (!arbre.get(parcoursKey)!.get(niveauKey)!.has(classeKey)) arbre.get(parcoursKey)!.get(niveauKey)!.set(classeKey, []);

      arbre.get(parcoursKey)!.get(niveauKey)!.get(classeKey)!.push(this.enrichirItem(d));
    }

    return Array.from(arbre.entries()).map(([parcoursKey, niveauxMap]) => ({
      type: 'parcours' as const,
      label: this.libelleParcours(parcoursKey, parcoursList),
      id: parcoursKey,
      expanded: true,
      children: Array.from(niveauxMap.entries()).map(([niveauKey, classesMap]) => ({
        type: 'niveau' as const,
        label: this.libelleNiveau(niveauKey, niveaux),
        id: niveauKey,
        expanded: true,
        children: Array.from(classesMap.entries()).map(([classeKey, items]) => ({
          type: 'classe' as const,
          label: this.libelleClasse(classeKey, classes),
          id: classeKey,
          expanded: true,
          items
        }))
      }))
    }));
  }

  /** Libellé de l'option horaire : JOUR → Matin, SOIR → Soir, EN_LIGNE → En ligne */
  optionLibelle(option?: string | null): string {
    switch (option) {
      case 'JOUR': return 'Matin';
      case 'SOIR': return 'Soir';
      case 'EN_LIGNE': return 'En ligne';
      default: return '';
    }
  }

  /** Prépare chaque demande pour l'affichage en tableau (labels + indicateurs UI) */
  private enrichirItem(d: DemandeDocument): any {
    const nom = (d.etudiant as any)?.nom || '';
    const prenoms = (d.etudiant as any)?.prenoms || '';
    const matricule = (d.etudiant as any)?.matricule || '';
    return {
      ...d,
      etudiantLabel: `${nom} ${prenoms}`.trim() || `Étudiant #${d.etudiantId}`,
      etudiantMatricule: matricule,
      numeroAffichage: d.numeroDemande || `#${d.id}`
    };
  }

  private libelleParcours(id: string, list: Parcours[]): string {
    if (id === 'sans-parcours') return 'Sans filière';
    return list.find(p => String(p.id) === id)?.titre || `Filière #${id}`;
  }

  private libelleNiveau(id: string, list: NiveauEtude[]): string {
    if (id === 'sans-niveau') return 'Sans niveau';
    return list.find(n => String(n.id) === id)?.libelle || `Niveau #${id}`;
  }

  private libelleClasse(id: string, list: Classe[]): string {
    if (id === 'sans-classe') return 'Sans classe';
    const cls = list.find(c => String(c.id) === id);
    if (!cls) return `Classe #${id}`;
    const option = this.optionLibelle(cls.option);
    return option ? `${cls.libelle || 'Classe'} · ${option}` : (cls.libelle || 'Classe');
  }
}
import { Component, OnInit } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-mon-releve-page',
  templateUrl: './mon-releve-page.component.html',
  styleUrls: ['./mon-releve-page.component.scss']
})
export class MonRelevePageComponent extends BaseComponentClass implements OnInit {
  bulletins: any[] = [];
  loading: boolean = false;

  /** Semi-semestres accessibles en 1ère année (le backend filtre déjà la liste). */
  private static readonly SEMESTRES_PREMIERE_ANNEE: string[] = ['semestre1', 'semestre2'];

  constructor(private bulletinService: BulletinService) { super(); }

  ngOnInit() {
    this.loading = true;
    this.bulletinService.monReleve().subscribe({
      next: (data) => this.bulletins = Array.isArray(data) ? data : [data],
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  /** L'utilisateur connecté est un apprenant de 1ère année : sa liste ne comporte que les semestres 1-2. */
  get estPremiereAnnee(): boolean {
    return this.rolesValue.isApprenant &&
      this.bulletins.length > 0 &&
      this.bulletins.every((b: any) => MonRelevePageComponent.SEMESTRES_PREMIERE_ANNEE.includes(b.semestre));
  }

  /** Bulletins réellement affichés : masque les semestres > 2 pour les 1ères années. */
  get bulletinsVisibles(): any[] {
    if (!this.estPremiereAnnee) return this.bulletins;
    return this.bulletins.filter((b: any) => MonRelevePageComponent.SEMESTRES_PREMIERE_ANNEE.includes(b.semestre));
  }

  getSemestre(s: string): string {
    const map: Record<string, string> = {
      semestre1: 'Semestre 1', semestre2: 'Semestre 2', semestre3: 'Semestre 3',
      semestre4: 'Semestre 4', semestre5: 'Semestre 5', semestre6: 'Semestre 6'
    };
    return map[s] || s;
  }

  getNoteClass(v: number | null): string {
    if (v == null) return '';
    return v >= 10 ? 'text-emerald-700' : 'text-blue-700';
  }

  getMentionLabel(m: string): { class: string; label: string } {
    const map: Record<string, { class: string; label: string }> = {
      'Très Bien': { class: 'from-green-400 to-green-600', label: 'Très Bien' },
      'Bien': { class: 'from-blue-400 to-blue-600', label: 'Bien' },
      'Assez Bien': { class: 'from-indigo-400 to-indigo-600', label: 'Assez Bien' },
      'Passable': { class: 'from-amber-400 to-amber-600', label: 'Passable' },
      'Insuffisant': { class: 'from-blue-400 to-blue-600', label: 'Insuffisant' },
    };
    return map[m] || { class: 'from-gray-400 to-gray-600', label: m };
  }
}

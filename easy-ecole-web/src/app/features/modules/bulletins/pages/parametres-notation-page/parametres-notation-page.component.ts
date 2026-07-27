import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { MccService } from '../../services/mcc.service';
import { EchelleNoteService } from '../../services/echelle-note.service';

@Component({
  selector: 'app-parametres-notation-page',
  templateUrl: './parametres-notation-page.component.html',
  styleUrls: ['./parametres-notation-page.component.scss']
})
export class ParametresNotationPageComponent extends BaseComponentClass implements OnInit {
  activeTab: 'mcc' | 'echelles' = 'mcc';

  mccItems: any[] = [];
  mccLoading = false;

  echelles: any[] = [];
  echellesLoading = false;

  constructor(
    private mccService: MccService,
    private echelleService: EchelleNoteService,
    private router: Router
  ) { super(); }

  ngOnInit(): void {
    this.loadMcc();
    this.loadEchelles();
  }

  setActiveTab(tab: 'mcc' | 'echelles'): void {
    this.activeTab = tab;
  }

  loadMcc(): void {
    this.mccLoading = true;
    this.mccService.getAll().subscribe({
      next: (res) => { this.mccItems = res; this.mccLoading = false; },
      error: () => { this.mccLoading = false; }
    });
  }

  loadEchelles(): void {
    this.echellesLoading = true;
    this.echelleService.getAll().subscribe({
      next: (res) => { this.echelles = res; this.echellesLoading = false; },
      error: () => { this.echellesLoading = false; }
    });
  }

  supprimerMcc(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.mccService.delete(id).subscribe(() => {
      this.mccItems = this.mccItems.filter(i => i.id !== id);
    });
  }

  supprimerEchelle(id: number): void {
    if (!confirm('Confirmer la suppression ?')) return;
    this.echelleService.delete(id).subscribe(() => {
      this.echelles = this.echelles.filter(e => e.id !== id);
    });
  }

  basculerStatut(id: number): void {
    const echelle = this.echelles.find(e => e.id === id);
    if (!echelle) return;
    this.echelleService.update(id, { ...echelle, estActive: !echelle.estActive }).subscribe({
      next: () => {
        echelle.estActive = !echelle.estActive;
      }
    });
  }

  getUeLabel(item: any): string {
    if (item.cours) {
      return `${item.cours.code} - ${item.cours.intitule}`;
    }
    return `UE #${item.coursId}`;
  }

  trackByFn(index: number, item: any): number { return item.id; }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhPeriodePaieService } from 'src/app/data/modules/rh/services/rh-periode-paie.service';
import { RhBulletinPaieService } from 'src/app/data/modules/rh/services/rh-bulletin-paie.service';
import { PeriodePaie } from 'src/app/data/modules/rh/models/PeriodePaie.model';

const MOIS_NOMS = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MOIS_MAP: any = { 'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4, 'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8, 'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12 };

@Component({
  selector: 'app-paie-page',
  templateUrl: './paie-page.component.html',
  styleUrls: ['./paie-page.component.scss']
})
export class PaiePageComponent extends BaseComponentClass implements OnInit {
  loading = false;
  periodes: any[] = [];
  showModal = false;
  isEditing = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private periodeService: RhPeriodePaieService,
    private bulletinService: RhBulletinPaieService
  ) { super() }

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      mois: ['', Validators.required],
      annee: [new Date().getFullYear(), Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      statut: ['ouverte']
    });
    this.loadPeriodes();
  }

  closeModal() {
    this.showModal = false;
  }

  loadPeriodes() {
    this.loading = true;
    this.periodeService.getAll().subscribe({
      next: (data) => {
        this.periodes = data.map(p => ({
          ...p,
          mois: MOIS_NOMS[p.mois!] || p.mois,
          bulletins: p.bulletinsPaie ? p.bulletinsPaie.length : 0
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openCreate() {
    this.isEditing = false;
    this.form.reset({ id: null, mois: '', annee: new Date().getFullYear(), dateDebut: '', dateFin: '', statut: 'ouverte' });
    this.showModal = true;
  }

  openEdit(p: any) {
    this.isEditing = true;
    this.form.patchValue({
      id: p.id,
      mois: p.mois,
      annee: p.annee,
      dateDebut: p.dateDebut,
      dateFin: p.dateFin,
      statut: p.statut
    });
    this.showModal = true;
  }

  onSubmit() {
    if (this.form.invalid) return;
    const formVal = this.form.value;
    const payload: any = {
      mois: MOIS_MAP[formVal.mois] || formVal.mois,
      annee: formVal.annee,
      dateDebut: formVal.dateDebut,
      dateFin: formVal.dateFin,
      statut: formVal.statut
    };
    if (this.isEditing) {
      payload.id = this.form.value.id;
      this.periodeService.update(payload).subscribe(() => {
        this.loadPeriodes();
        this.showModal = false;
      });
    } else {
      this.periodeService.create(payload).subscribe(() => {
        this.loadPeriodes();
        this.showModal = false;
      });
    }
  }

  deleteItem(id: number) {
    if (confirm('Supprimer cette période ?')) {
      this.periodeService.delete(String(id)).subscribe(() => this.loadPeriodes());
    }
  }

  genererBulletins(id: number) {
    this.periodeService.genererBulletins(String(id)).subscribe({
      next: (res: any) => { alert(res.message || 'Bulletins générés'); this.loadPeriodes(); },
      error: (err) => { alert(err.error?.message || 'Erreur de génération'); }
    });
  }

  getStatutBadge(statut: string): string {
    const s = (statut || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map: Record<string, string> = { ouverte: 'paie-badge--ouverte', verrouillee: 'paie-badge--verrouillee', cloturee: 'paie-badge--cloturee' };
    return map[s] || map[statut] || 'paie-badge--cloturee';
  }

  countByStatut(statut: string): number {
    return this.periodes.filter(p => {
      const s = (p.statut || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return s === statut;
    }).length;
  }
}

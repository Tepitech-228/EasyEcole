import { Component, OnInit } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Router } from '@angular/router';

@Component({
  selector: 'app-liste-bulletins-page',
  templateUrl: './liste-bulletins-page.component.html',
  styleUrls: ['./liste-bulletins-page.component.scss']
})
export class ListeBulletinsPageComponent extends BaseComponentClass implements OnInit {
  bulletins: any[] = [];
  loading: boolean = false;
  filtres: any = { classeId: '', semestre: '', anneeAcademiqueId: '', statut: '' };
  pagination: any = { page: 1, limit: 50, total: 0, totalPages: 0 };

  anneesAcademiques: AnneeAcademique[] = [];
  classes: Classe[] = [];

  constructor(
    private bulletinService: BulletinService,
    private anneeAcademiqueService: AnneeAcademiqueService,
    private classeService: ClasseService,
    private router: Router,
  ) {
    super();
  }

  ngOnInit() {
    if (this.rolesValue.isApprenant) {
      this.router.navigate(['/bulletins/mon-releve']);
      return;
    }
    this.anneeAcademiqueService.getAll().subscribe(data => this.anneesAcademiques = data);
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.charger();
  }

  charger() {
    this.loading = true;
    this.bulletinService.getAll(this.filtres).subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.bulletins = res.data;
          this.pagination = res.pagination || this.pagination;
        } else {
          this.bulletins = Array.isArray(res) ? res : [];
        }
      },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  resetFiltres() {
    this.filtres = { classeId: '', semestre: '', anneeAcademiqueId: '', statut: '' };
    this.charger();
  }

  getStatutCount(statut: string): number {
    return this.bulletins.filter(b => b.statut === statut).length;
  }

  getMoyenneGenerale(): string {
    const avecMoyenne = this.bulletins.filter(b => b.moyenneGenerale != null);
    if (!avecMoyenne.length) return '-';
    const sum = avecMoyenne.reduce((acc, b) => acc + Number(b.moyenneGenerale), 0);
    return (sum / avecMoyenne.length).toFixed(1);
  }

  getMoyenneClass(moyenne: number): string {
    if (moyenne == null) return 'text-gray-300';
    if (moyenne >= 14) return 'text-green-700';
    if (moyenne >= 10) return 'text-amber-700';
    return 'text-red-700';
  }

  getMentionBadgeClass(mention: string): string {
    if (!mention) return 'bg-gray-50 text-gray-400';
    const m = mention.toLowerCase();
    if (m.includes('très')) return 'bg-green-50 text-green-700 ring-1 ring-green-200';
    if (m.includes('bien')) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    if (m.includes('assez')) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
    if (m.includes('passable')) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
    return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  }

  trackByFn(index: number, item: any): number {
    return item.id;
  }
}

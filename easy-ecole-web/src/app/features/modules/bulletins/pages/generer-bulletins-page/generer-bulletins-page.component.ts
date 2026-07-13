import { Component, OnInit } from '@angular/core';
import { BulletinService } from '../../services/bulletin.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { AnneeAcademique } from 'src/app/data/modules/inscription/models/AnneeAcademique.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Router } from '@angular/router';

@Component({
  selector: 'app-generer-bulletins-page',
  templateUrl: './generer-bulletins-page.component.html',
  styleUrls: ['./generer-bulletins-page.component.scss']
})
export class GenererBulletinsPageComponent extends BaseComponentClass implements OnInit {
  anneeAcademiqueId: string | null = null;
  semestre: string = '';
  classeId: string | null = null;
  loading: boolean = false;
  genererLoading: boolean = false;
  resultat: any[] | null = null;
  erreur: string | null = null;

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
    if (!this.rolesValue.isInstitution && !this.rolesValue.isAdmin) {
      this.router.navigate(['/bulletins']);
      return;
    }
    this.anneeAcademiqueService.getAll().subscribe(data => this.anneesAcademiques = data);
    this.classeService.getAll().subscribe(data => this.classes = data);
  }

  generer() {
    if (!this.anneeAcademiqueId || !this.semestre || !this.classeId) return;
    this.genererLoading = true;
    this.erreur = null;
    this.resultat = null;

    this.bulletinService.generer(Number(this.classeId), this.semestre, Number(this.anneeAcademiqueId)).subscribe({
      next: (data) => this.resultat = data,
      error: (err) => this.erreur = err.error?.message || 'Erreur de génération',
      complete: () => this.genererLoading = false
    });
  }

  getReussi(): number {
    return this.resultat?.length || 0;
  }

  getClasseLibelle(): string {
    const c = this.classes.find(x => x.id === this.classeId);
    return c?.libelle || '---';
  }

  getAnneeLibelle(): string {
    const a = this.anneesAcademiques.find(x => x.id === this.anneeAcademiqueId);
    return a?.libelle || '---';
  }
}

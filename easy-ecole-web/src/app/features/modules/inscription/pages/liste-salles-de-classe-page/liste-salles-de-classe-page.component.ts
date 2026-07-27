import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SalleDeClasseService } from 'src/app/data/modules/inscription/services/salle-de-classe.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { SalleDeClasse } from 'src/app/data/modules/inscription/models/SalleDeClasse.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';

@Component({
  selector: 'app-liste-salles-de-classe-page',
  templateUrl: './liste-salles-de-classe-page.component.html',
  styleUrls: ['./liste-salles-de-classe-page.component.scss']
})
export class ListeSallesDeClassePageComponent extends BaseComponentClass implements OnInit {
  salles: SalleDeClasse[] = [];
  classes: Classe[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  selectedClasseId: string = 'undefined';
  formData: any = { libelle: '', description: '', classeId: '' };

  constructor(
    private salleService: SalleDeClasseService,
    private classeService: ClasseService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.getSalles();
  }

  getSalles(): void {
    this.loading = true;
    const classeId = this.selectedClasseId !== 'undefined' ? this.selectedClasseId : undefined;
    this.salleService.getAll(classeId).subscribe({
      next: (res) => { this.salles = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get totalSalles(): number { return this.salles.length }

  ouvrirFormulaire() {
    this.formData = { libelle: '', description: '', classeId: '' };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; }

  creerSalle() {
    if (!this.formData.libelle) return;
    const salle = new SalleDeClasse();
    salle.libelle = this.formData.libelle;
    salle.description = this.formData.description;
    salle.classeId = this.formData.classeId || undefined;
    this.salleService.create(salle).subscribe({
      next: () => { this.fermerFormulaire(); this.getSalles(); },
      error: (err) => console.error(err)
    });
  }

  modifierSalle(salle: SalleDeClasse) {
    if (!salle.libelle) return;
    this.salleService.update(salle).subscribe({
      next: () => { this.getSalles(); },
      error: (err) => console.error(err)
    });
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette salle ?')) return;
    this.salleService.delete(id).subscribe({ next: () => this.getSalles() });
  }

  getClasseLibelle(classeId?: string): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe?.libelle || '-';
  }

  trackByFn(index: number, item: SalleDeClasse): any { return item.id; }
}

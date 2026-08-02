import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { SalleDeClasseService } from 'src/app/data/modules/inscription/services/salle-de-classe.service';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { SalleDeClasse } from 'src/app/data/modules/inscription/models/SalleDeClasse.model';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';

@Component({
  selector: 'app-liste-salles-de-classe-page',
  templateUrl: './liste-salles-de-classe-page.component.html',
  styleUrls: ['./liste-salles-de-classe-page.component.scss']
})
export class ListeSallesDeClassePageComponent extends BaseComponentClass implements OnInit {
  salles: SalleDeClasse[] = [];
  classes: Classe[] = [];
  parcoursList: Parcours[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  editingId: string | null = null;
  selectedClasseId: string = '';
  selectedParcoursId: string = '';
  formData: { libelle: string; description: string; classeId: string; parcoursId: string } = {
    libelle: '', description: '', classeId: '', parcoursId: ''
  };

  constructor(
    private salleService: SalleDeClasseService,
    private classeService: ClasseService,
    private parcoursService: ParcoursService,
  ) { super(); }

  ngOnInit(): void {
    this.classeService.getAll().subscribe(data => this.classes = data);
    this.parcoursService.getAll().subscribe(data => this.parcoursList = data);
    this.getSalles();
  }

  getSalles(): void {
    this.loading = true;
    const classeId = this.selectedClasseId !== '' ? this.selectedClasseId : undefined;
    const parcoursId = this.selectedParcoursId !== '' ? this.selectedParcoursId : undefined;
    this.salleService.getAll(classeId, parcoursId).subscribe({
      next: (res) => { this.salles = res },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  get totalSalles(): number { return this.salles.length }

  ouvrirFormulaire() {
    this.editingId = null;
    this.formData = { libelle: '', description: '', classeId: '', parcoursId: '' };
    this.showForm = true;
  }

  editerSalle(salle: SalleDeClasse) {
    this.editingId = salle.id;
    this.formData = {
      libelle: salle.libelle || '',
      description: salle.description || '',
      classeId: salle.classeId || '',
      parcoursId: salle.parcoursId || '',
    };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; this.editingId = null; }

  sauvegarder() {
    if (!this.formData.libelle) return;
    const salle = new SalleDeClasse();
    salle.libelle = this.formData.libelle;
    salle.description = this.formData.description;
    salle.classeId = this.formData.classeId || null;
    salle.parcoursId = this.formData.parcoursId || null;
    if (this.editingId) {
      salle.id = this.editingId;
      this.salleService.update(salle).subscribe({
        next: () => { this.fermerFormulaire(); this.getSalles(); },
        error: (err) => console.error(err)
      });
    } else {
      this.salleService.create(salle).subscribe({
        next: () => { this.fermerFormulaire(); this.getSalles(); },
        error: (err) => console.error(err)
      });
    }
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette salle ?')) return;
    this.salleService.delete(id).subscribe({ next: () => this.getSalles() });
  }

  getAffectation(salle: SalleDeClasse): string {
    const parts: string[] = [];
    if (salle.classeId) parts.push(`Classe ${this.getClasseLibelle(salle.classeId)}`);
    if (salle.parcoursId) parts.push(`Filière ${this.getParcoursTitre(salle.parcoursId)}`);
    return parts.length > 0 ? parts.join(' • ') : 'À tout';
  }

  getClasseLibelle(classeId?: string | null): string {
    const classe = this.classes.find(c => c.id === classeId);
    return classe?.libelle || '-';
  }

  getParcoursTitre(parcoursId?: string | null): string {
    const parcours = this.parcoursList.find(p => p.id === parcoursId);
    return parcours?.titre || '-';
  }

  trackByFn(index: number, item: SalleDeClasse): any { return item.id; }
}

import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ClasseService } from 'src/app/data/modules/inscription/services/classe.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { Classe } from 'src/app/data/modules/inscription/models/Classe.model';
import { NiveauEtude } from 'src/app/data/modules/inscription/models/NiveauEtude.model';
import { Parcours } from 'src/app/data/modules/inscription/models/Parcours.model';

@Component({
  selector: 'app-liste-classes-page',
  templateUrl: './liste-classes-page.component.html',
  styleUrls: ['./liste-classes-page.component.scss']
})
export class ListeClassesPageComponent extends BaseComponentClass implements OnInit {
  classes: Classe[] = [];
  filteredClasses: Classe[] = [];
  niveauEtudes: NiveauEtude[] = [];
  parcoursList: Parcours[] = [];
  loading: boolean = false;
  showForm: boolean = false;
  editingId: string | null = null;
  selectedNiveauEtudeId: string = '';
  selectedParcoursId: string = '';
  formData: { libelle: string; description: string; niveauEtudeId: string; parcoursId: string } = {
    libelle: '', description: '', niveauEtudeId: '', parcoursId: ''
  };

  constructor(
    private classeService: ClasseService,
    private niveauEtudeService: NiveauEtudeService,
    private parcoursService: ParcoursService,
  ) { super(); }

  ngOnInit(): void {
    this.niveauEtudeService.getAll().subscribe(data => this.niveauEtudes = data);
    this.parcoursService.getAll().subscribe(data => this.parcoursList = data);
    this.getClasses();
  }

  getClasses(): void {
    this.loading = true;
    this.classeService.getAll().subscribe({
      next: (res) => { this.classes = res; this.filtrer(); },
      error: () => this.loading = false,
      complete: () => this.loading = false
    });
  }

  filtrer(): void {
    this.filteredClasses = this.classes.filter(c => {
      if (this.selectedNiveauEtudeId && c.niveauEtudeId !== this.selectedNiveauEtudeId) return false;
      if (this.selectedParcoursId && c.parcoursId !== this.selectedParcoursId) return false;
      return true;
    });
  }

  get totalClasses(): number { return this.filteredClasses.length }

  ouvrirFormulaire() {
    this.editingId = null;
    this.formData = { libelle: '', description: '', niveauEtudeId: '', parcoursId: '' };
    this.showForm = true;
  }

  editerClasse(c: Classe) {
    this.editingId = c.id!;
    this.formData = {
      libelle: c.libelle || '',
      description: c.description || '',
      niveauEtudeId: c.niveauEtudeId || '',
      parcoursId: c.parcoursId || '',
    };
    this.showForm = true;
  }

  fermerFormulaire() { this.showForm = false; this.editingId = null; }

  sauvegarder() {
    if (!this.formData.libelle) return;
    if (this.editingId) {
      const data: any = { ...this.formData };
      data.id = this.editingId;
      this.classeService.update(data).subscribe({
        next: () => { this.fermerFormulaire(); this.getClasses(); },
        error: (err) => console.error(err)
      });
    } else {
      this.classeService.create(this.formData).subscribe({
        next: () => { this.fermerFormulaire(); this.getClasses(); },
        error: (err) => console.error(err)
      });
    }
  }

  supprimer(id?: string) {
    if (!id) return;
    if (!confirm('Supprimer cette classe ?')) return;
    this.classeService.delete(id).subscribe({ next: () => this.getClasses() });
  }

  getNiveauEtudeLibelle(id?: string): string {
    const ne = this.niveauEtudes.find(n => n.id === id);
    return ne?.libelle || '-';
  }

  getParcoursTitre(id?: string): string {
    const p = this.parcoursList.find(x => x.id === id);
    return p?.titre || '-';
  }
}

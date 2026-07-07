import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { FraisParcoursService } from 'src/app/data/modules/inscription/services/frais-parcours.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { NiveauEtudeService } from 'src/app/data/modules/inscription/services/niveau-etude.service';
import { AnneeAcademiqueService } from 'src/app/data/modules/inscription/services/annee-academique.service';

@Component({
  selector: 'app-liste-frais-parcours-page',
  templateUrl: './liste-frais-parcours-page.component.html',
  styleUrls: ['./liste-frais-parcours-page.component.scss']
})
export class ListeFraisParcoursPageComponent extends BaseComponentClass implements OnInit {
  fraisList: any[] = [];
  loading: boolean = true;
  showModal: boolean = false;
  isEditing: boolean = false;
  selectedId: number | null = null;
  form: FormGroup;

  parcoursList: any[] = [];
  niveauList: any[] = [];
  anneesList: any[] = [];

  constructor(
    private fraisService: FraisParcoursService,
    private parcoursService: ParcoursService,
    private niveauService: NiveauEtudeService,
    private anneeService: AnneeAcademiqueService,
    private fb: FormBuilder
  ) {
    super();
    this.form = this.fb.group({
      parcoursId: ['', Validators.required],
      niveauEtudeId: ['', Validators.required],
      anneeAcademiqueId: ['', Validators.required],
      montantInscription: [null],
      montantScolarite: [null],
      nbMensualites: [10],
      fraisBibliotheque: [null],
      fraisAssurance: [null],
      fraisLogement: [null],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadSelects();
  }

  private loadData(): void {
    this.loading = true;
    this.fraisService.getAll().subscribe({
      next: (data) => { this.fraisList = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  private loadSelects(): void {
    this.parcoursService.getAll().subscribe(data => this.parcoursList = data);
    this.niveauService.getAll().subscribe(data => this.niveauList = data);
    this.anneeService.getAll().subscribe(data => this.anneesList = data);
  }

  openCreate(): void {
    this.isEditing = false;
    this.selectedId = null;
    this.form.reset({ nbMensualites: 10 });
    this.showModal = true;
  }

  openEdit(item: any): void {
    this.isEditing = true;
    this.selectedId = item.id;
    this.form.patchValue(item);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const data = this.form.value;
    if (this.isEditing && this.selectedId) {
      this.fraisService.update(this.selectedId, data).subscribe({
        next: () => { this.closeModal(); this.loadData(); }
      });
    } else {
      this.fraisService.create(data).subscribe({
        next: () => { this.closeModal(); this.loadData(); }
      });
    }
  }

  deleteItem(id: number): void {
    if (confirm('Supprimer ces frais ?')) {
      this.fraisService.delete(id).subscribe({ next: () => this.loadData() });
    }
  }

  getParcoursLibelle(id: any): string {
    const p = this.parcoursList.find(x => x.id === id);
    return p ? p.libelle || p.intitule || p.nom || id : id;
  }

  getNiveauLibelle(id: any): string {
    const n = this.niveauList.find(x => x.id === id);
    return n ? n.libelle || n.intitule || n.nom || id : id;
  }

  getAnneeLibelle(id: any): string {
    const a = this.anneesList.find(x => x.id === id);
    return a ? a.libelle || a.intitule || a.nom || id : id;
  }
}

import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ComiteOrientationService } from 'src/app/data/modules/auth/services/comite-orientation.service';
import { ParcoursService } from 'src/app/data/modules/inscription/services/parcours.service';
import { CoursService } from 'src/app/data/modules/inscription/services/cours.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-ajouter-ue-etudiant-page',
  templateUrl: './ajouter-ue-etudiant-page.component.html',
  styleUrls: ['./ajouter-ue-etudiant-page.component.scss']
})
export class AjouterUeEtudiantPageComponent extends BaseComponentClass implements OnInit {
  // Listes
  etudiants: any[] = [];
  parcours: any[] = [];
  ueParcours: any[] = [];
  ueEtudiant: any[] = [];

  // Sélections
  selectedEtudiantId = '';
  selectedParcoursId = '';
  selectedUeIds: number[] = [];

  // États
  loading = true;
  saving = false;
  showUeList = false;

  constructor(
    private comiteOrientationService: ComiteOrientationService,
    private parcoursService: ParcoursService,
    private coursService: CoursService,
    private utilisateurService: UtilisateurService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.loading = true;

    // Charger les étudiants (apprenants)
    this.utilisateurService.getAll().subscribe({
      next: (res: any) => {
        this.etudiants = (Array.isArray(res) ? res : []).filter((u: any) => u.role === 'apprenant');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des étudiants');
      }
    });

    // Charger les parcours
    this.parcoursService.getAll().subscribe({
      next: (res: any) => {
        this.parcours = Array.isArray(res) ? res : [];
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des parcours');
      }
    });
  }

  onEtudiantChange(): void {
    this.selectedParcoursId = '';
    this.selectedUeIds = [];
    this.showUeList = false;
    this.ueParcours = [];
    this.ueEtudiant = [];

    if (this.selectedEtudiantId) {
      this.loadUeEtudiant();
    }
  }

  onParcoursChange(): void {
    this.selectedUeIds = [];
    this.showUeList = false;
    this.ueParcours = [];

    if (this.selectedParcoursId) {
      this.loadUeParcours();
    }
  }

  private loadUeEtudiant(): void {
    // Charger les UE déjà assignées à l'étudiant
    this.coursService.getArbrePedagogique().subscribe({
      next: (res: any) => {
        // Filtrer les UE de l'étudiant
        this.ueEtudiant = [];
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des UE de l\'étudiant');
      }
    });
  }

  private loadUeParcours(): void {
    if (!this.selectedParcoursId) return;

    this.coursService.getAll(String(this.selectedParcoursId)).subscribe({
      next: (res: any) => {
        this.ueParcours = Array.isArray(res) ? res : [];
        this.showUeList = true;
      },
      error: () => {
        this.toastService.error('Erreur lors du chargement des UE du parcours');
      }
    });
  }

  toggleUe(ueId: number): void {
    const index = this.selectedUeIds.indexOf(ueId);
    if (index > -1) {
      this.selectedUeIds.splice(index, 1);
    } else {
      this.selectedUeIds.push(ueId);
    }
  }

  isUeSelected(ueId: number): boolean {
    return this.selectedUeIds.includes(ueId);
  }

  isUeDejaAssignee(ueId: number): boolean {
    return this.ueEtudiant.some(ue => ue.id === ueId);
  }

  ajouterUe(): void {
    if (!this.selectedEtudiantId || !this.selectedParcoursId || this.selectedUeIds.length === 0) {
      this.toastService.error('Veuillez sélectionner un étudiant, un parcours et au moins une UE');
      return;
    }

    this.saving = true;
    this.comiteOrientationService.ajouterUeEtudiant({
      utilisateurId: this.selectedEtudiantId,
      parcoursId: Number(this.selectedParcoursId),
      ueIds: this.selectedUeIds
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.toastService.success(res.message || 'UE ajoutée(s) avec succès');
        this.selectedUeIds = [];
        this.loadUeEtudiant();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.error?.message || 'Erreur lors de l\'ajout des UE');
      }
    });
  }

  getEtudiantNom(): string {
    const etudiant = this.etudiants.find(e => String(e.id) === String(this.selectedEtudiantId));
    return etudiant ? `${etudiant.nom} ${etudiant.prenoms}` : '';
  }

  getParcoursTitre(): string {
    const parcours = this.parcours.find(p => String(p.id) === String(this.selectedParcoursId));
    return parcours ? parcours.titre : '';
  }

  getUeName(ueId: number): string {
    const ue = this.ueParcours.find(u => u.id === ueId);
    return ue ? ue.intitule : 'UE ' + ueId;
  }
}

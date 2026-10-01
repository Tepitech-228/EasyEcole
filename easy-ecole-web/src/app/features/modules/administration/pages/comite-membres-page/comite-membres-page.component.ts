import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { ToastService } from 'src/app/core/services/toast.service';
import { ComiteMembreService } from 'src/app/data/modules/admin/services/comite-membre.service';
import { Utilisateur } from 'src/app/data/modules/auth/models/Utilisateur.model';

@Component({
  selector: 'app-comite-membres-page',
  templateUrl: './comite-membres-page.component.html',
  styleUrls: ['./comite-membres-page.component.scss']
})
export class ComiteMembresPageComponent extends BaseComponentClass implements OnInit {
  membres: Utilisateur[] = []
  loading: boolean = false
  showCreateModal: boolean = false
  showDeleteModal: boolean = false
  apiErrorMessage: string = ''
  creating: boolean = false
  deleting: boolean = false
  updatingId: number | null = null

  createForm: FormGroup
  selectedMember: Utilisateur | null = null

  constructor(
    private comiteMembreService: ComiteMembreService,
    private toastService: ToastService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    super();
    this.createForm = this.fb.group({
      nom: ['', [Validators.required]],
      prenoms: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      identifiant: ['', [Validators.required]],
      motDePasse: ['', [Validators.required]],
      contact: ['', []],
      estPrescripteur: [false],
    });
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading = true;
    this.comiteMembreService.getAll().subscribe({
      next: (res) => {
        this.membres = Array.isArray(res) ? res : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Erreur lors du chargement des membres du comité');
      }
    });
  }

  ouvrirCreateModal(): void {
    // reset() seul met la case à null : on impose explicitement le défaut false
    // pour que la case parte décochée à chaque ouverture.
    this.createForm.reset({ estPrescripteur: false });
    this.apiErrorMessage = '';
    this.showCreateModal = true;
  }

  fermerCreateModal(): void {
    this.showCreateModal = false;
    this.apiErrorMessage = '';
  }

  soumettreCreation(): void {
    if (this.createForm.invalid) {
      this.toastService.error('Veuillez remplir tous les champs requis');
      return;
    }
    this.creating = true;
    this.apiErrorMessage = '';
    const payload = { ...this.createForm.value };
    this.comiteMembreService.create(payload).subscribe({
      next: () => {
        this.creating = false;
        this.fermerCreateModal();
        this.charger();
        this.toastService.success('Membre du comité créé avec succès');
      },
      error: (err) => {
        this.creating = false;
        this.apiErrorMessage = err.error?.message || 'Erreur lors de la création du membre';
        this.toastService.error(this.apiErrorMessage);
      }
    });
  }

  confirmerSuppression(membre: Utilisateur): void {
    this.selectedMember = membre;
    this.showDeleteModal = true;
  }

  /**
   * `Utilisateur.id` est typé `string | undefined` côté modèle : la comparaison
   * directe avec `updatingId` (number) est rejetée par le compilateur de
   * gabarits. La conversion se fait ici, une fois.
   */
  estMiseAJour(membre: Utilisateur): boolean {
    return this.updatingId !== null && Number(membre.id) === this.updatingId;
  }

  /**
   * Bascule l'habilitation prescripteur.
   * Le preset d'état est annulé si l'appel échoue, pour que l'écran reste
   * aligné sur ce que le serveur a réellement enregistré.
   */
  basculerPrescripteur(membre: Utilisateur): void {
    const precedent = Boolean(membre.estPrescripteur);
    const cible = !precedent;
    const id = Number(membre.id);

    if (isNaN(id)) return;

    membre.estPrescripteur = cible;
    this.updatingId = id;

    this.comiteMembreService.setPrescripteur(id, cible).subscribe({
      next: () => {
        this.updatingId = null;
        this.toastService.success(
          cible
            ? `${membre.nom} ${membre.prenoms} peut désormais prescrire des UE/ECUE`
            : `Habilitation prescripteur retirée à ${membre.nom} ${membre.prenoms}`
        );
      },
      error: (err) => {
        membre.estPrescripteur = precedent;
        this.updatingId = null;
        this.toastService.error(err.error?.message || 'Erreur lors de la modification du rôle prescripteur');
      }
    });
  }

  fermerDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedMember = null;
  }

  supprimerMembre(): void {
    if (!this.selectedMember) return;
    this.deleting = true;
    this.comiteMembreService.delete(Number(this.selectedMember.id)).subscribe({
      next: () => {
        this.deleting = false;
        this.fermerDeleteModal();
        this.charger();
        this.toastService.success('Membre du comité supprimé');
      },
      error: (err) => {
        this.deleting = false;
        this.fermerDeleteModal();
        this.toastService.error(err.error?.message || 'Erreur lors de la suppression');
      }
    });
  }
}

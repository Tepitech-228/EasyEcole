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
    this.createForm.reset();
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

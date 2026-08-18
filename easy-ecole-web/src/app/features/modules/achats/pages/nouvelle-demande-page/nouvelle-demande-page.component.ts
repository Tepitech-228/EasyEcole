import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/core/services/toast.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { DemandeService } from 'src/app/data/modules/achats/services/demande.service';
import { ValidateurService } from 'src/app/data/modules/achats/services/validateur.service';
import { Validateur, getNomUtilisateur } from 'src/app/data/modules/achats/models/achats.models';

@Component({
  selector: 'app-nouvelle-demande-page',
  templateUrl: './nouvelle-demande-page.component.html',
  styleUrls: ['./nouvelle-demande-page.component.scss']
})
export class NouvelleDemandePageComponent extends BaseComponentClass implements OnInit {
  loading = false
  saving = false
  lignes: any[] = [{ designation: '', quantite: '', prixEstime: '', unite: 'Unité' }]
  validateurs: Validateur[] = []

  form: FormGroup = new FormGroup({
    description: new FormControl(null, [Validators.required]),
    validateurId: new FormControl(null, [Validators.required]),
  })

  constructor(
    private router: Router,
    private toastService: ToastService,
    private demandeService: DemandeService,
    private validateurService: ValidateurService
  ) { super() }

  ngOnInit(): void {
    this.loadValidateurs()
  }

  loadValidateurs() {
    this.validateurService.getAll().subscribe({
      next: (validateurs) => { this.validateurs = validateurs },
      error: () => { this.validateurs = [] }
    })
  }

  getValidateurLabel(v: Validateur): string {
    return `${getNomUtilisateur(v.utilisateur)} - Niveau ${v.niveau}`
  }

  addLigne() {
    this.lignes.push({ designation: '', quantite: '', prixEstime: '', unite: 'Unité' })
  }

  removeLigne(index: number) {
    if (this.lignes.length > 1) {
      this.lignes.splice(index, 1)
    }
  }

  onSubmit() {
    if (this.form.invalid) return
    this.saving = true

    const lignesValides = this.lignes
      .filter(l => l.designation && l.quantite && l.prixEstime)
      .map(l => ({
        designation: l.designation,
        quantite: Number(l.quantite),
        prixEstime: Number(l.prixEstime),
        unite: l.unite || 'Unité',
      }))

    // L'API attend "validateurChoisiId" (validateur de la demande), le formulaire garde "validateurId".
    this.demandeService.create({
      description: this.form.get('description')!.value,
      statut: 'soumise',
      validateurChoisiId: Number(this.form.get('validateurId')!.value),
      lignesDemande: lignesValides,
    }).subscribe({
      next: () => {
        this.saving = false
        this.toastService.success('Demande soumise avec succès')
        this.router.navigate(['/achats/demandes'])
      },
      error: () => {
        this.saving = false
        this.toastService.error("Impossible de soumettre la demande")
      }
    })
  }
}

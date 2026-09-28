import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Echeance } from 'src/app/data/modules/inscription/models/Echeance.model';
import { DossierEtudiant } from 'src/app/data/modules/inscription/models/DossierEtudiant.model';
import { EcheanceService } from 'src/app/data/modules/inscription/services/echeance.service';
import { DossierEtudiantService } from 'src/app/data/modules/inscription/services/dossier-etudiant.service';
import { DossierNode, DossierColumn } from 'src/app/shared/components/dossier-view/dossier-view.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-gestion-echeances-page',
  templateUrl: './gestion-echeances-page.component.html',
  styleUrls: ['./gestion-echeances-page.component.scss']
})
export class GestionEcheancesPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  successMessage: string = ''
  loading: boolean = true

  showNouvelleEcheanceModal: boolean = false
  showEditerEcheanceModal: boolean = false
  showGenererEcheancesModal: boolean = false
  showSupprimerEcheanceModal: boolean = false

  echeances: Echeance[] = []
  dossiers: DossierEtudiant[] = []
  selectedEcheance?: Echeance
  selectedDossierId?: string

  // ── Arbre avec sommes payées ──
  treeNodes: DossierNode[] = []
  readonly columns: DossierColumn[] = [
    { key: 'type', label: 'Type', width: '100px' },
    { key: 'numeroEcheance', label: 'N°', width: '80px' },
    { key: 'montant', label: 'Montant', width: '120px' },
    { key: 'montantPaye', label: 'Payé', width: '120px' },
    { key: 'restant', label: 'Reste', width: '120px' },
    { key: 'statut', label: 'Statut', width: '100px' },
  ]

  echeanceForm: FormGroup = new FormGroup({
    dossierEtudiantId: new FormControl(null, [Validators.required]),
    type: new FormControl('scolarite', [Validators.required]),
    numeroEcheance: new FormControl(null, [Validators.required]),
    montant: new FormControl(null, [Validators.required]),
    dateLimite: new FormControl(null, [Validators.required]),
    moisConcerne: new FormControl(null, []),
  })

  constructor(
    private echeanceService: EcheanceService,
    private dossierEtudiantService: DossierEtudiantService
  ) {
    super()
    this.loadData()
  }

  ngOnInit(): void {
  }

  loadData(): void {
    this.loading = true
    this.dossierEtudiantService.getArbre().subscribe({
      next: (arbre) => {
        this.buildTreeWithSums(arbre)
        this.loading = false
      },
      error: (err) => {
        console.error('[Echeances] Erreur chargement arbre:', err)
        this.error = true
        this.loading = false
      }
    })
  }

  private buildTreeWithSums(arbre: any[]): void {
    this.treeNodes = arbre.map(annee => ({
      type: 'annee' as const,
      label: `${annee.annee} — Inscription: ${this.formatMontant(this.sumByType(annee, 'inscription'))} | Scolarité: ${this.formatMontant(this.sumByType(annee, 'scolarite'))}`,
      expanded: true,
      children: annee.filieres?.map((filiere: any) => ({
        type: 'parcours' as const,
        label: `${filiere.filiere} — Inscription: ${this.formatMontant(this.sumByType(filiere, 'inscription'))} | Scolarité: ${this.formatMontant(this.sumByType(filiere, 'scolarite'))}`,
        expanded: true,
        children: filiere.niveaux?.map((niveau: any) => ({
          type: 'niveau' as const,
          label: `${niveau.niveau} — Inscription: ${this.formatMontant(this.sumByType(niveau, 'inscription'))} | Scolarité: ${this.formatMontant(this.sumByType(niveau, 'scolarite'))}`,
          expanded: true,
          children: niveau.classes?.map((classe: any) => ({
            type: 'classe' as const,
            label: `${classe.classe} — ${classe.dossiers?.length || 0} étudiant(s)`,
            expanded: false,
            children: classe.dossiers?.map((dossier: any) => ({
              type: 'etudiant' as const,
              label: `${dossier.nom} ${dossier.prenoms}`,
              expanded: false,
              items: dossier.echeances?.map((e: any) => ({
                id: e.id,
                type: e.type === 'inscription' ? 'Inscription' : 'Scolarité',
                numeroEcheance: `N° ${e.numeroEcheance}`,
                montant: e.montant,
                montantPaye: e.montantPaye || 0,
                restant: (e.montant || 0) - (e.montantPaye || 0),
                statut: e.statut,
              })) || [],
            })) || [],
          })) || [],
        })) || [],
      })) || [],
    }))
  }

  private sumByType(node: any, type: string): number {
    let sum = 0
    if (node.dossiers) {
      for (const d of node.dossiers) {
        if (d.echeances) {
          for (const e of d.echeances) {
            if (e.type === type) sum += e.montant || 0
          }
        }
      }
    }
    if (node.filieres) {
      for (const f of node.filieres) sum += this.sumByType(f, type)
    }
    if (node.niveaux) {
      for (const n of node.niveaux) sum += this.sumByType(n, type)
    }
    if (node.classes) {
      for (const c of node.classes) sum += this.sumByType(c, type)
    }
    return sum
  }

  formatMontant(value: number | undefined | null): string {
    if (value == null || value === 0) return '0 FCFA'
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
  }

  getEcheances(): void {
    this.echeanceService.getAll().subscribe({
      next: (res) => {
        this.echeances = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  getDossiers(): void {
    this.dossierEtudiantService.getAll().subscribe({
      next: (res) => {
        this.dossiers = res
      },
      error: (err) => {
        console.log(err)
      }
    })
  }

  createEcheance(): void {
    this.echeanceForm.markAllAsTouched()
    if (this.echeanceForm.valid) {
      this.echeanceService.create(this.echeanceForm.value).subscribe({
        next: () => {
          this.successMessage = 'Échéance créée avec succès'
          this.getEcheances()
          this.closeNouvelleEcheanceModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  updateEcheance(): void {
    this.echeanceForm.markAllAsTouched()
    if (this.echeanceForm.valid && this.selectedEcheance) {
      this.echeanceService.update(this.selectedEcheance.id!, this.echeanceForm.value).subscribe({
        next: () => {
          this.successMessage = 'Échéance mise à jour'
          this.getEcheances()
          this.closeEditerEcheanceModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  deleteEcheance(): void {
    if (this.selectedEcheance) {
      this.echeanceService.delete(this.selectedEcheance.id!).subscribe({
        next: () => {
          this.successMessage = 'Échéance supprimée'
          this.getEcheances()
          this.closeSupprimerEcheanceModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  genererEcheances(): void {
    if (this.selectedDossierId) {
      this.echeanceService.generer(this.selectedDossierId).subscribe({
        next: () => {
          this.successMessage = 'Échéances générées automatiquement'
          this.getEcheances()
          this.closeGenererEcheancesModal()

          setTimeout(() => { this.successMessage = '' }, 3000)
        },
        error: (err) => {
          console.log(err)
          this.error = true
          setTimeout(() => { this.error = false }, 3000)
        }
      })
    }
  }

  getStatutColor(statut?: string): string {
    switch (statut) {
      case 'paye': return 'green'
      case 'en_retard': return 'red'
      case 'impaye': return 'yellow'
      default: return 'gray'
    }
  }

  // Modals
  openNouvelleEcheanceModal(): void {
    this.echeanceForm.reset()
    this.echeanceForm.get('type')!.setValue('scolarite')
    this.showNouvelleEcheanceModal = true
  }

  closeNouvelleEcheanceModal(): void {
    this.showNouvelleEcheanceModal = false
    this.echeanceForm.reset()
  }

  openEditerEcheanceModal(echeance: Echeance): void {
    this.selectedEcheance = echeance
    this.echeanceForm.get('dossierEtudiantId')!.setValue(echeance.dossierEtudiantId)
    this.echeanceForm.get('type')!.setValue(echeance.type)
    this.echeanceForm.get('numeroEcheance')!.setValue(echeance.numeroEcheance)
    this.echeanceForm.get('montant')!.setValue(echeance.montant)
    this.echeanceForm.get('dateLimite')!.setValue(echeance.dateLimite)
    this.echeanceForm.get('moisConcerne')!.setValue(echeance.moisConcerne)
    this.showEditerEcheanceModal = true
  }

  closeEditerEcheanceModal(): void {
    this.showEditerEcheanceModal = false
    this.echeanceForm.reset()
    this.selectedEcheance = undefined
  }

  openGenererEcheancesModal(): void {
    this.selectedDossierId = undefined
    this.showGenererEcheancesModal = true
  }

  closeGenererEcheancesModal(): void {
    this.showGenererEcheancesModal = false
    this.selectedDossierId = undefined
  }

  openSupprimerEcheanceModal(echeance: Echeance): void {
    this.selectedEcheance = echeance
    this.showSupprimerEcheanceModal = true
  }

  closeSupprimerEcheanceModal(): void {
    this.showSupprimerEcheanceModal = false
    this.selectedEcheance = undefined
  }
}

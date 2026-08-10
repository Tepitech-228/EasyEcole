import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { TypesPaiement } from 'src/app/data/enums/TypesPaiement';
import { DemandeInscription } from 'src/app/data/modules/inscription/models/DemandeInscription.model';
import { PaiementInscription } from 'src/app/data/modules/inscription/models/PaiementInscription.model';
import { DemandeInscriptionService } from 'src/app/data/modules/inscription/services/demande-inscription.service';
import { PaiementInscriptionService } from 'src/app/data/modules/inscription/services/paiement-inscription.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-paiements-page',
  templateUrl: './paiements-page.component.html',
  styleUrls: ['./paiements-page.component.scss']
})
export class PaiementsPageComponent extends BaseComponentClass implements OnInit {

  error: boolean = false
  matriculeNotExists: boolean = false

  showNouveauPaiementModal: boolean = false
  showDetailsPaiementModal: boolean = false
  showEditerPaiementModal: boolean = false
  showSupprimerPaiementModal: boolean = false
  
  demandeInscription?: DemandeInscription
  paiementsInscription: PaiementInscription[] = []
  paymentTree: any[] = []
  selectedNode: any = null
  selectedPayments: PaiementInscription[] = []
  selectedPaiement?: PaiementInscription
  treeLoading: boolean = false
  readonly typesPaiement = TypesPaiement

  searchTerm = ''
  selectedYear = ''
  yearOptions: { value: string; label: string }[] = []

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS

  constructor(
    private paiementInscriptionService: PaiementInscriptionService,
    private demandeInscriptionService: DemandeInscriptionService,
    private localStorage: LocalStorageService
  ) {
    super()
    this.getPaiements()
  }

  paiementForm: FormGroup = new FormGroup({
    montant: new FormControl(null, [Validators.required]),
    description: new FormControl(null, []),
    matriculeInscription: new FormControl(null, [Validators.required]),
  })

  ngOnInit(): void {
  }

  getPaiements(): void {
    this.treeLoading = true
    this.paiementInscriptionService.getAll().subscribe({
      next: (res) => {
        this.paiementsInscription = res
        this.yearOptions = this.getYearOptions(res)
        this.applyFilters()
        this.treeLoading = false
      },
      error: (err) => {
        console.log(err)
        this.error = true
        this.treeLoading = false

        setTimeout(() => {
          this.error = false
        }, 3000)
      }
    })
  }

  private buildPaymentTree(paiements: PaiementInscription[]): void {
    const tree = paiements.reduce((acc: any, paiement) => {
      const year = paiement.datePaiement ? new Date(paiement.datePaiement).getFullYear().toString() : 'Sans année'
      const matricule = paiement.matriculeInscription || 'Sans matricule'
      const studentName = paiement.demandeInscription?.utilisateur ? `${paiement.demandeInscription.utilisateur.nom || ''} ${paiement.demandeInscription.utilisateur.prenoms || ''}`.trim() : ''
      const studentLabel = studentName ? `${matricule} — ${studentName}` : matricule

      let yearNode = acc.find((node: any) => node.id === year)
      if (!yearNode) {
        yearNode = { id: year, type: 'year', label: year, children: [] }
        acc.push(yearNode)
      }

      let studentNode = yearNode.children.find((child: any) => child.id === `${year}-${matricule}`)
      if (!studentNode) {
        studentNode = { id: `${year}-${matricule}`, type: 'student', label: studentLabel, children: [] }
        yearNode.children.push(studentNode)
      }

      const paymentNode = {
        id: paiement.id || `${year}-${matricule}-${paiement.numero}`,
        type: 'payment',
        label: paiement.numero || 'Paiement',
        data: paiement,
        children: []
      }
      studentNode.children.push(paymentNode)

      return acc
    }, [])

    this.paymentTree = tree.map((node: any) => ({ ...node, expanded: false }))
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase()
    const filtered = this.paiementsInscription.filter(paiement => {
      const year = paiement.datePaiement ? new Date(paiement.datePaiement).getFullYear().toString() : 'Sans année'
      const studentName = paiement.demandeInscription?.utilisateur ? `${paiement.demandeInscription.utilisateur.nom || ''} ${paiement.demandeInscription.utilisateur.prenoms || ''}`.trim() : ''
      const values = [
        paiement.numero,
        paiement.matriculeInscription,
        studentName,
        paiement.referenceBancaire,
        this.getPaymentTypeLabel(paiement.type),
        year
      ]
      const matchesSearch = !search || values.some(value => value?.toLowerCase().includes(search))
      const matchesYear = !this.selectedYear || year === this.selectedYear
      return matchesSearch && matchesYear
    })

    this.buildPaymentTree(filtered)
  }

  clearFilters(): void {
    this.searchTerm = ''
    this.selectedYear = ''
    this.applyFilters()
  }

  private getYearOptions(paiements: PaiementInscription[]): { value: string; label: string }[] {
    const years = new Set<string>()
    paiements.forEach(paiement => {
      years.add(paiement.datePaiement ? new Date(paiement.datePaiement).getFullYear().toString() : 'Sans année')
    })
    return Array.from(years).sort().map(year => ({ value: year, label: year }))
  }

  toggle(node: any): void {
    if (node.children?.length) {
      node.expanded = !node.expanded
    }
  }

  select(node: any): void {
    this.selectedNode = node
    if (node.type === 'payment' && node.data) {
      this.selectedPayments = [node.data]
    } else {
      this.selectedPayments = this.collectPayments(node)
    }
  }

  private collectPayments(node: any): PaiementInscription[] {
    if (!node || !node.children) return []
    const payments: PaiementInscription[] = []
    node.children.forEach((child: any) => {
      if (child.type === 'payment' && child.data) payments.push(child.data)
      else payments.push(...this.collectPayments(child))
    })
    return payments
  }

  get selectedTotalAmount(): number {
    return this.selectedPayments.reduce((sum, paiement) => sum + (paiement.montant || 0), 0)
  }

  getNodeIcon(type: string): string {
    switch (type) {
      case 'year': return '🗓️'
      case 'student': return '👤'
      case 'payment': return '💳'
      default: return '📄'
    }
  }

  getNodeTypeLabel(type: string): string {
    switch (type) {
      case 'year': return 'Année'
      case 'student': return 'Dossier'
      case 'payment': return 'Paiement'
      default: return ''
    }
  }

  getPaymentTypeLabel(type?: TypesPaiement): string {
    switch (type) {
      case TypesPaiement.ESPECE: return 'Espèces'
      case TypesPaiement.EN_LIGNE: return 'En ligne'
      case TypesPaiement.BANCAIRE: return 'Bancaire'
      default: return 'Non précisé'
    }
  }

  openReceipt(paiement: PaiementInscription): void {
    if (!paiement.id) return
    const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN)
    let url = `${environment.API_MODULES.INSCRIPTION}/paiementsInscription/${paiement.id}/recu`
    if (token) {
      url += `?token=${encodeURIComponent(token)}`
    }
    window.open(url, '_blank')
  }

  getChildPaymentCount(node: any): number {
    if (!node.children) return 0
    return node.children.reduce((acc: number, child: any) => acc + (child.type === 'payment' ? 1 : this.getChildPaymentCount(child)), 0)
  }

  getDemandeInscription(matricule: string): void {
    this.demandeInscriptionService.getFromPaiement(matricule).subscribe({
      next: (res) => {
        this.demandeInscription = res
        console.log(res)
      },
      error: (err) => {
        console.log(err)
        this.demandeInscription = undefined
        this.matriculeNotExists = true

        setTimeout(() => {
          this.error = false
          this.matriculeNotExists = false
        }, 3000)
      }
    })
  }

  ajouterPaiement(): void {
    console.log(this.paiementForm.value)
    this.paiementForm.markAllAsTouched()
    if (this.paiementForm.valid) {
      let paiement: PaiementInscription = new PaiementInscription()
      paiement.datePaiement = new Date()
      paiement.montant = this.paiementForm.get('montant')!.value
      paiement.description = this.paiementForm.get('description')!.value
      paiement.matriculeInscription = this.paiementForm.get('matriculeInscription')!.value

      this.paiementInscriptionService.create(paiement).subscribe({
        next: (res: any) => {
          if (res?.receiptUrl) {
            window.open(res.receiptUrl, '_blank')
          }
          this.getPaiements()
          this.closeNouveauPaiementModal()
        },
        error: (err) => {
          console.log(err)

          this.matriculeNotExists = err.error.matriculeNotExists
          if (!this.matriculeNotExists) {
            this.error = true
          }

          setTimeout(() => {
            this.error = false
            this.matriculeNotExists = false
          }, 3000)
        }
      })
    }
  }

  modifierPaiement(): void {
    console.log(this.paiementForm.value)
    this.paiementForm.markAllAsTouched()
    if (this.paiementForm.valid && this.selectedPaiement) {
      let paiement: PaiementInscription = new PaiementInscription()
      paiement.id = this.selectedPaiement.id
      paiement.montant = this.paiementForm.get('montant')!.value
      paiement.description = this.paiementForm.get('description')!.value
      paiement.matriculeInscription = this.paiementForm.get('matriculeInscription')!.value

      this.paiementInscriptionService.update(paiement).subscribe({
        next: (res) => {
          this.closeEditerPaiementModal()
        },
        error: (err) => {
          console.log(err)

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  supprimerPaiement(): void {
    if (this.selectedPaiement) {
      this.paiementInscriptionService.delete(this.selectedPaiement.id!).subscribe({
        next: (res) => {
          this.closeSupprimerPaiementModal()
        },
        error: (err) => {
          console.log(err)
          this.error = true

          setTimeout(() => {
            this.error = false
          }, 3000)
        }
      })
    }
  }

  // Modals
  closeNouveauPaiementModal(): void {
    this.showNouveauPaiementModal = false
    this.paiementForm.reset()
    this.demandeInscription = undefined
  }

  openDetailsPaiementModal(paiement: PaiementInscription): void {
    this.selectedPaiement = paiement
    this.getDemandeInscription(paiement.matriculeInscription!)
    this.showDetailsPaiementModal = true
  }

  closeDetailsPaiementModal(): void {
    this.showDetailsPaiementModal = false
    this.demandeInscription = undefined
    this.selectedPaiement = undefined
  }

  openEditerPaiementModal(paiement: PaiementInscription): void {
    this.selectedPaiement = paiement
    this.getDemandeInscription(paiement.matriculeInscription!)

    this.paiementForm.get('montant')!.setValue(this.selectedPaiement?.montant)
    this.paiementForm.get('description')!.setValue(this.selectedPaiement?.description)
    this.paiementForm.get('matriculeInscription')!.setValue(this.selectedPaiement?.matriculeInscription)

    this.showEditerPaiementModal = true
  }

  closeEditerPaiementModal(): void {
    this.showEditerPaiementModal = false
    this.paiementForm.reset()
    this.selectedPaiement = undefined
  }

  openSupprimerPaiementModal(paiement: PaiementInscription): void {
    this.selectedPaiement = paiement
    this.showSupprimerPaiementModal = true
  }

  closeSupprimerPaiementModal(): void {
    this.showSupprimerPaiementModal = false
    this.selectedPaiement = undefined
  }

}

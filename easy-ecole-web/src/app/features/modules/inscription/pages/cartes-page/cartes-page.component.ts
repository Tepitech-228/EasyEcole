import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { Apprenant } from 'src/app/data/modules/auth/models/Apprenant.model';
import { ApprenantService } from 'src/app/data/modules/auth/services/apprenant.service';
import { environment } from 'src/environments/environment';

interface CardData {
  nom: string
  prenoms: string
  matricule: string
  filiere: string
  parcours: string
  niveau: string
  anneeScolaire: string
  dateNaissance: string
  salle: string
  urgenceNom: string
  urgencePrenoms: string
  urgenceTel: string
  urgenceAdresse: string
  photoSrc: string
  qrSrc: string | null
  badge: string
  badgeClass: string
}

interface CardFieldDefinition {
  key: string
  label: string
  value: string
}

interface GroupedApprenants {
  key: string
  label: string
  apprenants: Apprenant[]
}

@Component({
  selector: 'app-cartes-page',
  templateUrl: './cartes-page.component.html',
  styleUrls: ['./cartes-page.component.scss']
})
export class CartesPageComponent extends BaseComponentClass {
  apprenants: Apprenant[] = []
  loading = false
  error = false
  selectedApprenant: Apprenant | null = null
  cardFlipped = false
  cardMode: 'picker' | 'manual' = 'picker'
  manualPhotoSrc = ''
  previewFlips: { [id: string]: boolean } = {}
  dateDelivrance = ''
  qrBlobUrls: { [id: string]: string } = {}
  groupBy: 'none' | 'salle' | 'filiere' | 'niveau' | 'parcours' = 'none'
  selectedFields = ['matricule', 'nom', 'prenoms', 'filiere', 'niveau', 'anneeScolaire', 'dateNaissance', 'salle']
  customFields: Array<{ id: string; label: string; value: string }> = []
  customFieldInput = ''

  readonly PHOTOS_PATH: string = environment.MEDIAS_PATH.AUTH.PHOTOS
  readonly fieldOptions = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'nom', label: 'Nom' },
    { key: 'prenoms', label: 'Prénoms' },
    { key: 'filiere', label: 'Filière' },
    { key: 'parcours', label: 'Parcours' },
    { key: 'niveau', label: 'Niveau' },
    { key: 'anneeScolaire', label: 'Année académique' },
    { key: 'dateNaissance', label: 'Date de naissance' },
    { key: 'salle', label: 'Salle' },
    { key: 'urgenceNom', label: 'Contact urgence' }
  ]

  manualForm: FormGroup

  constructor(private apprenantService: ApprenantService, private fb: FormBuilder) {
    super()
    this.dateDelivrance = this.formatDate(new Date())
    this.manualForm = this.fb.group({
      nom: [''],
      prenoms: [''],
      matricule: [''],
      filiere: [''],
      parcours: [''],
      niveau: [''],
      anneeScolaire: [''],
      dateNaissance: [''],
      salle: [''],
      urgenceNom: [''],
      urgencePrenoms: [''],
      urgenceTel: [''],
      urgenceAdresse: ['']
    })
    this.loadApprenants()
  }

  loadApprenants(): void {
    this.loading = true
    this.error = false
    this.apprenantService.getAll().subscribe({
      next: (res) => {
        this.apprenants = res
        this.loading = false
        this.loadQrCodes()
        if (!this.selectedApprenant && res.length > 0) {
          this.selectStudent(res[0])
        }
      },
      error: () => {
        this.apprenants = []
        this.error = true
        this.loading = false
      }
    })
  }

  setMode(mode: 'picker' | 'manual'): void {
    this.cardMode = mode
    this.cardFlipped = false
  }

  selectStudent(apprenant: Apprenant): void {
    this.selectedApprenant = apprenant
    this.cardFlipped = false
    this.manualForm.patchValue({
      nom: apprenant.utilisateur?.nom || '',
      prenoms: apprenant.utilisateur?.prenoms || '',
      matricule: this.clean(this.getMatricule(apprenant)),
      filiere: this.clean(this.getFiliere(apprenant)),
      parcours: this.clean(this.getParcours(apprenant)),
      niveau: this.clean(this.getNiveau(apprenant)),
      anneeScolaire: this.clean(this.getAnneeScolaire(apprenant)),
      dateNaissance: apprenant.dateNaissance ? String(apprenant.dateNaissance).slice(0, 10) : '',
      salle: this.clean(this.getSalle(apprenant)),
      urgenceNom: apprenant.personnePrevenir?.nom || '',
      urgencePrenoms: apprenant.personnePrevenir?.prenoms || '',
      urgenceTel: apprenant.personnePrevenir?.telMobile || '',
      urgenceAdresse: this.buildUrgenceAdresse(apprenant)
    })
  }

  toggleField(fieldKey: string): void {
    if (this.selectedFields.includes(fieldKey)) {
      this.selectedFields = this.selectedFields.filter((item) => item !== fieldKey)
    } else {
      this.selectedFields = [...this.selectedFields, fieldKey]
    }
  }

  addCustomField(): void {
    const label = this.customFieldInput.trim()
    if (!label) return
    this.customFields = [
      ...this.customFields,
      { id: `${Date.now()}`, label, value: 'À renseigner' }
    ]
    this.customFieldInput = ''
  }

  updateCustomFieldLabel(index: number, event: Event): void {
    const target = event.target as HTMLInputElement
    this.customFields[index].label = target.value
  }

  updateCustomFieldValue(index: number, event: Event): void {
    const target = event.target as HTMLInputElement
    this.customFields[index].value = target.value
  }

  removeCustomField(index: number): void {
    this.customFields = this.customFields.filter((_, itemIndex) => itemIndex !== index)
  }

  toggleFlip(): void {
    this.cardFlipped = !this.cardFlipped
  }

  onPreviewClick(apprenant: Apprenant): void {
    this.selectStudent(apprenant)
    const key = String(apprenant.id)
    this.previewFlips[key] = !this.previewFlips[key]
  }

  isPreviewFlipped(apprenant: Apprenant): boolean {
    return !!this.previewFlips[String(apprenant.id)]
  }

  printCard(): void {
    window.print()
  }

  loadQrCodes(): void {
    for (const apprenant of this.apprenants) {
      if (apprenant.qrCode) {
        this.apprenantService.getQrCodeBlob(apprenant.qrCode).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob)
            this.qrBlobUrls[apprenant.id as any] = url
          },
          error: () => {}
        })
      }
    }
  }

  getQrCodeUrl(apprenant: Apprenant): string | null {
    return this.qrBlobUrls[apprenant.id as any] || null
  }

  getVisibleCardFields(): CardFieldDefinition[] {
    const fields: CardFieldDefinition[] = []
    const value = this.card

    if (this.selectedFields.includes('matricule')) {
      fields.push({ key: 'matricule', label: 'Matricule', value: value.matricule })
    }
    if (this.selectedFields.includes('nom')) {
      fields.push({ key: 'nom', label: 'Nom', value: value.nom })
    }
    if (this.selectedFields.includes('prenoms')) {
      fields.push({ key: 'prenoms', label: 'Prénoms', value: value.prenoms })
    }
    if (this.selectedFields.includes('filiere')) {
      fields.push({ key: 'filiere', label: 'Filière', value: value.filiere })
    }
    if (this.selectedFields.includes('parcours')) {
      fields.push({ key: 'parcours', label: 'Parcours', value: value.parcours })
    }
    if (this.selectedFields.includes('niveau')) {
      fields.push({ key: 'niveau', label: 'Niveau', value: value.niveau })
    }
    if (this.selectedFields.includes('anneeScolaire')) {
      fields.push({ key: 'anneeScolaire', label: 'Année académique', value: value.anneeScolaire })
    }
    if (this.selectedFields.includes('dateNaissance')) {
      fields.push({ key: 'dateNaissance', label: 'Date de naissance', value: value.dateNaissance })
    }
    if (this.selectedFields.includes('salle')) {
      fields.push({ key: 'salle', label: 'Salle', value: value.salle })
    }
    if (this.selectedFields.includes('urgenceNom')) {
      fields.push({ key: 'urgenceNom', label: 'Urgence', value: `${value.urgenceNom} ${value.urgencePrenoms}`.trim() })
    }

    this.customFields.forEach((field) => {
      fields.push({ key: field.id, label: field.label, value: field.value })
    })

    return fields
  }

  getGroupedApprenants(): GroupedApprenants[] {
    if (this.groupBy === 'none') {
      return [{ key: 'all', label: 'Tous les étudiants', apprenants: this.apprenants }]
    }

    const groups = new Map<string, Apprenant[]>()
    this.apprenants.forEach((apprenant) => {
      const groupKey = this.getGroupValue(apprenant)
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(apprenant)
    })

    return Array.from(groups.entries()).map(([key, apprenants]) => ({
      key,
      label: key,
      apprenants
    }))
  }

  setGroupBy(group: 'none' | 'salle' | 'filiere' | 'niveau' | 'parcours'): void {
    this.groupBy = group
  }

  private getGroupValue(apprenant: Apprenant): string {
    switch (this.groupBy) {
      case 'salle':
        return this.getSalle(apprenant)
      case 'filiere':
        return this.getFiliere(apprenant)
      case 'niveau':
        return this.getNiveau(apprenant)
      case 'parcours':
        return this.getParcours(apprenant)
      default:
        return 'Tous les étudiants'
    }
  }

  get card(): CardData {
    if (this.cardMode === 'manual') {
      const v = this.manualForm.value
      return {
        nom: v.nom?.trim() || '---',
        prenoms: v.prenoms?.trim() || '---',
        matricule: v.matricule?.trim() || '---',
        filiere: v.filiere?.trim() || '---',
        parcours: v.parcours?.trim() || '---',
        niveau: v.niveau?.trim() || '---',
        anneeScolaire: v.anneeScolaire?.trim() || '---',
        dateNaissance: v.dateNaissance ? this.formatDateStr(v.dateNaissance) : '---',
        salle: v.salle?.trim() || '---',
        urgenceNom: v.urgenceNom?.trim() || '---',
        urgencePrenoms: v.urgencePrenoms?.trim() || '---',
        urgenceTel: v.urgenceTel?.trim() || '---',
        urgenceAdresse: v.urgenceAdresse?.trim() || '---',
        photoSrc: this.manualPhotoSrc || 'assets/images/etudiants/avatar-1.svg',
        qrSrc: null,
        badge: 'SAISIE MANUELLE',
        badgeClass: 'badge-pending'
      }
    }
    const a = this.selectedApprenant
    if (!a) {
      return {
        nom: '---', prenoms: '---', matricule: '---', filiere: '---', parcours: '---',
        niveau: '---', anneeScolaire: '---', dateNaissance: '---', salle: '---',
        urgenceNom: '---', urgencePrenoms: '---', urgenceTel: '---', urgenceAdresse: '---',
        photoSrc: 'assets/images/etudiants/avatar-1.svg',
        qrSrc: null, badge: 'EN ATTENTE', badgeClass: 'badge-pending'
      }
    }
    return {
      nom: a.utilisateur?.nom || '---',
      prenoms: a.utilisateur?.prenoms || '---',
      matricule: this.getMatricule(a),
      filiere: this.getFiliere(a),
      parcours: this.getParcours(a),
      niveau: this.getNiveau(a),
      anneeScolaire: this.getAnneeScolaire(a),
      dateNaissance: this.getDateNaissance(a),
      salle: this.getSalle(a),
      urgenceNom: this.getUrgenceNom(a),
      urgencePrenoms: this.getUrgencePrenoms(a),
      urgenceTel: this.getUrgenceTel(a),
      urgenceAdresse: this.getUrgenceAdresse(a),
      photoSrc: this.getPhotoSrc(a),
      qrSrc: this.getQrCodeUrl(a),
      badge: a.qrCode ? 'ACTIF' : 'EN ATTENTE',
      badgeClass: a.qrCode ? 'badge-active' : 'badge-pending'
    }
  }

  /** Photo chargée en local pour la saisie manuelle (dataURL, non persistée). */
  onManualPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      this.manualPhotoSrc = typeof reader.result === 'string' ? reader.result : ''
    }
    reader.readAsDataURL(file)
  }

  private getAvatarAsset(apprenant: Apprenant): string {
    const avatars = ['avatar-1.svg', 'avatar-2.svg', 'avatar-3.svg', 'avatar-4.svg']
    const idx = (Number(apprenant.id) || 0) % avatars.length
    return 'assets/images/etudiants/' + avatars[idx]
  }

  getPhotoSrc(apprenant: Apprenant): string {
    return apprenant.photo ? this.PHOTOS_PATH + apprenant.photo : this.getAvatarAsset(apprenant)
  }

  onPhotoError(event: Event, apprenant: Apprenant | null = null): void {
    const img = event.target as HTMLImageElement
    if (img && img.src && !img.src.includes('etudiants/avatar-')) {
      img.src = apprenant ? this.getAvatarAsset(apprenant) : 'assets/images/etudiants/avatar-1.svg'
    }
  }

  getCursus(apprenant: Apprenant): any {
    return apprenant.utilisateur?.cursusApprenant?.[0]
  }

  getMatricule(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.demandeInscription?.matricule || apprenant.utilisateur?.identifiant || '---'
  }

  getParcours(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.parcours?.titre || '---'
  }

  getFiliere(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.parcours?.titre?.split(' ')[0] || '---'
  }

  getAnneeScolaire(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.anneeAcademique?.libelle || (apprenant.createdAt ? new Date(apprenant.createdAt).getFullYear().toString() : '---')
  }

  getClasse(apprenant: Apprenant): string {
    return this.getCursus(apprenant)?.classe?.libelle || '---'
  }

  getNiveau(apprenant: Apprenant): string {
    const niveau = this.getCursus(apprenant)?.niveauEtude?.libelle
    if (niveau) return niveau
    const classe = this.getClasse(apprenant)
    if (classe.toLowerCase().includes('licence')) return classe
    if (classe.toLowerCase().includes('master')) return classe
    return classe || '---'
  }

  getSalle(apprenant: Apprenant): string {
    const cursus = this.getCursus(apprenant)
    const direct = (cursus as any)?.salle?.libelle || (cursus as any)?.salle || (cursus as any)?.classe?.salle?.libelle
    if (direct) return direct
    return 'Salle non renseignée'
  }

  getDateNaissance(apprenant: Apprenant): string {
    if (!apprenant.dateNaissance) return '---'
    return this.formatDateStr(apprenant.dateNaissance.toString())
  }

  getUrgenceNom(apprenant: Apprenant): string {
    return apprenant.personnePrevenir?.nom || '---'
  }

  getUrgenceNomComplet(apprenant: Apprenant): string {
    const nom = this.getUrgenceNom(apprenant)
    const prenoms = this.getUrgencePrenoms(apprenant)
    if (nom === '---' && prenoms === '---') return '---'
    if (nom === '---') return prenoms
    if (prenoms === '---') return nom
    return nom + ' ' + prenoms
  }

  getUrgencePrenoms(apprenant: Apprenant): string {
    return apprenant.personnePrevenir?.prenoms || '---'
  }

  getUrgenceTel(apprenant: Apprenant): string {
    return apprenant.personnePrevenir?.telMobile || '---'
  }

  getUrgenceAdresse(apprenant: Apprenant): string {
    return this.buildUrgenceAdresse(apprenant) || '---'
  }

  private buildUrgenceAdresse(apprenant: Apprenant): string {
    const p = apprenant.personnePrevenir
    if (!p) return ''
    return [p.quartier, p.ville, p.pays].filter(Boolean).join(', ')
  }

  isSelected(apprenant: Apprenant): boolean {
    return this.selectedApprenant?.id === apprenant.id
  }

  private clean(v: string): string {
    return v === '---' ? '' : v
  }

  private formatDateStr(dateStr: string): string {
    const parts = dateStr.slice(0, 10).split('-')
    if (parts.length === 3 && parts[0].length === 4) {
      return parts[2] + '/' + parts[1] + '/' + parts[0]
    }
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '---'
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear()
  }

  private formatDate(date: Date): string {
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    const d = date.getDate()
    const m = months[date.getMonth()]
    const y = date.getFullYear()
    return d + ' ' + m + ' ' + y
  }
}

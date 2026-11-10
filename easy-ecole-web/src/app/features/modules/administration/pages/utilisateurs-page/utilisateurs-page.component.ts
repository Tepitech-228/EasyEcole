import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Router } from '@angular/router';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-utilisateurs-page',
  templateUrl: './utilisateurs-page.component.html',
  styleUrls: ['./utilisateurs-page.component.scss']
})
export class UtilisateursPageComponent extends BaseComponentClass implements OnInit {
  RolesUtilisateur = RolesUtilisateur
  utilisateurs: any[] = []
  loading: boolean = false
  searchTerm: string = ''
  roleFilter: string = ''

  showModal: boolean = false
  editingUser: any = null
  formData: any = {}
  selectedPhoto: File | null = null
  saving: boolean = false
  availableSites: SiteUtilisateur[] = []
  sitesLoading: boolean = false
  sitesError: string = ''

  showDeleteModal: boolean = false
  deletingUser: any = null

  roleKeys = Object.keys(RolesUtilisateur).filter(k => isNaN(Number(k)))
  roleLabels: { [key: string]: string } = {
    [RolesUtilisateur.ADMIN]: 'Administrateur',
    [RolesUtilisateur.APPRENANT]: 'Apprenant',
    [RolesUtilisateur.INSTITUTION]: 'Institution',
    [RolesUtilisateur.ENSEIGNANT]: 'Enseignant',
    [RolesUtilisateur.CAISSIER_BANQUE]: 'Caissier Banque',
    [RolesUtilisateur.RESSOURCES_HUMAINES]: 'Ressources Humaines',
    [RolesUtilisateur.CABINET_COMPTABLE]: 'Audit',
    [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'Orientation",
    [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel Administratif',
    [RolesUtilisateur.ESA_COMPTA]: 'Service Recouvrement',
    [RolesUtilisateur.PARENT]: 'Parent',
    [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
    [RolesUtilisateur.SURVEILLANT]: 'Surveillant',
    [RolesUtilisateur.SUPERVISEUR_GENERAL]: 'Superviseur Général',
  }

  // Rôles staff = tous sauf apprenant, enseignant, parent, admin, institution → profil PersonnelAdministratif
  private readonly staffRoles = [
    RolesUtilisateur.PERSONNEL_ADMINISTRATIF,
    RolesUtilisateur.CAISSIER_BANQUE,
    RolesUtilisateur.COMITE_ORIENTATION,
    RolesUtilisateur.CABINET_COMPTABLE,
    RolesUtilisateur.RESSOURCES_HUMAINES,
    RolesUtilisateur.ESA_COMPTA,
    RolesUtilisateur.SECRETAIRE,
    RolesUtilisateur.SURVEILLANT,
    RolesUtilisateur.SUPERVISEUR_GENERAL,
  ]

  private readonly rolesCreablesParSurveillant = [
    RolesUtilisateur.APPRENANT,
    RolesUtilisateur.ENSEIGNANT,
    ...this.staffRoles,
  ]

  constructor(
    private utilisateurService: UtilisateurService,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
  ) { super() }

  ngOnInit(): void {
    this.loadUtilisateurs()
  }

  get roleKeysForForm(): string[] {
    let keys = this.roleKeys
    if (this.rolesValue.isSurveillant) {
      keys = keys.filter(key =>
        this.rolesCreablesParSurveillant.includes(RolesUtilisateur[key])
      )
    }
    if (this.rolesValue.isInstitution) {
      keys = keys.filter(key =>
        ![RolesUtilisateur.ADMIN, RolesUtilisateur.INSTITUTION].includes(RolesUtilisateur[key])
      )
    }
    return keys
  }

  loadUtilisateurs(): void {
    this.loading = true
    this.utilisateurService.getAll().subscribe({
      next: (res) => {
        this.utilisateurs = Array.isArray(res) ? res : []
        this.loading = false
      },
      error: () => {
        this.loading = false
        this.toastService.error('Erreur lors du chargement des utilisateurs')
      }
    })
  }

  get filteredUtilisateurs(): any[] {
    return this.utilisateurs.filter(u => {
      const matchSearch = !this.searchTerm ||
        (u.nom || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (u.prenoms || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (u.identifiant || '').toLowerCase().includes(this.searchTerm.toLowerCase())
      const matchRole = !this.roleFilter || u.role === this.roleFilter
      return matchSearch && matchRole
    })
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role
  }

  getStatut(user: any): string {
    return user.dateVerificationEmail ? 'Actif' : 'Inactif'
  }

  getStatutColor(statut: string): string {
    return statut === 'Actif' ? 'green' : 'red'
  }

  openAddModal(): void {
    this.editingUser = null
    this.selectedPhoto = null
    this.formData = {
      nom: '', prenoms: '', email: '', identifiant: '', motDePasse: '',
      role: RolesUtilisateur.APPRENANT, contact: '', siteIds: [],
      // Champs profil
      fonction: '', matricule: '', statut: 'Permanent', directionService: '',
      cni: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', nationalite: '',
      specialite: '', gradeAcademique: '', fonctionAdministrative: '',
      nifOtr: '', anneeExperience: 0, heureTheoriqueAnnuelle: 0, heureReelleAnnuelle: 0,
      plusHautDiplome: '', statutHandicap: false, natureHandicap: '',
      statutEtudiant: 'nouveau', periode: 'matin',
      typePieceIdentite: '', numeroPiece: '', anneeObtentionBac: '', serieBac: '',
      anneePremiereInscription: '', nombreInscriptions: 0, diplomePrepare: '',
      estPrescripteur: false,
    }
    this.showModal = true
    this.loadAvailableSites()
  }

  openEditModal(user: any): void {
    this.editingUser = user
    this.selectedPhoto = null
    this.formData = this.buildEditFormData(user, user.role || RolesUtilisateur.APPRENANT)
    this.showModal = true
    this.loadAvailableSites()
  }

  onRoleChange(role: RolesUtilisateur): void {
    const accountFields = {
      nom: this.formData.nom,
      prenoms: this.formData.prenoms,
      email: this.formData.email,
      identifiant: this.formData.identifiant,
      motDePasse: this.formData.motDePasse,
      contact: this.formData.contact,
      siteIds: this.sitesSelectionnes,
    }
    if (this.editingUser) {
      this.formData = {
        ...this.buildEditFormData(this.editingUser, role),
        ...accountFields,
        role,
      }
      if (this.siteSelectionRequired && this.sitesSelectionnes.length === 0 && this.availableSites.length === 1) {
        this.formData.siteIds = [Number(this.availableSites[0].id)]
      }
      return
    }
    this.formData = {
      ...this.formData,
      ...this.emptyProfileFields(),
      ...accountFields,
      role,
    }
    if (this.siteSelectionRequired && this.sitesSelectionnes.length === 0 && this.availableSites.length === 1) {
      this.formData.siteIds = [Number(this.availableSites[0].id)]
    }
  }

  private buildEditFormData(user: any, role: RolesUtilisateur): Record<string, any> {
    const profile = this.profileForRole(user, role)
    const siteIds = Array.isArray(user.affectationsSites)
      ? user.affectationsSites.map((assignment: any) => Number(assignment.etablissementId))
      : []
    if (user.etablissementId && !siteIds.includes(Number(user.etablissementId))) {
      siteIds.push(Number(user.etablissementId))
    }
    return {
      ...this.emptyProfileFields(),
      ...profile,
      nom: user.nom || '',
      prenoms: user.prenoms || '',
      email: user.email || '',
      identifiant: user.identifiant || '',
      motDePasse: '',
      contact: user.contact || '',
      role,
      siteIds,
    }
  }

  private emptyProfileFields(): Record<string, any> {
    return {
      fonction: '', matricule: '', statut: 'Permanent', directionService: '',
      cni: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', nationalite: '',
      specialite: '', gradeAcademique: '', fonctionAdministrative: '', nifOtr: '',
      anneeExperience: 0, heureTheoriqueAnnuelle: 0, heureReelleAnnuelle: 0,
      plusHautDiplome: '', statutHandicap: false, natureHandicap: '',
      statutEtudiant: 'nouveau', periode: 'matin', typePieceIdentite: '',
      numeroPiece: '', anneeObtentionBac: '', serieBac: '',
      anneePremiereInscription: '', nombreInscriptions: 0, diplomePrepare: '',
      estPrescripteur: false,
    }
  }

  private profileForRole(user: any, role: RolesUtilisateur): Record<string, any> {
    let profile: any = null
    switch (role) {
      case RolesUtilisateur.APPRENANT:
        profile = user.apprenant
        break
      case RolesUtilisateur.ENSEIGNANT:
        profile = user.enseignant
        break
      case RolesUtilisateur.COMITE_ORIENTATION:
        profile = user.comiteOrientation
        break
      case RolesUtilisateur.CAISSIER_BANQUE:
        profile = user.caissierBanque
        break
      case RolesUtilisateur.INSTITUTION:
        profile = user.institution
        break
      default:
        if (this.staffRoles.includes(role)) profile = user.personnelAdministratif
    }
    if (!profile) return {}
    return {
      ...profile,
      dateNaissance: this.dateForInput(profile.dateNaissance),
    }
  }

  private dateForInput(value: string | Date | null | undefined): string {
    if (!value) return ''
    return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
  }

  closeModal(): void {
    this.showModal = false
    this.editingUser = null
    this.formData = {}
    this.selectedPhoto = null
    this.sitesError = ''
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    this.selectedPhoto = input.files?.[0] || null
  }

  private loadAvailableSites(): void {
    this.sitesLoading = true
    this.sitesError = ''
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.availableSites = sites
        this.sitesLoading = false
        if (!this.editingUser && sites.length === 1) {
          this.formData.siteIds = [Number(sites[0].id)]
        } else if (this.siteSelectionRequired && this.sitesSelectionnes.length === 0 && sites.length === 1) {
          this.formData.siteIds = [Number(sites[0].id)]
        }
      },
      error: () => {
        this.availableSites = []
        this.sitesLoading = false
        this.sitesError = 'Les sites autorisés ne peuvent pas être chargés. Réessayez avant d’enregistrer.'
      }
    })
  }

  get siteSelectionRequired(): boolean {
    return ![
      RolesUtilisateur.ADMIN,
      RolesUtilisateur.INSTITUTION,
      RolesUtilisateur.COMITE_ORIENTATION,
      RolesUtilisateur.SUPERVISEUR_GENERAL,
      RolesUtilisateur.CABINET_COMPTABLE,
    ].includes(this.formData.role)
  }

  siteEstSelectionne(siteId: number): boolean {
    return Array.isArray(this.formData.siteIds)
      && this.formData.siteIds.some((id: number) => Number(id) === Number(siteId))
  }

  modifierSiteSelection(siteId: number, selected: boolean): void {
    const selectedIds: number[] = Array.isArray(this.formData.siteIds) ? this.formData.siteIds : []
    this.formData.siteIds = selected
      ? [...new Set([...selectedIds.map(Number), Number(siteId)])]
      : selectedIds.filter(id => Number(id) !== Number(siteId))
  }

  selectionnerSiteApprenant(siteId: number | null): void {
    this.formData.siteIds = siteId ? [Number(siteId)] : []
  }

  private get sitesSelectionnes(): number[] {
    return Array.isArray(this.formData.siteIds) ? this.formData.siteIds.map(Number) : []
  }

  saveUser(): void {
    if (!this.formData.nom || !this.formData.prenoms || !this.formData.email) {
      this.toastService.error('Nom, prénoms et email sont requis')
      return
    }
    if (!this.editingUser && !this.selectedPhoto) {
      this.toastService.error('Une photo de profil est obligatoire pour créer un compte utilisateur')
      return
    }
    if (this.sitesLoading) {
      this.toastService.error('Attendez le chargement des sites autorisés')
      return
    }
    if (this.sitesError) {
      this.toastService.error(this.sitesError)
      return
    }
    if (this.siteSelectionRequired && this.sitesSelectionnes.length === 0) {
      this.toastService.error('Sélectionnez au moins un site pour cet utilisateur')
      return
    }
    if (this.isApprenant && this.sitesSelectionnes.length !== 1) {
      this.toastService.error('Un apprenant doit être rattaché à un seul site')
      return
    }
    if (this.isApprenant && (!this.formData.dateNaissance || !this.formData.lieuNaissance)) {
      this.toastService.error('La date et le lieu de naissance sont obligatoires pour un apprenant')
      return
    }
    if (this.isStaff && !String(this.formData.fonction || '').trim()) {
      this.toastService.error('La fonction est obligatoire pour ce profil')
      return
    }
    this.saving = true
    const userData = { ...this.formData, siteIds: this.sitesSelectionnes }
    const photo = this.selectedPhoto
    let obs: Observable<any>
    if (this.editingUser) {
      obs = this.utilisateurService.adminUpdate(this.editingUser.id, userData, photo)
    } else if (photo) {
      obs = this.utilisateurService.adminCreate(userData, photo)
    } else {
      this.saving = false
      this.toastService.error('Une photo de profil est obligatoire pour créer un compte utilisateur')
      return
    }

    obs.subscribe({
      next: (response) => {
        const wasEditing = Boolean(this.editingUser)
        const createdRole = this.formData.role
        this.saving = false
        this.closeModal()
        this.loadUtilisateurs()
        if (response?.hikvisionEnrollmentWarning) {
          this.toastService.error(response.hikvisionEnrollmentWarning)
        } else if (
          !wasEditing &&
          [RolesUtilisateur.ENSEIGNANT, ...this.staffRoles].includes(createdRole) &&
          !response?.hikvisionEnrollmentQueued
        ) {
          this.toastService.success('Utilisateur créé avec sa photo. Aucun terminal Hikvision actif sur ses sites : son enrôlement sera préparé à l’ajout d’un terminal.')
        } else {
          this.toastService.success(wasEditing ? 'Utilisateur modifié' : 'Utilisateur créé')
        }
      },
      error: (err) => {
        this.saving = false
        this.toastService.error(err.error?.message || 'Erreur lors de l\'enregistrement')
      }
    })
  }

  confirmDelete(user: any): void {
    this.deletingUser = user
    this.showDeleteModal = true
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false
    this.deletingUser = null
  }

  deleteUser(): void {
    if (!this.deletingUser) return
    this.saving = true
    this.utilisateurService.delete(this.deletingUser.id).subscribe({
      next: () => {
        this.saving = false
        this.closeDeleteModal()
        this.loadUtilisateurs()
        this.toastService.success('Utilisateur définitivement supprimé')
      },
      error: (err) => {
        this.saving = false
        this.closeDeleteModal()
        this.toastService.error(err.error?.message || 'Erreur lors de la suppression')
      }
    })
  }

  get showProfilFields(): boolean {
    return [
      RolesUtilisateur.APPRENANT,
      RolesUtilisateur.ENSEIGNANT,
      RolesUtilisateur.INSTITUTION,
      ...this.staffRoles,
    ].includes(this.formData.role)
  }

  get isApprenant(): boolean {
    return this.formData.role === RolesUtilisateur.APPRENANT
  }

  get isEnseignant(): boolean {
    return this.formData.role === RolesUtilisateur.ENSEIGNANT
  }

  get isStaff(): boolean {
    return this.staffRoles.includes(this.formData.role)
      && ![RolesUtilisateur.CAISSIER_BANQUE, RolesUtilisateur.COMITE_ORIENTATION].includes(this.formData.role)
  }

  get isCaissier(): boolean {
    return this.formData.role === RolesUtilisateur.CAISSIER_BANQUE
  }

  get isComite(): boolean {
    return this.formData.role === RolesUtilisateur.COMITE_ORIENTATION
  }

  get profilSectionTitle(): string {
    if (this.isApprenant) return 'Profil Apprenant'
    if (this.isEnseignant) return 'Profil Enseignant'
    if (this.isStaff) return 'Profil Personnel'
    if (this.isCaissier) return 'Profil Caissier Banque'
    if (this.isComite) return "Profil Comité d'Orientation"
    if (this.formData.role === RolesUtilisateur.INSTITUTION) return 'Profil Institution'
    return ''
  }

  openPermissions(user: any): void {
    this.router.navigate(['/parametres/permissions'])
  }
}

import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Router } from '@angular/router';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';

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

  constructor(
    private utilisateurService: UtilisateurService,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
  ) { super() }

  ngOnInit(): void {
    this.loadUtilisateurs()
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
    this.formData = {
      nom: '', prenoms: '', email: '', identifiant: '', motDePasse: '',
      role: RolesUtilisateur.APPRENANT, contact: '', siteIds: [],
      // Champs profil
      fonction: '', matricule: '', statut: 'Permanent', directionService: '',
      cni: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', nationalite: 'Ivoirienne',
      specialite: '', gradeAcademique: '', fonctionAdministrative: '',
      anneeExperience: 0, plusHautDiplome: '',
      statutEtudiant: 'nouveau', periode: 'matin',
      estPrescripteur: false,
    }
    this.showModal = true
    this.loadAvailableSites()
  }

  openEditModal(user: any): void {
    this.editingUser = user
    this.formData = {
      nom: user.nom || '',
      prenoms: user.prenoms || '',
      email: user.email || '',
      identifiant: user.identifiant || '',
      contact: user.contact || '',
      role: user.role || RolesUtilisateur.APPRENANT,
    }
    this.showModal = true
  }

  closeModal(): void {
    this.showModal = false
    this.editingUser = null
    this.formData = {}
    this.sitesError = ''
  }

  private loadAvailableSites(): void {
    this.sitesLoading = true
    this.sitesError = ''
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.availableSites = sites
        this.sitesLoading = false
        if (sites.length === 1) {
          this.formData.siteIds = [Number(sites[0].id)]
        }
      },
      error: () => {
        this.availableSites = []
        this.sitesLoading = false
        this.sitesError = 'Les sites autorisés ne peuvent pas être chargés. Réessayez avant de créer l’utilisateur.'
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
    if (!this.editingUser && this.sitesLoading) {
      this.toastService.error('Attendez le chargement des sites autorisés')
      return
    }
    if (!this.editingUser && this.sitesError) {
      this.toastService.error(this.sitesError)
      return
    }
    if (!this.editingUser && this.siteSelectionRequired && this.sitesSelectionnes.length === 0) {
      this.toastService.error('Sélectionnez au moins un site pour cet utilisateur')
      return
    }
    if (!this.editingUser && this.isApprenant && this.sitesSelectionnes.length !== 1) {
      this.toastService.error('Un apprenant doit être rattaché à un seul site')
      return
    }
    this.saving = true
    const userData = this.editingUser
      ? this.formData
      : { ...this.formData, siteIds: this.sitesSelectionnes }
    const obs = this.editingUser
      ? this.utilisateurService.adminUpdate(this.editingUser.id, userData)
      : this.utilisateurService.adminCreate(userData)

    obs.subscribe({
      next: () => {
        this.saving = false
        this.closeModal()
        this.loadUtilisateurs()
        this.toastService.success(this.editingUser ? 'Utilisateur modifié' : 'Utilisateur créé')
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
    return [RolesUtilisateur.APPRENANT, RolesUtilisateur.ENSEIGNANT, ...this.staffRoles].includes(this.formData.role)
  }

  get isApprenant(): boolean {
    return this.formData.role === RolesUtilisateur.APPRENANT
  }

  get isEnseignant(): boolean {
    return this.formData.role === RolesUtilisateur.ENSEIGNANT
  }

  get isStaff(): boolean {
    return this.staffRoles.includes(this.formData.role)
  }

  get profilSectionTitle(): string {
    if (this.isApprenant) return 'Profil Apprenant'
    if (this.isEnseignant) return 'Profil Enseignant'
    if (this.isStaff) return 'Profil Personnel'
    return ''
  }

  openPermissions(user: any): void {
    this.router.navigate(['/parametres/permissions'])
  }
}

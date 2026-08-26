import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { Router } from '@angular/router';

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
    [RolesUtilisateur.CABINET_COMPTABLE]: 'Cabinet Comptable',
    [RolesUtilisateur.COMITE_ORIENTATION]: "Comité d'Orientation",
    [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'Personnel Administratif',
    [RolesUtilisateur.ESA_COMPTA]: 'ESA Compta',
    [RolesUtilisateur.PARENT]: 'Parent',
    [RolesUtilisateur.SECRETAIRE]: 'Secrétaire',
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
  ]

  constructor(
    private utilisateurService: UtilisateurService,
    private toastService: ToastService,
    private router: Router,
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
      role: RolesUtilisateur.APPRENANT, contact: '',
      // Champs profil
      fonction: '', matricule: '', statut: 'Permanent', directionService: '',
      cni: '', dateNaissance: '', lieuNaissance: '', sexe: 'M', nationalite: 'Ivoirienne',
      specialite: '', gradeAcademique: '', fonctionAdministrative: '',
      anneeExperience: 0, plusHautDiplome: '',
      statutEtudiant: 'nouveau', periode: 'matin',
    }
    this.showModal = true
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
  }

  saveUser(): void {
    if (!this.formData.nom || !this.formData.prenoms || !this.formData.email) {
      this.toastService.error('Nom, prénoms et email sont requis')
      return
    }
    this.saving = true
    const obs = this.editingUser
      ? this.utilisateurService.adminUpdate(this.editingUser.id, this.formData)
      : this.utilisateurService.adminCreate(this.formData)

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
        this.toastService.success('Utilisateur supprimé')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur lors de la suppression')
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

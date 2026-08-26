import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { PermissionService } from 'src/app/data/modules/auth/services/permission.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-gestion-permissions-page',
  templateUrl: './gestion-permissions-page.component.html',
  styleUrls: ['./gestion-permissions-page.component.scss']
})
export class GestionPermissionsPageComponent extends BaseComponentClass implements OnInit {

  utilisateurs: any[] = []
  selectedUtilisateur: any = null
  permissionsGrouped: any = {}
  userPermissions: Set<number> = new Set()
  loading: boolean = false
  saving: boolean = false
  searchTerm: string = ''
  showCopyModal: boolean = false
  copyTargetUser: any = null

  constructor(
    private permissionService: PermissionService,
    private utilisateurService: UtilisateurService,
    private toastService: ToastService
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadUtilisateurs()
    this.loadPermissions()
  }

  loadUtilisateurs(): void {
    this.utilisateurService.getAll().subscribe({
      next: (res) => {
        this.utilisateurs = Array.isArray(res) ? res : []
      },
      error: (err) => console.log(err)
    })
  }

  get filteredUtilisateurs(): any[] {
    if (!this.searchTerm) return this.utilisateurs
    const term = this.searchTerm.toLowerCase()
    return this.utilisateurs.filter(u =>
      u.nom?.toLowerCase().includes(term) ||
      u.prenoms?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.identifiant?.toLowerCase().includes(term)
    )
  }

  loadPermissions(): void {
    this.loading = true
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => {
        this.permissionsGrouped = res
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  selectUtilisateur(user: any): void {
    this.selectedUtilisateur = user
    this.searchTerm = ''
    this.loadUserPermissions()
  }

  loadUserPermissions(): void {
    if (!this.selectedUtilisateur) return
    this.loading = true
    this.permissionService.getUtilisateurPermissions(this.selectedUtilisateur.id).subscribe({
      next: (res) => {
        const perms = Array.isArray(res) ? res : []
        this.userPermissions = new Set(perms.map((p: any) => p.permissionId))
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  hasPermission(permissionId: number): boolean {
    return this.userPermissions.has(permissionId)
  }

  /**
   * Toggle une permission individuelle et sauvegarde immédiatement
   */
  togglePermission(permissionId: number, checked: boolean): void {
    if (!this.selectedUtilisateur) return
    if (checked) {
      this.userPermissions.add(Number(permissionId))
    } else {
      this.userPermissions.delete(Number(permissionId))
    }
    this.savePermissions()
  }

  /**
   * Toggle toutes les permissions d'un module et sauvegarde immédiatement
   */
  toggleModule(module: string, checked: boolean): void {
    if (!this.selectedUtilisateur) return
    const permissions = this.permissionsGrouped[module] || []
    for (const perm of permissions) {
      if (checked) {
        this.userPermissions.add(Number(perm.id))
      } else {
        this.userPermissions.delete(Number(perm.id))
      }
    }
    this.savePermissions()
  }

  isModuleFullyChecked(module: string): boolean {
    const permissions = this.permissionsGrouped[module] || []
    return permissions.length > 0 && permissions.every((p: any) => this.userPermissions.has(Number(p.id)))
  }

  isModulePartiallyChecked(module: string): boolean {
    const permissions = this.permissionsGrouped[module] || []
    const checked = permissions.filter((p: any) => this.userPermissions.has(Number(p.id)))
    return checked.length > 0 && checked.length < permissions.length
  }

  /**
   * Sauvegarde automatique — envoie toutes les permissions (cochées + décochées)
   */
  savePermissions(): void {
    if (!this.selectedUtilisateur) return
    this.saving = true

    const permissionsList: any[] = []
    for (const module in this.permissionsGrouped) {
      for (const perm of this.permissionsGrouped[module]) {
        permissionsList.push({
          permissionId: perm.id,
          estActif: this.userPermissions.has(Number(perm.id))
        })
      }
    }

    this.permissionService.updateUtilisateurPermissions(this.selectedUtilisateur.id, { permissions: permissionsList }).subscribe({
      next: () => {
        this.saving = false
        this.toastService.success('Permissions sauvegardées')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur lors de la sauvegarde')
      }
    })
  }

  clearSelection(): void {
    this.selectedUtilisateur = null
    this.userPermissions = new Set()
  }

  openCopyModal(): void {
    this.showCopyModal = true
    this.copyTargetUser = null
  }

  closeCopyModal(): void {
    this.showCopyModal = false
    this.copyTargetUser = null
  }

  copyFromUser(user: any): void {
    if (!this.selectedUtilisateur) return
    this.saving = true

    this.permissionService.copyPermissions(this.selectedUtilisateur.id, user.id).subscribe({
      next: () => {
        this.saving = false
        this.closeCopyModal()
        this.loadUserPermissions()
        this.toastService.success('Permissions copiées depuis ' + user.nom + ' ' + user.prenoms)
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur lors de la copie')
      }
    })
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : []
  }
}

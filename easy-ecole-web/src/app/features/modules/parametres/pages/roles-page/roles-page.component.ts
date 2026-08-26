import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RoleService } from 'src/app/data/modules/auth/services/role.service';
import { PermissionService } from 'src/app/data/modules/auth/services/permission.service';
import { UtilisateurService } from 'src/app/data/modules/auth/services/utilisateur.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-roles-page',
  templateUrl: './roles-page.component.html',
  styleUrls: ['./roles-page.component.scss']
})
export class RolesPageComponent extends BaseComponentClass implements OnInit {

  roles: any[] = []
  allPermissions: any = {}
  permissionsFlat: any[] = []
  selectedRole: any = null
  rolePermissions: Set<number> = new Set()
  roleUsers: any[] = []
  allUsers: any[] = []

  showCreateModal: boolean = false
  showEditModal: boolean = false
  showDeleteModal: boolean = false
  showAssignUserModal: boolean = false

  editForm: any = { nom: '', description: '' }

  loading: boolean = false
  saving: boolean = false
  activeTab: 'permissions' | 'users' = 'permissions'

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private utilisateurService: UtilisateurService,
    private toastService: ToastService
  ) {
    super()
  }

  ngOnInit(): void {
    this.loadRoles()
    this.loadAllPermissions()
    this.loadAllUsers()
  }

  loadRoles(): void {
    this.loading = true
    this.roleService.getAllRoles().subscribe({
      next: (res) => {
        this.roles = Array.isArray(res) ? res : []
        this.loading = false
      },
      error: () => this.loading = false
    })
  }

  loadAllPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => {
        this.allPermissions = res
        this.permissionsFlat = []
        for (const module in res) {
          for (const perm of res[module]) {
            this.permissionsFlat.push(perm)
          }
        }
      }
    })
  }

  loadAllUsers(): void {
    this.utilisateurService.getAll().subscribe({
      next: (res) => {
        this.allUsers = Array.isArray(res) ? res : []
      }
    })
  }

  selectRole(role: any): void {
    this.selectedRole = role
    this.activeTab = 'permissions'
    this.loadRolePermissions()
    this.loadRoleUsers()
  }

  loadRolePermissions(): void {
    if (!this.selectedRole) return
    this.roleService.getRolePermissions(this.selectedRole.id).subscribe({
      next: (res) => {
        const perms = Array.isArray(res) ? res : []
        this.rolePermissions = new Set(perms.map((p: any) => p.permissionId))
      }
    })
  }

  loadRoleUsers(): void {
    if (!this.selectedRole) return
    this.roleService.getRoleUtilisateurs(this.selectedRole.id).subscribe({
      next: (res) => {
        this.roleUsers = Array.isArray(res) ? res : []
      }
    })
  }

  hasPermission(permissionId: number): boolean {
    return this.rolePermissions.has(permissionId)
  }

  /**
   * Toggle une permission du rôle et sauvegarde + propage automatiquement
   */
  togglePermission(permissionId: number, checked: boolean): void {
    if (!this.selectedRole) return
    if (checked) {
      this.rolePermissions.add(permissionId)
    } else {
      this.rolePermissions.delete(permissionId)
    }
    this.savePermissions()
  }

  /**
   * Toggle toutes les permissions d'un module et sauvegarde + propage
   */
  toggleModule(module: string, checked: boolean): void {
    if (!this.selectedRole) return
    const permissions = this.allPermissions[module] || []
    for (const perm of permissions) {
      if (checked) {
        this.rolePermissions.add(Number(perm.id))
      } else {
        this.rolePermissions.delete(Number(perm.id))
      }
    }
    this.savePermissions()
  }

  isModuleFullyChecked(module: string): boolean {
    const permissions = this.allPermissions[module] || []
    return permissions.length > 0 && permissions.every((p: any) => this.rolePermissions.has(Number(p.id)))
  }

  isModulePartiallyChecked(module: string): boolean {
    const permissions = this.allPermissions[module] || []
    const checked = permissions.filter((p: any) => this.rolePermissions.has(Number(p.id)))
    return checked.length > 0 && checked.length < permissions.length
  }

  /**
   * Sauvegarde les permissions du rôle + propage à tous les utilisateurs du rôle
   */
  savePermissions(): void {
    if (!this.selectedRole) return
    this.saving = true

    const permissionIds: number[] = []
    for (const module in this.allPermissions) {
      for (const perm of this.allPermissions[module]) {
        if (this.rolePermissions.has(Number(perm.id))) {
          permissionIds.push(Number(perm.id))
        }
      }
    }

    this.roleService.updateRolePermissions(this.selectedRole.id, { permissionIds }).subscribe({
      next: () => {
        // Propager les permissions modifiées à tous les utilisateurs de ce rôle
        this.propagerAuxUtilisateurs()
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur lors de la sauvegarde')
      }
    })
  }

  /**
   * Applique les permissions du rôle à chaque utilisateur qui a ce rôle
   */
  propagerAuxUtilisateurs(): void {
    if (!this.selectedRole || this.roleUsers.length === 0) {
      this.saving = false
      this.toastService.success('Permissions sauvegardées')
      return
    }

    let done = 0
    const total = this.roleUsers.length

    for (const ru of this.roleUsers) {
      const userId = ru.utilisateurId || ru.utilisateur?.id
      if (!userId) { done++; continue }

      this.roleService.appliquerRolePermissions(this.selectedRole.id, userId).subscribe({
        next: () => {
          done++
          if (done >= total) {
            this.saving = false
            this.toastService.success(`Permissions sauvegardées et appliquées à ${total} utilisateur(s)`)
          }
        },
        error: () => {
          done++
          if (done >= total) {
            this.saving = false
            this.toastService.success('Permissions sauvegardées')
          }
        }
      })
    }
  }

  openCreateModal(): void {
    this.editForm = { nom: '', description: '' }
    this.showCreateModal = true
  }

  closeCreateModal(): void {
    this.showCreateModal = false
  }

  createRole(): void {
    if (!this.editForm.nom) return
    this.saving = true
    this.roleService.createRole(this.editForm).subscribe({
      next: () => {
        this.saving = false
        this.closeCreateModal()
        this.loadRoles()
        this.toastService.success('Rôle créé')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur')
      }
    })
  }

  openEditModal(role: any): void {
    this.editForm = { nom: role.nom, description: role.description }
    this.showEditModal = true
  }

  closeEditModal(): void {
    this.showEditModal = false
  }

  updateRole(): void {
    if (!this.editForm.nom || !this.selectedRole) return
    this.saving = true
    this.roleService.updateRole(this.selectedRole.id, this.editForm).subscribe({
      next: () => {
        this.saving = false
        this.closeEditModal()
        this.loadRoles()
        this.toastService.success('Rôle modifié')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur')
      }
    })
  }

  openDeleteModal(role: any): void {
    this.selectedRole = role
    this.showDeleteModal = true
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false
  }

  deleteRole(): void {
    if (!this.selectedRole) return
    this.saving = true
    this.roleService.deleteRole(this.selectedRole.id).subscribe({
      next: () => {
        this.saving = false
        this.closeDeleteModal()
        this.selectedRole = null
        this.loadRoles()
        this.toastService.success('Rôle supprimé')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur')
      }
    })
  }

  openAssignUserModal(): void {
    this.showAssignUserModal = true
  }

  closeAssignUserModal(): void {
    this.showAssignUserModal = false
  }

  assignUser(user: any): void {
    if (!this.selectedRole) return
    this.roleService.assignRoleToUser(this.selectedRole.id, user.id).subscribe({
      next: () => {
        // Appliquer les permissions du rôle au nouvel utilisateur
        this.roleService.appliquerRolePermissions(this.selectedRole.id, user.id).subscribe({
          next: () => {
            this.loadRoleUsers()
            this.toastService.success('Utilisateur assigné et permissions appliquées')
          },
          error: () => {
            this.loadRoleUsers()
            this.toastService.success('Utilisateur assigné au rôle')
          }
        })
      },
      error: () => this.toastService.error('Erreur')
    })
  }

  removeUser(userId: string): void {
    if (!this.selectedRole) return
    this.roleService.removeRoleFromUser(this.selectedRole.id, userId).subscribe({
      next: () => {
        this.loadRoleUsers()
        this.toastService.success('Utilisateur retiré du rôle')
      },
      error: () => this.toastService.error('Erreur')
    })
  }

  appliquerPermissions(userId: string): void {
    if (!this.selectedRole) return
    this.roleService.appliquerRolePermissions(this.selectedRole.id, userId).subscribe({
      next: () => {
        this.toastService.success('Permissions appliquées à l\'utilisateur')
      },
      error: () => this.toastService.error('Erreur')
    })
  }

  get usersWithoutRole(): any[] {
    const assignedIds = new Set(this.roleUsers.map((ru: any) => ru.utilisateurId))
    return this.allUsers.filter((u: any) => !assignedIds.has(u.id))
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : []
  }
}

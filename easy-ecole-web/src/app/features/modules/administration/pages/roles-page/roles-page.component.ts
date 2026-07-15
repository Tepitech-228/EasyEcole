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
  selectedRole: any = null
  permissionsGrouped: any = {}
  rolePermissionIds: Set<number> = new Set()
  roleUsers: any[] = []
  allUsers: any[] = []
  loading: boolean = false
  activeTab: 'permissions' | 'utilisateurs' = 'permissions'

  showRoleModal: boolean = false
  editingRole: any = null
  roleForm: any = { nom: '', description: '' }
  saving: boolean = false

  showDeleteRoleModal: boolean = false

  showAssignUserModal: boolean = false
  assignSearch: string = ''

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private utilisateurService: UtilisateurService,
    private toastService: ToastService,
  ) { super() }

  ngOnInit(): void {
    this.loadRoles()
    this.loadPermissions()
  }

  loadRoles(): void {
    this.loading = true
    this.roleService.getAllRoles().subscribe({
      next: (res) => {
        this.roles = Array.isArray(res) ? res : []
        if (this.selectedRole) {
          const stillExists = this.roles.find(r => r.id == this.selectedRole.id)
          if (stillExists) {
            this.selectedRole = stillExists
            this.loadRolePermissions()
            this.loadRoleUsers()
          } else {
            this.selectedRole = null
            this.rolePermissionIds = new Set()
            this.roleUsers = []
          }
        }
        this.loading = false
      },
      error: () => {
        this.loading = false
        this.toastService.error('Erreur lors du chargement des rôles')
      }
    })
  }

  loadPermissions(): void {
    this.permissionService.getAllPermissions().subscribe({
      next: (res) => {
        this.permissionsGrouped = res || {}
      },
      error: () => {}
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
      next: (res: any[]) => {
        this.rolePermissionIds = new Set((res || []).map((p: any) => Number(p.id)))
      },
      error: () => {}
    })
  }

  loadRoleUsers(): void {
    if (!this.selectedRole) return
    this.roleService.getRoleUtilisateurs(this.selectedRole.id).subscribe({
      next: (res: any[]) => {
        this.roleUsers = Array.isArray(res) ? res : []
      },
      error: () => {}
    })
  }

  hasPermission(permId: number): boolean {
    return this.rolePermissionIds.has(Number(permId))
  }

  togglePermission(permId: number, checked: boolean): void {
    if (checked) {
      this.rolePermissionIds.add(Number(permId))
    } else {
      this.rolePermissionIds.delete(Number(permId))
    }
  }

  toggleModule(module: string, checked: boolean): void {
    const perms = this.permissionsGrouped[module] || []
    for (const p of perms) {
      if (checked) {
        this.rolePermissionIds.add(Number(p.id))
      } else {
        this.rolePermissionIds.delete(Number(p.id))
      }
    }
  }

  isModuleFullyChecked(module: string): boolean {
    const perms = this.permissionsGrouped[module] || []
    return perms.length > 0 && perms.every((p: any) => this.rolePermissionIds.has(Number(p.id)))
  }

  isModulePartiallyChecked(module: string): boolean {
    const perms = this.permissionsGrouped[module] || []
    const checked = perms.filter((p: any) => this.rolePermissionIds.has(Number(p.id)))
    return checked.length > 0 && checked.length < perms.length
  }

  saveRolePermissions(): void {
    if (!this.selectedRole) return
    this.saving = true

    const permIds: number[] = []
    for (const module in this.permissionsGrouped) {
      for (const p of this.permissionsGrouped[module]) {
        if (this.rolePermissionIds.has(Number(p.id))) {
          permIds.push(Number(p.id))
        }
      }
    }

    this.roleService.updateRolePermissions(this.selectedRole.id, { permissionIds: permIds }).subscribe({
      next: () => {
        this.saving = false
        this.toastService.success('Permissions du rôle enregistrées')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur lors de l\'enregistrement')
      }
    })
  }

  openAddRoleModal(): void {
    this.editingRole = null
    this.roleForm = { nom: '', description: '' }
    this.showRoleModal = true
  }

  openEditRoleModal(): void {
    if (!this.selectedRole) return
    this.editingRole = this.selectedRole
    this.roleForm = { nom: this.selectedRole.nom, description: this.selectedRole.description || '' }
    this.showRoleModal = true
  }

  closeRoleModal(): void {
    this.showRoleModal = false
    this.editingRole = null
    this.roleForm = { nom: '', description: '' }
  }

  saveRole(): void {
    if (!this.roleForm.nom) {
      this.toastService.error('Le nom du rôle est requis')
      return
    }
    this.saving = true

    const obs = this.editingRole
      ? this.roleService.updateRole(this.editingRole.id, this.roleForm)
      : this.roleService.createRole(this.roleForm)

    obs.subscribe({
      next: () => {
        this.saving = false
        this.closeRoleModal()
        this.loadRoles()
        this.toastService.success(this.editingRole ? 'Rôle modifié' : 'Rôle créé')
      },
      error: (err) => {
        this.saving = false
        this.toastService.error(err.error?.message || 'Erreur lors de l\'enregistrement')
      }
    })
  }

  confirmDeleteRole(): void {
    this.showDeleteRoleModal = true
  }

  closeDeleteRoleModal(): void {
    this.showDeleteRoleModal = false
  }

  deleteRole(): void {
    if (!this.selectedRole) return
    this.saving = true
    this.roleService.deleteRole(this.selectedRole.id).subscribe({
      next: () => {
        this.saving = false
        this.showDeleteRoleModal = false
        this.selectedRole = null
        this.rolePermissionIds = new Set()
        this.roleUsers = []
        this.loadRoles()
        this.toastService.success('Rôle supprimé')
      },
      error: () => {
        this.saving = false
        this.toastService.error('Erreur lors de la suppression')
      }
    })
  }

  openAssignUserModal(): void {
    this.assignSearch = ''
    this.loadAllUsers()
    this.showAssignUserModal = true
  }

  closeAssignUserModal(): void {
    this.showAssignUserModal = false
  }

  loadAllUsers(): void {
    this.utilisateurService.getAll().subscribe({
      next: (res) => {
        this.allUsers = Array.isArray(res) ? res : []
      },
      error: () => {}
    })
  }

  get availableUsers(): any[] {
    const assignedIds = new Set(this.roleUsers.map((u: any) => u.id))
    return this.allUsers.filter((u: any) => !assignedIds.has(u.id)).filter((u: any) => {
      if (!this.assignSearch) return true
      const term = this.assignSearch.toLowerCase()
      return (u.nom || '').toLowerCase().includes(term) ||
        (u.prenoms || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.identifiant || '').toLowerCase().includes(term)
    })
  }

  assignUser(user: any): void {
    if (!this.selectedRole) return
    this.roleService.assignRoleToUser(this.selectedRole.id, user.id).subscribe({
      next: () => {
        this.loadRoleUsers()
        this.toastService.success(`${user.nom} ${user.prenoms} ajouté au rôle`)
      },
      error: () => {
        this.toastService.error('Erreur lors de l\'assignation')
      }
    })
  }

  removeUser(userId: string): void {
    if (!this.selectedRole) return
    this.roleService.removeRoleFromUser(this.selectedRole.id, userId).subscribe({
      next: () => {
        this.loadRoleUsers()
        this.toastService.success('Utilisateur retiré du rôle')
      },
      error: () => {
        this.toastService.error('Erreur lors du retrait')
      }
    })
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : []
  }
}

import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RoleService } from 'src/app/data/modules/auth/services/role.service';
import { MenuGroup, MenuItem, MenuPole, MenuService } from 'src/app/core/services/menu.service';
import { ToastService } from 'src/app/core/services/toast.service';

type NodeState = 'none' | 'partial' | 'all';

@Component({
  selector: 'app-poles-menus-page',
  templateUrl: './poles-menus-page.component.html',
  styleUrls: ['./poles-menus-page.component.scss']
})
export class PolesMenusPageComponent extends BaseComponentClass implements OnInit {
  roles: any[] = []
  poles: MenuPole[] = []
  selectedRole: any = null

  loadingRoles: boolean = false
  loadingMenu: boolean = false
  loadingGrants: boolean = false
  saving: boolean = false
  searchTerm: string = ''
  errorMessage: string = ''

  grantedKeys: Set<string> = new Set()
  inheritedKeys: Set<string> = new Set()
  initialGrantedKeys: Set<string> = new Set()

  constructor(
    private roleService: RoleService,
    private menuService: MenuService,
    private toastService: ToastService,
  ) { super() }

  ngOnInit(): void {
    this.loadRoles()
    this.loadMenu()
  }

  loadRoles(): void {
    this.loadingRoles = true
    this.roleService.getAllRoles().subscribe({
      next: (res) => {
        this.roles = Array.isArray(res) ? res : []
        this.loadingRoles = false
      },
      error: () => {
        this.loadingRoles = false
        this.toastService.error('Erreur lors du chargement des profils')
      }
    })
  }

  loadMenu(): void {
    this.loadingMenu = true
    this.errorMessage = ''
    this.menuService.getMenuStructure().subscribe({
      next: (res) => {
        this.poles = Array.isArray(res) ? res : []
        this.loadingMenu = false
      },
      error: () => {
        this.loadingMenu = false
        this.errorMessage = 'Impossible de charger la structure du menu.'
      }
    })
  }

  selectRole(role: any): void {
    this.selectedRole = role
    this.searchTerm = ''
    this.grantedKeys = new Set()
    this.inheritedKeys = new Set()
    this.initialGrantedKeys = new Set()
    this.loadGrants()
  }

  loadGrants(): void {
    if (!this.selectedRole) return
    this.loadingGrants = true
    this.roleService.getRoleMenuGrants(this.selectedRole.id).subscribe({
      next: (res) => {
        this.grantedKeys = new Set(Array.isArray(res?.grantedKeys) ? res.grantedKeys : [])
        this.inheritedKeys = new Set(Array.isArray(res?.rolePermissionKeys) ? res.rolePermissionKeys : [])
        this.initialGrantedKeys = new Set(this.grantedKeys)
        this.loadingGrants = false
      },
      error: () => {
        this.loadingGrants = false
        this.toastService.error('Erreur lors du chargement des pôles du profil')
      }
    })
  }

  isGrantableItem(item: MenuItem, group: MenuGroup): boolean {
    return Boolean(item.permissionKey) && !item.roleRestricted && !group.roleRestricted
  }

  groupKeys(group: MenuGroup): string[] {
    if (group.roleRestricted) return []
    return group.items
      .filter(item => this.isGrantableItem(item, group))
      .map(item => item.permissionKey as string)
  }

  poleKeys(pole: MenuPole): string[] {
    return pole.groups.reduce<string[]>((keys, group) => keys.concat(this.groupKeys(group)), [])
  }

  itemKeys(item: MenuItem, group: MenuGroup): string[] {
    return this.isGrantableItem(item, group) ? [item.permissionKey as string] : []
  }

  isInherited(key?: string): boolean {
    return !!key && this.inheritedKeys.has(key)
  }

  isGranted(key?: string): boolean {
    return !!key && this.grantedKeys.has(key)
  }

  isCovered(key?: string): boolean {
    return !!key && (this.inheritedKeys.has(key) || this.grantedKeys.has(key))
  }

  stateFor(keys: string[]): NodeState {
    if (keys.length === 0) return 'none'
    const covered = keys.filter(key => this.isCovered(key)).length
    if (covered === 0) return 'none'
    if (covered === keys.length) return 'all'
    return 'partial'
  }

  isNodeFullyInherited(keys: string[]): boolean {
    return keys.length > 0 && keys.every(key => this.inheritedKeys.has(key))
  }

  toggleKeys(keys: string[], checked: boolean): void {
    if (!this.selectedRole || keys.length === 0) return
    const next = new Set(this.grantedKeys)
    for (const key of keys) {
      if (checked) {
        if (!this.inheritedKeys.has(key)) next.add(key)
      } else {
        next.delete(key)
      }
    }
    this.grantedKeys = next
  }

  togglePole(pole: MenuPole, checked: boolean): void {
    this.toggleKeys(this.poleKeys(pole), checked)
  }

  toggleGroup(group: MenuGroup, checked: boolean): void {
    this.toggleKeys(this.groupKeys(group), checked)
  }

  toggleItem(item: MenuItem, group: MenuGroup, checked: boolean): void {
    this.toggleKeys(this.itemKeys(item, group), checked)
  }

  get dirty(): boolean {
    if (this.grantedKeys.size !== this.initialGrantedKeys.size) return true
    for (const key of this.grantedKeys) {
      if (!this.initialGrantedKeys.has(key)) return true
    }
    return false
  }

  get grantedCount(): number {
    return this.grantedKeys.size
  }

  get totalGrantable(): number {
    return this.poles.reduce((total, pole) => total + this.poleKeys(pole).length, 0)
  }

  get inheritedCount(): number {
    return this.inheritedKeys.size
  }

  get filteredPoles(): MenuPole[] {
    const term = this.searchTerm.trim().toLowerCase()
    if (!term) return this.poles

    return this.poles.reduce<MenuPole[]>((poles, pole) => {
      const poleMatch = pole.label.toLowerCase().includes(term)
      const groups = pole.groups.reduce<MenuGroup[]>((acc, group) => {
        const groupMatch = group.label.toLowerCase().includes(term)
        if (poleMatch || groupMatch) {
          acc.push(group)
          return acc
        }
        const items = group.items.filter(item =>
          item.label.toLowerCase().includes(term) ||
          (item.permissionKey || '').toLowerCase().includes(term) ||
          item.route.toLowerCase().includes(term)
        )
        if (items.length > 0) acc.push({ ...group, items })
        return acc
      }, [])
      if (groups.length > 0) poles.push({ ...pole, groups })
      return poles
    }, [])
  }

  countCoveredPole(pole: MenuPole): number {
    return this.poleKeys(pole).filter(key => this.isCovered(key)).length
  }

  countGrantedPole(pole: MenuPole): number {
    return this.poleKeys(pole).filter(key => this.isGranted(key)).length
  }

  countInheritedPole(pole: MenuPole): number {
    return this.poleKeys(pole).filter(key => this.isInherited(key)).length
  }

  resetChanges(): void {
    this.grantedKeys = new Set(this.initialGrantedKeys)
  }

  save(): void {
    if (!this.selectedRole || !this.dirty) return
    this.saving = true
    this.roleService.updateRoleMenuGrants(this.selectedRole.id, Array.from(this.grantedKeys)).subscribe({
      next: () => {
        this.saving = false
        this.initialGrantedKeys = new Set(this.grantedKeys)
        this.toastService.success('Pôles et menus du profil enregistrés')
      },
      error: (err) => {
        this.saving = false
        this.toastService.error(err.error?.message || 'Erreur lors de l’enregistrement')
      }
    })
  }
}

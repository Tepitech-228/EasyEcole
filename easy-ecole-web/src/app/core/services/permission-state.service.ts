import { Injectable } from '@angular/core';
import { PermissionService } from 'src/app/data/modules/auth/services/permission.service';
import { BaseComponentClass } from '../base-component-class';

@Injectable({
  providedIn: 'root'
})
export class PermissionStateService {

  private permissionKeys: Set<string> = new Set()
  private loaded: boolean = false
  private configured: boolean = false

  constructor(private permissionService: PermissionService) {}

  loadPermissions(): void {
    if (this.loaded) return

    this.permissionService.getMesPermissions().subscribe({
      next: (res) => {
        if (res?.configured && res?.permissions && Array.isArray(res.permissions)) {
          this.permissionKeys = new Set(res.permissions)
          this.configured = true
        } else {
          this.configured = !!res?.configured
        }
        this.loaded = true
      },
      error: () => {
        this.loaded = true
      }
    })
  }

  hasPermission(key: string): boolean {
    if (!this.loaded) return true
    if (!this.configured) return true
    return this.permissionKeys.has(key)
  }

  isLoading(): boolean {
    return !this.loaded
  }

  reset(): void {
    this.permissionKeys = new Set()
    this.loaded = false
    this.configured = false
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { PermissionService } from 'src/app/data/modules/auth/services/permission.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionStateService {

  private permissionKeys: Set<string> = new Set()
  private loaded: boolean = false
  private loading: boolean = false
  private configured: boolean = false
  private readonly loadedSubject = new BehaviorSubject<boolean>(false)
  readonly permissionsLoaded$ = this.loadedSubject.asObservable()

  constructor(private permissionService: PermissionService) {}

  loadPermissions(): void {
    if (this.loaded || this.loading) return
    this.loading = true

    this.permissionService.getMesPermissions().subscribe({
      next: (res) => {
        this.permissionKeys = new Set(Array.isArray(res?.permissions) ? res.permissions : [])
        this.configured = res?.configured === true
        this.loaded = true
        this.loading = false
        this.loadedSubject.next(true)
      },
      error: () => {
        this.permissionKeys.clear()
        this.configured = true
        this.loaded = true
        this.loading = false
        this.loadedSubject.next(true)
      }
    })
  }

  ensureLoaded(): Observable<void> {
    this.loadPermissions()
    if (this.loaded) return of(undefined)
    return this.loadedSubject.pipe(
      filter(loaded => loaded),
      take(1),
      map(() => undefined)
    )
  }

  hasPermission(key: string): boolean {
    if (!this.loaded || !this.configured) return false
    return this.permissionKeys.has(key)
  }

  isLoading(): boolean {
    return !this.loaded
  }

  reset(): void {
    this.permissionKeys = new Set()
    this.loaded = false
    this.loading = false
    this.configured = false
    this.loadedSubject.next(false)
  }
}

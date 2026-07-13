import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { PermissionStateService } from '../services/permission-state.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate, CanLoad {

  constructor(
    private permissionState: PermissionStateService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkPermission(route)
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const permission = route.data?.['permission']
    if (!permission) return true

    if (!this.permissionState.hasPermission(permission)) {
      return this.router.parseUrl('/')
    }
    return true
  }

  private checkPermission(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const permission = route.data?.['permission']
    if (!permission) return true

    if (!this.permissionState.hasPermission(permission)) {
      return this.router.parseUrl('/')
    }
    return true
  }
}

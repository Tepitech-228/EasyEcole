import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
    return this.checkPermission(route.data?.['permission'])
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this.checkPermission(route.data?.['permission'])
  }

  private checkPermission(permission?: string): boolean | UrlTree | Observable<boolean | UrlTree> {
    if (!permission) return true
    return this.permissionState.ensureLoaded().pipe(
      map(() => this.permissionState.hasPermission(permission) ? true : this.router.parseUrl('/')),
      catchError(() => of(this.router.parseUrl('/')))
    )
  }
}

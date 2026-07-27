import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({ providedIn: 'root' })
export class ParentGuard implements CanActivateChild {
  constructor(
    private localStorageService: LocalStorageService,
    private router: Router
  ) {}

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
    if (!token) return this.router.createUrlTree(['/auth/connexion']);

    const userStr = this.localStorageService.get(LocalStorageService.USER_DATA);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.role === 'parent') return true;
      } catch {}
    }

    return this.router.createUrlTree(['/']);
  }
}

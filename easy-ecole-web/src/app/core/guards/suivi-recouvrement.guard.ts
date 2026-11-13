import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import * as JwtDecode from 'jwt-decode';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SuiviRecouvrementGuard implements CanActivate {
  constructor(
    private localStorageService: LocalStorageService,
    private router: Router
  ) { }

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
    if (!token) return this.router.parseUrl('/auth/connexion');

    try {
      const decoded = JwtDecode.default(token) as { role?: string };
      const role = decoded?.role;
      if (role === RolesUtilisateur.SUPERVISEUR_GENERAL || role === RolesUtilisateur.ADMIN) {
        return true;
      }
      return this.router.parseUrl('/');
    } catch {
      return this.router.parseUrl('/');
    }
  }
}

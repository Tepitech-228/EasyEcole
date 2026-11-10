import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SuperviseurGeneralGuard implements CanActivate {
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
      const parts = token.split('.');
      if (parts.length !== 3) return this.router.parseUrl('/');
      const decoded = JSON.parse(atob(parts[1]));
      return decoded?.role === RolesUtilisateur.SUPERVISEUR_GENERAL
        ? true
        : this.router.parseUrl('/');
    } catch {
      return this.router.parseUrl('/');
    }
  }
}

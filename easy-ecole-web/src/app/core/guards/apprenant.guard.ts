import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';
import { LocalStorageService } from '../services/local-storage.service';

/**
 * Guard réutilisable : n'autorise l'accès à la route que pour le rôle APPRENANT (étudiant).
 * Les autres rôles sont redirigés vers le tableau de bord.
 *
 * Ne modifie PAS le comportement d'InscriptionCompleteGuard : ce guard est purement
 * un contrôle de rôle, à déclarer via `canActivate` sur les routes réservées aux étudiants.
 *
 * Usage : { path: '...', component: ..., canActivate: [ApprenantGuard] }
 */
@Injectable({
  providedIn: 'root'
})
export class ApprenantGuard implements CanActivate {

  constructor(
    private localStorageService: LocalStorageService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
    if (!token) {
      return this.router.parseUrl('/auth/connexion');
    }

    const decoded = this.decodeToken(token);
    if (decoded?.role === RolesUtilisateur.APPRENANT) {
      return true;
    }

    return this.router.parseUrl('/');
  }

  private decodeToken(token: string): { role?: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}
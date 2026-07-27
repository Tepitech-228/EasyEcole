import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../services/local-storage.service';
import { ToastService } from '../services/toast.service';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';

@Injectable({
  providedIn: 'root'
})
export class InscriptionCompleteGuard implements CanActivate, CanLoad {

  private readonly API_URL = environment.API_MODULES.INSCRIPTION;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService,
    private toastService: ToastService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.check();
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.check();
  }

  private check(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const token = this.localStorageService.get(LocalStorageService.AUTH_TOKEN);
    if (!token) {
      return this.router.navigate(['/auth/connexion']);
    }

    const decoded = this.decodeToken(token);
    const role = decoded?.role;

    if (role !== RolesUtilisateur.APPRENANT) {
      return true;
    }

    return this.http.get<any>(`${this.API_URL}/dossiers/mon-dossier`).pipe(
      map(response => {
        if (response?.statut === 'actif') {
          return true;
        }
        this.toastService.error('Vous devez finaliser votre inscription pour accéder à cette page.');
        return false;
      })
    );
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Utilisateur } from '../models/Utilisateur.model';
import { Router } from '@angular/router';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { Enseignant } from '../models/Enseignant.model';

export interface SiteUtilisateur {
  id: number;
  nom: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}`

  constructor(
    private localStorageService: LocalStorageService,
    private router: Router,
    private httpClient: HttpClient) { }

  login(utilisateur: Utilisateur): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/login`, utilisateur)
  }

  getSitesMoi(): Observable<SiteUtilisateur[]> {
    return this.httpClient.get<SiteUtilisateur[]>(`${this.SERVICE_URL}/utilisateurs/moi/sites`);
  }

  definirSiteActif(etablissementId: number): Observable<{ accessToken: string; etablissementId: number }> {
    return this.httpClient.post<{ accessToken: string; etablissementId: number }>(
      `${this.SERVICE_URL}/utilisateurs/moi/site-actif`,
      { etablissementId }
    );
  }

  register(utilisateur: Utilisateur): Observable<any> {
    const redirectTo: string = window.location.origin + '/auth/confirmation-email'
    let queryParams: HttpParams = new HttpParams()
    queryParams = queryParams.append("redirectTo", redirectTo)
    return this.httpClient.post(`${this.SERVICE_URL}/register`, utilisateur, { params: queryParams })
  }

  registerEnseignant(enseignant: Enseignant): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/register/enseignant`, enseignant)
  }

  updateProfile(id: string, photo: File): Observable<Utilisateur> {
    let formData: FormData = new FormData()
      formData.append('photo', photo, photo.name)
    return this.httpClient.put<Utilisateur>(`${this.SERVICE_URL}`, formData)
  }

  resetPassword(data: { oldPassword: string, password: string }): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/reset`, data)
  }

  sendEmailConfirmLink(): Observable<any> {
    const redirectTo = window.location.origin + '/auth/confirmation-email'
    const params = new HttpParams().set('redirectTo', redirectTo)
    return this.httpClient.get(`${this.SERVICE_URL}/send-email-confirm-link`, { params })
  }

  confirmEmail(token: string): Observable<any> {
    const params = new HttpParams().set('token', token)
    return this.httpClient.post(`${this.SERVICE_URL}/confirm`, {}, { params })
  }

  sendPasswordResetLink(email: string): Observable<any> {
    const redirectTo = window.location.origin + '/auth/reinitialisation-mot-de-passe'
    const params = new HttpParams().set('email', email).set('redirectTo', redirectTo)
    return this.httpClient.get(`${this.SERVICE_URL}/send-password-reset-link`, { params })
  }

  resetPasswordWithToken(token: string, motDePasse: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/reset-password`, { token, motDePasse })
  }

  verifyOtp(email: string, code: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/verify-otp`, { email, code })
  }

  resendOtp(email: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/resend-otp`, { email })
  }

  logout(): void {
    this.httpClient.post(`${this.SERVICE_URL}/logout`, {}).subscribe({
      complete: () => {
        this.localStorageService.remove(LocalStorageService.AUTH_TOKEN);
        this.router.navigateByUrl("/auth/connexion");
      },
      error: () => {
        this.localStorageService.remove(LocalStorageService.AUTH_TOKEN);
        this.router.navigateByUrl("/auth/connexion");
      }
    });
  }
}

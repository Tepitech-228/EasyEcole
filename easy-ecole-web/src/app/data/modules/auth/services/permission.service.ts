import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/permissions`

  constructor(private httpClient: HttpClient) { }

  getAllPermissions(): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}`)
  }

  getAllPermissionsFlat(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/flat`)
  }

  getUtilisateurPermissions(utilisateurId: string): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/utilisateur/${utilisateurId}`)
  }

  updateUtilisateurPermissions(utilisateurId: string, data: any): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/utilisateur/${utilisateurId}`, data)
  }

  copyPermissions(utilisateurId: string, fromUtilisateurId: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/utilisateur/${utilisateurId}/copy-from/${fromUtilisateurId}`, {})
  }

  checkPermission(key: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/check`, { key })
  }

  getMesPermissions(): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/mes-permissions`)
  }
}

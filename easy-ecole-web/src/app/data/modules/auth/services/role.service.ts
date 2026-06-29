import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/roles`

  constructor(private httpClient: HttpClient) { }

  getAllRoles(): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}`)
  }

  getRole(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}`)
  }

  createRole(data: any): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}`, data)
  }

  updateRole(id: string, data: any): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/${id}`, data)
  }

  deleteRole(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  getRolePermissions(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/permissions`)
  }

  updateRolePermissions(id: string, data: any): Observable<any> {
    return this.httpClient.put(`${this.SERVICE_URL}/${id}/permissions`, data)
  }

  getRoleUtilisateurs(id: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/${id}/utilisateurs`)
  }

  assignRoleToUser(id: string, utilisateurId: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/utilisateurs`, { utilisateurId })
  }

  removeRoleFromUser(id: string, utilisateurId: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}/utilisateurs/${utilisateurId}`)
  }

  getUtilisateurRoles(utilisateurId: string): Observable<any> {
    return this.httpClient.get(`${this.SERVICE_URL}/utilisateurs/${utilisateurId}`)
  }

  appliquerRolePermissions(id: string, utilisateurId: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/${id}/appliquer/${utilisateurId}`, {})
  }
}

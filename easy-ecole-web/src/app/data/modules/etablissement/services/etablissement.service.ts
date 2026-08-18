import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Etablissement } from '../models/Etablissement.model';

/**
 * Service d'accès à l'identité de l'établissement (`/api/v1/etablissements`).
 *
 * Contrat backend (EtablissementController) :
 *  - GET `/etablissements` → tableau (le non-admin ne voit que SON établissement)
 *  - GET `/etablissements/:id` → objet unique
 *  - POST `/etablissements`    → création (réservé admin)
 *  - PUT `/etablissements/:id` → mise à jour
 *  - DELETE `/etablissements/:id` → suppression (réservé admin)
 *
 * Cache léger partagé : le premier appel déclenche le chargement, les
 * appels suivants consomment le BehaviorSubject (fallback `null` en cas
 * d'API vide ou d'erreur).
 */
@Injectable({
  providedIn: 'root'
})
export class EtablissementService {

  private readonly SERVICE_URL: string = `${environment.API_URL}/etablissements`

  private readonly etablissementSubject = new BehaviorSubject<Etablissement | null>(null)
  private etablissementLoaded = false

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<Etablissement[]> {
    return this.httpClient.get<Etablissement[]>(this.SERVICE_URL)
  }

  get(id: string): Observable<Etablissement> {
    return this.httpClient.get<Etablissement>(`${this.SERVICE_URL}/${id}`)
  }

  create(etablissement: Etablissement): Observable<Etablissement> {
    return this.httpClient.post<Etablissement>(this.SERVICE_URL, etablissement)
  }

  update(etablissement: Etablissement): Observable<Etablissement> {
    return this.httpClient.put<Etablissement>(`${this.SERVICE_URL}/${etablissement.id}`, etablissement)
  }

  delete(id: string): Observable<any> {
    return this.httpClient.delete(`${this.SERVICE_URL}/${id}`)
  }

  /** Valeur synchrone courante (null tant que le premier chargement n'est pas terminé). */
  get etablissement(): Etablissement | null {
    if (!this.etablissementLoaded) {
      this.reload()
    }
    return this.etablissementSubject.getValue()
  }

  /**
   * Retourne l'établissement courant (premier du tableau renvoyé par l'API,
   * qui n'expose que l'établissement de l'utilisateur connecté pour les non-admin).
   */
  getEtablissement(): Observable<Etablissement | null> {
    if (!this.etablissementLoaded) {
      this.reload()
    }
    return this.etablissementSubject.asObservable()
  }

  /** Recharge (ou force le rechargement) de l'établissement courant. */
  reload(): void {
    this.etablissementLoaded = true
    this.getAll().subscribe({
      next: (items) => {
        this.etablissementSubject.next(items && items.length > 0 ? items[0] : null)
      },
      error: () => {
        this.etablissementSubject.next(null)
      }
    })
  }
}

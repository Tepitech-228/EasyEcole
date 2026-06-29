import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Compte, JournalComptable, EcritureComptable } from '../models/Comptabilite.model';

@Injectable({
  providedIn: 'root'
})
export class ComptabiliteService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.COMPTABILITE}`

  constructor(private httpClient: HttpClient) { }

  // COMPTES
  getAllComptes(): Observable<Compte[]> {
    return this.httpClient.get<Compte[]>(`${this.SERVICE_URL}/comptes`)
  }

  getComptesByClasse(classe: string): Observable<Compte[]> {
    return this.httpClient.get<Compte[]>(`${this.SERVICE_URL}/comptes/classe/${classe}`)
  }

  getCompte(id: string): Observable<Compte> {
    return this.httpClient.get<Compte>(`${this.SERVICE_URL}/comptes/${id}`)
  }

  createCompte(compte: Compte): Observable<Compte> {
    return this.httpClient.post<Compte>(`${this.SERVICE_URL}/comptes`, compte)
  }

  // JOURNAUX
  getAllJournaux(): Observable<JournalComptable[]> {
    return this.httpClient.get<JournalComptable[]>(`${this.SERVICE_URL}/journaux`)
  }

  getJournal(id: string): Observable<JournalComptable> {
    return this.httpClient.get<JournalComptable>(`${this.SERVICE_URL}/journaux/${id}`)
  }

  createJournal(journal: JournalComptable): Observable<JournalComptable> {
    return this.httpClient.post<JournalComptable>(`${this.SERVICE_URL}/journaux`, journal)
  }

  // ÉCRITURES
  getAllEcritures(params?: any): Observable<EcritureComptable[]> {
    return this.httpClient.get<EcritureComptable[]>(`${this.SERVICE_URL}/ecritures`, { params })
  }

  getEcriture(id: string): Observable<EcritureComptable> {
    return this.httpClient.get<EcritureComptable>(`${this.SERVICE_URL}/ecritures/${id}`)
  }

  createEcriture(ecriture: EcritureComptable): Observable<EcritureComptable> {
    return this.httpClient.post<EcritureComptable>(`${this.SERVICE_URL}/ecritures`, ecriture)
  }

  validerEcriture(id: string): Observable<EcritureComptable> {
    return this.httpClient.put<EcritureComptable>(`${this.SERVICE_URL}/ecritures/${id}/valider`, {})
  }

  // GRAND LIVRE
  getGrandLivre(compteId: string): Observable<any> {
    return this.httpClient.get<any>(`${this.SERVICE_URL}/ecritures/grand-livre/${compteId}`)
  }

  // BALANCE
  getBalance(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.SERVICE_URL}/ecritures/balance/all`)
  }
}

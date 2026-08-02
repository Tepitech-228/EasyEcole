import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Compte, JournalComptable, EcritureComptable, ExerciceComptable, BilanResponse, CompteResultatResponse } from '../models/Comptabilite.model';

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

  // EXERCICES COMPTABLES
  private currentExerciceSubject = new BehaviorSubject<ExerciceComptable | null>(null);
  currentExercice$ = this.currentExerciceSubject.asObservable();

  setCurrentExercice(exercice: ExerciceComptable | null): void {
    this.currentExerciceSubject.next(exercice);
  }

  getAllExercices(): Observable<ExerciceComptable[]> {
    return this.httpClient.get<ExerciceComptable[]>(`${this.SERVICE_URL}/exercices`)
  }

  getExerciceEnCours(): Observable<ExerciceComptable> {
    return this.httpClient.get<ExerciceComptable>(`${this.SERVICE_URL}/exercices/en-cours`)
  }

  getExercice(id: number): Observable<ExerciceComptable> {
    return this.httpClient.get<ExerciceComptable>(`${this.SERVICE_URL}/exercices/${id}`)
  }

  createExercice(data: Partial<ExerciceComptable>): Observable<ExerciceComptable> {
    return this.httpClient.post<ExerciceComptable>(`${this.SERVICE_URL}/exercices`, data)
  }

  updateExercice(id: number, data: Partial<ExerciceComptable>): Observable<ExerciceComptable> {
    return this.httpClient.put<ExerciceComptable>(`${this.SERVICE_URL}/exercices/${id}`, data)
  }

  // ÉTATS FINANCIERS
  getBilan(dateArrete?: string, exerciceId?: number): Observable<BilanResponse> {
    let params = new HttpParams();
    if (dateArrete) params = params.set('dateArrete', dateArrete);
    if (exerciceId) params = params.set('exerciceId', exerciceId);
    return this.httpClient.get<BilanResponse>(`${this.SERVICE_URL}/etats-financiers/bilan`, { params });
  }

  getCompteResultat(dateDebut?: string, dateFin?: string, exerciceId?: number): Observable<CompteResultatResponse> {
    let params = new HttpParams();
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);
    if (exerciceId) params = params.set('exerciceId', exerciceId);
    return this.httpClient.get<CompteResultatResponse>(`${this.SERVICE_URL}/etats-financiers/compte-resultat`, { params });
  }

  exportBilan(format: 'pdf' | 'xlsx' = 'pdf', dateArrete?: string, exerciceId?: number): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('format', format);
    if (dateArrete) params = params.set('dateArrete', dateArrete);
    if (exerciceId) params = params.set('exerciceId', exerciceId);
    return this.httpClient.get(`${this.SERVICE_URL}/etats-financiers/bilan/export`, {
      params,
      responseType: 'blob'
    });
  }

  exportCompteResultat(format: 'pdf' | 'xlsx' = 'pdf', dateDebut?: string, dateFin?: string, exerciceId?: number): Observable<Blob> {
    let params = new HttpParams();
    params = params.set('format', format);
    if (dateDebut) params = params.set('dateDebut', dateDebut);
    if (dateFin) params = params.set('dateFin', dateFin);
    if (exerciceId) params = params.set('exerciceId', exerciceId);
    return this.httpClient.get(`${this.SERVICE_URL}/etats-financiers/compte-resultat/export`, {
      params,
      responseType: 'blob'
    });
  }
}

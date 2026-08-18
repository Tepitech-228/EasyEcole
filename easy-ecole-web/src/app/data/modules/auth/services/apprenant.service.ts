import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Apprenant } from '../models/Apprenant.model';

@Injectable({
  providedIn: 'root'
})
export class ApprenantService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/apprenants`

  constructor(private httpClient: HttpClient) { }

  get(id?: string): Observable<Apprenant> {
    return this.httpClient.get<Apprenant>(`${this.SERVICE_URL}/${id}`)
  }

  update(apprenant: any): Observable<any> {
    return this.httpClient.put<any>(`${this.SERVICE_URL}/`, apprenant)
  }

  getAll(): Observable<Apprenant[]> {
    return this.httpClient.get<Apprenant[]>(`${this.SERVICE_URL}`)
  }

  getCount(): Observable<{ success: boolean, count: number }> {
    return this.httpClient.get<{ success: boolean, count: number }>(`${this.SERVICE_URL}/statistics/count`)
  }

  generateQrCodes(apprenantId?: string): Observable<any> {
    return this.httpClient.post(`${this.SERVICE_URL}/qr-codes/generate`, { apprenantId })
  }

  getQrCodeBlob(fileName: string): Observable<Blob> {
    return this.httpClient.get(`${this.SERVICE_URL}/qr-codes/${fileName}`, {
      responseType: 'blob'
    });
  }

  updatePhoto(photo: File, apprenantId?: number): Observable<any> {
    let formData: FormData = new FormData()
    formData.append('photo', photo, photo.name)

    const url = apprenantId
      ? `${this.SERVICE_URL}/photo/${apprenantId}`
      : `${this.SERVICE_URL}/photo`

    return this.httpClient.put<any>(url, formData)
  }
}
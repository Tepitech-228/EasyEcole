import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PersonnelAdministratif } from '../models/PersonnelAdministratif.model';

@Injectable({
  providedIn: 'root'
})
export class PersonnelAdministratifService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.AUTH}/personnelAdministratif`

  constructor(private httpClient: HttpClient) { }

  getAll(): Observable<PersonnelAdministratif[]> {
    return this.httpClient.get<PersonnelAdministratif[]>(`${this.SERVICE_URL}`)
  }

  get(id?: string): Observable<PersonnelAdministratif> {
    return this.httpClient.get<PersonnelAdministratif>(`${this.SERVICE_URL}/${id}`)
  }

  update(personnel: PersonnelAdministratif): Observable<PersonnelAdministratif> {
    return this.httpClient.put<PersonnelAdministratif>(`${this.SERVICE_URL}/`, personnel)
  }

  updatePhoto(photo: File, personnelId?: string): Observable<any> {
    let formData: FormData = new FormData()
    formData.append('photo', photo, photo.name)

    const url = personnelId
      ? `${this.SERVICE_URL}/photo/${personnelId}`
      : `${this.SERVICE_URL}/photo`

    return this.httpClient.put<any>(url, formData)
  }
}

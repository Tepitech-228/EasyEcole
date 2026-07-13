import { Injectable } from '@angular/core';
import { DeboucheParcours } from '../models/DeboucheParcours.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeboucheParcoursService {

  private readonly SERVICE_URL: string = `${environment.API_MODULES.ORIENTATION}/debouchesParcours`

  constructor(private httpClient: HttpClient) { }

  create(deboucheParcours: DeboucheParcours, video: File | undefined = undefined): Observable<DeboucheParcours> {
    let formData = new FormData()
    if (deboucheParcours.titre) {
      formData.append('titre', deboucheParcours.titre)
    }

    if (deboucheParcours.description) {
      formData.append('description', deboucheParcours.description)
    }

    if (video != undefined) {
      if(video)
        formData.append('video', video, video.name)
    }
    else if(deboucheParcours.video) {
      formData.append('video', deboucheParcours.video)
    }
    
    if (deboucheParcours.parcoursId) {
      formData.append('parcoursId', deboucheParcours.parcoursId)
    }

    return this.httpClient.post<DeboucheParcours>(`${this.SERVICE_URL}`, formData)
  }
}

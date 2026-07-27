import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService implements HttpInterceptor {

  constructor(private injector: Injector) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const localStorageService = this.injector.get(LocalStorageService)

    // 1. Récupérer le token JWT
    const token = localStorageService.get(LocalStorageService.AUTH_TOKEN)

    // 2. Cloner la requête et ajouter le header Authorization si le token existe
    let apiReq = req
    if (token) {
      apiReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    }

    // 3. Logging en mode développement
    if (!environment.production) {
      console.log(`[TokenInterceptor] ➜ ${apiReq.method} ${apiReq.url}`)
    }

    return next.handle(apiReq)
  }

}

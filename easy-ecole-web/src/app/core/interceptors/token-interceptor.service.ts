import { HttpClient, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService implements HttpInterceptor {

  constructor(private injector: Injector) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let localStorageService = this.injector.get(LocalStorageService)
    const token = localStorageService.get(LocalStorageService.AUTH_TOKEN)
    if(token != null) {
      let request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })

      return next.handle(request)
    }
    
    return next.handle(req)
  }

}

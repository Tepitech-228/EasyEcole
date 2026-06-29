import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { HttpLoaderService } from "../services/http-loader.service";
import { ToastService } from "../services/toast.service";

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

@Injectable({
  providedIn: 'root'
})
export class ProgressInterceptorService implements HttpInterceptor {

  constructor(
    private httpLoaderService: HttpLoaderService,
    private toastService: ToastService,
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.httpLoaderService.show()

    return next.handle(req).pipe(
      tap((event) => {
        if (MUTATION_METHODS.includes(req.method) && event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
          this.toastService.success('Opération effectuée avec succès')
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (MUTATION_METHODS.includes(req.method)) {
          const message = error.error?.message || error.message || 'Une erreur est survenue'
          this.toastService.error(message)
        }
        throw error
      }),
      finalize(() => {
        this.httpLoaderService.hide()
      })
    )
  }
}

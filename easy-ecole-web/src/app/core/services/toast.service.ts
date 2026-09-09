import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number
  type: 'success' | 'warning' | 'error'
  message: string
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private toasts = new Subject<Toast>()
  toasts$ = this.toasts.asObservable()

  private counter = 0

  success(message: string): void {
    this.toasts.next({ id: ++this.counter, type: 'success', message })
  }

  error(message: string): void {
    this.toasts.next({ id: ++this.counter, type: 'error', message })
  }

  /** Notification d'avertissement (orange) — ex. accès refusé (403). */
  warning(message: string): void {
    this.toasts.next({ id: ++this.counter, type: 'warning', message })
  }

}

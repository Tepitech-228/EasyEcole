import { Injectable } from '@angular/core';
import { ErrorModalService } from './error-modal.service';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private errorModalService: ErrorModalService) { }

  success(message: string): void {
    this.errorModalService.showSuccess(message);
  }

  error(message: string, statusCode: number = 0): void {
    this.errorModalService.showError(message, [], statusCode, 'error');
  }

  /** Notification d'avertissement (orange) — ex. accès refusé (403). */
  warning(message: string, statusCode: number = 409): void {
    this.errorModalService.showWarning(message, [], statusCode);
  }

  /** Notification info (bleue) */
  info(message: string): void {
    this.errorModalService.showInfo(message);
  }

}

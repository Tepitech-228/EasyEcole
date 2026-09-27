import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ErrorModalService, ErrorModalEvent } from 'src/app/core/services/error-modal.service';

type ModalSize = 'simple' | 'scrollable';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss']
})
export class ErrorModalComponent implements OnInit, OnDestroy {

  /** Visibilité du modal */
  isVisible: boolean = false;
  /** Taille du modal selon le type d'erreur */
  modalSize: ModalSize = 'simple';

  /** Props du modal */
  title: string = '';
  message: string = '';
  details: string[] = [];
  statusCode: number = 0;
  showDetails: boolean = false;
  type: 'error' | 'warning' | 'info' = 'error';

  /** Texte du bouton de basculement détails */
  detailsToggleText: string = 'Voir détails';
  /** Texte du bouton de reconnexion (affiché pour 401) */
  showReconnectButton: boolean = false;

  private subscription!: Subscription;

  constructor(private errorModalService: ErrorModalService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.subscription = this.errorModalService.modalEvent$.subscribe({
      next: (event: ErrorModalEvent) => {
        this.open(event);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Ouvre le modal avec les données fournies par le service.
   * Détermine automatiquement la taille du modal (simple vs scrollable).
   */
  open(event: ErrorModalEvent): void {
    this.title = event.title;
    this.message = event.message;
    this.details = event.details || [];
    this.statusCode = event.statusCode || 0;
    this.type = event.type || 'error';
    this.showDetails = false;
    this.showReconnectButton = event.statusCode === 401;

    // Détermine la taille du modal :
    // - scrollable si details longs ou statusCode 500 ou liste d'erreurs
    // - simple sinon
    const hasLongDetails = this.details.length > 0 &&
      (this.details.some(d => d.length > 80) || this.details.length >= 3);
    const isServerError = this.statusCode >= 500;
    this.modalSize = (hasLongDetails || isServerError) ? 'scrollable' : 'simple';

    this.detailsToggleText = this.showDetails ? 'Masquer les détails' : 'Voir détails';
    this.isVisible = true;
  }

  /** Ferme le modal et réinitialise l'état */
  close(): void {
    this.isVisible = false;
    this.showDetails = false;
    this.title = '';
    this.message = '';
    this.details = [];
    this.statusCode = 0;
    this.type = 'error';
    this.showReconnectButton = false;
  }

  /** Bascule l'affichage des détails (simple ↔ scrollable) */
  toggleDetails(): void {
    this.showDetails = !this.showDetails;
    if (this.showDetails) {
      this.modalSize = 'scrollable';
    } else {
      this.modalSize = 'simple';
    }
    this.detailsToggleText = this.showDetails ? 'Masquer les détails' : 'Voir détails';
  }

  /** Émet l'événement de reconnexion vers le service */
  reconnect(): void {
    this.errorModalService.triggerReconnect();
    this.close();
  }

  /** Retourne les classes Tailwind pour la bordure gauche du modal selon le type d'erreur */
  get modalTypeClass(): string {
    switch (this.type) {
      case 'warning': return 'border-l-4 border-orange-500';
      case 'info': return 'border-l-4 border-cyan-500';
      default: return 'border-l-4 border-red-500';
    }
  }

  /** Retourne les classes Tailwind pour le conteneur de l'icône selon le type d'erreur */
  get iconTypeClass(): string {
    switch (this.type) {
      case 'warning': return 'bg-orange-50 text-orange-600';
      case 'info': return 'bg-cyan-50 text-cyan-600';
      default: return 'bg-red-50 text-red-600';
    }
  }

  /** Retourne les classes Tailwind pour les items de la liste de détails selon le type d'erreur */
  get detailItemClass(): string {
    switch (this.type) {
      case 'warning': return 'border-l-[3px] border-l-orange-500 bg-orange-50';
      case 'info': return 'border-l-[3px] border-l-cyan-500 bg-cyan-50';
      default: return 'border-l-[3px] border-l-red-500 bg-red-50';
    }
  }

  /** Retourne l'icône SVG sécurisée selon le type d'erreur */
  get typeIcon(): SafeHtml {
    switch (this.type) {
      case 'error':
        return this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>');
      case 'warning':
        return this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>');
      case 'info':
        return this.sanitizer.bypassSecurityTrustHtml('<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>');
      default:
        return '';
    }
  }
}

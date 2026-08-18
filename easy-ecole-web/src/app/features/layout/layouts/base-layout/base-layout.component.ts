import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { PanierParcoursChoisiService } from 'src/app/data/modules/orientation/services/panier-parcours-choisi.service';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';
import { PermissionStateService } from 'src/app/core/services/permission-state.service';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/data/modules/elearning/services/notification.service';
import { SseService } from 'src/app/data/services/sse.service';
import { NotificationSoundService } from 'src/app/data/services/notification-sound.service';
import { StatutPaiementService } from 'src/app/data/modules/inscription/services/statut-paiement.service';

@Component({
  selector: 'app-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss']
})
export class BaseLayoutComponent extends BaseComponentClass implements OnInit, OnDestroy {

  showMenu: boolean = false
  searchQuery: string = ''
  sidebarCollapsed: boolean = false
  hoverExpanded: boolean = false
  panierCount: number = 0
  showPanierModal: boolean = false
  showProfileDropdown: boolean = false
  showNotifDropdown: boolean = false
  nonLuesCount: number = 0
  notifications: any[] = []
  private notifSub: Subscription | null = null
  private notifCountSub: Subscription | null = null

  // Blocage paiement (apprenant / parent)
  paiementBloque: boolean = false
  statutPaiementMessage: string = ''
  echeancesEnRetard: number = 0
  montantRestant?: number
  private statutPaiementTimer: ReturnType<typeof setInterval> | null = null

  /** Routes de régularisation sur lesquelles le bandeau de blocage est masqué. */
  private readonly REGULARISATION_ROUTES: string[] = ['/inscription/paiements', '/inscription/bordereaux']

  readonly PROFILES_PATH: string = environment.MEDIAS_PATH.AUTH.PROFILES

  soundEnabled: boolean = true

  constructor(
    private panierParcoursChoisiService: PanierParcoursChoisiService,
    private authService: AuthService,
    private sidebarState: SidebarStateService,
    private permissionState: PermissionStateService,
    private notificationService: NotificationService,
    private sseService: SseService,
    private soundService: NotificationSoundService,
    private statutPaiementService: StatutPaiementService,
    private router: Router,
    private http: HttpClient) {
    super()
    this.soundEnabled = this.soundService.isEnabled
    if(this.rolesValue.isApprenant) {
      this.getPanierCount()
    }
    this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    this.sidebarState.setCollapsed(this.sidebarCollapsed)
  }

  ngOnInit(): void {
    this.permissionState.loadPermissions()
    this.startPolling()
    this.subscribeToSse()
    if (this.rolesValue.isApprenant || this.rolesValue.isParent) {
      this.refreshStatutPaiement()
      this.statutPaiementTimer = setInterval(() => this.refreshStatutPaiement(), 60000)
    }
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe()
    this.notifCountSub?.unsubscribe()
    if (this.statutPaiementTimer) {
      clearInterval(this.statutPaiementTimer)
      this.statutPaiementTimer = null
    }
  }

  /**
   * Interroge GET /inscription/paiement/statut (apprenant / parent).
   * Échoue gracieusement : tout statut absent ou erreur ⇒ pas de bandeau.
   */
  refreshStatutPaiement(): void {
    this.statutPaiementService.getStatut().subscribe({
      next: (statut) => {
        if (statut && statut.statut === 'rouge') {
          this.paiementBloque = true
          this.statutPaiementMessage = statut.message || ''
          this.echeancesEnRetard = statut.echeancesEnRetard ?? 0
          this.montantRestant = statut.montantRestant
        } else {
          this.paiementBloque = false
        }
      },
      error: () => {
        this.paiementBloque = false
      }
    })
  }

  /**
   * Le bandeau est affiché uniquement si le paiement est bloqué ET que l'utilisateur
   * n'est pas déjà sur une page de régularisation (paiements / bordereaux).
   * Aucun redirect forcé : la restriction d'accès est gérée côté serveur (menu filtré).
   */
  get showPaiementBandeau(): boolean {
    if (!this.paiementBloque) return false
    const url = this.router.url
    return !this.REGULARISATION_ROUTES.some(route => url.startsWith(route))
  }

  get bandeauMessage(): string {
    if (this.statutPaiementMessage) return this.statutPaiementMessage
    if (this.echeancesEnRetard > 0) {
      return `Paiement en retard — ${this.echeancesEnRetard} échéance(s). Vos accès sont limités jusqu'à régularisation.`
    }
    return 'Paiement en retard. Vos accès sont limités jusqu\'à régularisation.'
  }

  private subscribeToSse(): void {
    this.notifSub = this.sseService.notifications$.subscribe(notif => {
      this.notifications.unshift(notif)
      if (!notif.lu) {
        this.nonLuesCount++
        this.soundService.play(notif.type)
      }
    })
  }

  private startPolling(): void {
    if (!this.rolesValue.isEnseignant && !this.rolesValue.isApprenant && !this.rolesValue.isInstitution && !this.rolesValue.isAdmin) return;

    this.notificationService.getAll().subscribe({
      next: (data) => {
        this.notifications = data;
        this.nonLuesCount = data.filter(n => !n.lu).length;
      }
    });
  }

  marquerLu(id: number): void {
    this.notificationService.marquerLu(id).subscribe();
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.lu = true;
      this.nonLuesCount = Math.max(0, this.nonLuesCount - 1);
    }
  }

  toggleSound(): void {
    this.soundEnabled = this.soundService.toggle()
  }

  hasPermission(key: string): boolean {
    return this.permissionState.hasPermission(key)
  }

  private getPanierCount(): void {
    this.panierParcoursChoisiService.getCount()
      .subscribe({
        next: (res) => {
          this.panierCount = res.count
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  logout(): void {
    this.authService.logout()
  }

  openMenu() {
    this.showMenu = true
    this.showProfileDropdown = false
    this.showNotifDropdown = false
    this.showPanierModal = false
  }

  closeMenu(): void {
    this.showMenu = false
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed
    localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed))
    this.sidebarState.setCollapsed(this.sidebarCollapsed)
  }

  onSidebarEnter(): void {
    if (this.sidebarCollapsed) {
      this.hoverExpanded = true
      this.sidebarState.setCollapsed(false)
    }
  }

  onSidebarLeave(): void {
    if (this.sidebarCollapsed) {
      this.hoverExpanded = false
      this.sidebarState.setCollapsed(true)
    }
  }

  openModal() {
    this.showMenu = false
    this.showProfileDropdown = false
    this.showNotifDropdown = false
    this.showPanierModal = true
  }

  closeModal(): void {
    this.showPanierModal = false
  }

  get sidebarExpanded(): boolean {
    return this.hoverExpanded || !this.sidebarCollapsed
  }

}

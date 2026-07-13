import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { PanierParcoursChoisiService } from 'src/app/data/modules/orientation/services/panier-parcours-choisi.service';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';
import { PermissionStateService } from 'src/app/core/services/permission-state.service';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/data/modules/elearning/services/notification.service';
import { SseService } from 'src/app/data/services/sse.service';
import { NotificationSoundService } from 'src/app/data/services/notification-sound.service';

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
  rappelSalleNotif: { currentCours?: string; currentSalle?: string; nextCours?: string | null; nextSalle?: string | null; minutesRestantes?: number } | null = null
  nonLuesCount: number = 0
  notifications: any[] = []
  private notifSub: Subscription | null = null
  private rappelSub: Subscription | null = null
  private notifCountSub: Subscription | null = null

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
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe()
    this.rappelSub?.unsubscribe()
    this.notifCountSub?.unsubscribe()
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

    this.rappelSub = interval(60000).subscribe(() => {
      this.notificationService.getRappelSalle().subscribe({
        next: (res: any) => {
          if (res?.rappel) {
            this.rappelSalleNotif = res.rappel;
            this.soundService.play('rappel_salle')
            setTimeout(() => this.rappelSalleNotif = null, 35000);
          }
        }
      });
    });

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

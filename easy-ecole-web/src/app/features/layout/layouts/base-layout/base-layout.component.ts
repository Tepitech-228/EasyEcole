import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { AuthService } from 'src/app/data/modules/auth/services/auth.service';
import { PanierParcoursChoisiService } from 'src/app/data/modules/orientation/services/panier-parcours-choisi.service';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';
import { PermissionStateService } from 'src/app/core/services/permission-state.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss']
})
export class BaseLayoutComponent extends BaseComponentClass implements OnInit {

  showMenu: boolean = false
  searchQuery: string = ''
  sidebarCollapsed: boolean = false
  hoverExpanded: boolean = false
  panierCount: number = 0
  showPanierModal: boolean = false
  showProfileDropdown: boolean = false
  showNotifDropdown: boolean = false
  enseignantNotif: { coursLibelle?: string; salle?: string; heureDebut?: string; heureFin?: string } | null = null
  private notifSub: Subscription | null = null

  readonly PROFILES_PATH: string = environment.MEDIAS_PATH.AUTH.PROFILES

  constructor(
    private panierParcoursChoisiService: PanierParcoursChoisiService,
    private authService: AuthService,
    private sidebarState: SidebarStateService,
    private permissionState: PermissionStateService,
    private http: HttpClient) {
    super()
    if(this.rolesValue.isApprenant) {
      this.getPanierCount()
    }
    this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
    this.sidebarState.setCollapsed(this.sidebarCollapsed)
  }

  ngOnInit(): void {
    this.permissionState.loadPermissions()
    this.startEnseignantPolling()
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe()
  }

  private startEnseignantPolling(): void {
    if (!this.rolesValue.isEnseignant && !this.rolesValue.isInstitution && !this.rolesValue.isAdmin) return;
    this.notifSub = interval(60000).subscribe(() => {
      this.http.get(`${environment.API_URL}/inscription/rattrapages/enseignant/prochain-cours`).subscribe({
        next: (res: any) => {
          if (res?.prochainCours) {
            this.enseignantNotif = res.prochainCours;
            setTimeout(() => this.enseignantNotif = null, 30000);
          }
        }
      });
    });
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

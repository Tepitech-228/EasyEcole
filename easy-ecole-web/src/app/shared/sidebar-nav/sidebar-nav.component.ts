import { Component, Input, OnInit } from '@angular/core';
import { MenuService, MenuPole, MenuGroup } from 'src/app/core/services/menu.service';
import { AuthService, SiteUtilisateur } from 'src/app/data/modules/auth/services/auth.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';
import { JwtTokenService } from 'src/app/core/services/jwt-token.service';

@Component({
  selector: 'app-sidebar-nav',
  templateUrl: './sidebar-nav.component.html',
  styleUrls: ['./sidebar-nav.component.scss']
})
export class SidebarNavComponent implements OnInit {
  @Input() searchQuery: string = '';
  @Input() closeMenu: () => void = () => {};

  poles: MenuPole[] = [];
  activePoleLabel: string | null = null;
  openGroupLabel: string | null = null;
  mosaicOpen = false;
  openItemLabel: string | null = null;

  loading: boolean = true;
  sites: SiteUtilisateur[] = [];
  siteActifId: number | null = null;
  siteLoading = false;
  siteError = '';


  private poleColors: Record<string, string> = {
    'Pedagogique': '#2563EB',
    'Financier': '#10B981',
    'Ressources Humaines': '#8B5CF6',
    'Communication & Collaboration': '#F59E0B',
    'Archivages Numeriques': '#92400E',
    'E-Learning': '#14B8A6',
    'Administration & Systeme': '#64748B',
    'Gestion documentaire': '#0891B2',
    'Espace Parents': '#EC4899',
    'Qualite': '#84CC16',
  };

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getPoleColor(poleLabel: string): string {
    return this.poleColors[poleLabel] || '#2563EB';
  }

  getPoleBg(poleLabel: string): string {
    return this.hexToRgba(this.getPoleColor(poleLabel), 0.15);
  }

  getPoleBgActive(poleLabel: string): string {
    return this.hexToRgba(this.getPoleColor(poleLabel), 0.30);
  }

  get activePoleColor(): string {
    return this.getPoleColor(this.activePoleLabel || '');
  }

  get activePoleColorLight(): string {
    return this.hexToRgba(this.activePoleColor, 0.25);
  }

  constructor(
    private menuService: MenuService,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private jwtTokenService: JwtTokenService
  ) {}

  ngOnInit(): void {
    this.menuService.getMenu().subscribe(poles => {
      this.poles = poles;
      this.loading = false;
      if (poles.length > 0) {
        this.activePoleLabel = poles[0].label;
      }
    });
    this.authService.getSitesMoi().subscribe({
      next: sites => {
        this.sites = sites;
        const token = this.localStorage.get(LocalStorageService.AUTH_TOKEN);
        if (token) {
          this.jwtTokenService.setToken(token);
          const tokenData = this.jwtTokenService.getDecodeToken() as { etablissementId?: string | number };
          const tokenSiteId = Number(tokenData?.etablissementId);
          this.siteActifId = sites.some(site => Number(site.id) === tokenSiteId)
            ? tokenSiteId
            : null;
        }
        if (!this.siteActifId && sites.length === 1) {
          this.activerSite(sites[0].id);
        }
      },
      error: () => {
        this.siteError = 'Les sites disponibles n’ont pas pu être chargés.';
      }
    });
  }

  changerSite(event: Event): void {
    const etablissementId = Number((event.target as HTMLSelectElement).value);
    if (!Number.isSafeInteger(etablissementId) || etablissementId <= 0 || etablissementId === this.siteActifId) return;
    this.activerSite(etablissementId);
  }

  private activerSite(etablissementId: number): void {
    this.siteLoading = true;
    this.siteError = '';
    this.authService.definirSiteActif(etablissementId).subscribe({
      next: response => {
        if (!response.accessToken) {
          this.siteError = 'Le serveur n’a pas renvoyé de jeton pour ce site.';
          this.siteLoading = false;
          return;
        }
        this.localStorage.set(LocalStorageService.AUTH_TOKEN, response.accessToken);
        window.location.reload();
      },
      error: () => {
        this.siteError = 'Le site actif n’a pas pu être modifié.';
        this.siteLoading = false;
      }
    });
  }

  get activePole(): MenuPole | null {
    return this.poles.find(p => p.label === this.activePoleLabel) || null;
  }

  toggleMosaic(): void {
    this.mosaicOpen = !this.mosaicOpen;
  }





  selectPole(poleId: string): void {
    this.activePoleLabel = poleId;
    this.openGroupLabel = null;
    this.openItemLabel = null;
    this.mosaicOpen = false;
  }



  toggleGroup(label: string): void {
    this.openGroupLabel = this.openGroupLabel === label ? null : label;
  }

  isGroupOpen(label: string): boolean {
    return this.openGroupLabel === label;
  }

  get activeGroups(): MenuGroup[] {
    const pole = this.poles.find(p => p.label === this.activePoleLabel);
    return pole ? pole.groups : [];
  }

  itemVisible(item: { label: string }): boolean {
    if (!this.searchQuery) return true;
    const q = this.searchQuery.toLowerCase();
    return item.label.toLowerCase().includes(q);
  }

  groupVisible(group: MenuGroup): boolean {
    if (!this.searchQuery) return true;
    const q = this.searchQuery.toLowerCase();
    if (group.label.toLowerCase().includes(q)) return true;
    return group.items.some(item => item.label.toLowerCase().includes(q));
  }

  onItemClick(): void {
    this.closeMenu();
  }
}

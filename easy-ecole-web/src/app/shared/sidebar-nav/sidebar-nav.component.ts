import { Component, Input, OnInit } from '@angular/core';
import { MenuService, MenuPole, MenuGroup } from 'src/app/core/services/menu.service';

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


  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.menuService.getMenu().subscribe(poles => {
      this.poles = poles;
      this.loading = false;
      if (poles.length > 0) {
        this.activePoleLabel = poles[0].label;
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

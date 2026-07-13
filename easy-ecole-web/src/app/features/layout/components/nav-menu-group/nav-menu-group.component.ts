import { Component, Input, OnInit, OnDestroy, ContentChildren, QueryList } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';
import { NavMenuItemComponent } from 'src/app/features/layout/components/nav-menu-item/nav-menu-item.component';

@Component({
  selector: 'app-nav-menu-group',
  templateUrl: './nav-menu-group.component.html',
  styleUrls: ['./nav-menu-group.component.scss']
})
export class NavMenuGroupComponent implements OnInit, OnDestroy {

  @Input() showTitle: boolean = true
  @Input() title?: string
  @Input() icon?: string
  @Input() startExpanded: boolean = true
  @Input() isSubGroup: boolean = false
  @Input() searchQuery: string = ''

  @ContentChildren(NavMenuItemComponent, { descendants: true }) menuItems!: QueryList<NavMenuItemComponent>

  collapsed: boolean = false
  expanded: boolean = true
  private sub!: Subscription

  get visible(): boolean {
    if (!this.searchQuery) return true
    if (this.title?.toLowerCase().includes(this.searchQuery.toLowerCase())) return true
    return this.menuItems?.some(item =>
      item.text?.toLowerCase().includes(this.searchQuery.toLowerCase())
    ) ?? false
  }

  get isExpanded(): boolean {
    if (this.searchQuery) return true
    return this.expanded
  }

  constructor(private sidebarState: SidebarStateService) { }

  ngOnInit(): void {
    this.expanded = this.startExpanded
    this.sub = this.sidebarState.collapsed$.subscribe(val => {
      this.collapsed = val
    })
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe()
    }
  }

  toggle(): void {
    if (!this.collapsed) {
      this.expanded = !this.expanded
    }
  }

}

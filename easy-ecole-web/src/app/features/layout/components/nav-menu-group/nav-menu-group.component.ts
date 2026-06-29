import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';

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

  collapsed: boolean = false
  expanded: boolean = true
  private sub!: Subscription

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

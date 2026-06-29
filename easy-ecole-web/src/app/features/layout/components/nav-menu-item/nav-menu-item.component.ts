import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarStateService } from 'src/app/features/layout/services/sidebar-state.service';

@Component({
  selector: 'app-nav-menu-item',
  templateUrl: './nav-menu-item.component.html',
  styleUrls: ['./nav-menu-item.component.scss']
})
export class NavMenuItemComponent implements OnInit, OnDestroy {

  @Input() isActive: boolean = false
  @Input() icon!: string
  @Input() text!: string
  @Input() link?: string

  collapsed: boolean = false
  showTooltip: boolean = false
  tooltipTop: number = 0
  private tooltipTimeout: any
  private sub!: Subscription

  constructor(private sidebarState: SidebarStateService) { }

  ngOnInit(): void {
    this.sub = this.sidebarState.collapsed$.subscribe(val => {
      this.collapsed = val
      if (!val) {
        this.showTooltip = false
      }
    })
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe()
    }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout)
    }
  }

  onMouseEnter(event: MouseEvent): void {
    if (this.collapsed) {
      const target = event.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      this.tooltipTop = rect.top + rect.height / 2
      this.tooltipTimeout = setTimeout(() => {
        this.showTooltip = true
      }, 300)
    }
  }

  onMouseLeave(): void {
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout)
      this.tooltipTimeout = null
    }
    this.showTooltip = false
  }

}

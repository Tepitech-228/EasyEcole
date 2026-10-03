import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionStateService } from '../services/permission-state.service';

@Directive({
  selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnInit, OnDestroy {

  private permissionKey!: string
  private isHidden: boolean = true
  private permissionsSubscription?: Subscription

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionState: PermissionStateService
  ) {}

  @Input() set appHasPermission(key: string) {
    this.permissionKey = key
    this.updateView()
  }

  ngOnInit(): void {
    this.permissionState.loadPermissions()
    this.permissionsSubscription = this.permissionState.permissionsLoaded$.subscribe(() => this.updateView())
  }

  ngOnDestroy(): void {
    this.permissionsSubscription?.unsubscribe()
  }

  private updateView(): void {
    const hasPerm = !this.permissionState.isLoading() && this.permissionState.hasPermission(this.permissionKey)
    if (hasPerm && this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef)
      this.isHidden = false
    } else if (!hasPerm && !this.isHidden) {
      this.viewContainer.clear()
      this.isHidden = true
    }
  }
}

import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionStateService } from '../services/permission-state.service';

@Directive({
  selector: '[appHasPermission]'
})
export class HasPermissionDirective implements OnInit {

  private permissionKey!: string
  private isHidden: boolean = true

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionState: PermissionStateService
  ) {}

  @Input() set appHasPermission(key: string) {
    this.permissionKey = key
    if (this.permissionState.isLoading()) {
      this.viewContainer.createEmbeddedView(this.templateRef)
      this.isHidden = false
    } else {
      this.updateView()
    }
  }

  ngOnInit(): void {
    this.updateView()
  }

  private updateView(): void {
    const hasPerm = this.permissionState.hasPermission(this.permissionKey)
    if (hasPerm && this.isHidden) {
      this.viewContainer.createEmbeddedView(this.templateRef)
      this.isHidden = false
    } else if (!hasPerm && !this.isHidden) {
      this.viewContainer.clear()
      this.isHidden = true
    }
  }
}

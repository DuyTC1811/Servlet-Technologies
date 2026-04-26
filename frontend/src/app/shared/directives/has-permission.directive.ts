import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  private permission = '';

  @Input() set appHasPermission(permission: string) {
    this.permission = permission;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    this.viewContainer.clear();
    if (this.authService.hasPermission(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

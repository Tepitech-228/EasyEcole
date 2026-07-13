import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseLayoutComponent } from './layouts/base-layout/base-layout.component';
import { NavMenuItemComponent } from './components/nav-menu-item/nav-menu-item.component';
import { RouterModule } from '@angular/router';
import { CustomSvgIconComponent } from './components/custom-svg-icon/custom-svg-icon.component';
import { NavMenuGroupComponent } from './components/nav-menu-group/nav-menu-group.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PanierParcoursComponent } from './components/panier-parcours/panier-parcours.component';



@NgModule({
  declarations: [
    BaseLayoutComponent,
    NavMenuItemComponent,
    CustomSvgIconComponent,
    NavMenuGroupComponent,
    PanierParcoursComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    BaseLayoutComponent,
  ]
})
export class LayoutModule { }

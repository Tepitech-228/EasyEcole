import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BourseRoutingModule } from './bourse-routing.module';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { ConfigurationsPageComponent } from './pages/configurations-page/configurations-page.component';
import { AttributionsPageComponent } from './pages/attributions-page/attributions-page.component';
import { CampagnePageComponent } from './pages/campagne-page/campagne-page.component';

@NgModule({
  declarations: [
    ConfigurationsPageComponent,
    AttributionsPageComponent,
    CampagnePageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    BourseRoutingModule
  ]
})
export class BourseModule { }

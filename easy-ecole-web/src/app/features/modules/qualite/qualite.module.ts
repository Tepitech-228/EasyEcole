import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QualiteRoutingModule } from './qualite-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NonConformitesPageComponent } from './pages/non-conformites-page/non-conformites-page.component';
import { AuditsPageComponent } from './pages/audits-page/audits-page.component';
import { RevuesDirectionPageComponent } from './pages/revues-direction-page/revues-direction-page.component';
import { EnquetesSatisfactionPageComponent } from './pages/enquetes-satisfaction-page/enquetes-satisfaction-page.component';

@NgModule({
  declarations: [
    NonConformitesPageComponent,
    AuditsPageComponent,
    RevuesDirectionPageComponent,
    EnquetesSatisfactionPageComponent,
  ],
  imports: [
    CommonModule,
    QualiteRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class QualiteModule { }

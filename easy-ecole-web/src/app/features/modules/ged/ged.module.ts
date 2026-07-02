import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GedRoutingModule } from './ged-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { GedPageComponent } from './pages/ged-page/ged-page.component';

@NgModule({
  declarations: [
    GedPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    GedRoutingModule
  ]
})
export class GedModule { }

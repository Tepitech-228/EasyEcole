import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PoleElearningRoutingModule } from './pole-elearning-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { PoleElearningHomeComponent } from './pages/pole-elearning-home/pole-elearning-home.component';

@NgModule({
  declarations: [
    PoleElearningHomeComponent,
  ],
  imports: [
    CommonModule,
    PoleElearningRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class PoleElearningModule { }

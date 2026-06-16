import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BulletinsRoutingModule } from './bulletins-routing.module';
import { ListeBulletinsPageComponent } from './pages/liste-bulletins-page/liste-bulletins-page.component';
import { GenererBulletinsPageComponent } from './pages/generer-bulletins-page/generer-bulletins-page.component';
import { DetailBulletinPageComponent } from './pages/detail-bulletin-page/detail-bulletin-page.component';
import { MonRelevePageComponent } from './pages/mon-releve-page/mon-releve-page.component';

@NgModule({
  declarations: [
    ListeBulletinsPageComponent,
    GenererBulletinsPageComponent,
    DetailBulletinPageComponent,
    MonRelevePageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    BulletinsRoutingModule
  ]
})
export class BulletinsModule {}

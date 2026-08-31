import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Module central d'activation Angular Material pour les nouveaux
 * composants « modern-ui » (dashboards).
 *
 * Regroupe UNIQUEMENT les Mat modules réellement utiles aux interfaces
 * de dashboard (cartes, boutons, icônes, progressions, menus, chips)
 * afin de limiter l'empreinte du bundle. Angular Material est déjà
 * installé (^12.2.13) mais n'était pas activé dans le code applicatif.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatToolbarModule,
    MatMenuModule,
  ],
  exports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatToolbarModule,
    MatMenuModule,
  ],
})
export class MaterialModule { }

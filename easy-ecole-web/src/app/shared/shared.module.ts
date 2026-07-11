import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from "@angular/common/http";
import { VgCoreModule } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
import { FormInputComponent } from './components/form-input/form-input.component';
import { CustomButtonComponent } from './components/custom-button/custom-button.component';
import { CustomModalComponent } from './components/custom-modal/custom-modal.component';
import { CustomAlertComponent } from './components/custom-alert/custom-alert.component';
import { FormMessageComponent } from './components/form-message/form-message.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';
import { CustomFilePickerComponent } from './components/custom-file-picker/custom-file-picker.component';
import { ReturnBackComponent } from './components/return-back/return-back.component';
import { CustomBadgeComponent } from './components/custom-badge/custom-badge.component';
import { HeaderTitleComponent } from './components/header-title/header-title.component';
import { AjoutPrerequisComponent } from './components/ajout-prerequis/ajout-prerequis.component';
import { DetailsSectionComponent } from './components/details-section/details-section.component';
import { CustomWizardComponent } from './components/custom-wizard/custom-wizard.component';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { CustomPdfViewerComponent } from './components/custom-pdf-viewer/custom-pdf-viewer.component';
import { CoursCardComponent } from './components/cours-card/cours-card.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ListePresenceCardComponent } from './components/liste-presence-card/liste-presence-card.component';
import { CahierDeTexteCardComponent } from './components/cahier-de-texte-card/cahier-de-texte-card.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';

@NgModule({
  declarations: [
    FormInputComponent,
    CustomButtonComponent,
    CustomModalComponent,
    CustomAlertComponent,
    FormMessageComponent,
    VideoPlayerComponent,
    CustomFilePickerComponent,
    ReturnBackComponent,
    CustomBadgeComponent,
    HeaderTitleComponent,
    AjoutPrerequisComponent,
    DetailsSectionComponent,
    CustomWizardComponent,
    CustomPdfViewerComponent,
    CoursCardComponent,
    ListePresenceCardComponent,
    CahierDeTexteCardComponent,
    LoadingSpinnerComponent,
    ToastContainerComponent,
    SidebarNavComponent,

    // Pipes
    SafeUrlPipe,

    // Directives
    HasPermissionDirective,
  ],
  imports: [
    // Modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    NgSelectModule,
  ],
  exports: [
    // Modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
    NgSelectModule,

    // Components
    FormInputComponent,
    CustomButtonComponent,
    CustomModalComponent,
    CustomAlertComponent,
    FormMessageComponent,
    VideoPlayerComponent,
    CustomFilePickerComponent,
    ReturnBackComponent,
    CustomBadgeComponent,
    HeaderTitleComponent,
    AjoutPrerequisComponent,
    DetailsSectionComponent,
    CustomWizardComponent,
    CustomPdfViewerComponent,
    CoursCardComponent,
    ListePresenceCardComponent,
    CahierDeTexteCardComponent,
    LoadingSpinnerComponent,
    ToastContainerComponent,
    SidebarNavComponent,

    // Pipes
    SafeUrlPipe,

    // Directives
    HasPermissionDirective,
  ]
})
export class SharedModule { }

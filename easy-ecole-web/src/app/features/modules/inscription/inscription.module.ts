import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InscriptionRoutingModule } from './inscription-routing.module';
import { MonCursusPageComponent } from './pages/mon-cursus-page/mon-cursus-page.component';
import { PaiementsPageComponent } from './pages/paiements-page/paiements-page.component';
import { ListeCoursPageComponent } from './pages/liste-cours-page/liste-cours-page.component';
import { ListeParcoursPageComponent } from './pages/liste-parcours-page/liste-parcours-page.component';
import { ListeDemandesPageComponent } from './pages/liste-demandes-page/liste-demandes-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DetailsParcoursPageComponent } from './pages/details-parcours-page/details-parcours-page.component';
import { ListeSessionsPageComponent } from './pages/liste-sessions-page/liste-sessions-page.component';
import { DetailsSessionPageComponent } from './pages/details-session-page/details-session-page.component';
import { NouveauParcoursPageComponent } from './pages/nouveau-parcours-page/nouveau-parcours-page.component';
import { DetailsDemandePageComponent } from './pages/details-demande-page/details-demande-page.component';
import { InfosSectionComponent } from './pages/details-demande-page/infos-section/infos-section.component';
import { ChoixParcoursSectionComponent } from './pages/details-demande-page/choix-parcours-section/choix-parcours-section.component';
import { CoursSectionComponent } from './pages/details-demande-page/cours-section/cours-section.component';
import { PaiementsSectionComponent } from './pages/details-demande-page/paiements-section/paiements-section.component';
import { ValidationSectionComponent } from './pages/details-demande-page/validation-section/validation-section.component';
import { ChoixParcoursPageComponent } from './pages/choix-parcours-page/choix-parcours-page.component';
import { DocumentsSectionComponent } from './pages/details-demande-page/documents-section/documents-section.component';
import { BordereauxPageComponent } from './pages/bordereaux-page/bordereaux-page.component';
import { ValidationBordereauxPageComponent } from './pages/validation-bordereaux-page/validation-bordereaux-page.component';
import { MonDossierPageComponent } from './pages/mon-dossier-page/mon-dossier-page.component';
import { GestionEcheancesPageComponent } from './pages/gestion-echeances-page/gestion-echeances-page.component';
import { FormsModule } from '@angular/forms';
import { ComiteOrientationPageComponent } from './pages/comite-orientation-page/comite-orientation-page.component';
import { ComiteDetailsPageComponent } from './pages/comite-details-page/comite-details-page.component';
import { PreInscriptionSectionComponent } from './pages/details-demande-page/pre-inscription-section/pre-inscription-section.component';
import { ChoixCoursPageComponent } from './pages/choix-cours-page/choix-cours-page.component';
import { ListeDossiersPageComponent } from './pages/liste-dossiers-page/liste-dossiers-page.component';
import { ListeFraisParcoursPageComponent } from './pages/liste-frais-parcours-page/liste-frais-parcours-page.component';
import { HierarchyPageComponent } from './pages/hierarchy/hierarchy-page.component';
import { HierarchyDossiersPageComponent } from './pages/hierarchy-dossiers-page/hierarchy-dossiers-page.component';
import { ListeEffectifsPageComponent } from './pages/liste-effectifs-page/liste-effectifs-page.component';
import { SuiviUePageComponent } from './pages/suivi-ue-page/suivi-ue-page.component';
import { ListeSallesDeClassePageComponent } from './pages/liste-salles-de-classe-page/liste-salles-de-classe-page.component';
import { OnboardingPageComponent } from './pages/onboarding-page/onboarding-page.component';
import { ListeClassesPageComponent } from './pages/liste-classes-page/liste-classes-page.component';
import { CartesPageComponent } from './pages/cartes-page/cartes-page.component';
import { GestionSemestresPageComponent } from './pages/gestion-semestres-page/gestion-semestres-page.component';
import { ImportExportExcelPageComponent } from './pages/import-export-excel-page/import-export-excel-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { DesignationMemoirePageComponent } from './pages/designation-memoire-page/designation-memoire-page.component';
import { RattrapageSessionsPageComponent } from './pages/rattrapage-sessions-page/rattrapage-sessions-page.component';
import { RattrapageComitePageComponent } from './pages/rattrapage-comite-page/rattrapage-comite-page.component';
import { RattrapageMesDemandesPageComponent } from './pages/rattrapage-mes-demandes-page/rattrapage-mes-demandes-page.component';
import { RattrapagePaiementsPageComponent } from './pages/rattrapage-paiements-page/rattrapage-paiements-page.component';
@NgModule({
  declarations: [
    MonCursusPageComponent,
    PaiementsPageComponent,
    ListeCoursPageComponent,
    ListeParcoursPageComponent,
    DetailsParcoursPageComponent,
    NouveauParcoursPageComponent,
    ListeDemandesPageComponent,
    ListeSessionsPageComponent,
    DetailsSessionPageComponent,
    DetailsDemandePageComponent,
    InfosSectionComponent,
    ChoixParcoursSectionComponent,
    CoursSectionComponent,
    PaiementsSectionComponent,
    ValidationSectionComponent,
    ChoixParcoursPageComponent,
    DocumentsSectionComponent,
    BordereauxPageComponent,
    ValidationBordereauxPageComponent,
    MonDossierPageComponent,
    GestionEcheancesPageComponent,
    ComiteOrientationPageComponent,
    ComiteDetailsPageComponent,
    PreInscriptionSectionComponent,
      ChoixCoursPageComponent,
      ListeDossiersPageComponent,
      ListeFraisParcoursPageComponent,
     HierarchyPageComponent,
     HierarchyDossiersPageComponent,
     ListeEffectifsPageComponent,
     SuiviUePageComponent,
      ListeSallesDeClassePageComponent,
      ListeClassesPageComponent,
      OnboardingPageComponent,
       CartesPageComponent,
       GestionSemestresPageComponent,
       ImportExportExcelPageComponent,
       DesignationMemoirePageComponent,
       RattrapageSessionsPageComponent,
       RattrapageComitePageComponent,
       RattrapageMesDemandesPageComponent,
       RattrapagePaiementsPageComponent
  ],
  imports: [
    CommonModule,
    InscriptionRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class InscriptionModule { }

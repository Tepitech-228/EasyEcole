import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ChapitreCardComponent } from './chapitre-card.component';
import { ChapitreCours } from 'src/app/data/modules/inscription/models/ChapitreCours.model';

describe('ChapitreCardComponent', () => {
  let component: ChapitreCardComponent;
  let fixture: ComponentFixture<ChapitreCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChapitreCardComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapitreCardComponent);
    component = fixture.componentInstance;
    component.chapitre = new ChapitreCours();
    component.rolesValue = { isApprenant: false, isInstitution: false, isEnseignant: false, isCaissierBanque: false, isPersonnelAdministratif: false, isRessourcesHumaines: false, isCabinetComptable: false, isEsacompta: false, isComiteOrientation: false, isAdmin: false, isParent: false, isSurveillant: false };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

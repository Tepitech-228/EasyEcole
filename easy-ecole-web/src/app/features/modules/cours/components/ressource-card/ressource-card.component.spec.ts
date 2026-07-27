import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { RessourceCardComponent } from './ressource-card.component';
import { Ressource } from 'src/app/data/modules/inscription/models/Ressource.model';

describe('RessourceCardComponent', () => {
  let component: RessourceCardComponent;
  let fixture: ComponentFixture<RessourceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RessourceCardComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RessourceCardComponent);
    component = fixture.componentInstance;
    component.ressource = new Ressource();
    component.rolesValue = { isApprenant: false, isInstitution: false, isEnseignant: false, isCaissierBanque: false, isRessourcesHumaines: false, isCabinetComptable: false, isComiteOrientation: false, isAdmin: false, isParent: false };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

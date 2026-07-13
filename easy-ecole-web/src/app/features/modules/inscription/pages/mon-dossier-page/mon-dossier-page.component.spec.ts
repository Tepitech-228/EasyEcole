import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonDossierPageComponent } from './mon-dossier-page.component';

describe('MonDossierPageComponent', () => {
  let component: MonDossierPageComponent;
  let fixture: ComponentFixture<MonDossierPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonDossierPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonDossierPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

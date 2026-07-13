import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NouvelleRessourcePageComponent } from './nouvelle-ressource-page.component';

describe('NouvelleRessourcePageComponent', () => {
  let component: NouvelleRessourcePageComponent;
  let fixture: ComponentFixture<NouvelleRessourcePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NouvelleRessourcePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NouvelleRessourcePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitementDemandeComponent } from './traitement-demande.component';

describe('TraitementDemandeComponent', () => {
  let component: TraitementDemandeComponent;
  let fixture: ComponentFixture<TraitementDemandeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraitementDemandeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraitementDemandeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

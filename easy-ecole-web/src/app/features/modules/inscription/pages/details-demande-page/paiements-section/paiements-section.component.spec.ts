import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementsSectionComponent } from './paiements-section.component';

describe('PaiementsSectionComponent', () => {
  let component: PaiementsSectionComponent;
  let fixture: ComponentFixture<PaiementsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaiementsSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaiementsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaiementsPageComponent } from './paiements-page.component';

describe('PaiementsPageComponent', () => {
  let component: PaiementsPageComponent;
  let fixture: ComponentFixture<PaiementsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaiementsPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaiementsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

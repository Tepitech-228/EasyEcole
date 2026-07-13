import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanierParcoursComponent } from './panier-parcours.component';

describe('PanierParcoursComponent', () => {
  let component: PanierParcoursComponent;
  let fixture: ComponentFixture<PanierParcoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanierParcoursComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanierParcoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

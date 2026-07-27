import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PanierParcoursComponent } from './panier-parcours.component';

describe('PanierParcoursComponent', () => {
  let component: PanierParcoursComponent;
  let fixture: ComponentFixture<PanierParcoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PanierParcoursComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ]
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

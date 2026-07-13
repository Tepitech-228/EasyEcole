import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsParcoursPageComponent } from './details-parcours-page.component';

describe('DetailsParcoursPageComponent', () => {
  let component: DetailsParcoursPageComponent;
  let fixture: ComponentFixture<DetailsParcoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsParcoursPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsParcoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

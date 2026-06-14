import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixParcoursPageComponent } from './choix-parcours-page.component';

describe('ChoixParcoursPageComponent', () => {
  let component: ChoixParcoursPageComponent;
  let fixture: ComponentFixture<ChoixParcoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChoixParcoursPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChoixParcoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

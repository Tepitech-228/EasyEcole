import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeParcoursPageComponent } from './liste-parcours-page.component';

describe('ListeParcoursPageComponent', () => {
  let component: ListeParcoursPageComponent;
  let fixture: ComponentFixture<ListeParcoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeParcoursPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeParcoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

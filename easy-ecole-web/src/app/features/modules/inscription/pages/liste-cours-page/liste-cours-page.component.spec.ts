import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeCoursPageComponent } from './liste-cours-page.component';

describe('ListeCoursPageComponent', () => {
  let component: ListeCoursPageComponent;
  let fixture: ComponentFixture<ListeCoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeCoursPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeCoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

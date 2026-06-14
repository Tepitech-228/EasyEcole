import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeNotesPageComponent } from './liste-notes-page.component';

describe('ListeNotesPageComponent', () => {
  let component: ListeNotesPageComponent;
  let fixture: ComponentFixture<ListeNotesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeNotesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeNotesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

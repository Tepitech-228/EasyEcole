import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeEnseignantsPageComponent } from './liste-enseignants-page.component';

describe('ListeEnseignantsPageComponent', () => {
  let component: ListeEnseignantsPageComponent;
  let fixture: ComponentFixture<ListeEnseignantsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeEnseignantsPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeEnseignantsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

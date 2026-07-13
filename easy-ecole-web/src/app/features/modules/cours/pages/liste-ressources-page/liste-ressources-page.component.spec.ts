import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeRessourcesPageComponent } from './liste-ressources-page.component';

describe('ListeRessourcesPageComponent', () => {
  let component: ListeRessourcesPageComponent;
  let fixture: ComponentFixture<ListeRessourcesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeRessourcesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeRessourcesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

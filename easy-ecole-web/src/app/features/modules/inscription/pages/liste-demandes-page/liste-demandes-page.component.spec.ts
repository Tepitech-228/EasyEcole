import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeDemandesPageComponent } from './liste-demandes-page.component';

describe('ListeDemandesPageComponent', () => {
  let component: ListeDemandesPageComponent;
  let fixture: ComponentFixture<ListeDemandesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeDemandesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeDemandesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

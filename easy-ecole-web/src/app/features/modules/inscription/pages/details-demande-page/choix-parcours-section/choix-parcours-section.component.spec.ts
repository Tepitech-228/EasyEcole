import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixParcoursSectionComponent } from './choix-parcours-section.component';

describe('ChoixParcoursSectionComponent', () => {
  let component: ChoixParcoursSectionComponent;
  let fixture: ComponentFixture<ChoixParcoursSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChoixParcoursSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChoixParcoursSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

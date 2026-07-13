import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NouveauParcoursPageComponent } from './nouveau-parcours-page.component';

describe('NouveauParcoursPageComponent', () => {
  let component: NouveauParcoursPageComponent;
  let fixture: ComponentFixture<NouveauParcoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NouveauParcoursPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NouveauParcoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

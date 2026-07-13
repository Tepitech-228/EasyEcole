import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NouveauChapitrePageComponent } from './nouveau-chapitre-page.component';

describe('NouveauChapitrePageComponent', () => {
  let component: NouveauChapitrePageComponent;
  let fixture: ComponentFixture<NouveauChapitrePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NouveauChapitrePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NouveauChapitrePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

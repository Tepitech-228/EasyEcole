import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificationChapitrePageComponent } from './modification-chapitre-page.component';

describe('ModificationChapitrePageComponent', () => {
  let component: ModificationChapitrePageComponent;
  let fixture: ComponentFixture<ModificationChapitrePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificationChapitrePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificationChapitrePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

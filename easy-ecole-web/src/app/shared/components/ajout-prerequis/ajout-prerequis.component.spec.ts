import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutPrerequisComponent } from './ajout-prerequis.component';

describe('AjoutPrerequisComponent', () => {
  let component: AjoutPrerequisComponent;
  let fixture: ComponentFixture<AjoutPrerequisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutPrerequisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AjoutPrerequisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

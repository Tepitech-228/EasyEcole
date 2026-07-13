import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametresSectionComponent } from './parametres-section.component';

describe('ParametresSectionComponent', () => {
  let component: ParametresSectionComponent;
  let fixture: ComponentFixture<ParametresSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParametresSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParametresSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

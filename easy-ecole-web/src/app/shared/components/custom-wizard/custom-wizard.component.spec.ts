import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomWizardComponent } from './custom-wizard.component';

describe('CustomWizardComponent', () => {
  let component: CustomWizardComponent;
  let fixture: ComponentFixture<CustomWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomWizardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

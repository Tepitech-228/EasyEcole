import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationBordereauxPageComponent } from './validation-bordereaux-page.component';

describe('ValidationBordereauxPageComponent', () => {
  let component: ValidationBordereauxPageComponent;
  let fixture: ComponentFixture<ValidationBordereauxPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValidationBordereauxPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationBordereauxPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

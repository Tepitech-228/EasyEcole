import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFilePickerComponent } from './custom-file-picker.component';

describe('CustomFilePickerComponent', () => {
  let component: CustomFilePickerComponent;
  let fixture: ComponentFixture<CustomFilePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomFilePickerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFilePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

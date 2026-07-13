import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSvgIconComponent } from './custom-svg-icon.component';

describe('CustomSvgIconComponent', () => {
  let component: CustomSvgIconComponent;
  let fixture: ComponentFixture<CustomSvgIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomSvgIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSvgIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

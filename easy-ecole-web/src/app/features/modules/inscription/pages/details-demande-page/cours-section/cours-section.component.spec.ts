import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursSectionComponent } from './cours-section.component';

describe('CoursSectionComponent', () => {
  let component: CoursSectionComponent;
  let fixture: ComponentFixture<CoursSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoursSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoursSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

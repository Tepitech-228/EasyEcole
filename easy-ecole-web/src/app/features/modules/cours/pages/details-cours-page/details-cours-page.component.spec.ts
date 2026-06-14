import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsCoursPageComponent } from './details-cours-page.component';

describe('DetailsCoursPageComponent', () => {
  let component: DetailsCoursPageComponent;
  let fixture: ComponentFixture<DetailsCoursPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsCoursPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsCoursPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

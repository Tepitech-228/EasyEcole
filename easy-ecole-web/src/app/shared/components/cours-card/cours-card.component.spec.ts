import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursCardComponent } from './cours-card.component';

describe('CoursCardComponent', () => {
  let component: CoursCardComponent;
  let fixture: ComponentFixture<CoursCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CoursCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CoursCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

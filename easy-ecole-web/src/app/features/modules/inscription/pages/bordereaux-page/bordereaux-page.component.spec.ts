import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BordereauxPageComponent } from './bordereaux-page.component';

describe('BordereauxPageComponent', () => {
  let component: BordereauxPageComponent;
  let fixture: ComponentFixture<BordereauxPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BordereauxPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BordereauxPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnBackComponent } from './return-back.component';

describe('ReturnBackComponent', () => {
  let component: ReturnBackComponent;
  let fixture: ComponentFixture<ReturnBackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReturnBackComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnBackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

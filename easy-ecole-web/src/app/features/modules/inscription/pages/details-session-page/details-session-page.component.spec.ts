import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsSessionPageComponent } from './details-session-page.component';

describe('DetailsSessionPageComponent', () => {
  let component: DetailsSessionPageComponent;
  let fixture: ComponentFixture<DetailsSessionPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsSessionPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsSessionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonCursusPageComponent } from './mon-cursus-page.component';

describe('MonCursusPageComponent', () => {
  let component: MonCursusPageComponent;
  let fixture: ComponentFixture<MonCursusPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonCursusPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonCursusPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

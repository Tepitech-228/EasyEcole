import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonProfilPageComponent } from './mon-profil-page.component';

describe('MonProfilPageComponent', () => {
  let component: MonProfilPageComponent;
  let fixture: ComponentFixture<MonProfilPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonProfilPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MonProfilPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsDemandePageComponent } from './details-demande-page.component';

describe('DetailsDemandePageComponent', () => {
  let component: DetailsDemandePageComponent;
  let fixture: ComponentFixture<DetailsDemandePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsDemandePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsDemandePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

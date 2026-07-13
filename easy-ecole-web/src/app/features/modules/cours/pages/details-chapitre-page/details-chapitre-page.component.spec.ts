import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsChapitrePageComponent } from './details-chapitre-page.component';

describe('DetailsChapitrePageComponent', () => {
  let component: DetailsChapitrePageComponent;
  let fixture: ComponentFixture<DetailsChapitrePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsChapitrePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsChapitrePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

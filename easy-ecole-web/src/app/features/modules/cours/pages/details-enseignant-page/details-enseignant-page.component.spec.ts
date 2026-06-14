import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsEnseignantPageComponent } from './details-enseignant-page.component';

describe('DetailsEnseignantPageComponent', () => {
  let component: DetailsEnseignantPageComponent;
  let fixture: ComponentFixture<DetailsEnseignantPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsEnseignantPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsEnseignantPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapitreCardComponent } from './chapitre-card.component';

describe('ChapitreCardComponent', () => {
  let component: ChapitreCardComponent;
  let fixture: ComponentFixture<ChapitreCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChapitreCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChapitreCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

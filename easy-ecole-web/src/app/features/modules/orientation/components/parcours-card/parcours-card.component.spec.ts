import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParcoursCardComponent } from './parcours-card.component';

describe('ParcoursCardComponent', () => {
  let component: ParcoursCardComponent;
  let fixture: ComponentFixture<ParcoursCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParcoursCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParcoursCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

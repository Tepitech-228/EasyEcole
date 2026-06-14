import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CahierDeTexteCardComponent } from './cahier-de-texte-card.component';

describe('CahierDeTexteCardComponent', () => {
  let component: CahierDeTexteCardComponent;
  let fixture: ComponentFixture<CahierDeTexteCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CahierDeTexteCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CahierDeTexteCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

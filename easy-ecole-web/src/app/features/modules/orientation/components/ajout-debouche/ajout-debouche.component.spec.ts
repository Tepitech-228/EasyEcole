import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutDeboucheComponent } from './ajout-debouche.component';

describe('AjoutDeboucheComponent', () => {
  let component: AjoutDeboucheComponent;
  let fixture: ComponentFixture<AjoutDeboucheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutDeboucheComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AjoutDeboucheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

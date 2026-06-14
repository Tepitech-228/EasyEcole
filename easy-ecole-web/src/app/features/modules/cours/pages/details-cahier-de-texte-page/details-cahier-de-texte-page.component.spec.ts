import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsCahierDeTextePageComponent } from './details-cahier-de-texte-page.component';

describe('DetailsCahierDeTextePageComponent', () => {
  let component: DetailsCahierDeTextePageComponent;
  let fixture: ComponentFixture<DetailsCahierDeTextePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsCahierDeTextePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsCahierDeTextePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

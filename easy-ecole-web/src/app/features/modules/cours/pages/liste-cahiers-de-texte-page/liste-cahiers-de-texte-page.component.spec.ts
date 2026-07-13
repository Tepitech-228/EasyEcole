import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeCahiersDeTextePageComponent } from './liste-cahiers-de-texte-page.component';

describe('ListeCahiersDeTextePageComponent', () => {
  let component: ListeCahiersDeTextePageComponent;
  let fixture: ComponentFixture<ListeCahiersDeTextePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeCahiersDeTextePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeCahiersDeTextePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

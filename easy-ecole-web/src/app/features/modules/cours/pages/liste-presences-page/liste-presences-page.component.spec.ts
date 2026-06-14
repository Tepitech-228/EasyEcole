import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListePresencesPageComponent } from './liste-presences-page.component';

describe('ListePresencesPageComponent', () => {
  let component: ListePresencesPageComponent;
  let fixture: ComponentFixture<ListePresencesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListePresencesPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListePresencesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

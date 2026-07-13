import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeEmploisDuTempsPageComponent } from './liste-emplois-du-temps-page.component';

describe('ListeEmploisDuTempsPageComponent', () => {
  let component: ListeEmploisDuTempsPageComponent;
  let fixture: ComponentFixture<ListeEmploisDuTempsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeEmploisDuTempsPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeEmploisDuTempsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

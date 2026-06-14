import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeSessionsPageComponent } from './liste-sessions-page.component';

describe('ListeSessionsPageComponent', () => {
  let component: ListeSessionsPageComponent;
  let fixture: ComponentFixture<ListeSessionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeSessionsPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListeSessionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

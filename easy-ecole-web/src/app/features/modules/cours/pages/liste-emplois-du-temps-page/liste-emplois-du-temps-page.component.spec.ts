import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ListeEmploisDuTempsPageComponent } from './liste-emplois-du-temps-page.component';

describe('ListeEmploisDuTempsPageComponent', () => {
  let component: ListeEmploisDuTempsPageComponent;
  let fixture: ComponentFixture<ListeEmploisDuTempsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeEmploisDuTempsPageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ]
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

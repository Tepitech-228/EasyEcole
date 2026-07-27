import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';

import { DetailsEnseignantPageComponent } from './details-enseignant-page.component';

describe('DetailsEnseignantPageComponent', () => {
  let component: DetailsEnseignantPageComponent;
  let fixture: ComponentFixture<DetailsEnseignantPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailsEnseignantPageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'test' } } } }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsEnseignantPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
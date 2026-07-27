import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ListeCahiersDeTextePageComponent } from './liste-cahiers-de-texte-page.component';

describe('ListeCahiersDeTextePageComponent', () => {
  let component: ListeCahiersDeTextePageComponent;
  let fixture: ComponentFixture<ListeCahiersDeTextePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListeCahiersDeTextePageComponent ],
      imports: [ HttpClientTestingModule, RouterTestingModule ]
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

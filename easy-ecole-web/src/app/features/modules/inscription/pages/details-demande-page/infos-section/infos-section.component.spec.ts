import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfosSectionComponent } from './infos-section.component';

describe('InfosSectionComponent', () => {
  let component: InfosSectionComponent;
  let fixture: ComponentFixture<InfosSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfosSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfosSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

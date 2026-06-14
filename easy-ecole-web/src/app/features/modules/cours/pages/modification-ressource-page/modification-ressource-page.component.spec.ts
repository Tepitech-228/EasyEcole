import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModificationRessourcePageComponent } from './modification-ressource-page.component';

describe('ModificationRessourcePageComponent', () => {
  let component: ModificationRessourcePageComponent;
  let fixture: ComponentFixture<ModificationRessourcePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModificationRessourcePageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificationRessourcePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

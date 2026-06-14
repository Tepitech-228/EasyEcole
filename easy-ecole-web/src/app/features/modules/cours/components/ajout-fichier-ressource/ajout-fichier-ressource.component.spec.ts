import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutFichierRessourceComponent } from './ajout-fichier-ressource.component';

describe('AjoutFichierRessourceComponent', () => {
  let component: AjoutFichierRessourceComponent;
  let fixture: ComponentFixture<AjoutFichierRessourceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutFichierRessourceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AjoutFichierRessourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

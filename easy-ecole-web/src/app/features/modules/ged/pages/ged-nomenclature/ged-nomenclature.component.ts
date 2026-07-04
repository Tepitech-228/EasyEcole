import { Component } from '@angular/core';

@Component({
  selector: 'app-ged-nomenclature',
  templateUrl: './ged-nomenclature.component.html',
  styleUrls: ['./ged-nomenclature.component.scss']
})
export class GedNomenclatureComponent {
  nommageType = 'GED';
  nommageDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
  categorie = '';
  reference = '';
  example = '';

  generate() {
    const parts = [this.nommageType, this.nommageDate, this.categorie || 'DOCUMENT', this.reference || 'REF'];
    this.example = parts.join('-').toUpperCase();
  }
}

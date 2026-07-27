import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RhRubriquePaieService } from 'src/app/data/modules/rh/services/rh-rubrique-paie.service';
import { RubriquePaie } from 'src/app/data/modules/rh/models/RubriquePaie.model';

@Component({
  selector: 'app-parametres-paie-page',
  templateUrl: './parametres-paie-page.component.html',
  styleUrls: ['./parametres-paie-page.component.scss']
})
export class ParametresPaiePageComponent extends BaseComponentClass implements OnInit {
  rubriques: RubriquePaie[] = [];
  showModal = false;
  isEditing = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private rubriqueService: RhRubriquePaieService
  ) { super() }

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', Validators.required],
      libelle: ['', Validators.required],
      type: ['gain'],
      modeCalcul: ['fixe'],
      valeur: [0],
      imposable: [false]
    });
    this.loadRubriques();
  }

  loadRubriques() {
    this.rubriqueService.getAll().subscribe(data => this.rubriques = data);
  }

  openCreate() {
    this.isEditing = false;
    this.form.reset({ code: '', libelle: '', type: 'gain', modeCalcul: 'fixe', valeur: 0, imposable: false });
    this.showModal = true;
  }

  openEdit(r: RubriquePaie) {
    this.isEditing = true;
    this.form.patchValue(r);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.form.invalid) return;
    const item = this.form.value;
    if (this.isEditing) {
      this.rubriqueService.update(item).subscribe(() => {
        this.loadRubriques();
        this.showModal = false;
      });
    } else {
      this.rubriqueService.create(item).subscribe(() => {
        this.loadRubriques();
        this.showModal = false;
      });
    }
  }

  deleteItem(id: string | undefined) {
    if (id && confirm('Supprimer cette rubrique ?')) {
      this.rubriqueService.delete(id).subscribe(() => this.loadRubriques());
    }
  }
}

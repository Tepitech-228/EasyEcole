import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { TypeOperationBordereauService } from 'src/app/data/modules/inscription/services/type-operation-bordereau.service';

@Component({
  selector: 'app-types-bordereaux-page',
  templateUrl: './types-bordereaux-page.component.html',
  styleUrls: ['./types-bordereaux-page.component.scss']
})
export class TypesBordereauxPageComponent extends BaseComponentClass implements OnInit {
  types: any[] = []
  loading: boolean = true
  showModal: boolean = false
  isEditing: boolean = false
  selectedId: number | null = null
  form: FormGroup

  constructor(
    private typeService: TypeOperationBordereauService,
    private fb: FormBuilder
  ) {
    super()
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      libelle: ['', [Validators.required, Validators.maxLength(100)]],
      actif: [true]
    })
  }

  ngOnInit(): void {
    this.loadData()
  }

  private loadData(): void {
    this.loading = true
    this.typeService.getAll().subscribe({
      next: (data) => { this.types = data; this.loading = false },
      error: () => this.loading = false
    })
  }

  openCreate(): void {
    this.isEditing = false
    this.selectedId = null
    this.form.reset({ code: '', libelle: '', actif: true })
    this.showModal = true
  }

  openEdit(item: any): void {
    this.isEditing = true
    this.selectedId = item.id
    this.form.patchValue(item)
    this.showModal = true
  }

  closeModal(): void {
    this.showModal = false
  }

  onSubmit(): void {
    if (this.form.invalid) return
    const data = this.form.value
    if (this.isEditing && this.selectedId) {
      this.typeService.update(this.selectedId, data).subscribe({
        next: () => { this.closeModal(); this.loadData() }
      })
    } else {
      this.typeService.create(data).subscribe({
        next: () => { this.closeModal(); this.loadData() }
      })
    }
  }

  deleteItem(id: number): void {
    if (confirm('Supprimer ce type d\'opération ?')) {
      this.typeService.delete(id).subscribe({ next: () => this.loadData() })
    }
  }

  toggleActif(item: any): void {
    this.typeService.update(item.id, { ...item, actif: !item.actif }).subscribe({
      next: () => this.loadData()
    })
  }
}

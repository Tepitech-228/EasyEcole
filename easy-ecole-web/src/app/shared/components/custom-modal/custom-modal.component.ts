import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-custom-modal',
  templateUrl: './custom-modal.component.html',
  styleUrls: ['./custom-modal.component.scss']
})
export class CustomModalComponent implements OnInit {

  @Input() title!: string
  @Input() subtitle?: string
  @Input() showModal!: boolean
  @Input() center: boolean = false
  /** Taille du panneau : md (défaut, max-w-4xl), lg (max-w-6xl), full (95% viewport — idéal documents/PDF) */
  @Input() size: 'md' | 'lg' | 'full' = 'md'
  @Output() onCloseModal: EventEmitter<any> = new EventEmitter()

  get sizeClass(): string {
    switch (this.size) {
      case 'full': return 'max-w-[95vw]'
      case 'lg': return 'max-w-6xl'
      default: return 'max-w-4xl'
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

  closeModal(): void {
    this.showModal = false
    this.onCloseModal.emit()
  }

}

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
  @Output() onCloseModal: EventEmitter<any> = new EventEmitter()

  constructor() { }

  ngOnInit(): void {
  }

  closeModal(): void {
    this.showModal = false
    this.onCloseModal.emit()
  }

}

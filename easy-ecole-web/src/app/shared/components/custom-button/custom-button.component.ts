import { Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-custom-button',
  templateUrl: './custom-button.component.html',
  styleUrls: ['./custom-button.component.scss']
})
export class CustomButtonComponent implements OnInit {

  @Input() disabled: boolean = false
  @Input() link?: string
  @Input() text!: string
  @HostBinding('class.w-full') @Input() fullWidth: boolean = false
  @Input() outlined: boolean = false
  @Input() color: string = 'primary'

  constructor() { }

  ngOnInit(): void {
  }

}

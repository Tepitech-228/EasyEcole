import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-custom-alert',
  templateUrl: './custom-alert.component.html',
  styleUrls: ['./custom-alert.component.scss']
})
export class CustomAlertComponent implements OnInit {

  @Input() show!: boolean
  @Input() title!: string
  @Input() color: string = 'red'
  @Input() inline: boolean = false

  constructor() { }

  ngOnInit(): void {
  }

}

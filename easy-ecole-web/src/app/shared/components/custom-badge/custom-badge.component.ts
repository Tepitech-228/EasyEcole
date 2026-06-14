import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-custom-badge',
  templateUrl: './custom-badge.component.html',
  styleUrls: ['./custom-badge.component.scss']
})
export class CustomBadgeComponent implements OnInit {

  @Input() text!: string
  @Input() color: string = 'blue'

  constructor() { }

  ngOnInit(): void {
  }

}

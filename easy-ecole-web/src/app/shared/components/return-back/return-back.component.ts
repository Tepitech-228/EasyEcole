import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-return-back',
  templateUrl: './return-back.component.html',
  styleUrls: ['./return-back.component.scss']
})
export class ReturnBackComponent implements OnInit {

  @Input() doubleBack: boolean = false
  @Input() tripleBack: boolean = false

  constructor() { }

  ngOnInit(): void {
  }

}

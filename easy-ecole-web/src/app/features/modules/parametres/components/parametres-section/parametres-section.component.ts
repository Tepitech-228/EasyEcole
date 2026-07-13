import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-parametres-section',
  templateUrl: './parametres-section.component.html',
  styleUrls: ['./parametres-section.component.scss']
})
export class ParametresSectionComponent implements OnInit {

  @Input() title!: string
  @Input() subtitle?: string

  constructor() { }

  ngOnInit(): void {
  }

}

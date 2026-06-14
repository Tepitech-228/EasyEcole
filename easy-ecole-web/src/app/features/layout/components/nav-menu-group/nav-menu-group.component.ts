import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav-menu-group',
  templateUrl: './nav-menu-group.component.html',
  styleUrls: ['./nav-menu-group.component.scss']
})
export class NavMenuGroupComponent implements OnInit {

  @Input() showTitle: boolean = true
  @Input() title?: string

  constructor() { }

  ngOnInit(): void {
  }

}

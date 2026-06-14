import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-nav-menu-item',
  templateUrl: './nav-menu-item.component.html',
  styleUrls: ['./nav-menu-item.component.scss']
})
export class NavMenuItemComponent implements OnInit {

  @Input() isActive: boolean = false
  @Input() isGroup: boolean = false
  @Input() icon!: string
  @Input() text!: string
  @Input() link?: string

  constructor() { }

  ngOnInit(): void {
  }

}

import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit {

  @Input() showReturn: boolean = true
  @Input() title!: string
  @Input() subtitle!: string
  @Input() showBottom: boolean = true
  @Input() bottomText!: string
  @Input() bottomLinkText!: string
  @Input() bottomLink!: string

  constructor() { }

  ngOnInit(): void {
  }

}

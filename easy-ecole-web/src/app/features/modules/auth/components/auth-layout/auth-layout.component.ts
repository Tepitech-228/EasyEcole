import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit, OnDestroy {

  @Input() showReturn: boolean = true
  @Input() title!: string
  @Input() subtitle!: string
  @Input() showBottom: boolean = true
  @Input() bottomText!: string
  @Input() bottomLinkText!: string
  @Input() bottomLink!: string

  slides: string[] = [
    'assets/images/ESA-1.webp',
    'assets/images/ESA-2.jpeg',
    'assets/images/ESA-3.jpg',
    'assets/images/ESA-4.jpeg'
  ]
  activeSlide: number = 0
  private timer?: any

  constructor() { }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.activeSlide = (this.activeSlide + 1) % this.slides.length
    }, 7000)
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

}

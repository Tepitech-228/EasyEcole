import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-return-back',
  templateUrl: './return-back.component.html',
  styleUrls: ['./return-back.component.scss']
})
export class ReturnBackComponent implements OnInit {

  @Input() doubleBack: boolean = false
  @Input() tripleBack: boolean = false
  @Input() link: string = ''
  @Input() text: string = ''

  constructor(private location: Location, private router: Router) { }

  ngOnInit(): void {
  }

  goBack(): void {
    if (this.link) {
      this.router.navigateByUrl(this.link);
    } else {
      this.location.back();
    }
  }

}

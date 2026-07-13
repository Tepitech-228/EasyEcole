import { Component, HostBinding, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-custom-svg-icon',
  templateUrl: './custom-svg-icon.component.html',
  styleUrls: ['./custom-svg-icon.component.scss']
})
export class CustomSvgIconComponent implements OnInit {
  
  @HostBinding('style.-webkit-mask-image')
  private _path!: string;

  constructor() { }

  ngOnInit(): void {
  }

  @Input()
  public set path(filePath: string) {
    this._path = `url("${filePath}")`;
  }
}

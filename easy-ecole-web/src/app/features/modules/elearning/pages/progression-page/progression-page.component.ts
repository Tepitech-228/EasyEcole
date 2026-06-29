import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-progression-page',
  templateUrl: './progression-page.component.html',
  styleUrls: ['./progression-page.component.scss']
})
export class ProgressionPageComponent extends BaseComponentClass implements OnInit {
  progressions: any[] = [];
  globalProgress = 0;

  ngOnInit(): void {
  }
}


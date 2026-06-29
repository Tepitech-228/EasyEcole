import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-devoirs-page',
  templateUrl: './devoirs-page.component.html',
  styleUrls: ['./devoirs-page.component.scss']
})
export class DevoirsPageComponent extends BaseComponentClass implements OnInit {
  devoirs: any[] = [];

  constructor(private router: Router) {
    super();
  }

  ngOnInit(): void {
  }

  voirDevoir(id: string): void {
    this.router.navigate(['/elearning/devoirs', id]);
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'à rendre': return 'yellow';
      case 'soumis': return 'blue';
      case 'noté': return 'green';
      default: return 'gray';
    }
  }
}


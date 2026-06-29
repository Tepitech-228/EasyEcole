import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';

@Component({
  selector: 'app-certificats-page',
  templateUrl: './certificats-page.component.html',
  styleUrls: ['./certificats-page.component.scss']
})
export class CertificatsPageComponent extends BaseComponentClass implements OnInit {
  certificats: any[] = [];

  ngOnInit(): void {
  }

  getStatutColor(statut: string): string {
    return statut === 'valide' ? 'green' : 'red';
  }
}


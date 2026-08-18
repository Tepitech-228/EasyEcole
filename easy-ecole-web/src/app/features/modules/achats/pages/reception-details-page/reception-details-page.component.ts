import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Reception } from 'src/app/data/modules/achats/models/achats.models';
import { ReceptionService } from 'src/app/data/modules/achats/services/reception.service';

@Component({
  selector: 'app-reception-details-page',
  templateUrl: './reception-details-page.component.html',
  styleUrls: ['./reception-details-page.component.scss']
})
export class ReceptionDetailsPageComponent implements OnInit {

  reception: Reception | null = null;
  loading: boolean = true;
  error: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receptionService: ReceptionService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = true;
      this.loading = false;
      return;
    }
    this.receptionService.get(id).subscribe({
      next: (data) => {
        this.reception = data;
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  get quantiteRecue(): number {
    return (this.reception?.lignesReception || []).reduce(
      (somme, l) => somme + (Number(l.quantiteRecue) || 0), 0
    );
  }

  get statutBadgeClass(): string {
    return this.reception?.statut === 'totale'
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';
  }

  retour(): void {
    this.router.navigate(['/achats/receptions']);
  }
}
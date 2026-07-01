import { Component, OnInit } from '@angular/core';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { CertificatService } from 'src/app/data/modules/elearning/services/certificat.service';

@Component({
  selector: 'app-certificats-page',
  templateUrl: './certificats-page.component.html',
  styleUrls: ['./certificats-page.component.scss']
})
export class CertificatsPageComponent extends BaseComponentClass implements OnInit {
  certificats: any[] = [];
  loading = true;
  showCreateModal = false;
  createForm: any = { titre: '', description: '', coursId: '', apprenantId: '' };
  selectedCert: any = null;
  showDetailModal = false;

  constructor(private certificatService: CertificatService) {
    super();
  }

  ngOnInit(): void {
    this.loadCertificats();
  }

  loadCertificats(): void {
    this.loading = true;
    this.certificatService.getAll().subscribe({
      next: (data) => { this.certificats = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  openDetail(cert: any): void {
    this.selectedCert = cert;
    this.showDetailModal = true;
  }

  openCreate(): void {
    this.showCreateModal = true;
  }

  createCertificat(): void {
    this.certificatService.create(this.createForm).subscribe({
      next: () => { this.showCreateModal = false; this.createForm = { titre: '', description: '', coursId: '', apprenantId: '' }; this.loadCertificats(); }
    });
  }

  deleteCertificat(id: string): void {
    if (confirm('Supprimer ce certificat ?')) {
      this.certificatService.delete(id).subscribe({ next: () => this.loadCertificats() });
    }
  }

  canManage(): boolean { return this.rolesValue.isInstitution || this.rolesValue.isAdmin; }
}

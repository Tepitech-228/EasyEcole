import { Component, OnInit } from '@angular/core';
import { GedService, DisposalRecord } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-disposal',
  templateUrl: './ged-disposal.component.html',
  styleUrls: ['./ged-disposal.component.scss']
})
export class GedDisposalComponent implements OnInit {
  records: DisposalRecord[] = [];
  loading = false;
  selectedStatus = 'en_attente';
  search = '';
  currentPage = 1;
  pageSize = 25;
  total = 0;
  selectedRecord: any = null;

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { status: this.selectedStatus, page: this.currentPage, pageSize: this.pageSize };
    if (this.search) params.search = this.search;
    this.gedService.getDisposalRecords(params).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.records = res;
          this.total = res.length;
        } else {
          this.records = res.data || [];
          this.total = res.total || 0;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setStatus(status: string) {
    this.selectedStatus = status;
    this.search = '';
    this.currentPage = 1;
    this.load();
  }

  confirmDisposal(record: DisposalRecord) {
    if (!confirm(`Confirmer la destruction du document "${record.document?.titre}" ?`)) return;
    this.gedService.confirmDisposal(record.id).subscribe({
      next: () => this.load()
    });
  }

  rejectDisposal(record: DisposalRecord) {
    const motif = prompt('Motif du rejet :');
    if (motif === null) return;
    this.gedService.rejectDisposal(record.id, motif || undefined).subscribe({
      next: () => this.load()
    });
  }

  pageChanged(page: number) {
    this.currentPage = page;
    this.load();
  }

  onSearch() {
    this.currentPage = 1;
    this.load();
  }

  exportCsv() {
    const BOM = '\uFEFF';
    const headers = ['Numéro', 'Document', 'Raison', 'Demandeur', 'Date', 'Statut'];
    const rows = this.records.map(r => [
      r.id,
      r.document?.titre || '',
      r.motif || '',
      `${r.demandeur?.prenoms || ''} ${r.demandeur?.nom || ''}`.trim(),
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '',
      r.statut === 'en_attente' ? 'En attente' : r.statut === 'validee' ? 'Validée' : 'Rejetée'
    ]);
    const csv = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `destructions_${this.selectedStatus}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  viewDetail(record: DisposalRecord) {
    this.selectedRecord = record;
  }

  closeDetail() {
    this.selectedRecord = null;
  }
}

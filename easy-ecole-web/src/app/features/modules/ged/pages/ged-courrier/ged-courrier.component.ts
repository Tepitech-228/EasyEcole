import { Component, OnInit } from '@angular/core';
import { GedService } from 'src/app/data/modules/ged/services/ged.service';

@Component({
  selector: 'app-ged-courrier',
  templateUrl: './ged-courrier.component.html',
  styleUrls: ['./ged-courrier.component.scss']
})
export class GedCourrierComponent implements OnInit {
  records: any[] = [];
  total = 0;
  loading = false;
  selectedSens: 'entrant' | 'sortant' | '' = '';
  search = '';
  currentPage = 1;
  pageSize = 25;

  showForm = false;
  editRecord: any = null;
  formData: any = {
    sens: 'entrant',
    objet: '',
    expediteur: '',
    destinataire: '',
    dateCourrier: new Date().toISOString().slice(0, 10),
    modeEnvoi: '',
    accuseReception: false,
    documentId: null,
    annotations: ''
  };
  nextNumero = 1;

  constructor(private gedService: GedService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    const params: any = { page: this.currentPage, pageSize: this.pageSize };
    if (this.selectedSens) params.sens = this.selectedSens;
    if (this.search) params.q = this.search;

    this.gedService.getCourriers(params).subscribe({
      next: (res) => {
        this.records = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  setSens(sens: string) {
    this.selectedSens = sens as any;
    this.currentPage = 1;
    this.load();
  }

  onSearch() {
    this.currentPage = 1;
    this.load();
  }

  pageChanged(page: number) {
    this.currentPage = page;
    this.load();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }

  openNew() {
    this.editRecord = null;
    this.formData = {
      sens: 'entrant',
      objet: '',
      expediteur: '',
      destinataire: '',
      dateCourrier: new Date().toISOString().slice(0, 10),
      modeEnvoi: '',
      accuseReception: false,
      documentId: null,
      annotations: ''
    };
    this.gedService.getNextCourrierNumero(this.formData.sens).subscribe({
      next: (res) => this.nextNumero = res.nextNumero
    });
    this.showForm = true;
  }

  openEdit(record: any) {
    this.editRecord = record;
    this.formData = {
      sens: record.sens,
      objet: record.objet,
      expediteur: record.expediteur || '',
      destinataire: record.destinataire || '',
      dateCourrier: record.dateCourrier ? record.dateCourrier.slice(0, 10) : '',
      modeEnvoi: record.modeEnvoi || '',
      accuseReception: record.accuseReception || false,
      documentId: record.documentId || null,
      annotations: record.annotations || ''
    };
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editRecord = null;
  }

  save() {
    const data = { ...this.formData };
    if (this.editRecord) {
      this.gedService.updateCourrier(this.editRecord.id, data).subscribe({
        next: () => { this.closeForm(); this.load(); }
      });
    } else {
      this.gedService.createCourrier(data).subscribe({
        next: () => { this.closeForm(); this.load(); }
      });
    }
  }

  deleteRecord(record: any) {
    if (!confirm(`Supprimer l'entrée de courrier "${record.objet}" ?`)) return;
    this.gedService.deleteCourrier(record.id).subscribe({
      next: () => this.load()
    });
  }

  onSensChange() {
    this.gedService.getNextCourrierNumero(this.formData.sens).subscribe({
      next: (res) => this.nextNumero = res.nextNumero
    });
  }

  exportCsv() {
    const params: any = {};
    if (this.selectedSens) params.sens = this.selectedSens;
    this.gedService.exportCourrierCsv(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registre-courrier-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getModeLabel(mode: string): string {
    const map: Record<string, string> = {
      'courrier': 'Courrier postal',
      'email': 'Email',
      'remise_main_propre': 'Remise en main propre',
      'fax': 'Fax'
    };
    return map[mode] || mode || '-';
  }

  getSensBadge(sens: string): string {
    return sens === 'entrant' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';
  }

  getSensLabel(sens: string): string {
    return sens === 'entrant' ? 'Entrant' : 'Sortant';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  padNum(num: number, len: number = 4): string {
    return String(num).padStart(len, '0');
  }

  openDocument(record: any) {
    if (record.document?.id) {
      window.open(`/ged/document/${record.document.id}`, '_blank');
    }
  }
}

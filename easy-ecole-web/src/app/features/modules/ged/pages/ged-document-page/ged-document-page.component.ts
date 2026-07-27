import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GedService, GedDocument } from 'src/app/data/modules/ged/services/ged.service';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { RolesUtilisateur } from 'src/app/data/enums/RolesUtilisateur';

@Component({
  selector: 'app-ged-document-page',
  templateUrl: './ged-document-page.component.html',
  styleUrls: ['./ged-document-page.component.scss']
})
export class GedDocumentPageComponent extends BaseComponentClass implements OnInit {
  doc?: GedDocument;
  auditLogs: any[] = [];
  loading = false;
  showAudit = false;
  showNewVersionForm = false;
  showConfirmDeleteForm = false;
  showMarkDeleteForm = false;
  newVersionType = 'mineur';
  newVersionComment = '';
  markDeleteReason = '';
  confirmDeleteReason = '';
  previewUrl?: SafeResourceUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gedService: GedService,
    private sanitizer: DomSanitizer
  ) {
    super();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
  }

  get isAdmin(): boolean {
    return BaseComponentClass.utilisateur?.role === RolesUtilisateur.ADMIN;
  }

  load(id: string) {
    this.loading = true;
    this.gedService.get(id).subscribe({
      next: (doc) => {
        this.doc = doc;
        this.loading = false;
        this.loadPreview();
      },
      error: () => this.loading = false
    });
  }

  private loadPreview() {
    if (!this.doc) return;
    const url = this.gedService.getDownloadUrl(this.doc.id);
    this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  canDownload(): boolean {
    return !!this.doc && (!this.doc.isEncrypted || this.isAdmin);
  }

  download() {
    if (!this.doc || !this.canDownload()) return;
    window.open(this.gedService.getDownloadUrl(this.doc.id), '_blank');
    this.gedService.getAuditTrail(this.doc.id).subscribe();
  }

  verifyIntegrity() {
    if (!this.doc) return;
    this.gedService.verifyIntegrity(this.doc.id).subscribe({
      next: (res) => {
        alert(res.valid ? 'Intégrité vérifiée : le document est authentique.' : 'L\'intégrité du document est compromise !');
        this.load(this.doc!.id);
      },
      error: () => alert('Erreur lors de la vérification d\'intégrité.')
    });
  }

  exportPdf() {
    if (!this.doc) return;
    this.gedService.generatePdf(this.doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.doc!.titre.replace(/\s+/g, '_')}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  validate() {
    if (!this.doc) return;
    this.gedService.validateDocument(this.doc.id).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  lock() {
    if (!this.doc) return;
    this.gedService.lockDocument(this.doc.id).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  unlock() {
    if (!this.doc) return;
    this.gedService.unlockDocument(this.doc.id).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  markForDeletion() {
    if (!this.doc || !this.markDeleteReason.trim()) return;
    this.gedService.markForDeletion(this.doc.id, this.markDeleteReason).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  confirmDeletion() {
    if (!this.doc || !this.confirmDeleteReason.trim()) return;
    this.gedService.confirmDeletion(this.doc.id, this.confirmDeleteReason).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  newVersion() {
    if (!this.doc || !this.newVersionComment.trim()) return;
    this.gedService.newVersion(this.doc.id, this.newVersionType, this.newVersionComment).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  getAuditTrail() {
    if (!this.doc) return;
    this.showAudit = !this.showAudit;
    if (this.showAudit && this.auditLogs.length === 0) {
      this.gedService.getAuditTrail(this.doc.id).subscribe({
        next: (logs) => { this.auditLogs = logs; }
      });
    }
  }

  restore() {
    if (!this.doc) return;
    this.gedService.restoreDocument(this.doc.id).subscribe({
      next: () => this.load(this.doc!.id)
    });
  }

  getTags(doc: GedDocument): string[] {
    return (doc.tags || '').split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  getVersionType(v: GedDocument): string {
    return v.versionMinor && v.versionMinor > 0 ? 'mineur' : 'majeur';
  }

  getSemestreLabel(semestre?: string): string {
    const map: Record<string, string> = {
      'semestre1': 'Semestre 1', 'semestre2': 'Semestre 2', 'semestre3': 'Semestre 3',
      'semestre4': 'Semestre 4', 'semestre5': 'Semestre 5', 'semestre6': 'Semestre 6'
    };
    return map[semestre || ''] || semestre || '-';
  }

  getSourceLabel(source?: string): string {
    const map: Record<string, string> = {
      'genere_application': 'Généré par l\'application',
      'numerise_interne': 'Numérisé (interne)',
      'recu_externe': 'Reçu de l\'extérieur'
    };
    return map[source || ''] || source || '-';
  }

  formatDate(date?: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}

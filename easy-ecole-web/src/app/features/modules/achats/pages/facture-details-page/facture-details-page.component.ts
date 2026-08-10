import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { BaseComponentClass } from 'src/app/core/base-component-class';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-facture-details-page',
  templateUrl: './facture-details-page.component.html',
  styleUrls: ['./facture-details-page.component.scss']
})
export class FactureDetailsPageComponent extends BaseComponentClass implements OnInit {
  loading = false
  notFound = false
  facture: any = null
  private readonly API = `${environment.API_URL}/achats/factures`

  constructor(private route: ActivatedRoute, private http: HttpClient) { super() }

  ngOnInit(): void {
    this.loadFacture()
  }

  loadFacture() {
    const id = this.route.snapshot.paramMap.get('id')
    if (!id) { this.notFound = true; return }
    this.loading = true
    this.http.get<any>(`${this.API}/${id}`).subscribe({
      next: (data) => { this.facture = data; this.loading = false },
      error: (err) => { this.loading = false; this.notFound = err.status === 404 }
    })
  }

  get reference(): string {
    return this.facture?.reference || (this.facture ? `PF-${this.facture.id}` : '')
  }

  get statutLabel(): string {
    const map: any = { emise: 'Émise', payee: 'Payée', annulee: 'Annulée' }
    return map[this.facture?.statut] || this.facture?.statut || ''
  }

  get fournisseurLabel(): string {
    const commande = this.facture?.commande
    if (!commande) return '—'
    const f = commande.fournisseur
    if (f?.nom) return f.nom
    if (f?.raisonSociale) return f.raisonSociale
    return commande.fournisseurId ? `Fournisseur #${commande.fournisseurId}` : '—'
  }

  get totalLignes(): number {
    return (this.facture?.lignesFacture || []).reduce((s: number, l: any) => s + (l.total || 0), 0)
  }

  getStatutBadge(statut: string): string {
    const map: any = { emise: 'bg-yellow-100 text-yellow-700', payee: 'bg-green-100 text-green-700', annulee: 'bg-red-100 text-red-700' }
    return map[statut] || 'bg-gray-100 text-gray-700'
  }

  private escapeXml(value: any): string {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  private fmt(n: any): string {
    return Number(n || 0).toLocaleString('fr-FR') + ' FCFA'
  }

  telechargerFacture() {
    if (!this.facture) return
    const f = this.facture
    const commande = f.commande
    const lignes = f.lignesFacture || []

    const lignesHtml = lignes.length
      ? lignes.map((l: any) => `
        <tr>
          <td>${this.escapeXml(l.designation)}</td>
          <td class="num">${this.escapeXml(l.quantite)}</td>
          <td class="num">${this.fmt(l.prixUnitaire)}</td>
          <td class="num">${this.fmt(l.total)}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" style="text-align:center;color:#6b7280;">Aucune ligne sur cette facture pro forma</td></tr>`

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Facture pro forma ${this.escapeXml(this.reference)}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 40px; }
  .header { border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 24px; }
  .header h1 { font-size: 22px; margin: 0 0 4px; color: #1d4ed8; }
  .header .ref { color: #6b7280; font-size: 12px; margin: 0; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  table.info td { padding: 4px 0; font-size: 13px; }
  table.info .label { color: #6b7280; width: 180px; }
  table.data { width: 100%; border-collapse: collapse; }
  table.data th { background: #1d4ed8; color: #fff; padding: 8px 10px; text-align: left; font-size: 12px; }
  table.data td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; font-size: 13px; }
  table.data .num { text-align: right; white-space: nowrap; }
  table.data .total td { font-weight: bold; background: #f3f4f6; }
  .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <div class="header">
    <h1>FACTURE PRO FORMA</h1>
    <p class="ref">N° ${this.escapeXml(this.reference)} &middot; Date d'émission : ${this.escapeXml(new Date(f.dateEmission).toLocaleDateString('fr-FR'))}</p>
  </div>

  <table class="info">
    <tr><td class="label">Fournisseur</td><td>${this.escapeXml(this.fournisseurLabel)}</td></tr>
    <tr><td class="label">Commande liée</td><td>${commande ? 'Commande n° ' + this.escapeXml(commande.id) + (commande.dateCommande ? ' &middot; date : ' + this.escapeXml(new Date(commande.dateCommande).toLocaleDateString('fr-FR')) : '') : '—'}</td></tr>
    <tr><td class="label">Statut</td><td>${this.escapeXml(this.statutLabel)}</td></tr>
  </table>

  <table class="data">
    <thead>
      <tr>
        <th>Désignation</th>
        <th style="width:100px;">Quantité</th>
        <th style="width:160px;">Prix unitaire</th>
        <th style="width:160px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${lignesHtml}
      <tr class="total">
        <td colspan="3">Total lignes</td>
        <td class="num">${this.fmt(this.totalLignes)}</td>
      </tr>
      <tr class="total">
        <td colspan="3">Montant total</td>
        <td class="num">${this.fmt(f.montantTotal)}</td>
      </tr>
    </tbody>
  </table>

  <p class="footer">Document généré par EasyEcole le ${this.escapeXml(new Date().toLocaleDateString('fr-FR'))} à ${this.escapeXml(new Date().toLocaleTimeString('fr-FR'))}.</p>
</body>
</html>`

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
    saveAs(blob, `facture-pro-forma_${this.reference}.doc`)
  }
}

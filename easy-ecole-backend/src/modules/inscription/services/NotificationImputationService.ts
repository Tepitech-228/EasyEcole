import { Bordereau } from "../models/Bordereau";
import { ResultatImputation } from "../services/ImputationService";
import { EmailSender } from "../../../core/helpers/EmailSender";

const formaterMois = (mois?: string | null): string => {
  const match = mois ? /^(\d{4})-(\d{2})$/.exec(mois) : null
  if (!match) return mois || 'mois non précisé'
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, 1))
}

export class GenererNotificationImputation {

  static async envoyer(utilisateur: any, bordereau: Bordereau, lettrage: ResultatImputation): Promise<void> {
    const email = utilisateur.email
    if (!email) return

    const nomComplet = `${utilisateur.prenoms || ''} ${utilisateur.nom || ''}`.trim() || 'Étudiant'
    const montantPaye = lettrage.montantDisponible

    let html = `<p>Bonjour ${nomComplet},</p>`
    html += `<p>Votre paiement de <strong>${montantPaye.toLocaleString('fr-FR')} FCFA</strong> a été enregistré avec succès.</p>`

    const lignesInscription = lettrage.lignes.filter(l => l.type === 'inscription')
    const lignesScolarite = lettrage.lignes.filter(l => l.type === 'scolarite')

    if (lignesInscription.length > 0) {
      html += `<h3 style="color:#4f46e5;margin-top:16px;">Frais d'inscription</h3><ul>`
      for (const ligne of lignesInscription) {
        if (ligne.statutApres === 'paye') {
          html += `<li>Frais d'inscription imputés : <strong>${ligne.montantImpute.toLocaleString('fr-FR')} FCFA → SOLDÉS</strong></li>`
        } else if (ligne.statutApres === 'partiel') {
          html += `<li>Frais d'inscription imputés : <strong>${ligne.montantImpute.toLocaleString('fr-FR')} FCFA → PARTIEL</strong> (reste : ${ligne.resteApres.toLocaleString('fr-FR')} FCFA)</li>`
        }
      }
      html += `</ul>`
    }

    if (lignesScolarite.length > 0) {
      html += `<h3 style="color:#4f46e5;margin-top:16px;">Frais de scolarité</h3><ul>`
      for (const ligne of lignesScolarite) {
        const libelleEcheance = `Échéance ${ligne.numeroEcheance} · ${formaterMois(ligne.moisConcerne)}`
        if (ligne.statutApres === 'paye') {
          html += `<li>${libelleEcheance} : <strong>${ligne.montantImpute.toLocaleString('fr-FR')} FCFA → SOLDÉE</strong></li>`
        } else if (ligne.statutApres === 'partiel') {
          html += `<li>${libelleEcheance} : <strong>${ligne.montantImpute.toLocaleString('fr-FR')} FCFA → PARTIEL</strong> (reste : ${ligne.resteApres.toLocaleString('fr-FR')} FCFA)</li>`
        }
      }
      html += `</ul>`
    }

    if (lettrage.surplus > 0) {
      html += `<p style="margin-top:12px;"><strong>Surplus crédité : ${lettrage.surplus.toLocaleString('fr-FR')} FCFA</strong> (portefeuille crédit).</p>`
    }

    html += `<p style="margin-top:16px;">Cordialement,<br>Easy Ecole</p>`

    await EmailSender.getInstance().sendPdf(
      email,
      nomComplet,
      'Easy Ecole: Confirmation de paiement',
      html,
      '',
      ''
    )
  }
}

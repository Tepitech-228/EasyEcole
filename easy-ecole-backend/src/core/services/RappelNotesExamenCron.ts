import cron, { ScheduledTask } from 'node-cron'
import { Op } from 'sequelize'
import { ListeNoteEvaluation } from '../../modules/inscription/models/ListeNoteEvaluation'
import { TypeNoteEvaluation } from '../../modules/inscription/models/TypeNoteEvaluation'
import { Cours } from '../../modules/inscription/models/Cours'
import { Enseignant } from '../../modules/auth/models/Enseignant'
import { Utilisateur } from '../../modules/auth/models/Utilisateur'
import { RolesUtilisateur } from '../../core/enums/RolesUtilisateur'
import { EmailSender } from '../helpers/EmailSender'

/**
 * Cron quotidien 08h00 — Alerte SG/DG si un prof n'a pas saisi ses notes d'examen
 * dans les 14 jours après la date d'examen.
 *
 * Logique :
 * - ListeNoteEvaluation.dateLimiteSaisie = date + 14j (posée à la création si type examen)
 * - On cherche les listes où dateLimiteSaisie <= NOW() + 2j (J-2) et pas encore publiées
 * - On notifie SG (institution/admin) + DG (admin)
 */
export class RappelNotesExamenCron {
  private static task: ScheduledTask | null = null

  static start() {
    // Tous les jours à 08:00
    this.task = cron.schedule('0 8 * * *', () => void this.executer(), { timezone: 'UTC' })
    console.log('[RappelNotesExamenCron] Cron quotidien démarré (08h00 UTC)')
    // Vérification au démarrage (sans spam) — seulement si des listes sont déjà en retard
    setTimeout(() => void this.executer(true), 10_000)
  }

  static stop() {
    this.task?.stop()
  }

  static async executer(silencieuxSiRien = false) {
    try {
      const maintenant = new Date()
      const dans2j = new Date()
      dans2j.setDate(dans2j.getDate() + 2)

      // Listes d'examen en retard ou à J-2
      const listes = await ListeNoteEvaluation.findAll({
        where: {
          dateLimiteSaisie: { [Op.lte]: dans2j, [Op.ne]: null as any },
        },
        include: [
          { association: ListeNoteEvaluation.associations.typeNoteEvaluation, attributes: ['id', 'libelle', 'categorie'] },
          { association: ListeNoteEvaluation.associations.cours, include: [{ association: Cours.associations.classe, attributes: ['id', 'libelle'] }] },
          { association: ListeNoteEvaluation.associations.enseignant, include: [{ association: Enseignant.associations.utilisateur, attributes: ['id', 'nom', 'prenoms', 'email'] }] },
        ],
      })

      // Filtrer : seulement les examens, et vérifier si des notes manquent
      const enRetard: typeof listes = []
      for (const liste of listes) {
        const type = (liste as any).typeNoteEvaluation
        const isExamen = type && (String(type.categorie).toLowerCase() === 'examen' || String(type.libelle).toLowerCase().includes('examen'))
        if (!isExamen) continue
        // Vérifier si toutes les notes sont saisies : on compte les participants vs notes
        const coursId = (liste as any).coursId
        const [participants] = await (await import('../../modules/inscription/models/CoursParticipant')).CoursParticipant.sequelize!.query(
          'SELECT COUNT(*) as cnt FROM ins_cours_participants WHERE coursId=?',
          { replacements: [coursId] }
        ) as any
        const nbParticipants = Number(participants[0]?.cnt || 0)
        const nbNotes = await (await import('../../modules/inscription/models/NoteEvaluation')).NoteEvaluation.count({ where: { listeNoteEvaluationId: liste.id } })
        if (nbNotes < nbParticipants) {
          enRetard.push(liste)
        }
      }

      if (enRetard.length === 0) {
        if (!silencieuxSiRien) console.log('[RappelNotesExamenCron] Aucune liste en retard')
        return
      }

      console.log(`[RappelNotesExamenCron] ${enRetard.length} liste(s) en retard / à J-2`)

      // Récupérer SG et DG (institution + admin)
      const destinataires = await Utilisateur.findAll({
        where: { role: { [Op.in]: [RolesUtilisateur.INSTITUTION, RolesUtilisateur.ADMIN] }, deletedAt: null },
        attributes: ['id', 'email', 'nom', 'prenoms'],
      })

      for (const liste of enRetard) {
        const cours = (liste as any).cours
        const enseignant = (liste as any).enseignant
        const profNom = enseignant?.utilisateur ? `${enseignant.utilisateur.nom} ${enseignant.utilisateur.prenoms}` : `Prof #${(liste as any).enseignantId}`
        const classe = cours?.classe?.libelle || 'Classe inconnue'
        const ue = cours ? `${cours.code} - ${cours.intitule}` : `Cours #${(liste as any).coursId}`
        const dateLimite = (liste as any).dateLimiteSaisie
        const joursRestants = Math.ceil((new Date(dateLimite).getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24))
        const statut = joursRestants < 0 ? `EN RETARD de ${Math.abs(joursRestants)}j` : `J-${joursRestants}`

        for (const dest of destinataires) {
          if (!dest.email) continue
          try {
            await EmailSender.getInstance().sendMail({
              from: 'Easy Ecole <easy.ecole@technologybusiness-tb.com>',
              to: dest.email,
              subject: `[ALERTE] Note d'examen en retard — ${ue} / ${classe}`,
              html: `<p>Bonjour ${dest.prenoms || ''} ${dest.nom || ''},</p>
                     <p>Le professeur <b>${profNom}</b> n'a pas encore saisi les notes d'examen pour :</p>
                     <ul><li><b>UE :</b> ${ue}</li><li><b>Classe :</b> ${classe}</li><li><b>Date d'examen :</b> ${new Date((liste as any).date).toLocaleDateString()}</li><li><b>Date limite :</b> ${new Date(dateLimite).toLocaleDateString()} (${statut})</li></ul>
                     <p>Merci de relancer l'enseignant.</p><p>Cordialement,<br>Easy Ecole — Système d'alerte</p>`,
            })
          } catch (e) {
            console.error(`[RappelNotesExamenCron] Email échoué vers ${dest.email}:`, e)
          }
        }
      }
    } catch (e) {
      console.error('[RappelNotesExamenCron] Erreur:', e)
    }
  }

  // Endpoint pour SG : liste des alertes en temps réel
  static async getAlertes() {
    const maintenant = new Date()
    const dans2j = new Date()
    dans2j.setDate(dans2j.getDate() + 2)
    const listes = await ListeNoteEvaluation.findAll({
      where: { dateLimiteSaisie: { [Op.lte]: dans2j, [Op.ne]: null as any } },
      include: [
        { association: ListeNoteEvaluation.associations.typeNoteEvaluation },
        { association: ListeNoteEvaluation.associations.cours, include: [{ association: Cours.associations.classe }, { association: Cours.associations.parcours }] },
        { association: ListeNoteEvaluation.associations.enseignant, include: [{ association: Enseignant.associations.utilisateur }] },
      ],
      order: [['dateLimiteSaisie', 'ASC']],
    })
    const result: any[] = []
    for (const liste of listes) {
      const type = (liste as any).typeNoteEvaluation
      const isExamen = type && (String(type.categorie).toLowerCase() === 'examen' || String(type.libelle).toLowerCase().includes('examen'))
      if (!isExamen) continue
      const cours = (liste as any).cours
      const nbNotes = await (await import('../../modules/inscription/models/NoteEvaluation')).NoteEvaluation.count({ where: { listeNoteEvaluationId: liste.id } })
      const [participants] = await (await import('../../modules/inscription/models/CoursParticipant')).CoursParticipant.sequelize!.query(
        'SELECT COUNT(*) as cnt FROM ins_cours_participants WHERE coursId=?',
        { replacements: [(liste as any).coursId] }
      ) as any
      const nbParticipants = Number(participants[0]?.cnt || 0)
      if (nbNotes >= nbParticipants) continue
      const dateLimite = new Date((liste as any).dateLimiteSaisie)
      const joursRestants = Math.ceil((dateLimite.getTime() - maintenant.getTime()) / (1000*60*60*24))
      result.push({
        id: liste.id,
        cours: cours ? { id: cours.id, code: cours.code, intitule: cours.intitule, classe: cours.classe, parcours: cours.parcours } : null,
        enseignant: (liste as any).enseignant,
        date: (liste as any).date,
        dateLimiteSaisie: (liste as any).dateLimiteSaisie,
        joursRestants,
        statut: joursRestants < 0 ? 'retard' : joursRestants <= 2 ? 'alerte' : 'ok',
        nbNotes,
        nbParticipants,
      })
    }
    return result
  }
}

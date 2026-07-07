import { Role } from "../models/Role";
import { Permission } from "../models/Permission";
import { RolePermission } from "../models/RolePermission";
import { Utilisateur } from "../models/Utilisateur";
import { UserRole } from "../models/UserRole";
import { RolesUtilisateur } from "../../../core/enums/RolesUtilisateur";

const DEFAULT_ROLES = [
    { nom: 'Super Admin', description: 'Accès complet à toutes les fonctionnalités' },
    { nom: 'Directeur', description: 'Direction de l\'établissement' },
    { nom: 'Comptable', description: 'Gestion financière et comptable' },
    { nom: 'Enseignant', description: 'Corps enseignant' },
    { nom: 'Apprenant', description: 'Étudiant / Apprenant' },
    { nom: 'Parent', description: 'Parent d\'apprenant' },
    { nom: 'Surveillant', description: 'Surveillance et discipline' },
    { nom: 'Bibliothécaire', description: 'Gestion de la bibliothèque' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
    'Super Admin': [],
    'Directeur': [
        'menu.tableau-de-bord',
        'menu.inscription', 'menu.inscription.sessions', 'menu.inscription.parcours',
        'menu.inscription.demandes', 'menu.inscription.dossiers-etudiants',
        'menu.inscription.paiements', 'menu.inscription.comptabilite',
        'menu.inscription.echeances', 'menu.inscription.validation-bordereaux',
        'menu.orientation', 'menu.orientation.parcours', 'menu.orientation.demandes',
        'menu.cours', 'menu.cours.enseignants', 'menu.cours.liste',
        'menu.cours.presences', 'menu.cours.emplois-du-temps', 'menu.cours.notes',
        'menu.evaluations', 'menu.evaluations.bulletins', 'menu.evaluations.deliberations',
        'menu.evaluations.moyennes', 'menu.evaluations.rattrapages',
        'menu.scolarite', 'menu.scolarite.demandes-docs', 'menu.scolarite.traiter-demandes',
        'menu.scolarite.reclamations', 'menu.scolarite.traiter-reclamations',
        'menu.scolarite.registres', 'menu.scolarite.calendrier', 'menu.scolarite.discipline',
        'menu.scolarite.conseils',
        'menu.finances', 'menu.finances.paiements', 'menu.finances.comptabilite',
        'menu.finances.bordereaux', 'menu.finances.validation-bordereaux',
        'menu.stocks', 'menu.stocks.articles', 'menu.stocks.mouvements',
        'menu.rh', 'menu.rh.employes', 'menu.rh.paie',
        'menu.pointage', 'menu.pointage.historique', 'menu.pointage.rapports',
        'menu.communication', 'menu.communication.vie-estudiantine',
        'menu.communication.messagerie', 'menu.communication.annonces',
        'menu.reporting', 'menu.reporting.dashboard', 'menu.reporting.effectifs',
        'menu.reporting.notes', 'menu.reporting.paiements',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'menu.parametres.configuration',
        // Actions
        'action.inscription.session.creer', 'action.inscription.session.modifier', 'action.inscription.session.supprimer',
        'action.inscription.parcours.creer', 'action.inscription.parcours.modifier', 'action.inscription.parcours.supprimer',
        'action.inscription.demande.valider', 'action.inscription.demande.rejeter',
        'action.inscription.dossier.generer', 'action.inscription.dossier.modifier-statut',
        'action.inscription.echeance.generer',
        'action.cours.cours.creer', 'action.cours.cours.modifier', 'action.cours.cours.supprimer',
        'action.cours.enseignant.creer', 'action.cours.enseignant.modifier',
        'action.cours.note.saisir', 'action.cours.note.modifier',
        'action.evaluation.bulletin.generer', 'action.evaluation.deliberation.organiser',
        'action.evaluation.moyenne.calculer', 'action.evaluation.rattrapage.assigner',
        'action.evaluation.rattrapage.notifier', 'action.evaluation.rattrapage.saisir-notes',
        'action.scolarite.document.traiter', 'action.scolarite.reclamation.traiter',
        'action.scolarite.discipline.sanctionner',
        'action.finances.paiement.enregistrer', 'action.finances.paiement.annuler',
        'action.rh.employe.creer', 'action.rh.employe.modifier', 'action.rh.paie.generer',
    ],
    'Comptable': [
        'menu.tableau-de-bord',
        'menu.inscription', 'menu.inscription.paiements', 'menu.inscription.comptabilite',
        'menu.inscription.bordereaux', 'menu.inscription.validation-bordereaux',
        'menu.inscription.echeances',
        'menu.finances', 'menu.finances.paiements', 'menu.finances.comptabilite',
        'menu.finances.bordereaux', 'menu.finances.validation-bordereaux',
        'menu.reporting', 'menu.reporting.paiements',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'action.inscription.bordereau.valider',
        'action.inscription.echeance.generer', 'action.inscription.echeance.modifier',
        'action.finances.paiement.enregistrer', 'action.finances.paiement.annuler',
        'action.finances.comptabilite.consulter',
    ],
    'Enseignant': [
        'menu.tableau-de-bord',
        'menu.cours', 'menu.cours.liste', 'menu.cours.presences',
        'menu.cours.mes-presences', 'menu.cours.cahiers-de-texte',
        'menu.cours.emplois-du-temps', 'menu.cours.notes',
        'menu.evaluations', 'menu.evaluations.bulletins', 'menu.evaluations.moyennes',
        'menu.evaluations.mon-releve', 'menu.evaluations.rattrapages',
        'menu.scolarite', 'menu.scolarite.calendrier',
        'menu.communication', 'menu.communication.messagerie',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'action.cours.cours.creer', 'action.cours.cours.modifier',
        'action.cours.presence.generer',
        'action.cours.note.saisir', 'action.cours.note.modifier',
        'action.evaluation.bulletin.generer',
    ],
    'Apprenant': [
        'menu.tableau-de-bord',
        'menu.inscription', 'menu.inscription.cursus', 'menu.inscription.mon-dossier',
        'menu.inscription.paiements', 'menu.inscription.bordereaux',
        'menu.inscription.echeances',
        'menu.cours', 'menu.cours.mes-presences', 'menu.cours.emplois-du-temps',
        'menu.cours.notes',
        'menu.evaluations', 'menu.evaluations.mon-releve',
        'menu.elearning', 'menu.elearning.mes-cours', 'menu.elearning.quiz',
        'menu.elearning.progression', 'menu.elearning.certificats', 'menu.elearning.devoirs',
        'menu.stages', 'menu.stages.offres', 'menu.stages.demandes-stage',
        'menu.communication', 'menu.communication.vie-estudiantine',
        'menu.communication.messagerie', 'menu.communication.discussions',
        'menu.communication.suggestions', 'menu.communication.annonces',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'Parent': [
        'menu.tableau-de-bord',
        'menu.inscription', 'menu.inscription.cursus', 'menu.inscription.mon-dossier',
        'menu.cours', 'menu.cours.emplois-du-temps',
        'menu.evaluations', 'menu.evaluations.mon-releve',
        'menu.scolarite', 'menu.scolarite.demandes-docs', 'menu.scolarite.reclamations',
        'menu.communication', 'menu.communication.messagerie',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'Surveillant': [
        'menu.tableau-de-bord',
        'menu.cours', 'menu.cours.presences', 'menu.cours.emplois-du-temps',
        'menu.scolarite', 'menu.scolarite.discipline',
        'menu.pointage', 'menu.pointage.absences',
        'menu.communication', 'menu.communication.messagerie',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'action.scolarite.discipline.sanctionner',
    ],
    'Bibliothécaire': [
        'menu.tableau-de-bord',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
};

export class RoleSeed {
    static async init(adminUserId?: number): Promise<void> {
        try {
            const count = await Role.count();
            if (count > 0) return;

            for (const roleData of DEFAULT_ROLES) {
                const role = await Role.create({
                    nom: roleData.nom,
                    description: roleData.description,
                });

                const permissionKeys = ROLE_PERMISSIONS[roleData.nom] || [];
                if (permissionKeys.length > 0) {
                    const permissions = await Permission.findAll({ where: { key: permissionKeys } });
                    for (const perm of permissions) {
                        await RolePermission.findOrCreate({
                            where: { roleId: role.id, permissionId: perm.id },
                            defaults: { roleId: role.id, permissionId: perm.id }
                        });
                    }
                }
            }

            // Assign the 'Super Admin' role to the admin user
            if (adminUserId) {
                const superAdminRole = await Role.findOne({ where: { nom: 'Super Admin' } });
                if (superAdminRole) {
                    await UserRole.findOrCreate({
                        where: { utilisateurId: adminUserId as any, roleId: superAdminRole.id as any },
                        defaults: { utilisateurId: adminUserId as any, roleId: superAdminRole.id as any }
                    });
                }
            }

            console.log('Rôles seedés avec succès');
        } catch (error) {
            console.error('Erreur lors du seed des rôles:', error);
        }
    }
}

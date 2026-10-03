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
    { nom: 'Comité', description: 'Traitement collégial des dossiers d’inscription' },
    { nom: 'ESA Compta', description: 'Saisie et suivi comptable des bordereaux' },
    { nom: 'Personnel administratif', description: 'Gestion administrative et secrétariat' },
    { nom: 'Ressources Humaines', description: 'Gestion du personnel et de la paie' },
    { nom: 'Secrétaire', description: 'Accueil et traitement des dossiers administratifs' },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
    'Super Admin': [
        'menu.administration',
        'menu.administration.roles',
        'menu.administration.permissions',
        'action.administration.personnel.generer-qr',
    ],
    'Directeur': [
        'menu.tableau-de-bord',
        'menu.administration',
        'menu.administration.roles',
        'menu.administration.permissions',
        'menu.inscription', 'menu.inscription.sessions', 'menu.inscription.parcours',
        'menu.inscription.demandes',         'menu.inscription.dossiers-etudiants',
        'menu.inscription.cartes',
        'menu.inscription.effectifs',
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
        'menu.finances.bordereaux', 'menu.finances.validation-bordereaux', 'menu.finances.impayes',
        'menu.finances.situation-financiere',
        'menu.stocks', 'menu.stocks.articles', 'menu.stocks.mouvements',
        'menu.immobilisations', 'menu.immobilisations.liste', 'menu.immobilisations.sites',
        'menu.immobilisations.categories', 'menu.immobilisations.affectations',
        'menu.immobilisations.assurances', 'menu.immobilisations.sorties-provisoires',
        'menu.immobilisations.cessions', 'menu.immobilisations.rebuts',
        'menu.immobilisations.maintenance', 'menu.immobilisations.inventaires',
        'menu.immobilisations.reportings',
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
        'action.inscription.ecue.creer', 'action.inscription.ecue.modifier', 'action.inscription.ecue.supprimer',
        'action.cours.enseignant.creer', 'action.cours.enseignant.modifier',
        'action.cours.note.saisir', 'action.cours.note.modifier',
        'action.evaluation.bulletin.generer', 'action.evaluation.deliberation.organiser',
        'action.evaluation.moyenne.calculer', 'action.evaluation.rattrapage.assigner',
        'action.evaluation.rattrapage.notifier', 'action.evaluation.rattrapage.saisir-notes',
        'action.scolarite.document.traiter', 'action.scolarite.reclamation.traiter',
        'action.scolarite.discipline.sanctionner',
        'action.finances.paiement.enregistrer', 'action.finances.paiement.annuler',
        'action.rh.employe.creer', 'action.rh.employe.modifier', 'action.rh.paie.generer',
        'action.administration.personnel.generer-qr',
    ],
    'Comptable': [
        'menu.tableau-de-bord',
        'menu.inscription', 'menu.inscription.paiements', 'menu.inscription.comptabilite',
        'menu.inscription.bordereaux', 'menu.inscription.validation-bordereaux',
        'menu.inscription.echeances',
        'menu.finances', 'menu.finances.paiements', 'menu.finances.comptabilite',
        'menu.finances.bordereaux', 'menu.finances.validation-bordereaux', 'menu.finances.impayes',
        'menu.reporting', 'menu.reporting.paiements',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'action.inscription.bordereau.valider',
        'action.inscription.echeance.generer', 'action.inscription.echeance.modifier',
        'action.finances.paiement.enregistrer', 'action.finances.paiement.annuler',
        'action.finances.comptabilite.consulter',
        'menu.immobilisations', 'menu.immobilisations.liste', 'menu.immobilisations.sites',
        'menu.immobilisations.categories', 'menu.immobilisations.affectations',
        'menu.immobilisations.assurances', 'menu.immobilisations.sorties-provisoires',
        'menu.immobilisations.cessions', 'menu.immobilisations.rebuts',
        'menu.immobilisations.maintenance', 'menu.immobilisations.inventaires',
        'menu.immobilisations.reportings',
    ],
    'Enseignant': [
        'menu.tableau-de-bord',
        'menu.cours', 'menu.cours.liste', 'menu.cours.presences',
        'menu.cours.mes-presences', 'menu.cours.cahiers-de-texte',
        'menu.cours.emplois-du-temps', 'menu.cours.notes',
        'menu.inscription', 'menu.inscription.sessions',
        'menu.evaluations', 'menu.evaluations.bulletins', 'menu.evaluations.moyennes',
        'menu.evaluations.mon-releve', 'menu.evaluations.rattrapages',
        'menu.scolarite', 'menu.scolarite.calendrier',
        'menu.communication', 'menu.communication.messagerie',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'action.cours.cours.creer', 'action.cours.cours.modifier',
        'action.cours.presence.generer',
        'action.cours.note.saisir', 'action.cours.note.modifier',
        'action.evaluation.bulletin.generer',
        'action.inscription.session.creer', 'action.inscription.session.modifier', 'action.inscription.session.supprimer',
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
        'menu.cours', 'menu.cours.presences', 'menu.cours.emplois-du-temps', 'menu.cours.notes',
        'menu.scolarite', 'menu.scolarite.discipline', 'menu.scolarite.conseils',
        'menu.pointage', 'menu.pointage.terminal', 'menu.pointage.historique', 'menu.pointage.rapports', 'menu.pointage.planning', 'menu.pointage.shifts', 'menu.pointage.absences',
        'menu.inscription', 'menu.inscription.parcours', 'menu.inscription.salles', 'menu.inscription.sessions',
        'menu.evaluations', 'menu.evaluations.bulletins', 'menu.evaluations.deliberations', 'menu.evaluations.moyennes',
        'menu.reporting', 'menu.reporting.notes',
        'menu.communication', 'menu.communication.messagerie',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
        'action.scolarite.discipline.sanctionner',
        'action.inscription.classe.creer', 'action.inscription.classe.modifier', 'action.inscription.classe.supprimer',
        'action.inscription.parcours.creer', 'action.inscription.parcours.modifier', 'action.inscription.parcours.supprimer',
        'action.inscription.session.creer', 'action.inscription.session.modifier', 'action.inscription.session.supprimer',
        'action.evaluation.bulletin.generer', 'action.evaluation.bulletin.modifier', 'action.evaluation.bulletin.publier', 'action.evaluation.bulletin.supprimer',
        'action.evaluation.deliberation.organiser', 'action.evaluation.deliberation.creer', 'action.evaluation.deliberation.modifier', 'action.evaluation.deliberation.supprimer',
        'action.evaluation.deliberation.charger-resultats', 'action.evaluation.deliberation.modifier-resultat', 'action.evaluation.deliberation.cloturer',
        'action.evaluation.rattrapage.assigner', 'action.evaluation.rattrapage.notifier', 'action.evaluation.rattrapage.saisir-notes',
        'action.cours.note.saisir', 'action.cours.note.modifier',
    ],
    'Bibliothécaire': [
        'menu.tableau-de-bord',
        'menu.parametres', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'Comité': [
        'menu.tableau-de-bord', 'menu.comite-orientation', 'menu.comite-orientation.preinscriptions',
        'menu.finances.comite-validation', 'menu.bourses.configurations', 'menu.bourses.attributions',
        'menu.bourses.campagne', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'ESA Compta': [
        'menu.tableau-de-bord', 'menu.finances', 'menu.finances.bordereaux-a-traiter',
        'menu.finances.types-bordereaux', 'menu.finances.situation-financiere', 'menu.finances.impayes',
        'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'Personnel administratif': [
        'menu.tableau-de-bord', 'menu.secretariat.dashboard', 'menu.secretariat.demandes',
        'menu.secretariat.encaissement', 'menu.secretariat.caisse', 'menu.secretariat.types-documents',
        'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'Ressources Humaines': [
        'menu.tableau-de-bord', 'menu.rh', 'menu.rh.employes', 'menu.rh.paie',
        'menu.rh.demandes-conge', 'menu.rh.soldes-conge', 'menu.rh.reportings',
        'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
    'Secrétaire': [
        'menu.tableau-de-bord', 'menu.secretariat.dashboard', 'menu.secretariat.demandes',
        'menu.secretariat.encaissement', 'menu.secretariat.caisse', 'menu.secretariat.cloture',
        'menu.secretariat.autorisations-provisoires', 'menu.secretariat.types-documents',
        'menu.secretariat.journal', 'menu.parametres.mon-profil', 'menu.parametres.mon-compte',
    ],
};

export class RoleSeed {
    static async init(adminUserId?: number): Promise<void> {
        try {
            for (const roleData of DEFAULT_ROLES) {
                const [role, created] = await Role.findOrCreate({
                    where: { nom: roleData.nom },
                    defaults: { nom: roleData.nom, description: roleData.description },
                });
                if (!created) continue;

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

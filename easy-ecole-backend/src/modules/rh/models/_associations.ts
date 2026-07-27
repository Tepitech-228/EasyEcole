import { RhDepartement } from "./RhDepartement";
import { RhEmploye } from "./RhEmploye";
import { RhPoste } from "./RhPoste";
import { RhTypeContrat } from "./RhTypeContrat";
import { RhOffreEmploi } from "./RhOffreEmploi";
import { RhCandidature } from "./RhCandidature";
import { RhEntretien } from "./RhEntretien";
import { RhFormation } from "./RhFormation";
import { RhParticipationFormation } from "./RhParticipationFormation";
import { RhCritereEvaluation } from "./RhCritereEvaluation";
import { RhFicheEvaluation } from "./RhFicheEvaluation";
import { RhEvaluationCritere } from "./RhEvaluationCritere";
import { RhRubriquePaie } from "./RhRubriquePaie";
import { RhPeriodePaie } from "./RhPeriodePaie";
import { RhBulletinPaie } from "./RhBulletinPaie";
import { RhLigneBulletin } from "./RhLigneBulletin";
import { RhPrestationEnseignant } from "./RhPrestationEnseignant";
import { RhContratEnseignant } from "./RhContratEnseignant";
import { RhPlanningPersonnel } from "./RhPlanningPersonnel";
import { RhCategorieProfessionnelle } from "./RhCategorieProfessionnelle";
import { RhGrilleSalariale } from "./RhGrilleSalariale";
import { RhHeureSupplementaire } from "./RhHeureSupplementaire";
import { RhPret } from "./RhPret";
import { RhRemboursementPret } from "./RhRemboursementPret";
import { RhPrestataire } from "./RhPrestataire";
import { RhIndemnitePrestataire } from "./RhIndemnitePrestataire";
import { RhDemandeConge } from "./RhDemandeConge";
import { RhSoldeConge } from "./RhSoldeConge";

// Departement - Poste
RhDepartement.hasMany(RhPoste, { foreignKey: 'departementId', as: 'postes' })
RhPoste.belongsTo(RhDepartement, { as: 'departement', foreignKey: 'departementId' })

// Departement - Employe
RhDepartement.hasMany(RhEmploye, { foreignKey: 'departementId', as: 'employes' })
RhEmploye.belongsTo(RhDepartement, { as: 'departement', foreignKey: 'departementId' })

// Poste - Employe
RhPoste.hasMany(RhEmploye, { foreignKey: 'posteId', as: 'employes' })
RhEmploye.belongsTo(RhPoste, { as: 'poste', foreignKey: 'posteId' })

// TypeContrat - Employe
RhTypeContrat.hasMany(RhEmploye, { foreignKey: 'typeContratId', as: 'employes' })
RhEmploye.belongsTo(RhTypeContrat, { as: 'typeContrat', foreignKey: 'typeContratId' })

// Poste - OffreEmploi
RhPoste.hasMany(RhOffreEmploi, { foreignKey: 'posteId', as: 'offresEmploi' })
RhOffreEmploi.belongsTo(RhPoste, { as: 'poste', foreignKey: 'posteId' })

// OffreEmploi - Candidature
RhOffreEmploi.hasMany(RhCandidature, { foreignKey: 'offreId', as: 'candidatures' })
RhCandidature.belongsTo(RhOffreEmploi, { as: 'offre', foreignKey: 'offreId' })

// Candidature - Entretien
RhCandidature.hasMany(RhEntretien, { foreignKey: 'candidatureId', as: 'entretiens' })
RhEntretien.belongsTo(RhCandidature, { as: 'candidature', foreignKey: 'candidatureId' })

// Formation - ParticipationFormation
RhFormation.hasMany(RhParticipationFormation, { foreignKey: 'formationId', as: 'participations' })
RhParticipationFormation.belongsTo(RhFormation, { as: 'formation', foreignKey: 'formationId' })

// Employe - ParticipationFormation
RhEmploye.hasMany(RhParticipationFormation, { foreignKey: 'employeId', as: 'participationsFormation' })
RhParticipationFormation.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// FicheEvaluation - EvaluationCritere
RhFicheEvaluation.hasMany(RhEvaluationCritere, { foreignKey: 'ficheId', as: 'evaluationsCriteres' })
RhEvaluationCritere.belongsTo(RhFicheEvaluation, { as: 'fiche', foreignKey: 'ficheId' })

// CritereEvaluation - EvaluationCritere
RhCritereEvaluation.hasMany(RhEvaluationCritere, { foreignKey: 'critereId', as: 'evaluationsCriteres' })
RhEvaluationCritere.belongsTo(RhCritereEvaluation, { as: 'critere', foreignKey: 'critereId' })

// Employe - FicheEvaluation
RhEmploye.hasMany(RhFicheEvaluation, { foreignKey: 'employeId', as: 'fichesEvaluation' })
RhFicheEvaluation.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// PeriodePaie - BulletinPaie
RhPeriodePaie.hasMany(RhBulletinPaie, { foreignKey: 'periodeId', as: 'bulletinsPaie' })
RhBulletinPaie.belongsTo(RhPeriodePaie, { as: 'periode', foreignKey: 'periodeId' })

// Employe - BulletinPaie
RhEmploye.hasMany(RhBulletinPaie, { foreignKey: 'employeId', as: 'bulletinsPaie' })
RhBulletinPaie.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// BulletinPaie - LigneBulletin
RhBulletinPaie.hasMany(RhLigneBulletin, { foreignKey: 'bulletinId', as: 'lignesBulletin' })
RhLigneBulletin.belongsTo(RhBulletinPaie, { as: 'bulletin', foreignKey: 'bulletinId' })

// RubriquePaie - LigneBulletin
RhRubriquePaie.hasMany(RhLigneBulletin, { foreignKey: 'rubriqueId', as: 'lignesBulletin' })
RhLigneBulletin.belongsTo(RhRubriquePaie, { as: 'rubrique', foreignKey: 'rubriqueId' })

// Employe - PrestationEnseignant
RhEmploye.hasMany(RhPrestationEnseignant, { foreignKey: 'enseignantId', as: 'prestationsEnseignant' })
RhPrestationEnseignant.belongsTo(RhEmploye, { as: 'enseignant', foreignKey: 'enseignantId' })

// Employe - ContratEnseignant
RhEmploye.hasMany(RhContratEnseignant, { foreignKey: 'employeId', as: 'contratsEnseignant' })
RhContratEnseignant.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// Employe - PlanningPersonnel
RhEmploye.hasMany(RhPlanningPersonnel, { foreignKey: 'employeId', as: 'planningsPersonnel' })
RhPlanningPersonnel.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// CategorieProfessionnelle - GrilleSalariale
RhCategorieProfessionnelle.hasMany(RhGrilleSalariale, { foreignKey: 'categorieId', as: 'grillesSalariales' })
RhGrilleSalariale.belongsTo(RhCategorieProfessionnelle, { as: 'categorie', foreignKey: 'categorieId' })

// RhRubriquePaie - Poste / Categorie
RhRubriquePaie.belongsTo(RhPoste, { as: 'poste', foreignKey: 'posteId' })
RhPoste.hasMany(RhRubriquePaie, { foreignKey: 'posteId', as: 'rubriquesPaie' })
RhRubriquePaie.belongsTo(RhCategorieProfessionnelle, { as: 'categoriePro', foreignKey: 'categorieId' })
RhCategorieProfessionnelle.hasMany(RhRubriquePaie, { foreignKey: 'categorieId', as: 'rubriquesPaie' })

// Poste - GrilleSalariale
RhPoste.hasMany(RhGrilleSalariale, { foreignKey: 'posteId', as: 'grillesSalariales' })
RhGrilleSalariale.belongsTo(RhPoste, { as: 'poste', foreignKey: 'posteId' })

// Employe - HeureSupplementaire
RhEmploye.hasMany(RhHeureSupplementaire, { foreignKey: 'employeId', as: 'heuresSupplementaires' })
RhHeureSupplementaire.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// Employe - Pret
RhEmploye.hasMany(RhPret, { foreignKey: 'employeId', as: 'prets' })
RhPret.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// Pret - RemboursementPret
RhPret.hasMany(RhRemboursementPret, { foreignKey: 'pretId', as: 'remboursements' })
RhRemboursementPret.belongsTo(RhPret, { as: 'pret', foreignKey: 'pretId' })

// Prestataire - IndemnitePrestataire
RhPrestataire.hasMany(RhIndemnitePrestataire, { foreignKey: 'prestataireId', as: 'indemnites' })
RhIndemnitePrestataire.belongsTo(RhPrestataire, { as: 'prestataire', foreignKey: 'prestataireId' })

// Employe - DemandeConge
RhEmploye.hasMany(RhDemandeConge, { foreignKey: 'employeId', as: 'demandesConge' })
RhDemandeConge.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

// Employe - SoldeConge
RhEmploye.hasMany(RhSoldeConge, { foreignKey: 'employeId', as: 'soldesConge' })
RhSoldeConge.belongsTo(RhEmploye, { as: 'employe', foreignKey: 'employeId' })

/**
 * Script de migration : ajoute toutes les colonnes manquantes dans la base de données
 * en comparant les modèles Sequelize avec les tables réelles.
 * 
 * Exécution : npx ts-node fix_missing_columns.ts
 */
import { DatabaseConnection } from "./src/core/helpers/DatabaseConnection";
import { DataTypes, QueryInterface } from "sequelize";

async function fix() {
  const db = DatabaseConnection.getInstance();
  await db.init();
  const sequelize = db.sequelize;
  const qi = sequelize.getQueryInterface();

  // Map of table -> { column -> type definition }
  // Built by extracting all columns from model init() definitions across all modules
  const expectedColumns: Record<string, Record<string, { type: string, allowNull?: boolean, defaultValue?: any }>> = {

    // ==================== INSCRIPTION (prefix: ins_) ====================
    'ins_annees_academiques': { libelle: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'ins_classes': { libelle: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, capaciteMax: { type: 'INTEGER' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, parcoursId: { type: 'INTEGER UNSIGNED' } },
    'ins_cours': { code: { type: 'VARCHAR(255)' }, parcoursId: { type: 'INTEGER UNSIGNED' }, intitule: { type: 'VARCHAR(255)' }, classeId: { type: 'INTEGER UNSIGNED' }, enseignantId: { type: 'INTEGER UNSIGNED' }, credit: { type: 'INTEGER' }, creditEcts: { type: 'INTEGER' }, objectifs: { type: 'TEXT' }, estObligatoire: { type: 'TINYINT(1)', defaultValue: false }, description: { type: 'TEXT' }, semestre: { type: 'INTEGER' }, volumeHoraire: { type: 'INTEGER' }, coefficient: { type: 'FLOAT' } },
    'ins_cursus_apprenants': { externe: { type: 'TINYINT(1)', defaultValue: false }, etablissementId: { type: 'INTEGER UNSIGNED' }, intituleParcours: { type: 'VARCHAR(255)' }, parcoursId: { type: 'INTEGER UNSIGNED' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, classeId: { type: 'INTEGER UNSIGNED' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' }, demandeInscriptionId: { type: 'INTEGER UNSIGNED' }, utilisateurId: { type: 'INTEGER UNSIGNED' } },
    'ins_dossiers_etudiants': { matricule: { type: 'VARCHAR(255)' }, codeQR: { type: 'TEXT' }, photo: { type: 'VARCHAR(255)' }, cartePath: { type: 'VARCHAR(255)' }, carteGeneree: { type: 'TINYINT(1)', defaultValue: false }, statut: { type: "ENUM('actif','suspendu','archive')", defaultValue: 'actif' }, dateCreation: { type: 'DATE' }, fraisScolarite: { type: 'FLOAT' }, modePaiement: { type: "ENUM('unique','mensuel')" }, nbMensualites: { type: 'INTEGER' }, demarrageParcours: { type: 'DATE' } },
    'ins_bordereaux': { echeanceId: { type: 'INTEGER UNSIGNED' }, utilisateurId: { type: 'INTEGER UNSIGNED' }, type: { type: "ENUM('inscription','scolarite')" }, fichier: { type: 'VARCHAR(255)' }, montant: { type: 'FLOAT' }, referenceBancaire: { type: 'VARCHAR(255)' }, statut: { type: "ENUM('en_attente','valide','rejete')", defaultValue: 'en_attente' }, dateSoumission: { type: 'DATE' }, dateValidation: { type: 'DATE' }, valideParId: { type: 'INTEGER UNSIGNED' }, commentaire: { type: 'TEXT' }, quitusId: { type: 'INTEGER UNSIGNED' } },
    'ins_echeances': { dossierEtudiantId: { type: 'INTEGER UNSIGNED' }, type: { type: "ENUM('inscription','scolarite')" }, numeroEcheance: { type: 'INTEGER' }, montant: { type: 'FLOAT' }, devise: { type: 'VARCHAR(255)', defaultValue: 'XAF' }, dateLimite: { type: 'DATE' }, datePaiement: { type: 'DATE' }, statut: { type: "ENUM('impaye','paye','en_retard')", defaultValue: 'impaye' }, moisConcerne: { type: 'VARCHAR(255)' } },
    'ins_salles_de_classes': { libelle: { type: 'VARCHAR(255)' }, description: { type: 'VARCHAR(255)' }, capacite: { type: 'INTEGER', defaultValue: 30 }, equipements: { type: 'VARCHAR(255)' }, localisationId: { type: 'INTEGER UNSIGNED' }, classeId: { type: 'INTEGER UNSIGNED' } },
    'ins_seances': { titre: { type: 'VARCHAR(255)' }, jourSemaine: { type: 'VARCHAR(255)' }, salle: { type: 'VARCHAR(255)' }, coursId: { type: 'INTEGER UNSIGNED' }, enseignantId: { type: 'INTEGER UNSIGNED' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, description: { type: 'TEXT' }, heureDebut: { type: 'TIME' }, heureFin: { type: 'TIME' }, salleDeClasseId: { type: 'INTEGER UNSIGNED' } },
    'ins_demandes_inscription': { matricule: { type: 'VARCHAR(255)' }, dateDemande: { type: 'DATE' }, dateValidation: { type: 'DATE' }, sessionId: { type: 'INTEGER UNSIGNED' }, utilisateurId: { type: 'INTEGER UNSIGNED' } },
    'ins_pre_inscriptions': { statut: { type: 'VARCHAR(255)' }, commentaire: { type: 'TEXT' }, dateTraitement: { type: 'DATE' }, autorisationPDF: { type: 'VARCHAR(255)' }, demandeInscriptionId: { type: 'INTEGER UNSIGNED' }, traiteParId: { type: 'INTEGER UNSIGNED' } },
    'ins_sessions': { dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, description: { type: 'TEXT' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' } },
    'ins_absences': { noteEvaluationId: { type: 'INTEGER UNSIGNED' }, type: { type: 'VARCHAR(255)' }, motif: { type: 'TEXT' }, justificatif: { type: 'VARCHAR(255)' }, declareLe: { type: 'DATE' } },
    'ins_presences': { date: { type: 'DATE' }, heureDebut: { type: 'TIME' }, heureFin: { type: 'TIME' }, signature: { type: 'TEXT' }, signedAt: { type: 'DATE' } },
    'ins_liste_presences': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'ins_cours_participants': { utilisateurId: { type: 'INTEGER UNSIGNED' }, coursId: { type: 'INTEGER UNSIGNED' }, cursusApprenantId: { type: 'INTEGER UNSIGNED' } },
    'ins_paiements_inscription': { numero: { type: 'VARCHAR(255)' }, datePaiement: { type: 'DATE' }, description: { type: 'TEXT' }, montant: { type: 'FLOAT' }, matriculeInscription: { type: 'VARCHAR(255)' }, references: { type: 'VARCHAR(255)' }, type: { type: 'VARCHAR(255)' }, utilisateurId: { type: 'INTEGER UNSIGNED' } },
    'ins_quitus': { code: { type: 'VARCHAR(255)' }, paiementInscriptionId: { type: 'INTEGER UNSIGNED' }, bordereauId: { type: 'INTEGER UNSIGNED' }, dateEmission: { type: 'DATE' }, fichierPDF: { type: 'VARCHAR(255)' }, statut: { type: 'VARCHAR(255)' } },
    'ins_niveaux_etudes': { libelle: { type: 'VARCHAR(255)' } },
    'ins_parcours': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, type: { type: 'VARCHAR(255)' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, dureeDeFormation: { type: 'VARCHAR(255)' }, image: { type: 'VARCHAR(255)' }, videoExplicative: { type: 'VARCHAR(255)' }, contenu: { type: 'TEXT' } },
    'ins_sessions_examens': { libelle: { type: 'VARCHAR(255)' }, type: { type: 'VARCHAR(255)' }, classeId: { type: 'INTEGER UNSIGNED' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' }, semestre: { type: 'INTEGER' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, statut: { type: 'VARCHAR(255)' }, observations: { type: 'TEXT' } },
    'ins_etapes_inscription': { libelle: { type: 'VARCHAR(255)' }, ordre: { type: 'INTEGER' } },
    'ins_dossiers_inscription': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, tailleMax: { type: 'INTEGER' }, sessionId: { type: 'INTEGER UNSIGNED' } },
    'ins_frais_inscription': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, montant: { type: 'FLOAT' }, fraisDesCours: { type: 'TINYINT(1)' }, sessionId: { type: 'INTEGER UNSIGNED' } },
    'ins_frais_parcours': { parcoursId: { type: 'INTEGER UNSIGNED' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' }, montantInscription: { type: 'FLOAT' }, montantScolarite: { type: 'FLOAT' }, nbMensualites: { type: 'INTEGER' }, fraisBibliotheque: { type: 'FLOAT' }, fraisAssurance: { type: 'FLOAT' }, fraisLogement: { type: 'FLOAT' }, autresFrais: { type: 'FLOAT' } },
    'ins_reduction_frais': { type: { type: 'VARCHAR(255)' }, mode: { type: 'VARCHAR(255)' }, valeur: { type: 'FLOAT' }, description: { type: 'TEXT' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, actif: { type: 'TINYINT(1)', defaultValue: true } },
    'ins_penalite_retard': { type: { type: 'VARCHAR(255)' }, pourcentage: { type: 'FLOAT' }, nbJoursGrace: { type: 'INTEGER' }, montantMaximum: { type: 'FLOAT' }, actif: { type: 'TINYINT(1)', defaultValue: true } },
    'ins_cahiers_de_texte': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'ins_blocs_cahier_de_texte': { date: { type: 'DATE' }, heureDebut: { type: 'TIME' }, heureFin: { type: 'TIME' }, contenu: { type: 'TEXT' } },
    'ins_chapitres_cours': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, image: { type: 'VARCHAR(255)' } },

    // ==================== STOCK (prefix: stk_) ====================
    'stk_article': { nom: { type: 'VARCHAR(255)' }, reference: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, categorieId: { type: 'INTEGER UNSIGNED' }, siteId: { type: 'INTEGER UNSIGNED' }, salleDeClasseId: { type: 'INTEGER UNSIGNED' }, stockActuel: { type: 'INTEGER', defaultValue: 0 }, stockMinimum: { type: 'INTEGER', defaultValue: 5 }, prixUnitaire: { type: 'DECIMAL(10,2)' }, statut: { type: "ENUM('actif','obsolete','reforme','en_rupture')", defaultValue: 'actif' }, dateMiseEnService: { type: 'DATE' }, dureeVieEstimee: { type: 'INTEGER' }, dateFinVie: { type: 'DATE' }, motifFinVie: { type: 'TEXT' } },
    'stk_mouvement_stock': { articleId: { type: 'INTEGER UNSIGNED' }, type: { type: "ENUM('entree','sortie')" }, quantite: { type: 'INTEGER' }, motif: { type: 'VARCHAR(255)' }, fournisseurId: { type: 'INTEGER UNSIGNED' }, siteId: { type: 'INTEGER UNSIGNED' }, prixUnitaire: { type: 'DECIMAL(10,2)' }, dateMouvement: { type: 'DATE' }, utilisateurId: { type: 'INTEGER' } },
    'stk_fournisseur': { nom: { type: 'VARCHAR(255)' }, contact: { type: 'VARCHAR(255)' }, email: { type: 'VARCHAR(255)' }, telephone: { type: 'VARCHAR(255)' }, adresse: { type: 'TEXT' } },
    'stk_categorie_article': { nom: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'stk_bon_commande': { siteId: { type: 'INTEGER UNSIGNED' }, dateCommande: { type: 'DATE' }, dateLivraisonPrevue: { type: 'DATE' }, statut: { type: 'VARCHAR(255)' }, montantTotal: { type: 'DECIMAL(10,2)' } },
    'stk_ligne_bon_commande': { quantite: { type: 'INTEGER' }, prixUnitaire: { type: 'DECIMAL(10,2)' } },
    'stk_besoin': { articleId: { type: 'INTEGER UNSIGNED' }, quantiteRequise: { type: 'INTEGER' }, quantiteApprouvee: { type: 'INTEGER' }, urgence: { type: 'VARCHAR(255)' }, motif: { type: 'TEXT' }, statut: { type: 'VARCHAR(255)' }, dateBesoin: { type: 'DATE' } },
    'stk_correction_stock': { articleId: { type: 'INTEGER UNSIGNED' }, quantiteAvant: { type: 'INTEGER' }, quantiteApres: { type: 'INTEGER' }, motif: { type: 'TEXT' }, dateCorrection: { type: 'DATE' } },
    'stk_demande_prix': { articleId: { type: 'INTEGER UNSIGNED' }, fournisseurId: { type: 'INTEGER UNSIGNED' }, prixPropose: { type: 'DECIMAL(10,2)' }, quantite: { type: 'INTEGER' }, delaiLivraison: { type: 'INTEGER' }, dateValidite: { type: 'DATE' }, statut: { type: 'VARCHAR(255)' } },
    'stk_inventaire_stock': { reference: { type: 'VARCHAR(255)' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, statut: { type: 'VARCHAR(255)' } },
    'stk_ligne_inventaire_stock': { inventaireId: { type: 'INTEGER UNSIGNED' }, articleId: { type: 'INTEGER UNSIGNED' }, quantiteTheorique: { type: 'INTEGER' }, quantiteReelle: { type: 'INTEGER' }, ecart: { type: 'INTEGER' }, commentaire: { type: 'TEXT' } },
    'stk_rebut': { articleId: { type: 'INTEGER UNSIGNED' }, quantite: { type: 'INTEGER' }, motif: { type: 'TEXT' }, dateRebut: { type: 'DATE' }, coutEstime: { type: 'DECIMAL(10,2)' } },
    'stk_transferts': { articleId: { type: 'INTEGER UNSIGNED' }, quantite: { type: 'INTEGER' }, sourceStockId: { type: 'INTEGER UNSIGNED' }, destinationStockId: { type: 'INTEGER UNSIGNED' }, motif: { type: 'TEXT' }, statut: { type: 'VARCHAR(255)' } },

    // ==================== COMPTABILITE (prefix: cpt_) ====================
    'cpt_ecritures_comptables': { journalId: { type: 'INTEGER UNSIGNED' }, numeroEcriture: { type: 'VARCHAR(50)' }, dateEcriture: { type: 'DATE' }, dateComptable: { type: 'DATE' }, compteDebitId: { type: 'INTEGER UNSIGNED' }, compteCreditId: { type: 'INTEGER UNSIGNED' }, montant: { type: 'FLOAT' }, libelle: { type: 'TEXT' }, reference: { type: 'VARCHAR(100)' }, pieceJustificative: { type: 'VARCHAR(255)' }, moduleSource: { type: 'VARCHAR(50)' }, referenceModuleId: { type: 'VARCHAR(50)' }, utilisateurSaisieId: { type: 'INTEGER UNSIGNED' }, validee: { type: 'TINYINT(1)', defaultValue: false }, utilisateurValidationId: { type: 'INTEGER UNSIGNED' }, dateValidation: { type: 'DATE' }, observations: { type: 'TEXT' }, lettre: { type: 'VARCHAR(10)' }, dateLettrage: { type: 'DATE' } },
    'cpt_comptes_bancaires': { banque: { type: 'VARCHAR(255)' }, rib: { type: 'VARCHAR(255)' }, iban: { type: 'VARCHAR(255)' }, swift: { type: 'VARCHAR(255)' }, titulaire: { type: 'VARCHAR(255)' }, numeroCompte: { type: 'VARCHAR(255)' }, solde: { type: 'DECIMAL(10,2)' }, devise: { type: 'VARCHAR(10)' }, actif: { type: 'TINYINT(1)' } },
    'cpt_releves_bancaires': { compteBancaireId: { type: 'INTEGER UNSIGNED' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, soldeOuverture: { type: 'DECIMAL(10,2)' }, soldeFermeture: { type: 'DECIMAL(10,2)' }, reference: { type: 'VARCHAR(255)' }, statut: { type: 'VARCHAR(50)' } },
    'cpt_comptes': { numero: { type: 'VARCHAR(255)' }, libelle: { type: 'VARCHAR(255)' }, classe: { type: 'INTEGER' }, sousClasse: { type: 'INTEGER' }, nature: { type: 'VARCHAR(50)' }, categorie: { type: 'VARCHAR(50)' }, description: { type: 'TEXT' }, actif: { type: 'TINYINT(1)', defaultValue: true }, moduleSource: { type: 'VARCHAR(50)' } },
    'cpt_journaux_comptables': { code: { type: 'VARCHAR(10)' }, libelle: { type: 'VARCHAR(255)' }, type: { type: 'VARCHAR(50)' }, description: { type: 'TEXT' }, actif: { type: 'TINYINT(1)', defaultValue: true } },
    'cpt_lignes_releves_bancaires': { releveBancaireId: { type: 'INTEGER UNSIGNED' }, dateOperation: { type: 'DATE' }, dateValeur: { type: 'DATE' }, libelle: { type: 'VARCHAR(255)' }, reference: { type: 'VARCHAR(255)' }, montant: { type: 'DECIMAL(10,2)' }, type: { type: "ENUM('credit','debit')" }, rapprochee: { type: 'TINYINT(1)', defaultValue: false }, ecritureComptableId: { type: 'INTEGER UNSIGNED' }, dateRapprochement: { type: 'DATE' } },
    'cpt_lignes_frais_etudiant': { dossierEtudiantId: { type: 'INTEGER UNSIGNED' }, type: { type: 'VARCHAR(50)' }, montant: { type: 'DECIMAL(10,2)' }, reductionId: { type: 'INTEGER UNSIGNED' }, paye: { type: 'TINYINT(1)', defaultValue: false }, solde: { type: 'DECIMAL(10,2)' } },
    'cpt_penalites_retard': { echeanceId: { type: 'INTEGER UNSIGNED' }, montant: { type: 'DECIMAL(10,2)' }, calcul: { type: 'TEXT' }, dateApplication: { type: 'DATE' }, payee: { type: 'TINYINT(1)', defaultValue: false } },
    'cpt_reductions_frais': { dossierEtudiantId: { type: 'INTEGER UNSIGNED' }, type: { type: 'VARCHAR(50)' }, montant: { type: 'DECIMAL(10,2)' }, pourcentage: { type: 'FLOAT' }, validePar: { type: 'INTEGER UNSIGNED' }, dateValidation: { type: 'DATE' }, motif: { type: 'TEXT' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' } },

    // ==================== DOCGEN (prefix: docgen_) ====================
    'docgen_cachets': { libelle: { type: 'VARCHAR(255)' }, imagePath: { type: 'VARCHAR(255)' }, positionX: { type: 'INTEGER' }, positionY: { type: 'INTEGER' }, width: { type: 'INTEGER' }, height: { type: 'INTEGER' }, isActive: { type: 'TINYINT(1)', defaultValue: true } },
    'docgen_documents': { typeId: { type: 'INTEGER UNSIGNED' }, templateId: { type: 'INTEGER UNSIGNED' }, reference: { type: 'VARCHAR(255)' }, statut: { type: 'VARCHAR(50)' }, filePath: { type: 'VARCHAR(255)' }, hash: { type: 'VARCHAR(255)' }, metadata: { type: 'TEXT' }, sourceType: { type: 'VARCHAR(50)' }, sourceId: { type: 'INTEGER' }, generatedById: { type: 'INTEGER UNSIGNED' }, version: { type: 'INTEGER' } },
    'docgen_signatures': { documentId: { type: 'INTEGER UNSIGNED' }, signataireId: { type: 'INTEGER UNSIGNED' }, signataireType: { type: 'VARCHAR(50)' }, type: { type: 'VARCHAR(50)' }, statut: { type: 'VARCHAR(50)' }, signatureData: { type: 'TEXT' }, commentaire: { type: 'TEXT' }, signedAt: { type: 'DATE' } },
    'docgen_templates': { typeId: { type: 'INTEGER UNSIGNED' }, libelle: { type: 'VARCHAR(255)' }, contenu: { type: 'TEXT' }, variables: { type: 'TEXT' }, version: { type: 'INTEGER' }, isDefault: { type: 'TINYINT(1)', defaultValue: false } },
    'docgen_types': { code: { type: 'VARCHAR(50)' }, libelle: { type: 'VARCHAR(255)' }, categorie: { type: 'VARCHAR(50)' }, moduleSource: { type: 'VARCHAR(50)' }, description: { type: 'TEXT' }, signatureRequired: { type: 'TINYINT(1)', defaultValue: false }, dua: { type: 'INTEGER' }, autoGenerated: { type: 'TINYINT(1)', defaultValue: false }, format: { type: 'VARCHAR(50)' } },
    'docgen_workflows': { typeId: { type: 'INTEGER UNSIGNED' }, ordre: { type: 'INTEGER' }, role: { type: 'VARCHAR(50)' }, libelle: { type: 'VARCHAR(255)' }, delaiHeures: { type: 'INTEGER' } },
    'docgen_references': { typeId: { type: 'INTEGER UNSIGNED' }, annee: { type: 'INTEGER' }, compteur: { type: 'INTEGER' } },

    // ==================== QUALITE (prefix: qua_) ====================
    'qua_actions_correctives': { nonConformiteId: { type: 'INTEGER UNSIGNED' }, type: { type: 'VARCHAR(50)' }, description: { type: 'TEXT' }, responsableId: { type: 'INTEGER UNSIGNED' }, dateLimite: { type: 'DATE' }, statut: { type: 'VARCHAR(50)' }, efficacite: { type: 'VARCHAR(50)' } },
    'qua_audits': { type: { type: 'VARCHAR(50)' }, titre: { type: 'VARCHAR(255)' }, processus: { type: 'VARCHAR(255)' }, datePlanifiee: { type: 'DATE' }, dateRealisation: { type: 'DATE' }, equipe: { type: 'TEXT' }, referentiel: { type: 'VARCHAR(255)' }, constats: { type: 'TEXT' }, conclusion: { type: 'TEXT' }, statut: { type: 'VARCHAR(50)' } },
    'qua_audit_pistes': { auditId: { type: 'INTEGER UNSIGNED' }, reference: { type: 'VARCHAR(255)' }, critere: { type: 'VARCHAR(255)' }, constat: { type: 'TEXT' }, note: { type: 'INTEGER' }, conforme: { type: 'TINYINT(1)' } },
    'qua_decisions_revue': { revueDirectionId: { type: 'INTEGER UNSIGNED' }, decision: { type: 'TEXT' }, responsableId: { type: 'INTEGER UNSIGNED' }, dateEcheance: { type: 'DATE' }, statut: { type: 'VARCHAR(50)' } },
    'qua_enquetes_satisfaction': { titre: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, cible: { type: 'VARCHAR(50)' }, questions: { type: 'TEXT' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, statut: { type: 'VARCHAR(50)' } },
    'qua_non_conformites': { type: { type: 'VARCHAR(50)' }, source: { type: 'VARCHAR(255)' }, processus: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, cause: { type: 'TEXT' }, statut: { type: 'VARCHAR(50)' }, priorite: { type: 'VARCHAR(50)' }, declareePar: { type: 'INTEGER UNSIGNED' }, declareeLe: { type: 'DATE' }, clotureeLe: { type: 'DATE' } },
    'qua_reponses_satisfaction': { enqueteSatisfactionId: { type: 'INTEGER UNSIGNED' }, utilisateurId: { type: 'INTEGER UNSIGNED' }, reponses: { type: 'TEXT' }, commentaire: { type: 'TEXT' }, soumiseLe: { type: 'DATE' } },
    'qua_revues_direction': { titre: { type: 'VARCHAR(255)' }, dateTenue: { type: 'DATE' }, participants: { type: 'TEXT' }, ordreJour: { type: 'TEXT' }, compteRendu: { type: 'TEXT' }, statut: { type: 'VARCHAR(50)' } },

    // ==================== ACHATS (prefix: ach_) ====================
    'ach_fournisseurs': { nom: { type: 'VARCHAR(255)' }, contact: { type: 'VARCHAR(255)' }, email: { type: 'VARCHAR(255)' }, telephone: { type: 'VARCHAR(255)' }, adresse: { type: 'TEXT' } },
    'ach_budgets': { periode: { type: 'VARCHAR(50)' }, montantAlloue: { type: 'DECIMAL(10,2)' }, montantUtilise: { type: 'DECIMAL(10,2)' } },
    'ach_commandes': { dateCommande: { type: 'DATE' }, statut: { type: 'VARCHAR(50)' } },
    'ach_demandes': { description: { type: 'TEXT' }, statut: { type: 'VARCHAR(50)' }, dateSoumission: { type: 'DATE' } },
    'ach_categories': { nom: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'ach_engagements': { montant: { type: 'DECIMAL(10,2)' }, date: { type: 'DATE' }, statut: { type: 'VARCHAR(50)' } },
    'ach_lignes_budget': { montantAlloue: { type: 'DECIMAL(10,2)' }, montantUtilise: { type: 'DECIMAL(10,2)' } },
    'ach_lignes_commande': { designation: { type: 'VARCHAR(255)' }, quantite: { type: 'INTEGER' }, prixUnitaire: { type: 'DECIMAL(10,2)' }, total: { type: 'DECIMAL(10,2)' }, gereEnStock: { type: 'TINYINT(1)' }, actifImmobilise: { type: 'TINYINT(1)' } },
    'ach_lignes_demande': { designation: { type: 'VARCHAR(255)' }, quantite: { type: 'INTEGER' }, prixEstime: { type: 'DECIMAL(10,2)' }, unite: { type: 'VARCHAR(50)' } },
    'ach_lignes_facture': { designation: { type: 'VARCHAR(255)' }, quantite: { type: 'INTEGER' }, prixUnitaire: { type: 'DECIMAL(10,2)' }, total: { type: 'DECIMAL(10,2)' } },
    'ach_lignes_reception': { quantiteRecue: { type: 'INTEGER' } },
    'ach_receptions': { date: { type: 'DATE' }, statut: { type: 'VARCHAR(50)' }, notes: { type: 'TEXT' } },
    'ach_factures_proforma': { dateEmission: { type: 'DATE' }, montantTotal: { type: 'DECIMAL(10,2)' }, statut: { type: 'VARCHAR(50)' } },
    'ach_validateurs': { niveau: { type: 'INTEGER' }, montantMax: { type: 'DECIMAL(10,2)' }, actif: { type: 'TINYINT(1)', defaultValue: true } },
    'ach_validations': { statut: { type: 'VARCHAR(50)' }, commentaire: { type: 'TEXT' }, date: { type: 'DATE' } },

    // ==================== GED (prefix: ged_) ====================
    'ged_domains': { code: { type: 'VARCHAR(50)' }, label: { type: 'VARCHAR(255)' } },
    'ged_documents': { titre: { type: 'VARCHAR(255)' }, reference: { type: 'VARCHAR(255)' }, type: { type: 'VARCHAR(50)' }, statut: { type: 'VARCHAR(50)' }, fichier: { type: 'VARCHAR(255)' }, domainId: { type: 'INTEGER UNSIGNED' }, documentTypeId: { type: 'INTEGER UNSIGNED' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' }, parcoursId: { type: 'INTEGER UNSIGNED' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, classeId: { type: 'INTEGER UNSIGNED' }, folderId: { type: 'INTEGER UNSIGNED' }, sessionId: { type: 'INTEGER UNSIGNED' }, uploaderId: { type: 'INTEGER UNSIGNED' }, metadata: { type: 'TEXT' }, taille: { type: 'INTEGER' }, nbPages: { type: 'INTEGER' }, auteur: { type: 'VARCHAR(255)' }, dateDocument: { type: 'DATE' }, contenuTexte: { type: 'TEXT' }, destinataire: { type: 'VARCHAR(255)' }, dateEnvoi: { type: 'DATE' }, modeEnvoi: { type: 'VARCHAR(50)' }, accuseReception: { type: 'TINYINT(1)' }, numeroCourrier: { type: 'VARCHAR(50)' }, verificationCode: { type: 'VARCHAR(50)' }, duaEndDate: { type: 'DATE' }, lifecycleStatus: { type: 'VARCHAR(50)' }, isArchived: { type: 'TINYINT(1)', defaultValue: false } },
    'ged_folders': { nom: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, parentId: { type: 'INTEGER UNSIGNED' }, domainId: { type: 'INTEGER UNSIGNED' }, createdBy: { type: 'INTEGER UNSIGNED' }, isAutoGenerated: { type: 'TINYINT(1)', defaultValue: false }, folderType: { type: 'VARCHAR(50)' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' } },
    'ged_document_types': { domainId: { type: 'INTEGER UNSIGNED' }, code: { type: 'VARCHAR(50)' }, shortCode: { type: 'VARCHAR(10)' }, label: { type: 'VARCHAR(255)' }, defaultConfidentiality: { type: 'VARCHAR(50)' }, duaDurationYears: { type: 'INTEGER' }, isPermanent: { type: 'TINYINT(1)', defaultValue: false } },
    'ged_sessions': { nom: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' }, startDate: { type: 'DATE' }, endDate: { type: 'DATE' }, folderId: { type: 'INTEGER UNSIGNED' }, categorie: { type: 'VARCHAR(50)' }, status: { type: 'VARCHAR(50)' }, fields: { type: 'TEXT' }, participantIds: { type: 'TEXT' }, createdBy: { type: 'INTEGER UNSIGNED' } },
    'ged_registre_courrier': { sens: { type: "ENUM('entrant','sortant')" }, numeroOrdre: { type: 'INTEGER' }, annee: { type: 'INTEGER' }, dateCourrier: { type: 'DATE' }, expediteur: { type: 'VARCHAR(255)' }, destinataire: { type: 'VARCHAR(255)' }, objet: { type: 'VARCHAR(255)' }, modeEnvoi: { type: 'VARCHAR(50)' }, accuseReception: { type: 'TINYINT(1)' }, referenceDocument: { type: 'VARCHAR(255)' }, annotations: { type: 'TEXT' }, documentId: { type: 'INTEGER UNSIGNED' }, utilisateurId: { type: 'INTEGER UNSIGNED' } },

    // ==================== AUTH (prefix: aut_) ====================
    'aut_utilisateurs': { nom: { type: 'VARCHAR(255)' }, prenoms: { type: 'VARCHAR(255)' }, identifiant: { type: 'VARCHAR(255)' }, email: { type: 'VARCHAR(255)' }, motDePasse: { type: 'VARCHAR(255)' }, role: { type: 'VARCHAR(50)' }, contact: { type: 'VARCHAR(255)' }, tokenVersion: { type: 'INTEGER', defaultValue: 0 }, photoDeProfil: { type: 'VARCHAR(255)' }, dateVerificationEmail: { type: 'DATE' } },
    'aut_apprenants': { photo: { type: 'VARCHAR(255)' }, qrCode: { type: 'TEXT' }, dateNaissance: { type: 'DATE' }, lieuNaissance: { type: 'VARCHAR(255)' } },
    'aut_enseignants': { photo: { type: 'VARCHAR(255)' }, qrCode: { type: 'TEXT' }, dateNaissance: { type: 'DATE' }, lieuNaissance: { type: 'VARCHAR(255)' }, fonction: { type: 'VARCHAR(255)' } },
    'aut_institutions': { dateNaissance: { type: 'DATE' }, lieuNaissance: { type: 'VARCHAR(255)' }, fonction: { type: 'VARCHAR(255)' } },
    'aut_roles': { nom: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'aut_permissions': { key: { type: 'VARCHAR(255)' }, libelle: { type: 'VARCHAR(255)' }, module: { type: 'VARCHAR(255)' }, type: { type: 'VARCHAR(50)' }, parentKey: { type: 'VARCHAR(255)' } },

    // ==================== RH (prefix: rh_) ====================
    'rh_employes': { utilisateurId: { type: 'INTEGER UNSIGNED' }, dateEmbauche: { type: 'DATE' }, salaireBase: { type: 'DECIMAL(10,2)' }, statut: { type: 'VARCHAR(50)' } },
    'rh_departements': { nom: { type: 'VARCHAR(255)' }, description: { type: 'TEXT' } },
    'rh_demandes_conge': { employeId: { type: 'INTEGER UNSIGNED' }, typeConge: { type: 'VARCHAR(50)' }, dateDebut: { type: 'DATE' }, dateFin: { type: 'DATE' }, duree: { type: 'INTEGER' }, motif: { type: 'TEXT' }, statut: { type: 'VARCHAR(50)' }, valideePar: { type: 'INTEGER UNSIGNED' }, commentaireValidation: { type: 'TEXT' } },
    'rh_bulletins_paie': { totalGains: { type: 'DECIMAL(10,2)' }, totalRetenues: { type: 'DECIMAL(10,2)' }, netAPayer: { type: 'DECIMAL(10,2)' }, statut: { type: 'VARCHAR(50)' } },

    // ==================== SCOLARITE (prefix: sco_) ====================
    'sco_conseils_classe': { classe: { type: 'VARCHAR(255)' }, date: { type: 'DATE' }, trimestre: { type: 'INTEGER' }, president: { type: 'VARCHAR(255)' }, statut: { type: 'VARCHAR(50)' } },
    'sco_demandes_document': { statut: { type: 'VARCHAR(50)' }, date: { type: 'DATE' }, fraisPayes: { type: 'TINYINT(1)' }, parcoursId: { type: 'INTEGER UNSIGNED' }, niveauEtudeId: { type: 'INTEGER UNSIGNED' }, classeId: { type: 'INTEGER UNSIGNED' }, anneeAcademiqueId: { type: 'INTEGER UNSIGNED' } },
    'sco_evenements_calendrier': { titre: { type: 'VARCHAR(255)' }, date: { type: 'DATE' }, description: { type: 'TEXT' }, type: { type: 'VARCHAR(50)' }, recurrence: { type: 'VARCHAR(50)' }, classeId: { type: 'INTEGER UNSIGNED' }, parcoursId: { type: 'INTEGER UNSIGNED' }, visibilite: { type: 'VARCHAR(50)' } },
  };

  let totalAdded = 0;
  let totalChecked = 0;

  for (const [table, columns] of Object.entries(expectedColumns)) {
    // Describe the table
    let tableInfo: any;
    try {
      tableInfo = await qi.describeTable(table);
    } catch (err: any) {
      console.log(`  ⚠ Table '${table}' n'existe pas en base. Essai de création via sync...`);
      // The table will be created by sync({alter: true}) on next server startup
      continue;
    }

    const existingColumns = Object.keys(tableInfo);
    totalChecked++;

    for (const [colName, colDef] of Object.entries(columns)) {
      if (!existingColumns.includes(colName)) {
        try {
          const options: any = {
            type: colDef.type,
            allowNull: colDef.allowNull !== undefined ? colDef.allowNull : true,
          };
          if (colDef.defaultValue !== undefined) {
            options.defaultValue = colDef.defaultValue;
          }
          await qi.addColumn(table, colName, options);
          console.log(`  ✓ ${table}.${colName} ajoutée (${colDef.type})`);
          totalAdded++;
        } catch (err: any) {
          console.error(`  ✗ ERREUR ${table}.${colName}: ${err.message}`);
        }
      }
    }
  }

  console.log(`\n=== RÉSULTATS: ${totalAdded} colonnes ajoutées sur ${totalChecked} tables vérifiées ===`);

  if (totalAdded === 0) {
    console.log("Toutes les colonnes sont déjà présentes en base.");
  } else {
    console.log("Redémarrez le serveur pour que les modifications soient prises en compte.");
  }

  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });

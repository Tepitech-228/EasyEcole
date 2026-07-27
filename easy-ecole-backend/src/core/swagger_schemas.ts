export const modelSchemas = {
  Absence: {
    type: 'object',
    description: "Modele Absence (table: )",
    properties: {
      noteEvaluationId: { type: 'integer' },
      type: { type: 'string' },
      motif: { type: 'string', nullable: true },
      justificatif: { type: 'string', nullable: true },
      declareLe: { type: 'string', nullable: true },
    }
  },
  Acquisition: {
    type: 'object',
    description: "Modele Acquisition (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      fournisseurNom: { type: 'string' },
      montant: { type: 'integer' },
      dateAcquisition: { type: 'string' },
      modeAcquisition: { type: 'string', nullable: true },
    }
  },
  Actualite: {
    type: 'object',
    description: "Modele Actualite (table: )",
    properties: {
      titre: { type: 'string' },
      contenu: { type: 'string' },
      date: { type: 'string', nullable: true },
      image: { type: 'string', nullable: true },
      categorie: { type: 'string', nullable: true },
    }
  },
  AdresseApprenant: {
    type: 'object',
    description: "Modele AdresseApprenant (table: )",
    properties: {
      boitePostale: { type: 'string' },
      prorietaireBoitePostale: { type: 'string' },
      telMobile: { type: 'string' },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string' },
      ville: { type: 'string' },
      pays: { type: 'string' },
      apprenantId: { type: 'integer' },
    }
  },
  AdresseCaissierBanque: {
    type: 'object',
    description: "Modele AdresseCaissierBanque (table: )",
    properties: {
      boitePostale: { type: 'string', nullable: true },
      prorietaireBoitePostale: { type: 'string', nullable: true },
      telMobile: { type: 'string', nullable: true },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
      caissierBanqueId: { type: 'integer' },
    }
  },
  AdresseEnseignant: {
    type: 'object',
    description: "Modele AdresseEnseignant (table: )",
    properties: {
      boitePostale: { type: 'string', nullable: true },
      prorietaireBoitePostale: { type: 'string', nullable: true },
      telMobile: { type: 'string', nullable: true },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
      enseignantId: { type: 'integer' },
    }
  },
  AdresseInstitution: {
    type: 'object',
    description: "Modele AdresseInstitution (table: )",
    properties: {
      boitePostale: { type: 'string', nullable: true },
      prorietaireBoitePostale: { type: 'string', nullable: true },
      telMobile: { type: 'string', nullable: true },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
      institutionId: { type: 'integer' },
    }
  },
  Affectation: {
    type: 'object',
    description: "Modele Affectation (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      siteId: { type: 'integer' },
      departementId: { type: 'integer' },
      localisationId: { type: 'integer' },
      responsableNom: { type: 'string', nullable: true },
      dateAffectation: { type: 'string' },
      dateRetour: { type: 'string', nullable: true },
      motif: { type: 'string', nullable: true },
    }
  },
  Amortissement: {
    type: 'object',
    description: "Modele Amortissement (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      annee: { type: 'integer' },
      montantAmorti: { type: 'integer' },
      valeurResiduelle: { type: 'integer' },
      dateCalcul: { type: 'string' },
    }
  },
  AnneeAcademique: {
    type: 'object',
    description: "Modele AnneeAcademique (table: )",
    properties: {
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  AppelOffre: {
    type: 'object',
    description: "Modele AppelOffre (table: )",
    properties: {
      planificationMarcheId: { type: 'integer' },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateLancement: { type: 'string', nullable: true },
      dateLimiteDepot: { type: 'string', nullable: true },
      critereEvaluation: { type: 'string', nullable: true },
      modalitePaiement: { type: 'string', nullable: true },
      garantie: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Apprenant: {
    type: 'object',
    description: "Modele Apprenant (table: )",
    properties: {
      photo: { type: 'string', nullable: true },
      qrCode: { type: 'string', nullable: true },
      dateNaissance: { type: 'string' },
      lieuNaissance: { type: 'string' },
      adresseId: { type: 'integer' },
      identiteId: { type: 'integer' },
      informationsSalarieId: { type: 'integer' },
      informationsParentsId: { type: 'integer' },
      personnePrevenirId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  Article: {
    type: 'object',
    description: "Modele Article (table: )",
    properties: {
      nom: { type: 'string' },
      reference: { type: 'string' },
      description: { type: 'string', nullable: true },
      categorieId: { type: 'integer' },
      siteId: { type: 'integer' },
      salleDeClasseId: { type: 'integer', nullable: true },
      stockActuel: { type: 'integer', nullable: true },
      stockMinimum: { type: 'integer', nullable: true },
      prixUnitaire: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
      dateMiseEnService: { type: 'string', nullable: true },
      dureeVieEstimee: { type: 'integer', nullable: true },
      dateFinVie: { type: 'string', nullable: true },
      motifFinVie: { type: 'string', nullable: true },
    }
  },
  Assurance: {
    type: 'object',
    description: "Modele Assurance (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      policeNumber: { type: 'string' },
      assureur: { type: 'string' },
      couverture: { type: 'string', nullable: true },
      primeAnnuelle: { type: 'integer', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      statut: { type: 'string', nullable: true },
    }
  },
  AttestationStage: {
    type: 'object',
    description: "Modele AttestationStage (table: )",
    properties: {
      demandeStageId: { type: 'integer' },
      fichier: { type: 'string' },
      dateEmission: { type: 'string' },
    }
  },
  AuditNote: {
    type: 'object',
    description: "Modele AuditNote (table: )",
    properties: {
      noteEvaluationId: { type: 'integer' },
      ancienneNote: { type: 'integer', nullable: true },
      nouvelleNote: { type: 'integer', nullable: true },
      modifiePar: { type: 'integer' },
      motif: { type: 'string', nullable: true },
    }
  },
  AvenantMarche: {
    type: 'object',
    description: "Modele AvenantMarche (table: )",
    properties: {
      contratMarcheId: { type: 'integer' },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateSignature: { type: 'string', nullable: true },
      montantAvenant: { type: 'integer', nullable: true },
      dureeAvenant: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Banque: {
    type: 'object',
    description: "Modele Banque (table: )",
    properties: {
      nom: { type: 'string' },
      logo: { type: 'string', nullable: true },
    }
  },
  Batiment: {
    type: 'object',
    description: "Modele Batiment (table: )",
    properties: {
      siteId: { type: 'integer' },
      nom: { type: 'string' },
      adresse: { type: 'string', nullable: true },
    }
  },
  Besoin: {
    type: 'object',
    description: "Modele Besoin (table: )",
    properties: {
      articleId: { type: 'integer' },
      quantiteRequise: { type: 'integer' },
      quantiteApprouvee: { type: 'integer', nullable: true },
      urgence: { type: 'string', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      dateBesoin: { type: 'string' },
    }
  },
  BlocCahierDeTexte: {
    type: 'object',
    description: "Modele BlocCahierDeTexte (table: )",
    properties: {
      date: { type: 'string' },
      heureDebut: { type: 'string' },
      heureFin: { type: 'string' },
      contenu: { type: 'string' },
      cahierDeTexteId: { type: 'integer' },
    }
  },
  BonCommande: {
    type: 'object',
    description: "Modele BonCommande (table: )",
    properties: {
      fournisseurId: { type: 'integer' },
      siteId: { type: 'integer' },
      dateCommande: { type: 'string' },
      dateLivraisonPrevue: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      montantTotal: { type: 'integer', nullable: true },
    }
  },
  Bordereau: {
    type: 'object',
    description: "Modele Bordereau (table: )",
    properties: {
      type: { type: 'string' },
      echeanceId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      fichier: { type: 'string' },
      montant: { type: 'integer' },
      referenceBancaire: { type: 'string', nullable: true },
      statut: { type: 'string' },
      dateSoumission: { type: 'string', nullable: true },
      dateValidation: { type: 'string', nullable: true },
      valideParId: { type: 'integer', nullable: true },
      commentaire: { type: 'string', nullable: true },
      quitusId: { type: 'integer', nullable: true },
    }
  },
  Budget: {
    type: 'object',
    description: "Modele Budget (table: )",
    properties: {
      departementId: { type: 'integer' },
      periode: { type: 'string' },
      montantAlloue: { type: 'integer' },
      montantUtilise: { type: 'integer', nullable: true },
    }
  },
  Bulletin: {
    type: 'object',
    description: "Modele Bulletin (table: )",
    properties: {
      anneeAcademiqueId: { type: 'integer' },
      semestre: { type: 'string' },
      cursusApprenantId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      classeId: { type: 'integer' },
      parcoursId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
      moyenneGenerale: { type: 'integer', nullable: true },
      totalCredits: { type: 'integer', nullable: true },
      creditsValides: { type: 'integer', nullable: true },
      rang: { type: 'integer', nullable: true },
      effectifClasse: { type: 'integer', nullable: true },
      mention: { type: 'string', nullable: true },
      appreciation: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      dateGeneration: { type: 'string', nullable: true },
      datePublication: { type: 'string', nullable: true },
      signatureEnseignant: { type: 'string', nullable: true },
      signatureChef: { type: 'string', nullable: true },
      dateSignatureEnseignant: { type: 'string', nullable: true },
      dateSignatureChef: { type: 'string', nullable: true },
    }
  },
  CahierDeTexte: {
    type: 'object',
    description: "Modele CahierDeTexte (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      coursId: { type: 'integer' },
      enseignantId: { type: 'integer' },
    }
  },
  CaissierBanque: {
    type: 'object',
    description: "Modele CaissierBanque (table: )",
    properties: {
      dateNaissance: { type: 'string', nullable: true },
      lieuNaissance: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
      adresseId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      banqueId: { type: 'integer' },
    }
  },
  Categorie: {
    type: 'object',
    description: "Modele Categorie (table: )",
    properties: {
      libelle: { type: 'string' },
      description: { type: 'string' },
    }
  },
  CategorieAchat: {
    type: 'object',
    description: "Modele CategorieAchat (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  CategorieArticle: {
    type: 'object',
    description: "Modele CategorieArticle (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  CategorieImmobilisation: {
    type: 'object',
    description: "Modele CategorieImmobilisation (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      tauxAmortissement: { type: 'integer', nullable: true },
      dureeVie: { type: 'integer', nullable: true },
      modeAmortissement: { type: 'string', nullable: true },
    }
  },
  Certificat: {
    type: 'object',
    description: "Modele Certificat (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      code: { type: 'string', nullable: true },
      coursId: { type: 'integer' },
      apprenantId: { type: 'integer' },
      dateObtention: { type: 'string', nullable: true },
    }
  },
  Cession: {
    type: 'object',
    description: "Modele Cession (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      dateCession: { type: 'string' },
      motif: { type: 'string' },
      typeOperation: { type: 'string', nullable: true },
      prixCession: { type: 'integer', nullable: true },
      destinataire: { type: 'string', nullable: true },
      approuvePar: { type: 'string', nullable: true },
      dateApprobation: { type: 'string', nullable: true },
      motifRefus: { type: 'string', nullable: true },
    }
  },
  ChapitreCours: {
    type: 'object',
    description: "Modele ChapitreCours (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      image: { type: 'string', nullable: true },
      coursId: { type: 'integer' },
    }
  },
  Classe: {
    type: 'object',
    description: "Modele Classe (table: )",
    properties: {
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      capaciteMax: { type: 'integer', nullable: true },
      niveauEtudeId: { type: 'integer' },
      parcoursId: { type: 'integer' },
    }
  },
  ComiteOrientation: {
    type: 'object',
    description: "Modele ComiteOrientation (table: )",
    properties: {
      fonction: { type: 'string', nullable: true },
      utilisateurId: { type: 'integer' },
    }
  },
  Commande: {
    type: 'object',
    description: "Modele Commande (table: )",
    properties: {
      demandeId: { type: 'integer' },
      fournisseurId: { type: 'integer' },
      dateCommande: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Commentaire: {
    type: 'object',
    description: "Modele Commentaire (table: )",
    properties: {
      supportId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      message: { type: 'string' },
      date: { type: 'string', nullable: true },
    }
  },
  Communication: {
    type: 'object',
    description: "Modele Communication (table: )",
    properties: {
      titre: { type: 'string' },
      contenu: { type: 'string' },
      datePublication: { type: 'string', nullable: true },
      statut: { type: 'string' },
      cible: { type: 'string', nullable: true },
      utilisateurId: { type: 'integer' },
    }
  },
  Compte: {
    type: 'object',
    description: "Modele Compte (table: )",
    properties: {
      numero: { type: 'string' },
      libelle: { type: 'string' },
      classe: { type: 'string' },
      sousClasse: { type: 'string', nullable: true },
      nature: { type: 'string' },
      categorie: { type: 'string' },
      description: { type: 'string', nullable: true },
      actif: { type: 'boolean' },
      moduleSource: { type: 'string', nullable: true },
    }
  },
  CompteBancaire: {
    type: 'object',
    description: "Modele CompteBancaire (table: )",
    properties: {
      banque: { type: 'string' },
      rib: { type: 'string' },
      iban: { type: 'string' },
      swift: { type: 'string', nullable: true },
      titulaire: { type: 'string' },
      numeroCompte: { type: 'string' },
      solde: { type: 'integer', nullable: true },
      devise: { type: 'string', nullable: true },
      actif: { type: 'boolean', nullable: true },
    }
  },
  ConseilClasse: {
    type: 'object',
    description: "Modele ConseilClasse (table: )",
    properties: {
      classe: { type: 'string' },
      date: { type: 'string' },
      trimestre: { type: 'integer' },
      president: { type: 'string' },
      statut: { type: 'string' },
      getDecisions: { type: 'string' },
      createDecision: { type: 'string' },
    }
  },
  ContratMarche: {
    type: 'object',
    description: "Modele ContratMarche (table: )",
    properties: {
      appelOffreId: { type: 'integer' },
      manifestationInteretId: { type: 'integer' },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateSignature: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      montantContractuel: { type: 'integer', nullable: true },
      conditionsParticulieres: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  ConventionStage: {
    type: 'object',
    description: "Modele ConventionStage (table: )",
    properties: {
      demandeStageId: { type: 'integer' },
      fichier: { type: 'string' },
      dateSignature: { type: 'string', nullable: true },
    }
  },
  CorrectionStock: {
    type: 'object',
    description: "Modele CorrectionStock (table: )",
    properties: {
      articleId: { type: 'integer' },
      quantiteAvant: { type: 'integer' },
      quantiteApres: { type: 'integer' },
      motif: { type: 'string' },
      dateCorrection: { type: 'string' },
    }
  },
  CouplageMail: {
    type: 'object',
    description: "Modele CouplageMail (table: )",
    properties: {
      supportId: { type: 'integer' },
      emailEnvoye: { type: 'string' },
      dateEnvoi: { type: 'string', nullable: true },
    }
  },
  Cours: {
    type: 'object',
    description: "Modele Cours (table: )",
    properties: {
      code: { type: 'string' },
      intitule: { type: 'string' },
      credit: { type: 'integer', nullable: true },
      creditEcts: { type: 'integer', nullable: true },
      objectifs: { type: 'string', nullable: true },
      estObligatoire: { type: 'boolean', nullable: true },
      description: { type: 'string', nullable: true },
      semestre: { type: 'string', nullable: true },
      classeId: { type: 'integer' },
      parcoursId: { type: 'integer' },
      enseignantId: { type: 'integer' },
      volumeHoraire: { type: 'integer', nullable: true },
      coefficient: { type: 'integer', nullable: true },
    }
  },
  CoursEnLigne: {
    type: 'object',
    description: "Modele CoursEnLigne (table: )",
    properties: {
      coursId: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      image: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      enseignantId: { type: 'integer', nullable: true },
      format: { type: 'string', nullable: true },
    }
  },
  CoursParticipant: {
    type: 'object',
    description: "Modele CoursParticipant (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      coursId: { type: 'integer' },
      cursusApprenantId: { type: 'integer' },
    }
  },
  CursusApprenant: {
    type: 'object',
    description: "Modele CursusApprenant (table: )",
    properties: {
      externe: { type: 'boolean' },
      etablissementId: { type: 'integer' },
      intituleParcours: { type: 'string' },
      parcoursId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
      classeId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
      demandeInscriptionId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  DeboucheParcours: {
    type: 'object',
    description: "Modele DeboucheParcours (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string' },
      video: { type: 'string' },
      parcoursId: { type: 'integer' },
    }
  },
  DecisionConseil: {
    type: 'object',
    description: "Modele DecisionConseil (table: )",
    properties: {
      conseilClasseId: { type: 'integer' },
      theme: { type: 'string' },
      description: { type: 'string' },
    }
  },
  DecisionPassage: {
    type: 'object',
    description: "Modele DecisionPassage (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
      deliberationId: { type: 'integer', nullable: true },
      moyenneGenerale: { type: 'integer' },
      creditsAcquis: { type: 'integer' },
      creditsRequis: { type: 'integer' },
      decision: { type: 'number' },
      dateDecision: { type: 'string' },
      validePar: { type: 'integer' },
    }
  },
  Deliberation: {
    type: 'object',
    description: "Modele Deliberation (table: )",
    properties: {
      libelle: { type: 'string' },
      classeId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
      periode: { type: 'string' },
      date: { type: 'string' },
      statut: { type: 'string', nullable: true },
      effectif: { type: 'integer', nullable: true },
      admis: { type: 'integer', nullable: true },
      verrouille: { type: 'boolean', nullable: true },
      sessionType: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      nbAdmis: { type: 'integer', nullable: true },
      nbRattrapage: { type: 'integer', nullable: true },
      nbAjourne: { type: 'integer', nullable: true },
      nbExclu: { type: 'integer', nullable: true },
      nbAdmisAvecDette: { type: 'integer', nullable: true },
      nbDerogation: { type: 'integer', nullable: true },
    }
  },
  Demande: {
    type: 'object',
    description: "Modele Demande (table: )",
    properties: {
      soumisParId: { type: 'integer' },
      description: { type: 'string' },
      statut: { type: 'string', nullable: true },
      dateSoumission: { type: 'string', nullable: true },
      validateurChoisiId: { type: 'integer' },
    }
  },
  DemandeDocument: {
    type: 'object',
    description: "Modele DemandeDocument (table: )",
    properties: {
      etudiantId: { type: 'integer' },
      typeDocumentId: { type: 'integer' },
      statut: { type: 'string' },
      date: { type: 'string', nullable: true },
      fraisPayes: { type: 'boolean', nullable: true },
      parcoursId: { type: 'integer', nullable: true },
      niveauEtudeId: { type: 'integer', nullable: true },
      classeId: { type: 'integer', nullable: true },
      anneeAcademiqueId: { type: 'integer', nullable: true },
    }
  },
  DemandeInscription: {
    type: 'object',
    description: "Modele DemandeInscription (table: )",
    properties: {
      matricule: { type: 'string', nullable: true },
      dateDemande: { type: 'string' },
      dateValidation: { type: 'string', nullable: true },
      sessionId: { type: 'integer' },
      etapeInscriptionId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  DemandeInscriptionCours: {
    type: 'object',
    description: "Modele DemandeInscriptionCours (table: )",
    properties: {
      demandeInscriptionId: { type: 'integer' },
      coursId: { type: 'integer' },
      etat: { type: 'string' },
    }
  },
  DemandeInscriptionDossier: {
    type: 'object',
    description: "Modele DemandeInscriptionDossier (table: )",
    properties: {
      nomFichier: { type: 'string', nullable: true },
      demandeId: { type: 'integer' },
      dossierId: { type: 'integer' },
    }
  },
  DemandeOrientation: {
    type: 'object',
    description: "Modele DemandeOrientation (table: )",
    properties: {
      dateDemande: { type: 'string' },
      utilisateurId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
    }
  },
  DemandePrix: {
    type: 'object',
    description: "Modele DemandePrix (table: )",
    properties: {
      articleId: { type: 'integer' },
      fournisseurId: { type: 'integer' },
      prixPropose: { type: 'integer' },
      quantite: { type: 'integer' },
      delaiLivraison: { type: 'integer', nullable: true },
      dateValidite: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  DemandeReorientation: {
    type: 'object',
    description: "Modele DemandeReorientation (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      parcoursActuelId: { type: 'integer' },
      parcoursCibleId: { type: 'integer' },
      motif: { type: 'string' },
      statut: { type: 'string', nullable: true },
      dateTraitement: { type: 'string', nullable: true },
      traitePar: { type: 'integer', nullable: true },
    }
  },
  DemandeStage: {
    type: 'object',
    description: "Modele DemandeStage (table: )",
    properties: {
      offreStageId: { type: 'integer' },
      apprenantId: { type: 'integer' },
      entrepriseId: { type: 'integer' },
      nouvelleEntreprise: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      statut: { type: 'string', nullable: true },
      motifRejet: { type: 'string', nullable: true },
    }
  },
  DemandeVAE: {
    type: 'object',
    description: "Modele DemandeVAE (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      type: { type: 'string' },
      parcoursCibleId: { type: 'integer' },
      justificatifs: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Departement: {
    type: 'object',
    description: "Modele Departement (table: )",
    properties: {
      nom: { type: 'string' },
    }
  },
  DetteAcademique: {
    type: 'object',
    description: "Modele DetteAcademique (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      coursId: { type: 'integer' },
      anneeOrigineId: { type: 'integer' },
      anneeAttacheeId: { type: 'integer' },
      deliberationId: { type: 'integer' },
      creditEcts: { type: 'integer' },
      nbTentatives: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
      dateLimite: { type: 'string', nullable: true },
    }
  },
  Devoir: {
    type: 'object',
    description: "Modele Devoir (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      dateLimite: { type: 'string' },
      fichier: { type: 'string', nullable: true },
      coursId: { type: 'integer' },
      enseignantId: { type: 'integer' },
    }
  },
  Diplome: {
    type: 'object',
    description: "Modele Diplome (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      parcoursId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
      anneeObtention: { type: 'integer' },
      mention: { type: 'string' },
      numeroDiplome: { type: 'string' },
      dateDelivrance: { type: 'string' },
      fichierPDF: { type: 'string', nullable: true },
    }
  },
  Dispense: {
    type: 'object',
    description: "Modele Dispense (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      coursId: { type: 'integer' },
      motif: { type: 'string' },
      validePar: { type: 'integer' },
      dateValidation: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  DocGenCachet: {
    type: 'object',
    description: "Modele DocGenCachet (table: )",
    properties: {
      libelle: { type: 'string' },
      imagePath: { type: 'string' },
      positionX: { type: 'integer', nullable: true },
      positionY: { type: 'integer', nullable: true },
      width: { type: 'integer', nullable: true },
      height: { type: 'integer', nullable: true },
      isActive: { type: 'boolean', nullable: true },
    }
  },
  DocGenDocument: {
    type: 'object',
    description: "Modele DocGenDocument (table: )",
    properties: {
      typeId: { type: 'integer' },
      templateId: { type: 'integer' },
      reference: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      filePath: { type: 'string', nullable: true },
      hash: { type: 'string', nullable: true },
      metadata: { type: 'string', nullable: true },
      sourceType: { type: 'string', nullable: true },
      sourceId: { type: 'integer', nullable: true },
      generatedById: { type: 'integer', nullable: true },
      version: { type: 'integer', nullable: true },
    }
  },
  DocGenReference: {
    type: 'object',
    description: "Modele DocGenReference (table: )",
    properties: {
      typeId: { type: 'integer' },
      annee: { type: 'integer' },
      compteur: { type: 'integer' },
    }
  },
  DocGenSignature: {
    type: 'object',
    description: "Modele DocGenSignature (table: )",
    properties: {
      documentId: { type: 'integer' },
      signataireId: { type: 'integer' },
      signataireType: { type: 'string' },
      type: { type: 'string' },
      statut: { type: 'string', nullable: true },
      signatureData: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      signedAt: { type: 'string', nullable: true },
    }
  },
  DocGenTemplate: {
    type: 'object',
    description: "Modele DocGenTemplate (table: )",
    properties: {
      typeId: { type: 'integer' },
      libelle: { type: 'string' },
      contenu: { type: 'string' },
      variables: { type: 'string', nullable: true },
      version: { type: 'integer', nullable: true },
      isDefault: { type: 'boolean', nullable: true },
    }
  },
  DocGenType: {
    type: 'object',
    description: "Modele DocGenType (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
      categorie: { type: 'string' },
      moduleSource: { type: 'string' },
      description: { type: 'string', nullable: true },
      signatureRequired: { type: 'boolean', nullable: true },
      dua: { type: 'string', nullable: true },
      autoGenerated: { type: 'boolean', nullable: true },
      format: { type: 'string', nullable: true },
    }
  },
  DocGenWorkflow: {
    type: 'object',
    description: "Modele DocGenWorkflow (table: )",
    properties: {
      typeId: { type: 'integer' },
      ordre: { type: 'integer' },
      role: { type: 'string' },
      libelle: { type: 'string' },
      delaiHeures: { type: 'integer', nullable: true },
    }
  },
  DocumentDelivre: {
    type: 'object',
    description: "Modele DocumentDelivre (table: )",
    properties: {
      demandeId: { type: 'integer' },
      fichierPDF: { type: 'string' },
      dateDelivrance: { type: 'string', nullable: true },
    }
  },
  DocumentGed: {
    type: 'object',
    description: "Modele DocumentGed (table: )",
    properties: {
      titre: { type: 'string' },
      reference: { type: 'string', nullable: true },
      eleve: { type: 'string', nullable: true },
      parcours: { type: 'string', nullable: true },
      categorie: { type: 'string', nullable: true },
      tags: { type: 'string', nullable: true },
      nommage: { type: 'string', nullable: true },
      type: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      taille: { type: 'string', nullable: true },
      dureeConservation: { type: 'string', nullable: true },
      archivedUntil: { type: 'string', nullable: true },
      isArchived: { type: 'boolean', nullable: true },
      domainId: { type: 'integer' },
      documentTypeId: { type: 'integer' },
      classificationPath: { type: 'string', nullable: true },
      sourceType: { type: 'string', nullable: true },
      externalIssuer: { type: 'string', nullable: true },
      receptionDate: { type: 'string', nullable: true },
      confidentialityLevel: { type: 'string', nullable: true },
      lifecycleStatus: { type: 'string', nullable: true },
      duaEndDate: { type: 'string', nullable: true },
      integrityHash: { type: 'string', nullable: true },
      versionMajor: { type: 'integer', nullable: true },
      versionMinor: { type: 'integer', nullable: true },
      versionComment: { type: 'string', nullable: true },
      parentDocumentId: { type: 'integer', nullable: true },
      isCurrentVersion: { type: 'boolean', nullable: true },
      isLocked: { type: 'boolean', nullable: true },
      lockedBy: { type: 'integer', nullable: true },
      lockedAt: { type: 'string', nullable: true },
      anneeAcademiqueId: { type: 'integer', nullable: true },
      parcoursId: { type: 'integer', nullable: true },
      niveauEtudeId: { type: 'integer', nullable: true },
      semestre: { type: 'string', nullable: true },
      classeId: { type: 'integer', nullable: true },
      salleId: { type: 'integer', nullable: true },
      cursusApprenantId: { type: 'integer', nullable: true },
      inscriptionDossierId: { type: 'integer', nullable: true },
      bulletinId: { type: 'integer', nullable: true },
      bordereauId: { type: 'integer', nullable: true },
      processusGenerateurId: { type: 'integer' },
      storageLocation: { type: 'string', nullable: true },
      isEncrypted: { type: 'boolean', nullable: true },
      encryptionKeyId: { type: 'string', nullable: true },
      folderId: { type: 'integer', nullable: true },
      sessionId: { type: 'integer', nullable: true },
      metadata: { type: 'string', nullable: true },
      uploaderId: { type: 'integer' },
      nbPages: { type: 'integer', nullable: true },
      auteur: { type: 'string', nullable: true },
      dateDocument: { type: 'string', nullable: true },
      contenuTexte: { type: 'string', nullable: true },
      destinataire: { type: 'string', nullable: true },
      dateEnvoi: { type: 'string', nullable: true },
      modeEnvoi: { type: 'string', nullable: true },
      accuseReception: { type: 'boolean', nullable: true },
      numeroCourrier: { type: 'string', nullable: true },
      verificationCode: { type: 'string', nullable: true },
    }
  },
  DossierEtudiant: {
    type: 'object',
    description: "Modele DossierEtudiant (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      matricule: { type: 'string' },
      codeQR: { type: 'string', nullable: true },
      photo: { type: 'string', nullable: true },
      cartePath: { type: 'string', nullable: true },
      carteGeneree: { type: 'boolean', nullable: true },
      statut: { type: 'string' },
      dateCreation: { type: 'string', nullable: true },
      fraisScolarite: { type: 'integer' },
      modePaiement: { type: 'string' },
      nbMensualites: { type: 'integer' },
      demarrageParcours: { type: 'string' },
    }
  },
  DossierInscription: {
    type: 'object',
    description: "Modele DossierInscription (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      tailleMax: { type: 'integer' },
      sessionId: { type: 'integer' },
    }
  },
  Echeance: {
    type: 'object',
    description: "Modele Echeance (table: )",
    properties: {
      dossierEtudiantId: { type: 'integer', nullable: true },
      type: { type: 'string' },
      numeroEcheance: { type: 'integer' },
      montant: { type: 'integer' },
      devise: { type: 'string', nullable: true },
      dateLimite: { type: 'string' },
      datePaiement: { type: 'string', nullable: true },
      statut: { type: 'string' },
      moisConcerne: { type: 'string', nullable: true },
    }
  },
  EchelleNote: {
    type: 'object',
    description: "Modele EchelleNote (table: )",
    properties: {
      libelle: { type: 'string' },
      noteMin: { type: 'integer' },
      noteMax: { type: 'integer' },
      mention: { type: 'string' },
      estActive: { type: 'boolean', nullable: true },
      ordre: { type: 'integer', nullable: true },
    }
  },
  EcritureComptable: {
    type: 'object',
    description: "Modele EcritureComptable (table: )",
    properties: {
      journalId: { type: 'integer' },
      numeroEcriture: { type: 'string' },
      dateEcriture: { type: 'string' },
      dateComptable: { type: 'string' },
      compteDebitId: { type: 'integer' },
      compteCreditId: { type: 'integer' },
      montant: { type: 'integer' },
      libelle: { type: 'string' },
      reference: { type: 'string', nullable: true },
      pieceJustificative: { type: 'string', nullable: true },
      moduleSource: { type: 'string', nullable: true },
      referenceModuleId: { type: 'string', nullable: true },
      utilisateurSaisieId: { type: 'integer', nullable: true },
      validee: { type: 'boolean' },
      utilisateurValidationId: { type: 'integer', nullable: true },
      dateValidation: { type: 'string', nullable: true },
      observations: { type: 'string', nullable: true },
      lettre: { type: 'string', nullable: true },
      dateLettrage: { type: 'string', nullable: true },
    }
  },
  Ecue: {
    type: 'object',
    description: "Modele Ecue (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
      creditEcts: { type: 'integer', nullable: true },
      coefficient: { type: 'integer', nullable: true },
      coursId: { type: 'integer' },
    }
  },
  Engagement: {
    type: 'object',
    description: "Modele Engagement (table: )",
    properties: {
      budgetId: { type: 'integer' },
      demandeId: { type: 'integer' },
      montant: { type: 'integer' },
      date: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Enseignant: {
    type: 'object',
    description: "Modele Enseignant (table: )",
    properties: {
      photo: { type: 'string', nullable: true },
      qrCode: { type: 'string', nullable: true },
      dateNaissance: { type: 'string', nullable: true },
      lieuNaissance: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
      adresseId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  Entreprise: {
    type: 'object',
    description: "Modele Entreprise (table: )",
    properties: {
      nom: { type: 'string' },
      adresse: { type: 'string', nullable: true },
      telephone: { type: 'string' },
      email: { type: 'string' },
      siteWeb: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
    }
  },
  Equivalence: {
    type: 'object',
    description: "Modele Equivalence (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      coursSource: { type: 'string' },
      coursDestinationId: { type: 'integer' },
      creditEcts: { type: 'integer', nullable: true },
      institutionOrigine: { type: 'string' },
      validePar: { type: 'integer' },
      dateValidation: { type: 'string', nullable: true },
      documentJustificatif: { type: 'string', nullable: true },
    }
  },
  Etablissement: {
    type: 'object',
    description: "Modele Etablissement (table: )",
    properties: {
      nom: { type: 'string' },
      type: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      adresse: { type: 'string', nullable: true },
      telephone: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      siteWeb: { type: 'string', nullable: true },
      actif: { type: 'boolean', nullable: true },
    }
  },
  EtapeInscription: {
    type: 'object',
    description: "Modele EtapeInscription (table: )",
    properties: {
      libelle: { type: 'string' },
      ordre: { type: 'integer' },
    }
  },
  EvenementCalendrier: {
    type: 'object',
    description: "Modele EvenementCalendrier (table: )",
    properties: {
      titre: { type: 'string' },
      date: { type: 'string' },
      description: { type: 'string' },
      type: { type: 'string' },
      recurrence: { type: 'string' },
      dateFinRecurrence: { type: 'string', nullable: true },
      couleur: { type: 'string', nullable: true },
      classeId: { type: 'integer' },
      parcoursId: { type: 'integer' },
      visibilite: { type: 'string' },
      statutEvenement: { type: 'string' },
    }
  },
  FactureProforma: {
    type: 'object',
    description: "Modele FactureProforma (table: )",
    properties: {
      commandeId: { type: 'integer' },
      dateEmission: { type: 'string', nullable: true },
      montantTotal: { type: 'integer' },
      statut: { type: 'string', nullable: true },
    }
  },
  FichierRessource: {
    type: 'object',
    description: "Modele FichierRessource (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      fichier: { type: 'string' },
    }
  },
  Folder: {
    type: 'object',
    description: "Modele Folder (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      parentId: { type: 'integer', nullable: true },
      domainId: { type: 'integer', nullable: true },
      createdBy: { type: 'integer' },
      isAutoGenerated: { type: 'boolean', nullable: true },
      folderType: { type: 'string', nullable: true },
      anneeAcademiqueId: { type: 'integer', nullable: true },
    }
  },
  Fournisseur: {
    type: 'object',
    description: "Modele Fournisseur (table: )",
    properties: {
      nom: { type: 'string' },
      contact: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      telephone: { type: 'string', nullable: true },
      adresse: { type: 'string', nullable: true },
    }
  },
  FraisInscription: {
    type: 'object',
    description: "Modele FraisInscription (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      montant: { type: 'integer' },
      fraisDesCours: { type: 'boolean', nullable: true },
      sessionId: { type: 'integer' },
    }
  },
  FraisParcours: {
    type: 'object',
    description: "Modele FraisParcours (table: )",
    properties: {
      montantInscription: { type: 'integer', nullable: true },
      montantScolarite: { type: 'integer', nullable: true },
      nbMensualites: { type: 'integer', nullable: true },
      fraisBibliotheque: { type: 'integer', nullable: true },
      fraisAssurance: { type: 'integer', nullable: true },
      fraisLogement: { type: 'integer', nullable: true },
      autresFrais: { type: 'string', nullable: true },
      parcoursId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
    }
  },
  HistoriqueDecision: {
    type: 'object',
    description: "Modele HistoriqueDecision (table: )",
    properties: {
      deliberationId: { type: 'integer' },
      resultatId: { type: 'integer' },
      ancienneDecision: { type: 'string' },
      nouvelleDecision: { type: 'string' },
      auteurId: { type: 'integer' },
      motif: { type: 'string', nullable: true },
    }
  },
  IdentiteApprenant: {
    type: 'object',
    description: "Modele IdentiteApprenant (table: )",
    properties: {
      nationalite: { type: 'string' },
      ethnie: { type: 'string', nullable: true },
      prefecture: { type: 'string', nullable: true },
      religion: { type: 'string' },
      situationMatrimoniale: { type: 'string' },
      etatPhysique: { type: 'string' },
      handicapMoteur: { type: 'boolean', nullable: true },
      handicapVisuel: { type: 'boolean', nullable: true },
      handicapAuditif: { type: 'boolean', nullable: true },
      apprenantId: { type: 'integer' },
    }
  },
  Immobilisation: {
    type: 'object',
    description: "Modele Immobilisation (table: )",
    properties: {
      nom: { type: 'string' },
      reference: { type: 'string' },
      description: { type: 'string', nullable: true },
      codeQR: { type: 'string', nullable: true },
      categorieId: { type: 'integer' },
      localisationId: { type: 'integer' },
      salleDeClasseId: { type: 'integer', nullable: true },
      departementId: { type: 'integer' },
      siteId: { type: 'integer' },
      etat: { type: 'string', nullable: true },
      dateMiseEnService: { type: 'string' },
      valeurAcquisition: { type: 'integer' },
      responsableNom: { type: 'string', nullable: true },
    }
  },
  InformationsParentsApprenant: {
    type: 'object',
    description: "Modele InformationsParentsApprenant (table: )",
    properties: {
      pereVivant: { type: 'boolean', nullable: true },
      nomPrenomsPere: { type: 'string' },
      professionPere: { type: 'string' },
      emailPere: { type: 'string', nullable: true },
      mereVivante: { type: 'boolean', nullable: true },
      nomPrenomsMere: { type: 'string' },
      professionMere: { type: 'string' },
      emailMere: { type: 'string', nullable: true },
      apprenantId: { type: 'integer' },
    }
  },
  InformationsSalarieApprenant: {
    type: 'object',
    description: "Modele InformationsSalarieApprenant (table: )",
    properties: {
      estSalarie: { type: 'boolean', nullable: true },
      profession: { type: 'string', nullable: true },
      entreprise: { type: 'string', nullable: true },
      apprenantId: { type: 'integer' },
    }
  },
  Institution: {
    type: 'object',
    description: "Modele Institution (table: )",
    properties: {
      dateNaissance: { type: 'string', nullable: true },
      lieuNaissance: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
      adresseId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  Inventaire: {
    type: 'object',
    description: "Modele Inventaire (table: )",
    properties: {
      anneeFiscal: { type: 'integer' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  InventaireStock: {
    type: 'object',
    description: "Modele InventaireStock (table: )",
    properties: {
      reference: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  JournalComptable: {
    type: 'object',
    description: "Modele JournalComptable (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
      type: { type: 'string' },
      description: { type: 'string', nullable: true },
      actif: { type: 'boolean' },
    }
  },
  JuryMembre: {
    type: 'object',
    description: "Modele JuryMembre (table: )",
    properties: {
      deliberationId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      role: { type: 'string' },
      estPresent: { type: 'boolean', nullable: true },
    }
  },
  LigneBonCommande: {
    type: 'object',
    description: "Modele LigneBonCommande (table: )",
    properties: {
      bonCommandeId: { type: 'integer' },
      articleId: { type: 'integer' },
      quantite: { type: 'integer' },
      prixUnitaire: { type: 'integer' },
    }
  },
  LigneBudget: {
    type: 'object',
    description: "Modele LigneBudget (table: )",
    properties: {
      budgetId: { type: 'integer' },
      categorieAchatId: { type: 'integer' },
      montantAlloue: { type: 'integer' },
      montantUtilise: { type: 'integer', nullable: true },
    }
  },
  LigneBulletin: {
    type: 'object',
    description: "Modele LigneBulletin (table: )",
    properties: {
      bulletinId: { type: 'integer' },
      coursId: { type: 'integer' },
      moyenneCC: { type: 'integer', nullable: true },
      noteDevoir: { type: 'integer', nullable: true },
      noteExamen: { type: 'integer', nullable: true },
      moyenne: { type: 'integer', nullable: true },
      coefficient: { type: 'integer', nullable: true },
      rang: { type: 'integer', nullable: true },
      appreciation: { type: 'string', nullable: true },
    }
  },
  LigneCommande: {
    type: 'object',
    description: "Modele LigneCommande (table: )",
    properties: {
      commandeId: { type: 'integer' },
      designation: { type: 'string' },
      quantite: { type: 'integer' },
      prixUnitaire: { type: 'integer' },
      total: { type: 'integer', nullable: true },
      gereEnStock: { type: 'boolean', nullable: true },
      actifImmobilise: { type: 'boolean', nullable: true },
    }
  },
  LigneDemande: {
    type: 'object',
    description: "Modele LigneDemande (table: )",
    properties: {
      demandeId: { type: 'integer' },
      designation: { type: 'string' },
      quantite: { type: 'integer' },
      prixEstime: { type: 'integer' },
      unite: { type: 'string', nullable: true },
    }
  },
  LigneFacture: {
    type: 'object',
    description: "Modele LigneFacture (table: )",
    properties: {
      factureId: { type: 'integer' },
      ligneCommandeId: { type: 'integer' },
      designation: { type: 'string' },
      quantite: { type: 'integer' },
      prixUnitaire: { type: 'integer' },
      total: { type: 'integer' },
    }
  },
  LigneFraisEtudiant: {
    type: 'object',
    description: "Modele LigneFraisEtudiant (table: )",
    properties: {
      dossierEtudiantId: { type: 'integer' },
      type: { type: 'string' },
      montant: { type: 'integer' },
      reductionId: { type: 'integer', nullable: true },
      paye: { type: 'boolean' },
      solde: { type: 'integer' },
    }
  },
  LigneInventaire: {
    type: 'object',
    description: "Modele LigneInventaire (table: )",
    properties: {
      inventaireId: { type: 'integer' },
      immobilisationId: { type: 'integer' },
      etatDeclare: { type: 'string', nullable: true },
      etatConstate: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
    }
  },
  LigneInventaireStock: {
    type: 'object',
    description: "Modele LigneInventaireStock (table: )",
    properties: {
      inventaireId: { type: 'integer' },
      articleId: { type: 'integer' },
      quantiteTheorique: { type: 'integer' },
      quantiteReelle: { type: 'integer' },
      ecart: { type: 'integer' },
      commentaire: { type: 'string', nullable: true },
    }
  },
  LigneReception: {
    type: 'object',
    description: "Modele LigneReception (table: )",
    properties: {
      receptionId: { type: 'integer' },
      ligneCommandeId: { type: 'integer' },
      quantiteRecue: { type: 'integer' },
    }
  },
  LigneReleveBancaire: {
    type: 'object',
    description: "Modele LigneReleveBancaire (table: )",
    properties: {
      releveBancaireId: { type: 'integer' },
      dateOperation: { type: 'string' },
      dateValeur: { type: 'string', nullable: true },
      libelle: { type: 'string' },
      reference: { type: 'string', nullable: true },
      montant: { type: 'integer' },
      type: { type: 'string' },
      rapprochee: { type: 'boolean', nullable: true },
      ecritureComptableId: { type: 'integer', nullable: true },
      dateRapprochement: { type: 'string', nullable: true },
    }
  },
  ListeNoteEvaluation: {
    type: 'object',
    description: "Modele ListeNoteEvaluation (table: )",
    properties: {
      date: { type: 'string' },
      heureDebut: { type: 'string' },
      heureFin: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      poidsTypeNoteEvaluation: { type: 'integer' },
      typeNoteEvaluationId: { type: 'integer' },
      coursId: { type: 'integer' },
      enseignantId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
    }
  },
  ListePresence: {
    type: 'object',
    description: "Modele ListePresence (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      coursId: { type: 'integer' },
      enseignantId: { type: 'integer' },
    }
  },
  Livre: {
    type: 'object',
    description: "Modele Livre (table: )",
    properties: {
      titre: { type: 'string' },
      auteur: { type: 'string' },
      description: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      taille: { type: 'string', nullable: true },
      consultations: { type: 'integer', nullable: true },
      uploaderId: { type: 'integer' },
    }
  },
  Localisation: {
    type: 'object',
    description: "Modele Localisation (table: )",
    properties: {
      batimentId: { type: 'integer' },
      code: { type: 'string' },
      capacite: { type: 'integer', nullable: true },
    }
  },
  Maintenance: {
    type: 'object',
    description: "Modele Maintenance (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      dateMaintenance: { type: 'string' },
      type: { type: 'string' },
      description: { type: 'string' },
      cout: { type: 'integer', nullable: true },
      prestataire: { type: 'string', nullable: true },
    }
  },
  MaintenanceProgrammee: {
    type: 'object',
    description: "Modele MaintenanceProgrammee (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      description: { type: 'string' },
      periodicite: { type: 'string' },
      prochaineEcheance: { type: 'string' },
      actif: { type: 'boolean', nullable: true },
    }
  },
  ManifestationInteret: {
    type: 'object',
    description: "Modele ManifestationInteret (table: )",
    properties: {
      planificationMarcheId: { type: 'integer' },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateDepot: { type: 'string', nullable: true },
      dateOuverture: { type: 'string', nullable: true },
      soumissionnaire: { type: 'string' },
      montantEstime: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
      observations: { type: 'string', nullable: true },
    }
  },
  MatierePrerequis: {
    type: 'object',
    description: "Modele MatierePrerequis (table: )",
    properties: {
      libelle: { type: 'string' },
    }
  },
  Mcc: {
    type: 'object',
    description: "Modele Mcc (table: )",
    properties: {
      ecueId: { type: 'integer' },
      coursId: { type: 'integer' },
      coefficient: { type: 'integer', nullable: true },
      session: { type: 'string', nullable: true },
      estEliminatoire: { type: 'boolean', nullable: true },
      seuilEliminatoire: { type: 'integer', nullable: true },
      estObligatoire: { type: 'boolean', nullable: true },
    }
  },
  Message: {
    type: 'object',
    description: "Modele Message (table: )",
    properties: {
      salonId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      message: { type: 'string' },
      date: { type: 'string', nullable: true },
      lu: { type: 'boolean', nullable: true },
      typeMessage: { type: 'string', nullable: true },
      pieceJointe: { type: 'string', nullable: true },
      estModifie: { type: 'boolean', nullable: true },
      estSupprime: { type: 'boolean', nullable: true },
    }
  },
  ModuleElearning: {
    type: 'object',
    description: "Modele ModuleElearning (table: )",
    properties: {
      coursId: { type: 'integer' },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      ordre: { type: 'integer', nullable: true },
      dateDisponible: { type: 'string', nullable: true },
    }
  },
  MouvementStock: {
    type: 'object',
    description: "Modele MouvementStock (table: )",
    properties: {
      articleId: { type: 'integer' },
      type: { type: 'string' },
      quantite: { type: 'integer' },
      motif: { type: 'string', nullable: true },
      fournisseurId: { type: 'integer' },
      siteId: { type: 'integer' },
      prixUnitaire: { type: 'integer', nullable: true },
      dateMouvement: { type: 'string' },
      utilisateurId: { type: 'integer' },
    }
  },
  NiveauEtude: {
    type: 'object',
    description: "Modele NiveauEtude (table: )",
    properties: {
      libelle: { type: 'string' },
    }
  },
  NoteEvaluation: {
    type: 'object',
    description: "Modele NoteEvaluation (table: )",
    properties: {
      note: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
      listeNoteEvaluationId: { type: 'integer' },
      coursParticipantId: { type: 'integer' },
    }
  },
  NoteStage: {
    type: 'object',
    description: "Modele NoteStage (table: )",
    properties: {
      demandeStageId: { type: 'integer' },
      enseignantId: { type: 'integer' },
      note: { type: 'integer' },
      appreciation: { type: 'string', nullable: true },
    }
  },
  Notification: {
    type: 'object',
    description: "Modele Notification (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      type: { type: 'string' },
      titre: { type: 'string', nullable: true },
      message: { type: 'string' },
      lien: { type: 'string', nullable: true },
      lu: { type: 'boolean', nullable: true },
      date: { type: 'string', nullable: true },
    }
  },
  OffreStage: {
    type: 'object',
    description: "Modele OffreStage (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      lieu: { type: 'string' },
      nombrePlaces: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
      institutionId: { type: 'integer' },
    }
  },
  PaiementInscription: {
    type: 'object',
    description: "Modele PaiementInscription (table: )",
    properties: {
      numero: { type: 'string' },
      datePaiement: { type: 'string' },
      description: { type: 'string', nullable: true },
      montant: { type: 'integer' },
      matriculeInscription: { type: 'string' },
      type: { type: 'string' },
      utilisateurId: { type: 'integer' },
    }
  },
  PanierParcoursChoisi: {
    type: 'object',
    description: "Modele PanierParcoursChoisi (table: )",
    properties: {
      parcoursChoisiId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  Parcours: {
    type: 'object',
    description: "Modele Parcours (table: )",
    properties: {
      titre: { type: 'string' },
      image: { type: 'string', nullable: true },
      dureeDeFormation: { type: 'string', nullable: true },
      type: { type: 'string', nullable: true },
      videoExplicative: { type: 'string', nullable: true },
      contenu: { type: 'string' },
      categorieId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
    }
  },
  ParcoursChoisi: {
    type: 'object',
    description: "Modele ParcoursChoisi (table: )",
    properties: {
      etatDeValidation: { type: 'string' },
      messageDeValidation: { type: 'string' },
      parcoursId: { type: 'integer' },
    }
  },
  ParentEnfant: {
    type: 'object',
    description: "Modele ParentEnfant (table: )",
    properties: {
      parentUtilisateurId: { type: 'integer' },
      apprenantId: { type: 'integer' },
    }
  },
  ParticipantSalon: {
    type: 'object',
    description: "Modele ParticipantSalon (table: )",
    properties: {
      salonId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      dateAjout: { type: 'string', nullable: true },
      role: { type: 'string', nullable: true },
      dateDerniereLecture: { type: 'string', nullable: true },
      estPresent: { type: 'boolean', nullable: true },
    }
  },
  PenaliteRetard: {
    type: 'object',
    description: "Modele PenaliteRetard (table: )",
    properties: {
      type: { type: 'string' },
      pourcentage: { type: 'integer' },
      nbJoursGrace: { type: 'integer', nullable: true },
      montantMaximum: { type: 'integer', nullable: true },
      actif: { type: 'boolean', nullable: true },
      fraisParcoursId: { type: 'integer' },
    }
  },
  Permission: {
    type: 'object',
    description: "Modele Permission (table: )",
    properties: {
      key: { type: 'string' },
      libelle: { type: 'string' },
      module: { type: 'string' },
      type: { type: 'string' },
      parentKey: { type: 'string', nullable: true },
    }
  },
  PersonnePrevenirApprenant: {
    type: 'object',
    description: "Modele PersonnePrevenirApprenant (table: )",
    properties: {
      nom: { type: 'string' },
      prenoms: { type: 'string' },
      boitePostale: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      telMobile: { type: 'string' },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string' },
      ville: { type: 'string' },
      pays: { type: 'string' },
      apprenantId: { type: 'integer' },
    }
  },
  PlanificationMarche: {
    type: 'object',
    description: "Modele PlanificationMarche (table: )",
    properties: {
      libelle: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      description: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Pointage: {
    type: 'object',
    description: "Modele Pointage (table: )",
    properties: {
      date: { type: 'string' },
      heureArrivee: { type: 'string' },
      heureDepart: { type: 'string', nullable: true },
      utilisateurId: { type: 'integer' },
    }
  },
  PreInscription: {
    type: 'object',
    description: "Modele PreInscription (table: )",
    properties: {
      demandeInscriptionId: { type: 'integer' },
      statut: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      dateTraitement: { type: 'string', nullable: true },
      traiteParId: { type: 'integer' },
      autorisationPDF: { type: 'string', nullable: true },
    }
  },
  PrerequisParcours: {
    type: 'object',
    description: "Modele PrerequisParcours (table: )",
    properties: {
      noteRequise: { type: 'integer' },
      typeEvaluation: { type: 'string' },
      periodeEvaluation: { type: 'string' },
      parcoursId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
      matierePrerequisId: { type: 'integer' },
    }
  },
  PrerequisParcoursChoisi: {
    type: 'object',
    description: "Modele PrerequisParcoursChoisi (table: )",
    properties: {
      note: { type: 'integer' },
      parcoursChoisiId: { type: 'integer' },
      prerequisParcoursId: { type: 'integer' },
    }
  },
  Presence: {
    type: 'object',
    description: "Modele Presence (table: )",
    properties: {
      date: { type: 'string' },
      heureDebut: { type: 'string' },
      heureFin: { type: 'string' },
      signature: { type: 'string', nullable: true },
      signedAt: { type: 'string', nullable: true },
      listePresenceId: { type: 'integer' },
    }
  },
  PresenceCoursParticipant: {
    type: 'object',
    description: "Modele PresenceCoursParticipant (table: )",
    properties: {
      etatDePresence: { type: 'string', nullable: true },
      presenceId: { type: 'integer' },
      coursParticipantId: { type: 'integer' },
    }
  },
  ProcessusGenerateur: {
    type: 'object',
    description: "Modele ProcessusGenerateur (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      moduleSource: { type: 'string', nullable: true },
      isActif: { type: 'boolean', nullable: true },
    }
  },
  ProgressionApprenant: {
    type: 'object',
    description: "Modele ProgressionApprenant (table: )",
    properties: {
      supportId: { type: 'integer' },
      apprenantId: { type: 'integer' },
      termine: { type: 'boolean', nullable: true },
      tempsPasse: { type: 'integer', nullable: true },
      dernierAcces: { type: 'string', nullable: true },
    }
  },
  ProgressionPedagogique: {
    type: 'object',
    description: "Modele ProgressionPedagogique (table: )",
    properties: {
      coursId: { type: 'integer' },
      semaine: { type: 'integer' },
      chapitreId: { type: 'integer' },
      volumeHoraire: { type: 'integer' },
      statut: { type: 'string' },
    }
  },
  PublicationNote: {
    type: 'object',
    description: "Modele PublicationNote (table: )",
    properties: {
      listeNoteEvaluationId: { type: 'integer' },
      datePublication: { type: 'string', nullable: true },
      publiePar: { type: 'integer' },
      message: { type: 'string', nullable: true },
      nbEtudiantsNotifies: { type: 'integer', nullable: true },
    }
  },
  QuaActionCorrective: {
    type: 'object',
    description: "Modele QuaActionCorrective (table: )",
    properties: {
      nonConformiteId: { type: 'integer' },
      type: { type: 'string' },
      description: { type: 'string' },
      responsableId: { type: 'integer' },
      dateLimite: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      efficacite: { type: 'string', nullable: true },
    }
  },
  QuaAudit: {
    type: 'object',
    description: "Modele QuaAudit (table: )",
    properties: {
      type: { type: 'string' },
      titre: { type: 'string' },
      processus: { type: 'string' },
      datePlanifiee: { type: 'string' },
      dateRealisation: { type: 'string', nullable: true },
      equipe: { type: 'string' },
      referentiel: { type: 'string', nullable: true },
      constats: { type: 'string', nullable: true },
      conclusion: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  QuaAuditPiste: {
    type: 'object',
    description: "Modele QuaAuditPiste (table: )",
    properties: {
      auditId: { type: 'integer' },
      reference: { type: 'string' },
      critere: { type: 'string' },
      constat: { type: 'string', nullable: true },
      note: { type: 'integer', nullable: true },
      conforme: { type: 'boolean', nullable: true },
    }
  },
  QuaDecisionRevue: {
    type: 'object',
    description: "Modele QuaDecisionRevue (table: )",
    properties: {
      revueDirectionId: { type: 'integer' },
      decision: { type: 'string' },
      responsableId: { type: 'integer' },
      dateEcheance: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  QuaEnqueteSatisfaction: {
    type: 'object',
    description: "Modele QuaEnqueteSatisfaction (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      cible: { type: 'string' },
      questions: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      statut: { type: 'string', nullable: true },
    }
  },
  QuaNonConformite: {
    type: 'object',
    description: "Modele QuaNonConformite (table: )",
    properties: {
      type: { type: 'string' },
      source: { type: 'string' },
      processus: { type: 'string' },
      description: { type: 'string' },
      cause: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      priorite: { type: 'string', nullable: true },
      declareePar: { type: 'integer' },
      declareeLe: { type: 'string', nullable: true },
      clotureeLe: { type: 'string', nullable: true },
    }
  },
  QuaReponseSatisfaction: {
    type: 'object',
    description: "Modele QuaReponseSatisfaction (table: )",
    properties: {
      enqueteSatisfactionId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      reponses: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      soumiseLe: { type: 'string', nullable: true },
    }
  },
  QuaRevueDirection: {
    type: 'object',
    description: "Modele QuaRevueDirection (table: )",
    properties: {
      titre: { type: 'string' },
      dateTenue: { type: 'string' },
      participants: { type: 'string' },
      ordreJour: { type: 'string' },
      compteRendu: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Quitus: {
    type: 'object',
    description: "Modele Quitus (table: )",
    properties: {
      paiementInscriptionId: { type: 'integer', nullable: true },
      bordereauId: { type: 'integer', nullable: true },
      code: { type: 'string' },
      dateEmission: { type: 'string', nullable: true },
      fichierPDF: { type: 'string', nullable: true },
      statut: { type: 'string' },
    }
  },
  Quiz: {
    type: 'object',
    description: "Modele Quiz (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      tempsLimite: { type: 'integer', nullable: true },
      questions: { type: 'string' },
      coursId: { type: 'integer' },
    }
  },
  RapportStage: {
    type: 'object',
    description: "Modele RapportStage (table: )",
    properties: {
      demandeStageId: { type: 'integer' },
      fichier: { type: 'string' },
      dateSoumission: { type: 'string' },
    }
  },
  RattrapageInscription: {
    type: 'object',
    description: "Modele RattrapageInscription (table: )",
    properties: {
      coursParticipantId: { type: 'integer' },
      coursId: { type: 'integer' },
      sessionExamenId: { type: 'integer' },
      noteRattrapage: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
      enseignantId: { type: 'integer', nullable: true },
      salle: { type: 'string', nullable: true },
      dateRattrapage: { type: 'string', nullable: true },
      heureDebut: { type: 'string', nullable: true },
      heureFin: { type: 'string', nullable: true },
      notificationEnvoyee: { type: 'boolean', nullable: true },
    }
  },
  Rebut: {
    type: 'object',
    description: "Modele Rebut (table: )",
    properties: {
      articleId: { type: 'integer' },
      quantite: { type: 'integer' },
      motif: { type: 'string' },
      dateRebut: { type: 'string' },
      coutEstime: { type: 'integer', nullable: true },
    }
  },
  RebutImmobilisation: {
    type: 'object',
    description: "Modele RebutImmobilisation (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      dateRebut: { type: 'string', nullable: true },
      motif: { type: 'string' },
      montant: { type: 'integer', nullable: true },
      approuvePar: { type: 'string', nullable: true },
      dateApprobation: { type: 'string', nullable: true },
    }
  },
  Reception: {
    type: 'object',
    description: "Modele Reception (table: )",
    properties: {
      commandeId: { type: 'integer' },
      date: { type: 'string', nullable: true },
      statut: { type: 'string' },
      notes: { type: 'string', nullable: true },
    }
  },
  Reclamation: {
    type: 'object',
    description: "Modele Reclamation (table: )",
    properties: {
      etudiantId: { type: 'integer' },
      evaluationId: { type: 'string', nullable: true },
      motif: { type: 'string' },
      statut: { type: 'string' },
      date: { type: 'string', nullable: true },
    }
  },
  ReductionFrais: {
    type: 'object',
    description: "Modele ReductionFrais (table: )",
    properties: {
      type: { type: 'string' },
      mode: { type: 'string' },
      valeur: { type: 'integer' },
      description: { type: 'string', nullable: true },
      dateDebut: { type: 'string', nullable: true },
      dateFin: { type: 'string', nullable: true },
      actif: { type: 'boolean', nullable: true },
      fraisParcoursId: { type: 'integer' },
    }
  },
  RegistreAcademique: {
    type: 'object',
    description: "Modele RegistreAcademique (table: )",
    properties: {
      etudiant: { type: 'string' },
      matricule: { type: 'string' },
      classe: { type: 'string' },
      moyenne: { type: 'integer' },
      rang: { type: 'integer' },
      decision: { type: 'string' },
      anneeScolaire: { type: 'string' },
    }
  },
  RegistreCourrier: {
    type: 'object',
    description: "Modele RegistreCourrier (table: )",
    properties: {
      sens: { type: 'string' },
      numeroOrdre: { type: 'integer' },
      annee: { type: 'integer' },
      dateCourrier: { type: 'string', nullable: true },
      expediteur: { type: 'string', nullable: true },
      destinataire: { type: 'string', nullable: true },
      objet: { type: 'string' },
      modeEnvoi: { type: 'string', nullable: true },
      accuseReception: { type: 'boolean', nullable: true },
      referenceDocument: { type: 'string', nullable: true },
      annotations: { type: 'string', nullable: true },
      documentId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
    }
  },
  RegleEvaluation: {
    type: 'object',
    description: "Modele RegleEvaluation (table: )",
    properties: {
      parcoursId: { type: 'integer' },
      semestre: { type: 'string', nullable: true },
      type: { type: 'string' },
      valeur: { type: 'string' },
      actif: { type: 'boolean', nullable: true },
      description: { type: 'string', nullable: true },
    }
  },
  ReleveBancaire: {
    type: 'object',
    description: "Modele ReleveBancaire (table: )",
    properties: {
      compteBancaireId: { type: 'integer' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      soldeOuverture: { type: 'integer' },
      soldeFermeture: { type: 'integer' },
      reference: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  ReponseInscription: {
    type: 'object',
    description: "Modele ReponseInscription (table: )",
    properties: {
      message: { type: 'string', nullable: true },
      dateReponse: { type: 'string' },
      utilisateurId: { type: 'integer' },
      demandeInscriptionId: { type: 'integer' },
    }
  },
  ReponseOrientation: {
    type: 'object',
    description: "Modele ReponseOrientation (table: )",
    properties: {
      message: { type: 'string', nullable: true },
      dateReponse: { type: 'string' },
      dateAutorisationProvisoire: { type: 'string', nullable: true },
      statutAutorisation: { type: 'string', nullable: true },
      utilisateurId: { type: 'integer' },
      demandeOrientationId: { type: 'integer' },
    }
  },
  ReponseQuiz: {
    type: 'object',
    description: "Modele ReponseQuiz (table: )",
    properties: {
      quizId: { type: 'integer' },
      apprenantId: { type: 'integer' },
      reponses: { type: 'string' },
      score: { type: 'integer', nullable: true },
      total: { type: 'integer', nullable: true },
      date: { type: 'string', nullable: true },
    }
  },
  ReponseReclamation: {
    type: 'object',
    description: "Modele ReponseReclamation (table: )",
    properties: {
      reclamationId: { type: 'integer' },
      repondeurId: { type: 'integer' },
      reponse: { type: 'string' },
      date: { type: 'string', nullable: true },
    }
  },
  ReponseSuggestion: {
    type: 'object',
    description: "Modele ReponseSuggestion (table: )",
    properties: {
      suggestionId: { type: 'integer' },
      utilisateurId: { type: 'integer' },
      message: { type: 'string' },
      date: { type: 'string', nullable: true },
    }
  },
  Ressource: {
    type: 'object',
    description: "Modele Ressource (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      type: { type: 'string', nullable: true },
      dateDebut: { type: 'string', nullable: true },
      dateFin: { type: 'string', nullable: true },
      active: { type: 'boolean', nullable: true },
    }
  },
  ResultatDeliberation: {
    type: 'object',
    description: "Modele ResultatDeliberation (table: )",
    properties: {
      deliberationId: { type: 'integer' },
      cursusApprenantId: { type: 'integer' },
      nom: { type: 'string' },
      prenoms: { type: 'string' },
      matricule: { type: 'string' },
      moyenne: { type: 'integer', nullable: true },
      mention: { type: 'string', nullable: true },
      rang: { type: 'integer', nullable: true },
      decision: { type: 'string', nullable: true },
      assiduite: { type: 'string', nullable: true },
      situationFinanciere: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      totalCredits: { type: 'integer', nullable: true },
      creditsValides: { type: 'integer', nullable: true },
    }
  },
  RhBulletinPaie: {
    type: 'object',
    description: "Modele RhBulletinPaie (table: )",
    properties: {
      employeId: { type: 'integer' },
      periodeId: { type: 'integer' },
      totalGains: { type: 'integer', nullable: true },
      totalRetenues: { type: 'integer', nullable: true },
      netAPayer: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhCandidature: {
    type: 'object',
    description: "Modele RhCandidature (table: )",
    properties: {
      offreId: { type: 'integer' },
      nom: { type: 'string' },
      email: { type: 'string' },
      telephone: { type: 'string', nullable: true },
      cv: { type: 'string', nullable: true },
      lettreMotivation: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhCategorieProfessionnelle: {
    type: 'object',
    description: "Modele RhCategorieProfessionnelle (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RhContratEnseignant: {
    type: 'object',
    description: "Modele RhContratEnseignant (table: )",
    properties: {
      typeContrat: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      montantMensuel: { type: 'integer', nullable: true },
      tauxHoraire: { type: 'integer', nullable: true },
      volumeHoraireMensuel: { type: 'integer', nullable: true },
      description: { type: 'string', nullable: true },
      pieceJointe: { type: 'string', nullable: true },
      employeId: { type: 'integer' },
    }
  },
  RhCritereEvaluation: {
    type: 'object',
    description: "Modele RhCritereEvaluation (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      poids: { type: 'integer', nullable: true },
    }
  },
  RhDemandeConge: {
    type: 'object',
    description: "Modele RhDemandeConge (table: )",
    properties: {
      employeId: { type: 'integer' },
      typeConge: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      duree: { type: 'integer', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      valideePar: { type: 'integer', nullable: true },
      commentaireValidation: { type: 'string', nullable: true },
    }
  },
  RhDepartement: {
    type: 'object',
    description: "Modele RhDepartement (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RhEmploye: {
    type: 'object',
    description: "Modele RhEmploye (table: )",
    properties: {
      utilisateurId: { type: 'string' },
      posteId: { type: 'integer' },
      departementId: { type: 'integer' },
      dateEmbauche: { type: 'string' },
      typeContratId: { type: 'integer' },
      salaireBase: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhEntretien: {
    type: 'object',
    description: "Modele RhEntretien (table: )",
    properties: {
      candidatureId: { type: 'integer' },
      date: { type: 'string' },
      heure: { type: 'string' },
      lieu: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhEvaluationCritere: {
    type: 'object',
    description: "Modele RhEvaluationCritere (table: )",
    properties: {
      ficheId: { type: 'integer' },
      critereId: { type: 'integer' },
      note: { type: 'integer' },
    }
  },
  RhFicheEvaluation: {
    type: 'object',
    description: "Modele RhFicheEvaluation (table: )",
    properties: {
      employeId: { type: 'integer' },
      evaluateurId: { type: 'string' },
      dateEvaluation: { type: 'string' },
      noteGlobale: { type: 'integer', nullable: true },
      commentaire: { type: 'string', nullable: true },
    }
  },
  RhFormation: {
    type: 'object',
    description: "Modele RhFormation (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      formateur: { type: 'string' },
      type: { type: 'string', nullable: true },
    }
  },
  RhGrilleSalariale: {
    type: 'object',
    description: "Modele RhGrilleSalariale (table: )",
    properties: {
      categorieId: { type: 'integer' },
      posteId: { type: 'integer' },
      salaireMin: { type: 'integer' },
      salaireMax: { type: 'integer' },
      echelon: { type: 'string', nullable: true },
      anneeVigueur: { type: 'integer' },
    }
  },
  RhHeureSupplementaire: {
    type: 'object',
    description: "Modele RhHeureSupplementaire (table: )",
    properties: {
      employeId: { type: 'integer' },
      date: { type: 'string' },
      nombreHeures: { type: 'integer' },
      tauxMajoration: { type: 'integer', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhIndemnitePrestataire: {
    type: 'object',
    description: "Modele RhIndemnitePrestataire (table: )",
    properties: {
      prestataireId: { type: 'integer' },
      typeIndemnite: { type: 'string' },
      libelle: { type: 'string' },
      montant: { type: 'integer' },
      devise: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      nombreJours: { type: 'integer' },
      description: { type: 'string' },
      statut: { type: 'string', nullable: true },
      datePaiement: { type: 'string' },
      modePaiement: { type: 'string' },
      validePar: { type: 'string' },
    }
  },
  RhLigneBulletin: {
    type: 'object',
    description: "Modele RhLigneBulletin (table: )",
    properties: {
      bulletinId: { type: 'integer' },
      rubriqueId: { type: 'integer' },
      libelle: { type: 'string', nullable: true },
      base: { type: 'integer', nullable: true },
      taux: { type: 'integer', nullable: true },
      montant: { type: 'integer', nullable: true },
    }
  },
  RhOffreEmploi: {
    type: 'object',
    description: "Modele RhOffreEmploi (table: )",
    properties: {
      posteId: { type: 'integer' },
      description: { type: 'string', nullable: true },
      datePublication: { type: 'string', nullable: true },
      dateCloture: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhParticipationFormation: {
    type: 'object',
    description: "Modele RhParticipationFormation (table: )",
    properties: {
      formationId: { type: 'integer' },
      employeId: { type: 'integer' },
      statut: { type: 'string', nullable: true },
    }
  },
  RhPeriodePaie: {
    type: 'object',
    description: "Modele RhPeriodePaie (table: )",
    properties: {
      mois: { type: 'integer' },
      annee: { type: 'integer' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      statut: { type: 'string', nullable: true },
    }
  },
  RhPlanningPersonnel: {
    type: 'object',
    description: "Modele RhPlanningPersonnel (table: )",
    properties: {
      employeId: { type: 'integer' },
      jourSemaine: { type: 'string' },
      heureDebut: { type: 'string' },
      heureFin: { type: 'string' },
      tache: { type: 'string' },
      couleur: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      description: { type: 'string', nullable: true },
      dateLimitePlanification: { type: 'string' },
    }
  },
  RhPoste: {
    type: 'object',
    description: "Modele RhPoste (table: )",
    properties: {
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      departementId: { type: 'integer' },
    }
  },
  RhPrestataire: {
    type: 'object',
    description: "Modele RhPrestataire (table: )",
    properties: {
      nom: { type: 'string' },
      prenom: { type: 'string' },
      type: { type: 'string' },
      email: { type: 'string' },
      telephone: { type: 'string' },
      adresse: { type: 'string' },
      specialite: { type: 'string' },
      modeReglement: { type: 'string' },
      tauxJournalier: { type: 'integer' },
      numeroCompte: { type: 'string' },
      statut: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      notes: { type: 'string' },
    }
  },
  RhPrestationEnseignant: {
    type: 'object',
    description: "Modele RhPrestationEnseignant (table: )",
    properties: {
      enseignantId: { type: 'integer' },
      coursId: { type: 'string' },
      mois: { type: 'integer' },
      annee: { type: 'integer' },
      nombreHeures: { type: 'integer' },
      tauxHoraire: { type: 'integer' },
      montant: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhPret: {
    type: 'object',
    description: "Modele RhPret (table: )",
    properties: {
      employeId: { type: 'integer' },
      typePret: { type: 'string', nullable: true },
      montant: { type: 'integer' },
      mensualite: { type: 'integer', nullable: true },
      nombreMois: { type: 'integer' },
      dateOctroi: { type: 'string' },
      datePremierRemboursement: { type: 'string', nullable: true },
      soldeRestant: { type: 'integer', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhRemboursementPret: {
    type: 'object',
    description: "Modele RhRemboursementPret (table: )",
    properties: {
      pretId: { type: 'integer' },
      dateRemboursement: { type: 'string' },
      montant: { type: 'integer' },
      soldeApres: { type: 'integer' },
      type: { type: 'string', nullable: true },
    }
  },
  RhRubriquePaie: {
    type: 'object',
    description: "Modele RhRubriquePaie (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
      type: { type: 'string', nullable: true },
      modeCalcul: { type: 'string', nullable: true },
      valeur: { type: 'integer', nullable: true },
      imposable: { type: 'boolean', nullable: true },
      posteId: { type: 'integer', nullable: true },
      categorieId: { type: 'integer', nullable: true },
    }
  },
  RhSoldeConge: {
    type: 'object',
    description: "Modele RhSoldeConge (table: )",
    properties: {
      employeId: { type: 'integer' },
      annee: { type: 'integer' },
      typeConge: { type: 'string' },
      total: { type: 'integer' },
      pris: { type: 'integer', nullable: true },
      reste: { type: 'integer', nullable: true },
    }
  },
  RhTypeContrat: {
    type: 'object',
    description: "Modele RhTypeContrat (table: )",
    properties: {
      code: { type: 'string' },
      libelle: { type: 'string' },
    }
  },
  Role: {
    type: 'object',
    description: "Modele Role (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RolePermission: {
    type: 'object',
    description: "Modele RolePermission (table: )",
    properties: {
      roleId: { type: 'integer' },
      permissionId: { type: 'integer' },
    }
  },
  RptAchat: {
    type: 'object',
    description: "Modele RptAchat (table: )",
    properties: {
      categorieId: { type: 'integer' },
      periode: { type: 'string' },
      nbDemandes: { type: 'integer', nullable: true },
      nbCommandes: { type: 'integer', nullable: true },
      montantTotal: { type: 'integer', nullable: true },
    }
  },
  RptBudgetVsReel: {
    type: 'object',
    description: "Modele RptBudgetVsReel (table: )",
    properties: {
      departementId: { type: 'integer' },
      periode: { type: 'string' },
      budgetPrevu: { type: 'integer', nullable: true },
      budgetReel: { type: 'integer', nullable: true },
      ecart: { type: 'integer', nullable: true },
    }
  },
  RptDocumentAcademique: {
    type: 'object',
    description: "Modele RptDocumentAcademique (table: )",
    properties: {
      typeDocument: { type: 'string' },
      periode: { type: 'string' },
      nbDemandes: { type: 'integer', nullable: true },
      nbDelivres: { type: 'integer', nullable: true },
    }
  },
  RptEffectif: {
    type: 'object',
    description: "Modele RptEffectif (table: )",
    properties: {
      classeId: { type: 'integer' },
      periode: { type: 'string' },
      nbInscrits: { type: 'integer', nullable: true },
      nbActifs: { type: 'integer', nullable: true },
      nbHommes: { type: 'integer', nullable: true },
      nbFemmes: { type: 'integer', nullable: true },
    }
  },
  RptEffectifRh: {
    type: 'object',
    description: "Modele RptEffectifRh (table: )",
    properties: {
      departementId: { type: 'integer' },
      date: { type: 'string' },
      nbEmployes: { type: 'integer', nullable: true },
      nbActifs: { type: 'integer', nullable: true },
      masseSalariale: { type: 'integer', nullable: true },
    }
  },
  RptEvaluation: {
    type: 'object',
    description: "Modele RptEvaluation (table: )",
    properties: {
      periode: { type: 'string' },
      nbEvaluations: { type: 'integer', nullable: true },
      noteMoyenneGlobale: { type: 'integer', nullable: true },
    }
  },
  RptFacture: {
    type: 'object',
    description: "Modele RptFacture (table: )",
    properties: {
      mois: { type: 'string' },
      nbFactures: { type: 'integer', nullable: true },
      montantTotal: { type: 'integer', nullable: true },
      statut: { type: 'string' },
    }
  },
  RptFormationRh: {
    type: 'object',
    description: "Modele RptFormationRh (table: )",
    properties: {
      formationId: { type: 'integer' },
      nbParticipants: { type: 'integer', nullable: true },
      coutTotal: { type: 'integer', nullable: true },
      dureeTotale: { type: 'integer', nullable: true },
    }
  },
  RptImmobilisation: {
    type: 'object',
    description: "Modele RptImmobilisation (table: )",
    properties: {
      categorieId: { type: 'integer' },
      nbActifs: { type: 'integer', nullable: true },
      valeurAcquisition: { type: 'integer', nullable: true },
      amortissementTotal: { type: 'integer', nullable: true },
      valeurNet: { type: 'integer', nullable: true },
    }
  },
  RptInscription: {
    type: 'object',
    description: "Modele RptInscription (table: )",
    properties: {
      sessionId: { type: 'integer' },
      date: { type: 'string' },
      nbInscrits: { type: 'integer', nullable: true },
      montantTotal: { type: 'integer', nullable: true },
      statut: { type: 'string' },
    }
  },
  RptNoteMoyenne: {
    type: 'object',
    description: "Modele RptNoteMoyenne (table: )",
    properties: {
      classeId: { type: 'integer' },
      matiereId: { type: 'integer' },
      periode: { type: 'string' },
      moyenneClasse: { type: 'integer', nullable: true },
      min: { type: 'integer', nullable: true },
      max: { type: 'integer', nullable: true },
      nbEtudiants: { type: 'integer', nullable: true },
    }
  },
  RptPaie: {
    type: 'object',
    description: "Modele RptPaie (table: )",
    properties: {
      periode: { type: 'string' },
      nbBulletins: { type: 'integer', nullable: true },
      totalGains: { type: 'integer', nullable: true },
      totalRetenues: { type: 'integer', nullable: true },
      netTotal: { type: 'integer', nullable: true },
    }
  },
  RptPaiement: {
    type: 'object',
    description: "Modele RptPaiement (table: )",
    properties: {
      date: { type: 'string' },
      modePaiement: { type: 'string' },
      montantTotal: { type: 'integer', nullable: true },
      nbTransactions: { type: 'integer', nullable: true },
    }
  },
  RptPresence: {
    type: 'object',
    description: "Modele RptPresence (table: )",
    properties: {
      coursId: { type: 'integer' },
      seanceId: { type: 'integer' },
      date: { type: 'string' },
      nbPresent: { type: 'integer', nullable: true },
      nbAbsent: { type: 'integer', nullable: true },
      taux: { type: 'integer', nullable: true },
    }
  },
  RptReussite: {
    type: 'object',
    description: "Modele RptReussite (table: )",
    properties: {
      classeId: { type: 'integer' },
      semestre: { type: 'string' },
      annee: { type: 'string' },
      nbAdmis: { type: 'integer', nullable: true },
      nbEchoues: { type: 'integer', nullable: true },
      tauxReussite: { type: 'integer', nullable: true },
    }
  },
  RptStock: {
    type: 'object',
    description: "Modele RptStock (table: )",
    properties: {
      articleId: { type: 'integer' },
      stockActuel: { type: 'integer', nullable: true },
      stockAlerte: { type: 'integer', nullable: true },
      valeurStock: { type: 'integer', nullable: true },
    }
  },
  SalleDeClasse: {
    type: 'object',
    description: "Modele SalleDeClasse (table: )",
    properties: {
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      capacite: { type: 'integer', nullable: true },
      equipements: { type: 'string', nullable: true },
      localisationId: { type: 'integer' },
      classeId: { type: 'integer' },
    }
  },
  Salon: {
    type: 'object',
    description: "Modele Salon (table: )",
    properties: {
      coursId: { type: 'integer' },
      titre: { type: 'string' },
      type: { type: 'string', nullable: true },
      dateCreation: { type: 'string', nullable: true },
      codeInvitation: { type: 'string', nullable: true },
      createdById: { type: 'integer' },
      photo: { type: 'string', nullable: true },
      icone: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      estPrive: { type: 'boolean', nullable: true },
      dernierMessage: { type: 'string', nullable: true },
      dateDernierMessage: { type: 'string', nullable: true },
    }
  },
  SanctionAcademique: {
    type: 'object',
    description: "Modele SanctionAcademique (table: )",
    properties: {
      cursusApprenantId: { type: 'integer' },
      type: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string', nullable: true },
      motif: { type: 'string' },
      decidePar: { type: 'integer' },
    }
  },
  SanctionDiscipline: {
    type: 'object',
    description: "Modele SanctionDiscipline (table: )",
    properties: {
      etudiant: { type: 'string' },
      matricule: { type: 'string' },
      classe: { type: 'string' },
      date: { type: 'string' },
      motif: { type: 'string' },
      sanction: { type: 'string' },
      statut: { type: 'string' },
    }
  },
  Seance: {
    type: 'object',
    description: "Modele Seance (table: )",
    properties: {
      titre: { type: 'string' },
      jourSemaine: { type: 'string' },
      salle: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      heureDebut: { type: 'string' },
      heureFin: { type: 'string' },
      description: { type: 'string', nullable: true },
      coursId: { type: 'integer' },
      enseignantId: { type: 'integer' },
      salleDeClasseId: { type: 'integer' },
    }
  },
  Session: {
    type: 'object',
    description: "Modele Session (table: )",
    properties: {
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      description: { type: 'string', nullable: true },
      anneeAcademiqueId: { type: 'integer' },
      niveauEtudeId: { type: 'integer' },
    }
  },
  SessionExamen: {
    type: 'object',
    description: "Modele SessionExamen (table: )",
    properties: {
      libelle: { type: 'string' },
      type: { type: 'string' },
      classeId: { type: 'integer' },
      anneeAcademiqueId: { type: 'integer' },
      semestre: { type: 'string' },
      dateDebut: { type: 'string', nullable: true },
      dateFin: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      observations: { type: 'string', nullable: true },
    }
  },
  SessionGed: {
    type: 'object',
    description: "Modele SessionGed (table: )",
    properties: {
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      startDate: { type: 'string', nullable: true },
      endDate: { type: 'string', nullable: true },
      folderId: { type: 'integer', nullable: true },
      categorie: { type: 'string', nullable: true },
      status: { type: 'string', nullable: true },
      fields: { type: 'string', nullable: true },
      participantIds: { type: 'integer', nullable: true },
      createdBy: { type: 'integer' },
    }
  },
  Site: {
    type: 'object',
    description: "Modele Site (table: )",
    properties: {
      nom: { type: 'string' },
      adresse: { type: 'string', nullable: true },
    }
  },
  SortieProvisoire: {
    type: 'object',
    description: "Modele SortieProvisoire (table: )",
    properties: {
      immobilisationId: { type: 'integer' },
      dateSortie: { type: 'string' },
      dateRetourPrevu: { type: 'string' },
      dateRetourEffectif: { type: 'string', nullable: true },
      motif: { type: 'string' },
      prestataire: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  SoumissionDevoir: {
    type: 'object',
    description: "Modele SoumissionDevoir (table: )",
    properties: {
      devoirId: { type: 'integer' },
      apprenantId: { type: 'integer' },
      fichier: { type: 'string' },
      note: { type: 'integer', nullable: true },
      commentaire: { type: 'string', nullable: true },
      dateSoumission: { type: 'string', nullable: true },
    }
  },
  Suggestion: {
    type: 'object',
    description: "Modele Suggestion (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      type: { type: 'string' },
      message: { type: 'string' },
      statut: { type: 'string' },
      date: { type: 'string', nullable: true },
    }
  },
  Support: {
    type: 'object',
    description: "Modele Support (table: )",
    properties: {
      moduleId: { type: 'integer' },
      type: { type: 'string' },
      fichierOriginal: { type: 'string' },
      fichierCompresse: { type: 'string', nullable: true },
      dureeVideo: { type: 'string', nullable: true },
      taille: { type: 'string', nullable: true },
    }
  },
  TransfertStock: {
    type: 'object',
    description: "Modele TransfertStock (table: )",
    properties: {
      articleId: { type: 'integer' },
      quantite: { type: 'integer' },
      sourceStockId: { type: 'string', nullable: true },
      destinationStockId: { type: 'string', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Tuteur: {
    type: 'object',
    description: "Modele Tuteur (table: )",
    properties: {
      entrepriseId: { type: 'integer' },
      nom: { type: 'string' },
      fonction: { type: 'string', nullable: true },
      email: { type: 'string' },
      telephone: { type: 'string' },
    }
  },
  TypeDocument: {
    type: 'object',
    description: "Modele TypeDocument (table: )",
    properties: {
      libelle: { type: 'string' },
      frais: { type: 'integer' },
      format: { type: 'string', nullable: true },
    }
  },
  TypeNoteEvaluation: {
    type: 'object',
    description: "Modele TypeNoteEvaluation (table: )",
    properties: {
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      poids: { type: 'integer', nullable: true },
      categorie: { type: 'string', nullable: true },
    }
  },
  UserPermission: {
    type: 'object',
    description: "Modele UserPermission (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      permissionId: { type: 'integer' },
      estActif: { type: 'boolean' },
    }
  },
  UserRole: {
    type: 'object',
    description: "Modele UserRole (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      roleId: { type: 'integer' },
    }
  },
  Utilisateur: {
    type: 'object',
    description: "Modele Utilisateur (table: )",
    properties: {
      nom: { type: 'string' },
      prenoms: { type: 'string' },
      identifiant: { type: 'string' },
      email: { type: 'string' },
      motDePasse: { type: 'string' },
      role: { type: 'string' },
      contact: { type: 'string' },
      tokenVersion: { type: 'integer', nullable: true },
      photoDeProfil: { type: 'string', nullable: true },
      dateVerificationEmail: { type: 'string', nullable: true },
    }
  },
  Validateur: {
    type: 'object',
    description: "Modele Validateur (table: )",
    properties: {
      utilisateurId: { type: 'integer' },
      niveau: { type: 'integer' },
      montantMax: { type: 'integer' },
      actif: { type: 'boolean', nullable: true },
    }
  },
  Validation: {
    type: 'object',
    description: "Modele Validation (table: )",
    properties: {
      demandeId: { type: 'integer' },
      validateurId: { type: 'integer' },
      statut: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      date: { type: 'string', nullable: true },
    }
  },
};
// AUTO-GENERATED SCHEMAS - DO NOT EDIT DIRECTLY
// Generated from Sequelize model declare fields
schemas: {
  Absence: {
    type: 'object',
    description: 'Modele Absence (table: Absence)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      motif: { type: 'string', nullable: true },
      justificatif: { type: 'string', nullable: true },
      declareLe: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Acquisition: {
    type: 'object',
    description: 'Modele Acquisition (table: Acquisition)',
    properties: {
      id: { type: 'string', nullable: true },
      fournisseurNom: { type: 'string' },
      montant: { type: 'number' },
      dateAcquisition: { type: 'string' },
      modeAcquisition: { type: 'string', nullable: true },
    }
  },
  Actualite: {
    type: 'object',
    description: 'Modele Actualite (table: Actualite)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      contenu: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
      image: { type: 'string', nullable: true },
      categorie: { type: 'string', nullable: true },
    }
  },
  AdresseApprenant: {
    type: 'object',
    description: 'Modele AdresseApprenant (table: AdresseApprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      boitePostale: { type: 'string' },
      prorietaireBoitePostale: { type: 'string' },
      telMobile: { type: 'string' },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string' },
      ville: { type: 'string' },
      pays: { type: 'string' },
    }
  },
  AdresseCaissierBanque: {
    type: 'object',
    description: 'Modele AdresseCaissierBanque (table: AdresseCaissierBanque)',
    properties: {
      id: { type: 'string', nullable: true },
      boitePostale: { type: 'string', nullable: true },
      prorietaireBoitePostale: { type: 'string', nullable: true },
      telMobile: { type: 'string', nullable: true },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
    }
  },
  AdresseEnseignant: {
    type: 'object',
    description: 'Modele AdresseEnseignant (table: AdresseEnseignant)',
    properties: {
      id: { type: 'string', nullable: true },
      boitePostale: { type: 'string', nullable: true },
      prorietaireBoitePostale: { type: 'string', nullable: true },
      telMobile: { type: 'string', nullable: true },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
    }
  },
  AdresseInstitution: {
    type: 'object',
    description: 'Modele AdresseInstitution (table: AdresseInstitution)',
    properties: {
      id: { type: 'string', nullable: true },
      boitePostale: { type: 'string', nullable: true },
      prorietaireBoitePostale: { type: 'string', nullable: true },
      telMobile: { type: 'string', nullable: true },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string', nullable: true },
      ville: { type: 'string', nullable: true },
      pays: { type: 'string', nullable: true },
    }
  },
  Affectation: {
    type: 'object',
    description: 'Modele Affectation (table: Affectation)',
    properties: {
      id: { type: 'string', nullable: true },
      responsableNom: { type: 'string', nullable: true },
      dateAffectation: { type: 'string' },
      dateRetour: { type: 'string', nullable: true },
      motif: { type: 'string', nullable: true },
    }
  },
  Amortissement: {
    type: 'object',
    description: 'Modele Amortissement (table: Amortissement)',
    properties: {
      id: { type: 'string', nullable: true },
      annee: { type: 'number' },
      montantAmorti: { type: 'number' },
      valeurResiduelle: { type: 'number' },
      dateCalcul: { type: 'string' },
    }
  },
  AnneeAcademique: {
    type: 'object',
    description: 'Modele AnneeAcademique (table: AnneeAcademique)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  AppelOffre: {
    type: 'object',
    description: 'Modele AppelOffre (table: AppelOffre)',
    properties: {
      id: { type: 'string', nullable: true },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateLancement: { type: 'string', format: 'date-time', nullable: true },
      dateLimiteDepot: { type: 'string', format: 'date-time', nullable: true },
      critereEvaluation: { type: 'string', nullable: true },
      modalitePaiement: { type: 'string', nullable: true },
      garantie: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Apprenant: {
    type: 'object',
    description: 'Modele Apprenant (table: Apprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      photo: { type: 'string', nullable: true },
      qrCode: { type: 'string', nullable: true },
      dateNaissance: { type: 'string', format: 'date-time' },
      lieuNaissance: { type: 'string' },
    }
  },
  Article: {
    type: 'object',
    description: 'Modele Article (table: Article)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      reference: { type: 'string' },
      description: { type: 'string', nullable: true },
      salleDeClasseId: { type: 'number', nullable: true },
      stockActuel: { type: 'number', nullable: true },
      stockMinimum: { type: 'number', nullable: true },
      prixUnitaire: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
      dateMiseEnService: { type: 'string', nullable: true },
      dureeVieEstimee: { type: 'number', nullable: true },
      dateFinVie: { type: 'string', nullable: true },
      motifFinVie: { type: 'string', nullable: true },
    }
  },
  Assurance: {
    type: 'object',
    description: 'Modele Assurance (table: Assurance)',
    properties: {
      id: { type: 'string', nullable: true },
      policeNumber: { type: 'string' },
      assureur: { type: 'string' },
      couverture: { type: 'string', nullable: true },
      primeAnnuelle: { type: 'number', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      statut: { type: 'string', nullable: true },
    }
  },
  AttestationStage: {
    type: 'object',
    description: 'Modele AttestationStage (table: AttestationStage)',
    properties: {
      id: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      dateEmission: { type: 'string' },
    }
  },
  AuditNote: {
    type: 'object',
    description: 'Modele AuditNote (table: AuditNote)',
    properties: {
      id: { type: 'number', nullable: true },
      ancienneNote: { type: 'number', nullable: true },
      nouvelleNote: { type: 'number', nullable: true },
      motif: { type: 'string', nullable: true },
    }
  },
  AvenantMarche: {
    type: 'object',
    description: 'Modele AvenantMarche (table: AvenantMarche)',
    properties: {
      id: { type: 'string', nullable: true },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateSignature: { type: 'string', format: 'date-time', nullable: true },
      montantAvenant: { type: 'number', nullable: true },
      dureeAvenant: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Banque: {
    type: 'object',
    description: 'Modele Banque (table: Banque)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      logo: { type: 'string', nullable: true },
    }
  },
  Batiment: {
    type: 'object',
    description: 'Modele Batiment (table: Batiment)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      adresse: { type: 'string', nullable: true },
    }
  },
  Besoin: {
    type: 'object',
    description: 'Modele Besoin (table: Besoin)',
    properties: {
      id: { type: 'string', nullable: true },
      quantiteRequise: { type: 'number' },
      quantiteApprouvee: { type: 'number', nullable: true },
      urgence: { type: 'string', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      dateBesoin: { type: 'string' },
    }
  },
  BlocCahierDeTexte: {
    type: 'object',
    description: 'Modele BlocCahierDeTexte (table: BlocCahierDeTexte)',
    properties: {
      id: { type: 'number', nullable: true },
      date: { type: 'string', format: 'date-time' },
      heureDebut: { type: 'string', format: 'date-time' },
      heureFin: { type: 'string', format: 'date-time' },
      contenu: { type: 'string' },
    }
  },
  BonCommande: {
    type: 'object',
    description: 'Modele BonCommande (table: BonCommande)',
    properties: {
      id: { type: 'string', nullable: true },
      dateCommande: { type: 'string', format: 'date-time' },
      dateLivraisonPrevue: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      montantTotal: { type: 'number', nullable: true },
    }
  },
  Bordereau: {
    type: 'object',
    description: 'Modele Bordereau (table: Bordereau)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      fichier: { type: 'string' },
      montant: { type: 'number' },
      referenceBancaire: { type: 'string', nullable: true },
      statut: { type: 'string' },
      dateSoumission: { type: 'string', format: 'date-time', nullable: true },
      dateValidation: { type: 'string', format: 'date-time', nullable: true },
      commentaire: { type: 'string', nullable: true },
    }
  },
  Budget: {
    type: 'object',
    description: 'Modele Budget (table: Budget)',
    properties: {
      id: { type: 'string', nullable: true },
      periode: { type: 'string' },
      montantAlloue: { type: 'number' },
      montantUtilise: { type: 'number', nullable: true },
    }
  },
  Bulletin: {
    type: 'object',
    description: 'Modele Bulletin (table: Bulletin)',
    properties: {
      id: { type: 'number', nullable: true },
      semestre: { type: 'string' },
      moyenneGenerale: { type: 'number', nullable: true },
      totalCredits: { type: 'number', nullable: true },
      creditsValides: { type: 'number', nullable: true },
      rang: { type: 'number', nullable: true },
      effectifClasse: { type: 'number', nullable: true },
      mention: { type: 'string', nullable: true },
      appreciation: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      dateGeneration: { type: 'string', format: 'date-time', nullable: true },
      datePublication: { type: 'string', format: 'date-time', nullable: true },
      signatureEnseignant: { type: 'string', nullable: true },
      signatureChef: { type: 'string', nullable: true },
      dateSignatureEnseignant: { type: 'string', format: 'date-time', nullable: true },
      dateSignatureChef: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  CahierDeTexte: {
    type: 'object',
    description: 'Modele CahierDeTexte (table: CahierDeTexte)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  CaissierBanque: {
    type: 'object',
    description: 'Modele CaissierBanque (table: CaissierBanque)',
    properties: {
      id: { type: 'string', nullable: true },
      dateNaissance: { type: 'string', format: 'date-time', nullable: true },
      lieuNaissance: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
    }
  },
  Categorie: {
    type: 'object',
    description: 'Modele Categorie (table: Categorie)',
    properties: {
      id: { type: 'string', nullable: true },
      libelle: { type: 'string' },
      description: { type: 'string' },
    }
  },
  CategorieAchat: {
    type: 'object',
    description: 'Modele CategorieAchat (table: CategorieAchat)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  CategorieArticle: {
    type: 'object',
    description: 'Modele CategorieArticle (table: CategorieArticle)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  CategorieImmobilisation: {
    type: 'object',
    description: 'Modele CategorieImmobilisation (table: CategorieImmobilisation)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      tauxAmortissement: { type: 'number', nullable: true },
      dureeVie: { type: 'number', nullable: true },
      modeAmortissement: { type: 'string', nullable: true },
    }
  },
  Certificat: {
    type: 'object',
    description: 'Modele Certificat (table: Certificat)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      code: { type: 'string', nullable: true },
      dateObtention: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Cession: {
    type: 'object',
    description: 'Modele Cession (table: Cession)',
    properties: {
      id: { type: 'string', nullable: true },
      dateCession: { type: 'string' },
      motif: { type: 'string' },
      typeOperation: { type: 'string', nullable: true },
      prixCession: { type: 'number', nullable: true },
      destinataire: { type: 'string', nullable: true },
      approuvePar: { type: 'string', nullable: true },
      dateApprobation: { type: 'string', format: 'date-time', nullable: true },
      motifRefus: { type: 'string', nullable: true },
    }
  },
  ChapitreCours: {
    type: 'object',
    description: 'Modele ChapitreCours (table: ChapitreCours)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      image: { type: 'string', nullable: true },
    }
  },
  Classe: {
    type: 'object',
    description: 'Modele Classe (table: Classe)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      capaciteMax: { type: 'number', nullable: true },
    }
  },
  ComiteOrientation: {
    type: 'object',
    description: 'Modele ComiteOrientation (table: ComiteOrientation)',
    properties: {
      id: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
    }
  },
  Commande: {
    type: 'object',
    description: 'Modele Commande (table: Commande)',
    properties: {
      id: { type: 'string', nullable: true },
      dateCommande: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Commentaire: {
    type: 'object',
    description: 'Modele Commentaire (table: Commentaire)',
    properties: {
      id: { type: 'string', nullable: true },
      utilisateurId: { type: 'number' },
      message: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Communication: {
    type: 'object',
    description: 'Modele Communication (table: Communication)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      contenu: { type: 'string' },
      datePublication: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string' },
      cible: { type: 'string', nullable: true },
    }
  },
  Compte: {
    type: 'object',
    description: 'Modele Compte (table: Compte)',
    properties: {
      id: { type: 'string', nullable: true },
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
    description: 'Modele CompteBancaire (table: CompteBancaire)',
    properties: {
      id: { type: 'number', nullable: true },
      banque: { type: 'string' },
      rib: { type: 'string' },
      iban: { type: 'string' },
      swift: { type: 'string', nullable: true },
      titulaire: { type: 'string' },
      numeroCompte: { type: 'string' },
      solde: { type: 'number', nullable: true },
      devise: { type: 'string', nullable: true },
      actif: { type: 'boolean', nullable: true },
    }
  },
  ConseilClasse: {
    type: 'object',
    description: 'Modele ConseilClasse (table: ConseilClasse)',
    properties: {
      id: { type: 'number', nullable: true },
      classe: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      trimestre: { type: 'number' },
      president: { type: 'string' },
      statut: { type: 'string' },
      getDecisions: { type: 'string' },
      createDecision: { type: 'string' },
    }
  },
  ContratMarche: {
    type: 'object',
    description: 'Modele ContratMarche (table: ContratMarche)',
    properties: {
      id: { type: 'string', nullable: true },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateSignature: { type: 'string', format: 'date-time', nullable: true },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      montantContractuel: { type: 'number', nullable: true },
      conditionsParticulieres: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  ConventionStage: {
    type: 'object',
    description: 'Modele ConventionStage (table: ConventionStage)',
    properties: {
      id: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      dateSignature: { type: 'string', nullable: true },
    }
  },
  CorrectionStock: {
    type: 'object',
    description: 'Modele CorrectionStock (table: CorrectionStock)',
    properties: {
      id: { type: 'string', nullable: true },
      quantiteAvant: { type: 'number' },
      quantiteApres: { type: 'number' },
      motif: { type: 'string' },
      dateCorrection: { type: 'string' },
    }
  },
  CouplageMail: {
    type: 'object',
    description: 'Modele CouplageMail (table: CouplageMail)',
    properties: {
      id: { type: 'string', nullable: true },
      emailEnvoye: { type: 'string' },
      dateEnvoi: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Cours: {
    type: 'object',
    description: 'Modele Cours (table: Cours)',
    properties: {
      id: { type: 'number', nullable: true },
      code: { type: 'string' },
      intitule: { type: 'string' },
      credit: { type: 'number', nullable: true },
      creditEcts: { type: 'number', nullable: true },
      objectifs: { type: 'string', nullable: true },
      estObligatoire: { type: 'boolean', nullable: true },
      description: { type: 'string', nullable: true },
      semestre: { type: 'string', nullable: true },
      volumeHoraire: { type: 'number', nullable: true },
      coefficient: { type: 'number', nullable: true },
    }
  },
  CoursEnLigne: {
    type: 'object',
    description: 'Modele CoursEnLigne (table: CoursEnLigne)',
    properties: {
      id: { type: 'string', nullable: true },
      coursId: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      image: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      enseignantId: { type: 'number', nullable: true },
      format: { type: 'string', nullable: true },
    }
  },
  CoursParticipant: {
    type: 'object',
    description: 'Modele CoursParticipant (table: CoursParticipant)',
    properties: {
      id: { type: 'number', nullable: true },
    }
  },
  CursusApprenant: {
    type: 'object',
    description: 'Modele CursusApprenant (table: CursusApprenant)',
    properties: {
      id: { type: 'number', nullable: true },
      externe: { type: 'boolean' },
      intituleParcours: { type: 'string' },
    }
  },
  DeboucheParcours: {
    type: 'object',
    description: 'Modele DeboucheParcours (table: DeboucheParcours)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string' },
      video: { type: 'string' },
    }
  },
  DecisionConseil: {
    type: 'object',
    description: 'Modele DecisionConseil (table: DecisionConseil)',
    properties: {
      id: { type: 'number', nullable: true },
      theme: { type: 'string' },
      description: { type: 'string' },
    }
  },
  DecisionPassage: {
    type: 'object',
    description: 'Modele DecisionPassage (table: DecisionPassage)',
    properties: {
      id: { type: 'number', nullable: true },
      deliberationId: { type: 'number', nullable: true },
      moyenneGenerale: { type: 'number' },
      creditsAcquis: { type: 'number' },
      creditsRequis: { type: 'number' },
      decision: { type: 'string' },
      dateDecision: { type: 'string', format: 'date-time' },
    }
  },
  Deliberation: {
    type: 'object',
    description: 'Modele Deliberation (table: Deliberation)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      periode: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      statut: { type: 'string', nullable: true },
      effectif: { type: 'number', nullable: true },
      admis: { type: 'number', nullable: true },
      verrouille: { type: 'boolean', nullable: true },
      sessionType: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      nbAdmis: { type: 'number', nullable: true },
      nbRattrapage: { type: 'number', nullable: true },
      nbAjourne: { type: 'number', nullable: true },
      nbExclu: { type: 'number', nullable: true },
      nbAdmisAvecDette: { type: 'number', nullable: true },
      nbDerogation: { type: 'number', nullable: true },
    }
  },
  Demande: {
    type: 'object',
    description: 'Modele Demande (table: Demande)',
    properties: {
      id: { type: 'string', nullable: true },
      description: { type: 'string' },
      statut: { type: 'string', nullable: true },
      dateSoumission: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  DemandeDocument: {
    type: 'object',
    description: 'Modele DemandeDocument (table: DemandeDocument)',
    properties: {
      id: { type: 'number', nullable: true },
      statut: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
      fraisPayes: { type: 'boolean', nullable: true },
      parcoursId: { type: 'number', nullable: true },
      niveauEtudeId: { type: 'number', nullable: true },
      classeId: { type: 'number', nullable: true },
      anneeAcademiqueId: { type: 'number', nullable: true },
    }
  },
  DemandeInscription: {
    type: 'object',
    description: 'Modele DemandeInscription (table: DemandeInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      matricule: { type: 'string', nullable: true },
      dateDemande: { type: 'string', format: 'date-time' },
      dateValidation: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  DemandeInscriptionCours: {
    type: 'object',
    description: 'Modele DemandeInscriptionCours (table: DemandeInscriptionCours)',
    properties: {
      etat: { type: 'string' },
    }
  },
  DemandeInscriptionDossier: {
    type: 'object',
    description: 'Modele DemandeInscriptionDossier (table: DemandeInscriptionDossier)',
    properties: {
      nomFichier: { type: 'string', nullable: true },
    }
  },
  DemandeOrientation: {
    type: 'object',
    description: 'Modele DemandeOrientation (table: DemandeOrientation)',
    properties: {
      id: { type: 'string', nullable: true },
      dateDemande: { type: 'string', format: 'date-time' },
    }
  },
  DemandePrix: {
    type: 'object',
    description: 'Modele DemandePrix (table: DemandePrix)',
    properties: {
      id: { type: 'string', nullable: true },
      prixPropose: { type: 'number' },
      quantite: { type: 'number' },
      delaiLivraison: { type: 'number', nullable: true },
      dateValidite: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  DemandeReorientation: {
    type: 'object',
    description: 'Modele DemandeReorientation (table: DemandeReorientation)',
    properties: {
      id: { type: 'number', nullable: true },
      motif: { type: 'string' },
      statut: { type: 'string', nullable: true },
      dateTraitement: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  DemandeStage: {
    type: 'object',
    description: 'Modele DemandeStage (table: DemandeStage)',
    properties: {
      id: { type: 'string', nullable: true },
      nouvelleEntreprise: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      statut: { type: 'string', nullable: true },
      motifRejet: { type: 'string', nullable: true },
    }
  },
  DemandeVAE: {
    type: 'object',
    description: 'Modele DemandeVAE (table: DemandeVAE)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      justificatifs: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Departement: {
    type: 'object',
    description: 'Modele Departement (table: Departement)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
    }
  },
  DetteAcademique: {
    type: 'object',
    description: 'Modele DetteAcademique (table: DetteAcademique)',
    properties: {
      id: { type: 'number', nullable: true },
      creditEcts: { type: 'number' },
      nbTentatives: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
      dateLimite: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Devoir: {
    type: 'object',
    description: 'Modele Devoir (table: Devoir)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      dateLimite: { type: 'string', format: 'date-time' },
      fichier: { type: 'string', nullable: true },
    }
  },
  Diplome: {
    type: 'object',
    description: 'Modele Diplome (table: Diplome)',
    properties: {
      id: { type: 'number', nullable: true },
      anneeObtention: { type: 'number' },
      mention: { type: 'string' },
      numeroDiplome: { type: 'string' },
      dateDelivrance: { type: 'string', format: 'date-time' },
      fichierPDF: { type: 'string', nullable: true },
    }
  },
  Dispense: {
    type: 'object',
    description: 'Modele Dispense (table: Dispense)',
    properties: {
      id: { type: 'number', nullable: true },
      motif: { type: 'string' },
      dateValidation: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  DocGenCachet: {
    type: 'object',
    description: 'Modele DocGenCachet (table: DocGenCachet)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      imagePath: { type: 'string' },
      positionX: { type: 'number', nullable: true },
      positionY: { type: 'number', nullable: true },
      width: { type: 'number', nullable: true },
      height: { type: 'number', nullable: true },
      isActive: { type: 'boolean', nullable: true },
    }
  },
  DocGenDocument: {
    type: 'object',
    description: 'Modele DocGenDocument (table: DocGenDocument)',
    properties: {
      id: { type: 'number', nullable: true },
      reference: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      filePath: { type: 'string', nullable: true },
      hash: { type: 'string', nullable: true },
      metadata: { type: 'string', nullable: true },
      sourceType: { type: 'string', nullable: true },
      sourceId: { type: 'number', nullable: true },
      generatedById: { type: 'number', nullable: true },
      version: { type: 'number', nullable: true },
    }
  },
  DocGenReference: {
    type: 'object',
    description: 'Modele DocGenReference (table: DocGenReference)',
    properties: {
      id: { type: 'number', nullable: true },
      annee: { type: 'number' },
      compteur: { type: 'number' },
    }
  },
  DocGenSignature: {
    type: 'object',
    description: 'Modele DocGenSignature (table: DocGenSignature)',
    properties: {
      id: { type: 'number', nullable: true },
      signataireId: { type: 'number' },
      signataireType: { type: 'string' },
      type: { type: 'string' },
      statut: { type: 'string', nullable: true },
      signatureData: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      signedAt: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  DocGenTemplate: {
    type: 'object',
    description: 'Modele DocGenTemplate (table: DocGenTemplate)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      contenu: { type: 'string' },
      variables: { type: 'string', nullable: true },
      version: { type: 'number', nullable: true },
      isDefault: { type: 'boolean', nullable: true },
    }
  },
  DocGenType: {
    type: 'object',
    description: 'Modele DocGenType (table: DocGenType)',
    properties: {
      id: { type: 'number', nullable: true },
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
    description: 'Modele DocGenWorkflow (table: DocGenWorkflow)',
    properties: {
      id: { type: 'number', nullable: true },
      ordre: { type: 'number' },
      role: { type: 'string' },
      libelle: { type: 'string' },
      delaiHeures: { type: 'number', nullable: true },
    }
  },
  DocumentDelivre: {
    type: 'object',
    description: 'Modele DocumentDelivre (table: DocumentDelivre)',
    properties: {
      id: { type: 'number', nullable: true },
      fichierPDF: { type: 'string' },
      dateDelivrance: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  DocumentGed: {
    type: 'object',
    description: 'Modele DocumentGed (table: DocumentGed)',
    properties: {
      id: { type: 'number', nullable: true },
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
      archivedUntil: { type: 'string', format: 'date-time', nullable: true },
      isArchived: { type: 'boolean', nullable: true },
      classificationPath: { type: 'string', nullable: true },
      sourceType: { type: 'string', nullable: true },
      externalIssuer: { type: 'string', nullable: true },
      receptionDate: { type: 'string', format: 'date-time', nullable: true },
      confidentialityLevel: { type: 'string', nullable: true },
      lifecycleStatus: { type: 'string', nullable: true },
      duaEndDate: { type: 'string', format: 'date-time', nullable: true },
      integrityHash: { type: 'string', nullable: true },
      versionMajor: { type: 'number', nullable: true },
      versionMinor: { type: 'number', nullable: true },
      versionComment: { type: 'string', nullable: true },
      parentDocumentId: { type: 'number', nullable: true },
      isCurrentVersion: { type: 'boolean', nullable: true },
      isLocked: { type: 'boolean', nullable: true },
      lockedBy: { type: 'number', nullable: true },
      lockedAt: { type: 'string', format: 'date-time', nullable: true },
      anneeAcademiqueId: { type: 'number', nullable: true },
      parcoursId: { type: 'number', nullable: true },
      niveauEtudeId: { type: 'number', nullable: true },
      semestre: { type: 'string', nullable: true },
      classeId: { type: 'number', nullable: true },
      salleId: { type: 'number', nullable: true },
      cursusApprenantId: { type: 'number', nullable: true },
      inscriptionDossierId: { type: 'number', nullable: true },
      bulletinId: { type: 'number', nullable: true },
      bordereauId: { type: 'number', nullable: true },
      storageLocation: { type: 'string', nullable: true },
      isEncrypted: { type: 'boolean', nullable: true },
      encryptionKeyId: { type: 'string', nullable: true },
      folderId: { type: 'number', nullable: true },
      sessionId: { type: 'number', nullable: true },
      metadata: { type: 'string', nullable: true },
      nbPages: { type: 'number', nullable: true },
      auteur: { type: 'string', nullable: true },
      dateDocument: { type: 'string', format: 'date-time', nullable: true },
      contenuTexte: { type: 'string', nullable: true },
      destinataire: { type: 'string', nullable: true },
      dateEnvoi: { type: 'string', format: 'date-time', nullable: true },
      modeEnvoi: { type: 'string', nullable: true },
      accuseReception: { type: 'boolean', nullable: true },
      numeroCourrier: { type: 'string', nullable: true },
      verificationCode: { type: 'string', nullable: true },
    }
  },
  DossierEtudiant: {
    type: 'object',
    description: 'Modele DossierEtudiant (table: DossierEtudiant)',
    properties: {
      id: { type: 'number', nullable: true },
      matricule: { type: 'string' },
      codeQR: { type: 'string', nullable: true },
      photo: { type: 'string', nullable: true },
      cartePath: { type: 'string', nullable: true },
      carteGeneree: { type: 'boolean', nullable: true },
      statut: { type: 'string' },
      dateCreation: { type: 'string', format: 'date-time', nullable: true },
      fraisScolarite: { type: 'number' },
      modePaiement: { type: 'string' },
      nbMensualites: { type: 'number' },
      demarrageParcours: { type: 'string', format: 'date-time' },
    }
  },
  DossierInscription: {
    type: 'object',
    description: 'Modele DossierInscription (table: DossierInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      tailleMax: { type: 'number' },
    }
  },
  Echeance: {
    type: 'object',
    description: 'Modele Echeance (table: Echeance)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      numeroEcheance: { type: 'number' },
      montant: { type: 'number' },
      devise: { type: 'string', nullable: true },
      dateLimite: { type: 'string', format: 'date-time' },
      datePaiement: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string' },
      moisConcerne: { type: 'string', nullable: true },
    }
  },
  EchelleNote: {
    type: 'object',
    description: 'Modele EchelleNote (table: EchelleNote)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      noteMin: { type: 'number' },
      noteMax: { type: 'number' },
      mention: { type: 'string' },
      estActive: { type: 'boolean', nullable: true },
      ordre: { type: 'number', nullable: true },
    }
  },
  EcritureComptable: {
    type: 'object',
    description: 'Modele EcritureComptable (table: EcritureComptable)',
    properties: {
      id: { type: 'string', nullable: true },
      numeroEcriture: { type: 'string' },
      dateEcriture: { type: 'string', format: 'date-time' },
      dateComptable: { type: 'string', format: 'date-time' },
      montant: { type: 'number' },
      libelle: { type: 'string' },
      reference: { type: 'string', nullable: true },
      pieceJustificative: { type: 'string', nullable: true },
      moduleSource: { type: 'string', nullable: true },
      referenceModuleId: { type: 'string', nullable: true },
      validee: { type: 'boolean' },
      dateValidation: { type: 'string', format: 'date-time', nullable: true },
      observations: { type: 'string', nullable: true },
      lettre: { type: 'string', nullable: true },
      dateLettrage: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Ecue: {
    type: 'object',
    description: 'Modele Ecue (table: Ecue)',
    properties: {
      id: { type: 'number', nullable: true },
      code: { type: 'string' },
      libelle: { type: 'string' },
      creditEcts: { type: 'number', nullable: true },
      coefficient: { type: 'number', nullable: true },
    }
  },
  Engagement: {
    type: 'object',
    description: 'Modele Engagement (table: Engagement)',
    properties: {
      id: { type: 'string', nullable: true },
      montant: { type: 'number' },
      date: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Enseignant: {
    type: 'object',
    description: 'Modele Enseignant (table: Enseignant)',
    properties: {
      id: { type: 'string', nullable: true },
      photo: { type: 'string', nullable: true },
      qrCode: { type: 'string', nullable: true },
      dateNaissance: { type: 'string', format: 'date-time', nullable: true },
      lieuNaissance: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
    }
  },
  Entreprise: {
    type: 'object',
    description: 'Modele Entreprise (table: Entreprise)',
    properties: {
      id: { type: 'string', nullable: true },
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
    description: 'Modele Equivalence (table: Equivalence)',
    properties: {
      id: { type: 'number', nullable: true },
      coursSource: { type: 'string' },
      creditEcts: { type: 'number', nullable: true },
      institutionOrigine: { type: 'string' },
      dateValidation: { type: 'string', format: 'date-time', nullable: true },
      documentJustificatif: { type: 'string', nullable: true },
    }
  },
  Etablissement: {
    type: 'object',
    description: 'Modele Etablissement (table: Etablissement)',
    properties: {
      id: { type: 'string', nullable: true },
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
    description: 'Modele EtapeInscription (table: EtapeInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      ordre: { type: 'number' },
    }
  },
  EvenementCalendrier: {
    type: 'object',
    description: 'Modele EvenementCalendrier (table: EvenementCalendrier)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      description: { type: 'string' },
      type: { type: 'string' },
      recurrence: { type: 'string' },
      dateFinRecurrence: { type: 'string', format: 'date-time', nullable: true },
      couleur: { type: 'string', nullable: true },
      visibilite: { type: 'string' },
      statutEvenement: { type: 'string' },
    }
  },
  FactureProforma: {
    type: 'object',
    description: 'Modele FactureProforma (table: FactureProforma)',
    properties: {
      id: { type: 'string', nullable: true },
      dateEmission: { type: 'string', format: 'date-time', nullable: true },
      montantTotal: { type: 'number' },
      statut: { type: 'string', nullable: true },
    }
  },
  FichierRessource: {
    type: 'object',
    description: 'Modele FichierRessource (table: FichierRessource)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      fichier: { type: 'string' },
    }
  },
  Folder: {
    type: 'object',
    description: 'Modele Folder (table: Folder)',
    properties: {
      id: { type: 'number', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      parentId: { type: 'number', nullable: true },
      domainId: { type: 'number', nullable: true },
      isAutoGenerated: { type: 'boolean', nullable: true },
      folderType: { type: 'string', nullable: true },
      anneeAcademiqueId: { type: 'number', nullable: true },
    }
  },
  Fournisseur: {
    type: 'object',
    description: 'Modele Fournisseur (table: Fournisseur)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      contact: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      telephone: { type: 'string', nullable: true },
      adresse: { type: 'string', nullable: true },
    }
  },
  FraisInscription: {
    type: 'object',
    description: 'Modele FraisInscription (table: FraisInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      montant: { type: 'number' },
      fraisDesCours: { type: 'boolean', nullable: true },
    }
  },
  FraisParcours: {
    type: 'object',
    description: 'Modele FraisParcours (table: FraisParcours)',
    properties: {
      id: { type: 'number', nullable: true },
      montantInscription: { type: 'number', nullable: true },
      montantScolarite: { type: 'number', nullable: true },
      nbMensualites: { type: 'number', nullable: true },
      fraisBibliotheque: { type: 'number', nullable: true },
      fraisAssurance: { type: 'number', nullable: true },
      fraisLogement: { type: 'number', nullable: true },
      autresFrais: { type: 'string', nullable: true },
    }
  },
  HistoriqueDecision: {
    type: 'object',
    description: 'Modele HistoriqueDecision (table: HistoriqueDecision)',
    properties: {
      id: { type: 'number', nullable: true },
      ancienneDecision: { type: 'string' },
      nouvelleDecision: { type: 'string' },
      auteurId: { type: 'number' },
      motif: { type: 'string', nullable: true },
    }
  },
  IdentiteApprenant: {
    type: 'object',
    description: 'Modele IdentiteApprenant (table: IdentiteApprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      nationalite: { type: 'string' },
      ethnie: { type: 'string', nullable: true },
      prefecture: { type: 'string', nullable: true },
      religion: { type: 'string' },
      situationMatrimoniale: { type: 'string' },
      etatPhysique: { type: 'string' },
      handicapMoteur: { type: 'boolean', nullable: true },
      handicapVisuel: { type: 'boolean', nullable: true },
      handicapAuditif: { type: 'boolean', nullable: true },
    }
  },
  Immobilisation: {
    type: 'object',
    description: 'Modele Immobilisation (table: Immobilisation)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      reference: { type: 'string' },
      description: { type: 'string', nullable: true },
      codeQR: { type: 'string', nullable: true },
      salleDeClasseId: { type: 'number', nullable: true },
      etat: { type: 'string', nullable: true },
      dateMiseEnService: { type: 'string' },
      valeurAcquisition: { type: 'number' },
      responsableNom: { type: 'string', nullable: true },
    }
  },
  InformationsParentsApprenant: {
    type: 'object',
    description: 'Modele InformationsParentsApprenant (table: InformationsParentsApprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      pereVivant: { type: 'boolean', nullable: true },
      nomPrenomsPere: { type: 'string' },
      professionPere: { type: 'string' },
      emailPere: { type: 'string', nullable: true },
      mereVivante: { type: 'boolean', nullable: true },
      nomPrenomsMere: { type: 'string' },
      professionMere: { type: 'string' },
      emailMere: { type: 'string', nullable: true },
    }
  },
  InformationsSalarieApprenant: {
    type: 'object',
    description: 'Modele InformationsSalarieApprenant (table: InformationsSalarieApprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      estSalarie: { type: 'boolean', nullable: true },
      profession: { type: 'string', nullable: true },
      entreprise: { type: 'string', nullable: true },
    }
  },
  Institution: {
    type: 'object',
    description: 'Modele Institution (table: Institution)',
    properties: {
      id: { type: 'string', nullable: true },
      dateNaissance: { type: 'string', format: 'date-time', nullable: true },
      lieuNaissance: { type: 'string', nullable: true },
      fonction: { type: 'string', nullable: true },
    }
  },
  Inventaire: {
    type: 'object',
    description: 'Modele Inventaire (table: Inventaire)',
    properties: {
      id: { type: 'string', nullable: true },
      anneeFiscal: { type: 'number' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  InventaireStock: {
    type: 'object',
    description: 'Modele InventaireStock (table: InventaireStock)',
    properties: {
      id: { type: 'string', nullable: true },
      reference: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  JournalComptable: {
    type: 'object',
    description: 'Modele JournalComptable (table: JournalComptable)',
    properties: {
      id: { type: 'string', nullable: true },
      code: { type: 'string' },
      libelle: { type: 'string' },
      type: { type: 'string' },
      description: { type: 'string', nullable: true },
      actif: { type: 'boolean' },
    }
  },
  JuryMembre: {
    type: 'object',
    description: 'Modele JuryMembre (table: JuryMembre)',
    properties: {
      id: { type: 'number', nullable: true },
      role: { type: 'string' },
      estPresent: { type: 'boolean', nullable: true },
    }
  },
  LigneBonCommande: {
    type: 'object',
    description: 'Modele LigneBonCommande (table: LigneBonCommande)',
    properties: {
      id: { type: 'string', nullable: true },
      quantite: { type: 'number' },
      prixUnitaire: { type: 'number' },
    }
  },
  LigneBudget: {
    type: 'object',
    description: 'Modele LigneBudget (table: LigneBudget)',
    properties: {
      id: { type: 'string', nullable: true },
      montantAlloue: { type: 'number' },
      montantUtilise: { type: 'number', nullable: true },
    }
  },
  LigneBulletin: {
    type: 'object',
    description: 'Modele LigneBulletin (table: LigneBulletin)',
    properties: {
      id: { type: 'number', nullable: true },
      moyenneCC: { type: 'number', nullable: true },
      noteDevoir: { type: 'number', nullable: true },
      noteExamen: { type: 'number', nullable: true },
      moyenne: { type: 'number', nullable: true },
      coefficient: { type: 'number', nullable: true },
      rang: { type: 'number', nullable: true },
      appreciation: { type: 'string', nullable: true },
    }
  },
  LigneCommande: {
    type: 'object',
    description: 'Modele LigneCommande (table: LigneCommande)',
    properties: {
      id: { type: 'string', nullable: true },
      designation: { type: 'string' },
      quantite: { type: 'number' },
      prixUnitaire: { type: 'number' },
      total: { type: 'number', nullable: true },
      gereEnStock: { type: 'boolean', nullable: true },
      actifImmobilise: { type: 'boolean', nullable: true },
    }
  },
  LigneDemande: {
    type: 'object',
    description: 'Modele LigneDemande (table: LigneDemande)',
    properties: {
      id: { type: 'string', nullable: true },
      designation: { type: 'string' },
      quantite: { type: 'number' },
      prixEstime: { type: 'number' },
      unite: { type: 'string', nullable: true },
    }
  },
  LigneFacture: {
    type: 'object',
    description: 'Modele LigneFacture (table: LigneFacture)',
    properties: {
      id: { type: 'string', nullable: true },
      designation: { type: 'string' },
      quantite: { type: 'number' },
      prixUnitaire: { type: 'number' },
      total: { type: 'number' },
    }
  },
  LigneFraisEtudiant: {
    type: 'object',
    description: 'Modele LigneFraisEtudiant (table: LigneFraisEtudiant)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      montant: { type: 'number' },
      paye: { type: 'boolean' },
      solde: { type: 'number' },
    }
  },
  LigneInventaire: {
    type: 'object',
    description: 'Modele LigneInventaire (table: LigneInventaire)',
    properties: {
      id: { type: 'string', nullable: true },
      etatDeclare: { type: 'string', nullable: true },
      etatConstate: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
    }
  },
  LigneInventaireStock: {
    type: 'object',
    description: 'Modele LigneInventaireStock (table: LigneInventaireStock)',
    properties: {
      id: { type: 'string', nullable: true },
      quantiteTheorique: { type: 'number' },
      quantiteReelle: { type: 'number' },
      ecart: { type: 'number' },
      commentaire: { type: 'string', nullable: true },
    }
  },
  LigneReception: {
    type: 'object',
    description: 'Modele LigneReception (table: LigneReception)',
    properties: {
      id: { type: 'string', nullable: true },
      quantiteRecue: { type: 'number' },
    }
  },
  LigneReleveBancaire: {
    type: 'object',
    description: 'Modele LigneReleveBancaire (table: LigneReleveBancaire)',
    properties: {
      id: { type: 'number', nullable: true },
      dateOperation: { type: 'string', format: 'date-time' },
      dateValeur: { type: 'string', format: 'date-time', nullable: true },
      libelle: { type: 'string' },
      reference: { type: 'string', nullable: true },
      montant: { type: 'number' },
      type: { type: 'string' },
      rapprochee: { type: 'boolean', nullable: true },
      dateRapprochement: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  ListeNoteEvaluation: {
    type: 'object',
    description: 'Modele ListeNoteEvaluation (table: ListeNoteEvaluation)',
    properties: {
      id: { type: 'number', nullable: true },
      date: { type: 'string', format: 'date-time' },
      heureDebut: { type: 'string', format: 'date-time' },
      heureFin: { type: 'string', format: 'date-time' },
      commentaire: { type: 'string', nullable: true },
      poidsTypeNoteEvaluation: { type: 'string' },
    }
  },
  ListePresence: {
    type: 'object',
    description: 'Modele ListePresence (table: ListePresence)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  Livre: {
    type: 'object',
    description: 'Modele Livre (table: Livre)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      auteur: { type: 'string' },
      description: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      taille: { type: 'string', nullable: true },
      consultations: { type: 'number', nullable: true },
    }
  },
  Localisation: {
    type: 'object',
    description: 'Modele Localisation (table: Localisation)',
    properties: {
      id: { type: 'string', nullable: true },
      code: { type: 'string' },
      capacite: { type: 'number', nullable: true },
    }
  },
  Maintenance: {
    type: 'object',
    description: 'Modele Maintenance (table: Maintenance)',
    properties: {
      id: { type: 'string', nullable: true },
      dateMaintenance: { type: 'string' },
      type: { type: 'string' },
      description: { type: 'string' },
      cout: { type: 'number', nullable: true },
      prestataire: { type: 'string', nullable: true },
    }
  },
  MaintenanceProgrammee: {
    type: 'object',
    description: 'Modele MaintenanceProgrammee (table: MaintenanceProgrammee)',
    properties: {
      id: { type: 'string', nullable: true },
      description: { type: 'string' },
      periodicite: { type: 'string' },
      prochaineEcheance: { type: 'string' },
      actif: { type: 'boolean', nullable: true },
    }
  },
  ManifestationInteret: {
    type: 'object',
    description: 'Modele ManifestationInteret (table: ManifestationInteret)',
    properties: {
      id: { type: 'string', nullable: true },
      reference: { type: 'string' },
      objet: { type: 'string' },
      dateDepot: { type: 'string', format: 'date-time', nullable: true },
      dateOuverture: { type: 'string', format: 'date-time', nullable: true },
      soumissionnaire: { type: 'string' },
      montantEstime: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
      observations: { type: 'string', nullable: true },
    }
  },
  MatierePrerequis: {
    type: 'object',
    description: 'Modele MatierePrerequis (table: MatierePrerequis)',
    properties: {
      id: { type: 'string', nullable: true },
      libelle: { type: 'string' },
    }
  },
  Mcc: {
    type: 'object',
    description: 'Modele Mcc (table: Mcc)',
    properties: {
      id: { type: 'number', nullable: true },
      coefficient: { type: 'number', nullable: true },
      session: { type: 'string', nullable: true },
      estEliminatoire: { type: 'boolean', nullable: true },
      seuilEliminatoire: { type: 'number', nullable: true },
      estObligatoire: { type: 'boolean', nullable: true },
    }
  },
  Message: {
    type: 'object',
    description: 'Modele Message (table: Message)',
    properties: {
      id: { type: 'string', nullable: true },
      utilisateurId: { type: 'number' },
      message: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
      lu: { type: 'boolean', nullable: true },
      typeMessage: { type: 'string', nullable: true },
      pieceJointe: { type: 'string', nullable: true },
      estModifie: { type: 'boolean', nullable: true },
      estSupprime: { type: 'boolean', nullable: true },
    }
  },
  ModuleElearning: {
    type: 'object',
    description: 'Modele ModuleElearning (table: ModuleElearning)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      ordre: { type: 'number', nullable: true },
      dateDisponible: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  MouvementStock: {
    type: 'object',
    description: 'Modele MouvementStock (table: MouvementStock)',
    properties: {
      id: { type: 'string', nullable: true },
      type: { type: 'string' },
      quantite: { type: 'number' },
      motif: { type: 'string', nullable: true },
      prixUnitaire: { type: 'number', nullable: true },
      dateMouvement: { type: 'string', format: 'date-time' },
      utilisateurId: { type: 'number' },
    }
  },
  NiveauEtude: {
    type: 'object',
    description: 'Modele NiveauEtude (table: NiveauEtude)',
    properties: {
      id: { type: 'string', nullable: true },
      libelle: { type: 'string' },
    }
  },
  NoteEvaluation: {
    type: 'object',
    description: 'Modele NoteEvaluation (table: NoteEvaluation)',
    properties: {
      id: { type: 'number', nullable: true },
      note: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  NoteStage: {
    type: 'object',
    description: 'Modele NoteStage (table: NoteStage)',
    properties: {
      id: { type: 'string', nullable: true },
      note: { type: 'number' },
      appreciation: { type: 'string', nullable: true },
    }
  },
  Notification: {
    type: 'object',
    description: 'Modele Notification (table: Notification)',
    properties: {
      id: { type: 'string', nullable: true },
      utilisateurId: { type: 'number' },
      type: { type: 'string' },
      titre: { type: 'string', nullable: true },
      message: { type: 'string' },
      lien: { type: 'string', nullable: true },
      lu: { type: 'boolean', nullable: true },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  OffreStage: {
    type: 'object',
    description: 'Modele OffreStage (table: OffreStage)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string' },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      lieu: { type: 'string' },
      nombrePlaces: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  PaiementInscription: {
    type: 'object',
    description: 'Modele PaiementInscription (table: PaiementInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      numero: { type: 'string' },
      datePaiement: { type: 'string', format: 'date-time' },
      description: { type: 'string', nullable: true },
      montant: { type: 'number' },
      matriculeInscription: { type: 'string' },
      type: { type: 'string' },
    }
  },
  PanierParcoursChoisi: {
    type: 'object',
    description: 'Modele PanierParcoursChoisi (table: PanierParcoursChoisi)',
    properties: {
      id: { type: 'string', nullable: true },
    }
  },
  Parcours: {
    type: 'object',
    description: 'Modele Parcours (table: Parcours)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      image: { type: 'string', nullable: true },
      dureeDeFormation: { type: 'string', nullable: true },
      type: { type: 'string', nullable: true },
      videoExplicative: { type: 'string', nullable: true },
      contenu: { type: 'string' },
    }
  },
  ParcoursChoisi: {
    type: 'object',
    description: 'Modele ParcoursChoisi (table: ParcoursChoisi)',
    properties: {
      id: { type: 'string', nullable: true },
      etatDeValidation: { type: 'string' },
      messageDeValidation: { type: 'string' },
    }
  },
  ParentEnfant: {
    type: 'object',
    description: 'Modele ParentEnfant (table: ParentEnfant)',
    properties: {
      id: { type: 'number', nullable: true },
    }
  },
  ParticipantSalon: {
    type: 'object',
    description: 'Modele ParticipantSalon (table: ParticipantSalon)',
    properties: {
      id: { type: 'string', nullable: true },
      utilisateurId: { type: 'number' },
      dateAjout: { type: 'string', format: 'date-time', nullable: true },
      role: { type: 'string', nullable: true },
      dateDerniereLecture: { type: 'string', format: 'date-time', nullable: true },
      estPresent: { type: 'boolean', nullable: true },
    }
  },
  PenaliteRetard: {
    type: 'object',
    description: 'Modele PenaliteRetard (table: PenaliteRetard)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      pourcentage: { type: 'number' },
      nbJoursGrace: { type: 'number', nullable: true },
      montantMaximum: { type: 'number', nullable: true },
      actif: { type: 'boolean', nullable: true },
    }
  },
  Permission: {
    type: 'object',
    description: 'Modele Permission (table: Permission)',
    properties: {
      id: { type: 'string', nullable: true },
      key: { type: 'string' },
      libelle: { type: 'string' },
      module: { type: 'string' },
      type: { type: 'string' },
      parentKey: { type: 'string', nullable: true },
    }
  },
  PersonnePrevenirApprenant: {
    type: 'object',
    description: 'Modele PersonnePrevenirApprenant (table: PersonnePrevenirApprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      prenoms: { type: 'string' },
      boitePostale: { type: 'string', nullable: true },
      email: { type: 'string', nullable: true },
      telMobile: { type: 'string' },
      telDomicile: { type: 'string', nullable: true },
      quartier: { type: 'string' },
      ville: { type: 'string' },
      pays: { type: 'string' },
    }
  },
  PlanificationMarche: {
    type: 'object',
    description: 'Modele PlanificationMarche (table: PlanificationMarche)',
    properties: {
      id: { type: 'string', nullable: true },
      libelle: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      description: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Pointage: {
    type: 'object',
    description: 'Modele Pointage (table: Pointage)',
    properties: {
      id: { type: 'number', nullable: true },
      date: { type: 'string', format: 'date-time' },
      heureArrivee: { type: 'string', format: 'date-time' },
      heureDepart: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  PreInscription: {
    type: 'object',
    description: 'Modele PreInscription (table: PreInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      statut: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      dateTraitement: { type: 'string', format: 'date-time', nullable: true },
      autorisationPDF: { type: 'string', nullable: true },
    }
  },
  PrerequisParcours: {
    type: 'object',
    description: 'Modele PrerequisParcours (table: PrerequisParcours)',
    properties: {
      id: { type: 'string', nullable: true },
      noteRequise: { type: 'number' },
      typeEvaluation: { type: 'string' },
      periodeEvaluation: { type: 'string' },
    }
  },
  PrerequisParcoursChoisi: {
    type: 'object',
    description: 'Modele PrerequisParcoursChoisi (table: PrerequisParcoursChoisi)',
    properties: {
      id: { type: 'string', nullable: true },
      note: { type: 'number' },
    }
  },
  Presence: {
    type: 'object',
    description: 'Modele Presence (table: Presence)',
    properties: {
      id: { type: 'number', nullable: true },
      date: { type: 'string', format: 'date-time' },
      heureDebut: { type: 'string', format: 'date-time' },
      heureFin: { type: 'string', format: 'date-time' },
      signature: { type: 'string', nullable: true },
      signedAt: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  PresenceCoursParticipant: {
    type: 'object',
    description: 'Modele PresenceCoursParticipant (table: PresenceCoursParticipant)',
    properties: {
      etatDePresence: { type: 'string', nullable: true },
    }
  },
  ProcessusGenerateur: {
    type: 'object',
    description: 'Modele ProcessusGenerateur (table: ProcessusGenerateur)',
    properties: {
      id: { type: 'string', nullable: true },
      code: { type: 'string' },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      moduleSource: { type: 'string', nullable: true },
      isActif: { type: 'boolean', nullable: true },
    }
  },
  ProgressionApprenant: {
    type: 'object',
    description: 'Modele ProgressionApprenant (table: ProgressionApprenant)',
    properties: {
      id: { type: 'string', nullable: true },
      termine: { type: 'boolean', nullable: true },
      tempsPasse: { type: 'number', nullable: true },
      dernierAcces: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  ProgressionPedagogique: {
    type: 'object',
    description: 'Modele ProgressionPedagogique (table: ProgressionPedagogique)',
    properties: {
      id: { type: 'number', nullable: true },
      semaine: { type: 'number' },
      volumeHoraire: { type: 'number' },
      statut: { type: 'string' },
    }
  },
  PublicationNote: {
    type: 'object',
    description: 'Modele PublicationNote (table: PublicationNote)',
    properties: {
      id: { type: 'number', nullable: true },
      datePublication: { type: 'string', format: 'date-time', nullable: true },
      message: { type: 'string', nullable: true },
      nbEtudiantsNotifies: { type: 'number', nullable: true },
    }
  },
  QuaActionCorrective: {
    type: 'object',
    description: 'Modele QuaActionCorrective (table: QuaActionCorrective)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      description: { type: 'string' },
      responsableId: { type: 'number' },
      dateLimite: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
      efficacite: { type: 'string', nullable: true },
    }
  },
  QuaAudit: {
    type: 'object',
    description: 'Modele QuaAudit (table: QuaAudit)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      titre: { type: 'string' },
      processus: { type: 'string' },
      datePlanifiee: { type: 'string', format: 'date-time' },
      dateRealisation: { type: 'string', format: 'date-time', nullable: true },
      equipe: { type: 'string' },
      referentiel: { type: 'string', nullable: true },
      constats: { type: 'string', nullable: true },
      conclusion: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  QuaAuditPiste: {
    type: 'object',
    description: 'Modele QuaAuditPiste (table: QuaAuditPiste)',
    properties: {
      id: { type: 'number', nullable: true },
      reference: { type: 'string' },
      critere: { type: 'string' },
      constat: { type: 'string', nullable: true },
      note: { type: 'number', nullable: true },
      conforme: { type: 'boolean', nullable: true },
    }
  },
  QuaDecisionRevue: {
    type: 'object',
    description: 'Modele QuaDecisionRevue (table: QuaDecisionRevue)',
    properties: {
      id: { type: 'number', nullable: true },
      decision: { type: 'string' },
      responsableId: { type: 'number' },
      dateEcheance: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  QuaEnqueteSatisfaction: {
    type: 'object',
    description: 'Modele QuaEnqueteSatisfaction (table: QuaEnqueteSatisfaction)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      cible: { type: 'string' },
      questions: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      statut: { type: 'string', nullable: true },
    }
  },
  QuaNonConformite: {
    type: 'object',
    description: 'Modele QuaNonConformite (table: QuaNonConformite)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      source: { type: 'string' },
      processus: { type: 'string' },
      description: { type: 'string' },
      cause: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      priorite: { type: 'string', nullable: true },
      declareePar: { type: 'number' },
      declareeLe: { type: 'string', format: 'date-time', nullable: true },
      clotureeLe: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  QuaReponseSatisfaction: {
    type: 'object',
    description: 'Modele QuaReponseSatisfaction (table: QuaReponseSatisfaction)',
    properties: {
      id: { type: 'number', nullable: true },
      utilisateurId: { type: 'number' },
      reponses: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      soumiseLe: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  QuaRevueDirection: {
    type: 'object',
    description: 'Modele QuaRevueDirection (table: QuaRevueDirection)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      dateTenue: { type: 'string', format: 'date-time' },
      participants: { type: 'string' },
      ordreJour: { type: 'string' },
      compteRendu: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Quitus: {
    type: 'object',
    description: 'Modele Quitus (table: Quitus)',
    properties: {
      id: { type: 'number', nullable: true },
      code: { type: 'string' },
      dateEmission: { type: 'string', format: 'date-time', nullable: true },
      fichierPDF: { type: 'string', nullable: true },
      statut: { type: 'string' },
    }
  },
  Quiz: {
    type: 'object',
    description: 'Modele Quiz (table: Quiz)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      tempsLimite: { type: 'number', nullable: true },
      questions: { type: 'string' },
    }
  },
  RapportStage: {
    type: 'object',
    description: 'Modele RapportStage (table: RapportStage)',
    properties: {
      id: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      dateSoumission: { type: 'string' },
    }
  },
  RattrapageInscription: {
    type: 'object',
    description: 'Modele RattrapageInscription (table: RattrapageInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      noteRattrapage: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
      enseignantId: { type: 'number', nullable: true },
      salle: { type: 'string', nullable: true },
      dateRattrapage: { type: 'string', format: 'date-time', nullable: true },
      heureDebut: { type: 'string', nullable: true },
      heureFin: { type: 'string', nullable: true },
      notificationEnvoyee: { type: 'boolean', nullable: true },
    }
  },
  Rebut: {
    type: 'object',
    description: 'Modele Rebut (table: Rebut)',
    properties: {
      id: { type: 'string', nullable: true },
      quantite: { type: 'number' },
      motif: { type: 'string' },
      dateRebut: { type: 'string' },
      coutEstime: { type: 'number', nullable: true },
    }
  },
  RebutImmobilisation: {
    type: 'object',
    description: 'Modele RebutImmobilisation (table: RebutImmobilisation)',
    properties: {
      id: { type: 'string', nullable: true },
      dateRebut: { type: 'string', format: 'date-time', nullable: true },
      motif: { type: 'string' },
      montant: { type: 'number', nullable: true },
      approuvePar: { type: 'string', nullable: true },
      dateApprobation: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Reception: {
    type: 'object',
    description: 'Modele Reception (table: Reception)',
    properties: {
      id: { type: 'string', nullable: true },
      date: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string' },
      notes: { type: 'string', nullable: true },
    }
  },
  Reclamation: {
    type: 'object',
    description: 'Modele Reclamation (table: Reclamation)',
    properties: {
      id: { type: 'number', nullable: true },
      evaluationId: { type: 'string', nullable: true },
      motif: { type: 'string' },
      statut: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  ReductionFrais: {
    type: 'object',
    description: 'Modele ReductionFrais (table: ReductionFrais)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      mode: { type: 'string' },
      valeur: { type: 'number' },
      description: { type: 'string', nullable: true },
      dateDebut: { type: 'string', format: 'date-time', nullable: true },
      dateFin: { type: 'string', format: 'date-time', nullable: true },
      actif: { type: 'boolean', nullable: true },
    }
  },
  RegistreAcademique: {
    type: 'object',
    description: 'Modele RegistreAcademique (table: RegistreAcademique)',
    properties: {
      id: { type: 'number', nullable: true },
      etudiant: { type: 'string' },
      matricule: { type: 'string' },
      classe: { type: 'string' },
      moyenne: { type: 'number' },
      rang: { type: 'number' },
      decision: { type: 'string' },
      anneeScolaire: { type: 'string' },
    }
  },
  RegistreCourrier: {
    type: 'object',
    description: 'Modele RegistreCourrier (table: RegistreCourrier)',
    properties: {
      id: { type: 'number', nullable: true },
      sens: { type: 'string' },
      numeroOrdre: { type: 'number' },
      annee: { type: 'number' },
      dateCourrier: { type: 'string', format: 'date-time', nullable: true },
      expediteur: { type: 'string', nullable: true },
      destinataire: { type: 'string', nullable: true },
      objet: { type: 'string' },
      modeEnvoi: { type: 'string', nullable: true },
      accuseReception: { type: 'boolean', nullable: true },
      referenceDocument: { type: 'string', nullable: true },
      annotations: { type: 'string', nullable: true },
    }
  },
  RegleEvaluation: {
    type: 'object',
    description: 'Modele RegleEvaluation (table: RegleEvaluation)',
    properties: {
      id: { type: 'number', nullable: true },
      semestre: { type: 'string', nullable: true },
      type: { type: 'string' },
      valeur: { type: 'string' },
      actif: { type: 'boolean', nullable: true },
      description: { type: 'string', nullable: true },
    }
  },
  ReleveBancaire: {
    type: 'object',
    description: 'Modele ReleveBancaire (table: ReleveBancaire)',
    properties: {
      id: { type: 'number', nullable: true },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      soldeOuverture: { type: 'number' },
      soldeFermeture: { type: 'number' },
      reference: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  ReponseInscription: {
    type: 'object',
    description: 'Modele ReponseInscription (table: ReponseInscription)',
    properties: {
      id: { type: 'number', nullable: true },
      message: { type: 'string', nullable: true },
      dateReponse: { type: 'string', format: 'date-time' },
    }
  },
  ReponseOrientation: {
    type: 'object',
    description: 'Modele ReponseOrientation (table: ReponseOrientation)',
    properties: {
      id: { type: 'string', nullable: true },
      message: { type: 'string', nullable: true },
      dateReponse: { type: 'string', format: 'date-time' },
      dateAutorisationProvisoire: { type: 'string', format: 'date-time', nullable: true },
      statutAutorisation: { type: 'string', nullable: true },
    }
  },
  ReponseQuiz: {
    type: 'object',
    description: 'Modele ReponseQuiz (table: ReponseQuiz)',
    properties: {
      id: { type: 'string', nullable: true },
      reponses: { type: 'string' },
      score: { type: 'number', nullable: true },
      total: { type: 'number', nullable: true },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  ReponseReclamation: {
    type: 'object',
    description: 'Modele ReponseReclamation (table: ReponseReclamation)',
    properties: {
      id: { type: 'number', nullable: true },
      reponse: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  ReponseSuggestion: {
    type: 'object',
    description: 'Modele ReponseSuggestion (table: ReponseSuggestion)',
    properties: {
      id: { type: 'string', nullable: true },
      message: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Ressource: {
    type: 'object',
    description: 'Modele Ressource (table: Ressource)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      type: { type: 'string', nullable: true },
      dateDebut: { type: 'string', format: 'date-time', nullable: true },
      dateFin: { type: 'string', format: 'date-time', nullable: true },
      active: { type: 'boolean', nullable: true },
    }
  },
  ResultatDeliberation: {
    type: 'object',
    description: 'Modele ResultatDeliberation (table: ResultatDeliberation)',
    properties: {
      id: { type: 'number', nullable: true },
      nom: { type: 'string' },
      prenoms: { type: 'string' },
      matricule: { type: 'string' },
      moyenne: { type: 'number', nullable: true },
      mention: { type: 'string', nullable: true },
      rang: { type: 'number', nullable: true },
      decision: { type: 'string', nullable: true },
      assiduite: { type: 'string', nullable: true },
      situationFinanciere: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      totalCredits: { type: 'number', nullable: true },
      creditsValides: { type: 'number', nullable: true },
    }
  },
  RhBulletinPaie: {
    type: 'object',
    description: 'Modele RhBulletinPaie (table: RhBulletinPaie)',
    properties: {
      id: { type: 'string', nullable: true },
      totalGains: { type: 'number', nullable: true },
      totalRetenues: { type: 'number', nullable: true },
      netAPayer: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhCandidature: {
    type: 'object',
    description: 'Modele RhCandidature (table: RhCandidature)',
    properties: {
      id: { type: 'string', nullable: true },
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
    description: 'Modele RhCategorieProfessionnelle (table: RhCategorieProfessionnelle)',
    properties: {
      id: { type: 'string', nullable: true },
      code: { type: 'string' },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RhContratEnseignant: {
    type: 'object',
    description: 'Modele RhContratEnseignant (table: RhContratEnseignant)',
    properties: {
      id: { type: 'number', nullable: true },
      typeContrat: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
      montantMensuel: { type: 'number', nullable: true },
      tauxHoraire: { type: 'number', nullable: true },
      volumeHoraireMensuel: { type: 'number', nullable: true },
      description: { type: 'string', nullable: true },
      pieceJointe: { type: 'string', nullable: true },
    }
  },
  RhCritereEvaluation: {
    type: 'object',
    description: 'Modele RhCritereEvaluation (table: RhCritereEvaluation)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      poids: { type: 'number', nullable: true },
    }
  },
  RhDemandeConge: {
    type: 'object',
    description: 'Modele RhDemandeConge (table: RhDemandeConge)',
    properties: {
      id: { type: 'number', nullable: true },
      typeConge: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      duree: { type: 'number', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
      valideePar: { type: 'number', nullable: true },
      commentaireValidation: { type: 'string', nullable: true },
    }
  },
  RhDepartement: {
    type: 'object',
    description: 'Modele RhDepartement (table: RhDepartement)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RhEmploye: {
    type: 'object',
    description: 'Modele RhEmploye (table: RhEmploye)',
    properties: {
      id: { type: 'string', nullable: true },
      utilisateurId: { type: 'string' },
      dateEmbauche: { type: 'string', format: 'date-time' },
      salaireBase: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhEntretien: {
    type: 'object',
    description: 'Modele RhEntretien (table: RhEntretien)',
    properties: {
      id: { type: 'string', nullable: true },
      date: { type: 'string', format: 'date-time' },
      heure: { type: 'string' },
      lieu: { type: 'string', nullable: true },
      commentaire: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhEvaluationCritere: {
    type: 'object',
    description: 'Modele RhEvaluationCritere (table: RhEvaluationCritere)',
    properties: {
      id: { type: 'string', nullable: true },
      note: { type: 'number' },
    }
  },
  RhFicheEvaluation: {
    type: 'object',
    description: 'Modele RhFicheEvaluation (table: RhFicheEvaluation)',
    properties: {
      id: { type: 'string', nullable: true },
      evaluateurId: { type: 'string' },
      dateEvaluation: { type: 'string', format: 'date-time' },
      noteGlobale: { type: 'number', nullable: true },
      commentaire: { type: 'string', nullable: true },
    }
  },
  RhFormation: {
    type: 'object',
    description: 'Modele RhFormation (table: RhFormation)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      formateur: { type: 'string' },
      type: { type: 'string', nullable: true },
    }
  },
  RhGrilleSalariale: {
    type: 'object',
    description: 'Modele RhGrilleSalariale (table: RhGrilleSalariale)',
    properties: {
      id: { type: 'string', nullable: true },
      salaireMin: { type: 'number' },
      salaireMax: { type: 'number' },
      echelon: { type: 'string', nullable: true },
      anneeVigueur: { type: 'number' },
    }
  },
  RhHeureSupplementaire: {
    type: 'object',
    description: 'Modele RhHeureSupplementaire (table: RhHeureSupplementaire)',
    properties: {
      id: { type: 'string', nullable: true },
      date: { type: 'string' },
      nombreHeures: { type: 'number' },
      tauxMajoration: { type: 'number', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhIndemnitePrestataire: {
    type: 'object',
    description: 'Modele RhIndemnitePrestataire (table: RhIndemnitePrestataire)',
    properties: {
      id: { type: 'string', nullable: true },
      typeIndemnite: { type: 'string' },
      libelle: { type: 'string' },
      montant: { type: 'number' },
      devise: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      nombreJours: { type: 'number' },
      description: { type: 'string' },
      statut: { type: 'string', nullable: true },
      datePaiement: { type: 'string' },
      modePaiement: { type: 'string' },
      validePar: { type: 'string' },
    }
  },
  RhLigneBulletin: {
    type: 'object',
    description: 'Modele RhLigneBulletin (table: RhLigneBulletin)',
    properties: {
      id: { type: 'string', nullable: true },
      libelle: { type: 'string', nullable: true },
      base: { type: 'number', nullable: true },
      taux: { type: 'number', nullable: true },
      montant: { type: 'number', nullable: true },
    }
  },
  RhOffreEmploi: {
    type: 'object',
    description: 'Modele RhOffreEmploi (table: RhOffreEmploi)',
    properties: {
      id: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      datePublication: { type: 'string', format: 'date-time', nullable: true },
      dateCloture: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhParticipationFormation: {
    type: 'object',
    description: 'Modele RhParticipationFormation (table: RhParticipationFormation)',
    properties: {
      id: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhPeriodePaie: {
    type: 'object',
    description: 'Modele RhPeriodePaie (table: RhPeriodePaie)',
    properties: {
      id: { type: 'string', nullable: true },
      mois: { type: 'number' },
      annee: { type: 'number' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      statut: { type: 'string', nullable: true },
    }
  },
  RhPlanningPersonnel: {
    type: 'object',
    description: 'Modele RhPlanningPersonnel (table: RhPlanningPersonnel)',
    properties: {
      id: { type: 'string', nullable: true },
      jourSemaine: { type: 'string' },
      heureDebut: { type: 'string', format: 'date-time' },
      heureFin: { type: 'string', format: 'date-time' },
      tache: { type: 'string' },
      couleur: { type: 'string', nullable: true },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      description: { type: 'string', nullable: true },
      dateLimitePlanification: { type: 'string' },
    }
  },
  RhPoste: {
    type: 'object',
    description: 'Modele RhPoste (table: RhPoste)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RhPrestataire: {
    type: 'object',
    description: 'Modele RhPrestataire (table: RhPrestataire)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      prenom: { type: 'string' },
      type: { type: 'string' },
      email: { type: 'string' },
      telephone: { type: 'string' },
      adresse: { type: 'string' },
      specialite: { type: 'string' },
      modeReglement: { type: 'string' },
      tauxJournalier: { type: 'number' },
      numeroCompte: { type: 'string' },
      statut: { type: 'string', nullable: true },
      dateDebut: { type: 'string' },
      dateFin: { type: 'string' },
      notes: { type: 'string' },
    }
  },
  RhPrestationEnseignant: {
    type: 'object',
    description: 'Modele RhPrestationEnseignant (table: RhPrestationEnseignant)',
    properties: {
      id: { type: 'string', nullable: true },
      coursId: { type: 'string' },
      mois: { type: 'number' },
      annee: { type: 'number' },
      nombreHeures: { type: 'number' },
      tauxHoraire: { type: 'number' },
      montant: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhPret: {
    type: 'object',
    description: 'Modele RhPret (table: RhPret)',
    properties: {
      id: { type: 'string', nullable: true },
      typePret: { type: 'string', nullable: true },
      montant: { type: 'number' },
      mensualite: { type: 'number', nullable: true },
      nombreMois: { type: 'number' },
      dateOctroi: { type: 'string' },
      datePremierRemboursement: { type: 'string', nullable: true },
      soldeRestant: { type: 'number', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  RhRemboursementPret: {
    type: 'object',
    description: 'Modele RhRemboursementPret (table: RhRemboursementPret)',
    properties: {
      id: { type: 'string', nullable: true },
      dateRemboursement: { type: 'string' },
      montant: { type: 'number' },
      soldeApres: { type: 'number' },
      type: { type: 'string', nullable: true },
    }
  },
  RhRubriquePaie: {
    type: 'object',
    description: 'Modele RhRubriquePaie (table: RhRubriquePaie)',
    properties: {
      id: { type: 'string', nullable: true },
      code: { type: 'string' },
      libelle: { type: 'string' },
      type: { type: 'string', nullable: true },
      modeCalcul: { type: 'string', nullable: true },
      valeur: { type: 'number', nullable: true },
      imposable: { type: 'boolean', nullable: true },
      posteId: { type: 'number', nullable: true },
      categorieId: { type: 'number', nullable: true },
    }
  },
  RhSoldeConge: {
    type: 'object',
    description: 'Modele RhSoldeConge (table: RhSoldeConge)',
    properties: {
      id: { type: 'number', nullable: true },
      annee: { type: 'number' },
      typeConge: { type: 'string' },
      total: { type: 'number' },
      pris: { type: 'number', nullable: true },
      reste: { type: 'number', nullable: true },
    }
  },
  RhTypeContrat: {
    type: 'object',
    description: 'Modele RhTypeContrat (table: RhTypeContrat)',
    properties: {
      id: { type: 'string', nullable: true },
      code: { type: 'string' },
      libelle: { type: 'string' },
    }
  },
  Role: {
    type: 'object',
    description: 'Modele Role (table: Role)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
    }
  },
  RolePermission: {
    type: 'object',
    description: 'Modele RolePermission (table: RolePermission)',
    properties: {
      id: { type: 'string', nullable: true },
    }
  },
  RptAchat: {
    type: 'object',
    description: 'Modele RptAchat (table: RptAchat)',
    properties: {
      id: { type: 'string', nullable: true },
      categorieId: { type: 'number' },
      periode: { type: 'string' },
      nbDemandes: { type: 'number', nullable: true },
      nbCommandes: { type: 'number', nullable: true },
      montantTotal: { type: 'number', nullable: true },
    }
  },
  RptBudgetVsReel: {
    type: 'object',
    description: 'Modele RptBudgetVsReel (table: RptBudgetVsReel)',
    properties: {
      id: { type: 'string', nullable: true },
      departementId: { type: 'number' },
      periode: { type: 'string' },
      budgetPrevu: { type: 'number', nullable: true },
      budgetReel: { type: 'number', nullable: true },
      ecart: { type: 'number', nullable: true },
    }
  },
  RptDocumentAcademique: {
    type: 'object',
    description: 'Modele RptDocumentAcademique (table: RptDocumentAcademique)',
    properties: {
      id: { type: 'string', nullable: true },
      typeDocument: { type: 'string' },
      periode: { type: 'string' },
      nbDemandes: { type: 'number', nullable: true },
      nbDelivres: { type: 'number', nullable: true },
    }
  },
  RptEffectif: {
    type: 'object',
    description: 'Modele RptEffectif (table: RptEffectif)',
    properties: {
      id: { type: 'string', nullable: true },
      classeId: { type: 'number' },
      periode: { type: 'string' },
      nbInscrits: { type: 'number', nullable: true },
      nbActifs: { type: 'number', nullable: true },
      nbHommes: { type: 'number', nullable: true },
      nbFemmes: { type: 'number', nullable: true },
    }
  },
  RptEffectifRh: {
    type: 'object',
    description: 'Modele RptEffectifRh (table: RptEffectifRh)',
    properties: {
      id: { type: 'string', nullable: true },
      departementId: { type: 'number' },
      date: { type: 'string', format: 'date-time' },
      nbEmployes: { type: 'number', nullable: true },
      nbActifs: { type: 'number', nullable: true },
      masseSalariale: { type: 'number', nullable: true },
    }
  },
  RptEvaluation: {
    type: 'object',
    description: 'Modele RptEvaluation (table: RptEvaluation)',
    properties: {
      id: { type: 'string', nullable: true },
      periode: { type: 'string' },
      nbEvaluations: { type: 'number', nullable: true },
      noteMoyenneGlobale: { type: 'number', nullable: true },
    }
  },
  RptFacture: {
    type: 'object',
    description: 'Modele RptFacture (table: RptFacture)',
    properties: {
      id: { type: 'string', nullable: true },
      mois: { type: 'string' },
      nbFactures: { type: 'number', nullable: true },
      montantTotal: { type: 'number', nullable: true },
      statut: { type: 'string' },
    }
  },
  RptFormationRh: {
    type: 'object',
    description: 'Modele RptFormationRh (table: RptFormationRh)',
    properties: {
      id: { type: 'string', nullable: true },
      formationId: { type: 'number' },
      nbParticipants: { type: 'number', nullable: true },
      coutTotal: { type: 'number', nullable: true },
      dureeTotale: { type: 'number', nullable: true },
    }
  },
  RptImmobilisation: {
    type: 'object',
    description: 'Modele RptImmobilisation (table: RptImmobilisation)',
    properties: {
      id: { type: 'string', nullable: true },
      categorieId: { type: 'number' },
      nbActifs: { type: 'number', nullable: true },
      valeurAcquisition: { type: 'number', nullable: true },
      amortissementTotal: { type: 'number', nullable: true },
      valeurNet: { type: 'number', nullable: true },
    }
  },
  RptInscription: {
    type: 'object',
    description: 'Modele RptInscription (table: RptInscription)',
    properties: {
      id: { type: 'string', nullable: true },
      sessionId: { type: 'number' },
      date: { type: 'string', format: 'date-time' },
      nbInscrits: { type: 'number', nullable: true },
      montantTotal: { type: 'number', nullable: true },
      statut: { type: 'string' },
    }
  },
  RptNoteMoyenne: {
    type: 'object',
    description: 'Modele RptNoteMoyenne (table: RptNoteMoyenne)',
    properties: {
      id: { type: 'string', nullable: true },
      classeId: { type: 'number' },
      matiereId: { type: 'number' },
      periode: { type: 'string' },
      moyenneClasse: { type: 'number', nullable: true },
      min: { type: 'number', nullable: true },
      max: { type: 'number', nullable: true },
      nbEtudiants: { type: 'number', nullable: true },
    }
  },
  RptPaie: {
    type: 'object',
    description: 'Modele RptPaie (table: RptPaie)',
    properties: {
      id: { type: 'string', nullable: true },
      periode: { type: 'string' },
      nbBulletins: { type: 'number', nullable: true },
      totalGains: { type: 'number', nullable: true },
      totalRetenues: { type: 'number', nullable: true },
      netTotal: { type: 'number', nullable: true },
    }
  },
  RptPaiement: {
    type: 'object',
    description: 'Modele RptPaiement (table: RptPaiement)',
    properties: {
      id: { type: 'string', nullable: true },
      date: { type: 'string', format: 'date-time' },
      modePaiement: { type: 'string' },
      montantTotal: { type: 'number', nullable: true },
      nbTransactions: { type: 'number', nullable: true },
    }
  },
  RptPresence: {
    type: 'object',
    description: 'Modele RptPresence (table: RptPresence)',
    properties: {
      id: { type: 'string', nullable: true },
      coursId: { type: 'number' },
      seanceId: { type: 'number' },
      date: { type: 'string', format: 'date-time' },
      nbPresent: { type: 'number', nullable: true },
      nbAbsent: { type: 'number', nullable: true },
      taux: { type: 'number', nullable: true },
    }
  },
  RptReussite: {
    type: 'object',
    description: 'Modele RptReussite (table: RptReussite)',
    properties: {
      id: { type: 'string', nullable: true },
      classeId: { type: 'number' },
      semestre: { type: 'string' },
      annee: { type: 'string' },
      nbAdmis: { type: 'number', nullable: true },
      nbEchoues: { type: 'number', nullable: true },
      tauxReussite: { type: 'number', nullable: true },
    }
  },
  RptStock: {
    type: 'object',
    description: 'Modele RptStock (table: RptStock)',
    properties: {
      id: { type: 'string', nullable: true },
      articleId: { type: 'number' },
      stockActuel: { type: 'number', nullable: true },
      stockAlerte: { type: 'number', nullable: true },
      valeurStock: { type: 'number', nullable: true },
    }
  },
  SalleDeClasse: {
    type: 'object',
    description: 'Modele SalleDeClasse (table: SalleDeClasse)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      capacite: { type: 'number', nullable: true },
      equipements: { type: 'string', nullable: true },
    }
  },
  Salon: {
    type: 'object',
    description: 'Modele Salon (table: Salon)',
    properties: {
      id: { type: 'string', nullable: true },
      titre: { type: 'string' },
      type: { type: 'string', nullable: true },
      dateCreation: { type: 'string', format: 'date-time', nullable: true },
      codeInvitation: { type: 'string', nullable: true },
      photo: { type: 'string', nullable: true },
      icone: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      estPrive: { type: 'boolean', nullable: true },
      dernierMessage: { type: 'string', nullable: true },
      dateDernierMessage: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  SanctionAcademique: {
    type: 'object',
    description: 'Modele SanctionAcademique (table: SanctionAcademique)',
    properties: {
      id: { type: 'number', nullable: true },
      type: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time', nullable: true },
      motif: { type: 'string' },
    }
  },
  SanctionDiscipline: {
    type: 'object',
    description: 'Modele SanctionDiscipline (table: SanctionDiscipline)',
    properties: {
      id: { type: 'number', nullable: true },
      etudiant: { type: 'string' },
      matricule: { type: 'string' },
      classe: { type: 'string' },
      date: { type: 'string', format: 'date-time' },
      motif: { type: 'string' },
      sanction: { type: 'string' },
      statut: { type: 'string' },
    }
  },
  Seance: {
    type: 'object',
    description: 'Modele Seance (table: Seance)',
    properties: {
      id: { type: 'number', nullable: true },
      titre: { type: 'string' },
      jourSemaine: { type: 'string' },
      salle: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      heureDebut: { type: 'string', format: 'date-time' },
      heureFin: { type: 'string', format: 'date-time' },
      description: { type: 'string', nullable: true },
    }
  },
  Session: {
    type: 'object',
    description: 'Modele Session (table: Session)',
    properties: {
      id: { type: 'number', nullable: true },
      dateDebut: { type: 'string', format: 'date-time' },
      dateFin: { type: 'string', format: 'date-time' },
      description: { type: 'string', nullable: true },
    }
  },
  SessionExamen: {
    type: 'object',
    description: 'Modele SessionExamen (table: SessionExamen)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      type: { type: 'string' },
      semestre: { type: 'string' },
      dateDebut: { type: 'string', format: 'date-time', nullable: true },
      dateFin: { type: 'string', format: 'date-time', nullable: true },
      statut: { type: 'string', nullable: true },
      observations: { type: 'string', nullable: true },
    }
  },
  SessionGed: {
    type: 'object',
    description: 'Modele SessionGed (table: SessionGed)',
    properties: {
      id: { type: 'number', nullable: true },
      nom: { type: 'string' },
      description: { type: 'string', nullable: true },
      startDate: { type: 'string', format: 'date-time', nullable: true },
      endDate: { type: 'string', format: 'date-time', nullable: true },
      folderId: { type: 'number', nullable: true },
      categorie: { type: 'string', nullable: true },
      status: { type: 'string', nullable: true },
      fields: { type: 'string', nullable: true },
      participantIds: { type: 'number', nullable: true },
    }
  },
  Site: {
    type: 'object',
    description: 'Modele Site (table: Site)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      adresse: { type: 'string', nullable: true },
    }
  },
  SortieProvisoire: {
    type: 'object',
    description: 'Modele SortieProvisoire (table: SortieProvisoire)',
    properties: {
      id: { type: 'string', nullable: true },
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
    description: 'Modele SoumissionDevoir (table: SoumissionDevoir)',
    properties: {
      id: { type: 'string', nullable: true },
      fichier: { type: 'string' },
      note: { type: 'number', nullable: true },
      commentaire: { type: 'string', nullable: true },
      dateSoumission: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Suggestion: {
    type: 'object',
    description: 'Modele Suggestion (table: Suggestion)',
    properties: {
      id: { type: 'string', nullable: true },
      type: { type: 'string' },
      message: { type: 'string' },
      statut: { type: 'string' },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Support: {
    type: 'object',
    description: 'Modele Support (table: Support)',
    properties: {
      id: { type: 'string', nullable: true },
      type: { type: 'string' },
      fichierOriginal: { type: 'string' },
      fichierCompresse: { type: 'string', nullable: true },
      dureeVideo: { type: 'string', nullable: true },
      taille: { type: 'string', nullable: true },
    }
  },
  TransfertStock: {
    type: 'object',
    description: 'Modele TransfertStock (table: TransfertStock)',
    properties: {
      id: { type: 'string', nullable: true },
      quantite: { type: 'number' },
      sourceStockId: { type: 'string', nullable: true },
      destinationStockId: { type: 'string', nullable: true },
      motif: { type: 'string', nullable: true },
      statut: { type: 'string', nullable: true },
    }
  },
  Tuteur: {
    type: 'object',
    description: 'Modele Tuteur (table: Tuteur)',
    properties: {
      id: { type: 'string', nullable: true },
      nom: { type: 'string' },
      fonction: { type: 'string', nullable: true },
      email: { type: 'string' },
      telephone: { type: 'string' },
    }
  },
  TypeDocument: {
    type: 'object',
    description: 'Modele TypeDocument (table: TypeDocument)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      frais: { type: 'number' },
      format: { type: 'string', nullable: true },
    }
  },
  TypeNoteEvaluation: {
    type: 'object',
    description: 'Modele TypeNoteEvaluation (table: TypeNoteEvaluation)',
    properties: {
      id: { type: 'number', nullable: true },
      libelle: { type: 'string' },
      description: { type: 'string', nullable: true },
      poids: { type: 'string', nullable: true },
      categorie: { type: 'string', nullable: true },
    }
  },
  UserPermission: {
    type: 'object',
    description: 'Modele UserPermission (table: UserPermission)',
    properties: {
      id: { type: 'string', nullable: true },
      estActif: { type: 'boolean' },
    }
  },
  UserRole: {
    type: 'object',
    description: 'Modele UserRole (table: UserRole)',
    properties: {
      id: { type: 'string', nullable: true },
    }
  },
  Utilisateur: {
    type: 'object',
    description: 'Modele Utilisateur (table: Utilisateur)',
    properties: {
      id: { type: 'number', nullable: true },
      nom: { type: 'string' },
      prenoms: { type: 'string' },
      identifiant: { type: 'string' },
      email: { type: 'string' },
      motDePasse: { type: 'string' },
      role: { type: 'string' },
      contact: { type: 'string' },
      tokenVersion: { type: 'number', nullable: true },
      photoDeProfil: { type: 'string', nullable: true },
      dateVerificationEmail: { type: 'string', format: 'date-time', nullable: true },
    }
  },
  Validateur: {
    type: 'object',
    description: 'Modele Validateur (table: Validateur)',
    properties: {
      id: { type: 'string', nullable: true },
      niveau: { type: 'number' },
      montantMax: { type: 'number' },
      actif: { type: 'boolean', nullable: true },
    }
  },
  Validation: {
    type: 'object',
    description: 'Modele Validation (table: Validation)',
    properties: {
      id: { type: 'string', nullable: true },
      statut: { type: 'string' },
      commentaire: { type: 'string', nullable: true },
      date: { type: 'string', format: 'date-time', nullable: true },
    }
  },
}
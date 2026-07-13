import { CategorieAchat } from "./CategorieAchat";
import { Demande } from "./Demande";
import { LigneDemande } from "./LigneDemande";
import { Validateur } from "./Validateur";
import { Validation } from "./Validation";
import { Budget } from "./Budget";
import { LigneBudget } from "./LigneBudget";
import { Engagement } from "./Engagement";
import { Fournisseur } from "./Fournisseur";
import { Commande } from "./Commande";
import { LigneCommande } from "./LigneCommande";
import { Reception } from "./Reception";
import { LigneReception } from "./LigneReception";
import { FactureProforma } from "./FactureProforma";
import { LigneFacture } from "./LigneFacture";
import { Utilisateur } from "../../auth/models/Utilisateur";
import { Departement } from "../../immobilisation/models/Departement";

// CategorieAchat - LigneBudget
CategorieAchat.hasMany(LigneBudget, { foreignKey: 'categorieAchatId', as: 'lignesBudget' })
LigneBudget.belongsTo(CategorieAchat, { as: 'categorieAchat', foreignKey: 'categorieAchatId' })

// Demande - Utilisateur (soumisPar)
Utilisateur.hasMany(Demande, { foreignKey: 'soumisParId', as: 'demandesAchats' })
Demande.belongsTo(Utilisateur, { as: 'soumisPar', foreignKey: 'soumisParId' })

// Demande - LigneDemande
Demande.hasMany(LigneDemande, { foreignKey: 'demandeId', as: 'lignesDemande' })
LigneDemande.belongsTo(Demande, { as: 'demande', foreignKey: 'demandeId' })

// Demande - Validation
Demande.hasMany(Validation, { foreignKey: 'demandeId', as: 'validations' })
Validation.belongsTo(Demande, { as: 'demande', foreignKey: 'demandeId' })

// Demande - Engagement
Demande.hasMany(Engagement, { foreignKey: 'demandeId', as: 'engagements' })
Engagement.belongsTo(Demande, { as: 'demande', foreignKey: 'demandeId' })

// Demande - Commande
Demande.hasMany(Commande, { foreignKey: 'demandeId', as: 'commandes' })
Commande.belongsTo(Demande, { as: 'demande', foreignKey: 'demandeId' })

// Validateur - Utilisateur
Utilisateur.hasOne(Validateur, { foreignKey: 'utilisateurId', as: 'validateur' })
Validateur.belongsTo(Utilisateur, { as: 'utilisateur', foreignKey: 'utilisateurId' })

// Validateur - Validation
Validateur.hasMany(Validation, { foreignKey: 'validateurId', as: 'validations' })
Validation.belongsTo(Validateur, { as: 'validateur', foreignKey: 'validateurId' })

// Budget - Departement
Departement.hasMany(Budget, { foreignKey: 'departementId', as: 'budgets' })
Budget.belongsTo(Departement, { as: 'departement', foreignKey: 'departementId' })

// Budget - LigneBudget
Budget.hasMany(LigneBudget, { foreignKey: 'budgetId', as: 'lignesBudget' })
LigneBudget.belongsTo(Budget, { as: 'budget', foreignKey: 'budgetId' })

// Budget - Engagement
Budget.hasMany(Engagement, { foreignKey: 'budgetId', as: 'engagements' })
Engagement.belongsTo(Budget, { as: 'budget', foreignKey: 'budgetId' })

// Fournisseur - Commande
Fournisseur.hasMany(Commande, { foreignKey: 'fournisseurId', as: 'commandes' })
Commande.belongsTo(Fournisseur, { as: 'fournisseur', foreignKey: 'fournisseurId' })

// Commande - LigneCommande
Commande.hasMany(LigneCommande, { foreignKey: 'commandeId', as: 'lignesCommande' })
LigneCommande.belongsTo(Commande, { as: 'commande', foreignKey: 'commandeId' })

// Commande - Reception
Commande.hasMany(Reception, { foreignKey: 'commandeId', as: 'receptions' })
Reception.belongsTo(Commande, { as: 'commande', foreignKey: 'commandeId' })

// Commande - FactureProforma
Commande.hasMany(FactureProforma, { foreignKey: 'commandeId', as: 'facturesProforma' })
FactureProforma.belongsTo(Commande, { as: 'commande', foreignKey: 'commandeId' })

// Reception - LigneReception
Reception.hasMany(LigneReception, { foreignKey: 'receptionId', as: 'lignesReception' })
LigneReception.belongsTo(Reception, { as: 'reception', foreignKey: 'receptionId' })

// LigneCommande - LigneReception
LigneCommande.hasMany(LigneReception, { foreignKey: 'ligneCommandeId', as: 'lignesReception' })
LigneReception.belongsTo(LigneCommande, { as: 'ligneCommande', foreignKey: 'ligneCommandeId' })

// LigneCommande - LigneFacture
LigneCommande.hasMany(LigneFacture, { foreignKey: 'ligneCommandeId', as: 'lignesFacture' })
LigneFacture.belongsTo(LigneCommande, { as: 'ligneCommande', foreignKey: 'ligneCommandeId' })

// FactureProforma - LigneFacture
FactureProforma.hasMany(LigneFacture, { foreignKey: 'factureId', as: 'lignesFacture' })
LigneFacture.belongsTo(FactureProforma, { as: 'facture', foreignKey: 'factureId' })

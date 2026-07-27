import { CategorieArticle } from "./CategorieArticle";
import { Article } from "./Article";
import { MouvementStock } from "./MouvementStock";
import { Fournisseur } from "./Fournisseur";
import { BonCommande } from "./BonCommande";
import { LigneBonCommande } from "./LigneBonCommande";
import { Besoin } from "./Besoin";
import { DemandePrix } from "./DemandePrix";
import { Rebut } from "./Rebut";
import { CorrectionStock } from "./CorrectionStock";
import { InventaireStock } from "./InventaireStock";
import { LigneInventaireStock } from "./LigneInventaireStock";
import { Site } from "../../immobilisation/models/Site";

Article.belongsTo(CategorieArticle, { as: 'categorie', foreignKey: 'categorieId' })
CategorieArticle.hasMany(Article, { foreignKey: 'categorieId', as: 'articles' })

Article.belongsTo(Site, { as: 'site', foreignKey: 'siteId' })
Site.hasMany(Article, { foreignKey: 'siteId', as: 'articles' })

MouvementStock.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })
Article.hasMany(MouvementStock, { foreignKey: 'articleId', as: 'mouvementsStock' })

MouvementStock.belongsTo(Fournisseur, { as: 'fournisseur', foreignKey: 'fournisseurId' })
Fournisseur.hasMany(MouvementStock, { as: 'mouvementsStock', foreignKey: 'fournisseurId' })
MouvementStock.belongsTo(Site, { as: 'site', foreignKey: 'siteId' })
Site.hasMany(MouvementStock, { foreignKey: 'siteId', as: 'mouvementsStock' })

BonCommande.belongsTo(Fournisseur, { as: 'fournisseur', foreignKey: 'fournisseurId' })
Fournisseur.hasMany(BonCommande, { foreignKey: 'fournisseurId', as: 'bonsCommande' })
BonCommande.belongsTo(Site, { as: 'site', foreignKey: 'siteId' })
Site.hasMany(BonCommande, { foreignKey: 'siteId', as: 'bonsCommande' })

LigneBonCommande.belongsTo(BonCommande, { as: 'bonCommande', foreignKey: 'bonCommandeId' })
BonCommande.hasMany(LigneBonCommande, { foreignKey: 'bonCommandeId', as: 'lignesBonCommande' })

LigneBonCommande.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })

Besoin.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })
Article.hasMany(Besoin, { foreignKey: 'articleId', as: 'besoins' })

DemandePrix.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })
Article.hasMany(DemandePrix, { foreignKey: 'articleId', as: 'demandesPrix' })
DemandePrix.belongsTo(Fournisseur, { as: 'fournisseur', foreignKey: 'fournisseurId' })
Fournisseur.hasMany(DemandePrix, { foreignKey: 'fournisseurId', as: 'demandesPrix' })

Rebut.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })
Article.hasMany(Rebut, { foreignKey: 'articleId', as: 'rebuts' })

CorrectionStock.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })
Article.hasMany(CorrectionStock, { foreignKey: 'articleId', as: 'correctionsStock' })

InventaireStock.hasMany(LigneInventaireStock, { foreignKey: 'inventaireId', as: 'lignes' })
LigneInventaireStock.belongsTo(InventaireStock, { as: 'inventaire', foreignKey: 'inventaireId' })
LigneInventaireStock.belongsTo(Article, { as: 'article', foreignKey: 'articleId' })
Article.hasMany(LigneInventaireStock, { foreignKey: 'articleId', as: 'lignesInventaireStock' })

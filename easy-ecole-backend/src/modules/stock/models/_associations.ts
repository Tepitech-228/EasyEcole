import { CategorieArticle } from "./CategorieArticle";
import { Article } from "./Article";
import { MouvementStock } from "./MouvementStock";
import { Fournisseur } from "./Fournisseur";
import { BonCommande } from "./BonCommande";
import { LigneBonCommande } from "./LigneBonCommande";
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

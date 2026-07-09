-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Client :  127.0.0.1
-- Généré le :  Jeu 09 Juillet 2026 à 10:31
-- Version du serveur :  5.6.17
-- Version de PHP :  5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de données :  `easyecole`
--

-- --------------------------------------------------------

--
-- Structure de la table `ach_budgets`
--

CREATE TABLE IF NOT EXISTS `ach_budgets` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `periode` varchar(255) NOT NULL,
  `montantAlloue` decimal(12,2) NOT NULL,
  `montantUtilise` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `departementId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `departementId` (`departementId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ach_budgets`
--

INSERT INTO `ach_budgets` (`id`, `periode`, `montantAlloue`, `montantUtilise`, `createdAt`, `updatedAt`, `deletedAt`, `departementId`) VALUES
(1, '2025', '50000000.00', '2350000.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_categories`
--

CREATE TABLE IF NOT EXISTS `ach_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`),
  UNIQUE KEY `nom_2` (`nom`),
  UNIQUE KEY `nom_3` (`nom`),
  UNIQUE KEY `nom_4` (`nom`),
  UNIQUE KEY `nom_5` (`nom`),
  UNIQUE KEY `nom_6` (`nom`),
  UNIQUE KEY `nom_7` (`nom`),
  UNIQUE KEY `nom_8` (`nom`),
  UNIQUE KEY `nom_9` (`nom`),
  UNIQUE KEY `nom_10` (`nom`),
  UNIQUE KEY `nom_11` (`nom`),
  UNIQUE KEY `nom_12` (`nom`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ach_categories`
--

INSERT INTO `ach_categories` (`id`, `nom`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Fournitures de bureau', 'Papeterie et consommables', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Matériel pédagogique', 'Équipements pour salles de classe', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 'Informatique', 'Matériel et logiciels', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ach_commandes`
--

CREATE TABLE IF NOT EXISTS `ach_commandes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dateCommande` datetime NOT NULL DEFAULT '2026-07-06 14:44:17',
  `statut` enum('en_cours','livree','annulee') DEFAULT 'en_cours',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeId` int(10) unsigned DEFAULT NULL,
  `fournisseurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeId` (`demandeId`),
  KEY `fournisseurId` (`fournisseurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ach_commandes`
--

INSERT INTO `ach_commandes` (`id`, `dateCommande`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `demandeId`, `fournisseurId`) VALUES
(1, '2025-01-15 00:00:00', 'livree', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_demandes`
--

CREATE TABLE IF NOT EXISTS `ach_demandes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  `statut` enum('brouillon','soumise','validee','rejetee','commandee','recue') DEFAULT 'brouillon',
  `dateSoumission` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `soumisParId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `soumisParId` (`soumisParId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ach_demandes`
--

INSERT INTO `ach_demandes` (`id`, `description`, `statut`, `dateSoumission`, `createdAt`, `updatedAt`, `deletedAt`, `soumisParId`) VALUES
(1, 'Fournitures pour le département', 'validee', '2025-01-10 00:00:00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_engagements`
--

CREATE TABLE IF NOT EXISTS `ach_engagements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `montant` decimal(12,2) NOT NULL,
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:17',
  `statut` enum('actif','liberee') DEFAULT 'actif',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeId` int(10) unsigned DEFAULT NULL,
  `budgetId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeId` (`demandeId`),
  KEY `budgetId` (`budgetId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ach_engagements`
--

INSERT INTO `ach_engagements` (`id`, `montant`, `date`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `demandeId`, `budgetId`) VALUES
(1, '590000.00', '2025-01-16 00:00:00', 'actif', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_factures_proforma`
--

CREATE TABLE IF NOT EXISTS `ach_factures_proforma` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dateEmission` datetime NOT NULL DEFAULT '2026-07-06 14:44:17',
  `montantTotal` decimal(12,2) NOT NULL,
  `statut` enum('emise','payee','annulee') DEFAULT 'emise',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `commandeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandeId` (`commandeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ach_factures_proforma`
--

INSERT INTO `ach_factures_proforma` (`id`, `dateEmission`, `montantTotal`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `commandeId`) VALUES
(1, '2025-01-22 00:00:00', '590000.00', 'payee', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_fournisseurs`
--

CREATE TABLE IF NOT EXISTS `ach_fournisseurs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `adresse` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ach_fournisseurs`
--

INSERT INTO `ach_fournisseurs` (`id`, `nom`, `contact`, `email`, `telephone`, `adresse`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Bureau Plus CI', 'Kouamé Paul', 'commandes@bureauplus.ci', '+22521212121', 'Abidjan Plateau', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Techno Shop', 'Koné Moussa', 'ventes@technoshop.ci', '+22522222222', 'Abidjan Cocody', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ach_lignes_budget`
--

CREATE TABLE IF NOT EXISTS `ach_lignes_budget` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `montantAlloue` decimal(12,2) NOT NULL,
  `montantUtilise` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `categorieAchatId` int(10) unsigned DEFAULT NULL,
  `budgetId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `categorieAchatId` (`categorieAchatId`),
  KEY `budgetId` (`budgetId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ach_lignes_budget`
--

INSERT INTO `ach_lignes_budget` (`id`, `montantAlloue`, `montantUtilise`, `createdAt`, `updatedAt`, `deletedAt`, `categorieAchatId`, `budgetId`) VALUES
(1, '10000000.00', '500000.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1),
(2, '20000000.00', '1200000.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 1),
(3, '20000000.00', '650000.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_lignes_commande`
--

CREATE TABLE IF NOT EXISTS `ach_lignes_commande` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prixUnitaire` decimal(10,2) NOT NULL,
  `total` decimal(12,2) DEFAULT NULL,
  `gereEnStock` tinyint(1) DEFAULT '0',
  `actifImmobilise` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `commandeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandeId` (`commandeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ach_lignes_commande`
--

INSERT INTO `ach_lignes_commande` (`id`, `designation`, `quantite`, `prixUnitaire`, `total`, `gereEnStock`, `actifImmobilise`, `createdAt`, `updatedAt`, `deletedAt`, `commandeId`) VALUES
(1, 'Ramettes de papier A4 (10 cartons)', 10, '45000.00', '450000.00', 1, 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 'Stylos bleus (20 boîtes)', 20, '7000.00', '140000.00', 1, 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_lignes_demande`
--

CREATE TABLE IF NOT EXISTS `ach_lignes_demande` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prixEstime` decimal(10,2) NOT NULL,
  `unite` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeId` (`demandeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ach_lignes_demande`
--

INSERT INTO `ach_lignes_demande` (`id`, `designation`, `quantite`, `prixEstime`, `unite`, `createdAt`, `updatedAt`, `deletedAt`, `demandeId`) VALUES
(1, 'Ramettes de papier A4 (10 cartons)', 10, '50000.00', 'carton', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 'Stylos bleus (20 boîtes)', 20, '7500.00', 'boîte', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_lignes_facture`
--

CREATE TABLE IF NOT EXISTS `ach_lignes_facture` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `designation` varchar(255) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prixUnitaire` decimal(10,2) NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `ligneCommandeId` int(10) unsigned DEFAULT NULL,
  `factureId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ligneCommandeId` (`ligneCommandeId`),
  KEY `factureId` (`factureId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ach_lignes_facture`
--

INSERT INTO `ach_lignes_facture` (`id`, `designation`, `quantite`, `prixUnitaire`, `total`, `createdAt`, `updatedAt`, `deletedAt`, `ligneCommandeId`, `factureId`) VALUES
(1, 'Ramettes de papier', 10, '45000.00', '450000.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1),
(2, 'Stylos bleus', 20, '7000.00', '140000.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_lignes_reception`
--

CREATE TABLE IF NOT EXISTS `ach_lignes_reception` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quantiteRecue` int(11) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `receptionId` int(10) unsigned DEFAULT NULL,
  `ligneCommandeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `receptionId` (`receptionId`),
  KEY `ligneCommandeId` (`ligneCommandeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ach_lignes_reception`
--

INSERT INTO `ach_lignes_reception` (`id`, `quantiteRecue`, `createdAt`, `updatedAt`, `deletedAt`, `receptionId`, `ligneCommandeId`) VALUES
(1, 10, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1),
(2, 20, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 2);

-- --------------------------------------------------------

--
-- Structure de la table `ach_receptions`
--

CREATE TABLE IF NOT EXISTS `ach_receptions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:17',
  `statut` enum('partielle','totale') NOT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `commandeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandeId` (`commandeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ach_receptions`
--

INSERT INTO `ach_receptions` (`id`, `date`, `statut`, `notes`, `createdAt`, `updatedAt`, `deletedAt`, `commandeId`) VALUES
(1, '2025-01-20 00:00:00', 'totale', 'Livraison complète', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_validateurs`
--

CREATE TABLE IF NOT EXISTS `ach_validateurs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `niveau` int(11) NOT NULL,
  `montantMax` decimal(12,2) NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ach_validateurs`
--

INSERT INTO `ach_validateurs` (`id`, `niveau`, `montantMax`, `actif`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, 1, '5000000.00', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 2, '20000000.00', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `ach_validations`
--

CREATE TABLE IF NOT EXISTS `ach_validations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `statut` enum('approuve','rejete') NOT NULL,
  `commentaire` text,
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:16',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeId` int(10) unsigned DEFAULT NULL,
  `validateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeId` (`demandeId`),
  KEY `validateurId` (`validateurId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `aut_adresses_apprenants`
--

CREATE TABLE IF NOT EXISTS `aut_adresses_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `boitePostale` varchar(255) NOT NULL,
  `prorietaireBoitePostale` varchar(255) NOT NULL,
  `telMobile` varchar(255) NOT NULL,
  `telDomicile` varchar(255) DEFAULT NULL,
  `quartier` varchar(255) NOT NULL,
  `ville` varchar(255) NOT NULL,
  `pays` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `aut_adresses_apprenants`
--

INSERT INTO `aut_adresses_apprenants` (`id`, `boitePostale`, `prorietaireBoitePostale`, `telMobile`, `telDomicile`, `quartier`, `ville`, `pays`, `createdAt`, `updatedAt`, `deletedAt`, `apprenantId`) VALUES
(1, 'BP 1001', 'Traoré Aminata', '+2250501000001', NULL, 'Cocody Angré', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(2, 'BP 1002', 'Kouamé Jean', '+2250502000002', NULL, 'Belle-ville', 'Bouaké', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(3, 'BP 1003', 'Bamba Mariam', '+2250503000003', NULL, 'Yopougon', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(4, 'BP 1004', 'Soro Léon', '+2250504000004', NULL, 'Konankro', 'Korhogo', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(5, 'BP 1005', 'Yao Esther', '+2250505000005', NULL, 'Commerce', 'Daloa', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(6, 'BP 1006', 'Coulibaly Adama', '+2250506000006', NULL, 'Centre', 'Séguela', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(7, 'BP 1007', 'Koffi Aya', '+2250507000007', NULL, 'Cocody', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(8, 'BP 1008', 'Diomandé Yannick', '+2250508000008', NULL, 'Libreville', 'Man', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(9, 'BP 1009', 'N''Dri Grace', '+2250509000009', NULL, 'Marcory', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(10, 'BP 1010', 'Touré Moussa Junior', '+2250510000010', NULL, 'Plateau', 'Odienné', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(11, 'BP 1011', 'Guei Sarah', '+2250511000011', NULL, 'Centre Ville', 'Gagnoa', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(12, 'BP 1012', 'Kouadio Arnaud', '+2250512000012', NULL, 'Habitat', 'Yamoussoukro', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(13, 'BP 1013', 'Fofana Mariam', '+2250513000013', NULL, 'Koko', 'Bouaké', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(14, 'BP 1014', 'Akéko Georges', '+2250514000014', NULL, 'Centre', 'Abengourou', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(15, 'BP 1015', 'Soumahoro Fatima', '+2250515000015', NULL, 'Treichville', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_adresses_caissiers_banque`
--

CREATE TABLE IF NOT EXISTS `aut_adresses_caissiers_banque` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `boitePostale` varchar(255) DEFAULT NULL,
  `prorietaireBoitePostale` varchar(255) DEFAULT NULL,
  `telMobile` varchar(255) DEFAULT NULL,
  `telDomicile` varchar(255) DEFAULT NULL,
  `quartier` varchar(255) DEFAULT NULL,
  `ville` varchar(255) DEFAULT NULL,
  `pays` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `caissierBanqueId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `caissierBanqueId` (`caissierBanqueId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `aut_adresses_caissiers_banque`
--

INSERT INTO `aut_adresses_caissiers_banque` (`id`, `boitePostale`, `prorietaireBoitePostale`, `telMobile`, `telDomicile`, `quartier`, `ville`, `pays`, `createdAt`, `updatedAt`, `deletedAt`, `caissierBanqueId`) VALUES
(1, 'BP 105', 'Mariam Koné', '+2250103000001', NULL, 'Cocody', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(2, 'BP 106', 'Ibrahim Diaby', '+2250103000002', NULL, 'Adjamé', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_adresses_enseignants`
--

CREATE TABLE IF NOT EXISTS `aut_adresses_enseignants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `boitePostale` varchar(255) DEFAULT NULL,
  `prorietaireBoitePostale` varchar(255) DEFAULT NULL,
  `telMobile` varchar(255) DEFAULT NULL,
  `telDomicile` varchar(255) DEFAULT NULL,
  `quartier` varchar(255) DEFAULT NULL,
  `ville` varchar(255) DEFAULT NULL,
  `pays` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `aut_adresses_enseignants`
--

INSERT INTO `aut_adresses_enseignants` (`id`, `boitePostale`, `prorietaireBoitePostale`, `telMobile`, `telDomicile`, `quartier`, `ville`, `pays`, `createdAt`, `updatedAt`, `deletedAt`, `enseignantId`) VALUES
(1, 'BP 101', 'Yves Konan', '+2250102000001', NULL, 'Cocody', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(2, 'BP 102', 'Aline N''Dri', '+2250102000002', NULL, 'Marcory', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(3, 'BP 103', 'Moussa Touré', '+2250102000003', NULL, 'Plateau', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(4, 'BP 104', 'Fatou Bamba', '+2250102000004', NULL, 'Yopougon', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_adresses_institutions`
--

CREATE TABLE IF NOT EXISTS `aut_adresses_institutions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `boitePostale` varchar(255) DEFAULT NULL,
  `prorietaireBoitePostale` varchar(255) DEFAULT NULL,
  `telMobile` varchar(255) DEFAULT NULL,
  `telDomicile` varchar(255) DEFAULT NULL,
  `quartier` varchar(255) DEFAULT NULL,
  `ville` varchar(255) DEFAULT NULL,
  `pays` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `institutionId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `institutionId` (`institutionId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `aut_adresses_institutions`
--

INSERT INTO `aut_adresses_institutions` (`id`, `boitePostale`, `prorietaireBoitePostale`, `telMobile`, `telDomicile`, `quartier`, `ville`, `pays`, `createdAt`, `updatedAt`, `deletedAt`, `institutionId`) VALUES
(1, 'BP 1500 Abidjan', 'UST', '+2250101000001', NULL, 'Cocody Angré', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_apprenants`
--

CREATE TABLE IF NOT EXISTS `aut_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `photo` varchar(255) DEFAULT NULL,
  `qrCode` varchar(255) DEFAULT NULL,
  `dateNaissance` datetime NOT NULL,
  `lieuNaissance` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `photo` (`photo`),
  UNIQUE KEY `qrCode` (`qrCode`),
  UNIQUE KEY `photo_2` (`photo`),
  UNIQUE KEY `qrCode_2` (`qrCode`),
  UNIQUE KEY `photo_3` (`photo`),
  UNIQUE KEY `qrCode_3` (`qrCode`),
  UNIQUE KEY `photo_4` (`photo`),
  UNIQUE KEY `qrCode_4` (`qrCode`),
  UNIQUE KEY `photo_5` (`photo`),
  UNIQUE KEY `qrCode_5` (`qrCode`),
  UNIQUE KEY `photo_6` (`photo`),
  UNIQUE KEY `qrCode_6` (`qrCode`),
  UNIQUE KEY `photo_7` (`photo`),
  UNIQUE KEY `qrCode_7` (`qrCode`),
  UNIQUE KEY `photo_8` (`photo`),
  UNIQUE KEY `qrCode_8` (`qrCode`),
  UNIQUE KEY `photo_9` (`photo`),
  UNIQUE KEY `qrCode_9` (`qrCode`),
  UNIQUE KEY `photo_10` (`photo`),
  UNIQUE KEY `qrCode_10` (`qrCode`),
  UNIQUE KEY `photo_11` (`photo`),
  UNIQUE KEY `qrCode_11` (`qrCode`),
  UNIQUE KEY `photo_12` (`photo`),
  UNIQUE KEY `qrCode_12` (`qrCode`),
  UNIQUE KEY `photo_13` (`photo`),
  UNIQUE KEY `qrCode_13` (`qrCode`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `aut_apprenants`
--

INSERT INTO `aut_apprenants` (`id`, `photo`, `qrCode`, `dateNaissance`, `lieuNaissance`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, 'etudiant1.jpg', NULL, '2002-05-10 00:00:00', 'Abidjan', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 11),
(2, 'etudiant2.jpg', NULL, '2001-08-22 00:00:00', 'Bouaké', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 12),
(3, 'etudiant3.jpg', NULL, '2003-01-15 00:00:00', 'Abidjan', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 13),
(4, 'etudiant4.jpg', NULL, '2002-11-30 00:00:00', 'Korhogo', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 14),
(5, 'etudiant5.jpg', NULL, '2003-04-05 00:00:00', 'Daloa', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 15),
(6, 'etudiant6.jpg', NULL, '2001-07-19 00:00:00', 'Séguela', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 16),
(7, 'etudiant7.jpg', NULL, '2002-10-12 00:00:00', 'Abidjan', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 17),
(8, 'etudiant8.jpg', NULL, '2003-03-18 00:00:00', 'Man', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 18),
(9, 'etudiant9.jpg', NULL, '2002-06-25 00:00:00', 'Abidjan', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 19),
(10, 'etudiant10.jpg', NULL, '2001-12-01 00:00:00', 'Odienné', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 20),
(11, 'etudiant11.jpg', NULL, '2003-09-08 00:00:00', 'Gagnoa', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 21),
(12, 'etudiant12.jpg', NULL, '2002-02-14 00:00:00', 'Yamoussoukro', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 22),
(13, 'etudiant13.jpg', NULL, '2002-08-30 00:00:00', 'Bouaké', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 23),
(14, 'etudiant14.jpg', NULL, '2001-04-17 00:00:00', 'Abengourou', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 24),
(15, 'etudiant15.jpg', NULL, '2003-12-03 00:00:00', 'Abidjan', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 25);

-- --------------------------------------------------------

--
-- Structure de la table `aut_banques`
--

CREATE TABLE IF NOT EXISTS `aut_banques` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`),
  UNIQUE KEY `nom_2` (`nom`),
  UNIQUE KEY `nom_3` (`nom`),
  UNIQUE KEY `nom_4` (`nom`),
  UNIQUE KEY `nom_5` (`nom`),
  UNIQUE KEY `nom_6` (`nom`),
  UNIQUE KEY `nom_7` (`nom`),
  UNIQUE KEY `nom_8` (`nom`),
  UNIQUE KEY `nom_9` (`nom`),
  UNIQUE KEY `nom_10` (`nom`),
  UNIQUE KEY `nom_11` (`nom`),
  UNIQUE KEY `nom_12` (`nom`),
  UNIQUE KEY `nom_13` (`nom`),
  UNIQUE KEY `logo` (`logo`),
  UNIQUE KEY `logo_2` (`logo`),
  UNIQUE KEY `logo_3` (`logo`),
  UNIQUE KEY `logo_4` (`logo`),
  UNIQUE KEY `logo_5` (`logo`),
  UNIQUE KEY `logo_6` (`logo`),
  UNIQUE KEY `logo_7` (`logo`),
  UNIQUE KEY `logo_8` (`logo`),
  UNIQUE KEY `logo_9` (`logo`),
  UNIQUE KEY `logo_10` (`logo`),
  UNIQUE KEY `logo_11` (`logo`),
  UNIQUE KEY `logo_12` (`logo`),
  UNIQUE KEY `logo_13` (`logo`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `aut_banques`
--

INSERT INTO `aut_banques` (`id`, `nom`, `logo`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Société Générale Côte d''Ivoire', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_caissiers_banque`
--

CREATE TABLE IF NOT EXISTS `aut_caissiers_banque` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dateNaissance` datetime DEFAULT NULL,
  `lieuNaissance` varchar(255) DEFAULT NULL,
  `fonction` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  `banqueId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`),
  KEY `banqueId` (`banqueId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `aut_caissiers_banque`
--

INSERT INTO `aut_caissiers_banque` (`id`, `dateNaissance`, `lieuNaissance`, `fonction`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`, `banqueId`) VALUES
(1, '1992-06-18 00:00:00', 'Abidjan', 'Caissière Principale', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 7, 1),
(2, '1990-01-25 00:00:00', 'Korhogo', 'Caissier', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 8, 1);

-- --------------------------------------------------------

--
-- Structure de la table `aut_comite_orientations`
--

CREATE TABLE IF NOT EXISTS `aut_comite_orientations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fonction` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `aut_comite_orientations`
--

INSERT INTO `aut_comite_orientations` (`id`, `fonction`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, 'Président du Comité', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 9),
(2, 'Membre du Comité', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 10);

-- --------------------------------------------------------

--
-- Structure de la table `aut_enseignants`
--

CREATE TABLE IF NOT EXISTS `aut_enseignants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `photo` varchar(255) DEFAULT NULL,
  `qrCode` varchar(255) DEFAULT NULL,
  `dateNaissance` datetime DEFAULT NULL,
  `lieuNaissance` varchar(255) DEFAULT NULL,
  `fonction` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `photo` (`photo`),
  UNIQUE KEY `qrCode` (`qrCode`),
  UNIQUE KEY `photo_2` (`photo`),
  UNIQUE KEY `qrCode_2` (`qrCode`),
  UNIQUE KEY `photo_3` (`photo`),
  UNIQUE KEY `qrCode_3` (`qrCode`),
  UNIQUE KEY `photo_4` (`photo`),
  UNIQUE KEY `qrCode_4` (`qrCode`),
  UNIQUE KEY `photo_5` (`photo`),
  UNIQUE KEY `qrCode_5` (`qrCode`),
  UNIQUE KEY `photo_6` (`photo`),
  UNIQUE KEY `qrCode_6` (`qrCode`),
  UNIQUE KEY `photo_7` (`photo`),
  UNIQUE KEY `qrCode_7` (`qrCode`),
  UNIQUE KEY `photo_8` (`photo`),
  UNIQUE KEY `qrCode_8` (`qrCode`),
  UNIQUE KEY `photo_9` (`photo`),
  UNIQUE KEY `qrCode_9` (`qrCode`),
  UNIQUE KEY `photo_10` (`photo`),
  UNIQUE KEY `qrCode_10` (`qrCode`),
  UNIQUE KEY `photo_11` (`photo`),
  UNIQUE KEY `qrCode_11` (`qrCode`),
  UNIQUE KEY `photo_12` (`photo`),
  UNIQUE KEY `qrCode_12` (`qrCode`),
  UNIQUE KEY `photo_13` (`photo`),
  UNIQUE KEY `qrCode_13` (`qrCode`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `aut_enseignants`
--

INSERT INTO `aut_enseignants` (`id`, `photo`, `qrCode`, `dateNaissance`, `lieuNaissance`, `fonction`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, NULL, NULL, '1982-03-10 00:00:00', 'Abidjan', 'Professeur de Mathématiques', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 3),
(2, NULL, NULL, '1985-07-22 00:00:00', 'Bouaké', 'Professeur d''Informatique', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 4),
(3, NULL, NULL, '1980-11-15 00:00:00', 'Odienné', 'Professeur de Gestion', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 5),
(4, NULL, NULL, '1988-09-05 00:00:00', 'Man', 'Professeur de Droit', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 6);

-- --------------------------------------------------------

--
-- Structure de la table `aut_identites_apprenants`
--

CREATE TABLE IF NOT EXISTS `aut_identites_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nationalite` varchar(255) NOT NULL,
  `ethnie` varchar(255) DEFAULT NULL,
  `prefecture` varchar(255) DEFAULT NULL,
  `religion` varchar(255) NOT NULL,
  `situationMatrimoniale` enum('celibataire','marie','divorce') DEFAULT 'celibataire',
  `etatPhysique` enum('valide','handicape') DEFAULT 'valide',
  `handicapMoteur` tinyint(1) NOT NULL DEFAULT '0',
  `handicapVisuel` tinyint(1) NOT NULL DEFAULT '0',
  `handicapAuditif` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `aut_identites_apprenants`
--

INSERT INTO `aut_identites_apprenants` (`id`, `nationalite`, `ethnie`, `prefecture`, `religion`, `situationMatrimoniale`, `etatPhysique`, `handicapMoteur`, `handicapVisuel`, `handicapAuditif`, `createdAt`, `updatedAt`, `deletedAt`, `apprenantId`) VALUES
(1, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(2, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(3, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(4, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(5, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(6, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(7, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(8, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(9, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(10, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(11, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(12, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(13, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(14, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(15, 'Ivoirienne', 'Akan', NULL, 'Chrétienne', 'celibataire', 'valide', 0, 0, 0, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_informations_parents_apprenants`
--

CREATE TABLE IF NOT EXISTS `aut_informations_parents_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `pereVivant` tinyint(1) NOT NULL DEFAULT '1',
  `nomPrenomsPere` varchar(255) NOT NULL,
  `professionPere` varchar(255) NOT NULL,
  `mereVivante` tinyint(1) NOT NULL DEFAULT '1',
  `nomPrenomsMere` varchar(255) NOT NULL,
  `professionMere` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `aut_informations_parents_apprenants`
--

INSERT INTO `aut_informations_parents_apprenants` (`id`, `pereVivant`, `nomPrenomsPere`, `professionPere`, `mereVivante`, `nomPrenomsMere`, `professionMere`, `createdAt`, `updatedAt`, `deletedAt`, `apprenantId`) VALUES
(1, 1, 'Drissa Traoré', 'Fonctionnaire', 1, 'Maimouna Koné', 'Commerçante', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(2, 1, 'Paul Kouamé', 'Enseignant', 1, 'Marie N''Dri', 'Ménagère', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(3, 1, 'Moussa Bamba', 'Entrepreneur', 1, 'Fatou Diarra', 'Infirmière', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(4, 1, 'Yacouba Soro', 'Agriculteur', 1, 'Gnoumata Soro', 'Ménagère', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(5, 1, 'Kouassi Yao', 'Commerçant', 1, 'Akissi Yao', 'Institutrice', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(6, 1, 'Mamadou Coulibaly', 'Transporteur', 1, 'Hawa Touré', 'Coiffeuse', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(7, 1, 'Bernard Koffi', 'Médecin', 1, 'Thérèse Koffi', 'Ménagère', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(8, 1, 'Alphonse Diomandé', 'Instituteur', 1, 'Odette Diomandé', 'Ménagère', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(9, 1, 'Michel N''Dri', 'Avocat', 1, 'Emma N''Dri', 'Secrétaire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(10, 1, 'Lamine Touré', 'Commerçant', 1, 'Kadiatou Touré', 'Ménagère', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(11, 1, 'Joseph Guei', 'Fonctionnaire', 1, 'Marie Guei', 'Commerçante', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(12, 1, 'Pierre Kouadio', 'Ingénieur', 1, 'Louise Kouadio', 'Enseignante', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(13, 1, 'Ousmane Fofana', 'Chef d''entreprise', 1, 'Aïssata Fofana', 'Médecin', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(14, 1, 'Simon Akéko', 'Instituteur', 1, 'Odette Akéko', 'Ménagère', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(15, 1, 'Mamadou Soumahoro', 'Commerçant', 1, 'Bintou Soumahoro', 'Coiffeuse', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_informations_salarie_apprenants`
--

CREATE TABLE IF NOT EXISTS `aut_informations_salarie_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `estSalarie` tinyint(1) NOT NULL DEFAULT '0',
  `profession` varchar(255) DEFAULT NULL,
  `entreprise` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `aut_institutions`
--

CREATE TABLE IF NOT EXISTS `aut_institutions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dateNaissance` datetime DEFAULT NULL,
  `lieuNaissance` varchar(255) DEFAULT NULL,
  `fonction` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `aut_institutions`
--

INSERT INTO `aut_institutions` (`id`, `dateNaissance`, `lieuNaissance`, `fonction`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, '1970-05-20 00:00:00', 'Abidjan', 'Recteur', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 2);

-- --------------------------------------------------------

--
-- Structure de la table `aut_permissions`
--

CREATE TABLE IF NOT EXISTS `aut_permissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `module` varchar(100) NOT NULL,
  `type` varchar(20) NOT NULL,
  `parentKey` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  UNIQUE KEY `key_2` (`key`),
  UNIQUE KEY `key_3` (`key`),
  UNIQUE KEY `key_4` (`key`),
  UNIQUE KEY `key_5` (`key`),
  UNIQUE KEY `key_6` (`key`),
  UNIQUE KEY `key_7` (`key`),
  UNIQUE KEY `key_8` (`key`),
  UNIQUE KEY `key_9` (`key`),
  UNIQUE KEY `key_10` (`key`),
  UNIQUE KEY `key_11` (`key`),
  UNIQUE KEY `key_12` (`key`),
  UNIQUE KEY `key_13` (`key`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=223 ;

--
-- Contenu de la table `aut_permissions`
--

INSERT INTO `aut_permissions` (`id`, `key`, `libelle`, `module`, `type`, `parentKey`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'menu.tableau-de-bord', 'Tableau de bord', 'Général', 'menu', NULL, '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(2, 'menu.inscription', 'Inscription', 'Inscription', 'menu', NULL, '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(3, 'menu.inscription.sessions', 'Sessions', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(4, 'menu.inscription.parcours', 'Parcours', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(5, 'menu.inscription.demandes', 'Demandes', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(6, 'menu.inscription.cursus', 'Mon cursus', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(7, 'menu.inscription.mon-dossier', 'Mon dossier', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(8, 'menu.inscription.dossiers-etudiants', 'Dossiers étudiants', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(9, 'menu.inscription.paiements', 'Paiements', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(10, 'menu.inscription.comptabilite', 'Comptabilité', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(11, 'menu.inscription.bordereaux', 'Mes bordereaux', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(12, 'menu.inscription.validation-bordereaux', 'Valid. bordereaux', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(13, 'menu.inscription.echeances', 'Échéances', 'Inscription', 'menu', 'menu.inscription', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(14, 'action.inscription.session.creer', 'Créer une session', 'Inscription', 'action', 'menu.inscription.sessions', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(15, 'action.inscription.session.modifier', 'Modifier une session', 'Inscription', 'action', 'menu.inscription.sessions', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(16, 'action.inscription.session.supprimer', 'Supprimer une session', 'Inscription', 'action', 'menu.inscription.sessions', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(17, 'action.inscription.parcours.creer', 'Créer un parcours', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(18, 'action.inscription.parcours.modifier', 'Modifier un parcours', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(19, 'action.inscription.parcours.supprimer', 'Supprimer un parcours', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(20, 'action.inscription.demande.valider', 'Valider une demande', 'Inscription', 'action', 'menu.inscription.demandes', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(21, 'action.inscription.demande.rejeter', 'Rejeter une demande', 'Inscription', 'action', 'menu.inscription.demandes', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(22, 'action.inscription.bordereau.valider', 'Valider un bordereau', 'Inscription', 'action', 'menu.inscription.validation-bordereaux', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(23, 'action.inscription.echeance.generer', 'Générer des échéances', 'Inscription', 'action', 'menu.inscription.echeances', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(24, 'action.inscription.echeance.modifier', 'Modifier une échéance', 'Inscription', 'action', 'menu.inscription.echeances', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(25, 'action.inscription.dossier.generer', 'Générer un dossier étudiant', 'Inscription', 'action', 'menu.inscription.dossiers-etudiants', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(26, 'action.inscription.dossier.modifier-statut', 'Modifier statut dossier', 'Inscription', 'action', 'menu.inscription.dossiers-etudiants', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(27, 'action.inscription.cours.creer', 'Créer un cours', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(28, 'action.inscription.cours.modifier', 'Modifier un cours', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(29, 'action.inscription.cours.supprimer', 'Supprimer un cours', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(30, 'action.inscription.cours.assigner-enseignant', 'Assigner un enseignant', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(31, 'action.inscription.cours.retirer-enseignant', 'Retirer un enseignant', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(32, 'action.inscription.classe.creer', 'Créer une classe', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(33, 'action.inscription.classe.modifier', 'Modifier une classe', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(34, 'action.inscription.classe.supprimer', 'Supprimer une classe', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(35, 'action.inscription.salle.creer', 'Créer une salle', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(36, 'action.inscription.salle.modifier', 'Modifier une salle', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(37, 'action.inscription.salle.supprimer', 'Supprimer une salle', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(38, 'action.inscription.type-note.creer', 'Créer un type de note', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(39, 'action.inscription.type-note.modifier', 'Modifier un type de note', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(40, 'action.inscription.type-note.supprimer', 'Supprimer un type de note', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(41, 'action.inscription.niveau-etude.creer', 'Créer un niveau d''étude', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(42, 'action.inscription.niveau-etude.modifier', 'Modifier un niveau d''étude', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(43, 'action.inscription.niveau-etude.supprimer', 'Supprimer un niveau d''étude', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(44, 'action.inscription.prerequis.creer', 'Créer un prérequis', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(45, 'action.inscription.prerequis.modifier', 'Modifier un prérequis', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(46, 'action.inscription.prerequis.supprimer', 'Supprimer un prérequis', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(47, 'action.inscription.matiere-prerequis.creer', 'Créer une matière prérequis', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(48, 'action.inscription.matiere-prerequis.modifier', 'Modifier une matière prérequis', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(49, 'action.inscription.matiere-prerequis.supprimer', 'Supprimer une matière prérequis', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(50, 'action.inscription.annee-academique.creer', 'Créer une année académique', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(51, 'action.inscription.annee-academique.modifier', 'Modifier une année académique', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(52, 'action.inscription.annee-academique.supprimer', 'Supprimer une année académique', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(53, 'action.inscription.cursus.creer', 'Créer un cursus', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(54, 'action.inscription.cursus.modifier', 'Modifier un cursus', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(55, 'action.inscription.cursus.supprimer', 'Supprimer un cursus', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(56, 'action.inscription.apprenant.supprimer', 'Supprimer un apprenant', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(57, 'action.inscription.apprenant.generer-qr', 'Générer QR code apprenant', 'Inscription', 'action', 'menu.inscription.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(58, 'menu.orientation', 'Orientation', 'Orientation', 'menu', NULL, '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(59, 'menu.orientation.parcours', 'Parcours', 'Orientation', 'menu', 'menu.orientation', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(60, 'menu.orientation.demandes', 'Demandes', 'Orientation', 'menu', 'menu.orientation', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(61, 'menu.orientation.comite', 'Commission orientation', 'Orientation', 'menu', 'menu.orientation', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(62, 'action.orientation.parcours.creer', 'Créer un parcours', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(63, 'action.orientation.parcours.modifier', 'Modifier un parcours', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(64, 'action.orientation.parcours.supprimer', 'Supprimer un parcours', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(65, 'action.orientation.prerequis.creer', 'Créer un prérequis', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(66, 'action.orientation.prerequis.modifier', 'Modifier un prérequis', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(67, 'action.orientation.prerequis.supprimer', 'Supprimer un prérequis', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(68, 'action.orientation.debouche.creer', 'Créer un débouché', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(69, 'action.orientation.debouche.modifier', 'Modifier un débouché', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(70, 'action.orientation.debouche.supprimer', 'Supprimer un débouché', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(71, 'action.orientation.categorie.creer', 'Créer une catégorie', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(72, 'action.orientation.categorie.modifier', 'Modifier une catégorie', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(73, 'action.orientation.categorie.supprimer', 'Supprimer une catégorie', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(74, 'action.orientation.matiere-prerequis.creer', 'Créer une matière prérequis', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(75, 'action.orientation.matiere-prerequis.modifier', 'Modifier une matière prérequis', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(76, 'action.orientation.matiere-prerequis.supprimer', 'Supprimer une matière prérequis', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(77, 'action.orientation.niveau-etude.creer', 'Créer un niveau d''étude', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(78, 'action.orientation.niveau-etude.modifier', 'Modifier un niveau d''étude', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(79, 'action.orientation.niveau-etude.supprimer', 'Supprimer un niveau d''étude', 'Orientation', 'action', 'menu.orientation.parcours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(80, 'menu.cours', 'Cours', 'Cours', 'menu', NULL, '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(81, 'menu.cours.enseignants', 'Enseignants', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(82, 'menu.cours.liste', 'Cours', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(83, 'menu.cours.presences', 'Présences', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(84, 'menu.cours.mes-presences', 'Mes présences', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(85, 'menu.cours.cahiers-de-texte', 'Cahiers de texte', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(86, 'menu.cours.emplois-du-temps', 'Emplois du temps', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(87, 'menu.cours.notes', 'Notes', 'Cours', 'menu', 'menu.cours', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(88, 'action.cours.enseignant.creer', 'Créer un enseignant', 'Cours', 'action', 'menu.cours.enseignants', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(89, 'action.cours.enseignant.modifier', 'Modifier un enseignant', 'Cours', 'action', 'menu.cours.enseignants', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(90, 'action.cours.cours.creer', 'Créer un cours', 'Cours', 'action', 'menu.cours.liste', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(91, 'action.cours.cours.modifier', 'Modifier un cours', 'Cours', 'action', 'menu.cours.liste', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(92, 'action.cours.cours.supprimer', 'Supprimer un cours', 'Cours', 'action', 'menu.cours.liste', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(93, 'action.cours.presence.generer', 'Générer une présence', 'Cours', 'action', 'menu.cours.presences', '2026-07-03 08:58:41', '2026-07-03 08:58:41', NULL),
(94, 'action.cours.note.saisir', 'Saisir des notes', 'Cours', 'action', 'menu.cours.notes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(95, 'action.cours.note.modifier', 'Modifier des notes', 'Cours', 'action', 'menu.cours.notes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(96, 'menu.evaluations', 'Évaluations', 'Évaluations', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(97, 'menu.evaluations.bulletins', 'Bulletins', 'Évaluations', 'menu', 'menu.evaluations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(98, 'menu.evaluations.deliberations', 'Délibérations', 'Évaluations', 'menu', 'menu.evaluations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(99, 'menu.evaluations.moyennes', 'Moyennes', 'Évaluations', 'menu', 'menu.evaluations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(100, 'menu.evaluations.mon-releve', 'Mon relevé', 'Évaluations', 'menu', 'menu.evaluations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(101, 'action.evaluation.bulletin.generer', 'Générer un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(102, 'action.evaluation.deliberation.organiser', 'Organiser une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(103, 'action.evaluation.moyenne.calculer', 'Calculer les moyennes', 'Évaluations', 'action', 'menu.evaluations.moyennes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(104, 'action.evaluation.deliberation.creer', 'Créer une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(105, 'action.evaluation.deliberation.modifier', 'Modifier une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(106, 'action.evaluation.deliberation.supprimer', 'Supprimer une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(107, 'action.evaluation.deliberation.charger-resultats', 'Charger des résultats', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(108, 'action.evaluation.deliberation.modifier-resultat', 'Modifier un résultat', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(109, 'action.evaluation.deliberation.cloturer', 'Clôturer une délibération', 'Évaluations', 'action', 'menu.evaluations.deliberations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(110, 'action.evaluation.bulletin.modifier', 'Modifier un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(111, 'action.evaluation.bulletin.publier', 'Publier un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(112, 'action.evaluation.bulletin.supprimer', 'Supprimer un bulletin', 'Évaluations', 'action', 'menu.evaluations.bulletins', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(113, 'menu.scolarite', 'Scolarité', 'Scolarité', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(114, 'menu.scolarite.demandes-docs', 'Demandes docs', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(115, 'menu.scolarite.traiter-demandes', 'Traiter demandes', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(116, 'menu.scolarite.reclamations', 'Réclamations', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(117, 'menu.scolarite.traiter-reclamations', 'Traiter réclam.', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(118, 'menu.scolarite.registres', 'Registres', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(119, 'menu.scolarite.calendrier', 'Calendrier', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(120, 'menu.scolarite.discipline', 'Discipline', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(121, 'menu.scolarite.conseils', 'Conseils classe', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(122, 'menu.scolarite.bibliotheque', 'Bibliothèque', 'Scolarité', 'menu', 'menu.scolarite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(123, 'menu.scolarite.bibliotheque.gestion', 'Gestion bibliothèque', 'Scolarité', 'menu', 'menu.scolarite.bibliotheque', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(124, 'action.scolarite.document.traiter', 'Traiter un document', 'Scolarité', 'action', 'menu.scolarite.traiter-demandes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(125, 'action.scolarite.reclamation.traiter', 'Traiter une réclamation', 'Scolarité', 'action', 'menu.scolarite.traiter-reclamations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(126, 'action.scolarite.discipline.sanctionner', 'Ajouter une sanction', 'Scolarité', 'action', 'menu.scolarite.discipline', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(127, 'menu.elearning', 'E-Learning', 'E-Learning', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(128, 'menu.elearning.mes-cours', 'Mes cours', 'E-Learning', 'menu', 'menu.elearning', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(129, 'menu.elearning.quiz', 'Quiz', 'E-Learning', 'menu', 'menu.elearning', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(130, 'menu.elearning.progression', 'Progression', 'E-Learning', 'menu', 'menu.elearning', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(131, 'menu.elearning.certificats', 'Certificats', 'E-Learning', 'menu', 'menu.elearning', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(132, 'menu.elearning.devoirs', 'Devoirs', 'E-Learning', 'menu', 'menu.elearning', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(133, 'menu.elearning.gestion', 'Gestion', 'E-Learning', 'menu', 'menu.elearning', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(134, 'menu.finances', 'Finances', 'Finances', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(135, 'menu.finances.paiements', 'Paiements', 'Finances', 'menu', 'menu.finances', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(136, 'menu.finances.comptabilite', 'Comptabilité', 'Finances', 'menu', 'menu.finances', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(137, 'menu.finances.bordereaux', 'Mes bordereaux', 'Finances', 'menu', 'menu.finances', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(138, 'menu.finances.validation-bordereaux', 'Valid. bordereaux', 'Finances', 'menu', 'menu.finances', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(139, 'action.finances.paiement.enregistrer', 'Enregistrer un paiement', 'Finances', 'action', 'menu.finances.paiements', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(140, 'action.finances.paiement.annuler', 'Annuler un paiement', 'Finances', 'action', 'menu.finances.paiements', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(141, 'action.finances.comptabilite.consulter', 'Consulter la compta', 'Finances', 'action', 'menu.finances.comptabilite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(142, 'action.comptabilite.journal.creer', 'Créer un journal comptable', 'Finances', 'action', 'menu.finances.comptabilite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(143, 'action.comptabilite.ecriture.valider', 'Valider une écriture comptable', 'Finances', 'action', 'menu.finances.comptabilite', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(144, 'menu.achats', 'Achats', 'Achats', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(145, 'menu.achats.demandes', 'Demandes achat', 'Achats', 'menu', 'menu.achats', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(146, 'menu.achats.commandes', 'Commandes', 'Achats', 'menu', 'menu.achats', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(147, 'menu.achats.factures', 'Factures', 'Achats', 'menu', 'menu.achats', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(148, 'menu.achats.fournisseurs', 'Fournisseurs', 'Achats', 'menu', 'menu.achats', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(149, 'menu.achats.budgets', 'Budgets', 'Achats', 'menu', 'menu.achats', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(150, 'menu.stocks', 'Stocks', 'Stocks', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(151, 'menu.stocks.articles', 'Articles', 'Stocks', 'menu', 'menu.stocks', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(152, 'menu.stocks.mouvements', 'Mouvements', 'Stocks', 'menu', 'menu.stocks', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(153, 'menu.stocks.fournisseurs-stock', 'Fournisseurs', 'Stocks', 'menu', 'menu.stocks', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(154, 'menu.immobilisations', 'Immobilisations', 'Immobilisations', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(155, 'menu.immobilisations.liste', 'Immobilisations', 'Immobilisations', 'menu', 'menu.immobilisations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(156, 'menu.immobilisations.sites', 'Sites', 'Immobilisations', 'menu', 'menu.immobilisations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(157, 'menu.immobilisations.categories', 'Catégories', 'Immobilisations', 'menu', 'menu.immobilisations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(158, 'menu.immobilisations.maintenance', 'Maintenance', 'Immobilisations', 'menu', 'menu.immobilisations', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(159, 'menu.stages', 'Stages', 'Stages', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(160, 'menu.stages.offres', 'Offres de stage', 'Stages', 'menu', 'menu.stages', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(161, 'menu.stages.demandes-stage', 'Demandes stage', 'Stages', 'menu', 'menu.stages', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(162, 'menu.stages.entreprises', 'Entreprises', 'Stages', 'menu', 'menu.stages', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(163, 'menu.rh', 'Ressources Humaines', 'R.H', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(164, 'menu.rh.employes', 'Employés', 'R.H', 'menu', 'menu.rh', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(165, 'menu.rh.offres-emploi', 'Offres d''emploi', 'R.H', 'menu', 'menu.rh', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(166, 'menu.rh.candidatures', 'Candidatures', 'R.H', 'menu', 'menu.rh', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(167, 'menu.rh.paie', 'Paie', 'R.H', 'menu', 'menu.rh', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(168, 'menu.rh.prestations', 'Prestations', 'R.H', 'menu', 'menu.rh', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(169, 'action.rh.employe.creer', 'Créer un employé', 'R.H', 'action', 'menu.rh.employes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(170, 'action.rh.employe.modifier', 'Modifier un employé', 'R.H', 'action', 'menu.rh.employes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(171, 'action.rh.paie.generer', 'Générer la paie', 'R.H', 'action', 'menu.rh.paie', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(172, 'menu.pointage', 'Pointage', 'Pointage', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(173, 'menu.pointage.terminal', 'Terminal', 'Pointage', 'menu', 'menu.pointage', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(174, 'menu.pointage.historique', 'Historique', 'Pointage', 'menu', 'menu.pointage', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(175, 'menu.pointage.shifts', 'Shifts', 'Pointage', 'menu', 'menu.pointage', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(176, 'menu.pointage.absences', 'Absences', 'Pointage', 'menu', 'menu.pointage', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(177, 'menu.pointage.planning', 'Planning', 'Pointage', 'menu', 'menu.pointage', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(178, 'menu.pointage.rapports', 'Rapports', 'Pointage', 'menu', 'menu.pointage', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(179, 'menu.administration', 'Administration', 'Administration', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(180, 'menu.administration.utilisateurs', 'Utilisateurs', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(181, 'menu.administration.roles', 'Rôles', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(182, 'menu.administration.qr-codes', 'QR Codes', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(183, 'menu.administration.cartes', 'Cartes', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(184, 'menu.administration.journal-audit', 'Journal audit', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(185, 'menu.administration.configuration', 'Configuration', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(186, 'menu.administration.permissions', 'Permissions', 'Administration', 'menu', 'menu.administration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(187, 'action.administration.utilisateur.creer', 'Créer un utilisateur', 'Administration', 'action', 'menu.administration.utilisateurs', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(188, 'action.administration.utilisateur.modifier', 'Modifier un utilisateur', 'Administration', 'action', 'menu.administration.utilisateurs', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(189, 'action.administration.utilisateur.supprimer', 'Supprimer un utilisateur', 'Administration', 'action', 'menu.administration.utilisateurs', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(190, 'action.administration.permissions.gerer', 'Gérer les permissions', 'Administration', 'action', 'menu.administration.permissions', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(191, 'action.administration.institution.modifier', 'Modifier l''institution', 'Administration', 'action', 'menu.administration.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(192, 'action.administration.institution.supprimer', 'Supprimer l''institution', 'Administration', 'action', 'menu.administration.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(193, 'action.administration.enseignant.inscrire', 'Inscrire un enseignant', 'Administration', 'action', 'menu.administration.utilisateurs', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(194, 'action.administration.enseignant.generer-qr', 'Générer QR code enseignant', 'Administration', 'action', 'menu.administration.qr-codes', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(195, 'action.administration.enseignant.supprimer', 'Supprimer un enseignant', 'Administration', 'action', 'menu.administration.utilisateurs', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(196, 'menu.comite-orientation', 'Comité orientation', 'Administration', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(197, 'menu.comite-orientation.preinscriptions', 'Préinscriptions', 'Administration', 'menu', 'menu.comite-orientation', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(198, 'menu.reporting', 'Reporting', 'Reporting', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(199, 'menu.reporting.dashboard', 'Dashboard', 'Reporting', 'menu', 'menu.reporting', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(200, 'menu.reporting.effectifs', 'Effectifs', 'Reporting', 'menu', 'menu.reporting', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(201, 'menu.reporting.notes', 'Notes', 'Reporting', 'menu', 'menu.reporting', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(202, 'menu.reporting.paiements', 'Paiements', 'Reporting', 'menu', 'menu.reporting', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(203, 'menu.reporting.rh', 'RH', 'Reporting', 'menu', 'menu.reporting', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(204, 'menu.communication', 'Communication', 'Communication', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(205, 'menu.communication.vie-estudiantine', 'Vie estudiantine', 'Communication', 'menu', 'menu.communication', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(206, 'menu.communication.messagerie', 'Messagerie', 'Communication', 'menu', 'menu.communication', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(207, 'menu.communication.discussions', 'Discussions', 'Communication', 'menu', 'menu.communication', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(208, 'menu.communication.suggestions', 'Suggestions', 'Communication', 'menu', 'menu.communication', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(209, 'menu.communication.annonces', 'Annonces', 'Communication', 'menu', 'menu.communication', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(210, 'menu.parametres', 'Paramètres', 'Paramètres', 'menu', NULL, '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(211, 'menu.parametres.mon-profil', 'Mon profil', 'Paramètres', 'menu', 'menu.parametres', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(212, 'menu.parametres.mon-compte', 'Mon compte', 'Paramètres', 'menu', 'menu.parametres', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(213, 'menu.parametres.configuration', 'Configuration', 'Paramètres', 'menu', 'menu.parametres', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(214, 'menu.parametres.configuration.ecole', 'École', 'Paramètres', 'menu', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(215, 'menu.parametres.configuration.annees-scolaires', 'Années scol.', 'Paramètres', 'menu', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(216, 'menu.parametres.configuration.frais', 'Frais', 'Paramètres', 'menu', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(217, 'menu.parametres.configuration.notifications', 'Notifications', 'Paramètres', 'menu', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(218, 'menu.parametres.configuration.systeme', 'Système', 'Paramètres', 'menu', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(219, 'menu.parametres.configuration.sauvegardes', 'Sauvegardes', 'Paramètres', 'menu', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(220, 'menu.parametres.roles', 'Rôles', 'Paramètres', 'menu', 'menu.parametres', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(221, 'menu.parametres.permissions', 'Permissions', 'Paramètres', 'menu', 'menu.parametres', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(222, 'action.parametres.configuration.modifier', 'Modifier la config.', 'Paramètres', 'action', 'menu.parametres.configuration', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_personnes_prevenir_apprenants`
--

CREATE TABLE IF NOT EXISTS `aut_personnes_prevenir_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `prenoms` varchar(255) NOT NULL,
  `boitePostale` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telMobile` varchar(255) NOT NULL,
  `telDomicile` varchar(255) DEFAULT NULL,
  `quartier` varchar(255) NOT NULL,
  `ville` varchar(255) NOT NULL,
  `pays` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `aut_personnes_prevenir_apprenants`
--

INSERT INTO `aut_personnes_prevenir_apprenants` (`id`, `nom`, `prenoms`, `boitePostale`, `email`, `telMobile`, `telDomicile`, `quartier`, `ville`, `pays`, `createdAt`, `updatedAt`, `deletedAt`, `apprenantId`) VALUES
(1, 'Drissa', 'Traoré', NULL, NULL, '+2250701000001', NULL, 'Cocody Angré', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(2, 'Paul', 'Kouamé', NULL, NULL, '+2250702000002', NULL, 'Belle-ville', 'Bouaké', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(3, 'Fatou', 'Diarra', NULL, NULL, '+2250703000003', NULL, 'Yopougon', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(4, 'Yacouba', 'Soro', NULL, NULL, '+2250704000004', NULL, 'Konankro', 'Korhogo', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(5, 'Kouassi', 'Yao', NULL, NULL, '+2250705000005', NULL, 'Commerce', 'Daloa', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(6, 'Mamadou', 'Coulibaly', NULL, NULL, '+2250706000006', NULL, 'Centre', 'Séguela', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(7, 'Bernard', 'Koffi', NULL, NULL, '+2250707000007', NULL, 'Cocody', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(8, 'Alphonse', 'Diomandé', NULL, NULL, '+2250708000008', NULL, 'Libreville', 'Man', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(9, 'Michel', 'N''Dri', NULL, NULL, '+2250709000009', NULL, 'Marcory', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(10, 'Lamine', 'Touré', NULL, NULL, '+2250710000010', NULL, 'Plateau', 'Odienné', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(11, 'Joseph', 'Guei', NULL, NULL, '+2250711000011', NULL, 'Centre Ville', 'Gagnoa', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(12, 'Pierre', 'Kouadio', NULL, NULL, '+2250712000012', NULL, 'Habitat', 'Yamoussoukro', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(13, 'Ousmane', 'Fofana', NULL, NULL, '+2250713000013', NULL, 'Koko', 'Bouaké', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(14, 'Simon', 'Akéko', NULL, NULL, '+2250714000014', NULL, 'Centre', 'Abengourou', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL),
(15, 'Mamadou', 'Soumahoro', NULL, NULL, '+2250715000015', NULL, 'Treichville', 'Abidjan', 'Côte d''Ivoire', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_roles`
--

CREATE TABLE IF NOT EXISTS `aut_roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`),
  UNIQUE KEY `nom_2` (`nom`),
  UNIQUE KEY `nom_3` (`nom`),
  UNIQUE KEY `nom_4` (`nom`),
  UNIQUE KEY `nom_5` (`nom`),
  UNIQUE KEY `nom_6` (`nom`),
  UNIQUE KEY `nom_7` (`nom`),
  UNIQUE KEY `nom_8` (`nom`),
  UNIQUE KEY `nom_9` (`nom`),
  UNIQUE KEY `nom_10` (`nom`),
  UNIQUE KEY `nom_11` (`nom`),
  UNIQUE KEY `nom_12` (`nom`),
  UNIQUE KEY `nom_13` (`nom`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=9 ;

--
-- Contenu de la table `aut_roles`
--

INSERT INTO `aut_roles` (`id`, `nom`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Super Admin', 'Accès complet à toutes les fonctionnalités', '2026-07-03 08:58:42', '2026-07-03 08:58:42', NULL),
(2, 'Directeur', 'Direction de l''établissement', '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(3, 'Comptable', 'Gestion financière et comptable', '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(4, 'Enseignant', 'Corps enseignant', '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(5, 'Apprenant', 'Étudiant / Apprenant', '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(6, 'Parent', 'Parent d''apprenant', '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(7, 'Surveillant', 'Surveillance et discipline', '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(8, 'Bibliothécaire', 'Gestion de la bibliothèque', '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_role_permissions`
--

CREATE TABLE IF NOT EXISTS `aut_role_permissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `roleId` int(10) unsigned NOT NULL,
  `permissionId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aut_role_permissions_permissionId_roleId_unique` (`roleId`,`permissionId`),
  KEY `permissionId` (`permissionId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=202 ;

--
-- Contenu de la table `aut_role_permissions`
--

INSERT INTO `aut_role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 2, 1, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(2, 2, 2, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(3, 2, 3, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(4, 2, 4, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(5, 2, 5, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(6, 2, 8, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(7, 2, 9, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(8, 2, 10, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(9, 2, 12, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(10, 2, 13, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(11, 2, 14, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(12, 2, 15, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(13, 2, 16, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(14, 2, 17, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(15, 2, 18, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(16, 2, 19, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(17, 2, 20, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(18, 2, 21, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(19, 2, 23, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(20, 2, 25, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(21, 2, 26, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(22, 2, 58, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(23, 2, 59, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(24, 2, 60, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(25, 2, 80, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(26, 2, 81, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(27, 2, 82, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(28, 2, 83, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(29, 2, 86, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(30, 2, 87, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(31, 2, 88, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(32, 2, 89, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(33, 2, 90, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(34, 2, 91, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(35, 2, 92, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(36, 2, 94, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(37, 2, 95, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(38, 2, 96, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(39, 2, 97, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(40, 2, 98, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(41, 2, 99, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(42, 2, 101, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(43, 2, 102, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(44, 2, 103, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(45, 2, 113, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(46, 2, 114, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(47, 2, 115, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(48, 2, 116, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(49, 2, 117, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(50, 2, 118, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(51, 2, 119, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(52, 2, 120, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(53, 2, 121, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(54, 2, 124, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(55, 2, 125, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(56, 2, 126, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(57, 2, 134, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(58, 2, 135, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(59, 2, 136, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(60, 2, 137, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(61, 2, 138, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(62, 2, 139, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(63, 2, 140, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(64, 2, 150, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(65, 2, 151, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(66, 2, 152, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(67, 2, 163, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(68, 2, 164, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(69, 2, 167, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(70, 2, 169, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(71, 2, 170, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(72, 2, 171, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(73, 2, 172, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(74, 2, 174, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(75, 2, 178, '2026-07-03 08:58:45', '2026-07-03 08:58:45', NULL),
(76, 2, 198, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(77, 2, 199, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(78, 2, 200, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(79, 2, 201, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(80, 2, 202, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(81, 2, 204, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(82, 2, 205, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(83, 2, 206, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(84, 2, 209, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(85, 2, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(86, 2, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(87, 2, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(88, 2, 213, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(89, 3, 1, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(90, 3, 2, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(91, 3, 9, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(92, 3, 10, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(93, 3, 11, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(94, 3, 12, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(95, 3, 13, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(96, 3, 22, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(97, 3, 23, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(98, 3, 24, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(99, 3, 134, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(100, 3, 135, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(101, 3, 136, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(102, 3, 137, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(103, 3, 138, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(104, 3, 139, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(105, 3, 140, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(106, 3, 141, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(107, 3, 198, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(108, 3, 202, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(109, 3, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(110, 3, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(111, 3, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(112, 4, 1, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(113, 4, 80, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(114, 4, 82, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(115, 4, 83, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(116, 4, 84, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(117, 4, 85, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(118, 4, 86, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(119, 4, 87, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(120, 4, 90, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(121, 4, 91, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(122, 4, 93, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(123, 4, 94, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(124, 4, 95, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(125, 4, 96, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(126, 4, 97, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(127, 4, 99, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(128, 4, 100, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(129, 4, 101, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(130, 4, 113, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(131, 4, 119, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(132, 4, 204, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(133, 4, 206, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(134, 4, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(135, 4, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(136, 4, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(137, 5, 1, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(138, 5, 2, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(139, 5, 6, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(140, 5, 7, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(141, 5, 9, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(142, 5, 11, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(143, 5, 13, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(144, 5, 80, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(145, 5, 84, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(146, 5, 86, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(147, 5, 87, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(148, 5, 96, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(149, 5, 100, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(150, 5, 127, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(151, 5, 128, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(152, 5, 129, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(153, 5, 130, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(154, 5, 131, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(155, 5, 132, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(156, 5, 159, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(157, 5, 160, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(158, 5, 161, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(159, 5, 204, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(160, 5, 205, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(161, 5, 206, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(162, 5, 207, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(163, 5, 208, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(164, 5, 209, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(165, 5, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(166, 5, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(167, 5, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(168, 6, 204, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(169, 6, 206, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(170, 6, 80, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(171, 6, 86, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(172, 6, 96, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(173, 6, 100, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(174, 6, 2, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(175, 6, 6, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(176, 6, 7, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(177, 6, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(178, 6, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(179, 6, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(180, 6, 113, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(181, 6, 114, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(182, 6, 116, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(183, 6, 1, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(184, 7, 126, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(185, 7, 204, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(186, 7, 206, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(187, 7, 80, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(188, 7, 86, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(189, 7, 83, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(190, 7, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(191, 7, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(192, 7, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(193, 7, 172, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(194, 7, 176, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(195, 7, 113, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(196, 7, 120, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(197, 7, 1, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(198, 8, 210, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(199, 8, 212, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(200, 8, 211, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL),
(201, 8, 1, '2026-07-03 08:58:46', '2026-07-03 08:58:46', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `aut_user_permissions`
--

CREATE TABLE IF NOT EXISTS `aut_user_permissions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `utilisateurId` int(10) unsigned NOT NULL,
  `permissionId` int(10) unsigned NOT NULL,
  `estActif` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`),
  KEY `permissionId` (`permissionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `aut_user_roles`
--

CREATE TABLE IF NOT EXISTS `aut_user_roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `utilisateurId` int(10) unsigned NOT NULL,
  `roleId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `aut_user_roles_utilisateurId_roleId_unique` (`utilisateurId`,`roleId`),
  KEY `roleId` (`roleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `aut_utilisateurs`
--

CREATE TABLE IF NOT EXISTS `aut_utilisateurs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `prenoms` varchar(255) NOT NULL,
  `identifiant` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `motDePasse` varchar(255) NOT NULL,
  `role` enum('apprenant','institution','enseignant','caissier_banque','ressources_humaines','cabinet_comptable','comite_orientation','admin') DEFAULT 'apprenant',
  `contact` varchar(255) DEFAULT NULL,
  `photoDeProfil` varchar(255) DEFAULT NULL,
  `dateVerificationEmail` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifiant` (`identifiant`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `nom-prenoms` (`nom`,`prenoms`),
  UNIQUE KEY `identifiant_2` (`identifiant`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `identifiant_3` (`identifiant`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `identifiant_4` (`identifiant`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `identifiant_5` (`identifiant`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `identifiant_6` (`identifiant`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `identifiant_7` (`identifiant`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `identifiant_8` (`identifiant`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `identifiant_9` (`identifiant`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `identifiant_10` (`identifiant`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `identifiant_11` (`identifiant`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `identifiant_12` (`identifiant`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `identifiant_13` (`identifiant`),
  UNIQUE KEY `email_13` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=26 ;

--
-- Contenu de la table `aut_utilisateurs`
--

INSERT INTO `aut_utilisateurs` (`id`, `nom`, `prenoms`, `identifiant`, `email`, `motDePasse`, `role`, `contact`, `photoDeProfil`, `dateVerificationEmail`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Admin', 'Système', 'admin', 'admin@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'admin', '+2250100000000', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(2, 'Koffi', 'Philippe', 'institution', 'institution@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'institution', '+2250101000001', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(3, 'Konan', 'Yves', 'prof-maths', 'yves.konan@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'enseignant', '+2250102000001', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(4, 'N''Dri', 'Aline', 'prof-info', 'aline.ndri@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'enseignant', '+2250102000002', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(5, 'Touré', 'Moussa', 'prof-gestion', 'moussa.toure@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'enseignant', '+2250102000003', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(6, 'Bamba', 'Fatou', 'prof-droit', 'fatou.bamba@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'enseignant', '+2250102000004', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(7, 'Koné', 'Mariam', 'caissier1', 'mariam.kone@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'caissier_banque', '+2250103000001', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(8, 'Diaby', 'Ibrahim', 'caissier2', 'ibrahim.diaby@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'caissier_banque', '+2250103000002', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(9, 'Kouassi', 'Laurent', 'comite1', 'laurent.kouassi@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'comite_orientation', '+2250104000001', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(10, 'Soro', 'Nathalie', 'comite2', 'nathalie.soro@ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'comite_orientation', '+2250104000002', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(11, 'Traoré', 'Aminata', 'etudiant1', 'aminata.traore@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250501000001', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(12, 'Kouamé', 'Jean', 'etudiant2', 'jean.kouame@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250502000002', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(13, 'Bamba', 'Mariam', 'etudiant3', 'mariam.bamba@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250503000003', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(14, 'Soro', 'Léon', 'etudiant4', 'leon.soro@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250504000004', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(15, 'Yao', 'Esther', 'etudiant5', 'esther.yao@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250505000005', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(16, 'Coulibaly', 'Adama', 'etudiant6', 'adama.coulibaly@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250506000006', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(17, 'Koffi', 'Aya', 'etudiant7', 'aya.koffi@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250507000007', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(18, 'Diomandé', 'Yannick', 'etudiant8', 'yannick.diomande@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250508000008', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(19, 'N''Dri', 'Grace', 'etudiant9', 'grace.ndri@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250509000009', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(20, 'Touré', 'Moussa Junior', 'etudiant10', 'moussa.junior@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250510000010', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(21, 'Guei', 'Sarah', 'etudiant11', 'sarah.guei@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250511000011', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(22, 'Kouadio', 'Arnaud', 'etudiant12', 'arnaud.kouadio@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250512000012', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(23, 'Fofana', 'Mariam', 'etudiant13', 'mariam.fofana@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250513000013', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(24, 'Akéko', 'Georges', 'etudiant14', 'georges.akeko@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250514000014', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(25, 'Soumahoro', 'Fatima', 'etudiant15', 'fatima.soumahoro@etu.ust.ci', '$2b$10$ZS79fxt2fRElfuktnyW1PuAc31dTZ35gWiw4peepwHzkW22t1ayZ6', 'apprenant', '+2250515000015', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `com_actualites`
--

CREATE TABLE IF NOT EXISTS `com_actualites` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `contenu` text NOT NULL,
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:18',
  `image` varchar(255) DEFAULT NULL,
  `categorie` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `com_actualites`
--

INSERT INTO `com_actualites` (`id`, `titre`, `contenu`, `date`, `image`, `categorie`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'L''UST célèbre ses 10 ans', 'L''Université des Sciences et Technologies fête sa première décennie d''excellence.', '2025-03-20 00:00:00', NULL, 'Événement', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Partenariat avec Orange CI', 'L''UST signe un partenariat avec Orange Côte d''Ivoire pour la formation aux métiers du numérique.', '2025-04-10 00:00:00', NULL, 'Partenariat', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `com_communications`
--

CREATE TABLE IF NOT EXISTS `com_communications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `contenu` text NOT NULL,
  `datePublication` datetime NOT NULL DEFAULT '2026-07-06 14:44:18',
  `statut` enum('brouillon','publiee') NOT NULL DEFAULT 'brouillon',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `com_communications`
--

INSERT INTO `com_communications` (`id`, `titre`, `contenu`, `datePublication`, `statut`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Rentrée universitaire 2025-2026', 'Les inscriptions pour la rentrée 2025-2026 sont ouvertes du 1er septembre au 31 octobre 2025.', '2025-08-15 00:00:00', 'publiee', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Calendrier des examens', 'Les examens du semestre 1 auront lieu du 15 au 30 juin 2025.', '2025-05-01 00:00:00', 'publiee', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 'Note de service', 'Réunion pédagogique obligatoire le 10 septembre 2025 à 9h.', '2025-09-01 00:00:00', 'brouillon', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `com_reponses_suggestion`
--

CREATE TABLE IF NOT EXISTS `com_reponses_suggestion` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:18',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `suggestionId` int(10) unsigned DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `suggestionId` (`suggestionId`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `com_reponses_suggestion`
--

INSERT INTO `com_reponses_suggestion` (`id`, `message`, `date`, `createdAt`, `updatedAt`, `deletedAt`, `suggestionId`, `utilisateurId`) VALUES
(1, 'Merci pour votre suggestion. Elle sera étudiée par la direction.', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `com_suggestions`
--

CREATE TABLE IF NOT EXISTS `com_suggestions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `statut` enum('ouverte','traitee','fermee') NOT NULL DEFAULT 'ouverte',
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:18',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `com_suggestions`
--

INSERT INTO `com_suggestions` (`id`, `type`, `message`, `statut`, `date`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, 'Amélioration', 'Suggestion d''ajouter un laboratoire de langues', 'traitee', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 11),
(2, 'Réclamation', 'Horaires d''ouverture de la bibliothèque trop restrictifs', 'ouverte', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 12);

-- --------------------------------------------------------

--
-- Structure de la table `cpt_comptes`
--

CREATE TABLE IF NOT EXISTS `cpt_comptes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `numero` varchar(10) NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `classe` enum('1','2','3','4','5','6','7','8','9') NOT NULL,
  `sousClasse` varchar(10) DEFAULT NULL,
  `nature` enum('Débit','Crédit','Débit/Crédit') NOT NULL DEFAULT 'Débit/Crédit',
  `categorie` varchar(100) NOT NULL,
  `description` text,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `moduleSource` varchar(50) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  UNIQUE KEY `numero_2` (`numero`),
  UNIQUE KEY `numero_3` (`numero`),
  UNIQUE KEY `numero_4` (`numero`),
  UNIQUE KEY `numero_5` (`numero`),
  UNIQUE KEY `numero_6` (`numero`),
  UNIQUE KEY `numero_7` (`numero`),
  UNIQUE KEY `numero_8` (`numero`),
  UNIQUE KEY `numero_9` (`numero`),
  UNIQUE KEY `numero_10` (`numero`),
  UNIQUE KEY `numero_11` (`numero`),
  UNIQUE KEY `numero_12` (`numero`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `cpt_comptes`
--

INSERT INTO `cpt_comptes` (`id`, `numero`, `libelle`, `classe`, `sousClasse`, `nature`, `categorie`, `description`, `actif`, `moduleSource`, `createdAt`, `updatedAt`) VALUES
(1, '101', 'Capital social', '1', '10', 'Crédit', 'Capitaux propres', 'Compte Capital social', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(2, '164', 'Emprunts', '1', '16', 'Crédit', 'Dettes financières', 'Compte Emprunts', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(3, '211', 'Terrains', '2', '21', 'Débit', 'Immobilisations corporelles', 'Compte Terrains', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(4, '2183', 'Matériel informatique', '2', '21', 'Débit', 'Immobilisations corporelles', 'Compte Matériel informatique', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(5, '281', 'Amortissements', '2', '28', 'Crédit', 'Amortissements', 'Compte Amortissements', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(6, '401', 'Fournisseurs', '4', '40', 'Crédit', 'Dettes', 'Compte Fournisseurs', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(7, '411', 'Clients', '4', '41', 'Débit', 'Créances', 'Compte Clients', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(8, '512', 'Banque', '5', '51', 'Débit/Crédit', 'Trésorerie', 'Compte Banque', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(9, '531', 'Caisse', '5', '53', 'Débit', 'Trésorerie', 'Compte Caisse', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(10, '601', 'Achats', '6', '60', 'Débit', 'Charges', 'Compte Achats', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(11, '606', 'Fournitures', '6', '60', 'Débit', 'Charges', 'Compte Fournitures', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(12, '641', 'Salaires', '6', '64', 'Débit', 'Charges', 'Compte Salaires', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(13, '645', 'Charges sociales', '6', '64', 'Débit', 'Charges', 'Compte Charges sociales', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(14, '701', 'Ventes', '7', '70', 'Crédit', 'Produits', 'Compte Ventes', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(15, '706', 'Prestations de services', '7', '70', 'Crédit', 'Produits', 'Compte Prestations de services', 1, 'seed', '2026-07-02 18:09:19', '2026-07-02 18:09:19');

-- --------------------------------------------------------

--
-- Structure de la table `cpt_ecritures_comptables`
--

CREATE TABLE IF NOT EXISTS `cpt_ecritures_comptables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `journalId` int(10) unsigned NOT NULL,
  `numeroEcriture` varchar(50) NOT NULL,
  `dateEcriture` date NOT NULL,
  `dateComptable` date NOT NULL,
  `compteDebitId` int(10) unsigned NOT NULL,
  `compteCreditId` int(10) unsigned NOT NULL,
  `montant` float unsigned NOT NULL,
  `libelle` text NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `pieceJustificative` varchar(255) DEFAULT NULL,
  `moduleSource` varchar(50) DEFAULT NULL,
  `referenceModuleId` varchar(50) DEFAULT NULL,
  `utilisateurSaisieId` int(10) unsigned DEFAULT NULL,
  `validee` tinyint(1) NOT NULL DEFAULT '0',
  `utilisateurValidationId` int(10) unsigned DEFAULT NULL,
  `dateValidation` date DEFAULT NULL,
  `observations` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numeroEcriture` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_2` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_3` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_4` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_5` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_6` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_7` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_8` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_9` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_10` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_11` (`numeroEcriture`),
  UNIQUE KEY `numeroEcriture_12` (`numeroEcriture`),
  KEY `journalId` (`journalId`),
  KEY `compteDebitId` (`compteDebitId`),
  KEY `compteCreditId` (`compteCreditId`),
  KEY `utilisateurSaisieId` (`utilisateurSaisieId`),
  KEY `utilisateurValidationId` (`utilisateurValidationId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `cpt_ecritures_comptables`
--

INSERT INTO `cpt_ecritures_comptables` (`id`, `journalId`, `numeroEcriture`, `dateEcriture`, `dateComptable`, `compteDebitId`, `compteCreditId`, `montant`, `libelle`, `reference`, `pieceJustificative`, `moduleSource`, `referenceModuleId`, `utilisateurSaisieId`, `validee`, `utilisateurValidationId`, `dateValidation`, `observations`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'AC-001', '2025-01-22', '2025-01-22', 10, 6, 590000, 'Achat fournitures bureau', 'FACT-001', NULL, 'achats', NULL, 1, 1, 1, '2025-01-22', NULL, '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(2, 2, 'BQ-001', '2025-01-25', '2025-01-25', 6, 8, 590000, 'Paiement facture fournitures', NULL, NULL, 'achats', NULL, 1, 1, NULL, NULL, NULL, '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(3, 2, 'BQ-002', '2025-06-30', '2025-06-30', 12, 8, 8000000, 'Paie juin 2025', NULL, NULL, 'rh', NULL, 1, 1, NULL, NULL, NULL, '2026-07-02 18:09:19', '2026-07-02 18:09:19');

-- --------------------------------------------------------

--
-- Structure de la table `cpt_journaux_comptables`
--

CREATE TABLE IF NOT EXISTS `cpt_journaux_comptables` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `type` enum('Achat','Vente','Banque','Caisse','Paie','OD','Divers') NOT NULL,
  `description` text,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `cpt_journaux_comptables`
--

INSERT INTO `cpt_journaux_comptables` (`id`, `code`, `libelle`, `type`, `description`, `actif`, `createdAt`, `updatedAt`) VALUES
(1, 'AC', 'Journal des achats', 'Achat', 'Saisie des factures fournisseurs', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(2, 'BQ', 'Journal de banque', 'Banque', 'Opérations bancaires', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(3, 'OD', 'Journal des opérations diverses', 'OD', 'OD de clôture et diverses', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19');

-- --------------------------------------------------------

--
-- Structure de la table `elearning_certificats`
--

CREATE TABLE IF NOT EXISTS `elearning_certificats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `code` varchar(255) DEFAULT NULL,
  `dateObtention` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `elearning_commentaires`
--

CREATE TABLE IF NOT EXISTS `elearning_commentaires` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supportId` int(10) unsigned NOT NULL,
  `utilisateurId` int(11) NOT NULL,
  `message` text NOT NULL,
  `date` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supportId` (`supportId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `elearning_commentaires`
--

INSERT INTO `elearning_commentaires` (`id`, `supportId`, `utilisateurId`, `message`, `date`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 11, 'Très bon support !', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 2, 11, 'Très bon support !', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 3, 11, 'Très bon support !', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_couplages_mail`
--

CREATE TABLE IF NOT EXISTS `elearning_couplages_mail` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `supportId` int(10) unsigned NOT NULL,
  `emailEnvoye` varchar(255) NOT NULL,
  `dateEnvoi` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `supportId` (`supportId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `elearning_couplages_mail`
--

INSERT INTO `elearning_couplages_mail` (`id`, `supportId`, `emailEnvoye`, `dateEnvoi`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'etudiant1@etu.ust.ci', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 3, 'etudiant2@etu.ust.ci', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_cours`
--

CREATE TABLE IF NOT EXISTS `elearning_cours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coursId` varchar(255) DEFAULT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `statut` varchar(255) DEFAULT 'actif',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `elearning_cours`
--

INSERT INTO `elearning_cours` (`id`, `coursId`, `titre`, `description`, `image`, `statut`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, '1', 'Algorithmique et Programmation', 'Cours en ligne d''initiation à la programmation', NULL, 'actif', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, '7', 'Bases de données', 'Cours en ligne de SQL et conception BD', NULL, 'actif', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_devoirs`
--

CREATE TABLE IF NOT EXISTS `elearning_devoirs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `dateLimite` datetime NOT NULL,
  `fichier` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `elearning_messages`
--

CREATE TABLE IF NOT EXISTS `elearning_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `salonId` int(10) unsigned NOT NULL,
  `utilisateurId` int(11) NOT NULL,
  `message` text NOT NULL,
  `date` datetime DEFAULT NULL,
  `lu` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `salonId` (`salonId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `elearning_messages`
--

INSERT INTO `elearning_messages` (`id`, `salonId`, `utilisateurId`, `message`, `date`, `lu`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 11, 'Bonjour à tous !', '2026-07-02 18:09:19', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 1, 2, 'Bonjour ! Le cours commence cette semaine.', '2026-07-02 18:09:19', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 1, 12, 'Merci professeur !', '2026-07-02 18:09:19', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(4, 2, 2, 'Nouveau module SQL disponible.', '2026-07-02 18:09:19', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(5, 2, 11, 'Super, merci !', '2026-07-02 18:09:19', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_modules`
--

CREATE TABLE IF NOT EXISTS `elearning_modules` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coursId` int(10) unsigned NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `ordre` int(11) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `elearning_modules`
--

INSERT INTO `elearning_modules` (`id`, `coursId`, `titre`, `description`, `ordre`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'Introduction à Python', 'Variables, types et structures de contrôle', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 1, 'Fonctions et modules', 'Définition de fonctions et import de modules', 2, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 2, 'SQL Fondamentaux', 'Requêtes SELECT, INSERT, UPDATE', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_notifications`
--

CREATE TABLE IF NOT EXISTS `elearning_notifications` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `utilisateurId` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `lu` tinyint(1) DEFAULT '0',
  `date` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `elearning_notifications`
--

INSERT INTO `elearning_notifications` (`id`, `utilisateurId`, `type`, `message`, `lu`, `date`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 11, 'cours', 'Nouveau cours disponible : Algorithmique', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 12, 'cours', 'Nouveau cours disponible : Algorithmique', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 13, 'cours', 'Nouveau cours disponible : Algorithmique', 0, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(4, 1, 'system', 'Mise à jour système effectuée', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_participants_salon`
--

CREATE TABLE IF NOT EXISTS `elearning_participants_salon` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `salonId` int(10) unsigned NOT NULL,
  `utilisateurId` int(11) NOT NULL,
  `dateAjout` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `salonId` (`salonId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=11 ;

--
-- Contenu de la table `elearning_participants_salon`
--

INSERT INTO `elearning_participants_salon` (`id`, `salonId`, `utilisateurId`, `dateAjout`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 11, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 2, 11, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 1, 12, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(4, 2, 12, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(5, 1, 13, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(6, 2, 13, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(7, 1, 14, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(8, 2, 14, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(9, 1, 15, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(10, 2, 15, '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_quiz`
--

CREATE TABLE IF NOT EXISTS `elearning_quiz` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `tempsLimite` int(11) DEFAULT NULL,
  `questions` text NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `elearning_reponses_quiz`
--

CREATE TABLE IF NOT EXISTS `elearning_reponses_quiz` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reponses` text NOT NULL,
  `score` float DEFAULT NULL,
  `total` int(11) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `quizId` int(10) unsigned DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quizId` (`quizId`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `elearning_salons`
--

CREATE TABLE IF NOT EXISTS `elearning_salons` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coursId` int(10) unsigned NOT NULL,
  `titre` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT 'cours',
  `dateCreation` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `elearning_salons`
--

INSERT INTO `elearning_salons` (`id`, `coursId`, `titre`, `type`, `dateCreation`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'Chat Programmation', 'cours', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 2, 'Chat Base de données', 'cours', '2026-07-02 18:09:19', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `elearning_soumissions_devoirs`
--

CREATE TABLE IF NOT EXISTS `elearning_soumissions_devoirs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fichier` varchar(255) NOT NULL,
  `note` float DEFAULT NULL,
  `commentaire` text,
  `dateSoumission` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `devoirId` int(10) unsigned DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `devoirId` (`devoirId`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `elearning_supports`
--

CREATE TABLE IF NOT EXISTS `elearning_supports` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `moduleId` int(10) unsigned NOT NULL,
  `type` varchar(255) NOT NULL,
  `fichierOriginal` varchar(255) NOT NULL,
  `fichierCompresse` varchar(255) DEFAULT NULL,
  `dureeVideo` varchar(255) DEFAULT NULL,
  `taille` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `moduleId` (`moduleId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `elearning_supports`
--

INSERT INTO `elearning_supports` (`id`, `moduleId`, `type`, `fichierOriginal`, `fichierCompresse`, `dureeVideo`, `taille`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'PDF', 'python_intro.pdf', 'python_intro_comp.pdf', NULL, '2.5 MB', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 1, 'VIDEO', 'python_video.mp4', NULL, '45:30', '120 MB', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 3, 'PDF', 'sql_fundamentals.pdf', NULL, NULL, '1.8 MB', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ged_documents`
--

CREATE TABLE IF NOT EXISTS `ged_documents` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `eleve` varchar(255) DEFAULT NULL,
  `parcours` varchar(255) DEFAULT NULL,
  `categorie` varchar(255) DEFAULT NULL,
  `tags` text,
  `nommage` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT 'PDF',
  `statut` varchar(255) NOT NULL DEFAULT 'Disponible',
  `fichier` varchar(255) NOT NULL,
  `taille` varchar(255) DEFAULT NULL,
  `uploaderId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `dureeConservation` varchar(255) DEFAULT NULL,
  `archivedUntil` datetime DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT '0',
  `folderId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaderId` (`uploaderId`),
  KEY `folderId` (`folderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ged_folders`
--

CREATE TABLE IF NOT EXISTS `ged_folders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `parentId` int(10) unsigned DEFAULT NULL,
  `createdBy` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `createdBy` (`createdBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `imm_acquisition`
--

CREATE TABLE IF NOT EXISTS `imm_acquisition` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `immobilisationId` int(10) unsigned NOT NULL,
  `fournisseurNom` varchar(255) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `dateAcquisition` datetime NOT NULL,
  `modeAcquisition` enum('achat','don','transfert') DEFAULT 'achat',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `immobilisationId` (`immobilisationId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `imm_acquisition`
--

INSERT INTO `imm_acquisition` (`id`, `immobilisationId`, `fournisseurNom`, `montant`, `dateAcquisition`, `modeAcquisition`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'Informatique Pro', '800000.00', '2024-10-15 00:00:00', 'achat', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 2, 'Informatique Pro', '800000.00', '2024-11-15 00:00:00', 'achat', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 3, 'Informatique Pro', '800000.00', '2024-12-15 00:00:00', 'achat', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 4, 'Informatique Pro', '800000.00', '2025-01-15 00:00:00', 'achat', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_amortissement`
--

CREATE TABLE IF NOT EXISTS `imm_amortissement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `immobilisationId` int(10) unsigned NOT NULL,
  `annee` int(11) NOT NULL,
  `montantAmorti` decimal(12,2) NOT NULL,
  `valeurResiduelle` decimal(12,2) NOT NULL,
  `dateCalcul` datetime NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `immobilisationId` (`immobilisationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `imm_batiment`
--

CREATE TABLE IF NOT EXISTS `imm_batiment` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `siteId` int(10) unsigned NOT NULL,
  `nom` varchar(255) NOT NULL,
  `adresse` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `siteId` (`siteId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `imm_batiment`
--

INSERT INTO `imm_batiment` (`id`, `siteId`, `nom`, `adresse`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'Bâtiment A', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 1, 'Bâtiment B', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 2, 'Pavillon Marcory', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_categorie_immobilisation`
--

CREATE TABLE IF NOT EXISTS `imm_categorie_immobilisation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `tauxAmortissement` decimal(5,2) DEFAULT NULL,
  `dureeVie` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `imm_categorie_immobilisation`
--

INSERT INTO `imm_categorie_immobilisation` (`id`, `nom`, `description`, `tauxAmortissement`, `dureeVie`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Matériel informatique', NULL, '20.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Mobilier de bureau', NULL, '10.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Véhicules', NULL, '20.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_cession`
--

CREATE TABLE IF NOT EXISTS `imm_cession` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `immobilisationId` int(10) unsigned NOT NULL,
  `dateCession` datetime NOT NULL,
  `motif` text NOT NULL,
  `prixCession` decimal(12,2) DEFAULT NULL,
  `destinataire` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `immobilisationId` (`immobilisationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `imm_departement`
--

CREATE TABLE IF NOT EXISTS `imm_departement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`),
  UNIQUE KEY `nom_2` (`nom`),
  UNIQUE KEY `nom_3` (`nom`),
  UNIQUE KEY `nom_4` (`nom`),
  UNIQUE KEY `nom_5` (`nom`),
  UNIQUE KEY `nom_6` (`nom`),
  UNIQUE KEY `nom_7` (`nom`),
  UNIQUE KEY `nom_8` (`nom`),
  UNIQUE KEY `nom_9` (`nom`),
  UNIQUE KEY `nom_10` (`nom`),
  UNIQUE KEY `nom_11` (`nom`),
  UNIQUE KEY `nom_12` (`nom`),
  UNIQUE KEY `nom_13` (`nom`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `imm_departement`
--

INSERT INTO `imm_departement` (`id`, `nom`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Enseignement et Recherche', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Finance', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_immobilisation`
--

CREATE TABLE IF NOT EXISTS `imm_immobilisation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `reference` varchar(255) NOT NULL,
  `description` text,
  `codeQR` text,
  `categorieId` int(10) unsigned DEFAULT NULL,
  `localisationId` int(10) unsigned DEFAULT NULL,
  `departementId` int(10) unsigned DEFAULT NULL,
  `siteId` int(10) unsigned DEFAULT NULL,
  `etat` enum('neuf','bon','moyen','mauvais','reforme') DEFAULT 'bon',
  `dateMiseEnService` date NOT NULL,
  `valeurAcquisition` decimal(12,2) NOT NULL,
  `responsableNom` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  UNIQUE KEY `reference_2` (`reference`),
  UNIQUE KEY `reference_3` (`reference`),
  UNIQUE KEY `reference_4` (`reference`),
  UNIQUE KEY `reference_5` (`reference`),
  UNIQUE KEY `reference_6` (`reference`),
  UNIQUE KEY `reference_7` (`reference`),
  UNIQUE KEY `reference_8` (`reference`),
  UNIQUE KEY `reference_9` (`reference`),
  UNIQUE KEY `reference_10` (`reference`),
  UNIQUE KEY `reference_11` (`reference`),
  UNIQUE KEY `reference_12` (`reference`),
  UNIQUE KEY `reference_13` (`reference`),
  KEY `categorieId` (`categorieId`),
  KEY `localisationId` (`localisationId`),
  KEY `departementId` (`departementId`),
  KEY `siteId` (`siteId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `imm_immobilisation`
--

INSERT INTO `imm_immobilisation` (`id`, `nom`, `reference`, `description`, `codeQR`, `categorieId`, `localisationId`, `departementId`, `siteId`, `etat`, `dateMiseEnService`, `valeurAcquisition`, `responsableNom`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Ordinateur Portable 1', 'SN-UST-001', NULL, NULL, NULL, NULL, NULL, 1, 'bon', '2024-10-15', '800000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Ordinateur Portable 2', 'SN-UST-002', NULL, NULL, NULL, NULL, NULL, 1, 'bon', '2024-11-15', '800000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Ordinateur Portable 3', 'SN-UST-003', NULL, NULL, NULL, NULL, NULL, 1, 'bon', '2024-12-15', '800000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'Ordinateur Portable 4', 'SN-UST-004', NULL, NULL, NULL, NULL, NULL, 1, 'bon', '2025-01-15', '800000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_localisation`
--

CREATE TABLE IF NOT EXISTS `imm_localisation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `batimentId` int(10) unsigned NOT NULL,
  `code` varchar(255) NOT NULL,
  `capacite` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`),
  UNIQUE KEY `code_13` (`code`),
  KEY `batimentId` (`batimentId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `imm_localisation`
--

INSERT INTO `imm_localisation` (`id`, `batimentId`, `code`, `capacite`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'SALLE-PROF', 20, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 1, 'SALLE-REUNION-1', 15, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 2, 'BIBLIOTHEQUE', 100, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_maintenance`
--

CREATE TABLE IF NOT EXISTS `imm_maintenance` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `immobilisationId` int(10) unsigned NOT NULL,
  `dateMaintenance` datetime NOT NULL,
  `type` enum('preventive','corrective') NOT NULL,
  `description` text NOT NULL,
  `cout` decimal(10,2) DEFAULT NULL,
  `prestataire` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `immobilisationId` (`immobilisationId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `imm_maintenance`
--

INSERT INTO `imm_maintenance` (`id`, `immobilisationId`, `dateMaintenance`, `type`, `description`, `cout`, `prestataire`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, '2025-06-01 00:00:00', 'preventive', 'Maintenance annuelle PC 1', '25000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 2, '2025-06-01 00:00:00', 'preventive', 'Maintenance annuelle PC 2', '25000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 3, '2025-06-01 00:00:00', 'preventive', 'Maintenance annuelle PC 3', '25000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 4, '2025-06-01 00:00:00', 'preventive', 'Maintenance annuelle PC 4', '25000.00', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `imm_maintenance_programmee`
--

CREATE TABLE IF NOT EXISTS `imm_maintenance_programmee` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `immobilisationId` int(10) unsigned NOT NULL,
  `description` text NOT NULL,
  `periodicite` varchar(255) NOT NULL,
  `prochaineEcheance` datetime NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `immobilisationId` (`immobilisationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `imm_site`
--

CREATE TABLE IF NOT EXISTS `imm_site` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `adresse` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `imm_site`
--

INSERT INTO `imm_site` (`id`, `nom`, `adresse`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Campus Principal', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Annexe Marcory', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_absences`
--

CREATE TABLE IF NOT EXISTS `ins_absences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `noteEvaluationId` int(10) unsigned NOT NULL,
  `type` enum('present','justifie','injustifie') NOT NULL DEFAULT 'present',
  `motif` text,
  `justificatif` varchar(255) DEFAULT NULL,
  `declareLe` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `noteEvaluationId` (`noteEvaluationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_annees_academiques`
--

CREATE TABLE IF NOT EXISTS `ins_annees_academiques` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ins_annees_academiques`
--

INSERT INTO `ins_annees_academiques` (`id`, `libelle`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, '2024-2025', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(2, '2025-2026', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_audit_notes`
--

CREATE TABLE IF NOT EXISTS `ins_audit_notes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `noteEvaluationId` int(10) unsigned NOT NULL,
  `ancienneNote` float DEFAULT NULL,
  `nouvelleNote` float DEFAULT NULL,
  `modifiePar` int(10) unsigned NOT NULL,
  `motif` text,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `noteEvaluationId` (`noteEvaluationId`),
  KEY `modifiePar` (`modifiePar`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_blocs_cahier_de_texte`
--

CREATE TABLE IF NOT EXISTS `ins_blocs_cahier_de_texte` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `heureDebut` time NOT NULL,
  `heureFin` time NOT NULL,
  `contenu` text NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `cahierDeTexteId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cahierDeTexteId` (`cahierDeTexteId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_bordereaux`
--

CREATE TABLE IF NOT EXISTS `ins_bordereaux` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('inscription','scolarite') NOT NULL,
  `fichier` varchar(255) NOT NULL,
  `montant` float unsigned NOT NULL,
  `referenceBancaire` varchar(255) DEFAULT NULL,
  `statut` enum('en_attente','valide','rejete') NOT NULL DEFAULT 'en_attente',
  `dateSoumission` date NOT NULL,
  `dateValidation` date DEFAULT NULL,
  `valideParId` int(10) unsigned DEFAULT NULL,
  `commentaire` text,
  `quitusId` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `echeanceId` int(10) unsigned DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `valideParId` (`valideParId`),
  KEY `echeanceId` (`echeanceId`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=9 ;

--
-- Contenu de la table `ins_bordereaux`
--

INSERT INTO `ins_bordereaux` (`id`, `type`, `fichier`, `montant`, `referenceBancaire`, `statut`, `dateSoumission`, `dateValidation`, `valideParId`, `commentaire`, `quitusId`, `createdAt`, `updatedAt`, `deletedAt`, `echeanceId`, `utilisateurId`) VALUES
(1, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 11),
(2, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 12),
(3, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 13),
(4, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 14),
(5, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 15),
(6, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 16),
(7, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 17),
(8, 'inscription', 'bordereau.pdf', 207500, NULL, 'valide', '2026-07-02', '2026-07-02', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 18);

-- --------------------------------------------------------

--
-- Structure de la table `ins_bulletins`
--

CREATE TABLE IF NOT EXISTS `ins_bulletins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `anneeAcademiqueId` int(10) unsigned NOT NULL,
  `semestre` enum('semestre1','semestre2') NOT NULL,
  `cursusApprenantId` int(10) unsigned NOT NULL,
  `utilisateurId` int(10) unsigned NOT NULL,
  `classeId` int(10) unsigned NOT NULL,
  `parcoursId` int(10) unsigned NOT NULL,
  `niveauEtudeId` int(10) unsigned NOT NULL,
  `moyenneGenerale` float DEFAULT NULL,
  `totalCredits` int(10) unsigned DEFAULT NULL,
  `creditsValides` int(10) unsigned DEFAULT NULL,
  `rang` int(10) unsigned DEFAULT NULL,
  `effectifClasse` int(10) unsigned DEFAULT NULL,
  `mention` varchar(50) DEFAULT NULL,
  `appreciation` text,
  `statut` enum('brouillon','publie') NOT NULL DEFAULT 'brouillon',
  `dateGeneration` datetime DEFAULT NULL,
  `datePublication` datetime DEFAULT NULL,
  `signatureEnseignant` text,
  `signatureChef` text,
  `dateSignatureEnseignant` datetime DEFAULT NULL,
  `dateSignatureChef` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `anneeAcademiqueId` (`anneeAcademiqueId`),
  KEY `cursusApprenantId` (`cursusApprenantId`),
  KEY `utilisateurId` (`utilisateurId`),
  KEY `classeId` (`classeId`),
  KEY `parcoursId` (`parcoursId`),
  KEY `niveauEtudeId` (`niveauEtudeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_bulletins`
--

INSERT INTO `ins_bulletins` (`id`, `anneeAcademiqueId`, `semestre`, `cursusApprenantId`, `utilisateurId`, `classeId`, `parcoursId`, `niveauEtudeId`, `moyenneGenerale`, `totalCredits`, `creditsValides`, `rang`, `effectifClasse`, `mention`, `appreciation`, `statut`, `dateGeneration`, `datePublication`, `signatureEnseignant`, `signatureChef`, `dateSignatureEnseignant`, `dateSignatureChef`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'semestre1', 1, 11, 1, 1, 1, 14.97, 18, 14, 3, 15, 'Bien', 'Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 1, 'semestre1', 2, 12, 1, 1, 1, 14.49, 18, 14, 4, 15, 'Bien', 'Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, 1, 'semestre1', 3, 13, 1, 2, 1, 14.27, 8, 6, 7, 15, 'Bien', 'Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(4, 1, 'semestre1', 4, 14, 1, 2, 1, 13.39, 8, 6, 8, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(5, 1, 'semestre1', 5, 15, 1, 3, 1, 13.32, 4, 3, 9, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(6, 1, 'semestre1', 6, 16, 1, 3, 1, 13.06, 4, 3, 11, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(7, 1, 'semestre1', 7, 17, 1, 4, 1, 12.84, 7, 5, 13, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(8, 1, 'semestre1', 8, 18, 1, 4, 1, 13.06, 7, 5, 12, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(9, 1, 'semestre1', 9, 19, 1, 1, 1, 14.43, 18, 14, 5, 15, 'Bien', 'Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(10, 1, 'semestre1', 10, 20, 1, 2, 1, 15.15, 8, 6, 2, 15, 'Bien', 'Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(11, 1, 'semestre1', 11, 21, 1, 3, 1, 16.55, 4, 3, 1, 15, 'Très Bien', 'Très Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(12, 1, 'semestre1', 12, 22, 1, 4, 1, 13.15, 7, 5, 10, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(13, 1, 'semestre1', 13, 23, 1, 1, 1, 12.6, 18, 14, 15, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(14, 1, 'semestre1', 14, 24, 1, 2, 1, 12.71, 8, 6, 14, 15, 'Assez Bien', 'Assez Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(15, 1, 'semestre1', 15, 25, 1, 3, 1, 14.35, 4, 3, 6, 15, 'Bien', 'Bien', 'publie', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, NULL, NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_cahiers_de_texte`
--

CREATE TABLE IF NOT EXISTS `ins_cahiers_de_texte` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_chapitres_cours`
--

CREATE TABLE IF NOT EXISTS `ins_chapitres_cours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `image` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_chapitres_cours`
--

INSERT INTO `ins_chapitres_cours` (`id`, `titre`, `description`, `image`, `createdAt`, `updatedAt`, `deletedAt`, `coursId`) VALUES
(1, 'Introduction à Python', 'Variables et types', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(2, 'SQL Fondamentaux', 'Requêtes SELECT', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 7),
(3, 'Introduction à la Comptabilité', 'Bilan et compte de résultat', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `ins_classes`
--

CREATE TABLE IF NOT EXISTS `ins_classes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`),
  KEY `niveauEtudeId` (`niveauEtudeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_classes`
--

INSERT INTO `ins_classes` (`id`, `libelle`, `description`, `createdAt`, `updatedAt`, `deletedAt`, `niveauEtudeId`) VALUES
(1, 'LIC1-A', 'Licence 1 Groupe A', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(2, 'LIC1-B', 'Licence 1 Groupe B', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(3, 'LIC2-A', 'Licence 2 Groupe A', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2);

-- --------------------------------------------------------

--
-- Structure de la table `ins_cours`
--

CREATE TABLE IF NOT EXISTS `ins_cours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `parcoursId` int(10) unsigned NOT NULL,
  `intitule` varchar(255) NOT NULL,
  `credit` int(10) unsigned DEFAULT NULL,
  `estObligatoire` tinyint(1) NOT NULL DEFAULT '0',
  `description` varchar(255) DEFAULT NULL,
  `semestre` enum('semestre1','semestre2','semestre3','semestre4','semestre5','semestre6') DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `classeId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code-parcours` (`code`,`parcoursId`),
  KEY `parcoursId` (`parcoursId`),
  KEY `classeId` (`classeId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=9 ;

--
-- Contenu de la table `ins_cours`
--

INSERT INTO `ins_cours` (`id`, `code`, `parcoursId`, `intitule`, `credit`, `estObligatoire`, `description`, `semestre`, `createdAt`, `updatedAt`, `deletedAt`, `classeId`, `enseignantId`) VALUES
(1, 'INF101', 1, 'Algorithmique et Programmation', 6, 1, 'Initiation à la programmation en Python', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 2),
(2, 'MATH101', 1, 'Mathématiques pour l''Informatique', 4, 1, 'Logique mathématique et algèbre', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 1),
(3, 'GEST101', 2, 'Comptabilité Générale', 5, 1, 'Principes comptables OHADA', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 3),
(4, 'DROIT101', 3, 'Introduction au Droit', 4, 1, 'Fondamentaux du droit', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 4),
(5, 'MKT101', 4, 'Marketing Fondamental', 4, 1, 'Concepts marketing', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 3),
(6, 'ANG101', 1, 'Anglais des Affaires', 3, 0, 'Business English', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 1),
(7, 'INF102', 1, 'Bases de Données', 5, 1, 'SQL et conception de bases de données', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 2),
(8, 'ECO101', 2, 'Économie Générale', 3, 0, 'Microéconomie et macroéconomie', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 3);

-- --------------------------------------------------------

--
-- Structure de la table `ins_cours_choisis`
--

CREATE TABLE IF NOT EXISTS `ins_cours_choisis` (
  `demandeInscriptionId` int(10) unsigned NOT NULL,
  `coursId` int(10) unsigned NOT NULL,
  `etat` enum('en_cours','valide','rejete') DEFAULT 'en_cours',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`demandeInscriptionId`,`coursId`),
  UNIQUE KEY `ins_cours_choisis_demandeInscriptionId_coursId_unique` (`demandeInscriptionId`,`coursId`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Contenu de la table `ins_cours_choisis`
--

INSERT INTO `ins_cours_choisis` (`demandeInscriptionId`, `coursId`, `etat`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(1, 2, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(1, 6, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(1, 7, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 1, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 2, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 6, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 7, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 3, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 3, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 4, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 4, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 5, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 5, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 1, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 2, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 6, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 7, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 3, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 4, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 5, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 1, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 2, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 6, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 7, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 3, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 8, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(15, 4, 'valide', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_cours_participants`
--

CREATE TABLE IF NOT EXISTS `ins_cours_participants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `utilisateurId` int(10) unsigned NOT NULL,
  `coursId` int(10) unsigned NOT NULL,
  `cursusApprenantId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `utilisateur-cours` (`utilisateurId`,`coursId`),
  KEY `coursId` (`coursId`),
  KEY `cursusApprenantId` (`cursusApprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=35 ;

--
-- Contenu de la table `ins_cours_participants`
--

INSERT INTO `ins_cours_participants` (`id`, `utilisateurId`, `coursId`, `cursusApprenantId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 11, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 11, 2, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 11, 6, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 11, 7, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 12, 1, 2, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 12, 2, 2, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 12, 6, 2, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 12, 7, 2, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 13, 3, 3, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 13, 8, 3, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 14, 3, 4, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 14, 8, 4, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 15, 4, 5, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 16, 4, 6, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(15, 17, 5, 7, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(16, 17, 8, 7, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(17, 18, 5, 8, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(18, 18, 8, 8, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(19, 19, 1, 9, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(20, 19, 2, 9, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(21, 19, 6, 9, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(22, 19, 7, 9, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(23, 20, 3, 10, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(24, 20, 8, 10, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(25, 21, 4, 11, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(26, 22, 5, 12, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(27, 22, 8, 12, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(28, 23, 1, 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(29, 23, 2, 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(30, 23, 6, 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(31, 23, 7, 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(32, 24, 3, 14, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(33, 24, 8, 14, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(34, 25, 4, 15, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_cursus_apprenants`
--

CREATE TABLE IF NOT EXISTS `ins_cursus_apprenants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `externe` tinyint(1) NOT NULL DEFAULT '0',
  `etablissement` varchar(255) DEFAULT NULL,
  `intituleParcours` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  `classeId` int(10) unsigned DEFAULT NULL,
  `anneeAcademiqueId` int(10) unsigned DEFAULT NULL,
  `demandeInscriptionId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`),
  KEY `parcoursId` (`parcoursId`),
  KEY `niveauEtudeId` (`niveauEtudeId`),
  KEY `classeId` (`classeId`),
  KEY `anneeAcademiqueId` (`anneeAcademiqueId`),
  KEY `demandeInscriptionId` (`demandeInscriptionId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_cursus_apprenants`
--

INSERT INTO `ins_cursus_apprenants` (`id`, `externe`, `etablissement`, `intituleParcours`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`, `parcoursId`, `niveauEtudeId`, `classeId`, `anneeAcademiqueId`, `demandeInscriptionId`) VALUES
(1, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 11, 1, 1, 1, 1, 1),
(2, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 12, 1, 1, 1, 1, 2),
(3, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 13, 2, 1, 1, 1, 3),
(4, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 14, 2, 1, 1, 1, 4),
(5, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 15, 3, 1, 1, 1, 5),
(6, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 16, 3, 1, 1, 1, 6),
(7, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 17, 4, 1, 1, 1, 7),
(8, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 18, 4, 1, 1, 1, 8),
(9, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 19, 1, 1, 1, 1, 9),
(10, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 20, 2, 1, 1, 1, 10),
(11, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 21, 3, 1, 1, 1, 11),
(12, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 22, 4, 1, 1, 1, 12),
(13, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 23, 1, 1, 1, 1, 13),
(14, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 24, 2, 1, 1, 1, 14),
(15, 0, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 25, 3, 1, 1, 1, 15);

-- --------------------------------------------------------

--
-- Structure de la table `ins_deliberations`
--

CREATE TABLE IF NOT EXISTS `ins_deliberations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `classeId` int(10) unsigned NOT NULL,
  `anneeAcademiqueId` int(10) unsigned NOT NULL,
  `periode` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `statut` enum('planifiee','en_cours','cloturee') NOT NULL DEFAULT 'planifiee',
  `effectif` int(10) unsigned DEFAULT '0',
  `admis` int(10) unsigned DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classeId` (`classeId`),
  KEY `anneeAcademiqueId` (`anneeAcademiqueId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ins_deliberations`
--

INSERT INTO `ins_deliberations` (`id`, `libelle`, `classeId`, `anneeAcademiqueId`, `periode`, `date`, `statut`, `effectif`, `admis`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Semestre 1 - 2024-2025', 1, 1, 'Semestre 1', '2025-07-15 00:00:00', 'cloturee', 15, 15, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_demandes_inscription`
--

CREATE TABLE IF NOT EXISTS `ins_demandes_inscription` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `matricule` varchar(255) NOT NULL,
  `dateDemande` datetime NOT NULL DEFAULT '2026-07-06 14:44:14',
  `dateValidation` datetime DEFAULT NULL,
  `sessionId` int(10) unsigned NOT NULL,
  `utilisateurId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  UNIQUE KEY `session-utilisateur` (`sessionId`,`utilisateurId`),
  UNIQUE KEY `matricule_2` (`matricule`),
  UNIQUE KEY `matricule_3` (`matricule`),
  UNIQUE KEY `matricule_4` (`matricule`),
  UNIQUE KEY `matricule_5` (`matricule`),
  UNIQUE KEY `matricule_6` (`matricule`),
  UNIQUE KEY `matricule_7` (`matricule`),
  UNIQUE KEY `matricule_8` (`matricule`),
  UNIQUE KEY `matricule_9` (`matricule`),
  UNIQUE KEY `matricule_10` (`matricule`),
  UNIQUE KEY `matricule_11` (`matricule`),
  UNIQUE KEY `matricule_12` (`matricule`),
  UNIQUE KEY `matricule_13` (`matricule`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_demandes_inscription`
--

INSERT INTO `ins_demandes_inscription` (`id`, `matricule`, `dateDemande`, `dateValidation`, `sessionId`, `utilisateurId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'UST2024001', '2026-07-02 18:09:17', NULL, 1, 11, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'UST2024002', '2026-07-02 18:09:17', NULL, 1, 12, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'UST2024003', '2026-07-02 18:09:17', NULL, 1, 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'UST2024004', '2026-07-02 18:09:17', NULL, 1, 14, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 'UST2024005', '2026-07-02 18:09:17', NULL, 1, 15, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 'UST2024006', '2026-07-02 18:09:17', NULL, 1, 16, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 'UST2024007', '2026-07-02 18:09:17', NULL, 1, 17, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 'UST2024008', '2026-07-02 18:09:17', NULL, 1, 18, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 'UST2024009', '2026-07-02 18:09:17', NULL, 1, 19, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 'UST2024010', '2026-07-02 18:09:17', NULL, 1, 20, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 'UST2024011', '2026-07-02 18:09:17', NULL, 1, 21, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 'UST2024012', '2026-07-02 18:09:17', NULL, 1, 22, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 'UST2024013', '2026-07-02 18:09:17', NULL, 1, 23, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 'UST2024014', '2026-07-02 18:09:17', NULL, 1, 24, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(15, 'UST2024015', '2026-07-02 18:09:17', NULL, 1, 25, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_dispenses`
--

CREATE TABLE IF NOT EXISTS `ins_dispenses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cursusApprenantId` int(10) unsigned NOT NULL,
  `ueId` int(10) unsigned DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `motif` text NOT NULL,
  `validePar` int(10) unsigned NOT NULL,
  `dateValidation` datetime DEFAULT NULL,
  `statut` enum('demande','validee','refusee') NOT NULL DEFAULT 'demande',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cursusApprenantId` (`cursusApprenantId`),
  KEY `ueId` (`ueId`),
  KEY `validePar` (`validePar`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ins_dispenses`
--

INSERT INTO `ins_dispenses` (`id`, `cursusApprenantId`, `ueId`, `coursId`, `motif`, `validePar`, `dateValidation`, `statut`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 1, NULL, 'Étudiant déjà certifié dans cette UE (diplôme obtenu)', 1, '2026-07-02 18:09:19', 'validee', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 2, 1, NULL, 'Étudiant déjà certifié dans cette UE (diplôme obtenu)', 1, '2026-07-02 18:09:19', 'validee', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_dossiers_demandes`
--

CREATE TABLE IF NOT EXISTS `ins_dossiers_demandes` (
  `nomFichier` varchar(255) NOT NULL,
  `demandeId` int(10) unsigned NOT NULL,
  `dossierId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`demandeId`,`dossierId`),
  UNIQUE KEY `ins_dossiers_demandes_demandeId_dossierId_unique` (`demandeId`,`dossierId`),
  KEY `dossierId` (`dossierId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Structure de la table `ins_dossiers_etudiants`
--

CREATE TABLE IF NOT EXISTS `ins_dossiers_etudiants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `matricule` varchar(255) NOT NULL,
  `codeQR` text,
  `photo` varchar(255) DEFAULT NULL,
  `statut` enum('actif','suspendu','archive') NOT NULL DEFAULT 'actif',
  `dateCreation` date NOT NULL,
  `fraisScolarite` float unsigned NOT NULL,
  `modePaiement` enum('unique','mensuel') NOT NULL,
  `nbMensualites` int(11) NOT NULL,
  `demarrageParcours` date NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  UNIQUE KEY `matricule_2` (`matricule`),
  UNIQUE KEY `matricule_3` (`matricule`),
  UNIQUE KEY `matricule_4` (`matricule`),
  UNIQUE KEY `matricule_5` (`matricule`),
  UNIQUE KEY `matricule_6` (`matricule`),
  UNIQUE KEY `matricule_7` (`matricule`),
  UNIQUE KEY `matricule_8` (`matricule`),
  UNIQUE KEY `matricule_9` (`matricule`),
  UNIQUE KEY `matricule_10` (`matricule`),
  UNIQUE KEY `matricule_11` (`matricule`),
  UNIQUE KEY `matricule_12` (`matricule`),
  UNIQUE KEY `matricule_13` (`matricule`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_dossiers_etudiants`
--

INSERT INTO `ins_dossiers_etudiants` (`id`, `matricule`, `codeQR`, `photo`, `statut`, `dateCreation`, `fraisScolarite`, `modePaiement`, `nbMensualites`, `demarrageParcours`, `createdAt`, `updatedAt`, `deletedAt`, `utilisateurId`) VALUES
(1, 'UST2024001', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 11),
(2, 'UST2024002', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 12),
(3, 'UST2024003', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 13),
(4, 'UST2024004', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 14),
(5, 'UST2024005', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 15),
(6, 'UST2024006', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 16),
(7, 'UST2024007', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 17),
(8, 'UST2024008', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 18),
(9, 'UST2024009', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 19),
(10, 'UST2024010', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 20),
(11, 'UST2024011', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 21),
(12, 'UST2024012', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 22),
(13, 'UST2024013', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 23),
(14, 'UST2024014', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 24),
(15, 'UST2024015', NULL, NULL, 'actif', '2026-07-02', 2075000, 'mensuel', 10, '2024-10-01', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 25);

-- --------------------------------------------------------

--
-- Structure de la table `ins_dossiers_inscription`
--

CREATE TABLE IF NOT EXISTS `ins_dossiers_inscription` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `tailleMax` float unsigned DEFAULT NULL,
  `sessionId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `titre-session` (`titre`,`sessionId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_echeances`
--

CREATE TABLE IF NOT EXISTS `ins_echeances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dossierEtudiantId` int(10) unsigned DEFAULT NULL,
  `type` enum('inscription','scolarite') NOT NULL,
  `numeroEcheance` int(11) NOT NULL,
  `montant` float unsigned NOT NULL,
  `devise` varchar(255) NOT NULL DEFAULT 'XAF',
  `dateLimite` date NOT NULL,
  `datePaiement` date DEFAULT NULL,
  `statut` enum('impaye','paye','en_retard') NOT NULL DEFAULT 'impaye',
  `moisConcerne` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dossierEtudiantId` (`dossierEtudiantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_echeances`
--

INSERT INTO `ins_echeances` (`id`, `dossierEtudiantId`, `type`, `numeroEcheance`, `montant`, `devise`, `dateLimite`, `datePaiement`, `statut`, `moisConcerne`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'scolarite', 1, 207500, 'XAF', '2024-11-05', NULL, 'paye', 'Octobre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 1, 'scolarite', 2, 207500, 'XAF', '2024-12-05', NULL, 'paye', 'Novembre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 1, 'scolarite', 3, 207500, 'XAF', '2025-01-05', NULL, 'paye', 'Décembre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 1, 'scolarite', 4, 207500, 'XAF', '2025-02-05', NULL, 'impaye', 'Janvier', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 1, 'scolarite', 5, 207500, 'XAF', '2025-03-05', NULL, 'impaye', 'Février', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 2, 'scolarite', 1, 207500, 'XAF', '2024-11-05', NULL, 'paye', 'Octobre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 2, 'scolarite', 2, 207500, 'XAF', '2024-12-05', NULL, 'paye', 'Novembre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 2, 'scolarite', 3, 207500, 'XAF', '2025-01-05', NULL, 'paye', 'Décembre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 2, 'scolarite', 4, 207500, 'XAF', '2025-02-05', NULL, 'impaye', 'Janvier', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 2, 'scolarite', 5, 207500, 'XAF', '2025-03-05', NULL, 'impaye', 'Février', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 3, 'scolarite', 1, 207500, 'XAF', '2024-11-05', NULL, 'paye', 'Octobre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 3, 'scolarite', 2, 207500, 'XAF', '2024-12-05', NULL, 'paye', 'Novembre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 3, 'scolarite', 3, 207500, 'XAF', '2025-01-05', NULL, 'paye', 'Décembre', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 3, 'scolarite', 4, 207500, 'XAF', '2025-02-05', NULL, 'impaye', 'Janvier', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(15, 3, 'scolarite', 5, 207500, 'XAF', '2025-03-05', NULL, 'impaye', 'Février', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_echelles_notes`
--

CREATE TABLE IF NOT EXISTS `ins_echelles_notes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(100) NOT NULL,
  `noteMin` float NOT NULL,
  `noteMax` float NOT NULL,
  `mention` varchar(100) NOT NULL,
  `estActive` tinyint(1) NOT NULL DEFAULT '1',
  `ordre` int(10) unsigned NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=9 ;

--
-- Contenu de la table `ins_echelles_notes`
--

INSERT INTO `ins_echelles_notes` (`id`, `libelle`, `noteMin`, `noteMax`, `mention`, `estActive`, `ordre`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Excellent', 18, 20, 'Très Bien', 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Très Bien', 16, 17.99, 'Très Bien', 1, 2, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Bien', 14, 15.99, 'Bien', 1, 3, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'Assez Bien', 12, 13.99, 'Assez Bien', 1, 4, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 'Passable', 10, 11.99, 'Passable', 1, 5, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 'Insuffisant', 8, 9.99, 'Insuffisant', 1, 6, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 'Faible', 6, 7.99, 'Faible', 1, 7, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 'Très Faible', 0, 5.99, 'Très Faible', 1, 8, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_equivalences`
--

CREATE TABLE IF NOT EXISTS `ins_equivalences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cursusApprenantId` int(10) unsigned NOT NULL,
  `coursSource` varchar(255) NOT NULL,
  `coursDestinationId` int(10) unsigned NOT NULL,
  `creditEcts` int(10) unsigned DEFAULT '0',
  `institutionOrigine` varchar(255) NOT NULL,
  `validePar` int(10) unsigned DEFAULT NULL,
  `dateValidation` datetime DEFAULT NULL,
  `documentJustificatif` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cursusApprenantId` (`cursusApprenantId`),
  KEY `coursDestinationId` (`coursDestinationId`),
  KEY `validePar` (`validePar`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ins_equivalences`
--

INSERT INTO `ins_equivalences` (`id`, `cursusApprenantId`, `coursSource`, `coursDestinationId`, `creditEcts`, `institutionOrigine`, `validePar`, `dateValidation`, `documentJustificatif`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'MATH101 - Université Félix Houphouët-Boigny', 2, 4, 'Université Félix Houphouët-Boigny', 1, '2026-07-02 18:09:19', 'releve_ufhb.pdf', '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(2, 2, 'MATH101 - Université Félix Houphouët-Boigny', 2, 4, 'Université Félix Houphouët-Boigny', 1, '2026-07-02 18:09:19', 'releve_ufhb.pdf', '2026-07-02 18:09:19', '2026-07-02 18:09:19');

-- --------------------------------------------------------

--
-- Structure de la table `ins_fichiers_ressources`
--

CREATE TABLE IF NOT EXISTS `ins_fichiers_ressources` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `fichier` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `ressourceId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ressourceId` (`ressourceId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_fichiers_ressources`
--

INSERT INTO `ins_fichiers_ressources` (`id`, `titre`, `description`, `fichier`, `createdAt`, `updatedAt`, `deletedAt`, `ressourceId`) VALUES
(1, 'Python - Chapitre 1 PDF', NULL, 'chapitre1.pdf', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(2, 'SQL Cours complet PDF', NULL, 'basesdedonnees.pdf', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2),
(3, 'Comptabilité - Chapitre 1 PDF', NULL, 'comptabilite.pdf', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `ins_frais_inscription`
--

CREATE TABLE IF NOT EXISTS `ins_frais_inscription` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `montant` float unsigned NOT NULL,
  `fraisDesCours` tinyint(1) NOT NULL DEFAULT '1',
  `sessionId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `titre-session` (`titre`,`sessionId`),
  KEY `sessionId` (`sessionId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `ins_frais_inscription`
--

INSERT INTO `ins_frais_inscription` (`id`, `titre`, `description`, `montant`, `fraisDesCours`, `sessionId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Frais d''inscription', NULL, 500000, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Frais de scolarité', NULL, 1500000, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Frais de bibliothèque', NULL, 50000, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'Assurance étudiante', NULL, 25000, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_jury_membres`
--

CREATE TABLE IF NOT EXISTS `ins_jury_membres` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `deliberationId` int(10) unsigned NOT NULL,
  `utilisateurId` int(10) unsigned NOT NULL,
  `role` enum('president','secretaire','membre','invite') NOT NULL DEFAULT 'membre',
  `estPresent` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ins_jury_membres_deliberation_id_utilisateur_id` (`deliberationId`,`utilisateurId`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_jury_membres`
--

INSERT INTO `ins_jury_membres` (`id`, `deliberationId`, `utilisateurId`, `role`, `estPresent`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 'president', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(2, 1, 3, 'membre', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19'),
(3, 1, 4, 'secretaire', 1, '2026-07-02 18:09:19', '2026-07-02 18:09:19');

-- --------------------------------------------------------

--
-- Structure de la table `ins_lignes_bulletins`
--

CREATE TABLE IF NOT EXISTS `ins_lignes_bulletins` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `bulletinId` int(10) unsigned NOT NULL,
  `coursId` int(10) unsigned NOT NULL,
  `moyenneCC` float DEFAULT NULL,
  `noteDevoir` float DEFAULT NULL,
  `noteExamen` float DEFAULT NULL,
  `moyenne` float DEFAULT NULL,
  `coefficient` int(10) unsigned DEFAULT NULL,
  `rang` int(10) unsigned DEFAULT NULL,
  `appreciation` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bulletinId` (`bulletinId`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=35 ;

--
-- Contenu de la table `ins_lignes_bulletins`
--

INSERT INTO `ins_lignes_bulletins` (`id`, `bulletinId`, `coursId`, `moyenneCC`, `noteDevoir`, `noteExamen`, `moyenne`, `coefficient`, `rang`, `appreciation`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 18.74, 15.65, 18.43, 17.72, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(2, 1, 2, 17.66, 11.83, 9.68, 13.52, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(3, 1, 6, 15.42, 12.35, 15.34, 14.47, 1, 3, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(4, 1, 7, 17.93, 14.25, 9.12, 14.18, 1, 4, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(5, 2, 1, 17.27, 8.56, 9.83, 12.43, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(6, 2, 2, 15.69, 14, 17.43, 15.7, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(7, 2, 6, 15.91, 16.37, 13.73, 15.39, 1, 3, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(8, 2, 7, 13.08, 16.91, 13.8, 14.45, 1, 4, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(9, 3, 3, 17.95, 17.99, 10.01, 15.58, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(10, 3, 8, 15.8, 12.97, 9.17, 12.96, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(11, 4, 3, 15.14, 12.39, 8.34, 12.28, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(12, 4, 8, 13.29, 14.1, 16.51, 14.5, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(13, 5, 4, 17.58, 12.87, 8.08, 13.32, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(14, 6, 4, 13.11, 10.04, 16.01, 13.06, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(15, 7, 5, 16.04, 17.9, 13.92, 15.96, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(16, 7, 8, 9.95, 9.43, 9.7, 9.72, 1, 2, 'Non acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(17, 8, 5, 9.28, 13.45, 8.33, 10.25, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(18, 8, 8, 17.9, 18.65, 10.43, 15.88, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(19, 9, 1, 12.6, 18.6, 17.68, 15.92, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(20, 9, 2, 8.71, 18.41, 15.3, 13.6, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(21, 9, 6, 10.37, 18.16, 17.85, 14.95, 1, 3, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(22, 9, 7, 16.41, 12.42, 9.81, 13.23, 1, 4, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(23, 10, 3, 16.73, 13.55, 12.71, 14.57, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(24, 10, 8, 18.52, 12.48, 15.26, 15.73, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(25, 11, 4, 17.65, 16.94, 14.69, 16.55, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(26, 12, 5, 11.68, 16.63, 14.21, 13.92, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(27, 12, 8, 8.02, 15.45, 15.11, 12.38, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(28, 13, 1, 13.74, 12.1, 18.28, 14.61, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(29, 13, 2, 9.53, 8.4, 15.55, 11, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(30, 13, 6, 9.99, 15.37, 9.12, 11.34, 1, 3, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(31, 13, 7, 9.14, 18.99, 13.59, 13.43, 1, 4, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(32, 14, 3, 13.64, 16.45, 9.55, 13.26, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(33, 14, 8, 10.55, 8.06, 18.42, 12.16, 1, 2, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(34, 15, 4, 13.69, 12.5, 17.08, 14.35, 1, 1, 'Acquis', '2026-07-02 18:09:18', '2026-07-02 18:09:18');

-- --------------------------------------------------------

--
-- Structure de la table `ins_listes_notes_evaluation`
--

CREATE TABLE IF NOT EXISTS `ins_listes_notes_evaluation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `poidsTypeNoteEvaluation` float NOT NULL,
  `date` date DEFAULT NULL,
  `heureDebut` time NOT NULL,
  `heureFin` time NOT NULL,
  `commentaire` varchar(255) DEFAULT NULL,
  `anneeAcademiqueId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `typeNoteEvaluationId` int(10) unsigned DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `anneeAcademiqueId` (`anneeAcademiqueId`),
  KEY `typeNoteEvaluationId` (`typeNoteEvaluationId`),
  KEY `coursId` (`coursId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=25 ;

--
-- Contenu de la table `ins_listes_notes_evaluation`
--

INSERT INTO `ins_listes_notes_evaluation` (`id`, `poidsTypeNoteEvaluation`, `date`, `heureDebut`, `heureFin`, `commentaire`, `anneeAcademiqueId`, `createdAt`, `updatedAt`, `deletedAt`, `typeNoteEvaluationId`, `coursId`, `enseignantId`) VALUES
(1, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC INF101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 1, 2),
(2, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir INF101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 1, 2),
(3, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen INF101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 1, 2),
(4, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC MATH101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 2, 1),
(5, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir MATH101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 2, 1),
(6, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen MATH101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 2, 1),
(7, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC GEST101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 3, 3),
(8, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir GEST101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 3, 3),
(9, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen GEST101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 3, 3),
(10, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC DROIT101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 4, 4),
(11, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir DROIT101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 4, 4),
(12, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen DROIT101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 4, 4),
(13, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC MKT101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 5, 3),
(14, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir MKT101', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 5, 3),
(15, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen MKT101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 5, 3),
(16, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC ANG101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 6, 1),
(17, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir ANG101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 6, 1),
(18, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen ANG101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 6, 1),
(19, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC INF102', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 7, 2),
(20, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir INF102', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 7, 2),
(21, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen INF102', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 7, 2),
(22, 40, '2025-02-15', '08:00:00', '10:00:00', 'CC ECO101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 8, 3),
(23, 30, '2025-04-10', '08:00:00', '10:00:00', 'Devoir ECO101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 8, 3),
(24, 30, '2025-06-20', '14:00:00', '17:00:00', 'Examen ECO101', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 8, 3);

-- --------------------------------------------------------

--
-- Structure de la table `ins_listes_presences`
--

CREATE TABLE IF NOT EXISTS `ins_listes_presences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coursId` (`coursId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_matieres_prerequis`
--

CREATE TABLE IF NOT EXISTS `ins_matieres_prerequis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_mcc`
--

CREATE TABLE IF NOT EXISTS `ins_mcc` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ueId` int(10) unsigned NOT NULL,
  `coursId` int(10) unsigned NOT NULL,
  `coefficient` int(10) unsigned NOT NULL DEFAULT '1',
  `session` enum('session1','session2') NOT NULL DEFAULT 'session1',
  `estEliminatoire` tinyint(1) NOT NULL DEFAULT '0',
  `seuilEliminatoire` float DEFAULT NULL,
  `estObligatoire` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ins_mcc_ue_id_cours_id_session` (`ueId`,`coursId`,`session`),
  KEY `coursId` (`coursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=13 ;

--
-- Contenu de la table `ins_mcc`
--

INSERT INTO `ins_mcc` (`id`, `ueId`, `coursId`, `coefficient`, `session`, `estEliminatoire`, `seuilEliminatoire`, `estObligatoire`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 1, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 1, 2, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 2, 1, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 2, 2, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 3, 1, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 3, 2, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 4, 3, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 4, 8, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 5, 3, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 5, 8, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 6, 3, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 6, 8, 1, 'session1', 0, NULL, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_niveaux_etudes`
--

CREATE TABLE IF NOT EXISTS `ins_niveaux_etudes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `ins_niveaux_etudes`
--

INSERT INTO `ins_niveaux_etudes` (`id`, `libelle`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Licence 1', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(2, 'Licence 2', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(3, 'Licence 3', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(4, 'Master 1', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 'Master 2', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_notes_evaluation`
--

CREATE TABLE IF NOT EXISTS `ins_notes_evaluation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `note` float DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `listeNoteEvaluationId` int(10) unsigned DEFAULT NULL,
  `coursParticipantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `listeNoteEvaluationId` (`listeNoteEvaluationId`),
  KEY `coursParticipantId` (`coursParticipantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=103 ;

--
-- Contenu de la table `ins_notes_evaluation`
--

INSERT INTO `ins_notes_evaluation` (`id`, `note`, `createdAt`, `updatedAt`, `deletedAt`, `listeNoteEvaluationId`, `coursParticipantId`) VALUES
(1, 18.74, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 1),
(2, 15.65, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 1),
(3, 18.43, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 1),
(4, 17.66, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 2),
(5, 11.83, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 2),
(6, 9.68, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 6, 2),
(7, 15.42, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 16, 3),
(8, 12.35, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 17, 3),
(9, 15.34, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 18, 3),
(10, 17.93, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 19, 4),
(11, 14.25, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 20, 4),
(12, 9.12, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 21, 4),
(13, 17.27, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 5),
(14, 8.56, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 5),
(15, 9.83, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 5),
(16, 15.69, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 6),
(17, 14, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 6),
(18, 17.43, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 6, 6),
(19, 15.91, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 16, 7),
(20, 16.37, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 17, 7),
(21, 13.73, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 18, 7),
(22, 13.08, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 19, 8),
(23, 16.91, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 20, 8),
(24, 13.8, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 21, 8),
(25, 17.95, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 7, 9),
(26, 17.99, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 8, 9),
(27, 10.01, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 9, 9),
(28, 15.8, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 10),
(29, 12.97, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 10),
(30, 9.17, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 10),
(31, 15.14, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 7, 11),
(32, 12.39, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 8, 11),
(33, 8.34, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 9, 11),
(34, 13.29, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 12),
(35, 14.1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 12),
(36, 16.51, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 12),
(37, 17.58, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 10, 13),
(38, 12.87, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 11, 13),
(39, 8.08, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 12, 13),
(40, 13.11, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 10, 14),
(41, 10.04, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 11, 14),
(42, 16.01, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 12, 14),
(43, 16.04, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 13, 15),
(44, 17.9, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 14, 15),
(45, 13.92, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 15, 15),
(46, 9.95, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 16),
(47, 9.43, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 16),
(48, 9.7, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 16),
(49, 9.28, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 13, 17),
(50, 13.45, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 14, 17),
(51, 8.33, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 15, 17),
(52, 17.9, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 18),
(53, 18.65, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 18),
(54, 10.43, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 18),
(55, 12.6, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 19),
(56, 18.6, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 19),
(57, 17.68, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 19),
(58, 8.71, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 20),
(59, 18.41, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 20),
(60, 15.3, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 6, 20),
(61, 10.37, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 16, 21),
(62, 18.16, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 17, 21),
(63, 17.85, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 18, 21),
(64, 16.41, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 19, 22),
(65, 12.42, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 20, 22),
(66, 9.81, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 21, 22),
(67, 16.73, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 7, 23),
(68, 13.55, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 8, 23),
(69, 12.71, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 9, 23),
(70, 18.52, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 24),
(71, 12.48, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 24),
(72, 15.26, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 24),
(73, 17.65, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 10, 25),
(74, 16.94, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 11, 25),
(75, 14.69, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 12, 25),
(76, 11.68, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 13, 26),
(77, 16.63, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 14, 26),
(78, 14.21, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 15, 26),
(79, 8.02, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 27),
(80, 15.45, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 27),
(81, 15.11, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 27),
(82, 13.74, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 28),
(83, 12.1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 28),
(84, 18.28, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 28),
(85, 9.53, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 29),
(86, 8.4, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 29),
(87, 15.55, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 6, 29),
(88, 9.99, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 16, 30),
(89, 15.37, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 17, 30),
(90, 9.12, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 18, 30),
(91, 9.14, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 19, 31),
(92, 18.99, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 20, 31),
(93, 13.59, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 21, 31),
(94, 13.64, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 7, 32),
(95, 16.45, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 8, 32),
(96, 9.55, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 9, 32),
(97, 10.55, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 22, 33),
(98, 8.06, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 23, 33),
(99, 18.42, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 24, 33),
(100, 13.69, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 10, 34),
(101, 12.5, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 11, 34),
(102, 17.08, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 12, 34);

-- --------------------------------------------------------

--
-- Structure de la table `ins_paiements_inscription`
--

CREATE TABLE IF NOT EXISTS `ins_paiements_inscription` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `numero` varchar(255) NOT NULL,
  `datePaiement` datetime NOT NULL DEFAULT '2026-07-06 14:44:14',
  `description` varchar(255) DEFAULT NULL,
  `montant` float unsigned NOT NULL,
  `matriculeInscription` varchar(255) NOT NULL,
  `type` enum('espece','en_ligne') NOT NULL DEFAULT 'espece',
  `utilisateurId` int(10) unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  UNIQUE KEY `numero_2` (`numero`),
  UNIQUE KEY `numero_3` (`numero`),
  UNIQUE KEY `numero_4` (`numero`),
  UNIQUE KEY `numero_5` (`numero`),
  UNIQUE KEY `numero_6` (`numero`),
  UNIQUE KEY `numero_7` (`numero`),
  UNIQUE KEY `numero_8` (`numero`),
  UNIQUE KEY `numero_9` (`numero`),
  UNIQUE KEY `numero_10` (`numero`),
  UNIQUE KEY `numero_11` (`numero`),
  UNIQUE KEY `numero_12` (`numero`),
  UNIQUE KEY `numero_13` (`numero`),
  KEY `matriculeInscription` (`matriculeInscription`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_paiements_inscription`
--

INSERT INTO `ins_paiements_inscription` (`id`, `numero`, `datePaiement`, `description`, `montant`, `matriculeInscription`, `type`, `utilisateurId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'PAY-UST2024001-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024001', '', 11, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'PAY-UST2024002-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024002', '', 12, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'PAY-UST2024003-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024003', '', 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'PAY-UST2024004-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024004', '', 14, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 'PAY-UST2024005-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024005', '', 15, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 'PAY-UST2024006-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024006', '', 16, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 'PAY-UST2024007-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024007', '', 17, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 'PAY-UST2024008-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024008', '', 18, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 'PAY-UST2024009-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024009', '', 19, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 'PAY-UST2024010-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024010', '', 20, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 'PAY-UST2024011-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024011', '', 21, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 'PAY-UST2024012-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024012', '', 22, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 'PAY-UST2024013-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024013', '', 23, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 'PAY-UST2024014-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024014', '', 24, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(15, 'PAY-UST2024015-001', '2026-07-02 18:09:17', NULL, 2075000, 'UST2024015', '', 25, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_parcours`
--

CREATE TABLE IF NOT EXISTS `ins_parcours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` enum('LICENCE','MASTER','DOCTORAT') DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `titre` (`titre`),
  UNIQUE KEY `titre_2` (`titre`),
  UNIQUE KEY `titre_3` (`titre`),
  UNIQUE KEY `titre_4` (`titre`),
  UNIQUE KEY `titre_5` (`titre`),
  UNIQUE KEY `titre_6` (`titre`),
  UNIQUE KEY `titre_7` (`titre`),
  UNIQUE KEY `titre_8` (`titre`),
  UNIQUE KEY `titre_9` (`titre`),
  UNIQUE KEY `titre_10` (`titre`),
  UNIQUE KEY `titre_11` (`titre`),
  UNIQUE KEY `titre_12` (`titre`),
  UNIQUE KEY `titre_13` (`titre`),
  KEY `niveauEtudeId` (`niveauEtudeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `ins_parcours`
--

INSERT INTO `ins_parcours` (`id`, `titre`, `description`, `type`, `niveauEtudeId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Informatique', 'Génie Logiciel et Intelligence Artificielle', 'LICENCE', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Gestion des Entreprises', 'Comptabilité et Finance', 'LICENCE', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Droit des Affaires', 'Droit commercial et fiscal', 'LICENCE', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'Marketing Digital', 'Stratégies marketing et E-commerce', 'LICENCE', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_parcours_choisis`
--

CREATE TABLE IF NOT EXISTS `ins_parcours_choisis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `etatDeValidation` enum('valide','en_cours','rejete') NOT NULL DEFAULT 'en_cours',
  `choixFinal` tinyint(1) NOT NULL DEFAULT '0',
  `messageDeValidation` varchar(255) DEFAULT NULL,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  `demandeInscriptionId` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parcoursId` (`parcoursId`),
  KEY `demandeInscriptionId` (`demandeInscriptionId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_parcours_choisis`
--

INSERT INTO `ins_parcours_choisis` (`id`, `etatDeValidation`, `choixFinal`, `messageDeValidation`, `parcoursId`, `demandeInscriptionId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'valide', 1, NULL, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'valide', 1, NULL, 1, 2, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'valide', 1, NULL, 2, 3, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'valide', 1, NULL, 2, 4, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 'valide', 1, NULL, 3, 5, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 'valide', 1, NULL, 3, 6, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(7, 'valide', 1, NULL, 4, 7, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(8, 'valide', 1, NULL, 4, 8, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(9, 'valide', 1, NULL, 1, 9, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(10, 'valide', 1, NULL, 2, 10, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(11, 'valide', 1, NULL, 3, 11, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(12, 'valide', 1, NULL, 4, 12, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(13, 'valide', 1, NULL, 1, 13, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(14, 'valide', 1, NULL, 2, 14, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(15, 'valide', 1, NULL, 3, 15, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_pointages`
--

CREATE TABLE IF NOT EXISTS `ins_pointages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `heureArrivee` time NOT NULL,
  `heureDepart` time DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_prerequis_parcours`
--

CREATE TABLE IF NOT EXISTS `ins_prerequis_parcours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `noteRequise` float unsigned NOT NULL,
  `typeEvaluation` enum('devoir_sur_table','composition','moyenne','examen') NOT NULL DEFAULT 'moyenne',
  `periodeEvaluation` enum('trimestre_1','trimestre_2','trimestre_3','semestre_1','semestre_2','examen') NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  `matierePrerequisId` int(10) unsigned DEFAULT NULL,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `niveauEtudeId` (`niveauEtudeId`),
  KEY `matierePrerequisId` (`matierePrerequisId`),
  KEY `parcoursId` (`parcoursId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_prerequis_parcours_choisis`
--

CREATE TABLE IF NOT EXISTS `ins_prerequis_parcours_choisis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `note` float unsigned NOT NULL,
  `prerequisParcoursId` int(10) unsigned DEFAULT NULL,
  `parcoursChoisiId` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `prerequisParcoursId` (`prerequisParcoursId`),
  KEY `parcoursChoisiId` (`parcoursChoisiId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_presences`
--

CREATE TABLE IF NOT EXISTS `ins_presences` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `heureDebut` time NOT NULL,
  `heureFin` time NOT NULL,
  `signature` varchar(255) DEFAULT NULL,
  `signedAt` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `listePresenceId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `listePresenceId` (`listePresenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_presences_cours_participants`
--

CREATE TABLE IF NOT EXISTS `ins_presences_cours_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coursParticipantId` int(10) unsigned NOT NULL,
  `presenceId` int(10) unsigned NOT NULL,
  `etatDePresence` enum('non_renseigne','present','absent','absence_justifiee') DEFAULT 'non_renseigne',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `presence-cours-participant` (`coursParticipantId`,`presenceId`),
  KEY `presenceId` (`presenceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_pre_inscriptions`
--

CREATE TABLE IF NOT EXISTS `ins_pre_inscriptions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `statut` enum('en_attente','valide','rejete') NOT NULL DEFAULT 'en_attente',
  `commentaire` text,
  `dateTraitement` datetime DEFAULT NULL,
  `autorisationPDF` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeInscriptionId` int(10) unsigned DEFAULT NULL,
  `traiteParId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeInscriptionId` (`demandeInscriptionId`),
  KEY `traiteParId` (`traiteParId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_pre_inscriptions`
--

INSERT INTO `ins_pre_inscriptions` (`id`, `statut`, `commentaire`, `dateTraitement`, `autorisationPDF`, `createdAt`, `updatedAt`, `deletedAt`, `demandeInscriptionId`, `traiteParId`) VALUES
(1, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 9),
(2, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 9),
(3, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 9),
(4, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 4, 9),
(5, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 5, 9),
(6, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 6, 9),
(7, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 7, 9),
(8, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 8, 9),
(9, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 9, 9),
(10, 'valide', 'Validé par le comité', '2026-07-02 18:09:17', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 10, 9),
(11, 'en_attente', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 11, NULL),
(12, 'en_attente', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 12, NULL),
(13, 'en_attente', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 13, NULL),
(14, 'en_attente', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 14, NULL),
(15, 'en_attente', NULL, NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 15, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_quitus`
--

CREATE TABLE IF NOT EXISTS `ins_quitus` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `paiementInscriptionId` int(10) unsigned DEFAULT NULL,
  `bordereauId` int(10) unsigned DEFAULT NULL,
  `dateEmission` datetime NOT NULL DEFAULT '2026-07-06 14:44:15',
  `fichierPDF` varchar(255) DEFAULT NULL,
  `statut` enum('genere','valide','annule') NOT NULL DEFAULT 'genere',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`),
  UNIQUE KEY `code_13` (`code`),
  KEY `paiementInscriptionId` (`paiementInscriptionId`),
  KEY `bordereauId` (`bordereauId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_regles_evaluation`
--

CREATE TABLE IF NOT EXISTS `ins_regles_evaluation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  `semestre` enum('semestre1','semestre2','semestre3','semestre4','semestre5','semestre6') DEFAULT NULL,
  `type` enum('compensation','seuil_eliminatoire','note_minimale','validation_credit','regle_passage') NOT NULL,
  `valeur` varchar(255) NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parcoursId` (`parcoursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `ins_regles_evaluation`
--

INSERT INTO `ins_regles_evaluation` (`id`, `parcoursId`, `semestre`, `type`, `valeur`, `actif`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, NULL, NULL, 'compensation', 'true', 1, 'Compensation autorisée entre EC d''une même UE', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, NULL, NULL, 'seuil_eliminatoire', '7', 1, 'Note éliminatoire en-dessous de 7/20', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, NULL, NULL, 'note_minimale', '10', 1, 'Note minimale de validation d''une UE', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, NULL, NULL, 'validation_credit', '60', 1, 'Crédits ECTS minimum par année', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, NULL, NULL, 'regle_passage', 'moyenne>=10', 1, 'Moyenne générale ≥ 10 pour passer', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_reponses_inscription`
--

CREATE TABLE IF NOT EXISTS `ins_reponses_inscription` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `message` text,
  `dateReponse` datetime NOT NULL DEFAULT '2026-07-06 14:44:14',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeInscriptionId` int(10) unsigned DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeInscriptionId` (`demandeInscriptionId`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_reponses_inscription`
--

INSERT INTO `ins_reponses_inscription` (`id`, `message`, `dateReponse`, `createdAt`, `updatedAt`, `deletedAt`, `demandeInscriptionId`, `utilisateurId`) VALUES
(1, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 11),
(2, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2, 12),
(3, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 13),
(4, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 4, 14),
(5, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 5, 15),
(6, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 6, 16),
(7, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 7, 17),
(8, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 8, 18),
(9, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 9, 19),
(10, 'Parcours validé', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 10, 20),
(11, 'En attente', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 11, 21),
(12, 'En attente', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 12, 22),
(13, 'En attente', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 13, 23),
(14, 'En attente', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 14, 24),
(15, 'En attente', '2026-07-02 18:09:17', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 15, 25);

-- --------------------------------------------------------

--
-- Structure de la table `ins_ressources`
--

CREATE TABLE IF NOT EXISTS `ins_ressources` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `type` enum('normale','simple_document','travail_a_rendre','test') DEFAULT 'normale',
  `dateDebut` datetime DEFAULT NULL,
  `dateFin` datetime DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `chapitreCoursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chapitreCoursId` (`chapitreCoursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_ressources`
--

INSERT INTO `ins_ressources` (`id`, `titre`, `description`, `type`, `dateDebut`, `dateFin`, `active`, `createdAt`, `updatedAt`, `deletedAt`, `chapitreCoursId`) VALUES
(1, 'Python - Chapitre 1', NULL, 'normale', NULL, NULL, 0, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(2, 'SQL Cours complet', NULL, 'normale', NULL, NULL, 0, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2),
(3, 'Comptabilité - Chapitre 1', NULL, 'normale', NULL, NULL, 0, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `ins_resultats_deliberation`
--

CREATE TABLE IF NOT EXISTS `ins_resultats_deliberation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `deliberationId` int(10) unsigned NOT NULL,
  `cursusApprenantId` int(10) unsigned NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenoms` varchar(100) NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `moyenne` float DEFAULT NULL,
  `mention` varchar(50) DEFAULT NULL,
  `rang` int(10) unsigned DEFAULT NULL,
  `decision` enum('admis','rattrapage','redouble') NOT NULL DEFAULT 'admis',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deliberationId` (`deliberationId`),
  KEY `cursusApprenantId` (`cursusApprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `ins_resultats_deliberation`
--

INSERT INTO `ins_resultats_deliberation` (`id`, `deliberationId`, `cursusApprenantId`, `nom`, `prenoms`, `matricule`, `moyenne`, `mention`, `rang`, `decision`, `createdAt`, `updatedAt`) VALUES
(1, 1, 11, 'Guei', 'Sarah', 'UST2024001', 16.55, 'Très Bien', 1, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(2, 1, 10, 'Touré', 'Moussa Junior', 'UST2024002', 15.15, 'Bien', 2, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(3, 1, 1, 'Traoré', 'Aminata', 'UST2024003', 14.97, 'Bien', 3, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(4, 1, 2, 'Kouamé', 'Jean', 'UST2024004', 14.49, 'Bien', 4, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(5, 1, 9, 'N''Dri', 'Grace', 'UST2024005', 14.43, 'Bien', 5, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(6, 1, 15, 'Soumahoro', 'Fatima', 'UST2024006', 14.35, 'Bien', 6, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(7, 1, 3, 'Bamba', 'Mariam', 'UST2024007', 14.27, 'Bien', 7, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(8, 1, 4, 'Soro', 'Léon', 'UST2024008', 13.39, 'Assez Bien', 8, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(9, 1, 5, 'Yao', 'Esther', 'UST2024009', 13.32, 'Assez Bien', 9, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(10, 1, 12, 'Kouadio', 'Arnaud', 'UST2024010', 13.15, 'Assez Bien', 10, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(11, 1, 6, 'Coulibaly', 'Adama', 'UST2024011', 13.06, 'Assez Bien', 11, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(12, 1, 8, 'Diomandé', 'Yannick', 'UST2024012', 13.06, 'Assez Bien', 12, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(13, 1, 7, 'Koffi', 'Aya', 'UST2024013', 12.84, 'Assez Bien', 13, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(14, 1, 14, 'Akéko', 'Georges', 'UST2024014', 12.71, 'Assez Bien', 14, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18'),
(15, 1, 13, 'Fofana', 'Mariam', 'UST2024015', 12.6, 'Assez Bien', 15, 'admis', '2026-07-02 18:09:18', '2026-07-02 18:09:18');

-- --------------------------------------------------------

--
-- Structure de la table `ins_salles_de_classes`
--

CREATE TABLE IF NOT EXISTS `ins_salles_de_classes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `classeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`),
  KEY `classeId` (`classeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_salles_de_classes`
--

INSERT INTO `ins_salles_de_classes` (`id`, `libelle`, `description`, `createdAt`, `updatedAt`, `deletedAt`, `classeId`) VALUES
(1, 'Amphi A', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, NULL),
(2, 'Salle 101', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, NULL),
(3, 'Labo Info', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_seances`
--

CREATE TABLE IF NOT EXISTS `ins_seances` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) DEFAULT NULL,
  `jourSemaine` enum('1','2','3','4','5','6') NOT NULL,
  `salle` varchar(255) NOT NULL,
  `dateDebut` date NOT NULL,
  `dateFin` date NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `heureDebut` time NOT NULL,
  `heureFin` time NOT NULL,
  `salleDeClasseId` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `coursId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `salleDeClasseId` (`salleDeClasseId`),
  KEY `coursId` (`coursId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ins_sessions`
--

CREATE TABLE IF NOT EXISTS `ins_sessions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dateDebut` datetime NOT NULL,
  `dateFin` datetime NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  `anneeAcademiqueId` int(10) unsigned DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `niveauEtudeId` (`niveauEtudeId`),
  KEY `anneeAcademiqueId` (`anneeAcademiqueId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `ins_sessions`
--

INSERT INTO `ins_sessions` (`id`, `dateDebut`, `dateFin`, `description`, `niveauEtudeId`, `anneeAcademiqueId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, '2024-10-01 00:00:00', '2025-07-31 00:00:00', NULL, 1, 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_sessions_examens`
--

CREATE TABLE IF NOT EXISTS `ins_sessions_examens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `type` enum('normale','rattrapage') NOT NULL DEFAULT 'normale',
  `classeId` int(10) unsigned NOT NULL,
  `anneeAcademiqueId` int(10) unsigned NOT NULL,
  `semestre` enum('semestre1','semestre2','semestre3','semestre4','semestre5','semestre6') NOT NULL,
  `dateDebut` datetime DEFAULT NULL,
  `dateFin` datetime DEFAULT NULL,
  `statut` enum('planifiee','en_cours','terminee','cloturee') NOT NULL DEFAULT 'planifiee',
  `observations` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `classeId` (`classeId`),
  KEY `anneeAcademiqueId` (`anneeAcademiqueId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `ins_sessions_examens`
--

INSERT INTO `ins_sessions_examens` (`id`, `libelle`, `type`, `classeId`, `anneeAcademiqueId`, `semestre`, `dateDebut`, `dateFin`, `statut`, `observations`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Session normale S1 2024-2025', 'normale', 1, 1, 'semestre1', '2025-06-15 00:00:00', '2025-06-30 00:00:00', 'cloturee', 'Session normale du semestre 1', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Session rattrapage S1 2024-2025', 'rattrapage', 1, 1, 'semestre1', '2025-07-15 00:00:00', '2025-07-25 00:00:00', 'terminee', 'Rattrapage pour les étudiants en échec', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_types_note_evaluation`
--

CREATE TABLE IF NOT EXISTS `ins_types_note_evaluation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `poids` float DEFAULT NULL,
  `categorie` enum('controle_continu','devoir','examen') DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ins_types_note_evaluation`
--

INSERT INTO `ins_types_note_evaluation` (`id`, `libelle`, `description`, `poids`, `categorie`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Contrôle Continu', 'Évaluation continue en cours de semestre', 40, 'controle_continu', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Devoir', 'Devoir surveillé de mi-semestre', 30, 'devoir', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Examen', 'Examen de fin de semestre', 30, 'examen', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ins_unites_enseignement`
--

CREATE TABLE IF NOT EXISTS `ins_unites_enseignement` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `parcoursId` int(10) unsigned NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `semestre` enum('semestre1','semestre2','semestre3','semestre4','semestre5','semestre6') NOT NULL,
  `creditEcts` int(10) unsigned DEFAULT '0',
  `objectifs` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code-parcours` (`code`,`parcoursId`),
  KEY `parcoursId` (`parcoursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=7 ;

--
-- Contenu de la table `ins_unites_enseignement`
--

INSERT INTO `ins_unites_enseignement` (`id`, `code`, `parcoursId`, `libelle`, `semestre`, `creditEcts`, `objectifs`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'UE1-INFO', 1, 'Fondamentaux Informatique', 'semestre1', 12, 'Fondamentaux Informatique', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'UE2-INFO', 1, 'Mathématiques et Algorithmique', 'semestre1', 10, 'Mathématiques et Algorithmique', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'UE3-INFO', 1, 'Langues et Communication', 'semestre1', 8, 'Langues et Communication', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(4, 'UE1-GEST', 2, 'Comptabilité Fondamentale', 'semestre1', 12, 'Comptabilité Fondamentale', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(5, 'UE2-GEST', 2, 'Économie et Gestion', 'semestre1', 10, 'Économie et Gestion', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(6, 'UE3-GEST', 2, 'Langues et Communication', 'semestre1', 8, 'Langues et Communication', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ori_categories`
--

CREATE TABLE IF NOT EXISTS `ori_categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ori_categories`
--

INSERT INTO `ori_categories` (`id`, `libelle`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Sciences et Technologies', 'Filières scientifiques', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(2, 'Commerce et Gestion', 'Filières de gestion', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(3, 'Sciences Juridiques', 'Filières de droit', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ori_debouches_parcours`
--

CREATE TABLE IF NOT EXISTS `ori_debouches_parcours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `video` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parcoursId` (`parcoursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `ori_debouches_parcours`
--

INSERT INTO `ori_debouches_parcours` (`id`, `titre`, `description`, `video`, `createdAt`, `updatedAt`, `deletedAt`, `parcoursId`) VALUES
(1, 'Débouchés Informatique de Gestion', 'Métiers liés à Informatique de Gestion', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1),
(2, 'Débouchés Réseaux et Télécoms', 'Métiers liés à Réseaux et Télécoms', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 2),
(3, 'Débouchés Comptabilité Finance', 'Métiers liés à Comptabilité Finance', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 3),
(4, 'Débouchés Marketing Digital', 'Métiers liés à Marketing Digital', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 4),
(5, 'Débouchés Droit des Affaires', 'Métiers liés à Droit des Affaires', NULL, '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 5);

-- --------------------------------------------------------

--
-- Structure de la table `ori_demandes_orientation`
--

CREATE TABLE IF NOT EXISTS `ori_demandes_orientation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `dateDemande` datetime NOT NULL DEFAULT '2026-07-06 14:44:14',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ori_matieres_prerequis`
--

CREATE TABLE IF NOT EXISTS `ori_matieres_prerequis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `ori_matieres_prerequis`
--

INSERT INTO `ori_matieres_prerequis` (`id`, `libelle`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Mathématiques', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(2, 'Français', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(3, 'Anglais', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(4, 'Informatique', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(5, 'Économie', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ori_niveaux_etudes`
--

CREATE TABLE IF NOT EXISTS `ori_niveaux_etudes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `ori_niveaux_etudes`
--

INSERT INTO `ori_niveaux_etudes` (`id`, `libelle`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Baccalauréat', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(2, 'Bac+2', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL),
(3, 'Bac+3', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ori_panier_parcours_choisis`
--

CREATE TABLE IF NOT EXISTS `ori_panier_parcours_choisis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `parcoursChoisiId` int(10) unsigned DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parcoursChoisiId` (`parcoursChoisiId`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ori_parcours`
--

CREATE TABLE IF NOT EXISTS `ori_parcours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `dureeDeFormation` varchar(255) DEFAULT NULL,
  `type` enum('LICENCE','MASTER','DOCTORAT') DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `videoExplicative` varchar(255) DEFAULT NULL,
  `contenu` text NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `categorieId` int(10) unsigned DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `titre` (`titre`),
  UNIQUE KEY `titre_2` (`titre`),
  UNIQUE KEY `titre_3` (`titre`),
  UNIQUE KEY `titre_4` (`titre`),
  UNIQUE KEY `titre_5` (`titre`),
  UNIQUE KEY `titre_6` (`titre`),
  UNIQUE KEY `titre_7` (`titre`),
  UNIQUE KEY `titre_8` (`titre`),
  UNIQUE KEY `titre_9` (`titre`),
  UNIQUE KEY `titre_10` (`titre`),
  UNIQUE KEY `titre_11` (`titre`),
  UNIQUE KEY `titre_12` (`titre`),
  UNIQUE KEY `titre_13` (`titre`),
  KEY `categorieId` (`categorieId`),
  KEY `niveauEtudeId` (`niveauEtudeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `ori_parcours`
--

INSERT INTO `ori_parcours` (`id`, `titre`, `dureeDeFormation`, `type`, `image`, `videoExplicative`, `contenu`, `createdAt`, `updatedAt`, `deletedAt`, `categorieId`, `niveauEtudeId`) VALUES
(1, 'Informatique de Gestion', '2/y', 'LICENCE', NULL, NULL, 'Développement et gestion de projets informatiques', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 2),
(2, 'Réseaux et Télécoms', '2/y', 'LICENCE', NULL, NULL, 'Infrastructures réseau et télécommunications', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 2),
(3, 'Comptabilité Finance', '3/y', 'LICENCE', NULL, NULL, 'Comptabilité et audit financier', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 2, 3),
(4, 'Marketing Digital', '3/y', 'LICENCE', NULL, NULL, 'Marketing digital et communication', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 2, 3),
(5, 'Droit des Affaires', '3/y', 'LICENCE', NULL, NULL, 'Droit des sociétés et fiscalité', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 3, 3);

-- --------------------------------------------------------

--
-- Structure de la table `ori_parcours_choisis`
--

CREATE TABLE IF NOT EXISTS `ori_parcours_choisis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `etatDeValidation` enum('valide','en_cours','rejete') NOT NULL DEFAULT 'en_cours',
  `messageDeValidation` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  `demandeOrientationId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parcoursId` (`parcoursId`),
  KEY `demandeOrientationId` (`demandeOrientationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ori_prerequis_parcours`
--

CREATE TABLE IF NOT EXISTS `ori_prerequis_parcours` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `noteRequise` float unsigned NOT NULL,
  `typeEvaluation` enum('devoir_sur_table','composition','moyenne','examen') NOT NULL DEFAULT 'moyenne',
  `periodeEvaluation` enum('trimestre_1','trimestre_2','trimestre_3','semestre_1','semestre_2','examen') NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `niveauEtudeId` int(10) unsigned DEFAULT NULL,
  `matierePrerequisId` int(10) unsigned DEFAULT NULL,
  `parcoursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `niveauEtudeId` (`niveauEtudeId`),
  KEY `matierePrerequisId` (`matierePrerequisId`),
  KEY `parcoursId` (`parcoursId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `ori_prerequis_parcours`
--

INSERT INTO `ori_prerequis_parcours` (`id`, `noteRequise`, `typeEvaluation`, `periodeEvaluation`, `createdAt`, `updatedAt`, `deletedAt`, `niveauEtudeId`, `matierePrerequisId`, `parcoursId`) VALUES
(1, 12, 'moyenne', 'semestre_1', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 3, 1),
(2, 12, 'moyenne', 'semestre_1', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 3, 2),
(3, 12, 'moyenne', 'semestre_1', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 3, 3),
(4, 12, 'moyenne', 'semestre_1', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 3, 4),
(5, 12, 'moyenne', 'semestre_1', '2026-07-02 18:09:16', '2026-07-02 18:09:16', NULL, 1, 3, 5);

-- --------------------------------------------------------

--
-- Structure de la table `ori_prerequis_parcours_choisis`
--

CREATE TABLE IF NOT EXISTS `ori_prerequis_parcours_choisis` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `note` float unsigned NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `parcoursChoisiId` int(10) unsigned DEFAULT NULL,
  `prerequisParcoursId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parcoursChoisiId` (`parcoursChoisiId`),
  KEY `prerequisParcoursId` (`prerequisParcoursId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `ori_reponses_orientation`
--

CREATE TABLE IF NOT EXISTS `ori_reponses_orientation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `message` text,
  `dateReponse` datetime NOT NULL DEFAULT '2026-07-06 14:44:14',
  `dateAutorisationProvisoire` datetime DEFAULT NULL,
  `statutAutorisation` enum('en_attente','autorise','refuse') NOT NULL DEFAULT 'en_attente',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeOrientationId` int(10) unsigned DEFAULT NULL,
  `utilisateurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeOrientationId` (`demandeOrientationId`),
  KEY `utilisateurId` (`utilisateurId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rh_bulletins_paie`
--

CREATE TABLE IF NOT EXISTS `rh_bulletins_paie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `totalGains` decimal(12,2) DEFAULT '0.00',
  `totalRetenues` decimal(12,2) DEFAULT '0.00',
  `netAPayer` decimal(12,2) DEFAULT '0.00',
  `statut` enum('brouillon','validé','versé') DEFAULT 'brouillon',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `periodeId` int(10) unsigned DEFAULT NULL,
  `employeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `periodeId` (`periodeId`),
  KEY `employeId` (`employeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `rh_bulletins_paie`
--

INSERT INTO `rh_bulletins_paie` (`id`, `totalGains`, `totalRetenues`, `netAPayer`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `periodeId`, `employeId`) VALUES
(1, '800000.00', '72000.00', '728000.00', 'validé', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 1),
(2, '1000000.00', '90000.00', '910000.00', 'validé', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 2),
(3, '1200000.00', '108000.00', '1092000.00', 'validé', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 3),
(4, '1400000.00', '126000.00', '1274000.00', 'validé', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 4),
(5, '1200000.00', '108000.00', '1092000.00', 'validé', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 5);

-- --------------------------------------------------------

--
-- Structure de la table `rh_candidatures`
--

CREATE TABLE IF NOT EXISTS `rh_candidatures` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `cv` varchar(255) DEFAULT NULL,
  `lettreMotivation` varchar(255) DEFAULT NULL,
  `statut` enum('soumise','étudiée','retenue','rejetée') DEFAULT 'soumise',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `offreId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offreId` (`offreId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `rh_candidatures`
--

INSERT INTO `rh_candidatures` (`id`, `nom`, `email`, `telephone`, `cv`, `lettreMotivation`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `offreId`) VALUES
(1, 'Koné Moussa', 'moussa.kone@email.ci', '+22507010101', 'cv_kone.pdf', 'lm_kone.pdf', 'retenue', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 'Diallo Aïcha', 'aicha.diallo@email.ci', '+22507020202', 'cv_diallo.pdf', 'lm_diallo.pdf', 'soumise', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(3, 'Tano Jean', 'jean.tano@email.ci', NULL, 'cv_tano.pdf', NULL, 'soumise', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2);

-- --------------------------------------------------------

--
-- Structure de la table `rh_criteres_evaluation`
--

CREATE TABLE IF NOT EXISTS `rh_criteres_evaluation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `poids` int(10) unsigned DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `rh_criteres_evaluation`
--

INSERT INTO `rh_criteres_evaluation` (`id`, `nom`, `description`, `poids`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Ponctualité', 'Respect des horaires', 20, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Compétence technique', 'Maîtrise des outils', 30, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(3, 'Relationnel', 'Travail en équipe', 20, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(4, 'Productivité', 'Efficacité au travail', 30, '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rh_departements`
--

CREATE TABLE IF NOT EXISTS `rh_departements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`),
  UNIQUE KEY `nom_2` (`nom`),
  UNIQUE KEY `nom_3` (`nom`),
  UNIQUE KEY `nom_4` (`nom`),
  UNIQUE KEY `nom_5` (`nom`),
  UNIQUE KEY `nom_6` (`nom`),
  UNIQUE KEY `nom_7` (`nom`),
  UNIQUE KEY `nom_8` (`nom`),
  UNIQUE KEY `nom_9` (`nom`),
  UNIQUE KEY `nom_10` (`nom`),
  UNIQUE KEY `nom_11` (`nom`),
  UNIQUE KEY `nom_12` (`nom`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `rh_departements`
--

INSERT INTO `rh_departements` (`id`, `nom`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Enseignement et Recherche', 'Département pédagogique', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 'Finance et Comptabilité', 'Gestion financière', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, 'Ressources Humaines', 'Gestion du personnel', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(4, 'Scolarité', 'Gestion des inscriptions et dossiers', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(5, 'Services Techniques', 'Maintenance et logistique', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rh_employes`
--

CREATE TABLE IF NOT EXISTS `rh_employes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `utilisateurId` int(10) unsigned NOT NULL,
  `dateEmbauche` date NOT NULL,
  `salaireBase` decimal(12,2) DEFAULT '0.00',
  `statut` enum('actif','suspendu','quitté') DEFAULT 'actif',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `departementId` int(10) unsigned DEFAULT NULL,
  `posteId` int(10) unsigned DEFAULT NULL,
  `typeContratId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `departementId` (`departementId`),
  KEY `posteId` (`posteId`),
  KEY `typeContratId` (`typeContratId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `rh_employes`
--

INSERT INTO `rh_employes` (`id`, `utilisateurId`, `dateEmbauche`, `salaireBase`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `departementId`, `posteId`, `typeContratId`) VALUES
(1, 3, '2020-09-01', '800000.00', 'actif', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 1, 1),
(2, 4, '2020-09-01', '1000000.00', 'actif', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 2, 1),
(3, 5, '2020-09-01', '1200000.00', 'actif', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 3, 1),
(4, 6, '2020-09-01', '1400000.00', 'actif', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 4, 1),
(5, 1, '2019-01-15', '1200000.00', 'actif', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 5, 1);

-- --------------------------------------------------------

--
-- Structure de la table `rh_entretiens`
--

CREATE TABLE IF NOT EXISTS `rh_entretiens` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `heure` varchar(255) NOT NULL,
  `lieu` varchar(255) DEFAULT NULL,
  `commentaire` text,
  `statut` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `candidatureId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `candidatureId` (`candidatureId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `rh_entretiens`
--

INSERT INTO `rh_entretiens` (`id`, `date`, `heure`, `lieu`, `commentaire`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `candidatureId`) VALUES
(1, '2025-02-20', '10:00', 'Bureau RH', 'Candidat très compétent', 'retenu', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, '2025-02-21', '14:00', 'Salle 101', 'À recontacter', 'en_attente', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2);

-- --------------------------------------------------------

--
-- Structure de la table `rh_evaluations_criteres`
--

CREATE TABLE IF NOT EXISTS `rh_evaluations_criteres` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `note` decimal(5,2) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `ficheId` int(10) unsigned DEFAULT NULL,
  `critereId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ficheId` (`ficheId`),
  KEY `critereId` (`critereId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=13 ;

--
-- Contenu de la table `rh_evaluations_criteres`
--

INSERT INTO `rh_evaluations_criteres` (`id`, `note`, `createdAt`, `updatedAt`, `deletedAt`, `ficheId`, `critereId`) VALUES
(1, '14.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1),
(2, '15.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 2),
(3, '13.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 3),
(4, '14.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 4),
(5, '15.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 1),
(6, '16.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 2),
(7, '14.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 3),
(8, '15.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 4),
(9, '16.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3, 1),
(10, '17.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3, 2),
(11, '15.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3, 3),
(12, '16.00', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3, 4);

-- --------------------------------------------------------

--
-- Structure de la table `rh_fiches_evaluation`
--

CREATE TABLE IF NOT EXISTS `rh_fiches_evaluation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `evaluateurId` int(10) unsigned NOT NULL,
  `dateEvaluation` date NOT NULL,
  `noteGlobale` decimal(5,2) DEFAULT NULL,
  `commentaire` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `employeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employeId` (`employeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `rh_fiches_evaluation`
--

INSERT INTO `rh_fiches_evaluation` (`id`, `evaluateurId`, `dateEvaluation`, `noteGlobale`, `commentaire`, `createdAt`, `updatedAt`, `deletedAt`, `employeId`) VALUES
(1, 1, '2025-06-15', '14.00', 'Bon travail', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 1, '2025-06-15', '15.00', 'Bon travail', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2),
(3, 1, '2025-06-15', '16.00', 'Bon travail', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `rh_formations`
--

CREATE TABLE IF NOT EXISTS `rh_formations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `dateDebut` date NOT NULL,
  `dateFin` date NOT NULL,
  `formateur` varchar(255) NOT NULL,
  `type` enum('interne','externe') DEFAULT 'interne',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `rh_formations`
--

INSERT INTO `rh_formations` (`id`, `titre`, `description`, `dateDebut`, `dateFin`, `formateur`, `type`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Pédagogie universitaire', 'Formation aux méthodes pédagogiques', '2025-04-01', '2025-04-05', 'Dr. Kouamé Paul', 'interne', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL),
(2, 'Excel avancé', 'Tableaux de bord et reporting', '2025-05-10', '2025-05-12', 'Bureau Plus Formation', 'externe', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rh_lignes_bulletin`
--

CREATE TABLE IF NOT EXISTS `rh_lignes_bulletin` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) DEFAULT NULL,
  `base` decimal(12,2) DEFAULT '0.00',
  `taux` decimal(5,2) DEFAULT '0.00',
  `montant` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `bulletinId` int(10) unsigned DEFAULT NULL,
  `rubriqueId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bulletinId` (`bulletinId`),
  KEY `rubriqueId` (`rubriqueId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=26 ;

--
-- Contenu de la table `rh_lignes_bulletin`
--

INSERT INTO `rh_lignes_bulletin` (`id`, `libelle`, `base`, `taux`, `montant`, `createdAt`, `updatedAt`, `deletedAt`, `bulletinId`, `rubriqueId`) VALUES
(1, 'Salaire de base', '800000.00', '0.00', '800000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 1),
(2, 'Indemnité logement', '800000.00', '15.00', '120000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 2),
(3, 'Indemnité transport', '0.00', '0.00', '50000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 3),
(4, 'Impôt sur le revenu', '800000.00', '5.00', '40000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 4),
(5, 'Cotisation CNPS', '800000.00', '4.00', '32000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 5),
(6, 'Salaire de base', '1000000.00', '0.00', '1000000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 1),
(7, 'Indemnité logement', '1000000.00', '15.00', '150000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 2),
(8, 'Indemnité transport', '0.00', '0.00', '50000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 3),
(9, 'Impôt sur le revenu', '1000000.00', '5.00', '50000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 4),
(10, 'Cotisation CNPS', '1000000.00', '4.00', '40000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 5),
(11, 'Salaire de base', '1200000.00', '0.00', '1200000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 1),
(12, 'Indemnité logement', '1200000.00', '15.00', '180000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 2),
(13, 'Indemnité transport', '0.00', '0.00', '50000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 3),
(14, 'Impôt sur le revenu', '1200000.00', '5.00', '60000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 4),
(15, 'Cotisation CNPS', '1200000.00', '4.00', '48000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 5),
(16, 'Salaire de base', '1400000.00', '0.00', '1400000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 1),
(17, 'Indemnité logement', '1400000.00', '15.00', '210000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 2),
(18, 'Indemnité transport', '0.00', '0.00', '50000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 3),
(19, 'Impôt sur le revenu', '1400000.00', '5.00', '70000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 4),
(20, 'Cotisation CNPS', '1400000.00', '4.00', '56000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4, 5),
(21, 'Salaire de base', '1200000.00', '0.00', '1200000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 1),
(22, 'Indemnité logement', '1200000.00', '15.00', '180000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 2),
(23, 'Indemnité transport', '0.00', '0.00', '50000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 3),
(24, 'Impôt sur le revenu', '1200000.00', '5.00', '60000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 4),
(25, 'Cotisation CNPS', '1200000.00', '4.00', '48000.00', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5, 5);

-- --------------------------------------------------------

--
-- Structure de la table `rh_offres_emploi`
--

CREATE TABLE IF NOT EXISTS `rh_offres_emploi` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` text,
  `datePublication` date DEFAULT NULL,
  `dateCloture` date DEFAULT NULL,
  `statut` enum('publiée','fermée') DEFAULT 'publiée',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `posteId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `posteId` (`posteId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `rh_offres_emploi`
--

INSERT INTO `rh_offres_emploi` (`id`, `description`, `datePublication`, `dateCloture`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `posteId`) VALUES
(1, 'Recherche professeur d''informatique', '2025-01-15', '2025-03-15', 'fermée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 'Recherche comptable expérimenté', '2025-06-01', '2025-08-01', 'publiée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `rh_participations_formation`
--

CREATE TABLE IF NOT EXISTS `rh_participations_formation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `statut` enum('inscrit','terminé','abandon') DEFAULT 'inscrit',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `formationId` int(10) unsigned DEFAULT NULL,
  `employeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `formationId` (`formationId`),
  KEY `employeId` (`employeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `rh_participations_formation`
--

INSERT INTO `rh_participations_formation` (`id`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `formationId`, `employeId`) VALUES
(1, 'terminé', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 1),
(2, 'terminé', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 2),
(3, 'terminé', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1, 3),
(4, 'terminé', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 1),
(5, 'terminé', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2, 2);

-- --------------------------------------------------------

--
-- Structure de la table `rh_periodes_paie`
--

CREATE TABLE IF NOT EXISTS `rh_periodes_paie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mois` int(10) unsigned NOT NULL,
  `annee` int(10) unsigned NOT NULL,
  `dateDebut` date NOT NULL,
  `dateFin` date NOT NULL,
  `statut` enum('ouverte','verrouillée') DEFAULT 'ouverte',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `rh_periodes_paie`
--

INSERT INTO `rh_periodes_paie` (`id`, `mois`, `annee`, `dateDebut`, `dateFin`, `statut`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 6, 2025, '2025-06-01', '2025-06-30', 'ouverte', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rh_postes`
--

CREATE TABLE IF NOT EXISTS `rh_postes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `departementId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `departementId` (`departementId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=11 ;

--
-- Contenu de la table `rh_postes`
--

INSERT INTO `rh_postes` (`id`, `titre`, `description`, `createdAt`, `updatedAt`, `deletedAt`, `departementId`) VALUES
(1, 'Professeur', 'Poste de Professeur', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1),
(2, 'Maître de Conférences', 'Poste de Maître de Conférences', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1),
(3, 'Comptable', 'Poste de Comptable', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2),
(4, 'Chef comptable', 'Poste de Chef comptable', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2),
(5, 'Responsable RH', 'Poste de Responsable RH', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3),
(6, 'Assistant RH', 'Poste de Assistant RH', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3),
(7, 'Agent de scolarité', 'Poste de Agent de scolarité', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4),
(8, 'Chef de service scolarité', 'Poste de Chef de service scolarité', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 4),
(9, 'Technicien de maintenance', 'Poste de Technicien de maintenance', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5),
(10, 'Chef de service technique', 'Poste de Chef de service technique', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 5);

-- --------------------------------------------------------

--
-- Structure de la table `rh_prestations_enseignant`
--

CREATE TABLE IF NOT EXISTS `rh_prestations_enseignant` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `coursId` int(10) unsigned NOT NULL,
  `mois` int(10) unsigned NOT NULL,
  `annee` int(10) unsigned NOT NULL,
  `nombreHeures` decimal(8,2) NOT NULL,
  `tauxHoraire` decimal(10,2) NOT NULL,
  `montant` decimal(12,2) DEFAULT '0.00',
  `statut` enum('saisie','validée','payée') DEFAULT 'saisie',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `rh_prestations_enseignant`
--

INSERT INTO `rh_prestations_enseignant` (`id`, `coursId`, `mois`, `annee`, `nombreHeures`, `tauxHoraire`, `montant`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `enseignantId`) VALUES
(1, 1, 6, 2025, '20.00', '5000.00', '100000.00', 'validée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 1),
(2, 2, 6, 2025, '24.00', '5000.00', '120000.00', 'validée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 2),
(3, 3, 6, 2025, '28.00', '5000.00', '140000.00', 'validée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 3),
(4, 4, 6, 2025, '32.00', '5000.00', '160000.00', 'validée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 4),
(5, 5, 6, 2025, '36.00', '5000.00', '180000.00', 'validée', '2026-07-02 18:09:19', '2026-07-02 18:09:19', NULL, 5);

-- --------------------------------------------------------

--
-- Structure de la table `rh_rubriques_paie`
--

CREATE TABLE IF NOT EXISTS `rh_rubriques_paie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `type` enum('gain','retenue','cotisation') DEFAULT 'gain',
  `modeCalcul` enum('fixe','pourcentage','formule') DEFAULT 'fixe',
  `valeur` decimal(12,2) DEFAULT '0.00',
  `imposable` tinyint(1) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `rh_rubriques_paie`
--

INSERT INTO `rh_rubriques_paie` (`id`, `code`, `libelle`, `type`, `modeCalcul`, `valeur`, `imposable`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'SAL', 'Salaire de base', 'gain', 'fixe', '0.00', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 'LOG', 'Indemnité logement', 'gain', 'pourcentage', '15.00', 0, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, 'TRANS', 'Indemnité transport', 'gain', 'fixe', '50000.00', 0, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(4, 'IR', 'Impôt sur le revenu', 'retenue', 'pourcentage', '5.00', 0, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(5, 'CNPS', 'Cotisation CNPS', 'cotisation', 'pourcentage', '4.00', 0, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rh_types_contrat`
--

CREATE TABLE IF NOT EXISTS `rh_types_contrat` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `rh_types_contrat`
--

INSERT INTO `rh_types_contrat` (`id`, `code`, `libelle`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'CDI', 'Contrat à Durée Indéterminée', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 'CDD', 'Contrat à Durée Déterminée', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, 'VAC', 'Vacataire', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `rpt_achats`
--

CREATE TABLE IF NOT EXISTS `rpt_achats` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `categorieId` int(10) unsigned DEFAULT NULL,
  `periode` varchar(255) DEFAULT NULL,
  `nbDemandes` int(11) DEFAULT '0',
  `nbCommandes` int(11) DEFAULT '0',
  `montantTotal` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_budget_vs_reel`
--

CREATE TABLE IF NOT EXISTS `rpt_budget_vs_reel` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `departementId` int(10) unsigned DEFAULT NULL,
  `periode` varchar(255) DEFAULT NULL,
  `budgetPrevu` decimal(12,2) DEFAULT '0.00',
  `budgetReel` decimal(12,2) DEFAULT '0.00',
  `ecart` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_effectifs`
--

CREATE TABLE IF NOT EXISTS `rpt_effectifs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `classeId` int(10) unsigned DEFAULT NULL,
  `periode` varchar(255) DEFAULT NULL,
  `nbInscrits` int(11) DEFAULT '0',
  `nbActifs` int(11) DEFAULT '0',
  `nbHommes` int(11) DEFAULT '0',
  `nbFemmes` int(11) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_effectifs_rh`
--

CREATE TABLE IF NOT EXISTS `rpt_effectifs_rh` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `departementId` int(10) unsigned DEFAULT NULL,
  `date` date DEFAULT NULL,
  `nbEmployes` int(11) DEFAULT '0',
  `nbActifs` int(11) DEFAULT '0',
  `masseSalariale` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_evaluations`
--

CREATE TABLE IF NOT EXISTS `rpt_evaluations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `periode` varchar(255) DEFAULT NULL,
  `nbEvaluations` int(11) DEFAULT '0',
  `noteMoyenneGlobale` float DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_factures`
--

CREATE TABLE IF NOT EXISTS `rpt_factures` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mois` varchar(255) DEFAULT NULL,
  `nbFactures` int(11) DEFAULT '0',
  `montantTotal` decimal(12,2) DEFAULT '0.00',
  `statut` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_formations_rh`
--

CREATE TABLE IF NOT EXISTS `rpt_formations_rh` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `formationId` int(10) unsigned DEFAULT NULL,
  `nbParticipants` int(11) DEFAULT '0',
  `coutTotal` decimal(12,2) DEFAULT '0.00',
  `dureeTotale` int(11) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_immobilisations`
--

CREATE TABLE IF NOT EXISTS `rpt_immobilisations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `categorieId` int(10) unsigned DEFAULT NULL,
  `nbActifs` int(11) DEFAULT '0',
  `valeurAcquisition` decimal(12,2) DEFAULT '0.00',
  `amortissementTotal` decimal(12,2) DEFAULT '0.00',
  `valeurNet` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_inscriptions`
--

CREATE TABLE IF NOT EXISTS `rpt_inscriptions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `sessionId` int(10) unsigned DEFAULT NULL,
  `date` date DEFAULT NULL,
  `nbInscrits` int(11) DEFAULT '0',
  `montantTotal` decimal(12,2) DEFAULT '0.00',
  `statut` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_notes_moyennes`
--

CREATE TABLE IF NOT EXISTS `rpt_notes_moyennes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `classeId` int(10) unsigned DEFAULT NULL,
  `matiereId` int(10) unsigned DEFAULT NULL,
  `periode` varchar(255) DEFAULT NULL,
  `moyenneClasse` float DEFAULT '0',
  `min` float DEFAULT '0',
  `max` float DEFAULT '0',
  `nbEtudiants` int(11) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_paie`
--

CREATE TABLE IF NOT EXISTS `rpt_paie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `periode` varchar(255) DEFAULT NULL,
  `nbBulletins` int(11) DEFAULT '0',
  `totalGains` decimal(12,2) DEFAULT '0.00',
  `totalRetenues` decimal(12,2) DEFAULT '0.00',
  `netTotal` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_paiements`
--

CREATE TABLE IF NOT EXISTS `rpt_paiements` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `modePaiement` varchar(255) DEFAULT NULL,
  `montantTotal` decimal(12,2) DEFAULT '0.00',
  `nbTransactions` int(11) DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_reussite`
--

CREATE TABLE IF NOT EXISTS `rpt_reussite` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `classeId` int(10) unsigned DEFAULT NULL,
  `semestre` varchar(255) DEFAULT NULL,
  `annee` varchar(255) DEFAULT NULL,
  `nbAdmis` int(11) DEFAULT '0',
  `nbEchoues` int(11) DEFAULT '0',
  `tauxReussite` float DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `rpt_stocks`
--

CREATE TABLE IF NOT EXISTS `rpt_stocks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `articleId` int(10) unsigned DEFAULT NULL,
  `stockActuel` int(11) DEFAULT '0',
  `stockAlerte` int(11) DEFAULT '0',
  `valeurStock` decimal(12,2) DEFAULT '0.00',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `scol_conseils_classe`
--

CREATE TABLE IF NOT EXISTS `scol_conseils_classe` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `classe` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `trimestre` int(11) NOT NULL,
  `president` varchar(255) NOT NULL,
  `statut` varchar(50) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `scol_conseils_classe`
--

INSERT INTO `scol_conseils_classe` (`id`, `classe`, `date`, `trimestre`, `president`, `statut`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'LIC1-A', '2025-07-10 00:00:00', 1, 'Konan Yves', 'cloturé', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `scol_decisions_conseil`
--

CREATE TABLE IF NOT EXISTS `scol_decisions_conseil` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `conseilClasseId` int(10) unsigned NOT NULL,
  `theme` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conseilClasseId` (`conseilClasseId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Contenu de la table `scol_decisions_conseil`
--

INSERT INTO `scol_decisions_conseil` (`id`, `conseilClasseId`, `theme`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 'Validation du semestre 1', 'Tous les étudiants ayant une moyenne ≥ 10 sont admis en LIC2', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `scol_demandes_document`
--

CREATE TABLE IF NOT EXISTS `scol_demandes_document` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `statut` enum('soumise','validee','rejetee','delivree') NOT NULL DEFAULT 'soumise',
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:19',
  `fraisPayes` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `typeDocumentId` int(10) unsigned DEFAULT NULL,
  `etudiantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `typeDocumentId` (`typeDocumentId`),
  KEY `etudiantId` (`etudiantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `scol_demandes_document`
--

INSERT INTO `scol_demandes_document` (`id`, `statut`, `date`, `fraisPayes`, `createdAt`, `updatedAt`, `deletedAt`, `typeDocumentId`, `etudiantId`) VALUES
(1, 'delivree', '2026-07-02 18:09:18', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 11),
(2, 'delivree', '2026-07-02 18:09:18', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 12),
(3, 'delivree', '2026-07-02 18:09:18', 1, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 13),
(4, 'soumise', '2026-07-02 18:09:18', 0, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 14),
(5, 'soumise', '2026-07-02 18:09:18', 0, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 15);

-- --------------------------------------------------------

--
-- Structure de la table `scol_documents_delivres`
--

CREATE TABLE IF NOT EXISTS `scol_documents_delivres` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fichierPDF` varchar(255) NOT NULL,
  `dateDelivrance` datetime NOT NULL DEFAULT '2026-07-06 14:44:19',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeId` (`demandeId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `scol_documents_delivres`
--

INSERT INTO `scol_documents_delivres` (`id`, `fichierPDF`, `dateDelivrance`, `createdAt`, `updatedAt`, `deletedAt`, `demandeId`) VALUES
(1, 'certificat_11.pdf', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1),
(2, 'certificat_12.pdf', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2),
(3, 'releve_13.pdf', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `scol_evenements_calendrier`
--

CREATE TABLE IF NOT EXISTS `scol_evenements_calendrier` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `description` text,
  `type` varchar(50) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `scol_evenements_calendrier`
--

INSERT INTO `scol_evenements_calendrier` (`id`, `titre`, `date`, `description`, `type`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Début des cours', '2024-10-01 00:00:00', 'Rentrée académique 2024-2025', 'academique', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 'Examens semestre 1', '2025-06-15 00:00:00', 'Période des examens', 'examen', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, 'Vacances de Noël', '2024-12-23 00:00:00', 'Fermeture de l''université', 'vacance', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `scol_livres`
--

CREATE TABLE IF NOT EXISTS `scol_livres` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `auteur` varchar(255) NOT NULL DEFAULT 'Inconnu',
  `description` text,
  `fichier` varchar(255) NOT NULL,
  `taille` varchar(255) DEFAULT NULL,
  `consultations` int(10) unsigned DEFAULT '0',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `uploaderId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaderId` (`uploaderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `scol_reclamations`
--

CREATE TABLE IF NOT EXISTS `scol_reclamations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `evaluationId` int(10) unsigned DEFAULT NULL,
  `motif` text NOT NULL,
  `statut` enum('ouverte','traitee','fermee') NOT NULL DEFAULT 'ouverte',
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:19',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `etudiantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `etudiantId` (`etudiantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `scol_reclamations`
--

INSERT INTO `scol_reclamations` (`id`, `evaluationId`, `motif`, `statut`, `date`, `createdAt`, `updatedAt`, `deletedAt`, `etudiantId`) VALUES
(1, NULL, 'Erreur sur mon relevé de notes', 'traitee', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 11),
(2, NULL, 'Demande de révision de note', 'traitee', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 12),
(3, NULL, 'Problème d''emploi du temps', 'ouverte', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 13);

-- --------------------------------------------------------

--
-- Structure de la table `scol_registres_academiques`
--

CREATE TABLE IF NOT EXISTS `scol_registres_academiques` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `etudiant` varchar(255) NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `classe` varchar(50) NOT NULL,
  `moyenne` float NOT NULL,
  `rang` int(11) NOT NULL,
  `decision` varchar(50) NOT NULL,
  `anneeScolaire` varchar(20) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=16 ;

--
-- Contenu de la table `scol_registres_academiques`
--

INSERT INTO `scol_registres_academiques` (`id`, `etudiant`, `matricule`, `classe`, `moyenne`, `rang`, `decision`, `anneeScolaire`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, ' ', 'UST2024001', 'LIC1-A', 17.61, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, ' ', 'UST2024001', 'LIC1-A', 11.89, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, ' ', 'UST2024001', 'LIC1-A', 15.32, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(4, ' ', 'UST2024001', 'LIC1-A', 11.96, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(5, ' ', 'UST2024001', 'LIC1-A', 12.84, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(6, ' ', 'UST2024001', 'LIC1-A', 13.05, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(7, ' ', 'UST2024001', 'LIC1-A', 15.95, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(8, ' ', 'UST2024001', 'LIC1-A', 10.35, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(9, ' ', 'UST2024001', 'LIC1-A', 16.29, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(10, ' ', 'UST2024001', 'LIC1-A', 14.33, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(11, ' ', 'UST2024001', 'LIC1-A', 16.43, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(12, ' ', 'UST2024001', 'LIC1-A', 14.17, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(13, ' ', 'UST2024001', 'LIC1-A', 14.71, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(14, ' ', 'UST2024001', 'LIC1-A', 13.21, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(15, ' ', 'UST2024001', 'LIC1-A', 14.42, 1, 'Admis', '2024-2025', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `scol_reponses_reclamation`
--

CREATE TABLE IF NOT EXISTS `scol_reponses_reclamation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reponse` text NOT NULL,
  `date` datetime NOT NULL DEFAULT '2026-07-06 14:44:19',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `reclamationId` int(10) unsigned DEFAULT NULL,
  `repondeurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reclamationId` (`reclamationId`),
  KEY `repondeurId` (`repondeurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `scol_reponses_reclamation`
--

INSERT INTO `scol_reponses_reclamation` (`id`, `reponse`, `date`, `createdAt`, `updatedAt`, `deletedAt`, `reclamationId`, `repondeurId`) VALUES
(1, 'La note a été vérifiée et est correcte.', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 1),
(2, 'La demande de révision a été transmise au professeur.', '2026-07-02 18:09:18', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 1);

-- --------------------------------------------------------

--
-- Structure de la table `scol_sanctions_discipline`
--

CREATE TABLE IF NOT EXISTS `scol_sanctions_discipline` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `etudiant` varchar(255) NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `classe` varchar(50) NOT NULL,
  `date` datetime NOT NULL,
  `motif` text NOT NULL,
  `sanction` varchar(255) NOT NULL,
  `statut` varchar(50) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `scol_sanctions_discipline`
--

INSERT INTO `scol_sanctions_discipline` (`id`, `etudiant`, `matricule`, `classe`, `date`, `motif`, `sanction`, `statut`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Traoré Aminata', 'UST2024001', 'LIC1-A', '2025-03-10 00:00:00', 'Absences répétées', 'Avertissement écrit', 'notifiée', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 'Kouamé Jean', 'UST2024002', 'LIC1-A', '2025-04-05 00:00:00', 'Retards fréquents', 'Blâme', 'notifiée', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `scol_types_document`
--

CREATE TABLE IF NOT EXISTS `scol_types_document` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL,
  `frais` float unsigned NOT NULL DEFAULT '0',
  `format` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `libelle` (`libelle`),
  UNIQUE KEY `libelle_2` (`libelle`),
  UNIQUE KEY `libelle_3` (`libelle`),
  UNIQUE KEY `libelle_4` (`libelle`),
  UNIQUE KEY `libelle_5` (`libelle`),
  UNIQUE KEY `libelle_6` (`libelle`),
  UNIQUE KEY `libelle_7` (`libelle`),
  UNIQUE KEY `libelle_8` (`libelle`),
  UNIQUE KEY `libelle_9` (`libelle`),
  UNIQUE KEY `libelle_10` (`libelle`),
  UNIQUE KEY `libelle_11` (`libelle`),
  UNIQUE KEY `libelle_12` (`libelle`),
  UNIQUE KEY `libelle_13` (`libelle`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `scol_types_document`
--

INSERT INTO `scol_types_document` (`id`, `libelle`, `frais`, `format`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Certificat de scolarité', 5000, 'PDF', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(2, 'Relevé de notes', 3000, 'PDF', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(3, 'Attestation de réussite', 0, 'PDF', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL),
(4, 'Diplôme', 15000, 'PDF', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `stg_attestations_stage`
--

CREATE TABLE IF NOT EXISTS `stg_attestations_stage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fichier` varchar(255) NOT NULL,
  `dateEmission` datetime NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeStageId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeStageId` (`demandeStageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `stg_conventions_stage`
--

CREATE TABLE IF NOT EXISTS `stg_conventions_stage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fichier` varchar(255) NOT NULL,
  `dateSignature` date DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeStageId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeStageId` (`demandeStageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `stg_demandes_stage`
--

CREATE TABLE IF NOT EXISTS `stg_demandes_stage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nouvelleEntreprise` text,
  `dateDebut` date NOT NULL,
  `dateFin` date NOT NULL,
  `statut` enum('en_attente','valide','rejete') DEFAULT 'en_attente',
  `motifRejet` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `offreStageId` int(10) unsigned DEFAULT NULL,
  `entrepriseId` int(10) unsigned DEFAULT NULL,
  `apprenantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `offreStageId` (`offreStageId`),
  KEY `entrepriseId` (`entrepriseId`),
  KEY `apprenantId` (`apprenantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `stg_demandes_stage`
--

INSERT INTO `stg_demandes_stage` (`id`, `nouvelleEntreprise`, `dateDebut`, `dateFin`, `statut`, `motifRejet`, `createdAt`, `updatedAt`, `deletedAt`, `offreStageId`, `entrepriseId`, `apprenantId`) VALUES
(1, NULL, '2025-06-01', '2025-08-31', 'valide', NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, 1, NULL),
(2, NULL, '2025-06-01', '2025-08-31', 'valide', NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, 1, NULL),
(3, NULL, '2025-06-01', '2025-08-31', 'valide', NULL, '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `stg_entreprises`
--

CREATE TABLE IF NOT EXISTS `stg_entreprises` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `adresse` text,
  `telephone` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `siteWeb` varchar(255) DEFAULT NULL,
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `stg_entreprises`
--

INSERT INTO `stg_entreprises` (`id`, `nom`, `adresse`, `telephone`, `email`, `siteWeb`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Orange Côte d''Ivoire', NULL, '+22520202020', 'recrutement@orange.ci', NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Ecobank CI', NULL, '+22520303030', 'rh@ecobank.ci', NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(3, 'Groupe SIFCA', NULL, '+22520404040', 'carriere@sifca.ci', NULL, NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `stg_notes_stage`
--

CREATE TABLE IF NOT EXISTS `stg_notes_stage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `note` decimal(5,2) NOT NULL,
  `appreciation` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeStageId` int(10) unsigned DEFAULT NULL,
  `enseignantId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeStageId` (`demandeStageId`),
  KEY `enseignantId` (`enseignantId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `stg_notes_stage`
--

INSERT INTO `stg_notes_stage` (`id`, `note`, `appreciation`, `createdAt`, `updatedAt`, `deletedAt`, `demandeStageId`, `enseignantId`) VALUES
(1, '17.20', 'Bon travail', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 1, 2),
(2, '18.12', 'Bon travail', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 2, 2),
(3, '15.19', 'Bon travail', '2026-07-02 18:09:18', '2026-07-02 18:09:18', NULL, 3, 2);

-- --------------------------------------------------------

--
-- Structure de la table `stg_offres_stage`
--

CREATE TABLE IF NOT EXISTS `stg_offres_stage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `dateDebut` date NOT NULL,
  `dateFin` date NOT NULL,
  `lieu` varchar(255) NOT NULL,
  `nombrePlaces` int(11) DEFAULT '1',
  `statut` enum('ouvert','ferme') DEFAULT 'ouvert',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `institutionId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `institutionId` (`institutionId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `stg_offres_stage`
--

INSERT INTO `stg_offres_stage` (`id`, `titre`, `description`, `dateDebut`, `dateFin`, `lieu`, `nombrePlaces`, `statut`, `createdAt`, `updatedAt`, `deletedAt`, `institutionId`) VALUES
(1, 'Stage Développeur Web', 'Développement d''applications web', '2025-01-15', '2025-04-15', 'Abidjan', 1, 'ouvert', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, NULL),
(2, 'Stage Assistant Comptable', 'Comptabilité et reporting', '2025-02-01', '2025-05-31', 'Abidjan', 1, 'ouvert', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, NULL),
(3, 'Stage Marketing Digital', 'Community management et SEO', '2025-03-01', '2025-06-01', 'Abidjan', 1, 'ouvert', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `stg_rapports_stage`
--

CREATE TABLE IF NOT EXISTS `stg_rapports_stage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fichier` varchar(255) NOT NULL,
  `dateSoumission` datetime NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `demandeStageId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `demandeStageId` (`demandeStageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `stg_tuteurs`
--

CREATE TABLE IF NOT EXISTS `stg_tuteurs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `fonction` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `entrepriseId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entrepriseId` (`entrepriseId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=4 ;

--
-- Contenu de la table `stg_tuteurs`
--

INSERT INTO `stg_tuteurs` (`id`, `nom`, `fonction`, `email`, `telephone`, `createdAt`, `updatedAt`, `deletedAt`, `entrepriseId`) VALUES
(1, 'Kouamé', 'Responsable RH', 'paul.kouame@orange.ci', '+22507010101', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(2, 'Koné', 'Directeur Financier', 'moussa.kone@ecobank.ci', '+22507020202', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2),
(3, 'Soro', 'Chef de Projet', 'aminata.soro@sifca.ci', '+22507030303', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3);

-- --------------------------------------------------------

--
-- Structure de la table `stk_article`
--

CREATE TABLE IF NOT EXISTS `stk_article` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `reference` varchar(255) NOT NULL,
  `description` text,
  `siteId` int(10) unsigned DEFAULT NULL,
  `stockActuel` int(11) DEFAULT '0',
  `stockMinimum` int(11) DEFAULT '5',
  `prixUnitaire` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `categorieId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  UNIQUE KEY `reference_2` (`reference`),
  UNIQUE KEY `reference_3` (`reference`),
  UNIQUE KEY `reference_4` (`reference`),
  UNIQUE KEY `reference_5` (`reference`),
  UNIQUE KEY `reference_6` (`reference`),
  UNIQUE KEY `reference_7` (`reference`),
  UNIQUE KEY `reference_8` (`reference`),
  UNIQUE KEY `reference_9` (`reference`),
  UNIQUE KEY `reference_10` (`reference`),
  UNIQUE KEY `reference_11` (`reference`),
  UNIQUE KEY `reference_12` (`reference`),
  UNIQUE KEY `reference_13` (`reference`),
  KEY `siteId` (`siteId`),
  KEY `categorieId` (`categorieId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `stk_article`
--

INSERT INTO `stk_article` (`id`, `nom`, `reference`, `description`, `siteId`, `stockActuel`, `stockMinimum`, `prixUnitaire`, `createdAt`, `updatedAt`, `deletedAt`, `categorieId`) VALUES
(1, 'Ramette de papier A4', 'REF-001', NULL, NULL, 200, 20, '5000.00', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(2, 'Stylo bleu (boîte de 50)', 'REF-002', NULL, NULL, 50, 10, '7500.00', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1),
(3, 'Clavier USB', 'REF-003', NULL, NULL, 30, 5, '15000.00', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2),
(4, 'Souris optique', 'REF-004', NULL, NULL, 25, 5, '10000.00', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 2),
(5, 'Marqueur tableau (boîte de 10)', 'REF-005', NULL, NULL, 40, 10, '4500.00', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `stk_bon_commande`
--

CREATE TABLE IF NOT EXISTS `stk_bon_commande` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `siteId` int(10) unsigned DEFAULT NULL,
  `dateCommande` datetime NOT NULL DEFAULT '2026-07-06 14:44:16',
  `dateLivraisonPrevue` date DEFAULT NULL,
  `statut` enum('en_attente','livree','annulee') DEFAULT 'en_attente',
  `montantTotal` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `fournisseurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `siteId` (`siteId`),
  KEY `fournisseurId` (`fournisseurId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `stk_categorie_article`
--

CREATE TABLE IF NOT EXISTS `stk_categorie_article` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `description` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom` (`nom`),
  UNIQUE KEY `nom_2` (`nom`),
  UNIQUE KEY `nom_3` (`nom`),
  UNIQUE KEY `nom_4` (`nom`),
  UNIQUE KEY `nom_5` (`nom`),
  UNIQUE KEY `nom_6` (`nom`),
  UNIQUE KEY `nom_7` (`nom`),
  UNIQUE KEY `nom_8` (`nom`),
  UNIQUE KEY `nom_9` (`nom`),
  UNIQUE KEY `nom_10` (`nom`),
  UNIQUE KEY `nom_11` (`nom`),
  UNIQUE KEY `nom_12` (`nom`),
  UNIQUE KEY `nom_13` (`nom`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `stk_categorie_article`
--

INSERT INTO `stk_categorie_article` (`id`, `nom`, `description`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Fournitures de bureau', 'Papeterie et consommables', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Matériel informatique', 'Ordinateurs et accessoires', '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `stk_fournisseur`
--

CREATE TABLE IF NOT EXISTS `stk_fournisseur` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `adresse` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Contenu de la table `stk_fournisseur`
--

INSERT INTO `stk_fournisseur` (`id`, `nom`, `contact`, `email`, `telephone`, `adresse`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Bureau Plus', NULL, 'commandes@bureauplus.ci', '+22521212121', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL),
(2, 'Informatique Pro', NULL, 'ventes@infopro.ci', '+22522222222', NULL, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `stk_ligne_bon_commande`
--

CREATE TABLE IF NOT EXISTS `stk_ligne_bon_commande` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quantite` int(11) NOT NULL,
  `prixUnitaire` decimal(10,2) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `bonCommandeId` int(10) unsigned DEFAULT NULL,
  `articleId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bonCommandeId` (`bonCommandeId`),
  KEY `articleId` (`articleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `stk_mouvement_stock`
--

CREATE TABLE IF NOT EXISTS `stk_mouvement_stock` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('entree','sortie') NOT NULL,
  `quantite` int(11) NOT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `siteId` int(10) unsigned DEFAULT NULL,
  `prixUnitaire` decimal(10,2) DEFAULT NULL,
  `dateMouvement` datetime NOT NULL DEFAULT '2026-07-06 14:44:16',
  `utilisateurId` int(11) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deletedAt` datetime DEFAULT NULL,
  `articleId` int(10) unsigned DEFAULT NULL,
  `fournisseurId` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `siteId` (`siteId`),
  KEY `articleId` (`articleId`),
  KEY `fournisseurId` (`fournisseurId`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `stk_mouvement_stock`
--

INSERT INTO `stk_mouvement_stock` (`id`, `type`, `quantite`, `motif`, `siteId`, `prixUnitaire`, `dateMouvement`, `utilisateurId`, `createdAt`, `updatedAt`, `deletedAt`, `articleId`, `fournisseurId`) VALUES
(1, 'entree', 50, NULL, NULL, NULL, '2026-07-02 18:09:17', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, 1),
(2, 'sortie', 10, NULL, NULL, NULL, '2026-07-02 18:09:17', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 1, NULL),
(3, 'entree', 20, NULL, NULL, NULL, '2026-07-02 18:09:17', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, 2),
(4, 'sortie', 5, NULL, NULL, NULL, '2026-07-02 18:09:17', 1, '2026-07-02 18:09:17', '2026-07-02 18:09:17', NULL, 3, NULL);

--
-- Contraintes pour les tables exportées
--

--
-- Contraintes pour la table `ach_budgets`
--
ALTER TABLE `ach_budgets`
  ADD CONSTRAINT `ach_budgets_ibfk_1` FOREIGN KEY (`departementId`) REFERENCES `imm_departement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_commandes`
--
ALTER TABLE `ach_commandes`
  ADD CONSTRAINT `ach_commandes_ibfk_23` FOREIGN KEY (`demandeId`) REFERENCES `ach_demandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ach_commandes_ibfk_24` FOREIGN KEY (`fournisseurId`) REFERENCES `ach_fournisseurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_demandes`
--
ALTER TABLE `ach_demandes`
  ADD CONSTRAINT `ach_demandes_ibfk_1` FOREIGN KEY (`soumisParId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_engagements`
--
ALTER TABLE `ach_engagements`
  ADD CONSTRAINT `ach_engagements_ibfk_23` FOREIGN KEY (`demandeId`) REFERENCES `ach_demandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ach_engagements_ibfk_24` FOREIGN KEY (`budgetId`) REFERENCES `ach_budgets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_factures_proforma`
--
ALTER TABLE `ach_factures_proforma`
  ADD CONSTRAINT `ach_factures_proforma_ibfk_1` FOREIGN KEY (`commandeId`) REFERENCES `ach_commandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_lignes_budget`
--
ALTER TABLE `ach_lignes_budget`
  ADD CONSTRAINT `ach_lignes_budget_ibfk_23` FOREIGN KEY (`categorieAchatId`) REFERENCES `ach_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ach_lignes_budget_ibfk_24` FOREIGN KEY (`budgetId`) REFERENCES `ach_budgets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_lignes_commande`
--
ALTER TABLE `ach_lignes_commande`
  ADD CONSTRAINT `ach_lignes_commande_ibfk_1` FOREIGN KEY (`commandeId`) REFERENCES `ach_commandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_lignes_demande`
--
ALTER TABLE `ach_lignes_demande`
  ADD CONSTRAINT `ach_lignes_demande_ibfk_1` FOREIGN KEY (`demandeId`) REFERENCES `ach_demandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_lignes_facture`
--
ALTER TABLE `ach_lignes_facture`
  ADD CONSTRAINT `ach_lignes_facture_ibfk_23` FOREIGN KEY (`ligneCommandeId`) REFERENCES `ach_lignes_commande` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ach_lignes_facture_ibfk_24` FOREIGN KEY (`factureId`) REFERENCES `ach_factures_proforma` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_lignes_reception`
--
ALTER TABLE `ach_lignes_reception`
  ADD CONSTRAINT `ach_lignes_reception_ibfk_23` FOREIGN KEY (`receptionId`) REFERENCES `ach_receptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ach_lignes_reception_ibfk_24` FOREIGN KEY (`ligneCommandeId`) REFERENCES `ach_lignes_commande` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_receptions`
--
ALTER TABLE `ach_receptions`
  ADD CONSTRAINT `ach_receptions_ibfk_1` FOREIGN KEY (`commandeId`) REFERENCES `ach_commandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_validateurs`
--
ALTER TABLE `ach_validateurs`
  ADD CONSTRAINT `ach_validateurs_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ach_validations`
--
ALTER TABLE `ach_validations`
  ADD CONSTRAINT `ach_validations_ibfk_23` FOREIGN KEY (`demandeId`) REFERENCES `ach_demandes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ach_validations_ibfk_24` FOREIGN KEY (`validateurId`) REFERENCES `ach_validateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_adresses_apprenants`
--
ALTER TABLE `aut_adresses_apprenants`
  ADD CONSTRAINT `aut_adresses_apprenants_ibfk_1` FOREIGN KEY (`apprenantId`) REFERENCES `aut_apprenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_adresses_caissiers_banque`
--
ALTER TABLE `aut_adresses_caissiers_banque`
  ADD CONSTRAINT `aut_adresses_caissiers_banque_ibfk_1` FOREIGN KEY (`caissierBanqueId`) REFERENCES `aut_caissiers_banque` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_adresses_enseignants`
--
ALTER TABLE `aut_adresses_enseignants`
  ADD CONSTRAINT `aut_adresses_enseignants_ibfk_1` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_adresses_institutions`
--
ALTER TABLE `aut_adresses_institutions`
  ADD CONSTRAINT `aut_adresses_institutions_ibfk_1` FOREIGN KEY (`institutionId`) REFERENCES `aut_institutions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_apprenants`
--
ALTER TABLE `aut_apprenants`
  ADD CONSTRAINT `aut_apprenants_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_caissiers_banque`
--
ALTER TABLE `aut_caissiers_banque`
  ADD CONSTRAINT `aut_caissiers_banque_ibfk_25` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `aut_caissiers_banque_ibfk_26` FOREIGN KEY (`banqueId`) REFERENCES `aut_banques` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_comite_orientations`
--
ALTER TABLE `aut_comite_orientations`
  ADD CONSTRAINT `aut_comite_orientations_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_enseignants`
--
ALTER TABLE `aut_enseignants`
  ADD CONSTRAINT `aut_enseignants_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_identites_apprenants`
--
ALTER TABLE `aut_identites_apprenants`
  ADD CONSTRAINT `aut_identites_apprenants_ibfk_1` FOREIGN KEY (`apprenantId`) REFERENCES `aut_apprenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_informations_parents_apprenants`
--
ALTER TABLE `aut_informations_parents_apprenants`
  ADD CONSTRAINT `aut_informations_parents_apprenants_ibfk_1` FOREIGN KEY (`apprenantId`) REFERENCES `aut_apprenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_informations_salarie_apprenants`
--
ALTER TABLE `aut_informations_salarie_apprenants`
  ADD CONSTRAINT `aut_informations_salarie_apprenants_ibfk_1` FOREIGN KEY (`apprenantId`) REFERENCES `aut_apprenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_institutions`
--
ALTER TABLE `aut_institutions`
  ADD CONSTRAINT `aut_institutions_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_personnes_prevenir_apprenants`
--
ALTER TABLE `aut_personnes_prevenir_apprenants`
  ADD CONSTRAINT `aut_personnes_prevenir_apprenants_ibfk_1` FOREIGN KEY (`apprenantId`) REFERENCES `aut_apprenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_role_permissions`
--
ALTER TABLE `aut_role_permissions`
  ADD CONSTRAINT `aut_role_permissions_ibfk_25` FOREIGN KEY (`roleId`) REFERENCES `aut_roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `aut_role_permissions_ibfk_26` FOREIGN KEY (`permissionId`) REFERENCES `aut_permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_user_permissions`
--
ALTER TABLE `aut_user_permissions`
  ADD CONSTRAINT `aut_user_permissions_ibfk_25` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `aut_user_permissions_ibfk_26` FOREIGN KEY (`permissionId`) REFERENCES `aut_permissions` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `aut_user_roles`
--
ALTER TABLE `aut_user_roles`
  ADD CONSTRAINT `aut_user_roles_ibfk_25` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `aut_user_roles_ibfk_26` FOREIGN KEY (`roleId`) REFERENCES `aut_roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `com_reponses_suggestion`
--
ALTER TABLE `com_reponses_suggestion`
  ADD CONSTRAINT `com_reponses_suggestion_ibfk_23` FOREIGN KEY (`suggestionId`) REFERENCES `com_suggestions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `com_reponses_suggestion_ibfk_24` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `com_suggestions`
--
ALTER TABLE `com_suggestions`
  ADD CONSTRAINT `com_suggestions_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `cpt_ecritures_comptables`
--
ALTER TABLE `cpt_ecritures_comptables`
  ADD CONSTRAINT `cpt_ecritures_comptables_ibfk_56` FOREIGN KEY (`journalId`) REFERENCES `cpt_journaux_comptables` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `cpt_ecritures_comptables_ibfk_57` FOREIGN KEY (`compteDebitId`) REFERENCES `cpt_comptes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `cpt_ecritures_comptables_ibfk_58` FOREIGN KEY (`compteCreditId`) REFERENCES `cpt_comptes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `cpt_ecritures_comptables_ibfk_59` FOREIGN KEY (`utilisateurSaisieId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `cpt_ecritures_comptables_ibfk_60` FOREIGN KEY (`utilisateurValidationId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_certificats`
--
ALTER TABLE `elearning_certificats`
  ADD CONSTRAINT `elearning_certificats_ibfk_23` FOREIGN KEY (`coursId`) REFERENCES `elearning_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `elearning_certificats_ibfk_24` FOREIGN KEY (`apprenantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_commentaires`
--
ALTER TABLE `elearning_commentaires`
  ADD CONSTRAINT `elearning_commentaires_ibfk_1` FOREIGN KEY (`supportId`) REFERENCES `elearning_supports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_couplages_mail`
--
ALTER TABLE `elearning_couplages_mail`
  ADD CONSTRAINT `elearning_couplages_mail_ibfk_1` FOREIGN KEY (`supportId`) REFERENCES `elearning_supports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_devoirs`
--
ALTER TABLE `elearning_devoirs`
  ADD CONSTRAINT `elearning_devoirs_ibfk_23` FOREIGN KEY (`coursId`) REFERENCES `elearning_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `elearning_devoirs_ibfk_24` FOREIGN KEY (`enseignantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_messages`
--
ALTER TABLE `elearning_messages`
  ADD CONSTRAINT `elearning_messages_ibfk_1` FOREIGN KEY (`salonId`) REFERENCES `elearning_salons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_modules`
--
ALTER TABLE `elearning_modules`
  ADD CONSTRAINT `elearning_modules_ibfk_1` FOREIGN KEY (`coursId`) REFERENCES `elearning_cours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_participants_salon`
--
ALTER TABLE `elearning_participants_salon`
  ADD CONSTRAINT `elearning_participants_salon_ibfk_1` FOREIGN KEY (`salonId`) REFERENCES `elearning_salons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_quiz`
--
ALTER TABLE `elearning_quiz`
  ADD CONSTRAINT `elearning_quiz_ibfk_1` FOREIGN KEY (`coursId`) REFERENCES `elearning_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_reponses_quiz`
--
ALTER TABLE `elearning_reponses_quiz`
  ADD CONSTRAINT `elearning_reponses_quiz_ibfk_23` FOREIGN KEY (`quizId`) REFERENCES `elearning_quiz` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `elearning_reponses_quiz_ibfk_24` FOREIGN KEY (`apprenantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_salons`
--
ALTER TABLE `elearning_salons`
  ADD CONSTRAINT `elearning_salons_ibfk_1` FOREIGN KEY (`coursId`) REFERENCES `elearning_cours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_soumissions_devoirs`
--
ALTER TABLE `elearning_soumissions_devoirs`
  ADD CONSTRAINT `elearning_soumissions_devoirs_ibfk_23` FOREIGN KEY (`devoirId`) REFERENCES `elearning_devoirs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `elearning_soumissions_devoirs_ibfk_24` FOREIGN KEY (`apprenantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `elearning_supports`
--
ALTER TABLE `elearning_supports`
  ADD CONSTRAINT `elearning_supports_ibfk_1` FOREIGN KEY (`moduleId`) REFERENCES `elearning_modules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ged_documents`
--
ALTER TABLE `ged_documents`
  ADD CONSTRAINT `ged_documents_ibfk_3` FOREIGN KEY (`uploaderId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ged_documents_ibfk_4` FOREIGN KEY (`folderId`) REFERENCES `ged_folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ged_folders`
--
ALTER TABLE `ged_folders`
  ADD CONSTRAINT `ged_folders_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_acquisition`
--
ALTER TABLE `imm_acquisition`
  ADD CONSTRAINT `imm_acquisition_ibfk_1` FOREIGN KEY (`immobilisationId`) REFERENCES `imm_immobilisation` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_amortissement`
--
ALTER TABLE `imm_amortissement`
  ADD CONSTRAINT `imm_amortissement_ibfk_1` FOREIGN KEY (`immobilisationId`) REFERENCES `imm_immobilisation` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_batiment`
--
ALTER TABLE `imm_batiment`
  ADD CONSTRAINT `imm_batiment_ibfk_1` FOREIGN KEY (`siteId`) REFERENCES `imm_site` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_cession`
--
ALTER TABLE `imm_cession`
  ADD CONSTRAINT `imm_cession_ibfk_1` FOREIGN KEY (`immobilisationId`) REFERENCES `imm_immobilisation` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_immobilisation`
--
ALTER TABLE `imm_immobilisation`
  ADD CONSTRAINT `imm_immobilisation_ibfk_49` FOREIGN KEY (`categorieId`) REFERENCES `imm_categorie_immobilisation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `imm_immobilisation_ibfk_50` FOREIGN KEY (`localisationId`) REFERENCES `imm_localisation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `imm_immobilisation_ibfk_51` FOREIGN KEY (`departementId`) REFERENCES `imm_departement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `imm_immobilisation_ibfk_52` FOREIGN KEY (`siteId`) REFERENCES `imm_site` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_localisation`
--
ALTER TABLE `imm_localisation`
  ADD CONSTRAINT `imm_localisation_ibfk_1` FOREIGN KEY (`batimentId`) REFERENCES `imm_batiment` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_maintenance`
--
ALTER TABLE `imm_maintenance`
  ADD CONSTRAINT `imm_maintenance_ibfk_1` FOREIGN KEY (`immobilisationId`) REFERENCES `imm_immobilisation` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `imm_maintenance_programmee`
--
ALTER TABLE `imm_maintenance_programmee`
  ADD CONSTRAINT `imm_maintenance_programmee_ibfk_1` FOREIGN KEY (`immobilisationId`) REFERENCES `imm_immobilisation` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_absences`
--
ALTER TABLE `ins_absences`
  ADD CONSTRAINT `ins_absences_ibfk_1` FOREIGN KEY (`noteEvaluationId`) REFERENCES `ins_notes_evaluation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_audit_notes`
--
ALTER TABLE `ins_audit_notes`
  ADD CONSTRAINT `ins_audit_notes_ibfk_19` FOREIGN KEY (`noteEvaluationId`) REFERENCES `ins_notes_evaluation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_audit_notes_ibfk_20` FOREIGN KEY (`modifiePar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_blocs_cahier_de_texte`
--
ALTER TABLE `ins_blocs_cahier_de_texte`
  ADD CONSTRAINT `ins_blocs_cahier_de_texte_ibfk_1` FOREIGN KEY (`cahierDeTexteId`) REFERENCES `ins_cahiers_de_texte` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_bordereaux`
--
ALTER TABLE `ins_bordereaux`
  ADD CONSTRAINT `ins_bordereaux_ibfk_25` FOREIGN KEY (`valideParId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bordereaux_ibfk_26` FOREIGN KEY (`echeanceId`) REFERENCES `ins_echeances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bordereaux_ibfk_27` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_bulletins`
--
ALTER TABLE `ins_bulletins`
  ADD CONSTRAINT `ins_bulletins_ibfk_73` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bulletins_ibfk_74` FOREIGN KEY (`cursusApprenantId`) REFERENCES `ins_cursus_apprenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bulletins_ibfk_75` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bulletins_ibfk_76` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bulletins_ibfk_77` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_bulletins_ibfk_78` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_cahiers_de_texte`
--
ALTER TABLE `ins_cahiers_de_texte`
  ADD CONSTRAINT `ins_cahiers_de_texte_ibfk_25` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cahiers_de_texte_ibfk_26` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_chapitres_cours`
--
ALTER TABLE `ins_chapitres_cours`
  ADD CONSTRAINT `ins_chapitres_cours_ibfk_1` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_classes`
--
ALTER TABLE `ins_classes`
  ADD CONSTRAINT `ins_classes_ibfk_1` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_cours`
--
ALTER TABLE `ins_cours`
  ADD CONSTRAINT `ins_cours_ibfk_37` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cours_ibfk_38` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cours_ibfk_39` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_cours_choisis`
--
ALTER TABLE `ins_cours_choisis`
  ADD CONSTRAINT `ins_cours_choisis_ibfk_1` FOREIGN KEY (`demandeInscriptionId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cours_choisis_ibfk_2` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_cours_participants`
--
ALTER TABLE `ins_cours_participants`
  ADD CONSTRAINT `ins_cours_participants_ibfk_37` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cours_participants_ibfk_38` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cours_participants_ibfk_39` FOREIGN KEY (`cursusApprenantId`) REFERENCES `ins_cursus_apprenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_cursus_apprenants`
--
ALTER TABLE `ins_cursus_apprenants`
  ADD CONSTRAINT `ins_cursus_apprenants_ibfk_73` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cursus_apprenants_ibfk_74` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cursus_apprenants_ibfk_75` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cursus_apprenants_ibfk_76` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cursus_apprenants_ibfk_77` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_cursus_apprenants_ibfk_78` FOREIGN KEY (`demandeInscriptionId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_deliberations`
--
ALTER TABLE `ins_deliberations`
  ADD CONSTRAINT `ins_deliberations_ibfk_25` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_deliberations_ibfk_26` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_demandes_inscription`
--
ALTER TABLE `ins_demandes_inscription`
  ADD CONSTRAINT `ins_demandes_inscription_ibfk_25` FOREIGN KEY (`sessionId`) REFERENCES `ins_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_demandes_inscription_ibfk_26` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_dispenses`
--
ALTER TABLE `ins_dispenses`
  ADD CONSTRAINT `ins_dispenses_ibfk_28` FOREIGN KEY (`cursusApprenantId`) REFERENCES `ins_cursus_apprenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_dispenses_ibfk_29` FOREIGN KEY (`ueId`) REFERENCES `ins_unites_enseignement` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_dispenses_ibfk_30` FOREIGN KEY (`validePar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_dossiers_demandes`
--
ALTER TABLE `ins_dossiers_demandes`
  ADD CONSTRAINT `ins_dossiers_demandes_ibfk_1` FOREIGN KEY (`demandeId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_dossiers_demandes_ibfk_2` FOREIGN KEY (`dossierId`) REFERENCES `ins_dossiers_inscription` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_dossiers_etudiants`
--
ALTER TABLE `ins_dossiers_etudiants`
  ADD CONSTRAINT `ins_dossiers_etudiants_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_dossiers_inscription`
--
ALTER TABLE `ins_dossiers_inscription`
  ADD CONSTRAINT `ins_dossiers_inscription_ibfk_1` FOREIGN KEY (`sessionId`) REFERENCES `ins_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_echeances`
--
ALTER TABLE `ins_echeances`
  ADD CONSTRAINT `ins_echeances_ibfk_1` FOREIGN KEY (`dossierEtudiantId`) REFERENCES `ins_dossiers_etudiants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_equivalences`
--
ALTER TABLE `ins_equivalences`
  ADD CONSTRAINT `ins_equivalences_ibfk_28` FOREIGN KEY (`cursusApprenantId`) REFERENCES `ins_cursus_apprenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_equivalences_ibfk_29` FOREIGN KEY (`coursDestinationId`) REFERENCES `ins_cours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_equivalences_ibfk_30` FOREIGN KEY (`validePar`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_fichiers_ressources`
--
ALTER TABLE `ins_fichiers_ressources`
  ADD CONSTRAINT `ins_fichiers_ressources_ibfk_1` FOREIGN KEY (`ressourceId`) REFERENCES `ins_ressources` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_frais_inscription`
--
ALTER TABLE `ins_frais_inscription`
  ADD CONSTRAINT `ins_frais_inscription_ibfk_1` FOREIGN KEY (`sessionId`) REFERENCES `ins_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_jury_membres`
--
ALTER TABLE `ins_jury_membres`
  ADD CONSTRAINT `ins_jury_membres_ibfk_19` FOREIGN KEY (`deliberationId`) REFERENCES `ins_deliberations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_jury_membres_ibfk_20` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_lignes_bulletins`
--
ALTER TABLE `ins_lignes_bulletins`
  ADD CONSTRAINT `ins_lignes_bulletins_ibfk_25` FOREIGN KEY (`bulletinId`) REFERENCES `ins_bulletins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_lignes_bulletins_ibfk_26` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_listes_notes_evaluation`
--
ALTER TABLE `ins_listes_notes_evaluation`
  ADD CONSTRAINT `ins_listes_notes_evaluation_ibfk_49` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_listes_notes_evaluation_ibfk_50` FOREIGN KEY (`typeNoteEvaluationId`) REFERENCES `ins_types_note_evaluation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_listes_notes_evaluation_ibfk_51` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_listes_notes_evaluation_ibfk_52` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_listes_presences`
--
ALTER TABLE `ins_listes_presences`
  ADD CONSTRAINT `ins_listes_presences_ibfk_25` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_listes_presences_ibfk_26` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_mcc`
--
ALTER TABLE `ins_mcc`
  ADD CONSTRAINT `ins_mcc_ibfk_19` FOREIGN KEY (`ueId`) REFERENCES `ins_unites_enseignement` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_mcc_ibfk_20` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_notes_evaluation`
--
ALTER TABLE `ins_notes_evaluation`
  ADD CONSTRAINT `ins_notes_evaluation_ibfk_25` FOREIGN KEY (`listeNoteEvaluationId`) REFERENCES `ins_listes_notes_evaluation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_notes_evaluation_ibfk_26` FOREIGN KEY (`coursParticipantId`) REFERENCES `ins_cours_participants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_paiements_inscription`
--
ALTER TABLE `ins_paiements_inscription`
  ADD CONSTRAINT `ins_paiements_inscription_ibfk_25` FOREIGN KEY (`matriculeInscription`) REFERENCES `ins_demandes_inscription` (`matricule`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_paiements_inscription_ibfk_26` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_parcours`
--
ALTER TABLE `ins_parcours`
  ADD CONSTRAINT `ins_parcours_ibfk_1` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_parcours_choisis`
--
ALTER TABLE `ins_parcours_choisis`
  ADD CONSTRAINT `ins_parcours_choisis_ibfk_25` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_parcours_choisis_ibfk_26` FOREIGN KEY (`demandeInscriptionId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_pointages`
--
ALTER TABLE `ins_pointages`
  ADD CONSTRAINT `ins_pointages_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_prerequis_parcours`
--
ALTER TABLE `ins_prerequis_parcours`
  ADD CONSTRAINT `ins_prerequis_parcours_ibfk_37` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_prerequis_parcours_ibfk_38` FOREIGN KEY (`matierePrerequisId`) REFERENCES `ins_matieres_prerequis` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_prerequis_parcours_ibfk_39` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_prerequis_parcours_choisis`
--
ALTER TABLE `ins_prerequis_parcours_choisis`
  ADD CONSTRAINT `ins_prerequis_parcours_choisis_ibfk_25` FOREIGN KEY (`prerequisParcoursId`) REFERENCES `ins_prerequis_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_prerequis_parcours_choisis_ibfk_26` FOREIGN KEY (`parcoursChoisiId`) REFERENCES `ins_parcours_choisis` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_presences`
--
ALTER TABLE `ins_presences`
  ADD CONSTRAINT `ins_presences_ibfk_1` FOREIGN KEY (`listePresenceId`) REFERENCES `ins_listes_presences` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_presences_cours_participants`
--
ALTER TABLE `ins_presences_cours_participants`
  ADD CONSTRAINT `ins_presences_cours_participants_ibfk_25` FOREIGN KEY (`coursParticipantId`) REFERENCES `ins_cours_participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_presences_cours_participants_ibfk_26` FOREIGN KEY (`presenceId`) REFERENCES `ins_presences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_pre_inscriptions`
--
ALTER TABLE `ins_pre_inscriptions`
  ADD CONSTRAINT `ins_pre_inscriptions_ibfk_25` FOREIGN KEY (`demandeInscriptionId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_pre_inscriptions_ibfk_26` FOREIGN KEY (`traiteParId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_quitus`
--
ALTER TABLE `ins_quitus`
  ADD CONSTRAINT `ins_quitus_ibfk_25` FOREIGN KEY (`paiementInscriptionId`) REFERENCES `ins_paiements_inscription` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_quitus_ibfk_26` FOREIGN KEY (`bordereauId`) REFERENCES `ins_bordereaux` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_regles_evaluation`
--
ALTER TABLE `ins_regles_evaluation`
  ADD CONSTRAINT `ins_regles_evaluation_ibfk_1` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_reponses_inscription`
--
ALTER TABLE `ins_reponses_inscription`
  ADD CONSTRAINT `ins_reponses_inscription_ibfk_25` FOREIGN KEY (`demandeInscriptionId`) REFERENCES `ins_demandes_inscription` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_reponses_inscription_ibfk_26` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_ressources`
--
ALTER TABLE `ins_ressources`
  ADD CONSTRAINT `ins_ressources_ibfk_1` FOREIGN KEY (`chapitreCoursId`) REFERENCES `ins_chapitres_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_resultats_deliberation`
--
ALTER TABLE `ins_resultats_deliberation`
  ADD CONSTRAINT `ins_resultats_deliberation_ibfk_25` FOREIGN KEY (`deliberationId`) REFERENCES `ins_deliberations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_resultats_deliberation_ibfk_26` FOREIGN KEY (`cursusApprenantId`) REFERENCES `ins_cursus_apprenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_salles_de_classes`
--
ALTER TABLE `ins_salles_de_classes`
  ADD CONSTRAINT `ins_salles_de_classes_ibfk_1` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_seances`
--
ALTER TABLE `ins_seances`
  ADD CONSTRAINT `ins_seances_ibfk_37` FOREIGN KEY (`salleDeClasseId`) REFERENCES `ins_salles_de_classes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_seances_ibfk_38` FOREIGN KEY (`coursId`) REFERENCES `ins_cours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_seances_ibfk_39` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_sessions`
--
ALTER TABLE `ins_sessions`
  ADD CONSTRAINT `ins_sessions_ibfk_25` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ins_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_sessions_ibfk_26` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_sessions_examens`
--
ALTER TABLE `ins_sessions_examens`
  ADD CONSTRAINT `ins_sessions_examens_ibfk_19` FOREIGN KEY (`classeId`) REFERENCES `ins_classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ins_sessions_examens_ibfk_20` FOREIGN KEY (`anneeAcademiqueId`) REFERENCES `ins_annees_academiques` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ins_unites_enseignement`
--
ALTER TABLE `ins_unites_enseignement`
  ADD CONSTRAINT `ins_unites_enseignement_ibfk_1` FOREIGN KEY (`parcoursId`) REFERENCES `ins_parcours` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_debouches_parcours`
--
ALTER TABLE `ori_debouches_parcours`
  ADD CONSTRAINT `ori_debouches_parcours_ibfk_1` FOREIGN KEY (`parcoursId`) REFERENCES `ori_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_demandes_orientation`
--
ALTER TABLE `ori_demandes_orientation`
  ADD CONSTRAINT `ori_demandes_orientation_ibfk_1` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_panier_parcours_choisis`
--
ALTER TABLE `ori_panier_parcours_choisis`
  ADD CONSTRAINT `ori_panier_parcours_choisis_ibfk_25` FOREIGN KEY (`parcoursChoisiId`) REFERENCES `ori_parcours_choisis` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_panier_parcours_choisis_ibfk_26` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_parcours`
--
ALTER TABLE `ori_parcours`
  ADD CONSTRAINT `ori_parcours_ibfk_25` FOREIGN KEY (`categorieId`) REFERENCES `ori_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_parcours_ibfk_26` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ori_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_parcours_choisis`
--
ALTER TABLE `ori_parcours_choisis`
  ADD CONSTRAINT `ori_parcours_choisis_ibfk_25` FOREIGN KEY (`parcoursId`) REFERENCES `ori_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_parcours_choisis_ibfk_26` FOREIGN KEY (`demandeOrientationId`) REFERENCES `ori_demandes_orientation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_prerequis_parcours`
--
ALTER TABLE `ori_prerequis_parcours`
  ADD CONSTRAINT `ori_prerequis_parcours_ibfk_37` FOREIGN KEY (`niveauEtudeId`) REFERENCES `ori_niveaux_etudes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_prerequis_parcours_ibfk_38` FOREIGN KEY (`matierePrerequisId`) REFERENCES `ori_matieres_prerequis` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_prerequis_parcours_ibfk_39` FOREIGN KEY (`parcoursId`) REFERENCES `ori_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_prerequis_parcours_choisis`
--
ALTER TABLE `ori_prerequis_parcours_choisis`
  ADD CONSTRAINT `ori_prerequis_parcours_choisis_ibfk_25` FOREIGN KEY (`parcoursChoisiId`) REFERENCES `ori_parcours_choisis` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_prerequis_parcours_choisis_ibfk_26` FOREIGN KEY (`prerequisParcoursId`) REFERENCES `ori_prerequis_parcours` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `ori_reponses_orientation`
--
ALTER TABLE `ori_reponses_orientation`
  ADD CONSTRAINT `ori_reponses_orientation_ibfk_25` FOREIGN KEY (`demandeOrientationId`) REFERENCES `ori_demandes_orientation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ori_reponses_orientation_ibfk_26` FOREIGN KEY (`utilisateurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_bulletins_paie`
--
ALTER TABLE `rh_bulletins_paie`
  ADD CONSTRAINT `rh_bulletins_paie_ibfk_23` FOREIGN KEY (`periodeId`) REFERENCES `rh_periodes_paie` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rh_bulletins_paie_ibfk_24` FOREIGN KEY (`employeId`) REFERENCES `rh_employes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_candidatures`
--
ALTER TABLE `rh_candidatures`
  ADD CONSTRAINT `rh_candidatures_ibfk_1` FOREIGN KEY (`offreId`) REFERENCES `rh_offres_emploi` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_employes`
--
ALTER TABLE `rh_employes`
  ADD CONSTRAINT `rh_employes_ibfk_34` FOREIGN KEY (`departementId`) REFERENCES `rh_departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rh_employes_ibfk_35` FOREIGN KEY (`posteId`) REFERENCES `rh_postes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rh_employes_ibfk_36` FOREIGN KEY (`typeContratId`) REFERENCES `rh_types_contrat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_entretiens`
--
ALTER TABLE `rh_entretiens`
  ADD CONSTRAINT `rh_entretiens_ibfk_1` FOREIGN KEY (`candidatureId`) REFERENCES `rh_candidatures` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_evaluations_criteres`
--
ALTER TABLE `rh_evaluations_criteres`
  ADD CONSTRAINT `rh_evaluations_criteres_ibfk_23` FOREIGN KEY (`ficheId`) REFERENCES `rh_fiches_evaluation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rh_evaluations_criteres_ibfk_24` FOREIGN KEY (`critereId`) REFERENCES `rh_criteres_evaluation` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_fiches_evaluation`
--
ALTER TABLE `rh_fiches_evaluation`
  ADD CONSTRAINT `rh_fiches_evaluation_ibfk_1` FOREIGN KEY (`employeId`) REFERENCES `rh_employes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_lignes_bulletin`
--
ALTER TABLE `rh_lignes_bulletin`
  ADD CONSTRAINT `rh_lignes_bulletin_ibfk_23` FOREIGN KEY (`bulletinId`) REFERENCES `rh_bulletins_paie` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rh_lignes_bulletin_ibfk_24` FOREIGN KEY (`rubriqueId`) REFERENCES `rh_rubriques_paie` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_offres_emploi`
--
ALTER TABLE `rh_offres_emploi`
  ADD CONSTRAINT `rh_offres_emploi_ibfk_1` FOREIGN KEY (`posteId`) REFERENCES `rh_postes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_participations_formation`
--
ALTER TABLE `rh_participations_formation`
  ADD CONSTRAINT `rh_participations_formation_ibfk_23` FOREIGN KEY (`formationId`) REFERENCES `rh_formations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `rh_participations_formation_ibfk_24` FOREIGN KEY (`employeId`) REFERENCES `rh_employes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_postes`
--
ALTER TABLE `rh_postes`
  ADD CONSTRAINT `rh_postes_ibfk_1` FOREIGN KEY (`departementId`) REFERENCES `rh_departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `rh_prestations_enseignant`
--
ALTER TABLE `rh_prestations_enseignant`
  ADD CONSTRAINT `rh_prestations_enseignant_ibfk_1` FOREIGN KEY (`enseignantId`) REFERENCES `rh_employes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `scol_decisions_conseil`
--
ALTER TABLE `scol_decisions_conseil`
  ADD CONSTRAINT `scol_decisions_conseil_ibfk_1` FOREIGN KEY (`conseilClasseId`) REFERENCES `scol_conseils_classe` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `scol_demandes_document`
--
ALTER TABLE `scol_demandes_document`
  ADD CONSTRAINT `scol_demandes_document_ibfk_25` FOREIGN KEY (`typeDocumentId`) REFERENCES `scol_types_document` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `scol_demandes_document_ibfk_26` FOREIGN KEY (`etudiantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `scol_documents_delivres`
--
ALTER TABLE `scol_documents_delivres`
  ADD CONSTRAINT `scol_documents_delivres_ibfk_1` FOREIGN KEY (`demandeId`) REFERENCES `scol_demandes_document` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `scol_livres`
--
ALTER TABLE `scol_livres`
  ADD CONSTRAINT `scol_livres_ibfk_1` FOREIGN KEY (`uploaderId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `scol_reclamations`
--
ALTER TABLE `scol_reclamations`
  ADD CONSTRAINT `scol_reclamations_ibfk_1` FOREIGN KEY (`etudiantId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `scol_reponses_reclamation`
--
ALTER TABLE `scol_reponses_reclamation`
  ADD CONSTRAINT `scol_reponses_reclamation_ibfk_15` FOREIGN KEY (`reclamationId`) REFERENCES `scol_reclamations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `scol_reponses_reclamation_ibfk_16` FOREIGN KEY (`repondeurId`) REFERENCES `aut_utilisateurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_attestations_stage`
--
ALTER TABLE `stg_attestations_stage`
  ADD CONSTRAINT `stg_attestations_stage_ibfk_1` FOREIGN KEY (`demandeStageId`) REFERENCES `stg_demandes_stage` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_conventions_stage`
--
ALTER TABLE `stg_conventions_stage`
  ADD CONSTRAINT `stg_conventions_stage_ibfk_1` FOREIGN KEY (`demandeStageId`) REFERENCES `stg_demandes_stage` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_demandes_stage`
--
ALTER TABLE `stg_demandes_stage`
  ADD CONSTRAINT `stg_demandes_stage_ibfk_37` FOREIGN KEY (`offreStageId`) REFERENCES `stg_offres_stage` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stg_demandes_stage_ibfk_38` FOREIGN KEY (`entrepriseId`) REFERENCES `stg_entreprises` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stg_demandes_stage_ibfk_39` FOREIGN KEY (`apprenantId`) REFERENCES `aut_apprenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_notes_stage`
--
ALTER TABLE `stg_notes_stage`
  ADD CONSTRAINT `stg_notes_stage_ibfk_25` FOREIGN KEY (`demandeStageId`) REFERENCES `stg_demandes_stage` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stg_notes_stage_ibfk_26` FOREIGN KEY (`enseignantId`) REFERENCES `aut_enseignants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_offres_stage`
--
ALTER TABLE `stg_offres_stage`
  ADD CONSTRAINT `stg_offres_stage_ibfk_1` FOREIGN KEY (`institutionId`) REFERENCES `aut_institutions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_rapports_stage`
--
ALTER TABLE `stg_rapports_stage`
  ADD CONSTRAINT `stg_rapports_stage_ibfk_1` FOREIGN KEY (`demandeStageId`) REFERENCES `stg_demandes_stage` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stg_tuteurs`
--
ALTER TABLE `stg_tuteurs`
  ADD CONSTRAINT `stg_tuteurs_ibfk_1` FOREIGN KEY (`entrepriseId`) REFERENCES `stg_entreprises` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stk_article`
--
ALTER TABLE `stk_article`
  ADD CONSTRAINT `stk_article_ibfk_25` FOREIGN KEY (`siteId`) REFERENCES `imm_site` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stk_article_ibfk_26` FOREIGN KEY (`categorieId`) REFERENCES `stk_categorie_article` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stk_bon_commande`
--
ALTER TABLE `stk_bon_commande`
  ADD CONSTRAINT `stk_bon_commande_ibfk_25` FOREIGN KEY (`siteId`) REFERENCES `imm_site` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stk_bon_commande_ibfk_26` FOREIGN KEY (`fournisseurId`) REFERENCES `stk_fournisseur` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stk_ligne_bon_commande`
--
ALTER TABLE `stk_ligne_bon_commande`
  ADD CONSTRAINT `stk_ligne_bon_commande_ibfk_25` FOREIGN KEY (`bonCommandeId`) REFERENCES `stk_bon_commande` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stk_ligne_bon_commande_ibfk_26` FOREIGN KEY (`articleId`) REFERENCES `stk_article` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `stk_mouvement_stock`
--
ALTER TABLE `stk_mouvement_stock`
  ADD CONSTRAINT `stk_mouvement_stock_ibfk_37` FOREIGN KEY (`siteId`) REFERENCES `imm_site` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stk_mouvement_stock_ibfk_38` FOREIGN KEY (`articleId`) REFERENCES `stk_article` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `stk_mouvement_stock_ibfk_39` FOREIGN KEY (`fournisseurId`) REFERENCES `stk_fournisseur` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

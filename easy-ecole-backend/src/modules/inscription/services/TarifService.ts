import { Transaction } from "sequelize";
import { FraisParcours } from "../models/FraisParcours";
import { FraisScolarite } from "../models/FraisScolarite";
import { ModalitePaiement, nombreEcheances } from "./GenerateurEcheancierSessionService";

/**
 * Erreur métier levée lorsque la grille tarifaire est introuvable.
 */
export class GrilleTarifaireIntrouvableError extends Error {
    constructor(contexte: string) {
        super(`Grille tarifaire introuvable pour ${contexte}`)
        this.name = "GrilleTarifaireIntrouvableError"
    }
}

/**
 * Grille tarifaire résolue (source de vérité + fallback).
 */
export interface GrilleTarifaire {
    montantInscription: number | null
    montantScolarite: number | null
    nbMensualites: number
    fraisBibliotheque: number | null
    fraisAssurance: number | null
    fraisLogement: number | null
    autresFrais: Record<string, unknown> | null
    modaliteScolarite: '1x' | '3x' | '10x'
    source: 'frais_parcours' | 'frais_scolarite'
}

/**
 * Service de résolution hiérarchique de la grille tarifaire.
 *
 * Ordre de résolution :
 *   1. FraisParcours (triplet parcours + niveau + année)
 *   2. Fallback : FraisScolarite actif de la session
 *
 * Si rien n'est trouvé → GrilleTarifaireIntrouvableError.
 */
export class TarifService {

    /**
     * Résout la grille tarifaire pour un triplet (parcours, niveau, année).
     * Ne dépend d'aucun état de dossier — lecture seule.
     */
    static async resoudreParTriplet(
        parcoursId: number,
        niveauEtudeId: number,
        anneeAcademiqueId: number,
        transaction?: Transaction,
    ): Promise<GrilleTarifaire> {
        const fp = await FraisParcours.findOne({
            where: { parcoursId, niveauEtudeId, anneeAcademiqueId },
            transaction,
        })

        if (fp) {
            const modalite = fp.nbMensualites === 1 ? '1x' : fp.nbMensualites === 3 ? '3x' : '10x'
            return {
                montantInscription: fp.montantInscription ?? 0,
                montantScolarite: fp.montantScolarite ?? 0,
                nbMensualites: fp.nbMensualites ?? 10,
                fraisBibliotheque: fp.fraisBibliotheque ?? 0,
                fraisAssurance: fp.fraisAssurance ?? 0,
                fraisLogement: fp.fraisLogement ?? 0,
                autresFrais: (fp.autresFrais as Record<string, unknown> | null) ?? null,
                modaliteScolarite: modalite,
                source: 'frais_parcours',
            }
        }

        throw new GrilleTarifaireIntrouvableError(
            `FraisParcours introuvable (parcours=${parcoursId}, niveau=${niveauEtudeId}, année=${anneeAcademiqueId})`
        )
    }

    /**
     * Résout la grille via le FraisScolarite d'une session (fallback).
     */
    static async resoudreParSession(
        sessionId: number,
        transaction?: Transaction,
    ): Promise<GrilleTarifaire> {
        const fs = await FraisScolarite.findOne({
            where: { sessionId, actif: true },
            transaction,
            order: [['id', 'ASC']],
        })

        if (!fs) {
            throw new GrilleTarifaireIntrouvableError(
                `FraisScolarite introuvable pour la session ${sessionId}`
            )
        }

        return {
            montantInscription: 0,
            montantScolarite: fs.montant,
            nbMensualites: fs.modalite === '1x' ? 1 : fs.modalite === '3x' ? 3 : 10,
            fraisBibliotheque: 0,
            fraisAssurance: 0,
            fraisLogement: 0,
            autresFrais: null,
            modaliteScolarite: fs.modalite,
            source: 'frais_scolarite',
        }
    }

    /**
     * Résout la grille avec fallback automatique :
     * FraisParcours → FraisScolarite session → erreur.
     */
    static async resoudre(
        parcoursId: number,
        niveauEtudeId: number,
        anneeAcademiqueId: number,
        sessionId: number,
        transaction?: Transaction,
    ): Promise<GrilleTarifaire> {
        try {
            return await TarifService.resoudreParTriplet(parcoursId, niveauEtudeId, anneeAcademiqueId, transaction)
        } catch {
            return await TarifService.resoudreParSession(sessionId, transaction)
        }
    }
}

import { Transaction } from "sequelize";
import { DossierEtudiant } from "../models/DossierEtudiant";
import { GrilleTarifaire } from "./TarifService";

/**
 * Snapshot figé de la grille tarifaire au moment de la 1ʳᵉ validation du dossier.
 *
 * Conforme au champ `ins_dossiers_etudiants.fraisScolariteSnapshot` (TEXT/JSON).
 */
export interface FraisScolariteSnapshot {
    readonly figureA: string
    readonly montantInscription: number
    readonly montantScolarite: number
    readonly nbMensualites: number
    readonly modaliteScolarite: '1x' | '3x' | '10x'
    readonly fraisBibliotheque: number
    readonly fraisAssurance: number
    readonly fraisLogement: number
    readonly autresFrais: Record<string, unknown> | null
    readonly total: number
    readonly source: 'frais_parcours' | 'frais_scolarite'
    readonly dateFigement: string
}

/**
 * Service de figement de la grille tarifaire (snapshot).
 *
 * Règle métier : le snapshot est écrit UNE SEULE FOIS, à la 1ʳᵉ validation
 * du dossier. Les validations ultérieures réutilisent le snapshot existant
 * (immutabilité comptable).
 */
export class SnapshotService {

    /**
     * Calcule le snapshot à partir d'une grille tarifaire résolue.
     */
    static calculer(grille: GrilleTarifaire): FraisScolariteSnapshot {
        const valeurs = Object.values(grille.autresFrais || {}) as number[]
        const total = (grille.montantInscription || 0)
            + (grille.montantScolarite || 0)
            + (grille.fraisBibliotheque || 0)
            + (grille.fraisAssurance || 0)
            + (grille.fraisLogement || 0)
            + (valeurs.reduce((s, v) => s + v, 0))

        return {
            figureA: 'A',
            montantInscription: grille.montantInscription || 0,
            montantScolarite: grille.montantScolarite || 0,
            nbMensualites: grille.nbMensualites,
            modaliteScolarite: grille.modaliteScolarite,
            fraisBibliotheque: grille.fraisBibliotheque || 0,
            fraisAssurance: grille.fraisAssurance || 0,
            fraisLogement: grille.fraisLogement || 0,
            autresFrais: grille.autresFrais,
            total: Math.round(total * 100) / 100,
            source: grille.source,
            dateFigement: new Date().toISOString(),
        }
    }

    /**
     * Sérialise le snapshot en JSON pour persistance.
     */
    static serialiser(snapshot: FraisScolariteSnapshot): string {
        return JSON.stringify(snapshot)
    }

    /**
     * Désérialise le snapshot depuis la base.
     */
    static deserialiser(raw: string | null | undefined): FraisScolariteSnapshot | null {
        if (!raw) return null
        try {
            return JSON.parse(raw) as FraisScolariteSnapshot
        } catch (err) {
            // CRITIQUE : un snapshot illisible concerne des frais FIGÉS. Retourner null
            // pousse l'appelant à régénérer un montant potentiellement différent :
            // l'anomalie doit être immédiatement visible pour investigation.
            console.error('[SNAPSHOT] frais scolarité illisibles (JSON corrompu):',
                err instanceof Error ? err.message : err, '— contenu:', String(raw).slice(0, 200))
            return null
        }
    }

    /**
     * Applique le snapshot sur le dossier :
     * - si le dossier n'a pas encore de snapshot → écriture
     * - sinon → lecture seule (immutabilité)
     *
     * Retourne le snapshot effectif (existant ou nouveau).
     */
    static async appliquer(
        dossier: DossierEtudiant,
        grille: GrilleTarifaire,
        transaction?: Transaction,
    ): Promise<FraisScolariteSnapshot> {
        const existant = SnapshotService.deserialiser(dossier.fraisScolariteSnapshot)
        if (existant) {
            return existant
        }

        const snapshot = SnapshotService.calculer(grille)
        dossier.fraisScolariteSnapshot = SnapshotService.serialiser(snapshot)
        await dossier.save({ transaction })
        return snapshot
    }
}

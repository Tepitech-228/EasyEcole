import { customAlphabet } from 'nanoid'
import { Parcours } from '../../modules/inscription/models/Parcours'
import { Classe } from '../../modules/inscription/models/Classe'

export class IDGenerator {
    private static instance: IDGenerator
    private static UPPER_ALPHABETS: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private static LOWER_ALPHABETS: string = 'abcdefghijklmnopqrstuvwxyz'
    private static DIGITS: string = '0123456789'

    // Alphabet sans caractères ambigus (pas de I, O, X, 0, 1) pour un rendu propre des matricules
    private static SAFE_ALPHABET: string = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    private static ABBREVIATIONS_PARCOURS: Record<string, string> = {
        'LICENCE': 'LI',
        'MASTER': 'MA',
        'DOCTORAT': 'DO',
        'BTS': 'BT',
    }

    // Abréviations du segment filière (4 caractères max) dérivées du type de parcours
    private static FILIERE_TYPE_ABBREVIATIONS: Record<string, string> = {
        'LICENCE': 'LIC',
        'MASTER': 'MAS',
        'DOCTORAT': 'DOCT',
        'BTS': 'BTS',
    }

    constructor() {
    }

    public static getInstance(): IDGenerator {
        if (!IDGenerator.instance) {
            IDGenerator.instance = new IDGenerator()
        }
        return IDGenerator.instance
    }

    public test(): void {
        const nanoid = customAlphabet('0123456789', 10)
        const id = nanoid()
        console.log(id)
    }

    public generateInscriptionMatricule(): string {
        const nanoid = customAlphabet('0123456789', 8)
        return nanoid()
    }

    public generateMatriculeFinal(parcours: Parcours, anneeScolaire: string, classe: Classe | null): string {
        const nanoid = customAlphabet(IDGenerator.SAFE_ALPHABET, 6)

        const parcoursAbb = IDGenerator.ABBREVIATIONS_PARCOURS[parcours.type] || parcours.type.slice(0, 2)
        const filiere = IDGenerator.deriveFiliereSegment(parcours, classe)
        const annee = anneeScolaire.replace(/[^0-9]/g, '').slice(-4)

        return `ESA-${annee}-${parcoursAbb}-${filiere}-${nanoid()}`
    }

    /**
     * Segment FFFF du matricule (format ESA-AAAA-PP-FFFF-CODE).
     * Priorité : 1) libellé de la classe, 2) libellé du niveau d'étude du parcours,
     * 3) abréviation du type de parcours, 4) segment aléatoire (nanoid, alphabet sûr).
     * Ne produit plus jamais de segment 'XXXX'.
     */
    private static deriveFiliereSegment(parcours: Parcours, classe: Classe | null): string {
        if (classe) {
            return classe.libelle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
        }

        const niveauEtudeLibelle = parcours.niveauEtude?.libelle
        if (niveauEtudeLibelle) {
            return niveauEtudeLibelle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
        }

        if (parcours.type) {
            return IDGenerator.FILIERE_TYPE_ABBREVIATIONS[parcours.type]
                || parcours.type.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
        }

        const nanoid = customAlphabet(IDGenerator.SAFE_ALPHABET, 4)
        return nanoid()
    }

    public generateNumeroPaiement(): string {
        const nanoid = customAlphabet('0123456789', 14)
        return nanoid()
    }

    public generateMotDePasseUtilisateur(): string {
        // const nanoid = customAlphabet('A-Za-z0-9_-', 10)
        const nanoid = customAlphabet(IDGenerator.UPPER_ALPHABETS + IDGenerator.LOWER_ALPHABETS + IDGenerator.DIGITS + '_#', 10)
        return nanoid()
    }

}
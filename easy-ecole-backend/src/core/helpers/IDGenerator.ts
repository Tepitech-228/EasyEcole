import { customAlphabet } from 'nanoid'
import { Parcours } from '../../modules/inscription/models/Parcours'
import { Classe } from '../../modules/inscription/models/Classe'

export class IDGenerator {
    private static instance: IDGenerator
    private static UPPER_ALPHABETS: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private static LOWER_ALPHABETS: string = 'abcdefghijklmnopqrstuvwxyz'
    private static DIGITS: string = '0123456789'

    private static ABBREVIATIONS_PARCOURS: Record<string, string> = {
        'LICENCE': 'LI',
        'MASTER': 'MA',
        'DOCTORAT': 'DO',
        'BTS': 'BT',
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
        const nanoid = customAlphabet(IDGenerator.UPPER_ALPHABETS + IDGenerator.DIGITS, 6)

        const parcoursAbb = IDGenerator.ABBREVIATIONS_PARCOURS[parcours.type] || parcours.type.slice(0, 2)
        const filiere = classe
            ? classe.libelle.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)
            : 'XXXX'
        const annee = anneeScolaire.replace(/[^0-9]/g, '').slice(-4)

        return `ESA-${annee}-${parcoursAbb}-${filiere}-${nanoid()}`
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
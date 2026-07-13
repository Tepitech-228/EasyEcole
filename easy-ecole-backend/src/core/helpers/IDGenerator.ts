import { customAlphabet } from 'nanoid'

export class IDGenerator {
    private static instance: IDGenerator
    private static UPPER_ALPHABETS: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private static LOWER_ALPHABETS: string = 'abcdefghijklmnopqrstuvwxyz'
    private static DIGITS: string = '0123456789'

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
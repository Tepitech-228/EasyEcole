import { customAlphabet } from 'nanoid'
import { Parcours } from '../../modules/inscription/models/Parcours'
import { Classe } from '../../modules/inscription/models/Classe'
import { Etablissement } from '../../modules/etablissement/models/Etablissement'
import { RolesUtilisateur } from '../enums/RolesUtilisateur'

export class IDGenerator {
    private static instance: IDGenerator
    private static UPPER_ALPHABETS: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    private static LOWER_ALPHABETS: string = 'abcdefghijklmnopqrstuvwxyz'
    private static DIGITS: string = '0123456789'

    private static SAFE_ALPHABET: string = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    private static ABBREVIATIONS_PARCOURS: Record<string, string> = {
        'LICENCE': 'LI',
        'MASTER': 'MA',
        'DOCTORAT': 'DO',
        'BTS': 'BT',
        'MBA': 'MB',
    }

    private static FILIERE_TYPE_ABBREVIATIONS: Record<string, string> = {
        'LICENCE': 'LIC',
        'MASTER': 'MAS',
        'DOCTORAT': 'DOCT',
        'BTS': 'BTS',
        'MBA': 'MBA',
    }

    private static SITE_ABBREVIATIONS: Record<string, string> = {
        'campus': 'CAM',
        'principal': 'ST',
        'annexe': 'ANN',
        'centre': 'CTR',
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

    public generateMatriculeFinal(
        parcours: Parcours | null,
        anneeScolaire: string,
        classe: Classe | null,
        ordre: number,
        etablissement: Etablissement | null,
        typeCours: 'jour' | 'soir' = 'jour'
    ): string {
        const filiereCode = IDGenerator.deriveFiliereCode(parcours, classe)
        const anneeEtude = IDGenerator.deriveAnneeEtude(classe, parcours)
        const typeCoursCode = typeCours === 'jour' ? 'J' : 'S'
        const anneeAcademique = anneeScolaire.replace(/[^0-9]/g, '').slice(-2)
        const siteCode = IDGenerator.deriveSiteCode(etablissement)

        return `${ordre}-${filiereCode}${anneeEtude}${typeCoursCode}-${anneeAcademique}-${siteCode}`
    }

    private static deriveFiliereCode(parcours: Parcours | null, classe: Classe | null): string {
        if (!parcours) return 'GEN'

        const titre = parcours.titre?.toUpperCase() || ''

        if (titre.includes('INFORMATIQUE') || titre.includes('INFO')) return 'INF'
        if (titre.includes('GESTION') || titre.includes('MANAGEMENT')) return 'GES'
        if (titre.includes('COMPTABILITÉ') || titre.includes('COMPTABILITE') || titre.includes('FINANCE')) return 'CPT'
        if (titre.includes('ÉCONOMIE') || titre.includes('ECONOMIE')) return 'ECO'
        if (titre.includes('DROIT') || titre.includes('JURIDIQUE')) return 'DRO'
        if (titre.includes('MARKETING') || titre.includes('COMMERCE')) return 'MKT'
        if (titre.includes('COMMUNICATION') || titre.includes('JOURNALISME')) return 'COM'
        if (titre.includes('GÉNIE CIVIL') || titre.includes('GENIE CIVIL')) return 'GCI'
        if (titre.includes('GÉNIE ÉLECTRIQUE') || titre.includes('GENIE ELECTRIQUE')) return 'GEE'
        if (titre.includes('SCIENCES')) return 'SCI'

        if (classe) {
            const classeLibelle = classe.libelle?.toUpperCase() || ''
            if (classeLibelle.includes('INF')) return 'INF'
            if (classeLibelle.includes('GES')) return 'GES'
            if (classeLibelle.includes('CPT')) return 'CPT'
            if (classeLibelle.includes('ECO')) return 'ECO'
            if (classeLibelle.includes('DRO')) return 'DRO'
            if (classeLibelle.includes('MKT')) return 'MKT'
            if (classeLibelle.includes('COM')) return 'COM'
            if (classeLibelle.includes('GCI')) return 'GCI'
            if (classeLibelle.includes('GEE')) return 'GEE'
        }

        const typeAbb = IDGenerator.FILIERE_TYPE_ABBREVIATIONS[parcours.type] || parcours.type?.slice(0, 2) || 'GN'
        return typeAbb
    }

    private static deriveAnneeEtude(classe: Classe | null, parcours: Parcours | null): string {
        if (classe?.niveauEtude?.libelle) {
            const libelle = classe.niveauEtude.libelle.toUpperCase()
            if (libelle.includes('LICENCE 1') || libelle.includes('L1')) return '1'
            if (libelle.includes('LICENCE 2') || libelle.includes('L2')) return '2'
            if (libelle.includes('LICENCE 3') || libelle.includes('L3')) return '3'
            if (libelle.includes('MASTER 1') || libelle.includes('M1')) return '4'
            if (libelle.includes('MASTER 2') || libelle.includes('M2')) return '5'
            if (libelle.includes('DOCTORAT') || libelle.includes('DOCT')) return '6'
            if (libelle.includes('BTS 1') || libelle.includes('BTS1')) return '1'
            if (libelle.includes('BTS 2') || libelle.includes('BTS2')) return '2'
        }

        if (parcours?.niveauEtude?.libelle) {
            const libelle = parcours.niveauEtude.libelle.toUpperCase()
            if (libelle.includes('LICENCE 1') || libelle.includes('L1')) return '1'
            if (libelle.includes('LICENCE 2') || libelle.includes('L2')) return '2'
            if (libelle.includes('LICENCE 3') || libelle.includes('L3')) return '3'
            if (libelle.includes('MASTER 1') || libelle.includes('M1')) return '4'
            if (libelle.includes('MASTER 2') || libelle.includes('M2')) return '5'
            if (libelle.includes('DOCTORAT') || libelle.includes('DOCT')) return '6'
            if (libelle.includes('BTS 1') || libelle.includes('BTS1')) return '1'
            if (libelle.includes('BTS 2') || libelle.includes('BTS2')) return '2'
        }

        const nanoid = customAlphabet(IDGenerator.DIGITS, 1)
        return nanoid()
    }

    public static deriveSiteCode(etablissement: Etablissement | null): string {
        if (!etablissement) return 'ST'

        const nom = etablissement.nom?.toLowerCase() || ''
        const ville = etablissement.ville?.toLowerCase() || ''

        if (ville.includes('abidjan') || nom.includes('principal')) return 'ST'
        if (ville.includes('bouaké') || ville.includes('bouake') || nom.includes('annexe')) return 'ANN'
        if (ville.includes('korhogo') || nom.includes('centre')) return 'CTR'
        if (nom.includes('campus')) return 'CAM'

        const nanoid = customAlphabet(IDGenerator.UPPER_ALPHABETS, 2)
        return nanoid()
    }

    private static removeAccents(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }

    public static deriveEtablissementCode(etablissement: { nom?: string | null } | null): string {
        if (!etablissement?.nom) return 'ETB'
        const nom = IDGenerator.removeAccents(etablissement.nom).toUpperCase().replace(/[^A-Z\s]/g, '').trim()
        if (!nom) return 'ETB'
        const mots = nom.split(/\s+/).filter(m => m.length > 0)
        if (mots.length === 1 && mots[0].length <= 6) return mots[0]
        if (mots.length >= 2) {
            const code = mots.map(m => m[0]).join('').slice(0, 6)
            return code || 'ETB'
        }
        return mots[0].slice(0, 6) || 'ETB'
    }

    public static deriveMatiereCode(specialite: string | null | undefined): string {
        if (!specialite) return 'GEN'
        const s = IDGenerator.removeAccents(specialite.trim().toLowerCase())
        if (!s) return 'GEN'
        if (s.includes('math')) return 'MATH'
        if (s.includes('physique')) return 'PHY'
        if (s.includes('chimie')) return 'CHI'
        if (s.includes('svt') || s.includes('biologie') || s.includes('bio')) return 'BIO'
        if (s.includes('informatique') || s.includes('ntic') || s.includes('programmation')) return 'INF'
        if (s.includes('francais') || s.includes('lettres')) return 'FRA'
        if (s.includes('anglais') || s.includes('english')) return 'ANG'
        if (s.includes('espagnol')) return 'ESP'
        if (s.includes('allemand')) return 'ALL'
        if (s.includes('philosophie')) return 'PHI'
        if (s.includes('histoire')) return 'HGE'
        if (s.includes('geographie')) return 'GEO'
        if (s.includes('eps') || s.includes('sport')) return 'EPS'
        if (s.includes('gestion') || s.includes('management')) return 'GES'
        if (s.includes('comptab') || s.includes('finance')) return 'CPT'
        if (s.includes('economie') || s.includes('eco')) return 'ECO'
        if (s.includes('droit')) return 'DRO'
        if (s.includes('marketing') || s.includes('commerce') || s.includes('mkt')) return 'MKT'
        if (s.includes('communication') || s.includes('journalisme')) return 'COM'
        if (s.includes('genie civil')) return 'GCI'
        if (s.includes('genie electrique') || s.includes('electronique')) return 'GEE'
        if (s.includes('genie mecanique') || s.includes('agro')) return 'GME'
        const fallback = s.replace(/[^a-z]/g, '').slice(0, 4)
        return fallback || 'GEN'
    }

    public static deriveServiceCode(directionService: string | null | undefined, role?: string): string {
        if (directionService) {
            const s = IDGenerator.removeAccents(directionService.trim().toLowerCase())
            if (s.includes('cabinet') || s.includes('direction')) return 'CAB'
            if (s.includes('esa') || s.includes('ecole')) return 'ESA'
            if (s.includes('comptab') || s.includes('cabinet_comptable')) return 'CPT'
            if (s.includes('rh') || s.includes('ressources humaines') || s.includes('personnel')) return 'RH'
            if (s.includes('secretariat') || s.includes('sec')) return 'SEC'
            if (s.includes('scolarite')) return 'SCO'
            if (s.includes('tresorerie') || s.includes('caisse') || s.includes('caissier')) return 'TRE'
            if (s.includes('orientation')) return 'CO'
            if (s.includes('surveillance')) return 'SUR'
            if (s.includes('informatique') || s.includes('digital')) return 'INF'
        }
        if (role) {
            const roleMap: Record<string, string> = {
                [RolesUtilisateur.PERSONNEL_ADMINISTRATIF]: 'ADM',
                [RolesUtilisateur.RESSOURCES_HUMAINES]: 'RH',
                [RolesUtilisateur.CABINET_COMPTABLE]: 'CAB',
                [RolesUtilisateur.ESA_COMPTA]: 'CPT',
                [RolesUtilisateur.COMITE_ORIENTATION]: 'CO',
                [RolesUtilisateur.CAISSIER_BANQUE]: 'TRE',
                [RolesUtilisateur.SECRETAIRE]: 'SEC',
                [RolesUtilisateur.SURVEILLANT]: 'SUR',
            }
            if (roleMap[role]) return roleMap[role]
        }
        return 'ADM'
    }

    public static generateMatricule(etablissementCode: string, categorieCode: string, siteCode: string, ordre: number): string {
        return `${etablissementCode}-${categorieCode}-${siteCode}-${String(ordre).padStart(4, '0')}`
    }

    public generateNumeroPaiement(): string {
        const nanoid = customAlphabet('0123456789', 14)
        return nanoid()
    }

    public generateMotDePasseUtilisateur(): string {
        const nanoid = customAlphabet(IDGenerator.UPPER_ALPHABETS + IDGenerator.LOWER_ALPHABETS + IDGenerator.DIGITS + '_#', 10)
        return nanoid()
    }
}
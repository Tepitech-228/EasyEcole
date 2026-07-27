import { Immobilisation } from "../models/Immobilisation";
import { CategorieImmobilisation } from "../models/CategorieImmobilisation";
import { Amortissement } from "../models/Amortissement";
import { creerEcritureAutomatique } from "../../comptabilite/helpers/ComptabiliteHelper";

export class AmortissementService {
    static async genererPourImmobilisation(immobilisationId: number): Promise<Amortissement[]> {
        const immo = await Immobilisation.findByPk(immobilisationId, {
            include: [{ model: CategorieImmobilisation, as: 'categorie' }]
        });
        if (!immo) throw new Error('Immobilisation non trouvée');

        const categorie = (immo as any).categorie as CategorieImmobilisation | null;
        if (!categorie || (!categorie.tauxAmortissement && !categorie.dureeVie)) {
            throw new Error('Catégorie sans paramètres d\'amortissement');
        }

        const dureeVie = categorie.dureeVie || (categorie.tauxAmortissement ? Math.round(100 / categorie.tauxAmortissement) : 0);
        const taux = categorie.tauxAmortissement || (dureeVie ? Math.round((100 / dureeVie) * 100) / 100 : 0);
        const valeur = Number(immo.valeurAcquisition);
        const anneeAcquisition = new Date(immo.dateMiseEnService).getFullYear();
        const amortissementAnnuel = dureeVie > 0 ? valeur / dureeVie : valeur * (taux / 100);
        const anneeActuelle = new Date().getFullYear();

        await Amortissement.destroy({ where: { immobilisationId } });

        const created: Amortissement[] = [];
        for (let i = 0; i < dureeVie; i++) {
            const annee = anneeAcquisition + i;
            if (annee > anneeActuelle) break;

            const montantAmorti = Math.round(amortissementAnnuel * 100) / 100;
            const valeurResiduelle = Math.round((valeur - (amortissementAnnuel * (i + 1))) * 100) / 100;

            const item = await Amortissement.create({
                immobilisationId: immo.id as any,
                annee,
                montantAmorti: montantAmorti > valeurResiduelle ? valeur + amortissementAnnuel - (amortissementAnnuel * i) : montantAmorti,
                valeurResiduelle: valeurResiduelle < 0 ? 0 : valeurResiduelle,
                dateCalcul: new Date().toISOString()
            });
            created.push(item);

            try {
                await creerEcritureAutomatique({
                    journalCode: 'OD',
                    compteDebit: '681',
                    compteCredit: '281',
                    montant: montantAmorti,
                    libelle: `Dotation aux amortissements ${annee} - ${immo.nom}`,
                    moduleSource: 'immobilisation',
                    referenceModuleId: String(item.id)
                });
            } catch (e) {
                // Silently fail for accounting - don't block amortization generation
            }
        }
        return created;
    }
}

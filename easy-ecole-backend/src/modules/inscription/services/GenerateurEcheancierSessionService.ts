export type ModalitePaiement = '1x' | '3x' | '10x';
export type TypeFraisPaiement = 'inscription' | 'scolarite';

export interface BordereauPaiement {
  type: TypeFraisPaiement;
  montant: number;
  statut: 'en_attente' | 'valide' | 'rejete';
}

export interface EcheanceSession {
  numeroEcheance: number;
  type: TypeFraisPaiement;
  montant: number;
  dateLimite: Date;
  statut: 'impaye' | 'paye' | 'en_retard';
  moisConcerne?: string | null;
}

export interface SessionPaiementConfig {
  dateDebut: Date | string;
  montantTotal: number;
  modalite: ModalitePaiement;
  type: TypeFraisPaiement;
}

const arrondir = (valeur: number): number => Math.round(valeur * 100) / 100;

export const nombreEcheances = (modalite: ModalitePaiement): number => {
  if (modalite === '3x') return 3;
  if (modalite === '10x') return 10;
  return 1;
};

export function datePremiereEcheanceDepuisSession(dateDebut: Date | string): Date {
  const base = new Date(dateDebut);
  return new Date(base.getFullYear(), base.getMonth() + 1, 5);
}

export function genererEcheancesSession(config: SessionPaiementConfig): EcheanceSession[] {
  const { montantTotal, modalite, type } = config;
  if (!Number.isFinite(montantTotal) || montantTotal <= 0) {
    throw new Error('Montant total invalide pour la génération de l’échéancier');
  }

  const nb = nombreEcheances(modalite);
  const montantStandard = arrondir(montantTotal / nb);
  const montantDerniere = arrondir(montantTotal - montantStandard * (nb - 1));
  const dateReference = new Date(config.dateDebut);

  const echeances: EcheanceSession[] = [];

  for (let i = 0; i < nb; i++) {
    const dateLimite = new Date(
      dateReference.getFullYear(),
      dateReference.getMonth() + i + 1,
      5
    );

    const moisConcerne = `${dateLimite.getFullYear()}-${String(dateLimite.getMonth() + 1).padStart(2, '0')}`;

    echeances.push({
      numeroEcheance: i + 1,
      type,
      montant: i === nb - 1 ? montantDerniere : montantStandard,
      dateLimite,
      statut: 'impaye',
      moisConcerne: modalite === '1x' ? null : moisConcerne,
    });
  }

  return echeances;
}

export function validerBordereauPaiement(
  bordereau: BordereauPaiement | null | undefined,
  typeAttendu: TypeFraisPaiement,
  montantAttendu: number,
): boolean {
  if (!bordereau) return false;
  if (bordereau.type !== typeAttendu) return false;
  if (bordereau.statut !== 'valide') return false;
  if (!Number.isFinite(bordereau.montant) || bordereau.montant < 0) return false;
  return bordereau.montant >= montantAttendu;
}

export function echeanceEstEnRetard(dateLimite: Date, statut: EcheanceSession['statut']): boolean {
  if (statut !== 'impaye') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limite = new Date(dateLimite);
  limite.setHours(0, 0, 0, 0);
  return limite < today;
}

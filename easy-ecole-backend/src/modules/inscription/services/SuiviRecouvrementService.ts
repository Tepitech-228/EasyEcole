export type GranulariteRecouvrement = 'jour' | 'semaine';

export interface LigneRecouvrementAgregee {
  saisiParId: number | string;
  date: string | Date;
  nombre: number | string;
  montantTotal: number | string | null;
  saisiPar?: {
    nom?: string | null;
    prenoms?: string | null;
  } | null;
}

interface StatistiquesCompte {
  utilisateurId: number;
  nomComplet: string;
  nombreRecouvrements: number;
  montantTotal: number;
}

export interface SuiviRecouvrementAgrege {
  totaux: {
    nombreRecouvrements: number;
    montantTotal: number;
    comptesActifs: number;
    moyenneParPeriode: number;
  };
  parCompte: StatistiquesCompte[];
  evolution: Array<{
    date: string;
    nombreRecouvrements: number;
    comptes: Record<string, number>;
  }>;
}

const dateOnlyUtc = (date: Date): string => date.toISOString().slice(0, 10);

const parseDateOnlyUtc = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || dateOnlyUtc(date) !== value ? null : date;
};

const mondayOfUtcWeek = (date: Date): string => {
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return dateOnlyUtc(monday);
};

export function construireSuiviRecouvrements(
  lignes: LigneRecouvrementAgregee[],
  dateDebut: Date,
  dateFin: Date,
  granularite: GranulariteRecouvrement
): SuiviRecouvrementAgrege {
  const comptes = new Map<number, StatistiquesCompte>();
  const nombresParJourParCompte = new Map<string, Map<number, number>>();
  const dateDebutIso = dateOnlyUtc(dateDebut);
  const dateFinIso = dateOnlyUtc(dateFin);

  for (const ligne of lignes) {
    const utilisateurId = Number(ligne.saisiParId);
    if (!Number.isSafeInteger(utilisateurId) || utilisateurId <= 0) continue;

    const dateBrute = ligne.date instanceof Date
      ? dateOnlyUtc(ligne.date)
      : String(ligne.date || '').slice(0, 10);
    if (dateBrute < dateDebutIso || dateBrute > dateFinIso) continue;

    const nombre = Number(ligne.nombre) || 0;
    const montantTotal = Number(ligne.montantTotal) || 0;
    const nomComplet = `${ligne.saisiPar?.prenoms || ''} ${ligne.saisiPar?.nom || ''}`.trim()
      || `Compte #${utilisateurId}`;
    const compte = comptes.get(utilisateurId) || {
      utilisateurId,
      nomComplet,
      nombreRecouvrements: 0,
      montantTotal: 0,
    };
    compte.nombreRecouvrements += nombre;
    compte.montantTotal += montantTotal;
    comptes.set(utilisateurId, compte);

    const recouvrementsParCompte = nombresParJourParCompte.get(dateBrute) || new Map<number, number>();
    recouvrementsParCompte.set(utilisateurId, (recouvrementsParCompte.get(utilisateurId) || 0) + nombre);
    nombresParJourParCompte.set(dateBrute, recouvrementsParCompte);
  }

  const buckets = new Map<string, { nombreRecouvrements: number; parCompte: Record<string, number> }>();
  const curseur = new Date(dateDebut);
  while (curseur <= dateFin) {
    const cle = granularite === 'semaine' ? mondayOfUtcWeek(curseur) : dateOnlyUtc(curseur);
    if (!buckets.has(cle)) buckets.set(cle, { nombreRecouvrements: 0, parCompte: {} });
    curseur.setUTCDate(curseur.getUTCDate() + 1);
  }

  for (const [jour, recouvrementsParCompte] of nombresParJourParCompte) {
    const dateJour = parseDateOnlyUtc(jour);
    if (!dateJour) continue;
    const cle = granularite === 'semaine' ? mondayOfUtcWeek(dateJour) : jour;
    const bucket = buckets.get(cle) || { nombreRecouvrements: 0, parCompte: {} };
    for (const [utilisateurId, nombre] of recouvrementsParCompte) {
      const compteId = String(utilisateurId);
      bucket.parCompte[compteId] = (bucket.parCompte[compteId] || 0) + nombre;
      bucket.nombreRecouvrements += nombre;
    }
    buckets.set(cle, bucket);
  }

  const parCompte = Array.from(comptes.values())
    .sort((a, b) => b.nombreRecouvrements - a.nombreRecouvrements || a.nomComplet.localeCompare(b.nomComplet));
  const nombreRecouvrements = parCompte.reduce((total, compte) => total + compte.nombreRecouvrements, 0);
  const montantTotal = parCompte.reduce((total, compte) => total + compte.montantTotal, 0);
  const evolution = Array.from(buckets.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, bucket]) => ({
      date,
      nombreRecouvrements: bucket.nombreRecouvrements,
      comptes: bucket.parCompte,
    }));

  return {
    totaux: {
      nombreRecouvrements,
      montantTotal,
      comptesActifs: parCompte.length,
      moyenneParPeriode: buckets.size ? Math.round((nombreRecouvrements / buckets.size) * 100) / 100 : 0,
    },
    parCompte,
    evolution,
  };
}

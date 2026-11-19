export interface PointageJournalier {
  date: string;
  heureArrivee: unknown;
}

export interface AlerteRetardEtudiant {
  estEnRetard: boolean;
  totalRetardsMois: number;
  retardsConsecutifs: number;
  messageVocal: string | null;
}

function minutesDepuisHeure(value: unknown): number | null {
  const match = String(value ?? "").match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function dateIso(value: unknown): string {
  return String(value ?? "").slice(0, 10);
}

export function calculerAlerteRetardEtudiant(
  date: string,
  heureArrivee: unknown,
  periode: string | null | undefined,
  historiqueMois: PointageJournalier[],
): AlerteRetardEtudiant {
  const seuilMinutes = periode === "matin" ? 8 * 60 : periode === "soir" ? 18 * 60 + 30 : null;
  const minutesArrivee = minutesDepuisHeure(heureArrivee);
  const estEnRetard = seuilMinutes !== null && minutesArrivee !== null && minutesArrivee > seuilMinutes;
  if (seuilMinutes === null) {
    return { estEnRetard: false, totalRetardsMois: 0, retardsConsecutifs: 0, messageVocal: null };
  }

  const mois = date.slice(0, 7);
  const pointagesDuMois = historiqueMois
    .filter(pointage => dateIso(pointage.date).slice(0, 7) === mois && dateIso(pointage.date) < date)
    .sort((a, b) => dateIso(b.date).localeCompare(dateIso(a.date)));
  const retardsAnterieurs = pointagesDuMois.filter(pointage => {
    const heure = minutesDepuisHeure(pointage.heureArrivee);
    return heure !== null && heure > seuilMinutes;
  }).length;

  let retardsConsecutifsPrecedents = 0;
  for (const pointage of pointagesDuMois) {
    const heure = minutesDepuisHeure(pointage.heureArrivee);
    if (heure === null || heure <= seuilMinutes) break;
    retardsConsecutifsPrecedents += 1;
  }

  const totalRetardsMois = retardsAnterieurs + Number(estEnRetard);
  const retardsConsecutifs = estEnRetard ? retardsConsecutifsPrecedents + 1 : 0;
  const messages: string[] = [];
  if (retardsConsecutifs === 6) {
    messages.push("Vous êtes à votre sixième retard d'affilée dans le mois.");
  }
  if (totalRetardsMois === 15) {
    messages.push("Veuillez régulariser votre arrivée : vous avez quinze retards ce mois-ci.");
  }

  return {
    estEnRetard,
    totalRetardsMois,
    retardsConsecutifs,
    messageVocal: messages.length > 0 ? messages.join(" ") : null,
  };
}

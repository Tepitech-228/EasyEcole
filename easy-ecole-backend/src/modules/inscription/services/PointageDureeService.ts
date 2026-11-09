export interface DureesPointage {
    minutesNormales: number | null;
    minutesSupplementaires: number | null;
}

function minutesDepuisHeure(valeur: unknown): number | null {
    const correspondance = String(valeur ?? '').match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
    if (!correspondance) return null;
    return Number(correspondance[1]) * 60 + Number(correspondance[2]);
}

export function calculerDureesPointage(heureArrivee: unknown, heureDepart: unknown): DureesPointage {
    const arrivee = minutesDepuisHeure(heureArrivee);
    const depart = minutesDepuisHeure(heureDepart);
    if (arrivee === null || depart === null || depart < arrivee) {
        return { minutesNormales: null, minutesSupplementaires: null };
    }

    const debutHeuresSupplementaires = 18 * 60;
    return {
        minutesNormales: Math.max(0, Math.min(depart, debutHeuresSupplementaires) - arrivee),
        minutesSupplementaires: Math.max(0, depart - Math.max(arrivee, debutHeuresSupplementaires)),
    };
}

export function formaterDureePointage(minutes: number | null): string {
    if (minutes === null) return '—';
    const heures = Math.floor(minutes / 60);
    const minutesRestantes = minutes % 60;
    return `${heures}h${String(minutesRestantes).padStart(2, '0')}`;
}

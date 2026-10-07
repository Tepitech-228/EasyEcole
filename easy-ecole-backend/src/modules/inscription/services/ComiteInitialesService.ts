export interface MembreComiteNoms {
  nom?: string | null;
  prenoms?: string | null;
}

export function genererInitialesUniquesComite(membres: MembreComiteNoms[]): string[] {
  const initialesUtilisees = new Set<string>();
  const initialesParMembre: string[] = [];

  for (const membre of membres) {
    const base = `${membre.prenoms || ''} ${membre.nom || ''}`
      .trim()
      .split(/[\s'-]+/)
      .filter(Boolean)
      .map(mot => Array.from(mot)[0].toLocaleUpperCase('fr-FR'))
      .join('');
    if (!base) continue;

    let initiales = base;
    let suffixe = 0;
    while (initialesUtilisees.has(initiales)) {
      suffixe += 1;
      initiales = `${base}-${suffixe}`;
    }
    initialesUtilisees.add(initiales);
    initialesParMembre.push(initiales);
  }

  return initialesParMembre;
}

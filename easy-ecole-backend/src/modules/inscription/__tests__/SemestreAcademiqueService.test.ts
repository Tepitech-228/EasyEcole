import { SemestreAcademiqueService } from '../services/SemestreAcademiqueService';

describe('SemestreAcademiqueService', () => {
  it('autorise l’activation quand aucun semestre actif n’existe pour le même parcours et la même année', () => {
    const result = SemestreAcademiqueService.planActivation({
      id: 10,
      parcoursId: 1,
      anneeAcademiqueId: 2,
      statut: 'planifie'
    } as any, [] as any[]);

    expect(result.valid).toBe(true);
    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]).toEqual(expect.objectContaining({ id: 10, statut: 'en_cours' }));
  });

  it('bloque l’activation si un autre semestre est déjà actif pour le même parcours et la même année', () => {
    const result = SemestreAcademiqueService.planActivation({
      id: 20,
      parcoursId: 1,
      anneeAcademiqueId: 2,
      statut: 'planifie'
    } as any, [{
      id: 99,
      parcoursId: 1,
      anneeAcademiqueId: 2,
      statut: 'en_cours'
    }] as any[]);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('déjà actif');
  });
});

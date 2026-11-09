import { calculerDureesPointage, formaterDureePointage } from '../../../modules/inscription/services/PointageDureeService';

describe('PointageDureeService', () => {
    it('sépare le temps normal et les heures supplémentaires à partir de 18 h', () => {
        expect(calculerDureesPointage('08:00:00', '20:30:00')).toEqual({
            minutesNormales: 600,
            minutesSupplementaires: 150,
        });
    });

    it('compte uniquement les heures supplémentaires si l’arrivée a lieu après 18 h', () => {
        expect(calculerDureesPointage('19:15:00', '21:00:00')).toEqual({
            minutesNormales: 0,
            minutesSupplementaires: 105,
        });
    });

    it('ne calcule pas de durée finale sans départ enregistré', () => {
        expect(calculerDureesPointage('08:00:00', null)).toEqual({
            minutesNormales: null,
            minutesSupplementaires: null,
        });
    });

    it('formate les durées pour les rapports', () => {
        expect(formaterDureePointage(495)).toBe('8h15');
        expect(formaterDureePointage(null)).toBe('—');
    });
});

import { repartirBordereauxEquitablement } from "../../../modules/inscription/services/BordereauAffectationService";

describe("repartirBordereauxEquitablement", () => {
    it("distributes nine bordereaux into three distinct and balanced queues", () => {
        const bordereaux = Array.from({ length: 9 }, (_, index) => ({
            id: index + 1,
            etablissementId: 1,
        }));
        const agents = [1, 2, 3].map(utilisateurId => ({
            utilisateurId,
            etablissementId: null,
        }));

        const repartition = repartirBordereauxEquitablement(bordereaux, agents);
        const charges = new Map<number, number>();
        for (const affectation of repartition) {
            charges.set(
                affectation.utilisateurId,
                (charges.get(affectation.utilisateurId) ?? 0) + 1,
            );
        }

        expect(repartition).toHaveLength(9);
        expect(new Set(repartition.map(item => item.bordereauId)).size).toBe(9);
        expect([...charges.values()].sort()).toEqual([3, 3, 3]);
    });

    it("does not assign a site-specific bordereau to an agent from another site", () => {
        const bordereaux = [
            { id: 1, etablissementId: 10 },
            { id: 2, etablissementId: 20 },
        ];
        const agents = [
            { utilisateurId: 1, etablissementId: 10 },
            { utilisateurId: 2, etablissementId: 20 },
        ];

        expect(repartirBordereauxEquitablement(bordereaux, agents)).toEqual([
            { bordereauId: 1, utilisateurId: 1 },
            { bordereauId: 2, utilisateurId: 2 },
        ]);
    });
});

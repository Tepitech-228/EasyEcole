import { Op, QueryTypes, Transaction } from "sequelize";
import { DatabaseConnection } from "../../../core/helpers/DatabaseConnection";
import { MODULE_TABLE_PREFIX } from "../InscriptionModule";
import { Bordereau } from "../models/Bordereau";

export type EtapeAffectationBordereau = "audit" | "recouvrement";

interface AgentActif {
  utilisateurId: number;
  etablissementId: number | null;
}

interface PresenceEnregistree extends AgentActif {
  derniereActivite: Date | string;
}

interface RepartitionBordereau {
  bordereauId: number;
  utilisateurId: number;
}

const PRESENCE_TTL_MS = 90_000;
const PRISE_EN_CHARGE_TTL_MS = 30 * 60_000;

const STATUTS_PAR_ETAPE: Record<EtapeAffectationBordereau, Bordereau["statut"][]> = {
  audit: ["en_attente"],
  recouvrement: ["valide", "en_saisie_comptable"],
};

export class ErreurAffectationBordereau extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ErreurAffectationBordereau";
  }
}

function normaliserSiteId(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const siteId = Number(value);
  return Number.isSafeInteger(siteId) && siteId > 0 ? siteId : null;
}

function dateEnMs(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function lireAffectation(
  bordereau: Bordereau,
  etape: EtapeAffectationBordereau,
): { utilisateurId: number | null; assigneLe: Date | null; prisEnChargeLe: Date | null } {
  if (etape === "audit") {
    return {
      utilisateurId: bordereau.auditAssigneAId ? Number(bordereau.auditAssigneAId) : null,
      assigneLe: bordereau.auditAssigneLe ?? null,
      prisEnChargeLe: bordereau.auditPrisEnChargeLe ?? null,
    };
  }
  return {
    utilisateurId: bordereau.recouvrementAssigneAId ? Number(bordereau.recouvrementAssigneAId) : null,
    assigneLe: bordereau.recouvrementAssigneLe ?? null,
    prisEnChargeLe: bordereau.recouvrementPrisEnChargeLe ?? null,
  };
}

function ecrireAffectation(
  bordereau: Bordereau,
  etape: EtapeAffectationBordereau,
  utilisateurId: number | null,
  assigneLe: Date | null,
  prisEnChargeLe: Date | null,
): void {
  if (etape === "audit") {
    bordereau.auditAssigneAId = utilisateurId;
    bordereau.auditAssigneLe = assigneLe;
    bordereau.auditPrisEnChargeLe = prisEnChargeLe;
    return;
  }
  bordereau.recouvrementAssigneAId = utilisateurId;
  bordereau.recouvrementAssigneLe = assigneLe;
  bordereau.recouvrementPrisEnChargeLe = prisEnChargeLe;
}

function agentPeutTraiter(agent: AgentActif, bordereau: Pick<Bordereau, "etablissementId">): boolean {
  const siteBordereau = normaliserSiteId(bordereau.etablissementId);
  return agent.etablissementId === null || agent.etablissementId === siteBordereau;
}

export function repartirBordereauxEquitablement(
  bordereaux: Array<Pick<Bordereau, "id" | "etablissementId">>,
  agents: AgentActif[],
  chargesInitiales: ReadonlyMap<number, number> = new Map<number, number>(),
  exclureUtilisateurId?: number,
): RepartitionBordereau[] {
  const charges = new Map(chargesInitiales);
  const repartition: RepartitionBordereau[] = [];

  for (const bordereau of [...bordereaux].sort((a, b) => Number(a.id) - Number(b.id))) {
    const agentsEligibles = agents
      .filter(agent => agent.utilisateurId !== exclureUtilisateurId && agentPeutTraiter(agent, bordereau))
      .sort((a, b) =>
        (charges.get(a.utilisateurId) ?? 0) - (charges.get(b.utilisateurId) ?? 0)
        || a.utilisateurId - b.utilisateurId,
      );
    const agent = agentsEligibles[0];
    if (!agent) continue;

    repartition.push({ bordereauId: Number(bordereau.id), utilisateurId: agent.utilisateurId });
    charges.set(agent.utilisateurId, (charges.get(agent.utilisateurId) ?? 0) + 1);
  }

  return repartition;
}

export class BordereauAffectationService {
  private static readonly tablePresence = `\`${MODULE_TABLE_PREFIX}bordereau_agents_presence\``;
  private static readonly tableVerrous = `\`${MODULE_TABLE_PREFIX}bordereau_affectation_verrous\``;

  static estAffecteA(
    bordereau: Bordereau,
    etape: EtapeAffectationBordereau,
    utilisateurId: number,
  ): boolean {
    return lireAffectation(bordereau, etape).utilisateurId === utilisateurId;
  }

  static estPrisEnChargePar(
    bordereau: Bordereau,
    etape: EtapeAffectationBordereau,
    utilisateurId: number,
    maintenant = Date.now(),
  ): boolean {
    const affectation = lireAffectation(bordereau, etape);
    const age = maintenant - dateEnMs(affectation.prisEnChargeLe);
    return affectation.utilisateurId === utilisateurId
      && age >= 0
      && age <= PRISE_EN_CHARGE_TTL_MS;
  }

  static effacerAffectation(bordereau: Bordereau, etape: EtapeAffectationBordereau): void {
    ecrireAffectation(bordereau, etape, null, null, null);
  }

  static async actualiserPresenceEtRepartir(
    etape: EtapeAffectationBordereau,
    utilisateurId: number,
    siteScopeId?: number,
  ): Promise<void> {
    this.verifierUtilisateurId(utilisateurId);
    const siteId = normaliserSiteId(siteScopeId);
    const sequelize = DatabaseConnection.getInstance().sequelize;
    const transaction = await sequelize.transaction();
    const maintenant = new Date();
    const seuilPresence = new Date(maintenant.getTime() - PRESENCE_TTL_MS);

    try {
      await this.verrouillerEtape(etape, transaction);
      const presencesAvant = await sequelize.query<PresenceEnregistree>(
        `SELECT \`utilisateurId\`, \`etablissementId\`, \`derniereActivite\`
           FROM ${this.tablePresence}
          WHERE \`utilisateurId\` = :utilisateurId AND \`etape\` = :etape
          FOR UPDATE`,
        {
          replacements: { utilisateurId, etape },
          transaction,
          type: QueryTypes.SELECT,
        },
      );
      const presencePrecedente = presencesAvant[0];
      const memeCohorte = !!presencePrecedente
        && dateEnMs(presencePrecedente.derniereActivite) >= seuilPresence.getTime()
        && normaliserSiteId(presencePrecedente.etablissementId) === siteId;

      await this.enregistrerPresence(etape, utilisateurId, siteId, maintenant, transaction);
      const agents = await this.lireAgentsActifs(etape, seuilPresence, transaction);
      const boards = await this.lireBordereauxEnAttente(etape, siteId, transaction);
      const agentsParId = new Map(agents.map(agent => [agent.utilisateurId, agent]));
      const charges = new Map<number, number>();
      const aRepartir: Bordereau[] = [];

      for (const bordereau of boards) {
        const affectation = lireAffectation(bordereau, etape);
        const agePriseEnCharge = maintenant.getTime() - dateEnMs(affectation.prisEnChargeLe);
        const priseEnChargeActive = !!affectation.prisEnChargeLe
          && agePriseEnCharge >= 0
          && agePriseEnCharge <= PRISE_EN_CHARGE_TTL_MS;

        if (priseEnChargeActive && affectation.utilisateurId !== null) {
          const agent = agentsParId.get(affectation.utilisateurId);
          if (agent && agentPeutTraiter(agent, bordereau)) {
            charges.set(agent.utilisateurId, (charges.get(agent.utilisateurId) ?? 0) + 1);
          }
          if (affectation.utilisateurId === utilisateurId) {
            ecrireAffectation(bordereau, etape, utilisateurId, affectation.assigneLe, maintenant);
            await bordereau.save({ transaction });
          }
          continue;
        }

        const agent = affectation.utilisateurId === null
          ? undefined
          : agentsParId.get(affectation.utilisateurId);
        const agentToujoursEligible = !!agent && agentPeutTraiter(agent, bordereau);
        if (!memeCohorte || !agentToujoursEligible || affectation.prisEnChargeLe) {
          aRepartir.push(bordereau);
          continue;
        }

        charges.set(affectation.utilisateurId!, (charges.get(affectation.utilisateurId!) ?? 0) + 1);
      }

      const repartition = repartirBordereauxEquitablement(aRepartir, agents, charges);
      const nouveauxResponsables = new Map(repartition.map(item => [item.bordereauId, item.utilisateurId]));
      for (const bordereau of aRepartir) {
        const ancien = lireAffectation(bordereau, etape);
        const nouveauResponsable = nouveauxResponsables.get(Number(bordereau.id)) ?? null;
        if (
          ancien.utilisateurId !== nouveauResponsable
          || ancien.prisEnChargeLe !== null
          || (nouveauResponsable === null && ancien.assigneLe !== null)
        ) {
          ecrireAffectation(
            bordereau,
            etape,
            nouveauResponsable,
            nouveauResponsable === null ? null : maintenant,
            null,
          );
          await bordereau.save({ transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(rollbackError => {
        console.error("[BordereauAffectation] Échec du rollback de répartition:", rollbackError);
      });
      throw error;
    }
  }

  static async prendreEnCharge(
    etape: EtapeAffectationBordereau,
    bordereauId: number,
    utilisateurId: number,
    siteScopeId?: number,
  ): Promise<void> {
    this.verifierIdentifiants(bordereauId, utilisateurId);
    const siteId = normaliserSiteId(siteScopeId);
    const sequelize = DatabaseConnection.getInstance().sequelize;
    const transaction = await sequelize.transaction();
    const maintenant = new Date();

    try {
      await this.verrouillerEtape(etape, transaction);
      await this.enregistrerPresence(etape, utilisateurId, siteId, maintenant, transaction);
      const bordereau = await this.trouverBordereauVerrouille(bordereauId, etape, siteId, transaction);
      if (!bordereau) {
        throw new ErreurAffectationBordereau(404, "Bordereau introuvable.");
      }
      if (!STATUTS_PAR_ETAPE[etape].includes(bordereau.statut)) {
        throw new ErreurAffectationBordereau(409, "Ce bordereau n'est plus dans cette file.");
      }
      if (!this.estAffecteA(bordereau, etape, utilisateurId)) {
        throw new ErreurAffectationBordereau(409, "Ce bordereau est attribué à un autre agent. Actualisez la file.");
      }

      ecrireAffectation(bordereau, etape, utilisateurId, lireAffectation(bordereau, etape).assigneLe, maintenant);
      await bordereau.save({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback().catch(rollbackError => {
        console.error("[BordereauAffectation] Échec du rollback de prise en charge:", rollbackError);
      });
      throw error;
    }
  }

  static async liberer(
    etape: EtapeAffectationBordereau,
    bordereauId: number,
    utilisateurId: number,
    siteScopeId?: number,
  ): Promise<number | null> {
    this.verifierIdentifiants(bordereauId, utilisateurId);
    const siteId = normaliserSiteId(siteScopeId);
    const sequelize = DatabaseConnection.getInstance().sequelize;
    const transaction = await sequelize.transaction();
    const maintenant = new Date();
    const seuilPresence = new Date(maintenant.getTime() - PRESENCE_TTL_MS);

    try {
      await this.verrouillerEtape(etape, transaction);
      await this.enregistrerPresence(etape, utilisateurId, siteId, maintenant, transaction);
      const bordereau = await this.trouverBordereauVerrouille(bordereauId, etape, siteId, transaction);
      if (!bordereau) {
        throw new ErreurAffectationBordereau(404, "Bordereau introuvable.");
      }
      if (!STATUTS_PAR_ETAPE[etape].includes(bordereau.statut)) {
        throw new ErreurAffectationBordereau(409, "Ce bordereau n'est plus dans cette file.");
      }
      if (!this.estAffecteA(bordereau, etape, utilisateurId)) {
        throw new ErreurAffectationBordereau(409, "Ce bordereau n'est pas attribué à votre compte.");
      }

      const agents = await this.lireAgentsActifs(etape, seuilPresence, transaction);
      const boards = await this.lireBordereauxEnAttente(etape, siteId, transaction);
      const charges = new Map<number, number>();
      for (const item of boards) {
        if (Number(item.id) === bordereauId) continue;
        const affectation = lireAffectation(item, etape);
        if (affectation.utilisateurId === null) continue;
        const agent = agents.find(candidate => candidate.utilisateurId === affectation.utilisateurId);
        const agePriseEnCharge = maintenant.getTime() - dateEnMs(affectation.prisEnChargeLe);
        const priseEnChargeActive = !!affectation.prisEnChargeLe
          && agePriseEnCharge >= 0
          && agePriseEnCharge <= PRISE_EN_CHARGE_TTL_MS;
        if (priseEnChargeActive || (agent && agentPeutTraiter(agent, item))) {
          charges.set(affectation.utilisateurId, (charges.get(affectation.utilisateurId) ?? 0) + 1);
        }
      }

      const prochainResponsable = repartirBordereauxEquitablement(
        [bordereau],
        agents,
        charges,
        utilisateurId,
      )[0]?.utilisateurId ?? null;
      ecrireAffectation(
        bordereau,
        etape,
        prochainResponsable,
        prochainResponsable === null ? null : maintenant,
        null,
      );
      await bordereau.save({ transaction });
      await transaction.commit();
      return prochainResponsable;
    } catch (error) {
      await transaction.rollback().catch(rollbackError => {
        console.error("[BordereauAffectation] Échec du rollback de libération:", rollbackError);
      });
      throw error;
    }
  }

  private static verifierUtilisateurId(utilisateurId: number): void {
    if (!Number.isSafeInteger(utilisateurId) || utilisateurId <= 0) {
      throw new ErreurAffectationBordereau(401, "Utilisateur non authentifié.");
    }
  }

  private static verifierIdentifiants(bordereauId: number, utilisateurId: number): void {
    this.verifierUtilisateurId(utilisateurId);
    if (!Number.isSafeInteger(bordereauId) || bordereauId <= 0) {
      throw new ErreurAffectationBordereau(400, "Identifiant de bordereau invalide.");
    }
  }

  private static async verrouillerEtape(
    etape: EtapeAffectationBordereau,
    transaction: Transaction,
  ): Promise<void> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    await sequelize.query(
      `INSERT IGNORE INTO ${this.tableVerrous} (\`etape\`) VALUES (:etape)`,
      { replacements: { etape }, transaction },
    );
    await sequelize.query(
      `SELECT \`etape\` FROM ${this.tableVerrous} WHERE \`etape\` = :etape FOR UPDATE`,
      { replacements: { etape }, transaction, type: QueryTypes.SELECT },
    );
  }

  private static async enregistrerPresence(
    etape: EtapeAffectationBordereau,
    utilisateurId: number,
    etablissementId: number | null,
    derniereActivite: Date,
    transaction: Transaction,
  ): Promise<void> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    await sequelize.query(
      `INSERT INTO ${this.tablePresence}
         (\`utilisateurId\`, \`etape\`, \`etablissementId\`, \`derniereActivite\`)
       VALUES (:utilisateurId, :etape, :etablissementId, :derniereActivite)
       ON DUPLICATE KEY UPDATE
         \`etablissementId\` = VALUES(\`etablissementId\`),
         \`derniereActivite\` = VALUES(\`derniereActivite\`)`,
      {
        replacements: { utilisateurId, etape, etablissementId, derniereActivite },
        transaction,
      },
    );
  }

  private static async lireAgentsActifs(
    etape: EtapeAffectationBordereau,
    seuil: Date,
    transaction: Transaction,
  ): Promise<AgentActif[]> {
    const sequelize = DatabaseConnection.getInstance().sequelize;
    const presences = await sequelize.query<PresenceEnregistree>(
      `SELECT \`utilisateurId\`, \`etablissementId\`, \`derniereActivite\`
         FROM ${this.tablePresence}
        WHERE \`etape\` = :etape AND \`derniereActivite\` >= :seuil`,
      {
        replacements: { etape, seuil },
        transaction,
        type: QueryTypes.SELECT,
      },
    );
    return presences.map(presence => ({
      utilisateurId: Number(presence.utilisateurId),
      etablissementId: normaliserSiteId(presence.etablissementId),
    }));
  }

  private static async lireBordereauxEnAttente(
    etape: EtapeAffectationBordereau,
    siteScopeId: number | null,
    transaction: Transaction,
  ): Promise<Bordereau[]> {
    return Bordereau.findAll({
      where: {
        statut: { [Op.in]: STATUTS_PAR_ETAPE[etape] },
        ...(siteScopeId === null ? {} : { etablissementId: siteScopeId }),
      },
      order: [["id", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  private static async trouverBordereauVerrouille(
    bordereauId: number,
    etape: EtapeAffectationBordereau,
    siteScopeId: number | null,
    transaction: Transaction,
  ): Promise<Bordereau | null> {
    return Bordereau.findOne({
      where: {
        id: bordereauId,
        ...(siteScopeId === null ? {} : { etablissementId: siteScopeId }),
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
}

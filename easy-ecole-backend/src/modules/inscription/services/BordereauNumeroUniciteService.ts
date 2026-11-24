import { Op, Transaction, literal, where as sequelizeWhere } from 'sequelize';
import { Bordereau } from '../models/Bordereau';

/**
 * Normalise un numéro de bordereau pour l'unicité : « 041 » et « 41 » désignent
 * le même numéro. Seuls les numéros purement numériques sont normalisés, les
 * références alphanumériques restent comparées telles quelles.
 */
export function normaliserNumeroBordereau(numeroBordereau: string | null | undefined): string {
  const numero = String(numeroBordereau ?? '').trim();
  return /^\d+$/.test(numero) ? numero.replace(/^0+/, '') : numero;
}

export async function trouverBordereauAvecNumero(
  numeroBordereau: string,
  options: { excludeId?: number; transaction?: Transaction } = {},
): Promise<Bordereau | null> {
  const numero = String(numeroBordereau ?? '').trim();
  const numeroEstNumerique = /^\d+$/.test(numero);

  return Bordereau.findOne({
    where: {
      ...(options.excludeId ? { id: { [Op.ne]: options.excludeId } } : {}),
      ...(numeroEstNumerique
        ? {
            [Op.and]: [
              sequelizeWhere(
                literal("TRIM(LEADING '0' FROM `Bordereau`.`numeroBordereau`)"),
                normaliserNumeroBordereau(numero),
              ),
            ],
          }
        : { numeroBordereau: numero }),
    },
    paranoid: false,
    attributes: ['id', 'numeroBordereau', 'utilisateurId'],
    include: [{
      association: Bordereau.associations.utilisateur,
      attributes: ['id', 'nom', 'prenoms'],
    }],
    transaction: options.transaction,
  });
}

export function creerConflitNumeroBordereau(
  doublon: Bordereau,
  utilisateurId: number,
  numeroBordereau: string,
) {
  const memeEtudiant = Number(doublon.utilisateurId) === Number(utilisateurId);
  const etudiant = {
    id: Number(doublon.utilisateurId),
    nom: doublon.utilisateur?.nom || '',
    prenoms: doublon.utilisateur?.prenoms || '',
  };
  const nomEtudiant = [etudiant.prenoms, etudiant.nom].filter(Boolean).join(' ') || 'Nom indisponible';

  return {
    success: false,
    code: memeEtudiant
      ? 'BORDEREAU_NUMERO_DEJA_UTILISE_PAR_MEME_ETUDIANT'
      : 'BORDEREAU_NUMERO_DEJA_UTILISE_PAR_AUTRE_ETUDIANT',
    message: memeEtudiant
      ? 'Alerte fraude : ce compte a déjà envoyé ce bordereau.'
      : `Alerte fraude : ce numéro de dépôt est déjà associé à l'étudiant ${nomEtudiant}. Ne validez pas ce bordereau avant vérification.`,
    details: {
      numeroBordereau,
      memeEtudiant,
      etudiant,
    },
  };
}

export function estConflitUniqueNumeroBordereau(error: any): boolean {
  const source = error?.parent || error?.original || error;
  const message = [source?.message, source?.sqlMessage, error?.message].filter(Boolean).join(' ');
  return source?.code === 'ER_DUP_ENTRY'
    && (message.includes('numeroBordereau') || message.includes('uq_ins_bordereaux_numeroBordereau'));
}

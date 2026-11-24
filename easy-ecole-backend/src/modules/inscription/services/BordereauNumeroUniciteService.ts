import { Op, Transaction } from 'sequelize';
import { Bordereau } from '../models/Bordereau';

export async function trouverBordereauAvecNumero(
  numeroBordereau: string,
  options: { excludeId?: number; transaction?: Transaction } = {},
): Promise<Bordereau | null> {
  return Bordereau.findOne({
    where: {
      numeroBordereau,
      ...(options.excludeId ? { id: { [Op.ne]: options.excludeId } } : {}),
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

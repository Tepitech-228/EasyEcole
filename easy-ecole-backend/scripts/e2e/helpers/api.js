/**
 * helpers/api.js
 * Client HTTP léger pour les tests E2E + génération de tokens JWT.
 */

const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../../../src/core/config/jwt')
const DatabaseConnection = require('../../../src/core/helpers/DatabaseConnection').DatabaseConnection

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000/api/v1'

const ROLES = {
  ADMIN: 'admin',
  APPRENANT: 'apprenant',
  ENSEIGNANT: 'enseignant',
  INSTITUTION: 'institution',
  ESA_COMPTA: 'esa_compta',
  COMITE_ORIENTATION: 'comite_orientation',
  SECRETAIRE: 'secretaire',
  CABINET_COMPTABLE: 'cabinet_comptable'
}

async function buildToken(user) {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    id: user.id,
    email: user.email,
    identifiant: user.identifiant,
    role: user.role,
    tokenVersion: user.tokenVersion,
    etablissementId: user.etablissementId || null
  }
  return jwt.sign(payload, JWT_SECRET)
}

/**
 * Affecte un compte à un site (multi-sites).
 * Depuis le commit 91f810fb, tout appel non-ADMIN doit porter un `etablissementId`
 * dans son JWT ET une affectation en base, sinon les contrôleurs de site renvoient
 * 403 « Aucun site actif sélectionné ».
 */
async function ensureAffectation(db, utilisateurId, etablissementId) {
  const rows = await db.query(
    'SELECT id FROM aut_utilisateur_etablissements WHERE utilisateurId = ? AND etablissementId = ? LIMIT 1',
    { replacements: [utilisateurId, etablissementId], type: db.QueryTypes.SELECT }
  )
  const existing = Array.isArray(rows) ? rows[0] : rows
  if (existing && existing.id) return
  await db.query(
    'INSERT INTO aut_utilisateur_etablissements (utilisateurId, etablissementId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
    { replacements: [utilisateurId, etablissementId], type: db.QueryTypes.INSERT }
  )
}

async function createUserAndToken({
  nom, prenoms, email, identifiant, role = ROLES.APPRENANT, password = 'Test123!', etablissementId = null
}) {
  const db = DatabaseConnection.getInstance().sequelize
  // Les comptes « soft-supprimés » (deletedAt renseigné) doivent être écartés :
  // Sequelize est en mode paranoid, donc findByPk renvoie null → le middleware
  // Authenticate répond 401 « Token invalide (session expirée) » pour tout token
  // construit sur ces lignes. On les ressuscite plutôt que de les dupliquer
  // (email / identifiant sont uniques, l'INSERT échouerait).
  const existingRows = await db.query(
    'SELECT id, nom, prenoms, identifiant, email, role, tokenVersion, etablissementId, deletedAt FROM aut_utilisateurs WHERE email = ? OR identifiant = ? ORDER BY deletedAt IS NULL DESC, id ASC LIMIT 1',
    { replacements: [email, identifiant], type: db.QueryTypes.SELECT }
  )
  const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows
  if (existing && existing.id) {
    if (existing.deletedAt) {
      await db.query(
        'UPDATE aut_utilisateurs SET deletedAt = NULL, updatedAt = NOW() WHERE id = ?',
        { replacements: [existing.id], type: db.QueryTypes.UPDATE }
      )
      existing.deletedAt = null
    }
    if (etablissementId && !existing.etablissementId) {
      await db.query(
        'UPDATE aut_utilisateurs SET etablissementId = ?, updatedAt = NOW() WHERE id = ?',
        { replacements: [etablissementId, existing.id], type: db.QueryTypes.UPDATE }
      )
      existing.etablissementId = etablissementId
    }
    if (etablissementId) await ensureAffectation(db, existing.id, etablissementId)
    const token = await buildToken(existing)
    return { user: existing, token }
  }

  const bcrypt = require('bcrypt')
  const hashed = await bcrypt.hash(password, 10)

  const [result] = await db.query(
    'INSERT INTO aut_utilisateurs (nom, prenoms, identifiant, email, motDePasse, role, contact, tokenVersion, etablissementId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())',
    { replacements: [nom, prenoms, identifiant, email, hashed, role, '0000000000', etablissementId], type: db.QueryTypes.INSERT }
  )
  const userId = typeof result === 'number' ? result : (result.insertId || result[0]?.id)

  if (role === ROLES.APPRENANT && userId) {
    try {
      await db.query(
        'INSERT INTO aut_apprenants (utilisateurId, dateNaissance, lieuNaissance, sexe, nationalite, numeroPiece, typePieceIdentite, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        { replacements: [userId, '2000-01-01', 'TestVille', 'M', 'TestNationalite', 'CNI123456', 'CNI'], type: db.QueryTypes.INSERT }
      )
    } catch(e) {
      // colonnes peuvent varier, fallback minimal
      try {
        await db.query(
          'INSERT INTO aut_apprenants (utilisateurId, createdAt, updatedAt) VALUES (?, NOW(), NOW())',
          { replacements: [userId], type: db.QueryTypes.INSERT }
        )
      } catch(e2){}
    }
  }

  const userRows = await db.query(
    'SELECT id, nom, prenoms, identifiant, email, role, tokenVersion, etablissementId FROM aut_utilisateurs WHERE id = ?',
    { replacements: [userId], type: db.QueryTypes.SELECT }
  )
  const user = Array.isArray(userRows) ? userRows[0] : userRows
  if (etablissementId && userId) await ensureAffectation(db, userId, etablissementId)
  const token = await buildToken(user)
  return { user, token }
}

async function apiRequest(method, route, token, body, isForm = false) {
  const headers = {}
  if (token) headers['Authorization'] = 'Bearer ' + token
  let payload
  if (body && !isForm) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  } else if (body && isForm) {
    payload = body
  }

  const res = await fetch(BASE + route, { method, headers, body: payload })
  let text = ''
  try { text = await res.text() } catch (e) {}
  let json = null
  try { json = JSON.parse(text) } catch (e) {}
  return { status: res.status, json, text: text || '' }
}

function getBaseUrl() { return BASE }
function fakePdf(label) {
  return '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n' +
    'trailer\n<< /Size 3 /Root 1 0 R >>\n%%EOF\n' + `<!-- ${label} -->`
}
function toFile(label) { return new Blob([fakePdf(label)], { type: 'application/pdf' }) }

module.exports = { ROLES, buildToken, createUserAndToken, apiRequest, getBaseUrl, fakePdf, toFile, BASE }

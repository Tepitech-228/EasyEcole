#!/usr/bin/env node
/**
 * run-e2e.js — Orchestrateur principal des tests E2E EasyEcole
 *
 * Exécute séquentiellement les 8 phases d'un scénario scolaire complet.
 *
 * Usage :
 *   node scripts/e2e/run-e2e.js
 *   npm run test:e2e
 */
require('dotenv').config()

const { DatabaseConnection } = require('../../src/core/helpers/DatabaseConnection')
const { cleanE2EData } = require('./helpers/seeds.js')
const { phase1 } = require('./01-annee-scolaire.js')
const { phase2 } = require('./02-inscription-10.js')
const { phase3 } = require('./03-saisie-notes-releves.js')
const { phase4 } = require('./04-rattrapage-5.js')
const { phase5 } = require('./05-notes-rattrapage.js')
const { phase6 } = require('./06-bulletins-apres.js')
const { phase7 } = require('./07-reinscription-10.js')
const { phase8 } = require('./08-documents.js')

const PHASES = [
  { id: '01', name: 'Année scolaire', fn: phase1 },
  { id: '02', name: 'Inscription 10 étudiants', fn: phase2 },
  { id: '03', name: 'Saisie notes + relevés', fn: phase3 },
  { id: '04', name: 'Rattrapage 5 étudiants', fn: phase4 },
  { id: '05', name: 'Notes rattrapage', fn: phase5 },
  { id: '06', name: 'Bulletins après rattrapage', fn: phase6 },
  { id: '07', name: 'Réinscription 10 étudiants', fn: phase7 },
  { id: '08', name: 'Demandes de documents', fn: phase8 }
]

const START_TIME = Date.now()
let passedPhases = 0
let failedPhases = 0
let context = {}

function logBanner(text) {
  const line = '='.repeat(60)
  console.log(`\n${line}`)
  console.log(`  ${text}`)
  console.log(`${line}\n`)
}

async function run() {
  logBanner('E2E TESTS — EasyEcole Année Scolaire Complète')
  console.log(`Démarrage à ${new Date().toISOString()}`)
  console.log(`Base de données : ${process.env.DB_NAME || 'easyecole'}`)
  console.log(`API Base URL : ${process.env.E2E_BASE_URL || 'http://localhost:3000/api/v1'}`)

  // Nettoyage des données E2E précédentes
  await cleanE2EData()
  console.log('\n[OK] Données E2E nettoyées')

  // Vérification connexion DB
  logBanner('VÉRIFICATION CONNEXION DB')
  try {
    const db = DatabaseConnection.getInstance().sequelize
    await db.authenticate()
    console.log('[OK] Connexion à la base de données établie')
  } catch (e) {
    console.log(`[FAIL] Impossible de se connecter à la base : ${e.message}`)
    console.log('Assurez-vous que le serveur API est en cours d\'exécution.')
    process.exit(1)
  }

  // Exécuter les phases
  for (const phase of PHASES) {
    logBanner(`PHASE ${phase.id} : ${phase.name}`)
    const phaseStart = Date.now()

    try {
      const result = await phase.fn(context)
      context = { ...context, ...result }
      const elapsed = Date.now() - phaseStart
      console.log(`[OK] Phase ${phase.id} terminée en ${elapsed}ms`)
      passedPhases++
    } catch (error) {
      console.log(`[FAIL] Phase ${phase.id} (${phase.name}) : ${error.message}`)
      console.error(error.stack)
      failedPhases++
      console.log('\n[ARRÊT] Arrêt des tests E2E suite à un échec critique.')
      break
    }
  }

  // Résumé final
  const totalTime = Date.now() - START_TIME
  logBanner('RÉSUMÉ DES TESTS E2E')

  console.log(`\n  Phases exécutées : ${passedPhases + failedPhases}/${PHASES.length}`)
  console.log(`  ✅ Réussies : ${passedPhases}`)
  console.log(`  ❌ Échouées : ${failedPhases}`)
  console.log(`  ⏱️  Temps total : ${(totalTime / 1000).toFixed(1)}s`)
  console.log(`\n  Date de fin : ${new Date().toISOString()}`)

  if (failedPhases > 0) {
    console.log('\n[FAIL] Certains tests E2E ont échoué.')
    process.exit(1)
  } else {
    console.log('\n[OK] Tous les tests E2E ont réussi !')
    process.exit(0)
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Erreur non interceptée :', reason)
  process.exit(1)
})

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Exception non interceptée :', err.message)
  process.exit(1)
})

run()

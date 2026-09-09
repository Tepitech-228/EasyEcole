const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const reportDir = path.join(root, 'test-reports')
const startedAt = new Date()
const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
const nodeCommand = process.execPath
const results = []

function run(name, command, args, cwd, options = {}) {
  const started = Date.now()
  // Sous Windows, `npm.cmd` ne peut pas être exécuté directement via
  // spawnSync(..., { shell: false }) (= EINVAL). On passe donc par le shell
  // uniquement pour la commande npm, en reconstruisant la ligne de commande.
  const useShell = isWindows && command === npmCommand
  const spawnCommand = useShell ? [command, ...args].join(' ') : command
  const spawnArgs = useShell ? [] : args
  const result = spawnSync(spawnCommand, spawnArgs, {
    cwd,
    env: process.env,
    encoding: 'utf8',
    timeout: options.timeout || 30 * 60 * 1000,
    maxBuffer: 20 * 1024 * 1024,
    shell: useShell,
  })
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
  const passed = result.status === 0 && !result.error
  results.push({
    name,
    command: [command, ...args].join(' '),
    cwd: path.relative(root, cwd) || '.',
    status: passed ? 'PASS' : 'FAIL',
    exitCode: result.status,
    durationMs: Date.now() - started,
    output,
    error: result.error ? result.error.message : '',
  })
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`)
  if (!passed && result.error) console.error(`       ${result.error.message}`)
  return passed
}

const frontend = path.join(root, 'easy-ecole-web')
const backend = path.join(root, 'easy-ecole-backend')

run('Backend types', npmCommand, ['run', 'types'], backend)
run('Backend build', npmCommand, ['run', 'build'], backend)
run('Frontend build', npmCommand, ['run', 'build'], frontend, { timeout: 45 * 60 * 1000 })
run('Backend unit tests', npmCommand, ['test', '--', '--runInBand'], backend, { timeout: 45 * 60 * 1000 })
run('Frontend unit tests', npmCommand, ['test', '--', '--watch=false', '--browsers=ChromeHeadless'], frontend, { timeout: 45 * 60 * 1000 })
run('Cypress E2E', npmCommand, ['run', 'test:e2e'], frontend, { timeout: 45 * 60 * 1000 })

const backendE2E = [
  ['E2E demandes de documents', 'e2e-demandes-documents.cjs'],
  ['E2E planning, volumes et pointage', 'e2e-planning-volume-pointage.cjs'],
  ['E2E workflow rattrapage', 'e2e-rattrapage-workflow.cjs'],
  ['E2E notes et releves S1/S2', 'e2e-notes-releve.cjs'],
  ['E2E création de session', 'e2e-session-creation.cjs'],
]

for (const [name, script] of backendE2E) {
  const scriptPath = path.join(backend, script)
  if (fs.existsSync(scriptPath)) run(name, nodeCommand, [scriptPath], backend, { timeout: 45 * 60 * 1000 })
  else results.push({ name, command: `node ${scriptPath}`, cwd: path.relative(root, backend), status: 'SKIP', exitCode: null, durationMs: 0, output: 'Script absent', error: '' })
}

fs.mkdirSync(reportDir, { recursive: true })
const finishedAt = new Date()
const reportName = `rapport-tests-${startedAt.toISOString().replace(/[:.]/g, '-')}.md`
const reportPath = path.join(reportDir, reportName)
const passed = results.filter(result => result.status === 'PASS').length
const failed = results.filter(result => result.status === 'FAIL').length
const skipped = results.filter(result => result.status === 'SKIP').length

const lines = [
  '# Rapport des tests EasyEcole',
  '',
  `- Debut : ${startedAt.toISOString()}`,
  `- Fin : ${finishedAt.toISOString()}`,
  `- Resultat : ${failed === 0 ? 'SUCCES' : 'ECHECS'}`,
  `- Passes : ${passed}`,
  `- Echoues : ${failed}`,
  `- Ignores : ${skipped}`,
  '',
  '## Synthese',
  '',
  '| Test | Statut | Duree | Commande |',
  '|---|---:|---:|---|',
]

for (const result of results) {
  const duration = `${(result.durationMs / 1000).toFixed(1)} s`
  lines.push(`| ${result.name} | ${result.status} | ${duration} | \`${result.command}\` |`)
}

for (const result of results) {
  lines.push('', `## ${result.status} - ${result.name}`, '', `Repertoire : \`${result.cwd}\``, '', '```text', result.output || result.error || 'Aucune sortie', '```')
}

fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`\nRapport genere : ${path.relative(root, reportPath)}`)
process.exitCode = failed === 0 ? 0 : 1

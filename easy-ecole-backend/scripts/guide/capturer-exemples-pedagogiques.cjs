/**
 * Produit des illustrations pédagogiques locales à partir des captures de liste.
 * Aucun navigateur applicatif ni aucune API n'est contacté.
 *
 * Usage : node scripts/guide/capturer-exemples-pedagogiques.cjs
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const IMAGE_DIR = path.join(ROOT, 'docs', 'guide', 'images-nouveau', 'enseignant');
const SUPERVISEUR_IMAGE_DIR = path.join(ROOT, 'docs', 'guide', 'images-nouveau', 'superviseur-general');
const BANNER = 'SIMULATION DE FORMATION — EXEMPLE FICTIF — AUCUNE DONNÉE ENREGISTRÉE';

function dimensionsPng(buffer) {
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error('La capture source n’est pas un PNG valide.');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function carte(titre, details, left = 292, top = 284) {
  return `<div class="card" style="left:${left}px;top:${top}px">
    <div class="card-cover"><span>ESA</span><strong>EXEMPLE</strong></div>
    <div class="card-body"><strong>${titre}</strong><p>${details}</p></div>
  </div>`;
}

function bandeau() {
  return `<div class="banner">${BANNER}</div>`;
}

function panneau(titre, sousTitre, contenu, boutons = '') {
  return `<div class="app-panel">
    <div class="panel-head">
      <div><h1>${titre}</h1><p>${sousTitre}</p></div>
      ${boutons}
    </div>
    ${contenu}
  </div>`;
}

function champ(label, valeur, classe = '') {
  return `<div class="field ${classe}"><label>${label}</label><div class="input">${valeur}</div></div>`;
}

function tableau(entetes, lignes) {
  return `<table><thead><tr>${entetes.map(item => `<th>${item}</th>`).join('')}</tr></thead>
    <tbody>${lignes.map(ligne => `<tr>${ligne.map(item => `<td>${item}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

async function capturer(page, fichierSource, fichierSortie, contenu, mode = 'page', imageDir = IMAGE_DIR) {
  const image = fs.readFileSync(path.join(imageDir, fichierSource));
  const { width, height } = dimensionsPng(image);
  const html = `<!doctype html>
    <html lang="fr"><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; font-family: Arial, sans-serif; color: #233047; }
      .stage { position: relative; width: ${width}px; height: ${height}px; overflow: hidden; background: #f4f6fb; }
      .background { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
      .banner { position: absolute; z-index: 20; top: 8px; left: 280px; padding: 8px 12px; color: #78350f; background: #fffbeb; border: 1px solid #f59e0b; border-radius: 6px; box-shadow: 0 2px 6px #0002; font-size: 12px; font-weight: 700; letter-spacing: .15px; }
      .mask { position: absolute; z-index: 5; background: #f4f6fb; }
      .card { position: absolute; z-index: 7; overflow: hidden; width: 280px; height: 252px; border: 1px solid #d8dee8; border-radius: 8px; background: white; box-shadow: 0 1px 2px #0001; }
      .card-cover { height: 157px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; background: linear-gradient(135deg,#dcecff,#8fc7e8 55%,#1f3c75); color: white; }
      .card-cover span { font-size: 18px; font-weight: 700; letter-spacing: 3px; }
      .card-cover strong { padding: 4px 8px; border: 1px solid #ffffff99; border-radius: 4px; font-size: 12px; letter-spacing: 1px; }
      .card-body { padding: 13px 15px; font-size: 15px; }
      .card-body p { margin: 9px 0 0; color: #667085; font-size: 13px; }
      .app-panel { position: absolute; z-index: 8; left: 282px; top: 112px; width: ${width - 310}px; height: ${height - 135}px; padding: 24px; overflow: hidden; border: 1px solid #d8dee8; border-radius: 10px; background: #fff; box-shadow: 0 6px 24px #17203320; }
      .panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
      h1 { margin: 0; color: #1f3c75; font-size: 22px; }
      .panel-head p { margin: 7px 0 0; color: #667085; font-size: 14px; }
      .meta { display: flex; gap: 10px; flex-wrap: wrap; margin: 12px 0 20px; color: #667085; font-size: 13px; }
      .chip { display: inline-block; padding: 5px 10px; border-radius: 999px; background: #eef2ff; color: #314b85; font-size: 12px; font-weight: 700; white-space: nowrap; }
      .button { display: inline-block; padding: 10px 14px; border: 0; border-radius: 6px; background: #1576aa; color: #fff; font-size: 13px; font-weight: 700; white-space: nowrap; }
      .button.gray { background: #eef1f5; color: #344054; border: 1px solid #d0d5dd; }
      .callout { margin: 12px 0 0; padding: 10px 12px; border-left: 4px solid #f59e0b; border-radius: 4px; background: #fffbeb; color: #78350f; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { padding: 12px 10px; background: #1f3c75; color: white; text-align: left; }
      td { padding: 13px 10px; border-bottom: 1px solid #e6eaf0; vertical-align: top; }
      tbody tr:nth-child(even) { background: #f7f9fc; }
      .time { color: #475467; white-space: nowrap; font-weight: 700; }
      .modal-shade { position: absolute; z-index: 8; left: 260px; top: 108px; width: ${width - 260}px; height: ${height - 108}px; background: #e8edf5; }
      .modal { position: absolute; z-index: 9; left: 420px; top: 120px; width: 780px; max-height: 700px; padding: 24px; overflow: hidden; border-radius: 10px; background: white; box-shadow: 0 12px 36px #0004; }
      .modal h2 { margin: 0; color: #1f3c75; font-size: 20px; }
      .modal > p { margin: 7px 0 20px; color: #667085; font-size: 13px; }
      .fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
      .field label { display: block; margin-bottom: 6px; color: #667085; font-size: 12px; }
      .input { min-height: 38px; padding: 10px; border: 1px solid #d0d5dd; border-radius: 5px; background: white; font-size: 13px; }
      .mock-select { min-width: 190px; padding: 6px 8px; border: 1px solid #d0d5dd; border-radius: 5px; background: white; color: #344054; font: 13px Arial, sans-serif; }
      .field.full { grid-column: 1 / -1; }
      .textarea { height: 78px; line-height: 1.5; }
      .modal-actions { display: flex; justify-content: space-between; margin-top: 20px; }
      .row-status { min-width: 130px; }
      .watermark { position: absolute; z-index: 12; right: 24px; bottom: 18px; padding: 7px 10px; border: 1px solid #f59e0b; border-radius: 5px; background: #fffbeb; color: #92400e; font-size: 11px; font-weight: 700; }
    </style></head><body>
      <div class="stage">
        <img class="background" src="data:image/png;base64,${image.toString('base64')}" alt="">
        ${mode === 'list' ? `<div class="mask" style="left:282px;top:272px;width:${width - 300}px;height:${height - 290}px"></div>` : ''}
        ${contenu}
        ${bandeau()}
      </div>
    </body></html>`;

  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(imageDir, fichierSortie) });
  console.log(`Capture : ${fichierSortie}`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().startsWith('data:') || request.url().startsWith('about:')) {
        request.continue();
      } else {
        request.abort('blockedbyclient');
      }
    });

    await capturer(
      page,
      '09_cahiers-de-texte.png',
      '90_cahier-texte-exemple.png',
      `${carte('Cahier — MATH-DEMO', 'Licence 1 · classe démo · équipe pédagogique fictive', 292, 284)}
       <div class="card" style="left:610px;top:284px">
         <div class="card-cover"><span>ESA</span><strong>EXEMPLE</strong></div>
         <div class="card-body"><strong>Cahier — INFO-DEMO</strong><p>Licence 1 · classe démo · équipe pédagogique fictive</p></div>
       </div>
       <div class="watermark">Liste fictive — aucun cahier créé</div>`,
      'list',
    );

    await capturer(
      page,
      '09_cahiers-de-texte.png',
      '96_cahier-texte-nouveau-exemple.png',
      `<div class="modal-shade"></div>
       <div class="modal">
         <h2>Nouveau cahier de texte</h2><p>Créer un cahier rattaché à un cours existant · exemple fictif</p>
         <div class="fields">
           ${champ('Choisir parmi les cours', '☑ Activé — sélectionner un cours existant', 'full')}
           ${champ('Cours', 'MATH-DEMO — Mathématiques fondamentales', 'full')}
           ${champ('Enseignant', 'Enseignant démo')}
           ${champ('Classe', 'Licence 1 — classe démo')}
           ${champ('Description (facultative)', 'Cahier de démonstration', 'full')}
         </div>
         <div class="callout">Sélectionner le cours attribué. Ce formulaire ne crée pas de cours ni d’UE.</div>
         <div class="modal-actions"><span class="button gray">Annuler</span><span class="button">Enregistrer</span></div>
       </div>
       <div class="watermark">Formulaire fictif — aucune sauvegarde</div>`,
      'modal',
    );

    await capturer(
      page,
      '09_cahiers-de-texte.png',
      '91_cahier-texte-detail-exemple.png',
      panneau(
        'Cahier de texte : MATH-DEMO — Mathématiques fondamentales',
        'Licence 1 · Classe démo · Cahier d’exemple non enregistré',
        `<div class="meta"><span class="chip">Cours existant</span><span class="chip">Données fictives</span></div>
         ${tableau(
           ['Heure', 'Contenu', 'Action'],
           [
             ['<span class="time">08:00 à 10:00</span>', '<strong>Chapitre 3 — Fonction dérivée</strong><br>Objectifs : reconnaître les règles de dérivation et calculer une dérivée simple.<br>Exercices guidés sur des fonctions polynomiales.', '—'],
             ['<span class="time">10:15 à 12:15</span>', '<strong>Travaux dirigés</strong><br>Correction collective d’exercices et rappel des méthodes de vérification.', '—'],
           ],
         )}
         <div class="callout">Exemple pédagogique : les blocs affichés ci-dessus sont fictifs. L’écran réel ne les enregistre qu’après validation de l’action « Enregistrer ».</div>`,
        '<span class="button">Nouveau bloc</span>',
      ),
    );

    await capturer(
      page,
      '09_cahiers-de-texte.png',
      '92_cahier-texte-nouveau-bloc-exemple.png',
      `<div class="modal-shade"></div>
       <div class="modal">
         <h2>Nouveau bloc</h2><p>Ajouter un nouveau bloc dans ce cahier de texte · exemple fictif</p>
         <div class="fields">
           ${champ('Date', '02/11/2026')}
           ${champ('Heure de début', '08:00')}
           ${champ('Heure de fin', '10:00')}
           <div class="field full"><label>Contenu</label><div class="input textarea"><strong>Chapitre 3 — Fonction dérivée</strong><br>Objectif : appliquer les règles de dérivation.<br>Activité : exercices guidés et correction collective.</div></div>
         </div>
         <div class="callout">Ne pas cliquer sur « Enregistrer » pendant la consultation de cette illustration.</div>
         <div class="modal-actions"><span class="button gray">Annuler</span><span class="button">Enregistrer</span></div>
       </div>
       <div class="watermark">Formulaire fictif — aucune sauvegarde</div>`,
      'modal',
    );

    await capturer(
      page,
      '10_cahier-de-presence.png',
      '93_presence-liste-exemple.png',
      `${carte('Présence — MATH-DEMO', 'Licence 1 · classe démo · équipe pédagogique fictive', 292, 284)}
       <div class="watermark">Liste fictive — aucune présence créée</div>`,
      'list',
    );

    await capturer(
      page,
      '10_cahier-de-presence.png',
      '97_presence-nouvelle-liste-exemple.png',
      `<div class="modal-shade"></div>
       <div class="modal">
         <h2>Nouvelle liste de présence</h2><p>Rattacher la liste à un cours ou à une séance · exemple fictif</p>
         <div class="fields">
           ${champ('Choisir parmi les cours', '☑ Activé — sélectionner un cours existant', 'full')}
           ${champ('Cours', 'MATH-DEMO — Mathématiques fondamentales', 'full')}
           ${champ('Enseignant', 'Enseignant démo', 'full')}
           ${champ('Description (facultative)', 'Liste de démonstration — Licence 1', 'full')}
         </div>
         <div class="callout">Vérifier le cours et l’enseignant avant de créer la liste. Une liste est une donnée persistante dans l’application réelle.</div>
         <div class="modal-actions"><span class="button gray">Annuler</span><span class="button">Enregistrer</span></div>
       </div>
       <div class="watermark">Formulaire fictif — aucune sauvegarde</div>`,
      'modal',
    );

    await capturer(
      page,
      '10_cahier-de-presence.png',
      '94_presence-feuille-exemple.png',
      panneau(
        'Liste de présences : MATH-DEMO — Mathématiques fondamentales',
        'Licence 1 · Classe démo · Feuille de présence fictive',
        `<div class="meta"><span class="chip">02/11/2026</span><span class="chip">08:00 à 10:00</span><span class="chip">3 apprenants fictifs</span></div>
         ${tableau(
           ['#', 'Apprenant', 'Présence'],
           [
             ['1', 'Apprenant Démo A', '<span class="chip" style="background:#dcfce7;color:#166534">Présent</span>'],
             ['2', 'Apprenant Démo B', '<span class="chip" style="background:#fee2e2;color:#991b1b">Absent</span>'],
             ['3', 'Apprenant Démo C', '<span class="chip" style="background:#fef3c7;color:#92400e">Absence justifiée</span>'],
           ],
         )}
         <div class="callout">Les états sont des exemples. Selon le rôle connecté, la feuille existante est consultable en badges ou modifiable par sélecteur. La signature n’est pas simulée.</div>`,
        '<span class="button">Nouvelle présence</span>',
      ),
    );

    await capturer(
      page,
      '10_cahier-de-presence.png',
      '95_presence-nouvelle-seance-exemple.png',
      `<div class="modal-shade"></div>
       <div class="modal">
         <h2>Nouvelle présence</h2><p>Enregistrer une séance et renseigner l’état de chaque apprenant · exemple fictif</p>
         <div class="fields">
           ${champ('Date', '02/11/2026')}
           ${champ('Heure de début', '08:00')}
           ${champ('Heure de fin', '10:00')}
         </div>
         <div style="margin-top:20px">${tableau(
           ['#', 'Apprenant', 'Présence'],
           [
             ['1', 'Apprenant Démo A', '<select class="mock-select"><option selected>Présent</option><option>Absent</option><option>Absence justifiée</option><option>Non renseigné</option></select>'],
             ['2', 'Apprenant Démo B', '<select class="mock-select"><option>Présent</option><option selected>Absent</option><option>Absence justifiée</option><option>Non renseigné</option></select>'],
             ['3', 'Apprenant Démo C', '<select class="mock-select"><option>Présent</option><option>Absent</option><option selected>Absence justifiée</option><option>Non renseigné</option></select>'],
           ],
         )}</div>
         <div class="callout">Vérifier la date, les horaires et chaque état avant « Enregistrer ». Cette capture n’enregistre rien.</div>
         <div class="modal-actions"><span class="button gray">Annuler</span><span class="button">Enregistrer</span></div>
       </div>
       <div class="watermark">Exemple fictif — aucune sauvegarde</div>`,
      'modal',
    );

    const jours = ['Lun. 02/11', 'Mar. 03/11', 'Mer. 04/11', 'Jeu. 05/11', 'Ven. 06/11', 'Sam. 07/11', 'Dim. 08/11'];
    const heures = Array.from({ length: 12 }, (_, index) => {
      const heure = 6 + Math.floor(index / 2);
      return `${String(heure).padStart(2, '0')}:${index % 2 ? '30' : '00'}`;
    });
    const seances = [
      { jour: 0, debut: '08:00', fin: '10:00', code: 'MATH-DEMO', titre: 'Analyse I', salle: 'Salle A-01' },
      { jour: 2, debut: '09:00', fin: '10:30', code: 'INFO-DEMO', titre: 'Bases de données', salle: 'Salle B-02' },
      { jour: 4, debut: '10:00', fin: '12:00', code: 'PHY-DEMO', titre: 'Mécanique', salle: 'Salle C-03' },
    ];
    const entetePlanning = `<div style="display:grid;grid-template-columns:46px repeat(7,1fr);height:58px;background:#1f3c75;color:#fff;font-size:14px;font-weight:700;text-align:center">
      <div></div>${jours.map(jour => `<div style="display:flex;align-items:center;justify-content:center;border-left:1px solid #ffffff44">${jour}</div>`).join('')}
    </div>`;
    const colonnesPlanning = jours.map((_, jour) => {
      const blocs = seances.filter(seance => seance.jour === jour).map(seance => {
        const [debutHeure, debutMinute] = seance.debut.split(':').map(Number);
        const [finHeure, finMinute] = seance.fin.split(':').map(Number);
        const top = ((debutHeure * 60 + debutMinute - 360) / 30) * 41;
        const height = ((finHeure * 60 + finMinute - debutHeure * 60 - debutMinute) / 30) * 41;
        return `<div style="position:absolute;left:4px;right:4px;top:${top + 3}px;height:${height - 6}px;overflow:hidden;padding:7px;border:1px solid #7ba7e8;border-left:4px solid #2863c5;border-radius:5px;background:#e8f1ff;color:#1e3a8a;font-size:11px;line-height:1.45">
          <strong>${seance.code} · ${seance.titre}</strong><br>${seance.debut}–${seance.fin} · ${seance.salle}<br>Enseignant Démo
        </div>`;
      }).join('');
      return `<div style="position:relative;border-left:1px solid #d5dbe5;background:repeating-linear-gradient(to bottom,#f8fafc 0,#f8fafc 40px,#d5dbe5 40px,#d5dbe5 41px)">${blocs}</div>`;
    }).join('');
    const planningFictif = `<div style="position:absolute;z-index:8;left:292px;top:281px;width:1258px;height:557px;overflow:hidden;border:1px solid #d5dbe5;background:#f8fafc">
      ${entetePlanning}
      <div style="display:grid;grid-template-columns:46px repeat(7,1fr);height:492px">
        <div style="display:grid;grid-template-rows:repeat(12,41px);background:#fff;color:#344054;font-size:12px">${heures.map(heure => `<div style="padding:5px 3px;border-top:1px solid #d5dbe5">${heure}</div>`).join('')}</div>
        ${colonnesPlanning}
      </div>
    </div>
    <div style="position:absolute;z-index:9;left:12px;top:234px;width:236px;height:38px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#344054;font-size:12px">
      Site Démo (fictif)<span>▼</span>
    </div>
    <div style="position:absolute;z-index:9;left:800px;top:106px;width:140px;padding:10px 12px;border-radius:6px;background:#4f46e5;color:#fff;text-align:center;font-size:12px;font-weight:700">Publier l’EDT</div>
    <div class="watermark">Planning fictif — aucune séance enregistrée</div>`;

    await capturer(
      page,
      '02_emplois-du-temps.png',
      '90_emploi-du-temps-exemple-superviseur.png',
      planningFictif,
      'page',
      SUPERVISEUR_IMAGE_DIR,
    );

    await capturer(
      page,
      '02_emplois-du-temps.png',
      '91_nouvelle-seance-emploi-du-temps-exemple.png',
      `<div class="modal-shade"></div>
       <div class="modal">
         <h2>Nouvelle séance</h2><p>Ajouter une séance au planning du site Démo · exemple fictif</p>
         <div class="fields">
           ${champ('Cours existant', 'MATH-DEMO — Analyse I')}
           ${champ('Jour de la semaine', 'Lundi')}
           ${champ('Salle', 'Salle A-01')}
           ${champ('Date début', '02/11/2026')}
           ${champ('Date fin', '01/02/2027')}
           ${champ('Heure de début', '08:00')}
           ${champ('Heure de fin', '10:00')}
           ${champ('Enseignant', 'Enseignant Démo')}
           ${champ('Description (facultative)', 'Cours de démonstration — données fictives', 'full')}
         </div>
         <div class="callout">Choisir un cours déjà rattaché au site et un enseignant affecté au même site. Vérifier les conflits avant de forcer une sauvegarde.</div>
         <div class="modal-actions"><span class="button gray">Annuler</span><span class="button">Enregistrer</span></div>
       </div>
       <div class="watermark">Exemple fictif — aucune sauvegarde</div>`,
      'modal',
      SUPERVISEUR_IMAGE_DIR,
    );

    await capturer(
      page,
      '02_emplois-du-temps.png',
      '92_publication-emploi-du-temps-exemple.png',
      `${planningFictif}
       <div style="position:absolute;z-index:11;left:292px;top:178px;width:1258px;padding:15px 18px;border:1px solid #a7f3d0;border-radius:10px;background:#ecfdf5;color:#065f46;font-size:14px;font-weight:700">
         Emploi du temps publié ! Exemple : 2 enseignants et 18 étudiants notifiés.
       </div>`,
      'page',
      SUPERVISEUR_IMAGE_DIR,
    );
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

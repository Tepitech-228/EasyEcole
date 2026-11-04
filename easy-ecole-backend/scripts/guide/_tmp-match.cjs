const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../docs/guide/images');
const menu = JSON.parse(fs.readFileSync('C:/Users/User/AppData/Local/Temp/opencode/menu-structure.json', 'utf8'));

const slug = (s) => String(s).toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const items = [];
for (const pole of menu) {
  for (const group of pole.groups || []) {
    for (const item of group.items || []) {
      items.push({ pole: pole.label, group: group.label, label: item.label, route: item.route, slug: slug(item.label) });
    }
  }
}
const bySlug = new Map(items.map((i) => [i.slug, i]));

for (const dossier of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, dossier);
  if (!fs.statSync(dir).isDirectory()) continue;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  const unmatched = [];
  let matched = 0;
  for (const f of files) {
    const s = slug(f.replace(/^\d+_/, '').replace(/\.png$/, ''));
    if (bySlug.has(s)) matched++;
    else unmatched.push(s);
  }
  console.log(`\n${dossier}: ${files.length} images, ${matched} matched, ${unmatched.length} unmatched`);
  if (unmatched.length) console.log('  ' + unmatched.join(', '));
}

const fs = require('fs');
const f = "D:\\EasyEcole\\easy-ecole-backend\\src\\modules\\inscription\\controllers\\BordereauController.ts";
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/l\u00E9Audit/g, "l'Audit");
fs.writeFileSync(f, c, 'utf8');
console.log('Fixed');
// Verify
let check = fs.readFileSync(f, 'utf8');
let lines = check.split('\n');
for (let i = 384; i <= 389; i++) {
    console.log((i+1) + ': ' + lines[i]);
}

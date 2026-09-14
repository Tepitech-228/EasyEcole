const fs = require('fs');
const f = "D:\\EasyEcole\\easy-ecole-backend\\src\\modules\\inscription\\controllers\\BordereauController.ts";
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');
let line = lines[385]; // line 386 (0-indexed)
// Find the é character
for (let i = 0; i < line.length; i++) {
    if (line.charCodeAt(i) > 127) {
        console.log(`Pos ${i}: char code ${line.charCodeAt(i).toString(16)}, hex: 0x${line.charCodeAt(i).toString(16)}, code point: U+${line.codePointAt(i).toString(16).toUpperCase()}`);
    }
}
// Show the relevant substring
let idx = line.indexOf('Audit');
if (idx >= 0) {
    console.log('Around Audit: ' + JSON.stringify(line.substring(idx-5, idx+10)));
}
// Try replacing with a broader regex
let before = c;
c = c.replace(/[^\x00-\x7F]Audit/g, "Audit"); // replace any non-ASCII char before Audit
if (c !== before) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('Replaced non-ASCII + Audit with Audit');
} else {
    console.log('No match for [^\x00-\x7F]Audit');
}
// Final check
let final = fs.readFileSync(f, 'utf8');
let finalLines = final.split('\n');
console.log('Line 386: ' + finalLines[385]);

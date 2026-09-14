const ExcelController = require('./src/modules/inscription/controllers/ExcelController').default;

async function test() {
  // Test lireTableauWord
  console.log('=== Test lireTableauWord ===');
  const wordRows = await ExcelController.lireTableauWord('C:/Users/User/Downloads/esa--/MASTER PRO ACT-ESA-2025.docx');
  console.log('Total rows:', wordRows.length);
  console.log('Header row:', wordRows[0]);
  console.log('Header cols:', wordRows[0].length);
  console.log('Row 1:', wordRows[1]);
  console.log('Row 2:', wordRows[2]);
  console.log('Row 3:', wordRows[3]);
  console.log('Row 4:', wordRows[4]);
  console.log('Last rows:');
  for (let i = wordRows.length - 3; i < wordRows.length; i++) {
    console.log(`  Row ${i}:`, wordRows[i]);
  }

  // Test detectFormat
  console.log('\n=== Test detectFormat ===');
  const format = ExcelController.detectFormat(wordRows[0]);
  console.log('Format:', format);

  // Test normalizeText
  console.log('\n=== Test normalizeText ===');
  console.log('Normalize nbsp:', ExcelController.normalizeText('ENJ2101\u00A0:Droit\u00A0administratif'));
  console.log('Normalize dash:', ExcelController.normalizeText('march\u00A0publics\u00A0\u2013\u00A0test'));
}

test().catch(e => console.error(e));

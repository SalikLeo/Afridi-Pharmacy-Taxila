const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function parseCSVLine(text) {
  let p = '', row = [''], r = 0, q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (q && text[i+1] === '"') {
        row[r] += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (c === ',' && !q) {
      row[++r] = '';
    } else {
      row[r] += c;
    }
  }
  return row.map(s => s.trim());
}

const content = fs.readFileSync(path.join(__dirname, 'data', 'medicines.csv'), 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
console.log('Total non-empty lines:', lines.length);
const headers = parseCSVLine(lines[0]);
console.log('Headers:', headers);

const formsMap = {};
const companiesSet = new Set();
for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  const form = (row[5] || 'Other').trim();
  const company = (row[4] || '').trim();
  formsMap[form] = (formsMap[form] || 0) + 1;
  if (company) companiesSet.add(company);
}

console.log('Dosage forms count:', Object.keys(formsMap).length);
console.log('Dosage forms:', formsMap);
console.log('Unique companies count:', companiesSet.size);

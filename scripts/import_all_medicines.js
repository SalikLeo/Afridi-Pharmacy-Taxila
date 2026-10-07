const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function parseCSVLine(text) {
  let row = [''], r = 0, q = false;
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

function getCategorySlug(form) {
  const f = (form || '').toLowerCase().trim();
  if (f.includes('tab') || f.includes('caplet') || f.includes('dragee')) return 'tablet';
  if (f.includes('cap') || f.includes('rota')) return 'capsule';
  if (f.includes('syr') || f.includes('elix') || f.includes('linct') || f.includes('expc') || f.includes('mixt')) return 'syrup';
  if (f.includes('susp')) return 'suspension';
  if (f.includes('inj') || f.includes('spinal')) return 'injection';
  if (f.includes('inf')) return 'infusion';
  if (f.includes('eye')) return 'eyedrop';
  if (f.includes('ear') || f.includes('nasal drop') || f.includes('e and e') || f === 'drops') return 'drops';
  if (f.includes('cream') || f.includes('paste') || f.includes('balm')) return 'cream';
  if (f.includes('oint') || f.includes('gel') || f.includes('liniment') || f.includes('poultice') || f.includes('paint')) return 'ointment';
  if (f.includes('liq') || f.includes('soln') || f.includes('oral soln') || f.includes('mouth wash') || f.includes('scrub') || f.includes('tinc') || f.includes('emul') || f.includes('oil')) return 'liquid';
  if (f.includes('powd') || f.includes('granul') || f.includes('pellet') || f.includes('supplement')) return 'powder';
  if (f.includes('sachet')) return 'sachet';
  if (f.includes('inhal') || f.includes('spray') || f.includes('aerosol') || f.includes('nebul')) return 'inhaler';
  if (f.includes('vag') || f.includes('pessar') || f.includes('ovule') || f.includes('supposit') || f.includes('enema')) return 'vaginal';
  if (f.includes('soap') || f.includes('shamp') || f.includes('tooth')) return 'soap';
  return 'other';
}

const pharmacyCategories = [
  { slug: 'tablet', label: 'Tablet (Tabs)' },
  { slug: 'capsule', label: 'Capsule (Caps)' },
  { slug: 'syrup', label: 'Syrup' },
  { slug: 'suspension', label: 'Suspension' },
  { slug: 'injection', label: 'Injection (Inj)' },
  { slug: 'infusion', label: 'Infusion (Drips)' },
  { slug: 'eyedrop', label: 'Eye Drops & Ophthalmic' },
  { slug: 'drops', label: 'Drops (Ear/Nasal)' },
  { slug: 'cream', label: 'Cream & Paste' },
  { slug: 'ointment', label: 'Ointment & Gel' },
  { slug: 'liquid', label: 'Liquid & Solution' },
  { slug: 'powder', label: 'Powder & Granules' },
  { slug: 'sachet', label: 'Sachet' },
  { slug: 'inhaler', label: 'Inhaler & Spray' },
  { slug: 'vaginal', label: 'Vaginal & Suppositories' },
  { slug: 'soap', label: 'Soap & Shampoo' },
  { slug: 'other', label: 'Other / General' }
];

async function importCSV() {
  const appData = process.env.APPDATA;
  const dbPath = path.join(appData, 'pakistan-pharmacy-pos', 'pharmacy.db');
  console.log('Connecting to database:', dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');

  const csvPath = path.join(__dirname, '..', 'data', 'medicines.csv');
  console.log('Reading CSV file from:', csvPath);
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`Read ${lines.length} lines (including header)`);

  const headers = parseCSVLine(lines[0]);
  console.log('CSV Headers:', headers);

  // 1. Collect unique companies and insert
  console.log('Extracting and inserting companies...');
  const companySet = new Set();
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const compName = (row[4] || '').trim();
    if (compName) companySet.add(compName);
  }
  console.log(`Found ${companySet.size} unique companies`);

  // Ensure companies table exists
  db.exec(`CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    description TEXT, 
    amount REAL DEFAULT 0, 
    phone TEXT, 
    email TEXT, 
    address TEXT, 
    contact_person TEXT,
    ntn TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Clear previous companies & insert fresh from CSV
  db.exec('DELETE FROM companies');
  const insertCompanyStmt = db.prepare(`INSERT INTO companies (name, description, amount, phone, email, address, contact_person, ntn) VALUES (?, ?, 0, '', '', 'Pakistan', '', '')`);
  
  const insertCompaniesTx = db.transaction(() => {
    for (const comp of Array.from(companySet).sort()) {
      insertCompanyStmt.run(comp, 'Pharmaceutical Manufacturer / Supplier');
    }
  });
  insertCompaniesTx();
  console.log('Companies inserted successfully.');

  // Create company lookup map
  const compRows = db.prepare('SELECT id, name FROM companies').all();
  const companyMap = {};
  compRows.forEach(c => { companyMap[c.name.trim()] = c.id; });

  // 2. Clear old category labels & product tables
  console.log('Resetting category labels and product tables...');
  const oldTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'products_%'").all();
  oldTables.forEach(t => {
    db.exec(`DROP TABLE IF EXISTS ${t.name}`);
  });
  db.exec('DELETE FROM category_labels');
  db.exec('DELETE FROM favorites');

  // Insert categories and create fresh product tables
  const insertCatStmt = db.prepare('INSERT OR REPLACE INTO category_labels (slug, label) VALUES (?, ?)');
  pharmacyCategories.forEach(cat => {
    insertCatStmt.run(cat.slug, cat.label);
    db.exec(`CREATE TABLE IF NOT EXISTS products_${cat.slug} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_code TEXT,
      medicine_name TEXT,
      item_name TEXT,
      brand_name TEXT,
      generic_name TEXT,
      company_name TEXT,
      company_id INTEGER,
      dosage_form TEXT,
      strength TEXT,
      packing TEXT,
      trade_price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      retail_price REAL DEFAULT 0,
      wholesale_cost_price REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      category TEXT,
      batch_no TEXT,
      expiry_date TEXT,
      rack_shelf TEXT,
      schedule TEXT DEFAULT 'OTC',
      description TEXT,
      current_stock INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'PACK',
      pieces_per_carton INTEGER DEFAULT 10,
      min_stock_level INTEGER DEFAULT 5
    )`);
  });

  // Prepare insert statements for each category
  const insertStmts = {};
  pharmacyCategories.forEach(cat => {
    insertStmts[cat.slug] = db.prepare(`
      INSERT INTO products_${cat.slug} (
        medicine_code, medicine_name, item_name, brand_name, generic_name,
        company_name, company_id, dosage_form, strength, packing,
        trade_price, cost_price, retail_price, wholesale_cost_price, wholesale_price,
        category, batch_no, expiry_date, rack_shelf, schedule, description,
        current_stock, unit, pieces_per_carton, min_stock_level
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);
  });

  console.log('Importing 53,000+ medicines...');
  const racks = ['Rack A-1', 'Rack A-2', 'Rack B-1', 'Rack B-2', 'Rack C-1', 'Rack C-2', 'Rack D-1', 'Rack D-2', 'Rack E-1', 'Rack E-2', 'Rack F-1', 'Rack F-2'];
  let importedCount = 0;

  const importTx = db.transaction(() => {
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (!row || row.length < 2) continue;

      const rawId = row[0] || String(i);
      const medName = (row[1] || '').trim();
      if (!medName) continue;

      const brandName = (row[2] || medName).trim();
      const genericName = (row[3] || '').trim();
      const companyName = (row[4] || '').trim();
      const dosageForm = (row[5] || '').trim();
      const strength = (row[6] || '').trim();
      const packing = (row[7] || '').trim();
      const tradePrice = parseFloat(row[8]) || 0;
      const retailPrice = parseFloat(row[9]) || 0;
      const categoryCode = (row[10] || '').trim();

      const catSlug = getCategorySlug(dosageForm);
      const stmt = insertStmts[catSlug] || insertStmts['other'];

      const prefix = catSlug.substring(0, 3).toUpperCase();
      const medCode = `MED-${prefix}-${String(rawId).padStart(5, '0')}`;
      const itemDisplayName = medName + (strength ? ' ' + strength : '') + (dosageForm ? ' ' + dosageForm : '');
      const compId = companyMap[companyName] || null;
      const rack = racks[i % racks.length];

      stmt.run(
        medCode,
        medName,
        itemDisplayName,
        brandName,
        genericName,
        companyName,
        compId,
        dosageForm,
        strength,
        packing,
        tradePrice,
        tradePrice,
        retailPrice,
        tradePrice,
        retailPrice,
        categoryCode,
        `BATCH-${String(rawId).padStart(4, '0')}`,
        '2028-12-31',
        rack,
        'OTC',
        `${medName} ${strength} ${dosageForm} (${genericName})`.trim(),
        25, // default initial stock
        packing || 'PACK',
        1,
        5
      );

      importedCount++;
      if (importedCount % 10000 === 0) {
        console.log(`Imported ${importedCount} medicines...`);
      }
    }
  });

  importTx();
  console.log(`Successfully imported ${importedCount} medicines!`);

  // Create indexes for instant sub-millisecond lookups
  console.log('Creating database indexes for high performance...');
  pharmacyCategories.forEach(cat => {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${cat.slug}_search ON products_${cat.slug} (item_name, generic_name, brand_name, medicine_code, company_name)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${cat.slug}_comp ON products_${cat.slug} (company_id)`);
  });

  console.log('Database optimization and import completed!');
  db.close();
}

importCSV().catch(err => {
  console.error('Import failed:', err);
});

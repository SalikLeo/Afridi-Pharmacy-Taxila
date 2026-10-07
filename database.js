const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;

function init() {
  const userDataPath = app && app.getPath ? app.getPath('userData') : path.join(process.env.APPDATA, 'afridi-diagnostic-centre');
  const appDataPath = app && app.getPath ? app.getPath('appData') : process.env.APPDATA;
  const dbPath = path.join(userDataPath, 'pharmacy.db');

  try {
    if (!fs.existsSync(dbPath)) {
      const oldDirs = ['pakistan-pharmacy-pos', 'Pharmacy POS', 'Awan Medical Store', 'afridi-diagnostic-centre'];
      for (const oldDir of oldDirs) {
        const candidate = path.join(appDataPath, oldDir, 'pharmacy.db');
        if (fs.existsSync(candidate)) {
          if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
          }
          fs.copyFileSync(candidate, dbPath);
          break;
        }
      }
    }
  } catch (err) {
    console.error('Failed to migrate database path:', err);
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  
  createTables();
  seedInitialData();
  migrateOldSettings();
}

function migrateOldSettings() {
  try {
    const currentName = db.prepare("SELECT value FROM settings WHERE key = 'company_name'").get();
    if (!currentName || currentName.value !== 'Afridi Diagnostic Centre') {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('company_name', ?)").run('Afridi Diagnostic Centre');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_number', ?)").run('');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('pharmacist_name', ?)").run('');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('address', ?)").run('Near Babu Hotel, Railway Ground, Taxila');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('phone', ?)").run('0333-9109092');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ntn', ?)").run('');
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('return_policy', ?)").run('');
    }

    const currentLogo = db.prepare("SELECT value FROM settings WHERE key = 'logo_path'").get();
    if (currentLogo && (currentLogo.value.includes('4bnrpk4bnrpk4bnr') || currentLogo.value.toLowerCase().includes('awan'))) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('logo_path', ?)").run('');
    }

    // Ensure company address and phone are initialized if empty
    const currentAddr = db.prepare("SELECT value FROM settings WHERE key = 'address'").get();
    if (!currentAddr || !currentAddr.value || !currentAddr.value.trim()) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('address', ?)").run('Near Babu Hotel, Railway Ground, Taxila');
    }

    const currentPhone = db.prepare("SELECT value FROM settings WHERE key = 'phone'").get();
    if (!currentPhone || !currentPhone.value || !currentPhone.value.trim()) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('phone', ?)").run('0333-9109092');
    }

    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('system_initialized', 'true')").run();

    // Migrate any legacy RX- invoice numbers to INV-
    try {
      const rxProps = db.prepare("SELECT id, proposal_number FROM proposals WHERE proposal_number LIKE 'RX-%' ORDER BY id ASC").all();
      if (rxProps && rxProps.length > 0) {
        const updateStmt = db.prepare("UPDATE proposals SET proposal_number = ? WHERE id = ?");
        rxProps.forEach(p => {
          const m = p.proposal_number.match(/RX-(\d+)/i);
          let invNum = p.id;
          if (m) {
            const n = parseInt(m[1], 10);
            invNum = n >= 1000 ? (n - 1000) : n;
          }
          updateStmt.run(`INV-${invNum}`, p.id);
        });
      }
    } catch(err) {}

    // Remove legacy/test dummy customers
    try {
      db.exec(`DELETE FROM customers WHERE name IN ('AL-SHIFA CLINIC & PHARMACY', 'MALIK PHARMACY & GENERAL', 'SAJJAD MEDICAL STOR')`);
    } catch(e) {}
  } catch (e) {
    console.error("Failed to migrate settings:", e);
  }
}

function createTables() {
  // Settings & App Storage
  db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  db.exec(`CREATE TABLE IF NOT EXISTS app_kv_store (key TEXT PRIMARY KEY, value TEXT)`);
  db.exec(`CREATE TABLE IF NOT EXISTS category_labels (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, label TEXT)`);
  db.exec(`CREATE TABLE IF NOT EXISTS product_units (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)`);

  // Default pharmacy product categories matching medicine forms
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

  // Clean up legacy categories if they exist
  const legacySlugs = ['tablets', 'capsules', 'syrups', 'injections', 'drops_topical', 'cold_chain', 'surgicals_devices', 'otc_baby'];
  
  pharmacyCategories.forEach(cat => {
    db.prepare('INSERT OR IGNORE INTO category_labels (slug, label) VALUES (?, ?)').run(cat.slug, cat.label);
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
      category TEXT,
      batch_no TEXT,
      expiry_date TEXT,
      rack_shelf TEXT,
      schedule TEXT DEFAULT 'OTC',
      description TEXT,
      current_stock INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'PACK',
      pieces_per_carton INTEGER DEFAULT 10,
      wholesale_cost_price REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5
    )`);
  });

  // Migrate items from legacy tables to new form tables if applicable
  const legacyMap = {
    tablets: 'tablet',
    capsules: 'capsule',
    syrups: 'syrup',
    injections: 'injection',
    drops_topical: 'eyedrop'
  };
  Object.entries(legacyMap).forEach(([oldSlug, newSlug]) => {
    try {
      const oldExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(`products_${oldSlug}`);
      if (oldExists) {
        const newCount = db.prepare(`SELECT COUNT(*) as c FROM products_${newSlug}`).get().c;
        if (newCount === 0) {
          db.exec(`INSERT OR IGNORE INTO products_${newSlug} (medicine_code, medicine_name, item_name, brand_name, generic_name, dosage_form, strength, company_id, company_name, packing, batch_no, expiry_date, rack_shelf, schedule, description, current_stock, unit, pieces_per_carton, trade_price, cost_price, retail_price, wholesale_cost_price, wholesale_price, min_stock_level, category)
                   SELECT COALESCE(batch_no, 'MED-001'), item_name, item_name, item_name, generic_name, dosage_form, strength, company_id, '', '', batch_no, expiry_date, rack_shelf, schedule, description, current_stock, unit, pieces_per_carton, cost_price, cost_price, retail_price, wholesale_cost_price, wholesale_price, min_stock_level, '' FROM products_${oldSlug}`);
        }
        db.prepare('DELETE FROM category_labels WHERE slug = ?').run(oldSlug);
      }
    } catch(e) {}
  });

  // Also remove remaining empty old category labels
  legacySlugs.forEach(s => {
    try {
      db.prepare('DELETE FROM category_labels WHERE slug = ?').run(s);
    } catch(e) {}
  });

  // Migration: Add any missing columns to ALL product tables
  const productTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'products_%'").all();
  productTables.forEach(row => {
    const tableName = row.name;
    const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columns = tableInfo.map(c => c.name);
    
    const requiredCols = [
      { name: 'medicine_code', type: 'TEXT' },
      { name: 'medicine_name', type: 'TEXT' },
      { name: 'item_name', type: 'TEXT' },
      { name: 'brand_name', type: 'TEXT' },
      { name: 'generic_name', type: 'TEXT' },
      { name: 'company_name', type: 'TEXT' },
      { name: 'company_id', type: 'INTEGER' },
      { name: 'dosage_form', type: 'TEXT' },
      { name: 'strength', type: 'TEXT' },
      { name: 'packing', type: 'TEXT' },
      { name: 'trade_price', type: 'REAL DEFAULT 0' },
      { name: 'cost_price', type: 'REAL DEFAULT 0' },
      { name: 'retail_price', type: 'REAL DEFAULT 0' },
      { name: 'category', type: 'TEXT' },
      { name: 'batch_no', type: 'TEXT' },
      { name: 'expiry_date', type: 'TEXT' },
      { name: 'rack_shelf', type: 'TEXT' },
      { name: 'schedule', type: "TEXT DEFAULT 'OTC'" },
      { name: 'description', type: 'TEXT' },
      { name: 'current_stock', type: 'INTEGER DEFAULT 0' },
      { name: 'unit', type: "TEXT DEFAULT 'PACK'" },
      { name: 'pieces_per_carton', type: 'INTEGER DEFAULT 10' },
      { name: 'wholesale_cost_price', type: 'REAL DEFAULT 0' },
      { name: 'wholesale_price', type: 'REAL DEFAULT 0' },
      { name: 'min_stock_level', type: 'INTEGER DEFAULT 5' }
    ];

    requiredCols.forEach(col => {
      if (!columns.includes(col.name)) {
        try {
          db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`);
        } catch(e) {}
      }
    });

    // Fast search indexes for instantaneous prefix search
    try {
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_medname ON ${tableName}(medicine_name COLLATE NOCASE)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_itemname ON ${tableName}(item_name COLLATE NOCASE)`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_brandname ON ${tableName}(brand_name COLLATE NOCASE)`);
    } catch(e) {}
  });

  // Default pharmacy units
  const pharmacyUnits = ['PACK', 'STRIP', 'TAB', 'CAP', 'BOTTLE', 'VIAL', 'AMP', 'TUBE', 'SACHET', 'PIECE', 'BOX', 'SET'];
  pharmacyUnits.forEach(u => {
    try { db.prepare('INSERT OR IGNORE INTO product_units (name) VALUES (?)').run(u); } catch(e) {}
  });

  // Proposals (Sales / Invoices)
  db.exec(`CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    proposal_number TEXT, 
    customer_name TEXT, 
    location TEXT, 
    phone TEXT, 
    date TEXT, 
    retail_total REAL, 
    cost_total REAL, 
    profit REAL, 
    status TEXT, 
    received_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    fees REAL DEFAULT 0,
    fees_name TEXT,
    seller_name TEXT,
    payment_method TEXT DEFAULT 'Cash',
    sale_mode TEXT DEFAULT 'retail',
    doctor_name TEXT,
    doctor_reg TEXT,
    patient_age TEXT,
    patient_gender TEXT,
    prescription_no TEXT,
    store_name TEXT,
    store_address TEXT,
    store_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Ensure missing columns in proposals
  const propColumns = db.prepare("PRAGMA table_info(proposals)").all().map(c => c.name);
  const requiredPropCols = [
    { name: 'received_amount', type: 'REAL DEFAULT 0' },
    { name: 'cash_received', type: 'REAL DEFAULT 0' },
    { name: 'change_return', type: 'REAL DEFAULT 0' },
    { name: 'discount', type: 'REAL DEFAULT 0' },
    { name: 'tax', type: 'REAL DEFAULT 0' },
    { name: 'tax_rate', type: 'REAL DEFAULT 0' },
    { name: 'fees', type: 'REAL DEFAULT 0' },
    { name: 'fees_name', type: 'TEXT' },
    { name: 'more_bill_items', type: 'TEXT' },
    { name: 'seller_name', type: 'TEXT' },
    { name: 'payment_method', type: "TEXT DEFAULT 'Cash'" },
    { name: 'sale_mode', type: "TEXT DEFAULT 'retail'" },
    { name: 'doctor_name', type: 'TEXT' },
    { name: 'doctor_reg', type: 'TEXT' },
    { name: 'patient_age', type: 'TEXT' },
    { name: 'patient_gender', type: 'TEXT' },
    { name: 'prescription_no', type: 'TEXT' },
    { name: 'store_name', type: 'TEXT' },
    { name: 'store_address', type: 'TEXT' },
    { name: 'store_phone', type: 'TEXT' },
    { name: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
  ];
  requiredPropCols.forEach(col => {
    if (!propColumns.includes(col.name)) {
      try { db.exec(`ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type}`); } catch(e) {}
    }
  });

  // Backfill historical proposals with current snapshot store info so their receipts remain frozen
  try {
    const curName = db.prepare("SELECT value FROM settings WHERE key = 'company_name'").get()?.value || 'Afridi Diagnostic Centre';
    const curAddr = db.prepare("SELECT value FROM settings WHERE key = 'address'").get()?.value || 'Near Babu Hotel, Railway Ground, Taxila';
    const curPhone = db.prepare("SELECT value FROM settings WHERE key = 'phone'").get()?.value || '0333-9109092';
    db.prepare(`
      UPDATE proposals 
      SET store_name = COALESCE(store_name, ?),
          store_address = COALESCE(store_address, ?),
          store_phone = COALESCE(store_phone, ?)
      WHERE store_name IS NULL OR store_address IS NULL OR store_phone IS NULL
    `).run(curName, curAddr, curPhone);
  } catch(e) {}

  // Proposal Items
  db.exec(`CREATE TABLE IF NOT EXISTS proposal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    proposal_id INTEGER, 
    item_id INTEGER,
    section TEXT, 
    description TEXT, 
    generic_name TEXT,
    batch_no TEXT,
    expiry_date TEXT,
    qty REAL, 
    unit TEXT,
    unit_cost REAL, 
    unit_retail REAL, 
    unit_discounted REAL,
    line_cost REAL, 
    line_retail REAL, 
    line_profit REAL,
    FOREIGN KEY(proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
  )`);

  const itemCols = db.prepare("PRAGMA table_info(proposal_items)").all().map(c => c.name);
  ['generic_name', 'batch_no', 'expiry_date', 'unit_discounted', 'unit', 'item_id'].forEach(c => {
    if (!itemCols.includes(c)) {
      try { db.exec(`ALTER TABLE proposal_items ADD COLUMN ${c} TEXT`); } catch(e) {}
    }
  });

  // Expenses & Categories
  db.exec(`CREATE TABLE IF NOT EXISTS expense_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)`);
  db.exec(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    date TEXT, 
    category TEXT, 
    amount REAL, 
    description TEXT, 
    paid_by TEXT, 
    notes TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const defaultExpCats = [
    'Shop Rent', 'Electricity (WAPDA)', 'Generator Fuel / UPS', 'Staff Salaries',
    'Distributor Delivery', 'Drug License & Regulatory', 'Tea & Refreshments',
    'Shop Maintenance', 'Packaging Bags & Receipt Rolls', 'Other'
  ];
  defaultExpCats.forEach(c => {
    try { db.prepare('INSERT OR IGNORE INTO expense_categories (name) VALUES (?)').run(c); } catch(e) {}
  });

  // Employees (Pharmacists & Staff)
  db.exec(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    full_name TEXT, 
    role TEXT, 
    phone TEXT, 
    email TEXT, 
    date_joined TEXT, 
    salary REAL, 
    status TEXT, 
    notes TEXT, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_inactive TEXT
  )`);
  
  // Companies (Pharmaceutical Distributors)
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

  const compCols = db.prepare("PRAGMA table_info(companies)").all().map(c => c.name);
  ['contact_person', 'ntn'].forEach(col => {
    if (!compCols.includes(col)) {
      try { db.exec(`ALTER TABLE companies ADD COLUMN ${col} TEXT`); } catch(e) {}
    }
  });

  // Customers (Patients & Client Ledgers)
  db.exec(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT, 
    description TEXT, 
    amount REAL DEFAULT 0, 
    phone TEXT, 
    email TEXT, 
    address TEXT, 
    cnic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const custCols = db.prepare("PRAGMA table_info(customers)").all().map(c => c.name);
  if (!custCols.includes('cnic')) {
    try { db.exec(`ALTER TABLE customers ADD COLUMN cnic TEXT`); } catch(e) {}
  }

  // Favorites
  db.exec(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_slug TEXT,
    product_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_slug, product_id)
  )`);
}

function seedInitialData() {
  try {
    const isInit = db.prepare("SELECT value FROM settings WHERE key = 'system_initialized'").get();
    if (isInit && isInit.value === 'true') {
      return;
    }
  } catch(e) {}

  // Check if distributors exist
  const compCount = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
  if (compCount === 0) {
    const distributors = [
      { name: 'Müller & Phipps Pakistan (M&P)', contact_person: 'Tariq Mehmood', phone: '042-35889100', address: 'Quaid-e-Azam Industrial Estate, Kot Lakhpat, Lahore', description: 'Primary distributor for GSK, Abbott, Sanofi, Bayer, Reckitt' },
      { name: 'IBL Operations Pvt Ltd', contact_person: 'Kamran Ashraf', phone: '042-35712345', address: 'Gulberg III, Lahore', description: 'Distributor for Searle, High-Q, Bosch, English Pharma' },
      { name: 'Premier Agencies & Distribution', contact_person: 'Naveed Akhtar', phone: '042-37589922', address: 'Multan Road, Lahore', description: 'Distributor for Getz Pharma, Sami, Hilton, Atco, Martin Dow' },
      { name: 'Horizon Healthcare Logistics', contact_person: 'Rashid Minhas', phone: '042-36311000', address: 'Davis Road, Lahore', description: 'Distributor for Ferozsons, CCL, PharmEvo, Horizon' },
      { name: 'OBS Pakistan Distribution', contact_person: 'Waseem Sadiq', phone: '042-35914400', address: 'Model Town Link Road, Lahore', description: 'Distributor for OBS, Organon, Merck' },
      { name: 'Al-Madina Surgical & Devices', contact_person: 'Haji Aslam', phone: '0300-4567890', address: 'Lohari Medicine Market, Lahore', description: 'Wholesale Surgical, Cannulas, Syringes, Strips, Cotton' }
    ];

    const distStmt = db.prepare('INSERT INTO companies (name, contact_person, phone, address, description) VALUES (?, ?, ?, ?, ?)');
    distributors.forEach(d => distStmt.run(d.name, d.contact_person, d.phone, d.address, d.description));
  }

  // Check if staff exists
  const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
  if (empCount === 0) {
    const staff = [
      { full_name: 'Dr. M. Salman', role: 'Pharmacist (Category A)', phone: '0300-8456789', email: 'salman.pharm@gmail.com', salary: 75000, status: 'Active', notes: 'Supervising Pharmacist & Store Incharge' },
      { full_name: 'Usman Ali', role: 'Assistant Pharmacist', phone: '0321-4567890', email: 'usman.ali@gmail.com', salary: 45000, status: 'Active', notes: 'Evening shift dispenser' },
      { full_name: 'Zubair Ahmed', role: 'Dispenser & POS Cashier', phone: '0333-7890123', email: 'zubair.pos@gmail.com', salary: 35000, status: 'Active', notes: 'Morning shift sales' },
      { full_name: 'Bilal Hassan', role: 'Inventory & Stock Incharge', phone: '0312-9012345', email: 'bilal.stock@gmail.com', salary: 32000, status: 'Active', notes: 'Stock verification & expiry auditing' }
    ];
    const empStmt = db.prepare('INSERT INTO employees (full_name, role, phone, email, salary, status, notes, date_joined) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const today = new Date().toISOString().split('T')[0];
    staff.forEach(s => empStmt.run(s.full_name, s.role, s.phone, s.email, s.salary, s.status, s.notes, today));
  }

  // Check if medicines exist in tablet table
  const tabExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'products_tablet'").get();
  const tabCount = tabExists ? (db.prepare('SELECT COUNT(*) as count FROM products_tablet').get()?.count || 0) : 0;
  
  if (tabCount === 0) {
    const csvPath = path.join(__dirname, 'data', 'medicines.csv');
    if (fs.existsSync(csvPath)) {
      try {
        console.log('Auto-seeding from medicines.csv...');
        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);

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

        // Insert unique companies
        const companySet = new Set();
        for (let i = 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          const compName = (row[4] || '').trim();
          if (compName) companySet.add(compName);
        }
        const insertCompanyStmt = db.prepare(`INSERT OR IGNORE INTO companies (name, description, amount, phone, email, address, contact_person, ntn) VALUES (?, ?, 0, '', '', 'Pakistan', '', '')`);
        for (const comp of Array.from(companySet).sort()) {
          insertCompanyStmt.run(comp, 'Pharmaceutical Manufacturer / Supplier');
        }

        const compRows = db.prepare('SELECT id, name FROM companies').all();
        const companyMap = {};
        compRows.forEach(c => { companyMap[c.name.trim()] = c.id; });

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

        const racks = ['Rack A-1', 'Rack A-2', 'Rack B-1', 'Rack B-2', 'Rack C-1', 'Rack C-2', 'Rack D-1', 'Rack D-2', 'Rack E-1', 'Rack E-2', 'Rack F-1', 'Rack F-2'];
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
              medCode, medName, itemDisplayName, brandName, genericName,
              companyName, compId, dosageForm, strength, packing,
              tradePrice, tradePrice, retailPrice, tradePrice, retailPrice,
              categoryCode, `BATCH-${String(rawId).padStart(4, '0')}`, '2028-12-31', rack, 'OTC',
              `${medName} ${strength} ${dosageForm} (${genericName})`.trim(),
              25, packing || 'PACK', 1, 5
            );
          }
        });
        importTx();

        pharmacyCategories.forEach(cat => {
          db.exec(`CREATE INDEX IF NOT EXISTS idx_${cat.slug}_search ON products_${cat.slug} (item_name, generic_name, brand_name, medicine_code, company_name)`);
          db.exec(`CREATE INDEX IF NOT EXISTS idx_${cat.slug}_comp ON products_${cat.slug} (company_id)`);
        });
        console.log('Auto-seed completed successfully!');
      } catch (err) {
        console.error('Error auto-seeding from medicines.csv:', err);
      }
    }
  }

  // Standardize walk-in patient names without numbering
  try {
    db.exec(`UPDATE proposals SET customer_name = 'Walk-in Patient' WHERE customer_name LIKE 'Walk-in Patient-%' OR customer_name LIKE 'Patient-%' OR customer_name LIKE 'Walk-in Customer-%'`);
    db.exec(`UPDATE customers SET name = 'Walk-in Patient' WHERE name LIKE 'Walk-in Patient-%' OR name LIKE 'Patient-%' OR name LIKE 'Walk-in Customer-%'`);
  } catch(e) {}

  // Migrate proposal numbers from RX-% to INV-%
  try {
    const rxProposals = db.prepare("SELECT id, proposal_number FROM proposals WHERE proposal_number LIKE 'RX-%'").all();
    if (rxProposals && rxProposals.length > 0) {
      const updateStmt = db.prepare('UPDATE proposals SET proposal_number = ? WHERE id = ?');
      const tx = db.transaction(() => {
        rxProposals.forEach(p => {
          const match = p.proposal_number.match(/RX-(\d+)/i);
          if (match) {
            let num = parseInt(match[1], 10);
            if (num > 1000) num = num - 1000;
            updateStmt.run(`INV-${num}`, p.id);
          }
        });
      });
      tx();
    }
  } catch (e) {
    console.warn('Could not migrate RX proposal numbers:', e);
  }

  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('system_initialized', 'true')").run();
  } catch (e) {}
}

// ------ SETTINGS ------
function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  return settings;
}

function saveSettings(data) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, value);
    }
  });
  transaction();
}

// ------ APP KV STORAGE ------
function getAllKv() {
  try {
    return db.prepare('SELECT key, value FROM app_kv_store').all();
  } catch (e) {
    return [];
  }
}

function setKv(key, value) {
  try {
    const val = typeof value === 'string' ? value : JSON.stringify(value);
    db.prepare('INSERT OR REPLACE INTO app_kv_store (key, value) VALUES (?, ?)').run(key, val);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

function saveAllKv(entries) {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO app_kv_store (key, value) VALUES (?, ?)');
    const transaction = db.transaction((items) => {
      for (const [key, value] of Object.entries(items)) {
        const val = typeof value === 'string' ? value : JSON.stringify(value);
        stmt.run(key, val);
      }
    });
    transaction(entries);
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

// ------ PRODUCTS ------
function getProducts(category, companyId = null) {
  let sql = `
    SELECT p.*, COALESCE(c.name, p.company_name) as company_name, (f.id IS NOT NULL) as is_favorite 
    FROM products_${category} p
    LEFT JOIN favorites f ON f.category_slug = '${category}' AND f.product_id = p.id
    LEFT JOIN companies c ON c.id = p.company_id
  `;
  
  const params = [];
  if (companyId) {
    sql += ` WHERE p.company_id = ?`;
    params.push(companyId);
  }
  
  sql += ` ORDER BY COALESCE(p.medicine_name, p.item_name) ASC`;
  return db.prepare(sql).all(...params);
}

function getPaginatedProducts(options = {}) {
  const {
    category = 'all',
    query = '',
    lowStock = null,
    expiryDays = null,
    page = 1,
    pageSize = 50,
    companyId = null
  } = options;

  const isAll = options.all === true || pageSize === -1 || pageSize === 'all' || parseInt(pageSize, 10) >= 1000;
  const validPage = Math.max(1, parseInt(page, 10) || 1);
  const maxLimit = isAll ? 5000 : 500;
  const validPageSize = isAll ? Math.min(maxLimit, Math.max(10, parseInt(pageSize, 10) || 1000)) : Math.min(500, Math.max(10, parseInt(pageSize, 10) || 50));
  const offset = (isAll && (!options.page || options.page === 1)) ? 0 : (validPage - 1) * validPageSize;

  const qClean = (query || '').trim();
  const qFuzzy = `%${qClean}%`;

  const existingTables = new Set(
    db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'products_%'").all().map(r => r.name)
  );

  const labels = getCategoryLabels();
  const rawSlugs = (category && category !== 'all') ? [category] : labels.map(l => l.slug);
  const activeSlugs = rawSlugs.filter(cat => existingTables.has('products_' + cat));

  if (activeSlugs.length === 0) {
    return {
      items: [],
      totalCount: 0,
      totalStock: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
      page: 1,
      pageSize: validPageSize,
      totalPages: 1
    };
  }

  const selectColumns = (cat) => `
    p.id,
    COALESCE(p.medicine_code, '') as medicine_code,
    COALESCE(p.medicine_name, p.item_name, '') as medicine_name,
    COALESCE(p.item_name, p.medicine_name, '') as item_name,
    COALESCE(p.brand_name, '') as brand_name,
    COALESCE(p.generic_name, '') as generic_name,
    COALESCE(p.dosage_form, '') as dosage_form,
    COALESCE(p.strength, '') as strength,
    COALESCE(p.packing, '') as packing,
    COALESCE(p.category, '') as category,
    COALESCE(c.name, p.company_name, '') as company_name,
    p.company_id,
    COALESCE(p.trade_price, p.cost_price, 0) as trade_price,
    COALESCE(p.cost_price, p.trade_price, 0) as cost_price,
    COALESCE(p.retail_price, 0) as retail_price,
    COALESCE(p.current_stock, 0) as current_stock,
    COALESCE(p.min_stock_level, 5) as min_stock_level,
    COALESCE(p.expiry_date, '') as expiry_date,
    COALESCE(p.rack_shelf, '') as rack_shelf,
    COALESCE(p.batch_no, '') as batch_no,
    (f.id IS NOT NULL) as is_favorite,
    '${cat}' as slug
  `;

  if (activeSlugs.length === 1) {
    const cat = activeSlugs[0];
    const whereClauses = [];
    const params = [];

    if (companyId) {
      whereClauses.push('p.company_id = ?');
      params.push(companyId);
    }

    if (qClean) {
      whereClauses.push(`(
        p.medicine_code LIKE ? OR
        p.medicine_name LIKE ? OR
        p.item_name LIKE ? OR
        p.brand_name LIKE ? OR
        p.generic_name LIKE ? OR
        p.dosage_form LIKE ? OR
        p.strength LIKE ? OR
        p.packing LIKE ? OR
        p.category LIKE ? OR
        p.batch_no LIKE ? OR
        p.rack_shelf LIKE ? OR
        p.company_name LIKE ? OR
        c.name LIKE ?
      )`);
      for (let i = 0; i < 13; i++) params.push(qFuzzy);
    }

    if (lowStock !== null && lowStock !== '' && !isNaN(parseInt(lowStock, 10))) {
      whereClauses.push('p.current_stock <= ?');
      params.push(parseInt(lowStock, 10));
    }

    if (expiryDays !== null && expiryDays !== '' && !isNaN(parseInt(expiryDays, 10))) {
      whereClauses.push(`(p.expiry_date IS NOT NULL AND p.expiry_date != '' AND date(p.expiry_date) <= date('now', '+' || ? || ' days'))`);
      params.push(parseInt(expiryDays, 10));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const statsSql = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(p.current_stock), 0) as totalStock,
        COALESCE(SUM(p.current_stock * COALESCE(p.trade_price, p.cost_price, 0)), 0) as totalCostValue,
        COALESCE(SUM(p.current_stock * COALESCE(p.retail_price, 0)), 0) as totalRetailValue
      FROM products_${cat} p 
      LEFT JOIN companies c ON c.id = p.company_id 
      ${whereSql}
    `;
    const stats = db.prepare(statsSql).get(...params) || {};
    const totalCount = stats.count || 0;
    const totalStock = stats.totalStock || 0;
    const totalCostValue = stats.totalCostValue || 0;
    const totalRetailValue = stats.totalRetailValue || 0;

    const dataSql = `
      SELECT ${selectColumns(cat)}
      FROM products_${cat} p
      LEFT JOIN favorites f ON f.category_slug = '${cat}' AND f.product_id = p.id
      LEFT JOIN companies c ON c.id = p.company_id
      ${whereSql}
      ORDER BY COALESCE(p.medicine_name, p.item_name) ASC
      LIMIT ? OFFSET ?
    `;
    const items = db.prepare(dataSql).all(...params, validPageSize, offset);

    return {
      items,
      totalCount,
      totalStock,
      totalCostValue,
      totalRetailValue,
      page: validPage,
      pageSize: validPageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / validPageSize))
    };
  }

  const unionQueries = [];
  const unionParams = [];

  activeSlugs.forEach(cat => {
    const whereClauses = [];
    const params = [];

    if (companyId) {
      whereClauses.push('p.company_id = ?');
      params.push(companyId);
    }

    if (qClean) {
      whereClauses.push(`(
        p.medicine_code LIKE ? OR
        p.medicine_name LIKE ? OR
        p.item_name LIKE ? OR
        p.brand_name LIKE ? OR
        p.generic_name LIKE ? OR
        p.dosage_form LIKE ? OR
        p.strength LIKE ? OR
        p.packing LIKE ? OR
        p.category LIKE ? OR
        p.batch_no LIKE ? OR
        p.rack_shelf LIKE ? OR
        p.company_name LIKE ? OR
        c.name LIKE ?
      )`);
      for (let i = 0; i < 13; i++) params.push(qFuzzy);
    }

    if (lowStock !== null && lowStock !== '' && !isNaN(parseInt(lowStock, 10))) {
      whereClauses.push('p.current_stock <= ?');
      params.push(parseInt(lowStock, 10));
    }

    if (expiryDays !== null && expiryDays !== '' && !isNaN(parseInt(expiryDays, 10))) {
      whereClauses.push(`(p.expiry_date IS NOT NULL AND p.expiry_date != '' AND date(p.expiry_date) <= date('now', '+' || ? || ' days'))`);
      params.push(parseInt(expiryDays, 10));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    unionQueries.push(`
      SELECT ${selectColumns(cat)}
      FROM products_${cat} p
      LEFT JOIN favorites f ON f.category_slug = '${cat}' AND f.product_id = p.id
      LEFT JOIN companies c ON c.id = p.company_id
      ${whereSql}
    `);
    unionParams.push(...params);
  });

  const fullUnionSql = unionQueries.join(' UNION ALL ');

  const statsSql = `
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(current_stock), 0) as totalStock,
      COALESCE(SUM(current_stock * COALESCE(trade_price, cost_price, 0)), 0) as totalCostValue,
      COALESCE(SUM(current_stock * COALESCE(retail_price, 0)), 0) as totalRetailValue
    FROM (${fullUnionSql})
  `;
  const stats = db.prepare(statsSql).get(...unionParams) || {};
  const totalCount = stats.count || 0;
  const totalStock = stats.totalStock || 0;
  const totalCostValue = stats.totalCostValue || 0;
  const totalRetailValue = stats.totalRetailValue || 0;

  const dataSql = `
    SELECT * FROM (${fullUnionSql})
    ORDER BY COALESCE(medicine_name, item_name) ASC
    LIMIT ? OFFSET ?
  `;
  const items = db.prepare(dataSql).all(...unionParams, validPageSize, offset);

  return {
    items,
    totalCount,
    totalStock,
    totalCostValue,
    totalRetailValue,
    page: validPage,
    pageSize: validPageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / validPageSize))
  };
}

function addProduct(category, data) {
  if (data.medicine_name && !data.item_name) data.item_name = data.medicine_name;
  if (data.item_name && !data.medicine_name) data.medicine_name = data.item_name;
  if (data.trade_price !== undefined && data.cost_price === undefined) data.cost_price = data.trade_price;
  if (data.cost_price !== undefined && data.trade_price === undefined) data.trade_price = data.cost_price;

  const tableInfo = db.prepare(`PRAGMA table_info(products_${category})`).all();
  const columns = tableInfo.map(c => c.name);
  const cleanData = {};
  for (const [key, value] of Object.entries(data)) {
    if (columns.includes(key) && key !== 'id') cleanData[key] = value;
  }
  const keys = Object.keys(cleanData);
  const values = Object.values(cleanData);
  const placeholders = keys.map(() => '?').join(', ');
  const info = db.prepare(`INSERT INTO products_${category} (${keys.join(', ')}) VALUES (${placeholders})`).run(...values);
  return info.lastInsertRowid;
}

function updateProduct(category, id, data) {
  if (data.medicine_name && !data.item_name) data.item_name = data.medicine_name;
  if (data.item_name && !data.medicine_name) data.medicine_name = data.item_name;
  if (data.trade_price !== undefined && data.cost_price === undefined) data.cost_price = data.trade_price;
  if (data.cost_price !== undefined && data.trade_price === undefined) data.trade_price = data.cost_price;

  const tableInfo = db.prepare(`PRAGMA table_info(products_${category})`).all();
  const columns = tableInfo.map(c => c.name);
  const cleanData = {};
  for (const [key, value] of Object.entries(data)) {
    if (columns.includes(key) && key !== 'id') cleanData[key] = value;
  }
  const updates = Object.keys(cleanData).map(k => `${k} = ?`).join(', ');
  const values = Object.values(cleanData);
  db.prepare(`UPDATE products_${category} SET ${updates} WHERE id = ?`).run(...values, id);
}

function deleteProduct(category, id) {
  db.prepare(`DELETE FROM products_${category} WHERE id = ?`).run(id);
}

function getCategoryLabels() {
  return db.prepare('SELECT * FROM category_labels').all();
}

function updateCategoryLabel(slug, label) {
  db.prepare('UPDATE category_labels SET label = ? WHERE slug = ?').run(label, slug);
}

let _catSchemasCache = null;

function getCatSchemas() {
  if (_catSchemasCache) return _catSchemasCache;
  const labels = getCategoryLabels();
  _catSchemasCache = labels.map(l => {
    const cat = l.slug;
    const cols = db.prepare(`PRAGMA table_info(products_${cat})`).all().map(x => x.name);
    return {
      cat,
      hasMedName: cols.includes('medicine_name'),
      hasItemName: cols.includes('item_name'),
      hasBrandName: cols.includes('brand_name'),
      hasGenericName: cols.includes('generic_name'),
      hasMedCode: cols.includes('medicine_code'),
      hasCompanyId: cols.includes('company_id'),
      nameCol: cols.includes('medicine_name') ? 'p.medicine_name' : 'p.item_name'
    };
  });
  return _catSchemasCache;
}

function searchAllProducts(query, companyId = null) {
  const schemas = getCatSchemas();
  const qClean = (query || '').trim();

  // If no query, return top general products across categories ordered alphabetically
  if (!qClean) {
    let results = [];
    for (const s of schemas) {
      const sql = `
        SELECT p.*, COALESCE(c.name, p.company_name) as company_name, '${s.cat}' as slug 
        FROM products_${s.cat} p 
        LEFT JOIN companies c ON c.id = p.company_id
        ${companyId && s.hasCompanyId ? 'WHERE p.company_id = ' + Number(companyId) : ''}
        ORDER BY ${s.nameCol} ASC
        LIMIT 20
      `;
      try {
        results.push(...db.prepare(sql).all());
      } catch (e) {}
    }
    results.sort((a, b) => (a.medicine_name || a.item_name || '').localeCompare(b.medicine_name || b.item_name || ''));
    return results.slice(0, 80);
  }

  // 1. PREFIX SEARCH (Show items starting with typed characters, ordered A-Z)
  const prefixParam = `${qClean}%`;
  let prefixResults = [];

  for (const s of schemas) {
    const conds = [];
    const params = [];

    if (companyId && s.hasCompanyId) {
      conds.push('p.company_id = ?');
      params.push(companyId);
    }

    const nameMatches = [];
    if (s.hasMedName) {
      nameMatches.push('p.medicine_name LIKE ?');
      params.push(prefixParam);
    }
    if (s.hasItemName) {
      nameMatches.push('p.item_name LIKE ?');
      params.push(prefixParam);
    }
    if (s.hasBrandName) {
      nameMatches.push('p.brand_name LIKE ?');
      params.push(prefixParam);
    }

    if (nameMatches.length === 0) continue;
    conds.push(`(${nameMatches.join(' OR ')})`);

    const sql = `
      SELECT p.*, COALESCE(c.name, p.company_name) as company_name, '${s.cat}' as slug 
      FROM products_${s.cat} p 
      LEFT JOIN companies c ON c.id = p.company_id
      WHERE ${conds.join(' AND ')}
      ORDER BY ${s.nameCol} ASC
      LIMIT 25
    `;
    try {
      const rows = db.prepare(sql).all(...params);
      prefixResults.push(...rows);
    } catch (e) {}
  }

  // Sort globally in alphabetical order (A to Z)
  prefixResults.sort((a, b) => {
    const nameA = (a.medicine_name || a.item_name || '').toUpperCase();
    const nameB = (b.medicine_name || b.item_name || '').toUpperCase();
    return nameA.localeCompare(nameB);
  });

  // If prefix matches found (e.g. typing "a"), return ONLY items starting with "a"
  if (prefixResults.length > 0) {
    return prefixResults.slice(0, 60);
  }

  // 2. FALLBACK: If no medicine name starts with the query, search generic formula / barcode
  let fallbackResults = [];

  for (const s of schemas) {
    const conds = [];
    const params = [];

    if (companyId && s.hasCompanyId) {
      conds.push('p.company_id = ?');
      params.push(companyId);
    }

    const fallbackMatches = [];
    if (s.hasGenericName) {
      fallbackMatches.push('p.generic_name LIKE ?');
      params.push(prefixParam);
    }
    if (s.hasMedCode) {
      fallbackMatches.push('p.medicine_code LIKE ?');
      params.push(prefixParam);
    }

    if (fallbackMatches.length === 0) continue;
    conds.push(`(${fallbackMatches.join(' OR ')})`);

    const sql = `
      SELECT p.*, COALESCE(c.name, p.company_name) as company_name, '${s.cat}' as slug 
      FROM products_${s.cat} p 
      LEFT JOIN companies c ON c.id = p.company_id
      WHERE ${conds.join(' AND ')}
      ORDER BY ${s.nameCol} ASC
      LIMIT 25
    `;
    try {
      const rows = db.prepare(sql).all(...params);
      fallbackResults.push(...rows);
    } catch (e) {}
  }

  fallbackResults.sort((a, b) => {
    const nameA = (a.medicine_name || a.item_name || '').toUpperCase();
    const nameB = (b.medicine_name || b.item_name || '').toUpperCase();
    return nameA.localeCompare(nameB);
  });

  return fallbackResults.slice(0, 60);
}

function toggleFavorite(category, id) {
  const exists = db.prepare('SELECT id FROM favorites WHERE category_slug = ? AND product_id = ?').get(category, id);
  if (exists) {
    db.prepare('DELETE FROM favorites WHERE id = ?').run(exists.id);
    return { status: 'removed' };
  } else {
    db.prepare('INSERT INTO favorites (category_slug, product_id) VALUES (?, ?)').run(category, id);
    return { status: 'added' };
  }
}

function getFavoriteProducts() {
  const labels = getCategoryLabels();
  let results = [];
  labels.forEach(l => {
    const cat = l.slug;
    const sql = `
      SELECT p.*, '${cat}' as slug, 1 as is_favorite 
      FROM products_${cat} p
      INNER JOIN favorites f ON f.category_slug = '${cat}' AND f.product_id = p.id
      LEFT JOIN companies c ON c.id = p.company_id
    `;
    const rows = db.prepare(sql).all();
    results = results.concat(rows);
  });
  return results;
}

function getCategoryStats() {
  const labels = getCategoryLabels();
  const list = labels.map(l => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as c FROM products_${l.slug}`).get().c || 0;
      return { ...l, count };
    } catch(e) {
      return { ...l, count: 0 };
    }
  });
  return list.sort((a, b) => (b.count || 0) - (a.count || 0) || a.label.localeCompare(b.label));
}

function addCategory(label) {
  const slug = label.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  
  const exists = db.prepare('SELECT id FROM category_labels WHERE slug = ?').get(slug);
  if (exists) return { error: 'Category already exists' };

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO category_labels (slug, label) VALUES (?, ?)').run(slug, label);
    db.exec(`CREATE TABLE products_${slug} (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      medicine_code TEXT,
      item_name TEXT, 
      generic_name TEXT,
      dosage_form TEXT,
      strength TEXT,
      company_id INTEGER,
      batch_no TEXT,
      expiry_date TEXT,
      rack_shelf TEXT,
      schedule TEXT DEFAULT 'OTC',
      description TEXT, 
      current_stock INTEGER DEFAULT 0, 
      unit TEXT DEFAULT 'PACK', 
      pieces_per_carton INTEGER DEFAULT 10,
      cost_price REAL DEFAULT 0, 
      retail_price REAL DEFAULT 0,
      wholesale_cost_price REAL DEFAULT 0,
      wholesale_price REAL DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5
    )`);
  });
  transaction();
  _catSchemasCache = null;
  return { success: true, slug };
}

function deleteCategory(slug) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM products_${slug}`).get()?.c || 0;
    if (count > 0) {
      return { error: `Cannot delete category containing ${count} medicines. Remove or transfer medicines first.` };
    }
  } catch(e) {}

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM category_labels WHERE slug = ?').run(slug);
    db.prepare('DELETE FROM favorites WHERE category_slug = ?').run(slug);
    db.exec(`DROP TABLE IF EXISTS products_${slug}`);
  });
  transaction();
  _catSchemasCache = null;
  return { success: true };
}

// ------ PROPOSALS (SALES & INVOICES) ------
function getProposals() {
  return db.prepare('SELECT * FROM proposals ORDER BY id DESC').all();
}

function getProposal(id) {
  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (proposal) {
    proposal.items = db.prepare('SELECT * FROM proposal_items WHERE proposal_id = ?').all(id);
  }
  return proposal;
}

function getNextProposalNumber() {
  const last = db.prepare('SELECT proposal_number FROM proposals ORDER BY id DESC LIMIT 1').get();
  if (!last || !last.proposal_number) return 'INV-1';
  
  let match = last.proposal_number.match(/(?:INV|RX|SE)-(\d+)/i);
  if (match) {
    let num = parseInt(match[1], 10);
    if (/^RX-/i.test(match[0]) && num >= 1000) {
      num = num - 1000;
    }
    return `INV-${num + 1}`;
  }
  return 'INV-1';
}

function getNextCustomerName() {
  return 'Walk-in Patient';
}

function getProductTable(section) {
  if (!section) return null;
  const legacyMap = {
    pnl: 'tablets', inv: 'capsules', str: 'syrups', cab: 'injections',
    brk: 'drops_topical', bat: 'cold_chain', msc: 'surgicals_devices', oth: 'otc_baby',
    panels: 'tablets', inverters: 'capsules', structures: 'syrups', cables: 'injections',
    breakers: 'drops_topical', batteries: 'cold_chain', misc: 'surgicals_devices', others: 'otc_baby'
  };
  const tableSlug = legacyMap[section] || section;
  const tableName = `products_${tableSlug}`;
  try {
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    if (exists) return tableName;
    // Try without prefix if already has products_
    const rawExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(section);
    return rawExists ? section : null;
  } catch (e) {
    return null;
  }
}

function saveProposal(data) {
  const { items, ...proposalData } = data;
  let proposalId;
  const transaction = db.transaction(() => {
    const tableInfo = db.prepare("PRAGMA table_info(proposals)").all();
    const columns = tableInfo.map(c => c.name);
    const cleanData = {};
    for (const [k, v] of Object.entries(proposalData)) {
      if (columns.includes(k)) cleanData[k] = v;
    }

    if (proposalData.id) {
      proposalId = proposalData.id;

      // 1. Restore previous items to stock before updating
      const oldItems = db.prepare('SELECT item_id, section, qty FROM proposal_items WHERE proposal_id = ?').all(proposalId);
      for (const oldItem of oldItems) {
        if (oldItem.item_id && oldItem.section) {
          const table = getProductTable(oldItem.section);
          if (table) {
            try {
              db.prepare(`UPDATE ${table} SET current_stock = current_stock + ? WHERE id = ?`).run(oldItem.qty, oldItem.item_id);
            } catch (stockErr) {
              console.error(`[STOCK RESTORE EDIT] Failed to restore for ${table}:`, stockErr);
            }
          }
        }
      }

      const updates = Object.keys(cleanData).filter(k => k !== 'id').map(k => `${k} = @${k}`).join(', ');
      db.prepare(`UPDATE proposals SET ${updates} WHERE id = @id`).run(cleanData);
      db.prepare('DELETE FROM proposal_items WHERE proposal_id = ?').run(proposalId);
    } else {
      const keys = Object.keys(cleanData);
      const placeholders = keys.map(k => `@${k}`).join(', ');
      const info = db.prepare(`INSERT INTO proposals (${keys.join(', ')}) VALUES (${placeholders})`).run(cleanData);
      proposalId = info.lastInsertRowid;
    }

    if (items && items.length > 0) {
      const stmt = db.prepare(`INSERT INTO proposal_items (
        proposal_id, item_id, section, description, generic_name, batch_no, expiry_date,
        qty, unit, unit_cost, unit_retail, unit_discounted, line_cost, line_retail, line_profit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      for (const item of items) {
        const discPrice = (item.unit_discounted !== undefined && item.unit_discounted !== null) ? item.unit_discounted : item.unit_retail;
        stmt.run(
          proposalId, item.item_id, item.section, item.description, item.generic_name || '', item.batch_no || '', item.expiry_date || '',
          item.qty, item.unit || 'PACK', item.unit_cost, item.unit_retail, discPrice, item.line_cost, item.line_retail, item.line_profit
        );
        
        // Deduct stock for all completed/saved sales
        if (item.item_id && item.section) {
          const table = getProductTable(item.section);
          if (table) {
            try {
              db.prepare(`UPDATE ${table} SET current_stock = MAX(0, current_stock - ?) WHERE id = ?`).run(item.qty, item.item_id);
            } catch(stockErr) {
              console.error(`[STOCK DEDUCT] Failed to deduct for ${table}:`, stockErr);
            }
          }
        }
      }
    }
  });
  transaction();
  return proposalId;
}

function deleteProposal(id) {
  const transaction = db.transaction(() => {
    // 1. Restore all items sold in this proposal back to current_stock
    const items = db.prepare('SELECT item_id, section, qty FROM proposal_items WHERE proposal_id = ?').all(id);
    for (const item of items) {
      if (item.item_id && item.section) {
        const table = getProductTable(item.section);
        if (table) {
          try {
            db.prepare(`UPDATE ${table} SET current_stock = current_stock + ? WHERE id = ?`).run(item.qty, item.item_id);
          } catch (stockErr) {
            console.error(`[STOCK RESTORE DELETE] Failed to restore for ${table}:`, stockErr);
          }
        }
      }
    }

    db.prepare('DELETE FROM proposal_items WHERE proposal_id = ?').run(id);
    db.prepare('DELETE FROM proposals WHERE id = ?').run(id);
  });
  transaction();
}

function updateProposalStatus(id, status) {
  db.prepare('UPDATE proposals SET status = ? WHERE id = ?').run(status, id);
}

function receivePayment(id, addedAmount, paymentMethod = 'Cash') {
  const p = db.prepare('SELECT retail_total, received_amount FROM proposals WHERE id = ?').get(id);
  if (!p) return;
  
  const newReceived = (p.received_amount || 0) + addedAmount;
  const status = newReceived >= p.retail_total ? 'Paid' : 'Pending';
  
  db.prepare('UPDATE proposals SET received_amount = ?, status = ?, payment_method = ? WHERE id = ?').run(newReceived, status, paymentMethod, id);
  return { newReceived, status };
}

// ------ EXPENSES ------
function getExpenses(filters) {
  let sql = 'SELECT * FROM expenses';
  let params = [];
  
  if (filters && filters.month !== undefined && filters.year !== undefined) {
    const monthStr = String(filters.month + 1).padStart(2, '0');
    sql += ' WHERE date LIKE ?';
    params.push(`${filters.year}-${monthStr}-%`);
  }
  
  sql += ' ORDER BY date DESC';
  return db.prepare(sql).all(...params);
}

function saveExpense(data) {
  if (data.id) {
    const { id, ...updates } = data;
    const clause = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE expenses SET ${clause} WHERE id = @id`).run(data);
  } else {
    const keys = Object.keys(data);
    const placeholders = keys.map(k => `@${k}`).join(', ');
    db.prepare(`INSERT INTO expenses (${keys.join(', ')}) VALUES (${placeholders})`).run(data);
  }
}

function deleteExpense(id) {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
}

function getExpenseCategories() {
  return db.prepare('SELECT * FROM expense_categories ORDER BY name ASC').all();
}

function addExpenseCategory(name) {
  try {
    const info = db.prepare('INSERT INTO expense_categories (name) VALUES (?)').run(name);
    return info.lastInsertRowid;
  } catch (e) {
    return { error: 'Category already exists or error occurred' };
  }
}

function deleteExpenseCategory(id) {
  db.prepare('DELETE FROM expense_categories WHERE id = ?').run(id);
}

function getExpensesSummary(filters) {
  const now = new Date();
  let m = now.getMonth();
  let y = now.getFullYear();

  if (filters && filters.month !== undefined && filters.year !== undefined) {
    m = filters.month;
    y = filters.year;
  }

  const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const monthTotal = db.prepare(`SELECT SUM(amount) as s FROM expenses WHERE date LIKE '${monthStr}-%'`).get().s || 0;
  const dailyTotal = db.prepare("SELECT SUM(amount) as s FROM expenses WHERE substr(date, 1, 10) = ?").get(todayStr)?.s || 0;
  const salariesTotal = db.prepare(`SELECT SUM(amount) as s FROM expenses WHERE LOWER(category) LIKE '%salary%' AND date LIKE '${monthStr}-%'`).get().s || 0;
  
  return { selectedMonth: monthTotal, daily: dailyTotal, salaries: salariesTotal };
}

// ------ EMPLOYEES ------
function getEmployees(status) {
  if (status && status !== 'All') {
    return db.prepare('SELECT * FROM employees WHERE status = ? ORDER BY full_name').all(status);
  }
  return db.prepare('SELECT * FROM employees ORDER BY full_name').all();
}

function saveEmployee(data) {
  if (data.id) {
    const { id, ...updates } = data;
    const clause = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE employees SET ${clause} WHERE id = @id`).run(data);
  } else {
    const keys = Object.keys(data);
    const placeholders = keys.map(k => `@${k}`).join(', ');
    db.prepare(`INSERT INTO employees (${keys.join(', ')}) VALUES (${placeholders})`).run(data);
  }
}

function deleteEmployee(id) {
  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
}

// ------ COMPANIES (DISTRIBUTORS) ------
function getCompanies() {
  return db.prepare('SELECT * FROM companies ORDER BY name ASC').all();
}

function saveCompany(data) {
  if (data.id) {
    const { id, ...updates } = data;
    const clause = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE companies SET ${clause} WHERE id = @id`).run(data);
  } else {
    const keys = Object.keys(data);
    const placeholders = keys.map(k => `@${k}`).join(', ');
    db.prepare(`INSERT INTO companies (${keys.join(', ')}) VALUES (${placeholders})`).run(data);
  }
}

function deleteCompany(id) {
  db.prepare('DELETE FROM companies WHERE id = ?').run(id);
}

// ------ CUSTOMERS (PATIENTS) ------
function getCustomers() {
  return db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
}

function saveCustomer(data) {
  let customerId;
  const transaction = db.transaction(() => {
    if (data.id) {
      const { id, ...updates } = data;
      const clause = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
      db.prepare(`UPDATE customers SET ${clause} WHERE id = @id`).run(data);
      customerId = data.id;
    } else {
      const keys = Object.keys(data);
      const placeholders = keys.map(k => `@${k}`).join(', ');
      const info = db.prepare(`INSERT INTO customers (${keys.join(', ')}) VALUES (${placeholders})`).run(data);
      customerId = info.lastInsertRowid;
    }
  });
  transaction();
  return customerId;
}

function deleteCustomer(id) {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
}

// ------ DASHBOARD ------
function getDashboardStats(filter = 'daily') {
  let period = typeof filter === 'string' ? filter : (filter.period || 'daily');
  
  let propConditions = [];
  let expConditions = [];
  let propParams = [];
  let expParams = [];
  let topSoldConditions = [];
  let topSoldParams = [];

  const propDateExpr = "CASE WHEN (COALESCE(date, created_at) LIKE '%T%Z' OR COALESCE(date, created_at) LIKE '%Z') THEN date(COALESCE(date, created_at), 'localtime') ELSE substr(COALESCE(date, date(created_at, 'localtime')), 1, 10) END";
  const expDateExpr = "substr(COALESCE(date, date(created_at, 'localtime')), 1, 10)";
  const topSoldDateExpr = "CASE WHEN (COALESCE(p.date, p.created_at) LIKE '%T%Z' OR COALESCE(p.date, p.created_at) LIKE '%Z') THEN date(COALESCE(p.date, p.created_at), 'localtime') ELSE substr(COALESCE(p.date, date(p.created_at, 'localtime')), 1, 10) END";

  if (period === 'daily') {
    const targetDate = (typeof filter === 'object' && filter.targetDate) ? filter.targetDate : null;
    if (targetDate) {
      propConditions.push(`${propDateExpr} = ?`);
      propParams.push(targetDate);
      expConditions.push(`${expDateExpr} = ?`);
      expParams.push(targetDate);
      topSoldConditions.push(`${topSoldDateExpr} = ?`);
      topSoldParams.push(targetDate);
    } else {
      propConditions.push(`${propDateExpr} = date('now', 'localtime')`);
      expConditions.push(`${expDateExpr} = date('now', 'localtime')`);
      topSoldConditions.push(`${topSoldDateExpr} = date('now', 'localtime')`);
    }
  } else if (period === 'monthly') {
    let targetMonth = null;
    if (typeof filter === 'object') {
      if (filter.targetMonth) {
        targetMonth = filter.targetMonth;
      } else if (filter.year && filter.month) {
        targetMonth = `${filter.year}-${String(filter.month).padStart(2, '0')}`;
      }
    }
    if (targetMonth) {
      propConditions.push(`substr(${propDateExpr}, 1, 7) = ?`);
      propParams.push(targetMonth);
      expConditions.push(`substr(${expDateExpr}, 1, 7) = ?`);
      expParams.push(targetMonth);
      topSoldConditions.push(`substr(${topSoldDateExpr}, 1, 7) = ?`);
      topSoldParams.push(targetMonth);
    } else {
      propConditions.push(`substr(${propDateExpr}, 1, 7) = strftime('%Y-%m', 'now', 'localtime')`);
      expConditions.push(`substr(${expDateExpr}, 1, 7) = strftime('%Y-%m', 'now', 'localtime')`);
      topSoldConditions.push(`substr(${topSoldDateExpr}, 1, 7) = strftime('%Y-%m', 'now', 'localtime')`);
    }
  } else if (period === 'annual') {
    let targetYear = null;
    if (typeof filter === 'object') {
      if (filter.targetYear) targetYear = String(filter.targetYear);
      else if (filter.year) targetYear = String(filter.year);
    }
    if (targetYear) {
      propConditions.push(`substr(${propDateExpr}, 1, 4) = ?`);
      propParams.push(targetYear);
      expConditions.push(`substr(${expDateExpr}, 1, 4) = ?`);
      expParams.push(targetYear);
      topSoldConditions.push(`substr(${topSoldDateExpr}, 1, 4) = ?`);
      topSoldParams.push(targetYear);
    } else {
      propConditions.push(`substr(${propDateExpr}, 1, 4) = strftime('%Y', 'now', 'localtime')`);
      expConditions.push(`substr(${expDateExpr}, 1, 4) = strftime('%Y', 'now', 'localtime')`);
      topSoldConditions.push(`substr(${topSoldDateExpr}, 1, 4) = strftime('%Y', 'now', 'localtime')`);
    }
  } else if (period === 'custom') {
    let start = typeof filter === 'object' && filter.startDate ? filter.startDate : '';
    let end = typeof filter === 'object' && filter.endDate ? filter.endDate : '';
    if (start && end) {
      propConditions.push(`${propDateExpr} >= ? AND ${propDateExpr} <= ?`);
      propParams.push(start, end);
      expConditions.push(`${expDateExpr} >= ? AND ${expDateExpr} <= ?`);
      expParams.push(start, end);
      topSoldConditions.push(`${topSoldDateExpr} >= ? AND ${topSoldDateExpr} <= ?`);
      topSoldParams.push(start, end);
    } else if (start) {
      propConditions.push(`${propDateExpr} >= ?`);
      propParams.push(start);
      expConditions.push(`${expDateExpr} >= ?`);
      expParams.push(start);
      topSoldConditions.push(`${topSoldDateExpr} >= ?`);
      topSoldParams.push(start);
    } else if (end) {
      propConditions.push(`${propDateExpr} <= ?`);
      propParams.push(end);
      expConditions.push(`${expDateExpr} <= ?`);
      expParams.push(end);
      topSoldConditions.push(`${topSoldDateExpr} <= ?`);
      topSoldParams.push(end);
    }
  }

  const propWhereClause = propConditions.length > 0 ? "WHERE " + propConditions.join(" AND ") : "";
  const expWhereClause = expConditions.length > 0 ? "WHERE " + expConditions.join(" AND ") : "";
  const topSoldWhereClause = topSoldConditions.length > 0 ? "WHERE " + topSoldConditions.join(" AND ") : "";

  const proposalCount = db.prepare(`SELECT COUNT(*) as c FROM proposals ${propWhereClause}`).get(...propParams)?.c || 0;
  const revenueStr = db.prepare(`SELECT SUM(retail_total) as r FROM proposals ${propWhereClause}`).get(...propParams)?.r || 0;
  const profitStr = db.prepare(`SELECT SUM(profit) as p FROM proposals ${propWhereClause}`).get(...propParams)?.p || 0;
  const discountStr = db.prepare(`SELECT SUM(discount) as d FROM proposals ${propWhereClause}`).get(...propParams)?.d || 0;
  const expensesStr = db.prepare(`SELECT SUM(amount) as a FROM expenses ${expWhereClause}`).get(...expParams)?.a || 0;

  const employeesCount = db.prepare("SELECT COUNT(*) as c FROM employees WHERE status = 'Active'").get()?.c || 0;
  const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM customers WHERE (name NOT LIKE 'Walk-in Patient-%' AND name NOT LIKE 'Customer-%') OR ABS(amount) > 0.01").get()?.c || 0;
  const totalVendors = db.prepare("SELECT COUNT(*) as c FROM companies").get()?.c || 0;
  const totalReceivables = db.prepare("SELECT COALESCE(SUM(amount), 0) as r FROM customers WHERE amount > 0").get()?.r || 0;

  const recentProposals = db.prepare(`SELECT proposal_number, customer_name, phone, date, retail_total, received_amount, status FROM proposals ${propWhereClause} ORDER BY id DESC LIMIT 5`).all(...propParams);
  const recentExpenses = db.prepare(`SELECT date, category, amount, description FROM expenses ${expWhereClause} ORDER BY id DESC LIMIT 5`).all(...expParams);

  // Top Sold for the period
  const topSold = db.prepare(`
    SELECT pi.description, SUM(pi.qty) as qty 
    FROM proposal_items pi 
    JOIN proposals p ON pi.proposal_id = p.id 
    ${topSoldWhereClause}
    GROUP BY pi.description 
    ORDER BY qty DESC 
    LIMIT 1
  `).get(...topSoldParams) || { description: '-', qty: 0 };

  let itemName = topSold.description || '-';
  if (itemName.includes(' - ')) {
    itemName = itemName.split(' - ')[0];
  }

  // Count near-expiry items (< 90 days) and low-stock items across all tables
  let nearExpiryCount = 0;
  let lowStockCount = 0;
  const allTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'products_%'").all();
  
  const today = new Date();
  const ninetyDaysFromNow = new Date(today);
  ninetyDaysFromNow.setDate(today.getDate() + 90);
  const ninetyDaysStr = ninetyDaysFromNow.toISOString().split('T')[0];

  allTables.forEach(t => {
    try {
      const expCount = db.prepare(`SELECT COUNT(*) as c FROM ${t.name} WHERE expiry_date IS NOT NULL AND expiry_date != '' AND expiry_date <= ?`).get(ninetyDaysStr)?.c || 0;
      nearExpiryCount += expCount;
      const lowCount = db.prepare(`SELECT COUNT(*) as c FROM ${t.name} WHERE current_stock <= COALESCE(min_stock_level, 5)`).get()?.c || 0;
      lowStockCount += lowCount;
    } catch(e) {}
  });

  const currentYr = new Date().getFullYear();
  const yearsSet = new Set([currentYr, currentYr - 1, currentYr - 2]);
  try {
    const yrRows = db.prepare("SELECT DISTINCT strftime('%Y', COALESCE(date, created_at), 'localtime') as yr FROM proposals WHERE yr IS NOT NULL").all();
    yrRows.forEach(r => { if (r.yr) yearsSet.add(parseInt(r.yr)); });
  } catch(e) {}
  const availableYears = Array.from(yearsSet).filter(Boolean).sort((a, b) => b - a);

  return {
    proposalCount,
    totalRevenue: revenueStr,
    totalProfit: profitStr,
    totalDiscount: discountStr,
    totalExpenses: expensesStr,
    activeEmployees: employeesCount,
    topSold: itemName,
    recentProposals,
    recentExpenses,
    totalCustomers,
    totalVendors,
    totalReceivables,
    nearExpiryCount,
    lowStockCount,
    availableYears
  };
}

// ------ SALES STATS ------
function getItemSales(section, period, targetDate = null) {
  const params = [];
  const conditions = [];

  if (section && section !== 'all') {
    const legacyMap = {
      tablets: ['tablets', 'panels', 'pnl'],
      capsules: ['capsules', 'inverters', 'inv'],
      syrups: ['syrups', 'structures', 'str'],
      injections: ['injections', 'cables', 'cab'],
      drops_topical: ['drops_topical', 'breakers', 'brk'],
      cold_chain: ['cold_chain', 'batteries', 'bat'],
      surgicals_devices: ['surgicals_devices', 'misc', 'msc'],
      otc_baby: ['otc_baby', 'others', 'oth']
    };

    const matches = legacyMap[section] || [section];
    const placeholders = matches.map(() => '?').join(', ');
    conditions.push(`pi.section IN (${placeholders})`);
    params.push(...matches);
  }

  if (period === 'daily') {
    if (targetDate) {
      conditions.push("date(COALESCE(p.date, p.created_at), 'localtime') = ?");
      params.push(targetDate);
    } else {
      conditions.push("date(COALESCE(p.date, p.created_at), 'localtime') = date('now', 'localtime')");
    }
  } else if (period === 'monthly') {
    if (targetDate) {
      conditions.push("strftime('%Y-%m', COALESCE(p.date, p.created_at), 'localtime') = ?");
      params.push(targetDate);
    } else {
      conditions.push("strftime('%Y-%m', COALESCE(p.date, p.created_at), 'localtime') = strftime('%Y-%m', 'now', 'localtime')");
    }
  } else if (period === 'annual') {
    if (targetDate) {
      conditions.push("strftime('%Y', COALESCE(p.date, p.created_at), 'localtime') = ?");
      params.push(String(targetDate));
    } else {
      conditions.push("strftime('%Y', COALESCE(p.date, p.created_at), 'localtime') = strftime('%Y', 'now', 'localtime')");
    }
  }

  const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const joinClause = "JOIN proposals p ON pi.proposal_id = p.id";

  const sql = `
    SELECT 
      pi.description,
      pi.generic_name,
      pi.section,
      SUM(pi.qty) as total_qty,
      SUM(pi.line_cost) as total_cost,
      SUM(pi.line_retail) as total_revenue,
      SUM(pi.line_profit) as total_profit
    FROM proposal_items pi
    ${joinClause}
    ${whereClause}
    GROUP BY pi.description, pi.section
    ORDER BY total_qty DESC
  `;

  return db.prepare(sql).all(...params);
}

function getReportSummary(filters) {
  const { start, end } = filters;
  
  const sales = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(retail_total) as amount,
      SUM(cost_total) as cost,
      SUM(profit) as profit
    FROM proposals 
    WHERE date(COALESCE(date, created_at), 'localtime') >= ? AND date(COALESCE(date, created_at), 'localtime') <= ?
  `).get(start, end) || { count: 0, amount: 0, cost: 0, profit: 0 };
  
  const itemsRow = db.prepare(`
    SELECT SUM(qty) as items
    FROM proposal_items pi
    JOIN proposals p ON pi.proposal_id = p.id
    WHERE date(COALESCE(p.date, p.created_at), 'localtime') >= ? AND date(COALESCE(p.date, p.created_at), 'localtime') <= ?
  `).get(start, end);
  const itemsSold = (itemsRow && itemsRow.items) || 0;

  const expenses = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(amount) as amount
    FROM expenses
    WHERE substr(COALESCE(date, date(created_at, 'localtime')), 1, 10) >= ? AND substr(COALESCE(date, date(created_at, 'localtime')), 1, 10) <= ?
  `).get(start, end) || { count: 0, amount: 0 };

  const vendors = db.prepare(`
    SELECT 
      COUNT(*) as count,
      SUM(amount) as amount
    FROM companies
  `).get() || { count: 0, amount: 0 };

  return {
    sales: {
      count: sales.count || 0,
      amount: sales.amount || 0,
      cost: sales.cost || 0,
      profit: sales.profit || 0,
      itemsSold: itemsSold
    },
    expenses: {
      count: expenses.count || 0,
      amount: expenses.amount || 0
    },
    vendors: {
      count: vendors.count || 0,
      amount: vendors.amount || 0
    }
  };
}

function getUnits() {
  return db.prepare('SELECT * FROM product_units ORDER BY name ASC').all();
}

function addUnit(name) {
  try {
    return db.prepare('INSERT INTO product_units (name) VALUES (?)').run(name.toUpperCase());
  } catch(e) { return { error: e.message }; }
}

function updateUnit(id, name) {
  try {
    return db.prepare('UPDATE product_units SET name = ? WHERE id = ?').run(name.toUpperCase(), id);
  } catch(e) { return { error: e.message }; }
}

function deleteUnit(id) {
  try {
    return db.prepare('DELETE FROM product_units WHERE id = ?').run(id);
  } catch(e) { return { error: e.message }; }
}

function getDbPath() {
  const userDataPath = app && app.getPath ? app.getPath('userData') : path.join(process.env.APPDATA, 'afridi-diagnostic-centre');
  return path.join(userDataPath, 'pharmacy.db');
}

function close() {
  if (db) db.close();
}

function clearAllData() {
  if (!db) return { success: false, error: 'Database not initialized' };

  try {
    const tx = db.transaction(() => {
      // 1. Clear all companies (distributors)
      db.prepare('DELETE FROM companies').run();

      // 2. Clear all customers (patients)
      db.prepare('DELETE FROM customers').run();

      // 3. Clear all products across all products_% tables (medicine stock)
      const productTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'products_%'").all();
      productTables.forEach(t => {
        db.prepare(`DELETE FROM ${t.name}`).run();
      });

      // 4. Clear all proposals and proposal_items (sales invoices & receipts)
      db.prepare('DELETE FROM proposal_items').run();
      db.prepare('DELETE FROM proposals').run();

      // 5. Clear all expenses
      db.prepare('DELETE FROM expenses').run();

      // 6. Clear all employees / pharmacists
      db.prepare('DELETE FROM employees').run();

      // 7. Clear all favorites
      db.prepare('DELETE FROM favorites').run();

      // 8. Clear all app_kv_store (transactions, ledgers, draft states, counters)
      db.prepare('DELETE FROM app_kv_store').run();

      // 9. Reset sqlite_sequence for all autoincrement tables so IDs start from 1
      try {
        db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('companies', 'customers', 'proposals', 'proposal_items', 'expenses', 'employees', 'favorites')").run();
        productTables.forEach(t => {
          try { db.prepare("DELETE FROM sqlite_sequence WHERE name = ?").run(t.name); } catch(e) {}
        });
      } catch (seqErr) {}

      // 10. Mark system as initialized so seedInitialData() will NEVER re-seed dummy/sample data
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('system_initialized', 'true')").run();

      // 11. Ensure clean pharmacy store profile in settings
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('company_name', 'Afridi Diagnostic Centre')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('address', 'Near Babu Hotel, Railway Ground, Taxila')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('phone', '0333-9109092')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('license_number', '')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('pharmacist_name', '')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ntn', '')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('return_policy', '')").run();
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('logo_path', '')").run();
    });

    tx();

    // Checkpoint WAL and vacuum database to reclaim disk space
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.exec('VACUUM');
    } catch (vacErr) {
      console.warn('Vacuum warning in clearAllData:', vacErr);
    }

    // Clean up any old migration candidate databases in AppData to prevent accidental legacy restoration
    try {
      const appDataPath = app && app.getPath ? app.getPath('appData') : process.env.APPDATA;
      if (appDataPath) {
        const oldDirs = ['pakistan-pharmacy-pos', 'Pharmacy POS', 'Awan Medical Store'];
        for (const oldDir of oldDirs) {
          ['pharmacy.db', 'pharmacy.db-wal', 'pharmacy.db-shm'].forEach(file => {
            const candidate = path.join(appDataPath, oldDir, file);
            if (fs.existsSync(candidate)) {
              try { fs.unlinkSync(candidate); } catch(e) {}
            }
          });
        }
      }
    } catch (migErr) {}

    return { success: true };
  } catch (err) {
    console.error('Failed to clear all data:', err);
    return { success: false, error: err.message };
  }
}

function clearAllStock() {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    const tx = db.transaction(() => {
      const productTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'products_%'").all();
      productTables.forEach(t => {
        db.prepare(`DELETE FROM ${t.name}`).run();
        try { db.prepare("DELETE FROM sqlite_sequence WHERE name = ?").run(t.name); } catch(e) {}
      });
      try {
        db.prepare('DELETE FROM favorites').run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name = 'favorites'").run();
      } catch(e) {}
    });
    tx();
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch(e) {}
    return { success: true };
  } catch(err) {
    console.error('Failed to clear all stock:', err);
    return { success: false, error: err.message };
  }
}

function clearAllCompanies() {
  if (!db) return { success: false, error: 'Database not initialized' };
  try {
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM companies').run();
      try { db.prepare("DELETE FROM sqlite_sequence WHERE name = 'companies'").run(); } catch(e) {}
      const keys = db.prepare("SELECT key FROM app_kv_store WHERE key LIKE 'companies-%' OR key LIKE 'company_%'").all();
      keys.forEach(k => {
        db.prepare("DELETE FROM app_kv_store WHERE key = ?").run(k.key);
      });
    });
    tx();
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch(e) {}
    return { success: true };
  } catch(err) {
    console.error('Failed to clear all companies:', err);
    return { success: false, error: err.message };
  }
}

async function backupDatabase(destinationPath) {
  if (!db) throw new Error('Database not initialized');
  
  // 1. Force WAL checkpoint to flush all journals into the main database file
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (e) {
    console.error('WAL checkpoint error during backup:', e);
  }

  // 2. Use Better-SQLite3's online backup API to write complete clean DB snapshot
  try {
    if (typeof db.backup === 'function') {
      await db.backup(destinationPath);
      return { success: true, path: destinationPath };
    }
  } catch (e) {
    console.warn('db.backup failed, falling back to VACUUM INTO / copy:', e);
  }

  // 3. Fallback: VACUUM INTO
  try {
    if (fs.existsSync(destinationPath)) {
      fs.unlinkSync(destinationPath);
    }
    db.prepare('VACUUM INTO ?').run(destinationPath);
    return { success: true, path: destinationPath };
  } catch (e) {
    // 4. File copy fallback
    const dbPath = getDbPath();
    fs.copyFileSync(dbPath, destinationPath);
    return { success: true, path: destinationPath };
  }
}

module.exports = {
  init, getDbPath, close, clearAllData, clearAllStock, clearAllCompanies, backupDatabase,
  getSettings, saveSettings,
  getProducts, getPaginatedProducts, addProduct, updateProduct, deleteProduct,
  getCategoryLabels, updateCategoryLabel, searchAllProducts, getCategoryStats, addCategory, deleteCategory,
  getProposals, getProposal, saveProposal, deleteProposal, updateProposalStatus, receivePayment, getNextProposalNumber, getNextCustomerName,
  getExpenses, saveExpense, deleteExpense, getExpensesSummary,
  getExpenseCategories, addExpenseCategory, deleteExpenseCategory,
  getEmployees, saveEmployee, deleteEmployee,
  getCompanies, saveCompany, deleteCompany,
  getCustomers, saveCustomer, deleteCustomer,
  getDashboardStats,
  getItemSales,
  getReportSummary,
  toggleFavorite,
  getFavoriteProducts,
  getUnits, addUnit, updateUnit, deleteUnit,
  getAllKv, setKv, saveAllKv
};

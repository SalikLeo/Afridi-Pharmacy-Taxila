const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./database');

let mainWindow;

function syncAppIcon(imagePath) {
  if (!imagePath || !fs.existsSync(imagePath)) return;
  try {
    const buildDir = path.join(__dirname, 'build');
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    const ext = path.extname(imagePath).toLowerCase();
    fs.copyFileSync(imagePath, path.join(buildDir, 'icon.png'));
    fs.copyFileSync(imagePath, path.join(assetsDir, 'icon.png'));
    if (ext === '.ico') {
      fs.copyFileSync(imagePath, path.join(buildDir, 'icon.ico'));
    }

    const img = nativeImage.createFromPath(imagePath);
    if (!img.isEmpty() && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIcon(img);
    }
  } catch (err) {
    console.error('Failed to sync app icon:', err);
  }
}

function getAppIconPath() {
  try {
    const s = db.getSettings();
    if (s && s.logo_path && fs.existsSync(s.logo_path)) {
      return s.logo_path;
    }
  } catch (e) {}

  const buildPng = path.join(__dirname, 'build', 'icon.png');
  if (fs.existsSync(buildPng)) return buildPng;

  const assetsPng = path.join(__dirname, 'assets', 'icon.png');
  if (fs.existsSync(assetsPng)) return assetsPng;

  return undefined;
}

function createWindow() {
  const iconPath = getAppIconPath();
  const s = db.getSettings() || {};
  const companyName = s.company_name || 'Afridi Diagnostic Centre';
  mainWindow = new BrowserWindow({
    title: `${companyName} - POS - Contact for more info: 0309-5369472`,
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.maximize();
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (iconPath) {
    syncAppIcon(iconPath);
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('mailto:')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

app.whenReady().then(() => {
  db.init(); // Initialize database
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Settings IPC
ipcMain.handle('get-settings', () => db.getSettings());
ipcMain.handle('save-settings', (event, data) => {
  const res = db.saveSettings(data);
  if (data && data.logo_path) {
    syncAppIcon(data.logo_path);
  }
  return res;
});

// Products IPC
ipcMain.handle('get-products', (event, category) => db.getProducts(category));
ipcMain.handle('get-paginated-products', (event, options) => db.getPaginatedProducts(options));
ipcMain.handle('add-product', (event, category, data) => db.addProduct(category, data));
ipcMain.handle('update-product', (event, category, id, data) => db.updateProduct(category, id, data));
ipcMain.handle('delete-product', (event, category, id) => db.deleteProduct(category, id));
ipcMain.handle('get-category-labels', () => db.getCategoryLabels());
ipcMain.handle('get-category-stats', () => db.getCategoryStats());
ipcMain.handle('update-category-label', (event, slug, label) => db.updateCategoryLabel(slug, label));
ipcMain.handle('add-category', (event, label) => db.addCategory(label));
ipcMain.handle('delete-category', (event, slug) => db.deleteCategory(slug));
ipcMain.handle('search-all-products', (event, query, companyId) => db.searchAllProducts(query, companyId));

// Units IPC
ipcMain.handle('get-units', () => db.getUnits());
ipcMain.handle('add-unit', (event, name) => db.addUnit(name));
ipcMain.handle('update-unit', (event, id, name) => db.updateUnit(id, name));
ipcMain.handle('delete-unit', (event, id) => db.deleteUnit(id));

// Proposals IPC
ipcMain.handle('get-proposals', () => db.getProposals());
ipcMain.handle('get-proposal', (event, id) => db.getProposal(id));
ipcMain.handle('save-proposal', (event, data) => db.saveProposal(data));
ipcMain.handle('delete-proposal', (event, id) => db.deleteProposal(id));
ipcMain.handle('update-proposal-status', (event, id, status) => db.updateProposalStatus(id, status));
ipcMain.handle('receive-payment', (event, id, amount) => db.receivePayment(id, amount));
ipcMain.handle('get-next-proposal-number', () => db.getNextProposalNumber());
ipcMain.handle('get-next-customer-name', () => db.getNextCustomerName());

// Expenses IPC
ipcMain.handle('get-expenses', (event, filters) => db.getExpenses(filters));
ipcMain.handle('save-expense', (event, data) => db.saveExpense(data));
ipcMain.handle('delete-expense', (event, id) => db.deleteExpense(id));
ipcMain.handle('get-expenses-summary', (event, filters) => db.getExpensesSummary(filters));
ipcMain.handle('get-expense-categories', () => db.getExpenseCategories());
ipcMain.handle('add-expense-category', (event, name) => db.addExpenseCategory(name));
ipcMain.handle('delete-expense-category', (event, id) => db.deleteExpenseCategory(id));

// Employees IPC
ipcMain.handle('get-employees', (event, status) => db.getEmployees(status));
ipcMain.handle('save-employee', (event, data) => db.saveEmployee(data));
ipcMain.handle('delete-employee', (event, id) => db.deleteEmployee(id));

// Companies IPC
ipcMain.handle('get-companies', () => db.getCompanies());
ipcMain.handle('save-company', (event, data) => db.saveCompany(data));
ipcMain.handle('delete-company', (event, id) => db.deleteCompany(id));

// Customers IPC
ipcMain.handle('get-customers', () => db.getCustomers());
ipcMain.handle('save-customer', (event, data) => db.saveCustomer(data));
ipcMain.handle('delete-customer', (event, id) => db.deleteCustomer(id));

// Dashboard Stats IPC
ipcMain.handle('get-dashboard-stats', (event, period) => db.getDashboardStats(period));
ipcMain.handle('get-item-sales', (event, section, period, targetDate) => db.getItemSales(section, period, targetDate));
ipcMain.handle('get-report-summary', (event, filters) => db.getReportSummary(filters));
ipcMain.handle('toggle-favorite', (event, category, id) => db.toggleFavorite(category, id));
ipcMain.handle('get-favorite-products', () => db.getFavoriteProducts());

// File Dialog for Logo
ipcMain.handle('select-logo-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'ico', 'webp'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const logoPath = result.filePaths[0];
    syncAppIcon(logoPath);
    return logoPath; // Return the absolute file path
  }
  return null;
});

// Backup/Restore IPC
ipcMain.handle('backup-data', async () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datetimeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Backup Data',
    defaultPath: `PharmacyPOS-${datetimeStr}.db`,
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      const res = await db.backupDatabase(result.filePath);
      return res;
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Cancelled' };
});

ipcMain.handle('restore-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Restore Data',
    properties: ['openFile'],
    filters: [{ name: 'SQLite Database', extensions: ['db'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const backupPath = result.filePaths[0];
      const dbPath = db.getDbPath();

      // Close DB, Replace file, Relaunch
      db.close();
      fs.copyFileSync(backupPath, dbPath);
      app.relaunch();
      app.exit(0);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'Cancelled' };
});

ipcMain.handle('clear-app-data', async () => {
  try {
    const res = db.clearAllData();
    setTimeout(() => {
      try { db.close(); } catch (e) {}
      app.relaunch();
      app.exit(0);
    }, 250);
    return res;
  } catch (err) {
    console.error('Clear app data error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-all-stock', async () => {
  try {
    return db.clearAllStock();
  } catch (err) {
    console.error('Clear all stock error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('clear-all-companies', async () => {
  try {
    return db.clearAllCompanies();
  } catch (err) {
    console.error('Clear all companies error:', err);
    return { success: false, error: err.message };
  }
});

// KV Store IPC
ipcMain.handle('get-all-kv', () => db.getAllKv());
ipcMain.handle('set-kv', (event, key, value) => db.setKv(key, value));
ipcMain.handle('save-all-kv', (event, data) => db.saveAllKv(data));
ipcMain.handle('generate-pdf', async (event, filename) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win, {
    title: 'Save Quotation as PDF',
    defaultPath: filename,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
        const pdfOptions = {
            pageSize: 'A4',
            printBackground: true,
            margins: {
                marginType: 'custom',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            }
        };
        const pdfData = await event.sender.printToPDF(pdfOptions);
        fs.writeFileSync(result.filePath, pdfData);
        return { success: true, path: result.filePath };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
  }
  return { success: false };
});

// Thermal Printer IPC
ipcMain.handle('get-printers', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return [];
  return await win.webContents.getPrintersAsync();
});

ipcMain.handle('print-receipt', async (event, options = {}) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: 'No active window' };

  try {
    const printers = await win.webContents.getPrintersAsync();
    const thermalPrinter = printers.find(p => /pos|thermal|receipt|80mm|xp|xprinter|epson|black copper|rp80|gprinter|rongta|zywell|everycom|hprt/i.test(p.name));
    const targetPrinter = options.deviceName || (thermalPrinter ? thermalPrinter.name : undefined);

    const printOptions = {
      silent: options.silent || false,
      printBackground: true,
      margins: {
        marginType: 'none'
      }
    };

    if (targetPrinter) {
      printOptions.deviceName = targetPrinter;
    }

    return new Promise((resolve) => {
      win.webContents.print(printOptions, (success, failureReason) => {
        resolve({ success, failureReason });
      });
    });
  } catch (err) {
    console.error('print-receipt error:', err);
    return { success: false, error: err.message };
  }
});


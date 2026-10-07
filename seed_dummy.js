const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
  const dbPath = path.join(app.getPath('userData'), 'pharmacy.db');
  const db = new Database(dbPath);

  console.log('Database initialized at:', dbPath);
  app.quit();
});

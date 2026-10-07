const LOCKABLE_TABS = [
  { key: 'proposal-form', name: 'POS Billing' },
  { key: 'proposals', name: 'Sales History' },
  { key: 'master-db', name: 'Medicine Stock' },
  { key: 'companies', name: 'Purchases' },
  { key: 'expenses', name: 'Expenses' },
  { key: 'reports', name: 'Reports' },
  { key: 'dashboard', name: 'Dashboard' },
  { key: 'settings', name: 'Settings' }
];

const Settings = {
  originalLogo: '',

  async render(container) {
    container.innerHTML = `
      <div class="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 class="text-3xl font-bold text-slate-800">Settings</h2>
        <div id="settings-action-btn-container">
          <button type="submit" form="settings-form" id="btn-save-profile" class="h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-95 border border-teal-500/50 cursor-pointer">
            <i data-lucide="save" class="w-4 h-4 stroke-[2.5]"></i> Save Profile
          </button>
        </div>
      </div>

      <!-- General Settings -->
      <div id="settings-view-general" class="overflow-y-auto pr-2 custom-scrollbar" style="max-height: calc(100vh - 180px);">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pb-8">
          <!-- Pharmacy / Medicos Profile -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div class="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="building" class="w-5 h-5 text-teal-600"></i>
                <h3 class="font-bold text-lg text-slate-700">Afridi Diagnostic Centre Profile</h3>
              </div>
            </div>
            
            <form id="settings-form" class="p-4 space-y-4" onsubmit="Settings.saveSettings(event)">
              
              <!-- Logo Section -->
              <div class="flex items-start gap-4 pb-3 border-b border-slate-100">
                <div class="shrink-0">
                  <div class="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                    <img id="settings-logo-preview" src="" class="w-full h-full object-contain hidden rounded-xl">
                    <div id="settings-logo-placeholder" class="text-slate-400 flex flex-col items-center">
                      <i data-lucide="image" class="w-7 h-7 mb-1.5"></i>
                      <span class="text-[10px] font-bold">No Logo</span>
                    </div>
                    <div class="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer" onclick="Settings.selectLogo()">
                      <span class="text-white text-[10px] font-bold"><i data-lucide="upload" class="w-4 h-4 mb-1 mx-auto"></i> Change</span>
                    </div>
                  </div>
                  <input type="hidden" id="set-logo-path">
                </div>
                <div class="flex-1 pt-1">
                  <h4 class="font-bold text-slate-800 text-sm mb-1">Centre Header Logo</h4>
                  <p class="text-[11px] text-slate-400 mb-2">Used on POS receipts, thermal cash memos, and reports.</p>
                  <div class="flex gap-2">
                    <button type="button" onclick="Settings.selectLogo()" class="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">Choose File</button>
                    <button type="button" onclick="Settings.removeLogo()" class="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-all cursor-pointer">Remove</button>
                  </div>
                </div>
              </div>

              <!-- Pharmacy Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div class="md:col-span-2">
                  <div class="flex items-center justify-between mb-1">
                    <label class="block text-[10px] font-black text-slate-400 uppercase">Centre / Store Name</label>
                    <span class="text-[10px] font-bold text-slate-400 flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3 text-slate-400"></i> Locked</span>
                  </div>
                  <input type="text" id="set-name" readonly disabled placeholder="Pharmacy Name" class="w-full bg-slate-100/90 border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-600 cursor-not-allowed select-none outline-none">
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Phone / WhatsApp Contacts</label>
                  <input type="text" id="set-phone" maxlength="12" oninput="this.value = this.value.replace(/[^0-9-]/g, '').slice(0, 12)" placeholder="e.g. 0333-9109092" class="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none">
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Official Website / Portal</label>
                  <input type="text" id="set-web" placeholder="e.g. www.alshifapharmacy.pk" class="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none">
                </div>

                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Default Tax / GST % (Sales Tax)</label>
                  <div class="relative">
                    <input type="number" id="set-tax-rate" step="any" min="0" max="100" placeholder="0" class="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-black text-slate-800 focus:border-teal-500 outline-none pr-7">
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
                  </div>
                </div>

                <div class="md:col-span-2">
                  <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Physical Address (Printed on Receipts)</label>
                  <textarea id="set-address" rows="2" class="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none resize-none" placeholder="e.g. Near Babu Hotel, Railway Ground, Taxila"></textarea>
                </div>

                <div class="md:col-span-2">
                  <label class="block text-[10px] font-black text-slate-400 uppercase mb-1">Return & Disclaimer Notice (Printed on Bill)</label>
                  <textarea id="set-return-policy" rows="2" class="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-800 focus:border-teal-500 outline-none" placeholder="Return policy text..."></textarea>
                </div>
              </div>
            </form>
          </div>

          <!-- Security Settings -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-100">
            <div class="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
              <h3 class="font-bold text-lg text-slate-700">Tab Access Security</h3>
            </div>
            <div class="p-4 space-y-4">
              <div class="flex items-start gap-4">
                 <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <i data-lucide="lock" class="w-5 h-5"></i>
                 </div>
                 <div class="flex-1">
                    <h4 class="font-bold text-slate-800 text-sm">Security Password</h4>
                    <p class="text-xs text-slate-500 mb-3">Set a password to restrict access to selected tabs. Leave blank to disable protection.</p>
                    
                     <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                       <div>
                         <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">New Password</label>
                         <div class="relative">
                           <input type="password" id="set-stock-password" placeholder="••••••••" class="w-full border border-slate-200 rounded-lg p-2 pr-9 text-sm focus:ring-1 focus:ring-accent outline-none">
                           <button type="button" onclick="Settings.togglePasswordVisibility('set-stock-password', this)" class="password-visibility-toggle absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                             <i data-lucide="eye" class="w-4 h-4"></i>
                           </button>
                         </div>
                       </div>
                       <div>
                         <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1">Confirm Password</label>
                         <div class="relative">
                           <input type="password" id="set-stock-password-confirm" placeholder="••••••••" class="w-full border border-slate-200 rounded-lg p-2 pr-9 text-sm focus:ring-1 focus:ring-accent outline-none">
                           <button type="button" onclick="Settings.togglePasswordVisibility('set-stock-password-confirm', this)" class="password-visibility-toggle absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                             <i data-lucide="eye" class="w-4 h-4"></i>
                           </button>
                         </div>
                       </div>
                     </div>
                     <button type="button" id="btn-remove-stock-pass" onclick="Settings.removeStockPassword()" class="hidden text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors mb-3">
                        <i data-lucide="unlock" class="w-3 h-3"></i> Remove Current Password
                     </button>

                     <!-- Dropdown of Lockable Tabs with Checkmarks -->
                     <div class="pt-3 border-t border-slate-100">
                       <label class="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Locked Tabs Selection</label>
                       <div class="relative">
                         <button type="button" onclick="Settings.toggleTabDropdown(event)" id="locked-tabs-btn" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold hover:bg-white border-slate-200 transition-all flex items-center justify-between">
                            <span id="locked-tabs-text">No Tabs Locked</span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
                         </button>
                         <div id="locked-tabs-menu" class="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 hidden max-h-60 overflow-y-auto">
                            <!-- Injected dynamically -->
                         </div>
                       </div>
                     </div>
                  </div>
              </div>
            </div>
          </div>

          <!-- Backup & Restore -->
          <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-slate-50">
              <h3 class="font-bold text-lg text-slate-700">Backup & Data</h3>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-start gap-4">
                 <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <i data-lucide="download" class="w-5 h-5"></i>
                 </div>
                 <div>
                    <h4 class="font-bold text-slate-800 text-sm">Backup Data Locally</h4>
                    <p class="text-xs text-slate-500 mb-3">Backup all proposals, expenses, products, and logs into a single file.</p>
                    <button onclick="Settings.backupData()" class="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm">
                      Backup App Data
                    </button>
                 </div>
              </div>

              <div class="pt-2 border-t border-slate-100 flex items-start gap-4">
                 <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                 </div>
                 <div>
                    <h4 class="font-bold text-slate-800 text-sm">Restore from Backup</h4>
                    <p class="text-xs text-slate-500 mb-3">Restore your entire system from a previous backup file. <span class="text-red-500 font-bold">This will replace current data.</span></p>
                    <button onclick="Settings.restoreData()" class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm">
                      Restore Data
                    </button>
                 </div>
              </div>

              <div class="pt-2 border-t border-slate-100 flex items-start gap-4">
                 <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                 </div>
                 <div>
                    <h4 class="font-bold text-slate-800 text-sm">Clear All App Data</h4>
                    <p class="text-xs text-slate-500 mb-3">Permanently delete all data and reset the application to its original state. <span class="text-red-600 font-bold underline">This action cannot be undone.</span></p>
                    <button onclick="Settings.clearAppData()" class="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 shadow-sm">
                      Clear All Data
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      await this.reloadSettings();
      if (window.lucide) lucide.createIcons();
    } catch(e) {
      console.error(e);
    }
  },

  async reloadSettings() {
    const s = await window.api.getSettings();
    if (document.getElementById('set-name')) document.getElementById('set-name').value = s.company_name || '';
    if (document.getElementById('set-tagline')) document.getElementById('set-tagline').value = s.tagline || '';
    if (document.getElementById('set-dsl')) document.getElementById('set-dsl').value = s.dsl_no || '';
    if (document.getElementById('set-pharmacist')) document.getElementById('set-pharmacist').value = s.pharmacist_name || '';
    if (document.getElementById('set-ntn')) document.getElementById('set-ntn').value = s.ntn || '';
    if (document.getElementById('set-phone')) document.getElementById('set-phone').value = s.phone || '';
    if (document.getElementById('set-web')) document.getElementById('set-web').value = s.website || '';
    if (document.getElementById('set-address')) document.getElementById('set-address').value = s.address || '';
    if (document.getElementById('set-tax-rate')) document.getElementById('set-tax-rate').value = s.tax_rate || '';
    if (document.getElementById('set-return-policy')) document.getElementById('set-return-policy').value = s.return_policy || '';
    this.originalLogo = s.logo_path || '';
    this.updateLogoPreview(this.originalLogo);

    const stockPassword = window.storage.get('stock_password') || '';
    const passInput = document.getElementById('set-stock-password');
    const confirmInput = document.getElementById('set-stock-password-confirm');
    
    if (passInput && confirmInput) {
        passInput.value = stockPassword;
        confirmInput.value = stockPassword;
        
        const hasPassword = !!stockPassword;
        passInput.disabled = hasPassword;
        confirmInput.disabled = hasPassword;
        
        // Visual feedback
        [passInput, confirmInput].forEach(el => {
            el.classList.toggle('opacity-50', hasPassword);
            el.classList.toggle('bg-slate-50', hasPassword);
            el.classList.toggle('cursor-not-allowed', hasPassword);
        });

        // Toggle buttons state
        const toggleBtns = document.querySelectorAll('.password-visibility-toggle');
        toggleBtns.forEach(btn => {
            if (hasPassword) {
                btn.classList.add('pointer-events-none', 'opacity-30');
            } else {
                btn.classList.remove('pointer-events-none', 'opacity-30');
            }
        });
    }
    
    const removeBtn = document.getElementById('btn-remove-stock-pass');
    if (removeBtn) {
        if (stockPassword) removeBtn.classList.remove('hidden');
        else removeBtn.classList.add('hidden');
    }

    this.renderTabDropdown();
  },

  async removeStockPassword() {
    const currentPass = window.storage.get('stock_password');
    if (!currentPass) return;

    app.showPrompt({
      title: 'Remove Password',
      message: 'Please enter your current password to disable tab access protection:',
      type: 'password',
      onConfirm: (input) => {
        if (input === currentPass) {
          window.storage.set('stock_password', '');
          window.storage.set('locked_tabs', []);
          app.isStockUnlocked = false;
          app.unlockedTabs = {};
          app.showAlert({
            title: 'Password Removed',
            message: 'Tab access protection has been disabled.',
            buttonText: 'OK'
          });
          this.reloadSettings();
        } else {
          app.showAlert({
            title: 'Error',
            message: 'Incorrect password. Removal failed.',
            buttonText: 'Try Again'
          });
        }
      }
    });
  },

  updateLogoPreview(path) {
    document.getElementById('set-logo-path').value = path;
    const preview = document.getElementById('settings-logo-preview');
    const ph = document.getElementById('settings-logo-placeholder');
    
    if (path) {
      preview.src = 'file://' + path;
      preview.classList.remove('hidden');
      ph.classList.add('hidden');
    } else {
      preview.src = '';
      preview.classList.add('hidden');
      ph.classList.remove('hidden');
    }
  },

  async selectLogo() {
    const path = await window.api.selectLogoFile();
    if (path) {
      this.updateLogoPreview(path);
    }
  },

  removeLogo() {
    this.updateLogoPreview('');
  },

  async saveSettings(e) {
    if (e) e.preventDefault();
    app.showLoading();
    try {
      const phoneVal = (document.getElementById('set-phone')?.value || '').trim();
      const phoneDigits = phoneVal.replace(/\D/g, '');
      if (phoneVal && phoneDigits.length !== 11) {
        app.hideLoading();
        return app.showAlert("Pharmacy phone number must be exactly 11 digits (e.g. 0300-4567890 or 03004567890)");
      }

      const prevSettings = (await window.api.getSettings()) || {};
      const data = {
        ...prevSettings,
        company_name: document.getElementById('set-name')?.value || prevSettings.company_name || '',
        phone: phoneVal,
        website: document.getElementById('set-web')?.value || '',
        address: document.getElementById('set-address')?.value || prevSettings.address || '',
        tax_rate: document.getElementById('set-tax-rate')?.value || '0',
        return_policy: document.getElementById('set-return-policy')?.value || '',
        logo_path: document.getElementById('set-logo-path')?.value || '',
        qr_path: '',
        qr_text: ''
      };
      await window.api.saveSettings(data);
      
      // Save Stock Password
      const passInput = document.getElementById('set-stock-password');
      const confirmInput = document.getElementById('set-stock-password-confirm');
      const stockPass = passInput ? passInput.value : '';
      const stockPassConfirm = confirmInput ? confirmInput.value : '';

      if (stockPass !== stockPassConfirm) {
        app.hideLoading();
        return app.showAlert("Passwords do not match!");
      }

      window.storage.set('stock_password', stockPass);
      app.isStockUnlocked = false; // Require re-entry with new password
      // Ensure locked_tabs is initialized if not already set
      const currentLocked = window.storage.get('locked_tabs');
      if (stockPass && (currentLocked === null || currentLocked === undefined)) {
        window.storage.set('locked_tabs', []);
      }

      // Update app state
      await app.loadSettings();
      await this.reloadSettings();

      app.showAlert({
        title: 'Settings Saved',
        message: 'Your settings and security password have been saved successfully.',
        buttonText: 'OK'
      });

    } catch (err) {
      console.error(err);
      app.showAlert('Error saving settings: ' + err.message);
    } finally {
      app.hideLoading();
    }
  },

  async backupData() {
    return this.handleBackup();
  },

  async restoreData() {
    return this.handleRestore();
  },

  async handleBackup() {
    app.showLoading();
    try {
      // 1. Sync all current localStorage items into SQLite
      const allKv = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          allKv[key] = localStorage.getItem(key);
        }
      }
      if (window.api && window.api.saveAllKv) {
        await window.api.saveAllKv(allKv);
      }

      // 2. Perform backup
      const res = await window.api.backupData();
      if (res && res.success) {
        app.showAlert({
          title: 'Backup Successful',
          message: `Database backup created successfully at:<br><b class="text-slate-800 break-all text-xs">${res.path}</b>`,
          buttonText: 'Done'
        });
      } else if (res && res.error && res.error !== 'Cancelled') {
        app.showAlert('Backup failed: ' + res.error);
      }
    } catch (err) {
      console.error(err);
      app.showAlert('Failed to create backup: ' + err.message);
    } finally {
      app.hideLoading();
    }
  },

  async handleRestore() {
    app.showConfirm({
      title: 'Restore Database',
      message: 'Restoring a database will overwrite current data. The app will restart automatically upon completion. Are you sure you want to proceed?',
      confirmText: 'Select Backup File',
      confirmColor: 'orange',
      onConfirm: async () => {
        app.showLoading();
        try {
          // Clear local storage so restored DB rehydrates cleanly
          localStorage.clear();
          const res = await window.api.restoreData();
          if (res && !res.success && res.error !== 'Cancelled') {
            app.showAlert('Restore failed: ' + res.error);
          }
        } catch (err) {
          console.error(err);
          app.showAlert('Failed to restore database.');
        } finally {
          app.hideLoading();
        }
      }
    });
  },

  async clearAppData() {
    app.verifyPassword({
      title: 'Security Verification',
      message: 'Enter password to authorize clearing all app data:',
      onVerified: () => {
        app.showConfirm({
          title: 'Clear All App Data',
          message: 'Are you sure you want to delete EVERYTHING? This will permanently delete all proposals, products, expenses, and settings. The app will restart with a fresh database. This action CANNOT be undone!',
          confirmText: 'Yes, Delete Everything',
          confirmColor: 'red',
          onConfirm: async () => {
            app.showLoading();
            try {
              localStorage.clear();
              sessionStorage.clear();
              const res = await window.api.clearAppData();
              if (res && !res.success) {
                app.showAlert('Clear data failed: ' + res.error);
                app.hideLoading();
              }
            } catch (err) {
              console.error(err);
              app.showAlert('Failed to clear data.');
              app.hideLoading();
            }
          }
        });
      }
    });
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4"></i>';
    } else {
      input.type = 'password';
      btn.innerHTML = '<i data-lucide="eye" class="w-4 h-4"></i>';
    }
    if (window.lucide) lucide.createIcons();
  },

  toggleTabDropdown(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('locked-tabs-menu');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    
    if (isHidden) {
      menu.classList.remove('hidden');
      const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
          menu.classList.add('hidden');
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => {
        document.addEventListener('click', closeMenu);
      }, 0);
    } else {
      menu.classList.add('hidden');
    }
  },

  renderTabDropdown() {
    const lockedTabs = window.storage.get('locked_tabs') || [];
    const menu = document.getElementById('locked-tabs-menu');
    const btnText = document.getElementById('locked-tabs-text');
    if (!menu || !btnText) return;

    if (lockedTabs.length === 0) {
      btnText.textContent = "No Tabs Locked";
    } else {
      const names = LOCKABLE_TABS.filter(t => lockedTabs.includes(t.key)).map(t => t.name);
      btnText.textContent = names.join(', ');
    }

    menu.innerHTML = LOCKABLE_TABS.map(tab => {
      const isLocked = lockedTabs.includes(tab.key);
      return `
        <div onclick="Settings.toggleTabLock('${tab.key}', event)" class="px-4 py-2 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none">
          <span class="text-xs font-bold text-slate-700">${tab.name}</span>
          <div class="w-4 h-4 border border-slate-300 rounded flex items-center justify-center transition-colors ${isLocked ? 'bg-accent border-accent text-slate-900' : 'bg-white'}">
            ${isLocked ? '<i data-lucide="check" class="w-3 h-3 stroke-[3]"></i>' : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  async toggleTabLock(key, event) {
    if (event) event.stopPropagation();

    const password = window.storage.get('stock_password') || '';
    if (!password) {
      return app.showAlert({
        title: 'Security Required',
        message: 'Please set and save a Security Password first to lock/unlock tabs.',
        buttonText: 'OK'
      });
    }

    app.showPrompt({
      title: 'Password Required',
      message: `Enter password to lock/unlock this tab:`,
      type: 'password',
      onConfirm: (input) => {
        if (input === password) {
          let lockedTabs = window.storage.get('locked_tabs') || [];
          if (lockedTabs.includes(key)) {
            lockedTabs = lockedTabs.filter(t => t !== key);
          } else {
            lockedTabs.push(key);
          }
          window.storage.set('locked_tabs', lockedTabs);
          
          if (app.unlockedTabs) {
            delete app.unlockedTabs[key];
          }

          app.showAlert({
            title: 'Success',
            message: 'Tab security updated successfully.',
            buttonText: 'OK'
          });
          this.renderTabDropdown();
        } else {
          app.showAlert({
            title: 'Error',
            message: 'Incorrect password. Tab security unchanged.',
            buttonText: 'Try Again'
          });
        }
      }
    });
  }
};


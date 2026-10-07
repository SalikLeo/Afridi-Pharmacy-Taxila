window.Reports = {
  reportType: 'daily', // daily, monthly, annual
  reportCategory: 'financial', // financial, expiry_return, controlled_drugs
  selectedDate: '',
  settings: {},

  getLocalDateStr(d = new Date()) {
    if (!d) return '';
    if (typeof d === 'string') return d.split('T')[0];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async render(container) {
    this.settings = await window.api.getSettings();
    this.selectedDate = this.selectedDate || this.getLocalDateStr();
    
    container.innerHTML = `
      <div class="max-w-4xl mx-auto pb-10">
        <div class="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 class="text-3xl font-black text-slate-800 tracking-tight font-display">Pharmacy Reports & Audit</h2>
            <p class="text-xs font-semibold text-slate-500 mt-1">Financial statements, distributor expiry returns & DRAP registers</p>
          </div>

          <!-- Report Category Switcher -->
          <div class="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
            <button onclick="Reports.setCategory('financial')" id="cat-financial" class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all bg-white shadow-xs text-slate-900 border border-slate-200 cursor-pointer">
              <i data-lucide="receipt" class="w-3.5 h-3.5 inline mr-1 text-teal-600"></i> Financial Sales
            </button>
            <button onclick="Reports.setCategory('expiry_return')" id="cat-expiry_return" class="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
              <i data-lucide="calendar-alert" class="w-3.5 h-3.5 inline mr-1 text-rose-600"></i> Expiry Return Audit
            </button>
            <button onclick="Reports.setCategory('controlled_drugs')" id="cat-controlled_drugs" class="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5 inline mr-1 text-amber-600"></i> Controlled Drugs Log
            </button>
          </div>
        </div>

        <div class="mb-8">
          <!-- Report Selection Card -->
          <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 class="text-base font-black text-slate-800 mb-5 flex items-center gap-2 font-display uppercase tracking-wider">
              <i data-lucide="sliders" class="w-5 h-5 text-teal-600"></i>
              <span id="report-config-title">Financial Period Configuration</span>
            </h3>

            <div class="space-y-6">
              <!-- Type Selection (for financial) -->
              <div id="financial-type-section">
                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Audit Timeframe</label>
                <div class="grid grid-cols-3 gap-3">
                  <button onclick="Reports.setType('daily')" id="type-daily" class="report-type-btn flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all group bg-teal-50 border-teal-600 text-teal-900 font-bold cursor-pointer">
                    <i data-lucide="calendar-days" class="w-5 h-5 text-teal-600"></i>
                    <span class="text-xs font-black">Daily Report</span>
                  </button>
                  <button onclick="Reports.setType('monthly')" id="type-monthly" class="report-type-btn flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 transition-all group font-bold cursor-pointer">
                    <i data-lucide="calendar-range" class="w-5 h-5"></i>
                    <span class="text-xs font-black">Monthly Report</span>
                  </button>
                  <button onclick="Reports.setType('annual')" id="type-annual" class="report-type-btn flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 transition-all group font-bold cursor-pointer">
                    <i data-lucide="calendar" class="w-5 h-5"></i>
                    <span class="text-xs font-black">Annual Report</span>
                  </button>
                </div>
              </div>

              <!-- Date Picker -->
              <div id="date-picker-container">
                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2" id="picker-label">Select Audit Date</label>
                <div class="relative max-w-sm flex items-center gap-2">
                  <div class="relative flex-1">
                    <i data-lucide="calendar" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                    <input type="date" id="report-date-input" 
                      value="${this.selectedDate}" 
                      onchange="Reports.updateSelectedDate(this.value)"
                      class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 pl-12 text-sm font-bold text-slate-700 focus:bg-white focus:border-teal-500 outline-none transition-all">
                  </div>
                  <button id="report-reset-btn" onclick="Reports.resetToDefault()" class="h-12 w-12 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-all border border-rose-200 shadow-2xs hidden cursor-pointer shrink-0" title="Reset to Today">
                    <i data-lucide="x" class="w-5 h-5 stroke-[2.5]"></i>
                  </button>
                </div>
              </div>

              <!-- Expiry Return Filter Section -->
              <div id="expiry-filter-section" class="hidden">
                <label class="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiry Threshold Window</label>
                <select id="expiry-threshold-select" class="w-full max-w-sm bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-teal-500 outline-none">
                  <option value="expired">Expired Medicines Only (Immediate Claim)</option>
                  <option value="90" selected>Within 90 Days (Distributor Return Window)</option>
                  <option value="180">Within 180 Days (Early Warning)</option>
                </select>
              </div>

              <div class="pt-4 border-t border-slate-100">
                <button onclick="Reports.generate()" class="w-full bg-teal-800 hover:bg-teal-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 cursor-pointer">
                  <i data-lucide="printer" class="w-5 h-5 text-teal-200"></i>
                  <span id="report-btn-text" class="tracking-wider uppercase text-sm">GENERATE & PRINT REPORT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
    this.setType('daily');
  },

  setCategory(cat) {
    this.reportCategory = cat;
    ['financial', 'expiry_return', 'controlled_drugs'].forEach(c => {
      const btn = document.getElementById(`cat-${c}`);
      if (!btn) return;
      if (c === cat) {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-black transition-all bg-white shadow-xs text-slate-900 border border-slate-200 cursor-pointer';
      } else {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer';
      }
    });

    const finSection = document.getElementById('financial-type-section');
    const expSection = document.getElementById('expiry-filter-section');
    const datePicker = document.getElementById('date-picker-container');
    const title = document.getElementById('report-config-title');
    const btnText = document.getElementById('report-btn-text');

    if (cat === 'financial') {
      if (finSection) finSection.classList.remove('hidden');
      if (expSection) expSection.classList.add('hidden');
      if (datePicker) datePicker.classList.remove('hidden');
      if (title) title.textContent = 'Financial Period Configuration';
      if (btnText) btnText.textContent = 'GENERATE & PRINT FINANCIAL REPORT';
      this.setType(this.reportType);
    } else if (cat === 'expiry_return') {
      if (finSection) finSection.classList.add('hidden');
      if (expSection) expSection.classList.remove('hidden');
      if (datePicker) datePicker.classList.add('hidden');
      if (title) title.textContent = 'Distributor Expiry Return Criteria';
      if (btnText) btnText.textContent = 'GENERATE DISTRIBUTOR RETURN STATEMENT';
    } else if (cat === 'controlled_drugs') {
      if (finSection) finSection.classList.remove('hidden');
      if (expSection) expSection.classList.add('hidden');
      if (datePicker) datePicker.classList.remove('hidden');
      if (title) title.textContent = 'Prescription & Controlled Drugs Register';
      if (btnText) btnText.textContent = 'GENERATE DRAP CONTROLLED REGISTER';
      this.setType(this.reportType);
    }
  },

  setType(type) {
    this.reportType = type;
    
    document.querySelectorAll('.report-type-btn').forEach(btn => {
      btn.className = 'report-type-btn flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 transition-all group font-bold cursor-pointer';
    });

    const activeBtn = document.getElementById(`type-${type}`);
    if (activeBtn) {
      activeBtn.className = 'report-type-btn flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all group bg-teal-50 border-teal-600 text-teal-900 font-bold cursor-pointer';
    }

    const input = document.getElementById('report-date-input');
    const label = document.getElementById('picker-label');
    if (!input || !label) return;
    
    if (type === 'daily') {
      input.type = 'date';
      label.textContent = 'Select Day';
      input.value = this.getLocalDateStr();
      this.selectedDate = input.value;
    } else if (type === 'monthly') {
      input.type = 'month';
      label.textContent = 'Select Month';
      const now = new Date();
      input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.selectedDate = input.value;
    } else if (type === 'annual') {
      label.textContent = 'Select Year';
      input.type = 'number';
      input.min = '2000';
      input.max = '2100';
      input.value = new Date().getFullYear();
      this.selectedDate = input.value;
    }

    this.updateClearButton();
  },

  updateSelectedDate(val) {
    this.selectedDate = val;
    this.updateClearButton();
  },

  updateClearButton() {
    const btn = document.getElementById('report-reset-btn');
    if (!btn) return;
    const isDefault = (this.reportType === 'daily' && this.selectedDate === this.getLocalDateStr());
    btn.classList.toggle('hidden', isDefault);
    if (window.lucide) lucide.createIcons();
  },

  resetToDefault() {
    this.setType('daily');
  },

  async generate() {
    app.showLoading();
    try {
      this.settings = await window.api.getSettings();

      if (this.reportCategory === 'expiry_return') {
        await this.generateExpiryReturnReport();
      } else if (this.reportCategory === 'controlled_drugs') {
        await this.generateControlledDrugsReport();
      } else {
        await this.generateFinancialReport();
      }
    } catch (e) {
      console.error(e);
      app.showAlert('Error generating report: ' + e.message);
    } finally {
      app.hideLoading();
    }
  },

  async generateFinancialReport() {
    let filters = {};
    let periodLabel = '';
    const inputVal = document.getElementById('report-date-input')?.value || this.selectedDate;
    
    if (this.reportType === 'daily') {
      filters = { start: inputVal, end: inputVal };
      periodLabel = app.formatDate(inputVal);
    } else if (this.reportType === 'monthly') {
      const [year, month] = inputVal.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      filters = { 
        start: `${year}-${String(month).padStart(2, '0')}-01`, 
        end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` 
      };
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      periodLabel = `${monthNames[month - 1]} ${year}`;
    } else if (this.reportType === 'annual') {
      const year = inputVal;
      filters = { 
        start: `${year}-01-01`, 
        end: `${year}-12-31` 
      };
      periodLabel = `Year ${year}`;
    }

    const data = await window.api.getReportSummary(filters);
    const margin = data.sales.amount > 0 ? (data.sales.profit / data.sales.amount * 100).toFixed(2) : '0.00';
    const netProfit = data.sales.profit - data.expenses.amount;

    const html = `
      <div class="receipt-80mm" style="width: 100%; max-width: 780px; margin: 0 auto; padding: 24px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #000; box-sizing: border-box; font-size: 13px; line-height: 1.5; border: 1.5px solid #000; border-radius: 8px;">
          <!-- Pharmacy Header -->
          <div style="text-align: center; margin-bottom: 14px; border-bottom: 2px solid #000; padding-bottom: 12px;">
              <h1 style="font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">${this.settings.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
              <div style="font-size: 11px; font-weight: 600; margin-top: 3px;">${this.settings.address || 'Near Babu Hotel, Railway Ground, Taxila'}</div>
              <div style="font-size: 11px; margin-top: 2px;">
                ${this.settings.phone ? `<span><b>Ph:</b> ${this.settings.phone}</span> &bull; ` : '<span><b>Ph:</b> 0333-9109092</span> &bull; '}
                ${this.settings.pharmacist_name ? `<span><b>Pharmacist:</b> ${this.settings.pharmacist_name}</span> &bull; ` : ''}
                ${this.settings.ntn ? `<span><b>NTN:</b> ${this.settings.ntn}</span>` : ''}
              </div>
              <div style="margin-top: 8px;">
                  <span style="display: inline-block; border: 1.5px solid #000; padding: 3px 18px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; border-radius: 4px; background: #000; color: #fff;">PHARMACY FINANCIAL STATEMENT &bull; ${this.reportType.toUpperCase()}</span>
              </div>
          </div>
          
          <!-- Metadata Card -->
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 14px; padding: 6px 10px; border: 1px solid #000; border-radius: 4px;">
              <div><b>Audit Period:</b> ${periodLabel}</div>
              <div><b>Generated At:</b> ${app.formatDateTime(new Date().toISOString())}</div>
          </div>

          <!-- Sales Summary Section -->
          <div style="margin-bottom: 14px;">
              <div style="padding: 4px 8px; font-weight: 800; background: #f0f0f0; border: 1px solid #000; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-size: 12px;">DISPENSING & SALES REVENUE</div>
              <table style="width: 100%; font-size: 12.5px; border-collapse: collapse; line-height: 1.7;">
                  <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 6px;">Total Prescriptions / Invoices:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${data.sales.count}</td></tr>
                  <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 6px;">Total Medicine Packs Dispensed:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${data.sales.itemsSold}</td></tr>
                  <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 6px;">Total Sales Revenue (MRP / Discounted):</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${app.formatCurrency(data.sales.amount)}</td></tr>
                  <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 6px;">Cost of Goods Sold (Trade Price - TP):</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${app.formatCurrency(data.sales.cost)}</td></tr>
                  <tr style="border-top: 1.5px solid #000; border-bottom: 1px solid #000; background: #fafafa;"><td style="padding: 5px 6px; font-weight: 800;">Gross Pharmacy Margin:</td><td style="text-align: right; font-weight: 800; padding: 5px 6px;">${app.formatCurrency(data.sales.profit)}</td></tr>
                  <tr><td style="padding: 4px 6px;">Gross Profit Margin %:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${margin}%</td></tr>
              </table>
          </div>

          <!-- Expenses Summary Section -->
          <div style="margin-bottom: 14px;">
              <div style="padding: 4px 8px; font-weight: 800; background: #f0f0f0; border: 1px solid #000; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-size: 12px;">PHARMACY OPERATING EXPENSES</div>
              <table style="width: 100%; font-size: 12.5px; border-collapse: collapse; line-height: 1.7;">
                  <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 6px;">Rent, WAPDA, Salaries, Fuel & Sundries:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${app.formatCurrency(data.expenses.amount)}</td></tr>
                  <tr><td style="padding: 4px 6px;">Total Expense Transactions:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${data.expenses.count}</td></tr>
              </table>
          </div>

          <!-- Distributor Payables Section -->
          <div style="margin-bottom: 14px;">
              <div style="padding: 4px 8px; font-weight: 800; background: #f0f0f0; border: 1px solid #000; border-radius: 4px; margin-bottom: 6px; text-transform: uppercase; font-size: 12px;">DISTRIBUTOR PAYABLES (M&P, IBL, PREMIER, ETC.)</div>
              <table style="width: 100%; font-size: 12.5px; border-collapse: collapse; line-height: 1.7;">
                  <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 6px;">Total Distributor Accounts Payable:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${app.formatCurrency(data.vendors.amount)}</td></tr>
                  <tr><td style="padding: 4px 6px;">Registered Pharmaceutical Distributors:</td><td style="text-align: right; font-weight: 700; padding: 4px 6px;">${data.vendors.count}</td></tr>
              </table>
          </div>

          <!-- Net Summary Box -->
          <div style="margin-top: 16px; border: 2px solid #000; border-radius: 6px; overflow: hidden;">
              <div style="background: #000; color: #fff; padding: 6px 12px; font-weight: 800; text-align: center; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">NET AUDIT STATEMENT</div>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse; line-height: 1.8;">
                  <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 6px 12px;">Gross Margin:</td><td style="text-align: right; font-weight: 700; padding: 6px 12px;">${app.formatCurrency(data.sales.profit)}</td></tr>
                  <tr style="border-bottom: 1px solid #ddd;"><td style="padding: 6px 12px;">Operating Expenses:</td><td style="text-align: right; font-weight: 700; padding: 6px 12px;">(${app.formatCurrency(data.expenses.amount)})</td></tr>
                  <tr style="background: #fafafa; border-top: 2px solid #000;"><td style="padding: 8px 12px; font-weight: 900; font-size: 15px;">NET ${netProfit >= 0 ? 'PROFIT' : 'LOSS'}:</td><td style="text-align: right; font-weight: 900; font-size: 16px; padding: 8px 12px;">${netProfit < 0 ? '(' : ''}${app.formatCurrency(Math.abs(netProfit))}${netProfit < 0 ? ')' : ''}</td></tr>
              </table>
          </div>

          <!-- Signatures -->
          <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; padding-top: 8px; border-top: 1px solid #888;">
              <div style="text-align: center; width: 180px;">
                <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>
                <b>Store Dispenser / Cashier</b>
              </div>
              <div style="text-align: center; width: 220px;">
                <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>
                <b>Supervising Pharmacist (Cat-A)</b>
              </div>
          </div>
      </div>
    `;

    this.showPreview('Financial Audit Statement', `${this.reportType.toUpperCase()} SUMMARY`, html);
  },

  async generateExpiryReturnReport() {
    const thresholdVal = document.getElementById('expiry-threshold-select')?.value || '90';
    const products = await window.api.searchAllProducts('') || [];

    const today = new Date();
    const todayStr = this.getLocalDateStr(today);

    let maxExpiryDate = new Date(today);
    if (thresholdVal === '90') {
      maxExpiryDate.setDate(today.getDate() + 90);
    } else if (thresholdVal === '180') {
      maxExpiryDate.setDate(today.getDate() + 180);
    }
    const maxExpiryStr = this.getLocalDateStr(maxExpiryDate);

    const filtered = products.filter(p => {
      if (!p.expiry_date) return false;
      if (thresholdVal === 'expired') {
        return p.expiry_date <= todayStr;
      }
      return p.expiry_date <= maxExpiryStr;
    }).sort((a, b) => (a.expiry_date || '').localeCompare(b.expiry_date || ''));

    let totalClaimValue = 0;
    const rowsHtml = filtered.map((p, idx) => {
      const isExp = p.expiry_date < todayStr;
      const val = (p.current_stock || 0) * (p.cost_price || 0);
      totalClaimValue += val;
      return `
        <tr style="border-bottom: 1px solid #ddd; ${isExp ? 'background: #fff0f0;' : ''}">
          <td style="padding: 4px 6px; text-align: center;">${idx + 1}</td>
          <td style="padding: 4px 6px; font-weight: 700;">${p.item_name} <br><span style="font-size: 10px; font-weight: normal; color: #555;">${p.generic_name || '-'}</span></td>
          <td style="padding: 4px 6px; font-weight: 600;">${p.company_name || 'Pharma Co'}</td>
          <td style="padding: 4px 6px; font-family: monospace; font-weight: 700;">${p.medicine_code || '-'}</td>
          <td style="padding: 4px 6px; font-weight: 700; color: ${isExp ? '#b91c1c' : '#c2410c'};">${p.expiry_date}</td>
          <td style="padding: 4px 6px; text-align: center; font-weight: 700;">${p.current_stock || 0} ${p.unit || 'PACK'}</td>
          <td style="padding: 4px 6px; text-align: right;">${app.formatCurrency(p.cost_price || 0)}</td>
          <td style="padding: 4px 6px; text-align: right; font-weight: 700;">${app.formatCurrency(val)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div class="receipt-80mm" style="width: 100%; max-width: 820px; margin: 0 auto; padding: 24px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #000; box-sizing: border-box; font-size: 12px; line-height: 1.4; border: 1.5px solid #000; border-radius: 8px;">
          <!-- Pharmacy Header -->
          <div style="text-align: center; margin-bottom: 14px; border-bottom: 2px solid #000; padding-bottom: 10px;">
              <h1 style="font-size: 22px; font-weight: 900; margin: 0; text-transform: uppercase;">${this.settings.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
              <div style="font-size: 11px; margin-top: 2px;">
                <span><b>DSL #:</b> ${this.settings.dsl_no || 'DSL-09/LHR/2024'}</span> &bull; 
                <span><b>Phone:</b> ${this.settings.phone || '-'}</span>
              </div>
              <div style="margin-top: 6px;">
                  <span style="display: inline-block; border: 1.5px solid #000; padding: 3px 18px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #b91c1c; color: #fff; border-radius: 4px;">DISTRIBUTOR EXPIRY CLAIM & RETURN STATEMENT</span>
              </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 12px; padding: 6px 10px; border: 1px solid #000; border-radius: 4px;">
              <div><b>Audit Scope:</b> ${thresholdVal === 'expired' ? 'Expired Medicines' : `Near Expiry (Within ${thresholdVal} Days)`}</div>
              <div><b>Items Count:</b> ${filtered.length} Medicines</div>
              <div><b>Total Return Value:</b> <b>${app.formatCurrency(totalClaimValue)}</b></div>
          </div>

          <table style="width: 100%; font-size: 11px; border-collapse: collapse; border: 1px solid #000;">
            <thead>
              <tr style="background: #000; color: #fff; font-weight: 800; text-transform: uppercase; font-size: 10px;">
                <th style="padding: 5px; width: 25px; text-align: center;">#</th>
                <th style="padding: 5px; text-align: left;">Medicine & Generic Formula</th>
                <th style="padding: 5px; text-align: left;">Distributor</th>
                <th style="padding: 5px; text-align: left;">Med Code</th>
                <th style="padding: 5px; text-align: left;">Expiry Date</th>
                <th style="padding: 5px; text-align: center;">Return Qty</th>
                <th style="padding: 5px; text-align: right;">TP (Cost)</th>
                <th style="padding: 5px; text-align: right;">Total Claim</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #666;">No near-expiry or expired medicines found within selected window.</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background: #f5f5f5; font-weight: 800; border-top: 2px solid #000;">
                <td colspan="5" style="padding: 6px; text-align: right; text-transform: uppercase;">Total Claim Value (TP):</td>
                <td style="padding: 6px; text-align: center;">${filtered.reduce((s, p) => s + (p.current_stock || 0), 0)}</td>
                <td></td>
                <td style="padding: 6px; text-align: right;">${app.formatCurrency(totalClaimValue)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 35px; display: flex; justify-content: space-between; font-size: 11px; padding-top: 6px; border-top: 1px solid #888;">
              <div style="text-align: center; width: 180px;">
                <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>
                <b>Pharmacist Signature & Stamp</b>
              </div>
              <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>
                <b>Distributor / Booker Receiver</b>
              </div>
          </div>
      </div>
    `;

    this.showPreview('Distributor Expiry Return Statement', 'EXPIRY AUDIT', html);
  },

  async generateControlledDrugsReport() {
    const proposals = await window.api.getProposals() || [];
    
    // Filter sales that have prescriptions or schedule Rx/Narcotics
    const rxSales = [];
    proposals.forEach(p => {
      const full = window.api.getProposal ? window.api.getProposal(p.id) : p;
      if (full && (full.doctor_name || full.prescription_no || full.doctor_reg)) {
        rxSales.push(full);
      }
    });

    const rowsHtml = rxSales.map((s, idx) => {
      const itemsStr = (s.items || []).map(i => `${i.description} (x${i.qty})`).join(', ');
      return `
        <tr style="border-bottom: 1px solid #000;">
          <td style="padding: 4px 2px; text-align: center; border-right: 1px solid #000; font-size: 10px; font-weight: 700;">${idx + 1}</td>
          <td style="padding: 4px 4px; border-right: 1px solid #000; font-size: 10.5px;">
            <div style="font-weight: 800;">${s.proposal_number}</div>
            <div style="font-size: 9px; color: #444;">${app.formatDate(s.date || s.created_at)}</div>
            <div style="font-size: 9.5px; font-weight: 700; margin-top: 1px;">Pt: ${s.customer_name}</div>
            ${s.doctor_name ? `<div style="font-size: 9px; color: #444;">Dr: ${s.doctor_name} ${s.doctor_reg ? `(PMDC: ${s.doctor_reg})` : ''}</div>` : ''}
          </td>
          <td style="padding: 4px 4px; border-right: 1px solid #000; font-size: 10px;">
            ${itemsStr || '-'}
          </td>
          <td style="padding: 4px 3px; text-align: right; font-weight: 800; font-size: 10.5px;">${app.formatCurrency(s.retail_total)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <div class="receipt-80mm" style="width: 100%; max-width: 380px; margin: 0 auto; padding: 12px 14px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #000; box-sizing: border-box; font-size: 11px; line-height: 1.4; border: 1px solid #000;">
          <!-- Pharmacy Header -->
          <div style="text-align: center; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
              <h1 style="font-size: 19px; font-weight: 900; margin: 0; text-transform: uppercase;">${this.settings?.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
              <div style="font-size: 10px; margin-top: 2px;">
                <span><b>DSL #:</b> ${this.settings?.dsl_no || 'DSL-09/RWP/2024'}</span>
              </div>
              <div style="margin-top: 4px;">
                  <span style="display: inline-block; border: 1px solid #000; padding: 1.5px 8px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; background: #000; color: #fff; border-radius: 3px;">DRAP PRESCRIPTION REGISTER</span>
              </div>
          </div>
          
          <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 10px;">
            <thead>
              <tr style="background: #f8fafc; color: #000; font-weight: 800; text-transform: uppercase; font-size: 9.5px; border-bottom: 1.5px solid #000;">
                <th style="padding: 4px 2px; width: 8%; text-align: center; border-right: 1px solid #000;">#</th>
                <th style="padding: 4px 4px; width: 44%; text-align: left; border-right: 1px solid #000;">Details</th>
                <th style="padding: 4px 4px; width: 30%; text-align: left; border-right: 1px solid #000;">Medicines</th>
                <th style="padding: 4px 3px; width: 18%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="4" style="text-align: center; padding: 14px; color: #666; font-style: italic;">No recorded prescription sales yet.</td></tr>'}
            </tbody>
          </table>

          <div style="margin-top: 14px; display: flex; justify-content: space-between; font-size: 9.5px; padding-top: 6px; border-top: 1px dashed #000;">
              <div style="text-align: center; width: 45%;">
                <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>
                <b>Pharmacist Signature</b>
              </div>
              <div style="text-align: center; width: 45%;">
                <div style="border-top: 1px solid #000; margin-bottom: 3px;"></div>
                <b>Inspector Stamp</b>
              </div>
          </div>
      </div>
    `;

    this.showPreview('DRAP Prescription Register', '80MM THERMAL REGISTER', html);
  },

  showPreview(title, subtitle, html) {
    app.setPrintContent('report-print-container', html);

    const previewEl = document.getElementById('preview-paper');
    if (previewEl) {
      previewEl.className = "bg-white shadow-2xl transform origin-top mb-12 w-full max-w-[400px] rounded-lg";
      previewEl.innerHTML = html;
    }
    
    document.getElementById('preview-title').textContent = title;
    document.getElementById('preview-subtitle').textContent = subtitle;
    
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  }
};

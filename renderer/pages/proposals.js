window.Proposals = {
  sales: [],
  selectedMethods: ['Cash', 'Online'],
  currentPeriodType: 'day',

  async render(container) {
    container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-3xl font-bold text-slate-800">Sales History</h2>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="Proposals.toggleStats()" id="stats-toggle-btn" class="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="eye" class="w-3.5 h-3.5 text-slate-400" id="stats-toggle-icon"></i>
            <span id="stats-toggle-text">Show Stats</span>
          </button>
        </div>
      </div>
      
      <!-- Proper Stats Cards: Total Purchase Cost, Total Sale, Total Profit, Fees, Orders, Discounts -->
      <div id="stats-container" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 hidden">
        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Total Orders</p>
            <h3 class="text-base font-black text-slate-800 font-outfit" id="stat-count">0</h3>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-red-500 uppercase tracking-widest truncate">Purchase Cost</p>
            <h3 class="text-base font-black text-red-700 font-outfit truncate" id="stat-cost">Rs. 0</h3>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <i data-lucide="banknote" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest truncate">Total Sale</p>
            <h3 class="text-base font-black text-emerald-700 font-outfit truncate" id="stat-total">Rs. 0</h3>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-amber-600 uppercase tracking-widest truncate">Total Profit</p>
            <h3 class="text-base font-black text-amber-700 font-outfit truncate" id="stat-profit">Rs. 0</h3>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <i data-lucide="receipt" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-teal-600 uppercase tracking-widest truncate">Fees</p>
            <h3 class="text-base font-black text-teal-700 font-outfit truncate" id="stat-fees">Rs. 0</h3>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
            <i data-lucide="tag" class="w-5 h-5"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Discounts</p>
            <h3 class="text-base font-black text-slate-800 font-outfit truncate" id="stat-discount">Rs. 0</h3>
          </div>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center flex-wrap">
        <div class="relative flex-1 min-w-[200px]">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-slate-400"></i>
          <input type="text" id="prop-search" oninput="Proposals.applyFilters()" placeholder="Search customer, invoice #, 'Med' or 'Fees'..." class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all text-xs font-medium">
        </div>
        
        <div class="flex gap-4 items-center pl-4 border-l border-slate-200 flex-wrap">
          <!-- Type Filter dropdown (All / Med / Fees) -->
          <div class="flex gap-2 items-center">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
            <select id="prop-type-filter" onchange="Proposals.applyFilters()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-white text-slate-700 outline-none cursor-pointer focus:border-accent transition-all">
               <option value="all">All Types</option>
               <option value="med">Medicine (Med)</option>
               <option value="fees">Extra Fees (Fees)</option>
            </select>
          </div>

          <!-- Method dropdown (Cash / Online) -->
          <div class="flex gap-2 items-center">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Method</label>
            <div class="relative">
              <button onclick="Proposals.toggleMethodMenu(event)" id="method-multi-btn" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-white transition-all flex items-center gap-2 min-w-[130px] justify-between cursor-pointer">
                 <span id="method-multi-text">All Methods</span>
                 <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
              </button>
              <div id="method-multi-menu" class="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 py-2 hidden">
                 <div class="px-3 py-1.5 mb-1 border-b border-slate-100 flex justify-between items-center">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filters</span>
                    <button onclick="Proposals.resetMethods(event)" class="text-[10px] font-bold text-accent hover:underline cursor-pointer">Reset</button>
                 </div>
                 <div id="method-options-list"></div>
              </div>
            </div>
          </div>

          <!-- Period controls -->
          <div class="flex gap-2 items-center flex-wrap">
            <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Period</label>
            <div class="flex bg-slate-100 p-1 rounded-lg">
               <button id="period-day-tab" onclick="Proposals.setPeriodType('day')" class="px-2.5 py-1 text-xs font-bold rounded-md transition-all bg-white shadow-sm text-slate-800 cursor-pointer">Daily</button>
               <button id="period-month-tab" onclick="Proposals.setPeriodType('month')" class="px-2.5 py-1 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-slate-700 cursor-pointer">Monthly</button>
               <button id="period-year-tab" onclick="Proposals.setPeriodType('year')" class="px-2.5 py-1 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-slate-700 cursor-pointer">Annual</button>
               <button id="period-all-tab" onclick="Proposals.setPeriodType('all')" class="px-2.5 py-1 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-slate-700 cursor-pointer">All</button>
            </div>

            <!-- Daily navigation controls (Prev Day, Calendar Picker, Next Day, Today) -->
            <div id="daily-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
               <button onclick="Proposals.changeDateStep(-1)" class="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Day">
                 <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
               </button>
               <input type="date" id="stats-date-picker" onchange="Proposals.applyFilters()" oninput="Proposals.applyFilters()" class="bg-transparent border-0 px-1 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               <button onclick="Proposals.changeDateStep(1)" class="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Day">
                 <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
               </button>
               <button onclick="Proposals.setToday()" class="px-2 py-1 text-[10px] font-black uppercase bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded transition-all cursor-pointer ml-0.5">Today</button>
            </div>

            <!-- Monthly navigation controls (Prev Month, Month Dropdown, Year Dropdown, Next Month, This Month) -->
            <div id="monthly-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hidden">
               <button onclick="Proposals.changeMonthStep(-1)" class="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Month">
                 <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
               </button>
               <select id="stats-month-select" onchange="Proposals.applyFilters()" class="bg-transparent border-0 px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                 <option value="1">January</option>
                 <option value="2">February</option>
                 <option value="3">March</option>
                 <option value="4">April</option>
                 <option value="5">May</option>
                 <option value="6">June</option>
                 <option value="7">July</option>
                 <option value="8">August</option>
                 <option value="9">September</option>
                 <option value="10">October</option>
                 <option value="11">November</option>
                 <option value="12">December</option>
               </select>
               <select id="stats-month-year-select" onchange="Proposals.applyFilters()" class="bg-transparent border-0 px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               </select>
               <button onclick="Proposals.changeMonthStep(1)" class="p-1.5 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Month">
                 <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
               </button>
               <button onclick="Proposals.setThisMonth()" class="px-2 py-1 text-[10px] font-black uppercase bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded transition-all cursor-pointer ml-0.5">This Month</button>
            </div>

            <!-- Annual controls -->
            <div id="annual-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hidden">
               <select id="stats-year-picker" onchange="Proposals.applyFilters()" class="bg-transparent border-0 px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               </select>
            </div>

            <button id="clear-period-btn" onclick="Proposals.resetPeriodToDefault()" class="h-7 w-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 shadow-2xs hidden cursor-pointer" title="Reset to Current Date">
               <i data-lucide="x" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-220px)] flex flex-col">
        <div class="overflow-auto flex-1 relative">
          <table class="w-full text-sm text-left border-collapse border-b border-slate-200">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-wider sticky top-0 z-10 shadow-sm border-b border-slate-200">
              <tr class="border-b border-slate-200">
                <th class="px-2 py-2 text-center w-10 border-r border-slate-200 text-slate-400 bg-slate-50 font-black text-[13px]">#</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-slate-50 font-black text-[11px] uppercase tracking-wider">Invoice #</th>
                <th class="px-3 py-2 border-r border-slate-200 bg-slate-50 font-black text-[11px] uppercase tracking-wider text-center">Type</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-slate-50 font-black text-[11px] uppercase tracking-wider">Customer</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-slate-50 font-black text-[11px] uppercase tracking-wider">Date</th>
                <th class="px-4 py-2 border-r border-slate-200 text-right bg-slate-50 font-black text-[11px] uppercase tracking-wider">Total</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-slate-50 font-black text-[11px] uppercase tracking-wider">Method</th>
                <th class="px-4 py-2 text-right text-slate-700 bg-slate-100 font-black text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="sales-list-body" class="divide-y divide-slate-200 bg-white"></tbody>
          </table>
        </div>
      </div>
    `;

    try {
      this.sales = await window.api.getProposals() || [];
      const now = new Date();
      const datePicker = document.getElementById('stats-date-picker');
      const monthSelect = document.getElementById('stats-month-select');
      const monthYearSelect = document.getElementById('stats-month-year-select');
      const yearPicker = document.getElementById('stats-year-picker');
      
      if (datePicker) {
        datePicker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      }
      if (monthSelect) {
        monthSelect.value = now.getMonth() + 1;
      }
      
      const yearSet = new Set([now.getFullYear()]);
      this.sales.forEach(s => {
        if (s.date) {
          const parsed = this.parseSaleDate(s.date);
          if (parsed && parsed.year) yearSet.add(parsed.year);
        }
      });
      const years = Array.from(yearSet).sort((a, b) => b - a);

      if (monthYearSelect) {
        monthYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
        monthYearSelect.value = now.getFullYear();
      }

      if (yearPicker) {
        yearPicker.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
        yearPicker.value = now.getFullYear();
      }

      this.renderMethodOptions();
      this.setPeriodType('day');
    } catch (e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  },

  parseSaleDate(dateStr) {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate(),
          dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        };
      }
    } catch (e) {}

    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      return {
        year: parseInt(m[1]),
        month: parseInt(m[2]),
        day: parseInt(m[3]),
        dateStr: `${m[1]}-${m[2]}-${m[3]}`
      };
    }
    return null;
  },

  cleanCustomerName(name) {
    if (!name) return 'Walk-in Patient';
    if (/^(?:Walk-in Patient|Patient|Walk-in Customer)-\d+$/i.test(name.trim())) {
      return 'Walk-in Patient';
    }
    return name;
  },

  getSaleCategory(s) {
    const fees = parseFloat(s.fees) || 0;
    const retailTotal = parseFloat(s.retail_total) || 0;
    const costTotal = parseFloat(s.cost_total) || 0;
    const hasFees = fees > 0;
    const hasMed = (retailTotal > fees) || (costTotal > 0) || (!hasFees);
    if (hasFees && hasMed) return 'both';
    if (hasFees) return 'fees';
    return 'med';
  },

  applyFilters() {
    const term = (document.getElementById('prop-search')?.value || '').trim().toLowerCase();
    const typeFilter = document.getElementById('prop-type-filter')?.value || 'all';
    const selDate = document.getElementById('stats-date-picker')?.value;
    
    let filtered = this.sales.filter(s => {
        const cat = this.getSaleCategory(s);
        const feeName = (s.fees_name || '').toLowerCase();
        const cleanName = this.cleanCustomerName(s.customer_name);
        
        // Search filter matching
        let matchesSearch = false;
        if (!term) {
          matchesSearch = true;
        } else if (term === 'fees' || term === 'fee' || term === 'extra fees') {
          matchesSearch = (cat === 'fees' || cat === 'both');
        } else if (term === 'med' || term === 'medicine' || term === 'medicines') {
          matchesSearch = (cat === 'med' || cat === 'both');
        } else {
          matchesSearch = cleanName.toLowerCase().includes(term) || 
                          (s.customer_name || '').toLowerCase().includes(term) || 
                          (s.proposal_number || '').toLowerCase().includes(term) ||
                          feeName.includes(term) ||
                          (s.seller_name || '').toLowerCase().includes(term);
        }

        // Type filter dropdown matching
        let matchesType = true;
        if (typeFilter === 'med') {
          matchesType = (cat === 'med' || cat === 'both');
        } else if (typeFilter === 'fees') {
          matchesType = (cat === 'fees' || cat === 'both');
        }
        
        const method = (s.payment_method || 'Cash').trim();
        const matchesMethod = this.selectedMethods.length === 0 || this.selectedMethods.some(m => m.toLowerCase() === method.toLowerCase());
        
        let matchesPeriod = true;
        if (s.date && this.currentPeriodType !== 'all') {
            const parsed = this.parseSaleDate(s.date);
            if (parsed) {
                if (this.currentPeriodType === 'day' && selDate) {
                    matchesPeriod = (parsed.dateStr === selDate);
                } else if (this.currentPeriodType === 'month') {
                    const targetM = parseInt(document.getElementById('stats-month-select')?.value);
                    const targetY = parseInt(document.getElementById('stats-month-year-select')?.value);
                    if (targetM && targetY) {
                        matchesPeriod = (parsed.year === targetY && parsed.month === targetM);
                    }
                } else if (this.currentPeriodType === 'year') {
                    const targetY = parseInt(document.getElementById('stats-year-picker')?.value);
                    if (targetY) {
                        matchesPeriod = (parsed.year === targetY);
                    }
                }
            }
        }
        return matchesSearch && matchesType && matchesMethod && matchesPeriod;
    });

    this.updateStats(filtered);
    this.renderList(filtered);
    this.updateClearPeriodButton();
  },

  updateClearPeriodButton() {
    const btn = document.getElementById('clear-period-btn');
    if (!btn) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const selDate = document.getElementById('stats-date-picker')?.value;

    const isDefault = (this.currentPeriodType === 'day' && selDate === todayStr);
    btn.classList.toggle('hidden', isDefault);
    if (window.lucide) lucide.createIcons();
  },

  resetPeriodToDefault() {
    this.setToday();
    this.setThisMonth();
    const now = new Date();
    const yearPicker = document.getElementById('stats-year-picker');
    if (yearPicker) yearPicker.value = now.getFullYear();
    this.setPeriodType('day');
  },

  updateStats(list) {
    let cost = 0, total = 0, received = 0, profit = 0, discount = 0, totalFees = 0;
    list.forEach(s => {
        cost += (s.cost_total || 0);
        total += (s.retail_total || 0);
        received += (s.received_amount || 0);
        profit += (s.profit || 0);
        discount += (s.discount || 0);
        totalFees += (s.fees || 0);
    });
    
    const countEl = document.getElementById('stat-count');
    const costEl = document.getElementById('stat-cost');
    const totalEl = document.getElementById('stat-total');
    const profitEl = document.getElementById('stat-profit');
    const feesEl = document.getElementById('stat-fees');
    const discountEl = document.getElementById('stat-discount');
    const pendingEl = document.getElementById('stat-pending');

    if (countEl) countEl.textContent = list.length;
    if (costEl) costEl.textContent = app.formatCurrency(cost);
    if (totalEl) totalEl.textContent = app.formatCurrency(total);
    if (profitEl) profitEl.textContent = app.formatCurrency(profit);
    if (feesEl) feesEl.textContent = app.formatCurrency(totalFees);
    if (discountEl) discountEl.textContent = app.formatCurrency(discount);
    if (pendingEl) pendingEl.textContent = app.formatCurrency(total - received);
  },

  renderList(list) {
    const tbody = document.getElementById('sales-list-body');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-12 text-center text-slate-400 font-medium">No sales found for this period.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((s, idx) => {
        const remaining = (s.retail_total || 0) - (s.received_amount || 0);
        const isFullyPaid = remaining <= 0;
        const method = s.payment_method || 'Cash';
        const isOnline = method.toLowerCase() === 'online';

        const cat = this.getSaleCategory(s);
        let catBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-teal-50 text-teal-700 border border-teal-200">Med</span>`;
        if (cat === 'fees') {
          catBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-amber-50 text-amber-700 border border-amber-200" title="${s.fees_name || 'Extra Fees'}">Fees</span>`;
        } else if (cat === 'both') {
          catBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight bg-purple-50 text-purple-700 border border-purple-200" title="${s.fees_name || 'Extra Fees'}">Med/Fees</span>`;
        }
        
        return `
        <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-200">
            <td class="px-2 py-1 text-center font-bold text-slate-400 tabular-nums border-r border-slate-200 text-xs">${idx + 1}</td>
            <td class="px-4 py-1 border-r border-slate-200">
                <div class="font-bold text-slate-800 uppercase tracking-tight text-xs">${s.proposal_number}</div>
            </td>
            <td class="px-3 py-1 border-r border-slate-200 text-center">
                ${catBadge}
            </td>
            <td class="px-4 py-1 border-r border-slate-200">
                <div class="font-bold text-slate-800 truncate min-w-0 max-w-[180px] uppercase tracking-tight text-xs">${this.cleanCustomerName(s.customer_name)}</div>
            </td>
            <td class="px-4 py-1 border-r border-slate-200">
                <div class="font-bold text-slate-800 uppercase tracking-tight text-xs whitespace-nowrap">${app.formatDateTime(s.date)}</div>
            </td>
            <td class="px-4 py-1 border-r border-slate-200 text-right">
                <div class="font-bold text-slate-800 tracking-tight text-xs">
                    ${app.formatCurrency(s.retail_total)}
                    ${!isFullyPaid && (s.received_amount || 0) > 0 ? `<span class="text-[9px] text-slate-500 font-bold ml-1">(${app.formatCurrency(s.received_amount).replace('Rs.', '').trim()} paid)</span>` : ''}
                </div>
            </td>
            <td class="px-4 py-1 border-r border-slate-200">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${isOnline ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                        ${method}
                    </span>
                    ${!isFullyPaid ? `<span class="text-[10px] font-bold text-rose-500 tabular-nums whitespace-nowrap">(Due: ${app.formatCurrency(remaining)})</span>` : ''}
                </div>
            </td>
            <td class="px-4 py-1 text-right font-medium">
                <div class="flex items-center justify-end gap-1.5 transition-opacity">
                    ${!isFullyPaid ? `
                        <button onclick="Proposals.markAsPaid(${s.id})" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Receive Payment">
                            <i data-lucide="check-circle" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                    <button onclick="Proposals.viewReceipt(${s.id})" class="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer" title="View Receipt"><i data-lucide="eye" class="w-4 h-4"></i></button>
                    <button onclick="Proposals.editSale(${s.id})" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Return or Edit Sale"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                    <button onclick="Proposals.deleteSale(${s.id})" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="Delete Sale"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `;}).join('');
    if (window.lucide) lucide.createIcons();
  },

  toggleStats() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    container.classList.toggle('hidden');
    const isHidden = container.classList.contains('hidden');
    document.getElementById('stats-toggle-text').textContent = isHidden ? 'Show Stats' : 'Hide Stats';
    document.getElementById('stats-toggle-icon').setAttribute('data-lucide', isHidden ? 'eye' : 'eye-off');
    if (window.lucide) lucide.createIcons();
  },

  changeDateStep(delta) {
    const input = document.getElementById('stats-date-picker');
    if (!input) return;
    let parts = input.value ? input.value.split('-').map(Number) : null;
    let d;
    if (parts && parts.length === 3 && !isNaN(parts[0])) {
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = new Date();
    }
    d.setDate(d.getDate() + delta);
    input.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.applyFilters();
  },

  setToday() {
    const now = new Date();
    const input = document.getElementById('stats-date-picker');
    if (input) {
      input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.applyFilters();
    }
  },

  changeMonthStep(delta) {
    const mSelect = document.getElementById('stats-month-select');
    const ySelect = document.getElementById('stats-month-year-select');
    if (!mSelect || !ySelect) return;
    let m = parseInt(mSelect.value) || (new Date().getMonth() + 1);
    let y = parseInt(ySelect.value) || new Date().getFullYear();
    m += delta;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    let yOpt = Array.from(ySelect.options).find(o => parseInt(o.value) === y);
    if (!yOpt) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      ySelect.appendChild(opt);
    }
    ySelect.value = y;
    mSelect.value = m;
    this.applyFilters();
  },

  setThisMonth() {
    const now = new Date();
    const mSelect = document.getElementById('stats-month-select');
    const ySelect = document.getElementById('stats-month-year-select');
    if (mSelect) mSelect.value = now.getMonth() + 1;
    if (ySelect) ySelect.value = now.getFullYear();
    this.applyFilters();
  },

  setPeriodType(type) {
    this.currentPeriodType = type;
    document.getElementById('daily-controls')?.classList.toggle('hidden', type !== 'day');
    document.getElementById('monthly-controls')?.classList.toggle('hidden', type !== 'month');
    document.getElementById('annual-controls')?.classList.toggle('hidden', type !== 'year');
    
    ['day', 'month', 'year', 'all'].forEach(t => {
      const btn = document.getElementById(`period-${t}-tab`);
      if (btn) {
        if (t === type) {
          btn.className = 'px-2.5 py-1 text-xs font-bold rounded-md transition-all bg-white shadow-sm text-slate-800';
        } else {
          btn.className = 'px-2.5 py-1 text-xs font-bold rounded-md transition-all text-slate-400 hover:text-slate-700';
        }
      }
    });

    this.applyFilters();
    if (window.lucide) lucide.createIcons();
  },

  toggleMethodMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('method-multi-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
    if (!menu.classList.contains('hidden')) {
        this.renderMethodOptions();
        const close = () => { menu.classList.add('hidden'); document.removeEventListener('click', close); };
        setTimeout(() => document.addEventListener('click', close), 10);
    }
  },

  async viewReceipt(id) {
    app.showLoading();
    try {
        const sale = await window.api.getProposal(id);
        if (!sale) throw new Error("Sale not found");
        
        // Ensure SalesForm has settings to generate pretty receipt
        if (!SalesForm.settings || !SalesForm.settings.company_name) {
            SalesForm.settings = await window.api.getSettings();
        }
        
        const html = await SalesForm.generateReceipt(sale);
        app.hideLoading();
        
        const previewEl = document.getElementById('preview-paper');
        if (previewEl) previewEl.innerHTML = html;
        
        document.getElementById('preview-title').textContent = `Receipt #${sale.proposal_number}`;
        document.getElementById('preview-subtitle').textContent = '80MM THERMAL RECEIPT PREVIEW';
        
        const modal = document.getElementById('preview-modal');
        if (modal) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        }
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error(e);
        app.hideLoading();
        app.showAlert("Error loading receipt: " + (e.message || e));
    }
  },

  async directPrint(id) {
    app.showLoading();
    try {
        const sale = await window.api.getProposal(id);
        if (!sale) throw new Error("Sale not found");

        if (!SalesForm.settings || !SalesForm.settings.company_name) {
            SalesForm.settings = await window.api.getSettings();
        }

        await SalesForm.generateReceipt(sale);
        app.hideLoading();
        await app.printReceipt();
    } catch (e) {
        console.error(e);
        app.hideLoading();
        app.showAlert("Error printing receipt.");
    }
  },

  updateMethodButtonText() {
    const el = document.getElementById('method-multi-text');
    if (!el) return;
    const allMethodsSelected = this.selectedMethods.length === 2;
    
    if (allMethodsSelected) {
      el.textContent = 'All Methods';
      return;
    }
    
    if (this.selectedMethods.length === 0) {
      el.textContent = 'None';
    } else {
      el.textContent = this.selectedMethods.join(', ');
    }
  },

  renderMethodOptions() {
    this.updateMethodButtonText();
    const list = document.getElementById('method-options-list');
    if (!list) return;
    
    const paymentMethods = ['Cash', 'Online'];

    list.innerHTML = `
      <div class="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50">Payment Method</div>
      ${paymentMethods.map(m => {
        const active = this.selectedMethods.includes(m);
        return `
          <div onclick="Proposals.toggleMethodOption(event, '${m}')" class="px-4 py-1.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer">
            <span class="text-xs font-bold ${active ? 'text-slate-900' : 'text-slate-400'}">${m}</span>
            <div class="w-4 h-4 rounded border ${active ? 'bg-accent border-accent text-white' : 'border-slate-200'} flex items-center justify-center">
              ${active ? '<i data-lucide="check" class="w-3 h-3"></i>' : ''}
            </div>
          </div>
        `;
      }).join('')}
    `;
    if (window.lucide) lucide.createIcons();
  },

  toggleMethodOption(e, m) {
    e.stopPropagation();
    const idx = this.selectedMethods.indexOf(m);
    if (idx > -1) {
      if (this.selectedMethods.length > 1) {
        this.selectedMethods.splice(idx, 1);
      }
    } else {
      this.selectedMethods.push(m);
    }
    this.renderMethodOptions();
    this.applyFilters();
  },

  resetMethods(e) {
    if (e) e.stopPropagation();
    this.selectedMethods = ['Cash', 'Online'];
    this.renderMethodOptions();
    this.applyFilters();
  },

  editSale(id) {
    app.verifyPassword({
      title: 'Edit Sale Verification',
      message: 'Please enter password to edit/return this sale:',
      onVerified: () => {
        app.navigate('proposal-form', { id });
      }
    });
  },

  deleteSale(id) {
    app.verifyPassword({
      title: 'Delete Sale Verification',
      message: 'Please enter password to delete this sale record:',
      onVerified: () => {
        app.showConfirm({
          title: 'Delete Sale',
          message: 'Are you sure you want to delete this sale record? Items sold will be returned to stock.',
          confirmText: 'Delete',
          onConfirm: async () => {
            await window.api.deleteProposal(id);
            this.sales = this.sales.filter(s => s.id !== id);
            this.populateSellerFilter();
            this.applyFilters();
          }
        });
      }
    });
  },

  markAsPaid(id) {
    const sale = this.sales.find(s => s.id === id);
    if (!sale) return;

    app.showPaymentModal({
        title: 'Receive Payment',
        subtitle: `Invoice: ${sale.proposal_number}`,
        total: sale.retail_total || 0,
        alreadyReceived: sale.received_amount || 0,
        buttonText: 'Receive',
        onConfirm: async (addedAmount, method) => {
            if (addedAmount <= 0) return;

            app.showLoading();
            try {
                const result = await window.api.receivePayment(id, addedAmount, method);
                if (result) {
                    const finalName = (sale.customer_name || '').trim();
                    const phone = (sale.phone || '').trim();
                    if (finalName && finalName.toLowerCase() !== 'walk-in customer') {
                        const customers = await window.api.getCustomers();
                        const cust = customers.find(c => c.name.toLowerCase() === finalName.toLowerCase() && (phone === '' || c.phone === phone));
                        if (cust) {
                            const newBalance = (cust.amount || 0) - addedAmount;
                            const custId = await window.api.saveCustomer({
                                ...cust,
                                amount: newBalance
                            });
                            
                            if (custId) {
                                const txnKey = `customers-${custId}-transactions`;
                                const transactions = window.storage.get(txnKey) || [];
                                const newTxn = {
                                    id: Date.now(),
                                    type: 'payment',
                                    amount: addedAmount,
                                    method: method,
                                    description: `Payment of ${sale.proposal_number}`,
                                    date: new Date().toISOString(),
                                    balanceAfter: newBalance
                                };
                                transactions.unshift(newTxn);
                                window.storage.set(txnKey, transactions);
                            }
                        }
                    }

                    sale.received_amount = result.newReceived;
                    sale.status = result.status;
                    this.applyFilters();
                }
                app.hideLoading();
            } catch (e) {
                console.error(e);
                app.hideLoading();
                app.showAlert("Error updating invoice status.");
            }
        }
    });
  }
};

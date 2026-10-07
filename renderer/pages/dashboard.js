const Dashboard = {
  currentPeriod: 'daily',
  selectedDate: '',
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  customStart: '',
  customEnd: '',
  availableYears: [],

  formatDate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async render(container) {
    const today = new Date();
    // Always sync current day/month/year with live time
    if (this.currentPeriod === 'daily' || !this.selectedDate) {
      this.selectedDate = this.formatDate(today);
    }
    this.selectedMonth = this.selectedMonth || (today.getMonth() + 1);
    this.selectedYear = this.selectedYear || today.getFullYear();
    
    // Default custom range: last 7 days to today
    if (!this.customEnd) {
      this.customEnd = this.formatDate(today);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      this.customStart = this.formatDate(sevenDaysAgo);
    }

    container.innerHTML = `
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-3xl font-black text-slate-800 tracking-tight font-display">Dashboard</h2>
          <div class="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-semibold" id="dash-active-summary">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs" id="dash-period-badge">
              <i data-lucide="calendar" class="w-3 h-3 text-accent"></i>
              <span id="dash-period-badge-text">Today</span>
            </span>
            <span id="dash-date-range-text" class="text-slate-500 font-medium truncate"></span>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- Main Period Switcher Tabs -->
          <div class="bg-slate-100/90 p-1 rounded-xl flex gap-1 border border-slate-200/80 shadow-xs">
            <button onclick="Dashboard.switchPeriod('daily')" id="dash-btn-daily" class="dash-period-btn px-3 py-1.5 rounded-lg text-xs font-black transition-all">Daily</button>
            <button onclick="Dashboard.switchPeriod('monthly')" id="dash-btn-monthly" class="dash-period-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Monthly</button>
            <button onclick="Dashboard.switchPeriod('annual')" id="dash-btn-annual" class="dash-period-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Annual</button>
            <button onclick="Dashboard.switchPeriod('custom')" id="dash-btn-custom" class="dash-period-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all">Custom</button>
            <button onclick="Dashboard.switchPeriod('all')" id="dash-btn-all" class="dash-period-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all">All Time</button>
          </div>

          <!-- Dynamic Sub-controls -->
          <div id="dash-subcontrols-container" class="flex items-center gap-2">
            <!-- Daily Controls -->
            <div id="dash-daily-controls" class="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
              <button onclick="Dashboard.changeDayStep(-1)" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Day">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
              <input type="date" id="dash-date-picker" value="${this.selectedDate}" onchange="Dashboard.onDateChange(this.value)" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-white focus:bg-white focus:border-accent transition-all cursor-pointer">
              <button onclick="Dashboard.changeDayStep(1)" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Day">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
              <button onclick="Dashboard.setToday()" class="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer ml-0.5">Today</button>
            </div>

            <!-- Monthly Controls -->
            <div id="dash-monthly-controls" class="hidden flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
              <button onclick="Dashboard.changeMonthStep(-1)" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Month">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
              <select id="dash-month-select" onchange="Dashboard.onMonthChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-white focus:border-accent transition-all cursor-pointer">
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
              <select id="dash-month-year-select" onchange="Dashboard.onMonthChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-white focus:border-accent transition-all cursor-pointer">
              </select>
              <button onclick="Dashboard.changeMonthStep(1)" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Month">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
              <button onclick="Dashboard.setThisMonth()" class="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer ml-0.5">This Month</button>
            </div>

            <!-- Annual Controls -->
            <div id="dash-annual-controls" class="hidden flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
              <button onclick="Dashboard.changeYearStep(-1)" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Year">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
              </button>
              <select id="dash-year-select" onchange="Dashboard.onYearChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-white focus:border-accent transition-all cursor-pointer">
              </select>
              <button onclick="Dashboard.changeYearStep(1)" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Year">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
              </button>
              <button onclick="Dashboard.setThisYear()" class="px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer ml-0.5">This Year</button>
            </div>

            <!-- Custom Range Controls -->
            <div id="dash-custom-controls" class="hidden flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-black uppercase text-slate-400">From</span>
                <input type="date" id="dash-custom-start" value="${this.customStart}" onchange="Dashboard.onCustomChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-white focus:border-accent transition-all cursor-pointer">
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-black uppercase text-slate-400">To</span>
                <input type="date" id="dash-custom-end" value="${this.customEnd}" onchange="Dashboard.onCustomChange()" class="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none hover:bg-white focus:border-accent transition-all cursor-pointer">
              </div>
              <div class="h-4 w-[1px] bg-slate-200 mx-0.5"></div>
              <button onclick="Dashboard.setCustomPreset('7days')" class="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer">Last 7D</button>
              <button onclick="Dashboard.setCustomPreset('30days')" class="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer">Last 30D</button>
              <button onclick="Dashboard.setCustomPreset('thisMonth')" class="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-all cursor-pointer">This Month</button>
            </div>
          </div>

          <!-- Quick Refresh Button -->
          <button onclick="Dashboard.refresh()" id="dash-refresh-btn" class="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl shadow-xs transition-all hover:shadow cursor-pointer" title="Refresh Stats">
            <i data-lucide="rotate-cw" class="w-4 h-4"></i>
          </button>

          <!-- Reset to Default Button -->
          <button id="dash-clear-period-btn" onclick="Dashboard.resetToDefault()" class="h-8 w-8 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-200 shadow-2xs hidden cursor-pointer" title="Reset to Current Date">
            <i data-lucide="x" class="w-4 h-4 stroke-[2.5]"></i>
          </button>
        </div>
      </div>

      <div id="dashboard-stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 transition-opacity duration-200">
        <!-- Stats loading placeholder -->
      </div>

      <!-- Pharmacy Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div onclick="app.navigate('proposal-form', { isNew: true })" class="bg-gradient-to-br from-teal-600 to-emerald-700 p-5 rounded-2xl shadow-md shadow-teal-100 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group overflow-hidden relative border border-teal-500">
          <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
             <i data-lucide="shopping-cart" class="w-28 h-28 text-white"></i>
          </div>
          <div class="relative z-10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <i data-lucide="plus-circle" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="text-base font-black text-white uppercase tracking-tight font-display">New Rx / Counter Sale</h4>
              <p class="text-teal-100 text-xs font-medium">Dispense medicines & print thermal receipt</p>
            </div>
          </div>
        </div>

        <div onclick="app.navigate('master-db')" class="bg-gradient-to-br from-amber-600 to-orange-700 p-5 rounded-2xl shadow-md shadow-amber-100 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group overflow-hidden relative border border-amber-500">
          <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
             <i data-lucide="package" class="w-28 h-28 text-white"></i>
          </div>
          <div class="relative z-10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <i data-lucide="pill" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="text-base font-black text-white uppercase tracking-tight font-display">Medicine Inventory</h4>
              <p class="text-amber-100 text-xs font-medium">Audit medicines, expiries & stock levels</p>
            </div>
          </div>
        </div>

        <div onclick="app.navigate('expenses', { openForm: true })" class="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl shadow-md shadow-slate-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group overflow-hidden relative border border-slate-700">
          <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
             <i data-lucide="receipt" class="w-28 h-28 text-white"></i>
          </div>
          <div class="relative z-10 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <i data-lucide="wallet" class="w-6 h-6"></i>
            </div>
            <div>
              <h4 class="text-base font-black text-white uppercase tracking-tight font-display">Pharmacy Expenses</h4>
              <p class="text-slate-300 text-xs font-medium">Rent, WAPDA, salaries & generator fuel</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize controls state & load initial stats
    this.updatePeriodButtons();
    await this.loadStats();
  },

  updateYearDropdowns(years) {
    if (!years || !years.length) return;
    this.availableYears = years;

    const monthYearSelect = document.getElementById('dash-month-year-select');
    const yearSelect = document.getElementById('dash-year-select');

    const optionsHtml = years.map(y => `<option value="${y}">${y}</option>`).join('');

    if (monthYearSelect && monthYearSelect.innerHTML !== optionsHtml) {
      monthYearSelect.innerHTML = optionsHtml;
      monthYearSelect.value = this.selectedYear;
    }

    if (yearSelect && yearSelect.innerHTML !== optionsHtml) {
      yearSelect.innerHTML = optionsHtml;
      yearSelect.value = this.selectedYear;
    }
  },

  async switchPeriod(period) {
    this.currentPeriod = period;
    this.updatePeriodButtons();
    await this.loadStats();
  },

  updatePeriodButtons() {
    ['daily', 'monthly', 'annual', 'custom', 'all'].forEach(p => {
      const btn = document.getElementById(`dash-btn-${p}`);
      if (!btn) return;
      if (p === this.currentPeriod) {
        btn.className = 'dash-period-btn px-3.5 py-1.5 rounded-lg text-xs font-black bg-white shadow-xs text-slate-900 border border-slate-200 transition-all';
      } else {
        btn.className = 'dash-period-btn px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all';
      }
    });

    // Toggle sub-control panels
    const dailyCtrl = document.getElementById('dash-daily-controls');
    const monthlyCtrl = document.getElementById('dash-monthly-controls');
    const annualCtrl = document.getElementById('dash-annual-controls');
    const customCtrl = document.getElementById('dash-custom-controls');

    if (dailyCtrl) dailyCtrl.classList.toggle('hidden', this.currentPeriod !== 'daily');
    if (monthlyCtrl) monthlyCtrl.classList.toggle('hidden', this.currentPeriod !== 'monthly');
    if (annualCtrl) annualCtrl.classList.toggle('hidden', this.currentPeriod !== 'annual');
    if (customCtrl) customCtrl.classList.toggle('hidden', this.currentPeriod !== 'custom');

    // Ensure inputs reflect current state
    const mSelect = document.getElementById('dash-month-select');
    if (mSelect) mSelect.value = this.selectedMonth;

    const mySelect = document.getElementById('dash-month-year-select');
    if (mySelect) mySelect.value = this.selectedYear;

    const ySelect = document.getElementById('dash-year-select');
    if (ySelect) ySelect.value = this.selectedYear;

    const dPicker = document.getElementById('dash-date-picker');
    if (dPicker) dPicker.value = this.selectedDate;

    this.updatePeriodBadge();
  },

  updatePeriodBadge() {
    const badgeText = document.getElementById('dash-period-badge-text');
    const rangeText = document.getElementById('dash-date-range-text');
    if (!badgeText || !rangeText) return;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const todayStr = this.formatDate(new Date());

    if (this.currentPeriod === 'daily') {
      if (this.selectedDate === todayStr) {
        badgeText.textContent = 'Today';
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (this.selectedDate === this.formatDate(yesterday)) {
          badgeText.textContent = 'Yesterday';
        } else {
          badgeText.textContent = 'Day View';
        }
      }

      try {
        const [y, m, d] = this.selectedDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        rangeText.textContent = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      } catch(e) {
        rangeText.textContent = this.selectedDate;
      }
    } else if (this.currentPeriod === 'monthly') {
      const now = new Date();
      const isCurrentMonth = (this.selectedMonth === (now.getMonth() + 1) && this.selectedYear === now.getFullYear());
      badgeText.textContent = isCurrentMonth ? 'This Month' : 'Monthly';
      rangeText.textContent = `${monthNames[this.selectedMonth - 1]} ${this.selectedYear}`;
    } else if (this.currentPeriod === 'annual') {
      const now = new Date();
      badgeText.textContent = (this.selectedYear === now.getFullYear()) ? 'This Year' : 'Annual';
      rangeText.textContent = `Full Year ${this.selectedYear}`;
    } else if (this.currentPeriod === 'custom') {
      badgeText.textContent = 'Custom Range';
      rangeText.textContent = `${this.customStart || 'Start'}  ➔  ${this.customEnd || 'End'}`;
    } else if (this.currentPeriod === 'all') {
      badgeText.textContent = 'All Time';
      rangeText.textContent = 'All historical records';
    }

    this.updateClearPeriodButton();
  },

  updateClearPeriodButton() {
    const btn = document.getElementById('dash-clear-period-btn');
    if (!btn) return;
    const todayStr = this.formatDate(new Date());
    const isDefault = (this.currentPeriod === 'daily' && this.selectedDate === todayStr);
    btn.classList.toggle('hidden', isDefault);
    if (window.lucide) lucide.createIcons();
  },

  resetToDefault() {
    const now = new Date();
    this.selectedDate = this.formatDate(now);
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.customStart = '';
    this.customEnd = '';
    this.switchPeriod('daily');
  },

  changeDayStep(delta) {
    let parts = this.selectedDate ? this.selectedDate.split('-').map(Number) : null;
    let d = (parts && parts.length === 3) ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date();
    d.setDate(d.getDate() + delta);
    this.selectedDate = this.formatDate(d);

    const input = document.getElementById('dash-date-picker');
    if (input) input.value = this.selectedDate;

    this.updatePeriodBadge();
    this.loadStats();
  },

  setToday() {
    this.selectedDate = this.formatDate(new Date());
    const input = document.getElementById('dash-date-picker');
    if (input) input.value = this.selectedDate;

    this.updatePeriodBadge();
    this.loadStats();
  },

  onDateChange(val) {
    if (!val) return;
    this.selectedDate = val;
    this.updatePeriodBadge();
    this.loadStats();
  },

  changeMonthStep(delta) {
    let m = this.selectedMonth + delta;
    let y = this.selectedYear;

    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }

    this.selectedMonth = m;
    this.selectedYear = y;

    const mSelect = document.getElementById('dash-month-select');
    if (mSelect) mSelect.value = m;

    const mySelect = document.getElementById('dash-month-year-select');
    if (mySelect) {
      let opt = Array.from(mySelect.options).find(o => parseInt(o.value) === y);
      if (!opt) {
        const newOpt = document.createElement('option');
        newOpt.value = y;
        newOpt.textContent = y;
        mySelect.appendChild(newOpt);
      }
      mySelect.value = y;
    }

    this.updatePeriodBadge();
    this.loadStats();
  },

  setThisMonth() {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    const mSelect = document.getElementById('dash-month-select');
    if (mSelect) mSelect.value = this.selectedMonth;

    const mySelect = document.getElementById('dash-month-year-select');
    if (mySelect) mySelect.value = this.selectedYear;

    this.updatePeriodBadge();
    this.loadStats();
  },

  onMonthChange() {
    const mSelect = document.getElementById('dash-month-select');
    const mySelect = document.getElementById('dash-month-year-select');

    if (mSelect) this.selectedMonth = parseInt(mSelect.value) || (new Date().getMonth() + 1);
    if (mySelect) this.selectedYear = parseInt(mySelect.value) || new Date().getFullYear();

    this.updatePeriodBadge();
    this.loadStats();
  },

  changeYearStep(delta) {
    this.selectedYear += delta;

    const ySelect = document.getElementById('dash-year-select');
    if (ySelect) {
      let opt = Array.from(ySelect.options).find(o => parseInt(o.value) === this.selectedYear);
      if (!opt) {
        const newOpt = document.createElement('option');
        newOpt.value = this.selectedYear;
        newOpt.textContent = this.selectedYear;
        ySelect.appendChild(newOpt);
      }
      ySelect.value = this.selectedYear;
    }

    this.updatePeriodBadge();
    this.loadStats();
  },

  setThisYear() {
    this.selectedYear = new Date().getFullYear();
    const ySelect = document.getElementById('dash-year-select');
    if (ySelect) ySelect.value = this.selectedYear;

    this.updatePeriodBadge();
    this.loadStats();
  },

  onYearChange() {
    const ySelect = document.getElementById('dash-year-select');
    if (ySelect) this.selectedYear = parseInt(ySelect.value) || new Date().getFullYear();

    this.updatePeriodBadge();
    this.loadStats();
  },

  onCustomChange() {
    const startInput = document.getElementById('dash-custom-start');
    const endInput = document.getElementById('dash-custom-end');

    if (startInput) this.customStart = startInput.value;
    if (endInput) this.customEnd = endInput.value;

    this.updatePeriodBadge();
    this.loadStats();
  },

  setCustomPreset(preset) {
    const today = new Date();
    const endStr = this.formatDate(today);

    if (preset === '7days') {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      this.customStart = this.formatDate(start);
      this.customEnd = endStr;
    } else if (preset === '30days') {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      this.customStart = this.formatDate(start);
      this.customEnd = endStr;
    } else if (preset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      this.customStart = this.formatDate(start);
      this.customEnd = endStr;
    }

    const startInput = document.getElementById('dash-custom-start');
    const endInput = document.getElementById('dash-custom-end');
    if (startInput) startInput.value = this.customStart;
    if (endInput) endInput.value = this.customEnd;

    this.updatePeriodBadge();
    this.loadStats();
  },

  async refresh() {
    const refreshBtn = document.getElementById('dash-refresh-btn');
    if (refreshBtn) {
      refreshBtn.classList.add('animate-spin');
      setTimeout(() => refreshBtn?.classList.remove('animate-spin'), 600);
    }
    await this.loadStats();
  },

  buildFilterPayload() {
    if (this.currentPeriod === 'daily') {
      return {
        period: 'daily',
        targetDate: this.selectedDate
      };
    } else if (this.currentPeriod === 'monthly') {
      return {
        period: 'monthly',
        targetMonth: `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`,
        year: this.selectedYear,
        month: this.selectedMonth
      };
    } else if (this.currentPeriod === 'annual') {
      return {
        period: 'annual',
        targetYear: String(this.selectedYear),
        year: this.selectedYear
      };
    } else if (this.currentPeriod === 'custom') {
      return {
        period: 'custom',
        startDate: this.customStart,
        endDate: this.customEnd
      };
    } else {
      return {
        period: 'all'
      };
    }
  },

  async loadStats() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (statsContainer) {
      statsContainer.classList.add('opacity-50');
    }

    try {
      const filter = this.buildFilterPayload();
      const stats = await window.api.getDashboardStats(filter);
      
      if (stats && stats.availableYears && stats.availableYears.length) {
        this.updateYearDropdowns(stats.availableYears);
      }

      this.populateStats(stats);
      this.updatePeriodBadge();
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      console.error('[DASHBOARD] Error loading stats:', e);
    } finally {
      if (statsContainer) {
        statsContainer.classList.remove('opacity-50');
      }
    }
  },

  populateStats(stats) {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer || !stats) return;

    const profit = stats.totalProfit || 0;
    const isProfitNeg = profit < 0;
    const profitColorClass = isProfitNeg ? 'text-rose-600' : 'text-emerald-700';
    const profitBadgeBg = isProfitNeg ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700';

    const nearExpiry = stats.nearExpiryCount || 0;
    const lowStock = stats.lowStockCount || 0;

    statsContainer.innerHTML = `
      <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group">
        <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-105 group-hover:bg-teal-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="receipt" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Sales (Rx/Counter)</p>
          <p class="text-2xl font-black text-slate-800 font-display mt-0.5 tabular-nums">${stats.proposalCount}</p>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="trending-up" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</p>
          <p class="text-2xl font-black text-slate-800 font-display mt-0.5 tabular-nums truncate">${app.formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group">
        <div class="w-12 h-12 rounded-xl ${profitBadgeBg} group-hover:scale-105 transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="pie-chart" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Gross Margin / Profit</p>
          <p class="text-2xl font-black ${profitColorClass} font-display mt-0.5 tabular-nums truncate">${app.formatCurrency(stats.totalProfit)}</p>
        </div>
      </div>

      <!-- Near Expiry Alert Card -->
      <div onclick="app.navigate('master-db', { filter: 'near_expiry' })" class="bg-white p-5 rounded-2xl shadow-xs border ${nearExpiry > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200/80'} flex items-center gap-4 hover:shadow-md hover:border-rose-400 transition-all cursor-pointer group">
        <div class="w-12 h-12 rounded-xl ${nearExpiry > 0 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-500'} group-hover:scale-105 transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="calendar-alert" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Near Expiry (&le; 90d)</p>
            ${nearExpiry > 0 ? '<span class="text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">Urgent</span>' : ''}
          </div>
          <p class="text-2xl font-black ${nearExpiry > 0 ? 'text-rose-600' : 'text-slate-800'} font-display mt-0.5 tabular-nums">${nearExpiry} <span class="text-xs font-semibold text-slate-400">medicines</span></p>
        </div>
      </div>

      <!-- Low Stock Shortage Alert Card -->
      <div onclick="app.navigate('master-db')" class="bg-white p-5 rounded-2xl shadow-xs border ${lowStock > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80'} flex items-center gap-4 hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group">
        <div class="w-12 h-12 rounded-xl ${lowStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'} group-hover:scale-105 transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="boxes" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Low Stock Shortage</p>
            ${lowStock > 0 ? '<span class="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">Reorder</span>' : ''}
          </div>
          <p class="text-2xl font-black ${lowStock > 0 ? 'text-amber-600' : 'text-slate-800'} font-display mt-0.5 tabular-nums">${lowStock} <span class="text-xs font-semibold text-slate-400">items</span></p>
        </div>
      </div>

      <!-- Discounts Given -->
      <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group">
        <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-105 group-hover:bg-orange-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="tag" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Discounts Allowed</p>
          <p class="text-2xl font-black text-slate-800 font-display mt-0.5 tabular-nums truncate">${app.formatCurrency(stats.totalDiscount || 0)}</p>
        </div>
      </div>

      <!-- Pharmacy Expenses -->
      <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group">
        <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="arrow-down-circle" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Operating Expenses</p>
          <p class="text-2xl font-black text-slate-800 font-display mt-0.5 tabular-nums truncate">${app.formatCurrency(stats.totalExpenses)}</p>
        </div>
      </div>

      <!-- Top Dispensed Medicine -->
      <div class="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group">
        <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-105 group-hover:bg-cyan-600 group-hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="award" class="w-6 h-6"></i>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Top Dispensed Medicine</p>
          <p class="text-lg font-black text-slate-800 truncate mt-0.5" title="${stats.topSold}">${stats.topSold}</p>
        </div>
      </div>
    `;
  }
};

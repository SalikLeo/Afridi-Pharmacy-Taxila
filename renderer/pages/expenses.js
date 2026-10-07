const Expenses = {
  expenses: [],
  categories: [],
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  selectedDate: new Date(),
  viewMode: 'daily',
  settings: {},

  getLocalDateStr(d = new Date()) {
    if (!d) return '';
    if (typeof d === 'string') {
      return d.split('T')[0];
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  async render(container, args) {
    container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-3xl font-bold text-slate-800">Expenses</h2>
        </div>
        <div class="flex items-center gap-2">
          <!-- View Toggle -->
          <div class="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-xs mr-1 no-print h-9 items-center">
            <button onclick="Expenses.setViewMode('monthly')" id="exp-view-monthly" class="px-3 py-1 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-slate-600">MONTHLY</button>
            <button onclick="Expenses.setViewMode('daily')" id="exp-view-daily" class="px-3 py-1 text-xs font-bold rounded-lg transition-all bg-slate-900 text-white shadow-xs">DAILY</button>
          </div>

          <!-- Month Switcher -->
          <div id="month-switcher-container" class="flex items-center h-9 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mr-1 no-print">
            <button onclick="Expenses.prevPeriod()" class="h-full px-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-100" title="Previous">
              <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
            </button>
            <div class="relative flex items-center h-full">
                <div onclick="document.getElementById('exp-date-picker').showPicker()" class="px-3 font-bold text-slate-700 min-w-[130px] text-center text-xs cursor-pointer hover:bg-slate-50 transition-colors" id="exp-period-display">...</div>
                <input type="date" id="exp-date-picker" onchange="Expenses.handleDatePicker(this.value)" class="absolute inset-0 opacity-0 pointer-events-none">
                <button id="exp-reset-btn" onclick="Expenses.resetToToday()" class="h-full px-2 hover:bg-rose-50 text-rose-500 transition-colors border-l border-slate-100 hidden" title="Reset to Today">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            </div>
            <button id="btn-next-period" onclick="Expenses.nextPeriod()" class="h-full px-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-100" title="Next">
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <button onclick="Expenses.printExpenses()" class="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer no-print" title="Print Expenses">
            <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Print</span>
          </button>
          
          <button onclick="Expenses.openCategoryModal()" class="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer no-print">
            <i data-lucide="tag" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Categories</span>
          </button>
          <button onclick="Expenses.openForm()" class="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer no-print">
            <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="exp-summary">
        <!-- summary cards -->
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div class="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center">
          <div class="relative flex-1 max-w-xs">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" id="exp-search" oninput="Expenses.applyFilters()" placeholder="Search expenses..." class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent shadow-sm font-medium">
          </div>

          <div class="flex items-center gap-4 ml-auto">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category:</span>
              <select id="exp-filter-cat" onchange="Expenses.applyFilters()" class="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-accent focus:border-accent block p-2 font-bold shadow-sm">
                <option value="All">All Categories</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sort:</span>
              <select id="exp-sort" onchange="Expenses.applyFilters()" class="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-accent focus:border-accent block p-2 font-bold shadow-sm">
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Amount (High-Low)</option>
                <option value="amount_asc">Amount (Low-High)</option>
              </select>
            </div>
          </div>
          
          <!-- Global Reset -->
          <button id="exp-filter-reset" onclick="Expenses.resetFilters()" class="hidden flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all border border-rose-100 ml-4 shrink-0 shadow-sm self-center">
            <i data-lucide="x" class="w-4 h-4"></i>
            Clear Filters
          </button>
        </div>
        <div class="overflow-auto max-h-[calc(100vh-360px)] custom-scrollbar border-b border-slate-100">
          <table class="w-full text-sm text-left border-b border-slate-200">
            <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-black tracking-wider sticky top-0 z-10 shadow-sm">
              <tr class="border-b border-slate-200">
                <th class="px-2 py-2 border-r border-slate-200 text-center w-10 bg-slate-50 text-slate-400 font-black text-[13px]">#</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-amber-50 text-amber-700 font-black text-[11px] uppercase tracking-wider">Date</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-indigo-50 text-indigo-700 font-black text-[11px] uppercase tracking-wider">Category</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-purple-50 text-purple-700 font-black text-[11px] uppercase tracking-wider">Description</th>
                <th class="px-4 py-2 text-right border-r border-slate-200 bg-red-50 text-red-700 font-black text-[11px] uppercase tracking-wider">Amount</th>
                <th class="px-4 py-2 text-right bg-slate-100 text-slate-700 font-black text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="expenses-list" class="divide-y divide-slate-200 bg-white">
            </tbody>
          </table>
        </div>
      </div>

      <!-- Expense Modal -->
      <div id="expense-modal" onclick="if(event.target === this) Expenses.closeForm()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md transition-opacity opacity-0 no-print">
        <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-95" id="expense-card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-slate-800" id="exp-modal-title">Add Expense</h3>
            <button onclick="Expenses.closeForm()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <form id="exp-form" onsubmit="Expenses.saveForm(event)" class="space-y-4">
            <input type="hidden" id="exp-id">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="datetime-local" id="exp-date" required class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select id="exp-cat" required class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
              <input type="number" id="exp-amount" min="0" step="0.01" required class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <input type="text" id="exp-desc" required class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" onclick="Expenses.closeForm()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-accent hover:bg-teal-700 text-white rounded-lg font-bold shadow transition-colors flex items-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Save Expense</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Category Management Modal -->
      <div id="cat-modal" onclick="if(event.target === this) Expenses.closeCategoryModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md transition-opacity opacity-0 no-print">
        <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-95" id="cat-card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-slate-800">Manage Categories</h3>
            <button onclick="Expenses.closeCategoryModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <div class="mb-4">
            <form id="cat-add-form" onsubmit="Expenses.addCategory(event)" class="flex gap-2">
              <input type="text" id="new-cat-name" placeholder="New Category Name" required class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent focus:border-accent">
              <button type="submit" class="bg-accent hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-lg text-sm transition-colors">Add</button>
            </form>
          </div>
          <div class="max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
            <table class="w-full text-sm text-left">
              <tbody id="cats-list" class="divide-y divide-slate-100">
              </tbody>
            </table>
          </div>
          <div class="pt-4 flex justify-end">
            <button onclick="Expenses.closeCategoryModal()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Close</button>
          </div>
        </div>
      </div>
    `;

    try {
      await this.loadData();
      
      if (args && args.openForm) {
        setTimeout(() => this.openForm(), 100);
      }

      if (args && args.openForm) {
        setTimeout(() => this.openForm(), 100);
      }

    } catch(e) {
      console.error(e);
    }
  },

  async loadData() {
    const filters = { month: this.currentMonth, year: this.currentYear };
    this.expenses = await window.api.getExpenses(filters);
    this.categories = await window.api.getExpenseCategories();
    this.settings = await window.api.getSettings();
    const sum = await window.api.getExpensesSummary(filters);
    
    // Update Period Display
    this.updateDateDisplay();
    
    // Disable next button if current month/year (or current day in daily mode)
    const now = new Date();
    const nextBtn = document.getElementById('btn-next-period');
    if (nextBtn) {
       let isDisabled = false;
       if (this.viewMode === 'daily') {
           isDisabled = this.selectedDate.toDateString() === now.toDateString() || this.selectedDate > now;
       } else {
           isDisabled = this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth();
       }
       nextBtn.disabled = isDisabled;
       nextBtn.classList.toggle('opacity-30', isDisabled);
       nextBtn.classList.toggle('pointer-events-none', isDisabled);
    }

    this.updateSummary(this.expenses);
    this.updateDropdowns();
    this.renderList(this.expenses);
  },

  updateSummary(list) {
    const summaryContainer = document.getElementById('exp-summary');
    if (!summaryContainer) return;

    let total = 0, salaries = 0, daily = 0;
    const now = new Date();
    const todayStr = this.getLocalDateStr(now);
    const isCurrentMonth = this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth();

    list.forEach(e => {
        total += (e.amount || 0);
        if (e.category?.toLowerCase().includes('salary')) {
            salaries += (e.amount || 0);
        }
        if (isCurrentMonth && (e.date || '').split('T')[0] === todayStr) {
            daily += (e.amount || 0);
        }
    });

    summaryContainer.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-red-500">
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
        <p class="text-3xl font-black text-red-600 font-outfit tabular-nums">${app.formatCurrency(total)}</p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Daily</p>
        <p class="text-3xl font-black text-blue-600 font-outfit tabular-nums">${app.formatCurrency(daily)}</p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
        <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Salaries (Paid)</p>
        <p class="text-3xl font-black text-emerald-600 font-outfit tabular-nums">${app.formatCurrency(salaries)}</p>
      </div>
    `;
  },

  updateDateDisplay() {
    const el = document.getElementById('exp-period-display');
    const resetBtn = document.getElementById('exp-reset-btn');
    if (!el) return;

    const now = new Date();
    let isCurrent = false;

    if (this.viewMode === 'daily') {
        const d = this.selectedDate;
        el.textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('exp-date-picker').value = this.getLocalDateStr(d);
        
        isCurrent = (this.getLocalDateStr(d) === this.getLocalDateStr(now));
    } else {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        el.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        isCurrent = false;
    }

    if (resetBtn) {
        resetBtn.classList.toggle('hidden', isCurrent);
        if (window.lucide) lucide.createIcons();
    }
  },

  handleDatePicker(val) {
    if (!val) return;
    const [y, m, day] = val.split('-').map(Number);
    this.selectedDate = new Date(y, m - 1, day);
    
    const mo = m - 1;
    
    if (this.viewMode === 'monthly') {
        // Switch to daily if they pick a date? Or just update month?
        // User said "clicking on daily should make an option to select date"
        // So if they are in daily mode, this is active.
        this.currentMonth = mo;
        this.currentYear = y;
        this.loadData();
    } else {
        if (mo !== this.currentMonth || y !== this.currentYear) {
            this.currentMonth = mo;
            this.currentYear = y;
            this.loadData();
        } else {
            this.updateDateDisplay();
            this.applyFilters();
        }
    }
  },

  prevPeriod() {
    if (this.viewMode === 'daily') {
        this.selectedDate.setDate(this.selectedDate.getDate() - 1);
        const m = this.selectedDate.getMonth();
        const y = this.selectedDate.getFullYear();
        if (m !== this.currentMonth || y !== this.currentYear) {
            this.currentMonth = m;
            this.currentYear = y;
            this.loadData();
        } else {
            this.updateDateDisplay();
            this.applyFilters();
        }
    } else {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.loadData();
    }
  },

  nextPeriod() {
    const now = new Date();
    if (this.viewMode === 'daily') {
        if (this.selectedDate.toDateString() === now.toDateString()) return;
        this.selectedDate.setDate(this.selectedDate.getDate() + 1);
        const m = this.selectedDate.getMonth();
        const y = this.selectedDate.getFullYear();
        if (m !== this.currentMonth || y !== this.currentYear) {
            this.currentMonth = m;
            this.currentYear = y;
            this.loadData();
        } else {
            this.updateDateDisplay();
            this.applyFilters();
        }
    } else {
        if (this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth()) return;
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.loadData();
    }
  },

  updateDropdowns() {
    const filterSelect = document.getElementById('exp-filter-cat');
    const formSelect = document.getElementById('exp-cat');
    
    const currentFilter = filterSelect.value;
    
    filterSelect.innerHTML = '<option value="All">All Categories</option>' + 
      this.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    
    formSelect.innerHTML = this.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    
    // Restore filter value if it still exists
    if (this.categories.find(c => c.name === currentFilter)) {
        filterSelect.value = currentFilter;
    }
  },

  applyFilters() {
    const query = document.getElementById('exp-search').value.toLowerCase();
    const cat = document.getElementById('exp-filter-cat').value;
    const sortBy = document.getElementById('exp-sort').value;
    
    let filtered = [...this.expenses];

    if (this.viewMode === 'daily') {
        const todayStr = this.getLocalDateStr(this.selectedDate);
        filtered = filtered.filter(x => (x.date || '').split('T')[0] === todayStr);
    }

    // Search
    if (query) {
        filtered = filtered.filter(x => 
            x.description.toLowerCase().includes(query) || 
            x.category.toLowerCase().includes(query)
        );
    }

    if (cat !== 'All') {
        filtered = filtered.filter(x => x.category === cat);
    }

    filtered.sort((a, b) => {
        if (sortBy === 'date_desc') return (new Date(b.date || b.created_at) - new Date(a.date || a.created_at)) || (b.id - a.id);
        if (sortBy === 'date_asc') return (new Date(a.date || a.created_at) - new Date(b.date || b.created_at)) || (a.id - b.id);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
    });

    this.renderList(filtered);
    this.updateSummary(filtered);
    this.checkFilterChanges();
  },

  checkFilterChanges() {
    const query = document.getElementById('exp-search')?.value || '';
    const cat = document.getElementById('exp-filter-cat')?.value || 'All';
    const sortBy = document.getElementById('exp-sort')?.value || 'date_desc';
    
    // Period check
    const now = new Date();
    const isDefaultPeriod = this.currentMonth === now.getMonth() && this.currentYear === now.getFullYear();

    const hasFilters = query !== '' || cat !== 'All' || sortBy !== 'date_desc' || !isDefaultPeriod;
    
    const resetBtn = document.getElementById('exp-filter-reset');
    if (resetBtn) {
        resetBtn.classList.toggle('hidden', !hasFilters);
    }
  },

  resetFilters() {
    const search = document.getElementById('exp-search');
    if (search) search.value = '';
    
    const cat = document.getElementById('exp-filter-cat');
    if (cat) cat.value = 'All';
    
    const sort = document.getElementById('exp-sort');
    if (sort) sort.value = 'date_desc';
    
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
    
    this.loadData();
  },

  setViewMode(mode) {
    this.viewMode = mode;
    const btnMonthly = document.getElementById('exp-view-monthly');
    const btnDaily = document.getElementById('exp-view-daily');
    const monthSwitcher = document.getElementById('month-switcher-container');

    if (mode === 'daily') {
        btnDaily.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
        btnDaily.classList.remove('text-slate-400', 'hover:text-slate-600');
        btnMonthly.classList.add('text-slate-400', 'hover:text-slate-600');
        btnMonthly.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
        
        // When daily, we might want to stay in current month to actually see today's expenses
        const now = new Date();
        if (this.currentMonth !== now.getMonth() || this.currentYear !== now.getFullYear()) {
            this.currentMonth = now.getMonth();
            this.currentYear = now.getFullYear();
            this.loadData();
            return;
        }
    } else {
        btnMonthly.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
        btnMonthly.classList.remove('text-slate-400', 'hover:text-slate-600');
        btnDaily.classList.add('text-slate-400', 'hover:text-slate-600');
        btnDaily.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
    }
    this.updateDateDisplay();
    this.applyFilters();
  },

  resetToToday() {
    const now = new Date();
    this.selectedDate = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
    
    // Switch to daily view mode
    this.viewMode = 'daily';
    const btnMonthly = document.getElementById('exp-view-monthly');
    const btnDaily = document.getElementById('exp-view-daily');
    if (btnDaily && btnMonthly) {
        btnDaily.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
        btnDaily.classList.remove('text-slate-400', 'hover:text-slate-600');
        btnMonthly.classList.add('text-slate-400', 'hover:text-slate-600');
        btnMonthly.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
    }

    this.loadData();
  },

  async printExpenses() {
    if (!this.settings || !this.settings.company_name) {
      try {
        this.settings = await window.api.getSettings();
      } catch (e) {
        console.error("Error fetching settings for expense receipt:", e);
      }
    }
    const settings = this.settings || {};

    const query = (document.getElementById('exp-search')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('exp-filter-cat')?.value || 'All';
    const sortBy = document.getElementById('exp-sort')?.value || 'date_desc';
    
    let list = [...(this.expenses || [])];
    if (this.viewMode === 'daily') {
        const todayStr = this.getLocalDateStr(this.selectedDate);
        list = list.filter(x => (x.date || '').split('T')[0] === todayStr);
    }
    if (query) {
        list = list.filter(x => (x.description || '').toLowerCase().includes(query) || (x.category || '').toLowerCase().includes(query));
    }
    if (cat !== 'All') {
        list = list.filter(x => x.category === cat);
    }
    
    list.sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
        if (sortBy === 'date_asc') return new Date(a.date || a.created_at) - new Date(b.date || b.created_at);
        if (sortBy === 'amount_desc') return (b.amount || 0) - (a.amount || 0);
        if (sortBy === 'amount_asc') return (a.amount || 0) - (b.amount || 0);
        return 0;
    });

    const total = list.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const period = this.viewMode === 'daily' ? `Daily Report (${app.formatDate(this.selectedDate)})` : `Monthly Report - ${monthNames[this.currentMonth]} ${this.currentYear}`;

    // Calculate category breakdown if there are multiple categories
    const catTotals = {};
    list.forEach(e => {
        const c = e.category || 'General';
        catTotals[c] = (catTotals[c] || 0) + (Number(e.amount) || 0);
    });
    const catKeys = Object.keys(catTotals);

    const html = `
        <div class="receipt-80mm" style="width: 100%; max-width: 380px; margin: 0 auto; padding: 12px 14px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000; box-sizing: border-box; font-size: 11.5px; line-height: 1.4; border: 1px solid #000;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
                <h1 style="font-size: 19px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000; line-height: 1.2;">${settings.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
                <p style="font-size: 10.5px; margin: 3px 0 1px; font-weight: bold; color: #000;">${settings.address || 'Near Babu Hotel, Railway Ground, Taxila'}</p>
                <p style="font-size: 10px; margin: 1px 0 0; font-weight: bold; color: #000;">Contact: ${settings.phone || '0333-9109092'}</p>
                <div style="margin-top: 5px;">
                    <span style="display: inline-block; border: 1px solid #000; padding: 1.5px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; border-radius: 3px; background: #000; color: #fff;">EXPENSES REPORT</span>
                </div>
            </div>

            <!-- Metadata Card -->
            <div style="font-size: 10.5px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; line-height: 1.5;">
                <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Period:</span> <span style="font-weight: bold;">${period}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Category:</span> <span style="font-weight: bold;">${cat}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Date:</span> <span>${app.formatDateTime(new Date().toISOString())}</span></div>
            </div>

            <!-- Expenses Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1.5px solid #000; color: #000;">
                <thead>
                    <tr style="border-bottom: 1.5px solid #000; background: #f8fafc;">
                        <th style="border: 1px solid #000; padding: 4px 2px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: center; width: 8%;">#</th>
                        <th style="border: 1px solid #000; padding: 4px 5px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: left; width: 62%;">Expense Details</th>
                        <th style="border: 1px solid #000; padding: 4px 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: right; width: 30%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${list.length === 0 ? `
                        <tr>
                            <td colspan="3" style="border: 1px solid #000; padding: 10px; text-align: center; font-style: italic; font-size: 11px;">No expenses found</td>
                        </tr>
                    ` : list.map((e, i) => `
                        <tr style="border-bottom: 1px solid #000;">
                            <td style="border: 1px solid #000; padding: 4px 2px; font-size: 10.5px; text-align: center; vertical-align: top; font-weight: 600;">${i + 1}</td>
                            <td style="border: 1px solid #000; padding: 4px 5px; font-size: 11px; vertical-align: top;">
                                <div style="font-weight: 800; line-height: 1.25;">${e.description || e.category || 'Expense'}</div>
                                <div style="font-size: 9.5px; margin-top: 1px; color: #333;">
                                    <span style="font-weight: 700;">[${e.category}]</span> &bull; ${app.formatDate(e.date)}
                                </div>
                            </td>
                            <td style="border: 1px solid #000; padding: 4px 4px; font-size: 11px; font-weight: 800; text-align: right; vertical-align: top; white-space: nowrap;">
                                ${app.formatCurrency(e.amount)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Summary Box -->
            <div style="border-top: 1.5px solid #000; padding-top: 4px; margin-bottom: 8px; font-size: 12px; line-height: 1.6;">
                <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 3px 0; margin-top: 2px;">
                    <span>TOTAL EXPENSES:</span>
                    <span>${app.formatCurrency(total)}</span>
                </div>
            </div>

            ${(catKeys.length > 1 && list.length > 1) ? `
            <div style="margin-top: 8px; border: 1.5px solid #000; border-radius: 4px; overflow: hidden; background: #fff;">
                <div style="padding: 4px 6px; font-weight: 800; background: #f8fafc; border-bottom: 1px solid #000; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">CATEGORY BREAKDOWN</div>
                <table style="width: 100%; font-size: 10.5px; border-collapse: collapse; line-height: 1.5;">
                    ${catKeys.map(catName => `
                        <tr style="border-bottom: 1px solid #000;">
                            <td style="padding: 3px 6px; font-weight: 600;">${catName}:</td>
                            <td style="text-align: right; font-weight: 800; padding: 3px 6px;">${app.formatCurrency(catTotals[catName])}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>` : ''}

            <!-- Footer -->
            <div style="text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; font-size: 9.5px; font-weight: bold;">
                <p style="margin: 0;">*** END OF EXPENSE REPORT ***</p>
            </div>
        </div>
    `;

    app.setPrintContent('receipt-print', html);
    const previewEl = document.getElementById('preview-paper');
    if (previewEl) {
        previewEl.className = "bg-white shadow-2xl transform origin-top mb-12 w-full max-w-[400px] rounded-lg";
        previewEl.innerHTML = html;
    }

    document.getElementById('preview-title').textContent = 'Expense Report Preview';
    document.getElementById('preview-subtitle').textContent = '80MM THERMAL EXPENSE REPORT';
    
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const printBtn = document.getElementById('confirm-print-btn');
    if (printBtn) {
        printBtn.onclick = () => app.confirmPrint();
    }

    if (window.lucide) lucide.createIcons();
  },

  renderList(list) {
    const tbody = document.getElementById('expenses-list');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">No expenses found for this month/filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((e, index) => `
      <tr class="hover:bg-slate-50 border-b border-slate-200 group transition-colors">
        <td class="px-2 py-1 border-r border-slate-200 text-center font-bold text-slate-400 tabular-nums text-xs">${index + 1}</td>
        <td class="px-4 py-1 border-r border-slate-200 font-bold text-slate-800 text-xs">${app.formatDate(e.date)}</td>
        <td class="px-4 py-1 border-r border-slate-200">
          <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider">${e.category}</span>
        </td>
        <td class="px-4 py-1 border-r border-slate-200">
          <div class="text-slate-800 font-bold text-xs truncate max-w-[200px]">${e.description || '-'}</div>
          ${e.paid_by ? `<div class="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Paid by: ${e.paid_by}</div>` : ''}
        </td>
        <td class="px-4 py-1 text-right font-bold tabular-nums text-slate-800 border-r border-slate-200 text-xs">${app.formatCurrency(e.amount)}</td>
        <td class="px-4 py-1 text-right font-medium">
          <div class="flex items-center justify-end gap-1.5 transition-opacity">
            <button onclick='Expenses.openForm(${JSON.stringify(e).replace(/'/g, "&#39;")})' class="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all" title="Edit Expense"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            <button onclick="Expenses.deleteExpense(${e.id})" class="p-1.5 text-red-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all" title="Delete Expense"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
  },

  openForm(data = null) {
    const form = document.getElementById('exp-form');
    form.reset();
    
    if (data) {
      document.getElementById('exp-modal-title').textContent = 'Edit Expense';
      document.getElementById('exp-id').value = data.id;
      
      // Format for datetime-local: YYYY-MM-DDTHH:MM
      let dateVal = data.date;
      if (dateVal && !dateVal.includes('T')) {
          dateVal = dateVal + 'T00:00';
      } else if (dateVal) {
          dateVal = dateVal.substring(0, 16);
      }
      document.getElementById('exp-date').value = dateVal;
      
      document.getElementById('exp-cat').value = data.category;
      document.getElementById('exp-amount').value = data.amount;
      document.getElementById('exp-desc').value = data.description;
    } else {
      document.getElementById('exp-modal-title').textContent = 'Add Expense';
      document.getElementById('exp-id').value = '';
      
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('exp-date').value = now.toISOString().slice(0, 16);
    }

    const modal = document.getElementById('expense-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      document.getElementById('expense-card').classList.remove('scale-95');
    }, 10);
  },

  closeForm() {
    const modal = document.getElementById('expense-modal');
    modal.classList.add('opacity-0');
    document.getElementById('expense-card').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 200);
  },

  async saveForm(e) {
    e.preventDefault();
    const id = document.getElementById('exp-id').value;
    const data = {
      date: document.getElementById('exp-date').value,
      category: document.getElementById('exp-cat').value,
      amount: parseFloat(document.getElementById('exp-amount').value),
      description: document.getElementById('exp-desc').value
    };
    if (id) data.id = parseInt(id);

    app.showLoading();
    try {
      await window.api.saveExpense(data);
      this.closeForm();
      await this.loadData();
    } catch(err) {
      console.error(err);
    } finally {
      app.hideLoading();
    }
  },

  deleteExpense(id) {
    app.verifyPassword({
      title: 'Delete Expense Verification',
      message: 'Please enter password to delete this expense:',
      onVerified: () => {
        app.showConfirm({
          title: 'Delete Expense',
          message: 'Are you sure you want to delete this expense?',
          confirmText: 'Delete',
          confirmColor: 'red',
          onConfirm: async () => {
            app.showLoading();
            await window.api.deleteExpense(id);
            await this.loadData();
            app.hideLoading();
          }
        });
      }
    });
  },

  openCategoryModal() {
    this.renderCategories();
    const modal = document.getElementById('cat-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      document.getElementById('cat-card').classList.remove('scale-95');
    }, 10);
  },

  closeCategoryModal() {
    const modal = document.getElementById('cat-modal');
    modal.classList.add('opacity-0');
    document.getElementById('cat-card').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 200);
  },

  renderCategories() {
    const tbody = document.getElementById('cats-list');
    tbody.innerHTML = this.categories.map(c => `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-2 font-medium text-slate-700">${c.name}</td>
        <td class="px-4 py-2 text-right">
          <button onclick="Expenses.deleteCategory(${c.id}, '${c.name}')" class="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
  },

  async addCategory(e) {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value;
    if (!name) return;

    app.showLoading();
    const result = await window.api.addExpenseCategory(name);
    if (result.error) {
        app.showAlert({
            title: 'Error',
            message: result.error
        });
    } else {
        document.getElementById('new-cat-name').value = '';
        this.categories = await window.api.getExpenseCategories();
        this.renderCategories();
        this.updateDropdowns();
    }
    app.hideLoading();
  },

  async deleteCategory(id, name) {
    app.verifyPassword({
      title: 'Delete Category Verification',
      message: `Please enter password to delete category "${name}":`,
      onVerified: () => {
        app.showConfirm({
          title: 'Delete Category',
          message: `Are you sure you want to delete the "${name}" category? This will not delete expenses associated with it, but they will no longer match the filter.`,
          confirmText: 'Delete',
          confirmColor: 'red',
          onConfirm: async () => {
            app.showLoading();
            await window.api.deleteExpenseCategory(id);
            this.categories = await window.api.getExpenseCategories();
            this.renderCategories();
            this.updateDropdowns();
            app.hideLoading();
          }
        });
      }
    });
  }
};

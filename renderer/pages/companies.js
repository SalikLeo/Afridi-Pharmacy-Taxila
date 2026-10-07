window.Companies = {
  currentTab: 'companies',
  currentView: 'transactions',
  currentTxnPeriod: 'day',
  currentCompPeriod: 'day',
  dataList: [],
  fullTxnHistory: [],
  txnsFilterType: 'all',
  editingTxn: null,
  editingCompanyId: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 id="purchases-page-title" class="text-3xl font-bold text-slate-800">Purchases</h2>
          <p id="purchases-page-subtitle" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Transactions Log</p>
        </div>
        <div id="purchases-header-actions" class="flex items-center gap-2 shrink-0">
          <!-- Dynamically populated by switchView -->
        </div>
      </div>

      <!-- VIEW 1: Transactions View (Default) -->
      <div id="purchases-txns-view">
        <!-- Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i>
            </div>
            <div>
              <p id="txns-stat-total-label" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Purchases</p>
              <h3 id="txns-stat-total" class="text-lg font-black text-slate-800 tabular-nums">Rs. 0</h3>
            </div>
          </div>

          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <i data-lucide="receipt" class="w-4 h-4"></i>
            </div>
            <div>
              <p id="txns-stat-orders-label" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <h3 id="txns-stat-orders" class="text-lg font-black text-slate-800 tabular-nums">0</h3>
            </div>
          </div>

          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier Balance</p>
              <h3 id="txns-stat-balance" class="text-lg font-black text-slate-800 tabular-nums">Rs. 0</h3>
            </div>
          </div>

          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <i data-lucide="building-2" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Suppliers</p>
              <h3 id="txns-stat-companies" class="text-lg font-black text-slate-800 tabular-nums">0</h3>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 mb-3 flex gap-2.5 items-center flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2 text-slate-400"></i>
            <input type="text" id="txns-main-search" oninput="Companies.filterTransactions()" placeholder="Search invoice #, supplier name, item..." class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all text-xs font-medium">
          </div>

          <!-- Type filter dropdown -->
          <select id="txns-type-select" onchange="Companies.setTxnTypeFilter(this.value)" class="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1 font-bold outline-none focus:ring-2 focus:ring-accent transition-all shrink-0 cursor-pointer shadow-sm">
            <option value="all" selected>All Types</option>
            <option value="purchase">Purchases</option>
            <option value="payment">Payments</option>
          </select>

          <!-- Time Period controls -->
          <div class="flex items-center gap-1.5 flex-wrap shrink-0">
            <div class="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
               <button type="button" id="txns-period-day" onclick="Companies.setTxnPeriodType('day')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all bg-white shadow-sm text-slate-800 cursor-pointer">Daily</button>
               <button type="button" id="txns-period-month" onclick="Companies.setTxnPeriodType('month')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer">Monthly</button>
               <button type="button" id="txns-period-year" onclick="Companies.setTxnPeriodType('year')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer">Annual</button>
               <button type="button" id="txns-period-all" onclick="Companies.setTxnPeriodType('all')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer">All</button>
            </div>

            <!-- Daily navigation controls -->
            <div id="txns-daily-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
               <button type="button" onclick="Companies.changeTxnDateStep(-1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Day">
                 <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
               </button>
               <input type="date" id="txns-date-picker" onchange="Companies.filterTransactions()" oninput="Companies.filterTransactions()" class="bg-transparent border-0 px-1 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               <button type="button" onclick="Companies.changeTxnDateStep(1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Day">
                 <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
               </button>
               <button type="button" onclick="Companies.setTxnToday()" class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded transition-all cursor-pointer">Today</button>
            </div>

            <!-- Monthly navigation controls -->
            <div id="txns-monthly-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hidden">
               <button type="button" onclick="Companies.changeTxnMonthStep(-1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Month">
                 <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
               </button>
               <select id="txns-month-select" onchange="Companies.filterTransactions()" class="bg-transparent border-0 px-1.5 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                 <option value="1">Jan</option>
                 <option value="2">Feb</option>
                 <option value="3">Mar</option>
                 <option value="4">Apr</option>
                 <option value="5">May</option>
                 <option value="6">Jun</option>
                 <option value="7">Jul</option>
                 <option value="8">Aug</option>
                 <option value="9">Sep</option>
                 <option value="10">Oct</option>
                 <option value="11">Nov</option>
                 <option value="12">Dec</option>
               </select>
               <select id="txns-month-year-select" onchange="Companies.filterTransactions()" class="bg-transparent border-0 px-1.5 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               </select>
               <button type="button" onclick="Companies.changeTxnMonthStep(1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Month">
                 <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
               </button>
               <button type="button" onclick="Companies.setTxnThisMonth()" class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded transition-all cursor-pointer">This Month</button>
            </div>

            <!-- Annual controls -->
            <div id="txns-annual-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hidden">
               <select id="txns-year-picker" onchange="Companies.filterTransactions()" class="bg-transparent border-0 px-2 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               </select>
            </div>

            <button type="button" id="txns-clear-period-btn" onclick="Companies.resetTxnPeriodToDefault()" class="h-7 w-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 shadow-2xs hidden cursor-pointer" title="Reset to Current Date">
               <i data-lucide="x" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            </button>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div class="overflow-auto max-h-[calc(100vh-250px)] custom-scrollbar">
            <table class="w-full text-sm text-left border-collapse border-b border-slate-200">
              <thead class="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200 uppercase text-[11px] font-black tracking-wider">
                <tr class="border-b border-slate-200">
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Date & Time</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Invoice #</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Supplier Name</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Type</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 text-right">Amount</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 text-right">Balance</th>
                  <th class="px-4 py-2 font-black text-slate-700 uppercase tracking-wider text-right bg-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody id="main-txns-list" class="divide-y divide-slate-200 bg-white">
                <!-- Content injected here -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- VIEW 2: Companies View -->
      <div id="purchases-companies-view" class="hidden">
        <!-- Stats Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <i data-lucide="users" class="w-4 h-4"></i>
            </div>
            <div>
              <p id="total-label" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Companies</p>
              <h3 id="comp-stat-count" class="text-lg font-black text-slate-800 tabular-nums">0</h3>
            </div>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <i data-lucide="wallet" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Balance</p>
              <h3 id="comp-stat-balance" class="text-lg font-black text-slate-800 tabular-nums">Rs. 0</h3>
            </div>
          </div>
          <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3" id="comp-stat-period-card">
            <div class="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i>
            </div>
            <div>
              <p id="comp-stat-period-label" class="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Total Purchases</p>
              <h3 id="comp-stat-period-total" class="text-lg font-black text-slate-800 tabular-nums">Rs. 0</h3>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100 mb-3 flex gap-2.5 items-center flex-wrap">
          <div class="relative flex-1 min-w-[180px]">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2 text-slate-400"></i>
            <input type="text" id="khata-search" oninput="Companies.applyFilters()" placeholder="Search by name or contact..." class="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all text-xs font-medium">
          </div>

          <!-- Period controls for Companies -->
          <div class="flex items-center gap-1.5 flex-wrap shrink-0">
            <div class="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
               <button type="button" id="comp-period-day" onclick="Companies.setCompPeriodType('day')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all bg-white shadow-sm text-slate-800 cursor-pointer">Daily</button>
               <button type="button" id="comp-period-month" onclick="Companies.setCompPeriodType('month')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer">Monthly</button>
               <button type="button" id="comp-period-year" onclick="Companies.setCompPeriodType('year')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer">Annual</button>
               <button type="button" id="comp-period-all" onclick="Companies.setCompPeriodType('all')" class="px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer">All</button>
            </div>

            <!-- Daily navigation controls -->
            <div id="comp-daily-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
               <button type="button" onclick="Companies.changeCompDateStep(-1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Day">
                 <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
               </button>
               <input type="date" id="comp-date-picker" onchange="Companies.applyFilters()" oninput="Companies.applyFilters()" class="bg-transparent border-0 px-1 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               <button type="button" onclick="Companies.changeCompDateStep(1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Day">
                 <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
               </button>
               <button type="button" onclick="Companies.setCompToday()" class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded transition-all cursor-pointer">Today</button>
            </div>

            <!-- Monthly navigation controls -->
            <div id="comp-monthly-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hidden">
               <button type="button" onclick="Companies.changeCompMonthStep(-1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Previous Month">
                 <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
               </button>
               <select id="comp-month-select" onchange="Companies.applyFilters()" class="bg-transparent border-0 px-1.5 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                 <option value="1">Jan</option>
                 <option value="2">Feb</option>
                 <option value="3">Mar</option>
                 <option value="4">Apr</option>
                 <option value="5">May</option>
                 <option value="6">Jun</option>
                 <option value="7">Jul</option>
                 <option value="8">Aug</option>
                 <option value="9">Sep</option>
                 <option value="10">Oct</option>
                 <option value="11">Nov</option>
                 <option value="12">Dec</option>
               </select>
               <select id="comp-month-year-select" onchange="Companies.applyFilters()" class="bg-transparent border-0 px-1.5 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               </select>
               <button type="button" onclick="Companies.changeCompMonthStep(1)" class="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer" title="Next Month">
                 <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
               </button>
               <button type="button" onclick="Companies.setCompThisMonth()" class="px-1.5 py-0.5 text-[10px] font-black uppercase bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded transition-all cursor-pointer">This Month</button>
            </div>

            <!-- Annual controls -->
            <div id="comp-annual-controls" class="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 hidden">
               <select id="comp-year-picker" onchange="Companies.applyFilters()" class="bg-transparent border-0 px-2 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
               </select>
            </div>

            <button type="button" id="comp-clear-period-btn" onclick="Companies.resetCompPeriodToDefault()" class="h-7 w-7 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 shadow-2xs hidden cursor-pointer" title="Reset to Current Date">
               <i data-lucide="x" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            </button>
          </div>
          
          <div class="flex gap-1.5 items-center shrink-0">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
            <select id="khata-sort" onchange="Companies.applyFilters()" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-accent transition-all">
              <option value="balance_desc" selected>Balance (High to Low)</option>
              <option value="balance_asc">Balance (Low to High)</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div class="overflow-auto max-h-[calc(100vh-250px)] custom-scrollbar">
            <table class="w-full text-sm text-left border-collapse border-b border-slate-200">
              <thead class="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200 uppercase text-[11px] font-black tracking-wider">
                <tr class="border-b border-slate-200">
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Name</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Balance Amount</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider text-center border-r border-slate-200">Transactions</th>
                  <th class="px-4 py-2 font-black text-slate-700 uppercase tracking-wider text-right bg-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody id="company-list" class="divide-y divide-slate-200 bg-white">
                <!-- Content injected here -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div id="company-modal" onclick="if(event.target === this) Companies.hideModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden transform animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 id="modal-title" class="text-xl font-bold text-slate-800">Add New Company</h3>
            <button onclick="Companies.hideModal()" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
          </div>
          <form id="company-form" onsubmit="Companies.handleSave(event)" class="p-8 space-y-5">
            <input type="hidden" id="comp-id">
            
            <div class="grid grid-cols-1 gap-5">
              <div>
                <label id="comp-name-label" class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Company Name *</label>
                <input type="text" id="comp-name" required class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Balance/Amount</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs.</span>
                    <input type="number" id="comp-amount" value="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-black focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all tabular-nums">
                  </div>
                </div>
                <div>
                  <label id="comp-phone-label" class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Phone Number <span class="text-slate-400 font-normal text-[11px] uppercase tracking-normal">(Optional)</span></label>
                  <input type="tel" id="comp-phone" maxlength="11" oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 11)" placeholder="03001234567" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Address</label>
                    <input type="text" id="comp-address" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all">
                </div>
              </div>
            </div>

            <div class="pt-4 flex gap-3">
              <button type="button" onclick="Companies.hideModal()" class="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">Cancel</button>
              <button type="submit" id="comp-submit-btn" class="flex-1 px-4 py-3 bg-accent hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">Save Company</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Transaction Modal (Purchase/Pay) -->
      <div id="txn-modal" onclick="if(event.target === this) Companies.hideTxnModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[510] backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform animate-in zoom-in-95 duration-200">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div id="txn-icon-bg" class="w-10 h-10 rounded-xl flex items-center justify-center">
                    <i id="txn-icon" data-lucide="plus" class="w-5 h-5"></i>
                </div>
                <h3 id="txn-modal-title" class="text-xl font-bold text-slate-800">Record Transaction</h3>
            </div>
            <button onclick="Companies.hideTxnModal()" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
          </div>
          <form id="txn-form" onsubmit="Companies.handleTxnSubmit(event)" class="p-8 space-y-5">
            <input type="hidden" id="txn-comp-id">
            <input type="hidden" id="txn-type">
            
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Amount *</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs.</span>
                <input type="number" id="txn-amount" required min="1" class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-lg font-black focus:bg-white focus:ring-4 outline-none transition-all tabular-nums">
              </div>
              <p id="txn-max-hint" class="text-[10px] font-bold text-slate-400 mt-1.5 hidden uppercase tracking-wider ml-1"></p>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 pl-1">Description (Optional)</label>
              <textarea id="txn-desc" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 outline-none transition-all" placeholder="Enter transaction details..."></textarea>
            </div>

            <div class="pt-2">
              <button type="submit" id="txn-submit-btn" class="w-full px-4 py-4 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-lg uppercase tracking-widest">Confirm Transaction</button>
            </div>
          </form>
        </div>
      </div>

      <!-- History Modal -->
      <div id="history-modal" onclick="if(event.target === this) Companies.hideHistoryModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[520] backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden transform animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <div class="flex-1">
                <h3 id="history-title" class="text-xl font-bold text-slate-800">Transaction History</h3>
                <p id="history-subtitle" class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Company Details</p>
            </div>
            
            <div class="flex items-center gap-2 mx-4">
                <select id="history-time-filter" onchange="Companies.filterHistory()" class="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-accent transition-all min-w-[120px]">
                    <option value="all" selected>All Time</option>
                    <option value="month">This Month</option>
                </select>
                <div class="relative w-64">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
                    <input type="text" id="history-search" oninput="Companies.filterHistory()" placeholder="Search invoice, amount..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all text-xs font-bold">
                </div>
            </div>

            <button onclick="Companies.hideHistoryModal()" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
          </div>
          
          <div class="overflow-y-auto flex-1 p-0">
            <table class="w-full text-left border-collapse border-b border-slate-200">
              <thead class="sticky top-0 bg-slate-50 shadow-sm z-10">
                <tr class="border-b border-slate-200">
                  <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Date & Time</th>
                  <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Invoice</th>
                  <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Amount</th>
                  <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Running Balance</th>
                  <th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="history-list" class="divide-y divide-slate-200">
                <!-- Content injected here -->
              </tbody>
            </table>
          </div>
          
          <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
            <button onclick="Companies.hideHistoryModal()" class="px-6 py-1.5 bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-95">Close</button>
          </div>
        </div>
      </div>

      <!-- New Purchase Modal (Dynamic Rows) -->
      <div id="new-purchase-modal" onclick="if(event.target === this) Companies.hideNewPurchaseModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[530] backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-4 lg:mx-8 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 text-accent flex items-center justify-center">
                        <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 id="np-modal-title" class="text-xl font-bold text-slate-800">New Purchase</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supplier:</span>
                            <select id="np-company-select" onchange="Companies.onPurchaseCompanyChange(this.value)" class="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer">
                            </select>
                            <span id="np-target-company" class="hidden text-xs font-bold text-slate-500 uppercase tracking-widest"></span>
                        </div>
                    </div>
                  </div>
                  <button onclick="Companies.hideNewPurchaseModal()" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
              </div>
              
              <form id="new-purchase-form" onsubmit="Companies.submitNewPurchase(event)" class="p-6 flex flex-col overflow-hidden">
                  <!-- Hidden input for company ID -->
                  <input type="hidden" id="np-company-id">

                  <!-- Items Section -->
                  <div class="flex-1 overflow-y-auto min-h-[260px] mb-4 pr-1 custom-scrollbar pb-44">
                      <div class="grid grid-cols-12 gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 px-1 border-b border-slate-100 pb-1.5">
                          <div class="col-span-6">Item Name / Stock</div>
                          <div class="col-span-2 text-center">Qty</div>
                          <div class="col-span-2 text-right">Cost / Qty</div>
                          <div class="col-span-2 text-right">Item Total</div>
                      </div>
                      <div id="np-items-list" class="space-y-1.5">
                          <!-- Dynamic rows here -->
                      </div>
                  </div>

                  <!-- Total and Submit -->
                  <div class="pt-4 border-t border-slate-100 shrink-0">
                      <div class="flex justify-between items-center mb-3 gap-4 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 flex-wrap">
                          <div class="flex items-center gap-2">
                              <span class="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Subtotal:</span>
                              <span id="np-subtotal" class="text-xs font-black text-slate-500 tabular-nums">Rs. 0</span>
                          </div>
                          
                          <div class="flex items-center gap-2">
                              <span class="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Discount:</span>
                              <div class="relative w-24">
                                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">Rs.</span>
                                  <input type="number" id="np-discount" placeholder="0" min="0" oninput="Companies.calculateNewTxnTotal()" onchange="Companies.calculateNewTxnTotal()" class="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-1.5 py-1 text-xs font-black focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none transition-all tabular-nums text-rose-500 shadow-sm">
                              </div>
                          </div>

                          <div class="flex items-center gap-2">
                              <span class="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Paid Amount:</span>
                              <div class="relative w-28">
                                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] font-bold">Rs.</span>
                                  <input type="number" id="np-paid-amount" placeholder="0" min="0" oninput="Companies.calculateNewTxnTotal()" onchange="Companies.calculateNewTxnTotal()" class="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-1.5 py-1 text-xs font-black focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all tabular-nums text-emerald-600 shadow-sm">
                              </div>
                          </div>

                          <div class="flex items-center gap-2">
                              <span class="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Total:</span>
                              <span id="np-grand-total" class="text-xl font-black text-slate-900 tabular-nums">Rs. 0</span>
                          </div>
                      </div>
                      
                      <div class="flex gap-3">
                          <button type="button" onclick="Companies.hideNewPurchaseModal()" class="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors text-sm">Cancel</button>
                          <button type="button" onclick="Companies.confirmAndCompletePurchase(event)" id="np-submit-print-btn" class="flex-1 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                              <i data-lucide="printer" class="w-4 h-4"></i> <span id="np-submit-print-text">Complete & Print</span>
                          </button>
                      </div>
                  </div>
              </form>
          </div>
      </div>

      <!-- All Transactions Modal -->
      <div id="all-txns-modal" onclick="if(event.target === this) Companies.hideAllTxnsModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[540] backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden transform animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <div class="flex-1">
                <h3 id="all-txns-title" class="text-xl font-bold text-slate-800">All Transactions</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Full Transaction Log</p>
            </div>
            
            <div class="flex-1 max-w-sm mx-4">
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
                    <input type="text" id="all-txns-search" oninput="Companies.filterAllTxns()" placeholder="Search by name, invoice, amount..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all text-xs font-bold">
                </div>
            </div>

            <button onclick="Companies.hideAllTxnsModal()" class="text-slate-400 hover:text-slate-600 transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
          </div>
          
          <div class="overflow-y-auto flex-1 p-0 custom-scrollbar">
            <table class="w-full text-sm text-left border-collapse border-b border-slate-200">
              <thead class="sticky top-0 bg-slate-50 shadow-sm z-10 border-b border-slate-200 uppercase text-[11px] font-black tracking-wider">
                <tr class="border-b border-slate-200">
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Date & Time</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Invoice</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Entity Name</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200">Type</th>
                  <th class="px-4 py-2 font-black text-slate-500 uppercase tracking-wider border-r border-slate-200 text-right">Amount</th>
                  <th class="px-4 py-2 font-black text-slate-700 uppercase tracking-wider text-right bg-slate-100">Actions</th>
                </tr>
              </thead>
              <tbody id="all-txns-list" class="divide-y divide-slate-200 bg-white">
                <!-- Content injected here -->
              </tbody>
            </table>
          </div>
          
          <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
            <button onclick="Companies.hideAllTxnsModal()" class="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs">Close Log</button>
          </div>
        </div>
      </div>
    `;

    if (!this._clickOutsideBound) {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.np-item-name') && !e.target.closest('.np-search-results')) {
          document.querySelectorAll('.np-search-results').forEach(el => el.classList.add('hidden'));
        }
      });
      this._clickOutsideBound = true;
    }

    await this.switchView('transactions');
  },

  setTab(tab) {
    this.currentTab = tab;
    
    const compBtn = document.getElementById('tab-companies');
    const custBtn = document.getElementById('tab-customers');
    const addBtnText = document.getElementById('add-btn-text');
    const totalLabel = document.getElementById('total-label');
    const modalTitle = document.getElementById('modal-title');
    
    if (tab === 'companies') {
        compBtn.className = "px-4 py-2 rounded-lg font-bold text-sm bg-white shadow-sm text-slate-800 transition-all";
        custBtn.className = "px-4 py-2 rounded-lg font-bold text-sm text-slate-500 hover:text-slate-700 transition-all";
        addBtnText.textContent = 'Company';
        totalLabel.textContent = 'Total Companies';
    } else {
        custBtn.className = "px-4 py-2 rounded-lg font-bold text-sm bg-white shadow-sm text-slate-800 transition-all";
        compBtn.className = "px-4 py-2 rounded-lg font-bold text-sm text-slate-500 hover:text-slate-700 transition-all";
        addBtnText.textContent = 'Customer';
        totalLabel.textContent = 'Total Customers';
    }
    
    this.loadCompanies(tab);
  },

  async loadCompanies(targetTab) {
    if (targetTab) {
      this.currentTab = targetTab;
    } else if (!this.currentTab) {
      this.currentTab = 'companies';
    }
    if (this.currentTab === 'customers') {
      this.dataList = await window.api.getCustomers() || [];
    } else {
      this.dataList = await window.api.getCompanies() || [];
    }
    this.initPeriodPickers();
    this.applyFilters();
    if (window.lucide) lucide.createIcons();
  },

  applyFilters() {
    const term = document.getElementById('khata-search')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('khata-sort')?.value || 'balance_desc';
    const selDate = document.getElementById('comp-date-picker')?.value;

    let periodTotalPurchases = 0;

    // For each company, compute period transactions
    const enrichedList = (this.dataList || []).map(c => {
      const txns = window.storage.get(`${this.currentTab}-${c.id}-transactions`) || [];
      let periodPurchases = 0;
      let periodPayments = 0;
      let periodCount = 0;

      txns.forEach(t => {
        let inPeriod = true;
        if (t.date && this.currentCompPeriod !== 'all') {
          const parsed = this.parseTxnDate(t.date);
          if (parsed) {
            if (this.currentCompPeriod === 'day' && selDate) {
              inPeriod = (parsed.dateStr === selDate);
            } else if (this.currentCompPeriod === 'month') {
              const targetM = parseInt(document.getElementById('comp-month-select')?.value);
              const targetY = parseInt(document.getElementById('comp-month-year-select')?.value);
              if (targetM && targetY) {
                inPeriod = (parsed.year === targetY && parsed.month === targetM);
              }
            } else if (this.currentCompPeriod === 'year') {
              const targetY = parseInt(document.getElementById('comp-year-picker')?.value);
              if (targetY) {
                inPeriod = (parsed.year === targetY);
              }
            }
          }
        }
        if (inPeriod) {
          if (t.type === 'purchase') periodPurchases += (t.amount || 0);
          else if (t.type === 'payment') periodPayments += (t.amount || 0);
          periodCount++;
        }
      });

      periodTotalPurchases += periodPurchases;

      return {
        ...c,
        periodPurchases,
        periodPayments,
        periodCount,
        hasPeriodActivity: periodCount > 0
      };
    });

    let filtered = enrichedList.filter(c => {
      return (c.name || '').toLowerCase().includes(term) || (c.phone || '').toLowerCase().includes(term);
    });

    // Sort
    filtered.sort((a, b) => {
      if (term) {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aStarts = aName.startsWith(term);
        const bStarts = bName.startsWith(term);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aWordStarts = aName.split(/\s+/).some(w => w.startsWith(term));
        const bWordStarts = bName.split(/\s+/).some(w => w.startsWith(term));
        if (aWordStarts && !bWordStarts) return -1;
        if (!aWordStarts && bWordStarts) return 1;
      }
      if (sortBy === 'balance_desc') return (b.amount || 0) - (a.amount || 0);
      if (sortBy === 'balance_asc') return (a.amount || 0) - (b.amount || 0);
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      return 0;
    });

    this.renderList(filtered);
    this.updateStats(periodTotalPurchases);
    this.updateCompClearPeriodButton();
  },

  updateCompClearPeriodButton() {
    const btn = document.getElementById('comp-clear-period-btn');
    if (!btn) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const selDate = document.getElementById('comp-date-picker')?.value;
    const isDefault = (this.currentCompPeriod === 'day' && selDate === todayStr);
    btn.classList.toggle('hidden', isDefault);
    if (window.lucide) lucide.createIcons();
  },

  resetCompPeriodToDefault() {
    this.setCompToday();
    this.setCompThisMonth();
    const now = new Date();
    const yearPicker = document.getElementById('comp-year-picker');
    if (yearPicker) yearPicker.value = now.getFullYear();
    this.setCompPeriodType('day');
  },

  updateStats(periodTotalPurchases = 0) {
    const totalCount = (this.dataList || []).length;
    const totalBalance = (this.dataList || []).reduce((sum, c) => sum + (c.amount || 0), 0);

    const countEl = document.getElementById('comp-stat-count');
    const balanceEl = document.getElementById('comp-stat-balance');
    const periodTotalEl = document.getElementById('comp-stat-period-total');
    const periodLabelEl = document.getElementById('comp-stat-period-label');

    if (countEl) countEl.textContent = totalCount;
    if (balanceEl) balanceEl.textContent = app.formatCurrency(totalBalance);
    if (periodTotalEl) periodTotalEl.textContent = app.formatCurrency(periodTotalPurchases);
    if (periodLabelEl) {
      if (this.currentCompPeriod === 'day') periodLabelEl.textContent = 'Purchases Today';
      else if (this.currentCompPeriod === 'month') periodLabelEl.textContent = 'Purchases This Month';
      else if (this.currentCompPeriod === 'year') periodLabelEl.textContent = 'Purchases This Year';
      else periodLabelEl.textContent = 'Total Purchases';
    }
  },

  renderList(list) {
    const tbody = document.getElementById('company-list');
    if (!tbody || !list) return;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-10 text-center">
            <div class="flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
              <i data-lucide="${this.currentTab === 'companies' ? 'building-2' : 'users'}" class="w-16 h-16"></i>
              <p class="font-bold">No ${this.currentTab} added yet</p>
              <button onclick="Companies.showCompanyModal()" class="text-accent hover:underline text-sm font-bold">Add your first ${this.currentTab === 'companies' ? 'supplier' : 'customer'}</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(c => `
      <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-200">
        <td class="px-4 py-1 border-r border-slate-200">
          <div class="font-bold text-slate-800 uppercase tracking-tight text-xs">
            ${c.name} ${c.phone ? `<span class="text-slate-500 font-bold ml-1 text-[11px] tabular-nums">(${c.phone})</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-1 tabular-nums border-r border-slate-200 text-xs">
          <div class="flex flex-col">
            <span class="text-xs font-bold ${c.amount > 0 ? 'text-emerald-700' : 'text-slate-400'}">
              ${app.formatCurrency(c.amount || 0)}
            </span>
            ${this.currentCompPeriod !== 'all' ? (
              c.periodPurchases > 0 ? 
              `<span class="text-[9px] font-black text-rose-600 bg-rose-50 px-1 py-0.5 rounded w-fit mt-0.5 border border-rose-100">+${app.formatCurrency(c.periodPurchases)}</span>` : 
              (c.periodPayments > 0 ? `<span class="text-[9px] font-black text-blue-600 bg-blue-50 px-1 py-0.5 rounded w-fit mt-0.5 border border-blue-100">-${app.formatCurrency(c.periodPayments)}</span>` : `<span class="text-[9px] text-slate-300 font-medium mt-0.5">No activity</span>`)
            ) : ''}
          </div>
        </td>
        <td class="px-4 py-1 bg-slate-50/30 border-r border-slate-200">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="Companies.showPurchaseModal(${c.id})" class="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all shadow-sm">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> ${this.currentTab === 'companies' ? 'Purchase' : 'Add Balance'}
            </button>
            <button onclick="Companies.showPayModal(${c.id})" class="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all shadow-sm">
                <i data-lucide="wallet" class="w-3.5 h-3.5"></i> ${this.currentTab === 'companies' ? 'Pay' : 'Receive'}
            </button>
            <button onclick="Companies.showHistory(${c.id})" class="flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all shadow-sm">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> History
            </button>
          </div>
        </td>
        <td class="px-4 py-1 text-right font-medium">
          <div class="flex items-center justify-end gap-1.5 transition-opacity">
            <button onclick="Companies.showCompanyModal(${c.id})" class="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button onclick="Companies.handleDelete(${c.id})" class="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
  },

  showCompanyModal(id = null) {
    const modal = document.getElementById('company-modal');
    const form = document.getElementById('company-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    document.getElementById('comp-id').value = '';
    
    if (id) {
      const c = this.dataList.find(x => x.id === id);
      if (c) {
        title.textContent = `Edit ${this.currentTab === 'companies' ? 'Company' : 'Customer'}`;
        document.getElementById('comp-id').value = c.id;
        document.getElementById('comp-name').value = c.name;
        document.getElementById('comp-amount').value = c.amount || 0;
        document.getElementById('comp-phone').value = c.phone || '';
        document.getElementById('comp-address').value = c.address || '';
      }
    } else {
      title.textContent = `Add New ${this.currentTab === 'companies' ? 'Company' : 'Customer'}`;
    }
    
    // Update Dynamic Labels
    const typeName = this.currentTab === 'companies' ? 'Company' : 'Customer';
    document.getElementById('comp-name-label').textContent = `${typeName} Name *`;
    document.getElementById('comp-phone-label').innerHTML = `Phone Number <span class="text-slate-400 font-normal text-[11px] uppercase tracking-normal">(Optional)</span>`;
    document.getElementById('comp-submit-btn').textContent = `Save ${typeName}`;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  hideModal() {
    const modal = document.getElementById('company-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  // --- Transactions ---

  showPurchaseModal(companyId) {
    if (this.currentTab === 'companies') {
        this.showNewPurchaseModal(companyId);
    } else {
        const c = this.dataList.find(x => x.id === companyId);
        this.openTxnModal('purchase', c);
    }
  },

  showPayModal(companyId) {
    const c = this.dataList.find(x => x.id === companyId);
    this.openTxnModal('payment', c);
  },

  openTxnModal(type, company) {
    const modal = document.getElementById('txn-modal');
    const form = document.getElementById('txn-form');
    const title = document.getElementById('txn-modal-title');
    const icon = document.getElementById('txn-icon');
    const iconBg = document.getElementById('txn-icon-bg');
    const btn = document.getElementById('txn-submit-btn');
    const amountInput = document.getElementById('txn-amount');
    const hint = document.getElementById('txn-max-hint');

    form.reset();
    document.getElementById('txn-comp-id').value = company.id;
    document.getElementById('txn-type').value = type;
    hint.classList.add('hidden');
    amountInput.removeAttribute('max');

    if (type === 'purchase') {
        title.textContent = `${this.currentTab === 'companies' ? 'Purchase from' : 'Add Balance for'} ${company.name}`;
        icon.setAttribute('data-lucide', 'shopping-cart');
        iconBg.className = 'w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600';
        btn.className = 'w-full px-4 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-lg uppercase tracking-widest';
        btn.textContent = this.currentTab === 'companies' ? 'Confirm Purchase' : 'Add Balance';
        amountInput.className = 'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-lg font-black focus:bg-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all tabular-nums text-emerald-600';
    } else {
        title.textContent = `${this.currentTab === 'companies' ? 'Payment to' : 'Receive from'} ${company.name}`;
        icon.setAttribute('data-lucide', 'banknote');
        iconBg.className = 'w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600';
        btn.className = 'w-full px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-lg uppercase tracking-widest';
        btn.textContent = this.currentTab === 'companies' ? 'Record Payment' : 'Record Receipt';
        amountInput.className = 'w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-lg font-black focus:bg-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all tabular-nums text-blue-600';
        
        // Max hint
        if (company.amount > 0) {
            hint.textContent = `Max payable: ${app.formatCurrency(company.amount)}`;
            hint.classList.remove('hidden');
            amountInput.setAttribute('max', company.amount);
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
    setTimeout(() => amountInput.focus(), 100);
  },

  hideTxnModal() {
    const modal = document.getElementById('txn-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async handleTxnSubmit(e) {
    e.preventDefault();
    const companyId = parseInt(document.getElementById('txn-comp-id').value);
    const type = document.getElementById('txn-type').value;
    const amount = parseFloat(document.getElementById('txn-amount').value);
    const description = document.getElementById('txn-desc').value;

    if (!amount || amount <= 0) return;

    const company = this.dataList.find(x => x.id === companyId);
    if (!company) return;

    app.showLoading();
    try {
        const currentBalance = company.amount || 0;
        let newBalance = currentBalance;
        if (type === 'purchase') {
            newBalance += amount;
        } else {
            newBalance -= amount;
        }

        // 1. Update DB
        if (this.currentTab === 'companies') {
            await window.api.saveCompany({ ...company, amount: newBalance });
        } else {
            await window.api.saveCustomer({ ...company, amount: newBalance });
        }

        // 2. Save Transaction in window.storage
        const txnKey = `${this.currentTab}-${company.id}-transactions`;
        const transactions = window.storage.get(txnKey) || [];
        
        // Calculate global Invoice No
        const nextNoKey = `next-invoice-no-${this.currentTab}`;
        let nextNo = window.storage.get(nextNoKey);
        if (nextNo === null) {
            let totalTxns = 0;
            this.dataList.forEach(item => {
                const txns = window.storage.get(`${this.currentTab}-${item.id}-transactions`) || [];
                totalTxns += txns.length;
            });
            nextNo = totalTxns + 1;
        }
        
        const newTxn = {
            id: Date.now().toString(),
            invoice_no: nextNo,
            invoice_prefix: this.currentTab === 'companies' ? 'CMP' : 'INV',
            type: type,
            amount: amount,
            description: description,
            date: new Date().toISOString(),
            balanceAfter: newBalance
        };

        window.storage.set(nextNoKey, nextNo + 1);
        
        transactions.unshift(newTxn);
        window.storage.set(txnKey, transactions);

        this.hideTxnModal();
        if (this.currentView === 'transactions') {
          await this.loadTransactions();
        } else {
          await this.loadCompanies();
        }
    } catch (err) {
        console.error(err);
        app.showAlert('Error recording transaction');
    } finally {
        app.hideLoading();
    }
  },

  async showHistory(companyId) {
    const company = this.dataList.find(x => x.id === companyId);
    if (!company) return;

    const modal = document.getElementById('history-modal');
    const tbody = document.getElementById('history-list');
    const title = document.getElementById('history-title');
    const subtitle = document.getElementById('history-subtitle');

    title.textContent = `${company.name}`;
    subtitle.textContent = `Total Balance: ${app.formatCurrency(company.amount || 0)}`;

    const txnKey = `${this.currentTab}-${company.id}-transactions`;
    const transactions = window.storage.get(txnKey) || [];

    this.currentHistory = transactions;
    this.currentHistoryCompanyId = companyId;
    
    // Reset filters
    const searchInput = document.getElementById('history-search');
    if (searchInput) searchInput.value = '';
    const timeFilter = document.getElementById('history-time-filter');
    if (timeFilter) timeFilter.value = 'all';

    this.renderHistoryList(transactions);

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  filterHistory() {
    const query = document.getElementById('history-search').value.toLowerCase();
    const timeFilter = document.getElementById('history-time-filter').value;
    if (!this.currentHistory) return;

    let filtered = this.currentHistory;

    // Apply Time Filter
    if (timeFilter === 'month') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(t => new Date(t.date) >= startOfMonth);
    }

    filtered = filtered.filter((t, idx) => {
        let invoiceId = '';
        if (t.invoice_no) {
            invoiceId = `${t.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV')}-${t.invoice_no}`.toLowerCase();
        } else {
            const invNo = this.currentHistory.length - idx;
            const invPrefix = this.currentTab === 'companies' ? 'CMP' : 'INV';
            invoiceId = `${invPrefix}-${invNo}`.toLowerCase();
        }
        
        return invoiceId.includes(query) || 
               t.amount.toString().includes(query) ||
               (t.description && t.description.toLowerCase().includes(query));
    });

    this.renderHistoryList(filtered);
  },

  renderHistoryList(transactions) {
    const tbody = document.getElementById('history-list');
    const companyId = this.currentHistoryCompanyId;
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-slate-300 font-bold italic">No matching transactions found.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map((t) => {
        let displayInvoice = '';
        if (t.invoice_no) {
            displayInvoice = `${t.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV')}-${t.invoice_no}`;
        } else {
            // Calculate original index for legacy transactions
            const originalIdx = this.currentHistory.findIndex(x => x.id === t.id);
            const invNo = this.currentHistory.length - originalIdx;
            const invPrefix = this.currentTab === 'companies' ? 'CMP' : 'INV';
            displayInvoice = `${invPrefix}-${invNo}`;
        }
        
        return `
        <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-200">
            <td class="px-4 py-1 border-r border-slate-200">
                <div class="font-bold text-slate-800 uppercase tracking-tight text-xs whitespace-nowrap">${app.formatDateTime(t.date)}</div>
            </td>
            <td class="px-4 py-1 border-r border-slate-200">
                <div class="font-bold text-slate-800 uppercase tracking-tight text-xs">${displayInvoice}</div>
            </td>
            
            <td class="px-4 py-1 border-r border-slate-200 text-xs">
                <div class="font-bold ${t.type === 'purchase' ? 'text-rose-600' : 'text-emerald-600'} tracking-tight text-xs">
                    ${t.type === 'purchase' ? '+' : '-'} ${app.formatCurrency(t.amount)}
                </div>
            </td>
            <td class="px-4 py-1 border-r border-slate-200 text-xs">
                <div class="font-bold text-slate-800 tracking-tight text-xs">${app.formatCurrency(t.balanceAfter)}</div>
            </td>
            <td class="px-4 py-1 text-right font-medium">
                <div class="flex items-center justify-end gap-1.5 transition-opacity">
                    <button onclick="Companies.viewTxnDetails('${t.id}', ${companyId})" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                    <button onclick="Companies.printVoucher('${t.id}', ${companyId})" class="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Print Voucher">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                    </button>
                    ${t.id === this.currentHistory[0]?.id ? `
                    <button onclick="Companies.handleDeleteTransaction('${t.id}', ${companyId})" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete Transaction">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `}).join('');
    if (window.lucide) lucide.createIcons();
  },

  hideHistoryModal() {
    const modal = document.getElementById('history-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async showAllTransactions() {
    const modal = document.getElementById('all-txns-modal');
    const title = document.getElementById('all-txns-title');
    title.textContent = this.currentTab === 'companies' ? 'All Company Transactions' : 'All Customer Transactions';

    app.showLoading();
    try {
        // Fetch all transactions
        let allTxns = [];
        const entities = await (this.currentTab === 'companies' ? window.api.getCompanies() : window.api.getCustomers());
        
        for (const entity of entities) {
            const txns = window.storage.get(`${this.currentTab}-${entity.id}-transactions`) || [];
            txns.forEach(t => {
                allTxns.push({ ...t, entityName: entity.name, entityId: entity.id });
            });
        }

        // Sort by date desc
        allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.fullTxnHistory = allTxns;

        this.renderAllTxnsList(allTxns);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Reset search
        const searchInput = document.getElementById('all-txns-search');
        if (searchInput) searchInput.value = '';
        
        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error(err);
        app.showAlert("Error loading transactions log.");
    } finally {
        app.hideLoading();
    }
  },

  renderAllTxnsList(txns) {
    const tbody = document.getElementById('all-txns-list');
    if (!tbody) return;

    if (txns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-300 font-bold italic">No transactions found.</td></tr>`;
        return;
    }

    tbody.innerHTML = txns.map(t => {
        const invPrefix = t.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV');
        const displayInvoice = t.invoice_no ? `${invPrefix}-${t.invoice_no}` : 'Legacy';
        
        return `
            <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-200">
                <td class="px-4 py-1 text-xs font-bold text-slate-800 tabular-nums border-r border-slate-200">${app.formatDateTime(t.date)}</td>
                <td class="px-4 py-1 text-xs font-bold text-slate-800 border-r border-slate-200">${displayInvoice}</td>
                <td class="px-4 py-1 text-xs font-bold text-slate-800 border-r border-slate-200 uppercase tracking-tight">${t.entityName}</td>
                <td class="px-4 py-1 border-r border-slate-200">
                    <span class="px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${t.type === 'purchase' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}">
                        ${t.type.toUpperCase()}
                    </span>
                </td>
                <td class="px-4 py-1 text-right font-bold tabular-nums border-r border-slate-200 text-xs ${t.type === 'purchase' ? 'text-rose-600' : 'text-emerald-600'}">
                    ${t.type === 'purchase' ? '+' : '-'} ${app.formatCurrency(t.amount)}
                </td>
                <td class="px-4 py-1 text-right font-medium">
                    <div class="flex items-center justify-end gap-1.5 transition-opacity">
                        <button onclick="Companies.viewTxnDetails('${t.id}', ${t.entityId})" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button onclick="Companies.printVoucher('${t.id}', ${t.entityId})" class="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Print Voucher">
                            <i data-lucide="printer" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
  },

  filterAllTxns() {
    const query = document.getElementById('all-txns-search').value.toLowerCase();
    if (!this.fullTxnHistory) return;
    
    const filtered = this.fullTxnHistory.filter(t => {
        const invPrefix = t.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV');
        const displayInvoice = t.invoice_no ? `${invPrefix}-${t.invoice_no}` : 'Legacy';
        
        return displayInvoice.toLowerCase().includes(query) ||
               t.entityName.toLowerCase().includes(query) ||
               t.amount.toString().includes(query) ||
               t.type.toLowerCase().includes(query);
    });
    
    this.renderAllTxnsList(filtered);
  },

  hideAllTxnsModal() {
    const modal = document.getElementById('all-txns-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  async handleSave(e) {
    e.preventDefault();
    const phoneVal = (document.getElementById('comp-phone')?.value || '').trim();
    const cleanPhone = phoneVal.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 11) {
      return app.showAlert("Phone number must be exactly 11 digits (e.g. 03001234567)");
    }

    const data = {
      id: document.getElementById('comp-id').value ? parseInt(document.getElementById('comp-id').value) : null,
      name: document.getElementById('comp-name').value,
      amount: parseFloat(document.getElementById('comp-amount').value) || 0,
      phone: phoneVal,
      address: document.getElementById('comp-address').value
    };

    app.showLoading();
    try {
      if (this.currentTab === 'companies') {
          await window.api.saveCompany(data);
      } else {
          await window.api.saveCustomer(data);
      }
      this.hideModal();
      await this.loadCompanies();
    } catch (err) {
      console.error(err);
      app.showAlert(`Error saving ${this.currentTab === 'companies' ? 'company' : 'customer'}`);
    } finally {
      app.hideLoading();
    }
  },

  async handleDelete(id) {
    const type = this.currentTab === 'companies' ? 'Company' : 'Customer';
    app.verifyPassword({
      title: `Delete ${type} Verification`,
      message: `Please enter password to delete this ${type.toLowerCase()}:`,
      onVerified: () => {
        app.showConfirm({
          title: `Delete ${type}`,
          message: `Are you sure you want to remove this ${type.toLowerCase()}? This action cannot be undone.`,
          confirmColor: 'red',
          onConfirm: async () => {
            app.showLoading();
            try {
              if (this.currentTab === 'companies') {
                  await window.api.deleteCompany(id);
              } else {
                  await window.api.deleteCustomer(id);
              }
              // Also clear transactions
              localStorage.removeItem(`${this.currentTab}-${id}-transactions`);
              await this.loadCompanies();
            } catch (err) {
              app.showAlert(`Error deleting ${this.currentTab === 'companies' ? 'company' : 'customer'}`);
            } finally {
              app.hideLoading();
            }
          }
        });
      }
    });
  },

  confirmDeleteAllCompanies() {
    app.showConfirm({
      title: 'Delete All Companies?',
      message: 'Are you sure you want to permanently delete ALL companies and suppliers from the database? This action cannot be undone.',
      confirmText: 'Delete All',
      confirmColor: 'red',
      onConfirm: async () => {
        app.showLoading();
        try {
          const res = await window.api.clearAllCompanies();
          if (res && res.success) {
            app.showToast('All companies deleted successfully', 'success');
            await this.loadCompanies();
          } else {
            app.showToast('Failed to delete companies: ' + (res?.error || 'Unknown error'), 'error');
          }
        } catch (err) {
          console.error('Error deleting companies:', err);
          app.showToast('Error deleting companies', 'error');
        } finally {
          app.hideLoading();
        }
      }
    });
  },

  async switchView(viewName) {
    this.currentView = viewName;
    const txnsView = document.getElementById('purchases-txns-view');
    const companiesView = document.getElementById('purchases-companies-view');
    const headerActions = document.getElementById('purchases-header-actions');
    const pageTitle = document.getElementById('purchases-page-title');
    const pageSubtitle = document.getElementById('purchases-page-subtitle');

    if (viewName === 'companies') {
      if (txnsView) txnsView.classList.add('hidden');
      if (companiesView) companiesView.classList.remove('hidden');
      if (pageTitle) pageTitle.textContent = 'Companies & Suppliers';
      if (pageSubtitle) pageSubtitle.textContent = 'Supplier Directory & Ledger';

      if (headerActions) {
        headerActions.innerHTML = `
          <button onclick="Companies.switchView('transactions')" class="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="list" class="w-3.5 h-3.5 text-slate-400"></i> <span>Transactions</span>
          </button>
          <button onclick="Companies.showCompanyModal()" class="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[2.5]"></i> <span>Add New Company</span>
          </button>
        `;
      }
      await this.loadCompanies();
    } else {
      if (companiesView) companiesView.classList.add('hidden');
      if (txnsView) txnsView.classList.remove('hidden');
      if (pageTitle) pageTitle.textContent = 'Purchases';
      if (pageSubtitle) pageSubtitle.textContent = 'Transactions Log';

      if (headerActions) {
        headerActions.innerHTML = `
          <button onclick="Companies.switchView('companies')" class="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="building-2" class="w-3.5 h-3.5 text-slate-400"></i> <span>Companies</span>
          </button>
          <button onclick="Companies.showNewPurchaseModal()" class="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[2.5]"></i> <span>New Purchase</span>
          </button>
        `;
      }
      await this.loadTransactions();
    }
    if (window.lucide) lucide.createIcons();
  },

  async loadTransactions() {
    app.showLoading();
    try {
      this.dataList = await (this.currentTab === 'companies' ? window.api.getCompanies() : window.api.getCustomers()) || [];
      
      let allTxns = [];
      for (const entity of this.dataList) {
        const txns = window.storage.get(`${this.currentTab}-${entity.id}-transactions`) || [];
        txns.forEach(t => {
          allTxns.push({ ...t, entityName: entity.name, entityId: entity.id });
        });
      }

      allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.fullTxnHistory = allTxns;

      this.initPeriodPickers();

      this.filterTransactions();
    } catch (err) {
      console.error(err);
      app.showAlert("Error loading purchase transactions.");
    } finally {
      app.hideLoading();
    }
  },

  initPeriodPickers() {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Collect all unique years from transactions
    const yearSet = new Set([now.getFullYear()]);
    let sourceTxns = this.fullTxnHistory || [];
    if (sourceTxns.length === 0 && this.dataList && this.dataList.length > 0) {
      this.dataList.forEach(item => {
        const txns = window.storage.get(`${this.currentTab}-${item.id}-transactions`) || [];
        sourceTxns = sourceTxns.concat(txns);
      });
    }
    sourceTxns.forEach(t => {
      if (t.date) {
        const parsed = this.parseTxnDate(t.date);
        if (parsed && parsed.year) yearSet.add(parsed.year);
      }
    });
    const years = Array.from(yearSet).sort((a, b) => b - a);

    // Initialize Transactions view pickers
    const txnDate = document.getElementById('txns-date-picker');
    if (txnDate && !txnDate.value) txnDate.value = todayStr;

    const txnMonth = document.getElementById('txns-month-select');
    if (txnMonth) txnMonth.value = String(now.getMonth() + 1);

    const txnMonthYear = document.getElementById('txns-month-year-select');
    if (txnMonthYear) {
      if (txnMonthYear.options.length === 0) {
        txnMonthYear.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
      }
      txnMonthYear.value = String(now.getFullYear());
    }

    const txnYear = document.getElementById('txns-year-picker');
    if (txnYear) {
      if (txnYear.options.length === 0) {
        txnYear.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
      }
      txnYear.value = String(now.getFullYear());
    }

    // Initialize Companies view pickers
    const compDate = document.getElementById('comp-date-picker');
    if (compDate && !compDate.value) compDate.value = todayStr;

    const compMonth = document.getElementById('comp-month-select');
    if (compMonth) compMonth.value = String(now.getMonth() + 1);

    const compMonthYear = document.getElementById('comp-month-year-select');
    if (compMonthYear) {
      if (compMonthYear.options.length === 0) {
        compMonthYear.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
      }
      compMonthYear.value = String(now.getFullYear());
    }

    const compYear = document.getElementById('comp-year-picker');
    if (compYear) {
      if (compYear.options.length === 0) {
        compYear.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
      }
      compYear.value = String(now.getFullYear());
    }
  },

  parseTxnDate(dateStr) {
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

  updateTransactionsStats(filteredTxns) {
    if (!this.fullTxnHistory) return;
    const txns = filteredTxns || this.fullTxnHistory;

    let totalPurchaseAmount = 0;
    let totalOrders = 0;
    txns.forEach(t => {
      if (t.type === 'purchase') {
        totalPurchaseAmount += (t.amount || 0);
        totalOrders += 1;
      }
    });

    const totalSupplierBalance = (this.dataList || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalCompanies = (this.dataList || []).length;

    const statTotal = document.getElementById('txns-stat-total');
    if (statTotal) statTotal.textContent = app.formatCurrency(totalPurchaseAmount);

    const statOrders = document.getElementById('txns-stat-orders');
    if (statOrders) statOrders.textContent = totalOrders;

    const statBalance = document.getElementById('txns-stat-balance');
    if (statBalance) statBalance.textContent = app.formatCurrency(totalSupplierBalance);

    const statCompanies = document.getElementById('txns-stat-companies');
    if (statCompanies) statCompanies.textContent = totalCompanies;

    const totalLabel = document.getElementById('txns-stat-total-label');
    const ordersLabel = document.getElementById('txns-stat-orders-label');
    if (totalLabel) {
      if (this.currentTxnPeriod === 'day') totalLabel.textContent = 'Purchases Today';
      else if (this.currentTxnPeriod === 'month') totalLabel.textContent = 'Purchases This Month';
      else if (this.currentTxnPeriod === 'year') totalLabel.textContent = 'Purchases This Year';
      else totalLabel.textContent = 'Total Purchases';
    }
    if (ordersLabel) {
      if (this.currentTxnPeriod === 'day') ordersLabel.textContent = 'Orders Today';
      else if (this.currentTxnPeriod === 'month') ordersLabel.textContent = 'Orders This Month';
      else if (this.currentTxnPeriod === 'year') ordersLabel.textContent = 'Orders This Year';
      else ordersLabel.textContent = 'Total Orders';
    }
  },

  setTxnTypeFilter(type) {
    this.txnsFilterType = type;
    const select = document.getElementById('txns-type-select');
    if (select && select.value !== type) {
      select.value = type;
    }
    this.filterTransactions();
  },

  setTxnPeriodType(type) {
    this.currentTxnPeriod = type;
    document.getElementById('txns-daily-controls')?.classList.toggle('hidden', type !== 'day');
    document.getElementById('txns-monthly-controls')?.classList.toggle('hidden', type !== 'month');
    document.getElementById('txns-annual-controls')?.classList.toggle('hidden', type !== 'year');

    ['day', 'month', 'year', 'all'].forEach(t => {
      const btn = document.getElementById(`txns-period-${t}`);
      if (btn) {
        if (t === type) {
          btn.className = 'px-2 py-1 text-[11px] font-black rounded-md transition-all bg-white shadow-sm text-slate-800 cursor-pointer';
        } else {
          btn.className = 'px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer';
        }
      }
    });

    this.filterTransactions();
    if (window.lucide) lucide.createIcons();
  },

  changeTxnDateStep(delta) {
    const input = document.getElementById('txns-date-picker');
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
    this.filterTransactions();
  },

  setTxnToday() {
    const now = new Date();
    const input = document.getElementById('txns-date-picker');
    if (input) {
      input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.filterTransactions();
    }
  },

  changeTxnMonthStep(delta) {
    const mSelect = document.getElementById('txns-month-select');
    const ySelect = document.getElementById('txns-month-year-select');
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
    this.filterTransactions();
  },

  setTxnThisMonth() {
    const now = new Date();
    const mSelect = document.getElementById('txns-month-select');
    const ySelect = document.getElementById('txns-month-year-select');
    if (mSelect) mSelect.value = now.getMonth() + 1;
    if (ySelect) ySelect.value = now.getFullYear();
    this.filterTransactions();
  },

  setCompPeriodType(type) {
    this.currentCompPeriod = type;
    document.getElementById('comp-daily-controls')?.classList.toggle('hidden', type !== 'day');
    document.getElementById('comp-monthly-controls')?.classList.toggle('hidden', type !== 'month');
    document.getElementById('comp-annual-controls')?.classList.toggle('hidden', type !== 'year');

    ['all', 'day', 'month', 'year'].forEach(t => {
      const btn = document.getElementById(`comp-period-${t}`);
      if (btn) {
        if (t === type) {
          btn.className = 'px-2 py-1 text-[11px] font-black rounded-md transition-all bg-white shadow-sm text-slate-800 cursor-pointer';
        } else {
          btn.className = 'px-2 py-1 text-[11px] font-black rounded-md transition-all text-slate-500 hover:text-slate-800 cursor-pointer';
        }
      }
    });

    this.applyFilters();
    if (window.lucide) lucide.createIcons();
  },

  changeCompDateStep(delta) {
    const input = document.getElementById('comp-date-picker');
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

  setCompToday() {
    const now = new Date();
    const input = document.getElementById('comp-date-picker');
    if (input) {
      input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      this.applyFilters();
    }
  },

  changeCompMonthStep(delta) {
    const mSelect = document.getElementById('comp-month-select');
    const ySelect = document.getElementById('comp-month-year-select');
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

  setCompThisMonth() {
    const now = new Date();
    const mSelect = document.getElementById('comp-month-select');
    const ySelect = document.getElementById('comp-month-year-select');
    if (mSelect) mSelect.value = now.getMonth() + 1;
    if (ySelect) ySelect.value = now.getFullYear();
    this.applyFilters();
  },

  filterTransactions() {
    if (!this.fullTxnHistory) return;
    const query = document.getElementById('txns-main-search')?.value.toLowerCase().trim() || '';
    const typeFilter = document.getElementById('txns-type-select')?.value || this.txnsFilterType || 'all';
    this.txnsFilterType = typeFilter;
    const selDate = document.getElementById('txns-date-picker')?.value;

    let filtered = this.fullTxnHistory.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Period filter
      if (t.date && this.currentTxnPeriod !== 'all') {
        const parsed = this.parseTxnDate(t.date);
        if (parsed) {
          if (this.currentTxnPeriod === 'day' && selDate) {
            if (parsed.dateStr !== selDate) return false;
          } else if (this.currentTxnPeriod === 'month') {
            const targetM = parseInt(document.getElementById('txns-month-select')?.value);
            const targetY = parseInt(document.getElementById('txns-month-year-select')?.value);
            if (targetM && targetY) {
              if (parsed.year !== targetY || parsed.month !== targetM) return false;
            }
          } else if (this.currentTxnPeriod === 'year') {
            const targetY = parseInt(document.getElementById('txns-year-picker')?.value);
            if (targetY) {
              if (parsed.year !== targetY) return false;
            }
          }
        }
      }

      if (query) {
        const invPrefix = t.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV');
        const displayInvoice = t.invoice_no ? `${invPrefix}-${t.invoice_no}` : 'Legacy';
        const matchesInvoice = displayInvoice.toLowerCase().includes(query) || (t.invoice_no && String(t.invoice_no).includes(query));
        const matchesEntity = (t.entityName || '').toLowerCase().includes(query);
        const matchesAmount = (t.amount || '').toString().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        return matchesInvoice || matchesEntity || matchesAmount || matchesDesc;
      }

      return true;
    });

    if (query) {
      filtered.sort((a, b) => {
        const aName = (a.entityName || a.company_name || a.supplier_name || a.name || '').toLowerCase();
        const bName = (b.entityName || b.company_name || b.supplier_name || b.name || '').toLowerCase();
        const aInv = (a.invoice_no ? String(a.invoice_no) : '').toLowerCase();
        const bInv = (b.invoice_no ? String(b.invoice_no) : '').toLowerCase();

        const aStarts = aName.startsWith(query) || aInv.startsWith(query);
        const bStarts = bName.startsWith(query) || bInv.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aWordStarts = aName.split(/\s+/).some(w => w.startsWith(query));
        const bWordStarts = bName.split(/\s+/).some(w => w.startsWith(query));
        if (aWordStarts && !bWordStarts) return -1;
        if (!aWordStarts && bWordStarts) return 1;

        return 0;
      });
    }

    this.renderTransactionsList(filtered);
    this.updateTransactionsStats(filtered);
    this.updateTxnClearPeriodButton();
  },

  updateTxnClearPeriodButton() {
    const btn = document.getElementById('txns-clear-period-btn');
    if (!btn) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const selDate = document.getElementById('txns-date-picker')?.value;
    const isDefault = (this.currentTxnPeriod === 'day' && selDate === todayStr);
    btn.classList.toggle('hidden', isDefault);
    if (window.lucide) lucide.createIcons();
  },

  resetTxnPeriodToDefault() {
    this.setTxnToday();
    this.setTxnThisMonth();
    const now = new Date();
    const yearPicker = document.getElementById('txns-year-picker');
    if (yearPicker) yearPicker.value = now.getFullYear();
    this.setTxnPeriodType('day');
  },

  renderTransactionsList(txns) {
    const tbody = document.getElementById('main-txns-list');
    if (!tbody) return;

    if (txns.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-12 text-center text-slate-400 font-bold italic">
            <div class="flex flex-col items-center justify-center gap-2">
              <i data-lucide="receipt" class="w-10 h-10 text-slate-300"></i>
              <p>No transactions found.</p>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    tbody.innerHTML = txns.map(t => {
      const invPrefix = t.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV');
      const displayInvoice = t.invoice_no ? `${invPrefix}-${t.invoice_no}` : 'Legacy';

      return `
        <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-200">
          <td class="px-4 py-1 text-xs font-bold text-slate-800 tabular-nums border-r border-slate-200">
            ${app.formatDateTime(t.date)}
          </td>
          <td class="px-4 py-1 text-xs font-bold text-slate-800 border-r border-slate-200">
            ${displayInvoice}
          </td>
          <td class="px-4 py-1 text-xs font-bold text-slate-800 border-r border-slate-200 uppercase tracking-tight">
            ${t.entityName}
          </td>
          <td class="px-4 py-1 border-r border-slate-200">
            <span class="px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${t.type === 'purchase' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}">
              ${t.type.toUpperCase()}
            </span>
          </td>
          <td class="px-4 py-1 text-right font-bold tabular-nums border-r border-slate-200 text-xs ${t.type === 'purchase' ? 'text-rose-600' : 'text-emerald-600'}">
            ${t.type === 'purchase' ? '+' : '-'} ${app.formatCurrency(t.amount)}
          </td>
          <td class="px-4 py-1 text-right font-bold text-slate-800 tabular-nums border-r border-slate-200 text-xs">
            ${t.balanceAfter !== undefined ? app.formatCurrency(t.balanceAfter) : '-'}
          </td>
          <td class="px-4 py-1 text-right font-medium">
            <div class="flex items-center justify-end gap-1.5 transition-opacity">
              <button onclick="Companies.viewTxnDetails('${t.id}', ${t.entityId})" class="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View Details">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button onclick="Companies.printVoucher('${t.id}', ${t.entityId})" class="p-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Print Voucher">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
              <button onclick="Companies.handleDeleteTransaction('${t.id}', ${t.entityId})" class="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Transaction">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  showNewPurchaseModal(companyId = null) {
    const modal = document.getElementById('new-purchase-modal');
    const list = document.getElementById('np-items-list');
    const totalEl = document.getElementById('np-grand-total');
    const targetLabel = document.getElementById('np-target-company');
    const idInput = document.getElementById('np-company-id');
    const selectEl = document.getElementById('np-company-select');
    const modalTitle = document.getElementById('np-modal-title');
    const submitPrintText = document.getElementById('np-submit-print-text');
    
    this.editingTxn = null;
    this.editingCompanyId = null;

    // Reset form
    document.getElementById('new-purchase-form').reset();
    list.innerHTML = '';
    totalEl.textContent = 'Rs. 0';
    const subtotalEl = document.getElementById('np-subtotal');
    if (subtotalEl) subtotalEl.textContent = 'Rs. 0';
    const discountInput = document.getElementById('np-discount');
    if (discountInput) discountInput.value = '';
    const paidInput = document.getElementById('np-paid-amount');
    if (paidInput) paidInput.value = '';
    if (modalTitle) modalTitle.textContent = 'New Purchase';
    if (submitPrintText) submitPrintText.textContent = 'Complete & Print';

    // Populate company selector dropdown
    if (selectEl) {
      selectEl.disabled = false;
      selectEl.innerHTML = `
        <option value="">-- Choose Supplier --</option>
        ${(this.dataList || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      `;
    }

    if (companyId) {
      const company = (this.dataList || []).find(x => x.id === companyId);
      if (company) {
        if (idInput) idInput.value = company.id;
        if (selectEl) selectEl.value = company.id;
        if (targetLabel) targetLabel.textContent = `Supplier: ${company.name}`;
      }
    } else {
      if (idInput) idInput.value = '';
      if (selectEl) selectEl.value = '';
      if (targetLabel) targetLabel.textContent = 'Select a Supplier';
    }
    
    // Add first row
    this.addPurchaseRow();
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  onPurchaseCompanyChange(companyId) {
    const idInput = document.getElementById('np-company-id');
    const targetLabel = document.getElementById('np-target-company');
    const cId = parseInt(companyId);
    const company = (this.dataList || []).find(c => c.id === cId);
    if (company) {
      if (idInput) idInput.value = company.id;
      if (targetLabel) targetLabel.textContent = `Supplier: ${company.name}`;
    } else {
      if (idInput) idInput.value = '';
      if (targetLabel) targetLabel.textContent = 'Select a Supplier';
    }
    this.calculateNewTxnTotal();
  },

  hideNewPurchaseModal() {
    const modal = document.getElementById('new-purchase-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    const modalTitle = document.getElementById('np-modal-title');
    if (modalTitle) modalTitle.textContent = 'New Purchase';
    const submitPrintText = document.getElementById('np-submit-print-text');
    if (submitPrintText) submitPrintText.textContent = 'Complete & Print';
    const selectEl = document.getElementById('np-company-select');
    if (selectEl) selectEl.disabled = false;
  },

  addPurchaseRow() {
    const list = document.getElementById('np-items-list');
    const rowId = Date.now() + Math.random().toString(36).substr(2, 4);
    const div = document.createElement('div');
    div.id = `row-${rowId}`;
    div.className = 'np-purchase-row grid grid-cols-12 gap-2 items-center group animate-in slide-in-from-left-2 duration-150 py-1 border-b border-slate-100 last:border-none';
    div.innerHTML = `
        <div class="col-span-6 relative">
            <input type="text" placeholder="Item Name / Details" onclick="Companies.handleItemSearch(this)" onfocus="Companies.handleItemSearch(this)" oninput="Companies.handleItemSearch(this); Companies.calculateNewTxnTotal();" class="np-item-name w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:bg-white focus:border-accent outline-none transition-all font-bold">
            <div class="np-search-results hidden absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-[550] max-h-52 overflow-y-auto"></div>
            <button type="button" onclick="Companies.clearItemSearch(this)" class="np-clear-btn hidden absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-rose-500 transition-colors">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
            <input type="hidden" class="np-item-id">
            <input type="hidden" class="np-item-slug">
            <input type="hidden" class="np-item-original-stock">
            <input type="hidden" class="np-item-old-boxes" value="0">
        </div>
        <div class="col-span-2">
            <input type="number" placeholder="Qty" min="1" step="1" oninput="Companies.calculateNewTxnTotal()" class="np-item-qty w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-black focus:bg-white focus:border-accent outline-none transition-all tabular-nums text-center">
        </div>
        <div class="col-span-2">
            <input type="number" placeholder="Cost / Qty" min="0" step="any" oninput="Companies.calculateNewTxnTotal()" class="np-item-cost w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-black focus:bg-white focus:border-accent outline-none transition-all tabular-nums text-right">
        </div>
        <div class="col-span-2 flex items-center justify-end gap-1.5">
            <span class="np-item-line-total text-xs font-black text-slate-800 tabular-nums">Rs. 0</span>
            <button type="button" onclick="this.closest('.np-purchase-row').remove(); Companies.calculateNewTxnTotal();" class="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all shrink-0" title="Remove Row">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>
    `;
    list.appendChild(div);
    if (window.lucide) lucide.createIcons();
  },

  async handleItemSearch(input) {
    const query = input.value.trim();
    const rowContainer = input.parentElement;
    const currentRow = input.closest('.np-purchase-row') || rowContainer.parentElement;
    const resultsContainer = rowContainer.querySelector('.np-search-results');
    const clearBtn = rowContainer.querySelector('.np-clear-btn');

    if (query.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }

    // Hide any other active search dropdowns
    document.querySelectorAll('.np-search-results').forEach(el => {
      if (el !== resultsContainer) el.classList.add('hidden');
    });

    // Search ALL products across all companies
    const items = await window.api.searchAllProducts(query);
    
    // Prioritize items starting with query, then word starts, then generic, then alphabetical
    const qClean = (query || '').toLowerCase().trim();
    if (qClean) {
      items.sort((a, b) => {
        const aName = (a.item_name || a.medicine_name || '').toLowerCase();
        const bName = (b.item_name || b.medicine_name || '').toLowerCase();
        const aStarts = aName.startsWith(qClean);
        const bStarts = bName.startsWith(qClean);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        const aWordStarts = aName.split(/\s+/).some(w => w.startsWith(qClean));
        const bWordStarts = bName.split(/\s+/).some(w => w.startsWith(qClean));
        if (aWordStarts && !bWordStarts) return -1;
        if (!aWordStarts && bWordStarts) return 1;

        const aGen = (a.generic_name || '').toLowerCase().startsWith(qClean);
        const bGen = (b.generic_name || '').toLowerCase().startsWith(qClean);
        if (aGen && !bGen) return -1;
        if (!aGen && bGen) return 1;

        return aName.localeCompare(bName);
      });
    } else {
      items.sort((a, b) => (a.item_name || '').localeCompare(b.item_name || ''));
    }

    // Mark items already selected in other rows
    const selectedKeys = new Set();
    document.querySelectorAll('#np-items-list > div').forEach(row => {
      if (row === currentRow) return;
      const id = row.querySelector('.np-item-id')?.value;
      const slug = row.querySelector('.np-item-slug')?.value;
      if (id && slug) {
        selectedKeys.add(`${slug}_${id}`);
      } else if (id) {
        selectedKeys.add(String(id));
      }
    });

    const mappedItems = items.map(item => {
      const key = `${item.slug}_${item.id}`;
      const isSelected = selectedKeys.has(key) || selectedKeys.has(String(item.id));
      return {
        ...item,
        alreadySelected: isSelected
      };
    });

    if (mappedItems.length === 0) {
        resultsContainer.innerHTML = `
          <div class="p-3 text-center text-xs text-slate-400 font-medium italic">
            No matching items found
          </div>
        `;
        resultsContainer.classList.remove('hidden');
        return;
    }

    this._searchCache = this._searchCache || {};
    this._searchCache[currentRow.id] = mappedItems;

    resultsContainer.innerHTML = mappedItems.map((item, idx) => {
        const stockBoxes = item.current_stock || 0;
        if (item.alreadySelected) {
          const safeName = (item.item_name || 'Item').replace(/'/g, "\\'");
          return `
          <div onclick="app.showToast('${safeName} is already added in another row', 'info')" class="p-2.5 bg-slate-50/80 cursor-not-allowed opacity-65 border-b border-slate-100 last:border-none transition-colors select-none">
              <div class="flex justify-between items-center gap-2">
                  <div class="flex items-center gap-1.5 truncate">
                    <span class="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate">${item.item_name}${item.medicine_code ? ` <span class="text-slate-400 font-semibold text-[10px] normal-case">(${item.medicine_code})</span>` : ''}</span>
                    <span class="text-[9px] font-black uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">Added</span>
                  </div>
                  <div class="flex gap-1.5 items-center shrink-0">
                    <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded whitespace-nowrap">Rs. ${(item.cost_price || 0).toLocaleString()}</span>
                    <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">${stockBoxes} Qty</span>
                  </div>
              </div>
          </div>
          `;
        }
        return `
        <div onclick="Companies.selectItemByIndex('${currentRow.id}', ${idx})" class="p-2.5 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-none transition-colors">
            <div class="flex justify-between items-center gap-2">
                <span class="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">${item.item_name}${item.medicine_code ? ` <span class="text-slate-500 font-bold text-[10px] normal-case">(${item.medicine_code})</span>` : ''}</span>
                <div class="flex gap-1.5 items-center shrink-0">
                  <span class="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded whitespace-nowrap">Rs. ${(item.cost_price || 0).toLocaleString()}</span>
                  <span class="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">${stockBoxes} Qty</span>
                </div>
            </div>
        </div>
    `;}).join('');
    resultsContainer.classList.remove('hidden');
  },

  selectItemByIndex(rowId, idx) {
    const list = this._searchCache && this._searchCache[rowId];
    if (list && list[idx]) {
      this.selectItem(rowId, list[idx]);
    }
  },

  selectItem(rowId, item) {
    const row = document.getElementById(rowId);
    if (!row || !item || item.alreadySelected) return;
    const input = row.querySelector('.np-item-name');
    const idInput = row.querySelector('.np-item-id');
    const slugInput = row.querySelector('.np-item-slug');
    const stockInput = row.querySelector('.np-item-original-stock');
    const oldBoxesInput = row.querySelector('.np-item-old-boxes');
    const qtyInput = row.querySelector('.np-item-qty') || row.querySelector('.np-item-cartons');
    const costInput = row.querySelector('.np-item-cost') || row.querySelector('.np-item-carton-cost') || row.querySelector('.np-item-price');
    const resultsContainer = row.querySelector('.np-search-results');

    if (input) {
      input.value = item.item_name + (item.medicine_code ? ` (${item.medicine_code})` : '');
      input.disabled = true;
      input.classList.add('bg-slate-100', 'text-slate-700', 'font-black');
    }
    
    if (idInput) idInput.value = item.id;
    if (slugInput) slugInput.value = item.slug;
    if (stockInput) stockInput.value = item.current_stock || 0;
    if (oldBoxesInput) oldBoxesInput.value = '0';

    if (qtyInput && (!qtyInput.value || parseFloat(qtyInput.value) <= 0)) {
      qtyInput.value = '1';
    }

    if (costInput) {
      costInput.value = item.cost_price || '';
    }
    
    if (resultsContainer) resultsContainer.classList.add('hidden');
    this.calculateNewTxnTotal();

    // Auto-add a new empty row if all rows are now filled
    const allRowInputs = Array.from(document.querySelectorAll('#np-items-list .np-item-id'));
    const allFilled = allRowInputs.length > 0 && allRowInputs.every(el => el.value !== '');
    if (allFilled) {
        this.addPurchaseRow();
    }
  },

  clearItemSearch(btn) {
    const row = btn.closest('.np-purchase-row') || btn.parentElement.parentElement;
    const input = row.querySelector('.np-item-name');
    const idInput = row.querySelector('.np-item-id');
    const slugInput = row.querySelector('.np-item-slug');
    const stockInput = row.querySelector('.np-item-original-stock');
    const oldBoxesInput = row.querySelector('.np-item-old-boxes');
    const qtyInput = row.querySelector('.np-item-qty') || row.querySelector('.np-item-cartons');
    const costInput = row.querySelector('.np-item-cost') || row.querySelector('.np-item-carton-cost') || row.querySelector('.np-item-price');
    const clearBtn = row.querySelector('.np-clear-btn');

    input.value = '';
    input.disabled = false;
    input.classList.remove('bg-slate-100', 'text-slate-500', 'font-black');
    
    idInput.value = '';
    slugInput.value = '';
    stockInput.value = '';
    if (oldBoxesInput) oldBoxesInput.value = '0';
    if (qtyInput) qtyInput.value = '';
    if (costInput) costInput.value = '';
    
    clearBtn.classList.add('hidden');
    this.calculateNewTxnTotal();
    input.focus();
  },

  calculateNewTxnTotal() {
    const rows = document.querySelectorAll('#np-items-list > div');
    let subtotal = 0;
    let validItemCount = 0;
    
    const companyId = parseInt(document.getElementById('np-company-id')?.value || document.getElementById('np-company-select')?.value);

    rows.forEach(row => {
        const nameInput = row.querySelector('.np-item-name');
        const qtyInput = row.querySelector('.np-item-qty') || row.querySelector('.np-item-cartons');
        const costInput = row.querySelector('.np-item-cost') || row.querySelector('.np-item-carton-cost') || row.querySelector('.np-item-price');
        const lineTotalEl = row.querySelector('.np-item-line-total');
        
        const name = nameInput ? nameInput.value.trim() : '';
        const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
        const boxCost = parseFloat(costInput ? costInput.value : 0) || 0;
        
        const lineTotal = (name && qty > 0 && boxCost > 0) ? (qty * boxCost) : 0;

        if (lineTotalEl) lineTotalEl.textContent = app.formatCurrency(lineTotal);

        if (name && qty > 0 && boxCost > 0) {
            validItemCount++;
            subtotal += lineTotal;
        }
    });

    const isReady = validItemCount > 0 && subtotal > 0 && !!companyId && !isNaN(companyId);

    const discountEl = document.getElementById('np-discount');
    let discount = parseFloat(discountEl?.value) || 0;
    if (discount < 0) {
      discount = 0;
      if (discountEl) discountEl.value = '';
    }
    if (subtotal > 0 && discount > subtotal) {
      discount = subtotal;
      if (discountEl) discountEl.value = subtotal;
    }
    if (discountEl) discountEl.max = subtotal;

    const total = Math.max(0, subtotal - discount);

    const paidEl = document.getElementById('np-paid-amount');
    let paid = parseFloat(paidEl?.value) || 0;
    if (paid < 0) {
      paid = 0;
      if (paidEl) paidEl.value = '';
    }
    if (paid > total) {
      paid = total;
      if (paidEl) paidEl.value = total > 0 ? total : '';
    }
    if (paidEl) paidEl.max = total;
    
    const subtotalEl = document.getElementById('np-subtotal');
    if (subtotalEl) subtotalEl.textContent = app.formatCurrency(subtotal);

    const totalEl = document.getElementById('np-grand-total');
    if (totalEl) totalEl.textContent = app.formatCurrency(total);
    
    const submitPrintBtn = document.getElementById('np-submit-print-btn');
    if (submitPrintBtn) {
        submitPrintBtn.disabled = !isReady;
        submitPrintBtn.style.opacity = isReady ? '1' : '0.5';
        submitPrintBtn.style.cursor = isReady ? 'pointer' : 'not-allowed';
    }
  },

  async confirmAndCompletePurchase(e) {
    if (e) e.preventDefault();
    const selectEl = document.getElementById('np-company-select');
    const idInput = document.getElementById('np-company-id');
    const companyId = parseInt(idInput?.value || selectEl?.value);
    const rows = document.querySelectorAll('#np-items-list > div');
    
    if (!companyId || isNaN(companyId)) {
      return app.showAlert("Please select a supplier from the dropdown.");
    }

    const company = (this.dataList || []).find(c => c.id === companyId);
    if (!company) return app.showAlert("Please select a valid supplier.");

    let subtotal = 0;
    let totalBoxes = 0;
    const itemsData = [];

    rows.forEach(row => {
      const nameInput = row.querySelector('.np-item-name');
      const qtyInput = row.querySelector('.np-item-qty') || row.querySelector('.np-item-cartons');
      const costInput = row.querySelector('.np-item-cost') || row.querySelector('.np-item-carton-cost') || row.querySelector('.np-item-price');
      
      const name = nameInput ? nameInput.value.trim() : '';
      const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
      const boxCost = parseFloat(costInput ? costInput.value : 0) || 0;
      
      if (name && qty > 0 && boxCost > 0) {
        const lineTotal = qty * boxCost;
        itemsData.push({ name, qty, boxCost, lineTotal });
        subtotal += lineTotal;
        totalBoxes += qty;
      }
    });

    if (itemsData.length === 0 || subtotal <= 0) {
      return app.showAlert("Please add at least one item with quantity and price.");
    }

    const discountEl = document.getElementById('np-discount');
    let discount = parseFloat(discountEl?.value) || 0;
    discount = Math.max(0, Math.min(discount, subtotal));

    const finalTotal = Math.max(0, subtotal - discount);

    const paidEl = document.getElementById('np-paid-amount');
    let paidAmount = parseFloat(paidEl?.value) || 0;
    paidAmount = Math.max(0, Math.min(paidAmount, finalTotal));

    // Calculate balance after
    const netImpact = finalTotal - paidAmount;
    const newBalance = (company.amount || 0) + netImpact;

    app.showConfirm({
      title: 'Confirm Purchase',
      message: `
        <div class="text-slate-600 text-sm">
          Are you sure you want to complete and record this purchase for <span class="font-black text-slate-900">${company.name}</span>?
        </div>
        <div class="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-left text-slate-700">
          <div class="flex justify-between items-center">
            <span class="text-slate-500 font-bold">Supplier:</span>
            <span class="font-black text-slate-900">${company.name}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 font-bold">Total Items:</span>
            <span class="font-black text-slate-900">${itemsData.length} item${itemsData.length > 1 ? 's' : ''} (${totalBoxes} Qty)</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500 font-bold">Subtotal:</span>
            <span class="font-black text-slate-900">${app.formatCurrency(subtotal)}</span>
          </div>
          ${discount > 0 ? `
          <div class="flex justify-between items-center text-rose-600">
            <span class="font-bold">Discount:</span>
            <span class="font-black">-${app.formatCurrency(discount)}</span>
          </div>` : ''}
          <div class="flex justify-between items-center border-t border-slate-200 pt-1.5 font-black text-slate-900 text-sm">
            <span>Total:</span>
            <span class="text-base">${app.formatCurrency(finalTotal)}</span>
          </div>
          ${paidAmount > 0 ? `
          <div class="flex justify-between items-center text-emerald-600">
            <span class="font-bold">Paid Amount:</span>
            <span class="font-black">${app.formatCurrency(paidAmount)}</span>
          </div>` : ''}
          <div class="flex justify-between items-center border-t border-dashed border-slate-200 pt-1.5">
            <span class="text-slate-500 font-bold">Supplier Balance After:</span>
            <span class="font-black text-slate-900 text-sm">${app.formatCurrency(newBalance)}</span>
          </div>
        </div>
      `,
      confirmText: 'Complete & Print',
      confirmColor: 'green',
      onConfirm: async () => {
        await this.submitNewPurchase(null, true);
      }
    });
  },

  async submitNewPurchase(e, andPrint = false) {
    if (e) e.preventDefault();
    const selectEl = document.getElementById('np-company-select');
    const idInput = document.getElementById('np-company-id');
    const companyId = parseInt(idInput?.value || selectEl?.value);
    const rows = document.querySelectorAll('#np-items-list > div');
    
    if (!companyId || isNaN(companyId)) {
        return app.showAlert("Please select a supplier from the dropdown.");
    }

    const company = (this.dataList || []).find(c => c.id === companyId);
    if (!company) return app.showAlert("Please select a valid supplier.");

    let subtotal = 0;
    const details = [];
    const itemsData = [];
    const stockUpdates = [];

    rows.forEach(row => {
        const nameInput = row.querySelector('.np-item-name');
        const qtyInput = row.querySelector('.np-item-qty') || row.querySelector('.np-item-cartons');
        const costInput = row.querySelector('.np-item-cost') || row.querySelector('.np-item-carton-cost') || row.querySelector('.np-item-price');
        const idInput = row.querySelector('.np-item-id');
        const slugInput = row.querySelector('.np-item-slug');

        const name = nameInput ? nameInput.value.trim() : '';
        const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
        const boxCost = parseFloat(costInput ? costInput.value : 0) || 0;
        
        if (name && qty > 0 && boxCost > 0) {
            const lineTotal = qty * boxCost;

            details.push(`${name} (${qty} Qty @ Rs. ${boxCost.toLocaleString()})`);
            itemsData.push({ 
                name, 
                qty,
                price: boxCost,
                box_cost: boxCost, 
                lineTotal,
                item_id: idInput ? idInput.value : '',
                slug: slugInput ? slugInput.value : ''
            });
            subtotal += lineTotal;

            if (idInput && idInput.value && slugInput && slugInput.value) {
                stockUpdates.push({
                    id: idInput.value,
                    slug: slugInput.value,
                    qty: qty,
                    box_cost: boxCost
                });
            }
        }
    });

    if (itemsData.length === 0 || subtotal <= 0) {
        return app.showAlert("Please add at least one item with quantity and price.");
    }

    const discountEl = document.getElementById('np-discount');
    let discount = parseFloat(discountEl?.value) || 0;
    discount = Math.max(0, Math.min(discount, subtotal));

    const finalTotal = Math.max(0, subtotal - discount);

    const paidEl = document.getElementById('np-paid-amount');
    let paidAmount = parseFloat(paidEl?.value) || 0;
    paidAmount = Math.max(0, Math.min(paidAmount, finalTotal));

    if (paidEl) {
      paidEl.value = paidAmount > 0 ? paidAmount : '';
    }

    app.showLoading();
    try {
        const txnKey = `companies-${company.id}-transactions`;
        const transactions = window.storage.get(txnKey) || [];

        const netImpact = finalTotal - paidAmount;
        const newBalance = (company.amount || 0) + netImpact;
        
        // 1. Update Company Balance
        await window.api.saveCompany({ ...company, amount: newBalance });

        // 2. Save Transaction History
        const nextNoKey = `next-invoice-no-companies`;
        let nextNo = window.storage.get(nextNoKey);
        if (nextNo === null) {
            let totalTxns = 0;
            this.dataList.forEach(item => {
                const txns = window.storage.get(`companies-${item.id}-transactions`) || [];
                totalTxns += txns.length;
            });
            nextNo = totalTxns + 1;
        }

        const newTxn = {
            id: Date.now().toString(),
            invoice_no: nextNo,
            invoice_prefix: 'CMP',
            type: 'purchase',
            amount: finalTotal,
            subtotal: subtotal,
            discount: discount,
            paid: paidAmount,
            description: details.join(', ') + 
                (discount > 0 ? ` (Discount: ${app.formatCurrency(discount)})` : '') + 
                (paidAmount > 0 ? ` (Paid: ${app.formatCurrency(paidAmount)})` : ''),
            items: itemsData,
            date: new Date().toISOString(),
            balanceAfter: newBalance
        };

        window.storage.set(nextNoKey, nextNo + 1);
        transactions.unshift(newTxn);
        window.storage.set(txnKey, transactions);

        // 3. Update Stock & Cost Price
        for (const update of stockUpdates) {
            const products = await window.api.getProducts(update.slug);
            const product = products.find(p => p.id == update.id);
            if (product) {
                const newStock = (product.current_stock || 0) + update.qty;
                const newCost = update.box_cost > 0 ? update.box_cost : product.cost_price;
                await window.api.updateProduct(update.slug, update.id, {
                    ...product,
                    current_stock: newStock,
                    cost_price: newCost
                });
            }
        }

        // 4. UI Update
        this.hideNewPurchaseModal();
        if (this.currentView === 'transactions') {
            await this.loadTransactions();
        } else {
            await this.loadCompanies();
        }

        if (andPrint) {
            await this.viewTxnDetails(newTxn.id, company.id);
        } else {
            app.showAlert({
                title: 'Purchase Recorded',
                message: `Purchase of ${app.formatCurrency(finalTotal)} recorded and stock updated.`,
                type: 'success'
            });
        }
    } catch (err) {
        console.error(err);
        app.showAlert("Error submitting transaction.");
    } finally {
        app.hideLoading();
    }
  },

  async printVoucher(txnId, companyId) {
    const company = this.dataList.find(c => c.id === companyId);
    if (!company) return;

    const txnKey = `${this.currentTab}-${company.id}-transactions`;
    const transactions = window.storage.get(txnKey) || [];
    const txn = transactions.find(t => t.id == txnId);
    if (!txn) return;

    app.showLoading();
    try {
        const settings = await window.api.getSettings();
        const printContainer = document.getElementById('voucher-print');
        
        const items = txn.items && txn.items.length > 0 ? txn.items : [{ name: txn.description || 'Purchase', price: txn.amount }];

        const txnIndex = transactions.findIndex(t => t.id == txnId);
        let invoiceDisplay = '';
        if (txn.invoice_no) {
            invoiceDisplay = `${txn.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV')}-${txn.invoice_no}`;
        } else {
            const invNo = transactions.length - txnIndex;
            const invPrefix = this.currentTab === 'companies' ? 'CMP' : 'INV';
            invoiceDisplay = `${invPrefix}-${invNo}`;
        }

        const rowHtml = items.map((item, idx) => {
            const rawName = item.name || item.item_name || '';
            const cleanName = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim() || rawName;
            const qty = item.qty || item.total_boxes || 1;
            const price = item.box_cost || item.price || item.carton_cost || 0;
            const lineTotal = item.lineTotal || (qty * price) || 0;

            return `
            <tr>
                <td style="border: 1px solid #000; padding: 6px 3px; font-size: 11px; text-align: center; color: #000; font-weight: 600;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 6px 6px; font-size: 12px; color: #000; font-weight: bold; line-height: 1.25;">
                    ${cleanName}
                </td>
                <td style="border: 1px solid #000; padding: 6px 3px; font-size: 12px; text-align: center; color: #000; font-weight: bold;">${qty}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; font-size: 11.5px; text-align: right; color: #000;">${app.formatAmount(price)}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; font-size: 12px; text-align: right; color: #000; font-weight: bold;">${app.formatAmount(lineTotal)}</td>
            </tr>
            `;
        }).join('');

        const html = `
            <div class="receipt-80mm" style="width: 100%; max-width: 400px; margin: 0 auto; padding: 14px 16px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000; box-sizing: border-box; font-size: 12px; line-height: 1.45; border: 1px solid #ddd;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
                    <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000; line-height: 1.2;">${settings.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
                    <p style="font-size: 11.5px; margin: 3px 0 1px; font-weight: bold; color: #000;">${settings.address || 'Near Babu Hotel, Railway Ground, Taxila'}</p>
                    <p style="font-size: 10.5px; margin: 1px 0 0; font-weight: bold; color: #000;">Ph: ${settings.phone || '0333-9109092'}</p>
                    <div style="margin-top: 6px;">
                        <span style="display: inline-block; border: 1px solid #000; padding: 2px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; border-radius: 4px; background: #000; color: #fff; letter-spacing: 0.5px;">PURCHASE VOUCHER / RECEIPT</span>
                    </div>
                </div>
                
                <!-- Metadata Card -->
                <div style="font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; line-height: 1.55;">
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Invoice #:</span> <span style="font-weight: 900; font-size: 12px;">${invoiceDisplay}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Date & Time:</span> <span>${app.formatDateTime(txn.date)}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Supplier:</span> <span style="font-weight: bold;">${company.name}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Type:</span> <span style="font-weight: bold; text-transform: uppercase;">${txn.type.toUpperCase()}</span></div>
                </div>

                <!-- Items Bordered Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid #000; color: #000;">
                    <thead>
                        <tr style="border-bottom: 1.5px solid #000; background: #f8fafc;">
                            <th style="border: 1px solid #000; padding: 4px 2px; font-size: 10.5px; font-weight: 800; text-align: center; width: 7%;">#</th>
                            <th style="border: 1px solid #000; padding: 4px 5px; font-size: 11px; font-weight: 800; text-align: left; width: 49%;">Item / Description</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; font-size: 11px; font-weight: 800; text-align: center; width: 12%;">Qty</th>
                            <th style="border: 1px solid #000; padding: 4px 4px; font-size: 11px; font-weight: 800; text-align: right; width: 16%;">Price</th>
                            <th style="border: 1px solid #000; padding: 4px 4px; font-size: 11px; font-weight: 800; text-align: right; width: 16%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowHtml}
                    </tbody>
                </table>

                <!-- Summary Box -->
                <div style="border-top: 1.5px solid #000; padding-top: 4px; margin-bottom: 8px; font-size: 11.5px; line-height: 1.6;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Subtotal:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(txn.subtotal || txn.amount)}</span>
                    </div>
                    ${txn.discount > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #b91c1c;">
                        <span>Discount:</span>
                        <span style="font-weight: bold;">-${app.formatCurrency(txn.discount)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 900; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 3px 0; margin-top: 2px;">
                        <span>NET TOTAL:</span>
                        <span>${app.formatCurrency(txn.amount)}</span>
                    </div>
                    ${(txn.paid && txn.paid > 0) ? `
                    <div style="display: flex; justify-content: space-between; padding-top: 2px;">
                        <span>Paid Amount:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(txn.paid)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Remaining Due:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(Math.max(0, txn.amount - txn.paid))}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding-top: 2px; border-top: 1px dashed #000; margin-top: 2px;">
                        <span>Supplier Balance After:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(txn.balanceAfter)}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; font-size: 9.5px; color: #333;">
                    <p style="margin: 0; font-weight: bold; color: #000;">Thank you for your business!</p>
                </div>
            </div>
        `;

        app.setPrintContent('voucher-print', html);
        app.hideLoading();
        await app.printReceipt();
    } catch (err) {
        console.error(err);
        app.hideLoading();
        app.showAlert("Error generating voucher.");
    }
  },

  async viewTxnDetails(txnId, companyId) {
    const company = this.dataList.find(c => c.id === companyId);
    if (!company) return;

    const txnKey = `${this.currentTab}-${company.id}-transactions`;
    const transactions = window.storage.get(txnKey) || [];
    const txn = transactions.find(t => t.id == txnId);
    if (!txn) return;

    app.showLoading();
    try {
        const settings = await window.api.getSettings();
        const previewPaper = document.getElementById('preview-paper');
        const previewTitle = document.getElementById('preview-title');
        const previewSubtitle = document.getElementById('preview-subtitle');
        const modal = document.getElementById('preview-modal');

        const items = txn.items && txn.items.length > 0 ? txn.items : [{ name: txn.description || (txn.type === 'purchase' ? 'Purchase' : 'Payment'), price: txn.amount }];
        const txnIndex = transactions.findIndex(t => t.id == txnId);
        let invoiceDisplay = '';
        if (txn.invoice_no) {
            invoiceDisplay = `${txn.invoice_prefix || (this.currentTab === 'companies' ? 'CMP' : 'INV')}-${txn.invoice_no}`;
        } else {
            const invNo = transactions.length - txnIndex;
            const invPrefix = this.currentTab === 'companies' ? 'CMP' : 'INV';
            invoiceDisplay = `${invPrefix}-${invNo}`;
        }

        const rowHtml = items.map((item, idx) => {
            const rawName = item.name || item.item_name || '';
            const cleanName = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim() || rawName;
            const qty = item.qty || item.total_boxes || 1;
            const price = item.box_cost || item.price || item.carton_cost || 0;
            const lineTotal = item.lineTotal || (qty * price) || 0;

            return `
            <tr>
                <td style="border: 1px solid #000; padding: 6px 3px; font-size: 11px; text-align: center; color: #000; font-weight: 600;">${idx + 1}</td>
                <td style="border: 1px solid #000; padding: 6px 6px; font-size: 12px; color: #000; font-weight: bold; line-height: 1.25;">
                    ${cleanName}
                </td>
                <td style="border: 1px solid #000; padding: 6px 3px; font-size: 12px; text-align: center; color: #000; font-weight: bold;">${qty}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; font-size: 11.5px; text-align: right; color: #000;">${app.formatAmount(price)}</td>
                <td style="border: 1px solid #000; padding: 6px 4px; font-size: 12px; text-align: right; color: #000; font-weight: bold;">${app.formatAmount(lineTotal)}</td>
            </tr>
            `;
        }).join('');

        const html = `
            <div class="receipt-80mm" style="width: 100%; max-width: 400px; margin: 0 auto; padding: 14px 16px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000; box-sizing: border-box; font-size: 12px; line-height: 1.45; border: 1px solid #ddd;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
                    <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000; line-height: 1.2;">${settings.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
                    <p style="font-size: 11.5px; margin: 3px 0 1px; font-weight: bold; color: #000;">${settings.address || 'Near Babu Hotel, Railway Ground, Taxila'}</p>
                    <p style="font-size: 10.5px; margin: 1px 0 0; font-weight: bold; color: #000;">Ph: ${settings.phone || '0333-9109092'}</p>
                    <div style="margin-top: 6px;">
                        <span style="display: inline-block; border: 1px solid #000; padding: 2px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; border-radius: 4px; background: #000; color: #fff; letter-spacing: 0.5px;">PURCHASE VOUCHER / RECEIPT</span>
                    </div>
                </div>
                
                <!-- Metadata Card -->
                <div style="font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; line-height: 1.55;">
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Invoice #:</span> <span style="font-weight: 900; font-size: 12px;">${invoiceDisplay}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Date & Time:</span> <span>${app.formatDateTime(txn.date)}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Supplier:</span> <span style="font-weight: bold;">${company.name}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Type:</span> <span style="font-weight: bold; text-transform: uppercase;">${txn.type.toUpperCase()}</span></div>
                </div>

                <!-- Items Bordered Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid #000; color: #000;">
                    <thead>
                        <tr style="border-bottom: 1.5px solid #000; background: #f8fafc;">
                            <th style="border: 1px solid #000; padding: 4px 2px; font-size: 10.5px; font-weight: 800; text-align: center; width: 7%;">#</th>
                            <th style="border: 1px solid #000; padding: 4px 5px; font-size: 11px; font-weight: 800; text-align: left; width: 49%;">Item / Description</th>
                            <th style="border: 1px solid #000; padding: 4px 2px; font-size: 11px; font-weight: 800; text-align: center; width: 12%;">Qty</th>
                            <th style="border: 1px solid #000; padding: 4px 4px; font-size: 11px; font-weight: 800; text-align: right; width: 16%;">Price</th>
                            <th style="border: 1px solid #000; padding: 4px 4px; font-size: 11px; font-weight: 800; text-align: right; width: 16%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowHtml}
                    </tbody>
                </table>

                <!-- Summary Box -->
                <div style="border-top: 1.5px solid #000; padding-top: 4px; margin-bottom: 8px; font-size: 11.5px; line-height: 1.6;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Subtotal:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(txn.subtotal || txn.amount)}</span>
                    </div>
                    ${txn.discount > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: #b91c1c;">
                        <span>Discount:</span>
                        <span style="font-weight: bold;">-${app.formatCurrency(txn.discount)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; font-size: 13.5px; font-weight: 900; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 3px 0; margin-top: 2px;">
                        <span>NET TOTAL:</span>
                        <span>${app.formatCurrency(txn.amount)}</span>
                    </div>
                    ${(txn.paid && txn.paid > 0) ? `
                    <div style="display: flex; justify-content: space-between; padding-top: 2px;">
                        <span>Paid Amount:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(txn.paid)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Remaining Due:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(Math.max(0, txn.amount - txn.paid))}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding-top: 2px; border-top: 1px dashed #000; margin-top: 2px;">
                        <span>Supplier Balance After:</span>
                        <span style="font-weight: bold;">${app.formatCurrency(txn.balanceAfter)}</span>
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; font-size: 9.5px; color: #333;">
                    <p style="margin: 0; font-weight: bold; color: #000;">Thank you for your business!</p>
                </div>
            </div>
        `;

        if (previewPaper) {
            previewPaper.className = "bg-white shadow-2xl transform origin-top mb-12 w-full max-w-[400px] rounded-lg";
            previewPaper.innerHTML = html;
        }
        previewTitle.textContent = `${txn.type.toUpperCase()} VOUCHER`;
        previewSubtitle.textContent = '80MM THERMAL RECEIPT';
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Update Print Button Action
        const printBtn = document.getElementById('confirm-print-btn');
        if (printBtn) {
            printBtn.onclick = () => {
                app.closePreview();
                this.printVoucher(txnId, companyId);
            };
        }

        if (window.lucide) lucide.createIcons();

        app.hideLoading();
    } catch (err) {
        console.error(err);
        app.hideLoading();
        app.showAlert("Error viewing details.");
    }
  },

  async handleDeleteTransaction(txnId, companyId) {
    const company = this.dataList.find(c => c.id === companyId);
    if (!company) return;

    const txnKey = `${this.currentTab}-${company.id}-transactions`;
    const transactions = window.storage.get(txnKey) || [];
    
    if (transactions.length === 0 || transactions[0].id !== txnId) {
        app.showAlert("Only the latest transaction can be deleted to maintain balance integrity.");
        return;
    }

    const txn = transactions[0];
    const netChange = (txn.type === 'purchase') ? ((txn.amount || 0) - (txn.paid || 0)) : -(txn.amount || 0);
    const revertedBalance = (company.amount || 0) - netChange;

    app.verifyPassword({
      title: 'Delete Transaction Verification',
      message: 'Please enter password to delete this transaction:',
      onVerified: () => {
        app.showConfirm({
          title: 'Delete Transaction',
          message: `Are you sure you want to delete the latest transaction (${txn.type}) of ${app.formatCurrency(txn.amount)}?<br><br>This will revert the balance to <b>${app.formatCurrency(revertedBalance)}</b> and remove this record permanently.`,
          confirmColor: 'red',
          onConfirm: async () => {
            app.showLoading();
            try {
                // 1. Revert Balance
                let newBalance = (company.amount || 0) - netChange;

                // Update Entity
                if (this.currentTab === 'companies') {
                    await window.api.saveCompany({ ...company, amount: newBalance });
                } else {
                    await window.api.saveCustomer({ ...company, amount: newBalance });
                }

                // 2. Remove from storage
                transactions.shift();
                window.storage.set(txnKey, transactions);

                // 3. Revert Invoice No Counter (if applicable)
                const nextNoKey = `next-invoice-no-${this.currentTab}`;
                let nextNo = window.storage.get(nextNoKey);
                if (nextNo !== null && nextNo > 1) {
                    window.storage.set(nextNoKey, nextNo - 1);
                }

                // 4. Refresh UI
                if (this.currentView === 'transactions') {
                    await this.loadTransactions();
                } else {
                    await this.loadCompanies();
                }
                const histModal = document.getElementById('history-modal');
                if (histModal && !histModal.classList.contains('hidden')) {
                    await this.showHistory(companyId); 
                }
                
                app.showAlert({
                    title: 'Transaction Deleted',
                    message: 'Transaction has been successfully removed and balance reverted.',
                    type: 'success'
                });
            } catch (err) {
                console.error(err);
                app.showAlert("Error deleting transaction: " + err.message);
            } finally {
                app.hideLoading();
            }
          }
        });
      }
    });
  }
};

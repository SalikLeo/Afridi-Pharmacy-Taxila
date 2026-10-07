const MasterDB = {
  currentCategory: 'all',
  categories: [],
  currentItems: [],
  companies: [],
  units: [],
  currentPage: 1,
  pageSize: 50,
  totalPages: 1,
  totalItemsCount: 0,
  searchDebounceTimer: null,
  selectedExpiryFilter: 'all',
  selectedStockFilter: 'all',
  currentSalesPeriod: 'daily',

  async render(container, args) {
    this.currentCategory = (args && args.category) || 'all';
    this.currentPage = 1;
    this.settings = await window.api.getSettings();
    this.units = await window.api.getUnits();
    const stats = await window.api.getCategoryStats();
    
    this.categories = (stats || []).map(s => ({
      id: s.slug,
      label: s.label,
      count: s.count || 0
    })).sort((a, b) => (b.count || 0) - (a.count || 0) || a.label.localeCompare(b.label));

    if (this.currentCategory !== 'all' && this.categories.length > 0 && !this.categories.some(c => c.id === this.currentCategory)) {
      this.currentCategory = 'all';
    }

    const totalCount = this.categories.reduce((s, c) => s + (c.count || 0), 0);

    container.innerHTML = `
      <div class="flex justify-between items-center mb-4 gap-4 no-print flex-wrap lg:flex-nowrap">
        <!-- Title & Search & Quick Filters -->
        <div class="flex items-center flex-1 max-w-4xl gap-3 min-w-[320px] flex-wrap sm:flex-nowrap">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black">
              <i data-lucide="pill" class="w-4 h-4"></i>
            </div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight shrink-0">Medicine Stock</h1>
          </div>
          
          <div class="relative flex-1 group min-w-[200px]">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors"></i>
            <input type="text" id="db-search" 
              oninput="MasterDB.onSearchInput()"
              placeholder="Search all categories (Medicine Code, Brand, Salt, Company, Rack)..." 
              class="w-full h-9 bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-4 text-xs font-bold text-slate-800 focus:border-teal-500 focus:ring-4 focus:ring-teal-50 transition-all outline-none shadow-xs">
          </div>

          <!-- Low Stock Filter -->
          <div class="flex items-center gap-1 shrink-0">
            <label class="text-[10px] font-black text-rose-500 uppercase tracking-wider whitespace-nowrap">Low &le;</label>
            <input type="number" id="db-low-stock-filter" 
              oninput="MasterDB.onSearchInput()"
              placeholder="5" 
              class="w-14 h-9 bg-white border border-slate-200 rounded-xl py-1 px-1 text-xs focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all outline-none shadow-xs font-black text-rose-600 text-center"
              title="Filter medicines with stock less than or equal to entered quantity">
          </div>

          <!-- Expiry Days Filter -->
          <div class="flex items-center gap-1 shrink-0">
            <label class="text-[10px] font-black text-amber-600 uppercase tracking-wider whitespace-nowrap">Exp &le;</label>
            <input type="number" id="db-expiry-days-filter" 
              oninput="MasterDB.onSearchInput()"
              min="0"
              placeholder="Days" 
              class="w-16 h-9 bg-white border border-slate-200 rounded-xl py-1 px-1 text-xs focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all outline-none shadow-xs font-black text-amber-700 text-center"
              title="Filter medicines expiring in less than or equal to entered number of days">
          </div>

          <!-- Clear Quick Filters Button -->
          <button type="button" id="db-clear-filters-btn" onclick="MasterDB.resetFilters()" class="h-8 w-8 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-200 shadow-2xs hidden cursor-pointer shrink-0" title="Clear Filters">
            <i data-lucide="x" class="w-3.5 h-3.5 stroke-[2.5]"></i>
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2 shrink-0">
          <button onclick="MasterDB.printStockList()" class="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer" title="Print Current Category Stock">
            <i data-lucide="printer" class="w-3.5 h-3.5 text-slate-500"></i>
            <span>Print Stock</span>
          </button>
          
          <button onclick="MasterDB.openManageCategoriesModal(true)" class="h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="settings" class="w-3.5 h-3.5 text-slate-400"></i>
            <span>Categories/Forms</span>
          </button>

          <button onclick="MasterDB.openForm()" class="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      <!-- Main Content Layout -->
      <div class="bg-white rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-165px)]">
        <!-- Sidebar Categories (Medicine Forms) -->
        <div class="w-full md:w-56 bg-slate-50 border-r border-slate-200 flex flex-col p-3 no-print shrink-0">
          <div class="flex items-center justify-between mb-3 px-1">
            <h3 class="text-xs font-black text-slate-500 uppercase tracking-wider">Medicine Forms</h3>
            <span id="cat-total-badge" class="text-[10px] font-bold text-teal-600">${this.categories.length} forms</span>
          </div>
          <div id="sidebar-tabs" class="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
            <button onclick="MasterDB.switchTab('all')" id="tab-all" class="db-tab group w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center text-xs ${this.currentCategory === 'all' ? 'bg-white shadow-xs border border-slate-200 text-slate-900 font-black' : 'text-slate-600 hover:bg-slate-100 font-bold'}">
              <span class="truncate pr-1">All Medicines</span>
              <span id="count-all" class="text-[10px] font-black bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-md tabular-nums">${totalCount.toLocaleString()}</span>
            </button>
            ${this.categories.map(c => `
              <button onclick="MasterDB.switchTab('${c.id}')" id="tab-${c.id}" class="db-tab group w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center text-xs ${this.currentCategory === c.id ? 'bg-white shadow-xs border border-slate-200 text-slate-900 font-black' : 'text-slate-600 hover:bg-slate-100 font-bold'}">
                <span class="truncate pr-1">${c.label}</span>
                <span id="count-${c.id}" class="text-[10px] font-black bg-slate-200/60 text-slate-600 px-1.5 py-0.2 rounded-md tabular-nums">${(c.count || 0).toLocaleString()}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Medicine Table & Pagination Area -->
        <div class="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <div class="flex-1 p-0 overflow-auto relative custom-scrollbar bg-white">
            <table class="w-full text-xs text-left border-b border-slate-200">
              <thead class="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[11px] font-black tracking-wider sticky top-0 z-10 shadow-xs" id="db-thead">
                <tr>
                  <th class="px-2 py-2 text-center w-10 border-r border-slate-200">#</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-center w-24">Med Code</th>
                  <th class="px-3 py-2 border-r border-slate-200 min-w-[200px]">Medicine Name / Brand / Generic</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-center">Form</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-center">Strength</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-center">Packing</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-center">Category</th>
                  <th class="px-2 py-2 text-center border-r border-slate-200">Expiry</th>
                  <th class="px-2 py-2 text-center border-r border-slate-200">Shelf/Rack</th>
                  <th class="px-2 py-2 text-center border-r border-slate-200 text-teal-800 bg-teal-50/50">Stock</th>
                  <th class="px-2 py-2 text-right border-r border-slate-200 text-rose-700 bg-rose-50/40">TP (Cost)</th>
                  <th class="px-2 py-2 text-right border-r border-slate-200 text-emerald-700 bg-emerald-50/40">MRP (Retail)</th>
                  <th class="px-2 py-2 text-right border-r border-slate-200 text-teal-700 bg-teal-50/40">Margin</th>
                  <th class="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="db-tbody" class="divide-y divide-slate-100 bg-white">
                <!-- Injected dynamically -->
              </tbody>
            </table>
          </div>

          <!-- Fixed Bottom Total Value Bar (Compact & Responsive for all screen sizes) -->
          <div class="border-t border-slate-200 bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar select-none shrink-0" id="db-fixed-footer-bar">
            <!-- Left: Scope Badge -->
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                <i data-lucide="calculator" class="w-3 h-3 text-teal-400"></i> TOTALS
              </span>
              <span class="text-[10.5px] font-bold text-slate-300 uppercase tracking-wide truncate max-w-[120px] lg:max-w-[180px]" id="db-stat-scope">ALL MEDICINES</span>
            </div>

            <!-- Right: Compact Metrics Pills -->
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0 tabular-nums text-xs">
              <!-- Items -->
              <div class="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                <span class="text-[9.5px] font-bold uppercase text-slate-400">Items:</span>
                <span class="text-[11px] font-black text-white" id="db-stat-items">0</span>
              </div>

              <!-- Stock Qty -->
              <div class="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                <span class="text-[9.5px] font-bold uppercase text-teal-400">Stock:</span>
                <span class="text-[11px] font-black text-teal-300" id="db-stat-stock">0</span>
              </div>

              <!-- Total Cost (TP) -->
              <div class="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                <span class="text-[9.5px] font-bold uppercase text-rose-400">Cost:</span>
                <span class="text-[11px] font-black text-rose-300" id="db-stat-cost">Rs. 0</span>
              </div>

              <!-- Total Retail (MRP) -->
              <div class="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                <span class="text-[9.5px] font-bold uppercase text-emerald-400">Retail:</span>
                <span class="text-[11px] font-black text-emerald-300" id="db-stat-retail">Rs. 0</span>
              </div>

              <!-- Potential Margin -->
              <div class="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                <span class="text-[9.5px] font-bold uppercase text-amber-400">Margin:</span>
                <span class="text-[11px] font-black text-amber-300" id="db-stat-margin">+Rs. 0 (0%)</span>
              </div>
            </div>
          </div>

          <!-- Bottom Pagination Controls Bar -->
          <div class="border-t border-slate-200 bg-slate-50/90 px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-xs select-none shrink-0 backdrop-blur-xs">
            <div class="flex items-center gap-3">
              <span class="text-slate-600 font-bold text-[11px]" id="db-pagination-info">Loading medicines...</span>
              <div class="flex items-center gap-1.5 pl-2.5 border-l border-slate-200">
                <span class="text-[10.5px] font-bold text-slate-400">Rows:</span>
                <select id="db-page-size" onchange="MasterDB.changePageSize(this.value)" class="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="50" selected>50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-1.5" id="db-pagination-controls">
              <!-- Pagination buttons -->
            </div>
          </div>
        </div>
      </div>

      <!-- Add / Edit Medicine Modal -->
      <div id="db-modal" onclick="if(event.target === this) MasterDB.closeForm()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md transition-opacity opacity-0 no-print">
        <div class="bg-white rounded-2xl shadow-2xl p-5 max-w-3xl w-full mx-4 transform transition-all scale-95 max-h-[92vh] overflow-y-auto custom-scrollbar" id="db-card">
          <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <i data-lucide="pill" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-base font-black text-slate-800" id="db-modal-title">Add Medicine</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Formula, Packaging, Pricing & Inventory</p>
              </div>
            </div>
            <button onclick="MasterDB.closeForm()" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <form id="db-form" onsubmit="MasterDB.saveForm(event)" class="space-y-3.5">
            <input type="hidden" id="db-id">
            
            <!-- SECTION 1: MEDICINE IDENTITY (From Excel Sheet) -->
            <div class="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-teal-800 uppercase tracking-wider flex items-center gap-1">
                  <i data-lucide="file-text" class="w-3 h-3 text-teal-600"></i> Medicine Identification (Excel Fields)
                </span>
                <span class="text-[9.5px] font-bold text-slate-400">Core Details</span>
              </div>

              <!-- Row 1: medicine_name & brand_name -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Medicine Name (medicine_name) *</label>
                  <input type="text" id="db-field-medicine_name" required oninput="MasterDB.onMedicineNameInput(this.value)" placeholder="e.g. FAMORJINE, AUGMENTIN" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Brand Name (brand_name) *</label>
                  <input type="text" id="db-field-brand_name" required placeholder="e.g. FAMORJINE, AUGMENTIN" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
              </div>

              <!-- Row 2: generic_name & company_name -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Generic Name / Salt (generic_name) *</label>
                  <input type="text" id="db-field-generic_name" required placeholder="e.g. Famotidine, Paracetamol" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Company / Manufacturer (company_name) *</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <select id="db-company" onchange="MasterDB.onCompanySelect(this.value)" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                      <option value="">Select Company</option>
                    </select>
                    <input type="text" id="db-field-company_name" placeholder="Or Type Company Name" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 2: FORMULATION, PACKING & CATEGORY (From Excel Sheet) -->
            <div class="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                  <i data-lucide="layers" class="w-3 h-3 text-indigo-600"></i> Formulation & Classification (Excel Fields)
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Dosage Form (dosage_form) *</label>
                  <input type="text" id="db-field-dosage_form" list="dosage-form-list" required placeholder="Tabs, Caps, Inj..." class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                  <datalist id="dosage-form-list">
                    <option value="Tabs">
                    <option value="Caps">
                    <option value="Syrup">
                    <option value="Suspension">
                    <option value="Inj">
                    <option value="Inf">
                    <option value="Drops">
                    <option value="Eye Drops">
                    <option value="Ear Drops">
                    <option value="Cream">
                    <option value="Ointment">
                    <option value="Facewash">
                    <option value="Soap">
                    <option value="Liquid">
                    <option value="Inhaler">
                    <option value="Nasal Drop">
                    <option value="Nasal Spray">
                    <option value="Shampoo">
                    <option value="Sachet">
                    <option value="Topical">
                    <option value="Vaginal">
                  </datalist>
                </div>

                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Strength (strength)</label>
                  <input type="text" id="db-field-strength" placeholder="e.g. 40mg, 200mg, 5ml" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>

                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Packing (packing)</label>
                  <input type="text" id="db-field-packing" placeholder="e.g. 10s, 20s, 30s, Vial" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>

                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Category Code (category)</label>
                  <input type="text" id="db-field-category_code" placeholder="e.g. 17.1.2, 6.2.2.2, 25.4" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
              </div>
            </div>

            <!-- SECTION 3: PRICING (From Excel Sheet) -->
            <div class="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <i data-lucide="dollar-sign" class="w-3 h-3 text-emerald-600"></i> Pricing & Margins (Excel Fields)
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-black text-rose-700 uppercase mb-1">Trade Price (trade_price / TP) *</label>
                  <input type="number" id="db-cost" min="0" step="any" required placeholder="0" oninput="MasterDB.updateFormProfits()" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
                <div>
                  <label class="block text-[11px] font-black text-emerald-700 uppercase mb-1">Retail Price (retail_price / MRP) *</label>
                  <input type="number" id="db-retail" min="0" step="any" required placeholder="0" oninput="MasterDB.updateFormProfits()" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
                <div>
                  <label class="block text-[11px] font-black text-teal-800 uppercase mb-1">Profit & Margin Preview</label>
                  <input type="text" id="db-retail-profit" readonly tabindex="-1" placeholder="Rs. 0 (0%)" class="w-full border border-slate-200 bg-white rounded-xl p-2 font-bold text-slate-500 text-xs outline-none cursor-default">
                </div>
              </div>
            </div>

            <!-- SECTION 4: INVENTORY & PHARMACY OPERATIONS -->
            <div class="bg-slate-50/70 p-3 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <i data-lucide="archive" class="w-3 h-3 text-amber-600"></i> Inventory & Stock Details
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div class="flex justify-between items-center mb-1">
                    <label class="block text-[11px] font-black text-slate-700 uppercase">Medicine Code</label>
                    <button type="button" onclick="MasterDB.autoGenerateCode()" class="text-[10px] font-bold text-teal-600 hover:text-teal-700 underline cursor-pointer">Auto Gen</button>
                  </div>
                  <div class="relative">
                    <i data-lucide="barcode" class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input type="text" id="db-field-medicine_code" placeholder="e.g. MED-001 or Barcode" class="w-full bg-white border border-slate-200 rounded-xl p-2 pl-8 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-black text-teal-800 uppercase mb-1">Current Stock (Packs/Units)</label>
                  <input type="number" id="db-stock" min="0" step="1" placeholder="0" class="w-full bg-teal-50/50 border border-teal-300 rounded-xl p-2 text-xs font-black text-teal-900 focus:border-teal-500 outline-none text-center">
                </div>

                <div>
                  <label class="block text-[11px] font-black text-rose-700 uppercase mb-1">Min Reorder Alert Level</label>
                  <input type="number" id="db-field-min_stock_level" min="1" step="1" value="5" placeholder="5" class="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-2 text-xs font-black text-rose-800 focus:border-rose-400 outline-none text-center">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Expiry Date</label>
                  <input type="date" id="db-field-expiry_date" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none cursor-pointer">
                </div>
                <div>
                  <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Shelf / Rack Location</label>
                  <input type="text" id="db-field-rack_shelf" placeholder="e.g. Rack A-1, Fridge Shelf 2" class="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:border-teal-500 outline-none">
                </div>
              </div>
            </div>

            <div class="pt-3 flex justify-between gap-3 border-t border-slate-100">
              <button type="button" onclick="MasterDB.closeForm()" class="px-5 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs transition-all">Cancel</button>
              <div class="flex gap-2">
                <button type="submit" class="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer">
                  <i data-lucide="save" class="w-4 h-4"></i> Save Medicine
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Quick Add Stock Modal -->
      <div id="add-stock-modal" onclick="if(event.target === this) MasterDB.closeAddStockModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md transition-opacity opacity-0 no-print">
        <div class="bg-white rounded-2xl shadow-2xl p-5 max-w-md w-full mx-4 transform transition-all scale-95" id="add-stock-card">
          <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5">
            <div>
              <h3 class="text-base font-black text-slate-800" id="add-stock-modal-title">Add Stock</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5" id="add-stock-item-subtitle"></p>
            </div>
            <button onclick="MasterDB.closeAddStockModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>

          <form id="add-stock-form" onsubmit="MasterDB.saveAddStock(event)" class="space-y-3">
            <input type="hidden" id="add-stock-item-id">
            
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span class="text-[9.5px] font-black text-slate-400 uppercase block">Current Stock</span>
                <span class="text-xs font-bold text-slate-800" id="add-stock-current-val">0</span>
              </div>
              <div class="text-right">
                <span class="text-[9.5px] font-black text-teal-600 uppercase block">New Total Stock</span>
                <span class="text-xs font-black text-teal-700" id="add-stock-new-val">0</span>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-black text-slate-700 uppercase mb-1">Add Packs / Units *</label>
              <input type="number" id="add-stock-qty" min="1" step="1" placeholder="Quantity count" required oninput="MasterDB.calcAddStockTotal()" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-black text-center text-teal-800 text-sm focus:bg-white focus:border-teal-500 outline-none">
            </div>

            <div>
              <label class="block text-[10px] font-black text-slate-700 uppercase mb-1">New Expiry Date</label>
              <input type="date" id="add-stock-expiry" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 outline-none cursor-pointer">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-black text-rose-700 uppercase mb-1">Trade Price (Cost / TP)</label>
                <input type="number" id="add-stock-cost" min="0" step="any" placeholder="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 outline-none">
              </div>
              <div>
                <label class="block text-[10px] font-black text-emerald-700 uppercase mb-1">Retail Price (MRP)</label>
                <input type="number" id="add-stock-retail-sale" min="0" step="any" placeholder="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 outline-none">
              </div>
            </div>

            <div class="pt-2 flex justify-between gap-2 border-t border-slate-100">
              <button type="button" onclick="MasterDB.closeAddStockModal()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs">Cancel</button>
              <button type="submit" class="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs shadow-md transition-all">Update Stock</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Categories & Forms Manager Modal -->
      <div id="categories-modal" onclick="if(event.target === this) MasterDB.closeCategoriesModal()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md transition-opacity opacity-0 no-print">
        <div class="bg-white rounded-2xl shadow-2xl p-5 max-w-md w-full mx-4 transform transition-all scale-95" id="cat-card">
          <div class="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5">
            <h3 class="text-base font-black text-slate-800">Medicine Forms & Categories</h3>
            <button onclick="MasterDB.closeCategoriesModal()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>

          <div>
            <div class="flex gap-2 mb-3">
              <input type="text" id="new-cat-name" placeholder="New category label..." onkeydown="if(event.key==='Enter') MasterDB.addNewCategory()" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:border-teal-500">
              <button onclick="MasterDB.addNewCategory()" class="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer">Add</button>
            </div>
            <div class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar" id="cat-list"></div>
          </div>

          <div class="pt-3 border-t border-slate-100 flex justify-end">
            <button onclick="MasterDB.closeCategoriesModal()" class="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold text-xs">Done</button>
          </div>
        </div>
      </div>
    `;

    try {
      await this.loadData();
    } catch(e) {
      console.error(e);
    }
    if (window.lucide) lucide.createIcons();
  },

  async switchTab(id) {
    this.currentCategory = id;
    this.currentPage = 1;
    document.querySelectorAll('.db-tab').forEach(btn => {
      if (btn.id === `tab-${id}`) {
        btn.className = 'db-tab group w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center text-xs bg-white shadow-xs border border-slate-200 text-slate-900 font-black';
      } else {
        btn.className = 'db-tab group w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center text-xs text-slate-600 hover:bg-slate-100 font-bold';
      }
    });

    await this.fetchAndRenderPage();
  },

  async loadData() {
    this.companies = await window.api.getCompanies() || [];
    await this.refreshCategoryCounts();
    await this.fetchAndRenderPage();
  },

  async refreshCategoryCounts() {
    const stats = await window.api.getCategoryStats();
    let totalCount = 0;
    (stats || []).forEach(s => {
      totalCount += (s.count || 0);
      const cat = this.categories.find(c => c.id === s.slug);
      if (cat) {
        cat.count = s.count;
        const countSpan = document.getElementById(`count-${s.slug}`);
        if (countSpan) countSpan.textContent = (s.count || 0).toLocaleString();
      }
    });
    const countAllSpan = document.getElementById('count-all');
    if (countAllSpan) countAllSpan.textContent = totalCount.toLocaleString();
  },

  onSearchInput() {
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.fetchAndRenderPage();
    }, 180);
    this.updateClearButton();
  },

  applySearch() {
    this.onSearchInput();
  },

  updateClearButton() {
    const btn = document.getElementById('db-clear-filters-btn');
    if (!btn) return;
    const searchVal = document.getElementById('db-search')?.value || '';
    const lowStockVal = document.getElementById('db-low-stock-filter')?.value || '';
    const expiryDaysVal = document.getElementById('db-expiry-days-filter')?.value || '';
    const isDefault = (searchVal === '' && lowStockVal === '' && expiryDaysVal === '');
    btn.classList.toggle('hidden', isDefault);
    if (window.lucide) lucide.createIcons();
  },

  resetFilters() {
    const search = document.getElementById('db-search');
    const low = document.getElementById('db-low-stock-filter');
    const exp = document.getElementById('db-expiry-days-filter');
    if (search) search.value = '';
    if (low) low.value = '';
    if (exp) exp.value = '';
    this.currentPage = 1;
    this.fetchAndRenderPage();
    this.updateClearButton();
  },

  async fetchAndRenderPage() {
    const query = (document.getElementById('db-search')?.value || '').trim();
    const lowStockVal = document.getElementById('db-low-stock-filter')?.value;
    const expiryDaysVal = document.getElementById('db-expiry-days-filter')?.value;

    const tbody = document.getElementById('db-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="14" class="px-4 py-8 text-center text-slate-400 font-medium text-xs"><div class="flex items-center justify-center gap-2"><div class="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div> Loading medicines...</div></td></tr>`;
    }

    try {
      const res = await window.api.getPaginatedProducts({
        category: this.currentCategory,
        query: query,
        lowStock: lowStockVal,
        expiryDays: expiryDaysVal,
        page: this.currentPage,
        pageSize: this.pageSize
      });

      this.currentItems = (res && res.items) || [];
      this.totalItemsCount = (res && res.totalCount) || 0;
      this.totalStockCount = (res && res.totalStock) || 0;
      this.totalCostValue = (res && res.totalCostValue) || 0;
      this.totalRetailValue = (res && res.totalRetailValue) || 0;
      this.totalPages = Math.max(1, (res && res.totalPages) || 1);
      this.currentPage = (res && res.page) || 1;

      this.renderTableBody(this.currentItems);
      this.renderPaginationControls();
      this.renderTotalsFooter();
    } catch(err) {
      console.error('Failed to fetch paginated products:', err);
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="14" class="px-4 py-8 text-center text-rose-500 font-medium text-xs">Error loading data. Please try again.</td></tr>`;
      }
    }
  },

  renderTotalsFooter() {
    const cat = this.categories.find(c => c.id === this.currentCategory);
    let scopeLabel = cat ? cat.label : (this.currentCategory === 'all' ? 'All Medicines' : 'Medicines');

    const query = (document.getElementById('db-search')?.value || '').trim();
    const lowStockVal = document.getElementById('db-low-stock-filter')?.value;
    const expiryDaysVal = document.getElementById('db-expiry-days-filter')?.value;

    const extraTags = [];
    if (query) extraTags.push(`"${query}"`);
    if (lowStockVal) extraTags.push(`Stock ≤ ${lowStockVal}`);
    if (expiryDaysVal) extraTags.push(`Exp ≤ ${expiryDaysVal}d`);
    if (extraTags.length > 0) scopeLabel += ` (${extraTags.join(', ')})`;

    const formatRupees = (val) => 'Rs. ' + Math.round(Number(val) || 0).toLocaleString('en-IN');

    const itemsStr = (this.totalItemsCount || 0).toLocaleString();
    const stockStr = (this.totalStockCount || 0).toLocaleString();
    const costStr = formatRupees(this.totalCostValue || 0);
    const retailStr = formatRupees(this.totalRetailValue || 0);

    const profit = (this.totalRetailValue || 0) - (this.totalCostValue || 0);
    const profitSign = profit >= 0 ? '+' : '-';
    const marginPct = (this.totalRetailValue || 0) > 0 
      ? ((profit / this.totalRetailValue) * 100).toFixed(1) 
      : '0.0';
    const marginStr = `${profitSign}${formatRupees(Math.abs(profit))} (${marginPct}%)`;

    // Update Fixed Bottom Bar
    const statScope = document.getElementById('db-stat-scope');
    if (statScope) statScope.textContent = scopeLabel.toUpperCase();

    const statItems = document.getElementById('db-stat-items');
    if (statItems) statItems.textContent = itemsStr;

    const statStock = document.getElementById('db-stat-stock');
    if (statStock) statStock.textContent = stockStr;

    const statCost = document.getElementById('db-stat-cost');
    if (statCost) statCost.textContent = costStr;

    const statRetail = document.getElementById('db-stat-retail');
    if (statRetail) statRetail.textContent = retailStr;

    const statMargin = document.getElementById('db-stat-margin');
    if (statMargin) statMargin.textContent = marginStr;

    if (window.lucide) lucide.createIcons();
  },

  goToPage(pageNum) {
    pageNum = parseInt(pageNum, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > this.totalPages || pageNum === this.currentPage) return;
    this.currentPage = pageNum;
    this.fetchAndRenderPage();
  },

  changePageSize(newSize) {
    this.pageSize = parseInt(newSize, 10) || 50;
    this.currentPage = 1;
    this.fetchAndRenderPage();
  },

  renderPaginationControls() {
    const infoEl = document.getElementById('db-pagination-info');
    const controlsEl = document.getElementById('db-pagination-controls');
    if (!infoEl || !controlsEl) return;

    const startIdx = this.totalItemsCount === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const endIdx = Math.min(this.currentPage * this.pageSize, this.totalItemsCount);

    infoEl.innerHTML = `Showing <span class="text-slate-900 font-black">${startIdx.toLocaleString()}-${endIdx.toLocaleString()}</span> of <span class="text-slate-900 font-black">${this.totalItemsCount.toLocaleString()}</span> medicines <span class="text-slate-400 font-medium">(Page ${this.currentPage} of ${this.totalPages})</span>`;

    let html = '';

    const isFirst = this.currentPage <= 1;
    const isLast = this.currentPage >= this.totalPages;

    // First & Previous buttons
    html += `
      <button onclick="MasterDB.goToPage(1)" ${isFirst ? 'disabled class="h-7.5 px-2 rounded-lg bg-slate-100 text-slate-300 text-xs font-bold cursor-not-allowed"' : 'class="h-7.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer active:scale-95 transition-all"'} title="First Page">
        <i data-lucide="chevrons-left" class="w-3.5 h-3.5"></i>
      </button>
      <button onclick="MasterDB.goToPage(${this.currentPage - 1})" ${isFirst ? 'disabled class="h-7.5 px-2 rounded-lg bg-slate-100 text-slate-300 text-xs font-bold cursor-not-allowed"' : 'class="h-7.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer active:scale-95 transition-all"'} title="Previous Page">
        <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
      </button>
    `;

    // Dynamic numeric buttons window
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, this.currentPage + 2);

    if (startPage > 1) {
      html += `<button onclick="MasterDB.goToPage(1)" class="h-7.5 min-w-[28px] px-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer transition-all">1</button>`;
      if (startPage > 2) {
        html += `<span class="px-0.5 text-slate-400 font-bold text-xs">...</span>`;
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      if (p === this.currentPage) {
        html += `<button class="h-7.5 min-w-[28px] px-1.5 rounded-lg bg-teal-600 text-white text-xs font-black shadow-xs cursor-default">${p}</button>`;
      } else {
        html += `<button onclick="MasterDB.goToPage(${p})" class="h-7.5 min-w-[28px] px-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer transition-all active:scale-95">${p}</button>`;
      }
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        html += `<span class="px-0.5 text-slate-400 font-bold text-xs">...</span>`;
      }
      html += `<button onclick="MasterDB.goToPage(${this.totalPages})" class="h-7.5 min-w-[28px] px-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer transition-all">${this.totalPages}</button>`;
    }

    // Next & Last buttons
    html += `
      <button onclick="MasterDB.goToPage(${this.currentPage + 1})" ${isLast ? 'disabled class="h-7.5 px-2 rounded-lg bg-slate-100 text-slate-300 text-xs font-bold cursor-not-allowed"' : 'class="h-7.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer active:scale-95 transition-all"'} title="Next Page">
        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
      </button>
      <button onclick="MasterDB.goToPage(${this.totalPages})" ${isLast ? 'disabled class="h-7.5 px-2 rounded-lg bg-slate-100 text-slate-300 text-xs font-bold cursor-not-allowed"' : 'class="h-7.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer active:scale-95 transition-all"'} title="Last Page">
        <i data-lucide="chevrons-right" class="w-3.5 h-3.5"></i>
      </button>
    `;

    // Jump to page input
    html += `
      <div class="flex items-center gap-1 pl-2 border-l border-slate-200 ml-1">
        <span class="text-[10px] font-bold text-slate-400">Go:</span>
        <input type="number" min="1" max="${this.totalPages}" placeholder="${this.currentPage}" 
          onkeydown="if(event.key==='Enter'){MasterDB.goToPage(this.value); this.value='';}" 
          class="w-12 h-7 bg-white border border-slate-200 rounded-lg text-center text-xs font-bold text-slate-800 outline-none focus:border-teal-500 shadow-2xs">
      </div>
    `;

    controlsEl.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  renderTableBody(list) {
    const tbody = document.getElementById('db-tbody');
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="14" class="px-4 py-8 text-center text-slate-400 italic font-medium text-xs">No medicines found matching your search.</td></tr>`;
      return;
    }

    const today = new Date();
    const startIdx = (this.currentPage - 1) * this.pageSize;

    tbody.innerHTML = list.map((p, index) => {
      const tp = p.trade_price ?? p.cost_price ?? 0;
      const rp = p.retail_price || 0;
      const profit = rp - tp;
      const margin = rp > 0 ? ((profit / rp) * 100).toFixed(1) : 0;
      const displayName = p.medicine_name || p.item_name || 'Unnamed Medicine';
      const brandName = p.brand_name || '';
      
      let expBadge = `<span class="text-slate-600 font-bold">${p.expiry_date || '-'}</span>`;
      if (p.expiry_date) {
        const exp = new Date(p.expiry_date);
        if (!isNaN(exp)) {
          const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
          if (diffDays <= 0) {
            expBadge = `<span class="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black text-[10px]" title="Expired">EXP (${p.expiry_date})</span>`;
          } else if (diffDays <= 90) {
            expBadge = `<span class="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black text-[10px]" title="${diffDays} days left">${p.expiry_date}</span>`;
          }
        }
      }

      const isLowStock = (p.current_stock || 0) <= (p.min_stock_level || 5);

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
          <td class="px-2 py-1.5 border-r border-slate-100 text-center font-bold text-slate-400 tabular-nums">${startIdx + index + 1}</td>
          
          <!-- Medicine Code -->
          <td class="px-2.5 py-1.5 border-r border-slate-100 text-center">
            <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10.5px] border border-slate-200 shadow-2xs">${p.medicine_code || '-'}</span>
          </td>

          <!-- Medicine Name + Brand + Generic Formula -->
          <td class="px-3 py-1.5 border-r border-slate-100 min-w-[200px]">
            <div class="font-black text-slate-900 leading-tight">${displayName} ${brandName && brandName !== displayName ? `<span class="text-slate-500 font-semibold text-[11px]">(${brandName})</span>` : ''}</div>
            ${p.generic_name ? `<div class="text-[10.5px] font-bold text-teal-600 mt-0.5">${p.generic_name}</div>` : ''}
            ${p.company_name ? `<div class="text-[9.5px] font-semibold text-slate-400 mt-0.5">${p.company_name}</div>` : ''}
          </td>

          <!-- Dosage Form -->
          <td class="px-2.5 py-1.5 border-r border-slate-100 text-center">
            <span class="inline-block px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold text-[10.5px] border border-teal-200">${p.dosage_form || '-'}</span>
          </td>

          <!-- Strength -->
          <td class="px-2.5 py-1.5 border-r border-slate-100 text-center text-slate-700 font-bold text-[10.5px]">
            ${p.strength || '-'}
          </td>

          <!-- Packing -->
          <td class="px-2.5 py-1.5 border-r border-slate-100 text-center text-slate-600 font-bold text-[10.5px]">
            ${p.packing || '-'}
          </td>

          <!-- Category Code -->
          <td class="px-2.5 py-1.5 border-r border-slate-100 text-center text-slate-600 font-bold text-[10.5px]">
            ${p.category ? `<span class="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-black border border-indigo-200">${p.category}</span>` : '-'}
          </td>

          <!-- Expiry -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-center text-[10.5px]">
            ${expBadge}
          </td>

          <!-- Shelf/Rack -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-center text-slate-600 text-[10.5px] font-bold">
            ${p.rack_shelf || '-'}
          </td>

          <!-- Stock -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-center">
            <span class="inline-block px-2 py-0.5 rounded-lg text-xs font-black ${isLowStock ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-teal-50 text-teal-800 border border-teal-200'}">
              ${p.current_stock || 0}
            </span>
          </td>

          <!-- TP Cost -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-right font-display font-bold text-rose-700 text-[11.5px] tabular-nums">
            ${app.formatNumber(tp)}
          </td>

          <!-- MRP Retail -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-right font-display font-black text-emerald-700 text-[11.5px] tabular-nums">
            ${app.formatNumber(rp)}
          </td>

          <!-- Profit Margin -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-right font-display font-bold text-teal-800 text-[11px] tabular-nums">
            +${app.formatNumber(profit)} <span class="text-[9.5px] text-slate-400">(${margin}%)</span>
          </td>

          <!-- Actions -->
          <td class="px-2 py-1.5 text-right font-medium">
            <div class="flex items-center justify-end gap-1">
              <button onclick="MasterDB.openAddStockModal(${p.id}, '${p.slug || this.currentCategory}')" class="p-1 text-teal-600 hover:bg-teal-50 rounded transition-colors" title="Quick Add Stock">
                <i data-lucide="package-plus" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="MasterDB.toggleFavorite('${p.slug || this.currentCategory}', ${p.id})" class="p-1 ${p.is_favorite ? 'text-amber-500 fill-current' : 'text-slate-300 hover:text-amber-500'} rounded transition-colors" title="Favorite">
                <i data-lucide="star" class="w-3.5 h-3.5 ${p.is_favorite ? 'fill-current' : ''}"></i>
              </button>
              <button onclick="MasterDB.openForm(${p.id}, '${p.slug || this.currentCategory}')" class="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Medicine">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="MasterDB.deleteItem(${p.id}, '${p.slug || this.currentCategory}')" class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Medicine">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  onMedicineNameInput(val) {
    const brandInput = document.getElementById('db-field-brand_name');
    if (brandInput && (!this._brandManuallyEdited || !brandInput.value)) {
      brandInput.value = val;
    }
  },

  onCompanySelect(compVal) {
    const compInput = document.getElementById('db-field-company_name');
    if (compVal) {
      const comp = (this.companies || []).find(c => c.id == compVal);
      if (comp && compInput) {
        compInput.value = comp.name;
      }
    }
  },

  autoGenerateCode() {
    const catSlug = this._editingCatSlug || this.currentCategory;
    const prefix = (catSlug !== 'all' ? catSlug : 'med').substring(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    const code = `MED-${prefix}-${rand}`;
    const codeInput = document.getElementById('db-field-medicine_code');
    if (codeInput) codeInput.value = code;
  },

  openForm(dataOrId = null, catSlug = null) {
    let data = dataOrId;
    if (typeof dataOrId === 'number' || typeof dataOrId === 'string') {
      data = (this.currentItems || []).find(p => p.id == dataOrId) || null;
    }
    
    this._editingCatSlug = catSlug || (data ? (data.slug || this.currentCategory) : this.currentCategory);
    this._brandManuallyEdited = !!(data && data.brand_name && data.brand_name !== (data.medicine_name || data.item_name));

    document.getElementById('db-modal-title').textContent = data ? 'Edit Medicine' : 'Add New Medicine';
    document.getElementById('db-id').value = data ? data.id : '';
    
    // Set Medicine Code or Auto-generate
    const codeInput = document.getElementById('db-field-medicine_code');
    if (data && data.medicine_code) {
      codeInput.value = data.medicine_code;
    } else {
      const prefix = (this._editingCatSlug && this._editingCatSlug !== 'all' ? this._editingCatSlug : 'med').substring(0, 3).toUpperCase();
      const rand = Math.floor(100 + Math.random() * 900);
      codeInput.value = `MED-${prefix}-${rand}`;
    }

    // Core Excel Fields
    const medName = data ? (data.medicine_name || data.item_name || '') : '';
    document.getElementById('db-field-medicine_name').value = medName;
    document.getElementById('db-field-brand_name').value = data ? (data.brand_name || medName) : '';
    document.getElementById('db-field-generic_name').value = data ? (data.generic_name || '') : '';
    
    // Dosage form, strength, packing, category code
    const formInput = document.getElementById('db-field-dosage_form');
    if (formInput) {
      formInput.value = data ? (data.dosage_form || '') : (this._editingCatSlug && this._editingCatSlug !== 'all' ? (this.categories.find(c => c.id === this._editingCatSlug)?.label || '') : '');
    }
    document.getElementById('db-field-strength').value = data ? (data.strength || '') : '';
    document.getElementById('db-field-packing').value = data ? (data.packing || '') : '';
    document.getElementById('db-field-category_code').value = data ? (data.category || '') : '';
    
    // Company selection
    const companySelect = document.getElementById('db-company');
    companySelect.innerHTML = '<option value="">Select Company</option>' + 
      (this.companies || []).map(c => `
        <option value="${c.id}" ${data && data.company_id === c.id ? 'selected' : ''}>${c.name}</option>
      `).join('');
    document.getElementById('db-field-company_name').value = data ? (data.company_name || '') : '';

    // Pricing
    document.getElementById('db-cost').value = data ? (data.trade_price ?? data.cost_price ?? '') : '';
    document.getElementById('db-retail').value = data ? (data.retail_price || '') : '';

    // Inventory
    document.getElementById('db-field-expiry_date').value = data ? (data.expiry_date || '') : '';
    document.getElementById('db-field-rack_shelf').value = data ? (data.rack_shelf || '') : '';
    document.getElementById('db-stock').value = data ? (data.current_stock ?? 0) : '';
    document.getElementById('db-field-min_stock_level').value = data ? (data.min_stock_level || 5) : 5;

    this.updateFormProfits();

    const modal = document.getElementById('db-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      document.getElementById('db-card').classList.remove('scale-95');
    }, 10);
    if (window.lucide) lucide.createIcons();
  },

  updateFormProfits() {
    const cost = parseFloat(document.getElementById('db-cost')?.value) || 0;
    const retail = parseFloat(document.getElementById('db-retail')?.value) || 0;
    const profit = retail - cost;
    const margin = retail > 0 ? ((profit / retail) * 100).toFixed(1) : 0;
    const profitEl = document.getElementById('db-retail-profit');
    if (profitEl) {
      if (profit >= 0) {
        profitEl.value = `Rs. ${profit.toFixed(2)} (${margin}%)`;
        profitEl.className = 'w-full border border-emerald-300 bg-emerald-50 rounded-xl p-2 font-bold text-emerald-800 text-xs outline-none';
      } else {
        profitEl.value = `-Rs. ${Math.abs(profit).toFixed(2)} (${margin}%)`;
        profitEl.className = 'w-full border border-rose-300 bg-rose-50 rounded-xl p-2 font-bold text-rose-800 text-xs outline-none';
      }
    }
  },

  closeForm() {
    const modal = document.getElementById('db-modal');
    modal.classList.add('opacity-0');
    document.getElementById('db-card').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 200);
  },

  async saveForm(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('db-id').value;
    
    const medName = document.getElementById('db-field-medicine_name').value.trim();
    const brandName = (document.getElementById('db-field-brand_name').value.trim()) || medName;
    const genericName = document.getElementById('db-field-generic_name').value.trim();
    const dosageForm = document.getElementById('db-field-dosage_form').value.trim();
    const strength = document.getElementById('db-field-strength').value.trim();
    const packing = document.getElementById('db-field-packing').value.trim();
    const categoryCode = document.getElementById('db-field-category_code').value.trim();
    const costPrice = parseFloat(document.getElementById('db-cost').value) || 0;
    const retailPrice = parseFloat(document.getElementById('db-retail').value) || 0;
    const companyId = parseInt(document.getElementById('db-company').value) || null;
    const customCompanyName = (document.getElementById('db-field-company_name')?.value || '').trim();

    // Map or find matching category slug from dosage form
    let targetCategory = this._editingCatSlug || this.currentCategory;
    if (targetCategory === 'all' || !targetCategory) {
      const matchCat = this.categories.find(c => 
        c.label.toLowerCase() === dosageForm.toLowerCase() ||
        c.id.toLowerCase() === dosageForm.toLowerCase() ||
        c.label.toLowerCase().includes(dosageForm.toLowerCase()) ||
        dosageForm.toLowerCase().includes(c.label.toLowerCase())
      );
      targetCategory = matchCat ? matchCat.id : (this.categories[0]?.id || 'tablet');
    }

    const companyObj = this.companies.find(c => c.id === companyId);
    const finalCompanyName = customCompanyName || (companyObj ? companyObj.name : '');

    // Composite display name
    const itemDisplayName = medName + (strength ? ' ' + strength : '') + (dosageForm ? ' ' + dosageForm : '');

    const data = {
      medicine_code: document.getElementById('db-field-medicine_code').value.trim(),
      medicine_name: medName,
      item_name: itemDisplayName,
      brand_name: brandName,
      generic_name: genericName,
      dosage_form: dosageForm,
      strength: strength,
      packing: packing,
      category: categoryCode,
      company_id: companyId,
      company_name: finalCompanyName,
      batch_no: '',
      expiry_date: document.getElementById('db-field-expiry_date').value,
      rack_shelf: document.getElementById('db-field-rack_shelf').value.trim(),
      unit: packing || 'PACK',
      pieces_per_carton: 1,
      current_stock: parseInt(document.getElementById('db-stock').value) || 0,
      min_stock_level: parseInt(document.getElementById('db-field-min_stock_level').value) || 5,
      trade_price: costPrice,
      cost_price: costPrice,
      retail_price: retailPrice,
      wholesale_cost_price: costPrice,
      wholesale_price: retailPrice,
      description: `${medName} ${strength} ${dosageForm} (${genericName})`
    };

    app.showLoading();
    try {
      if (id) {
        const cat = this._editingCatSlug || (this.currentCategory !== 'all' ? this.currentCategory : targetCategory);
        await window.api.updateProduct(cat, parseInt(id), data);
      } else {
        await window.api.addProduct(targetCategory, data);
        if (targetCategory !== this.currentCategory && this.currentCategory !== 'all') {
          this.currentCategory = targetCategory;
        }
      }
      this.closeForm();
      await this.loadData();
    } catch(err) {
      console.error(err);
      app.showAlert("Error saving medicine: " + err.message);
    } finally {
      app.hideLoading();
    }
  },

  openAddStockModal(itemId, catSlug = null) {
    let item = (this.currentItems || []).find(p => p.id === itemId);
    if (!item) return;
    this._stockItem = { ...item, slug: catSlug || item.slug || this.currentCategory };

    document.getElementById('add-stock-item-id').value = item.id;
    document.getElementById('add-stock-modal-title').textContent = `Add Stock: ${item.item_name}`;
    document.getElementById('add-stock-item-subtitle').textContent = `Code: ${item.medicine_code || '-'} • Rack: ${item.rack_shelf || '-'} • Current: ${item.current_stock || 0}`;
    document.getElementById('add-stock-current-val').textContent = `${item.current_stock || 0}`;
    document.getElementById('add-stock-qty').value = '';
    document.getElementById('add-stock-expiry').value = item.expiry_date || '';
    document.getElementById('add-stock-cost').value = item.cost_price || '';
    document.getElementById('add-stock-retail-sale').value = item.retail_price || '';

    this.calcAddStockTotal();

    const modal = document.getElementById('add-stock-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      document.getElementById('add-stock-card').classList.remove('scale-95');
    }, 10);
    if (window.lucide) lucide.createIcons();
  },

  calcAddStockTotal() {
    const item = this._stockItem;
    const current = item ? (item.current_stock || 0) : 0;
    const add = parseInt(document.getElementById('add-stock-qty')?.value) || 0;
    const newValEl = document.getElementById('add-stock-new-val');
    if (newValEl) newValEl.textContent = `${current + add}`;
  },

  closeAddStockModal() {
    const modal = document.getElementById('add-stock-modal');
    modal.classList.add('opacity-0');
    document.getElementById('add-stock-card').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      this._stockItem = null;
    }, 200);
  },

  async saveAddStock(e) {
    if (e) e.preventDefault();
    const item = this._stockItem;
    if (!item) return;

    const addQty = parseInt(document.getElementById('add-stock-qty')?.value) || 0;
    if (addQty <= 0) return app.showAlert("Please enter quantity to add.");

    const expiry = document.getElementById('add-stock-expiry')?.value || item.expiry_date;
    const cost = parseFloat(document.getElementById('add-stock-cost')?.value) || item.cost_price;
    const retail = parseFloat(document.getElementById('add-stock-retail-sale')?.value) || item.retail_price;

    app.showLoading();
    try {
      const updated = {
        ...item,
        current_stock: (item.current_stock || 0) + addQty,
        expiry_date: expiry,
        cost_price: cost,
        retail_price: retail
      };
      const cat = item.slug || (this.currentCategory !== 'all' ? this.currentCategory : 'tablet');
      await window.api.updateProduct(cat, item.id, updated);
      this.closeAddStockModal();
      await this.loadData();
    } catch(err) {
      console.error(err);
      app.showAlert("Error updating stock.");
    } finally {
      app.hideLoading();
    }
  },

  deleteItem(id, catSlug = null) {
    app.showConfirm({
      title: 'Delete Medicine',
      message: 'Are you sure you want to delete this medicine from the database?',
      confirmText: 'Delete',
      confirmColor: 'red',
      onConfirm: async () => {
        app.showLoading();
        const cat = catSlug || (this.currentCategory !== 'all' ? this.currentCategory : 'tablet');
        await window.api.deleteProduct(cat, id);
        await this.loadData();
        app.hideLoading();
      }
    });
  },

  async toggleFavorite(category, id) {
    const cat = category || (this.currentCategory !== 'all' ? this.currentCategory : 'tablet');
    await window.api.toggleFavorite(cat, id);
    await this.loadData();
  },

  openManageCategoriesModal() {
    this._editingCatId = null;
    this.renderCategoryList();

    const modal = document.getElementById('categories-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      document.getElementById('cat-card').classList.remove('scale-95');
    }, 10);
    if (window.lucide) lucide.createIcons();
  },

  renderCategoryList() {
    const list = document.getElementById('cat-list');
    if (!list) return;

    if (!this.categories || this.categories.length === 0) {
      list.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs italic">No categories found</div>`;
      return;
    }

    const sortedCats = [...this.categories].sort((a, b) => (b.count || 0) - (a.count || 0) || a.label.localeCompare(b.label));

    list.innerHTML = sortedCats.map(c => {
      const isEditing = this._editingCatId === c.id;
      const count = c.count || 0;
      const canDelete = count === 0;

      if (isEditing) {
        return `
          <div class="flex items-center gap-1.5 bg-teal-50/70 p-1.5 rounded-xl border border-teal-300">
            <input type="text" id="cat-rename-input-${c.id}" value="${c.label}" class="flex-1 bg-white border border-teal-400 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-teal-500" onkeydown="if(event.key==='Enter') MasterDB.saveCategoryRename('${c.id}'); if(event.key==='Escape') MasterDB.cancelCategoryRename();">
            <button onclick="MasterDB.saveCategoryRename('${c.id}')" class="p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer" title="Save name">
              <i data-lucide="check" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="MasterDB.cancelCategoryRename()" class="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer" title="Cancel">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
      }

      return `
        <div class="flex justify-between items-center bg-slate-50 hover:bg-slate-100/80 p-2 rounded-xl border border-slate-200/70 text-xs font-bold transition-all group">
          <div class="flex items-center gap-2 truncate">
            <span class="text-slate-800 font-black">${c.label}</span>
            <span class="text-[10px] font-black ${count > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-200/60 text-slate-500'} px-2 py-0.5 rounded-md tabular-nums">${count} ${count === 1 ? 'item' : 'items'}</span>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="MasterDB.startCategoryRename('${c.id}')" class="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Rename category">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            ${canDelete ? `
              <button onclick="MasterDB.deleteCategory('${c.id}', '${c.label}')" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete empty category">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : `
              <span class="p-1 text-slate-300 cursor-not-allowed" title="Cannot delete category containing active items">
                <i data-lucide="lock" class="w-3.5 h-3.5 opacity-40"></i>
              </span>
            `}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  startCategoryRename(id) {
    this._editingCatId = id;
    this.renderCategoryList();
    setTimeout(() => {
      const input = document.getElementById(`cat-rename-input-${id}`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  },

  cancelCategoryRename() {
    this._editingCatId = null;
    this.renderCategoryList();
  },

  async saveCategoryRename(id) {
    const input = document.getElementById(`cat-rename-input-${id}`);
    const newLabel = input ? input.value.trim() : '';
    if (!newLabel) return;

    app.showLoading();
    try {
      await window.api.updateCategoryLabel(id, newLabel);
      this._editingCatId = null;
      await this.refreshCategories();
    } catch(err) {
      console.error(err);
      app.showAlert("Failed to update category: " + err.message);
    } finally {
      app.hideLoading();
    }
  },

  async deleteCategory(id, label) {
    app.showConfirm(`Are you sure you want to delete the category "${label}"?`, async () => {
      app.showLoading();
      try {
        const res = await window.api.deleteCategory(id);
        if (res && res.error) {
          app.showAlert(res.error);
        } else {
          if (this.currentCategory === id) {
            this.currentCategory = 'all';
          }
          await this.refreshCategories();
        }
      } catch(err) {
        console.error(err);
        app.showAlert("Failed to delete category: " + err.message);
      } finally {
        app.hideLoading();
      }
    });
  },

  closeCategoriesModal() {
    this._editingCatId = null;
    const modal = document.getElementById('categories-modal');
    modal.classList.add('opacity-0');
    document.getElementById('cat-card').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 200);
  },

  async addNewCategory() {
    const input = document.getElementById('new-cat-name');
    const label = input ? input.value.trim() : '';
    if (!label) return;

    app.showLoading();
    const res = await window.api.addCategory(label);
    input.value = '';
    app.hideLoading();

    if (res && res.error) {
      app.showAlert(res.error);
    } else {
      await this.refreshCategories();
    }
  },

  async refreshCategories() {
    const stats = await window.api.getCategoryStats();
    this.categories = (stats || []).map(s => ({
      id: s.slug,
      label: s.label,
      count: s.count || 0
    })).sort((a, b) => (b.count || 0) - (a.count || 0) || a.label.localeCompare(b.label));

    // Update categories tab list and select dropdowns on the page
    const sidebarTabs = document.getElementById('sidebar-tabs');
    if (sidebarTabs) {
      const totalCount = this.categories.reduce((acc, cat) => acc + (cat.count || 0), 0);
      sidebarTabs.innerHTML = `
        <button onclick="MasterDB.switchTab('all')" id="tab-all" class="db-tab group w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center text-xs ${this.currentCategory === 'all' ? 'bg-white shadow-xs border border-slate-200 text-slate-900 font-black' : 'text-slate-600 hover:bg-slate-100 font-bold'}">
          <span class="truncate pr-1">All Medicines</span>
          <span id="count-all" class="text-[10px] font-black bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-md tabular-nums">${totalCount.toLocaleString()}</span>
        </button>
        ${this.categories.map(c => `
          <button onclick="MasterDB.switchTab('${c.id}')" id="tab-${c.id}" class="db-tab group w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center text-xs ${this.currentCategory === c.id ? 'bg-white shadow-xs border border-slate-200 text-slate-900 font-black' : 'text-slate-600 hover:bg-slate-100 font-bold'}">
            <span class="truncate pr-1">${c.label}</span>
            <span id="count-${c.id}" class="text-[10px] font-black bg-slate-200/60 text-slate-600 px-1.5 py-0.2 rounded-md tabular-nums">${(c.count || 0).toLocaleString()}</span>
          </button>
        `).join('')}
      `;
    }

    const catCountBadge = document.getElementById('cat-total-badge');
    if (catCountBadge) {
      catCountBadge.textContent = `${this.categories.length} forms`;
    }

    const catSelect = document.getElementById('db-field-category');
    if (catSelect) {
      catSelect.innerHTML = this.categories.map(c => `<option value="${c.id}" ${this.currentCategory === c.id ? 'selected' : ''}>${c.label}</option>`).join('');
    }

    this.renderCategoryList();
    await this.loadData();
  },

  async printStockList() {
    try {
      if (app && app.showLoading) app.showLoading();
      this.settings = await window.api.getSettings();
      const cat = this.categories.find(c => c.id === this.currentCategory);
      const catName = cat ? cat.label : (this.currentCategory === 'all' ? 'All Medicines' : 'Medicines');

      const query = (document.getElementById('db-search')?.value || '').trim();
      const lowStockVal = document.getElementById('db-low-stock-filter')?.value;
      const expiryDaysVal = document.getElementById('db-expiry-days-filter')?.value;

      const res = await window.api.getPaginatedProducts({
        category: this.currentCategory,
        query: query,
        lowStock: lowStockVal,
        expiryDays: expiryDaysVal,
        page: 1,
        pageSize: 2000,
        all: true
      });

      const list = (res && res.items) || [];
      const totalCount = (res && res.totalCount) || list.length;
      const totalStock = list.reduce((sum, item) => sum + (item.current_stock || 0), 0);

      let scopeTag = catName.toUpperCase();
      const extraTags = [];
      if (query) extraTags.push(`"${query.toUpperCase()}"`);
      if (lowStockVal) extraTags.push(`STOCK ≤ ${lowStockVal}`);
      if (expiryDaysVal) extraTags.push(`EXP ≤ ${expiryDaysVal}D`);
      if (extraTags.length > 0) scopeTag += ` • ${extraTags.join(' • ')}`;

      const rows = list.map((item, idx) => {
        const displayName = item.medicine_name || item.item_name || 'Unnamed';
        const code = item.medicine_code ? ` <span style="font-weight: 600; font-size: 9.5px; color: #000;">(${item.medicine_code})</span>` : '';
        return `
        <tr style="border-bottom: 1px solid #000;">
          <td style="padding: 4px 2px; text-align: center; border-right: 1px solid #000; font-weight: 700; color: #000; font-size: 10px;">${idx + 1}</td>
          <td style="padding: 4px 4px; text-align: left; border-right: 1px solid #000;">
            <div style="font-weight: 800; color: #000; font-size: 10.5px; text-transform: uppercase; line-height: 1.25;">
              ${displayName}${code}
            </div>
          </td>
          <td style="padding: 4px 3px; text-align: center; border-right: 1px solid #000; font-weight: 700; color: #000; font-size: 10.5px;">
            ${item.expiry_date || '-'}
          </td>
          <td style="padding: 4px 3px; text-align: center; font-weight: 900; color: #000; font-size: 11px;">
            ${item.current_stock ?? 0}
          </td>
        </tr>
      `;
      }).join('');

      const countDisplay = totalCount > list.length ? `${list.length} of ${totalCount}` : `${list.length}`;

      const html = `
        <div class="receipt-80mm" style="width: 100%; max-width: 380px; margin: 0 auto; padding: 12px 14px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000; box-sizing: border-box; font-size: 11px; line-height: 1.4; border: 1px solid #000;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
            <h1 style="font-size: 19px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000; line-height: 1.2;">${this.settings?.company_name || 'AFRIDI DIAGNOSTIC CENTRE'}</h1>
            <p style="font-size: 10.5px; margin: 3px 0 1px; font-weight: bold; color: #000;">${this.settings?.address || 'Near Babu Hotel, Railway Ground, Taxila'}</p>
            ${this.settings?.phone ? `<p style="font-size: 10px; margin: 1px 0; font-weight: bold; color: #000;">Tel: ${this.settings.phone}</p>` : ''}
            <div style="margin-top: 5px;">
              <span style="display: inline-block; border: 1px solid #000; padding: 1.5px 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; border-radius: 3px; background: #000; color: #fff;">STOCK AUDIT • ${scopeTag}</span>
            </div>
            <p style="margin: 4px 0 0; font-size: 9.5px; color: #000; font-weight: 600;">Generated: ${app.formatDateTime(new Date().toISOString())}</p>
          </div>

          <!-- 4-Column Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1.5px solid #000; color: #000;">
            <thead>
              <tr style="border-bottom: 1.5px solid #000; background: #f8fafc;">
                <th style="padding: 4px 2px; text-align: center; width: 8%; border-right: 1px solid #000; font-weight: 800; font-size: 10px; text-transform: uppercase; color: #000;">#</th>
                <th style="padding: 4px 4px; text-align: left; width: 50%; border-right: 1px solid #000; font-weight: 800; font-size: 10px; text-transform: uppercase; color: #000;">Name</th>
                <th style="padding: 4px 3px; text-align: center; width: 26%; border-right: 1px solid #000; font-weight: 800; font-size: 10px; text-transform: uppercase; color: #000;">Expiry</th>
                <th style="padding: 4px 3px; text-align: center; width: 16%; font-weight: 800; font-size: 10px; text-transform: uppercase; color: #000;">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length > 0 ? rows : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #000; font-style: italic; border: 1px solid #000;">No items found matching filter.</td></tr>`}
            </tbody>
            ${rows.length > 0 ? `
            <tfoot>
              <tr style="border-top: 1.5px solid #000; font-weight: 900; background: #f8fafc;">
                <td colspan="2" style="padding: 5px 4px; border-right: 1px solid #000; text-align: right; font-size: 10px; text-transform: uppercase; color: #000;">
                  Total Items: <span style="font-size: 11px;">${countDisplay}</span>
                </td>
                <td style="padding: 5px 3px; border-right: 1px solid #000; text-align: right; font-size: 10px; text-transform: uppercase; color: #000;">
                  Total Stock:
                </td>
                <td style="padding: 5px 2px; text-align: center; font-size: 11px; color: #000; font-weight: 900;">
                  ${totalStock}
                </td>
              </tr>
            </tfoot>` : ''}
          </table>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px dashed #000; padding-top: 6px; font-size: 9.5px; font-weight: bold; color: #000;">
            <p style="margin: 0;">*** END OF STOCK AUDIT ***</p>
          </div>
        </div>
      `;

      app.setPrintContent('db-print-container', html);
      const previewEl = document.getElementById('preview-paper');
      if (previewEl) {
        previewEl.className = "bg-white shadow-2xl transform origin-top mb-12 w-full max-w-[400px] rounded-lg";
        previewEl.innerHTML = html;
      }
      
      document.getElementById('preview-title').textContent = 'Stock Report Preview';
      document.getElementById('preview-subtitle').textContent = '80MM THERMAL STOCK AUDIT';
      const modal = document.getElementById('preview-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.error('Error generating stock report:', err);
      if (app && app.showAlert) app.showAlert('Failed to generate stock report: ' + err.message);
    } finally {
      if (app && app.hideLoading) app.hideLoading();
    }
  }
};

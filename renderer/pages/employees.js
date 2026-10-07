const Employees = {
  employees: [],
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  paidAmounts: {},

  async render(container) {
    container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-3xl font-bold text-slate-800">Employees</h2>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mr-1 no-print h-9">
            <button onclick="Employees.prevMonth()" class="h-full px-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-r border-slate-100">
              <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
            </button>
            <div class="relative flex items-center h-full">
                <div class="px-3 font-bold text-slate-700 min-w-[130px] text-center text-xs" id="emp-month-display">...</div>
                <button id="emp-reset-btn" onclick="Employees.resetToToday()" class="h-full px-2 hover:bg-rose-50 text-rose-500 transition-colors border-l border-slate-100 hidden" title="Reset to Today">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            </div>
            <button id="btn-next-month" onclick="Employees.nextMonth()" class="h-full px-2.5 hover:bg-slate-50 text-slate-500 transition-colors border-l border-slate-100">
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <button onclick="Employees.openForm()" class="h-9 px-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5 stroke-[2.5]"></i>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div class="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center">
          <div class="relative flex-1 max-w-xs">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" id="emp-search" oninput="Employees.applyFilter()" placeholder="Search staff..." class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent shadow-sm font-medium">
          </div>
          
          <div class="flex items-center gap-4 ml-auto">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
              <select id="emp-filter-status" onchange="Employees.applyFilter()" class="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-accent focus:border-accent block p-2 font-bold shadow-sm">
                <option value="All">All</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sort:</span>
              <select id="emp-sort" onchange="Employees.applyFilter()" class="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg focus:ring-accent focus:border-accent block p-2 font-bold shadow-sm">
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="salary_desc">Salary (High-Low)</option>
                <option value="salary_asc">Salary (Low-High)</option>
                <option value="status_unpaid">Status (Unpaid First)</option>
                <option value="status_paid">Status (Paid First)</option>
              </select>
            </div>
          </div>
          
          <!-- Global Reset -->
          <button id="emp-filter-reset" onclick="Employees.resetFilters()" class="hidden flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all border border-rose-100 ml-4 shrink-0 shadow-sm self-center">
            <i data-lucide="x" class="w-4 h-4"></i>
            Clear Filters
          </button>
        </div>
        <div class="overflow-auto max-h-[calc(100vh-340px)] custom-scrollbar border-b border-slate-100">
          <table class="w-full text-sm text-left border-b border-slate-200">
            <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[11px] font-black tracking-wider sticky top-0 z-10 shadow-sm">
              <tr class="border-b border-slate-200">
                <th class="px-2 py-2 border-r border-slate-200 text-center w-10 bg-slate-50 text-slate-400 font-black text-[13px]">#</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-amber-50 text-amber-700 font-black text-[11px] uppercase tracking-wider">Name & Role</th>
                <th class="px-4 py-2 border-r border-slate-200 bg-indigo-50 text-indigo-700 font-black text-[11px] uppercase tracking-wider">Contact</th>
                <th class="px-4 py-2 border-r border-slate-200 text-right bg-blue-50 text-blue-700 font-black text-[11px] uppercase tracking-wider">Salary</th>
                <th class="px-4 py-2 border-r border-slate-200 text-right bg-emerald-50 text-emerald-700 font-black text-[11px] uppercase tracking-wider">Remaining</th>
                <th class="px-4 py-2 border-r border-slate-200 text-center bg-purple-50 text-purple-700 font-black text-[11px] uppercase tracking-wider">Status</th>
                <th class="px-4 py-2 text-right bg-slate-100 text-slate-700 font-black text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="employees-table-body" class="divide-y divide-slate-200 bg-white">
            </tbody>
          </table>
        </div>
      </div>

      <!-- Form Modal -->
      <div id="emp-modal" onclick="if(event.target === this) Employees.closeForm()" class="fixed inset-0 bg-slate-900/60 hidden items-center justify-center z-[500] backdrop-blur-md transition-opacity opacity-0 no-print">
        <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-95" id="emp-card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-slate-800" id="emp-modal-title">Add Employee</h3>
            <button onclick="Employees.closeForm()" class="text-slate-400 hover:text-slate-600"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <form id="emp-form" onsubmit="Employees.saveForm(event)" class="space-y-4">
            <input type="hidden" id="emp-id">
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Full Name *</label>
              <input type="text" id="emp-name" required placeholder="e.g. Dr. M. Salman" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-accent focus:border-accent">
            </div>
            <div>
              <label class="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Role / Designation *</label>
              <input type="text" id="emp-role" list="pharmacy-roles-list" required placeholder="e.g. Pharmacist (Category A), Dispenser, Cashier" class="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-accent focus:border-accent">
              <datalist id="pharmacy-roles-list">
                <option value="Pharmacist (Category A) - Supervising"></option>
                <option value="Assistant Pharmacist (Category B)"></option>
                <option value="Dispenser & POS Cashier"></option>
                <option value="Store & Inventory Incharge"></option>
                <option value="Pharmacy Technician"></option>
              </datalist>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input type="tel" id="emp-phone" required maxlength="11" oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 11)" placeholder="03001234567" class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Salary *</label>
                <input type="number" id="emp-salary" min="0" required class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Date Joined</label>
                <input type="date" id="emp-date" class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select id="emp-status" class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent font-bold">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea id="emp-notes" rows="2" class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-accent focus:border-accent"></textarea>
            </div>
            <div class="pt-4 flex justify-end gap-3">
              <button type="button" onclick="Employees.closeForm()" class="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-accent hover:bg-teal-700 text-white rounded-lg font-bold shadow transition-colors flex items-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

    try {
      await this.loadData();
    } catch(e) {
      console.error(e);
    }
  },

  applyFilter() {
    const query = document.getElementById('emp-search').value.toLowerCase();
    const stat = document.getElementById('emp-filter-status').value;
    const sortBy = document.getElementById('emp-sort').value;
    
    let filtered = [...this.employees];
    
    // Search
    if (query) {
        filtered = filtered.filter(e => 
            e.full_name.toLowerCase().includes(query) || 
            e.role.toLowerCase().includes(query)
        );
    }

    // Status Filter
    if (stat !== 'All') {
        filtered = filtered.filter(e => {
            const paid = this.paidAmounts[e.id] || 0;
            const isFullyPaid = paid >= e.salary;
            return stat === 'Paid' ? isFullyPaid : !isFullyPaid;
        });
    }

    // Sort
    filtered.sort((a, b) => {
        if (query) {
            const aName = (a.full_name || '').toLowerCase();
            const bName = (b.full_name || '').toLowerCase();
            const aStarts = aName.startsWith(query);
            const bStarts = bName.startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            const aWordStarts = aName.split(/\s+/).some(w => w.startsWith(query));
            const bWordStarts = bName.split(/\s+/).some(w => w.startsWith(query));
            if (aWordStarts && !bWordStarts) return -1;
            if (!aWordStarts && bWordStarts) return 1;
        }
        if (sortBy === 'name_asc') return a.full_name.localeCompare(b.full_name);
        if (sortBy === 'name_desc') return b.full_name.localeCompare(a.full_name);
        if (sortBy === 'salary_desc') return b.salary - a.salary;
        if (sortBy === 'salary_asc') return a.salary - b.salary;
        if (sortBy === 'status_unpaid') {
            const aPaid = (this.paidAmounts[a.id] || 0) >= a.salary;
            const bPaid = (this.paidAmounts[b.id] || 0) >= b.salary;
            return aPaid - bPaid;
        }
        if (sortBy === 'status_paid') {
            const aPaid = (this.paidAmounts[a.id] || 0) >= a.salary;
            const bPaid = (this.paidAmounts[b.id] || 0) >= b.salary;
            return bPaid - aPaid;
        }
        return 0;
    });

    this.renderTable(filtered);
    this.checkFilterChanges();
  },

  checkFilterChanges() {
    const query = document.getElementById('emp-search')?.value || '';
    const stat = document.getElementById('emp-filter-status')?.value || 'All';
    const sortBy = document.getElementById('emp-sort')?.value || 'name_asc';
    
    const hasFilters = query !== '' || stat !== 'All' || sortBy !== 'name_asc';
    
    const resetBtn = document.getElementById('emp-filter-reset');
    if (resetBtn) {
        resetBtn.classList.toggle('hidden', !hasFilters);
    }
  },

  resetFilters() {
    const search = document.getElementById('emp-search');
    if (search) search.value = '';
    
    const status = document.getElementById('emp-filter-status');
    if (status) status.value = 'All';
    
    const sort = document.getElementById('emp-sort');
    if (sort) sort.value = 'name_asc';
    
    this.applyFilter();
  },

  async loadData() {
    const allEmployees = await window.api.getEmployees();
    
    // Filter employees by date_joined AND date_inactive
    const selectedPeriodDate = new Date(this.currentYear, this.currentMonth, 1);
    this.employees = allEmployees.filter(e => {
        // 1. Joined Filter: Hide if they haven't joined yet
        if (e.date_joined) {
            const joinDate = new Date(e.date_joined);
            const joinMonthStart = new Date(joinDate.getFullYear(), joinDate.getMonth(), 1);
            if (joinMonthStart > selectedPeriodDate) return false;
        }

        // 2. Inactive Filter: Hide if they were marked inactive BEFORE the selected month
        if (e.status === 'Inactive' && e.date_inactive) {
            const inactiveDate = new Date(e.date_inactive);
            const inactiveMonthStart = new Date(inactiveDate.getFullYear(), inactiveDate.getMonth(), 1);
            // If viewing a month AFTER the month they left, hide them
            if (selectedPeriodDate > inactiveMonthStart) return false;
        }

        return true;
    });

    this.updateMonthDisplay();

    // Fetch selected month's salary expenses
    const filters = { month: this.currentMonth, year: this.currentYear };
    const expenses = await window.api.getExpenses(filters);
    
    // Calculate total paid amounts for each employee in selected month
    this.paidAmounts = {};
    expenses.filter(x => x.category === 'Salary' && x.description.includes('[#'))
      .forEach(x => {
          const match = x.description.match(/\[#(\d+)\]/);
          if (match) {
              const id = parseInt(match[1]);
              this.paidAmounts[id] = (this.paidAmounts[id] || 0) + x.amount;
          }
      });

    this.renderTable(this.employees);
  },

  updateMonthDisplay() {
    const el = document.getElementById('emp-month-display');
    const resetBtn = document.getElementById('emp-reset-btn');
    if (!el) return;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    el.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;

    // Disable next button if future
    const now = new Date();
    const nextBtn = document.getElementById('btn-next-month');
    if (nextBtn) {
        const isFuture = this.currentYear > now.getFullYear() || (this.currentYear === now.getFullYear() && this.currentMonth >= now.getMonth());
        nextBtn.disabled = isFuture;
        nextBtn.classList.toggle('opacity-30', isFuture);
    }

    if (resetBtn) {
        const isCurrent = this.currentMonth === now.getMonth() && this.currentYear === now.getFullYear();
        resetBtn.classList.toggle('hidden', isCurrent);
    }
  },

  resetToToday() {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
    this.loadData();
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
    }
    this.loadData();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
    }
    this.loadData();
  },

  renderTable(list) {
    const tbody = document.getElementById('employees-table-body');
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 italic">No employees found in the system.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((e, index) => `
      <tr class="hover:bg-slate-50 border-b border-slate-200 transition-colors group">
        <td class="px-2 py-1 border-r border-slate-200 text-center font-bold text-slate-400 tabular-nums text-xs">${index + 1}</td>
        <td class="px-4 py-1 border-r border-slate-200">
          <div>
            <div class="font-bold text-slate-800 text-xs">${e.full_name}</div>
            <div class="text-[10px] text-slate-400 uppercase font-bold tracking-tight">${e.role}</div>
          </div>
        </td>
        <td class="px-4 py-1 border-r border-slate-200">
          <div class="text-slate-800 font-bold tabular-nums text-xs">${e.phone || '-'}</div>
        </td>
        <td class="px-4 py-1 border-r border-slate-200 text-right">
          <div class="font-bold text-slate-800 tabular-nums text-xs">${app.formatCurrency(e.salary)}</div>
        </td>
        <td class="px-4 py-1 border-r border-slate-200 text-right">
          <div class="font-bold text-emerald-600 tabular-nums text-xs">${app.formatCurrency(e.salary - (this.paidAmounts[e.id] || 0))}</div>
        </td>
        <td class="px-4 py-1 text-center border-r border-slate-200">
          ${(() => {
              const paid = this.paidAmounts[e.id] || 0;
              if (paid >= e.salary) {
                  return `<span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto w-fit"><i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Paid</span>`;
              } else if (paid > 0) {
                  return `<span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto w-fit"><i data-lucide="info" class="w-3.5 h-3.5"></i> Partial</span>`;
              } else {
                  return `<span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto w-fit"><i data-lucide="clock" class="w-3.5 h-3.5"></i> Unpaid</span>`;
              }
          })()}
        </td>
        <td class="px-4 py-1 text-right font-medium">
          <div class="flex items-center justify-end gap-1.5 transition-opacity">
            <button onclick="Employees.paySalary(${e.id})" ${(this.paidAmounts[e.id] || 0) >= e.salary ? 'disabled' : ''} class="flex items-center gap-1.5 px-2.5 py-1 ${(this.paidAmounts[e.id] || 0) >= e.salary ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'} rounded-lg text-[10px] font-bold transition-all shadow-sm">
                <i data-lucide="${(this.paidAmounts[e.id] || 0) >= e.salary ? 'check' : 'banknote'}" class="w-3.5 h-3.5"></i> ${(this.paidAmounts[e.id] || 0) >= e.salary ? 'Paid' : 'Pay Salary'}
            </button>
            <button onclick='Employees.openForm(${JSON.stringify(e).replace(/'/g, "&#39;")})' class="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all" title="Edit"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            <button onclick="Employees.deleteEmployee(${e.id})" class="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
  },

  openForm(data = null) {
    const form = document.getElementById('emp-form');
    form.reset();
    
    const salaryInput = document.getElementById('emp-salary');
    const isPaidInAnyMonth = false; // We only lock for current month payments in most systems, but here we can check this.paidAmounts
    const isPaid = data && (this.paidAmounts[data.id] || 0) > 0;
    salaryInput.disabled = isPaid;
    salaryInput.parentElement.classList.toggle('opacity-60', isPaid);
    salaryInput.title = isPaid ? "Salary cannot be changed as payments have already been made for this month." : "";

    if (data) {
      document.getElementById('emp-modal-title').textContent = 'Edit Employee';
      document.getElementById('emp-id').value = data.id;
      document.getElementById('emp-name').value = data.full_name;
      document.getElementById('emp-role').value = data.role;
      document.getElementById('emp-phone').value = data.phone;
      document.getElementById('emp-salary').value = data.salary;
      document.getElementById('emp-date').value = data.date_joined;
      document.getElementById('emp-status').value = data.status || 'Active';
      document.getElementById('emp-notes').value = data.notes;
    } else {
      document.getElementById('emp-modal-title').textContent = 'Add Employee';
      document.getElementById('emp-id').value = '';
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      document.getElementById('emp-date').value = localToday;
      document.getElementById('emp-status').value = 'Active';
    }

    const modal = document.getElementById('emp-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      document.getElementById('emp-card').classList.remove('scale-95');
    }, 10);
  },

  closeForm() {
    const modal = document.getElementById('emp-modal');
    modal.classList.add('opacity-0');
    document.getElementById('emp-card').classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }, 200);
  },

  async saveForm(e) {
    e.preventDefault();
    const id = document.getElementById('emp-id').value;
    const status = document.getElementById('emp-status').value;
    
    // Get existing data to preserve date_inactive if already set
    let existing = null;
    if (id) {
        existing = this.employees.find(x => x.id === parseInt(id));
    }

    const phoneVal = (document.getElementById('emp-phone')?.value || '').trim();
    const cleanPhone = phoneVal.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 11) {
      return app.showAlert("Phone number must be exactly 11 digits (e.g. 03001234567)");
    }

    const data = {
      full_name: document.getElementById('emp-name').value,
      role: document.getElementById('emp-role').value,
      phone: phoneVal,
      email: '',
      salary: parseFloat(document.getElementById('emp-salary').value) || 0,
      status: status,
      date_joined: document.getElementById('emp-date').value,
      notes: document.getElementById('emp-notes').value
    };

    // Handle date_inactive: If just changed to Inactive, set it to the CURRENT VIEWED month
    // so they stay visible in the current list but hide in future ones.
    if (status === 'Inactive') {
        if (existing && existing.status === 'Inactive') {
            data.date_inactive = existing.date_inactive;
        } else {
            // Newly inactive - set to the month currently being viewed
            data.date_inactive = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
        }
    } else {
        data.date_inactive = null;
    }

    if (id) data.id = parseInt(id);

    app.showLoading();
    try {
      await window.api.saveEmployee(data);
      this.closeForm();
      await this.loadData();
    } catch(err) {
      console.error(err);
    } finally {
      app.hideLoading();
    }
  },

  deleteEmployee(id) {
    app.verifyPassword({
      title: 'Delete Employee Verification',
      message: 'Please enter password to delete this employee:',
      onVerified: () => {
        app.showConfirm({
          title: 'Delete Employee',
          message: 'Are you sure you want to delete this employee? This cannot be undone.',
          confirmText: 'Delete',
          confirmColor: 'red',
          onConfirm: async () => {
            app.showLoading();
            await window.api.deleteEmployee(id);
            await this.loadData();
            app.hideLoading();
          }
        });
      }
    });
  },

  async paySalary(id) {
    const e = this.employees.find(x => x.id === id);
    if (!e) return;

    const alreadyPaid = this.paidAmounts[e.id] || 0;
    const remaining = e.salary - alreadyPaid;

    app.showPaymentModal({
      title: 'Pay Salary',
      subtitle: `Paying ${e.full_name}`,
      total: e.salary,
      alreadyReceived: alreadyPaid,
      buttonText: 'Record Payment',
      onConfirm: async (amount) => {
        if (amount <= 0) return;
        
        app.showLoading();
        try {
          const now = new Date();
          const expDate = new Date(this.currentYear, this.currentMonth, now.getDate(), now.getHours(), now.getMinutes());
          expDate.setMinutes(expDate.getMinutes() - expDate.getTimezoneOffset());
          const expenseData = {
            date: expDate.toISOString().slice(0, 16),
            category: 'Salary',
            description: `Monthly Salary - ${e.full_name} [#${e.id}]`,
            amount: amount
          };
          await window.api.saveExpense(expenseData);
          await this.loadData();
          
          const newTotal = alreadyPaid + amount;
          app.showAlert({
            title: 'Payment Recorded',
            message: newTotal >= e.salary 
                ? `Salary for ${e.full_name} has been fully paid.` 
                : `Partial payment of ${app.formatCurrency(amount)} recorded for ${e.full_name}. Remaining: ${app.formatCurrency(e.salary - newTotal)}`
          });
        } catch(err) {
          console.error(err);
          app.showAlert("Failed to record salary payment.");
        } finally {
          app.hideLoading();
        }
      }
    });
  }
};

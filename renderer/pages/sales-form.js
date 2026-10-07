window.SalesForm = {
  cart: [],
  moreBillItems: [],
  settings: {},
  discountType: 'flat',
  taxType: 'percent',
  taxVal: 0,
  editingSaleId: null,
  sellers: [],
  sellerName: '',
  paymentMethod: 'Cash',
  searchResults: [],
  selectedSearchIndex: 0,
  _searchTimer: null,
  clockInterval: null,

  getCleanMoreBillItems() {
    return (this.moreBillItems || [])
      .filter(i => (i && ((i.name && i.name.trim()) || (i.amount !== '' && parseFloat(i.amount) > 0))))
      .map(i => ({
        name: (i.name || 'Service').trim(),
        amount: parseFloat(i.amount) || 0
      }));
  },

  getMoreBillTotal() {
    return this.getCleanMoreBillItems().reduce((sum, item) => sum + item.amount, 0);
  },

  async render(container, args) {
    this.discountType = 'flat';
    this.taxType = 'percent';
    this.settings = await window.api.getSettings();
    this.customers = await window.api.getCustomers() || [];
    this.paymentMethod = 'Cash';
    this.cart = [];
    this.searchResults = [];
    this.selectedSearchIndex = 0;

    const defaultTaxRate = parseFloat(this.settings.tax_rate) || 0;
    this.taxVal = defaultTaxRate;

    container.style.overflow = 'hidden';
    container.style.height = '100vh';

    this.editingSaleId = args?.id || null;
    this.originalTotal = 0;
    this.alreadyReceived = 0;
    this.originalItemsMap = {};
    this.sellerName = '';
    this.doctorName = '';
    this.doctorReg = '';
    this.patientAge = '';
    this.patientGender = '';
    this.prescriptionNo = '';

    try {
      this.sellers = await window.api.getEmployees('Active') || [];
      if (!this.sellers || this.sellers.length === 0) {
        this.sellers = await window.api.getEmployees() || [];
      }
    } catch (e) {
      this.sellers = [];
    }

    if (this.editingSaleId) {
      const sale = await window.api.getProposal(this.editingSaleId);
      if (sale) {
        this.originalItemsMap = {};
        if (sale.items) {
          sale.items.forEach(it => {
            const key = `${it.section}-${it.item_id}`;
            this.originalItemsMap[key] = (this.originalItemsMap[key] || 0) + (it.qty || 0);
          });
        }
        this.originalTotal = sale.retail_total;
        this.alreadyReceived = sale.received_amount || 0;
        this.cart = (sale.items || []).map(item => ({
          id: item.item_id,
          description: item.description,
          item_name: (item.description || '').split(' - ')[0],
          generic_name: item.generic_name || '',
          dosage_form: item.dosage_form || '',
          strength: item.strength || '',
          packing: item.packing || '',
          rack_shelf: item.rack_shelf || '',
          batch_no: item.batch_no || '',
          expiry_date: item.expiry_date || '',
          retail_price: item.unit_retail,
          original_retail_price: item.unit_retail,
          cost_price: item.unit_cost,
          current_stock: item.current_stock ?? 100,
          qty: item.qty,
          slug: item.section,
          unit: item.unit || 'PACK',
          discount: (item.unit_retail - (item.unit_discounted || item.unit_retail)) || '',
          discountType: 'flat'
        }));
        this.customerName = sale.customer_name;
        this.customerPhone = sale.phone;
        this.saleNumber = sale.proposal_number;
        this.sellerName = sale.seller_name || '';
        this.doctorName = sale.doctor_name || '';
        this.doctorReg = sale.doctor_reg || '';
        this.patientAge = sale.patient_age || '';
        this.patientGender = sale.patient_gender || '';
        this.prescriptionNo = sale.prescription_no || '';
        this.fees = sale.fees || 0;
        this.feesName = sale.fees_name || '';

        this.moreBillItems = [];
        if (sale.more_bill_items) {
          try {
            this.moreBillItems = typeof sale.more_bill_items === 'string' ? JSON.parse(sale.more_bill_items) : sale.more_bill_items;
          } catch (e) {
            this.moreBillItems = [];
          }
        }
        if ((!this.moreBillItems || this.moreBillItems.length === 0) && (sale.fees > 0)) {
          this.moreBillItems = [{ name: sale.fees_name || 'Checkup Fees', amount: sale.fees }];
        }

        if (sale.tax_rate !== undefined && sale.tax_rate !== null && Number(sale.tax_rate) > 0) {
          this.taxType = 'percent';
          this.taxVal = Number(sale.tax_rate);
        } else if (sale.tax !== undefined && sale.tax !== null && Number(sale.tax) > 0) {
          this.taxType = 'flat';
          this.taxVal = Number(sale.tax);
        } else {
          this.taxType = 'percent';
          this.taxVal = defaultTaxRate;
        }

        const itemDiscountSum = (sale.items || []).reduce((sum, item) => {
          return sum + ((item.unit_retail - (item.unit_discounted || item.unit_retail)) * item.qty);
        }, 0);
        this.additionalDiscount = (sale.discount || 0) - itemDiscountSum;
        if (this.additionalDiscount < 0) this.additionalDiscount = 0;
        if (sale.payment_method) this.paymentMethod = sale.payment_method;
        if (sale.sale_mode && typeof app.setSaleMode === 'function') {
          app.setSaleMode(sale.sale_mode);
        }
      }
    } else {
      this.originalItemsMap = {};
      this.customerName = '';
      this.customerPhone = '';
      this.fees = 0;
      this.feesName = '';
      this.moreBillItems = [];
      this.saleNumber = await window.api.getNextProposalNumber();

      const savedDisc = window.storage.get('pos_saved_disc_val');
      this.additionalDiscount = (savedDisc !== null && savedDisc !== undefined) ? savedDisc : 0;
      this.discountType = window.storage.get('pos_saved_disc_type') || 'flat';

      this.taxType = window.storage.get('pos_saved_tax_type') || 'percent';
      const savedTax = window.storage.get('pos_saved_tax_val');
      this.taxVal = (savedTax !== null && savedTax !== undefined) ? savedTax : defaultTaxRate;
    }

    this.showDiscTax = window.storage.get('pos_show_disc_tax') === true;
    if (this.editingSaleId && (this.additionalDiscount > 0 || this.taxVal > 0)) {
      this.showDiscTax = true;
    }

    container.innerHTML = `
      <div class="flex flex-col h-full bg-slate-100/70 p-3 gap-2.5 overflow-hidden select-none" id="sf-container">
        <!-- TOP HEADER: Title, Shortcuts, Live Clock & Payment Channel -->
        <div class="bg-white rounded-2xl p-2.5 px-4 border border-slate-200 shadow-2xs flex justify-between items-center shrink-0 flex-wrap gap-2">
          <!-- Left: Title & Sale # -->
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black">
              <i data-lucide="receipt" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-base font-black text-slate-800 tracking-tight leading-none">Pharmacy POS Billing</h1>
                <span class="text-[10.5px] font-black bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs tracking-wider">${this.saleNumber}</span>
              </div>
              <p class="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Fast Dispensing Counter</p>
            </div>
          </div>

          <!-- Middle: Keyboard Shortcuts Pill -->
          <div class="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-xl text-[10px] font-bold text-slate-500">
            <span><kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-black text-slate-800 shadow-2xs">F2</kbd> Search</span>
            <span class="text-slate-300">•</span>
            <span><kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-black text-slate-800 shadow-2xs">F4</kbd> Cash Rec.</span>
            <span class="text-slate-300">•</span>
            <span><kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-black text-slate-800 shadow-2xs">↑ / ↓</kbd> Navigate</span>
            <span class="text-slate-300">•</span>
            <span><kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-black text-slate-800 shadow-2xs">Enter</kbd> Select/Next</span>
            <span class="text-slate-300">•</span>
            <span><kbd class="px-1 py-0.5 bg-white border border-slate-300 rounded font-black text-slate-800 shadow-2xs">F9</kbd> Save & Print</span>
          </div>

          <!-- Right: Clock -->
          <div class="flex items-center gap-3">
            <div id="sf-live-clock" class="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl tabular-nums border border-slate-200/80 shadow-2xs">
              --:--:--
            </div>
          </div>
        </div>

        <!-- SEARCH BAR & PATIENT BAR -->
        <div class="bg-white rounded-2xl p-2.5 px-3 border border-slate-200 shadow-2xs shrink-0 relative z-30">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
            <!-- Medicine Search Bar with Dropdown (Takes 7 cols) -->
            <div class="lg:col-span-7 relative">
              <div class="relative group">
                <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600"></i>
                <input type="text" 
                  id="sf-search" 
                  autocomplete="off"
                  oninput="SalesForm.onSearchInput(this.value)"
                  onfocus="if (this.value.trim()) SalesForm.onSearchInput(this.value)"
                  onkeydown="SalesForm.onSearchKeyDown(event)"
                  placeholder="Type medicine name, brand, or generic salt formula (e.g. Panadol, Augmentin, Paracetamol)..." 
                  class="w-full h-10 bg-slate-50 border-2 border-teal-500/80 rounded-xl py-1.5 pl-10 pr-20 text-xs font-black text-slate-900 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-all placeholder:font-bold placeholder:text-slate-400 shadow-xs">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded border border-teal-300 select-none">
                  Press Enter ↵
                </span>
              </div>

              <!-- Real-Time Search Results Dropdown Popup -->
              <div id="sf-search-dropdown" class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-[999] hidden custom-scrollbar divide-y divide-slate-100">
                <!-- Injected dynamically -->
              </div>
            </div>

            <!-- Patient Name (Takes 3 cols) -->
            <div class="lg:col-span-3 relative">
              <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"></i>
              <input type="text" id="sf-cust-name" autocomplete="off" oninput="SalesForm.onCustomerInput(this.value)" value="${this.customerName || ''}" placeholder="Patient Name (e.g. Walk-in)" class="w-full h-10 pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all">
            </div>

            <!-- Patient Phone (Takes 2 cols) -->
            <div class="lg:col-span-2 relative">
              <i data-lucide="phone" class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"></i>
              <input type="tel" id="sf-cust-phone" value="${this.customerPhone || ''}" placeholder="03001234567" maxlength="11" oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 11)" class="w-full h-10 pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 outline-none transition-all">
            </div>
          </div>
        </div>

        <!-- TIGHT TABLE CART AREA -->
        <div class="flex-1 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col min-h-0 overflow-hidden">
          <div class="flex-1 overflow-y-auto custom-scrollbar relative" id="sf-cart-scroll">
            <table class="w-full text-xs text-left border-collapse border-b border-slate-200">
              <thead class="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10.5px] font-black tracking-wider sticky top-0 z-10 shadow-xs">
                <tr>
                  <th class="px-2 py-2 text-center w-9 border-r border-slate-200">#</th>
                  <th class="px-3 py-2 border-r border-slate-200 min-w-[260px]">Item / Description</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-center w-28">Dosage & Strength</th>
                  <th class="px-2 py-2 border-r border-slate-200 text-center w-24">Packing</th>
                  <th class="px-2.5 py-2 border-r border-slate-200 text-right w-24">MRP (Rs.)</th>
                  <th class="px-2 py-2 border-r border-slate-200 text-center w-20 text-indigo-900 bg-indigo-50/40">Qty</th>
                  <th class="px-2 py-2 border-r border-slate-200 text-right w-20 text-rose-700 bg-rose-50/30">Disc (Rs.)</th>
                  <th class="px-3 py-2 border-r border-slate-200 text-right w-28 text-emerald-800 bg-emerald-50/40">Total (Rs.)</th>
                  <th class="px-2 py-2 text-center w-10">Del</th>
                </tr>
              </thead>
              <tbody id="sf-cart-tbody" class="divide-y divide-slate-100 bg-white">
                <!-- Cart rows injected here -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- COMPACT BOTTOM SUMMARY & CHECKOUT BAR -->
        <div class="bg-white rounded-2xl p-3 px-4 border border-slate-200 shadow-md shrink-0">
          <div class="flex flex-col lg:flex-row items-center justify-between gap-4">
            <!-- Left: Quick Discount, Tax, Fees, Payment Channel & Items Count -->
            <div class="flex items-center gap-2.5 flex-wrap text-xs font-bold text-slate-700 w-full lg:w-auto">

              <!-- More Bill Button with Dynamic Badge -->
              <button type="button" onclick="SalesForm.openMoreBillModal()" id="sf-more-bill-btn" class="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl transition-all text-xs font-black text-slate-700 cursor-pointer shadow-2xs active:scale-95" title="Add extra bill items (Checkup Fees, X-Ray, Tests, etc.)">
                <i data-lucide="receipt-text" class="w-3.5 h-3.5 text-teal-600"></i>
                <span>More Bill</span>
                <span id="sf-more-bill-badge" class="${this.getMoreBillTotal() > 0 ? 'inline-flex' : 'hidden'} items-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white leading-none">
                  Rs. ${app.formatNumber(this.getMoreBillTotal())}
                </span>
              </button>

              <!-- Payment Channel Toggle (Cash / Online) -->
              <div class="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-black">
                <button type="button" onclick="SalesForm.setPaymentMethod('Cash')" id="sf-pay-cash" class="px-2.5 py-1 rounded-lg transition-all ${this.paymentMethod === 'Cash' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} flex items-center gap-1 cursor-pointer">
                  <i data-lucide="banknote" class="w-3.5 h-3.5"></i>
                  <span>Cash</span>
                </button>
                <button type="button" onclick="SalesForm.setPaymentMethod('Online')" id="sf-pay-online" class="px-2.5 py-1 rounded-lg transition-all ${this.paymentMethod === 'Online' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'} flex items-center gap-1 cursor-pointer">
                  <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                  <span>Online</span>
                </button>
              </div>

              <!-- Disc / Tax Toggle Checkbox -->
              <label class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-100 select-none text-[11px] font-bold text-slate-700">
                <input type="checkbox" id="sf-toggle-disc-tax" onchange="SalesForm.toggleDiscTaxFields(this.checked)" ${this.showDiscTax ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer">
                <span>Disc / Tax</span>
              </label>

              <!-- Bill Discount & Tax Fields Container (Hidden until checkbox is ticked) -->
              <div id="sf-disc-tax-container" class="flex items-center gap-2.5 ${this.showDiscTax ? '' : 'hidden'}">
                <!-- Bill Discount -->
                <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                  <span class="text-slate-500 text-[10.5px]">Bill Disc:</span>
                  <div class="inline-flex bg-slate-200/80 p-0.5 rounded border border-slate-300 text-[10px]">
                    <button type="button" onclick="SalesForm.setDiscountType('flat')" id="sf-disc-type-flat" class="px-1.5 py-0.5 rounded font-black ${this.discountType === 'flat' ? 'bg-slate-900 text-white' : 'text-slate-600'}">Rs.</button>
                    <button type="button" onclick="SalesForm.setDiscountType('percent')" id="sf-disc-type-percent" class="px-1.5 py-0.5 rounded font-black ${this.discountType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'}">%</button>
                  </div>
                  <input type="number" id="sf-additional-discount" value="${this.additionalDiscount || ''}" placeholder="0" oninput="SalesForm.persistDiscTaxValues(); SalesForm.updateSummary()" min="0" step="any" class="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-black text-rose-600 outline-none text-right">
                </div>

                <!-- Tax / GST -->
                <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                  <span class="text-slate-500 text-[10.5px]">Tax:</span>
                  <div class="inline-flex bg-slate-200/80 p-0.5 rounded border border-slate-300 text-[10px]">
                    <button type="button" onclick="SalesForm.setTaxType('percent')" id="sf-tax-type-percent" class="px-1.5 py-0.5 rounded font-black ${this.taxType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'}">%</button>
                    <button type="button" onclick="SalesForm.setTaxType('flat')" id="sf-tax-type-flat" class="px-1.5 py-0.5 rounded font-black ${this.taxType === 'flat' ? 'bg-slate-900 text-white' : 'text-slate-600'}">Rs.</button>
                  </div>
                  <input type="number" id="sf-tax" value="${this.taxVal !== undefined && this.taxVal !== null && this.taxVal > 0 ? this.taxVal : ''}" placeholder="0" oninput="SalesForm.persistDiscTaxValues(); SalesForm.updateSummary()" min="0" step="any" class="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-black text-teal-700 outline-none text-right">
                </div>
              </div>
            </div>

            <!-- Right: Subtotal, Grand Total & Actions -->
            <div class="flex items-center gap-3.5 flex-wrap sm:flex-nowrap w-full lg:w-auto justify-end">
              <!-- Bill Breakdown & Net Total -->
              <div class="text-right shrink-0">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-end gap-2">
                  <span>Sub: <b id="sf-subtotal" class="text-slate-700">Rs. 0</b></span>
                  <span class="text-slate-300">•</span>
                  <span>Disc: <b id="sf-discount-amount" class="text-rose-600">- Rs. 0</b></span>
                  <span class="text-slate-300">•</span>
                  <span>Tax: <b id="sf-tax-amount" class="text-teal-700">+ Rs. 0</b></span>
                </div>
                <div class="flex items-baseline gap-1.5 justify-end">
                  <span class="text-xs font-black text-slate-500 uppercase tracking-wider">Net Total:</span>
                  <span id="sf-grand-total" class="text-2xl font-black text-teal-700 font-display tabular-nums tracking-tight">Rs. 0</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2">
                ${this.editingSaleId ? `
                <button type="button" onclick="app.navigate('proposals')" class="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap">
                  Cancel
                </button>
                ` : `
                <button type="button" onclick="SalesForm.clearCart()" class="h-10 px-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl font-bold text-xs transition-all border border-slate-200 whitespace-nowrap" title="Clear Bill">
                  Clear
                </button>
                `}

                <button type="button" onclick="SalesForm.completeSale(true)" class="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap">
                  <i data-lucide="printer" class="w-4 h-4 text-teal-400"></i>
                  <span class="text-xs uppercase tracking-wider">Save & Print (F9)</span>
                </button>

                <button type="button" onclick="SalesForm.completeSale(false)" class="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap" title="Save without printing">
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span class="text-xs uppercase tracking-wider">Save</span>
                </button>
              </div>
            </div>
          </div>
        <!-- MORE BILL MODAL -->
        <div id="more-bill-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 hidden">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <!-- Modal Header -->
            <div class="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <i data-lucide="receipt-text" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-black text-sm tracking-wide text-white">More Bill / Extra Charges</h3>
                  <p class="text-[11px] text-slate-400 font-medium">Add clinical services, X-Ray, checkup fees, lab tests, etc.</p>
                </div>
              </div>
              <button type="button" onclick="SalesForm.closeMoreBillModal()" class="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>

            <!-- Modal Table / List Body -->
            <div class="p-5 overflow-y-auto flex-1 space-y-3 max-h-[400px]">
              <!-- Column Headers -->
              <div class="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-wider text-slate-400 select-none">
                <span class="w-6 text-center">#</span>
                <span class="flex-1">Item / Description</span>
                <span class="w-36 text-right pr-2">Amount</span>
                <span class="w-8"></span>
              </div>

              <div id="more-bill-rows-container" class="space-y-2">
                <!-- Rows dynamically injected here -->
              </div>

              <div class="pt-1">
                <button type="button" onclick="SalesForm.addMoreBillRow()" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  <i data-lucide="plus" class="w-4 h-4 text-teal-600"></i>
                  <span>Add Another Item</span>
                </button>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-slate-500 uppercase">Total:</span>
                <span id="more-bill-modal-total" class="text-base font-black text-teal-700 font-display tabular-nums">Rs. 0</span>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="SalesForm.clearAllMoreBillRows()" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer">
                  Clear All
                </button>
                <button type="button" onclick="SalesForm.saveMoreBillModal()" class="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer">
                  Done & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderCart();
    this.updateSummary();
    this.initClock();

    // Auto-focus search bar
    setTimeout(() => {
      const searchInput = document.getElementById('sf-search');
      if (searchInput) searchInput.focus();
    }, 100);

    // Attach global keyboard listener for F2, F9, Ctrl+Enter, Esc
    this.attachGlobalShortcuts();

    if (this.customerName) {
      this.onCustomerInput(this.customerName, true);
    }
    if (window.lucide) lucide.createIcons();
  },

  attachGlobalShortcuts() {
    if (this._globalKeyHandler) {
      window.removeEventListener('keydown', this._globalKeyHandler);
    }
    if (this._globalClickHandler) {
      document.removeEventListener('click', this._globalClickHandler);
    }

    this._globalKeyHandler = (e) => {
      // F2: focus search
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.getElementById('sf-search');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }


      // F9 or Ctrl+Enter: Save & Print
      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        this.completeSale(true);
        return;
      }

      // Ctrl+S: Save only
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.completeSale(false);
        return;
      }

      // Esc: close more bill modal or close dropdown and focus search
      if (e.key === 'Escape') {
        const modal = document.getElementById('more-bill-modal');
        if (modal && !modal.classList.contains('hidden')) {
          this.closeMoreBillModal();
          return;
        }
        this.closeSearchDropdown();
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
        return;
      }
    };

    this._globalClickHandler = (e) => {
      const searchInput = document.getElementById('sf-search');
      const dropdown = document.getElementById('sf-search-dropdown');
      if (!dropdown || dropdown.classList.contains('hidden')) return;

      if (searchInput && !searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        this.closeSearchDropdown();
      }
    };

    window.addEventListener('keydown', this._globalKeyHandler);
    document.addEventListener('click', this._globalClickHandler);
  },

  initClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    const update = () => {
      const el = document.getElementById('sf-live-clock');
      if (!el) {
        if (this.clockInterval) clearInterval(this.clockInterval);
        return;
      }
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      }) + ' • ' + now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  },

  setPaymentMethod(method) {
    this.paymentMethod = method;
    const cashBtn = document.getElementById('sf-pay-cash');
    const onlineBtn = document.getElementById('sf-pay-online');
    if (cashBtn && onlineBtn) {
      if (method === 'Cash') {
        cashBtn.className = 'px-3 py-1 rounded-lg transition-all bg-slate-900 text-white shadow-xs flex items-center gap-1 cursor-pointer';
        onlineBtn.className = 'px-3 py-1 rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer';
      } else {
        onlineBtn.className = 'px-3 py-1 rounded-lg transition-all bg-slate-900 text-white shadow-xs flex items-center gap-1 cursor-pointer';
        cashBtn.className = 'px-3 py-1 rounded-lg transition-all text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer';
      }
    }
    if (window.lucide) lucide.createIcons();
  },

  // Real-time Single-Letter Search Dropdown (Excludes items already in cart)
  async onSearchInput(val) {
    const query = (val || '').trim();
    if (!query) {
      this.closeSearchDropdown();
      return;
    }

    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(async () => {
      const results = await window.api.searchAllProducts(query);
      // Mark items already present in the cart
      const cartKeys = new Set(this.cart.map(c => `${c.slug || 'tablet'}-${c.id}`));
      let itemsList = (results || []).map(item => ({
        ...item,
        inCart: cartKeys.has(`${item.slug || 'tablet'}-${item.id}`)
      }));

      // Prioritize items starting with query, then word starts, then generic, then alphabetical
      const qClean = (query || '').toLowerCase().trim();
      if (qClean) {
        itemsList.sort((a, b) => {
          const aName = (a.medicine_name || a.item_name || '').toLowerCase();
          const bName = (b.medicine_name || b.item_name || '').toLowerCase();
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
        itemsList.sort((a, b) => {
          const nameA = (a.medicine_name || a.item_name || '').toUpperCase();
          const nameB = (b.medicine_name || b.item_name || '').toUpperCase();
          return nameA.localeCompare(nameB);
        });
      }

      this.searchResults = itemsList.slice(0, 50);
      // Default to the first available (not yet added and in stock) item if possible
      const firstAvailable = this.searchResults.findIndex(item => !item.inCart && (this.getItemAvailableStock ? this.getItemAvailableStock(item) : (item.current_stock || 0)) > 0);
      this.selectedSearchIndex = firstAvailable >= 0 ? firstAvailable : 0;
      this.renderSearchDropdown();
    }, 40);
  },

  renderSearchDropdown() {
    const dropdown = document.getElementById('sf-search-dropdown');
    if (!dropdown) return;

    if (this.searchResults.length === 0) {
      dropdown.innerHTML = `
        <div class="p-3 text-center text-slate-400 font-bold text-xs italic">
          No available medicines found matching your search.
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = this.searchResults.map((item, idx) => {
      const isSelected = idx === this.selectedSearchIndex;
      const displayName = item.medicine_name || item.item_name || 'Unnamed Medicine';
      const brandName = item.brand_name || '';
      const form = item.dosage_form || '';
      const strength = item.strength || '';
      const packing = item.packing || '';
      const price = item.retail_price || 0;
      const stock = this.getItemAvailableStock ? this.getItemAvailableStock(item) : (item.current_stock || 0);
      const isLowStock = stock <= (item.min_stock_level || 5);
      const inCart = !!item.inCart;
      const isOutOfStock = stock <= 0;

      if (inCart) {
        return `
        <div id="sf-search-item-${idx}" 
             onclick="SalesForm.selectSearchResult(${idx})"
             class="px-3.5 py-2 transition-all cursor-not-allowed flex items-center justify-between gap-3 bg-slate-100/90 border-l-4 border-emerald-500 opacity-80 select-none ${isSelected ? 'ring-2 ring-emerald-500 ring-inset' : ''}">
          
          <!-- Left: Name & Formula -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap leading-tight">
              <span class="text-xs font-black text-slate-700">${displayName}</span>
              ${brandName && brandName !== displayName ? `<span class="text-[11px] text-slate-500 font-semibold">(${brandName})</span>` : ''}
              ${form ? `<span class="text-[9.5px] px-1.5 py-0.2 rounded font-black uppercase bg-slate-200 text-slate-600">${form}</span>` : ''}
              ${strength ? `<span class="text-[10px] font-bold text-slate-500">${strength}</span>` : ''}
              ${packing ? `<span class="text-[10px] font-semibold text-slate-400">(${packing})</span>` : ''}
              <span class="text-[9.5px] px-2 py-0.5 rounded font-black uppercase bg-emerald-100 text-emerald-800 tracking-wider flex items-center gap-1 shrink-0 ml-1">
                <i class="fas fa-check-circle text-[9px] text-emerald-600"></i> Added
              </span>
            </div>
            ${item.generic_name ? `<div class="text-[10.5px] truncate mt-0.5 text-slate-500 font-medium">${item.generic_name}</div>` : ''}
          </div>

          <!-- Right: Stock, Rack & MRP -->
          <div class="flex items-center gap-3 shrink-0 text-right">
            ${item.rack_shelf ? `<span class="text-[10px] font-bold text-slate-400">${item.rack_shelf}</span>` : ''}
            <span class="text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums bg-slate-200 text-slate-600">
              Stock: ${stock}
            </span>
            <span class="text-xs font-black font-display tabular-nums text-slate-500">
              Rs. ${app.formatNumber(price)}
            </span>
          </div>
        </div>
        `;
      }

      if (isOutOfStock) {
        return `
        <div id="sf-search-item-${idx}" 
             onclick="SalesForm.selectSearchResult(${idx})"
             class="px-3.5 py-2 transition-all cursor-not-allowed flex items-center justify-between gap-3 bg-rose-50/50 border-l-4 border-rose-400 opacity-75 select-none ${isSelected ? 'ring-2 ring-rose-400 ring-inset' : ''}">
          
          <!-- Left: Name & Formula -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap leading-tight">
              <span class="text-xs font-black text-slate-700">${displayName}</span>
              ${brandName && brandName !== displayName ? `<span class="text-[11px] text-slate-500 font-semibold">(${brandName})</span>` : ''}
              ${form ? `<span class="text-[9.5px] px-1.5 py-0.2 rounded font-black uppercase bg-slate-200 text-slate-500">${form}</span>` : ''}
              ${strength ? `<span class="text-[10px] font-bold text-slate-500">${strength}</span>` : ''}
              ${packing ? `<span class="text-[10px] font-semibold text-slate-400">(${packing})</span>` : ''}
              <span class="text-[9.5px] px-2 py-0.5 rounded font-black uppercase bg-rose-100 text-rose-700 tracking-wider flex items-center gap-1 shrink-0 ml-1">
                <i class="fas fa-ban text-[9px] text-rose-600"></i> Out of Stock
              </span>
            </div>
            ${item.generic_name ? `<div class="text-[10.5px] truncate mt-0.5 text-slate-400 font-medium">${item.generic_name}</div>` : ''}
          </div>

          <!-- Right: Stock, Rack & MRP -->
          <div class="flex items-center gap-3 shrink-0 text-right">
            ${item.rack_shelf ? `<span class="text-[10px] font-bold text-slate-400">${item.rack_shelf}</span>` : ''}
            <span class="text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums bg-rose-100 text-rose-700">
              Stock: 0
            </span>
            <span class="text-xs font-black font-display tabular-nums text-slate-400">
              Rs. ${app.formatNumber(price)}
            </span>
          </div>
        </div>
        `;
      }

      return `
        <div id="sf-search-item-${idx}" 
             onclick="SalesForm.selectSearchResult(${idx})"
             class="px-3.5 py-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'bg-teal-600 text-white font-bold' : 'hover:bg-slate-50 text-slate-800'}">
          
          <!-- Left: Name & Formula -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap leading-tight">
              <span class="text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}">${displayName}</span>
              ${brandName && brandName !== displayName ? `<span class="text-[11px] ${isSelected ? 'text-teal-100' : 'text-slate-500'} font-semibold">(${brandName})</span>` : ''}
              ${form ? `<span class="text-[9.5px] px-1.5 py-0.2 rounded font-black uppercase ${isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-100 text-slate-600'}">${form}</span>` : ''}
              ${strength ? `<span class="text-[10px] font-bold ${isSelected ? 'text-teal-100' : 'text-slate-600'}">${strength}</span>` : ''}
              ${packing ? `<span class="text-[10px] font-semibold ${isSelected ? 'text-teal-200' : 'text-slate-400'}">(${packing})</span>` : ''}
            </div>
            ${item.generic_name ? `<div class="text-[10.5px] truncate mt-0.5 ${isSelected ? 'text-teal-100 font-medium' : 'text-teal-600 font-bold'}">${item.generic_name}</div>` : ''}
          </div>

          <!-- Right: Stock, Rack & MRP -->
          <div class="flex items-center gap-3 shrink-0 text-right">
            ${item.rack_shelf ? `<span class="text-[10px] font-bold ${isSelected ? 'text-teal-200' : 'text-slate-400'}">${item.rack_shelf}</span>` : ''}
            <span class="text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${isSelected ? 'bg-white text-teal-900' : (isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-teal-50 text-teal-800')}">
              Stock: ${stock}
            </span>
            <span class="text-xs font-black font-display tabular-nums ${isSelected ? 'text-white' : 'text-emerald-700'}">
              Rs. ${app.formatNumber(price)}
            </span>
          </div>
        </div>
      `;
    }).join('');

    dropdown.classList.remove('hidden');
    this.scrollSearchActiveIntoView();
  },

  scrollSearchActiveIntoView() {
    const el = document.getElementById(`sf-search-item-${this.selectedSearchIndex}`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },

  closeSearchDropdown() {
    const dropdown = document.getElementById('sf-search-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    this.searchResults = [];
    this.selectedSearchIndex = 0;
  },

  onSearchKeyDown(e) {
    if (this.searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedSearchIndex = (this.selectedSearchIndex + 1) % this.searchResults.length;
      this.renderSearchDropdown();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedSearchIndex = (this.selectedSearchIndex - 1 + this.searchResults.length) % this.searchResults.length;
      this.renderSearchDropdown();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.selectSearchResult(this.selectedSearchIndex);
    }
  },

  selectSearchResult(index) {
    const item = this.searchResults[index];
    if (!item) return;

    if (item.inCart) {
      const name = item.medicine_name || item.item_name || 'This medicine';
      app.showToast(`"${name}" is already added to the cart`, 'info');
      return;
    }

    const availStock = this.getItemAvailableStock(item);
    if (availStock <= 0) {
      const name = item.medicine_name || item.item_name || 'This medicine';
      app.showToast(`"${name}" is out of stock (0 available)`, 'warning');
      return;
    }

    this.addToCart(item);

    // Clear search input and close dropdown
    const searchInput = document.getElementById('sf-search');
    if (searchInput) searchInput.value = '';
    this.closeSearchDropdown();

    // Auto-focus MRP (price) input of the newly added / existing item
    const cartIdx = this.cart.findIndex(i => i.id === item.id && i.slug === (item.slug || 'tablet'));
    const targetIdx = cartIdx >= 0 ? cartIdx : this.cart.length - 1;
    setTimeout(() => {
      const priceInput = document.getElementById(`cart-price-${targetIdx}`);
      if (priceInput) {
        priceInput.focus();
        priceInput.select();
      }
    }, 50);
  },

  getItemAvailableStock(item) {
    if (!item) return 0;
    const itemId = item.id !== undefined ? item.id : item.item_id;
    const itemSlug = item.slug || item.section;
    let stock = item.current_stock || 0;
    if (this.editingSaleId && this.originalItemsMap) {
      const origQty = this.originalItemsMap[`${itemSlug}-${itemId}`] || 0;
      stock += origQty;
    }
    return Math.max(0, stock);
  },

  addToCart(item) {
    const availStock = this.getItemAvailableStock(item);
    if (availStock <= 0) {
      const name = item.medicine_name || item.item_name || 'This medicine';
      app.showToast(`"${name}" is out of stock and cannot be added`, 'warning');
      return;
    }

    const activePrice = item.retail_price || 0;
    const activeCost = item.trade_price ?? item.cost_price ?? 0;
    const itemSlug = item.slug || 'tablet';

    const existingIdx = this.cart.findIndex(i => i.id === item.id && i.slug === itemSlug);
    if (existingIdx >= 0) {
      this.cart[existingIdx].qty++;
    } else {
      this.cart.push({
        id: item.id,
        slug: itemSlug,
        item_name: item.medicine_name || item.item_name || 'Unnamed Medicine',
        brand_name: item.brand_name || '',
        generic_name: item.generic_name || '',
        dosage_form: item.dosage_form || '',
        strength: item.strength || '',
        packing: item.packing || '',
        rack_shelf: item.rack_shelf || '',
        batch_no: item.batch_no || '',
        expiry_date: item.expiry_date || '',
        description: item.item_name || item.medicine_name,
        retail_price: activePrice,
        original_retail_price: activePrice,
        cost_price: activeCost,
        current_stock: item.current_stock || 0,
        qty: 1,
        unit: item.packing || item.unit || 'PACK',
        discount: '',
        discountType: 'flat'
      });
    }

    this.renderCart();
    this.updateSummary();
  },

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
    this.updateSummary();

    // Refocus search bar after deleting
    const searchInput = document.getElementById('sf-search');
    if (searchInput) searchInput.focus();
  },

  clearCart() {
    this.cart = [];
    this.moreBillItems = [];
    this.renderCart();
    this.updateSummary();
    const searchInput = document.getElementById('sf-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  },

  updateCartPrice(index, price) {
    const item = this.cart[index];
    if (!item) return;

    let parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    item.retail_price = parsed;
    this.updateLineTotal(index);
    this.updateSummary();
  },

  updateCartQty(index, qty) {
    const item = this.cart[index];
    if (!item) return;

    let parsed = parseFloat(qty);
    if (isNaN(parsed) || parsed < 0) parsed = 0;
    item.qty = parsed;
    this.updateLineTotal(index);
    this.updateSummary();
  },

  updateItemDiscount(index, val) {
    const item = this.cart[index];
    if (!item) return;

    if (val === '' || val === null || val === undefined || parseFloat(val) === 0) {
      item.discount = '';
    } else {
      let disc = parseFloat(val);
      if (isNaN(disc) || disc < 0) disc = 0;
      item.discount = disc;
    }
    this.updateLineTotal(index);
    this.updateSummary();
  },

  updateLineTotal(index) {
    const item = this.cart[index];
    if (!item) return;
    const lineTotalEl = document.getElementById(`cart-line-total-${index}`);
    if (lineTotalEl) {
      const sub = item.qty * item.retail_price;
      const discNum = parseFloat(item.discount) || 0;
      const total = Math.max(0, sub - (discNum * item.qty));
      lineTotalEl.textContent = app.formatNumber(total);
    }
  },

  // Tight Table Rendering with Editable MRP, Qty, and Discount
  renderCart() {
    const tbody = document.getElementById('sf-cart-tbody');
    if (!tbody) return;

    if (this.cart.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="px-4 py-16 text-center text-slate-300">
            <div class="flex flex-col items-center justify-center gap-1.5 opacity-60">
              <i data-lucide="shopping-cart" class="w-10 h-10 text-slate-300"></i>
              <p class="font-black uppercase tracking-widest text-[11px] text-slate-400">Cart is empty</p>
              <p class="text-[10px] text-slate-400 font-medium">Type medicine name above or press <kbd class="px-1.5 py-0.5 bg-slate-100 rounded font-black text-slate-700">F2</kbd> to search</p>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    tbody.innerHTML = this.cart.map((item, idx) => {
      const subtotal = item.qty * item.retail_price;
      const discNum = parseFloat(item.discount) || 0;
      const lineTotal = Math.max(0, subtotal - (discNum * item.qty));
      const stock = item.current_stock || 0;
      const isLowStock = stock <= 5;

      return `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 group">
          <!-- 1: Row # -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-center font-bold text-slate-400 tabular-nums">
            ${idx + 1}
          </td>

          <!-- 2: Medicine Name + Generic Salt + Stock in brackets -->
          <td class="px-3 py-1.5 border-r border-slate-100 min-w-[260px]">
            <div class="font-black text-slate-900 leading-snug">
              <span>${item.item_name}</span>
              ${item.brand_name && item.brand_name !== item.item_name ? `<span class="text-slate-500 font-semibold text-[11px]">(${item.brand_name})</span>` : ''}
              <span class="text-[11px] font-bold ${isLowStock ? 'text-rose-600' : 'text-teal-700'} ml-1">(${stock} in stock)</span>
            </div>
            ${item.generic_name ? `<div class="text-[10.5px] font-bold text-teal-600 mt-0.5">${item.generic_name}</div>` : ''}
          </td>

          <!-- 3: Dosage & Strength -->
          <td class="px-2.5 py-1.5 border-r border-slate-100 text-center">
            <span class="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-black text-[10.5px] border border-slate-200">${item.dosage_form || '-'}</span>
            ${item.strength ? `<span class="block text-[10px] font-bold text-slate-600 mt-0.5">${item.strength}</span>` : ''}
          </td>

          <!-- 4: Packing -->
          <td class="px-2 py-1.5 border-r border-slate-100 text-center text-slate-600 font-bold text-[10.5px]">
            ${item.packing || item.unit || '-'}
          </td>

          <!-- 7: Editable MRP (Retail Price) -->
          <td class="px-2 py-1 border-r border-slate-100 text-right">
            <input type="number" 
                   id="cart-price-${idx}" 
                   value="${item.retail_price}" 
                   min="0" 
                   step="any"
                   onfocus="this.select()"
                   oninput="SalesForm.updateCartPrice(${idx}, this.value)"
                   onkeydown="SalesForm.onPriceKeyDown(event, ${idx})"
                   class="w-18 h-7 px-1.5 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-lg text-xs font-black text-slate-800 text-right outline-none tabular-nums shadow-2xs">
          </td>

          <!-- 8: Qty Input (Keyboard Navigable) -->
          <td class="px-2 py-1 border-r border-slate-100 text-center">
            <input type="number" 
                   id="cart-qty-${idx}" 
                   value="${item.qty}" 
                   min="1" 
                   step="any"
                   onfocus="this.select()"
                   oninput="SalesForm.updateCartQty(${idx}, this.value)"
                   onkeydown="SalesForm.onQtyKeyDown(event, ${idx})"
                   class="w-16 h-7 px-1 bg-indigo-50/60 border border-indigo-200 focus:border-indigo-500 focus:bg-white rounded-lg text-xs font-black text-indigo-950 text-center outline-none tabular-nums shadow-2xs">
          </td>

          <!-- 9: Disc Input (Keyboard Navigable) -->
          <td class="px-2 py-1 border-r border-slate-100 text-right">
            <input type="number" 
                   id="cart-disc-${idx}" 
                   value="${item.discount || ''}" 
                   placeholder="0" 
                   min="0" 
                   step="any"
                   onfocus="this.select()"
                   oninput="SalesForm.updateItemDiscount(${idx}, this.value)"
                   onkeydown="SalesForm.onDiscKeyDown(event, ${idx})"
                   class="w-16 h-7 px-1 bg-rose-50/50 border border-rose-200 focus:border-rose-500 focus:bg-white rounded-lg text-xs font-black text-rose-700 text-right outline-none tabular-nums shadow-2xs">
          </td>

          <!-- 10: Line Total -->
          <td class="px-3 py-1.5 border-r border-slate-100 text-right font-display font-black text-emerald-800 text-xs tabular-nums" id="cart-line-total-${idx}">
            ${app.formatNumber(lineTotal)}
          </td>

          <!-- 11: Action Delete -->
          <td class="px-2 py-1.5 text-center">
            <button onclick="SalesForm.removeFromCart(${idx})" class="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Remove Medicine">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  // Keyboard navigation for Price, Qty, and Disc
  onPriceKeyDown(e, idx) {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      const qtyInput = document.getElementById(`cart-qty-${idx}`);
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextPrice = document.getElementById(`cart-price-${idx + 1}`);
      if (nextPrice) {
        nextPrice.focus();
        nextPrice.select();
      } else {
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        const prevPrice = document.getElementById(`cart-price-${idx - 1}`);
        if (prevPrice) {
          prevPrice.focus();
          prevPrice.select();
        }
      } else {
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
      }
    }
  },

  onQtyKeyDown(e, idx) {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      const discInput = document.getElementById(`cart-disc-${idx}`);
      if (discInput) {
        discInput.focus();
        discInput.select();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const priceInput = document.getElementById(`cart-price-${idx}`);
      if (priceInput) {
        priceInput.focus();
        priceInput.select();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextQty = document.getElementById(`cart-qty-${idx + 1}`);
      if (nextQty) {
        nextQty.focus();
        nextQty.select();
      } else {
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        const prevQty = document.getElementById(`cart-qty-${idx - 1}`);
        if (prevQty) {
          prevQty.focus();
          prevQty.select();
        }
      } else {
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
      }
    }
  },

  onDiscKeyDown(e, idx) {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move directly back to medicine search bar to add next item
      const searchInput = document.getElementById('sf-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const qtyInput = document.getElementById(`cart-qty-${idx}`);
      if (qtyInput) {
        qtyInput.focus();
        qtyInput.select();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextDisc = document.getElementById(`cart-disc-${idx + 1}`);
      if (nextDisc) {
        nextDisc.focus();
        nextDisc.select();
      } else {
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) {
        const prevDisc = document.getElementById(`cart-disc-${idx - 1}`);
        if (prevDisc) {
          prevDisc.focus();
          prevDisc.select();
        }
      } else {
        const searchInput = document.getElementById('sf-search');
        if (searchInput) searchInput.focus();
      }
    }
  },

  setDiscountType(type) {
    this.discountType = type;
    const flatBtn = document.getElementById('sf-disc-type-flat');
    const pctBtn = document.getElementById('sf-disc-type-percent');
    if (flatBtn && pctBtn) {
      if (type === 'flat') {
        flatBtn.className = 'px-1.5 py-0.5 rounded font-black bg-slate-900 text-white';
        pctBtn.className = 'px-1.5 py-0.5 rounded font-black text-slate-600';
      } else {
        pctBtn.className = 'px-1.5 py-0.5 rounded font-black bg-slate-900 text-white';
        flatBtn.className = 'px-1.5 py-0.5 rounded font-black text-slate-600';
      }
    }
    this.persistDiscTaxValues();
    this.updateSummary();
  },

  setTaxType(type) {
    this.taxType = type;
    const pctBtn = document.getElementById('sf-tax-type-percent');
    const flatBtn = document.getElementById('sf-tax-type-flat');
    if (pctBtn && flatBtn) {
      if (type === 'percent') {
        pctBtn.className = 'px-1.5 py-0.5 rounded font-black bg-slate-900 text-white';
        flatBtn.className = 'px-1.5 py-0.5 rounded font-black text-slate-600';
      } else {
        flatBtn.className = 'px-1.5 py-0.5 rounded font-black bg-slate-900 text-white';
        pctBtn.className = 'px-1.5 py-0.5 rounded font-black text-slate-600';
      }
    }
    this.persistDiscTaxValues();
    this.updateSummary();
  },

  toggleDiscTaxFields(checked) {
    this.showDiscTax = !!checked;
    if (window.storage) {
      window.storage.set('pos_show_disc_tax', this.showDiscTax);
    }
    const container = document.getElementById('sf-disc-tax-container');
    if (container) {
      if (this.showDiscTax) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    }
    this.updateSummary();
  },

  persistDiscTaxValues() {
    if (!window.storage) return;
    const addDiscInput = document.getElementById('sf-additional-discount');
    if (addDiscInput) {
      const discVal = parseFloat(addDiscInput.value) || 0;
      window.storage.set('pos_saved_disc_val', discVal);
    }
    window.storage.set('pos_saved_disc_type', this.discountType || 'flat');

    const taxInput = document.getElementById('sf-tax');
    if (taxInput) {
      const taxVal = parseFloat(taxInput.value) || 0;
      window.storage.set('pos_saved_tax_val', taxVal);
    }
    window.storage.set('pos_saved_tax_type', this.taxType || 'percent');
  },

  updateSummary() {
    let subtotal = 0;
    let itemDiscountTotal = 0;

    this.cart.forEach(item => {
      const itemLineSub = item.qty * item.retail_price;
      subtotal += itemLineSub;
      const discNum = parseFloat(item.discount) || 0;
      itemDiscountTotal += (discNum * item.qty);
    });

    let additionalDisc = 0;
    if (this.showDiscTax) {
      const addDiscInput = document.getElementById('sf-additional-discount');
      if (addDiscInput) {
        const val = parseFloat(addDiscInput.value) || 0;
        if (val > 0) {
          if (this.discountType === 'percent') {
            additionalDisc = (subtotal * val) / 100;
          } else {
            additionalDisc = val;
          }
        }
      }
    }

    const totalDiscount = itemDiscountTotal + additionalDisc;
    const discountedTotal = Math.max(0, subtotal - totalDiscount);

    let taxAmount = 0;
    if (this.showDiscTax) {
      const taxInput = document.getElementById('sf-tax');
      const taxVal = parseFloat(taxInput?.value) || 0;
      if (taxVal > 0) {
        if (this.taxType === 'percent') {
          taxAmount = (discountedTotal * taxVal) / 100;
        } else {
          taxAmount = taxVal;
        }
      }
    }

    const fees = this.getMoreBillTotal();
    const moreBillBadge = document.getElementById('sf-more-bill-badge');
    if (moreBillBadge) {
      if (fees > 0) {
        moreBillBadge.textContent = `Rs. ${app.formatNumber(fees)}`;
        moreBillBadge.classList.remove('hidden');
        moreBillBadge.classList.add('inline-flex');
      } else {
        moreBillBadge.classList.add('hidden');
        moreBillBadge.classList.remove('inline-flex');
      }
    }

    const grandTotal = Math.max(0, discountedTotal + fees + taxAmount);
    this.currentGrandTotal = grandTotal;

    const subtotalEl = document.getElementById('sf-subtotal');
    if (subtotalEl) subtotalEl.textContent = app.formatCurrency(subtotal);

    const discEl = document.getElementById('sf-discount-amount');
    if (discEl) discEl.textContent = `- ${app.formatCurrency(totalDiscount)}`;

    const taxEl = document.getElementById('sf-tax-amount');
    if (taxEl) taxEl.textContent = `+ ${app.formatCurrency(taxAmount)}`;

    const grandTotalEl = document.getElementById('sf-grand-total');
    if (grandTotalEl) grandTotalEl.textContent = app.formatCurrency(grandTotal);

  },

  async completeSale(shouldPrint = true) {
    const cleanMoreBill = this.getCleanMoreBillItems();
    const fees = this.getMoreBillTotal();
    const feesName = cleanMoreBill.map(i => i.name).join(', ') || (fees > 0 ? 'More Bill Services' : '');

    if (this.cart.length === 0 && cleanMoreBill.length === 0) {
      return app.showAlert("Cart is empty! Please search and add medicines or extra bill items.");
    }

    for (const item of this.cart) {
      const itemQty = parseFloat(item.qty);
      if (isNaN(itemQty) || itemQty <= 0) {
        return app.showAlert(`Please enter a valid quantity for <b>${item.item_name}</b>.`);
      }
    }
    
    const name = (document.getElementById('sf-cust-name')?.value || '').trim();
    const phone = (document.getElementById('sf-cust-phone')?.value || '').trim();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length !== 11) {
      return app.showAlert("Phone number must be exactly 11 digits (e.g. 03001234567)");
    }
    const currentSaleNo = this.saleNumber || await window.api.getNextProposalNumber();
    
    let finalName = name;
    if (!finalName) {
      finalName = await window.api.getNextCustomerName();
    }

    let subtotal = 0;
    let itemDiscountTotal = 0;
    let totalCost = 0;

    const items = this.cart.map(i => {
      const itemLineSub = i.qty * i.retail_price;
      subtotal += itemLineSub;
      const discAmt = (parseFloat(i.discount) || 0) * i.qty;
      itemDiscountTotal += discAmt;
      totalCost += (i.qty * i.cost_price);
      const lineRetail = itemLineSub - discAmt;
      const unitDiscounted = lineRetail / i.qty;

      return {
        item_id: i.id,
        section: i.slug,
        description: i.description || i.item_name,
        generic_name: i.generic_name || '',
        batch_no: i.batch_no || '',
        expiry_date: i.expiry_date || '',
        qty: i.qty,
        unit: i.unit || 'PACK',
        unit_cost: i.cost_price,
        unit_retail: i.retail_price,
        unit_discounted: unitDiscounted,
        line_cost: i.qty * i.cost_price,
        line_retail: lineRetail,
        line_profit: lineRetail - (i.qty * i.cost_price)
      };
    });

    let additionalDisc = 0;
    if (this.showDiscTax) {
      const addDiscVal = parseFloat(document.getElementById('sf-additional-discount')?.value) || 0;
      if (addDiscVal > 0) {
        if (this.discountType === 'percent') {
          additionalDisc = (subtotal * addDiscVal) / 100;
        } else {
          additionalDisc = addDiscVal;
        }
      }
    }
    const totalDiscount = itemDiscountTotal + additionalDisc;
    const discountedTotal = Math.max(0, subtotal - totalDiscount);

    let taxAmount = 0;
    let taxRate = 0;
    if (this.showDiscTax) {
      const taxInputVal = parseFloat(document.getElementById('sf-tax')?.value) || 0;
      if (taxInputVal > 0) {
        if (this.taxType === 'percent') {
          taxRate = taxInputVal;
          taxAmount = (discountedTotal * taxRate) / 100;
        } else {
          taxAmount = taxInputVal;
          taxRate = 0;
        }
      }
    }

    const grandTotal = Math.max(0, discountedTotal + fees + taxAmount);
    const totalProfit = grandTotal - totalCost;

    const saleData = {
      proposal_number: currentSaleNo,
      customer_name: finalName,
      phone: phone,
      date: new Date().toISOString(),
      store_name: this.settings?.company_name || 'AFRIDI DIAGNOSTIC CENTRE',
      store_address: this.settings?.address || 'Near Babu Hotel, Railway Ground, Taxila',
      store_phone: this.settings?.phone || '0333-9109092',
      retail_total: grandTotal,
      cost_total: totalCost,
      profit: totalProfit,
      status: 'Paid',
      received_amount: grandTotal,
      cash_received: 0,
      change_return: 0,
      discount: totalDiscount,
      tax: taxAmount,
      tax_rate: taxRate,
      fees: fees,
      fees_name: feesName,
      more_bill_items: JSON.stringify(cleanMoreBill),
      payment_method: this.paymentMethod,
      sale_mode: app.saleMode || 'retail',
      items: items
    };

    if (this.editingSaleId) {
      saleData.id = this.editingSaleId;
    }

    const doSave = async () => {
      app.showLoading();
      try {
        await window.api.saveProposal(saleData);

        if (finalName && !finalName.startsWith('Walk-in')) {
          let cust = this.customers.find(c => c.name === finalName);
          if (cust) {
            await window.api.saveCustomer({ ...cust, phone: phone || cust.phone });
          } else {
            await window.api.saveCustomer({ name: finalName, phone: phone, amount: 0 });
          }
        }

        app.hideLoading();

        if (shouldPrint) {
          await this.generateReceipt(saleData);
          await app.printReceipt();
        }

        if (this.editingSaleId) {
          app.navigate('proposals');
        } else {
          app.navigate('proposal-form');
        }
      } catch (e) {
        console.error(e);
        app.hideLoading();
        app.showAlert("Error saving transaction: " + e.message);
      }
    };

    const receiptHtml = await this.generateReceipt(saleData);

    const summaryHtml = `
      <div class="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
        ${finalName && !finalName.startsWith('Walk-in') ? `
        <div class="flex justify-between items-center text-slate-600">
          <span>Patient:</span>
          <span class="font-bold text-slate-900">${finalName}</span>
        </div>` : ''}
        <div class="flex justify-between items-center text-slate-600">
          <span>Payment Channel:</span>
          <span class="font-bold text-teal-700 uppercase">${this.paymentMethod}</span>
        </div>
        ${items.length > 0 ? `
        <div class="flex justify-between items-center text-slate-600">
          <span>Medicines:</span>
          <span class="font-bold text-slate-900">${items.length} items (${items.reduce((s, i) => s + i.qty, 0)} units)</span>
        </div>` : ''}
        ${cleanMoreBill.length > 0 ? `
        <div class="flex justify-between items-center text-slate-600">
          <span>More Bill (${cleanMoreBill.length} item${cleanMoreBill.length > 1 ? 's' : ''}):</span>
          <span class="font-bold text-slate-900">${app.formatCurrency(fees)}</span>
        </div>
        ${cleanMoreBill.map(mb => `
          <div class="flex justify-between items-center text-[11px] text-slate-500 pl-2">
            <span>• ${mb.name}:</span>
            <span class="font-semibold text-slate-700">${app.formatCurrency(mb.amount)}</span>
          </div>
        `).join('')}
        ` : (fees > 0 ? `
        <div class="flex justify-between items-center text-slate-600">
          <span>${feesName || 'Checkup Fees'}:</span>
          <span class="font-bold text-slate-900">${app.formatCurrency(fees)}</span>
        </div>` : '')}
        ${taxAmount > 0 ? `
        <div class="flex justify-between items-center text-slate-600">
          <span>Tax / GST ${taxRate > 0 ? `(${taxRate}%)` : ''}:</span>
          <span class="font-bold text-teal-700">+${app.formatCurrency(taxAmount)}</span>
        </div>` : ''}
        <div class="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
          <span class="font-black text-slate-800">Total:</span>
          <span class="font-black text-teal-700 text-base">${app.formatCurrency(grandTotal)}</span>
        </div>
      </div>
    `;

    app.showConfirm({
      title: this.editingSaleId ? 'Confirm Invoice Update' : 'Complete Pharmacy Sale',
      message: `<p class="text-sm text-slate-600">Confirm sale for invoice <b class="font-black text-slate-900">${currentSaleNo}</b>?</p>${summaryHtml}`,
      confirmText: shouldPrint ? 'Confirm & Print' : 'Confirm & Save',
      confirmColor: 'green',
      previewHtml: receiptHtml,
      onConfirm: doSave
    });
  },

  async generateReceipt(data) {
    const previewEl = document.getElementById('preview-paper');
    if (!this.settings || !this.settings.company_name) {
      this.settings = await window.api.getSettings();
    }

    let rowIdx = 1;
    let rowHtml = '';

    // 1. Medicines List (rendered first)
    (data.items || []).forEach(item => {
      const rawName = item.item_name || (item.description ? item.description.split(' - ')[0] : '');
      const cleanName = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim();

      rowHtml += `
        <tr>
          <td style="border: 1px solid #000; padding: 6px 3px; font-size: 11px; text-align: center; color: #000; font-weight: 600;">${rowIdx++}</td>
          <td style="border: 1px solid #000; padding: 6px 6px; font-size: 12px; color: #000; font-weight: bold; line-height: 1.25;">
            ${cleanName}
          </td>
          <td style="border: 1px solid #000; padding: 6px 3px; font-size: 12px; text-align: center; color: #000; font-weight: bold;">${item.qty}</td>
          <td style="border: 1px solid #000; padding: 6px 4px; font-size: 11.5px; text-align: right; color: #000;">${app.formatAmount(item.unit_discounted || item.unit_retail)}</td>
          <td style="border: 1px solid #000; padding: 6px 4px; font-size: 12px; text-align: right; color: #000; font-weight: bold;">${app.formatAmount(item.line_retail)}</td>
        </tr>
      `;
    });

    // 2. More Bill items (rendered after medicines list)
    let moreBillList = [];
    if (data.more_bill_items) {
      try {
        moreBillList = typeof data.more_bill_items === 'string' ? JSON.parse(data.more_bill_items) : data.more_bill_items;
      } catch (e) {
        moreBillList = [];
      }
    }
    if ((!moreBillList || moreBillList.length === 0) && (data.fees && data.fees > 0)) {
      moreBillList = [{ name: data.fees_name || 'Checkup Fees', amount: data.fees }];
    }

    (moreBillList || []).forEach(mb => {
      const amt = parseFloat(mb.amount) || 0;
      if (amt > 0 || (mb.name && mb.name.trim())) {
        rowHtml += `
          <tr>
            <td style="border: 1px solid #000; padding: 6px 3px; font-size: 11px; text-align: center; color: #000; font-weight: 600;">${rowIdx++}</td>
            <td style="border: 1px solid #000; padding: 6px 6px; font-size: 12px; color: #000; font-weight: bold; line-height: 1.25;">
              ${mb.name || 'Service'}
            </td>
            <td style="border: 1px solid #000; padding: 6px 3px; font-size: 12px; text-align: center; color: #000; font-weight: bold;">1</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 11.5px; text-align: right; color: #000;">${app.formatAmount(amt)}</td>
            <td style="border: 1px solid #000; padding: 6px 4px; font-size: 12px; text-align: right; color: #000; font-weight: bold;">${app.formatAmount(amt)}</td>
          </tr>
        `;
      }
    });

    const moreBillSum = (moreBillList || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0) || (data.fees || 0);
    const grossTotal = (data.items || []).reduce((s, i) => s + (i.qty * (i.unit_retail || 0)), 0) + moreBillSum;

    const storeName = data.store_name || this.settings?.company_name || 'AFRIDI DIAGNOSTIC CENTRE';
    const storeAddress = data.store_address || this.settings?.address || 'Near Babu Hotel, Railway Ground, Taxila';
    const storePhone = data.store_phone || this.settings?.phone || '0333-9109092';

    const html = `
      <div class="receipt-80mm" style="width: 100%; max-width: 400px; margin: 0 auto; padding: 14px 16px; background: #fff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000; box-sizing: border-box; font-size: 12px; line-height: 1.45; border: 1px solid #ddd;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 10px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
          <h1 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000; line-height: 1.2;">${storeName}</h1>
          <p style="font-size: 11.5px; margin: 3px 0 1px; font-weight: bold; color: #000;">${storeAddress}</p>
          <p style="font-size: 10.5px; margin: 1px 0 0; font-weight: bold; color: #000;">Ph: ${storePhone}</p>
        </div>
        
        <!-- Metadata -->
        <div style="font-size: 11px; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px; line-height: 1.55;">
          <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Inv #:</span> <span style="font-weight: 900; font-size: 12px;">${data.proposal_number}</span></div>
          <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Date & Time:</span> <span>${app.formatDateTime(data.date)}</span></div>
          ${data.customer_name && !data.customer_name.startsWith('Walk-in') ? `<div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Patient:</span> <span style="font-weight: bold;">${data.customer_name}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between;"><span style="font-weight: bold;">Payment:</span> <span style="font-weight: bold; text-transform: uppercase;">${data.payment_method || 'Cash'}</span></div>
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

        <!-- Totals -->
        <div style="border-top: 1.5px solid #000; padding-top: 6px; margin-bottom: 10px; font-size: 12px; line-height: 1.65;">
          <div style="display: flex; justify-content: space-between;">
            <span>Gross Total (MRP):</span>
            <span style="font-weight: bold;">${app.formatCurrency(grossTotal)}</span>
          </div>
          ${data.discount ? `
          <div style="display: flex; justify-content: space-between; color: #b91c1c;">
            <span>Discount Allowed:</span>
            <span style="font-weight: bold;">-${app.formatCurrency(data.discount)}</span>
          </div>
          ` : ''}
          ${data.tax && data.tax > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #0f766e;">
            <span>Tax / GST ${data.tax_rate ? `(${data.tax_rate}%)` : ''}:</span>
            <span style="font-weight: bold;">+${app.formatCurrency(data.tax)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14.5px; font-weight: 900; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; padding: 4px 0; margin-top: 4px;">
            <span>TOTAL:</span>
            <span>${app.formatCurrency(data.retail_total)}</span>
          </div>
          ${data.cash_received && data.cash_received > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 11.5px; padding-top: 4px;">
            <span>Cash Received:</span>
            <span style="font-weight: bold;">${app.formatCurrency(data.cash_received)}</span>
          </div>
          ${data.change_return && data.change_return > 0 ? `
          <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #047857;">
            <span>Change Return:</span>
            <span style="font-weight: bold;">${app.formatCurrency(data.change_return)}</span>
          </div>
          ` : ''}
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 8px; font-size: 11px; font-weight: bold; color: #000;">
          <p style="margin: 0;">Thank you for your visit!</p>
        </div>
      </div>
    `;

    app.setPrintContent('receipt-print', html);
    if (previewEl) previewEl.innerHTML = html;
    return html;
  },

  // --- MORE BILL MODAL METHODS ---
  openMoreBillModal() {
    if (!this.moreBillItems || this.moreBillItems.length === 0) {
      this.moreBillItems = [{ name: '', amount: '' }];
    }
    const modal = document.getElementById('more-bill-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.renderMoreBillRows();
      setTimeout(() => {
        const firstInput = document.getElementById('mb-item-name-0');
        if (firstInput) firstInput.focus();
      }, 50);
      if (window.lucide) lucide.createIcons();
    }
  },

  closeMoreBillModal() {
    const modal = document.getElementById('more-bill-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
    // Clean up empty rows
    if (this.moreBillItems && this.moreBillItems.length > 0) {
      const cleaned = this.moreBillItems.filter(i => (i.name && i.name.trim()) || (i.amount !== '' && parseFloat(i.amount) > 0));
      this.moreBillItems = cleaned.length > 0 ? cleaned : [];
    }
    this.updateSummary();
  },

  renderMoreBillRows() {
    const container = document.getElementById('more-bill-rows-container');
    if (!container) return;

    if (!this.moreBillItems || this.moreBillItems.length === 0) {
      this.moreBillItems = [{ name: '', amount: '' }];
    }

    container.innerHTML = this.moreBillItems.map((item, idx) => `
      <div class="flex items-center gap-2 group">
        <span class="w-6 text-center font-bold text-slate-400 text-xs tabular-nums select-none">${idx + 1}</span>
        <input type="text"
               id="mb-item-name-${idx}"
               value="${(item.name || '').replace(/"/g, '&quot;')}"
               placeholder="Item name (e.g. X-Ray, Checkup)"
               oninput="SalesForm.updateMoreBillRowName(${idx}, this.value)"
               onkeydown="if(event.key === 'Enter') { event.preventDefault(); const amt = document.getElementById('mb-item-amount-${idx}'); if (amt) { amt.focus(); amt.select(); } }"
               class="flex-1 h-9 px-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-800 outline-none transition-colors">
        <div class="flex items-center h-9 w-36 px-2.5 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white border border-slate-200 focus-within:border-teal-500 rounded-xl transition-colors">
          <span class="text-slate-400 text-xs font-bold mr-1.5 select-none">Rs.</span>
          <input type="number"
                 id="mb-item-amount-${idx}"
                 value="${item.amount !== undefined && item.amount !== '' ? item.amount : ''}"
                 placeholder="0"
                 min="0"
                 step="1"
                 oninput="SalesForm.updateMoreBillRowAmount(${idx}, this.value)"
                 onkeydown="if(event.key === 'Enter') { event.preventDefault(); SalesForm.addMoreBillRow(); }"
                 class="w-full bg-transparent text-xs font-black text-slate-900 outline-none text-right tabular-nums">
        </div>
        <button type="button" onclick="SalesForm.removeMoreBillRow(${idx})" class="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0" title="Remove item">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `).join('');

    const totalEl = document.getElementById('more-bill-modal-total');
    if (totalEl) {
      totalEl.textContent = `Rs. ${app.formatNumber(this.getMoreBillTotal())}`;
    }

    if (window.lucide) lucide.createIcons();
  },

  addMoreBillRow(name = '', amount = '') {
    if (!this.moreBillItems) this.moreBillItems = [];
    this.moreBillItems.push({ name, amount });
    this.renderMoreBillRows();
    setTimeout(() => {
      const input = document.getElementById(`mb-item-name-${this.moreBillItems.length - 1}`);
      if (input) input.focus();
    }, 50);
  },

  removeMoreBillRow(idx) {
    if (!this.moreBillItems) return;
    this.moreBillItems.splice(idx, 1);
    if (this.moreBillItems.length === 0) {
      this.moreBillItems = [{ name: '', amount: '' }];
    }
    this.renderMoreBillRows();
    this.updateSummary();
  },

  addMoreBillSuggestion(name, amount) {
    if (!this.moreBillItems) this.moreBillItems = [];
    if (this.moreBillItems.length === 1 && !this.moreBillItems[0].name && (this.moreBillItems[0].amount === '' || !this.moreBillItems[0].amount)) {
      this.moreBillItems[0] = { name, amount };
    } else {
      this.moreBillItems.push({ name, amount });
    }
    this.renderMoreBillRows();
    this.updateSummary();
  },

  updateMoreBillRowName(idx, val) {
    if (this.moreBillItems && this.moreBillItems[idx]) {
      this.moreBillItems[idx].name = val;
    }
  },

  updateMoreBillRowAmount(idx, val) {
    if (this.moreBillItems && this.moreBillItems[idx]) {
      this.moreBillItems[idx].amount = val === '' ? '' : (parseFloat(val) || 0);
    }
    const totalEl = document.getElementById('more-bill-modal-total');
    if (totalEl) {
      totalEl.textContent = `Rs. ${app.formatNumber(this.getMoreBillTotal())}`;
    }
    this.updateSummary();
  },

  clearAllMoreBillRows() {
    this.moreBillItems = [{ name: '', amount: '' }];
    this.renderMoreBillRows();
    this.updateSummary();
  },

  saveMoreBillModal() {
    this.closeMoreBillModal();
  },

  onCustomerInput(val, initial = false) {
    const cust = this.customers.find(c => c.name === val);
    if (cust) {
      if (!initial) {
        document.getElementById('sf-cust-phone').value = cust.phone || '';
      }
    }
  }
};

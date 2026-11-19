/**
 * RESTO DADDY - Master Frontend Application
 * A polished commercial SaaS restaurant management ecosystem.
 */

// Global App State
const state = {
    currentView: 'dashboard',
    branch: 'CP - Inner Circle 3',
    staff: { name: 'Alex Vance', role: 'Manager', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80' },
    soundEnabled: true,
    categories: [],
    menuItems: [],
    selectedCategory: 'all',
    searchQuery: '',
    vegFilter: null,
    cart: [],
    cartOrderType: 'dine_in',
    cartTable: 'Inside 01',
    cartCustomerName: '',
    cartCustomerPhone: '',
    cartSpecialNotes: '',
    cartDiscountCode: '',
    cartDiscountAmount: 0,
    kdsTickets: { received: [], preparing: [], ready: [] },
    kdsFilterStation: 'all',
    tables: [],
    inventoryOverview: null,
    inventoryItems: [],
    recentOrders: [],
    stats: {},
    chartInstances: {},
    qrSelectedTable: 'Inside 02',
    waiterActiveTab: 'tables', // tables, menu, order
    waiterSelectedTable: null,
    waiterCart: []
};

// Formatting Helpers
function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
        return isoStr;
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
        success: 'bg-emerald-600 text-white',
        danger: 'bg-rose-600 text-white',
        warning: 'bg-amber-600 text-white',
        info: 'bg-slate-900 text-white'
    };

    toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium ${bgColors[type] || bgColors.info} transition-all transform duration-300 translate-y-2 opacity-0 z-50`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
window.showToast = showToast;

// Router & View Switching
function navigateTo(viewName, params = {}) {
    state.currentView = viewName;
    window.location.hash = viewName;

    // Update active state in sidebar
    document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
        const target = btn.getAttribute('data-view');
        if (target === viewName) {
            btn.className = 'sidebar-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-white bg-orange-600 shadow-sm transition-colors';
        } else {
            btn.className = 'sidebar-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors';
        }
    });

    // Update Quick View pills in top bar
    document.querySelectorAll('.quick-view-pill').forEach(pill => {
        const target = pill.getAttribute('data-view');
        if (target === viewName) {
            pill.className = 'quick-view-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-300 shadow-xs';
        } else {
            pill.className = 'quick-view-pill px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors';
        }
    });

    const contentArea = document.getElementById('main-content-area');
    contentArea.innerHTML = '<div class="flex items-center justify-center p-20"><div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>';

    // Render corresponding view
    switch (viewName) {
        case 'dashboard':
            renderDashboardView();
            break;
        case 'cashier':
            renderCashierView();
            break;
        case 'pos':
            renderPOSView();
            break;
        case 'kds':
            renderKDSView();
            break;
        case 'waiter':
            renderWaiterView();
            break;
        case 'qr':
            renderQRMenuView(params.table || state.qrSelectedTable);
            break;
        case 'tables':
            renderTablesView();
            break;
        case 'menu':
            renderMenuAdminView();
            break;
        case 'inventory':
            renderInventoryView();
            break;
        case 'staff':
            renderStaffView();
            break;
        case 'customers':
            renderCustomersView();
            break;
        case 'billing':
            renderBillingView();
            break;
        case 'reports':
            renderReportsView();
            break;
        case 'settings':
            renderSettingsView();
            break;
        default:
            renderDashboardView();
    }

    if (window.lucide) {
        setTimeout(() => lucide.createIcons(), 50);
    }
}
window.navigateTo = navigateTo;

// ==========================================
// CASHIER DASHBOARD & REGISTER SETTLEMENT
// ==========================================
async function renderCashierView() {
    const contentArea = document.getElementById('main-content-area');
    
    try {
        const [summary, pendingBills] = await Promise.all([
            fetch('/api/cashier/summary').then(r => r.json()),
            fetch('/api/cashier/pending-bills').then(r => r.json())
        ]);

        contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Header with Cashier Info & Quick Drawer Actions -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-950/20">
                        <i data-lucide="badge-dollar-sign" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="text-2xl font-black text-slate-900 tracking-tight">Cashier Station & Settlement</h1>
                            <span class="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">Shift Active</span>
                        </div>
                        <p class="text-xs text-slate-500">Cashier: <b class="text-slate-800">${summary.session.cashier_name || 'Priya Kapoor'}</b> • Register Shift: <span class="font-mono font-semibold">REG-104</span> • Branch: ${state.branch}</p>
                    </div>
                </div>

                <!-- Cash Drawer Control Buttons -->
                <div class="flex items-center gap-2">
                    <button onclick="openCashDrawerSimulation()" class="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition">
                        <i data-lucide="unlock" class="w-3.5 h-3.5 text-amber-400"></i>
                        <span>Open Drawer</span>
                    </button>
                    <button onclick="openCashMovementModal('drop')" class="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition">
                        <i data-lucide="arrow-down-right" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>Cash Drop</span>
                    </button>
                    <button onclick="openCashMovementModal('payout')" class="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition">
                        <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 text-rose-600"></i>
                        <span>Petty Cash</span>
                    </button>
                    <button onclick="openCloseSessionModal()" class="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition">
                        <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                        <span>End Shift</span>
                    </button>
                </div>
            </div>

            <!-- Top Cashier Metric Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 1. Expected Cash in Drawer -->
                <div class="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-emerald-100">Expected In Drawer</span>
                        <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <i data-lucide="wallet" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="my-2">
                        <span class="text-3xl font-black tabular-nums tracking-tight">${formatCurrency(summary.expected_cash_in_drawer)}</span>
                    </div>
                    <div class="flex items-center justify-between text-3xs text-emerald-100 border-t border-white/20 pt-2">
                        <span>Float: ${formatCurrency(summary.opening_float)}</span>
                        <span>Sales: +${formatCurrency(summary.cash_total)}</span>
                    </div>
                </div>

                <!-- 2. UPI Collections -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">UPI / QR Digital</span>
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="qr-code" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="my-2">
                        <span class="text-3xl font-black text-slate-900 tabular-nums">${formatCurrency(summary.upi_total)}</span>
                    </div>
                    <p class="text-3xs text-slate-400 border-t border-slate-100 pt-2">Instant settlements verified</p>
                </div>

                <!-- 3. Card Collections -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Card Swiped</span>
                        <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i data-lucide="credit-card" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="my-2">
                        <span class="text-3xl font-black text-slate-900 tabular-nums">${formatCurrency(summary.card_total)}</span>
                    </div>
                    <p class="text-3xs text-slate-400 border-t border-slate-100 pt-2">POS EDC machine batch</p>
                </div>

                <!-- 4. Pending Settlement Queue -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Settlement</span>
                        <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="my-2 flex items-baseline gap-2">
                        <span class="text-3xl font-black text-slate-900 tabular-nums">${summary.pending_checks_count}</span>
                        <span class="text-xs font-bold text-amber-600">Unsettled checks</span>
                    </div>
                    <p class="text-3xs text-slate-400 border-t border-slate-100 pt-2">Tables awaiting bill payment</p>
                </div>
            </div>

            <!-- Two-Column Layout: Settlement Queue & Cashier Drawer Log -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left 2 Columns: Live Pending Bills Settlement Queue -->
                <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                            <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                                <i data-lucide="receipt" class="w-4 h-4 text-orange-600"></i>
                                <span>Unsettled Bills Queue</span>
                            </h3>
                            <p class="text-xs text-slate-400">Tables and orders awaiting cashier collection</p>
                        </div>
                        <button onclick="renderCashierView()" class="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition" title="Refresh Queue">
                            <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                        </button>
                    </div>

                    ${pendingBills.length === 0 ? `
                        <div class="flex flex-col items-center justify-center py-16 text-slate-400">
                            <i data-lucide="check-circle-2" class="w-12 h-12 text-emerald-500 stroke-1 mb-2"></i>
                            <h4 class="font-bold text-slate-700 text-sm">All checks settled!</h4>
                            <p class="text-xs text-slate-400 mt-1">There are no unpaid orders waiting for settlement.</p>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${pendingBills.map(ord => `
                                <div class="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 hover:border-orange-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div class="space-y-1">
                                        <div class="flex items-center gap-2">
                                            <span class="font-black text-sm text-slate-900">${ord.table_number || ord.order_type.toUpperCase()}</span>
                                            <span class="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">${ord.order_number}</span>
                                            <span class="text-3xs uppercase font-extrabold px-2 py-0.5 rounded-full ${ord.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}">
                                                ${ord.status}
                                            </span>
                                        </div>
                                        <p class="text-xs text-slate-500">
                                            Guest: <b class="text-slate-700">${ord.customer_name || 'Walk-in'}</b> • Waiter: ${ord.waiter_name || 'Staff'} • Ordered: ${formatDate(ord.created_at)}
                                        </p>
                                        <div class="text-2xs text-slate-400">
                                            ${ord.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-4 sm:border-l sm:border-slate-200 sm:pl-4 shrink-0">
                                        <div class="text-right">
                                            <span class="text-3xs text-slate-400 block">Total Due (inc. GST)</span>
                                            <span class="text-xl font-black text-slate-900 tabular-nums">${formatCurrency(ord.grand_total)}</span>
                                        </div>
                                        <button onclick="openCashierSettleModal('${ord.id}', '${ord.order_number}', ${ord.grand_total})" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5">
                                            <i data-lucide="check" class="w-4 h-4"></i>
                                            <span>Settle Check</span>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- Right Column: Cash Drawer Summary & Movements Log -->
                <div class="space-y-6">
                    <!-- Drawer Breakdown Card -->
                    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                        <h3 class="font-bold text-slate-900 text-base">Register Cash Balance</h3>
                        <div class="space-y-2 text-xs">
                            <div class="flex justify-between py-1 border-b border-slate-100">
                                <span class="text-slate-500">Opening Cash Float:</span>
                                <span class="font-bold text-slate-800 tabular-nums">${formatCurrency(summary.opening_float)}</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100">
                                <span class="text-slate-500">+ Cash Sales:</span>
                                <span class="font-bold text-emerald-600 tabular-nums">+${formatCurrency(summary.cash_total)}</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100">
                                <span class="text-slate-500">- Cash Drops to Safe:</span>
                                <span class="font-bold text-rose-600 tabular-nums">-${formatCurrency(summary.total_drops)}</span>
                            </div>
                            <div class="flex justify-between py-1 border-b border-slate-100">
                                <span class="text-slate-500">- Petty Cash Payouts:</span>
                                <span class="font-bold text-rose-600 tabular-nums">-${formatCurrency(summary.total_payouts)}</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                                <span>Net Drawer Balance:</span>
                                <span class="text-emerald-700 tabular-nums">${formatCurrency(summary.expected_cash_in_drawer)}</span>
                            </div>
                        </div>

                        <button onclick="openCashDrawerSimulation()" class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5">
                            <i data-lucide="unlock" class="w-3.5 h-3.5 text-amber-400"></i>
                            <span>Trigger Cash Drawer Pop (ESC/POS)</span>
                        </button>
                    </div>

                    <!-- Movement Audit Log -->
                    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Drawer Movement Log</h4>
                            <span class="text-3xs text-slate-400">${summary.movements.length} logged</span>
                        </div>
                        ${summary.movements.length === 0 ? `
                            <p class="text-xs text-slate-400 text-center py-4">No cash drops or payouts in this shift.</p>
                        ` : `
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${summary.movements.map(m => `
                                    <div class="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                                        <div>
                                            <div class="font-bold text-slate-800 capitalize">${m.movement_type === 'drop' ? 'Cash Drop to Safe' : 'Petty Cash Payout'}</div>
                                            <span class="text-3xs text-slate-400">${m.reason || 'General'} • ${formatDate(m.created_at)}</span>
                                        </div>
                                        <span class="font-extrabold ${m.movement_type === 'drop' ? 'text-blue-600' : 'text-rose-600'} tabular-nums">
                                            ${formatCurrency(m.amount)}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Cashier Dashboard: ${e.message}</div>`;
    }
}

// Cashier Settle Check Modal with Live Change Calculator
function openCashierSettleModal(orderId, orderNum, total) {
    const modal = document.createElement('div');
    modal.id = 'cashier-settle-modal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                    <h3 class="font-black text-slate-900 text-base">Settle Bill: ${orderNum}</h3>
                    <p class="text-2xs text-slate-400">Total Check Amount: <b class="text-slate-900">${formatCurrency(total)}</b></p>
                </div>
                <button onclick="document.getElementById('cashier-settle-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <!-- Payment Method Tabs -->
            <div class="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-center">
                <button type="button" onclick="setSettleMethod('cash', ${total})" id="tab-cash" class="py-2 rounded-lg bg-white text-slate-900 shadow-xs">Cash</button>
                <button type="button" onclick="setSettleMethod('upi', ${total})" id="tab-upi" class="py-2 rounded-lg text-slate-600">UPI</button>
                <button type="button" onclick="setSettleMethod('card', ${total})" id="tab-card" class="py-2 rounded-lg text-slate-600">Card</button>
                <button type="button" onclick="setSettleMethod('split', ${total})" id="tab-split" class="py-2 rounded-lg text-slate-600">Split</button>
            </div>

            <div id="cash-tender-section" class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-slate-700">Cash Tendered by Customer</label>
                    <input type="number" id="cash-tendered-input" value="${Math.ceil(total / 100) * 100}" oninput="calcChangeDue(${total})" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-lg font-black text-slate-900" />
                </div>
                <!-- Quick Tender Buttons -->
                <div class="flex gap-2">
                    <button type="button" onclick="setTenderValue(${total}, ${total})" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">Exact</button>
                    <button type="button" onclick="setTenderValue(500, ${total})" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">₹500</button>
                    <button type="button" onclick="setTenderValue(1000, ${total})" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">₹1,000</button>
                    <button type="button" onclick="setTenderValue(2000, ${total})" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">₹2,000</button>
                </div>
                <!-- Change Due Display -->
                <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <span class="text-xs font-bold text-emerald-800">Change Due to Customer:</span>
                    <span class="text-xl font-black text-emerald-700 tabular-nums" id="change-due-val">${formatCurrency(Math.max(0, (Math.ceil(total / 100) * 100) - total))}</span>
                </div>
            </div>

            <input type="hidden" id="selected-settle-method" value="cash" />

            <button onclick="executeCashierSettlement('${orderId}', ${total})" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Complete Settlement & Print Slip</span>
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    if (window.lucide) lucide.createIcons();
}

function setSettleMethod(method, total) {
    document.getElementById('selected-settle-method').value = method;
    ['cash', 'upi', 'card', 'split'].forEach(m => {
        const btn = document.getElementById(`tab-${m}`);
        if (btn) {
            btn.className = m === method ? 'py-2 rounded-lg bg-white text-slate-900 shadow-xs' : 'py-2 rounded-lg text-slate-600';
        }
    });

    const cashSec = document.getElementById('cash-tender-section');
    if (cashSec) {
        cashSec.style.display = method === 'cash' ? 'block' : 'none';
    }
}

function setTenderValue(val, total) {
    const input = document.getElementById('cash-tendered-input');
    if (input) {
        input.value = val;
        calcChangeDue(total);
    }
}

function calcChangeDue(total) {
    const tendered = parseFloat(document.getElementById('cash-tendered-input')?.value) || 0;
    const change = Math.max(0, tendered - total);
    const el = document.getElementById('change-due-val');
    if (el) el.textContent = formatCurrency(change);
}

async function executeCashierSettlement(orderId, total) {
    const method = document.getElementById('selected-settle-method')?.value || 'cash';
    const tendered = parseFloat(document.getElementById('cash-tendered-input')?.value) || total;

    try {
        const res = await fetch(`/api/cashier/settle/${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_method: method,
                amount_tendered: tendered
            })
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('cashier-settle-modal')?.remove();
            showToast(`✓ Check settled via ${method.toUpperCase()}!`, "success");
            openThermalReceiptModal(orderId, data.order.order_number);
            renderCashierView();
        } else {
            showToast("Failed to settle check", "danger");
        }
    } catch (e) {
        showToast("Settlement error: " + e.message, "danger");
    }
}

function openCashDrawerSimulation() {
    try {
        // Electronic cash drawer open chime / trigger sound
        const ctx = window.restoWS && window.restoWS.audioContext ? window.restoWS.audioContext : new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    } catch(e) {}
    showToast("🔓 Cash Drawer Popped Open (Pulse sent to ESC/POS printer RJ11)", "success");
}

function openCashMovementModal(type = 'drop') {
    const modal = document.createElement('div');
    modal.id = 'cash-movement-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-bold text-slate-900 text-base">${type === 'drop' ? 'Safe Cash Drop' : 'Petty Cash Payout'}</h3>
                <button onclick="document.getElementById('cash-movement-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-slate-700">Amount (INR)</label>
                    <input type="number" id="movement-amt" value="500" class="w-full mt-1 px-3 py-2 border rounded-xl font-bold" />
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-700">Reason / Description</label>
                    <input type="text" id="movement-reason" placeholder="${type === 'drop' ? 'Mid-day safe deposit' : 'Milk, ice or lemons purchase'}" class="w-full mt-1 px-3 py-2 border rounded-xl text-xs" />
                </div>
            </div>
            <button onclick="submitCashMovement('${type}')" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition">
                Record Drawer Movement
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitCashMovement(type) {
    const amount = parseFloat(document.getElementById('movement-amt')?.value) || 0;
    const reason = document.getElementById('movement-reason')?.value || (type === 'drop' ? 'Cash drop' : 'Petty cash');

    try {
        const res = await fetch('/api/cashier/cash-movement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movement_type: type, amount, reason })
        });
        if (res.ok) {
            document.getElementById('cash-movement-modal')?.remove();
            showToast("✓ Drawer movement recorded!", "success");
            renderCashierView();
        }
    } catch (e) {
        showToast("Error: " + e.message, "danger");
    }
}

function openCloseSessionModal() {
    const modal = document.createElement('div');
    modal.id = 'close-session-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-bold text-slate-900 text-base">End Shift & Generate Z-Report</h3>
                <button onclick="document.getElementById('close-session-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-slate-700">Counted Cash in Drawer (INR)</label>
                    <input type="number" id="counted-cash-input" value="2000" class="w-full mt-1 px-3 py-2 border rounded-xl font-bold text-lg" />
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-700">Shift Closing Notes</label>
                    <textarea id="closing-notes" placeholder="Shift handover notes..." class="w-full mt-1 px-3 py-2 border rounded-xl text-xs h-16"></textarea>
                </div>
            </div>
            <button onclick="executeCloseSession()" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                Close Register & Reconcile
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function executeCloseSession() {
    const counted = parseFloat(document.getElementById('counted-cash-input')?.value) || 0;
    const notes = document.getElementById('closing-notes')?.value || "";

    try {
        const res = await fetch('/api/cashier/close-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ counted_cash: counted, notes })
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('close-session-modal')?.remove();
            showToast(`✓ Shift closed! Cash variance: ${formatCurrency(data.variance)}`, "success");
            renderCashierView();
        }
    } catch (e) {
        showToast("Error: " + e.message, "danger");
    }
}

// ==========================================
// 1. DASHBOARD VIEW (Admin Dashboard - Image 3 Left)
// ==========================================
async function renderDashboardView() {
    const contentArea = document.getElementById('main-content-area');
    
    // Fetch stats and charts in parallel
    try {
        const [statsRes, chartsRes, recentRes] = await Promise.all([
            fetch('/api/dashboard/stats').then(r => r.json()),
            fetch('/api/dashboard/charts').then(r => r.json()),
            fetch('/api/dashboard/recent-orders').then(r => r.json())
        ]);
        state.stats = statsRes;
        state.recentOrders = recentRes;

        contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Header with Title & Action Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
                    <p class="text-sm text-slate-500">Live operational overview for <span class="font-semibold text-orange-600">${state.branch}</span></p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="navigateTo('pos')" class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold shadow-sm transition">
                        <i data-lucide="calculator" class="w-4 h-4"></i>
                        <span>Open POS</span>
                    </button>
                    <button onclick="navigateTo('kds')" class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition">
                        <i data-lucide="chef-hat" class="w-4 h-4"></i>
                        <span>Kitchen Display</span>
                    </button>
                </div>
            </div>

            <!-- Top 4 Metric Cards matching Image 3 Left -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Total Orders -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs card-hover">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Order</span>
                        <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-slate-900 tabular-nums">${statsRes.total_orders}</span>
                        <span class="text-xs font-semibold text-emerald-600 flex items-center">+${statsRes.orders_growth_pct}% <i data-lucide="arrow-up-right" class="w-3 h-3"></i></span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1">vs yesterday (212 orders)</p>
                </div>

                <!-- Active Tables / In Delivery -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs card-hover">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Tables</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i data-lucide="utensils" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-slate-900 tabular-nums">${statsRes.active_tables}</span>
                        <span class="text-xs font-medium text-slate-500">/ ${statsRes.active_tables + statsRes.available_tables} total</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1">${statsRes.available_tables} tables currently available</p>
                </div>

                <!-- Pending KOTs / In Kitchen -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs card-hover">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Kitchen Orders</span>
                        <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-slate-900 tabular-nums">${statsRes.pending_orders}</span>
                        <span class="text-xs font-semibold text-amber-600">Active KOTs</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1">Live sync with KDS screen</p>
                </div>

                <!-- Total Revenue -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs card-hover">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
                        <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i data-lucide="indian-rupee" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="flex items-baseline gap-2">
                        <span class="text-3xl font-extrabold text-slate-900 tabular-nums">${formatCurrency(statsRes.today_revenue)}</span>
                    </div>
                    <p class="text-xs font-semibold text-emerald-600 flex items-center mt-1">+${statsRes.revenue_growth_pct}% vs last week</p>
                </div>
            </div>

            <!-- Charts Section (Dual line Income vs Expenses + Category Donut) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left 2 Cols: Total Revenue Trend -->
                <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Total Revenue</h2>
                            <p class="text-xs text-slate-400">Comparative income vs operational expenses</p>
                        </div>
                        <div class="flex items-center gap-4 text-xs font-medium">
                            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-orange-500"></span> Income</span>
                            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-slate-300"></span> Expenses</span>
                        </div>
                    </div>
                    <div class="h-64 relative">
                        <canvas id="revenueTrendChart"></canvas>
                    </div>
                </div>

                <!-- Right Col: Revenue Breakdown Donut matching Image 3 -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Total Revenue</h2>
                            <p class="text-xs text-slate-400">Category sales contribution</p>
                        </div>
                        <span class="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-lg text-slate-600">This Month</span>
                    </div>
                    <div class="h-44 relative flex items-center justify-center">
                        <canvas id="categoryDonutChart"></canvas>
                    </div>
                    <!-- Legend List -->
                    <div class="space-y-2 mt-4 text-xs">
                        ${chartsRes.category_distribution.map(cat => `
                            <div class="flex items-center justify-between py-1 border-b border-slate-100">
                                <span class="flex items-center gap-2 text-slate-600">
                                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${cat.color}"></span>
                                    ${cat.name}
                                </span>
                                <span class="font-bold text-slate-900 tabular-nums">${cat.percentage}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Bottom Section: Recent Orders Table & Order Type Progress Bars -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left 2 Cols: Recent Orders Table -->
                <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-base font-bold text-slate-900">Recent Orders</h2>
                        <button onclick="navigateTo('billing')" class="text-xs font-semibold text-orange-600 hover:text-orange-700">View All</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                                    <th class="py-2.5">Order ID</th>
                                    <th class="py-2.5">Type</th>
                                    <th class="py-2.5">Attendant</th>
                                    <th class="py-2.5">Time</th>
                                    <th class="py-2.5">Status</th>
                                    <th class="py-2.5 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 font-medium">
                                ${recentRes.map(ord => {
                                    const statusClasses = {
                                        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                        unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
                                        received: 'bg-orange-50 text-orange-700 border-orange-200',
                                        preparing: 'bg-blue-50 text-blue-700 border-blue-200',
                                        ready: 'bg-teal-50 text-teal-700 border-teal-200',
                                        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    };
                                    return `
                                    <tr class="hover:bg-slate-50/80 transition-colors">
                                        <td class="py-3 font-semibold text-slate-900">${ord.order_number}</td>
                                        <td class="py-3 text-slate-600 capitalize">${ord.table_number ? ord.table_number : ord.order_type}</td>
                                        <td class="py-3 text-slate-600">${ord.waiter_name || 'Dhruv Sharma'}</td>
                                        <td class="py-3 text-slate-400">${formatDate(ord.created_at)}</td>
                                        <td class="py-3">
                                            <span class="inline-flex px-2 py-0.5 rounded-full text-2xs font-semibold border ${statusClasses[ord.status] || 'bg-slate-100 text-slate-700 border-slate-200'}">
                                                ${ord.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td class="py-3 text-right font-bold text-slate-900 tabular-nums">${formatCurrency(ord.grand_total)}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right Col: Order Type Progress Breakdown -->
                <div class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-base font-bold text-slate-900">Order Type</h2>
                        <span class="text-xs text-slate-400">This Month</span>
                    </div>
                    <div class="space-y-4">
                        ${chartsRes.order_type_distribution.map(ot => `
                            <div>
                                <div class="flex items-center justify-between text-xs mb-1">
                                    <span class="font-semibold text-slate-700">${ot.type}</span>
                                    <span class="text-slate-500 tabular-nums">${ot.count} orders (${ot.percentage}%)</span>
                                </div>
                                <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div class="h-full rounded-full" style="width: ${ot.percentage}%; background-color: ${ot.color}"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Low Stock Alert Banner -->
                    <div class="mt-6 p-4 rounded-xl bg-orange-50/80 border border-orange-200/80">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <h4 class="text-xs font-bold text-orange-900">${statsRes.low_stock_items} Stock Items Below Threshold</h4>
                                <p class="text-2xs text-orange-700">Refined Flour, EVOO & Basil need reordering.</p>
                            </div>
                        </div>
                        <button onclick="navigateTo('inventory')" class="mt-3 w-full py-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
                            Open Inventory Manager
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

        // Render Charts using Chart.js
        setTimeout(() => {
            const revCanvas = document.getElementById('revenueTrendChart');
            if (revCanvas) {
                if (state.chartInstances.revenueTrend) state.chartInstances.revenueTrend.destroy();
                state.chartInstances.revenueTrend = new Chart(revCanvas, {
                    type: 'line',
                    data: {
                        labels: chartsRes.months,
                        datasets: [
                            {
                                label: 'Income',
                                data: chartsRes.income,
                                borderColor: '#F97316',
                                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                                fill: true,
                                tension: 0.4,
                                borderWidth: 2.5,
                                pointRadius: 3,
                                pointBackgroundColor: '#F97316'
                            },
                            {
                                label: 'Expenses',
                                data: chartsRes.expenses,
                                borderColor: '#CBD5E1',
                                borderDash: [4, 4],
                                backgroundColor: 'transparent',
                                tension: 0.4,
                                borderWidth: 2,
                                pointRadius: 0
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                            y: { grid: { color: '#F1F5F9' }, ticks: { font: { size: 10 } } }
                        }
                    }
                });
            }

            const donutCanvas = document.getElementById('categoryDonutChart');
            if (donutCanvas) {
                if (state.chartInstances.categoryDonut) state.chartInstances.categoryDonut.destroy();
                state.chartInstances.categoryDonut = new Chart(donutCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: chartsRes.category_distribution.map(c => c.name),
                        datasets: [{
                            data: chartsRes.category_distribution.map(c => c.percentage),
                            backgroundColor: chartsRes.category_distribution.map(c => c.color),
                            borderWidth: 0,
                            cutout: '72%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }, 100);

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading dashboard: ${e.message}</div>`;
    }
}

// ==========================================
// 2. POINT OF SALE (POS) - Image 3 Right
// ==========================================
async function renderPOSView() {
    const contentArea = document.getElementById('main-content-area');
    
    try {
        const [cats, items, tbls] = await Promise.all([
            fetch('/api/menu/categories').then(r => r.json()),
            fetch('/api/menu/items').then(r => r.json()),
            fetch('/api/tables').then(r => r.json())
        ]);
        state.categories = cats;
        state.menuItems = items;
        state.tables = tbls;

        contentArea.innerHTML = `
        <div class="flex flex-col xl:flex-row gap-6 h-[calc(100vh-140px)]">
            <!-- Left Side: Food Category Pills & Food Grid -->
            <div class="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <!-- Search & Filters Bar -->
                <div class="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white">
                    <div class="relative flex-1 min-w-[200px]">
                        <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                        <input type="text" id="pos-search-input" placeholder="Search dish, beverage, or item code..." 
                               value="${state.searchQuery}"
                               oninput="handlePOSSearch(this.value)"
                               class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition" />
                    </div>
                    <!-- Veg / Non-Veg Quick Toggles -->
                    <div class="flex items-center gap-2">
                        <button onclick="filterPOSDiet(null)" class="px-3 py-1.5 rounded-lg text-xs font-semibold ${state.vegFilter === null ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">All</button>
                        <button onclick="filterPOSDiet(1)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${state.vegFilter === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Veg
                        </button>
                        <button onclick="filterPOSDiet(0)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${state.vegFilter === 0 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}">
                            <span class="w-2 h-2 rounded-full bg-rose-500"></span> Non-Veg
                        </button>
                    </div>
                </div>

                <!-- Top Category Pills matching Image 3 Right -->
                <div class="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
                    ${state.categories.map(cat => `
                        <button onclick="selectPOSCategory('${cat.slug}')" 
                                class="whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${state.selectedCategory === cat.slug ? 'bg-orange-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}">
                            ${cat.name}
                        </button>
                    `).join('')}
                </div>

                <!-- Food Items Grid matching Image 3 Right -->
                <div class="flex-1 p-4 overflow-y-auto" id="pos-items-grid">
                    ${renderPOSItemsGrid()}
                </div>
            </div>

            <!-- Right Side: Current Order / Cart Panel matching Image 3 Right -->
            <div class="w-full xl:w-96 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <!-- Cart Header & Order Type Switcher -->
                <div class="p-4 border-b border-slate-200/80 bg-slate-50/70">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-bold text-slate-900 text-base flex items-center gap-2">
                            <i data-lucide="receipt" class="w-4 h-4 text-orange-600"></i>
                            <span>Current Check</span>
                        </h3>
                        <button onclick="clearCart()" class="text-xs font-semibold text-rose-600 hover:underline">Clear</button>
                    </div>

                    <!-- Order Type Switcher (Dine-in, Takeaway, Delivery) -->
                    <div class="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold text-center mb-3">
                        <button onclick="setOrderType('dine_in')" class="py-1.5 rounded-lg transition ${state.cartOrderType === 'dine_in' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}">Dine-in</button>
                        <button onclick="setOrderType('takeaway')" class="py-1.5 rounded-lg transition ${state.cartOrderType === 'takeaway' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}">Takeaway</button>
                        <button onclick="setOrderType('delivery')" class="py-1.5 rounded-lg transition ${state.cartOrderType === 'delivery' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}">Delivery</button>
                    </div>

                    <!-- Table or Guest selector -->
                    <div class="flex items-center gap-2">
                        ${state.cartOrderType === 'dine_in' ? `
                            <div class="flex-1">
                                <label class="text-2xs font-bold text-slate-400 uppercase">Select Table</label>
                                <select onchange="state.cartTable = this.value" class="w-full mt-0.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none">
                                    ${state.tables.map(t => `<option value="${t.table_number}" ${t.table_number === state.cartTable ? 'selected' : ''}>${t.table_number} (${t.status})</option>`).join('')}
                                </select>
                            </div>
                        ` : `
                            <div class="flex-1">
                                <label class="text-2xs font-bold text-slate-400 uppercase">Customer Name & Phone</label>
                                <input type="text" placeholder="e.g. John Doe (+91...)" oninput="state.cartCustomerName = this.value" class="w-full mt-0.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none" />
                            </div>
                        `}
                    </div>
                </div>

                <!-- Selected Items List -->
                <div class="flex-1 p-4 overflow-y-auto space-y-3" id="pos-cart-items-container">
                    ${renderCartItems()}
                </div>

                <!-- Totals & Checkout -->
                <div class="p-4 border-t border-slate-200/80 bg-slate-50/50 space-y-2 text-xs">
                    <div class="flex items-center justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span class="font-semibold text-slate-800 tabular-nums" id="cart-subtotal">${formatCurrency(calculateCartTotals().subtotal)}</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-500">
                        <span>GST (5% CGST+SGST)</span>
                        <span class="font-semibold text-slate-800 tabular-nums" id="cart-gst">${formatCurrency(calculateCartTotals().gst)}</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-500">
                        <span>Discount</span>
                        <span class="font-semibold text-emerald-600 tabular-nums" id="cart-discount">-${formatCurrency(state.cartDiscountAmount)}</span>
                    </div>
                    <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                        <span>Grand Total</span>
                        <span class="text-lg text-orange-600 tabular-nums" id="cart-grand-total">${formatCurrency(calculateCartTotals().grandTotal)}</span>
                    </div>

                    <!-- Payment Action Grid -->
                    <div class="grid grid-cols-2 gap-2 pt-2">
                        <button onclick="submitPOSOrder('cash')" class="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition">
                            <i data-lucide="banknote" class="w-4 h-4"></i>
                            <span>Cash (Pay)</span>
                        </button>
                        <button onclick="openUPIPaymentModal()" class="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition">
                            <i data-lucide="qr-code" class="w-4 h-4"></i>
                            <span>UPI / QR</span>
                        </button>
                        <button onclick="submitPOSOrder('card')" class="py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                            <i data-lucide="credit-card" class="w-4 h-4"></i>
                            <span>Card</span>
                        </button>
                        <button onclick="openSplitBillModal()" class="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                            <i data-lucide="split" class="w-4 h-4"></i>
                            <span>Split Bill</span>
                        </button>
                    </div>

                    <!-- Kitchen KOT Button -->
                    <button onclick="submitPOSOrder('hold_kot')" class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition">
                        <i data-lucide="send" class="w-4 h-4"></i>
                        <span>Send to Kitchen (KOT)</span>
                    </button>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading POS: ${e.message}</div>`;
    }
}

function renderPOSItemsGrid() {
    let filtered = state.menuItems;
    if (state.selectedCategory !== 'all') {
        filtered = filtered.filter(item => item.category_id === state.selectedCategory || item.category_name?.toLowerCase().includes(state.selectedCategory));
    }
    if (state.vegFilter !== null) {
        filtered = filtered.filter(item => item.is_veg === state.vegFilter);
    }
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(item => item.name.toLowerCase().includes(q) || (item.item_code && item.item_code.toLowerCase().includes(q)));
    }

    if (filtered.length === 0) {
        return `
        <div class="flex flex-col items-center justify-center py-20 text-slate-400">
            <i data-lucide="utensils" class="w-10 h-10 mb-2 stroke-1"></i>
            <p class="text-sm">No items match your filter criteria.</p>
        </div>`;
    }

    return `
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        ${filtered.map(item => `
            <div class="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                <div class="relative h-32 bg-slate-100 overflow-hidden">
                    <img src="${item.image_url}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <!-- Veg / Non-Veg badge -->
                    <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-xs p-1 rounded-md shadow-xs">
                        <span class="w-2.5 h-2.5 rounded-full block ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                    </div>
                    <!-- Item Code -->
                    ${item.item_code ? `
                        <span class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-3xs font-mono backdrop-blur-xs">
                            ${item.item_code}
                        </span>
                    ` : ''}
                </div>
                <div class="p-3 flex-1 flex flex-col justify-between">
                    <div>
                        <h4 class="font-bold text-slate-900 text-xs leading-snug line-clamp-1">${item.name}</h4>
                        <p class="text-slate-400 text-3xs line-clamp-1 mt-0.5">${item.description || ''}</p>
                    </div>
                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span class="font-extrabold text-slate-900 text-xs tabular-nums">${formatCurrency(item.price)}</span>
                        <button onclick="addToCart('${item.id}')" class="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-2xs font-bold shadow-xs transition flex items-center gap-1">
                            <i data-lucide="plus" class="w-3 h-3"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

function handlePOSSearch(val) {
    state.searchQuery = val;
    document.getElementById('pos-items-grid').innerHTML = renderPOSItemsGrid();
    if (window.lucide) lucide.createIcons();
}

function selectPOSCategory(slug) {
    state.selectedCategory = slug;
    renderPOSView();
}

function filterPOSDiet(vegVal) {
    state.vegFilter = vegVal;
    renderPOSView();
}

function addToCart(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = state.cart.find(c => c.menu_item_id === itemId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image_url: item.image_url,
            customizations: ''
        });
    }

    updateCartUI();
    showToast(`Added ${item.name} to check`, 'info');
}

function updateCartQuantity(index, delta) {
    if (!state.cart[index]) return;
    state.cart[index].quantity += delta;
    if (state.cart[index].quantity <= 0) {
        state.cart.splice(index, 1);
    }
    updateCartUI();
}

function clearCart() {
    state.cart = [];
    state.cartDiscountAmount = 0;
    updateCartUI();
}

function calculateCartTotals() {
    const subtotal = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const grandTotal = Math.max(0, subtotal + gst - state.cartDiscountAmount);
    return { subtotal, gst, grandTotal };
}

function renderCartItems() {
    if (state.cart.length === 0) {
        return `
        <div class="flex flex-col items-center justify-center py-16 text-slate-400">
            <i data-lucide="shopping-cart" class="w-10 h-10 mb-2 stroke-1"></i>
            <p class="text-xs">No items in check. Select from menu.</p>
        </div>`;
    }

    return state.cart.map((item, idx) => `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div class="flex items-center gap-2.5 min-w-0">
                <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}" class="w-9 h-9 rounded-lg object-cover" />
                <div class="min-w-0">
                    <h5 class="text-xs font-bold text-slate-800 truncate">${item.name}</h5>
                    <span class="text-2xs text-slate-400 tabular-nums">${formatCurrency(item.price)} each</span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <button onclick="updateCartQuantity(${idx}, -1)" class="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold text-xs">-</button>
                    <span class="px-2 text-xs font-bold text-slate-800 tabular-nums">${item.quantity}</span>
                    <button onclick="updateCartQuantity(${idx}, 1)" class="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold text-xs">+</button>
                </div>
                <span class="text-xs font-bold text-slate-900 tabular-nums w-14 text-right">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        </div>
    `).join('');
}

function updateCartUI() {
    const container = document.getElementById('pos-cart-items-container');
    if (container) container.innerHTML = renderCartItems();

    const totals = calculateCartTotals();
    const subEl = document.getElementById('cart-subtotal');
    const gstEl = document.getElementById('cart-gst');
    const discEl = document.getElementById('cart-discount');
    const grandEl = document.getElementById('cart-grand-total');

    if (subEl) subEl.textContent = formatCurrency(totals.subtotal);
    if (gstEl) gstEl.textContent = formatCurrency(totals.gst);
    if (discEl) discEl.textContent = '-' + formatCurrency(state.cartDiscountAmount);
    if (grandEl) grandEl.textContent = formatCurrency(totals.grandTotal);

    if (window.lucide) lucide.createIcons();
}

function setOrderType(type) {
    state.cartOrderType = type;
    renderPOSView();
}

async function submitPOSOrder(paymentType) {
    if (state.cart.length === 0) {
        showToast("Cart is empty! Add items first.", "warning");
        return;
    }

    const totals = calculateCartTotals();
    const orderPayload = {
        order_type: state.cartOrderType,
        table_number: state.cartOrderType === 'dine_in' ? state.cartTable : null,
        customer_name: state.cartCustomerName || "Guest",
        waiter_name: state.staff.name,
        items: state.cart.map(i => ({
            menu_item_id: i.menu_item_id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            customizations: i.customizations || ''
        })),
        payment_method: paymentType === 'hold_kot' ? 'cash' : paymentType,
        is_paid: paymentType !== 'hold_kot'
    };

    // If offline, queue locally!
    if (!window.offlineManager.isOnline()) {
        const offlineId = window.offlineManager.enqueueOrder(orderPayload);
        showToast(`Offline mode active. Order #${offlineId.substring(0, 8)} saved to local queue!`, "warning");
        clearCart();
        return;
    }

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const data = await res.json();

        if (res.ok) {
            showToast(`✓ Order ${data.order_number} created successfully!`, "success");
            
            // Show Thermal Receipt if paid
            if (paymentType !== 'hold_kot') {
                openThermalReceiptModal(data.order_id || data.order_number, data.order_number);
            }
            clearCart();
        } else {
            showToast(`Error: ${data.detail || 'Failed to place order'}`, "danger");
        }
    } catch (e) {
        // Fallback to offline queue
        window.offlineManager.enqueueOrder(orderPayload);
        showToast(`Network interrupted! Queued order locally for automatic sync.`, "warning");
        clearCart();
    }
}

// UPI Payment Modal
function openUPIPaymentModal() {
    const totals = calculateCartTotals();
    if (totals.grandTotal <= 0) {
        showToast("Add items to generate payment QR", "warning");
        return;
    }

    const upiString = `upi://pay?pa=spicehollic@icici&pn=Spicehollic&am=${totals.grandTotal}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

    const modal = document.createElement('div');
    modal.id = 'upi-payment-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Scan & Pay via UPI</span>
                <button onclick="document.getElementById('upi-payment-modal').remove()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div class="p-4 bg-slate-50 rounded-2xl flex items-center justify-center">
                <img src="${qrUrl}" alt="UPI QR" class="w-48 h-48 rounded-xl shadow-xs" />
            </div>
            <div>
                <span class="text-2xl font-black text-slate-900 tabular-nums">${formatCurrency(totals.grandTotal)}</span>
                <p class="text-xs text-slate-500 mt-1">GPay, PhonePe, Paytm, or BHIM</p>
            </div>
            <button onclick="document.getElementById('upi-payment-modal').remove(); submitPOSOrder('upi');" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition">
                Simulate Payment Success
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Thermal Receipt Modal
async function openThermalReceiptModal(orderId, orderNum) {
    try {
        const order = await fetch(`/api/orders/${orderId}`).then(r => r.json());
        const modal = document.createElement('div');
        modal.id = 'thermal-receipt-modal';
        modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4 max-w-sm">
                <!-- Thermal Slip Preview -->
                <div class="thermal-slip text-left mx-auto border border-dashed border-slate-300">
                    <div class="text-center pb-2 border-b border-dashed border-black">
                        <h2 class="font-bold text-base">SPICEHOLLIC</h2>
                        <p class="text-3xs">Plot 42, Connaught Place, New Delhi<br/>GSTIN: 07AAAAA0000A1Z5</p>
                    </div>
                    <div class="py-2 text-3xs border-b border-dashed border-black">
                        <div><b>Invoice:</b> ${order.order_number}</div>
                        <div><b>Date:</b> ${new Date().toLocaleString()}</div>
                        <div><b>Table:</b> ${order.table_number || order.order_type.toUpperCase()}</div>
                    </div>
                    <div class="py-2 border-b border-dashed border-black">
                        <table class="w-full text-3xs">
                            ${order.items.map(i => `
                                <tr>
                                    <td>${i.quantity}x ${i.name}</td>
                                    <td class="text-right">${formatCurrency(i.price * i.quantity)}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    <div class="pt-2 text-3xs space-y-0.5">
                        <div class="flex justify-between"><span>Subtotal:</span><span>${formatCurrency(order.subtotal)}</span></div>
                        <div class="flex justify-between"><span>CGST (2.5%):</span><span>${formatCurrency(order.gst_amount / 2)}</span></div>
                        <div class="flex justify-between"><span>SGST (2.5%):</span><span>${formatCurrency(order.gst_amount / 2)}</span></div>
                        <div class="flex justify-between font-bold text-xs pt-1 border-t border-dashed border-black">
                            <span>TOTAL:</span><span>${formatCurrency(order.grand_total)}</span>
                        </div>
                    </div>
                    <div class="text-center pt-3 text-3xs">
                        Thank you for dining with us!
                    </div>
                </div>

                <div class="flex gap-2 justify-center no-print pt-2">
                    <button onclick="window.print()" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">Print Slip</button>
                    <a href="/api/billing/invoice/${order.id}/pdf" target="_blank" class="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold">PDF Invoice</a>
                    <button onclick="document.getElementById('thermal-receipt-modal').remove()" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        console.error("Failed to load receipt:", e);
    }
}

// Split Bill Modal
function openSplitBillModal() {
    const totals = calculateCartTotals();
    const modal = document.createElement('div');
    modal.id = 'split-bill-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-bold text-slate-900 text-base">Split Bill Calculator</h3>
                <button onclick="document.getElementById('split-bill-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div>
                <p class="text-xs text-slate-500">Total Check Amount:</p>
                <span class="text-2xl font-black text-slate-900 tabular-nums">${formatCurrency(totals.grandTotal)}</span>
            </div>
            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-700">Split Equally Among Guests:</label>
                <div class="flex items-center gap-3">
                    <input type="number" id="split-guests-input" value="3" min="2" max="20" class="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center" oninput="updateSplitResult(${totals.grandTotal})" />
                    <span class="text-xs text-slate-500">Guests</span>
                </div>
            </div>
            <div class="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div class="text-xs text-orange-800">Amount per guest:</div>
                <div class="text-xl font-black text-orange-600 tabular-nums" id="split-per-person-val">${formatCurrency(totals.grandTotal / 3)}</div>
            </div>
            <button onclick="document.getElementById('split-bill-modal').remove(); submitPOSOrder('split');" class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition">
                Record Split Payments & Complete
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function updateSplitResult(total) {
    const input = document.getElementById('split-guests-input');
    const valEl = document.getElementById('split-per-person-val');
    if (!input || !valEl) return;
    const count = parseInt(input.value) || 1;
    valEl.textContent = formatCurrency(total / count);
}

// ==========================================
// 3. KITCHEN DISPLAY SYSTEM (KDS - Image 2 Left)
// ==========================================
async function renderKDSView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const tickets = await fetch('/api/kds/tickets').then(r => r.json());
        state.kdsTickets = tickets;

        contentArea.innerHTML = `
        <div class="kds-dark-container min-h-[calc(100vh-140px)] rounded-3xl p-6 shadow-2xl flex flex-col space-y-6">
            <!-- Top KDS Header matching Image 2 Left -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black">
                        <i data-lucide="flame" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h2 class="text-xl font-extrabold text-white tracking-wide">Fine Gourmet Kitchen - KDS</h2>
                        <p class="text-xs text-slate-400">Live Order Management • Connected Real-time via WebSocket</p>
                    </div>
                </div>

                <!-- Audio Chime Toggle & Station Filters -->
                <div class="flex items-center gap-3">
                    <button onclick="toggleKDSSound()" class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold ${state.soundEnabled ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-slate-800 text-slate-400 border border-slate-700'}">
                        <i data-lucide="${state.soundEnabled ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>
                        <span>${state.soundEnabled ? 'Kitchen Bell On' : 'Bell Muted'}</span>
                    </button>
                    <div class="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs">
                        <button onclick="filterKDSStation('all')" class="px-3 py-1.5 rounded-lg font-semibold ${state.kdsFilterStation === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400'}">All</button>
                        <button onclick="filterKDSStation('grill')" class="px-3 py-1.5 rounded-lg font-semibold ${state.kdsFilterStation === 'grill' ? 'bg-orange-600 text-white' : 'text-slate-400'}">Grill</button>
                        <button onclick="filterKDSStation('bar')" class="px-3 py-1.5 rounded-lg font-semibold ${state.kdsFilterStation === 'bar' ? 'bg-orange-600 text-white' : 'text-slate-400'}">Bar</button>
                    </div>
                </div>
            </div>

            <!-- 3 Kanban Columns matching Image 2 Left: Received, Preparing, Ready -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <!-- Column 1: Received / New Orders -->
                <div class="flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                    <div class="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span class="text-sm font-bold text-white uppercase tracking-wider">Received</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-amber-400 tabular-nums">
                            ${tickets.received.length}
                        </span>
                    </div>
                    <div class="flex-1 p-3 space-y-4 overflow-y-auto">
                        ${renderKDSTicketCards(tickets.received, 'received')}
                    </div>
                </div>

                <!-- Column 2: Preparing -->
                <div class="flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                    <div class="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span class="text-sm font-bold text-white uppercase tracking-wider">Preparing</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-blue-400 tabular-nums">
                            ${tickets.preparing.length}
                        </span>
                    </div>
                    <div class="flex-1 p-3 space-y-4 overflow-y-auto">
                        ${renderKDSTicketCards(tickets.preparing, 'preparing')}
                    </div>
                </div>

                <!-- Column 3: Ready / Plated -->
                <div class="flex flex-col bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                    <div class="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span class="text-sm font-bold text-white uppercase tracking-wider">Ready</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-emerald-400 tabular-nums">
                            ${tickets.ready.length}
                        </span>
                    </div>
                    <div class="flex-1 p-3 space-y-4 overflow-y-auto">
                        ${renderKDSTicketCards(tickets.ready, 'ready')}
                    </div>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading KDS: ${e.message}</div>`;
    }
}

function renderKDSTicketCards(ticketList, colStatus) {
    if (!ticketList || ticketList.length === 0) {
        return `<div class="text-center py-12 text-slate-600 text-xs">No orders in this stage.</div>`;
    }

    return ticketList.map(ord => {
        const urgencyColors = {
            critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30 urgent-pulse',
            warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            normal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };

        return `
        <div class="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 shadow-md space-y-3">
            <!-- Header matching Image 2 Left -->
            <div class="flex items-start justify-between">
                <div>
                    <h4 class="font-extrabold text-white text-base">${ord.table_number || ord.order_type.toUpperCase()}</h4>
                    <span class="text-xs font-bold text-amber-400 font-mono">${ord.order_number}</span>
                </div>
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold border tabular-nums ${urgencyColors[ord.urgency] || urgencyColors.normal}">
                    ${ord.elapsed_str || '1m'}
                </span>
            </div>

            <!-- Items List -->
            <div class="space-y-1.5 py-2 border-y border-slate-700/60 text-xs">
                ${ord.items.map(item => `
                    <div class="flex items-baseline justify-between text-slate-200">
                        <span class="font-semibold"><b class="text-orange-400">${item.quantity}x</b> ${item.name}</span>
                        ${item.customizations ? `<span class="text-3xs text-slate-400 italic">(+ ${item.customizations})</span>` : ''}
                    </div>
                `).join('')}
            </div>

            <!-- Cooking Notes if any -->
            ${ord.special_instructions ? `
                <div class="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-2xs">
                    <b>Note:</b> ${ord.special_instructions}
                </div>
            ` : ''}

            <!-- Server Name -->
            <div class="flex items-center justify-between text-3xs text-slate-400">
                <span>Waiter: ${ord.waiter_name || 'Staff'}</span>
            </div>

            <!-- Action Button matching Image 2 Left -->
            <div>
                ${colStatus === 'received' ? `
                    <button onclick="advanceKDSOrder('${ord.id}', 'start-preparing')" class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5">
                        <i data-lucide="play" class="w-3.5 h-3.5 fill-white"></i>
                        <span>Start Preparing</span>
                    </button>
                ` : colStatus === 'preparing' ? `
                    <button onclick="advanceKDSOrder('${ord.id}', 'mark-ready')" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                        <span>Mark Ready</span>
                    </button>
                ` : `
                    <button onclick="advanceKDSOrder('${ord.id}', 'complete')" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5">
                        <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                        <span>Complete / Served</span>
                    </button>
                `}
            </div>
        </div>
        `;
    }).join('');
}

async function advanceKDSOrder(orderId, action) {
    try {
        const res = await fetch(`/api/kds/tickets/${orderId}/${action}`, { method: 'POST' });
        if (res.ok) {
            showToast(`Order status updated!`, 'success');
            renderKDSView();
        }
    } catch (e) {
        showToast(`Failed to update status: ${e.message}`, 'danger');
    }
}

function toggleKDSSound() {
    state.soundEnabled = !state.soundEnabled;
    window.restoWS.toggleSound(state.soundEnabled);
    renderKDSView();
}

function filterKDSStation(station) {
    state.kdsFilterStation = station;
    renderKDSView();
}

// ==========================================
// 4. WAITER MOBILE APPLICATION (Image 2 Right)
// ==========================================
async function renderWaiterView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const [tables, items] = await Promise.all([
            fetch('/api/tables').then(r => r.json()),
            fetch('/api/menu/items?available_only=true').then(r => r.json())
        ]);
        state.tables = tables;
        state.menuItems = items;

        contentArea.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <!-- Simulated Mobile Device Frame matching Image 2 Right -->
            <div class="mobile-device-frame flex flex-col">
                <!-- Device Speaker Bezel -->
                <div class="h-6 bg-slate-900 flex items-center justify-center shrink-0">
                    <div class="w-16 h-1 rounded-full bg-slate-700"></div>
                </div>

                <!-- Waiter App Header (Fine Dining Restaurant, orange theme) -->
                <div class="bg-orange-600 text-white p-4 shrink-0 shadow-md">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">RD</span>
                            <div>
                                <h3 class="font-bold text-sm leading-tight">Fine Dining Restaurant</h3>
                                <p class="text-3xs text-orange-100">Waiter: ${state.staff.name}</p>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-orange-700/80 text-3xs font-semibold">Active Shift</span>
                    </div>

                    <!-- Waiter Navigation Tabs -->
                    <div class="grid grid-cols-2 gap-2 mt-3 p-0.5 bg-orange-700/60 rounded-xl text-xs font-semibold text-center">
                        <button onclick="state.waiterActiveTab = 'tables'; renderWaiterView();" class="py-1.5 rounded-lg transition ${state.waiterActiveTab === 'tables' ? 'bg-white text-orange-600 shadow-xs' : 'text-orange-100'}">Tables</button>
                        <button onclick="state.waiterActiveTab = 'menu'; renderWaiterView();" class="py-1.5 rounded-lg transition ${state.waiterActiveTab === 'menu' ? 'bg-white text-orange-600 shadow-xs' : 'text-orange-100'}">Menu & Check</button>
                    </div>
                </div>

                <!-- Device Body Content -->
                <div class="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-4">
                    ${state.waiterActiveTab === 'tables' ? renderWaiterTablesScreen() : renderWaiterMenuScreen()}
                </div>

                <!-- Floating Bottom Cart Bar for Waiter KOT submission -->
                ${state.waiterCart.length > 0 ? `
                    <div class="p-3 bg-white border-t border-slate-200 shrink-0">
                        <button onclick="submitWaiterKOT()" class="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-between px-4 shadow-md transition">
                            <span class="flex items-center gap-1.5">
                                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                <span>${state.waiterCart.reduce((a, b) => a + b.quantity, 0)} Items Added</span>
                            </span>
                            <span>Send KOT →</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Waiter App: ${e.message}</div>`;
    }
}

function renderWaiterTablesScreen() {
    return `
    <div class="space-y-4">
        <!-- Quick Action Grid matching Image 2 Right -->
        <div class="grid grid-cols-2 gap-2.5">
            <button onclick="state.waiterActiveTab = 'menu'; state.waiterSelectedTable = 'Inside 01'; renderWaiterView();" class="p-3 bg-white rounded-2xl border border-slate-200 text-left hover:border-orange-500 shadow-2xs transition">
                <i data-lucide="table-2" class="w-5 h-5 text-orange-600 mb-1.5"></i>
                <h5 class="text-xs font-bold text-slate-800">New Table Check</h5>
                <p class="text-3xs text-slate-400">Open check by Table #</p>
            </button>
            <button onclick="state.waiterActiveTab = 'menu'; state.waiterSelectedTable = 'Takeaway'; renderWaiterView();" class="p-3 bg-white rounded-2xl border border-slate-200 text-left hover:border-orange-500 shadow-2xs transition">
                <i data-lucide="user-plus" class="w-5 h-5 text-orange-600 mb-1.5"></i>
                <h5 class="text-xs font-bold text-slate-800">Guest Takeaway</h5>
                <p class="text-3xs text-slate-400">Quick pickup check</p>
            </button>
        </div>

        <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Restaurant Floor Tables</h4>
        <div class="grid grid-cols-2 gap-2.5">
            ${state.tables.map(t => {
                const isOccupied = t.status === 'Occupied';
                return `
                <div onclick="selectWaiterTable('${t.table_number}')" class="p-3 rounded-2xl border ${isOccupied ? 'bg-orange-50/70 border-orange-300' : 'bg-white border-slate-200'} cursor-pointer hover:shadow-xs transition">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-xs text-slate-900">${t.table_number}</span>
                        <span class="w-2 h-2 rounded-full ${isOccupied ? 'bg-orange-500' : 'bg-emerald-500'}"></span>
                    </div>
                    <span class="text-3xs text-slate-400">${t.capacity} Seats • ${t.section}</span>
                    ${isOccupied ? `
                        <div class="mt-2 text-2xs font-extrabold text-orange-600 tabular-nums">${formatCurrency(t.current_order_amount)}</div>
                    ` : `
                        <div class="mt-2 text-3xs text-emerald-600 font-semibold">Available</div>
                    `}
                </div>
                `;
            }).join('')}
        </div>
    </div>`;
}

function selectWaiterTable(tblNum) {
    state.waiterSelectedTable = tblNum;
    state.waiterActiveTab = 'menu';
    renderWaiterView();
}

function renderWaiterMenuScreen() {
    return `
    <div class="space-y-3">
        <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-900">Check for: <b class="text-orange-600">${state.waiterSelectedTable || 'Inside 01'}</b></span>
            <button onclick="state.waiterActiveTab = 'tables'; renderWaiterView();" class="text-3xs font-semibold text-slate-500 underline">Change Table</button>
        </div>

        <!-- Food Category Grid with photos matching Image 2 Right -->
        <div class="grid grid-cols-2 gap-2">
            ${state.menuItems.slice(0, 8).map(item => `
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                    <img src="${item.image_url}" class="h-20 w-full object-cover" />
                    <div class="p-2">
                        <h5 class="text-2xs font-bold text-slate-800 line-clamp-1">${item.name}</h5>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-2xs font-extrabold text-slate-900 tabular-nums">${formatCurrency(item.price)}</span>
                            <button onclick="addWaiterItem('${item.id}')" class="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                                +
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

function addWaiterItem(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item) return;
    const existing = state.waiterCart.find(c => c.menu_item_id === itemId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.waiterCart.push({
            menu_item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    renderWaiterView();
}

async function submitWaiterKOT() {
    if (state.waiterCart.length === 0) return;
    const orderPayload = {
        order_type: 'dine_in',
        table_number: state.waiterSelectedTable || 'Inside 01',
        waiter_name: state.staff.name,
        items: state.waiterCart,
        payment_method: 'cash',
        is_paid: false
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        if (res.ok) {
            showToast("✓ KOT Sent directly to Kitchen Display!", "success");
            state.waiterCart = [];
            state.waiterActiveTab = 'tables';
            renderWaiterView();
        }
    } catch (e) {
        showToast("Error sending KOT: " + e.message, "danger");
    }
}

// ==========================================
// 5. CUSTOMER QR MENU (Self-Ordering - Image 1 Left)
// ==========================================
async function renderQRMenuView(tableNumber = 'Inside 02') {
    const contentArea = document.getElementById('main-content-area');
    state.qrSelectedTable = tableNumber;

    try {
        const [cats, items] = await Promise.all([
            fetch('/api/menu/categories').then(r => r.json()),
            fetch('/api/menu/items?available_only=true').then(r => r.json())
        ]);

        contentArea.innerHTML = `
        <div class="flex items-center justify-center py-4">
            <!-- Simulated Mobile Screen matching Image 1 Left ("Flavor!" style) -->
            <div class="mobile-device-frame flex flex-col">
                <!-- Device Speaker Bezel -->
                <div class="h-6 bg-slate-900 flex items-center justify-center shrink-0">
                    <div class="w-16 h-1 rounded-full bg-slate-700"></div>
                </div>

                <!-- Customer QR Header matching Image 1 Left -->
                <div class="p-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <span class="text-2xs font-extrabold text-orange-600 tracking-wider">SPICEHOLLIC</span>
                        <h3 class="text-base font-extrabold text-slate-900">Make Your Selection!</h3>
                    </div>
                    <div class="px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-xl text-3xs font-bold text-orange-700">
                        Table: ${state.qrSelectedTable}
                    </div>
                </div>

                <!-- Scrollable Menu Content -->
                <div class="flex-1 overflow-y-auto p-3 space-y-4">
                    <!-- Hot Deals Now! Carousel Banner matching Image 1 Left -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold text-slate-900 flex items-center gap-1">
                                <i data-lucide="flame" class="w-3.5 h-3.5 text-orange-500 fill-orange-500"></i>
                                <span>Hot Deals Now!</span>
                            </span>
                            <span class="text-3xs text-rose-600 font-semibold">Ends in 23:17:45</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-col justify-between">
                                <img src="https://images.unsplash.com/photo-1621996346565-e3d5d6281290?w=300" class="h-24 w-full rounded-xl object-cover" />
                                <div class="mt-2">
                                    <div class="flex items-center justify-between">
                                        <h5 class="text-xs font-bold text-slate-800">Truffle Pasta</h5>
                                        <span class="text-3xs text-amber-500 font-bold">★ 4.8</span>
                                    </div>
                                    <div class="flex items-center justify-between mt-1">
                                        <span class="text-xs font-bold text-slate-900">₹699</span>
                                        <button onclick="addQRCustomerItem('item-11')" class="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">+</button>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-2xl p-2 border border-slate-200 shadow-2xs flex flex-col justify-between">
                                <img src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300" class="h-24 w-full rounded-xl object-cover" />
                                <div class="mt-2">
                                    <div class="flex items-center justify-between">
                                        <h5 class="text-xs font-bold text-slate-800">Fried Rice</h5>
                                        <span class="text-3xs text-amber-500 font-bold">★ 4.6</span>
                                    </div>
                                    <div class="flex items-center justify-between mt-1">
                                        <span class="text-xs font-bold text-slate-900">₹299</span>
                                        <button onclick="addQRCustomerItem('item-15')" class="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Category Menu List -->
                    <div>
                        <h4 class="text-xs font-bold text-slate-900 mb-2">Full Menu</h4>
                        <div class="space-y-2.5">
                            ${items.map(item => `
                                <div class="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex gap-3 items-center justify-between">
                                    <img src="${item.image_url}" class="w-16 h-16 rounded-xl object-cover shrink-0" />
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-1.5">
                                            <span class="w-2 h-2 rounded-full block ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                                            <h5 class="text-xs font-bold text-slate-800 truncate">${item.name}</h5>
                                        </div>
                                        <p class="text-3xs text-slate-400 line-clamp-1 mt-0.5">${item.description || ''}</p>
                                        <span class="text-xs font-extrabold text-slate-900 mt-1 block tabular-nums">${formatCurrency(item.price)}</span>
                                    </div>
                                    <button onclick="addQRCustomerItem('${item.id}')" class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-2xs font-bold shadow-2xs transition">
                                        Add
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Bottom Floating Cart Bar matching Image 1 Left ("3 items v | Continue") -->
                <div class="p-3 bg-white border-t border-slate-200 shrink-0">
                    <button onclick="openCustomerCheckoutModal()" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold flex items-center justify-between px-4 shadow-lg transition">
                        <span>Review & Order Check</span>
                        <span>Continue →</span>
                    </button>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading QR Menu: ${e.message}</div>`;
    }
}

function addQRCustomerItem(itemId) {
    addToCart(itemId);
    showToast("Added to your table order!", "success");
}

function openCustomerCheckoutModal() {
    const totals = calculateCartTotals();
    if (totals.grandTotal <= 0) {
        showToast("Please add items to your cart first!", "warning");
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'customer-order-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                    <h3 class="font-bold text-slate-900 text-base">Review & Order</h3>
                    <p class="text-2xs text-slate-400">Ordering for Table: <b class="text-orange-600">${state.qrSelectedTable}</b></p>
                </div>
                <button onclick="document.getElementById('customer-order-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-700">Your Name (Optional)</label>
                <input type="text" id="qr-cust-name" placeholder="e.g. Dhruv" class="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
            </div>

            <div class="space-y-1.5 max-h-40 overflow-y-auto text-xs py-2 border-y border-slate-100">
                ${state.cart.map(i => `
                    <div class="flex justify-between">
                        <span>${i.quantity}x ${i.name}</span>
                        <span class="font-bold tabular-nums">${formatCurrency(i.price * i.quantity)}</span>
                    </div>
                `).join('')}
            </div>

            <div class="flex justify-between text-sm font-bold pt-1">
                <span>Grand Total (inc GST):</span>
                <span class="text-orange-600 tabular-nums">${formatCurrency(totals.grandTotal)}</span>
            </div>

            <button onclick="submitCustomerQROrder()" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                Confirm & Send to Kitchen
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitCustomerQROrder() {
    const custName = document.getElementById('qr-cust-name')?.value || "Table Guest";
    const orderPayload = {
        order_type: 'dine_in',
        table_number: state.qrSelectedTable,
        customer_name: custName,
        waiter_name: 'Self / Table QR',
        items: state.cart,
        payment_method: 'cash',
        is_paid: false
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('customer-order-modal')?.remove();
            showToast(`✓ Order placed! Sent directly to kitchen KDS.`, "success");
            clearCart();
            // Switch to order tracking view
            renderOrderTrackingScreen(data.order_number);
        }
    } catch (e) {
        showToast("Error: " + e.message, "danger");
    }
}

function renderOrderTrackingScreen(orderNumber) {
    const contentArea = document.getElementById('main-content-area');
    contentArea.innerHTML = `
    <div class="flex items-center justify-center py-6">
        <div class="mobile-device-frame p-6 flex flex-col justify-between text-center">
            <div class="space-y-2 mt-8">
                <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <i data-lucide="check" class="w-8 h-8"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-900">Order Received!</h3>
                <p class="text-xs text-slate-500">Ticket <b class="text-orange-600">${orderNumber}</b> has been received by our chefs.</p>
            </div>

            <!-- Live Status Timeline -->
            <div class="space-y-4 py-8 text-left text-xs">
                <div class="flex items-center gap-3 text-emerald-600 font-bold">
                    <span class="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-3xs">✓</span>
                    <span>Order Placed & Confirmed</span>
                </div>
                <div class="flex items-center gap-3 text-blue-600 font-bold">
                    <span class="w-4 h-4 rounded-full bg-blue-500 animate-ping"></span>
                    <span>Kitchen Preparing (KDS Active)</span>
                </div>
                <div class="flex items-center gap-3 text-slate-300">
                    <span class="w-4 h-4 rounded-full bg-slate-200"></span>
                    <span>Ready for Serving</span>
                </div>
            </div>

            <button onclick="renderQRMenuView('${state.qrSelectedTable}')" class="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-semibold">
                Back to Menu
            </button>
        </div>
    </div>
    `;
    if (window.lucide) lucide.createIcons();
}

// ==========================================
// 6. INVENTORY MANAGEMENT (Image 1 Right - "Rista" style)
// ==========================================
async function renderInventoryView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const [overview, items] = await Promise.all([
            fetch('/api/inventory/overview').then(r => r.json()),
            fetch('/api/inventory/items').then(r => r.json())
        ]);
        state.inventoryOverview = overview;
        state.inventoryItems = items;

        contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Header matching Image 1 Right ("rista" style) -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">Inventory Overview</h1>
                    <p class="text-xs text-slate-500">Real-time stock valuation, discrepancy tracking, and recipe consumption</p>
                </div>
                <button onclick="openAdjustStockModal(null)" class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Add / Adjust Stock</span>
                </button>
            </div>

            <!-- Top Metric Cards matching Image 1 Right -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Red Alert Card: Store Inventory Needs Attention -->
                <div class="bg-rose-700 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <span class="text-4xl font-extrabold tabular-nums">${overview.needs_attention_count}</span>
                        <p class="text-xs font-medium text-rose-100 mt-2 leading-snug">Store inventory needs attention</p>
                    </div>
                    <span class="text-3xs text-rose-200 uppercase tracking-wider font-semibold mt-4">Critical Threshold Alert</span>
                </div>

                <!-- Card 2: Stock Mismatch Value -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span class="text-xs font-semibold text-slate-400">Worth stock mismatch</span>
                    <div>
                        <span class="text-2xl font-black text-slate-900 tabular-nums">${formatCurrency(overview.mismatch_value)}</span>
                        <p class="text-3xs text-slate-400 mt-1">Variance detected in last cycle</p>
                    </div>
                </div>

                <!-- Card 3: Overall Stock Value in INR -->
                <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span class="text-xs font-semibold text-slate-400">Overall stock value in INR</span>
                    <div>
                        <span class="text-2xl font-black text-slate-900 tabular-nums">${formatCurrency(overview.overall_stock_value)}</span>
                        <p class="text-3xs text-emerald-600 font-semibold mt-1">✓ Assets fully accounted</p>
                    </div>
                </div>

                <!-- Card 4: Wastage Donut Chart matching Image 1 Right -->
                <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div class="flex items-center justify-between text-2xs font-semibold text-slate-400">
                        <span>Total Wastage</span>
                        <span class="text-slate-800 font-bold">${formatCurrency(overview.wastage_stats.total_wastage_cost)}</span>
                    </div>
                    <div class="h-24 relative flex items-center justify-center my-1">
                        <canvas id="wastageDonutChart"></canvas>
                    </div>
                    <div class="flex items-center justify-around text-3xs text-slate-500">
                        <span>25% Damage</span>
                        <span>22% PO issues</span>
                    </div>
                </div>
            </div>

            <!-- Outlets Overview Row matching Image 1 Right -->
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Outlets Stock Status</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    ${overview.outlets.map(out => `
                        <div class="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">${out.code}</span>
                                <div>
                                    <h5 class="text-xs font-bold text-slate-800">${out.name}</h5>
                                    <span class="text-3xs text-slate-400">${out.attention_count} items need attention</span>
                                </div>
                            </div>
                            <button onclick="showToast('Loading outlet details...', 'info')" class="text-xs font-bold text-blue-600 hover:underline">Adjust Stock</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- All Items Inventory Table matching Image 1 Right -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-slate-900 text-base">All Items</h3>
                    <span class="text-xs text-slate-400">${items.length} ingredients catalogued</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                                <th class="py-2.5">Item Name</th>
                                <th class="py-2.5">Category</th>
                                <th class="py-2.5">Current Stock</th>
                                <th class="py-2.5">Threshold</th>
                                <th class="py-2.5">Restock Timeline</th>
                                <th class="py-2.5">Status</th>
                                <th class="py-2.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 font-medium">
                            ${items.map(item => `
                                <tr class="hover:bg-slate-50/80 transition-colors">
                                    <td class="py-3 flex items-center gap-3">
                                        <img src="${item.image_url}" class="w-8 h-8 rounded-lg object-cover" />
                                        <span class="font-bold text-slate-900">${item.name}</span>
                                    </td>
                                    <td class="py-3 text-slate-500">${item.category}</td>
                                    <td class="py-3 font-bold text-slate-800 tabular-nums">${item.current_stock} ${item.unit}</td>
                                    <td class="py-3 text-slate-400 tabular-nums">${item.min_threshold} ${item.unit}</td>
                                    <td class="py-3 text-amber-600 font-semibold">${item.restock_alert}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-0.5 rounded-full text-2xs font-semibold ${item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                                            ${item.status}
                                        </span>
                                    </td>
                                    <td class="py-3 text-right">
                                        <button onclick="openAdjustStockModal('${item.id}', '${item.name}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-2xs font-bold transition">
                                            Adjust Stock
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

        // Render Wastage Donut Chart matching Image 1 Right
        setTimeout(() => {
            const canvas = document.getElementById('wastageDonutChart');
            if (canvas) {
                if (state.chartInstances.wastageDonut) state.chartInstances.wastageDonut.destroy();
                state.chartInstances.wastageDonut = new Chart(canvas, {
                    type: 'doughnut',
                    data: {
                        labels: ['Damage', 'PO Issues', 'Expiry'],
                        datasets: [{
                            data: [25, 22, 53],
                            backgroundColor: ['#EF4444', '#FCA5A5', '#16A34A'],
                            borderWidth: 0,
                            cutout: '68%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }, 100);

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Inventory: ${e.message}</div>`;
    }
}

function openAdjustStockModal(itemId, itemName = 'Refined Flour') {
    const modal = document.createElement('div');
    modal.id = 'adjust-stock-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-bold text-slate-900 text-base">Adjust Stock: ${itemName}</h3>
                <button onclick="document.getElementById('adjust-stock-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-slate-700">Quantity Change (+ to add, - for waste)</label>
                    <input type="number" id="adjust-qty" step="0.5" value="10" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900" />
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-700">Adjustment Reason</label>
                    <select id="adjust-reason" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs">
                        <option value="restock">New Supplier Purchase (Restock)</option>
                        <option value="wastage">Damaged / Kitchen Wastage</option>
                        <option value="audit">Physical Inventory Audit Mismatch</option>
                    </select>
                </div>
            </div>
            <button onclick="submitStockAdjustment('${itemId}')" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                Save Adjustment
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitStockAdjustment(itemId) {
    const targetId = itemId || 'inv-01';
    const qty = parseFloat(document.getElementById('adjust-qty')?.value) || 0;
    const reason = document.getElementById('adjust-reason')?.value || 'restock';

    try {
        const res = await fetch(`/api/inventory/items/${targetId}/adjust`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity_change: qty, reason: reason })
        });
        if (res.ok) {
            document.getElementById('adjust-stock-modal')?.remove();
            showToast("✓ Stock updated successfully!", "success");
            renderInventoryView();
        }
    } catch (e) {
        showToast("Failed to adjust stock: " + e.message, "danger");
    }
}

// ==========================================
// 7. RESTAURANT TABLE MANAGEMENT (Floor Plan)
// ==========================================
async function renderTablesView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const tables = await fetch('/api/tables').then(r => r.json());
        state.tables = tables;

        const sections = ['Inside Dining', 'Terrace Garden', 'Bar Lounge', 'VIP Private Room'];

        contentArea.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">Restaurant Floor Plan</h1>
                    <p class="text-xs text-slate-500">Visual table layout, occupancy states, and server assignments</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="openTableTransferModal()" class="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition">
                        Transfer Order
                    </button>
                </div>
            </div>

            <!-- Floor Sections -->
            ${sections.map(sec => {
                const secTables = tables.filter(t => t.section === sec);
                if (secTables.length === 0) return '';
                return `
                <div class="space-y-3">
                    <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span>${sec}</span>
                    </h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        ${secTables.map(tbl => {
                            const statusColor = {
                                'Available': 'border-emerald-200 bg-emerald-50/30 text-emerald-700',
                                'Occupied': 'border-orange-300 bg-orange-50/60 text-orange-700',
                                'Reserved': 'border-blue-200 bg-blue-50/30 text-blue-700',
                                'Cleaning': 'border-amber-200 bg-amber-50/30 text-amber-700',
                                'Payment Pending': 'border-purple-300 bg-purple-50/50 text-purple-700'
                            }[tbl.status] || 'border-slate-200 bg-white text-slate-700';

                            return `
                            <div class="p-4 rounded-2xl border-2 ${statusColor} shadow-xs card-hover flex flex-col justify-between h-40">
                                <div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-base font-black text-slate-900">${tbl.table_number}</span>
                                        <span class="text-3xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border">${tbl.capacity} Seats</span>
                                    </div>
                                    <p class="text-3xs font-semibold mt-1">${tbl.status}</p>
                                </div>

                                <div class="space-y-1">
                                    ${tbl.current_order_amount ? `
                                        <div class="text-xs font-extrabold text-orange-600 tabular-nums">${formatCurrency(tbl.current_order_amount)}</div>
                                    ` : `
                                        <div class="text-3xs text-slate-400">Server: ${tbl.assigned_waiter_name || 'None'}</div>
                                    `}
                                    <div class="flex gap-1 pt-1">
                                        <button onclick="toggleTableStatus('${tbl.id}', '${tbl.status}')" class="flex-1 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-3xs font-bold">
                                            Status
                                        </button>
                                        <button onclick="state.cartTable = '${tbl.table_number}'; navigateTo('pos');" class="px-2 py-1 bg-orange-600 text-white rounded-lg text-3xs font-bold">
                                            POS
                                        </button>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Floor Plan: ${e.message}</div>`;
    }
}

async function toggleTableStatus(tableId, currentStatus) {
    const statuses = ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Payment Pending'];
    const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    const nextStatus = statuses[nextIdx];

    try {
        await fetch(`/api/tables/${tableId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
        showToast(`Table status changed to ${nextStatus}`, 'info');
        renderTablesView();
    } catch (e) {
        showToast("Error updating table: " + e.message, 'danger');
    }
}

function openTableTransferModal() {
    const modal = document.createElement('div');
    modal.id = 'table-transfer-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-bold text-slate-900 text-base">Transfer Table Check</h3>
                <button onclick="document.getElementById('table-transfer-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="text-xs font-bold text-slate-700">From Table</label>
                    <select id="transfer-src" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs">
                        ${state.tables.filter(t => t.status === 'Occupied').map(t => `<option value="${t.table_number}">${t.table_number}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-700">To Table</label>
                    <select id="transfer-tgt" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs">
                        ${state.tables.filter(t => t.status === 'Available').map(t => `<option value="${t.table_number}">${t.table_number}</option>`).join('')}
                    </select>
                </div>
            </div>
            <button onclick="executeTableTransfer()" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                Confirm Transfer
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function executeTableTransfer() {
    const src = document.getElementById('transfer-src')?.value;
    const tgt = document.getElementById('transfer-tgt')?.value;
    if (!src || !tgt) return;

    try {
        const res = await fetch(`/api/tables/transfer?source_table=${src}&target_table=${tgt}`, { method: 'POST' });
        if (res.ok) {
            document.getElementById('table-transfer-modal')?.remove();
            showToast(`✓ Transferred order from ${src} to ${tgt}`, 'success');
            renderTablesView();
        }
    } catch (e) {
        showToast("Transfer failed: " + e.message, 'danger');
    }
}

// ==========================================
// 8. MENU MANAGEMENT (Admin)
// ==========================================
async function renderMenuAdminView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const items = await fetch('/api/menu/items').then(r => r.json());
        state.menuItems = items;

        contentArea.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">Menu & Pricing Management</h1>
                    <p class="text-xs text-slate-500">Configure food items, GST rates, images, and live stock toggles</p>
                </div>
                <button onclick="openAddMenuItemModal()" class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Add New Dish</span>
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${items.map(item => `
                    <div class="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs p-4 flex gap-4">
                        <img src="${item.image_url}" class="w-20 h-20 rounded-xl object-cover shrink-0" />
                        <div class="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                                <div class="flex items-center justify-between">
                                    <h4 class="font-bold text-slate-900 text-sm truncate">${item.name}</h4>
                                    <span class="w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                                </div>
                                <span class="text-2xs text-slate-400 font-mono">${item.item_code} • ${item.category_name}</span>
                            </div>

                            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                <span class="text-sm font-extrabold text-slate-900 tabular-nums">${formatCurrency(item.price)}</span>
                                <div class="flex items-center gap-2">
                                    <button onclick="toggleItemStock('${item.id}', ${item.is_available ? 0 : 1})" class="px-2.5 py-1 rounded-lg text-3xs font-bold ${item.is_available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                                        ${item.is_available ? 'In Stock' : 'Out of Stock'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Menu: ${e.message}</div>`;
    }
}

async function toggleItemStock(itemId, nextVal) {
    try {
        await fetch(`/api/menu/items/${itemId}/availability`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_available: nextVal })
        });
        showToast("Dish stock availability synchronized across all POS/KDS screens!", "success");
        renderMenuAdminView();
    } catch (e) {
        showToast("Failed to update availability", "danger");
    }
}

function openAddMenuItemModal() {
    const modal = document.createElement('div');
    modal.id = 'add-item-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 class="font-bold text-slate-900 text-base">Add New Menu Item</h3>
                <button onclick="document.getElementById('add-item-modal').remove()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="space-y-3 text-xs">
                <div>
                    <label class="font-bold text-slate-700">Dish Name</label>
                    <input type="text" id="new-item-name" placeholder="e.g. Artisanal Garlic Bread" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="font-bold text-slate-700">Category</label>
                        <select id="new-item-cat" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl">
                            ${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="font-bold text-slate-700">Price (INR)</label>
                        <input type="number" id="new-item-price" value="199" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
                    </div>
                </div>
                <div>
                    <label class="font-bold text-slate-700">Image URL</label>
                    <input type="text" id="new-item-img" value="https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=500" class="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl" />
                </div>
            </div>
            <button onclick="submitNewMenuItem()" class="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                Save & Add to Menu
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitNewMenuItem() {
    const name = document.getElementById('new-item-name')?.value;
    const catId = document.getElementById('new-item-cat')?.value;
    const price = parseFloat(document.getElementById('new-item-price')?.value) || 199;
    const img = document.getElementById('new-item-img')?.value;

    if (!name) return;

    try {
        const res = await fetch('/api/menu/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name, category_id: catId, price, image_url: img, is_veg: 1
            })
        });
        if (res.ok) {
            document.getElementById('add-item-modal')?.remove();
            showToast("✓ Dish added to menu!", "success");
            renderMenuAdminView();
        }
    } catch (e) {
        showToast("Error adding item: " + e.message, "danger");
    }
}

// ==========================================
// 9. BILLING & INVOICES
// ==========================================
async function renderBillingView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const invoices = await fetch('/api/billing/invoices').then(r => r.json());

        contentArea.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">Billing & GST Tax Invoices</h1>
                    <p class="text-xs text-slate-500">Official tax invoices, payment records, and thermal printing</p>
                </div>
                <a href="/api/reports/export/csv" class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition">
                    <i data-lucide="download" class="w-4 h-4"></i>
                    <span>Export CSV</span>
                </a>
            </div>

            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                                <th class="py-2.5">Invoice #</th>
                                <th class="py-2.5">Table/Type</th>
                                <th class="py-2.5">Customer</th>
                                <th class="py-2.5">Subtotal</th>
                                <th class="py-2.5">GST</th>
                                <th class="py-2.5">Grand Total</th>
                                <th class="py-2.5">Payment</th>
                                <th class="py-2.5 text-right">Receipt / PDF</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 font-medium">
                            ${invoices.map(inv => `
                                <tr class="hover:bg-slate-50/80 transition-colors">
                                    <td class="py-3 font-bold text-slate-900">${inv.order_number}</td>
                                    <td class="py-3 text-slate-600">${inv.table_number || inv.order_type.toUpperCase()}</td>
                                    <td class="py-3 text-slate-700 font-semibold">${inv.customer_name || 'Guest'}</td>
                                    <td class="py-3 text-slate-500 tabular-nums">${formatCurrency(inv.subtotal)}</td>
                                    <td class="py-3 text-slate-500 tabular-nums">${formatCurrency(inv.gst_amount)}</td>
                                    <td class="py-3 font-extrabold text-slate-900 tabular-nums">${formatCurrency(inv.grand_total)}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-0.5 rounded-full text-3xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            ${inv.payment_method}
                                        </span>
                                    </td>
                                    <td class="py-3 text-right space-x-2">
                                        <button onclick="openThermalReceiptModal('${inv.id}', '${inv.order_number}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-3xs font-bold transition">
                                            Slip
                                        </button>
                                        <a href="/api/billing/invoice/${inv.id}/pdf" target="_blank" class="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-3xs font-bold transition">
                                            PDF
                                        </a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Invoices: ${e.message}</div>`;
    }
}

// ==========================================
// 10. REPORTS & ANALYTICS
// ==========================================
async function renderReportsView() {
    const contentArea = document.getElementById('main-content-area');

    try {
        const bestSellers = await fetch('/api/reports/best-sellers').then(r => r.json());

        contentArea.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 class="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
                    <p class="text-xs text-slate-500">Executive financial metrics, sales velocity, and export tools</p>
                </div>
                <div class="flex items-center gap-2">
                    <a href="/api/reports/export/csv" class="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition">
                        <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-600"></i>
                        <span>Export CSV</span>
                    </a>
                    <a href="/api/reports/export/pdf" target="_blank" class="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition">
                        <i data-lucide="file-text" class="w-4 h-4"></i>
                        <span>Executive PDF Report</span>
                    </a>
                </div>
            </div>

            <!-- Best Sellers Table -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <h3 class="font-bold text-slate-900 text-base">Top Performing Dishes</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs">
                        <thead>
                            <tr class="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                                <th class="py-2">Item Name</th>
                                <th class="py-2">Total Units Sold</th>
                                <th class="py-2 text-right">Revenue Contribution</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 font-medium">
                            ${bestSellers.map(b => `
                                <tr>
                                    <td class="py-3 font-bold text-slate-900">${b.name}</td>
                                    <td class="py-3 text-slate-600 tabular-nums">${b.total_qty} orders</td>
                                    <td class="py-3 text-right font-extrabold text-orange-600 tabular-nums">${formatCurrency(b.total_sales)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;

        if (window.lucide) lucide.createIcons();

    } catch (e) {
        contentArea.innerHTML = `<div class="p-8 text-rose-600 bg-rose-50 rounded-xl">Error loading Reports: ${e.message}</div>`;
    }
}

// ==========================================
// 11. STAFF, CUSTOMERS & SETTINGS
// ==========================================
async function renderStaffView() {
    const contentArea = document.getElementById('main-content-area');
    const staff = await fetch('/api/staff').then(r => r.json());

    contentArea.innerHTML = `
    <div class="space-y-6">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Staff & Shifts</h1>
                <p class="text-xs text-slate-500">Employee roles, PIN authorization, and shift management</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            ${staff.map(s => `
                <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
                    <img src="${s.avatar_url}" class="w-12 h-12 rounded-full object-cover shrink-0" />
                    <div>
                        <h4 class="font-bold text-slate-900 text-sm">${s.name}</h4>
                        <span class="text-xs font-semibold text-orange-600">${s.role}</span>
                        <p class="text-3xs text-slate-400 mt-0.5">${s.shift} • PIN: ${s.pin_code}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
    if (window.lucide) lucide.createIcons();
}

async function renderCustomersView() {
    const contentArea = document.getElementById('main-content-area');
    const custs = await fetch('/api/customers').then(r => r.json());

    contentArea.innerHTML = `
    <div class="space-y-6">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Customer CRM & Loyalty</h1>
                <p class="text-xs text-slate-500">Guest dining histories, preferences, and rewards</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            ${custs.map(c => `
                <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
                    <div class="flex items-center justify-between">
                        <h4 class="font-bold text-slate-900 text-sm">${c.name}</h4>
                        <span class="px-2 py-0.5 bg-amber-50 text-amber-700 text-3xs font-bold rounded-full">★ ${c.loyalty_points} pts</span>
                    </div>
                    <p class="text-xs text-slate-500">${c.phone}</p>
                    <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
                        <span class="text-slate-400">${c.total_orders} visits</span>
                        <span class="font-bold text-slate-800">${formatCurrency(c.total_spend)}</span>
                    </div>
                    ${c.preferences ? `<p class="text-3xs text-slate-400 italic">"${c.preferences}"</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>`;
    if (window.lucide) lucide.createIcons();
}

async function renderSettingsView() {
    const contentArea = document.getElementById('main-content-area');
    const settings = await fetch('/api/settings').then(r => r.json());
    const qrData = await fetch('/api/settings/qr-codes').then(r => r.json());

    contentArea.innerHTML = `
    <div class="space-y-6">
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Restaurant Settings & QR Hub</h1>
                <p class="text-xs text-slate-500">Brand identity, tax rules, and printable table QR codes</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left 2 Cols: Profile & Tax -->
            <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 class="font-bold text-slate-900 text-base">Restaurant Profile</h3>
                <div class="grid grid-cols-2 gap-4 text-xs">
                    <div>
                        <label class="font-bold text-slate-700">Brand Name</label>
                        <input type="text" value="${settings.restaurant_name}" class="w-full mt-1 px-3 py-2 border rounded-xl" />
                    </div>
                    <div>
                        <label class="font-bold text-slate-700">GSTIN Number</label>
                        <input type="text" value="${settings.gstin}" class="w-full mt-1 px-3 py-2 border rounded-xl font-mono" />
                    </div>
                    <div>
                        <label class="font-bold text-slate-700">GST Rate (%)</label>
                        <input type="number" value="${settings.gst_rate}" class="w-full mt-1 px-3 py-2 border rounded-xl font-bold" />
                    </div>
                    <div>
                        <label class="font-bold text-slate-700">Thermal Printer Preset</label>
                        <select class="w-full mt-1 px-3 py-2 border rounded-xl">
                            <option value="80mm" selected>80mm Standard Restaurant Receipt</option>
                            <option value="58mm">58mm Compact Receipt</option>
                        </select>
                    </div>
                </div>

                <!-- Simulate Offline Toggle Button -->
                <div class="pt-4 border-t border-slate-200">
                    <h4 class="font-bold text-slate-800 text-xs mb-1">Offline-First Testing</h4>
                    <p class="text-2xs text-slate-400 mb-2">Simulate an internet outage to test local queueing and automatic sync.</p>
                    <button onclick="toggleOfflineModeTest()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition">
                        Toggle Offline Simulation
                    </button>
                </div>
            </div>

            <!-- Right Col: Printable QR Codes -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 class="font-bold text-slate-900 text-base">Table QR Codes</h3>
                <p class="text-xs text-slate-400">Download or print table QR codes for customer self-ordering</p>
                <div class="space-y-3 max-h-80 overflow-y-auto">
                    ${qrData.map(q => `
                        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <h5 class="text-xs font-bold text-slate-800">${q.table_number}</h5>
                                <span class="text-3xs text-slate-400">${q.section}</span>
                            </div>
                            <a href="${q.qr_image_url}" target="_blank" class="px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-2xs font-bold shadow-2xs">
                                View QR
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>`;
    if (window.lucide) lucide.createIcons();
}

function toggleOfflineModeTest() {
    const isCurrentlySimulated = window.offlineManager.isSimulatedOffline;
    window.offlineManager.toggleSimulateOffline(!isCurrentlySimulated);
    showToast(isCurrentlySimulated ? "🟢 Online mode restored! Automatically syncing..." : "🟠 Simulating Offline mode. Orders will now queue locally.", isCurrentlySimulated ? "success" : "warning");
}

// Global WebSocket Event Listeners for Real-time Reactive Updates
window.addEventListener('ws:order_created', (e) => {
    console.log("⚡ Real-time Order Created Event:", e.detail);
    showToast(`🔔 New Order ${e.detail.order_number} for ${e.detail.table_number || e.detail.order_type}!`, "info");
    
    // Refresh current view if relevant
    if (state.currentView === 'dashboard') renderDashboardView();
    if (state.currentView === 'kds') renderKDSView();
    if (state.currentView === 'tables') renderTablesView();
});

window.addEventListener('ws:order_status_updated', (e) => {
    console.log("⚡ Real-time Order Status Event:", e.detail);
    if (state.currentView === 'kds') renderKDSView();
    if (state.currentView === 'dashboard') renderDashboardView();
    if (state.currentView === 'tables') renderTablesView();
});

window.addEventListener('ws:menu_stock_updated', (e) => {
    console.log("⚡ Real-time Menu Stock Event:", e.detail);
    if (state.currentView === 'pos') renderPOSView();
    if (state.currentView === 'menu') renderMenuAdminView();
    if (state.currentView === 'qr') renderQRMenuView(state.qrSelectedTable);
});

// App Entrypoint
document.addEventListener('DOMContentLoaded', () => {
    // Initial routing based on path or hash
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    
    let initialView = 'dashboard';
    if (path === '/pos' || hash === 'pos') initialView = 'pos';
    else if (path === '/kds' || hash === 'kds') initialView = 'kds';
    else if (path === '/waiter' || hash === 'waiter') initialView = 'waiter';
    else if (path === '/qr' || hash === 'qr') initialView = 'qr';
    else if (path === '/inventory' || hash === 'inventory') initialView = 'inventory';

    navigateTo(initialView);
});

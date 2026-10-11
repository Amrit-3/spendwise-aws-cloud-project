/**
 * SpendWise - Personal Expense Tracker
 * Frontend Application Controller (Vanilla JS)
 */

// Application State
const state = {
    expenses: [],
    categories: [],
    stats: null,
    filters: {
        search: '',
        category: 'All',
        sort: 'date-desc'
    },
    deleteTarget: null,
    charts: {
        category: null,
        monthly: null
    },
    isLoading: false
};

// Receipt upload rules (must match the backend in app.py)
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const RECEIPT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Category Color Palette for Badges & Charts
const CATEGORY_COLORS = {
    "Food & Dining": { bg: "rgba(16, 185, 129, 0.8)", border: "#10b981", class: "cat-food" },
    "Housing & Utilities": { bg: "rgba(245, 158, 11, 0.8)", border: "#f59e0b", class: "cat-utilities" },
    "Transportation": { bg: "rgba(59, 130, 246, 0.8)", border: "#3b82f6", class: "cat-transport" },
    "Shopping": { bg: "rgba(168, 85, 247, 0.8)", border: "#a855f7", class: "cat-shopping" },
    "Entertainment": { bg: "rgba(236, 72, 153, 0.8)", border: "#ec4899", class: "cat-entertainment" },
    "Health & Wellness": { bg: "rgba(6, 182, 212, 0.8)", border: "#06b6d4", class: "cat-health" },
    "Education": { bg: "rgba(99, 102, 241, 0.8)", border: "#6366f1", class: "cat-education" },
    "Travel": { bg: "rgba(14, 165, 233, 0.8)", border: "#0ea5e9", class: "cat-travel" },
    "Bills & Subscriptions": { bg: "rgba(139, 92, 246, 0.8)", border: "#8b5cf6", class: "cat-bills" },
    "Personal Care": { bg: "rgba(217, 70, 239, 0.8)", border: "#d946ef", class: "cat-personal" },
    "Other": { bg: "rgba(100, 116, 139, 0.8)", border: "#64748b", class: "cat-other" }
};

// DOM Element References
const elements = {
    // Theme
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIconLight: document.getElementById('themeIconLight'),
    themeIconDark: document.getElementById('themeIconDark'),

    // KPIs
    totalSpendingValue: document.getElementById('totalSpendingValue'),
    transactionCountValue: document.getElementById('transactionCountValue'),
    highestExpenseValue: document.getElementById('highestExpenseValue'),
    highestExpenseTitle: document.getElementById('highestExpenseTitle'),
    averageExpenseValue: document.getElementById('averageExpenseValue'),

    // Charts
    categoryChartCanvas: document.getElementById('categoryChart'),
    categoryChartEmpty: document.getElementById('categoryChartEmpty'),
    categoryCountBadge: document.getElementById('categoryCountBadge'),
    monthlyChartCanvas: document.getElementById('monthlyChart'),
    monthlyChartEmpty: document.getElementById('monthlyChartEmpty'),

    // Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    categoryFilter: document.getElementById('categoryFilter'),
    sortFilter: document.getElementById('sortFilter'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),

    // Table & States
    expensesTable: document.getElementById('expensesTable'),
    expensesTableBody: document.getElementById('expensesTableBody'),
    tableContainer: document.getElementById('tableContainer'),
    tableLoadingState: document.getElementById('tableLoadingState'),
    tableEmptyState: document.getElementById('tableEmptyState'),
    tableNoResultsState: document.getElementById('tableNoResultsState'),
    clearFiltersFromEmptyBtn: document.getElementById('clearFiltersFromEmptyBtn'),
    transactionsFilteredCount: document.getElementById('transactionsFilteredCount'),
    filteredTotalAmount: document.getElementById('filteredTotalAmount'),

    // Modals
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    addExpenseModal: document.getElementById('addExpenseModal'),
    addExpenseForm: document.getElementById('addExpenseForm'),
    addTitle: document.getElementById('addTitle'),
    addAmount: document.getElementById('addAmount'),
    addCategory: document.getElementById('addCategory'),
    addDate: document.getElementById('addDate'),
    addNotes: document.getElementById('addNotes'),
    addReceipt: document.getElementById('addReceipt'),
    saveAddExpenseBtn: document.getElementById('saveAddExpenseBtn'),
    setTodayBtn: document.getElementById('setTodayBtn'),

    editExpenseModal: document.getElementById('editExpenseModal'),
    editExpenseForm: document.getElementById('editExpenseForm'),
    editExpenseId: document.getElementById('editExpenseId'),
    editTitle: document.getElementById('editTitle'),
    editAmount: document.getElementById('editAmount'),
    editCategory: document.getElementById('editCategory'),
    editDate: document.getElementById('editDate'),
    editNotes: document.getElementById('editNotes'),
    editReceipt: document.getElementById('editReceipt'),
    editReceiptHint: document.getElementById('editReceiptHint'),
    saveEditExpenseBtn: document.getElementById('saveEditExpenseBtn'),

    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deletePreviewTitle: document.getElementById('deletePreviewTitle'),
    deletePreviewCategory: document.getElementById('deletePreviewCategory'),
    deletePreviewDate: document.getElementById('deletePreviewDate'),
    deletePreviewAmount: document.getElementById('deletePreviewAmount'),

    // Utilities
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupEventListeners();
    await fetchCategories();
    setDefaultFormDate();
    await loadDashboardData();
    refreshIcons();
});

function refreshIcons() {
    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==========================================================================
// Theme Management
// ==========================================================================

function initTheme() {
    const savedTheme = localStorage.getItem('spendwise-theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('spendwise-theme', theme);
    
    if (theme === 'dark') {
        elements.themeIconLight.classList.remove('hidden');
        elements.themeIconDark.classList.add('hidden');
    } else {
        elements.themeIconLight.classList.add('hidden');
        elements.themeIconDark.classList.remove('hidden');
    }

    // Re-render charts with updated theme colors if already initialized
    if (state.stats) {
        renderCharts(state.stats);
    }
    refreshIcons();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================

function setupEventListeners() {
    // Theme Toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Add Modal Actions
    elements.openAddModalBtn.addEventListener('click', openAddModal);
    elements.setTodayBtn.addEventListener('click', setDefaultFormDate);
    elements.addExpenseForm.addEventListener('submit', handleAddExpenseSubmit);

    // Edit Modal Actions
    elements.editExpenseForm.addEventListener('submit', handleEditExpenseSubmit);

    // Delete Modal Actions
    elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    // Filters & Search
    let searchDebounceTimer;
    elements.searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        elements.clearSearchBtn.classList.toggle('hidden', !val);
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            state.filters.search = val.trim();
            fetchExpenses();
        }, 250);
    });

    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.clearSearchBtn.classList.add('hidden');
        state.filters.search = '';
        fetchExpenses();
    });

    elements.categoryFilter.addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        fetchExpenses();
    });

    elements.sortFilter.addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        fetchExpenses();
    });

    elements.resetFiltersBtn.addEventListener('click', resetAllFilters);
    elements.clearFiltersFromEmptyBtn.addEventListener('click', resetAllFilters);

    // Export CSV
    elements.exportCsvBtn.addEventListener('click', exportExpensesToCSV);

    // Keyboard Shortcuts (Esc to close modals, Ctrl/Cmd + N to open Add modal)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            openAddModal();
        }
    });

    // Close modal on background click
    [elements.addExpenseModal, elements.editExpenseModal, elements.deleteConfirmModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

function setDefaultFormDate() {
    const today = new Date().toISOString().split('T')[0];
    if (elements.addDate) elements.addDate.value = today;
}

function resetAllFilters() {
    state.filters.search = '';
    state.filters.category = 'All';
    state.filters.sort = 'date-desc';

    elements.searchInput.value = '';
    elements.clearSearchBtn.classList.add('hidden');
    elements.categoryFilter.value = 'All';
    elements.sortFilter.value = 'date-desc';

    fetchExpenses();
}

// ==========================================================================
// API Calls & Data Loading
// ==========================================================================

async function fetchCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.status === 'success') {
            state.categories = data.categories;
            populateCategoryDropdowns(data.categories);
        }
    } catch (err) {
        console.error('Failed to load categories:', err);
        showToast('Error', 'Failed to load expense categories.', 'error');
    }
}

function populateCategoryDropdowns(categories) {
    // Filter dropdown
    elements.categoryFilter.innerHTML = '<option value="All">All Categories</option>';
    // Modal dropdowns
    elements.addCategory.innerHTML = '<option value="" disabled selected>Select category</option>';
    elements.editCategory.innerHTML = '<option value="" disabled selected>Select category</option>';

    categories.forEach(cat => {
        // Filter options
        const filterOpt = document.createElement('option');
        filterOpt.value = cat;
        filterOpt.textContent = cat;
        elements.categoryFilter.appendChild(filterOpt);

        // Add modal options
        const addOpt = document.createElement('option');
        addOpt.value = cat;
        addOpt.textContent = cat;
        elements.addCategory.appendChild(addOpt);

        // Edit modal options
        const editOpt = document.createElement('option');
        editOpt.value = cat;
        editOpt.textContent = cat;
        elements.editCategory.appendChild(editOpt);
    });
}

async function loadDashboardData() {
    await Promise.all([
        fetchExpenses(),
        fetchStats()
    ]);
}

async function fetchExpenses() {
    setLoadingState(true);
    try {
        // Parse sort parameters
        const [sort_by, order] = state.filters.sort.split('-');

        const params = new URLSearchParams();
        if (state.filters.search) params.append('search', state.filters.search);
        if (state.filters.category && state.filters.category !== 'All') params.append('category', state.filters.category);
        if (sort_by) params.append('sort_by', sort_by);
        if (order) params.append('order', order);

        const response = await fetch(`/api/expenses?${params.toString()}`);
        const data = await response.json();

        if (data.status === 'success') {
            state.expenses = data.expenses;
            renderExpensesTable(data.expenses, data.total_amount);
        } else {
            showToast('Error', data.message || 'Failed to fetch expenses', 'error');
        }
    } catch (err) {
        console.error('Error fetching expenses:', err);
        showToast('Network Error', 'Could not connect to the backend server.', 'error');
    } finally {
        setLoadingState(false);
    }
}

async function fetchStats() {
    try {
        const response = await fetch('/api/expenses/stats');
        const data = await response.json();
        if (data.status === 'success') {
            state.stats = data.stats;
            updateMetrics(data.stats);
            renderCharts(data.stats);
        }
    } catch (err) {
        console.error('Error fetching statistics:', err);
    }
}

function setLoadingState(loading) {
    state.isLoading = loading;
    elements.tableLoadingState.classList.toggle('hidden', !loading);
    if (loading) {
        elements.tableContainer.classList.add('hidden');
        elements.tableEmptyState.classList.add('hidden');
        elements.tableNoResultsState.classList.add('hidden');
    }
}

// ==========================================================================
// Receipts (S3): validate, upload and view
// ==========================================================================

/**
 * Check the file chosen in a receipt input.
 * Returns the File (or null if nothing was chosen).
 * Returns false and shows an inline error if the file is not allowed.
 */
function getValidReceiptFile(inputEl, fieldPrefix) {
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return null;

    if (!RECEIPT_ALLOWED_TYPES.includes(file.type)) {
        setFieldError(fieldPrefix, 'Receipt must be a JPG, PNG or PDF file.');
        return false;
    }
    if (file.size > RECEIPT_MAX_BYTES) {
        setFieldError(fieldPrefix, 'Receipt must be 5 MB or smaller.');
        return false;
    }
    return file;
}

/**
 * Upload a receipt for an existing expense.
 * Never throws: returns { ok: boolean, message: string }.
 */
async function uploadReceipt(expenseId, file) {
    try {
        const formData = new FormData();
        formData.append('receipt', file);

        const response = await fetch(`/api/expenses/${expenseId}/receipt`, {
            method: 'POST',
            body: formData
        });

        let result = {};
        try {
            result = await response.json();
        } catch (e) {
            // Non-JSON reply (for example a proxy error page)
        }

        if (response.ok && result.status === 'success') {
            return { ok: true, message: result.message || 'Receipt uploaded.' };
        }
        return { ok: false, message: result.message || 'Receipt upload failed.' };
    } catch (err) {
        console.error('Receipt upload failed:', err);
        return { ok: false, message: 'Network error while uploading the receipt.' };
    }
}

/**
 * Open a receipt in a new tab using a short-lived link from the backend.
 * The blank tab is opened first (inside the click) so browsers don't block it.
 */
async function viewReceipt(expenseId) {
    const receiptWindow = window.open('', '_blank');
    try {
        const response = await fetch(`/api/expenses/${expenseId}/receipt`);
        const result = await response.json();

        if (response.ok && result.status === 'success' && result.url) {
            if (receiptWindow) {
                receiptWindow.opener = null;
                receiptWindow.location.href = result.url;
            } else {
                window.location.href = result.url;
            }
        } else {
            if (receiptWindow) receiptWindow.close();
            showToast('No Receipt', result.message || 'Could not open the receipt.', 'error');
        }
    } catch (err) {
        console.error('Failed to open receipt:', err);
        if (receiptWindow) receiptWindow.close();
        showToast('Error', 'Could not open the receipt.', 'error');
    }
}

// ==========================================================================
// UI Rendering: KPI Metrics
// ==========================================================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const [y, m, d] = dateString.split('-');
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

function updateMetrics(stats) {
    // Total Spending
    elements.totalSpendingValue.textContent = formatCurrency(stats.total_spending);
    
    // Transactions count
    elements.transactionCountValue.textContent = stats.transaction_count.toLocaleString();
    
    // Highest Expense
    if (stats.highest_expense) {
        elements.highestExpenseValue.textContent = formatCurrency(stats.highest_expense.amount);
        elements.highestExpenseTitle.textContent = stats.highest_expense.title;
        elements.highestExpenseTitle.title = `${stats.highest_expense.title} (${stats.highest_expense.category})`;
    } else {
        elements.highestExpenseValue.textContent = '$0.00';
        elements.highestExpenseTitle.textContent = 'None recorded';
    }

    // Average Expense
    elements.averageExpenseValue.textContent = formatCurrency(stats.average_expense);

    // Category count badge
    const catCount = stats.category_spending ? stats.category_spending.length : 0;
    elements.categoryCountBadge.textContent = `${catCount} Categor${catCount === 1 ? 'y' : 'ies'}`;
}

// ==========================================================================
// UI Rendering: Expenses Table
// ==========================================================================

function getCategoryBadgeClass(category) {
    if (CATEGORY_COLORS[category]) {
        return CATEGORY_COLORS[category].class;
    }
    return 'cat-other';
}

function renderExpensesTable(expenses, totalAmount) {
    elements.expensesTableBody.innerHTML = '';
    
    // Update summary counts
    elements.transactionsFilteredCount.textContent = `${expenses.length} item${expenses.length === 1 ? '' : 's'}`;
    elements.filteredTotalAmount.textContent = formatCurrency(totalAmount);

    const hasActiveFilters = state.filters.search !== '' || state.filters.category !== 'All';

    if (expenses.length === 0) {
        elements.tableContainer.classList.add('hidden');
        if (hasActiveFilters) {
            elements.tableEmptyState.classList.add('hidden');
            elements.tableNoResultsState.classList.remove('hidden');
        } else {
            elements.tableNoResultsState.classList.add('hidden');
            elements.tableEmptyState.classList.remove('hidden');
        }
        refreshIcons();
        return;
    }

    // Has expenses
    elements.tableEmptyState.classList.add('hidden');
    elements.tableNoResultsState.classList.add('hidden');
    elements.tableContainer.classList.remove('hidden');

    const fragment = document.createDocumentFragment();

    expenses.forEach(exp => {
        const tr = document.createElement('tr');
        tr.id = `expense-row-${exp.id}`;

        const badgeClass = getCategoryBadgeClass(exp.category);

        // Only expenses that have a receipt get the paperclip button
        const receiptButton = exp.receipt_key
            ? `<button class="action-btn action-btn-receipt" title="View receipt" aria-label="View receipt" onclick="viewReceipt(${exp.id})">
                        <i data-lucide="paperclip"></i>
                    </button>`
            : '';

        tr.innerHTML = `
            <td class="cell-date">${formatDate(exp.date)}</td>
            <td class="cell-title">
                <div class="cell-title-block">
                    <span class="expense-title-text">${escapeHtml(exp.title)}</span>
                    ${exp.notes ? `<span class="expense-notes-text">${escapeHtml(exp.notes)}</span>` : ''}
                </div>
            </td>
            <td class="cell-category">
                <span class="badge ${badgeClass}">
                    <span class="badge-dot"></span>
                    <span>${escapeHtml(exp.category)}</span>
                </span>
            </td>
            <td class="cell-amount text-right">${formatCurrency(exp.amount)}</td>
            <td class="cell-actions text-center">
                <div class="table-actions-cell">
                    ${receiptButton}
                    <button class="action-btn action-btn-edit" title="Edit expense" onclick="openEditModal(${exp.id})">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="action-btn action-btn-delete" title="Delete expense" onclick="openDeleteModal(${exp.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;

        fragment.appendChild(tr);
    });

    elements.expensesTableBody.appendChild(fragment);
    refreshIcons();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==========================================================================
// Chart.js Visualizations
// ==========================================================================

function getThemeFontColor() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    return isDark ? '#9ca3af' : '#475569';
}

function getThemeGridColor() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    return isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
}

function renderCharts(stats) {
    renderCategoryChart(stats.category_spending || []);
    renderMonthlyChart(stats.monthly_spending || []);
}

function renderCategoryChart(categoryData) {
    if (state.charts.category) {
        state.charts.category.destroy();
        state.charts.category = null;
    }

    if (!categoryData || categoryData.length === 0) {
        elements.categoryChartCanvas.classList.add('hidden');
        elements.categoryChartEmpty.classList.remove('hidden');
        return;
    }

    elements.categoryChartCanvas.classList.remove('hidden');
    elements.categoryChartEmpty.classList.add('hidden');

    const labels = categoryData.map(c => c.category);
    const dataValues = categoryData.map(c => c.total);
    const bgColors = categoryData.map(c => {
        const cat = CATEGORY_COLORS[c.category];
        return cat ? cat.bg : "rgba(100, 116, 139, 0.8)";
    });
    const borderColors = categoryData.map(c => {
        const cat = CATEGORY_COLORS[c.category];
        return cat ? cat.border : "#64748b";
    });

    const ctx = elements.categoryChartCanvas.getContext('2d');
    state.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getThemeFontColor(),
                        font: { family: "'Inter', sans-serif", size: 11, weight: 500 },
                        boxWidth: 12,
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const val = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${label}: $${val.toFixed(2)} (${pct}%)`;
                        }
                    }
                }
            },
            cutout: '68%'
        }
    });
}

function renderMonthlyChart(monthlyData) {
    if (state.charts.monthly) {
        state.charts.monthly.destroy();
        state.charts.monthly = null;
    }

    if (!monthlyData || monthlyData.length === 0) {
        elements.monthlyChartCanvas.classList.add('hidden');
        elements.monthlyChartEmpty.classList.remove('hidden');
        return;
    }

    elements.monthlyChartCanvas.classList.remove('hidden');
    elements.monthlyChartEmpty.classList.add('hidden');

    const labels = monthlyData.map(m => m.label || m.month);
    const dataValues = monthlyData.map(m => m.total);

    const ctx = elements.monthlyChartCanvas.getContext('2d');

    // Create sleek purple-indigo gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');

    state.charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Total ($)',
                data: dataValues,
                backgroundColor: gradient,
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 38
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y || 0;
                            return ` Total: $${val.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: getThemeFontColor(),
                        font: { family: "'Inter', sans-serif", size: 11 }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: getThemeGridColor()
                    },
                    ticks: {
                        color: getThemeFontColor(),
                        font: { family: "'Inter', sans-serif", size: 11 },
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// ==========================================================================
// Modal Operations & Form Handlers
// ==========================================================================

function openAddModal() {
    closeAllModals();
    clearFormErrors(elements.addExpenseForm);
    elements.addExpenseForm.reset();
    setDefaultFormDate();
    elements.addExpenseModal.classList.remove('hidden');
    refreshIcons();
    setTimeout(() => elements.addTitle.focus(), 50);
}

function closeAddModal() {
    elements.addExpenseModal.classList.add('hidden');
    elements.addExpenseForm.reset();
    clearFormErrors(elements.addExpenseForm);
}

async function handleAddExpenseSubmit(e) {
    e.preventDefault();
    clearFormErrors(elements.addExpenseForm);

    const title = elements.addTitle.value.trim();
    const amount = parseFloat(elements.addAmount.value);
    const category = elements.addCategory.value;
    const date = elements.addDate.value;
    const notes = elements.addNotes.value.trim();

    // Client-side quick check
    let hasError = false;
    if (!title) {
        setFieldError('addTitle', 'Please enter an expense title.');
        hasError = true;
    }
    if (isNaN(amount) || amount <= 0) {
        setFieldError('addAmount', 'Enter a valid amount greater than 0.');
        hasError = true;
    }
    if (!category) {
        setFieldError('addCategory', 'Please select a category.');
        hasError = true;
    }
    if (!date) {
        setFieldError('addDate', 'Please choose a date.');
        hasError = true;
    }

    // Receipt is optional, but if one is chosen it must be valid
    const receiptFile = getValidReceiptFile(elements.addReceipt, 'addReceipt');
    if (receiptFile === false) {
        hasError = true;
    }

    if (hasError) return;

    elements.saveAddExpenseBtn.disabled = true;

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, category, date, notes })
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showToast('Expense Added', `"${title}" ($${amount.toFixed(2)}) recorded successfully.`, 'success');

            // Upload the receipt as a separate step. The expense is already saved,
            // so a failed upload only shows a warning and loses nothing.
            if (receiptFile) {
                const upload = await uploadReceipt(result.expense.id, receiptFile);
                if (upload.ok) {
                    showToast('Receipt Attached', 'Your receipt was uploaded.', 'success');
                } else {
                    showToast('Receipt Not Saved', `${upload.message} You can add it later with Edit.`, 'error');
                }
            }

            closeAddModal();
            await loadDashboardData();
        } else {
            showToast('Validation Error', result.message || 'Could not save expense.', 'error');
            if (result.errors && Array.isArray(result.errors)) {
                result.errors.forEach(err => showToast('Error', err, 'error'));
            }
        }
    } catch (err) {
        console.error('Failed to add expense:', err);
        showToast('Error', 'Failed to save expense. Check backend connection.', 'error');
    } finally {
        elements.saveAddExpenseBtn.disabled = false;
    }
}

async function openEditModal(id) {
    closeAllModals();
    clearFormErrors(elements.editExpenseForm);

    try {
        const response = await fetch(`/api/expenses/${id}`);
        const result = await response.json();

        if (result.status === 'success' && result.expense) {
            const exp = result.expense;
            elements.editExpenseId.value = exp.id;
            elements.editTitle.value = exp.title;
            elements.editAmount.value = exp.amount;
            elements.editCategory.value = exp.category;
            elements.editDate.value = exp.date;
            elements.editNotes.value = exp.notes || '';

            // Receipt field: clear any previous choice and tell the user if one exists
            elements.editReceipt.value = '';
            elements.editReceiptHint.textContent = exp.receipt_key
                ? 'A receipt is already attached. Choose a file to replace it.'
                : '';

            elements.editExpenseModal.classList.remove('hidden');
            refreshIcons();
            setTimeout(() => elements.editTitle.focus(), 50);
        } else {
            showToast('Not Found', 'Expense record not found.', 'error');
        }
    } catch (err) {
        console.error('Failed to load expense for editing:', err);
        showToast('Error', 'Could not load expense details.', 'error');
    }
}

function closeEditModal() {
    elements.editExpenseModal.classList.add('hidden');
    elements.editExpenseForm.reset();
    elements.editReceiptHint.textContent = '';
    clearFormErrors(elements.editExpenseForm);
}

async function handleEditExpenseSubmit(e) {
    e.preventDefault();
    clearFormErrors(elements.editExpenseForm);

    const id = elements.editExpenseId.value;
    const title = elements.editTitle.value.trim();
    const amount = parseFloat(elements.editAmount.value);
    const category = elements.editCategory.value;
    const date = elements.editDate.value;
    const notes = elements.editNotes.value.trim();

    let hasError = false;
    if (!title) {
        setFieldError('editTitle', 'Please enter an expense title.');
        hasError = true;
    }
    if (isNaN(amount) || amount <= 0) {
        setFieldError('editAmount', 'Enter a valid amount greater than 0.');
        hasError = true;
    }
    if (!category) {
        setFieldError('editCategory', 'Please select a category.');
        hasError = true;
    }
    if (!date) {
        setFieldError('editDate', 'Please choose a date.');
        hasError = true;
    }

    // Receipt is optional, but if one is chosen it must be valid
    const receiptFile = getValidReceiptFile(elements.editReceipt, 'editReceipt');
    if (receiptFile === false) {
        hasError = true;
    }

    if (hasError) return;

    elements.saveEditExpenseBtn.disabled = true;

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, amount, category, date, notes })
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showToast('Expense Updated', `"${title}" has been updated.`, 'success');

            // Upload (or replace) the receipt as a separate step
            if (receiptFile) {
                const upload = await uploadReceipt(id, receiptFile);
                if (upload.ok) {
                    showToast('Receipt Attached', 'Your receipt was uploaded.', 'success');
                } else {
                    showToast('Receipt Not Saved', `${upload.message} Your other changes were saved.`, 'error');
                }
            }

            closeEditModal();
            await loadDashboardData();
        } else {
            showToast('Validation Error', result.message || 'Could not update expense.', 'error');
        }
    } catch (err) {
        console.error('Failed to update expense:', err);
        showToast('Error', 'Failed to update expense.', 'error');
    } finally {
        elements.saveEditExpenseBtn.disabled = false;
    }
}

function openDeleteModal(id) {
    const expense = state.expenses.find(e => e.id === id);
    if (!expense) return;

    state.deleteTarget = expense;
    elements.deletePreviewTitle.textContent = expense.title;
    elements.deletePreviewCategory.textContent = expense.category;
    elements.deletePreviewCategory.className = `badge ${getCategoryBadgeClass(expense.category)}`;
    elements.deletePreviewDate.textContent = formatDate(expense.date);
    elements.deletePreviewAmount.textContent = formatCurrency(expense.amount);

    elements.deleteConfirmModal.classList.remove('hidden');
    refreshIcons();
}

function closeDeleteModal() {
    elements.deleteConfirmModal.classList.add('hidden');
    state.deleteTarget = null;
}

async function handleConfirmDelete() {
    if (!state.deleteTarget) return;
    const id = state.deleteTarget.id;
    const title = state.deleteTarget.title;

    try {
        const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showToast('Expense Deleted', `"${title}" was removed.`, 'info');
            closeDeleteModal();
            await loadDashboardData();
        } else {
            showToast('Error', result.message || 'Could not delete expense.', 'error');
        }
    } catch (err) {
        console.error('Failed to delete expense:', err);
        showToast('Error', 'Network error while deleting expense.', 'error');
    }
}

function closeAllModals() {
    closeAddModal();
    closeEditModal();
    closeDeleteModal();
}

// Global modal triggers for HTML onclicks
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.viewReceipt = viewReceipt;

// Form Validation Helpers
function setFieldError(fieldPrefix, message) {
    const input = document.getElementById(fieldPrefix);
    const errorSpan = document.getElementById(`${fieldPrefix}Error`);
    if (input) input.classList.add('is-invalid');
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.add('active');
    }
}

function clearFormErrors(form) {
    form.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        input.classList.remove('is-invalid');
    });
    form.querySelectorAll('.field-error').forEach(span => {
        span.textContent = '';
        span.classList.remove('active');
    });
}

// ==========================================================================
// Toast Notification Engine
// ==========================================================================

function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${iconName}" class="toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
        </div>
        <button class="toast-close-btn" aria-label="Dismiss toast">
            <i data-lucide="x"></i>
        </button>
        <div class="toast-progress"></div>
    `;

    // Close button event
    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => removeToast(toast));

    elements.toastContainer.appendChild(toast);
    refreshIcons();

    // Auto dismiss after 3.8s
    setTimeout(() => {
        removeToast(toast);
    }, 3800);
}

function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
}

// ==========================================================================
// CSV Export Feature
// ==========================================================================

function exportExpensesToCSV() {
    if (!state.expenses || state.expenses.length === 0) {
        showToast('Export Notice', 'No expenses available to export.', 'info');
        return;
    }

    const headers = ['ID', 'Date', 'Title', 'Category', 'Amount ($)', 'Notes', 'Created At'];
    const rows = state.expenses.map(e => [
        e.id,
        `"${e.date}"`,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${(e.category || '').replace(/"/g, '""')}"`,
        e.amount.toFixed(2),
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${e.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `spendwise_expenses_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Successful', `Exported ${state.expenses.length} transaction records to CSV.`, 'success');
}

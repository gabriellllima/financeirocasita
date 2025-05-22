// Estrutura de dados principal
let userData = {};
let currentUser = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar dados do localStorage
    loadData();
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar interface
    initializeInterface();
});

// Carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem('controleFinanceiro');
    if (savedData) {
        userData = JSON.parse(savedData);
    }
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('controleFinanceiro', JSON.stringify(userData));
}

// Configurar event listeners
function setupEventListeners() {
    // Eventos de usuário
    document.getElementById('switch-user').addEventListener('click', showUserSelection);
    document.getElementById('create-user').addEventListener('click', createUser);
    document.getElementById('cancel-user').addEventListener('click', cancelUserCreation);
    
    // Eventos de formulário de transação
    document.getElementById('form').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('type').addEventListener('change', handleTransactionTypeChange);
    document.getElementById('is-recurring').addEventListener('change', toggleRecurringOptions);
    
    // Eventos de formulário de conta
    document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);
    
    // Eventos de formulário de meta
    document.getElementById('goal-form').addEventListener('submit', handleGoalSubmit);
    
    // Eventos de filtros
    document.getElementById('filter-type').addEventListener('change', filterTransactions);
    document.getElementById('filter-category').addEventListener('change', filterTransactions);
    document.getElementById('filter-account').addEventListener('change', filterTransactions);
    document.getElementById('filter-status').addEventListener('change', filterTransactions);
    document.getElementById('search').addEventListener('input', filterTransactions);
    
    // Eventos de relatórios
    document.getElementById('report-period').addEventListener('change', toggleCustomPeriod);
    document.getElementById('generate-report').addEventListener('click', generateReport);
    
    // Eventos de backup
    document.getElementById('backup-btn').addEventListener('click', toggleBackupOptions);
    document.getElementById('google-drive').addEventListener('click', backupToGoogleDrive);
    document.getElementById('onedrive').addEventListener('click', backupToOneDrive);
    document.getElementById('download-backup').addEventListener('click', downloadBackup);
    document.getElementById('restore-backup').addEventListener('click', restoreBackup);
    
    // Eventos de abas
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Inicializar interface
function initializeInterface() {
    // Inicializar a data atual nos campos de data
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('due-date').value = today;
    
    // Verificar se há usuários cadastrados
    if (Object.keys(userData).length === 0) {
        showNewUserForm();
    } else {
        showUserSelection();
    }
}

// Mostrar seleção de usuário
function showUserSelection() {
    document.getElementById('user-selection').classList.remove('hidden');
    document.getElementById('new-user-form').classList.add('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
    
    renderUsersList();
}

// Mostrar formulário de novo usuário
function showNewUserForm() {
    document.getElementById('user-selection').classList.add('hidden');
    document.getElementById('new-user-form').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
    
    // Limpar formulário
    document.getElementById('user-name').value = '';
    document.getElementById('user-color').value = '#3498db';
}

// Cancelar criação de usuário
function cancelUserCreation() {
    if (Object.keys(userData).length === 0) {
        showNewUserForm();
    } else {
        showUserSelection();
    }
}

// Criar novo usuário
function createUser() {
    const name = document.getElementById('user-name').value.trim();
    const color = document.getElementById('user-color').value;
    
    if (!name) {
        alert('Por favor, digite um nome para o usuário.');
        return;
    }
    
    // Gerar ID único para o usuário
    const userId = 'user_' + Date.now();
    
    // Criar estrutura de dados para o usuário
    userData[userId] = {
        name: name,
        color: color,
        createdAt: new Date().toISOString(),
        accounts: {},
        transactions: [],
        recurringTransactions: [],
        goals: []
    };
    
    // Salvar dados
    saveData();
    
    // Selecionar o usuário recém-criado
    selectUser(userId);
}

// Renderizar lista de usuários
function renderUsersList() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    // Adicionar cada usuário à lista
    for (const userId in userData) {
        const user = userData[userId];
        
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <div class="user-avatar" style="background-color: ${user.color}">
                ${getInitials(user.name)}
            </div>
            <div class="user-details">
                <h3>${user.name}</h3>
                <p>Criado em ${formatDate(new Date(user.createdAt))}</p>
            </div>
        `;
        
        userElement.addEventListener('click', () => selectUser(userId));
        
        usersList.appendChild(userElement);
    }
    
    // Adicionar botão para criar novo usuário
    const newUserButton = document.createElement('div');
    newUserButton.className = 'user-item new-user';
    newUserButton.innerHTML = `
        <div class="user-avatar">
            <span>+</span>
        </div>
        <div class="user-details">
            <h3>Novo Usuário</h3>
        </div>
    `;
    
    newUserButton.addEventListener('click', showNewUserForm);
    
    usersList.appendChild(newUserButton);
}

// Selecionar usuário
function selectUser(userId) {
    currentUser = userId;
    
    // Atualizar interface
    document.getElementById('user-selection').classList.add('hidden');
    document.getElementById('new-user-form').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    
    // Atualizar informações do usuário
    document.getElementById('current-user').textContent = userData[userId].name;
    
    // Inicializar contas
    populateAccountsDropdown();
    renderAccountsList();
    
    // Inicializar transações
    renderTransactionsList();
    renderPendingList();
    
    // Inicializar recorrências
    renderRecurringList();
    
    // Inicializar metas
    renderGoalsList();
    
    // Atualizar saldos
    updateBalanceSummary();
    
    // Verificar e gerar transações recorrentes
    checkAndGenerateRecurringTransactions();
}

// Obter iniciais do nome
function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
}

// Formatar data
function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

// Formatar valor monetário
function formatCurrency(value) {
    return parseFloat(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// Alternar entre abas
function switchTab(tabId) {
    // Remover classe active de todas as abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adicionar classe active à aba selecionada
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Manipular mudança de tipo de transação
function handleTransactionTypeChange() {
    const type = document.getElementById('type').value;
    const transferFields = document.getElementById('transfer-fields');
    
    if (type === 'transferencia') {
        transferFields.classList.remove('hidden');
        populateToAccountsDropdown();
    } else {
        transferFields.classList.add('hidden');
    }
}

// Alternar opções de recorrência
function toggleRecurringOptions() {
    const isRecurring = document.getElementById('is-recurring').checked;
    const recurringOptions = document.getElementById('recurring-options');
    
    if (isRecurring) {
        recurringOptions.classList.remove('hidden');
    } else {
        recurringOptions.classList.add('hidden');
    }
}

// Alternar período personalizado
function toggleCustomPeriod() {
    const period = document.getElementById('report-period').value;
    const customPeriod = document.getElementById('custom-period');
    
    if (period === 'custom') {
        customPeriod.classList.remove('hidden');
    } else {
        customPeriod.classList.add('hidden');
    }
}

// Alternar opções de backup
function toggleBackupOptions() {
    const backupOptions = document.getElementById('backup-options');
    backupOptions.classList.toggle('hidden');
}

// Preencher dropdown de contas
function populateAccountsDropdown() {
    const accountSelect = document.getElementById('account');
    const filterAccountSelect = document.getElementById('filter-account');
    
    // Limpar opções atuais
    accountSelect.innerHTML = '<option value="" disabled selected>Selecione uma conta</option>';
    filterAccountSelect.innerHTML = '<option value="todos">Todas</option>';
    
    // Adicionar contas do usuário atual
    const accounts = userData[currentUser].accounts;
    for (const accountId in accounts) {
        const account = accounts[accountId];
        
        const option = document.createElement('option');
        option.value = accountId;
        option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
        
        const filterOption = option.cloneNode(true);
        
        accountSelect.appendChild(option);
        filterAccountSelect.appendChild(filterOption);
    }
}

// Preencher dropdown de contas de destino
function populateToAccountsDropdown() {
    const fromAccountId = document.getElementById('account').value;
    const toAccountSelect = document.getElementById('to-account');
    
    // Limpar opções atuais
    toAccountSelect.innerHTML = '<option value="" disabled selected>Selecione uma conta</option>';
    
    // Adicionar contas do usuário atual (exceto a conta de origem)
    const accounts = userData[currentUser].accounts;
    for (const accountId in accounts) {
        if (accountId !== fromAccountId) {
            const account = accounts[accountId];
            
            const option = document.createElement('option');
            option.value = accountId;
            option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
            
            toAccountSelect.appendChild(option);
        }
    }
}

// Manipular envio do formulário de transação
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const accountId = document.getElementById('account').value;
    const date = document.getElementById('date').value;
    const dueDate = document.getElementById('due-date').value;
    const status = document.getElementById('status').value;
    const category = document.getElementById('category').value;
    const type = document.getElementById('type').value;
    
    // Validar campos
    if (!description || isNaN(amount) || amount <= 0 || !accountId || !date || !category) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Verificar se é uma transação recorrente
    const isRecurring = document.getElementById('is-recurring').checked;
    
    if (isRecurring) {
        // Adicionar transação recorrente
        const frequency = document.getElementById('frequency').value;
        const endDate = document.getElementById('end-date').value;
        
        addRecurringTransaction({
            description,
            amount,
            accountId,
            startDate: date,
            dueDate,
            status,
            category,
            type,
            frequency,
            endDate
        });
    } else {
        // Adicionar transação normal
        if (type === 'transferencia') {
            const toAccountId = document.getElementById('to-account').value;
            
            if (!toAccountId) {
                alert('Por favor, selecione uma conta de destino para a transferência.');
                return;
            }
            
            addTransfer(accountId, toAccountId, amount, description, date);
        } else {
            addTransaction({
                description,
                amount,
                accountId,
                date,
                dueDate,
                status,
                category,
                type
            });
        }
    }
    
    // Limpar formulário
    document.getElementById('form').reset();
    
    // Reinicializar data atual
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    document.getElementById('due-date').value = today;
    
    // Atualizar interface
    renderTransactionsList();
    renderPendingList();
    renderRecurringList();
    updateBalanceSummary();
}

// Adicionar transação
function addTransaction(transaction) {
    // Gerar ID único para a transação
    const transactionId = 'transaction_' + Date.now();
    
    // Criar objeto de transação
    const newTransaction = {
        id: transactionId,
        description: transaction.description,
        amount: transaction.amount,
        accountId: transaction.accountId,
        date: transaction.date,
        dueDate: transaction.dueDate || transaction.date,
        status: transaction.status,
        category: transaction.category,
        type: transaction.type,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista de transações do usuário
    userData[currentUser].transactions.push(newTransaction);
    
    // Atualizar saldo da conta se a transação for paga/recebida
    if (transaction.status === 'pago') {
        updateAccountBalance(transaction.accountId, transaction.type, transaction.amount);
    }
    
    // Salvar dados
    saveData();
}

// Adicionar transferência
function addTransfer(fromAccountId, toAccountId, amount, description, date) {
    // Gerar IDs únicos para as transações
    const withdrawalId = 'transaction_' + Date.now();
    const depositId = 'transaction_' + (Date.now() + 1);
    
    // Criar objeto de transação de saída
    const withdrawal = {
        id: withdrawalId,
        description: `${description} (Transferência para ${userData[currentUser].accounts[toAccountId].name})`,
        amount: amount,
        accountId: fromAccountId,
        date: date,
        dueDate: date,
        status: 'pago',
        category: 'transferencia',
        type: 'despesa',
        createdAt: new Date().toISOString(),
        relatedTransactionId: depositId
    };
    
    // Criar objeto de transação de entrada
    const deposit = {
        id: depositId,
        description: `${description} (Transferência de ${userData[currentUser].accounts[fromAccountId].name})`,
        amount: amount,
        accountId: toAccountId,
        date: date,
        dueDate: date,
        status: 'pago',
        category: 'transferencia',
        type: 'receita',
        createdAt: new Date().toISOString(),
        relatedTransactionId: withdrawalId
    };
    
    // Adicionar às transações do usuário
    userData[currentUser].transactions.push(withdrawal);
    userData[currentUser].transactions.push(deposit);
    
    // Atualizar saldos das contas
    updateAccountBalance(fromAccountId, 'despesa', amount);
    updateAccountBalance(toAccountId, 'receita', amount);
    
    // Salvar dados
    saveData();
}

// Adicionar transação recorrente
function addRecurringTransaction(transaction) {
    // Gerar ID único para a transação recorrente
    const recurringId = 'recurring_' + Date.now();
    
    // Criar objeto de transação recorrente
    const newRecurring = {
        id: recurringId,
        description: transaction.description,
        amount: transaction.amount,
        accountId: transaction.accountId,
        startDate: transaction.startDate,
        dueDate: transaction.dueDate || transaction.startDate,
        status: transaction.status,
        category: transaction.category,
        type: transaction.type,
        frequency: transaction.frequency,
        endDate: transaction.endDate || null,
        lastGenerated: null,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista de transações recorrentes do usuário
    userData[currentUser].recurringTransactions.push(newRecurring);
    
    // Gerar primeira ocorrência
    generateRecurringTransaction(newRecurring);
    
    // Salvar dados
    saveData();
}

// Verificar e gerar transações recorrentes
function checkAndGenerateRecurringTransactions() {
    const today = new Date();
    const recurringTransactions = userData[currentUser].recurringTransactions;
    
    recurringTransactions.forEach(recurring => {
        // Verificar se já passou da data de término
        if (recurring.endDate && new Date(recurring.endDate) < today) {
            return;
        }
        
        // Verificar se precisa gerar novas transações
        const lastGenerated = recurring.lastGenerated ? new Date(recurring.lastGenerated) : null;
        const startDate = new Date(recurring.startDate);
        
        if (!lastGenerated && startDate <= today) {
            // Primeira geração
            generateRecurringTransaction(recurring);
        } else if (lastGenerated) {
            // Verificar se é hora de gerar a próxima ocorrência
            const nextDate = getNextOccurrenceDate(lastGenerated, recurring.frequency);
            
            if (nextDate <= today) {
                generateRecurringTransaction(recurring);
            }
        }
    });
    
    // Salvar dados
    saveData();
}

// Gerar transação a partir de recorrência
function generateRecurringTransaction(recurring) {
    const lastGenerated = recurring.lastGenerated ? new Date(recurring.lastGenerated) : null;
    const startDate = new Date(recurring.startDate);
    
    // Determinar a data da próxima ocorrência
    let transactionDate;
    if (!lastGenerated) {
        transactionDate = startDate;
    } else {
        transactionDate = getNextOccurrenceDate(lastGenerated, recurring.frequency);
    }
    
    // Verificar se já passou da data de término
    if (recurring.endDate && new Date(recurring.endDate) < transactionDate) {
        return;
    }
    
    // Calcular data de vencimento
    const daysUntilDue = recurring.dueDate 
        ? (new Date(recurring.dueDate) - new Date(recurring.startDate)) / (1000 * 60 * 60 * 24)
        : 0;
    
    const dueDate = new Date(transactionDate);
    dueDate.setDate(dueDate.getDate() + daysUntilDue);
    
    // Criar transação
    addTransaction({
        description: `${recurring.description} (Recorrente)`,
        amount: recurring.amount,
        accountId: recurring.accountId,
        date: transactionDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: recurring.status,
        category: recurring.category,
        type: recurring.type
    });
    
    // Atualizar data da última geração
    recurring.lastGenerated = transactionDate.toISOString().split('T')[0];
}

// Obter data da próxima ocorrência
function getNextOccurrenceDate(lastDate, frequency) {
    const date = new Date(lastDate);
    
    switch (frequency) {
        case 'semanal':
            date.setDate(date.getDate() + 7);
            break;
        case 'quinzenal':
            date.setDate(date.getDate() + 15);
            break;
        case 'mensal':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'anual':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }
    
    return date;
}

// Atualizar saldo da conta
function updateAccountBalance(accountId, type, amount) {
    const account = userData[currentUser].accounts[accountId];
    
    if (type === 'receita') {
        account.balance += amount;
    } else if (type === 'despesa') {
        account.balance -= amount;
    }
}

// Manipular envio do formulário de conta
function handleAccountSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('account-name').value;
    const type = document.getElementById('account-type').value;
    const initialBalance = parseFloat(document.getElementById('initial-balance').value);
    
    // Validar campos
    if (!name || !type || isNaN(initialBalance)) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Gerar ID único para a conta
    const accountId = 'account_' + Date.now();
    
    // Criar objeto de conta
    const newAccount = {
        id: accountId,
        name: name,
        type: type,
        balance: initialBalance,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista de contas do usuário
    userData[currentUser].accounts[accountId] = newAccount;
    
    // Adicionar transação inicial se o saldo for diferente de zero
    if (initialBalance !== 0) {
        addTransaction({
            description: 'Saldo Inicial',
            amount: initialBalance,
            accountId: accountId,
            date: new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pago',
            category: 'outros',
            type: 'receita'
        });
    }
    
    // Salvar dados
    saveData();
    
    // Limpar formulário
    document.getElementById('account-form').reset();
    
    // Atualizar interface
    renderAccountsList();
    populateAccountsDropdown();
    updateBalanceSummary();
}

// Manipular envio do formulário de meta
function handleGoalSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('goal-name').value;
    const amount = parseFloat(document.getElementById('goal-amount').value);
    const date = document.getElementById('goal-date').value;
    const current = parseFloat(document.getElementById('goal-current').value) || 0;
    
    // Validar campos
    if (!name || isNaN(amount) || amount <= 0 || !date) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Gerar ID único para a meta
    const goalId = 'goal_' + Date.now();
    
    // Criar objeto de meta
    const newGoal = {
        id: goalId,
        name: name,
        amount: amount,
        date: date,
        current: current,
        createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista de metas do usuário
    userData[currentUser].goals.push(newGoal);
    
    // Salvar dados
    saveData();
    
    // Limpar formulário
    document.getElementById('goal-form').reset();
    
    // Atualizar interface
    renderGoalsList();
}

// Renderizar lista de transações
function renderTransactionsList() {
    const transactionsList = document.getElementById('transactions-list');
    transactionsList.innerHTML = '';
    
    // Obter transações filtradas
    const filteredTransactions = getFilteredTransactions();
    
    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = '<p class="empty-list">Nenhuma transação encontrada.</p>';
        return;
    }
    
    // Ordenar transações por data (mais recentes primeiro)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Agrupar transações por mês
    const groupedTransactions = groupTransactionsByMonth(filteredTransactions);
    
    // Renderizar cada grupo
    for (const month in groupedTransactions) {
        const monthTransactions = groupedTransactions[month];
        
        // Criar cabeçalho do mês
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = month;
        
        transactionsList.appendChild(monthHeader);
        
        // Renderizar transações do mês
        monthTransactions.forEach(transaction => {
            const transactionElement = createTransactionElement(transaction);
            transactionsList.appendChild(transactionElement);
        });
    }
}

// Renderizar lista de despesas pendentes
function renderPendingList() {
    const pendingList = document.getElementById('pending-list');
    pendingList.innerHTML = '';
    
    // Filtrar apenas despesas pendentes
    const pendingTransactions = userData[currentUser].transactions.filter(
        transaction => transaction.status === 'pendente' && transaction.type === 'despesa'
    );
    
    if (pendingTransactions.length === 0) {
        pendingList.innerHTML = '<p class="empty-list">Nenhuma despesa pendente.</p>';
        return;
    }
    
    // Ordenar por data de vencimento (mais próximas primeiro)
    pendingTransactions.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Renderizar cada despesa pendente
    pendingTransactions.forEach(transaction => {
        const transactionElement = createTransactionElement(transaction, true);
        pendingList.appendChild(transactionElement);
    });
}

// Renderizar lista de transações recorrentes
function renderRecurringList() {
    const recurringList = document.getElementById('recurring-list');
    recurringList.innerHTML = '';
    
    const recurringTransactions = userData[currentUser].recurringTransactions;
    
    if (recurringTransactions.length === 0) {
        recurringList.innerHTML = '<p class="empty-list">Nenhuma transação recorrente.</p>';
        return;
    }
    
    // Ordenar por data de início (mais recentes primeiro)
    recurringTransactions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    
    // Renderizar cada transação recorrente
    recurringTransactions.forEach(recurring => {
        const recurringElement = createRecurringElement(recurring);
        recurringList.appendChild(recurringElement);
    });
}

// Renderizar lista de contas
function renderAccountsList() {
    const accountsList = document.getElementById('accounts-list');
    accountsList.innerHTML = '';
    
    const accounts = userData[currentUser].accounts;
    
    if (Object.keys(accounts).length === 0) {
        accountsList.innerHTML = '<p class="empty-list">Nenhuma conta cadastrada.</p>';
        return;
    }
    
    // Calcular saldo total
    let totalBalance = 0;
    
    // Renderizar cada conta
    for (const accountId in accounts) {
        const account = accounts[accountId];
        totalBalance += account.balance;
        
        const accountElement = createAccountElement(account);
        accountsList.appendChild(accountElement);
    }
    
    // Adicionar saldo total
    const totalElement = document.createElement('div');
    totalElement.className = 'account-item total';
    totalElement.innerHTML = `
        <div class="account-details">
            <h3>Saldo Total</h3>
        </div>
        <div class="account-balance ${totalBalance >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(totalBalance)}
        </div>
    `;
    
    accountsList.appendChild(totalElement);
}

// Renderizar lista de metas
function renderGoalsList() {
    const goalsList = document.getElementById('goals-list');
    goalsList.innerHTML = '';
    
    const goals = userData[currentUser].goals;
    
    if (goals.length === 0) {
        goalsList.innerHTML = '<p class="empty-list">Nenhuma meta cadastrada.</p>';
        return;
    }
    
    // Ordenar por data alvo (mais próximas primeiro)
    goals.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Renderizar cada meta
    goals.forEach(goal => {
        const goalElement = createGoalElement(goal);
        goalsList.appendChild(goalElement);
    });
}

// Criar elemento de transação
function createTransactionElement(transaction, isPending = false) {
    const transactionElement = document.createElement('div');
    transactionElement.className = `transaction-item ${transaction.type}`;
    
    // Verificar se está vencida
    const isOverdue = transaction.status === 'pendente' && 
                     new Date(transaction.dueDate) < new Date() &&
                     transaction.type === 'despesa';
    
    if (isOverdue) {
        transactionElement.classList.add('overdue');
    }
    
    // Obter nome da conta
    const accountName = userData[currentUser].accounts[transaction.accountId]?.name || 'Conta Desconhecida';
    
    transactionElement.innerHTML = `
        <div class="transaction-info">
            <h4>${transaction.description}</h4>
            <p>
                <span class="category">${getCategoryName(transaction.category)}</span> | 
                <span class="account">${accountName}</span> | 
                <span class="date">${formatDate(new Date(transaction.date))}</span>
                ${transaction.dueDate !== transaction.date ? 
                    `| <span class="due-date">Vence em: ${formatDate(new Date(transaction.dueDate))}</span>` : ''}
            </p>
        </div>
        <div class="transaction-amount ${transaction.type === 'receita' ? 'positive' : 'negative'}">
            ${transaction.type === 'receita' ? '+' : '-'} ${formatCurrency(transaction.amount)}
        </div>
        <div class="transaction-actions">
            ${isPending ? `
                <button class="btn btn-small" onclick="validatePayment('${transaction.id}')">Validar</button>
            ` : ''}
            <button class="btn btn-small" onclick="editTransaction('${transaction.id}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="deleteTransaction('${transaction.id}')">Excluir</button>
        </div>
    `;
    
    return transactionElement;
}

// Criar elemento de transação recorrente
function createRecurringElement(recurring) {
    const recurringElement = document.createElement('div');
    recurringElement.className = `recurring-item ${recurring.type}`;
    
    // Obter nome da conta
    const accountName = userData[currentUser].accounts[recurring.accountId]?.name || 'Conta Desconhecida';
    
    // Calcular próxima ocorrência
    const nextDate = recurring.lastGenerated ? 
        getNextOccurrenceDate(new Date(recurring.lastGenerated), recurring.frequency) : 
        new Date(recurring.startDate);
    
    recurringElement.innerHTML = `
        <div class="recurring-info">
            <h4>${recurring.description}</h4>
            <p>
                <span class="category">${getCategoryName(recurring.category)}</span> | 
                <span class="account">${accountName}</span> | 
                <span class="frequency">${getFrequencyName(recurring.frequency)}</span>
            </p>
            <p>
                <span class="date">Início: ${formatDate(new Date(recurring.startDate))}</span>
                ${recurring.endDate ? 
                    `| <span class="end-date">Fim: ${formatDate(new Date(recurring.endDate))}</span>` : 
                    '| <span class="end-date">Sem data final</span>'}
            </p>
            <p>
                <span class="next-date">Próxima ocorrência: ${formatDate(nextDate)}</span>
            </p>
        </div>
        <div class="recurring-amount ${recurring.type === 'receita' ? 'positive' : 'negative'}">
            ${recurring.type === 'receita' ? '+' : '-'} ${formatCurrency(recurring.amount)}
        </div>
        <div class="recurring-actions">
            <button class="btn btn-small" onclick="editRecurring('${recurring.id}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="deleteRecurring('${recurring.id}')">Excluir</button>
        </div>
    `;
    
    return recurringElement;
}

// Criar elemento de conta
function createAccountElement(account) {
    const accountElement = document.createElement('div');
    accountElement.className = 'account-item';
    
    accountElement.innerHTML = `
        <div class="account-details">
            <h3>${account.name}</h3>
            <p>${getAccountTypeName(account.type)}</p>
        </div>
        <div class="account-balance ${account.balance >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(account.balance)}
        </div>
        <div class="account-actions">
            <button class="btn btn-small" onclick="editAccount('${account.id}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="deleteAccount('${account.id}')">Excluir</button>
        </div>
    `;
    
    return accountElement;
}

// Criar elemento de meta
function createGoalElement(goal) {
    const goalElement = document.createElement('div');
    goalElement.className = 'goal-item';
    
    // Calcular progresso
    const progress = (goal.current / goal.amount) * 100;
    const formattedProgress = Math.min(100, Math.max(0, progress)).toFixed(1);
    
    // Calcular dias restantes
    const today = new Date();
    const targetDate = new Date(goal.date);
    const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    
    goalElement.innerHTML = `
        <div class="goal-info">
            <h3>${goal.name}</h3>
            <p>
                <span class="goal-target">Meta: ${formatCurrency(goal.amount)}</span> | 
                <span class="goal-date">Data: ${formatDate(targetDate)}</span>
                ${daysRemaining > 0 ? 
                    `| <span class="days-remaining">${daysRemaining} dias restantes</span>` : 
                    '| <span class="days-remaining expired">Meta vencida</span>'}
            </p>
            <div class="goal-progress-container">
                <div class="goal-progress-bar" style="width: ${formattedProgress}%"></div>
                <span class="goal-progress-text">${formattedProgress}% (${formatCurrency(goal.current)})</span>
            </div>
        </div>
        <div class="goal-actions">
            <button class="btn btn-small" onclick="updateGoalProgress('${goal.id}')">Atualizar</button>
            <button class="btn btn-small" onclick="editGoal('${goal.id}')">Editar</button>
            <button class="btn btn-small btn-danger" onclick="deleteGoal('${goal.id}')">Excluir</button>
        </div>
    `;
    
    return goalElement;
}

// Obter transações filtradas
function getFilteredTransactions() {
    const transactions = userData[currentUser].transactions;
    const typeFilter = document.getElementById('filter-type').value;
    const categoryFilter = document.getElementById('filter-category').value;
    const accountFilter = document.getElementById('filter-account').value;
    const statusFilter = document.getElementById('filter-status').value;
    const searchTerm = document.getElementById('search').value.toLowerCase();
    
    return transactions.filter(transaction => {
        // Filtrar por tipo
        if (typeFilter !== 'todos' && transaction.type !== typeFilter) {
            return false;
        }
        
        // Filtrar por categoria
        if (categoryFilter !== 'todos' && transaction.category !== categoryFilter) {
            return false;
        }
        
        // Filtrar por conta
        if (accountFilter !== 'todos' && transaction.accountId !== accountFilter) {
            return false;
        }
        
        // Filtrar por status
        if (statusFilter !== 'todos' && transaction.status !== statusFilter) {
            return false;
        }
        
        // Filtrar por termo de busca
        if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });
}

// Filtrar transações
function filterTransactions() {
    renderTransactionsList();
}

// Agrupar transações por mês
function groupTransactionsByMonth(transactions) {
    const grouped = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const month = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        if (!grouped[month]) {
            grouped[month] = [];
        }
        
        grouped[month].push(transaction);
    });
    
    return grouped;
}

// Atualizar resumo de saldo
function updateBalanceSummary() {
    let totalBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    
    // Calcular saldos
    for (const accountId in userData[currentUser].accounts) {
        const account = userData[currentUser].accounts[accountId];
        totalBalance += account.balance;
    }
    
    // Calcular receitas e despesas (apenas transações pagas)
    userData[currentUser].transactions.forEach(transaction => {
        if (transaction.status === 'pago') {
            if (transaction.type === 'receita') {
                totalIncome += transaction.amount;
            } else if (transaction.type === 'despesa') {
                totalExpense += transaction.amount;
            }
        }
    });
    
    // Atualizar interface
    document.getElementById('balance').textContent = formatCurrency(totalBalance);
    document.getElementById('income-total').textContent = formatCurrency(totalIncome);
    document.getElementById('expense-total').textContent = formatCurrency(totalExpense);
    
    // Atualizar classe do saldo (positivo/negativo)
    document.getElementById('balance').className = 'balance ' + (totalBalance >= 0 ? 'positive' : 'negative');
}

// Gerar relatório
function generateReport() {
    const period = document.getElementById('report-period').value;
    let startDate, endDate;
    
    // Determinar período do relatório
    if (period === 'custom') {
        startDate = document.getElementById('report-start').value;
        endDate = document.getElementById('report-end').value;
        
        if (!startDate || !endDate) {
            alert('Por favor, selecione as datas de início e fim para o relatório personalizado.');
            return;
        }
        
        startDate = new Date(startDate);
        endDate = new Date(endDate);
    } else {
        const today = new Date();
        
        switch (period) {
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1);
                endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                break;
        }
    }
    
    // Filtrar transações do período (apenas pagas)
    const transactions = userData[currentUser].transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transaction.status === 'pago' && 
               transactionDate >= startDate && 
               transactionDate <= endDate;
    });
    
    // Calcular totais
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'receita') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'despesa') {
            totalExpense += transaction.amount;
        }
    });
    
    const balance = totalIncome - totalExpense;
    
    // Gerar resumo
    const summaryElement = document.getElementById('report-summary');
    summaryElement.innerHTML = `
        <div class="summary-item">
            <h4>Período</h4>
            <p>${formatDate(startDate)} a ${formatDate(endDate)}</p>
        </div>
        <div class="summary-item">
            <h4>Receitas</h4>
            <p class="positive">${formatCurrency(totalIncome)}</p>
        </div>
        <div class="summary-item">
            <h4>Despesas</h4>
            <p class="negative">${formatCurrency(totalExpense)}</p>
        </div>
        <div class="summary-item">
            <h4>Saldo</h4>
            <p class="${balance >= 0 ? 'positive' : 'negative'}">${formatCurrency(balance)}</p>
        </div>
    `;
    
    // Gerar gráfico de categorias
    generateCategoryChart(transactions);
    
    // Gerar gráfico de evolução mensal
    generateMonthlyChart(startDate, endDate);
}

// Gerar gráfico de categorias
function generateCategoryChart(transactions) {
    // Filtrar apenas despesas
    const expenses = transactions.filter(transaction => transaction.type === 'despesa');
    
    // Agrupar por categoria
    const categories = {};
    
    expenses.forEach(expense => {
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }
        
        categories[expense.category] += expense.amount;
    });
    
    // Preparar dados para o gráfico
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    for (const category in categories) {
        labels.push(getCategoryName(category));
        data.push(categories[category]);
        backgroundColors.push(getCategoryColor(category));
    }
    
    // Criar gráfico
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    window.categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Gerar gráfico de evolução mensal
function generateMonthlyChart(startDate, endDate) {
    // Determinar meses no intervalo
    const months = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        months.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Preparar dados para o gráfico
    const labels = months.map(date => 
        date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    );
    
    const incomeData = [];
    const expenseData = [];
    
    months.forEach(month => {
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        let monthIncome = 0;
        let monthExpense = 0;
        
        userData[currentUser].transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            
            if (transaction.status === 'pago' && 
                transactionDate >= monthStart && 
                transactionDate <= monthEnd) {
                
                if (transaction.type === 'receita') {
                    monthIncome += transaction.amount;
                } else if (transaction.type === 'despesa') {
                    monthExpense += transaction.amount;
                }
            }
        });
        
        incomeData.push(monthIncome);
        expenseData.push(monthExpense);
    });
    
    // Criar gráfico
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.monthlyChart) {
        window.monthlyChart.destroy();
    }
    
    window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

// Backup para Google Drive
function backupToGoogleDrive() {
    alert('Funcionalidade de backup para Google Drive em desenvolvimento.');
    // Implementação futura
}

// Backup para OneDrive
function backupToOneDrive() {
    alert('Funcionalidade de backup para OneDrive em desenvolvimento.');
    // Implementação futura
}

// Download de backup local
function downloadBackup() {
    const data = JSON.stringify(userData);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-financeiro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Restaurar backup
function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        
        if (!file) {
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (!data || typeof data !== 'object') {
                    throw new Error('Formato de arquivo inválido.');
                }
                
                // Confirmar restauração
                if (confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
                    userData = data;
                    saveData();
                    
                    // Reiniciar aplicação
                    showUserSelection();
                    
                    alert('Backup restaurado com sucesso!');
                }
            } catch (error) {
                alert('Erro ao restaurar backup: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Validar pagamento de despesa pendente
function validatePayment(transactionId) {
    const transaction = userData[currentUser].transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        return;
    }
    
    // Atualizar status
    transaction.status = 'pago';
    
    // Atualizar saldo da conta
    updateAccountBalance(transaction.accountId, transaction.type, transaction.amount);
    
    // Salvar dados
    saveData();
    
    // Atualizar interface
    renderTransactionsList();
    renderPendingList();
    updateBalanceSummary();
}

// Editar transação
function editTransaction(transactionId) {
    alert('Funcionalidade de edição de transação em desenvolvimento.');
    // Implementação futura
}

// Excluir transação
function deleteTransaction(transactionId) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
        return;
    }
    
    const transactionIndex = userData[currentUser].transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex === -1) {
        return;
    }
    
    const transaction = userData[currentUser].transactions[transactionIndex];
    
    // Verificar se é uma transferência
    if (transaction.relatedTransactionId) {
        // Encontrar e remover a transação relacionada
        const relatedIndex = userData[currentUser].transactions.findIndex(
            t => t.id === transaction.relatedTransactionId
        );
        
        if (relatedIndex !== -1) {
            const relatedTransaction = userData[currentUser].transactions[relatedIndex];
            
            // Reverter o saldo da conta relacionada
            if (relatedTransaction.status === 'pago') {
                updateAccountBalance(
                    relatedTransaction.accountId,
                    relatedTransaction.type === 'receita' ? 'despesa' : 'receita',
                    relatedTransaction.amount
                );
            }
            
            // Remover a transação relacionada
            userData[currentUser].transactions.splice(relatedIndex, 1);
        }
    }
    
    // Reverter o saldo da conta se a transação estiver paga
    if (transaction.status === 'pago') {
        updateAccountBalance(
            transaction.accountId,
            transaction.type === 'receita' ? 'despesa' : 'receita',
            transaction.amount
        );
    }
    
    // Remover a transação
    userData[currentUser].transactions.splice(transactionIndex, 1);
    
    // Salvar dados
    saveData();
    
    // Atualizar interface
    renderTransactionsList();
    renderPendingList();
    updateBalanceSummary();
}

// Editar transação recorrente
function editRecurring(recurringId) {
    alert('Funcionalidade de edição de transação recorrente em desenvolvimento.');
    // Implementação futura
}

// Excluir transação recorrente
function deleteRecurring(recurringId) {
    if (!confirm('Tem certeza que deseja excluir esta transação recorrente?')) {
        return;
    }
    
    const recurringIndex = userData[currentUser].recurringTransactions.findIndex(r => r.id === recurringId);
    
    if (recurringIndex === -1) {
        return;
    }
    
    // Remover a transação recorrente
    userData[currentUser].recurringTransactions.splice(recurringIndex, 1);
    
    // Salvar dados
    saveData();
    
    // Atualizar interface
    renderRecurringList();
}

// Editar conta
function editAccount(accountId) {
    alert('Funcionalidade de edição de conta em desenvolvimento.');
    // Implementação futura
}

// Excluir conta
function deleteAccount(accountId) {
    // Verificar se há transações associadas a esta conta
    const hasTransactions = userData[currentUser].transactions.some(t => t.accountId === accountId);
    
    if (hasTransactions) {
        alert('Não é possível excluir esta conta pois existem transações associadas a ela.');
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta conta?')) {
        return;
    }
    
    // Remover a conta
    delete userData[currentUser].accounts[accountId];
    
    // Salvar dados
    saveData();
    
    // Atualizar interface
    renderAccountsList();
    populateAccountsDropdown();
    updateBalanceSummary();
}

// Editar meta
function editGoal(goalId) {
    alert('Funcionalidade de edição de meta em desenvolvimento.');
    // Implementação futura
}

// Excluir meta
function deleteGoal(goalId) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) {
        return;
    }
    
    const goalIndex = userData[currentUser].goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
        return;
    }
    
    // Remover a meta
    userData[currentUser].goals.splice(goalIndex, 1);
    
    // Salvar dados
    saveData();
    
    // Atualizar interface
    renderGoalsList();
}

// Atualizar progresso da meta
function updateGoalProgress(goalId) {
    const goal = userData[currentUser].goals.find(g => g.id === goalId);
    
    if (!goal) {
        return;
    }
    
    const newValue = prompt('Digite o valor atual para esta meta:', goal.current);
    
    if (newValue === null) {
        return;
    }
    
    const parsedValue = parseFloat(newValue);
    
    if (isNaN(parsedValue) || parsedValue < 0) {
        alert('Por favor, digite um valor válido.');
        return;
    }
    
    // Atualizar valor atual
    goal.current = parsedValue;
    
    // Salvar dados
    saveData();
    
    // Atualizar interface
    renderGoalsList();
}

// Obter nome da categoria
function getCategoryName(category) {
    const categories = {
        'salario': 'Salário',
        'investimentos': 'Investimentos',
        'alimentacao': 'Alimentação',
        'transporte': 'Transporte',
        'moradia': 'Moradia',
        'lazer': 'Lazer',
        'saude': 'Saúde',
        'educacao': 'Educação',
        'transferencia': 'Transferência',
        'outros': 'Outros'
    };
    
    return categories[category] || category;
}

// Obter cor da categoria
function getCategoryColor(category) {
    const colors = {
        'salario': '#4CAF50',
        'investimentos': '#2196F3',
        'alimentacao': '#FF9800',
        'transporte': '#795548',
        'moradia': '#9C27B0',
        'lazer': '#E91E63',
        'saude': '#F44336',
        'educacao': '#3F51B5',
        'transferencia': '#607D8B',
        'outros': '#9E9E9E'
    };
    
    return colors[category] || '#9E9E9E';
}

// Obter nome do tipo de conta
function getAccountTypeName(type) {
    const types = {
        'corrente': 'Conta Corrente',
        'poupanca': 'Poupança',
        'investimento': 'Investimento',
        'carteira': 'Carteira',
        'outros': 'Outros'
    };
    
    return types[type] || type;
}

// Obter nome da frequência
function getFrequencyName(frequency) {
    const frequencies = {
        'semanal': 'Semanal',
        'quinzenal': 'Quinzenal',
        'mensal': 'Mensal',
        'anual': 'Anual'
    };
    
    return frequencies[frequency] || frequency;
}

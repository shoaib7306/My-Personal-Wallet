// --- DOM Element References ---
// Get references to all the HTML elements we'll be interacting with.
const currentBalanceSpan = document.getElementById('currentBalance');
const principalAmountInput = document.getElementById('principalAmountInput');
const setPrincipalAmountBtn = document.getElementById('setPrincipalAmountBtn');

const monthSelect = document.getElementById('monthSelect'); // Main tracker month
const yearSelect = document.getElementById('yearSelect');   // Main tracker year

const monthlyIncomeSummarySpan = document.getElementById('monthlyIncomeSummary');
const monthlyExpenseSummarySpan = document.getElementById('monthlyExpenseSummary');
const monthlyNetSummarySpan = document.getElementById('monthlyNetSummary');

const incomeDescriptionInput = document.getElementById('incomeDescription');
const incomeAmountInput = document.getElementById('incomeAmount');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const incomeListUl = document.getElementById('incomeList');

const expenseDescriptionInput = document.getElementById('expenseDescription');
const expenseAmountInput = document.getElementById('expenseAmount');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expenseListUl = document.getElementById('expenseList');

const savingsGoalSpan = document.getElementById('savingsGoal');
const currentSavingsSpan = document.getElementById('currentSavings');
const depositAmountInput = document.getElementById('depositAmount');
const depositBtn = document.getElementById('depositBtn');
const setSavingsGoalInput = document.getElementById('setSavingsGoal');
const setGoalBtn = document.getElementById('setGoalBtn');

// Student Payment elements
const newStudentNameInput = document.getElementById('newStudentNameInput');
const newStudentAmountInput = document.getElementById('newStudentAmountInput');
const addStudentBtn = document.getElementById('addStudentBtn');

const studentNameSelect = document.getElementById('studentNameSelect');
const studentMonthSelect = document.getElementById('studentMonthSelect'); // NEW: Student tracker month
const studentYearSelect = document.getElementById('studentYearSelect');   // NEW: Student tracker year

const selectedStudentDisplayNameSpan = document.getElementById('selectedStudentDisplayName');
const expectedPaymentAmountSpan = document.getElementById('expectedPaymentAmount');
const paymentStatusCheckbox = document.getElementById('paymentStatusCheckbox');
const savePaymentStatusBtn = document.getElementById('savePaymentStatusBtn');
const studentPaymentHistoryList = document.getElementById('studentPaymentHistoryList');

const currentYearSpan = document.getElementById('currentYear'); // For footer year

// --- Global Data Storage (will be saved to Local Storage) ---
let financeData = {
    principalAmount: 0,
    transactions: [],
    savings: {
        goal: 0,
        current: 0
    },
    studentPayments: {}, // Stores payment status { 'studentId': { 'YYYY-MM': true/false } }
    studentsConfig: {} // Stores { 'studentId': { name: 'Student Name', amount: 100 } }
};

// --- Constants ---
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// --- Utility Functions ---

/**
 * Saves the current financeData object to Local Storage.
 * Local Storage persists data even when the browser is closed.
 */
function saveFinanceData() {
    localStorage.setItem('financeTrackerData', JSON.stringify(financeData));
    console.log('Finance data saved to Local Storage:', financeData); // DEBUG
}

/**
 * Loads financeData from Local Storage.
 * If no data is found, it initializes with default values.
 */
function loadFinanceData() {
    const storedData = localStorage.getItem('financeTrackerData');
    if (storedData) {
        financeData = JSON.parse(storedData);
        console.log('Finance data loaded from Local Storage:', financeData); // DEBUG
    } else {
        console.log('No existing data found in Local Storage. Initializing new data.'); // DEBUG
    }
    // Ensure all data structures exist
    if (!financeData.transactions) {
        financeData.transactions = [];
    }
    if (!financeData.savings) {
        financeData.savings = { goal: 0, current: 0 };
    }
    if (!financeData.studentPayments) {
        financeData.studentPayments = {};
    }
    if (!financeData.studentsConfig) {
        financeData.studentsConfig = {};
    }
}

/**
 * Formats a number as a currency string.
 * @param {number} amount - The number to format.
 * @returns {string} - The formatted currency string (e.g., "$1,234.56").
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// --- Initialization Functions ---

/**
 * Populates a given month and year dropdowns.
 * @param {HTMLSelectElement} targetMonthSelect - The month select element to populate.
 * @param {HTMLSelectElement} targetYearSelect - The year select element to populate.
 */
function populateMonthYearDropdowns(targetMonthSelect, targetYearSelect) {
    // Clear existing options
    targetMonthSelect.innerHTML = '';
    targetYearSelect.innerHTML = '';

    // Populate Months
    MONTHS.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index; // Use 0-indexed month for easier JavaScript date handling
        option.textContent = month;
        targetMonthSelect.appendChild(option);
    });

    // Populate Years (e.g., current year - 5 to current year + 1)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        targetYearSelect.appendChild(option);
    }

    // Set default selected month and year to current month and year
    targetMonthSelect.value = new Date().getMonth();
    targetYearSelect.value = currentYear;
}


/**
 * Updates the footer with the current year.
 */
function updateFooterYear() {
    currentYearSpan.textContent = new Date().getFullYear();
}

// --- Core Calculation and Display Functions ---

/**
 * Renders all transactions (income and expense) for the currently selected month and year.
 */
function renderTransactions() {
    // Clear existing lists
    incomeListUl.innerHTML = '';
    expenseListUl.innerHTML = '';

    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearSelect.value);

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // Filter transactions for the selected month and year
    const filteredTransactions = financeData.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === selectedMonth && transactionDate.getFullYear() === selectedYear;
    });

    // Add transactions to their respective lists and calculate monthly totals
    filteredTransactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.dataset.id = transaction.id; // Store ID for deletion
        listItem.innerHTML = `
            <span>${transaction.description} (${new Date(transaction.date).toLocaleDateString()})</span>
            <span>${formatCurrency(transaction.amount)}</span>
            <button class="delete-btn">Delete</button>
        `;

        // Add event listener for delete button
        const deleteBtn = listItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTransaction(transaction.id, transaction.type, transaction.amount));

        if (transaction.type === 'income') {
            incomeListUl.appendChild(listItem);
            monthlyIncome += transaction.amount;
        } else { // type === 'expense'
            expenseListUl.appendChild(listItem);
            monthlyExpense += transaction.amount;
        }
    });

    // Update monthly summary
    monthlyIncomeSummarySpan.textContent = formatCurrency(monthlyIncome);
    monthlyExpenseSummarySpan.textContent = formatCurrency(monthlyExpense);
    monthlyNetSummarySpan.textContent = formatCurrency(monthlyIncome - monthlyExpense);

    // Update current balance after rendering transactions
    updateCurrentBalance();
}

/**
 * Updates the displayed current balance based on the principal amount and all transactions.
 */
function updateCurrentBalance() {
    let totalIncome = 0;
    let totalExpense = 0;

    financeData.transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const calculatedBalance = financeData.principalAmount + totalIncome - totalExpense - financeData.savings.current;
    currentBalanceSpan.textContent = formatCurrency(calculatedBalance);
}

/**
 * Updates the displayed savings goal and current savings.
 */
function updateSavingsDisplay() {
    savingsGoalSpan.textContent = formatCurrency(financeData.savings.goal);
    currentSavingsSpan.textContent = formatCurrency(financeData.savings.current);
}

// Student Payment Functions
/**
 * Populates the student dropdown with students from studentsConfig.
 */
function populateStudentSelectors() {
    console.log('populateStudentSelectors called.'); // DEBUG
    studentNameSelect.innerHTML = '<option value="">-- Select a Student --</option>'; // Clear and add default option
    const studentIds = Object.keys(financeData.studentsConfig);
    if (studentIds.length === 0) {
        console.log('No students configured.'); // DEBUG
    }

    for (const studentId of studentIds) {
        const student = financeData.studentsConfig[studentId];
        const option = document.createElement('option');
        option.value = studentId;
        option.textContent = student.name;
        studentNameSelect.appendChild(option);
        console.log(`Added student to selector: ${student.name} (ID: ${studentId})`); // DEBUG
    }
    // Automatically select the first student if available, or keep default
    if (studentIds.length > 0 && !studentNameSelect.value) {
        studentNameSelect.value = studentIds[0];
        console.log(`Auto-selected first student: ${financeData.studentsConfig[studentIds[0]].name}`); // DEBUG
    }
    renderStudentPayments(); // Re-render payment section after populating
}

/**
 * Renders the payment status for the currently selected student and month/year.
 * Updated to use studentsConfig and the new student-specific month/year selectors.
 */
function renderStudentPayments() {
    console.log('renderStudentPayments called.'); // DEBUG
    const selectedStudentId = studentNameSelect.value;
    // Get month and year from student-specific selectors
    const selectedMonthIndex = parseInt(studentMonthSelect.value);
    const selectedYear = parseInt(studentYearSelect.value);

    // Reset display if no student is selected
    if (!selectedStudentId) {
        console.log('No student selected. Resetting student payment display.'); // DEBUG
        selectedStudentDisplayNameSpan.textContent = '-- Select Student --';
        expectedPaymentAmountSpan.textContent = formatCurrency(0);
        paymentStatusCheckbox.checked = false;
        paymentStatusCheckbox.disabled = true; // Disable checkbox if no student selected
        savePaymentStatusBtn.disabled = true; // Disable save button
        studentPaymentHistoryList.innerHTML = '';
        return; // Exit function if no student selected
    }

    paymentStatusCheckbox.disabled = false; // Enable checkbox
    savePaymentStatusBtn.disabled = false; // Enable save button

    const student = financeData.studentsConfig[selectedStudentId];
    if (!student) {
        console.error(`Error: Student configuration not found for ID: ${selectedStudentId}`); // DEBUG
        return;
    }
    selectedStudentDisplayNameSpan.textContent = student.name;
    expectedPaymentAmountSpan.textContent = formatCurrency(student.amount); // Display expected amount
    console.log(`Selected student: ${student.name}, Expected Amount: ${student.amount}`); // DEBUG

    // The monthYearKey now uses the selected month/year from the dropdowns
    const monthYearKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
    console.log(`Current monthYearKey for status check: ${monthYearKey}`); // DEBUG

    // Set checkbox status based on stored data for the selected month/year
    const studentPaymentsForSelected = financeData.studentPayments[selectedStudentId];
    if (studentPaymentsForSelected && studentPaymentsForSelected[monthYearKey]) {
        paymentStatusCheckbox.checked = true;
        console.log(`Payment status for ${monthYearKey} is DONE.`); // DEBUG
    } else {
        paymentStatusCheckbox.checked = false;
        console.log(`Payment status for ${monthYearKey} is PENDING.`); // DEBUG
    }

    // Render payment history for the selected student
    studentPaymentHistoryList.innerHTML = ''; // Clear existing history
    console.log('Rendering payment history for student ID:', selectedStudentId); // DEBUG
    if (studentPaymentsForSelected) {
        const sortedHistoryKeys = Object.keys(studentPaymentsForSelected).sort((a, b) => b.localeCompare(a));
        console.log('Sorted history keys:', sortedHistoryKeys); // DEBUG

        sortedHistoryKeys.forEach(key => {
            const [year, month] = key.split('-');
            const monthName = MONTHS[parseInt(month) - 1];
            const status = studentPaymentsForSelected[key] ? 'Done' : 'Pending';
            const statusClass = studentPaymentsForSelected[key] ? 'payment-done' : 'payment-pending';

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${monthName} ${year}: <strong class="${statusClass}">${status}</strong></span>
            `;
            studentPaymentHistoryList.appendChild(listItem);
            console.log(`Added history item: ${monthName} ${year} - ${status}`); // DEBUG
        });
    } else {
        console.log('No payment history found for this student.'); // DEBUG
    }
}

/**
 * Saves the payment status for the selected student for the selected month.
 */
function saveStudentPaymentStatus() {
    console.log('saveStudentPaymentStatus called.'); // DEBUG
    const selectedStudentId = studentNameSelect.value;
    if (!selectedStudentId) {
        alert('Please select a student first.');
        console.warn('Attempted to save status without a student selected.'); // DEBUG
        return;
    }

    // Get month and year from student-specific selectors
    const selectedMonthIndex = parseInt(studentMonthSelect.value);
    const selectedYear = parseInt(studentYearSelect.value);

    const monthYearKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
    console.log(`Saving status for student ID: ${selectedStudentId}, Month/Year: ${monthYearKey}`); // DEBUG

    if (!financeData.studentPayments[selectedStudentId]) {
        financeData.studentPayments[selectedStudentId] = {};
        console.log(`Initialized payment history for student ID: ${selectedStudentId}`); // DEBUG
    }

    financeData.studentPayments[selectedStudentId][monthYearKey] = paymentStatusCheckbox.checked;
    console.log(`Set payment status for ${monthYearKey} to: ${paymentStatusCheckbox.checked}`); // DEBUG
    saveFinanceData(); // Save to local storage
    renderStudentPayments(); // Re-render to update history
}


// --- Event Handlers ---

/**
 * Handles setting the initial principal amount.
 */
setPrincipalAmountBtn.addEventListener('click', () => {
    const amount = parseFloat(principalAmountInput.value);
    if (!isNaN(amount) && amount >= 0) {
        financeData.principalAmount = amount;
        saveFinanceData();
        updateCurrentBalance();
        principalAmountInput.value = ''; // Clear input
    } else {
        alert('Please enter a valid positive number for your current balance.');
    }
});

/**
 * Handles adding a new income transaction.
 */
addIncomeBtn.addEventListener('click', () => {
    const description = incomeDescriptionInput.value.trim();
    const amount = parseFloat(incomeAmountInput.value);

    if (description && !isNaN(amount) && amount > 0) {
        const newTransaction = {
            id: Date.now(), // Unique ID for the transaction
            type: 'income',
            description: description,
            amount: amount,
            date: new Date().toISOString() // Store date in ISO format for easy parsing
        };
        financeData.transactions.push(newTransaction);
        saveFinanceData();
        renderTransactions(); // Re-render to show new transaction and update summaries
        incomeDescriptionInput.value = '';
        incomeAmountInput.value = '';
    } else {
        alert('Please enter a valid description and a positive amount for income.');
    }
});

/**
 * Handles adding a new expense transaction.
 */
addExpenseBtn.addEventListener('click', () => {
    const description = expenseDescriptionInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);

    if (description && !isNaN(amount) && amount > 0) {
        const newTransaction = {
            id: Date.now(), // Unique ID for the transaction
            type: 'expense',
            description: description,
            amount: amount,
            date: new Date().toISOString()
        };
        financeData.transactions.push(newTransaction);
        saveFinanceData();
        renderTransactions(); // Re-render to show new transaction and update summaries
        expenseDescriptionInput.value = '';
        expenseAmountInput.value = '';
    } else {
        alert('Please enter a valid description and a positive amount for expense.');
    }
});

/**
 * Handles deleting a transaction.
 * @param {number} id - The ID of the transaction to delete.
 */
function deleteTransaction(id) {
    // Filter out the transaction to be deleted
    financeData.transactions = financeData.transactions.filter(transaction => transaction.id !== id);
    saveFinanceData();
    renderTransactions(); // Re-render the lists and update summaries
}

/**
 * Event listener for main tracker month and year selection changes.
 * When the selection changes, re-render transactions.
 */
monthSelect.addEventListener('change', renderTransactions);
yearSelect.addEventListener('change', renderTransactions);

/**
 * Handles setting the yearly savings goal.
 */
setGoalBtn.addEventListener('click', () => {
    const goal = parseFloat(setSavingsGoalInput.value);
    if (!isNaN(goal) && goal >= 0) {
        financeData.savings.goal = goal;
        saveFinanceData();
        updateSavingsDisplay();
        setSavingsGoalInput.value = '';
    } else {
        alert('Please enter a valid positive number for your savings goal.');
    }
});

/**
 * Handles depositing money into savings.
 */
depositBtn.addEventListener('click', () => {
    const depositAmount = parseFloat(depositAmountInput.value);
    if (!isNaN(depositAmount) && depositAmount > 0) {
        // Check if current balance is sufficient
        let totalIncome = 0;
        let totalExpense = 0;
        financeData.transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
        const currentCalculatedBalance = financeData.principalAmount + totalIncome - totalExpense - financeData.savings.current;

        if (currentCalculatedBalance >= depositAmount) {
            financeData.savings.current += depositAmount;
            saveFinanceData();
            updateSavingsDisplay();
            updateCurrentBalance(); // Update main balance as money moved to savings
            depositAmountInput.value = '';
        } else {
            alert('Insufficient balance to deposit this amount into savings.');
        }
    } else {
        alert('Please enter a valid positive amount to deposit.');
    }
});

// Student Payment Event Handlers
addStudentBtn.addEventListener('click', () => {
    const name = newStudentNameInput.value.trim();
    const amount = parseFloat(newStudentAmountInput.value);

    if (name && !isNaN(amount) && amount >= 0) {
        const newStudentId = 'student_' + Date.now(); // Unique ID for the student
        financeData.studentsConfig[newStudentId] = {
            name: name,
            amount: amount
        };
        saveFinanceData();
        populateStudentSelectors(); // Re-populate dropdown with new student
        studentNameSelect.value = newStudentId; // Select the newly added student
        newStudentNameInput.value = ''; // Clear inputs
        newStudentAmountInput.value = '';
    } else {
        alert('Please enter a valid student name and a non-negative amount.');
    }
});

studentNameSelect.addEventListener('change', renderStudentPayments);
// NEW: Event listeners for student-specific month/year selectors
studentMonthSelect.addEventListener('change', renderStudentPayments);
studentYearSelect.addEventListener('change', renderStudentPayments);

savePaymentStatusBtn.addEventListener('click', saveStudentPaymentStatus);


// --- Initial Load ---
// This function runs when the page first loads.
document.addEventListener('DOMContentLoaded', () => {
    loadFinanceData(); // Load any previously saved data

    // Populate main tracker month/year selectors
    populateMonthYearDropdowns(monthSelect, yearSelect);
    // Populate student tracker month/year selectors
    populateMonthYearDropdowns(studentMonthSelect, studentYearSelect);

    updateFooterYear(); // Set the current year in the footer
    updateSavingsDisplay(); // Display initial savings
    renderTransactions(); // Render transactions for the current month/year and update main balance
    populateStudentSelectors(); // Initialize student selectors from saved data (this also calls renderStudentPayments)
});

// IMPORTANT: For this example, I've used alert() for simple user feedback.
// In a real application, you would replace these with custom modal dialogs or
// inline messages for a better user experience.
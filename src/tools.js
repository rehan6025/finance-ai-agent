import db from "./db.js";

export function getBalance(accountId) {
    const res = db.prepare("SELECT balance FROM accounts WHERE accountId = ?;").get(accountId);
    if (!res) {
        return "No account found";
    }
    return `the balance of account ${accountId} is ${res.balance}`;
}

export function getTransactions(accountId, category, fromDate, toDate) {
    const res = db.prepare("SELECT * FROM transactions WHERE accountId = ? AND category = ? AND date BETWEEN ? AND ? ORDER BY date LIMIT 10;").all(accountId, category, fromDate, toDate);

    if (!res || res.length === 0) return "No transactions found";
    return JSON.stringify(res);

}



export function getSpendingSummary(accountId, month) {
    const monthPattern = `${month}-%`;

    const res = db.prepare(`
        SELECT category, SUM(amount) AS totalAmount 
        FROM transactions 
        WHERE accountId = ? AND type = 'debit' AND date LIKE ? 
        GROUP BY category 
        ORDER BY totalAmount DESC;
    `).all(accountId, monthPattern);

    if (!res || res.length === 0) {
        return `No spending found for account ${accountId} in month ${month}`;
    }

    return JSON.stringify(res);
}


export function setBudget(userId, category, limit) {
    const month = getCurrentMonth();
    const res = db.prepare(`
        INSERT INTO budgets (userId, category, monthlyLimit, month)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userId, category, month) 
        DO UPDATE SET monthlyLimit = excluded.monthlyLimit;
    `).run(userId, category, limit, month);
    if (!res) return "Failed to set budget";
    return `Budget for ${category} set to ${limit} for month ${month}`;
}

function getCurrentMonth() {
    const month = new Date().toISOString().slice(0, 7);
    return month;
}

export function getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
}


export function checkBudgetStatus(userId, category) {
    const month = getCurrentMonth();

    const { totalSpent } = db.prepare(` SELECT COALESCE(SUM(amount), 0) as totalSpent FROM transactions WHERE accountId = ? AND category = ?  AND type = 'debit' AND date LIKE ? `).get(userId, category, `${month}-%`);

    const budgetRow = db.prepare(`SELECT monthlyLimit FROM budgets WHERE userId = ? AND category = ? AND month = ?`).get(userId, category, month);
    if (!budgetRow) {
        return `No budget found for category ${category} in month ${month}`;
    }
    const monthlyLimit = budgetRow.monthlyLimit;

    const remainingAmount = monthlyLimit - totalSpent;

    if (remainingAmount < 0) {
        return `For category ${category}, you have spent ${totalSpent} out of ${monthlyLimit}. You are OVER budget by ${Math.abs(remainingAmount)}.`;
    }
    return `For category ${category}, you have spent ${totalSpent} out of ${monthlyLimit}. Remaining budget is ${remainingAmount}.`;

}
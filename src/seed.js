import db from "./db.js";

db.exec(`
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS budgets;
    
    CREATE TABLE accounts(
        accountId INTEGER PRIMARY KEY,
        userId INTEGER NOT NULL,
        accountType TEXT ,
        balance INTEGER 
    );

    CREATE TABLE transactions (
        txnId INTEGER PRIMARY KEY,
        accountId INTEGER ,
        amount INTEGER, 
        type TEXT CHECK(type in ('debit','credit')),
        category TEXT CHECK(category in ('food','travel','shopping','bills')),
        merchant TEXT ,
        date TEXT
    );

    CREATE TABLE budgets(
        userId INTEGER NOT NULL,
        category TEXT CHECK(category in ('food','travel','shopping','bills')),
        monthlyLimit INTEGER ,
        month TEXT,
        UNIQUE(userId, category, month)
    );

    `);


const insertAccount = db.prepare("INSERT INTO accounts values(? , ? , ? , ?);");
insertAccount.run(1, 1, "savings", 50000);

const insertBudget = db.prepare("INSERT INTO budgets values(?, ?, ? , ?);")
insertBudget.run(1, "food", 8000, "2026-10")
insertBudget.run(1, "travel", 10000, "2026-10")
insertBudget.run(1, "shopping", 5000, "2026-10")
insertBudget.run(1, "bills", 4000, "2026-10")

insertBudget.run(1, "food", 6000, "2026-09")
insertBudget.run(1, "travel", 9000, "2026-09")
insertBudget.run(1, "shopping", 6000, "2026-09")
insertBudget.run(1, "bills", 4500, "2026-09")



const categories = ["food", "travel", "shopping", "bills"]

const merchants = {
    food: ["Swiggy", "Zomato", "Starbucks", "Blinkit", "Instamart"],
    travel: ["Uber", "Rapido", "Ola", "Metro"],
    shopping: ["Amazon", "Flipkart", "Myntra", "Limeroad"],
    bills: ["Electricity", "Broadband", "Cylinder", "Waterbill"]
}



const insertTransaction = db.prepare("INSERT INTO transactions values (?, ? , ? , ? , ?, ? , ? );")

const insertMany = db.transaction(() => {
    for (let i = 1; i < 210; i++) {

        const category = categories[Math.floor(Math.random() * categories.length)];
        const merchantList = merchants[category];
        const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];

        const amount = Math.floor(Math.random() * 600) + 100;

        const month = String(i % 2 === 0 ? 10 : 9).padStart(2, "0");
        const day = String((i % 28) + 1).padStart(2, "0");

        const date = `2026-${month}-${day}`;


        insertTransaction.run(i, 1, amount, "debit", category, merchant, date);
    }
})

insertMany();

console.log("Database seeded with account, transactions and budgets")

db.close();
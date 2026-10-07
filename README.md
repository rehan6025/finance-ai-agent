# Personal Finance AI Agent

**Problem Set:** Problem Set 4 – Personal Finance Agent  
Built for the Agent Day Hackathon.

An autonomous banking and finance assistant powered by Groq (openai/gpt-oss-20b) and SQLite (`better-sqlite3`). The agent uses dynamic function calling inside an agent loop to look up balances, aggregate spending from raw transactions, set monthly budgets, and check budget overruns without dumping entire tables into the prompt context.


---

## Setup & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Create a .env file just like the .env.example file 
add your GROQ_API_KEY in it

### 3. Run the seed script
```bash
npm run seed
```

### 4. Run your queries
```bash 
node src/llm.js "Your query here"
```



---
## Tools Implemented

- `getBalance` (Read) – Current account balance.
- `getTransactions` (Read) – Filtered transaction history.
- `getSpendingSummary` (Compute) – Aggregated spending by category.
- `checkBudgetStatus` (Compute) – Budget vs. spending status.
- `setBudget` (Write) – Set or update category budget.
- `getCurrentDate` (Live) – Current system date.

---
import { checkBudgetStatus, getBalance, getSpendingSummary, getTransactions, setBudget, getCurrentDate } from "./tools.js";
import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


//tools array 
const tools = [
    {
        type: "function",
        function: {
            name: "getBalance",
            description: "get the current balance for an account",
            parameters: {
                type: "object",
                properties: {
                    accountId: { type: "number", description: "the account ID (use default 1 if not specified)" }
                },
                required: ["accountId"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getTransactions",
            description: "get list of transactions for an account by category between a time period of 2 dates, limit is 10, returns a json strigified list of transaction objects",
            parameters: {
                type: "object",
                properties: {
                    accountId: { type: "number", description: "the account ID (use default 1 if not specified)" },
                    category: { type: "string", description: "the category of transactions (food, travel, shopping, bills)" },
                    fromDate: { type: "string", description: "the start date in YYYY-MM-DD format" },
                    toDate: { type: "string", description: "the end date in YYYY-MM-DD format" }
                },
                required: ["accountId", "category", "fromDate", "toDate"]
            }
        }
    }, {
        type: "function",
        function: {
            name: "getSpendingSummary",
            description: "get summary of spending by category for a month , returns a json stringified array of objects with category and totalAmount",
            parameters: {
                type: "object",
                properties: {
                    accountId: { type: "number", description: "the account ID (use default 1 if not specified)" },
                    month: { type: "string", description: "the month in YYYY-MM format" }
                },
                required: ["accountId", "month"]
            }
        }

    }, {

        type: "function",
        function: {
            name: "setBudget",
            description: "set budget for a category for the current month, or updates the previous one if exists",
            parameters: {
                type: "object",
                properties: {
                    userId: { type: "number", description: "the user ID (use default 1 if not specified)" },
                    category: { type: "string", description: "the category of transactions (food, travel, shopping, bills)" },
                    limit: { type: "number", description: "the monthly limit for the category" }
                },
                required: ["userId", "category", "limit"]
            }
        }
    }, {
        type: "function",
        function: {
            name: "checkBudgetStatus",
            description: "check the status of budget for a category for the current month, returns response message with remaining budget or tells if we're over budget",
            parameters: {
                type: "object",
                properties: {
                    userId: { type: "number", description: "the user ID (use default 1 if not specified)" },
                    category: { type: "string", description: "the category of transactions(food, travel, shopping, bills)" }
                },
                required: ["userId", "category"]
            }
        }
    }, {
        type: "function",
        function: {
            name: "getCurrentDate",
            description: "get the current date in YYYY-MM-DD format",
            parameters: {
                type: "object",
                properties: {}
            }

        }
    }

];


const toolMap = {
    getBalance: (args) => getBalance(args.accountId),
    getTransactions: (args) => getTransactions(args.accountId, args.category, args.fromDate, args.toDate),
    getSpendingSummary: (args) => getSpendingSummary(args.accountId, args.month),
    setBudget: (args) => setBudget(args.userId, args.category, args.limit),
    checkBudgetStatus: (args) => checkBudgetStatus(args.userId, args.category),
    getCurrentDate: () => getCurrentDate()
};

async function runAgent(userQuery) {
    const messages = [
        {
            role: "system",
            content: `You are a personal finance assistant. 
always look up facts from tools, never guess. 
default accountId is 1 and userId is 1 unless the user says otherwise, also currency is indian rupees.
if asked for 'last month', call getCurrentDate first to check the current date/month.
politely decline any other question request, say you are only here to help with user's finance queries
`
        },
        {
            role: "user",
            content: userQuery
        }
    ];

    let rounds = 0;
    const maxRounds = 5;

    while (rounds < maxRounds) {
        rounds++;

        const response = await groq.chat.completions.create({

            messages: messages,
            tools: tools,
            tool_choice: "auto",
            model: "openai/gpt-oss-20b",
        });

        const choice = response.choices[0];
        const message = choice.message;

        messages.push(message);

        if (message.tool_calls && message.tool_calls.length > 0) {
            for (const toolCall of message.tool_calls) {
                const fnName = toolCall.function.name;

                const args = JSON.parse(toolCall.function.arguments);

                console.log(`tool call : ${fnName}(`, args, `)`);

                let result;
                if (toolMap[fnName]) {
                    result = toolMap[fnName](args);
                } else {
                    result = `Error: tool '${fnName}' not implemented.`;
                }

                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: String(result)
                });
            }
        } else {
            console.log("\n--- Final Answer ---");
            console.log(message.content);
            return message.content;
        }
    }

    console.log("Exceeded maximum safety rounds.");
}

const query = process.argv[2] || "Hey who are you"
runAgent(query);

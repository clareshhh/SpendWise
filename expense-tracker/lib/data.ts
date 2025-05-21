import fs from "fs/promises"
import path from "path"
import type { Expense } from "./actions"

const DATA_FILE_PATH = path.join(process.cwd(), "data", "expenses.json")

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  try {
    await fs.access(dataDir)
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Get all expenses
export async function getExpenses(): Promise<Expense[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(DATA_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return []
  }
}

// Get expense by ID
export async function getExpenseById(id: string): Promise<Expense | null> {
  const expenses = await getExpenses()
  return expenses.find((expense) => expense.id === id) || null
}

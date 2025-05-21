"use server"

import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  date: z.date(),
  description: z.string().min(1),
})

type ExpenseInput = z.infer<typeof expenseSchema>

export interface Expense {
  id: string
  amount: number
  category: string
  date: string
  description: string
  createdAt: string
}

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

// Read expenses from the JSON file
async function readExpensesFile(): Promise<Expense[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(DATA_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return []
  }
}

// Write expenses to the JSON file
async function writeExpensesFile(expenses: Expense[]): Promise<void> {
  await ensureDataDirectory()
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(expenses, null, 2), "utf8")
}

// Add a new expense
export async function addExpense(data: ExpenseInput): Promise<Expense> {
  const validatedData = expenseSchema.parse(data)

  const newExpense: Expense = {
    id: uuidv4(),
    amount: validatedData.amount,
    category: validatedData.category,
    date: validatedData.date.toISOString(),
    description: validatedData.description,
    createdAt: new Date().toISOString(),
  }

  const expenses = await readExpensesFile()
  expenses.push(newExpense)
  await writeExpensesFile(expenses)

  revalidatePath("/")
  return newExpense
}

// Delete an expense
export async function deleteExpense(id: string): Promise<void> {
  const expenses = await readExpensesFile()
  const updatedExpenses = expenses.filter((expense) => expense.id !== id)
  await writeExpensesFile(updatedExpenses)
  revalidatePath("/")
}

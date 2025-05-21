import { getExpenses } from "@/lib/data"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { startOfDay, startOfWeek, startOfMonth } from "date-fns"

interface ExpenseListProps {
  filter: "all" | "daily" | "weekly" | "monthly"
}

export default async function ExpenseList({ filter }: ExpenseListProps) {
  const expenses = await getExpenses()

  // Filter expenses based on the selected time period
  const now = new Date()
  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)

    switch (filter) {
      case "daily":
        return expenseDate >= startOfDay(now)
      case "weekly":
        return expenseDate >= startOfWeek(now)
      case "monthly":
        return expenseDate >= startOfMonth(now)
      default:
        return true
    }
  })

  // Sort expenses by date (newest first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedExpenses.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No expenses found for this time period.</div>
  }

  return (
    <ScrollArea className="h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedExpenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
              <TableCell className="max-w-[200px] truncate">{expense.description}</TableCell>
              <TableCell>
                <Badge variant="outline">{expense.category}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

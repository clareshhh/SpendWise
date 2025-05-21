import { getExpenses } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { startOfDay, startOfWeek, startOfMonth } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export default async function ExpenseSummary() {
  const expenses = await getExpenses()

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate today's expenses
  const today = startOfDay(new Date())
  const todayExpenses = expenses
    .filter((expense) => new Date(expense.date) >= today)
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate this week's expenses
  const thisWeek = startOfWeek(new Date())
  const weekExpenses = expenses
    .filter((expense) => new Date(expense.date) >= thisWeek)
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate this month's expenses
  const thisMonth = startOfMonth(new Date())
  const monthExpenses = expenses
    .filter((expense) => new Date(expense.date) >= thisMonth)
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate expenses by category
  const categoryMap = new Map()
  expenses.forEach((expense) => {
    const currentAmount = categoryMap.get(expense.category) || 0
    categoryMap.set(expense.category, currentAmount + expense.amount)
  })

  const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 categories

  const colors = [
    "#8884d8",
    "#83a6ed",
    "#8dd1e1",
    "#82ca9d",
    "#a4de6c",
    "#d0ed57",
    "#ffc658",
    "#ff8042",
    "#ff6361",
    "#bc5090",
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">Today</div>
            <div className="text-2xl font-bold">{formatCurrency(todayExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">This Week</div>
            <div className="text-2xl font-bold">{formatCurrency(weekExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground">This Month</div>
            <div className="text-2xl font-bold">{formatCurrency(monthExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      {categoryData.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Top Categories</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

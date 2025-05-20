import { Suspense } from "react"
import ExpenseForm from "@/components/expense-form"
import ExpenseList from "@/components/expense-list"
import ExpenseSummary from "@/components/expense-summary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Expense Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add New Expense</CardTitle>
            <CardDescription>Enter the details of your expense</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>Overview of your spending</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading summary...</div>}>
                <ExpenseSummary />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>View and filter your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <Suspense fallback={<div>Loading expenses...</div>}>
                    <ExpenseList filter="all" />
                  </Suspense>
                </TabsContent>
                <TabsContent value="daily">
                  <Suspense fallback={<div>Loading expenses...</div>}>
                    <ExpenseList filter="daily" />
                  </Suspense>
                </TabsContent>
                <TabsContent value="weekly">
                  <Suspense fallback={<div>Loading expenses...</div>}>
                    <ExpenseList filter="weekly" />
                  </Suspense>
                </TabsContent>
                <TabsContent value="monthly">
                  <Suspense fallback={<div>Loading expenses...</div>}>
                    <ExpenseList filter="monthly" />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

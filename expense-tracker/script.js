// Global variables
let expenses = []
let categoryChart = null

// DOM elements
const expenseForm = document.getElementById("expense-form")
const expenseList = document.getElementById("expense-list")
const noExpensesMessage = document.getElementById("no-expenses-message")
const todayTotal = document.getElementById("today-total")
const weekTotal = document.getElementById("week-total")
const monthTotal = document.getElementById("month-total")
const categoryChartCanvas = document.getElementById("category-chart-canvas")
const categoryChartContainer = document.getElementById("category-chart")
const tabButtons = document.querySelectorAll(".tab-btn")
const toast = document.getElementById("toast")
const toastMessage = document.getElementById("toast-message")
const deleteModal = document.getElementById("delete-modal")
const deleteForm = document.getElementById("delete-form")
const deletePassword = document.getElementById("delete-password")
const cancelDeleteBtn = document.getElementById("cancel-delete")
const closeModalBtn = document.getElementById("close-modal")

let currentExpenseIdToDelete = null

// Category colors for chart and badges
const categoryColors = {
  Food: "#8b5cf6",
  Transportation: "#3b82f6",
  Housing: "#06b6d4",
  Utilities: "#10b981",
  Entertainment: "#f59e0b",
  Healthcare: "#ef4444",
  Shopping: "#ec4899",
  Education: "#6366f1",
  Travel: "#f97316",
  Other: "#64748b",
}

// Add a function to update the date ranges in the summary cards
function updateDateRanges() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Calculate week start (Sunday) and end (Saturday)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Calculate month start and end
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Format dates
  const formatShortDate = (date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Update the date range displays
  document.getElementById("today-date").textContent = formatShortDate(today)
  document.getElementById("week-date-range").textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`
  document.getElementById("month-date-range").textContent =
    `${formatShortDate(monthStart)} - ${formatShortDate(monthEnd)}`
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Feather icons
  if (typeof feather !== "undefined") {
    feather.replace()
  }

  // Set default date to today
  document.getElementById("date").valueAsDate = new Date()

  // Update date ranges in summary cards
  updateDateRanges()

  // Load expenses
  fetchExpenses()

  // Add event listeners
  expenseForm.addEventListener("submit", handleFormSubmit)
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.getAttribute("data-filter")
      setActiveTab(button)
      renderExpenseList(filter)
    })
  })

  // Delete modal event listeners
  deleteForm.addEventListener("submit", handleDeleteSubmit)
  cancelDeleteBtn.addEventListener("click", closeDeleteModal)
  closeModalBtn.addEventListener("click", closeDeleteModal)

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal()
    }
  })
})

// Fetch expenses from the backend
async function fetchExpenses() {
  try {
    showLoading(true)
    const response = await fetch("/api/expenses")
    if (!response.ok) {
      throw new Error("Failed to fetch expenses")
    }
    expenses = await response.json()

    // Render the UI with the fetched data
    renderExpenseList(getActiveTabFilter())
    updateSummary()
    renderCategoryChart()
    showLoading(false)
  } catch (error) {
    console.error("Error fetching expenses:", error)
    showToast("Failed to load expenses. Make sure the backend server is running.", true)
    showLoading(false)
  }
}

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault()

  const formData = new FormData(expenseForm)
  const expenseData = {
    amount: Number.parseFloat(formData.get("amount")),
    category: formData.get("category"),
    date: formData.get("date"),
    description: formData.get("description"),
  }

  try {
    // Show loading or disable form
    const submitButton = expenseForm.querySelector('button[type="submit"]')
    const originalButtonText = submitButton.innerHTML
    submitButton.disabled = true
    submitButton.innerHTML = `<i data-feather="loader" class="btn-icon"></i> Adding...`
    if (typeof feather !== "undefined") {
      feather.replace()
    }

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseData),
    })

    if (!response.ok) {
      throw new Error("Failed to add expense")
    }

    const newExpense = await response.json()

    // Fetch all expenses again to ensure we have the latest data
    await fetchExpenses()

    // Reset form
    expenseForm.reset()
    document.getElementById("date").valueAsDate = new Date()

    // Show success message
    showToast("Expense added successfully")
  } catch (error) {
    console.error("Error adding expense:", error)
    showToast("Failed to add expense. Make sure the backend server is running.", true)
  } finally {
    // Re-enable form
    const submitButton = expenseForm.querySelector('button[type="submit"]')
    submitButton.disabled = false
    submitButton.innerHTML = `<i data-feather="save" class="btn-icon"></i> Add Expense`
    if (typeof feather !== "undefined") {
      feather.replace()
    }
  }
}

// Handle delete form submission
async function handleDeleteSubmit(event) {
  event.preventDefault()

  if (!currentExpenseIdToDelete) {
    showToast("No expense selected for deletion", true)
    return
  }

  const password = deletePassword.value

  if (!password) {
    showToast("Password is required", true)
    return
  }

  try {
    const submitButton = deleteForm.querySelector('button[type="submit"]')
    const originalButtonText = submitButton.innerHTML
    submitButton.disabled = true
    submitButton.innerHTML = `<i data-feather="loader" class="btn-icon"></i> Deleting...`
    if (typeof feather !== "undefined") {
      feather.replace()
    }

    const response = await fetch(`/api/expenses/${currentExpenseIdToDelete}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to delete expense")
    }

    // Fetch all expenses again to ensure we have the latest data
    await fetchExpenses()

    // Close modal and reset form
    closeDeleteModal()

    // Show success message
    showToast("Expense deleted successfully")
  } catch (error) {
    console.error("Error deleting expense:", error)
    showToast(error.message || "Failed to delete expense", true)
  } finally {
    const submitButton = deleteForm.querySelector('button[type="submit"]')
    submitButton.disabled = false
    submitButton.innerHTML = `<i data-feather="trash-2" class="btn-icon"></i> Delete`
    if (typeof feather !== "undefined") {
      feather.replace()
    }
  }
}

// Open delete confirmation modal
function openDeleteModal(expenseId) {
  currentExpenseIdToDelete = expenseId
  deletePassword.value = ""
  deleteModal.style.display = "block"
}

// Close delete confirmation modal
function closeDeleteModal() {
  deleteModal.style.display = "none"
  currentExpenseIdToDelete = null
}

// Render the expense list based on filter
function renderExpenseList(filter) {
  // Clear the current list
  expenseList.innerHTML = ""

  // Filter expenses
  const filteredExpenses = filterExpenses(filter)

  // Show/hide no expenses message
  if (filteredExpenses.length === 0) {
    noExpensesMessage.style.display = "block"
  } else {
    noExpensesMessage.style.display = "none"

    // Sort expenses by date (newest first)
    const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Render each expense
    sortedExpenses.forEach((expense) => {
      const row = document.createElement("tr")
      row.className = "fade-in"

      // Format date
      const expenseDate = new Date(expense.date)
      const formattedDate = expenseDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

      // Format amount
      const formattedAmount = formatCurrency(expense.amount)

      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${expense.description}</td>
        <td><span class="category-badge" data-category="${expense.category}">${expense.category}</span></td>
        <td class="amount">${formattedAmount}</td>
        <td class="actions">
          <button class="delete-btn" data-id="${expense.id}" title="Delete expense">
            <i data-feather="trash-2" width="16" height="16"></i>
          </button>
        </td>
      `

      // Add event listener to delete button
      const deleteBtn = row.querySelector(".delete-btn")
      deleteBtn.addEventListener("click", () => {
        openDeleteModal(expense.id)
      })

      expenseList.appendChild(row)
    })

    // Initialize Feather icons for the new rows
    if (typeof feather !== "undefined") {
      feather.replace()
    }
  }
}

// Filter expenses based on time period
function filterExpenses(filter) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Calculate week start (Sunday)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  // Calculate week end (Saturday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Calculate month start and end
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return expenses.filter((expense) => {
    // Convert the expense date string to a Date object for proper comparison
    const expenseDate = new Date(expense.date)
    // Reset the time part to ensure we're only comparing dates
    expenseDate.setHours(0, 0, 0, 0)

    switch (filter) {
      case "daily":
        // Compare year, month, and day for "today"
        return (
          expenseDate.getFullYear() === today.getFullYear() &&
          expenseDate.getMonth() === today.getMonth() &&
          expenseDate.getDate() === today.getDate()
        )
      case "weekly":
        // For weekly, check if the date is between week start and week end (inclusive)
        return expenseDate >= weekStart && expenseDate <= weekEnd
      case "monthly":
        // For monthly, check if it's between month start and month end
        return expenseDate >= monthStart && expenseDate <= monthEnd
      default:
        return true
    }
  })
}

// Update summary statistics
function updateSummary() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Calculate week start (Sunday)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  // Calculate week end (Saturday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Calculate month start and end
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Calculate totals with proper date comparison
  const todayExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      expenseDate.setHours(0, 0, 0, 0)
      return (
        expenseDate.getFullYear() === today.getFullYear() &&
        expenseDate.getMonth() === today.getMonth() &&
        expenseDate.getDate() === today.getDate()
      )
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const weekExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      expenseDate.setHours(0, 0, 0, 0)
      return expenseDate >= weekStart && expenseDate <= weekEnd
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  const monthExpenses = expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      expenseDate.setHours(0, 0, 0, 0)
      return expenseDate >= monthStart && expenseDate <= monthEnd
    })
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Update UI
  todayTotal.textContent = formatCurrency(todayExpenses)
  weekTotal.textContent = formatCurrency(weekExpenses)
  monthTotal.textContent = formatCurrency(monthExpenses)
}

// Render category chart
function renderCategoryChart() {
  // Calculate expenses by category
  const categoryMap = new Map()
  expenses.forEach((expense) => {
    const currentAmount = categoryMap.get(expense.category) || 0
    categoryMap.set(expense.category, currentAmount + expense.amount)
  })

  // Convert to array and sort by amount (descending)
  const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5 categories

  // If no data, show empty state
  if (categoryData.length === 0) {
    if (categoryChart) {
      categoryChart.destroy()
      categoryChart = null
    }

    // Show empty state message
    categoryChartContainer.innerHTML = `
      <div class="empty-chart">
        <i data-feather="bar-chart-2" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
        <p>No expense data available yet.<br>Add expenses to see category breakdown.</p>
      </div>
    `
    if (typeof feather !== "undefined") {
      feather.replace()
    }
    return
  }

  // Prepare chart data
  const labels = categoryData.map((item) => item.name)
  const data = categoryData.map((item) => item.value)
  const backgroundColors = labels.map((category) => categoryColors[category] || "#64748b")

  // Destroy previous chart if it exists
  if (categoryChart) {
    categoryChart.destroy()
  }

  // Make sure the canvas is in the DOM
  if (!document.getElementById("category-chart-canvas")) {
    categoryChartContainer.innerHTML = '<canvas id="category-chart-canvas"></canvas>'
  }

  // Create new chart
  const ctx = document.getElementById("category-chart-canvas").getContext("2d")

  categoryChart = new window.Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Spending by Category",
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 0,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.raw),
          },
          backgroundColor: "#1e293b",
          titleFont: {
            family: "'Inter', sans-serif",
            size: 14,
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 14,
          },
          padding: 12,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(226, 232, 240, 0.5)",
          },
          ticks: {
            callback: (value) => formatCurrency(value),
            font: {
              family: "'Inter', sans-serif",
            },
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
            },
          },
        },
      },
      animation: {
        duration: 1000,
        easing: "easeOutQuart",
      },
    },
  })
}

// Helper function to format currency - Updated to use Philippine Peso
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Set active tab
function setActiveTab(activeButton) {
  tabButtons.forEach((button) => {
    button.classList.remove("active")
  })
  activeButton.classList.add("active")
}

// Get current active tab filter
function getActiveTabFilter() {
  const activeTab = document.querySelector(".tab-btn.active")
  return activeTab ? activeTab.getAttribute("data-filter") : "all"
}

// Show toast notification
function showToast(message, isError = false) {
  toastMessage.textContent = message
  toast.classList.toggle("error", isError)
  toast.classList.remove("hidden")

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.add("hidden")
  }, 3000)
}

// Show/hide loading indicator
function showLoading(isLoading) {
  if (isLoading) {
    // Create and show loading indicator
    const loadingDiv = document.createElement("div")
    loadingDiv.className = "loading"
    loadingDiv.id = "loading-indicator"

    // Add loading indicator to expense list
    document.getElementById("expense-table").style.display = "none"
    document.getElementById("no-expenses-message").style.display = "none"
    document.querySelector(".expense-table-container").appendChild(loadingDiv)

    // Add loading indicator to chart
    categoryChartContainer.innerHTML = '<div class="loading"></div>'
  } else {
    // Remove loading indicators
    document.getElementById("expense-table").style.display = "table"
    const loadingIndicator = document.getElementById("loading-indicator")
    if (loadingIndicator) {
      loadingIndicator.remove()
    }
  }
}

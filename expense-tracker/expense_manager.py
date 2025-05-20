import json
import os
import uuid
from datetime import datetime, date
from typing import Dict, List, Any, Optional

# Constants
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "expenses.json")

# Ensure data directory exists
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Type definitions
ExpenseDict = Dict[str, Any]

class ExpenseManager:
    """Class to manage expense operations"""
    
    @staticmethod
    def read_expenses() -> List[ExpenseDict]:
        """Read expenses from JSON file"""
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            # Return empty list if file doesn't exist or is invalid
            return []
    
    @staticmethod
    def write_expenses(expenses: List[ExpenseDict]) -> None:
        """Write expenses to JSON file"""
        with open(DATA_FILE, "w") as f:
            json.dump(expenses, f, indent=2)
    
    @classmethod
    def get_all_expenses(cls) -> List[ExpenseDict]:
        """Get all expenses"""
        return cls.read_expenses()
    
    @classmethod
    def get_expense_by_id(cls, expense_id: str) -> Optional[ExpenseDict]:
        """Get expense by ID"""
        expenses = cls.read_expenses()
        for expense in expenses:
            if expense.get('id') == expense_id:
                return expense
        return None
    
    @classmethod
    def add_expense(cls, expense_data: Dict[str, Any]) -> ExpenseDict:
        """Add a new expense"""
        # Create new expense with ID and timestamp
        new_expense = {
            "id": str(uuid.uuid4()),
            "amount": float(expense_data['amount']),
            "category": expense_data['category'],
            "date": expense_data['date'],
            "description": expense_data['description'],
            "created_at": datetime.now().isoformat()
        }
        
        # Add to database
        expenses = cls.read_expenses()
        expenses.append(new_expense)
        cls.write_expenses(expenses)
        
        return new_expense
    
    @classmethod
    def delete_expense(cls, expense_id: str) -> bool:
        """Delete an expense by ID"""
        expenses = cls.read_expenses()
        initial_count = len(expenses)
        
        updated_expenses = [exp for exp in expenses if exp.get('id') != expense_id]
        
        if len(updated_expenses) == initial_count:
            # No expense was removed
            return False
        
        cls.write_expenses(updated_expenses)
        return True
    
    @classmethod
    def get_expenses_by_date_range(cls, start_date: date, end_date: Optional[date] = None) -> List[ExpenseDict]:
        """Get expenses within a date range"""
        expenses = cls.read_expenses()
        filtered_expenses = []
        
        for expense in expenses:
            expense_date = datetime.fromisoformat(expense['date']).date()
            if expense_date >= start_date and (end_date is None or expense_date <= end_date):
                filtered_expenses.append(expense)
        
        return filtered_expenses
    
    @classmethod
    def get_expenses_by_category(cls, category: str) -> List[ExpenseDict]:
        """Get expenses by category"""
        expenses = cls.read_expenses()
        return [exp for exp in expenses if exp.get('category') == category]
    
    @classmethod
    def get_total_by_category(cls) -> Dict[str, float]:
        """Get total expenses by category"""
        expenses = cls.read_expenses()
        totals = {}
        
        for expense in expenses:
            category = expense.get('category')
            amount = expense.get('amount', 0)
            
            if category in totals:
                totals[category] += amount
            else:
                totals[category] = amount
        
        return totals
    
    @classmethod
    def clear_all_expenses(cls) -> None:
        """Clear all expenses (for testing/resetting)"""
        cls.write_expenses([])

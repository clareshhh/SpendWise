from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime
import os
import traceback

app = Flask(__name__)

DATA_FILE = 'expenses.json'

def load_expenses():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_expenses(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def home():
    return render_template('index.html')

# ✅ Route used by frontend JavaScript
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    return jsonify(load_expenses())

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    try:
        data = request.json
        expenses = load_expenses()
        data['id'] = len(expenses) + 1
        data['date'] = datetime.strptime(data['date'], '%Y-%m-%d').strftime('%b %d')
        expenses.append(data)
        save_expenses(expenses)
        return jsonify({'message': 'Expense saved'}), 201
    except Exception as e:
        print("Error adding expense:", e)
        traceback.print_exc()
        return jsonify({'error': 'Something went wrong'}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    expenses = load_expenses()
    expenses = [e for e in expenses if e['id'] != expense_id]
    save_expenses(expenses)
    return jsonify({'message': 'Deleted'}), 200

if __name__ == '__main__':
    app.run(debug=True)

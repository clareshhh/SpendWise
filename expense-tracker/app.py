from flask import Flask, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import uuid
from flask_cors import CORS
import logging
import hashlib
import secrets

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=".")
CORS(app)  # Enable CORS for all routes

# Ensure data directory exists
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "expenses.json")
CONFIG_FILE = os.path.join(DATA_DIR, "config.json")

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Initialize empty expenses file if it doesn't exist
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

# Initialize or load configuration
def init_config():
    if not os.path.exists(CONFIG_FILE):
        # Generate a default admin password
        default_password = "admin123"
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((default_password + salt).encode()).hexdigest()
        
        config = {
            "password_hash": password_hash,
            "salt": salt
        }
        
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
            
        logger.info(f"Created new config file with default password: {default_password}")
        return config
    else:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)

# Load or initialize config
config = init_config()

# Helper functions for expense management
def read_expenses():
    try:
        if not os.path.exists(DATA_FILE):
            logger.debug(f"Data file does not exist, returning empty list")
            return []
            
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            logger.debug(f"Read {len(data)} expenses from file")
            return data
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logger.error(f"Error reading expenses: {str(e)}")
        return []

def write_expenses(expenses):
    try:
        with open(DATA_FILE, "w") as f:
            json.dump(expenses, f, indent=2)
            logger.debug(f"Wrote {len(expenses)} expenses to file")
    except Exception as e:
        logger.error(f"Error writing expenses: {str(e)}")
        raise

def verify_password(password):
    salt = config["salt"]
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return password_hash == config["password_hash"]

def change_password(old_password, new_password):
    if not verify_password(old_password):
        return False
    
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((new_password + salt).encode()).hexdigest()
    
    config["password_hash"] = password_hash
    config["salt"] = salt
    
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    
    return True

# Serve static files
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# API endpoints
@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    expenses = read_expenses()
    return jsonify(expenses)

@app.route('/api/expenses', methods=['POST'])
def add_expense():
    data = request.json
    logger.debug(f"Received expense data: {data}")
    
    # Validate required fields
    required_fields = ['amount', 'category', 'date', 'description']
    for field in required_fields:
        if field not in data:
            logger.error(f"Missing required field: {field}")
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate amount is a positive number
    try:
        amount = float(data['amount'])
        if amount <= 0:
            logger.error("Amount must be positive")
            return jsonify({"error": "Amount must be positive"}), 400
    except ValueError:
        logger.error("Amount must be a number")
        return jsonify({"error": "Amount must be a number"}), 400
    
    # Create new expense
    new_expense = {
        "id": str(uuid.uuid4()),
        "amount": amount,
        "category": data['category'],
        "date": data['date'],
        "description": data['description'],
        "created_at": datetime.now().isoformat()
    }
    
    # Add to database
    expenses = read_expenses()
    expenses.append(new_expense)
    write_expenses(expenses)
    
    logger.debug(f"Added new expense: {new_expense}")
    return jsonify(new_expense), 201

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    data = request.json
    
    # Verify password
    if not data or 'password' not in data:
        return jsonify({"error": "Password is required"}), 400
    
    if not verify_password(data['password']):
        logger.warning(f"Failed password verification attempt for deleting expense {expense_id}")
        return jsonify({"error": "Incorrect password"}), 401
    
    expenses = read_expenses()
    initial_count = len(expenses)
    updated_expenses = [exp for exp in expenses if exp.get('id') != expense_id]
    
    if len(updated_expenses) == initial_count:
        return jsonify({"error": "Expense not found"}), 404
    
    write_expenses(updated_expenses)
    logger.info(f"Deleted expense {expense_id}")
    return jsonify({"message": "Expense deleted successfully"}), 200

# Change password endpoint
@app.route('/api/change-password', methods=['POST'])
def api_change_password():
    data = request.json
    
    if not data or 'oldPassword' not in data or 'newPassword' not in data:
        return jsonify({"error": "Old password and new password are required"}), 400
    
    if change_password(data['oldPassword'], data['newPassword']):
        return jsonify({"message": "Password changed successfully"}), 200
    else:
        return jsonify({"error": "Incorrect old password"}), 401

# Get default password (for initial setup)
@app.route('/api/default-password', methods=['GET'])
def get_default_password():
    # This endpoint is just for convenience in this demo
    # In a real application, you would not expose this
    return jsonify({"defaultPassword": "admin123"}), 200

# Clear all expenses (for testing/resetting)
@app.route('/api/expenses/clear', methods=['POST'])
def clear_expenses():
    data = request.json
    
    # Verify password
    if not data or 'password' not in data:
        return jsonify({"error": "Password is required"}), 400
    
    if not verify_password(data['password']):
        return jsonify({"error": "Incorrect password"}), 401
    
    write_expenses([])
    return jsonify({"message": "All expenses cleared"}), 200

if __name__ == '__main__':
    print("Starting Expense Tracker server...")
    print("Default admin password: admin123")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)

from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'

DB_FILE = 'users.db'

# Create users table if not exists
def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        conn.commit()

# Get user by email
def get_user_by_email(email):
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        return cursor.fetchone()

# Insert new user
def insert_user(name, email, password):
    hashed_password = generate_password_hash(password)
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, hashed_password))
        conn.commit()

@app.route('/')
def index():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    user = get_user_by_email(email)

    if user and check_password_hash(user[3], password):
        session['user'] = user[1]
        flash('Login successful!', 'success')
        return redirect(url_for('dashboard'))
    flash('Invalid email or password', 'error')
    return redirect(url_for('index'))

@app.route('/signup', methods=['POST'])
def signup():
    name = request.form['name']
    email = request.form['email']
    password = request.form['password']
    confirm = request.form['confirm']

    if get_user_by_email(email):
        flash('Email already exists', 'error')
        return redirect(url_for('index'))
    if password != confirm:
        flash('Passwords do not match', 'error')
        return redirect(url_for('index'))

    insert_user(name, email, password)
    flash('Account created successfully! You can now log in.', 'success')
    return redirect(url_for('index'))

@app.route('/forgot', methods=['POST'])
def forgot_password():
    email = request.form['email']
    user = get_user_by_email(email)

    if user:
        flash(f'Recovery link sent to {email} (simulated)', 'info')
    else:
        flash('Email not found', 'error')
    return redirect(url_for('index'))

@app.route('/dashboard')
def dashboard():
    if 'user' in session:
        return f"<h1>Welcome, {session['user']}!</h1><br><a href='/logout'>Logout</a>"
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.pop('user', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
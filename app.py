from flask import Flask, render_template, request, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'  # Add this before your route
# Data storage
DATA_FILE = 'family_data.json'
def load_data():
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {'people': [], 'nextId': 1}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

app.secret_key = 'your_secret_key'
# Initialize database
def init_db():
    with sqlite3.connect('database.db') as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        ''')

init_db()

# Home
@app.route('/')
def home():
    return redirect(url_for('login'))

# Register
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'])

        with sqlite3.connect('database.db') as conn:
            try:
                conn.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
                return redirect(url_for('login'))
            except sqlite3.IntegrityError:
                return "Username already exists."

    return render_template('register.html')

# Login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        with sqlite3.connect('database.db') as conn:
            cur = conn.cursor()
            cur.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cur.fetchone()

            if user and check_password_hash(user[2], password):
                session['user_id'] = user[0]
                session['username'] = user[1]
                return redirect(url_for('index'))
            else:
                return "Invalid username or password."

    return render_template('login.html')

# Dashboard (Protected Route)
@app.route('/index')
def index():
    if 'user_id' in session:
        return render_template('index.html', username=session['username'])
    return redirect(url_for('login'))

# Logout
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)


# API Endpoints
@app.route('/api/family', methods=['GET'])
def get_family():
    return jsonify(load_data())


@app.route('/api/family', methods=['POST'])
def save_family():
    data = request.get_json()
    save_data(data)
    return jsonify({'status': 'success'})


@app.route('/api/family/member', methods=['POST'])
def add_member():
    data = load_data()
    new_member = request.get_json()

    if 'id' not in new_member:
        new_member['id'] = str(data['nextId'])
        data['nextId'] += 1

    # Handle spouse relationship if adding spouse
    if 'spouseId' in new_member and new_member['spouseId']:
        spouse_id = new_member['spouseId']
        for person in data['people']:
            if person['id'] == spouse_id:
                person['spouseId'] = new_member['id']
                break

    data['people'].append(new_member)
    save_data(data)
    return jsonify({'status': 'success', 'id': new_member['id']})


@app.route('/api/family/member/<member_id>', methods=['PUT'])
def update_member(member_id):
    data = load_data()
    updated_data = request.get_json()

    for i, person in enumerate(data['people']):
        if person['id'] == member_id:
            # Handle spouse relationship changes
            if 'spouseId' in updated_data:
                old_spouse = person.get('spouseId')
                new_spouse = updated_data['spouseId']

                # Remove old spouse relationship
                if old_spouse:
                    for p in data['people']:
                        if p['id'] == old_spouse and p.get('spouseId') == member_id:
                            p['spouseId'] = None
                            break

                # Add new spouse relationship
                if new_spouse:
                    for p in data['people']:
                        if p['id'] == new_spouse:
                            p['spouseId'] = member_id
                            break

            data['people'][i] = {**person, **updated_data}
            save_data(data)
            return jsonify({'status': 'success'})

    return jsonify({'status': 'error', 'message': 'Member not found'}), 404


@app.route('/api/family/member/<member_id>', methods=['DELETE'])
def delete_member(member_id):
    data = load_data()

    # Find the member to delete
    member_to_delete = None
    for person in data['people']:
        if person['id'] == member_id:
            member_to_delete = person
            break

    if not member_to_delete:
        return jsonify({'status': 'error', 'message': 'Member not found'}), 404

    # Remove spouse reference if exists
    if member_to_delete.get('spouseId'):
        spouse_id = member_to_delete['spouseId']
        for person in data['people']:
            if person['id'] == spouse_id and person.get('spouseId') == member_id:
                person['spouseId'] = None
                break

    # Remove the member
    data['people'] = [p for p in data['people'] if p['id'] != member_id]
    save_data(data)
    return jsonify({'status': 'success'})

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
    if file and file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        filename = f"{datetime.now().timestamp()}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({
            'status': 'success',
            'url': f"/uploads/{filename}"
        })
    return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400

@app.route('/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
@app.route('/charts')
def charts():
    if 'user_id' in session:
        return render_template('charts.html')
    return redirect(url_for('login'))

@app.route('/events')
def events():
    return render_template('events.html')

if __name__ == '__main__':
    app.run(debug=True)

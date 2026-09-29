import sqlite3
import os
import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'satquery.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            fullname TEXT,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Conversations Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')

    # 3. Messages Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            image_data TEXT,
            model TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
    ''')

    # Create default demo user safely (INSERT OR IGNORE prevents Gunicorn multi-worker race conditions)
    try:
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, email, fullname, password_hash)
            VALUES (?, ?, ?, ?)
        ''', ('Explorer', 'explorer@satquery.ai', 'Space Explorer', generate_password_hash('password123')))
        conn.commit()
    except Exception as e:
        print(f"[DB Init Note]: {e}")
    finally:
        conn.close()


# ==========================================
# User Management Helpers
# ==========================================

def get_user_by_email(email):
    if not email:
        return None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, fullname FROM users WHERE email = ?', (email.strip().lower(),))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None


def get_user_by_username(username):
    if not username:
        return None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, fullname FROM users WHERE username = ?', (username.strip(),))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None


def create_user(username, email, fullname, password):
    conn = get_db()
    cursor = conn.cursor()
    
    e = (email or '').strip().lower()
    if not e:
        conn.close()
        return None

    # Check if email is already registered
    cursor.execute('SELECT id FROM users WHERE email = ?', (e,))
    if cursor.fetchone():
        conn.close()
        return None  # Email already exists

    # Ensure unique username
    base_u = (username or '').strip() or e.split('@')[0]
    u = base_u
    counter = 1
    while True:
        cursor.execute('SELECT id FROM users WHERE username = ?', (u,))
        if not cursor.fetchone():
            break
        u = f"{base_u}{counter}"
        counter += 1

    f = (fullname or '').strip() or u
    password_hash = generate_password_hash(password or 'password123')

    try:
        cursor.execute('''
            INSERT INTO users (username, email, fullname, password_hash)
            VALUES (?, ?, ?, ?)
        ''', (u, e, f, password_hash))
        conn.commit()
        user_id = cursor.lastrowid
        return {
            'id': user_id,
            'username': u,
            'email': e,
            'fullname': f
        }
    except Exception as err:
        print('Error creating user in SQLite:', err)
        return None
    finally:
        conn.close()


def authenticate_user(identifier, password):
    if not identifier or not password:
        return None
    conn = get_db()
    cursor = conn.cursor()
    ident = identifier.strip()
    cursor.execute('''
        SELECT * FROM users
        WHERE username = ? OR email = ?
    ''', (ident, ident.lower()))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        return {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'fullname': user['fullname']
        }
    return None


def get_user_by_id(user_id):
    if not user_id:
        return None
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, fullname FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return dict(user)
    return None


# ==========================================
# Conversation Management Helpers
# ==========================================

def create_conversation(user_id, title='New Satellite Chat'):
    conv_id = 'c_' + uuid.uuid4().hex[:12]
    clean_title = (title or 'New Satellite Chat').strip() or 'New Satellite Chat'
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO conversations (id, user_id, title, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ''', (conv_id, user_id, clean_title))
    conn.commit()
    conn.close()
    return conv_id


def get_user_conversations(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.id, c.title, c.created_at, c.updated_at,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message,
               (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) as last_message_time
        FROM conversations c
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
    ''', (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_conversation(conv_id, user_id=None):
    if not conv_id:
        return None
    conn = get_db()
    cursor = conn.cursor()
    if user_id is not None:
        cursor.execute('SELECT * FROM conversations WHERE id = ? AND user_id = ?', (conv_id, user_id))
    else:
        cursor.execute('SELECT * FROM conversations WHERE id = ?', (conv_id,))
    conv = cursor.fetchone()
    conn.close()
    if conv:
        return dict(conv)
    return None


def update_conversation_title(conv_id, title):
    if not conv_id:
        return
    clean_title = (title or 'New Satellite Chat').strip()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE conversations
        SET title = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (clean_title, conv_id))
    conn.commit()
    conn.close()



def touch_conversation(conv_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', (conv_id,))
    conn.commit()
    conn.close()


def delete_conversation(conv_id, user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM conversations WHERE id = ? AND user_id = ?', (conv_id, user_id))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


# ==========================================
# Message Management Helpers
# ==========================================

def add_message(conv_id, role, content, image_data=None, model=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (conversation_id, role, content, image_data, model, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ''', (conv_id, role, content, image_data, model))
    msg_id = cursor.lastrowid
    cursor.execute('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', (conv_id,))
    conn.commit()
    conn.close()
    return msg_id


def get_conversation_messages(conv_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, conversation_id, role, content, image_data, model, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
    ''', (conv_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


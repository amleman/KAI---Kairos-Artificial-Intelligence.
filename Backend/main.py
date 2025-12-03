from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app)


Usuarios = "usuarios.db"

# Crea la tabla de usuarios si no existe con SQLite
def init_db():
    conn = sqlite3.connect(Usuarios)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Función para hashear contraseñas
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.post("/register")
def register():
    data = request.get_json()
    usuario = data.get("usuario")
    email = data.get("email")
    password = data.get("password")

    if not usuario or not email or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        conn = sqlite3.connect(Usuarios)
        cursor = conn.cursor()
        
        # Hashear la contraseña
        hashed_password = hash_password(password)
        
        cursor.execute(
            "INSERT INTO usuarios (usuario, email, password) VALUES (?, ?, ?)",
            (usuario, email, hashed_password)
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Usuario registrado exitosamente"}), 201
    
    except sqlite3.IntegrityError:
        return jsonify({"error": "El usuario o email ya existe"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.post("/login")
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    password = data.get("password")

    if not usuario or not password:
        return jsonify({"error": "Usuario y contraseña requeridos"}), 400

    try:
        conn = sqlite3.connect(Usuarios)
        cursor = conn.cursor()
        
        # Hashear la contraseña ingresada
        hashed_password = hash_password(password)
        
        # Buscar usuario
        cursor.execute(
            "SELECT * FROM usuarios WHERE usuario = ? AND password = ?",
            (usuario, hashed_password)
        )
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return jsonify({"message": "Login correcto"}), 200
        else:
            return jsonify({"error": "Credenciales incorrectas"}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    init_db()  # Crear la base de datos al iniciar
    app.run(debug=True, port=8000)
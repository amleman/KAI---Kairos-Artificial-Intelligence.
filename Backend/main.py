from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import hashlib
import os
from motor_generador import GeneradorHorarios
import pandas as pd

app = Flask(__name__)
app.config["PROPAGATE_EXCEPTIONS"] = True
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DB = "usuarios.db"


# -----------------------------------------------------------
# INIT DATABASE
# -----------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    # Usuarios
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Info usuario
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            carne TEXT,
            fecha_nacimiento TEXT,
            carrera TEXT
        )
    """)

    # Cursos aprobados
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursos_aprobados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carne TEXT,
            codigo TEXT,
            nota REAL DEFAULT NULL
        )
    """)

    conn.commit()
    conn.close()


# -----------------------------------------------------------
# PASSWORD HASH
# -----------------------------------------------------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# -----------------------------------------------------------
# REGISTER
# -----------------------------------------------------------
@app.post("/register")
def register():
    data = request.get_json()
    usuario = data.get("usuario")
    email = data.get("email")
    password = data.get("password")

    if not usuario or not email or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO usuarios (usuario, email, password) VALUES (?, ?, ?)",
            (usuario, email, hash_password(password))
        )
        conn.commit()
        conn.close()

        return jsonify({"message": "Usuario registrado exitosamente"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "Usuario o email ya existe"}), 400


# -----------------------------------------------------------
# LOGIN
# -----------------------------------------------------------
@app.post("/login")
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    password = data.get("password")

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM usuarios WHERE usuario = ? AND password = ?",
        (usuario, hash_password(password))
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"message": "Login correcto"}), 200

    return jsonify({"error": "Credenciales incorrectas"}), 400


# -----------------------------------------------------------
# GUARDAR INFO DEL ESTUDIANTE
# -----------------------------------------------------------
@app.post("/guardar_usuario_info")
def guardar_usuario_info():
    data = request.get_json()
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO usuarios_info (nombre, carne, fecha_nacimiento, carrera)
        VALUES (?, ?, ?, ?)
    """, (data["nombre"], data["carne"], data["fechaNacimiento"], data["carrera"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Guardado"}), 200


# -----------------------------------------------------------
# GUARDAR CURSOS APROBADOS (SIN NOTA)
# -----------------------------------------------------------
@app.post("/guardar_aprobados")
def guardar_aprobados():
    data = request.get_json()

    carne = data.get("carne")
    aprobados = data.get("aprobados", [])

    print("📥 RECIBIDO:", carne, aprobados)

    if not carne:
        return jsonify({"error": "carne requerido"}), 400

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    # Limpio previos
    cursor.execute("DELETE FROM cursos_aprobados WHERE carne = ?", (carne,))

    # Insertar siempre como STRING
    for codigo in aprobados:
        if not codigo:
            continue  # evitar None o vacío

        codigo_str = str(codigo).zfill(4)  # Ej: "12" → "0012"

        cursor.execute(
            "INSERT INTO cursos_aprobados (carne, codigo) VALUES (?, ?)",
            (carne, codigo_str)
        )

    conn.commit()
    conn.close()

    return jsonify({"message": "Aprobados guardados"}), 200


# -----------------------------------------------------------
# GUARDAR NOTAS EN CURSOS APROBADOS
# -----------------------------------------------------------
@app.post("/guardar_notas")
def guardar_notas():
    data = request.get_json()
    carne = data["carne"]
    notas = data["notas"]  # [{codigo, nota}]

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    for item in notas:
        cursor.execute("""
            UPDATE cursos_aprobados 
            SET nota = ?
            WHERE carne = ? AND codigo = ?
        """, (item["nota"], carne, item["codigo"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Notas guardadas"}), 200


# -----------------------------------------------------------
# OBTENER CURSOS APROBADOS + INFO COMPLETA (para tabs)
# -----------------------------------------------------------
@app.get("/aprobados/<carne>")
def obtener_aprobados(carne):
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute("SELECT codigo, nota FROM cursos_aprobados WHERE carne = ?", (carne,))
    rows = cursor.fetchall()
    conn.close()

    # Cargar CSV
    df = pd.read_csv("./data/pensum_sistemas.csv")

    salida = []

    for codigo, nota in rows:
        curso = df[df["codigo"] == codigo].to_dict(orient="records")[0]

        salida.append({
            "codigo": codigo,
            "nombre": curso["nombre_completo"],
            "creditos": curso["creditos"],
            "nota": nota,
            "obligatorio": curso.get("obligatorio", ""),
            "pre_requisitos": curso.get("pre_requisitos", "")
        })

    return jsonify(salida), 200


# -----------------------------------------------------------
# GENERADOR DE HORARIO (sin mock)
# -----------------------------------------------------------
@app.post("/generar_horario")
def generar_horario():
    data = request.get_json()
    carne = data["usuario"]

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute("SELECT codigo FROM cursos_aprobados WHERE carne = ?", (carne,))
    aprobados = [row[0] for row in cursor.fetchall()]
    conn.close()

    motor = GeneradorHorarios(
        "./data/pensum_sistemas.csv",
        "./data/cursos_oferta_limpio.csv"
    )

    resultados = motor.generar(aprobados)
    return jsonify({"horarios": resultados}), 200


# -----------------------------------------------------------
# RETORNAR PENSUM CSV
# -----------------------------------------------------------
@app.get("/pensum")
def obtener_pensum():
    ruta = os.path.join("data", "pensum_sistemas.csv")
    if not os.path.exists(ruta):
        return jsonify({"error": "Archivo no encontrado"}), 404
    return send_file(ruta, mimetype="text/csv")


# -----------------------------------------------------------
# MAIN
# -----------------------------------------------------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=8000)

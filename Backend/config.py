import os
import pandas as pd
from clustering_semaforo import crear_analizador
from optimizador_promedio import crear_optimizador
from chatbot_academico import crear_chatbot

# -------------------------
# Configuración Global
# -------------------------
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# -------------------------
# DATABASE CONFIGURATION
# -------------------------
# Detectar si estamos en producción (Cloud Run) o desarrollo local
DATABASE_URL = os.environ.get('DATABASE_URL')

# Si no hay DATABASE_URL, usar SQLite local
USE_POSTGRES = DATABASE_URL is not None

if USE_POSTGRES:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    print(f"🐘 Usando PostgreSQL: {DATABASE_URL[:30]}...")
else:
    import sqlite3
    DB = "usuarios.db"
    print("📁 Usando SQLite local: usuarios.db")

# Mapeo de carreras
CAREER_FILE_MAP = {
    "Ing. Sistemas": "sistemas.csv",
    "Ing. Civil": "civil.csv",
    "Ing. Industrial": "industrial.csv",
    "Ing. Mecánica": "mecanica.csv",
    "Ing. Electrónica": "electronica.csv",
    "Ing. Eléctrica": "electrica.csv",
    "Ing. Ambiental": "ambiental.csv",
    "Ing. Química": "quimica.csv",
    "Ing. Mecánica Industrial": "mecanica_industrial.csv",
    "Ing. Mecánica Eléctrica": "mecanica_electrica.csv",
}

# -------------------------
# Singletons de IA
# -------------------------
_analizador_carga = None
_optimizador_promedio = None
_chatbot_academico = None

def get_analizador_carga():
    global _analizador_carga
    if _analizador_carga is None:
        _analizador_carga = crear_analizador("./Data/Pensums/sistemas.csv")
    return _analizador_carga

def get_optimizador_promedio():
    global _optimizador_promedio
    if _optimizador_promedio is None:
        _optimizador_promedio = crear_optimizador("./Data/Pensums/sistemas.csv")
    return _optimizador_promedio

def get_chatbot_academico():
    global _chatbot_academico
    if _chatbot_academico is None:
        _chatbot_academico = crear_chatbot("./Data/Pensums/sistemas.csv")
    return _chatbot_academico

# -------------------------
# Cache Pensums
# -------------------------
PENSUM_LOOKUPS = {}

# -------------------------
# DB Helper Functions
# -------------------------

def get_db_connection():
    """
    Retorna una conexión a la base de datos.
    - En producción: PostgreSQL
    - En desarrollo: SQLite
    """
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(DB, timeout=20)
        conn.row_factory = sqlite3.Row
        return conn

def execute_query(cursor, query, params=None):
    """
    Ejecuta una query adaptando los placeholders según la DB.
    SQLite usa ? y PostgreSQL usa %s
    """
    if USE_POSTGRES:
        # Convertir ? a %s para PostgreSQL
        query = query.replace('?', '%s')
    
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    return cursor

def init_db():
    """Inicializa todas las tablas necesarias."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if USE_POSTGRES:
        # PostgreSQL Schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                usuario TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                rol TEXT DEFAULT 'user',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios_info (
                id SERIAL PRIMARY KEY,
                usuario TEXT UNIQUE,
                nombre TEXT,
                carne TEXT UNIQUE,
                fecha_nacimiento TEXT,
                carrera TEXT,
                foto_perfil TEXT,
                foto_banner TEXT,
                plan TEXT DEFAULT 'free',
                plan_fecha_inicio TEXT,
                plan_fecha_fin TEXT,
                chatbot_count_today INTEGER DEFAULT 0,
                chatbot_last_reset TEXT,
                generador_count INTEGER DEFAULT 0,
                ocr_count INTEGER DEFAULT 0
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cursos_aprobados (
                id SERIAL PRIMARY KEY,
                carne TEXT UNIQUE,
                cursos_data TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS horarios_guardados (
                id SERIAL PRIMARY KEY,
                usuario TEXT,
                nombre_horario TEXT,
                data_json TEXT,
                fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    else:
        # SQLite Schema
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                rol TEXT DEFAULT 'user',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT UNIQUE,
                nombre TEXT,
                carne TEXT UNIQUE,
                fecha_nacimiento TEXT,
                carrera TEXT,
                foto_perfil TEXT,
                foto_banner TEXT,
                plan TEXT DEFAULT 'free',
                plan_fecha_inicio TEXT,
                plan_fecha_fin TEXT,
                chatbot_count_today INTEGER DEFAULT 0,
                chatbot_last_reset TEXT,
                generador_count INTEGER DEFAULT 0,
                ocr_count INTEGER DEFAULT 0
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cursos_aprobados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carne TEXT UNIQUE,
                cursos_data TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS horarios_guardados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT,
                nombre_horario TEXT,
                data_json TEXT,
                fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    conn.commit()
    conn.close()
    print("✅ Base de datos inicializada correctamente")

def get_user_career(carne):
    """Auxiliary to get user career from DB"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        execute_query(cursor, "SELECT carrera FROM usuarios_info WHERE carne = ?", (carne,))
        row = cursor.fetchone()
        conn.close()
        if row:
            # Manejar tanto dict (PostgreSQL) como tuple/Row (SQLite)
            if hasattr(row, 'keys'):
                return row['carrera']
            return row[0]
    except Exception as e:
        print(f"Error getting user career: {e}")
    return "Ing. Sistemas"

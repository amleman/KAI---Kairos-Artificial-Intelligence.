import os
import sqlite3
import pandas as pd
from clustering_semaforo import crear_analizador
from optimizador_promedio import crear_optimizador
from chatbot_academico import crear_chatbot

# Configuración Global
DB = "usuarios.db"
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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
        # Default a sistemas si no hay otro, o lógica más compleja
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
def cargar_pensums_lookup():
    lookups = {}
    pensums_dir = "./Data/Pensums/"
    
    for carrera, filename in CAREER_FILE_MAP.items():
        path = os.path.join(pensums_dir, filename)
        if not os.path.exists(path):
            continue
            
        try:
            df = pd.read_csv(path)
            career_lookup = {}
            for _, row in df.iterrows():
                codigo = str(row.get("codigo", "")).zfill(4)
                
                # Manejo seguro de créditos (puede ser NaN o vacío)
                creditos_val = row.get("creditos", 3)
                try:
                    creditos = int(float(creditos_val)) if pd.notna(creditos_val) else 0
                except:
                    creditos = 0
                    
                career_lookup[codigo] = {
                    "nombre": str(row.get("nombre_completo", row.get("nombre", ""))),
                    "creditos": creditos,
                }
            lookups[carrera] = career_lookup
        except Exception as e:
            print(f"Error cargando pensum {carrera}: {e}")
            
    return lookups

PENSUM_LOOKUPS = cargar_pensums_lookup()

# -------------------------
# DB Helper
# -------------------------
def init_db():
    conn = sqlite3.connect(DB, timeout=20)
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
            usuario TEXT UNIQUE,
            nombre TEXT,
            carne TEXT UNIQUE,
            fecha_nacimiento TEXT,
            carrera TEXT,
            foto_perfil TEXT,
            foto_banner TEXT
        )
    """)

    # Cursos aprobados
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursos_aprobados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carne TEXT UNIQUE,
            cursos_data TEXT
        )
    """)
    
    # Horarios elegidos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS horarios_guardados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT,
            nombre_horario TEXT,
            data_json TEXT,
            fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(usuario) REFERENCES usuarios(usuario) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB, timeout=20)
    conn.row_factory = sqlite3.Row
    return conn

def get_user_career(carne):
    """Auxiliary to get user career from DB"""
    try:
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        cursor.execute("SELECT carrera FROM usuarios_info WHERE carne = ?", (carne,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0]
    except:
        pass
    return "Ing. Sistemas"

"""
Script para inicializar la base de datos con la estructura correcta
"""
import sqlite3

DB = "usuarios.db"

def inicializar_base_datos():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    # Tabla de usuarios (login)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT
        )
    """)

    # Tabla de información del usuario
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios_info (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE,
            nombre TEXT,
            carne TEXT UNIQUE,
            fecha_nacimiento TEXT,
            carrera TEXT,
            plan TEXT DEFAULT 'free',
            plan_fecha_inicio TEXT,
            plan_fecha_fin TEXT,
            chatbot_count_today INTEGER DEFAULT 0,
            chatbot_last_reset TEXT,
            generador_count INTEGER DEFAULT 0,
            ocr_count INTEGER DEFAULT 0
        )
    """)

    # Tabla de cursos aprobados - NUEVA ESTRUCTURA
    # Una fila por usuario, lista de cursos en formato texto
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursos_aprobados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carne TEXT UNIQUE,
            cursos_data TEXT
        )
    """)
    
    # Tabla temporal para migración (si ya existe la vieja estructura)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursos_aprobados_old (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carne TEXT,
            codigo TEXT,
            nota REAL DEFAULT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("✓ Base de datos inicializada correctamente")
    print(f"✓ Archivo: {DB}")

if __name__ == "__main__":
    inicializar_base_datos()

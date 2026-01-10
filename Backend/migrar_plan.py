"""
Script de migración para agregar campos de plan a usuarios existentes.
"""
from config import get_db_connection, execute_query, USE_POSTGRES

def migrar():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Lista de columnas a agregar si no existen
    columnas_nuevas = [
        ("plan", "TEXT DEFAULT 'free'"),
        ("plan_fecha_inicio", "TEXT"),
        ("plan_fecha_fin", "TEXT"),
        ("chatbot_count_today", "INTEGER DEFAULT 0"),
        ("chatbot_last_reset", "TEXT"),
        ("generador_count", "INTEGER DEFAULT 0"),
        ("ocr_count", "INTEGER DEFAULT 0")
    ]
    
    for col_name, col_def in columnas_nuevas:
        try:
            if USE_POSTGRES:
                # PostgreSQL syntax
                execute_query(cursor, f"ALTER TABLE usuarios_info ADD COLUMN IF NOT EXISTS {col_name} {col_def}")
            else:
                # SQLite syntax (no tiene IF NOT EXISTS para columnas)
                execute_query(cursor, f"ALTER TABLE usuarios_info ADD COLUMN {col_name} {col_def}")
            print(f"✅ Columna {col_name} agregada")
        except Exception as e:
            if "duplicate" in str(e).lower() or "already exists" in str(e).lower():
                print(f"⏭️ Columna {col_name} ya existe")
            else:
                print(f"⚠️ Error con {col_name}: {e}")
    
    conn.commit()
    conn.close()
    print("\n✅ Migración completada")

if __name__ == "__main__":
    migrar()

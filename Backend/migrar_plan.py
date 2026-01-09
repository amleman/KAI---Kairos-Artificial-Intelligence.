"""
Script de migración para agregar campos de suscripción a usuarios_info
Ejecutar una sola vez: python migrar_plan.py
"""
import sqlite3

DB = "usuarios.db"

def migrar():
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    # Lista de columnas nuevas a agregar
    nuevas_columnas = [
        ("plan", "TEXT DEFAULT 'free'"),
        ("plan_fecha_inicio", "TEXT"),
        ("plan_fecha_fin", "TEXT"),
        ("chatbot_count_today", "INTEGER DEFAULT 0"),
        ("chatbot_last_reset", "TEXT"),
        ("generador_count", "INTEGER DEFAULT 0"),
        ("ocr_count", "INTEGER DEFAULT 0")
    ]
    
    for nombre_columna, tipo in nuevas_columnas:
        try:
            cursor.execute(f"ALTER TABLE usuarios_info ADD COLUMN {nombre_columna} {tipo}")
            print(f"✓ Columna '{nombre_columna}' agregada exitosamente")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"⚠ Columna '{nombre_columna}' ya existe, omitiendo...")
            else:
                print(f"✗ Error al agregar '{nombre_columna}': {e}")
    
    # Actualizar usuarios existentes que no tienen plan definido
    cursor.execute("UPDATE usuarios_info SET plan = 'free' WHERE plan IS NULL")
    affected = cursor.rowcount
    if affected > 0:
        print(f"✓ {affected} usuarios actualizados a plan 'free'")
    
    conn.commit()
    conn.close()
    print("\n✓ Migración completada")

if __name__ == "__main__":
    migrar()

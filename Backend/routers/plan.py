"""
Router para manejo de planes de suscripción
"""
from flask import Blueprint, request, jsonify
import sqlite3
from datetime import datetime, timedelta
from config import DB, get_db_connection

plan_bp = Blueprint('plan', __name__)

# -----------------------------------------------------------
# CONFIGURACIÓN DE PLANES
# -----------------------------------------------------------
PLANES_CONFIG = {
    "free": {
        "nombre": "Plan Gratuito",
        "precio": 0,
        "chatbot_limite_diario": 5,
        "generador_manual_limite": 3,  # 3 horarios manuales por semestre
        "generador_ia_limite": 0,      # Sin acceso a generador IA
        "ocr_limite": 2,               # 2 escaneos OCR totales
        "tiene_analisis_financiero": True,  # Gratis para motivar estudiantes
        "tiene_optimizador": True,          # Gratis
        "tiene_simulador": False,           # Solo Premium
        "tiene_pensum_grafo": False         # Solo Premium
    },
    "daily": {
        "nombre": "Day Pass",
        "precio": 10,
        "duracion_horas": 24,
        "chatbot_limite_diario": -1,   # Ilimitado
        "generador_manual_limite": -1, # Ilimitado
        "generador_ia_limite": -1,     # Ilimitado (IA)
        "ocr_limite": -1,              # Ilimitado
        "tiene_analisis_financiero": True,
        "tiene_optimizador": True,
        "tiene_simulador": True,
        "tiene_pensum_grafo": True
    },
    "premium": {
        "nombre": "Premium",
        "precio": 29,
        "chatbot_limite_diario": -1,   # Ilimitado
        "generador_manual_limite": -1, # Ilimitado
        "generador_ia_limite": -1,     # Ilimitado (IA)
        "ocr_limite": -1,              # Ilimitado
        "tiene_analisis_financiero": True,
        "tiene_optimizador": True,
        "tiene_simulador": True,       # Simulador de escenarios
        "tiene_pensum_grafo": True     # Vista grafo del pensum
    }
}

# -----------------------------------------------------------
# OBTENER PLAN DEL USUARIO
# -----------------------------------------------------------
@plan_bp.route("/api/plan/<usuario>", methods=['GET'])
def obtener_plan(usuario):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT plan, plan_fecha_inicio, plan_fecha_fin, 
                   chatbot_count_today, chatbot_last_reset,
                   generador_count, ocr_count
            FROM usuarios_info WHERE usuario = ?
        """, (usuario,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        plan = row[0] or "free"
        fecha_fin = row[2]
        
        # Verificar si el plan expiró (soporta fecha o datetime)
        if fecha_fin:
            try:
                # Intentar primero con datetime completo (para day pass)
                try:
                    expiracion = datetime.strptime(fecha_fin, "%Y-%m-%d %H:%M:%S")
                except:
                    # Si falla, intentar solo fecha
                    expiracion = datetime.strptime(fecha_fin, "%Y-%m-%d")
                
                if expiracion < datetime.now():
                    # Plan expirado, regresar a free
                    cursor.execute("""
                        UPDATE usuarios_info 
                        SET plan = 'free', plan_fecha_fin = NULL 
                        WHERE usuario = ?
                    """, (usuario,))
                    conn.commit()
                    plan = "free"
                    fecha_fin = None
            except:
                pass
        
        # Resetear contador de chatbot si es nuevo día
        hoy = datetime.now().strftime("%Y-%m-%d")
        ultimo_reset = row[4]
        chatbot_count = row[3] or 0
        
        if ultimo_reset != hoy:
            cursor.execute("""
                UPDATE usuarios_info 
                SET chatbot_count_today = 0, chatbot_last_reset = ?
                WHERE usuario = ?
            """, (hoy, usuario))
            conn.commit()
            chatbot_count = 0
        
        config = PLANES_CONFIG.get(plan, PLANES_CONFIG["free"])
        
        return jsonify({
            "plan": plan,
            "nombre_plan": config["nombre"],
            "precio": config["precio"],
            "fecha_inicio": row[1],
            "fecha_fin": fecha_fin,
            "limites": {
                "chatbot_diario": config["chatbot_limite_diario"],
                "chatbot_usado": chatbot_count,
                "generador_manual_total": config["generador_manual_limite"],
                "generador_ia_total": config["generador_ia_limite"],
                "generador_usado": row[5] or 0,
                "ocr_total": config["ocr_limite"],
                "ocr_usado": row[6] or 0
            },
            "features": {
                "analisis_financiero": config["tiene_analisis_financiero"],
                "optimizador": config["tiene_optimizador"],
                "simulador": config["tiene_simulador"],
                "pensum_grafo": config["tiene_pensum_grafo"]
            }
        })
    finally:
        conn.close()

# -----------------------------------------------------------
# VERIFICAR SI PUEDE USAR FEATURE
# -----------------------------------------------------------
@plan_bp.route("/api/plan/<usuario>/verificar/<feature>", methods=['GET'])
def verificar_feature(usuario, feature):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT plan, chatbot_count_today, chatbot_last_reset,
                   generador_count, ocr_count
            FROM usuarios_info WHERE usuario = ?
        """, (usuario,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"permitido": False, "razon": "Usuario no encontrado"}), 404
        
        plan = row[0] or "free"
        config = PLANES_CONFIG.get(plan, PLANES_CONFIG["free"])
        
        hoy = datetime.now().strftime("%Y-%m-%d")
        
        if feature == "chatbot":
            limite = config["chatbot_limite_diario"]
            if limite == -1:
                return jsonify({"permitido": True})
            
            # Resetear si es nuevo día
            if row[2] != hoy:
                cursor.execute("""
                    UPDATE usuarios_info 
                    SET chatbot_count_today = 0, chatbot_last_reset = ?
                    WHERE usuario = ?
                """, (hoy, usuario))
                conn.commit()
                usado = 0
            else:
                usado = row[1] or 0
            
            if usado >= limite:
                return jsonify({
                    "permitido": False,
                    "razon": f"Has alcanzado tu límite de {limite} mensajes diarios",
                    "limite": limite,
                    "usado": usado
                })
            return jsonify({"permitido": True, "restante": limite - usado})
        
        elif feature == "generador_manual":
            limite = config["generador_manual_limite"]
            if limite == -1:
                return jsonify({"permitido": True})
            usado = row[3] or 0
            if usado >= limite:
                return jsonify({
                    "permitido": False,
                    "razon": f"Has alcanzado tu límite de {limite} horarios manuales",
                    "limite": limite,
                    "usado": usado
                })
            return jsonify({"permitido": True, "restante": limite - usado})
        
        elif feature == "generador_ia":
            limite = config["generador_ia_limite"]
            if limite == -1:
                return jsonify({"permitido": True})
            if limite == 0:
                return jsonify({
                    "permitido": False,
                    "razon": "El generador de horarios con IA está disponible en el plan Premium",
                    "requiere_premium": True
                })
            return jsonify({"permitido": True})
        
        elif feature == "ocr":
            limite = config["ocr_limite"]
            if limite == -1:
                return jsonify({"permitido": True})
            usado = row[4] or 0
            if usado >= limite:
                return jsonify({
                    "permitido": False,
                    "razon": f"Has alcanzado tu límite de {limite} escaneos OCR",
                    "limite": limite,
                    "usado": usado
                })
            return jsonify({"permitido": True, "restante": limite - usado})
        
        elif feature == "analisis_financiero":
            # Ahora es gratis para todos
            return jsonify({"permitido": True})
        
        elif feature == "optimizador":
            # Ahora es gratis para todos
            return jsonify({"permitido": True})
        
        elif feature == "simulador":
            if not config["tiene_simulador"]:
                return jsonify({
                    "permitido": False,
                    "razon": "El simulador de escenarios está disponible en el plan Premium",
                    "requiere_premium": True
                })
            return jsonify({"permitido": True})
        
        elif feature == "pensum_grafo":
            if not config["tiene_pensum_grafo"]:
                return jsonify({
                    "permitido": False,
                    "razon": "La vista del pensum en grafo está disponible en el plan Premium",
                    "requiere_premium": True
                })
            return jsonify({"permitido": True})
        
        return jsonify({"permitido": True})
    finally:
        conn.close()

# -----------------------------------------------------------
# INCREMENTAR CONTADOR DE USO
# -----------------------------------------------------------
@plan_bp.route("/api/plan/<usuario>/usar/<feature>", methods=['POST'])
def incrementar_uso(usuario, feature):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        if feature == "chatbot":
            hoy = datetime.now().strftime("%Y-%m-%d")
            cursor.execute("""
                UPDATE usuarios_info 
                SET chatbot_count_today = chatbot_count_today + 1,
                    chatbot_last_reset = ?
                WHERE usuario = ?
            """, (hoy, usuario))
        elif feature == "generador":
            cursor.execute("""
                UPDATE usuarios_info 
                SET generador_count = generador_count + 1
                WHERE usuario = ?
            """, (usuario,))
        elif feature == "ocr":
            cursor.execute("""
                UPDATE usuarios_info 
                SET ocr_count = ocr_count + 1
                WHERE usuario = ?
            """, (usuario,))
        
        conn.commit()
        return jsonify({"message": "Contador actualizado"})
    finally:
        conn.close()

# -----------------------------------------------------------
# ACTIVAR PLAN (para uso manual o después de pago)
# -----------------------------------------------------------
@plan_bp.route("/api/plan/<usuario>/activar", methods=['POST'])
def activar_plan(usuario):
    data = request.get_json()
    nuevo_plan = data.get("plan", "premium")
    duracion_meses = data.get("duracion_meses", 1)
    
    if nuevo_plan not in PLANES_CONFIG:
        return jsonify({"error": "Plan inválido"}), 400
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        fecha_inicio = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Day pass: 24 horas desde ahora
        if nuevo_plan == "daily":
            fecha_fin = (datetime.now() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        else:
            # Planes mensuales/semestrales
            fecha_fin = (datetime.now() + timedelta(days=duracion_meses * 30)).strftime("%Y-%m-%d")
        
        cursor.execute("""
            UPDATE usuarios_info 
            SET plan = ?, plan_fecha_inicio = ?, plan_fecha_fin = ?,
                generador_count = 0, ocr_count = 0
            WHERE usuario = ?
        """, (nuevo_plan, fecha_inicio, fecha_fin, usuario))
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Usuario no encontrado"}), 404
        
        conn.commit()
        
        return jsonify({
            "message": f"Plan {nuevo_plan} activado exitosamente",
            "plan": nuevo_plan,
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin
        })
    finally:
        conn.close()

# -----------------------------------------------------------
# OBTENER INFO DE PLANES DISPONIBLES
# -----------------------------------------------------------
@plan_bp.route("/api/planes", methods=['GET'])
def obtener_planes():
    return jsonify(PLANES_CONFIG)

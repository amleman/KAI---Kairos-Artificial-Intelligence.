"""
Router para manejo de planes de suscripción
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from config import get_db_connection, execute_query

plan_bp = Blueprint('plan', __name__)

PLANES_CONFIG = {
    "free": {
        "nombre": "Plan Gratuito",
        "precio": 0,
        "chatbot_limite_diario": 5,
        "generador_manual_limite": 3,
        "generador_ia_limite": 0,
        "ocr_limite": 1,  # 1 imagen por mes
        "tiene_analisis_financiero": True,
        "tiene_optimizador": True,
        "tiene_simulador": False,
        "tiene_pensum_grafo": False
    },
    "daily": {
        "nombre": "Day Pass",
        "precio": 10,
        "duracion_horas": 24,
        "chatbot_limite_diario": -1,
        "generador_manual_limite": -1,
        "generador_ia_limite": -1,
        "ocr_limite": -1,
        "tiene_analisis_financiero": True,
        "tiene_optimizador": True,
        "tiene_simulador": True,
        "tiene_pensum_grafo": True
    },
    "premium": {
        "nombre": "Premium",
        "precio": 29,
        "chatbot_limite_diario": -1,
        "generador_manual_limite": -1,
        "generador_ia_limite": -1,
        "ocr_limite": -1,
        "tiene_analisis_financiero": True,
        "tiene_optimizador": True,
        "tiene_simulador": True,
        "tiene_pensum_grafo": True
    }
}

@plan_bp.route("/plan/<usuario>", methods=['GET'])
def obtener_plan(usuario):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        print(f"DEBUG: Buscando plan para usuario/carne: {usuario}")
        execute_query(cursor, """
            SELECT plan, plan_fecha_inicio, plan_fecha_fin, 
                   chatbot_count_today, chatbot_last_reset,
                   generador_count, ocr_count, ocr_last_reset, generador_last_reset
            FROM usuarios_info 
            WHERE usuario = ? OR carne = ?
        """, (usuario, usuario)) # El parámetro 'usuario' puede ser el carnet en algunos componentes
        row = cursor.fetchone()
        
        if not row:
            print(f"DEBUG: No se encontró info en usuarios_info para {usuario}")
            return jsonify({"error": "Usuario no encontrado"}), 404
            
        # Extraer datos de la fila de forma unificada
        if hasattr(row, 'keys'):
            plan = (row['plan'] or "free").strip().lower()
            fecha_fin = row['plan_fecha_fin']
            fecha_inicio = row['plan_fecha_inicio']
            ultimo_reset = row['chatbot_last_reset']
            chatbot_count = row['chatbot_count_today'] or 0
            generador_usado = row['generador_count'] or 0
            ocr_usado = row['ocr_count'] or 0
            ocr_last_reset = row['ocr_last_reset']
            generador_last_reset = row['generador_last_reset']
        else:
            plan = (row[0] or "free").strip().lower()
            fecha_fin = row[2]
            fecha_inicio = row[1]
            ultimo_reset = row[4]
            chatbot_count = row[3] or 0
            generador_usado = row[5] or 0
            ocr_usado = row[6] or 0
            ocr_last_reset = row[7] if len(row) > 7 else None
            generador_last_reset = row[8] if len(row) > 8 else None
            
        print(f"DEBUG: Plan normalizado para {usuario}: '{plan}'")
        
        # Normalizar plan a minúsculas para evitar errores de case-sensitivity
        plan = plan.strip().lower()
        
        if fecha_fin:
            try:
                try:
                    expiracion = datetime.strptime(fecha_fin, "%Y-%m-%d %H:%M:%S")
                except:
                    expiracion = datetime.strptime(fecha_fin, "%Y-%m-%d")
                
                if expiracion < datetime.now():
                    execute_query(cursor, """
                        UPDATE usuarios_info 
                        SET plan = 'free', plan_fecha_fin = NULL 
                        WHERE usuario = ?
                    """, (usuario,))
                    conn.commit()
                    plan = "free"
                    fecha_fin = None
            except:
                pass
        
        hoy = datetime.now().strftime("%Y-%m-%d")
        if ultimo_reset != hoy:
            execute_query(cursor, """
                UPDATE usuarios_info 
                SET chatbot_count_today = 0, chatbot_last_reset = ?
                WHERE usuario = ?
            """, (hoy, usuario))
            conn.commit()
            chatbot_count = 0
        
        # Reset mensual de OCR
        mes_actual = datetime.now().strftime("%Y-%m")
        if ocr_last_reset is None or (ocr_last_reset and ocr_last_reset[:7] != mes_actual):
            execute_query(cursor, """
                UPDATE usuarios_info 
                SET ocr_count = 0, ocr_last_reset = ?
                WHERE usuario = ?
            """, (hoy, usuario))
            conn.commit()
            ocr_usado = 0
        
        # Reset semestral para generador (Semestre 1: Ene-May, Semestre 2: Jun-Dic)
        def get_semester(date_str):
            if not date_str:
                return None
            month = int(date_str[5:7]) if len(date_str) >= 7 else datetime.now().month
            year = date_str[:4] if len(date_str) >= 4 else str(datetime.now().year)
            return f"{year}-S1" if month <= 5 else f"{year}-S2"
        
        semestre_actual = get_semester(hoy)
        semestre_guardado = get_semester(generador_last_reset) if generador_last_reset else None
        
        if semestre_guardado != semestre_actual:
            execute_query(cursor, """
                UPDATE usuarios_info 
                SET generador_count = 0, generador_last_reset = ?
                WHERE usuario = ?
            """, (hoy, usuario))
            conn.commit()
            generador_usado = 0
        
        config = PLANES_CONFIG.get(plan, PLANES_CONFIG["free"])
        
        return jsonify({
            "plan": plan,
            "nombre_plan": config["nombre"],
            "precio": config["precio"],
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "limites": {
                "chatbot_diario": config["chatbot_limite_diario"],
                "chatbot_usado": chatbot_count,
                "generador_manual_total": config["generador_manual_limite"],
                "generador_ia_total": config["generador_ia_limite"],
                "generador_usado": generador_usado,
                "ocr_total": config["ocr_limite"],
                "ocr_usado": ocr_usado
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

@plan_bp.route("/plan/<usuario>/verificar/<feature>", methods=['GET'])
def verificar_feature(usuario, feature):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        execute_query(cursor, """
            SELECT plan, chatbot_count_today, chatbot_last_reset,
                   generador_count, ocr_count, ocr_last_reset, generador_last_reset
            FROM usuarios_info WHERE usuario = ?
        """, (usuario,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"permitido": False, "razon": "Usuario no encontrado"}), 404
        
        if hasattr(row, 'keys'):
            plan = row['plan'] or "free"
            chatbot_count = row['chatbot_count_today'] or 0
            ultimo_reset = row['chatbot_last_reset']
            generador_count = row['generador_count'] or 0
            ocr_count = row['ocr_count'] or 0
            ocr_last_reset = row['ocr_last_reset']
            generador_last_reset = row['generador_last_reset']
        else:
            plan = row[0] or "free"
            chatbot_count = row[1] or 0
            ultimo_reset = row[2]
            generador_count = row[3] or 0
            ocr_count = row[4] or 0
            ocr_last_reset = row[5] if len(row) > 5 else None
            generador_last_reset = row[6] if len(row) > 6 else None
        
        config = PLANES_CONFIG.get(plan, PLANES_CONFIG["free"])
        hoy = datetime.now().strftime("%Y-%m-%d")
        
        # Helper para obtener semestre
        def get_semester(date_str):
            if not date_str:
                return None
            month = int(date_str[5:7]) if len(date_str) >= 7 else datetime.now().month
            year = date_str[:4] if len(date_str) >= 4 else str(datetime.now().year)
            return f"{year}-S1" if month <= 5 else f"{year}-S2"
        
        if feature == "chatbot":
            limite = config["chatbot_limite_diario"]
            if limite == -1:
                return jsonify({"permitido": True})
            if ultimo_reset != hoy:
                execute_query(cursor, """
                    UPDATE usuarios_info 
                    SET chatbot_count_today = 0, chatbot_last_reset = ?
                    WHERE usuario = ?
                """, (hoy, usuario))
                conn.commit()
                usado = 0
            else:
                usado = chatbot_count
            if usado >= limite:
                return jsonify({
                    "permitido": False,
                    "razon": f"Has alcanzado tu límite de {limite} mensajes diarios",
                    "limite": limite, "usado": usado
                })
            return jsonify({"permitido": True, "restante": limite - usado})
        
        elif feature == "generador_manual":
            limite = config["generador_manual_limite"]
            if limite == -1:
                return jsonify({"permitido": True})
            
            # Reset semestral para generador
            semestre_actual = get_semester(hoy)
            semestre_guardado = get_semester(generador_last_reset) if generador_last_reset else None
            
            if semestre_guardado != semestre_actual:
                execute_query(cursor, """
                    UPDATE usuarios_info 
                    SET generador_count = 0, generador_last_reset = ?
                    WHERE usuario = ?
                """, (hoy, usuario))
                conn.commit()
                generador_count = 0
            
            if generador_count >= limite:
                return jsonify({
                    "permitido": False,
                    "razon": f"Has alcanzado tu límite de {limite} horarios este semestre",
                    "limite": limite, "usado": generador_count
                })
            return jsonify({"permitido": True, "restante": limite - generador_count})
        
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
            
            # Reset mensual para OCR
            hoy = datetime.now().strftime("%Y-%m-%d")
            mes_actual = datetime.now().strftime("%Y-%m")
            if ocr_last_reset is None or (ocr_last_reset and ocr_last_reset[:7] != mes_actual):
                execute_query(cursor, """
                    UPDATE usuarios_info 
                    SET ocr_count = 0, ocr_last_reset = ?
                    WHERE usuario = ?
                """, (hoy, usuario))
                conn.commit()
                ocr_count = 0
            
            if ocr_count >= limite:
                return jsonify({
                    "permitido": False,
                    "razon": f"Has alcanzado tu límite de {limite} escaneo OCR este mes",
                    "limite": limite, "usado": ocr_count
                })
            return jsonify({"permitido": True, "restante": limite - ocr_count})
        
        elif feature in ["analisis_financiero", "optimizador"]:
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

@plan_bp.route("/plan/<usuario>/usar/<feature>", methods=['POST'])
def incrementar_uso(usuario, feature):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if feature == "chatbot":
            hoy = datetime.now().strftime("%Y-%m-%d")
            execute_query(cursor, """
                UPDATE usuarios_info 
                SET chatbot_count_today = chatbot_count_today + 1, chatbot_last_reset = ?
                WHERE usuario = ?
            """, (hoy, usuario))
        elif feature == "generador":
            execute_query(cursor, """
                UPDATE usuarios_info SET generador_count = generador_count + 1 WHERE usuario = ?
            """, (usuario,))
        elif feature == "ocr":
            execute_query(cursor, """
                UPDATE usuarios_info SET ocr_count = ocr_count + 1 WHERE usuario = ?
            """, (usuario,))
        conn.commit()
        return jsonify({"message": "Contador actualizado"})
    finally:
        conn.close()

@plan_bp.route("/plan/<usuario>/activar", methods=['POST'])
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
        
        if nuevo_plan == "daily":
            fecha_fin = (datetime.now() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        else:
            fecha_fin = (datetime.now() + timedelta(days=duracion_meses * 30)).strftime("%Y-%m-%d")
        
        execute_query(cursor, """
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

@plan_bp.route("/planes", methods=['GET'])
def obtener_planes():
    return jsonify(PLANES_CONFIG)

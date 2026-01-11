from flask import Blueprint, request, jsonify
import json
from datetime import datetime
from config import get_chatbot_academico, get_db_connection, execute_query

chatbot_bp = Blueprint('chatbot', __name__)

# -----------------------------------------------------------
# CHATBOT ACADÉMICO (SIN APIs EXTERNAS)
# -----------------------------------------------------------

@chatbot_bp.route("/chatbot", methods=['POST'])
def chatbot():
    chatbot = get_chatbot_academico()
    data = request.get_json()
    pregunta = data.get("pregunta", "")
    usuario = data.get("usuario", "")
    
    if not pregunta:
        return jsonify({"error": "Debes proporcionar una pregunta"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # --- 1. VERIFICAR LÍMITES DE USO ---
    # Valores por defecto
    plan = 'free'
    count_today = 0
    last_reset = datetime.now().strftime('%Y-%m-%d')
    limit = 5  # Default Free limit
    
    if usuario:
        # Obtener info del usuario
        execute_query(cursor, "SELECT plan, chatbot_count_today, chatbot_last_reset FROM usuarios_info WHERE usuario = ? OR carne = ?", (usuario, usuario))
        user_info = cursor.fetchone()
        
        if user_info:
            plan = user_info['plan'] if hasattr(user_info, 'keys') else user_info[0]
            count_today = user_info['chatbot_count_today'] if hasattr(user_info, 'keys') else user_info[1]
            last_reset_str = user_info['chatbot_last_reset'] if hasattr(user_info, 'keys') else user_info[2]
            
            # Reset contador si es nuevo día
            today_str = datetime.now().strftime('%Y-%m-%d')
            if last_reset_str != today_str:
                count_today = 0
                execute_query(cursor, "UPDATE usuarios_info SET chatbot_count_today = 0, chatbot_last_reset = ? WHERE usuario = ? OR carne = ?", (today_str, usuario, usuario))
                conn.commit()
            
            # Definir límites
            if plan in ['premium', 'day_pass']:
                limit = 100
            else:
                limit = 5
        
        # Verificar si excedió límite
        if count_today >= limit:
            conn.close()
            return jsonify({
                "error": "Límite diario alcanzado", 
                "mensaje": f"Has alcanzado tu límite de {limit} consultas diarias. Actualiza a Premium para más."
            }), 403

    # --- 2. OBTENER CONTEXTO ---
    contexto = {}
    if usuario:
        contexto['usuario'] = usuario
        try:
            # Carrera
            execute_query(cursor, "SELECT carrera FROM usuarios_info WHERE usuario = ? OR carne = ?", (usuario, usuario))
            row_carrera = cursor.fetchone()
            if row_carrera:
                contexto['carrera'] = row_carrera['carrera'] if hasattr(row_carrera, 'keys') else row_carrera[0]

            # Cursos aprobados
            execute_query(cursor, "SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (usuario,))
            row_aprobados = cursor.fetchone()
            
            if row_aprobados:
                raw_data = row_aprobados['cursos_data'] if hasattr(row_aprobados, 'keys') else row_aprobados[0]
                if raw_data:
                    cursos_data = json.loads(raw_data)
                    contexto['cursos_aprobados'] = len(cursos_data)
                    contexto['creditos_acumulados'] = sum(int(c.get('creditos', 0)) for c in cursos_data)
                    contexto['lista_aprobados'] = cursos_data
        except Exception as e:
            print(f"Error contexto: {e}")

    # --- 3. GENERAR RESPUESTA ---
    resultado = chatbot.responder(pregunta, contexto)
    
    try:
        # --- 4. GUARDAR HISTORIAL Y ACTUALIZAR CONTADOR ---
        if usuario:
            # Guardar en chatbot_historial
            execute_query(cursor, """
                INSERT INTO chatbot_historial (usuario, pregunta, respuesta, intent, confianza)
                VALUES (?, ?, ?, ?, ?)
            """, (usuario, pregunta, resultado['respuesta'], resultado['intent'], resultado['confianza']))
            
            # Incrementar contador
            execute_query(cursor, "UPDATE usuarios_info SET chatbot_count_today = chatbot_count_today + 1 WHERE usuario = ? OR carne = ?", (usuario, usuario))
            conn.commit()
            
    except Exception as e:
        print(f"Error guardando historial: {e}")
    finally:
        conn.close()

    return jsonify({
        "pregunta": pregunta,
        "respuesta": resultado['respuesta'],
        "intent": resultado['intent'],
        "confianza": resultado['confianza'],
        "usage": {
            "current": count_today + 1,
            "limit": limit
        }
    }), 200

@chatbot_bp.route("/chatbot/historial/<usuario>", methods=['GET'])
def obtener_historial(usuario):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        execute_query(cursor, """
            SELECT pregunta, respuesta, fecha 
            FROM chatbot_historial 
            WHERE usuario = ? 
            ORDER BY fecha ASC
        """, (usuario,))
        
        rows = cursor.fetchall()
        historial = []
        
        for row in rows:
            # Adaptar acceso por índice o clave según DB
            if hasattr(row, 'keys'):
                 fecha_iso = row['fecha'].isoformat() if isinstance(row['fecha'], datetime) else str(row['fecha'])
                 historial.append({
                    "tipo": "usuario",
                    "texto": row['pregunta'],
                    "timestamp": fecha_iso
                })
                 historial.append({
                    "tipo": "bot",
                    "texto": row['respuesta'],
                    "timestamp": fecha_iso
                 })
            else:
                 fecha_str = str(row[2]) # SQLite devuelve string usualmente
                 historial.append({ "tipo": "usuario", "texto": row[0], "timestamp": fecha_str })
                 historial.append({ "tipo": "bot", "texto": row[1], "timestamp": fecha_str })
                 
        conn.close()
        return jsonify(historial), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chatbot_bp.route("/chatbot/ayuda", methods=['GET'])
def chatbot_ayuda():
    # Retorna información de ayuda sobre el chatbot
    return jsonify({
        "mensaje": "Chatbot Académico SIOA",
        "capacidades": [
            "Información de cursos (código, nombre, créditos, semestre)",
            "Prerrequisitos de cualquier curso",
            "Búsqueda de cursos por nombre o palabras clave",
            "Recomendaciones académicas generales"
        ],
        "ejemplos": [
            "¿Qué prerrequisitos tiene Compiladores?",
            "Cuántos créditos vale Redes 1?",
            "Información de programación 2",
            "¿En qué semestre se lleva Inteligencia Artificial?",
            "Buscar cursos de algoritmos"
        ]
    }), 200

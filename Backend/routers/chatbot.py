from flask import Blueprint, request, jsonify
import sqlite3
import json
from config import DB, get_chatbot_academico, get_db_connection

chatbot_bp = Blueprint('chatbot', __name__)

# -----------------------------------------------------------
# CHATBOT ACADÉMICO (SIN APIs EXTERNAS)
# -----------------------------------------------------------

@chatbot_bp.route("/chatbot", methods=['POST'])
def chatbot():
    # Responde preguntas del usuario usando intents locales (sin APIs)
    chatbot = get_chatbot_academico()
    
    data = request.get_json()
    pregunta = data.get("pregunta", "")
    usuario = data.get("usuario", "")
    
    if not pregunta:
        return jsonify({"error": "Debes proporcionar una pregunta"}), 400
    
    # Obtener contexto del usuario si está disponible
    contexto = {}
    if usuario:
        contexto['usuario'] = usuario
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (usuario,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                if row[0]:
                    cursos_data = json.loads(row[0])
                    contexto['cursos_aprobados'] = len(cursos_data)
                    # Forzar conversión a int para evitar error str + int
                    contexto['creditos_acumulados'] = sum(int(c.get('creditos', 3)) for c in cursos_data)
                    contexto['lista_aprobados'] = cursos_data
        except Exception:
            pass
    
    # Obtener respuesta del chatbot
    resultado = chatbot.responder(pregunta, contexto)
    
    return jsonify({
        "pregunta": pregunta,
        "respuesta": resultado['respuesta'],
        "intent": resultado['intent'],
        "confianza": resultado['confianza']
    }), 200


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

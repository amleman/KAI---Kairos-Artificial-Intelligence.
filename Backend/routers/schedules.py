from flask import Blueprint, request, jsonify
import sqlite3
import json
import os
from datetime import datetime
from config import DB, CAREER_FILE_MAP, get_user_career, get_db_connection
from motor_generador import GeneradorHorarios
from motor_custom import GeneradorHorarioCustom

schedules_bp = Blueprint('schedules', __name__)

# -----------------------------------------------------------
# GENERADOR DE HORARIO OPTIMIZADO
# -----------------------------------------------------------
@schedules_bp.route("/generar_horario", methods=['POST'])
def generar_horario():
    data = request.get_json()
    carne = data["usuario"]

    # Obtener configuración financiera
    config_gen = data.get("configGen", {})
    salario_meta = int(config_gen.get("salarioMeta", 6500))

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Obtener cursos aprobados desde la nueva estructura JSON
        cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
        row = cursor.fetchone()
    finally:
        conn.close()
    
    aprobados = []
    promedio = 0
    limite_cursos = 6 # Default

    # Obtener carrera para elegir pensum
    carrera = get_user_career(carne)
    pensum_file = CAREER_FILE_MAP.get(carrera, "sistemas.csv")
    pensum_path = os.path.join("Data/Pensums", pensum_file)
    
    if row and row[0]:
        try:
            cursos_json = json.loads(row[0])
            # Extraer códigos
            aprobados = [curso["codigo"] for curso in cursos_json]
            
            # Calcular promedio de los últimos 6 cursos
            ultimos_cursos = cursos_json[-6:] if len(cursos_json) > 6 else cursos_json
            notas = []
            for c in ultimos_cursos:
                try:
                    n = float(c.get("nota", 0))
                    if n > 0: notas.append(n)
                except:
                    pass
            
            if notas:
                promedio = sum(notas) / len(notas)
                
            # Determinar límite de cursos basado en promedio
            if promedio > 77:
                limite_cursos = 7
            elif promedio > 67:
                limite_cursos = 6
            elif promedio >= 61:
                limite_cursos = 4
            else:
                limite_cursos = 4 # < 61 también restringido
                
            print(f"Promedio calculado: {promedio}, Limite cursos: {limite_cursos}")
            
        except json.JSONDecodeError:
            aprobados = []

    # Preparar config de trabajo si existe
    config_trabajo = None
    if config_gen.get("trabaja"):
        config_trabajo = {
            "trabaja": True,
            "inicioMin": int(config_gen.get("horaInicio", 0)),
            "finMin": int(config_gen.get("horaFin", 0))
        }
        print(config_trabajo["inicioMin"])

    if not os.path.exists(pensum_path):
         return jsonify({"error": f"Pensum para {carrera} no encontrado"}), 500

    motor = GeneradorHorarios(
        pensum_path,
        "./Data/cursos_oferta_limpio.csv"
    )

    resultados = motor.generar(aprobados, salario_meta=salario_meta, config_trabajo=config_trabajo, limite_cursos=limite_cursos)
    return jsonify({"horarios": resultados}), 200


# -----------------------------------------------------------
# GENERADOR DE HORARIO CUSTOM
# -----------------------------------------------------------
@schedules_bp.route("/generar_horario_custom", methods=['POST'])
def generar_horario_custom_endpoint():
    """
    Recibe: {
        "cursos": ["0103", "0147"], 
        "filtros": {
            "hora_inicio_lv": 420,
            "hora_fin_lv": 1200,
            "hora_inicio_sabado": 2345,
            "hora_fin_sabado": 1200,
            "catedratico": "Garrido",
            "modalidad": "TODAS"
        }
    }
    """
    data = request.get_json()
    codigos_deseados = data.get("cursos", [])
    filtros = data.get("filtros", {})
    usuario = data.get("usuario", "") # Nuevo campo
    
    if not codigos_deseados:
        return jsonify({"error": "No seleccionaste ningún curso"}), 400

    try:
        # Determinar carrera y pensum
        carrera = get_user_career(usuario) # usuario aqui se asume es carne
        pensum_file = CAREER_FILE_MAP.get(carrera, "sistemas.csv")
        pensum_path = os.path.join("Data/Pensums", pensum_file)

        # 1. Obtener cursos aprobados reales para calcular verdadero costo de oportunidad
        aprobados = []
        if usuario:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (usuario,))
                row = cursor.fetchone()
                
                if row and row[0]:
                    cursos_json = json.loads(row[0])
                    aprobados = [c["codigo"] for c in cursos_json]
            except Exception as e:
                print(f"Error obteniendo aprobados para costo oportunidad: {e}")
            finally:
                conn.close()

        # 2. Calcular qué cursos PODRÍA tomar realmente (para compararlos con lo que eligió)
        motor_inteligente = GeneradorHorarios(
            pensum_path,
            "./Data/cursos_oferta_limpio.csv"
        )
        codigos_reales_disponibles = motor_inteligente.obtener_disponibles(aprobados)

        # 3. Instanciar el motor custom
        motor = GeneradorHorarioCustom(
            './Data/cursos_oferta_limpio.csv', 
            pensum_path
        )
        
        # Extraer salario si viene
        salario_meta = 6500
        if "configGen" in data:
            salario_meta = int(data["configGen"].get("salarioMeta", 6500))

        # Ejecutar generación pasando los disponibles reales
        horarios = motor.generar(
            codigos_deseados, 
            filtros, 
            salario_meta=salario_meta,
            disponibles_totales=codigos_reales_disponibles
        )
        
        if not horarios:
            return jsonify({"mensaje": "No se encontraron combinaciones válidas con esos filtros. Intenta relajar las restricciones."}), 404
        
        return jsonify({"horarios": horarios}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------------
# Guardar HORARIO FINAL
# -----------------------------------------------------------
@schedules_bp.route("/guardar_horario_final", methods=['POST'])
def guardar_horario_final():
    data = request.get_json()
    usuario = data.get("usuario")
    horario_seleccionado = data.get("horario") # Este es el array de la opción elegida
    nombre_personalizado = data.get("nombre", f"Horario Guardado {datetime.now().strftime('%d/%m %H:%M')}")

    if not usuario or not horario_seleccionado:
        return jsonify({"error": "Faltan datos del usuario o el horario"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Convertimos la lista de objetos JS a String para SQLite
        json_string = json.dumps(horario_seleccionado)
        
        cursor.execute(
            "INSERT INTO horarios_guardados (usuario, nombre_horario, data_json) VALUES (?, ?, ?)",
            (usuario, nombre_personalizado, json_string)
        )
        conn.commit()
        return jsonify({"message": "¡Horario guardado en tu perfil!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# -----------------------------------------------------------
# OBTENER HORARIO GUARDADO POR EL USUARIO
# -----------------------------------------------------------
@schedules_bp.route("/obtener_horario_guardado/<usuario>", methods=['GET'])
def obtener_horario_guardado(usuario):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Verificamos si existe ALGO en la tabla para ese usuario
        cursor.execute("SELECT count(*) FROM horarios_guardados WHERE usuario = ?", (usuario,))
        count = cursor.fetchone()[0]

        if count == 0:
            return jsonify({"existe": False, "mensaje": "Usuario no tiene registros"}), 200

        # 2. Obtenemos el último guardado
        cursor.execute("""
            SELECT data_json, nombre_horario 
            FROM horarios_guardados 
            WHERE usuario = ? 
            ORDER BY id DESC LIMIT 1
        """, (usuario,))
        
        row = cursor.fetchone()
        
        if row:
            raw_json = row[0]
            nombre = row[1]
            
            try:
                horario_lista = json.loads(raw_json)
                
                # VALIDACIÓN EXTRA: Si guardaste { "horarios": [...] } en vez de [...]
                if isinstance(horario_lista, dict) and "horarios" in horario_lista:
                    horario_lista = horario_lista["horarios"]
                                
                return jsonify({
                    "existe": True, 
                    "nombre": nombre,
                    "horario": horario_lista
                }), 200
            except json.JSONDecodeError as e:
                return jsonify({"existe": False, "error": "JSON corrupto en DB"}), 200
        else:
            return jsonify({"existe": False}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


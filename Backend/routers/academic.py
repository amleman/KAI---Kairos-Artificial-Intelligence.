from flask import Blueprint, request, jsonify
import sqlite3
import json
import pandas as pd
from config import DB, get_analizador_carga, get_optimizador_promedio, get_db_connection
from clustering_semaforo import analizar_carga
from optimizador_promedio import calcular_notas_objetivo

academic_bp = Blueprint('academic', __name__)

# -----------------------------------------------------------
# SEMÁFORO DE CARGA ACADÉMICA (K-MEANS)
# -----------------------------------------------------------

@academic_bp.route("/cursos_clasificados/<carne>", methods=['GET'])
def obtener_cursos_clasificados(carne):
    analizador = get_analizador_carga()
    
    # 1. Obtener cursos aprobados
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
    row = cursor.fetchone()
    conn.close()
    
    aprobados = []
    if row and row[0]:
        cursos_data = json.loads(row[0])
        aprobados = [str(c["codigo"]).strip().zfill(4) for c in cursos_data]
    
    # 2. Obtener todos los cursos clasificados (data general del curso)
    todos_cursos = analizador.obtener_todos_cursos_clasificados()
    
    # 3. Cargar pensum para validar prerrequisitos
    # Nota: esto debería optimizarse para no leer CSV cada vez, pero mantenemos lógica original
    df_pensum = pd.read_csv("./Data/Pensums/sistemas.csv")
    df_pensum['codigo'] = df_pensum['codigo'].astype(str).str.zfill(4)
    
    # 4. Cargar oferta SOLO para verificar disponibilidad (Optimización)
    df_oferta = pd.read_csv("./Data/cursos_oferta_limpio.csv")
    codigos_en_oferta = set(df_oferta['Codigo'].astype(str).str.zfill(4).unique())
    
    cursos_disponibles = []
    
    for curso in todos_cursos:
        codigo = curso['codigo']
        
        # Filtro A: Si ya lo aprobó, saltar
        if codigo in aprobados:
            continue

        # Filtro B: Si el curso NO se está impartiendo este semestre, saltar
        if codigo not in codigos_en_oferta:
            continue
        
        # Filtro C: Verificar prerrequisitos
        curso_pensum = df_pensum[df_pensum['codigo'] == codigo]
        puede_llevar = True
        
        if not curso_pensum.empty:
            prereq = curso_pensum.iloc[0]['pre_requisitos']
            if pd.notna(prereq) and prereq != 'N/A' and str(prereq).strip():
                prerequisitos = [p.strip().zfill(4) for p in str(prereq).split(',')]
                puede_llevar = all(p in aprobados for p in prerequisitos if p)
        
        if puede_llevar:
            cursos_disponibles.append(curso)
    
    return jsonify(cursos_disponibles), 200


@academic_bp.route("/analizar_semaforo", methods=['POST'])
def analizar_semaforo():
    # Analiza cursos y retorna semaforo de carga (verde/amarillo/rojo)
    analizador = get_analizador_carga()
    
    data = request.get_json()
    cursos_seleccionados = data.get("cursos", [])
    
    if not cursos_seleccionados:
        return jsonify({"error": "Debes proporcionar una lista de cursos"}), 400
    
    resultado = analizar_carga(analizador, cursos_seleccionados)
    return jsonify(resultado), 200


@academic_bp.route("/cursos_por_nivel/<int:nivel>", methods=['GET'])
def obtener_cursos_por_nivel(nivel):
    # Obtiene cursos de un nivel (1=Verde, 2=Amarillo, 3=Rojo)
    analizador = get_analizador_carga()
    
    if nivel not in [1, 2, 3]:
        return jsonify({"error": "Nivel debe ser 1, 2 o 3"}), 400
    
    cursos = analizador.obtener_cursos_por_nivel(nivel)
    return jsonify(cursos), 200


# -----------------------------------------------------------
# OPTIMIZADOR DE PROMEDIO (GOAL SEEKING)
# -----------------------------------------------------------

@academic_bp.route("/calcular_notas_objetivo", methods=['POST'])
def calcular_notas_objetivo_endpoint():
    # Calcula notas necesarias para alcanzar promedio objetivo
    optimizador = get_optimizador_promedio()
    
    data = request.get_json()
    
    cursos_aprobados = data.get("cursos_aprobados", [])
    cursos_actuales = data.get("cursos_actuales", [])
    promedio_objetivo = data.get("promedio_objetivo")
    
    if promedio_objetivo is None:
        return jsonify({"error": "Debes proporcionar un promedio_objetivo"}), 400
    
    try:
        promedio_objetivo = float(promedio_objetivo)
    except ValueError:
        return jsonify({"error": "promedio_objetivo debe ser un número"}), 400
    
    resultado = calcular_notas_objetivo(
        optimizador,
        cursos_aprobados,
        cursos_actuales,
        promedio_objetivo
    )
    
    return jsonify(resultado), 200


@academic_bp.route("/calcular_promedio_actual", methods=['POST'])
def calcular_promedio_actual_endpoint():
    # Calcula promedio actual del estudiante
    optimizador = get_optimizador_promedio()
    
    data = request.get_json()
    cursos_aprobados = data.get("cursos_aprobados", [])
    
    ultimos_6_cursos = cursos_aprobados[-6:]
    
    resultado = optimizador.calcular_promedio_actual(ultimos_6_cursos)
    return jsonify(resultado), 200


@academic_bp.route("/simular_escenarios", methods=['POST'])
def simular_escenarios_endpoint():
    # Simula escenarios de notas (optimista, realista, pesimista, minimo)
    optimizador = get_optimizador_promedio()
    
    data = request.get_json()
    cursos_aprobados = data.get("cursos_aprobados", [])
    cursos_actuales = data.get("cursos_actuales", [])
    
    resultado = optimizador.simular_escenarios(cursos_aprobados, cursos_actuales)
    return jsonify(resultado), 200

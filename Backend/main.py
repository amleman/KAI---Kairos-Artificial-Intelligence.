from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import hashlib
import os
import json
from datetime import datetime
from motor_generador import GeneradorHorarios
from motor_custom import GeneradorHorarioCustom
from clustering_semaforo import crear_analizador, analizar_carga
from optimizador_promedio import crear_optimizador, calcular_notas_objetivo
import pandas as pd

app = Flask(__name__)
app.config["PROPAGATE_EXCEPTIONS"] = True
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DB = "usuarios.db"


# -----------------------------------------------------------
# INIT DATABASE
# -----------------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB)
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
            carrera TEXT
        )
    """)

    # Cursos aprobados
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursos_aprobados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carne TEXT,
            codigo TEXT,
            nota REAL DEFAULT NULL
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


# -----------------------------------------------------------
# PASSWORD HASH
# -----------------------------------------------------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


# -----------------------------------------------------------
# REGISTER
# -----------------------------------------------------------
@app.post("/register")
def register():
    data = request.get_json()
    usuario = data.get("usuario")
    email = data.get("email")
    password = data.get("password")

    if not usuario or not email or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO usuarios (usuario, email, password) VALUES (?, ?, ?)",
            (usuario, email, hash_password(password))
        )
        conn.commit()
        conn.close()

        return jsonify({"message": "Usuario registrado exitosamente"}), 201

    except sqlite3.IntegrityError:
        return jsonify({"error": "Usuario o email ya existe"}), 400


# -----------------------------------------------------------
# LOGIN
# -----------------------------------------------------------
@app.post("/login")
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    password = data.get("password")

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, usuario FROM usuarios WHERE usuario = ? AND password = ?",
        (usuario, hash_password(password))
    )
    user = cursor.fetchone()
    
    if user:
        user_id = user[0]
        username = user[1]
        
        # Buscar si tiene información registrada (por usuario, no por nombre)
        cursor.execute(
            "SELECT carne, nombre, fecha_nacimiento, carrera FROM usuarios_info WHERE usuario = ?",
            (username,)
        )
        info = cursor.fetchone()
        conn.close()
        
        response_data = {
            "message": "Login correcto",
            "usuario": username,
            "tiene_info": info is not None
        }
        
        if info:
            response_data["carne"] = info[0]
            response_data["nombre"] = info[1]
            response_data["fechaNacimiento"] = info[2]
            response_data["carrera"] = info[3]
        
        return jsonify(response_data), 200

    conn.close()
    return jsonify({"error": "Credenciales incorrectas"}), 400


# -----------------------------------------------------------
# GUARDAR INFO DEL ESTUDIANTE
# -----------------------------------------------------------
@app.post("/guardar_usuario_info")
def guardar_usuario_info():
    data = request.get_json()
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    # Verificar si ya existe por usuario
    cursor.execute("SELECT id FROM usuarios_info WHERE usuario = ?", (data["usuario"],))
    existe = cursor.fetchone()

    if existe:
        # Actualizar
        cursor.execute("""
            UPDATE usuarios_info 
            SET nombre = ?, carne = ?, fecha_nacimiento = ?, carrera = ?
            WHERE usuario = ?
        """, (data["nombre"], data["carne"], data["fechaNacimiento"], data["carrera"], data["usuario"]))
    else:
        # Insertar
        cursor.execute("""
            INSERT INTO usuarios_info (usuario, nombre, carne, fecha_nacimiento, carrera)
            VALUES (?, ?, ?, ?, ?)
        """, (data["usuario"], data["nombre"], data["carne"], data["fechaNacimiento"], data["carrera"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Guardado"}), 200


# -----------------------------------------------------------
# OBTENER INFO DEL ESTUDIANTE
# -----------------------------------------------------------
@app.get("/obtener_usuario_info/<carne>")
def obtener_usuario_info(carne):
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute("SELECT nombre, carne, fecha_nacimiento, carrera FROM usuarios_info WHERE carne = ?", (carne,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({
            "nombre": row[0],
            "carne": row[1],
            "fechaNacimiento": row[2],
            "carrera": row[3]
        }), 200
    
    return jsonify({}), 404


# -----------------------------------------------------------
# GUARDAR CURSOS APROBADOS (SIN NOTA)
# -----------------------------------------------------------
@app.post("/guardar_aprobados")
def guardar_aprobados():
    data = request.get_json()

    carne = data.get("carne")
    aprobados = data.get("aprobados", [])

    print(f"[GUARDAR_APROBADOS] Carne: {carne}, Total cursos: {len(aprobados)}")
    print(f"[GUARDAR_APROBADOS] Códigos recibidos: {aprobados}")

    if not carne:
        return jsonify({"error": "carne requerido"}), 400

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    # Limpio previos
    cursor.execute("DELETE FROM cursos_aprobados WHERE carne = ?", (carne,))
    print(f"[GUARDAR_APROBADOS] Eliminados cursos previos para carne: {carne}")

    # Insertar siempre como STRING
    insertados = 0
    for codigo in aprobados:
        if not codigo:
            continue  # evitar None o vacío

        codigo_str = str(codigo).strip()  # Mantener formato original del CSV

        cursor.execute(
            "INSERT INTO cursos_aprobados (carne, codigo) VALUES (?, ?)",
            (carne, codigo_str)
        )
        insertados += 1

    conn.commit()
    conn.close()

    print(f"[GUARDAR_APROBADOS] Insertados {insertados} cursos para carne: {carne}")
    return jsonify({"message": "Aprobados guardados"}), 200


# -----------------------------------------------------------
# GUARDAR NOTAS EN CURSOS APROBADOS
# -----------------------------------------------------------
@app.post("/guardar_notas")
def guardar_notas():
    data = request.get_json()
    carne = data["carne"]
    notas = data["notas"]  # [{codigo, nota}]

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    for item in notas:
        cursor.execute("""
            UPDATE cursos_aprobados 
            SET nota = ?
            WHERE carne = ? AND codigo = ?
        """, (item["nota"], carne, item["codigo"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Notas guardadas"}), 200


# -----------------------------------------------------------
# OBTENER CURSOS APROBADOS + INFO COMPLETA (para tabs)
# -----------------------------------------------------------
@app.get("/aprobados/<carne>")
def obtener_aprobados(carne):
    
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    # Verificar si la columna nota existe
    cursor.execute("PRAGMA table_info(cursos_aprobados)")
    columns = [col[1] for col in cursor.fetchall()]
    has_nota = "nota" in columns
    
    if has_nota:
        cursor.execute("SELECT codigo, nota FROM cursos_aprobados WHERE carne = ?", (carne,))
    else:
        cursor.execute("SELECT codigo FROM cursos_aprobados WHERE carne = ?", (carne,))
    
    rows = cursor.fetchall()
    conn.close()

    # Cargar CSV
    df = pd.read_csv("./data/pensum_sistemas.csv")
    
    # Convertir columna codigo a string con padding
    df['codigo'] = df['codigo'].astype(str).str.zfill(4)
    

    salida = []

    for row in rows:
        codigo = row[0]
        nota = row[1] if has_nota and len(row) > 1 else None
        
        curso_match = df[df["codigo"] == codigo]
        
        if curso_match.empty:
            continue
            
        curso = curso_match.to_dict(orient="records")[0]

        # Limpiar NaN y convertir a valores válidos
        salida.append({
            "codigo": str(codigo),
            "nombre": str(curso["nombre_completo"]) if pd.notna(curso["nombre_completo"]) else "",
            "creditos": int(curso["creditos"]) if pd.notna(curso["creditos"]) else 0,
            "nota": float(nota) if nota is not None and pd.notna(nota) else None,
            "obligatorio": str(curso.get("obligatorio", "")) if pd.notna(curso.get("obligatorio")) else "",
            "pre_requisitos": str(curso.get("pre_requisitos", "")) if pd.notna(curso.get("pre_requisitos")) else ""
        })

    return jsonify(salida), 200


# -----------------------------------------------------------
# Guardar HORARIO FINAL
# -----------------------------------------------------------
@app.post("/guardar_horario_final")
def guardar_horario():
    data = request.get_json()
    usuario = data.get("usuario")
    horario_json = data.get("horario") # El array de cursos
    nombre = data.get("nombre", "Mi Horario")

    try:
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        # Convertimos la lista/dict a String para guardarlo en TEXT
        json_string = json.dumps(horario_json)
        
        cursor.execute(
            "INSERT INTO horarios_guardados (usuario, nombre_horario, data_json) VALUES (?, ?, ?)",
            (usuario, nombre, json_string)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Horario guardado exitosamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------------
# GENERADOR DE HORARIO OPTIMIZADO
# -----------------------------------------------------------
@app.post("/generar_horario")
def generar_horario():
    data = request.get_json()
    carne = data["usuario"]

    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute("SELECT codigo FROM cursos_aprobados WHERE carne = ?", (carne,))
    aprobados = [row[0] for row in cursor.fetchall()]
    conn.close()

    motor = GeneradorHorarios(
        "./Data/pensum_sistemas.csv",
        "./Data/cursos_oferta_limpio.csv"
    )

    resultados = motor.generar(aprobados)
    return jsonify({"horarios": resultados}), 200


# -----------------------------------------------------------
# GENERADOR DE HORARIO CUSTOM
# -----------------------------------------------------------
@app.post("/generar_horario_custom")
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
    
    if not codigos_deseados:
        return jsonify({"error": "No seleccionaste ningún curso"}), 400

    try:
        # Instanciar el motor custom (asegúrate de tener el csv de oferta limpio)
        motor = GeneradorHorarioCustom('./Data/cursos_oferta_limpio.csv')
        
        # Ejecutar generación
        horarios = motor.generar(codigos_deseados, filtros)
        
        if not horarios:
            return jsonify({"mensaje": "No se encontraron combinaciones válidas con esos filtros. Intenta relajar las restricciones."}), 404
        
        return jsonify({"horarios": horarios}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------------
# Guardar HORARIO PREFERIDO EN DB
# -----------------------------------------------------------
@app.post("/guardar_horario_final")
def guardar_horario_final():
    data = request.get_json()
    usuario = data.get("usuario")
    horario_seleccionado = data.get("horario") # Este es el array de la opción elegida
    nombre_personalizado = data.get("nombre", f"Horario Guardado {datetime.now().strftime('%d/%m %H:%M')}")

    if not usuario or not horario_seleccionado:
        return jsonify({"error": "Faltan datos del usuario o el horario"}), 400

    try:
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        
        # Convertimos la lista de objetos JS a String para SQLite
        json_string = json.dumps(horario_seleccionado)
        
        cursor.execute(
            "INSERT INTO horarios_guardados (usuario, nombre_horario, data_json) VALUES (?, ?, ?)",
            (usuario, nombre_personalizado, json_string)
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "¡Horario guardado en tu perfil!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------------------------------------
# RETORNAR PENSUM CSV
# -----------------------------------------------------------
@app.get("/pensum")
def obtener_pensum():
    ruta = os.path.join("data", "pensum_sistemas.csv")
    if not os.path.exists(ruta):
        return jsonify({"error": "Archivo no encontrado"}), 404
    return send_file(ruta, mimetype="text/csv")


# -----------------------------------------------------------
# SEMÁFORO DE CARGA ACADÉMICA (K-MEANS)
# -----------------------------------------------------------

# Instancia global del analizador (se crea una vez)
analizador_carga = None

@app.get("/cursos_clasificados/<carne>")
def obtener_cursos_clasificados(carne):
    global analizador_carga
    if analizador_carga is None:
        analizador_carga = crear_analizador("./Data/pensum_sistemas.csv")
    
    # 1. Obtener cursos aprobados
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    cursor.execute("SELECT codigo FROM cursos_aprobados WHERE carne = ?", (carne,))
    aprobados_raw = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    aprobados = [str(codigo).strip().zfill(4) for codigo in aprobados_raw]
    
    # 2. Obtener todos los cursos clasificados (data general del curso)
    todos_cursos = analizador_carga.obtener_todos_cursos_clasificados()
    
    # 3. Cargar pensum para validar prerrequisitos
    df_pensum = pd.read_csv("./Data/pensum_sistemas.csv")
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


@app.post("/analizar_semaforo")
def analizar_semaforo():
    # Analiza cursos y retorna semaforo de carga (verde/amarillo/rojo)
    global analizador_carga
    if analizador_carga is None:
        analizador_carga = crear_analizador("./Data/pensum_sistemas.csv")
    
    data = request.get_json()
    cursos_seleccionados = data.get("cursos", [])
    
    if not cursos_seleccionados:
        return jsonify({"error": "Debes proporcionar una lista de cursos"}), 400
    
    resultado = analizar_carga(analizador_carga, cursos_seleccionados)
    return jsonify(resultado), 200


@app.get("/cursos_por_nivel/<int:nivel>")
def obtener_cursos_por_nivel(nivel):
    # Obtiene cursos de un nivel (1=Verde, 2=Amarillo, 3=Rojo)
    global analizador_carga
    if analizador_carga is None:
        analizador_carga = crear_analizador("./Data/pensum_sistemas.csv")
    
    if nivel not in [1, 2, 3]:
        return jsonify({"error": "Nivel debe ser 1, 2 o 3"}), 400
    
    cursos = analizador_carga.obtener_cursos_por_nivel(nivel)
    return jsonify(cursos), 200


# -----------------------------------------------------------
# OPTIMIZADOR DE PROMEDIO (GOAL SEEKING)
# -----------------------------------------------------------

# Instancia global del optimizador
optimizador_promedio = None

@app.post("/calcular_notas_objetivo")
def calcular_notas_objetivo_endpoint():
    # Calcula notas necesarias para alcanzar promedio objetivo
    global optimizador_promedio
    if optimizador_promedio is None:
        optimizador_promedio = crear_optimizador("./Data/pensum_sistemas.csv")
    
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
        optimizador_promedio,
        cursos_aprobados,
        cursos_actuales,
        promedio_objetivo
    )
    
    return jsonify(resultado), 200


@app.post("/calcular_promedio_actual")
def calcular_promedio_actual_endpoint():
    # Calcula promedio actual del estudiante
    global optimizador_promedio
    if optimizador_promedio is None:
        optimizador_promedio = crear_optimizador("./Data/pensum_sistemas.csv")
    
    data = request.get_json()
    cursos_aprobados = data.get("cursos_aprobados", [])
    
    resultado = optimizador_promedio.calcular_promedio_actual(cursos_aprobados)
    return jsonify(resultado), 200


@app.post("/simular_escenarios")
def simular_escenarios_endpoint():
    # Simula escenarios de notas (optimista, realista, pesimista, minimo)
    global optimizador_promedio
    if optimizador_promedio is None:
        optimizador_promedio = crear_optimizador("./Data/pensum_sistemas.csv")
    
    data = request.get_json()
    cursos_aprobados = data.get("cursos_aprobados", [])
    cursos_actuales = data.get("cursos_actuales", [])
    
    resultado = optimizador_promedio.simular_escenarios(cursos_aprobados, cursos_actuales)
    return jsonify(resultado), 200


# -----------------------------------------------------------
# MAIN
# -----------------------------------------------------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=8000)

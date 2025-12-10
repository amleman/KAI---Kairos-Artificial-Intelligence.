from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import hashlib
import os
import json
import re
from datetime import datetime
from motor_generador import GeneradorHorarios
from motor_custom import GeneradorHorarioCustom
from clustering_semaforo import crear_analizador, analizar_carga
from optimizador_promedio import crear_optimizador, calcular_notas_objetivo
import pandas as pd

# OCR dependencies (optional but required for carga de imágenes)
try:
    from PIL import Image
    import pytesseract
except ImportError:  # Gracefully handle missing optional deps
    Image = None
    pytesseract = None

app = Flask(__name__)
app.config["PROPAGATE_EXCEPTIONS"] = True
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DB = "usuarios.db"

# Cache de pensum para cruzar créditos/nombres con los códigos reconocidos por OCR
def cargar_pensum_lookup():
    try:
        df = pd.read_csv("./Data/pensum_sistemas.csv")
        lookup = {}
        for _, row in df.iterrows():
            codigo = str(row.get("codigo", "")).zfill(4)
            lookup[codigo] = {
                "nombre": str(row.get("nombre_completo", row.get("nombre", ""))),
                "creditos": int(row.get("creditos", 3)),
            }
        return lookup
    except Exception:
        return {}

PENSUM_LOOKUP = cargar_pensum_lookup()


def merge_cursos_en_db(carne: str, nuevos_cursos: list):
    """Actualiza o inserta cursos aprobados, devolviendo la lista final."""
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()

    cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
    row = cursor.fetchone()
    cursos_existentes = json.loads(row[0]) if row and row[0] else []

    cursos_dict = {c.get("codigo"): c for c in cursos_existentes if c.get("codigo")}
    for curso in nuevos_cursos:
        codigo = curso.get("codigo")
        if not codigo:
            continue
        cursos_dict[codigo] = {
            "codigo": codigo,
            "nombre": curso.get("nombre", ""),
            "creditos": curso.get("creditos", 3),
            "nota": curso.get("nota"),
        }

    cursos_finales = list(cursos_dict.values())
    cursos_json = json.dumps(cursos_finales)

    if row:
        cursor.execute("UPDATE cursos_aprobados SET cursos_data = ? WHERE carne = ?", (cursos_json, carne))
    else:
        cursor.execute("INSERT INTO cursos_aprobados (carne, cursos_data) VALUES (?, ?)", (carne, cursos_json))

    conn.commit()
    conn.close()
    return cursos_finales


def interpretar_nota(nota_token: str):
    if nota_token is None:
        return None
    texto = str(nota_token).strip()
    if not texto:
        return None
    if "APRO" in texto.upper():  # Aprobado sin nota numérica
        return None
    try:
        return float(texto.replace(",", "."))
    except ValueError:
        return None


def extraer_curso_desde_linea(linea: str):
    """Parsea una línea OCR intentando extraer código, nombre, créditos y nota.
    Se usa un regex ancho para atrapar variaciones y se hace fallback a un parse por tokens.
    """
    linea_norm = re.sub(r"[^0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ\.,\-\s]", " ", linea)
    linea_norm = re.sub(r"\s+", " ", linea_norm).strip()
    if not linea_norm:
        return None

    patron = re.compile(
        r"(?P<codigo>\d{3,4})\s+"
        r"(?P<nombre>[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s\.\-]+?)\s+"
        r"(?P<creditos>\d{1,2})\s+"
        r"(?P<fecha>\d{4}-\d{2}|\d{2}[/-]\d{4}|\d{4})\s+"
        r"(?P<nota>(?:\d{1,3}(?:[\.,]\d+)?|Aprobado|APROBADO|aprobado))",
        re.UNICODE,
    )

    m = patron.search(linea_norm)
    if m:
        codigo = m.group("codigo").zfill(4)
        nombre = m.group("nombre").strip()
        creditos = int(m.group("creditos")) if m.group("creditos").isdigit() else PENSUM_LOOKUP.get(codigo, {}).get("creditos", 3)
        nota_valor = interpretar_nota(m.group("nota"))
        return {
            "codigo": codigo,
            "nombre": nombre or PENSUM_LOOKUP.get(codigo, {}).get("nombre", ""),
            "creditos": creditos,
            "nota": nota_valor,
        }

    # Fallback por tokens si el regex no atrapó la estructura completa
    tokens = linea_norm.split(" ")
    if not tokens:
        return None

    codigo_token = tokens[0]
    if not re.fullmatch(r"\d{3,4}", codigo_token):
        return None

    codigo = codigo_token.zfill(4)

    credito_idx = None
    for idx, token in enumerate(tokens[1:], start=1):
        if re.fullmatch(r"\d{1,2}", token):
            credito_idx = idx
            break

    if credito_idx is None:
        return None

    nombre = " ".join(tokens[1:credito_idx]).strip()
    resto = tokens[credito_idx + 1 :]

    nota_token = None
    for token in reversed(resto):
        if re.fullmatch(r"\d{1,3}(?:[\.,]\d+)?", token) or re.search(r"APROBAD", token, re.IGNORECASE):
            nota_token = token
            break

    if nota_token is None:
        return None

    creditos = int(tokens[credito_idx]) if tokens[credito_idx].isdigit() else PENSUM_LOOKUP.get(codigo, {}).get("creditos", 3)
    nombre_final = nombre if nombre else PENSUM_LOOKUP.get(codigo, {}).get("nombre", "")

    return {
        "codigo": codigo,
        "nombre": nombre_final,
        "creditos": creditos,
        "nota": interpretar_nota(nota_token),
    }


def extraer_cursos_desde_imagen(file_storage):
    if pytesseract is None or Image is None:
        raise RuntimeError("OCR no disponible. Instala Pillow y pytesseract y configura el binario de Tesseract.")

    imagen = Image.open(file_storage.stream).convert("RGB")

    # OCR en modo lineal (psm 6) funciona mejor con tablas horizontales
    texto_raw = pytesseract.image_to_string(imagen, lang="spa", config="--psm 6")

    cursos = []

    # 1) Intentar con las líneas directas del string
    for linea in texto_raw.splitlines():
        linea_limpia = re.sub(r"[|;\t]", " ", linea)
        curso = extraer_curso_desde_linea(linea_limpia)
        if curso:
            cursos.append(curso)

    # 2) Si no hubo resultados, usar image_to_data para recuperar líneas con coordenadas
    if not cursos:
        data = pytesseract.image_to_data(imagen, lang="spa", output_type=pytesseract.Output.DICT, config="--psm 6")
        line_map = {}
        for text, line_num in zip(data.get("text", []), data.get("line_num", [])):
            if not text.strip():
                continue
            line_map.setdefault(line_num, []).append(text)

        for parts in line_map.values():
            linea_completa = " ".join(parts)
            linea_limpia = re.sub(r"[|;\t]", " ", linea_completa)
            curso = extraer_curso_desde_linea(linea_limpia)
            if curso:
                cursos.append(curso)

    return cursos, texto_raw


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

    # Cursos aprobados - NUEVA ESTRUCTURA
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cursos_aprobados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carne TEXT UNIQUE,
            cursos_data TEXT
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
# GUARDAR CURSOS APROBADOS CON NOTAS
# -----------------------------------------------------------
@app.post("/guardar_aprobados")
def guardar_aprobados():
    data = request.get_json()
    carne = data.get("carne")
    nuevos_cursos = data.get("cursos", [])  # [{codigo, nombre, creditos, nota}]

    if not carne:
        return jsonify({"error": "carne requerido"}), 400

    merge_cursos_en_db(carne, nuevos_cursos)
    return jsonify({"message": "Cursos guardados correctamente"}), 200


# -----------------------------------------------------------
# OBTENER CURSOS APROBADOS + INFO COMPLETA
# -----------------------------------------------------------
@app.get("/aprobados/<carne>")
def obtener_aprobados(carne):
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not row[0]:
        return jsonify([]), 200
    
    cursos = json.loads(row[0])
    
    # Retornar directamente los datos guardados (ya tienen nombre, créditos, nota)
    resultado = []
    for curso in cursos:
        resultado.append({
            "codigo": curso.get("codigo", ""),
            "nombre": curso.get("nombre", "Nombre no encontrado"),
            "creditos": curso.get("creditos", 3),
            "nota": curso.get("nota", None)
        })
    
    return jsonify(resultado), 200


# -----------------------------------------------------------
# CARGAR CURSOS APROBADOS DESDE IMÁGENES (OCR)
# -----------------------------------------------------------
@app.post("/cargar_aprobados_imagenes")
def cargar_aprobados_imagenes():
    carne = request.form.get("carne")
    imagenes = request.files.getlist("imagenes")

    if not carne:
        return jsonify({"error": "carne requerido"}), 400
    if not imagenes:
        return jsonify({"error": "Debes adjuntar al menos una imagen"}), 400
    if pytesseract is None or Image is None:
        return jsonify({"error": "OCR no disponible. Instala Pillow y pytesseract y asegúrate de tener el binario de Tesseract en el PATH."}), 500

    cursos_extraidos = []
    errores = []

    for img in imagenes:
        try:
            cursos_img, texto_raw = extraer_cursos_desde_imagen(img)
            if cursos_img:
                cursos_extraidos.extend(cursos_img)
            else:
                errores.append(f"{img.filename}: no se reconoció el formato esperado. Asegúrate de usar el cuadro de columnas Código, Nombre, Créditos, Fecha, Nota, Observaciones. Texto detectado: '{texto_raw[:200]}'")
        except Exception as e:
            errores.append(f"{img.filename}: {str(e)}")

    if not cursos_extraidos:
        return jsonify({"error": "No se encontraron cursos en las imágenes", "detalles": errores}), 400

    # Dedupe por código priorizando la nota más alta si viniera repetido
    dedup = {}
    for curso in cursos_extraidos:
        codigo = curso.get("codigo")
        if not codigo:
            continue
        existente = dedup.get(codigo)
        nota_actual = curso.get("nota") if curso.get("nota") is not None else -1
        nota_existente = existente.get("nota") if existente and existente.get("nota") is not None else -1
        if existente is None or nota_actual > nota_existente:
            dedup[codigo] = curso

    cursos_finales = list(dedup.values())
    merge_cursos_en_db(carne, cursos_finales)

    return jsonify({
        "message": f"Se procesaron {len(cursos_finales)} curso(s) desde las imágenes",
        "cursos": cursos_finales,
        "advertencias": errores,
    }), 200


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
    
    # Obtener cursos aprobados desde la nueva estructura JSON
    cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
    row = cursor.fetchone()
    conn.close()
    
    aprobados = []
    if row and row[0]:
        try:
            cursos_json = json.loads(row[0])
            aprobados = [curso["codigo"] for curso in cursos_json]
        except json.JSONDecodeError:
            aprobados = []

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
    cursor.execute("SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
    row = cursor.fetchone()
    conn.close()
    
    aprobados = []
    if row and row[0]:
        cursos_data = json.loads(row[0])
        aprobados = [str(c["codigo"]).strip().zfill(4) for c in cursos_data]
    
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
    
    ultimos_6_cursos = cursos_aprobados[-6:]
    
    resultado = optimizador_promedio.calcular_promedio_actual(ultimos_6_cursos)
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

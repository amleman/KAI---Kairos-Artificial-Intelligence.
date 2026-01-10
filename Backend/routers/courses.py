from flask import Blueprint, request, jsonify, send_file
import json
import os
import re
from config import CAREER_FILE_MAP, get_user_career, get_db_connection, execute_query
import csv

# Optional imports
try:
    from PIL import Image
    import pytesseract
except ImportError:
    Image = None
    pytesseract = None

from analisis_competencias import analizar_competencias_ia

courses_bp = Blueprint('courses', __name__)

# -----------------------------------------------------------
# HELPERS
# -----------------------------------------------------------

def get_pensum_map(carrera):
    """
    Carga el pensum de la carrera específica desde el archivo CSV.
    Retorna un diccionario {codigo: {nombre, creditos}}
    """
    filename = CAREER_FILE_MAP.get(carrera, "sistemas.csv")
    path = os.path.join("Data", "Pensums", filename)
    pensum_map = {}
    
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key_cod = next((k for k in row.keys() if "codigo" in k.lower() or "código" in k.lower()), None)
                    key_nom = next((k for k in row.keys() if "nombre" in k.lower()), None)
                    key_cre = next((k for k in row.keys() if "creditos" in k.lower() or "créditos" in k.lower() or "credito" in k.lower()), None)
                    
                    if key_cod and row[key_cod]:
                        codigo_limpio = row[key_cod].strip()
                        if codigo_limpio:
                            try:
                                creds = int(row.get(key_cre, 0)) if key_cre and row[key_cre].isdigit() else 3
                            except:
                                creds = 3
                            pensum_map[codigo_limpio] = {
                                "nombre": row.get(key_nom, "").strip() if key_nom else "",
                                "creditos": creds
                            }
        except Exception as e:
            print(f"Error leyendo pensum {filename}: {e}")
    else:
        print(f"Advertencia: Archivo de pensum no encontrado para {carrera}: {path}")
        
    return pensum_map

def validar_contra_pensum(carne, cursos_candidatos):
    """
    Filtra y normaliza una lista de cursos candidatos basándose en el pensum de la carrera del usuario.
    Retorna una lista de diccionarios {codigo, nombre, creditos, nota} válidos.
    """
    carrera = get_user_career(carne)
    pensum_map = get_pensum_map(carrera)

    cursos_validos = []
    for cur in cursos_candidatos:
        cod = str(cur.get("codigo", "")).strip()
        if not cod: 
            continue
            
        # Validación estricta: Debe existir en el pensum
        if cod in pensum_map:
            info_pensum = pensum_map[cod]
            
            # Usar datos del pensum para consistencia (nombre y créditos), pero mantener la nota del input
            cursos_validos.append({
                "codigo": cod,
                "nombre": info_pensum["nombre"], # Forzamos nombre oficial
                "creditos": info_pensum["creditos"], # Forzamos créditos oficiales
                "nota": cur.get("nota") # Mantenemos la nota (o None)
            })
        else:
            print(f"Curso {cod} ignorado por no estar en el pensum de {carrera}")

    return cursos_validos

def merge_cursos_en_db(carne: str, nuevos_cursos: list):
    """Actualiza o inserta cursos aprobados, validándolos contra el pensum."""
    
    # 1. Validar y normalizar los cursos entrantes
    cursos_a_guardar = validar_contra_pensum(carne, nuevos_cursos)
    
    if not cursos_a_guardar:
        print("No hay cursos válidos para guardar después de la validación.")
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        execute_query(cursor, "SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
        row = cursor.fetchone()
        
        if row:
            raw_data = row['cursos_data'] if hasattr(row, 'keys') else row[0]
            cursos_existentes = json.loads(raw_data) if raw_data else []
        else:
            cursos_existentes = []

        cursos_dict = {c.get("codigo"): c for c in cursos_existentes if c.get("codigo")}
        
        # Merge
        for curso in cursos_a_guardar:
            codigo = curso["codigo"]
            cursos_dict[codigo] = curso

        cursos_finales = list(cursos_dict.values())
        cursos_json = json.dumps(cursos_finales)

        if row:
            execute_query(cursor, "UPDATE cursos_aprobados SET cursos_data = ? WHERE carne = ?", (cursos_json, carne))
        else:
            execute_query(cursor, "INSERT INTO cursos_aprobados (carne, cursos_data) VALUES (?, ?)", (carne, cursos_json))

        conn.commit()
        return cursos_finales
    finally:
        conn.close()

def interpretar_nota(nota_token: str):
    if nota_token is None:
        return None
    texto = str(nota_token).strip()
    if not texto:
        return None
    if "APRO" in texto.upper():
        return None
    try:
        return float(texto.replace(",", "."))
    except ValueError:
        return None

def extraer_curso_desde_linea(linea: str, career_lookup: dict):
    """Parsea una línea OCR intentando extraer código, nombre, créditos y nota."""
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
        creditos = int(m.group("creditos")) if m.group("creditos").isdigit() else career_lookup.get(codigo, {}).get("creditos", 3)
        nota_valor = interpretar_nota(m.group("nota"))
        return {
            "codigo": codigo,
            "nombre": nombre or career_lookup.get(codigo, {}).get("nombre", ""),
            "creditos": creditos,
            "nota": nota_valor,
        }

    # Fallback por tokens
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

    creditos = int(tokens[credito_idx]) if tokens[credito_idx].isdigit() else career_lookup.get(codigo, {}).get("creditos", 3)
    nombre_final = nombre if nombre else career_lookup.get(codigo, {}).get("nombre", "")

    return {
        "codigo": codigo,
        "nombre": nombre_final,
        "creditos": creditos,
        "nota": interpretar_nota(nota_token),
    }

def extraer_cursos_desde_imagen(file_storage, carne):
    if pytesseract is None or Image is None:
        raise RuntimeError("OCR no disponible. Instala Pillow y pytesseract y configura el binario de Tesseract.")

    carrera = get_user_career(carne)
    career_lookup = get_pensum_map(carrera)

    imagen = Image.open(file_storage.stream).convert("RGB")
    
    texto_raw = pytesseract.image_to_string(imagen, lang="spa", config="--psm 6")
    
    print("Tomo el texto de la imagen")
    cursos = []
    
    for linea in texto_raw.splitlines():
        linea_limpia = re.sub(r"[|;\t]", " ", linea)
        curso = extraer_curso_desde_linea(linea_limpia, career_lookup)
        if curso:
            cursos.append(curso)

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
            curso = extraer_curso_desde_linea(linea_limpia, career_lookup)
            if curso:
                cursos.append(curso)

    return cursos, texto_raw

# -----------------------------------------------------------
# ROUTES
# -----------------------------------------------------------

@courses_bp.route("/pensum", methods=['GET'])
def obtener_pensum():
    carrera = request.args.get('carrera', 'Ing. Sistemas')
    filename = CAREER_FILE_MAP.get(carrera, "sistemas.csv")
    ruta = os.path.join("Data", "Pensums", filename)
    
    if not os.path.exists(ruta):
        if filename == "sistemas.csv":
             ruta_old = os.path.join("Data", "pensum_sistemas.csv")
             if os.path.exists(ruta_old):
                 return send_file(ruta_old, mimetype="text/csv")
        return jsonify({"error": f"Pensum para {carrera} no encontrado"}), 404
        
    return send_file(ruta, mimetype="text/csv")

@courses_bp.route("/extraer_cursos", methods=['POST'])
def extraer_cursos_endpoint():
    """
    Recibe imágenes y retorna los cursos detectados (sin guardar en DB).
    Usado para previsualización y confirmación en el frontend.
    """
    imagenes = request.files.getlist("files")
    carne = request.form.get("usuario")

    if not imagenes:
        return jsonify({"error": "No se enviaron imágenes"}), 400
    if not carne:
        return jsonify({"error": "Usuario no identificado"}), 400

    cursos_detectados = []
    
    for img in imagenes:
        try:
            cursos_img, _ = extraer_cursos_desde_imagen(img, carne)
            if cursos_img:
                cursos_detectados.extend(cursos_img)
        except Exception as e:
            print(f"Error procesando imagen {img.filename}: {e}")

    # Deduplicar
    dedup = {}
    for c in cursos_detectados:
        cod = c.get("codigo")
        if not cod: continue
        
        existente = dedup.get(cod)
        nota_nueva = c.get("nota") or 0
        nota_vieja = existente.get("nota") or 0 if existente else -1
        
        if not existente or nota_nueva > nota_vieja:
            dedup[cod] = c

    lista_final = list(dedup.values())
    
    return jsonify({"cursos_extraidos": lista_final}), 200

@courses_bp.route("/guardar_aprobados", methods=['POST'])
def guardar_aprobados():
    data = request.get_json()
    carne = data.get("carne")
    nuevos_cursos = data.get("cursos", []) 

    if not carne:
        return jsonify({"error": "carne requerido"}), 400

    merge_cursos_en_db(carne, nuevos_cursos)
    return jsonify({"message": "Cursos guardados y validados correctamente"}), 200

@courses_bp.route("/aprobados/<carne>", methods=['GET'])
def obtener_aprobados(carne):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        execute_query(cursor, "SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify([]), 200
        
        raw_data = row['cursos_data'] if hasattr(row, 'keys') else row[0]
        if not raw_data:
            return jsonify([]), 200
        
        cursos = json.loads(raw_data)
        
        resultado = []
        for curso in cursos:
            resultado.append({
                "codigo": curso.get("codigo", ""),
                "nombre": curso.get("nombre", "Nombre no encontrado"),
                "creditos": curso.get("creditos", 3),
                "nota": curso.get("nota", None)
            })
        
        return jsonify(resultado), 200
    finally:
        conn.close()

@courses_bp.route("/cargar_aprobados_imagenes", methods=['POST'])
def cargar_aprobados_imagenes():
    carne = request.form.get("carne")
    imagenes = request.files.getlist("imagenes")

    if not carne:
        return jsonify({"error": "carne requerido"}), 400
    if not imagenes:
        return jsonify({"error": "Debes adjuntar al menos una imagen"}), 400
    if pytesseract is None or Image is None:
        return jsonify({"error": "OCR no disponible."}), 500

    cursos_extraidos = []
    errores = []

    for img in imagenes:
        try:
            cursos_img, texto_raw = extraer_cursos_desde_imagen(img, carne)
            if cursos_img:
                cursos_extraidos.extend(cursos_img)
            else:
                errores.append(f"{img.filename}: no se reconoció el formato esperado.")
        except Exception as e:
            errores.append(f"{img.filename}: {str(e)}")

    if not cursos_extraidos:
        return jsonify({"error": "No se encontraron cursos en las imágenes", "detalles": errores}), 400

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

@courses_bp.route("/cursos_aprobados", methods=['POST'])
def obtener_cursos_aprobados_endpoint():
    data = request.get_json()
    usuario_req = data.get("usuario")
    
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        execute_query(cursor, "SELECT carne FROM usuarios_info WHERE usuario = ?", (usuario_req,))
        info_row = cursor.fetchone()
        
        carne_busqueda = usuario_req
        if info_row:
            carne_val = info_row['carne'] if hasattr(info_row, 'keys') else info_row[0]
            if carne_val:
                carne_busqueda = carne_val
        
        execute_query(cursor, "SELECT cursos_data FROM cursos_aprobados WHERE carne = ?", (carne_busqueda,))
        row = cursor.fetchone()
        
        aprobados = []
        if row:
            raw_data = row['cursos_data'] if hasattr(row, 'keys') else row[0]
            if raw_data:
                try:
                    aprobados_raw = json.loads(raw_data)
                    for c in aprobados_raw:
                        try:
                            c["creditos"] = int(c.get("creditos", 0))
                        except:
                            c["creditos"] = 0
                        aprobados.append(c)
                except:
                    aprobados = []
                
        competencias_ia = analizar_competencias_ia(aprobados)
                
        return jsonify({
            "aprobados": aprobados, 
            "carne_usado": carne_busqueda,
            "competencias_ia": competencias_ia
        }), 200
    finally:
        conn.close()

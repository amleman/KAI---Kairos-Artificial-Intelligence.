from flask import Blueprint, request, jsonify, send_from_directory
import hashlib
import sqlite3
import os
from datetime import datetime
from werkzeug.utils import secure_filename
from config import DB, UPLOAD_FOLDER, get_db_connection

auth_bp = Blueprint('auth', __name__)

# -----------------------------------------------------------
# PASSWORD HASH
# -----------------------------------------------------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# -----------------------------------------------------------
# REGISTER
# -----------------------------------------------------------
@auth_bp.route("/register", methods=['POST'])
def register():
    data = request.get_json()
    usuario = data.get("usuario")
    email = data.get("email")
    password = data.get("password")

    if not usuario or not email or not password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    try:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO usuarios (usuario, email, password) VALUES (?, ?, ?)",
                (usuario, email, hash_password(password))
            )
            conn.commit()
            return jsonify({"message": "Usuario registrado exitosamente"}), 201
        except sqlite3.IntegrityError:
            return jsonify({"error": "Usuario o email ya existe"}), 400
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -----------------------------------------------------------
# LOGIN
# -----------------------------------------------------------
@auth_bp.route("/login", methods=['POST'])
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    password = data.get("password")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, usuario FROM usuarios WHERE usuario = ? AND password = ?",
            (usuario, hash_password(password))
        )
        user = cursor.fetchone()
        
        if user:
            username = user[1]
            
            # Buscar si tiene información registrada
            cursor.execute(
                "SELECT carne, nombre, fecha_nacimiento, carrera FROM usuarios_info WHERE usuario = ?",
                (username,)
            )
            info = cursor.fetchone()
            
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

        return jsonify({"error": "Credenciales incorrectas"}), 400
    finally:
        conn.close()

# -----------------------------------------------------------
# GUARDAR INFO DEL ESTUDIANTE
# -----------------------------------------------------------
@auth_bp.route("/guardar_usuario_info", methods=['POST'])
def guardar_usuario_info():
    data = request.get_json()
    conn = get_db_connection()
    try:
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
        return jsonify({"message": "Guardado"}), 200
    finally:
        conn.close()

# -----------------------------------------------------------
# OBTENER INFO DEL ESTUDIANTE
# -----------------------------------------------------------
@auth_bp.route("/obtener_usuario_info/<carne>", methods=['GET'])
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
# PERFIL DE USUARIO
# -----------------------------------------------------------
@auth_bp.route("/api/perfil/<usuario>", methods=['GET'])
def obtener_perfil(usuario):
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    # Datos básicos (Usuarios)
    cursor.execute("SELECT email FROM usuarios WHERE usuario = ?", (usuario,))
    user_data = cursor.fetchone()
    
    # Datos info (Usuarios Info)
    cursor.execute("SELECT nombre, fecha_nacimiento, carrera, carne, foto_perfil, foto_banner FROM usuarios_info WHERE usuario = ?", (usuario,))
    info_data = cursor.fetchone()
    
    conn.close()
    
    if not user_data:
        if not info_data:
             return jsonify({"error": "Usuario no encontrado"}), 404
        email = ""
    else:
        email = user_data[0]
        
    perfil = {
        "usuario": usuario,
        "email": email,
        "nombre": info_data[0] if info_data else "",
        "fecha_nacimiento": info_data[1] if info_data else "",
        "carrera": info_data[2] if info_data else "Ingeniería en Sistemas",
        "carne": info_data[3] if info_data else usuario,
        "foto_perfil": info_data[4] if info_data and len(info_data) > 4 else None,
        "foto_banner": info_data[5] if info_data and len(info_data) > 5 else None
    }
    return jsonify(perfil)

@auth_bp.route("/api/perfil/<usuario>", methods=['PUT'])
def actualizar_perfil(usuario):
    data = request.json
    conn = sqlite3.connect(DB)
    cursor = conn.cursor()
    
    try:
        # Actualizar tabla usuarios (email)
        if 'email' in data:
            cursor.execute("UPDATE usuarios SET email = ? WHERE usuario = ?", (data['email'], usuario))
            
        # Actualizar/Insertar usuarios_info
        cursor.execute("SELECT id FROM usuarios_info WHERE usuario = ?", (usuario,))
        exists = cursor.fetchone()
        
        nombre = data.get('nombre', '')
        fecha = data.get('fecha_nacimiento', '')
        carrera = data.get('carrera', '')
        carne = data.get('carne', usuario) 
        
        if exists:
            cursor.execute("""
                UPDATE usuarios_info 
                SET nombre = ?, fecha_nacimiento = ?, carrera = ?, carne = ?
                WHERE usuario = ?
            """, (nombre, fecha, carrera, carne, usuario))
        else:
            cursor.execute("""
                INSERT INTO usuarios_info (usuario, nombre, fecha_nacimiento, carrera, carne)
                VALUES (?, ?, ?, ?, ?)
            """, (usuario, nombre, fecha, carrera, carne))
            
        conn.commit()
        return jsonify({"mensaje": "Perfil actualizado correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# -----------------------------------------------------------
# UPLOADS
# -----------------------------------------------------------
@auth_bp.route('/uploads/<filename>', methods=['GET'])
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@auth_bp.route("/api/upload", methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    usuario = request.form.get('usuario')
    tipo = request.form.get('tipo')  # 'perfil' o 'banner'
    
    if file.filename == '' or not usuario or not tipo:
        return jsonify({'error': 'Faltan datos'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Nombre único: usuario_tipo_timestamp.ext
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
        new_filename = f"{usuario}_{tipo}_{int(datetime.now().timestamp())}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, new_filename)
        file.save(filepath)
        
        # Guardar ruta en BD
        conn = sqlite3.connect(DB)
        cursor = conn.cursor()
        
        db_field = "foto_perfil" if tipo == "perfil" else "foto_banner"
        try:
            # Upsert en usuarios_info (asegurar que exista la fila)
            cursor.execute("SELECT id FROM usuarios_info WHERE usuario = ?", (usuario,))
            exists = cursor.fetchone()
            
            url_publica = f"http://localhost:8000/uploads/{new_filename}"
            
            if exists:
                cursor.execute(f"UPDATE usuarios_info SET {db_field} = ? WHERE usuario = ?", (url_publica, usuario))
            else:
                cursor.execute(f"INSERT INTO usuarios_info (usuario, {db_field}) VALUES (?, ?)", (usuario, url_publica))
                
            conn.commit()
            return jsonify({'url': url_publica})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            conn.close()

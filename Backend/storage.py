import os
from werkzeug.utils import secure_filename
from flask import current_app

# Intentar importar GCS
try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

# Nombre del bucket
BUCKET_NAME = "kaiusac-uploads-perfiles"

def init_storage_client():
    """
    Inicializa el cliente de Google Cloud Storage si está disponible.
    Usa las credenciales por defecto del entorno (Google Application Default Credentials).
    """
    if GCS_AVAILABLE:
        try:
            client = storage.Client()
            print("☁️  Cliente de Google Cloud Storage inicializado.")
            return client
        except Exception as e:
            print(f"⚠️  Error al inicializar GCS: {e}")
            return None
    else:
        print("⚠️  Librería google-cloud-storage no instalada. Usando almacenamiento local.")
        return None

# Instancia global del cliente (lazy loading)
_storage_client = None

def get_storage_client():
    global _storage_client
    if _storage_client is None:
        _storage_client = init_storage_client()
    return _storage_client

def upload_file(file_obj, filename, folder="uploads"):
    """
    Sube un archivo a GCS o lo guarda localmente según disponibilidad.
    
    Args:
        file_obj: El objeto archivo (FileStorage de Flask).
        filename: Nombre del archivo deseado.
        folder: Carpeta destino (usado para local, y como prefijo en GCS si se desea).
        
    Returns:
        str: URL pública del archivo subido.
    """
    # Limpiar nombre
    filename = secure_filename(filename)
    
    # Intentar usar GCS primero
    client = get_storage_client()
    
    if client:
        try:
            bucket = client.bucket(BUCKET_NAME)
            blob = bucket.blob(filename) # Guardamos en la raíz del bucket o podemos agregar 'folder/'
            
            # Subir archivo
            # file_obj.read() mueve el puntero, así que hay que tener cuidado si se reusa.
            # upload_from_file espera un objeto tipo file-like abierto en modo binario.
            file_obj.seek(0)
            blob.upload_from_file(file_obj, content_type=file_obj.content_type)
            
            # Hacer público (opcional, depende de la config del bucket. 
            # Si el bucket es público por política, esto no es necesario, pero es explícito).
            # blob.make_public() 
            
            # Retornar public url
            # public_url = blob.public_url
            # A veces public_url no se actualiza inmediatamente si no se hace make_public.
            # Construimos la URL manualmente para buckets públicos:
            public_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{filename}"
            
            print(f"☁️  Archivo subido a GCS: {public_url}")
            return public_url
            
        except Exception as e:
            print(f"❌ Error subiendo a GCS: {e}. Intentando local...")
            # Fallback a local si falla GCS
    
    # --- FALLBACK LOCAL ---
    # Asegurar que existe la carpeta
    upload_folder = os.path.join(os.getcwd(), folder) # Asume que corre desde la raíz del backend o folder relativo correcto
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
        
    filepath = os.path.join(upload_folder, filename)
    file_obj.seek(0) # Reset puntero
    file_obj.save(filepath)
    
    # Construir URL relativa para que el frontend pueda anteponer su API_URL
    # Esto soluciona problemas cuando se accede desde red local (móvil)
    url_publica = f"/{folder}/{filename}"
    
    print(f"📁 Archivo guardado localmente: {url_publica}")
    return url_publica

def delete_file(file_url):
    """
    Elimina un archivo dado su URL (GCS o Local).
    """
    if not file_url:
        return

    # De GCS
    if "storage.googleapis.com" in file_url:
        try:
            client = get_storage_client()
            if client:
                # Extraer nombre del archivo de la URL
                # Formato: https://storage.googleapis.com/BUCKET_NAME/FILENAME
                parts = file_url.split(f"{BUCKET_NAME}/")
                if len(parts) > 1:
                    blob_name = parts[1]
                    bucket = client.bucket(BUCKET_NAME)
                    blob = bucket.blob(blob_name)
                    blob.delete()
                    print(f"🗑️  Archivo eliminado de GCS: {blob_name}")
        except Exception as e:
            print(f"⚠️  Error eliminando de GCS: {e}")
            
    # De Local
    else:
        try:
            # Asumimos que la URL es algo como http://host/uploads/filename
            filename = file_url.split('/')[-1]
            # Asumimos carpeta 'uploads' por defecto
            folder = "uploads" 
            filepath = os.path.join(os.getcwd(), folder, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"🗑️  Archivo local eliminado: {filepath}")
        except Exception as e:
            print(f"⚠️  Error eliminando archivo local: {e}")

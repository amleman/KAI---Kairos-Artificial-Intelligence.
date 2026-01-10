"""
Script para inicializar la base de datos.
Usado para crear las tablas necesarias antes de iniciar el servidor.
"""
from config import init_db

if __name__ == "__main__":
    print("Inicializando base de datos...")
    init_db()
    print("¡Base de datos inicializada correctamente!")

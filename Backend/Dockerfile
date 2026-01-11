# Usar una imagen base de Python ligera
FROM python:3.11-slim

# Instalar dependencias del sistema necesarias (Tesseract OCR y librerías de sistema)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-spa \
    tesseract-ocr-equ \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de requerimientos e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar gunicorn para producción
RUN pip install gunicorn

# Copiar el resto del código
COPY . .

# Exponer el puerto que usará Cloud Run (por defecto 8080)
ENV PORT 8080

# Comando para iniciar la aplicación con Gunicorn
CMD gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app

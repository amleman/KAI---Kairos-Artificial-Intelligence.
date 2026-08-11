# KAI Backend - API REST con Inteligencia Artificial para Planificación Académica

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-K--Means-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![SciPy](https://img.shields.io/badge/SciPy-Optimization-8CAAE6?style=for-the-badge&logo=scipy&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud_SQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**API REST de alto rendimiento que integra Machine Learning, Algoritmos Genéticos y Optimización Matemática para resolver la planificación académica universitaria.**

[Demo en vivo](https://kaiusac.netlify.app) · [Reportar bug](https://github.com/tu-usuario/kai/issues) · [Sugerir feature](https://github.com/tu-usuario/kai/issues)

</div>

---

## Descripción General

KAI (Kairos Artificial Intelligence) es el backend de una plataforma web integral que utiliza **tres motores de Inteligencia Artificial** para automatizar la planificación académica de estudiantes de ingeniería. Resuelve tres problemas críticos:

| Problema | Solución IA | Técnica |
|----------|------------|---------|
| Combinaciones de carga desequilibradas | **Semáforo de Carga Académica** | K-Means Clustering |
| Horarios con choques de tiempo | **Generador de Horarios** | Algoritmos Genéticos |
| Incertidumbre sobre notas necesarias | **Optimizador de Promedio** | Linear Optimization (SLSQP) |

El sistema gestiona un catálogo de **+1000 cursos** obtenidos por web scraping, soporta **10 carreras de ingeniería** de la USAC, y se despliega en Google Cloud Run con escalado automático.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19)                   │
│              http://localhost:5173 / kaiusac.netlify.app  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (CORS)
                         ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Flask + Gunicorn)                 │
│                  Google Cloud Run :8080                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Routers/    │  │  Módulos IA  │  │   Data/      │  │
│  │  (Blueprints)│  │              │  │   (Pensums)  │  │
│  │              │  │ • K-Means    │  │              │  │
│  │ • auth       │  │ • Genéticos  │  │ • 10 carreras│ │
│  │ • courses    │  │ • SciPy Opt  │  │ • +1000 cursos│ │
│  │ • schedules  │  │ • TF-IDF NLP │  │              │  │
│  │ • academic   │  │ • Financiero │  │              │  │
│  │ • chatbot    │  │              │  │              │  │
│  │ • plan       │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                         │                                │
│  ┌──────────────────────┴───────────────────────────┐   │
│  │              config.py (Singletons + DB Pool)     │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
┌──────────────────────┐  ┌──────────────────────┐
│  SQLite (Dev)        │  │  PostgreSQL (Prod)    │
│  usuarios.db         │  │  Cloud SQL (GCP)      │
└──────────────────────┘  └──────────────────────┘
              │
              ▼
┌──────────────────────┐
│  Google Cloud Storage│
│  (Fotos de perfil)   │
└──────────────────────┘
```

---

## Módulos de Inteligencia Artificial

### 1. Semáforo de Carga Académica — `clustering_semaforo.py`

Clasifica automáticamente cada curso del pensum en 3 niveles de dificultad usando **K-Means Clustering** sobre 4 features extraídos:

| Feature | Descripción | Peso |
|---------|-------------|------|
| Créditos | Más créditos = mayor carga | `créditos × 2.5` |
| Semestre | Progresión temporal | `semestre × 1.2` |
| Prerrequisitos | Cadena de dependencias | `num_prereqs × 3.5` |
| Análisis Semántico | Keywords de dificultad por carrera | `+12 / +6 / -6` |

El modelo entrena al inicio del servidor, se cachea con patrón **Singleton**, y se reutiliza entre requests sin overhead adicional. El mapeo de clusters a niveles (Verde/Amarillo/Rojo) se calcula dinámicamente según el score promedio de cada cluster.

```python
# Resultado del análisis
{
  "semaforo": "amarillo",
  "mensaje": "Carga Pesada: 2 difíciles y varios medios.",
  "cursos_por_nivel": {1: 2, 2: 2, 3: 1}
}
```

### 2. Generador de Horarios — `motor_generador.py` / `motor_custom.py`

Motor de **Algoritmos Genéticos** que genera combinaciones óptimas de horarios sin choques. Evoluciona una población de 70 individuos durante 30 generaciones:

| Componente | Descripción |
|-----------|-------------|
| **Cromosoma** | Array de paquetes (Teoría + Lab/Práctica) por curso |
| **Fitness** | `1000 + (cursos × 60) + (peso_estratégico × 15) - penalizaciones_IA` |
| **Selección** | Elitismo (top 15 sobreviven) |
| **Cruce** | One-point crossover entre sobrevivientes |
| **Mutación** | 25% probabilidad de cambiar sección aleatoriamente |
| **Restricciones** | 0 choques horarios, límite de cursos por promedio |

Integra análisis financiero de costo de oportunidad y perfiles de usuario (relax/normal/tryhard).

**Motor Custom** (`motor_custom.py`): Variante con filtros avanzados (horario L-V/Sábado, catedrático, modalidad) sobre población de 50 individuos × 20 generaciones.

### 3. Optimizador de Promedio — `optimizador_promedio.py`

Calcula las **notas mínimas necesarias** en cursos actuales para alcanzar un promedio objetivo ponderado. Usa optimización con restricciones (**SciPy SLSQP**):

- **Función objetivo:** Minimizar varianza entre notas (distribución equitativa)
- **Restricción:** Suma ponderada ≥ puntos necesarios
- **Bounds:** Notas entre 61 (mínimo aprobar) y 100
- **Escenarios:** Pesimista (61), Realista (75), Optimista (90), Perfecto (100)

### 4. Chatbot Académico — `chatbot_academico.py`

Asistente conversacional basado en **intents + TF-IDF + cosine similarity** que opera 100% local sin APIs externas:

| Capacidad | Técnica NLP |
|-----------|------------|
| Detección de intención | TF-IDF Vectorizer + Cosine Similarity |
| Extracción de entidades | Regex + Fuzzy Matching (difflib) |
| Contexto personalizado | Historial de aprobados desde DB |
| Soporte multi-carrera | Mapeo dinámico de pensums |

Capacidades: prerrequisitos, búsqueda por nombre, cursos por semestre, prerrequisitos inversos, rutas completas, sugerencias personalizadas, progreso del estudiante.

### 5. Análisis de Competencias — `analisis_competencias.py`

Clasifica las competencias del estudiante en 4 áreas usando **TF-IDF + cosine similarity** contra arquetipos semánticos:

- **Desarrollo:** Programación, algoritmos, bases de datos
- **Ciencias:** Matemática, física, estadística
- **Hardware:** Electrónica, redes, arquitectura
- **Gestión:** Administración, economía, proyectos

### 6. Análisis Financiero — `financiero.py`

Calcula el **costo de oportunidad** de las decisiones académicas: identifica cursos críticos ignorados que podrían retrasar la graduación, y proyecta el impacto económico basado en salario meta.

---

## Estructura del Proyecto

```
Backend/
│
├── main.py                         # Entry point Flask + registro de Blueprints
├── config.py                       # Config global, DB adapter, singletons IA
├── requirements.txt                # Dependencias Python
├── Dockerfile                      # Deploy en Cloud Run (Gunicorn + Tesseract)
├── .env.example                    # Template de variables de entorno
│
├── routers/                        # API Endpoints (Flask Blueprints)
│   ├── auth.py                     # Auth: register, login, perfil, uploads
│   ├── courses.py                  # Cursos: pensum, OCR, aprobados, competencias
│   ├── schedules.py                # Horarios: generar IA, custom, guardar/obtener
│   ├── academic.py                 # IA: semáforo, clasificar, notas objetivo, escenarios
│   ├── chatbot.py                  # Chatbot: consultas, historial, límites por plan
│   └── plan.py                     # Suscripciones: free/daily/premium, features, contadores
│
├── clustering_semaforo.py          # IA: K-Means para clasificar dificultad de cursos
├── optimizador_promedio.py         # IA: Goal Seeking con SciPy para notas objetivo
├── motor_generador.py              # AG: Generador de horarios automáticos (IA mode)
├── motor_custom.py                 # AG: Generador de horarios personalizados (filtros)
├── chatbot_academico.py            # NLP: Chatbot académico con TF-IDF + intents
├── analisis_competencias.py        # NLP: Clasificación de competencias por área
├── financiero.py                   # Análisis de costo de oportunidad académico
├── storage.py                      # Storage: Google Cloud Storage con fallback local
│
├── inicializar_db.py               # Script: creación de tablas
├── migrar_plan.py                  # Script: migración de columnas para planes
│
└── Data/
    ├── Pensums/                    # CSV de pensums (10 carreras USAC)
    │   ├── sistemas.csv
    │   ├── civil.csv
    │   ├── industrial.csv
    │   ├── mecanica.csv
    │   ├── electronica.csv
    │   ├── electrica.csv
    │   ├── ambiental.csv
    │   ├── quimica.csv
    │   ├── mecanica_electrica.csv
    │   └── mecanica_industrial.csv
    │
    ├── cursos_oferta_limpio.csv    # +1000 secciones de cursos (web scraping)
    ├── cursos.xlsx                 # Archivo original (Fuente: registros USAC)
    ├── limpiar_datos.py            # Pipeline de limpieza de datos
    └── funcion.py                  # Script de análisis de avance académico
```

---

## API Endpoints

### Autenticación (`/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/register` | Registro de usuario |
| `POST` | `/login` | Login con hash SHA-256 |
| `POST` | `/guardar_usuario_info` | Guardar/actualizar perfil (carne, nombre, carrera) |
| `GET` | `/obtener_usuario_info/<carne>` | Obtener datos del estudiante |
| `GET` | `/perfil/<usuario>` | Perfil completo (foto, banner, carrera) |
| `PUT` | `/perfil/<usuario>` | Actualizar perfil con validaciones |
| `POST` | `/upload` | Subir foto perfil/banner (GCS o local) |
| `GET` | `/uploads/<filename>` | Servir archivo subido |

### Cursos (`/courses`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/pensum?carrera=` | Obtener CSV del pensum por carrera |
| `POST` | `/extraer_cursos` | OCR: extraer cursos de imágenes (Tesseract) |
| `POST` | `/guardar_aprobados` | Guardar cursos aprobados validados contra pensum |
| `GET` | `/aprobados/<carne>` | Obtener cursos aprobados del estudiante |
| `POST` | `/cargar_aprobados_imagenes` | OCR + guardado directo de imágenes |
| `POST` | `/cursos_aprobados` | Obtener aprobados + análisis de competencias IA |

### Horarios (`/schedules`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/generar_horario` | Generar horarios con Algoritmos Genéticos (IA) |
| `POST` | `/generar_horario_custom` | Generar horarios con filtros avanzados |
| `POST` | `/guardar_horario_final` | Guardar horario seleccionado en perfil |
| `GET` | `/obtener_horario_guardado/<usuario>` | Recuperar horario guardado |

### Módulos IA (`/academic`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/cursos_clasificados/<carne>` | Cursos clasificados por dificultad (semáforo) |
| `POST` | `/analizar_semaforo` | Analizar combinación de cursos con K-Means |
| `GET` | `/cursos_por_nivel/<1\|2\|3>` | Filtrar cursos por nivel de dificultad |
| `POST` | `/calcular_notas_objetivo` | Goal Seeking: notas necesarias para promedio meta |
| `POST` | `/calcular_promedio_actual` | Calcular promedio de los últimos 6 cursos |
| `POST` | `/simular_escenarios` | Simular escenarios (Pesimista → Perfecto) |

### Chatbot (`/chatbot`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/chatbot` | Consulta al chatbot académico (con límites por plan) |
| `GET` | `/chatbot/historial/<usuario>` | Historial de conversaciones |
| `GET` | `/chatbot/ayuda` | Capacidades y ejemplos del chatbot |

### Planes y Suscripciones (`/plan`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/plan/<usuario>` | Estado del plan y límites de uso |
| `GET` | `/plan/<usuario>/verificar/<feature>` | Verificar acceso a feature (chatbot, OCR, etc.) |
| `POST` | `/plan/<usuario>/usar/<feature>` | Incrementar contador de uso |
| `POST` | `/plan/<usuario>/activar` | Activar plan (daily/premium) |
| `GET` | `/planes` | Listar todos los planes disponibles |

---

## Stack Tecnológico

| Categoría | Tecnología | Propósito |
|-----------|-----------|-----------|
| **Framework** | Python 3.11 + Flask 3.1 | API REST, Blueprints, HTTP Server |
| **Machine Learning** | scikit-learn | K-Means Clustering, TF-IDF, Cosine Similarity |
| **Optimización** | SciPy (SLSQP) | Linear Optimization con restricciones |
| **Data Science** | Pandas + NumPy | Manipulación de datasets, cálculos vectoriales |
| **NLP** | NLTK + difflib | Tokenización, stopwords, fuzzy matching |
| **OCR** | Tesseract + Pillow | Extracción de texto de imágenes (español) |
| **Base de Datos** | SQLite (dev) / PostgreSQL (prod) | Persistencia dual con adapter pattern |
| **Cloud** | Google Cloud Run + Cloud SQL | Deploy serverless + DB gestionada |
| **Storage** | Google Cloud Storage | Almacenamiento de imágenes de perfil |
| **Containerización** | Docker + Gunicorn | Producción con workers y threads |
| **CORS** | flask-cors | Cross-origin desde Netlify y localhost |

---

## Instalación Local

### Prerrequisitos

- Python 3.11+
- Tesseract OCR (para funcionalidad OCR)

### Setup

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/kai.git
cd kai/Backend

# 2. Crear entorno virtual
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. (Opcional) Instalar Tesseract para OCR
# Windows: Descargar de https://github.com/UB-Mannheim/tesseract/wiki
# Linux: sudo apt install tesseract-ocr tesseract-ocr-spa

# 5. Inicializar base de datos
python inicializar_db.py

# 6. Ejecutar servidor de desarrollo
python main.py
```

El servidor estará disponible en `http://localhost:8000`

### Variables de Entorno

```bash
# Desarrollo local (SQLite automático - no requiere configuración)

# Producción (PostgreSQL en Cloud SQL)
DATABASE_URL=postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance

# O construir con variables individuales:
DB_USER=postgres
DB_PASS=****
DB_NAME=kai_db
INSTANCE_CONNECTION_NAME=project:region:instance
```

---

## Deploy en Producción

### Docker

```bash
# Build
docker build -t kai-backend .

# Run
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  kai-backend
```

### Google Cloud Run

El `Dockerfile` está optimizado para Cloud Run:

- Imagen base `python:3.11-slim` (ligera)
- Tesseract OCR instalado en la imagen
- Gunicorn con 1 worker, 8 threads
- Puerto dinámico vía `PORT` env var
- PostgreSQL via Unix Socket (Cloud SQL)

---

## Base de Datos

El sistema usa un **adapter pattern** que permite cambiar entre SQLite y PostgreSQL sin modificar el código:

```
config.py
├── get_db_connection()    → SQLite (dev) o PostgreSQL (prod)
├── execute_query()        → Adapta placeholders (? → %s)
└── init_db()              → Crea tablas con SQL dialect-aware
```

### Esquema

```sql
usuarios              → Credenciales de acceso (usuario, email, password hash)
usuarios_info         → Perfil + contadores de planes (carne, carrera, fotos, límites)
cursos_aprobados      → Historial académico (JSON de cursos con nota y créditos)
horarios_guardados    → Horarios seleccionados (JSON del horario final)
chatbot_historial     → Conversaciones del chatbot (pregunta, respuesta, intent)
chatbot_feedback      → Feedback de utilidad del chatbot
```

### Multi-Carrera

Soporta 10 carreras de ingeniería con pensums independientes:

| Carrera | Archivo |
|---------|---------|
| Ing. en Sistemas | `sistemas.csv` |
| Ing. Civil | `civil.csv` |
| Ing. Industrial | `industrial.csv` |
| Ing. Mecánica | `mecanica.csv` |
| Ing. Electrónica | `electronica.csv` |
| Ing. Eléctrica | `electrica.csv` |
| Ing. Ambiental | `ambiental.csv` |
| Ing. Química | `quimica.csv` |
| Ing. Mecánica Industrial | `mecanica_industrial.csv` |
| Ing. Mecánica Eléctrica | `mecanica_electrica.csv` |

---

## Modelos de Suscripción

| Feature | Free | Day Pass ($10) | Premium ($29) |
|---------|------|----------------|---------------|
| Chatbot | 5/día | Ilimitado | Ilimitado |
| Generador Manual | 3/semestre | Ilimitado | Ilimitado |
| Generador IA | No | Ilimitado | Ilimitado |
| OCR (imágenes) | 1/mes | Ilimitado | Ilimitado |
| Análisis Financiero | Si | Si | Si |
| Optimizador Promedio | Si | Si | Si |
| Simulador Escenarios | No | Si | Si |
| Pensum Visual (grafo) | No | Si | Si |

---

## Seguridad

- **Passwords:** Hash SHA-256
- **Sanitización:** Eliminación de tags HTML y detección de keywords SQLi/XSS en inputs
- **Validación:** Formato de email, rango de fechas (1960-2015), carné numérico (max 9 dígitos)
- **CORS:** Whitelist de orígenes permitidos (localhost + Netlify)
- **OCR:** Validación estricta contra pensum oficial para evitar inyección de datos
- **File Uploads:** `secure_filename` de Werkzeug + extensión whitelist

---

## Optimizaciones de Rendimiento

- **Singletons de IA:** Modelos K-Means entrenados una sola vez y cacheados en memoria
- **Cache de analizadores:** Dict global `_CACHE_ANALIZADORES` compartido entre módulos
- **Consulta adaptativa:** `get_user_career()` evita queries innecesarias
- **Deduplicación OCR:** Algoritmo de merge que conserva la mejor nota por código
- **Grafo de dependencias precalculado:** Pesos estratégicos calculados en init, no en cada request
- **Gunicorn:** 1 worker con 8 threads optimizado para I/O bound (Cloud Run)

---

## Licencia

Este proyecto fue desarrollado como trabajo de graduación de Ingeniería en Sistemas - USAC.

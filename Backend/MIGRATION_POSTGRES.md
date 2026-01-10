# Migración a PostgreSQL para Cloud Run

## Resumen

El backend ahora soporta **dos bases de datos**:
- **SQLite** (desarrollo local) - por defecto
- **PostgreSQL** (producción/Cloud Run) - cuando `DATABASE_URL` está configurado

## Cómo funciona

El sistema detecta automáticamente qué base de datos usar:

```python
# Si DATABASE_URL existe → PostgreSQL
# Si DATABASE_URL NO existe → SQLite (usuarios.db)
```

## Desarrollo Local

No necesitas cambiar nada. El backend usará `usuarios.db` automáticamente.

```bash
cd Backend
python main.py
```

## Producción (Cloud Run + Cloud SQL)

### 1. Crear instancia de Cloud SQL (PostgreSQL)

```bash
# Crear instancia
gcloud sql instances create kai-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Crear base de datos
gcloud sql databases create kai --instance=kai-db

# Crear usuario
gcloud sql users create kai_user \
  --instance=kai-db \
  --password=TU_PASSWORD_SEGURO
```

### 2. Configurar Cloud Run

Agregar las siguientes variables de entorno en Cloud Run:

```
DATABASE_URL=postgresql://kai_user:TU_PASSWORD@/kai?host=/cloudsql/TU_PROYECTO:us-central1:kai-db
```

### 3. Conectar Cloud Run a Cloud SQL

En la configuración de Cloud Run, agregar la conexión a Cloud SQL:
- Instancia: `TU_PROYECTO:us-central1:kai-db`

### 4. Inicializar la base de datos

Después del primer deploy, ejecutar la migración inicial:

```bash
# Opción 1: Conectarse al Cloud Shell
gcloud run jobs execute --region=us-central1

# Opción 2: El servidor inicializa automáticamente las tablas al iniciar
```

## Archivos Modificados

- `config.py` - Sistema de conexión dual
- `routers/auth.py` - Migrado a execute_query()
- `routers/courses.py` - Migrado a execute_query()
- `routers/schedules.py` - Migrado a execute_query()
- `routers/chatbot.py` - Migrado a execute_query()
- `routers/academic.py` - Migrado a execute_query()
- `routers/plan.py` - Migrado a execute_query()
- `inicializar_db.py` - Simplificado
- `migrar_plan.py` - Actualizado para dual DB
- `requirements.txt` - Agregado psycopg2-binary

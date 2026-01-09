---
description: Reporte de funciones Premium y ubicación para implementar lógica de bloqueo según suscripción
---

# 📋 Reporte: Funciones Premium y Ubicación para Bloqueo

> **Última actualización:** 2026-01-08
> **Propósito:** Guía para implementar restricciones de features según plan de suscripción

---

## 🔐 Resumen de Configuración de Planes

| Feature | FREE | DAILY/PREMIUM |
|---------|------|---------------|
| **Chatbot IA** | 5/día | Ilimitado |
| **Generador Manual** | 3/semestre | Ilimitado |
| **Generador IA** | ❌ Bloqueado | ✅ Ilimitado |
| **OCR Escaneo** | 2 totales | Ilimitado |
| **Análisis Financiero** | ✅ Gratis | ✅ |
| **Optimizador Promedio** | ✅ Gratis | ✅ |
| **Simulador Escenarios** | ❌ Bloqueado | ✅ |
| **Pensum en Grafo** | ❌ Bloqueado | ✅ |

---

## 📍 Features y Archivos a Modificar

### 1️⃣ Chatbot IA - Límite de 5 preguntas diarias

| Aspecto | Detalle |
|---------|---------|
| **Archivo Frontend** | `Frontend/src/pages/ChatbotAcademico.jsx` |
| **Función a bloquear** | `enviarMensaje()` (línea ~140) |
| **Tipo de bloqueo** | Contador diario - Mostrar modal cuando `chatbot_usado >= 5` |
| **Endpoint backend** | `GET /api/plan/{usuario}/verificar/chatbot` |
| **Incrementar uso** | `POST /api/plan/{usuario}/usar/chatbot` |

---

### 2️⃣ Generador de Horarios Manual - Límite de 3/semestre

| Aspecto | Detalle |
|---------|---------|
| **Archivo Frontend** | `Frontend/src/pages/SchedulePage.jsx` |
| **Función a bloquear** | `handleGenerarOptimizado()` (línea ~41) |
| **Tipo de bloqueo** | Contador semestral - Mostrar modal cuando `generador_usado >= 3` |
| **Endpoint backend** | `GET /api/plan/{usuario}/verificar/generador_manual` |
| **Incrementar uso** | `POST /api/plan/{usuario}/usar/generador` |

---

### 3️⃣ Generador de Horarios con IA - Solo Premium ⭐

| Aspecto | Detalle |
|---------|---------|
| **Archivo Frontend** | `Frontend/src/pages/SchedulePage.jsx` |
| **Botón a crear** | Nuevo botón "Generar con IA ⚡" (actualmente no existe) |
| **Tipo de bloqueo** | Feature completa - Verificar antes de mostrar/habilitar |
| **Endpoint backend** | `GET /api/plan/{usuario}/verificar/generador_ia` |

---

### 4️⃣ OCR - Escaneo de Notas - Límite de 2 totales

| Aspecto | Detalle |
|---------|---------|
| **Archivo Frontend** | `Frontend/src/components/dashboard/UploadModal.jsx` |
| **Función a bloquear** | Al subir imagen para OCR |
| **Tipo de bloqueo** | Contador total - Mostrar modal cuando `ocr_usado >= 2` |
| **Endpoint backend** | `GET /api/plan/{usuario}/verificar/ocr` |
| **Incrementar uso** | `POST /api/plan/{usuario}/usar/ocr` |

---

### 5️⃣ Simulador de Escenarios - Solo Premium ⭐

| Aspecto | Detalle |
|---------|---------|
| **Archivo Frontend** | `Frontend/src/pages/OptimizadorPromedio.jsx` |
| **Función a bloquear** | `simularEscenarios()` (línea ~253) |
| **Tipo de bloqueo** | Feature completa - Verificar antes de mostrar sección |
| **Endpoint backend** | `GET /api/plan/{usuario}/verificar/simulador` |

---

### 6️⃣ Vista del Pensum en Grafo - Solo Premium ⭐

| Aspecto | Detalle |
|---------|---------|
| **Archivo Frontend** | `Frontend/src/pages/PensumPage.jsx` |
| **Componente** | `Frontend/src/components/PensumGraph.jsx` |
| **Tipo de bloqueo** | Tab/Vista completa - Verificar antes de renderizar |
| **Endpoint backend** | `GET /api/plan/{usuario}/verificar/pensum_grafo` |

---

## 🛠️ Endpoints del Backend Disponibles

### Verificar si puede usar feature
```
GET /api/plan/{usuario}/verificar/{feature}
```
**Features válidas:** `chatbot`, `generador_manual`, `generador_ia`, `ocr`, `simulador`, `pensum_grafo`

**Respuesta permitido:**
```json
{
  "permitido": true,
  "restante": 3
}
```

**Respuesta bloqueado (límite):**
```json
{
  "permitido": false,
  "razon": "Has alcanzado tu límite de 5 preguntas diarias",
  "limite": 5,
  "usado": 5
}
```

**Respuesta bloqueado (premium):**
```json
{
  "permitido": false,
  "razon": "El simulador de escenarios está disponible en el plan Premium",
  "requiere_premium": true
}
```

### Incrementar contador de uso
```
POST /api/plan/{usuario}/usar/{feature}
```
**Features con contador:** `chatbot`, `generador`, `ocr`

### Obtener plan del usuario
```
GET /api/plan/{usuario}
```
**Respuesta:**
```json
{
  "plan": "free",
  "nombre_plan": "Plan Gratuito",
  "fecha_fin": null,
  "limites": {
    "chatbot_diario": 5,
    "chatbot_usado": 2,
    "generador_manual_total": 3,
    "generador_ia_total": 0,
    "generador_usado": 1,
    "ocr_total": 2,
    "ocr_usado": 0
  },
  "features": {
    "analisis_financiero": true,
    "optimizador": true,
    "simulador": false,
    "pensum_grafo": false
  }
}
```

---

## 📁 Resumen de Archivos a Modificar

| Archivo | Features a bloquear |
|---------|---------------------|
| `pages/ChatbotAcademico.jsx` | Chatbot (límite diario) |
| `pages/SchedulePage.jsx` | Generador Manual (límite), Generador IA (premium) |
| `components/dashboard/UploadModal.jsx` | OCR (límite) |
| `pages/OptimizadorPromedio.jsx` | Simulador de Escenarios (premium) |
| `pages/PensumPage.jsx` | Vista en Grafo (premium) |
| `components/PensumGraph.jsx` | Vista en Grafo (premium) |

---

## 🎯 Orden Sugerido de Implementación

1. **Chatbot IA** - Mayor uso diario, impacto inmediato
2. **OCR** - Fácil de implementar, un solo modal
3. **Generador Manual** - Importante para monetización
4. **Simulador de Escenarios** - Feature premium clara
5. **Pensum en Grafo** - Feature premium visual
6. **Generador IA** - Requiere crear nuevo botón/flujo

---

## 📝 Configuración Backend

**Archivo de configuración:** `Backend/routers/plan.py`
**Líneas de configuración:** 14-52 (PLANES_CONFIG)

```python
PLANES_CONFIG = {
    "free": {
        "chatbot_limite_diario": 5,
        "generador_manual_limite": 3,
        "generador_ia_limite": 0,
        "ocr_limite": 2,
        "tiene_simulador": False,
        "tiene_pensum_grafo": False
    },
    "daily": { ... },  # Todo ilimitado por 24h
    "premium": { ... } # Todo ilimitado
}
```

---

## 💰 Precios Actuales

| Plan | Precio | Duración |
|------|--------|----------|
| Gratuito | Q0 | - |
| Day Pass | Q10 | 24 horas |
| Premium | Q29 | /mes |
| Semestral | Q145 | 5 meses |

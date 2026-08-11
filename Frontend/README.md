# KAI Frontend - SPA React con Visualización de Datos y Diseño Glassmorphism

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=for-the-badge&logo=framer&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-3-D3E859?style=for-the-badge&logo=react&logoColor=black)
![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

**Interfaz SPA de alto rendimiento con diseño glassmorphism, visualizaciones interactivas 2D/3D y experiencia responsive que conecta con un backend Flask + IA.**

[Demo en vivo](https://kaiusac.netlify.app) · [Backend API](../Backend/) · [Reportar bug](https://github.com/tu-usuario/kai/issues)

</div>

---

## Descripción General

Frontend de **KAI (Kairos Artificial Intelligence)**: una plataforma web integral para planificación académica universitaria construida como **Single Page Application (SPA)** con React 19, TailwindCSS y un sistema de diseño glassmorphism. Consume una API REST Flask con 3 motores de Inteligencia Artificial y presenta los resultados mediante visualizaciones de datos interactivas (gráficos Recharts, grafo de fuerza SVG, calendario semanal y partículas 3D con Three.js).

Desplegada en **Netlify** con CI/CD automático desde GitHub.

---

## Características Principales

| Módulo | Descripción | Técnicas Frontend |
|--------|-------------|-------------------|
| **Landing Page** | Página de presentación con partículas 3D interactivas | Three.js + React Three Fiber + Framer Motion |
| **Dashboard** | Panel con estadísticas, horario y "próxima clase" en tiempo real | Polling 60s, StatCards, HorarioVisualizer |
| **Semáforo de Carga** | Selección de cursos con análisis K-Means + generación de horarios | Recharts (Pie + Bar), filtros avanzados, localStorage |
| **Optimizador de Promedio** | Goal Seeking con gráficos de barras y líneas | Recharts (Bar + Line), tabs, importación desde horario |
| **Generador de Horarios** | Modo IA vs Modo Manual con configuración laboral | Validación de inputs, Premium gating |
| **Chatbot Académico** | Interfaz conversacional con efecto mecanografía | Effect typing, historial, límites por plan |
| **Perfil** | Radar de competencias IA + gestión de suscripción | Recharts (Radar + RadialBar + Pie), upload GCS |
| **Pensum Interactivo** | Vista Grid + Grafo de fuerza con simulación física | SVG force-directed graph, zoom/pan, touch events |
| **Exportar PDF** | Descarga de horarios como PDF | html2canvas + jsPDF |

---

## Arquitectura del Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                     Netlify CDN (SPA)                        │
│                    kaiusac.netlify.app                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    React 19 SPA (Vite 7)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              App.jsx (React Router v7)                  │ │
│  │                                                         │ │
│  │  "/" ──── LandingPage (3D Particles + Sections)        │ │
│  │  "/login" ── Login                                      │ │
│  │  "/register" ─ Register                                 │ │
│  │                                                         │ │
│  │  <ProtectedRoute> + <PlatformLayout>                    │ │
│  │  ├── /dashboard ─── Dashboard (Stats + Schedule)       │ │
│  │  ├── /aprobados ─── ApprovedCoursesPage                │ │
│  │  ├── /pensum ─────── PensumPage (Grid + Graph)         │ │
│  │  ├── /horarios ───── SchedulePage (IA vs Manual)       │ │
│  │  ├── /semaforo ───── SemaforoCarga (K-Means UI)        │ │
│  │  ├── /optimizador ── OptimizadorPromedio (Goal Seek)   │ │
│  │  ├── /resultado ──── ResultadoHorario (Visualizer+PDF) │ │
│  │  ├── /chatbot ────── ChatbotAcademico (NLP UI)         │ │
│  │  └── /perfil ─────── Perfil (Radar + Subscription)     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Component Layer (~30 componentes)          │ │
│  │                                                         │ │
│  │  ui/ ──── PlatformLayout, GlassLayout, GlassCard       │ │
│  │  landing/ ── HeroSection, FeaturesSection, 3DParticles │ │
│  │  dashboard/ ── InitialRegistration, UploadModal, ...   │ │
│  │  shared/ ── Navbar, HorarioVisualizer, PensumGraph     │ │
│  │  modals/ ── PricingModal, GradesModal, HelpModal       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              State & API Layer                          │ │
│  │                                                         │ │
│  │  api/apiConfig.js → API_URL (env var o Cloud Run)      │ │
│  │  localStorage → Sesión, progreso, configuración        │ │
│  │  fetch() → ~25 endpoints REST al backend Flask          │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Estructura del Proyecto

```
Frontend/
│
├── index.html                          # Entry HTML (CDN Bootstrap legacy)
├── package.json                        # Dependencias + scripts
├── vite.config.js                      # Vite + SWC (Fast Refresh)
├── tailwind.config.js                  # Tema custom (pastel palette, dark mode)
├── postcss.config.js                   # PostCSS para Tailwind
├── eslint.config.js                    # ESLint + React Hooks
├── .env.local                          # VITE_API_URL (no commiteado)
│
└── src/
    ├── main.jsx                        # Entry point React (StrictMode)
    ├── App.jsx                         # Router + rutas protegidas
    ├── index.css                       # Tailwind base + custom animations
    │
    ├── api/
    │   └── apiConfig.js                # URL base del backend (env-aware)
    │
    ├── pages/                          # 14 Páginas (Route Components)
    │   ├── LandingPage.jsx             # Landing con secciones scroll
    │   ├── Login.jsx                   # Login con validación XSS/SQLi
    │   ├── Register.jsx                # Registro con auto-login
    │   ├── Dashboard.jsx               # Panel principal con stats
    │   ├── ApprovedCoursesPage.jsx     # Historial académico
    │   ├── PensumPage.jsx              # Pensum Grid + Grafo interactivo
    │   ├── SchedulePage.jsx            # Generador IA vs Manual
    │   ├── SemaforoCarga.jsx           # Semáforo K-Means + filtros
    │   ├── OptimizadorPromedio.jsx     # Goal Seeking + escenarios
    │   ├── ResultadoHorario.jsx        # Visualización + exportar PDF
    │   ├── ChatbotAcademico.jsx        # Chat NLP con interface
    │   ├── Perfil.jsx                  # Perfil + Radar IA + suscripción
    │   ├── GlassDemo.jsx               # Demo del design system
    │   └── ComingSoonPage.jsx          # Placeholder de features
    │
    └── components/                     # ~30 Componentes reutilizables
        │
        ├── ui/                         # Design System
        │   ├── PlatformLayout.jsx      # Layout principal (Navbar + Outlet + Footer)
        │   ├── GlassLayout.jsx         # Wrapper glassmorphism
        │   ├── GlassCard.jsx           # Card reutilizable glass
        │   └── StatCard.jsx            # Tarjeta de estadística
        │
        ├── landing/                    # Landing Page Sections
        │   ├── HeroSection.jsx         # Hero con partículas 3D
        │   ├── ThreeDParticles.jsx     # Canvas Three.js animado
        │   ├── FeaturesSection.jsx     # Features grid
        │   ├── SecuritySection.jsx     # Sección de seguridad
        │   ├── ScalabilitySection.jsx  # Sección de escalabilidad
        │   ├── ContactSection.jsx      # Formulario de contacto
        │   ├── CreditsSection.jsx      # Créditos del equipo
        │   ├── Footer.jsx              # Footer landing
        │   ├── Navbar.jsx              # Nav landing
        │   └── MaintenanceModal.jsx    # Modal de mantenimiento
        │
        ├── dashboard/                  # Dashboard Widgets
        │   ├── InitialRegistration.jsx # Onboarding de usuario nuevo
        │   ├── ApprovedCoursesTab.jsx  # Tab de aprobados
        │   ├── PensumTab.jsx           # Tab de pensum
        │   ├── ScheduleManagementTab.jsx # Tab de horario
        │   ├── UploadModal.jsx         # Modal de subida OCR
        │   └── GradesModal.jsx         # Modal de notas
        │
        ├── auth/
        │   └── AuthBackground.jsx      # Fondo animado auth pages
        │
        ├── Navbar.jsx                  # Navbar plataforma (sidebar)
        ├── PlatformFooter.jsx          # Footer plataforma
        ├── ProtectedRoute.jsx          # HOC de rutas protegidas
        ├── HorarioVisualizer.jsx       # Calendario semanal + vista lista
        ├── PensumGraph.jsx             # Grafo SVG force-directed
        ├── PricingModal.jsx            # Modal de planes (Free/Daily/Premium)
        ├── FloatingChatButton.jsx      # FAB del chatbot
        ├── Footer.jsx                  # Footer genérico
        └── Input.jsx                   # Input reutilizable
```

---

## Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Framework** | React | 19.2 | UI component-based con hooks |
| **Build Tool** | Vite | 7.2 | Dev server HMR + build optimizado |
| **Compiler** | SWC | 4.2 | Fast Refresh (reemplazo de Babel) |
| **CSS** | TailwindCSS | 3.4 | Utility-first + dark mode + custom theme |
| **Animaciones** | Framer Motion | 12.25 | Transiciones, AnimatePresence, gestos |
| **Routing** | React Router DOM | 7.9 | SPA routing + protected routes + Outlet |
| **Gráficos 2D** | Recharts | 3.5 | Pie, Bar, Line, Radar, RadialBar charts |
| **Gráficos 3D** | Three.js + R3F | 0.182 / 9.5 | Partículas 3D en landing page |
| **3D Helpers** | @react-three/drei | 10.7 | Utilidades para R3F |
| **Exportar PDF** | jsPDF + html2canvas | 4.0 / 1.4 | Descarga de horarios como PDF |
| **CSV Parsing** | PapaParse | 5.5 | Lectura de pensums CSV del backend |
| **Iconos** | Lucide React | 0.556 | Iconografía consistente y tree-shakable |
| **Linting** | ESLint | 9.39 | Code quality + React Hooks rules |
| **Deploy** | Netlify | - | CI/CD desde GitHub |

---

## Sistema de Diseño

### Glassmorphism

El diseño se basa en **glassmorphism**: tarjetas con `backdrop-blur-xl`, bordes semi-transparentes y fondos `bg-white/60` sobre un lienzo con gradientes pastel.

```css
/* Patrón base de todas las tarjetas */
backdrop-blur-xl
bg-white/60 dark:bg-slate-800/60
border border-white/40 dark:border-slate-700/50
rounded-2xl shadow-sm
```

### Paleta de Colores Custom (Tailwind)

```javascript
colors: {
  pastel: {
    purple: '#E8DFF5',
    pink: '#FDE2E4',
    blue: '#DFEEF3',
    yellow: '#FFF9E6',
    green: '#E4F5E4',
  }
}
```

### Dark Mode

Soporte completo mediante la clase `dark:` de Tailwind. Toggle almacenado en `localStorage`.

### Animaciones Custom

| Animación | Descripción | Uso |
|-----------|-------------|-----|
| `animate-fadeIn` | Fade + slide up | Transición de páginas |
| `animate-slide-in` | Slide desde derecha | Toast notifications |
| `animate-blob` | Blob movement | Fondos decorativos |
| `animate-scaleIn` | Scale + fade | Modales |
| Efecto Mecanografía | Typewriter character-by-character | Chatbot responses |

---

## Patrones de Arquitectura

### 1. Protected Routes con Layout Anidado

```jsx
<Route element={<ProtectedRoute><PlatformLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  // ... todas las rutas autenticadas
</Route>
```

El `ProtectedRoute` verifica `localStorage.getItem("usuario")` y redirige al landing si no existe. `PlatformLayout` provee el sidebar + footer compartidos.

### 2. Estado Persistido en localStorage

Cada módulo persiste su estado en `localStorage` con claves por usuario:

```javascript
const STORAGE_KEY = `SIOA_progreso_${userData.carne || "invitado"}`;
// Persiste: cursosSeleccionados, resultado, horarioGenerado, filtrosAvanzados
```

### 3. API Layer Centralizada

```javascript
// api/apiConfig.js
const API_URL = import.meta.env.VITE_API_URL || "https://kai-backend-xxx.run.app";
export default API_URL;
```

Todas las páginas importan `API_URL` y hacen `fetch()` directo (~25 endpoints).

### 4. Premium Gating Pattern

Los features premium muestran un modal de pricing al intentar acceder:

```javascript
if (!tieneAccesoIA) {
  setMostrarLimiteIAModal(true);  // Muestra PricingModal
  return;
}
```

### 5. Force-Directed Graph (SVG)

El `PensumGraph` implementa un algoritmo de simulación de fuerza custom:

```
300 ticks de simulación:
├── Repulsión Coulomb (6000 / dist²)
├── Springs Hooke (k=0.08, len=80)
├── Center Gravity (k=0.02)
└── Damping (0.8)
```

Renderizado en SVG con Framer Motion para transiciones suaves.

---

## Seguridad Frontend

Validaciones en cliente (primera línea de defensa; el backend re-valida):

| Validación | Implementación |
|-----------|----------------|
| **XSS** | Regex contra `<script>`, `alert()`, etiquetas HTML |
| **SQL Injection** | Bloqueo de keywords `SELECT`, `DROP`, `DELETE`, `INSERT` |
| **Input Sanitization** | Caracteres peligrosos `[<>;'"/=\\]` rechazados |
| **Email** | Regex de formato + keywords peligrosas |
| **Fechas** | Rango 1960-2015 validado |
| **Carné** | Solo dígitos, max 9 caracteres |
| **Chat** | Max 300 chars, sin comillas ni punto y coma |
| **Notas** | Rango 61-100, limpieza de input numérico |
| **Usuario** | Regex `^[a-z0-9._]+$`, min 4 chars |

---

## Integración con Backend IA

El frontend consume **3 motores de IA** vía API REST:

```
Frontend (React)                Backend (Flask + IA)
───────────────                 ────────────────────
SemaforoCarga ─────POST────────→ K-Means Clustering
  /analizar_semaforo             (clustering_semaforo.py)

SchedulePage ─────POST────────→ Algoritmo Genético
  /generar_horario               (motor_generador.py)
  /generar_horario_custom        (motor_custom.py)

OptimizadorPromedio ─POST──────→ SciPy SLSQP Optimization
  /calcular_notas_objetivo       (optimizador_promedio.py)
  /simular_escenarios

ChatbotAcademico ──POST────────→ TF-IDF + Cosine Similarity
  /chatbot                       (chatbot_academico.py)

Perfil ─────────────POST────────→ TF-IDF Competence Analysis
  /cursos_aprobados              (analisis_competencias.py)
```

---

## Componentes Destacados

### HorarioVisualizer (`components/HorarioVisualizer.jsx`)

Visualizador de horario semanal con posicionamiento absoluto por minutos:

- **Vista Calendario**: Grid 6 columnas (Lun-Sáb) × filas de horas. Cada curso se posiciona con `top` y `height` calculados a partir de `Inicio_Min` y `Final_Min`.
- **Vista Lista**: Cards con datos del curso (código, sección, catedrático, edificio, modalidad).
- **Responsive**: Scroll horizontal en móvil, min-width 800px para calendario.
- **Análisis financiero**: Footer colapsable con impacto económico.

### PensumGraph (`components/PensumGraph.jsx`)

Grafo interactivo del pensum con simulación de fuerza custom:

- **Nodos**: Círculos SVG con estado visual (verde=aprobado, azul=disponible, rojo=bloqueado).
- **Edges**: Líneas SVG que cambian color según el estado de los nodos conectados.
- **Interacción**: Hover resalta conexiones, click abre modal de nota, zoom con scroll, drag para panear.
- **Touch support**: Touch events para móvil (drag + zoom).
- **Premium gate**: Vista bloqueada para usuarios free.

### PricingModal (`components/PricingModal.jsx`)

Modal de planes renderizado con `createPortal` en `document.body`:

- 3 planes: Free (Q0), Day Pass (Q10/24h), Premium (Q25/mes).
- Comparación de features con badges de "IA" y "Limitado".
- Integración con WhatsApp para pagos.
- Política de no reembolsos.

---

## Visualización de Datos

| Página | Gráfico | Librería | Datos |
|--------|---------|----------|-------|
| Dashboard | StatCards (6) | Custom | Promedio, créditos, avance, cursos, horas, próxima clase |
| SemaforoCarga | Pie Chart + Bar Chart | Recharts | Distribución de dificultad (Verde/Amarillo/Rojo) |
| OptimizadorPromedio | Bar Chart + Line Chart | Recharts | Notas necesarias por curso / Escenarios proyectados |
| Perfil | Radar Chart + RadialBar + Pie | Recharts | Competencias IA (Desarrollo/Ciencias/Hardware/Gestión) |
| PensumPage | Force Graph | SVG + Framer Motion | Grafo de dependencias del pensum |
| Landing | 3D Particles | Three.js + R3F | Canvas animado con partículas |

---

## Instalación Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/kai.git
cd kai/Frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variable de entorno (opcional)
# Crear archivo .env.local:
echo "VITE_API_URL=http://localhost:8000" > .env.local

# 4. Ejecutar servidor de desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

### Scripts

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `vite` | Dev server con HMR (SWC) |
| `npm run build` | `vite build` | Build optimizado para producción |
| `npm run lint` | `eslint .` | Análisis estático de código |
| `npm run preview` | `vite preview` | Preview del build local |

---

## Deploy

### Netlify (Producción)

El frontend se despliega en Netlify con CI/CD automático:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variables:** `VITE_API_URL` apuntando al backend en Cloud Run
- **Redirects:** SPA fallback (`/* → /index.html 200`)

### Variables de Entorno

```bash
VITE_API_URL=https://kai-backend-677415948082.us-central1.run.app  # Producción
# VITE_API_URL=http://localhost:8000                                # Desarrollo
```

---

## Responsive Design

El diseño es **mobile-first** con breakpoints de Tailwind:

| Breakpoint | Layout |
|-----------|--------|
| `< 640px` (sm) | Single column, sidebar como bottom nav, modales fullscreen |
| `640-1024px` (md) | Grid 2 columnas, sidebar colapsable |
| `> 1024px` (lg) | Grid 12 columnas, sidebar fijo, sticky panels |

Componentes responsive destacados:
- **SemaforoCarga**: Grid `lg:grid-cols-12` (7/5 split)
- **OptimizadorPromedio**: Grid `lg:grid-cols-12` (8/4 split)
- **Chatbot**: Grid `lg:grid-cols-4` (3/1 split) con menú móvil fullscreen
- **Perfil**: Grid `lg:grid-cols-12` (8/4 split)

---

## Licencia

Este proyecto fue desarrollado como trabajo de graduación de Ingeniería en Sistemas - USAC.

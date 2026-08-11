# KAI - Kairos Artificial Intelligence

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Machine Learning](https://img.shields.io/badge/Machine_Learning-K--Means%20%7C%20Genetic%20Algorithms-orange?style=for-the-badge)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-Cloud_Run%20%7C%20Cloud_SQL-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Deployed](https://img.shields.io/badge/Live-kaiusac.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)

### 🎓 Your Intelligent Academic Assistant for University

**AI-powered web platform that automates university academic planning: generates conflict-free schedules, analyzes academic workload, and predicts the grades needed to reach your GPA goals.**

[🚀 Live Demo](https://kaiusac.netlify.app) · [📖 Backend Docs](./Backend/) · [📖 Frontend Docs](./Frontend/)

</div>

---

<div align="center">

**[🇬🧷 English](#english) | [🇪🇸 Español](#español)**

</div>

---

<a id="english"></a>
## 🇬🧷 English Version

### 💭 The Story Behind KAI

#### The Problem

At the Faculty of Engineering of USAC (Universidad de San Carlos de Guatemala), every semester thousands of students face the same chaos: **the official course page only shows a giant table with 1000+ sections from all majors**, with no smart filters, no schedule generator, no way to visualize if your academic load is balanced.

Students spend **hours manually** cross-referencing schedules in Excel, asking senior classmates, risking enrolling in "suicide schedules" with 3 difficult courses that lead to dropout. There's no tool to help them make informed decisions about their semester.

#### The Solution

**KAI was born as a response to this problem.** It's not just a technical project: it's a **social help tool** designed by students, for students.

Imagine telling the system: *"I want to take these 6 courses, I work Mondays 2-6pm, and I want my schedule to have no conflicts"*. KAI generates **5 optimal options** in seconds, considering prerequisites, course difficulty, and your availability.

Or asking: *"What grades do I need in my current courses to finish with an 85 GPA?"*. The system calculates exactly what you need in each course.

Or simply asking an academic chatbot: *"What are the prerequisites for Compilers?"* and getting an instant answer, without searching through 200-page PDFs.

**That's KAI.** Your intelligent companion to survive and thrive in engineering.

---

### 🎯 What Does KAI Solve?

| Student Problem | KAI Solution | Technology |
|-----------------|--------------|------------|
| "I don't know which courses I can take together without conflicts" | **Schedule Generator** that creates 5 conflict-free options | Genetic Algorithms |
| "I don't know if my course load is too difficult this semester" | **Academic Load Traffic Light** that classifies courses in Green/Yellow/Red | K-Means Clustering |
| "I don't know what grades I need to reach my target GPA" | **GPA Optimizer** that calculates required grades course by course | Linear Optimization (SciPy) |
| "I don't remember the prerequisites for this course" | **Academic Chatbot** that answers questions about the curriculum | TF-IDF + NLP |
| "I don't know how much progress I've made in my major" | **Dashboard** with credits, GPA, progress, and next class | Interactive Visualization |

---

### ✨ Key Features

#### 🧬 3 AI Engines

**1. Academic Load Traffic Light (K-Means Clustering)**

Automatically classifies each course in the curriculum into 3 difficulty levels using 4 features: credits, semester, prerequisites, and semantic keyword analysis. Alerts you if you're building a "suicide schedule".

```
Result: {
  "traffic_light": "yellow",
  "message": "Heavy Load: 2 difficult and several medium courses",
  "courses_by_level": {1: 2, 2: 2, 3: 1}
}
```

**2. Schedule Generator (Genetic Algorithms)**

Evolutionary engine that generates optimal schedule combinations without conflicts. Evolves a population of 70 individuals over 30 generations with:
- **Chromosome**: Array of packages (Theory + Lab) per course
- **Fitness**: Score based on courses taken, strategic weight, user profile (relax/normal/tryhard)
- **Selection**: Elitism (top 15 survive) + crossover + mutation
- **Constraints**: 0 schedule conflicts, course limit based on GPA

Integrates financial opportunity cost analysis: if you leave a critical course out, it shows how many months it could delay your graduation.

**3. GPA Optimizer (Goal Seeking)**

Calculates the minimum grades needed in current courses to reach a weighted target GPA. Uses constrained optimization (SciPy SLSQP):
- **Objective function**: Minimize variance between grades (equitable distribution)
- **Constraint**: Weighted sum ≥ required points
- **Bounds**: Grades between 61 (pass) and 100
- **Scenarios**: Pessimistic (61), Realistic (75), Optimistic (90), Perfect (100)

#### 🤖 Academic Chatbot (Local NLP)

Conversational assistant based on intents + TF-IDF + cosine similarity that operates 100% locally without external APIs:
- Intent detection (15+ intents: prerequisites, credits, search, semester, etc.)
- Entity extraction (course code or name)
- Personalized context (user's approved courses history)
- Multi-major support (10 engineering majors at USAC)

#### 📊 Interactive Visualizations

- **Recharts Charts**: Pie, Bar, Line, Radar, RadialBar charts
- **SVG Force Graph**: Custom physics simulation (300 ticks) to visualize curriculum dependencies
- **Three.js 3D Particles**: Landing page with animated canvas
- **Weekly Calendar**: Absolute positioning by minutes (Mon-Sat)

#### 🎨 Glassmorphism Design

Modern design system with:
- Cards with `backdrop-blur-xl` and semi-transparent borders
- Full dark mode
- Animations with Framer Motion
- Mobile-first responsive

#### 🔐 Security

- XSS/SQLi validation on client and server
- SHA-256 password hashing
- Input sanitization
- CORS configured
- Rate limiting by plan (free/daily/premium)

---

### 🔥 Real Use Cases

**Case 1: Student who works**

*"I work Mondays 2-6pm. I want to take 6 courses without conflicting with my job."*

**KAI:**
1. Filters all sections that conflict with your work schedule
2. Runs genetic algorithm with work constraint
3. Generates 5 optimal options in seconds
4. Shows financial analysis: if you leave a critical course, it tells you how many months it delays your graduation

**Case 2: Student who wants to improve GPA**

*"I have a 78 GPA. What do I need in my 4 current courses to finish with 85?"*

**KAI:**
1. Calculates your current weighted GPA
2. Determines points needed to reach 85
3. Uses linear optimization to distribute grades equitably
4. Tells you: "You need 87 in Physics 2, 84 in Algebra, 86 in Programming 3, 85 in Ethics"
5. Simulates scenarios: Pessimistic (61), Realistic (75), Optimistic (90), Perfect (100)

**Case 3: Student who doesn't know what courses to take**

*"I don't know if I can take Compilers, Networks, and Operating Systems together."*

**KAI:**
1. Verifies prerequisites for all 3 courses
2. Classifies difficulty with K-Means: Compilers (Red), Networks (Yellow), Operating Systems (Red)
3. Analyzes combination: "🔴 Heavy Load: 2 difficult courses and 1 medium. Requires a lot of discipline."
4. Suggests: "Consider moving one of the Red courses to next semester."

**Case 4: Student asking the chatbot**

*"What are the prerequisites for Artificial Intelligence?"*

**KAI (Chatbot):**
1. Detects intent: `prerequisites`
2. Extracts entity: `Artificial Intelligence` (code 0771)
3. Searches knowledge base: "Programming 2, Data Structures, Logic"
4. Responds: "📚 Artificial Intelligence (0771)\n📋 Prerequisites:\n  - 0147: Programming 2\n  - 0150: Data Structures\n  - 0112: Logic"

---

### 🏁 Quick Installation

**Backend**

```bash
cd Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python inicializar_db.py
python main.py
```

Backend running at `http://localhost:8000`

**Frontend**

```bash
cd Frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Frontend running at `http://localhost:5173`

**Database**
- **Development**: SQLite (automatic, `usuarios.db` file)
- **Production**: PostgreSQL (Cloud SQL, configured with `DATABASE_URL`)

---

### 🎓 Subscription Model

| Feature | Free | Day Pass (Q10/24h) | Premium (Q25/mo) |
|---------|------|-------------------|-------------------|
| AI Chatbot | 5/day | Unlimited | Unlimited |
| Manual Generator | 3/semester | Unlimited | Unlimited |
| AI Generator | No | Unlimited | Unlimited |
| OCR (image scanning) | 1/month | Unlimited | Unlimited |
| Curriculum Graph View | No | Yes | Yes |
| Scenario Simulator | No | Yes | Yes |
| PDF Export | No | Yes | Yes |

---

### 🌟 Highlights for Recruiters

**Software Engineering**
- **Full-Stack Architecture**: SPA Frontend + REST API Backend + integrated AI
- **Cloud Native**: Deployed on Google Cloud Run (serverless, auto-scaling, containerized)
- **CI/CD**: Frontend automatically deployed from GitHub to Netlify
- **Dual Database**: SQLite (dev) / PostgreSQL (prod) with adapter pattern
- **Security**: XSS/SQLi validation on client and server, password hashing, CORS, sanitization

**Artificial Intelligence & Machine Learning**
- **3 AI Engines**: K-Means Clustering, Genetic Algorithms, Linear Optimization
- **Local NLP**: Chatbot with TF-IDF + cosine similarity (no external APIs)
- **OCR**: Text extraction from images with Tesseract
- **Predictive Analysis**: Goal seeking for grade prediction
- **Force Simulation**: Interactive graph with custom physics (Coulomb + Hooke)

**User Experience**
- **Modern Design**: Glassmorphism, dark mode, fluid animations
- **Responsive**: Mobile-first with adaptive layouts
- **Data Visualization**: 6 types of interactive charts + 3D
- **Performance**: Lazy loading, AI model caching, optimized polling
- **Accessibility**: Validated forms, visual feedback, accessible modals

**Scalability & Production**
- **Serverless**: Auto-scaling from 0 to 3 instances based on demand
- **Multi-tenant**: Support for multiple users with isolated data
- **Rate Limiting**: Usage control by plan (free/daily/premium)
- **Scalable Storage**: Google Cloud Storage for static files
- **Monitoring**: Structured logs, global error handling

---

<div align="center">

*Made with 💙 for USAC engineering students*

*If this project helped you, consider giving it a ⭐*

</div>

---

<a id="español"></a>
## 🇪🇸 Versión en Español

### 💭 La Historia detrás de KAI

#### El Problema

En la Facultad de Ingeniería de la USAC, cada semestre miles de estudiantes enfrentan el mismo caos: **la página oficial de cursos solo muestra una tabla gigante con +1000 secciones de todas las carreras**, sin filtros inteligentes, sin generador de horarios, sin forma de visualizar si tu carga académica es balanceada.

Los estudiantes pasan **horas manualmente** cruzando horarios en Excel, preguntando a compañeros mayores, arriesgándose a inscribir "horarios suicidas" con 3 cursos difíciles que los llevan al abandono. No hay herramienta que les ayude a tomar decisiones informadas sobre su semestre.

#### La Solución

**KAI nació como respuesta a este problema.** No es solo un proyecto técnico: es una herramienta de **ayuda social** diseñada por estudiantes, para estudiantes.

Imagina poder decirle al sistema: *"Quiero llevar estos 6 cursos, trabajo los lunes de 2-6pm, y quiero que mi horario no tenga choques"*. KAI genera **5 opciones óptimas** en segundos, considerando prerrequisitos, dificultad de cursos y tu disponibilidad.

O poder preguntar: *"¿Qué notas necesito sacar en mis cursos actuales para cerrar con 85 de promedio?"*. El sistema calcula exactamente cuánto necesitas en cada curso.

O simplemente preguntar a un chatbot académico: *"¿Qué prerrequisitos tiene Compiladores?"* y obtener respuesta instantánea, sin buscar en PDFs de 200 páginas.

**Eso es KAI.** Tu compañero inteligente para sobrevivir y thrive en ingeniería.

---

### 🎯 ¿Qué Resuelve KAI?

| Problema del Estudiante | Solución KAI | Tecnología |
|-------------------------|--------------|------------|
| "No sé qué cursos puedo llevar juntos sin que se choquen" | **Generador de Horarios** que genera 5 opciones sin conflictos | Algoritmos Genéticos |
| "No sé si mi carga de cursos es muy difícil para este semestre" | **Semáforo de Carga Académica** que clasifica cursos en Verde/Amarillo/Rojo | K-Means Clustering |
| "No sé qué notas necesito para alcanzar mi promedio objetivo" | **Optimizador de Promedio** que calcula notas necesarias curso por curso | Linear Optimization (SciPy) |
| "No recuerdo los prerrequisitos de este curso" | **Chatbot Académico** que responde preguntas sobre el pensum | TF-IDF + NLP |
| "No sé cuánto progreso llevo en mi carrera" | **Dashboard** con créditos, promedio, avance y próxima clase | Visualización interactiva |

---

### 🔥 Casos de Uso Reales

**Caso 1: Estudiante que trabaja**

*"Trabajo los lunes de 2-6pm. Quiero llevar 6 cursos sin que se choquen con mi trabajo."*

**KAI:**
1. Filtra todas las secciones que conflicten con tu horario laboral
2. Ejecuta algoritmo genético con restricción de trabajo
3. Genera 5 opciones óptimas en segundos
4. Muestra análisis financiero: si dejas un curso crítico, te dice cuántos meses retrasa tu graduación

**Caso 2: Estudiante que quiere mejorar promedio**

*"Tengo 78 de promedio. ¿Qué necesito sacar en mis 4 cursos actuales para cerrar con 85?"*

**KAI:**
1. Calcula tu promedio actual ponderado
2. Determina puntos necesarios para alcanzar 85
3. Usa optimización lineal para distribuir notas equitativamente
4. Te dice: "Necesitas 87 en Física 2, 84 en Álgebra, 86 en Programación 3, 85 en Ética"
5. Simula escenarios: Pesimista (61), Realista (75), Optimista (90), Perfecto (100)

---

### 🏗️ System Architecture / Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     Netlify CDN (Frontend)                   │
│                    kaiusac.netlify.app                        │
│                  React 19 + Vite 7 + Tailwind              │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Cloud Run (Backend)                      │
│                  Flask + Gunicorn :8080                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              6 Routers (Blueprints)                   │  │
│  │   auth │ courses │ schedules │ academic │ chatbot │ plan │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           3 AI Engines / Motores de IA                │  │
│  │                                                       │  │
│  │  • K-Means Clustering (scikit-learn)                 │  │
│  │  • Genetic Algorithms / Algoritmos Genéticos (custom)│  │
│  │  • Linear Optimization (SciPy SLSQP)                 │  │
│  │  • TF-IDF + Cosine Similarity (NLP)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Data Layer                         │  │
│  │  • PostgreSQL (Cloud SQL) - Users, courses, plans    │  │
│  │  • Google Cloud Storage - Profile photos             │  │
│  │  • CSV Files - 1000+ courses from 10 USAC majors     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 🛠️ Tech Stack / Stack Tecnológico

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Python 3.11 + Flask 3.1 | REST API, Blueprints |
| **Frontend** | React 19 + Vite 7 + SWC | SPA with HMR |
| **Machine Learning** | scikit-learn | K-Means Clustering, TF-IDF |
| **Optimization** | SciPy | Linear Optimization (SLSQP) |
| **Data Science** | Pandas + NumPy | Dataset manipulation |
| **CSS** | TailwindCSS 3.4 | Utility-first + dark mode |
| **Animations** | Framer Motion 12 | Transitions, gestures |
| **2D Charts** | Recharts 3 | Pie, Bar, Line, Radar |
| **3D Graphics** | Three.js + R3F | Landing page particles |
| **Database** | PostgreSQL (Cloud SQL) | Production persistence |
| **Storage** | Google Cloud Storage | Profile images |
| **Deploy** | Docker + Cloud Run + Netlify | Serverless + CI/CD |

---

### 📦 Project Structure / Estructura del Proyecto

```
KAI - Kairos Artificial Intelligence/
│
├── Backend/                              # Flask REST API + AI
│   ├── main.py                          # Flask entry point
│   ├── routers/                         # 6 Blueprints (auth, courses, schedules, academic, chatbot, plan)
│   ├── clustering_semaforo.py           # AI: K-Means difficulty classifier
│   ├── optimizador_promedio.py          # AI: Goal Seeking with SciPy
│   ├── motor_generador.py               # GA: Automatic schedule generator
│   ├── motor_custom.py                  # GA: Custom schedule generator
│   ├── chatbot_academico.py             # NLP: Chatbot with TF-IDF + intents
│   ├── Data/                            # Datasets (10 curriculum CSVs + course offerings)
│   └── Dockerfile                       # Cloud Run deployment
│
├── Frontend/                             # React SPA + Vite
│   ├── src/
│   │   ├── pages/                       # 14 pages (Dashboard, Traffic Light, Optimizer, Chatbot, etc.)
│   │   ├── components/                  # ~30 components (UI, landing, dashboard, modals)
│   │   └── App.jsx                      # Router + protected routes
│   └── tailwind.config.js               # Custom theme (pastel palette, dark mode)
│
└── README.md                            # This file
```

---

### 🚀 Production Impact / Impacto en Producción

- **Launch:** January - February 2026
- **Traffic & Registrations:** +80 registered users in the first 48 hours after deployment
- **Backend:** Google Cloud Run (Serverless, Containerized with gcloud, auto-scaling from 0 to 3 instances)
- **Frontend:** Netlify (Deployed from GitHub repository)

<details>
<summary>📊 View registration metrics and infrastructure evidence / Ver métricas de registro y evidencia de infraestructura</summary>

**Registration Growth (January 2026) / Crecimiento de Registros (Enero 2026)**

![Registration Chart](./assets/Grafica_de_registros.png)

**Google Cloud Run Deployment / Despliegue en Google Cloud Run**

![Cloud Run Screenshot](./assets/Cloud_Run_Prubeas.png)

</details>

---

### 🤝 Contributions / Contribuciones

This project was developed as independent work from the Faculty of Engineering at USAC. If you're a faculty student and want to contribute:

- 💡 Suggest new features
- 📚 Help improve documentation
- 🎨 Propose design improvements

---

### 📄 License / Licencia

This project was developed for educational purposes and social help for the student community of the Faculty of Engineering - USAC.

---

### 📧 Contact / Contacto

**Questions or suggestions?**

- 🌐 Demo: [kaiusac.netlify.app](https://kaiusac.netlify.app)
- 📖 Backend Documentation: [Backend/](./Backend/)
- 📖 Frontend Documentation: [Frontend/](./Frontend/)
- 📧 Email: martin1aleman@proton.me

---

<div align="center">

**Made with 💙 by students, for USAC students**

*If this project helped you, consider giving it a ⭐*

</div>

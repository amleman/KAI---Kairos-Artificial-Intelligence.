import { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  BookOpen,
  Clock,
  Calendar,
  Zap,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import HorarioVisualizer from "../components/HorarioVisualizer";

const StatCard = ({ title, value, subtitle, icon: Icon, bgClass, iconClass, subtitleClass }) => (
  <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden ${bgClass}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 ${iconClass}`}>
        <Icon size={24} className="text-slate-700 dark:text-current" />
      </div>
      {subtitle && <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${subtitleClass}`}>{subtitle}</span>}
    </div>
    <div>
      <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left">{value}</h3>
      <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">{title}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [userData, setUserData] = useState({ nombre: "Estudiante", carne: "", carrera: "" });
  const [stats, setStats] = useState({
    promedio: 0,
    creditos: 0,
    avance: 0
  });
  const [horarioGuardado, setHorarioGuardado] = useState(null);
  const [computedStats, setComputedStats] = useState({ courses: 0, weeklyHours: 0 });
  const [nextClassInfo, setNextClassInfo] = useState({
    name: "Cargando...",
    status: "",
    badgeColor: "bg-slate-200 text-slate-500"
  });
  const [mostrarAnalisis, setMostrarAnalisis] = useState(false);

  useEffect(() => {
    // Cargar datos de usuario
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);

      // Cargar estadísticas
      if (parsedUser.carne) {
        fetch(`http://127.0.0.1:8000/aprobados/${parsedUser.carne}`)
          .then(res => res.json())
          .then(data => {
            const cursos = data || [];
            const totalCreditos = cursos.reduce((acc, curr) => acc + (curr.creditos || 0), 0);
            const promedio = cursos.length > 0
              ? (cursos.reduce((acc, curr) => acc + (curr.nota || 0), 0) / cursos.length).toFixed(1)
              : 0;
            const avance = Math.min(((totalCreditos / 250) * 100).toFixed(1), 100);

            setStats({ promedio, creditos: totalCreditos, avance });
          })
          .catch(err => console.error("Error loading stats", err));

        // Cargar Horario Guardado
        fetch(`http://127.0.0.1:8000/obtener_horario_guardado/${parsedUser.carne}`)
          .then(res => res.json())
          .then(data => {
            if (data.existe) setHorarioGuardado(data.horario);
          })
          .catch(console.error);
      }
    }
  }, []);

  // --- LÓGICA DE CÁLCULO DE ESTADÍSTICAS DEL HORARIO ---
  useEffect(() => {
    if (!horarioGuardado) return;

    const lista = Array.isArray(horarioGuardado) ? horarioGuardado : (horarioGuardado.horario || []);

    // 1. Calcular Horas Semanales y Conteo
    let totalMinutos = 0;

    lista.forEach(curso => {
      // Extraer días
      let dias = [];
      try {
        const rawDias = curso.Dias_Lista || curso.Dias;
        if (Array.isArray(rawDias)) dias = rawDias;
        else if (rawDias) {
          // Limpieza robusta de string "['Lunes', ...]"
          const clean = String(rawDias).replace(/'/g, '"');
          try { dias = JSON.parse(clean); }
          catch { dias = String(rawDias).replace(/[[\]']/g, "").split(",").map(s => s.trim()); }
        }
      } catch (e) { dias = []; }

      // Filtros de días válidos
      const dayCount = dias.filter(d => d && d !== "None").length;

      // Extraer tiempo
      const toMin = (t) => {
        if (!t) return 0;
        const [h, m] = String(t).split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      }

      const inicio = toMin(curso.Inicio);
      const final = toMin(curso.Final);

      if (final > inicio) {
        totalMinutos += (final - inicio) * dayCount;
      }
    });

    setComputedStats({
      courses: lista.length,
      weeklyHours: (totalMinutos / 60).toFixed(1)
    });

  }, [horarioGuardado]);

  // --- LÓGICA DE PRÓXIMA CLASE (Polling cada minuto) ---
  useEffect(() => {
    if (!horarioGuardado) { // Si no hay horario, valores default
      setNextClassInfo({ name: "Sin horario", status: "-", badgeColor: "bg-slate-100 text-slate-400" });
      return;
    }

    const updateNextClass = () => {
      const now = new Date();
      // Mapeo dia JS (0=Dom, 1=Lun...) a Nombres en DB
      const diasMap = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
      const diaActualNombre = diasMap[now.getDay()];

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const lista = Array.isArray(horarioGuardado) ? horarioGuardado : (horarioGuardado.horario || []);

      // Filtrar cursos de HOY
      const cursosHoy = lista.filter(curso => {
        const rawDias = curso.Dias_Lista || curso.Dias || "";
        return rawDias.includes(diaActualNombre); // Búsqueda simple string include es suficiente usualmente
      }).map(curso => {
        const [h, m] = String(curso.Inicio).split(":").map(Number);
        const [hF, mF] = String(curso.Final).split(":").map(Number);
        return {
          ...curso,
          inicioMin: (h * 60) + m,
          finalMin: (hF * 60) + mF
        };
      }).sort((a, b) => a.inicioMin - b.inicioMin);

      if (cursosHoy.length === 0) {
        setNextClassInfo({ name: "Día Libre", status: "¡A descansar! 🎉", badgeColor: "bg-emerald-100 text-emerald-700" });
        return;
      }

      // Buscar curso actual o siguiente
      let found = null;

      // 1. Check "En Progreso"
      const enProgreso = cursosHoy.find(c => currentMinutes >= c.inicioMin && currentMinutes < c.finalMin);

      if (enProgreso) {
        setNextClassInfo({
          name: enProgreso.Nombre_Limpio || enProgreso["Nombre de Curso"],
          status: "En progreso",
          badgeColor: "bg-green-100 text-green-700"
        });
        return;
      }

      // 2. Check "Próxima"
      const proxima = cursosHoy.find(c => c.inicioMin > currentMinutes);

      if (proxima) {
        const diff = proxima.inicioMin - currentMinutes;
        let timeText = `En ${diff} min`;
        if (diff > 60) {
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          timeText = `En ${h}h ${m}m`;
        }

        setNextClassInfo({
          name: proxima.Nombre_Limpio || proxima["Nombre de Curso"],
          status: timeText,
          badgeColor: "bg-blue-100 text-blue-700"
        });
        return;
      }

      // 3. Ya terminaron todas
      setNextClassInfo({
        name: "Clases finalizadas",
        status: "Libre por hoy",
        badgeColor: "bg-purple-100 text-purple-700"
      });
    };

    updateNextClass(); // Run immediately
    const interval = setInterval(updateNextClass, 60000); // Update every minute
    return () => clearInterval(interval);

  }, [horarioGuardado]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Hola, {userData.nombre.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Aquí tienes el resumen de tu progreso académico actual.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm text-slate-400 font-medium">Ciclo 2026 - Semestre 1</p>
          <p className="text-xs text-slate-300 font-mono mt-1">{userData.carne}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Promedio General"
          value={stats.promedio}
          icon={TrendingUp}
          bgClass="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
          iconClass="text-indigo-600 dark:text-indigo-400 shadow-indigo-100"
          subtitle="Acumulado"
          subtitleClass="bg-indigo-100 text-indigo-700"
        />
        <StatCard
          title="Créditos Ganados"
          value={stats.creditos}
          icon={Award}
          bgClass="bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
          iconClass="text-rose-600 dark:text-rose-400 shadow-rose-100"
          subtitleClass="hidden"
        />
        <StatCard
          title="Avance de Carrera"
          value={`${stats.avance}%`}
          icon={Zap}
          bgClass="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
          iconClass="text-amber-600 dark:text-amber-400 shadow-amber-100"
          subtitleClass="hidden"
        />
        <StatCard
          title="Cursos Actuales"
          value={computedStats.courses}
          icon={BookOpen}
          bgClass="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800"
          iconClass="text-violet-600 dark:text-violet-400 shadow-violet-100"
          subtitle="Asignados"
          subtitleClass="bg-violet-100 text-violet-700"
        />
        <StatCard
          title="Horas Semanales"
          value={computedStats.weeklyHours + " H"}
          icon={Clock}
          bgClass="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
          iconClass="text-emerald-600 dark:text-emerald-400 shadow-emerald-100"
          subtitle="Carga Total"
          subtitleClass="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title="Situación Actual"
          value={
            <span className="text-xl md:text-2xl line-clamp-1" title={nextClassInfo.name}>
              {nextClassInfo.name}
            </span>
          }
          icon={Calendar}
          bgClass="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800"
          iconClass="text-sky-600 dark:text-sky-400 shadow-sky-100"
          subtitle={nextClassInfo.status}
          subtitleClass={nextClassInfo.badgeColor}
        />
      </div>

      {/* Schedule Section */}
      <section className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-soft-blue dark:border-slate-700 rounded-2xl p-8 shadow-inner transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pastel-blue-dark" />
            Mi Horario Guardado
          </h2>
          {horarioGuardado && (
            <Link to="/horarios" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
              Ver completo <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {horarioGuardado ? (
          <>
            <div className="rounded-xl overflow-hidden border-[2px] border-soft-blue/30 dark:border-slate-700 shadow-inner bg-white/40 dark:bg-slate-800/40">
              <HorarioVisualizer horario={horarioGuardado} compact={true} />
            </div>

            {horarioGuardado.analisis_financiero && (
              <div className="mt-4 animate-fadeIn border-t border-soft-blue/30 pt-4">
                {mostrarAnalisis ? (
                  <div className="rounded-xl border border-soft-blue/50 bg-white/40 p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-bold ${horarioGuardado.analisis_financiero.tipo_alerta === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {horarioGuardado.analisis_financiero.mensaje_alerta}
                      </h4>
                      <span className="text-xl">
                        {horarioGuardado.analisis_financiero.tipo_alerta === 'success' ? '💰' : '📉'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {horarioGuardado.analisis_financiero.tipo_alerta === 'success'
                        ? "¡Gran elección! Esta combinación maximiza tus oportunidades académicas."
                        : `Impacto económico estimado: Q${horarioGuardado.analisis_financiero.costo_proyectado_total?.toLocaleString()} por retraso de ${horarioGuardado.analisis_financiero.meses_atraso_estimado} meses.`
                      }
                    </p>
                    <button
                      onClick={() => setMostrarAnalisis(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                    >
                      Ocultar detalles
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setMostrarAnalisis(true)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white/40 rounded-lg border border-transparent hover:border-soft-blue/50"
                  >
                    Ver Impacto Económico (Costo de Oportunidad)
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 px-6 border border-dashed border-soft-blue/50 rounded-xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">No tienes un horario guardado</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Genera tu horario ideal utilizando nuestro asistente inteligente o créalo manualmente.
            </p>
            <Link
              to="/horarios"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Ir a Horarios
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
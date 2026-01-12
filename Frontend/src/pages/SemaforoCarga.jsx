import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  TrafficCone, CheckCircle, BookOpen, BarChart3, TrendingUp, Loader2, Trash2, Calendar, Clock, Eye,
  X, AlertTriangle, Search, Filter, Info, Sparkles, HelpCircle, Crown
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import PricingModal from "../components/PricingModal";
import API_URL from "../api/apiConfig";

const SemaforoCarga = () => {
  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch { return {}; }
  };
  const userData = getUserData();
  const STORAGE_KEY = `SIOA_progreso_${userData.carne || "invitado"}`;

  const cargarEstado = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[key] !== undefined ? parsed[key] : defaultValue;
      }
    } catch (e) {
      console.error("Error cargando estado:", e);
    }
    return defaultValue;
  };

  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [cursosSeleccionados, setCursosSeleccionados] = useState(() => cargarEstado('cursosSeleccionados', {}));
  const [resultado, setResultado] = useState(() => cargarEstado('resultado', null));
  const [loading, setLoading] = useState(false);
  const [loadingHorario, setLoadingHorario] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mensajeError, setMensajeError] = useState(null);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMensaje, setErrorModalMensaje] = useState("");
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const navigate = useNavigate();

  // Generador Limit State
  const [generadorUsageInfo, setGeneradorUsageInfo] = useState({ current: 0, limit: 3 });
  const [mostrarLimiteGeneradorModal, setMostrarLimiteGeneradorModal] = useState(false);
  const [mostrarPricingModal, setMostrarPricingModal] = useState(false);

  const [horarioGenerado, setHorarioGenerado] = useState(() => cargarEstado('horarioGenerado', null));
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);

  const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => cargarEstado('filtrosAvanzados', {
    horaInicioLV: "",
    horaFinLV: "",
    horaInicioSabado: "",
    horaFinSabado: "",
    catedratico: "",
    modalidad: "todos",
    dias: []
  }));

  useEffect(() => {
    const estadoAGuardar = {
      cursosSeleccionados,
      resultado,
      horarioGenerado,
      filtrosAvanzados
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoAGuardar));
  }, [cursosSeleccionados, resultado, horarioGenerado, filtrosAvanzados, STORAGE_KEY]);

  useEffect(() => {
    cargarCursosClasificados();

    // Load generador usage from plan
    if (userData.carne) {
      fetch(`${API_URL}/plan/${userData.carne}`)
        .then(res => res.json())
        .then(data => {
          if (data.limites) {
            setGeneradorUsageInfo({
              current: data.limites.generador_usado || 0,
              limit: data.limites.generador_manual_total === -1 ? 999 : (data.limites.generador_manual_total || 3)
            });
          }
        })
        .catch(console.error);
    }
  }, []);

  const cargarCursosClasificados = async () => {
    try {
      if (!userData.carne) return;
      const response = await fetch(`${API_URL}/cursos_clasificados/${userData.carne}`);
      const data = await response.json();
      setCursosDisponibles(data);
    } catch (error) {
      console.error("Error cargando cursos:", error);
    }
  };

  const toggleCurso = (curso) => {
    const codigo = curso.codigo;
    if (cursosSeleccionados[codigo]) {
      const nuevasSelecciones = { ...cursosSeleccionados };
      delete nuevasSelecciones[codigo];
      setCursosSeleccionados(nuevasSelecciones);
      return;
    }
    setCursosSeleccionados({
      ...cursosSeleccionados,
      [codigo]: {
        codigo: codigo,
        nombre: curso.nombre,
        nivel: curso.nivel
      }
    });
    setMensajeError(null);
    setResultado(null);
    setHorarioGenerado(null);
  };

  const analizarCarga = async () => {
    if (Object.keys(cursosSeleccionados).length === 0) {
      setMensajeError('Debes seleccionar al menos un curso.');
      return;
    }
    setLoading(true);
    setMensajeError(null);
    setHorarioGenerado(null);
    try {
      const codigos = Object.keys(cursosSeleccionados);
      const response = await fetch(`${API_URL}/analizar_semaforo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursos: codigos })
      });
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Error analizando carga:", error);
      setMensajeError('Error al analizar la carga. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const generarHorario = async () => {
    // Verificar límite ANTES de hacer cualquier cosa
    if (generadorUsageInfo.limit < 999 && generadorUsageInfo.current >= generadorUsageInfo.limit) {
      setMostrarLimiteGeneradorModal(true);
      return;
    }

    // Incrementar contador ANTES de la petición (cuenta cada intento)
    const nuevoContador = generadorUsageInfo.current + 1;
    setGeneradorUsageInfo(prev => ({
      ...prev,
      current: nuevoContador
    }));

    // Incrementar en el backend
    try {
      await fetch(`${API_URL}/plan/${userData.carne}/usar/generador`, { method: "POST" });
    } catch (e) {
      console.error("Error incrementando contador:", e);
    }

    setLoadingHorario(true);
    setMensajeError(null);
    setHorarioGenerado(null);
    try {
      const codigos = Object.keys(cursosSeleccionados);
      const payload = {
        usuario: userData.carne,
        cursos: codigos,
        filtros: {
          hora_inicio_lv: timeToMinutes(filtrosAvanzados.horaInicioLV) || 420,
          hora_fin_lv: timeToMinutes(filtrosAvanzados.horaFinLV) || 1260,
          hora_inicio_sabado: timeToMinutes(filtrosAvanzados.horaInicioSabado) || 420,
          hora_fin_sabado: timeToMinutes(filtrosAvanzados.horaFinSabado) || 1260,
          catedratico: filtrosAvanzados.catedratico || "",
          modalidad: filtrosAvanzados.modalidad === "todos" ? "TODAS" : filtrosAvanzados.modalidad.toUpperCase()
        }
      };
      const response = await fetch(`${API_URL}/generar_horario_custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error("No se encontraron combinaciones válidas. Los filtros pueden ser muy estrictos.");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }
      const data = await response.json();
      if (!data.horarios || data.horarios.length === 0) {
        throw new Error("No se pudo generar ningún horario con los filtros actuales.");
      }

      setHorarioGenerado(data);
    } catch (error) {
      console.error("Error generando horario:", error);
      setErrorModalMensaje(error.message);
      setErrorModalOpen(true);
    } finally {
      setLoadingHorario(false);
    }
  };

  const irAVerHorario = () => {
    if (horarioGenerado && horarioGenerado.horarios) {
      navigate('/resultado-horario', { state: { datosHorario: horarioGenerado } });
    }
  };

  const limpiarSeleccion = () => {
    setCursosSeleccionados({});
    setResultado(null);
    setHorarioGenerado(null);
    setMensajeError(null);
    setFiltrosAvanzados({
      horaInicioLV: "",
      horaFinLV: "",
      horaInicioSabado: "",
      horaFinSabado: "",
      catedratico: "",
      modalidad: "todos",
      dias: []
    });
    setBusqueda("");
    setFiltroNivel("todos");
  };

  const getNivelBadge = (nivel) => {
    if (nivel === 1) return "bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500/20";
    if (nivel === 2) return "bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/20";
    if (nivel === 3) return "bg-rose-100 text-rose-700 border-rose-200 ring-rose-500/20";
    return "bg-slate-100 text-slate-500 border-slate-200";
  };

  const getNivelTexto = (nivel) => {
    if (nivel === 1) return "Fácil";
    if (nivel === 2) return "Medio";
    if (nivel === 3) return "Difícil";
    return "N/A";
  };

  const getSemaforoColor = (semaforo) => {
    if (semaforo === "verde") return "from-emerald-400 to-green-500 shadow-emerald-200";
    if (semaforo === "amarillo") return "from-amber-400 to-orange-500 shadow-amber-200";
    if (semaforo === "rojo") return "from-rose-500 to-red-600 shadow-rose-200";
    return "from-slate-400 to-slate-500";
  };

  const getSemaforoRing = (semaforo) => {
    if (semaforo === "verde") return "ring-emerald-400";
    if (semaforo === "amarillo") return "ring-amber-400";
    if (semaforo === "rojo") return "ring-rose-500";
    return "ring-slate-400";
  }

  const cursosFiltrados = cursosDisponibles.filter(curso => {
    if (cursosSeleccionados[curso.codigo]) return false;
    const coincideBusqueda = curso.nombre.toLowerCase().includes(busqueda.toLowerCase()) || curso.codigo.includes(busqueda);
    const coincideNivel = filtroNivel === "todos" || curso.nivel === parseInt(filtroNivel);
    return coincideBusqueda && coincideNivel;
  });

  const graficos = (() => {
    if (!resultado) return null;
    const pieData = [
      { name: 'Fácil', value: resultado.cursos_por_nivel[1] || 0, color: '#34D399' },   // Emerald 400
      { name: 'Medio', value: resultado.cursos_por_nivel[2] || 0, color: '#FBBF24' },   // Amber 400
      { name: 'Difícil', value: resultado.cursos_por_nivel[3] || 0, color: '#F87171' }  // Red 400
    ].filter(item => item.value > 0);
    const barData = [
      { nivel: 'Fácil', cantidad: resultado.cursos_por_nivel[1] || 0, fill: '#34D399' },
      { nivel: 'Medio', cantidad: resultado.cursos_por_nivel[2] || 0, fill: '#FBBF24' },
      { nivel: 'Difícil', cantidad: resultado.cursos_por_nivel[3] || 0, fill: '#F87171' }
    ];
    return { pieData, barData };
  })();

  return (
    <div className="animate-fadeIn space-y-4 md:space-y-8 pb-12 w-full max-w-[1600px] mx-auto">
      {/* Header Glass Card */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-3xl p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
          <div className="p-3 bg-white/50 dark:bg-slate-700/50 backdrop-blur-md rounded-xl shadow-sm border border-white/50 w-fit">
            <TrafficCone size={32} className="text-emerald-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 mb-1">Semáforo Académico</h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm md:text-base max-w-2xl">
              Diseña tu semestre ideal. Equilibra la dificultad de tus cursos y genera horarios inteligentes.
            </p>
          </div>
          <button
            onClick={() => setMostrarAyuda(true)}
            className="p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-600 self-start md:self-center"
            title="¿Cómo funciona?"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">

        {/* Left Column: Input Selection (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-4">
              <BookOpen className="text-sky-600" size={24} />
              Catálogo de Cursos
              <span className="ml-auto text-xs font-normal bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                {cursosFiltrados.length} disponibles
              </span>
            </h2>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 sticky top-0 bg-transparent z-10 py-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o código..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-slate-100 dark:placeholder:text-slate-400 transition-all outline-none"
                />
              </div>
              <div className="relative w-full md:w-48">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={filtroNivel}
                  onChange={(e) => setFiltroNivel(e.target.value)}
                  className="w-full pl-11 pr-8 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 dark:text-slate-100 transition-all appearance-none cursor-pointer outline-none"
                >
                  <option value="todos">Todos los niveles</option>
                  <option value="1">🟢 Fácil</option>
                  <option value="2">🟡 Medio</option>
                  <option value="3">🔴 Difícil</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-600 mb-6">
              <button
                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                className="w-full px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 text-xs md:text-sm flex items-center justify-between hover:bg-white dark:hover:bg-slate-600/50 rounded-lg transition-all"
              >
                <span className="flex items-center gap-2">
                  <Clock className="text-sky-500" size={16} />
                  Filtros de Horario y Disponibilidad
                </span>
                <div className={`p-1 bg-slate-200 rounded text-slate-500 transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`}>
                  <X className="rotate-45" size={14} />
                </div>
              </button>

              {mostrarFiltrosAvanzados && (
                <div className="p-4 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:!bg-slate-800/60 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-slate-200 dark:!border-slate-700/50 shadow-sm transition-colors">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Lunes - Viernes
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">DESDE</label>
                          <input type="time" value={filtrosAvanzados.horaInicioLV} onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, horaInicioLV: e.target.value })} className="w-full px-2 py-1.5 bg-slate-50 dark:!bg-slate-700/50 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600/50 text-xs outline-none focus:border-sky-500 dark:color-scheme-dark" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">HASTA</label>
                          <input type="time" value={filtrosAvanzados.horaFinLV} onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, horaFinLV: e.target.value })} className="w-full px-2 py-1.5 bg-slate-50 dark:!bg-slate-700/50 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600/50 text-xs outline-none focus:border-sky-500 dark:color-scheme-dark" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:!bg-slate-800/60 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-slate-200 dark:!border-slate-700/50 shadow-sm transition-colors">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Sábados
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">DESDE</label>
                          <input type="time" value={filtrosAvanzados.horaInicioSabado} onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, horaInicioSabado: e.target.value })} className="w-full px-2 py-1.5 bg-slate-50 dark:!bg-slate-700/50 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600/50 text-xs outline-none focus:border-blue-500 dark:color-scheme-dark" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">HASTA</label>
                          <input type="time" value={filtrosAvanzados.horaFinSabado} onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, horaFinSabado: e.target.value })} className="w-full px-2 py-1.5 bg-slate-50 dark:!bg-slate-700/50 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-600/50 text-xs outline-none focus:border-blue-500 dark:color-scheme-dark" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block ml-1">CATEDRÁTICO</label>
                      <input type="text" value={filtrosAvanzados.catedratico} onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, catedratico: e.target.value })} placeholder="Ej: Perez" className="w-full px-3 py-2 bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-600/50 rounded-lg text-sm dark:text-slate-200 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block ml-1">MODALIDAD</label>
                      <select value={filtrosAvanzados.modalidad} onChange={(e) => setFiltrosAvanzados({ ...filtrosAvanzados, modalidad: e.target.value })} className="w-full px-3 py-2 bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-600/50 rounded-lg text-sm dark:text-slate-200 outline-none focus:border-sky-500 cursor-pointer">
                        <option value="todos">Cualquiera</option>
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                        <option value="híbrida">Híbrida</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar content-start">
              {cursosFiltrados.map((curso) => (
                <div key={curso.codigo} className="bg-white dark:!bg-slate-800/60 backdrop-blur-xl border border-slate-100 dark:!border-slate-700/50 p-4 rounded-xl hover:shadow-lg hover:-translate-y-1 hover:border-sky-200 dark:hover:border-sky-500/30 transition-all group shadow-sm flex flex-col h-full relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${curso.nivel === 1 ? 'bg-emerald-400' : curso.nivel === 2 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                      #{curso.codigo}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${getNivelBadge(curso.nivel)}`}>
                      {getNivelTexto(curso.nivel)}
                    </span>
                  </div>
                  <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm mb-4 line-clamp-3 flex-1 pl-2" title={curso.nombre}>
                    {curso.nombre}
                  </h4>
                  <button
                    onClick={() => toggleCurso(curso)}
                    className="w-full py-2 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/50 rounded-lg text-xs font-bold hover:bg-sky-600 hover:text-white hover:border-sky-600 dark:hover:bg-sky-600 dark:hover:text-white dark:hover:border-sky-600 transition-all flex items-center justify-center gap-2 group-active:scale-[0.98]"
                  >
                    Agregar +
                  </button>
                </div>
              ))}
              {cursosFiltrados.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <Search size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No se encontraron cursos con esos filtros.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={analizarCarga}
                disabled={Object.keys(cursosSeleccionados).length === 0 || loading}
                className="flex-1 bg-sky-600 text-white py-3.5 rounded-xl font-bold hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} className={Object.keys(cursosSeleccionados).length > 0 ? "text-yellow-400" : ""} />}
                Analizar Carga ({Object.keys(cursosSeleccionados).length})
              </button>
              <button
                onClick={limpiarSeleccion}
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all rounded-xl font-medium active:scale-[0.98]"
                title="Limpiar todo"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Visualization Charts Section */}
          {resultado && graficos && (
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/40 dark:border-slate-700/50 shadow-md animate-fadeIn">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <BarChart3 className="text-sky-600" size={24} />
                Estadísticas de Carga
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64 flex flex-col items-center p-4 bg-slate-50 dark:!bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-100 dark:!border-slate-700/50">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Distribución de Dificultad</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={graficos.pieData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                        {graficos.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px 12px', fontSize: '12px', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                        itemStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64 flex flex-col items-center p-4 bg-slate-50 dark:!bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-100 dark:!border-slate-700/50">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Cantidad por Nivel</span>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={graficos.barData} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="nivel" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: '#334155', radius: 4 }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                      />
                      <Bar dataKey="cantidad" radius={[6, 6, 6, 6]} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selections & Result (5/12) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          {/* Selected Courses List */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/40 dark:border-slate-700/50 shadow-inner">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={22} />
                Selección
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold ring-1 ring-emerald-500/10">
                {Object.keys(cursosSeleccionados).length}
              </span>
            </h2>

            {Object.keys(cursosSeleccionados).length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                <Info size={32} className="mb-2 opacity-30" />
                <p className="text-xs text-center px-4">Añade cursos del catálogo para analizar tu carga</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.values(cursosSeleccionados).map((curso) => (
                  <div key={curso.codigo} className="bg-white dark:!bg-slate-800/60 backdrop-blur-xl p-3 rounded-xl border border-slate-200 dark:!border-slate-700/50 flex justify-between items-center group shadow-sm transition-all hover:border-red-200 hover:shadow-md">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${curso.nivel === 1 ? 'bg-emerald-400' : curso.nivel === 2 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">#{curso.codigo}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{curso.nombre}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCurso(curso)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Result Card */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/40 dark:border-slate-700/50 shadow-xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 relative z-10">
              <TrendingUp className="text-sky-600" size={24} />
              Diagnóstico
            </h2>

            {mensajeError ? (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3 animate-shake">
                <AlertTriangle className="text-rose-500 shrink-0" size={20} />
                <p className="text-sm text-rose-700 font-medium leading-tight">{mensajeError}</p>
              </div>
            ) : !resultado ? (
              <div className="py-12 text-center space-y-4 relative z-10">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300 animate-pulse-slow">
                  <TrendingUp size={36} />
                </div>
                <p className="text-sm text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                  Completa tu selección y presiona <b>Analizar</b> para recibir tu diagnóstico y recomendaciones.
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn relative z-10">
                <div className="flex flex-col items-center py-2">
                  <div className="relative mb-4">
                    <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getSemaforoColor(resultado.semaforo)} shadow-2xl animate-pulse blur-[8px] opacity-40 absolute inset-0 -translate-y-2`} />
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getSemaforoColor(resultado.semaforo)} shadow-inner flex items-center justify-center relative ring-4 ring-white`}>
                      <TrafficCone size={42} className="text-white drop-shadow-md" />
                    </div>
                  </div>
                  <h3 className={`text-3xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${getSemaforoColor(resultado.semaforo)} drop-shadow-sm`}>
                    {resultado.semaforo}
                  </h3>
                  <div className={`h-1 w-16 rounded-full mt-2 bg-gradient-to-r ${getSemaforoColor(resultado.semaforo)}`} />
                </div>

                <div className="bg-white dark:!bg-slate-800/40 backdrop-blur-md p-5 rounded-xl border border-slate-100 dark:!border-slate-700/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-slate-600" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic relative z-10">
                    "{resultado.mensaje}"
                  </p>
                  <div className="absolute top-2 right-2 text-slate-100 -z-0">
                    <Info size={40} />
                  </div>
                </div>

                <div className="bg-slate-50 dark:!bg-slate-800/40 backdrop-blur-md p-4 rounded-xl border border-slate-100 dark:!border-slate-700/50">
                  <div className="flex justify-between items-center max-w-[240px] mx-auto">
                    <div className="flex flex-col items-center gap-1 group">
                      <span className="text-2xl font-black text-rose-500 group-hover:scale-110 transition-transform">{resultado.cursos_por_nivel[3] || 0}</span>
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Difíciles</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex flex-col items-center gap-1 group">
                      <span className="text-2xl font-black text-amber-500 group-hover:scale-110 transition-transform">{resultado.cursos_por_nivel[2] || 0}</span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Medios</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex flex-col items-center gap-1 group">
                      <span className="text-2xl font-black text-emerald-500 group-hover:scale-110 transition-transform">{resultado.cursos_por_nivel[1] || 0}</span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Fáciles</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <button
                    onClick={generarHorario}
                    disabled={loadingHorario}
                    className="w-full bg-sky-600 text-white py-4 rounded-xl font-bold hover:bg-sky-700 shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {loadingHorario ? <Loader2 className="animate-spin" size={20} /> : <Clock size={20} />}
                    Generar Horario Inteligente
                  </button>
                  {horarioGenerado && (
                    <button
                      onClick={irAVerHorario}
                      className="w-full bg-emerald-50 text-emerald-600 py-3.5 rounded-xl font-bold border border-emerald-200 hover:bg-emerald-100 hover:shadow-md transition-all flex items-center justify-center gap-2 animate-bounce-subtle"
                    >
                      <Eye size={18} /> Ver Horarios ({horarioGenerado.horarios ? horarioGenerado.horarios.length : 0})
                    </button>
                  )}
                  <p className="text-[10px] text-center text-slate-400 font-bold px-4">
                    El generador optimiza automáticamente sin solapamientos.
                  </p>
                </div>
              </div>
            )}

            {/* Decorative background blob */}
            <div className={`absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none transition-colors duration-1000 ${resultado ? (resultado.semaforo === 'rojo' ? 'bg-rose-500' : resultado.semaforo === 'amarillo' ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {errorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 md:p-8 text-center relative">
            <button onClick={() => setErrorModalOpen(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 p-1">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 text-rose-500 ring-8 ring-rose-50/50">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">No hay combinaciones</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {errorModalMensaje}
            </p>
            <button
              onClick={() => setErrorModalOpen(false)}
              className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg transition-all"
            >
              Entendido, ajustar filtros
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {mostrarAyuda && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-3xl w-full shadow-2xl relative border border-white/50 dark:border-slate-700/50 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setMostrarAyuda(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <TrafficCone className="text-emerald-500" size={32} />
                Guía del Semáforo Académico
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Aprende a equilibrar tu carga académica y prevenir el estrés.</p>
            </div>

            <div className="space-y-6">
              {/* What is it */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-sky-100 dark:border-sky-800/30">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="text-sky-500" size={20} />
                  ¿Qué es el Semáforo?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Es una herramienta para crear tu <strong>horario manual</strong> con filtros personalizados.
                  Te permite observar la <strong>dificultad del semestre</strong> que estás por cursar y prevenir
                  el abandono de cursos por exceso de estrés académico.
                </p>
              </div>

              {/* Difficulty Levels */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Niveles de Dificultad</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-emerald-400 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">Fácil</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Cursos con menor carga de trabajo. Ideales para balancear tu semestre.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-amber-400 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="font-bold text-amber-700 dark:text-amber-400">Medio</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Requieren dedicación moderada. Combínalos estratégicamente.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-rose-400 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <span className="font-bold text-rose-700 dark:text-rose-400">Difícil</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Alta demanda de tiempo y esfuerzo. Limita su cantidad por semestre.</p>
                  </div>
                </div>
              </div>

              {/* How to use */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">¿Cómo usar esta herramienta?</h3>
                <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                    <span>Explora el <strong>catálogo de cursos</strong> disponibles según tus prerrequisitos aprobados.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                    <span>Selecciona los cursos que deseas llevar usando los <strong>filtros de búsqueda y dificultad</strong>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                    <span>Presiona <strong>"Analizar Carga"</strong> para recibir tu diagnóstico de dificultad (verde, amarillo o rojo).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="shrink-0 w-6 h-6 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center font-bold text-xs">4</span>
                    <span>Usa los <strong>filtros de horario</strong> para ajustar disponibilidad y generar combinaciones sin traslapes.</span>
                  </li>
                </ol>
              </div>

              {/* Pro tip */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 font-bold flex items-start gap-3">
                  <Sparkles className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <span>
                    <strong>¡Escoge tu nivel de dificultad y gana todos tus cursos!</strong><br />
                    <span className="font-normal">Un semestre balanceado te permite rendir mejor sin sacrificar tu bienestar.</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setMostrarAyuda(false)}
                className="px-6 py-3 bg-slate-900 dark:bg-emerald-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all hover:-translate-y-1 shadow-lg"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Límite Generador Alcanzado */}
      {mostrarLimiteGeneradorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:!bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

            <button
              onClick={() => setMostrarLimiteGeneradorModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
              <Calendar size={36} className="text-emerald-500" />
            </div>

            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
              ¡Límite semestral alcanzado!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Has usado tus <span className="font-bold text-slate-700 dark:text-slate-300">3 generaciones gratuitas</span> este semestre.
              Actualiza a Premium para generaciones ilimitadas.
            </p>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-600">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Plan actual:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Gratuito</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-slate-500 dark:text-slate-400">Horarios generados:</span>
                <span className="font-bold text-rose-500">{generadorUsageInfo.current}/{generadorUsageInfo.limit}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarLimiteGeneradorModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setMostrarLimiteGeneradorModal(false);
                  setMostrarPricingModal(true);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
              >
                <Crown size={18} />
                Ver Premium
              </button>
            </div>
          </div>
        </div>
      )}

      <PricingModal
        isOpen={mostrarPricingModal}
        onClose={() => setMostrarPricingModal(false)}
      />
    </div>
  );
};

export default SemaforoCarga;
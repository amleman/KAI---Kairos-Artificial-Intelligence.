import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Target, Calculator, Sparkles, Trash2, TrendingUp, CheckCircle, XCircle, Loader2, BookMarked, PlusCircle, Search, Info, Download, AlertTriangle, HelpCircle, X } from "lucide-react";
import API_URL from "../api/apiConfig";

const OptimizadorPromedio = () => {
  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch { return {}; }
  };
  const userData = getUserData();
  const STORAGE_KEY = `SIOA_optimizador_${userData.carne || "invitado"}`;

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

  const [cursosAprobados, setCursosAprobados] = useState([]);
  const [cursosActuales, setCursosActuales] = useState(() => cargarEstado('cursosActuales', [""]));
  const [promedioObjetivo, setPromedioObjetivo] = useState(() => cargarEstado('promedioObjetivo', ""));
  const [resultado, setResultado] = useState(() => cargarEstado('resultado', null));
  const [promedioActual, setPromedioActual] = useState(() => cargarEstado('promedioActual', null));
  const [escenarios, setEscenarios] = useState(() => cargarEstado('escenarios', null));
  const [loading, setLoading] = useState(false);
  const [vistaActiva, setVistaActiva] = useState(() => cargarEstado('vistaActiva', "calculadora"));
  const [mensajeExito, setMensajeExito] = useState("");
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  const [pensum, setPensum] = useState([]);
  const [busquedaActuales, setBusquedaActuales] = useState("");
  const [resultadosBusquedaActuales, setResultadosBusquedaActuales] = useState([]);

  useEffect(() => {
    const estadoAGuardar = {
      cursosActuales,
      promedioObjetivo,
      resultado,
      promedioActual,
      escenarios,
      vistaActiva
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoAGuardar));
  }, [cursosActuales, promedioObjetivo, resultado, promedioActual, escenarios, vistaActiva, STORAGE_KEY]);

  useEffect(() => {
    const userDataGuardado = localStorage.getItem("userData");
    if (userDataGuardado) {
      try {
        const userData = JSON.parse(userDataGuardado);
        if (userData.carne) {
          cargarAprobadosDB(userData.carne);
          cargarPensum();
        }
      } catch (e) {
        console.error("Error parseando userData:", e);
      }
    }
  }, []);

  const cargarAprobadosDB = async (carne) => {
    try {
      const response = await fetch(`${API_URL}/aprobados/${carne}`);
      if (response.ok) {
        const data = await response.json();
        const cursosFormateados = data.map(c => ({
          codigo: c.codigo,
          nombre: c.nombre,
          nota: c.nota || "",
          creditos: c.creditos
        }));
        setCursosAprobados(cursosFormateados.length > 0 ? cursosFormateados : []);
      }
    } catch (error) {
      console.error("Error cargando aprobados:", error);
    }
  };

  const cargarPensum = async () => {
    try {
      const response = await fetch(`${API_URL}/pensum`);
      const csv = await response.text();
      const Papa = await import("papaparse");
      Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const normalizado = results.data.map(c => ({
            codigo: c.codigo || c.CODIGO || c.Código || "",
            nombre: c.nombre_completo || c.Nombre || c.NOMBRE || c.nombre || "",
            creditos: parseInt(c.creditos || c.Créditos || c.credito || 0),
            pre_requisitos: c.pre_requisitos || c.Prerrequisitos || c.Pre_Requisitos || ""
          }));
          setPensum(normalizado);
        }
      });
    } catch (error) {
      console.error("Error cargando pensum:", error);
    }
  };

  useEffect(() => {
    if (busquedaActuales.trim() === "") {
      setResultadosBusquedaActuales([]);
      return;
    }
    const busqueda = busquedaActuales.toLowerCase();
    const codigosAprobados = cursosAprobados.map(c => c.codigo);
    const resultados = pensum.filter(curso => {
      if (codigosAprobados.includes(curso.codigo)) return false;
      if (curso.pre_requisitos) {
        const prereqs = curso.pre_requisitos.replace(/"/g, "").split(",").map(r => r.trim()).filter(r => r !== "");
        const cumplePrerequisitos = prereqs.every(p => codigosAprobados.includes(p));
        if (!cumplePrerequisitos) return false;
      }
      return curso.codigo.toLowerCase().includes(busqueda) || curso.nombre.toLowerCase().includes(busqueda);
    }).slice(0, 5);
    setResultadosBusquedaActuales(resultados);
  }, [busquedaActuales, pensum, cursosAprobados]);

  const agregarCursoActualDesdeBusqueda = (curso) => {
    const yaExiste = cursosActuales.includes(curso.codigo);
    const yaAprobado = cursosAprobados.some(c => c.codigo === curso.codigo);
    if (!yaExiste && !yaAprobado) {
      setCursosActuales([...cursosActuales.filter(c => c !== ""), curso.codigo]);
    } else if (yaAprobado) {
      setMensajeExito("Este curso ya está en tus cursos aprobados");
      setTimeout(() => setMensajeExito(""), 3000);
    }
    setBusquedaActuales("");
    setResultadosBusquedaActuales([]);
  };

  const eliminarCursoActual = (index) => {
    const nuevos = cursosActuales.filter((_, i) => i !== index);
    setCursosActuales(nuevos.length > 0 ? nuevos : [""]);
  };

  // Auto-calcular promedio actual cuando se cargan los cursos aprobados
  useEffect(() => {
    if (cursosAprobados.length > 0) {
      calcularPromedioActual();
    }
  }, [cursosAprobados]);

  const cargarDesdeHorario = async () => {
    if (!userData.carne) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/obtener_horario_guardado/${userData.carne}`);
      const data = await response.json();

      if (data.existe) {
        let lista = [];
        // Manejo robusto de la estructura de datos (puede venir anidada)
        const rawData = data.horario;
        if (rawData.horario && Array.isArray(rawData.horario)) {
          lista = rawData.horario;
        } else if (Array.isArray(rawData)) {
          lista = rawData;
        }

        // Extraer códigos, limpiando nulos/vacíos
        const codigos = lista.map(c => c.Codigo || c.codigo).filter(c => c);

        if (codigos.length > 0) {
          // Eliminar duplicados y actualizar estado
          setCursosActuales([...new Set(codigos)]);
          setMensajeExito("¡Cursos importados de tu último horario!");
          setTimeout(() => setMensajeExito(""), 3000);
        } else {
          setMensajeExito("El horario guardado no contiene cursos válidos.");
          setTimeout(() => setMensajeExito(""), 3000);
        }
      } else {
        setMensajeExito("No se encontró un horario guardado.");
        setTimeout(() => setMensajeExito(""), 3000);
      }
    } catch (error) {
      console.error("Error importando horario:", error);
      setMensajeExito("Error al conectar con la base de datos.");
      setTimeout(() => setMensajeExito(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const calcularPromedioActual = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    if (aprobadosValidos.length === 0) return; // Silent return for auto-calc
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/calcular_promedio_actual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursos_aprobados: aprobadosValidos.map(c => ({ codigo: c.codigo, nota: parseFloat(c.nota) }))
        })
      });
      const data = await response.json();
      setPromedioActual(data);
    } catch (error) {
      console.error("Error calculando promedio:", error);
      setMensajeExito("Error al calcular el promedio actual");
      setTimeout(() => setMensajeExito(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const calcularNotasNecesarias = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    const actualesValidos = cursosActuales.filter(c => c.trim() !== "");
    if (aprobadosValidos.length === 0 || actualesValidos.length === 0) {
      setMensajeExito("Selecciona cursos aprobados y actuales");
      setTimeout(() => setMensajeExito(""), 3000);
      return;
    }
    if (!promedioObjetivo || parseFloat(promedioObjetivo) < 0 || parseFloat(promedioObjetivo) > 100) {
      setMensajeExito("Ingresa un promedio objetivo válido");
      setTimeout(() => setMensajeExito(""), 3000);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/calcular_notas_objetivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursos_aprobados: aprobadosValidos.map(c => ({ codigo: c.codigo, nota: parseFloat(c.nota) })),
          cursos_actuales: actualesValidos,
          promedio_objetivo: parseFloat(promedioObjetivo)
        })
      });
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Error calculando notas:", error);
    } finally {
      setLoading(false);
    }
  };

  const simularEscenarios = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    const actualesValidos = cursosActuales.filter(c => c.trim() !== "");
    if (aprobadosValidos.length === 0 || actualesValidos.length === 0) {
      setMensajeExito("Faltan cursos");
      setTimeout(() => setMensajeExito(""), 3000);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/simular_escenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursos_aprobados: aprobadosValidos.map(c => ({ codigo: c.codigo, nota: parseFloat(c.nota) })),
          cursos_actuales: actualesValidos
        })
      });
      const data = await response.json();
      setEscenarios(data);
    } catch (error) {
      console.error("Error simulando:", error);
    } finally {
      setLoading(false);
    }
  };

  const limpiarTodo = () => {
    setCursosActuales([""]);
    setPromedioObjetivo("");
    setResultado(null);
    setPromedioActual(null);
    setEscenarios(null);
    cargarAprobadosDB(userData.carne);
  };

  const getGraficoNotas = () => {
    if (!resultado || !resultado.factible || !resultado.notas_necesarias) return null;
    return resultado.notas_necesarias.map(nota => ({
      curso: nota.codigo,
      minima: Math.max(61, nota.nota_minima).toFixed(1),
      sugerida: nota.nota_sugerida.toFixed(1)
    }));
  };

  const getGraficoEscenarios = () => {
    if (!escenarios || !escenarios.escenarios) return null;
    return escenarios.escenarios.map(esc => ({
      nombre: esc.nombre,
      promedio: esc.promedio_final,
      notaPromedio: esc.nota_promedio
    }));
  };

  const graficoNotas = getGraficoNotas();
  const graficoEscenarios = getGraficoEscenarios();

  return (
    <div className="animate-fadeIn space-y-8 pb-12">
      {/* Toast Notification */}
      {mensajeExito && (
        <div className="fixed top-24 right-8 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-slide-in border border-slate-700">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50">
            <CheckCircle className="text-white" size={18} />
          </div>
          <span className="font-bold tracking-tight">{mensajeExito}</span>
        </div>
      )}

      {/* Header Section */}
      {/* Header Section */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40 dark:border-slate-700/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-700/20 rounded-bl-full -mr-16 -mt-16 z-0" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 bg-white/20 dark:bg-slate-700/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-slate-600/50">
            <Target size={40} className="text-sky-500 dark:text-sky-400" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Optimizador de Promedio</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Define tu meta académica y nosotros calculamos la estrategia perfecta.</p>
          </div>
          <button
            onClick={() => setMostrarAyuda(true)}
            className="ml-auto p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-600"
            title="¿Cómo funciona?"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-100/80 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl w-fit border border-slate-200/50 dark:border-slate-700/50">
        {[
          { id: "calculadora", label: "Calculadora de Notas", icon: Calculator },
          { id: "escenarios", label: "Simulador de Escenarios", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${vistaActiva === tab.id
              ? "bg-white dark:bg-white text-slate-900 dark:text-slate-900 shadow-lg dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-400 transform scale-105"
              : "text-slate-500 dark:text-slate-200 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}
          >
            <tab.icon size={18} className={vistaActiva === tab.id ? "text-emerald-500 dark:text-emerald-400" : ""} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input (8/12) */}
        <div className="lg:col-span-8 space-y-8">



          {/* Cursos Actuales & Meta */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 dark:border-slate-700/50 shadow-lg relative overflow-hidden">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                <PlusCircle className="text-emerald-500" size={28} />
                Cursos Actuales & Meta
              </h2>

              {/* BOTÓN MÁGICO DE IMPORTAR */}
              <button
                onClick={cargarDesdeHorario}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-all font-bold text-xs border border-sky-100 dark:border-sky-800 hover:shadow-sm"
                title="Importar cursos de tu Horario Guardado"
              >
                <Download size={16} />
                Importar de Horario
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Search */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Agregar Curso Manualmente</p>
                <div className="relative group/search">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-hover/search:text-slate-600 dark:group-hover/search:text-slate-300 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por código..."
                    value={busquedaActuales}
                    onChange={(e) => setBusquedaActuales(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl text-sm font-bold focus:bg-white dark:focus:bg-slate-800 focus:border-slate-900 dark:focus:border-slate-400 focus:ring-0 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100"
                  />
                  {resultadosBusquedaActuales.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                      {resultadosBusquedaActuales.map((curso) => (
                        <div
                          key={curso.codigo}
                          onClick={() => agregarCursoActualDesdeBusqueda(curso)}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-50 dark:border-slate-700 last:border-0 transition-colors group/item"
                        >
                          <div className="font-black text-slate-800 dark:text-slate-100 text-sm group-hover/item:text-emerald-700 dark:group-hover/item:text-emerald-400 transition-colors">#{curso.codigo} - {curso.nombre}</div>
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{curso.creditos} créditos</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta Input */}
              {vistaActiva === "calculadora" && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Promedio Objetivo (%)</p>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                    <input
                      type="number"
                      placeholder="Ej: 85.0"
                      min="0" max="100" step="0.1"
                      value={promedioObjetivo}
                      onChange={(e) => setPromedioObjetivo(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl text-xl font-black text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-0 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* List of current courses */}
            {cursosActuales.filter(c => c !== "").length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {cursosActuales.filter(c => c !== "").map((codigo, index) => {
                  const curso = pensum.find(c => c.codigo === codigo);
                  return (
                    <div key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group shadow-sm hover:shadow-md transition-all hover:border-slate-300 dark:hover:border-slate-500">
                      <div className="min-w-0 pr-4">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1 inline-block border border-emerald-100 dark:border-emerald-800">#{codigo}</span>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate uppercase tracking-tight">{curso?.nombre || "Cargando nombre..."}</p>
                      </div>
                      <button
                        onClick={() => eliminarCursoActual(index)}
                        className="p-2.5 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-10 p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No has agregado cursos para este semestre.</p>
                <button onClick={cargarDesdeHorario} className="mt-3 text-xs font-black text-sky-600 dark:text-sky-400 hover:underline">Importar de mi Horario Guardado</button>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={vistaActiva === "calculadora" ? calcularNotasNecesarias : simularEscenarios}
                disabled={loading}
                className="flex-1 bg-sky-600 dark:bg-sky-500 text-white py-3.5 rounded-xl font-black text-sm hover:bg-sky-700 dark:hover:bg-sky-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-sky-200 dark:shadow-sky-900/30 hover:-translate-y-1 active:scale-95 group uppercase tracking-wider"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (vistaActiva === "calculadora" ? <Calculator size={18} className="group-hover:rotate-12 transition-transform" /> : <Sparkles size={18} className="group-hover:scale-110 transition-transform" />)}
                {vistaActiva === "calculadora" ? "Calcular Notas" : "Simular Escenarios"}
              </button>
              <button
                onClick={limpiarTodo}
                className="px-8 bg-white dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 rounded-2xl transition-all shadow-sm"
                title="Limpiar todo"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          {/* Visualization Charts */}
          {(resultado || escenarios) && (
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 dark:border-slate-700/50 shadow-xl animate-fadeIn">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3">
                <TrendingUp className="text-emerald-500" size={28} />
                Análisis Proyectado
              </h2>
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {vistaActiva === "calculadora" && graficoNotas ? (
                    <BarChart data={graficoNotas}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="curso" tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="minima" name="Min. para aprobar (61+)" fill="#cbd5e1" radius={[8, 8, 8, 8]} barSize={50} />
                      <Bar dataKey="sugerida" name="Sug. para Meta" fill="#10b981" radius={[8, 8, 8, 8]} barSize={50} />
                    </BarChart>
                  ) : graficoEscenarios ? (
                    <LineChart data={graficoEscenarios}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="promedio" name="Promedio Final Estimado" stroke="#0ea5e9" strokeWidth={5} dot={{ r: 6, fill: "#0ea5e9", strokeWidth: 3, stroke: "#fff" }} activeDot={{ r: 8, fill: "#f59e0b" }} />
                    </LineChart>
                  ) : <div />}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Results Summary (4/12) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Promedio Actual Card */}
          {promedioActual && (
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-8 shadow-xl shadow-sky-200 relative overflow-hidden group text-white">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors" />
              <h3 className="text-[10px] font-black text-sky-100 uppercase tracking-[0.2em] mb-6 relative">Promedio de Cierre</h3>
              <div className="flex items-baseline gap-1 relative mb-6">
                <span className="text-7xl font-black tracking-tighter">{promedioActual.promedio}</span>
                <span className="text-2xl font-bold text-sky-200">%</span>
              </div>
              <div className="flex gap-4 border-t border-white/20 pt-6">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-sky-100 uppercase tracking-widest">CRÉDITOS</p>
                  <p className="text-xl font-black">{promedioActual.creditos_totales || "0"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-sky-100 uppercase tracking-widest">CURSOS</p>
                  <p className="text-xl font-black">{promedioActual.cursos_count || "0"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Breakdown */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 dark:border-slate-700/50 shadow-xl">
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={24} />
              Resultados
            </h2>

            {!resultado && !escenarios ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-500 border border-slate-100 dark:border-slate-600">
                  <Target size={32} />
                </div>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold max-w-[180px] mx-auto">Configura tus cursos y meta para ver la magia.</p>
              </div>
            ) : vistaActiva === "calculadora" && resultado ? (
              <div className="space-y-6">
                {(() => {
                  const maxNota = resultado.notas_necesarias ? Math.max(...resultado.notas_necesarias.map(n => n.nota_sugerida)) : 0;
                  const isHard = !resultado.factible || maxNota > 90;
                  const isMedium = !isHard && maxNota > 80;

                  return (
                    isHard ? (
                      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
                        <XCircle className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" size={24} />
                        <div>
                          <p className="text-rose-900 dark:text-rose-100 font-black mb-1">Meta Desafiante</p>
                          <p className="text-xs text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
                            {!resultado.factible ? resultado.mensaje : "Requiere un rendimiento casi perfecto."}
                          </p>
                        </div>
                      </div>
                    ) : isMedium ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={24} />
                        <div>
                          <p className="text-amber-900 dark:text-amber-100 font-black mb-1">Nivel Exigente</p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed">Necesitarás un esfuerzo considerable para alcanzar esta meta.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
                        <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={24} />
                        <div>
                          <p className="text-emerald-900 dark:text-emerald-100 font-black mb-1">¡Meta Alcanzable!</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold leading-relaxed">{resultado.mensaje}</p>
                        </div>
                      </div>
                    )
                  );
                })()}

                <div className="space-y-3">
                  {resultado.notas_necesarias?.map((nota, idx) => {
                    const cursoNombre = pensum.find(p => p.codigo === nota.codigo)?.nombre || "";
                    return (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-700/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div className="mr-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded text-xs">#{nota.codigo}</span>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded">{nota.creditos} Cr.</span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight uppercase">{cursoNombre}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 shadow-sm">
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Mínima</p>
                            <p className="text-xl font-black text-slate-600 dark:text-slate-300">{Math.max(61, nota.nota_minima).toFixed(1)}</p>
                          </div>
                          <div className="text-center p-3 bg-slate-900 dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200 dark:shadow-slate-900/50">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                            <p className="text-xl font-black text-white">{nota.nota_sugerida.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : escenarios ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-1">Escenarios Proyectados</p>
                {escenarios.escenarios?.map((esc, idx) => {
                  let borderColor = "border-slate-200 dark:border-slate-600";
                  let iconColor = "text-slate-400";
                  let bgColor = "bg-white dark:bg-slate-700/50";
                  let description = "";

                  if (esc.nombre.includes("Pesimista")) {
                    borderColor = "border-rose-200 dark:border-rose-800/50 hover:border-rose-400 dark:hover:border-rose-600";
                    iconColor = "text-rose-500";
                    bgColor = "bg-rose-50/30 dark:bg-rose-900/10";
                    description = "Si apruebas todo con la nota mínima (61 pts).";
                  } else if (esc.nombre.includes("Realista")) {
                    borderColor = "border-blue-200 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600";
                    iconColor = "text-blue-500";
                    bgColor = "bg-blue-50/30 dark:bg-blue-900/10";
                    description = "Si mantienes un rendimiento promedio (75 pts).";
                  } else if (esc.nombre.includes("Optimista")) {
                    borderColor = "border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600";
                    iconColor = "text-emerald-500";
                    bgColor = "bg-emerald-50/30 dark:bg-emerald-900/10";
                    description = "Si logras un rendimiento destacado (90 pts).";
                  } else if (esc.nombre.includes("Perfecto")) {
                    borderColor = "border-amber-200 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600";
                    iconColor = "text-amber-500";
                    bgColor = "bg-amber-50/30 dark:bg-amber-900/10";
                    description = "Rendimiento perfecto en todos los cursos (100 pts).";
                  }

                  return (
                    <div key={idx} className={`${bgColor} p-5 rounded-2xl border ${borderColor} group transition-all cursor-default`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-black text-slate-700 dark:text-slate-200 text-xs uppercase tracking-tight flex items-center gap-2">
                            <Sparkles size={12} className={iconColor} />
                            {esc.nombre.split("(")[0].trim()}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-tight">{description}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 ${iconColor}`}>
                          Prom. {esc.nota_promedio}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className={`text-3xl font-black ${iconColor}`}>{esc.promedio_final.toFixed(2)}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">% final</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {/* Help Modal */}
      {mostrarAyuda && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-3xl w-full shadow-2xl relative border border-white/50 dark:border-slate-700/50 animate-scaleIn">
            <button
              onClick={() => setMostrarAyuda(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <Info className="text-emerald-500" size={32} />
                Guía de Funcionalidades
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Aprende a sacar el máximo provecho de nuestras herramientas de predicción.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Calculadora de Notas */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-white dark:bg-slate-700/50 rounded-xl flex items-center justify-center shadow-sm mb-4 border border-slate-100 dark:border-slate-600">
                  <Calculator className="text-sky-500 dark:text-sky-400" size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Calculadora de Notas</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                  Define una <strong>meta de promedio</strong> exacta y el sistema calculará qué nota mínima necesitas en cada curso actual para lograrla.
                </p>
                <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl border border-sky-100 dark:border-sky-800/30">
                  <p className="text-xs text-sky-800 dark:text-sky-300 font-bold">
                    💡 <span className="underline decoration-sky-300 decoration-2 underline-offset-2">Tip:</span> Úsalo al inicio del semestre para planificar tu esfuerzo.
                  </p>
                </div>
              </div>

              {/* Simulador de Escenarios */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 bg-white dark:bg-slate-700/50 rounded-xl flex items-center justify-center shadow-sm mb-4 border border-slate-100 dark:border-slate-600">
                  <Sparkles className="text-blue-500 dark:text-blue-400" size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Simulador de Escenarios</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                  Proyecta tu promedio final en <strong>4 situaciones hipotéticas</strong>, desde aprobar con la mínima hasta un rendimiento perfecto.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-bold">
                    🔮 <span className="underline decoration-blue-300 decoration-2 underline-offset-2">Tip:</span> Ideal para conocer tus límites superior e inferior rápidamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setMostrarAyuda(false)}
                className="px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all hover:-translate-y-1 shadow-lg"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizadorPromedio;

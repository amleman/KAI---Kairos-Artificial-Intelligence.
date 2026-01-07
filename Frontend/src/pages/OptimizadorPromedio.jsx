import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Target, Calculator, Sparkles, Trash2, TrendingUp, CheckCircle, XCircle, Loader2, BookMarked, PlusCircle, Search, Info } from "lucide-react";

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
      const response = await fetch(`http://127.0.0.1:8000/aprobados/${carne}`);
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
      const response = await fetch("http://127.0.0.1:8000/pensum");
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

  const calcularPromedioActual = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    if (aprobadosValidos.length === 0) {
      setMensajeExito("Debes agregar al menos un curso aprobado con nota");
      setTimeout(() => setMensajeExito(""), 3000);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/calcular_promedio_actual", {
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
      const response = await fetch("http://127.0.0.1:8000/calcular_notas_objetivo", {
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
      const response = await fetch("http://127.0.0.1:8000/simular_escenarios", {
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
        <div className="fixed top-24 right-8 z-50 bg-white/90 backdrop-blur-xl text-slate-800 px-6 py-4 rounded-2xl shadow-xl border border-soft-blue flex items-center gap-3 animate-slide-in">
          <div className="w-8 h-8 bg-pastel-green rounded-xl flex items-center justify-center">
            <CheckCircle className="text-green-600" size={18} />
          </div>
          <span className="font-bold">{mensajeExito}</span>
        </div>
      )}

      {/* Header Glass Card */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border-[3px] border-soft-blue shadow-inner">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-pastel-purple rounded-2xl text-slate-700 shadow-sm">
            <Target size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Optimizador de Promedio</h1>
            <p className="text-slate-500 font-medium">Define tu meta y nosotros calculamos el camino.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4">
        {[
          { id: "calculadora", label: "Calculadora de Notas", icon: Calculator },
          { id: "escenarios", label: "Simulador de Escenarios", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setVistaActiva(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${vistaActiva === tab.id
              ? "bg-slate-900 text-white shadow-lg scale-105"
              : "bg-white/50 backdrop-blur-xl text-slate-600 border border-soft-blue shadow-inner hover:bg-white/60"
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input (8/12) */}
        <div className="lg:col-span-8 space-y-8">

          {/* Cursos Aprobados Section */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border-[3px] border-soft-blue shadow-inner">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookMarked className="text-pastel-purple-dark" size={24} />
                Historial de Notas Académicas
              </h2>
              <button
                onClick={calcularPromedioActual}
                disabled={loading}
                className="px-5 py-2.5 bg-white/60 border-[2px] border-soft-blue/50 text-slate-700 rounded-xl text-xs font-bold hover:bg-white hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                Ver Promedio Actual
              </button>
            </div>

            {cursosAprobados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                {cursosAprobados.map((curso, index) => (
                  <div key={index} className="bg-white/60 border border-pastel-blue/20 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">#{curso.codigo}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastel-blue/30 text-slate-600">{curso.creditos} Cr.</span>
                    </div>
                    <h4 className="text-slate-800 font-bold text-xs line-clamp-2 min-h-[32px] mb-3">{curso.nombre}</h4>
                    <div className="flex items-center justify-between border-t border-slate-100/50 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">NOTA</span>
                      <span className="text-sm font-black text-pastel-purple-dark bg-white px-3 py-1 rounded-lg border-[2px] border-soft-blue/30">{curso.nota || "--"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-pastel-blue/20 rounded-3xl">
                <Info size={48} className="mb-3 opacity-10" />
                <p className="text-sm font-medium">No hay cursos aprobados en el sistema.</p>
              </div>
            )}
          </div>

          {/* Cursos Actuales & Meta */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border-[3px] border-soft-blue shadow-inner">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PlusCircle className="text-blue-500" size={24} />
              Cursos Actuales & Meta
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Search */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Agregar Cursos que Cursas</p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por código..."
                    value={busquedaActuales}
                    onChange={(e) => setBusquedaActuales(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/60 border-[2px] border-soft-blue/50 rounded-xl text-sm focus:ring-2 focus:ring-pastel-blue focus:border-transparent transition-all"
                  />
                  {resultadosBusquedaActuales.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white/90 backdrop-blur-xl border border-pastel-blue/40 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
                      {resultadosBusquedaActuales.map((curso) => (
                        <div
                          key={curso.codigo}
                          onClick={() => agregarCursoActualDesdeBusqueda(curso)}
                          className="p-4 hover:bg-pastel-blue/20 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-slate-800 text-sm">{curso.codigo} - {curso.nombre}</div>
                          <div className="text-[10px] font-bold text-slate-400">{curso.creditos} créditos</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meta Input */}
              {vistaActiva === "calculadora" && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Promedio Objetivo (%)</p>
                  <input
                    type="number"
                    placeholder="Ej: 85.0"
                    min="0" max="100" step="0.1"
                    value={promedioObjetivo}
                    onChange={(e) => setPromedioObjetivo(e.target.value)}
                    className="w-full px-6 py-4 bg-white/60 border-[2px] border-soft-blue/50 rounded-xl text-xl font-black text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-pastel-purple focus:border-transparent transition-all"
                  />
                </div>
              )}
            </div>

            {/* List of current courses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {cursosActuales.filter(c => c !== "").map((codigo, index) => {
                const curso = pensum.find(c => c.codigo === codigo);
                return (
                  <div key={index} className="bg-white/80 p-4 rounded-xl border border-pastel-blue/20 flex justify-between items-center group shadow-sm">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1 block">#{codigo}</span>
                      <p className="font-bold text-slate-700 text-sm truncate pr-4">{curso?.nombre || "Cargando..."}</p>
                    </div>
                    <button
                      onClick={() => eliminarCursoActual(index)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={vistaActiva === "calculadora" ? calcularNotasNecesarias : simularEscenarios}
                disabled={loading}
                className="flex-1 bg-slate-900 text-white py-5 rounded-xl font-black text-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : (vistaActiva === "calculadora" ? <Calculator size={24} /> : <Sparkles size={24} />)}
                {vistaActiva === "calculadora" ? "Calcular Notas Necesarias" : "Simular Todos los Escenarios"}
              </button>
              <button
                onClick={limpiarTodo}
                className="px-8 bg-white/40 border-[2px] border-soft-blue/50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          {/* Visualization Charts */}
          {(resultado || escenarios) && (
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border-[3px] border-soft-blue shadow-inner animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={24} />
                Análisis Proyectado
              </h2>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  {vistaActiva === "calculadora" && graficoNotas ? (
                    <BarChart data={graficoNotas}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="curso" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="minima" name="Min. para aprobar (61+)" fill="#FDE2E4" radius={[8, 8, 8, 8]} barSize={40} />
                      <Bar dataKey="sugerida" name="Sug. para Meta" fill="#DFEEF3" radius={[8, 8, 8, 8]} barSize={40} />
                    </BarChart>
                  ) : graficoEscenarios ? (
                    <LineChart data={graficoEscenarios}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="nombre" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="promedio" name="Promedio Final Estimado" stroke="#B8A7D1" strokeWidth={4} dot={{ r: 6, fill: "#B8A7D1", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
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
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border-[3px] border-soft-blue shadow-inner relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors" />
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 relative">Promedio de Cierre</h3>
              <div className="flex items-baseline gap-2 relative">
                <span className="text-6xl font-black text-slate-800 tracking-tighter">{promedioActual.promedio}</span>
                <span className="text-xl font-bold text-blue-500">%</span>
              </div>
              <div className="mt-6 flex gap-4 border-t border-pastel-blue/20 pt-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400">CRÉDITOS</p>
                  <p className="text-sm font-black text-slate-700">{promedioActual.creditos_totales || "0"}</p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400">CURSOS</p>
                  <p className="text-sm font-black text-slate-700">{promedioActual.cursos_count || "0"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Breakdown */}
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-8 border border-soft-blue shadow-inner">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="text-purple-500" size={24} />
              Resumen de Metas
            </h2>

            {!resultado && !escenarios ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Target size={32} />
                </div>
                <p className="text-sm text-slate-400 font-medium max-w-[180px] mx-auto">Configura tus cursos y presiona <b>Calcular</b>.</p>
              </div>
            ) : vistaActiva === "calculadora" && resultado ? (
              <div className="space-y-6">
                {resultado.factible ? (
                  <div className="bg-green-50/50 border border-green-100 p-5 rounded-xl flex gap-3">
                    <CheckCircle className="text-green-500 shrink-0" size={24} />
                    <p className="text-sm text-green-700 font-bold leading-tight">{resultado.mensaje}</p>
                  </div>
                ) : (
                  <div className="bg-red-50/50 border border-red-100 p-5 rounded-xl flex gap-3">
                    <XCircle className="text-red-500 shrink-0" size={24} />
                    <p className="text-sm text-red-700 font-bold leading-tight">{resultado.mensaje}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {resultado.notas_necesarias?.map((nota, idx) => (
                    <div key={idx} className="bg-white/60 p-4 rounded-xl border border-pastel-blue/20">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-black text-slate-700">#{nota.codigo}</span>
                        <span className="text-[10px] font-bold text-slate-400">{nota.creditos} Cr.</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-2 bg-red-50/50 rounded-xl">
                          <p className="text-[9px] font-bold text-red-400 uppercase">Mínima</p>
                          <p className="text-lg font-black text-red-600">{Math.max(61, nota.nota_minima).toFixed(1)}</p>
                        </div>
                        <div className="text-center p-2 bg-green-50/50 rounded-xl">
                          <p className="text-[9px] font-bold text-green-400 uppercase">Sugerida</p>
                          <p className="text-lg font-black text-green-600">{nota.nota_sugerida.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : escenarios ? (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 mb-4 px-1">Escenarios Sugeridos para Alcanzar:</p>
                {escenarios.escenarios?.map((esc, idx) => (
                  <div key={idx} className="bg-white/60 p-5 rounded-xl border border-pastel-blue/20 group hover:bg-white transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black text-slate-700 text-sm">{esc.nombre}</h4>
                      <span className="text-[10px] font-bold px-2 py-1 bg-pastel-purple/20 text-pastel-purple-dark rounded-lg">Prom. {esc.nota_promedio}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800">{esc.promedio_final.toFixed(2)}</span>
                      <span className="text-sm font-bold text-slate-400">% final</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div >
  );
};

export default OptimizadorPromedio;

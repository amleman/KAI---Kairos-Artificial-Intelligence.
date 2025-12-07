import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Target, Calculator, Sparkles, Trash2, TrendingUp, CheckCircle, XCircle, Loader2, BookMarked, PlusCircle } from "lucide-react";
import Navbar from "../components/Navbar";

const OptimizadorPromedio = () => {
  const [cursosAprobados, setCursosAprobados] = useState([]);
  const [cursosActuales, setCursosActuales] = useState([""]);
  const [promedioObjetivo, setPromedioObjetivo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [promedioActual, setPromedioActual] = useState(null);
  const [escenarios, setEscenarios] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vistaActiva, setVistaActiva] = useState("calculadora");
  
  // Estados para búsqueda
  const [pensum, setPensum] = useState([]);
  const [busquedaAprobados, setBusquedaAprobados] = useState("");
  const [busquedaActuales, setBusquedaActuales] = useState("");
  const [resultadosBusquedaAprobados, setResultadosBusquedaAprobados] = useState([]);
  const [resultadosBusquedaActuales, setResultadosBusquedaActuales] = useState([]);

  // Cargar datos al iniciar
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

  // Cargar cursos aprobados desde la DB
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
        setCursosAprobados(cursosFormateados.length > 0 ? cursosFormateados : [{ codigo: "", nombre: "", nota: "", creditos: 0 }]);
      }
    } catch (error) {
      console.error("Error cargando aprobados:", error);
    }
  };

  // Cargar pensum completo
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

  // Búsqueda de cursos aprobados
  useEffect(() => {
    if (busquedaAprobados.trim() === "") {
      setResultadosBusquedaAprobados([]);
      return;
    }

    const busqueda = busquedaAprobados.toLowerCase();
    const resultados = pensum.filter(curso => 
      curso.codigo.toLowerCase().includes(busqueda) ||
      curso.nombre.toLowerCase().includes(busqueda)
    ).slice(0, 5);
    
    setResultadosBusquedaAprobados(resultados);
  }, [busquedaAprobados, pensum]);

  // Búsqueda de cursos actuales
  useEffect(() => {
    if (busquedaActuales.trim() === "") {
      setResultadosBusquedaActuales([]);
      return;
    }

    const busqueda = busquedaActuales.toLowerCase();
    const codigosAprobados = cursosAprobados.map(c => c.codigo);
    
    // Filtrar cursos disponibles (que cumplan prerrequisitos)
    const resultados = pensum.filter(curso => {
      // No mostrar si ya está aprobado
      if (codigosAprobados.includes(curso.codigo)) return false;
      
      // Verificar prerrequisitos
      if (curso.pre_requisitos) {
        const prereqs = curso.pre_requisitos
          .replace(/"/g, "")
          .split(",")
          .map(r => r.trim())
          .filter(r => r !== "");
        
        // Todos los prerrequisitos deben estar aprobados
        const cumplePrerequisitos = prereqs.every(p => codigosAprobados.includes(p));
        if (!cumplePrerequisitos) return false;
      }
      
      // Filtrar por búsqueda
      return curso.codigo.toLowerCase().includes(busqueda) ||
             curso.nombre.toLowerCase().includes(busqueda);
    }).slice(0, 5);
    
    setResultadosBusquedaActuales(resultados);
  }, [busquedaActuales, pensum, cursosAprobados]);

  // Agregar curso desde búsqueda
  const agregarCursoAprobadoDesdeBusqueda = (curso) => {
    const yaExiste = cursosAprobados.some(c => c.codigo === curso.codigo);
    if (!yaExiste) {
      setCursosAprobados([...cursosAprobados, { ...curso, nota: "" }]);
    }
    setBusquedaAprobados("");
    setResultadosBusquedaAprobados([]);
  };

  // Eliminar curso aprobado
  const eliminarCursoAprobado = (index) => {
    const nuevos = cursosAprobados.filter((_, i) => i !== index);
    setCursosAprobados(nuevos.length > 0 ? nuevos : [{ codigo: "", nombre: "", nota: "", creditos: 0 }]);
  };

  // Actualizar curso aprobado
  const actualizarCursoAprobado = async (index, field, value) => {
    const nuevos = [...cursosAprobados];
    nuevos[index][field] = value;
    setCursosAprobados(nuevos);

    // Si se actualiza la nota, guardarla en la DB
    if (field === "nota" && value && nuevos[index].codigo) {
      const userDataGuardado = localStorage.getItem("userData");
      if (userDataGuardado) {
        try {
          const userData = JSON.parse(userDataGuardado);
          if (userData.carne) {
            await fetch("http://127.0.0.1:8000/guardar_notas", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                carne: userData.carne,
                notas: [{
                  codigo: nuevos[index].codigo,
                  nota: parseFloat(value)
                }]
              })
            });
            console.log("Nota guardada en DB:", nuevos[index].codigo, value);
          }
        } catch (error) {
          console.error("Error guardando nota:", error);
        }
      }
    }
  };

  // Agregar curso actual desde búsqueda
  const agregarCursoActualDesdeBusqueda = (curso) => {
    const yaExiste = cursosActuales.includes(curso.codigo);
    const yaAprobado = cursosAprobados.some(c => c.codigo === curso.codigo);
    
    if (!yaExiste && !yaAprobado) {
      setCursosActuales([...cursosActuales.filter(c => c !== ""), curso.codigo]);
    } else if (yaAprobado) {
      alert("Este curso ya está en tus cursos aprobados");
    }
    setBusquedaActuales("");
    setResultadosBusquedaActuales([]);
  };

  // Eliminar curso actual
  const eliminarCursoActual = (index) => {
    const nuevos = cursosActuales.filter((_, i) => i !== index);
    setCursosActuales(nuevos.length > 0 ? nuevos : [""]);
  };

  // Calcular promedio actual
  const calcularPromedioActual = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    
    if (aprobadosValidos.length === 0) {
      alert("Debes agregar al menos un curso aprobado con nota");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/calcular_promedio_actual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursos_aprobados: aprobadosValidos.map(c => ({
            codigo: c.codigo,
            nota: parseFloat(c.nota)
          }))
        })
      });
      const data = await response.json();
      setPromedioActual(data);
    } catch (error) {
      console.error("Error calculando promedio:", error);
      alert("Error al calcular el promedio actual");
    } finally {
      setLoading(false);
    }
  };

  // Calcular notas necesarias
  const calcularNotasNecesarias = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    const actualesValidos = cursosActuales.filter(c => c.trim() !== "");

    if (aprobadosValidos.length === 0) {
      alert("Debes agregar al menos un curso aprobado con nota");
      return;
    }

    if (actualesValidos.length === 0) {
      alert("Debes agregar al menos un curso actual");
      return;
    }

    if (!promedioObjetivo || parseFloat(promedioObjetivo) < 0 || parseFloat(promedioObjetivo) > 100) {
      alert("Ingresa un promedio objetivo válido (0-100)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/calcular_notas_objetivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursos_aprobados: aprobadosValidos.map(c => ({
            codigo: c.codigo,
            nota: parseFloat(c.nota)
          })),
          cursos_actuales: actualesValidos,
          promedio_objetivo: parseFloat(promedioObjetivo)
        })
      });
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Error calculando notas:", error);
      alert("Error al calcular las notas necesarias");
    } finally {
      setLoading(false);
    }
  };

  // Simular escenarios
  const simularEscenarios = async () => {
    const aprobadosValidos = cursosAprobados.filter(c => c.codigo && c.nota);
    const actualesValidos = cursosActuales.filter(c => c.trim() !== "");

    if (aprobadosValidos.length === 0 || actualesValidos.length === 0) {
      alert("Debes agregar cursos aprobados y actuales");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/simular_escenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cursos_aprobados: aprobadosValidos.map(c => ({
            codigo: c.codigo,
            nota: parseFloat(c.nota)
          })),
          cursos_actuales: actualesValidos
        })
      });
      const data = await response.json();
      setEscenarios(data);
    } catch (error) {
      console.error("Error simulando escenarios:", error);
      alert("Error al simular escenarios");
    } finally {
      setLoading(false);
    }
  };

  const limpiarTodo = () => {
    setCursosAprobados([]);
    setCursosActuales([""]);
    setPromedioObjetivo("");
    setResultado(null);
    setPromedioActual(null);
    setEscenarios(null);
    
    // Recargar cursos aprobados de la DB
    const userDataGuardado = localStorage.getItem("userData");
    if (userDataGuardado) {
      try {
        const userData = JSON.parse(userDataGuardado);
        if (userData.carne) {
          cargarAprobadosDB(userData.carne);
        }
      } catch (e) {
        console.error("Error parseando userData:", e);
      }
    }
  };

  // Preparar datos para gráfico de notas necesarias
  const getGraficoNotas = () => {
    if (!resultado || !resultado.factible || !resultado.notas_necesarias) return null;
    
    return resultado.notas_necesarias.map(nota => ({
      curso: nota.codigo,
      minima: Math.max(61, nota.nota_minima).toFixed(1), // No menor a 61
      sugerida: nota.nota_sugerida.toFixed(1)
    }));
  };

  // Preparar datos para gráfico de escenarios
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
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
        {/* ----------------------- HEADER ----------------------- */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Target className="text-purple-600" size={28} />
              Optimizador de Promedio
            </h1>
            <p className="text-gray-600 text-sm">
              Calcula las notas que necesitas en tus cursos actuales para alcanzar tu promedio objetivo
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setVistaActiva("calculadora")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              vistaActiva === "calculadora"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow"
            }`}
          >
            <Calculator size={16} />
            Calculadora de Notas
          </button>
          <button
            onClick={() => setVistaActiva("escenarios")}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              vistaActiva === "escenarios"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow"
            }`}
          >
            <Sparkles size={16} />
            Simulador de Escenarios
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Entrada */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cursos Aprobados */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BookMarked className="text-purple-600" size={20} />
                  Cursos Aprobados
                </h2>
                <button
                  onClick={calcularPromedioActual}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Calculando...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={14} />
                      Calcular Promedio
                    </>
                  )}
                </button>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={busquedaAprobados}
                  onChange={(e) => setBusquedaAprobados(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                {resultadosBusquedaAprobados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {resultadosBusquedaAprobados.map((curso) => (
                      <div
                        key={curso.codigo}
                        onClick={() => agregarCursoAprobadoDesdeBusqueda(curso)}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-semibold">{curso.codigo} - {curso.nombre}</div>
                        <div className="text-sm text-gray-600">{curso.creditos} créditos</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cursosAprobados.map((curso, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">
                          {curso.codigo} {curso.nombre && `- ${curso.nombre}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {curso.creditos} créditos
                        </div>
                      </div>
                      <input
                        type="number"
                        placeholder="Nota"
                        min="0"
                        max="100"
                        step="0.01"
                        value={curso.nota}
                        onChange={(e) => actualizarCursoAprobado(index, "nota", e.target.value)}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => eliminarCursoAprobado(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {cursosAprobados.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No hay cursos aprobados cargados
                </div>
              )}
            </div>

            {/* Cursos Actuales */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <PlusCircle className="text-purple-600" size={20} />
                Cursos Actuales (que estás llevando)
              </h2>

              {/* Búsqueda */}
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={busquedaActuales}
                  onChange={(e) => setBusquedaActuales(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                {resultadosBusquedaActuales.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {resultadosBusquedaActuales.map((curso) => (
                      <div
                        key={curso.codigo}
                        onClick={() => agregarCursoActualDesdeBusqueda(curso)}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-semibold">{curso.codigo} - {curso.nombre}</div>
                        <div className="text-sm text-gray-600">{curso.creditos} créditos</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cursosActuales.filter(c => c !== "").map((codigo, index) => {
                  const curso = pensum.find(c => c.codigo === codigo);
                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {codigo} {curso && `- ${curso.nombre}`}
                        </div>
                        {curso && (
                          <div className="text-xs text-gray-600">{curso.creditos} créditos</div>
                        )}
                      </div>
                      <button
                        onClick={() => eliminarCursoActual(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {cursosActuales.filter(c => c !== "").length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No hay cursos actuales agregados. Usa la búsqueda para agregar cursos.
                </div>
              )}
            </div>

            {/* Vista Calculadora */}
            {vistaActiva === "calculadora" && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Target className="text-purple-600" size={20} />
                  Promedio Objetivo
                </h2>

                <div className="mb-4">
                  <input
                    type="number"
                    placeholder="Ingresa tu promedio objetivo (0-100)"
                    min="0"
                    max="100"
                    step="0.1"
                    value={promedioObjetivo}
                    onChange={(e) => setPromedioObjetivo(e.target.value)}
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={calcularNotasNecesarias}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Calculator size={18} />
                        Calcular Notas
                      </>
                    )}
                  </button>
                  <button
                    onClick={limpiarTodo}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {/* Vista Escenarios */}
            {vistaActiva === "escenarios" && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={20} />
                  Simulación de Escenarios
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Simula diferentes escenarios según el desempeño en tus cursos actuales
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={simularEscenarios}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        Simular Escenarios
                      </>
                    )}
                  </button>
                  <button
                    onClick={limpiarTodo}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {/* Gráfico de Notas Necesarias */}
            {resultado && resultado.factible && graficoNotas && vistaActiva === "calculadora" && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="text-purple-600" size={20} />
                  Visualización de Notas Necesarias
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={graficoNotas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="curso" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      dataKey="minima" 
                      name="Nota Mínima" 
                      fill="#ef4444" 
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="sugerida" 
                      name="Nota Sugerida" 
                      fill="#22c55e" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Escenarios */}
            {escenarios && graficoEscenarios && vistaActiva === "escenarios" && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Sparkles className="text-purple-600" size={20} />
                  Comparación de Escenarios
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={graficoEscenarios}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="nombre" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="promedio" 
                      name="Promedio Final" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Panel de Resultados */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="text-purple-600" size={20} />
                Resultados
              </h2>

              {/* Promedio Actual */}
              {promedioActual && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">Promedio Actual</h3>
                  <p className="text-2xl font-bold text-blue-600">{promedioActual.promedio}</p>
                  <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                    <p>Créditos: {promedioActual.creditos_totales}</p>
                    <p>Cursos: {promedioActual.cursos_count}</p>
                  </div>
                </div>
              )}

              {/* Resultados Calculadora */}
              {vistaActiva === "calculadora" && resultado && (
                <div className="space-y-3">
                  {resultado.factible ? (
                    <>
                      <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CheckCircle className="text-green-600" size={20} />
                          <h3 className="font-semibold text-green-800 text-sm">¡Es Factible!</h3>
                        </div>
                        <p className="text-xs text-green-700">{resultado.mensaje}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-800 text-sm">Notas Necesarias:</h4>
                        <div className="space-y-1.5 max-h-96 overflow-y-auto">
                          {resultado.notas_necesarias.map((nota, idx) => (
                            <div key={idx} className="p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="font-mono font-semibold text-gray-800 text-xs">{nota.codigo}</span>
                                <span className="text-xs text-gray-600">{nota.creditos} créd.</span>
                              </div>
                              <div className="space-y-0.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Mínima:</span>
                                  <span className="font-bold text-red-600">
                                    {Math.max(61, nota.nota_minima).toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Sugerida:</span>
                                  <span className="font-bold text-green-600">{nota.nota_sugerida.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center gap-2 mb-1.5">
                        <XCircle className="text-red-600" size={20} />
                        <h3 className="font-semibold text-red-800 text-sm">No es Factible</h3>
                      </div>
                      <p className="text-xs text-red-700">{resultado.mensaje}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resultados Escenarios */}
              {vistaActiva === "escenarios" && escenarios && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                    <h3 className="font-semibold text-gray-800 mb-1.5 text-sm">Promedio Actual</h3>
                    <p className="text-2xl font-bold text-purple-600">{escenarios.promedio_actual.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800 text-sm">Escenarios Posibles:</h4>
                    {escenarios.escenarios.map((esc, idx) => (
                      <div key={idx} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-semibold text-gray-800 text-sm">{esc.nombre}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded font-medium">{esc.nota_promedio}</span>
                        </div>
                        <p className="text-xl font-bold text-purple-600">{esc.promedio_final.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!resultado && !escenarios && vistaActiva === "calculadora" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Ingresa tus datos y haz clic en "Calcular" para ver los resultados
                  </p>
                </div>
              )}

              {!escenarios && vistaActiva === "escenarios" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Haz clic en "Simular Escenarios" para ver las proyecciones
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default OptimizadorPromedio;

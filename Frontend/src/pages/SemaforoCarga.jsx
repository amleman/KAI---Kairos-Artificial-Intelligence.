import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrafficCone, CheckCircle, BookOpen, BarChart3, TrendingUp, Loader2, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";

const SemaforoCarga = () => {
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [seccionesSeleccionadas, setSeccionesSeleccionadas] = useState({}); // {codigo: {seccion, horario, etc}}
  const [cursoExpandido, setCursoExpandido] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mensajeConflicto, setMensajeConflicto] = useState(null);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    horaInicio: "",
    horaFin: "",
    catedratico: "",
    modalidad: "todos",
    dias: []
  });

  useEffect(() => {
    cargarCursosClasificados();
  }, []);

  const cargarCursosClasificados = async () => {
    try {
      const userDataGuardado = localStorage.getItem("userData");
      if (!userDataGuardado) return;
      
      const userData = JSON.parse(userDataGuardado);
      if (!userData.carne) return;
      
      const response = await fetch(`http://127.0.0.1:8000/cursos_clasificados/${userData.carne}`);
      const data = await response.json();
      setCursosDisponibles(data);
    } catch (error) {
      console.error("Error cargando cursos:", error);
    }
  };

  // Verificar si hay conflicto de horario
  const tieneConflictoHorario = (nuevaSeccion) => {
    for (const codigo in seccionesSeleccionadas) {
      const seccionExistente = seccionesSeleccionadas[codigo];
      
      // Verificar si los días se solapan
      const diasComunes = nuevaSeccion.dias.filter(dia => 
        seccionExistente.dias.includes(dia)
      );
      
      if (diasComunes.length > 0) {
        // Verificar si las horas se solapan
        const inicio1 = seccionExistente.inicio_min;
        const fin1 = seccionExistente.final_min;
        const inicio2 = nuevaSeccion.inicio_min;
        const fin2 = nuevaSeccion.final_min;
        
        if ((inicio2 < fin1 && fin2 > inicio1)) {
          return {
            conflicto: true,
            curso: seccionExistente.nombre,
            seccion: seccionExistente.seccion
          };
        }
      }
    }
    return { conflicto: false };
  };

  // Seleccionar/deseleccionar sección
  const toggleSeccion = (curso, seccion) => {
    const codigo = curso.codigo;
    
    // Si ya está seleccionada, deseleccionar
    if (seccionesSeleccionadas[codigo]) {
      const nuevasSelecciones = { ...seccionesSeleccionadas };
      delete nuevasSelecciones[codigo];
      setSeccionesSeleccionadas(nuevasSelecciones);
      setMensajeConflicto(null);
      return;
    }
    
    // Verificar conflicto de horario
    const conflicto = tieneConflictoHorario(seccion);
    if (conflicto.conflicto) {
      setMensajeConflicto({
        tipo: 'conflicto',
        curso: curso.nombre,
        seccion: seccion.seccion,
        conflictoCon: conflicto.curso,
        seccionConflicto: conflicto.seccion
      });
      return;
    }
    
    // Agregar selección
    setSeccionesSeleccionadas({
      ...seccionesSeleccionadas,
      [codigo]: {
        ...seccion,
        codigo: codigo,
        nombre: curso.nombre,
        nivel: curso.nivel
      }
    });
    
    // Limpiar mensaje de conflicto
    setMensajeConflicto(null);
    
    // Cerrar expansión
    setCursoExpandido(null);
  };

  const aplicarFiltrosAvanzados = (secciones) => {
    return secciones.filter(seccion => {
      // Filtro de horario
      if (filtrosAvanzados.horaInicio && filtrosAvanzados.horaFin) {
        const horaInicio = parseInt(filtrosAvanzados.horaInicio.replace(':', ''));
        const horaFin = parseInt(filtrosAvanzados.horaFin.replace(':', ''));
        const seccionInicio = parseInt(seccion.horario_inicio.replace(':', ''));
        const seccionFin = parseInt(seccion.horario_fin.replace(':', ''));
        
        if (seccionInicio < horaInicio || seccionFin > horaFin) return false;
      }
      
      // Filtro de catedrático a evitar
      if (filtrosAvanzados.catedratico && 
          seccion.catedratico.toLowerCase().includes(filtrosAvanzados.catedratico.toLowerCase())) {
        return false;
      }
      
      // Filtro de modalidad
      if (filtrosAvanzados.modalidad !== "todos" && 
          seccion.modalidad.toLowerCase() !== filtrosAvanzados.modalidad.toLowerCase()) {
        return false;
      }
      
      // Filtro de días
      if (filtrosAvanzados.dias.length > 0) {
        const tieneDiaDeseado = filtrosAvanzados.dias.some(dia => seccion.dias.includes(dia));
        if (!tieneDiaDeseado) return false;
      }
      
      return true;
    });
  };

  const analizarCarga = async () => {
    if (Object.keys(seccionesSeleccionadas).length === 0) {
      setMensajeConflicto({
        tipo: 'error',
        mensaje: 'Debes seleccionar al menos un curso con su sección'
      });
      return;
    }

    setLoading(true);
    setMensajeConflicto(null);
    try {
      const codigos = Object.keys(seccionesSeleccionadas);
      const response = await fetch("http://127.0.0.1:8000/analizar_semaforo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursos: codigos })
      });
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Error analizando carga:", error);
      setMensajeConflicto({
        tipo: 'error',
        mensaje: 'Error al analizar la carga. Intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarSeleccion = () => {
    setSeccionesSeleccionadas({});
    setResultado(null);
    setCursoExpandido(null);
    setMensajeConflicto(null);
    setFiltrosAvanzados({
      horaInicio: "",
      horaFin: "",
      catedratico: "",
      modalidad: "todos",
      dias: []
    });
    setBusqueda("");
    setFiltroNivel("todos");
  };

  const getNivelColor = (nivel) => {
    if (nivel === 1) return "bg-green-100 text-green-800 border-green-300";
    if (nivel === 2) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    if (nivel === 3) return "bg-red-100 text-red-800 border-red-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getNivelTexto = (nivel) => {
    if (nivel === 1) return "Fácil";
    if (nivel === 2) return "Medio";
    if (nivel === 3) return "Difícil";
    return "N/A";
  };

  const getSemaforoColor = (semaforo) => {
    if (semaforo === "verde") return "bg-green-500";
    if (semaforo === "amarillo") return "bg-yellow-500";
    if (semaforo === "rojo") return "bg-red-500";
    return "bg-gray-500";
  };

  const cursosFiltrados = cursosDisponibles.filter(curso => {
    // Si el curso ya tiene una sección seleccionada, no mostrarlo
    if (seccionesSeleccionadas[curso.codigo]) return false;
    
    const coincideBusqueda = curso.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                             curso.codigo.includes(busqueda);
    const coincideNivel = filtroNivel === "todos" || curso.nivel === parseInt(filtroNivel);
    return coincideBusqueda && coincideNivel;
  });

  const getDataGraficos = () => {
    if (!resultado) return null;

    const pieData = [
      { name: 'Fácil', value: resultado.cursos_por_nivel[1] || 0, color: '#22c55e' },
      { name: 'Medio', value: resultado.cursos_por_nivel[2] || 0, color: '#eab308' },
      { name: 'Difícil', value: resultado.cursos_por_nivel[3] || 0, color: '#ef4444' }
    ].filter(item => item.value > 0);

    const barData = [
      { nivel: 'Fácil', cantidad: resultado.cursos_por_nivel[1] || 0, fill: '#22c55e' },
      { nivel: 'Medio', cantidad: resultado.cursos_por_nivel[2] || 0, fill: '#eab308' },
      { nivel: 'Difícil', cantidad: resultado.cursos_por_nivel[3] || 0, fill: '#ef4444' }
    ];

    return { pieData, barData };
  };

  const graficos = getDataGraficos();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* ----------------------- HEADER ----------------------- */}
          <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="px-6 py-4">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <TrafficCone className="text-blue-600" size={28} />
                Semáforo de Carga Académica
              </h1>
              <p className="text-gray-600 text-sm">Analiza la dificultad de tu carga académica y evita conflictos de horario</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Cursos Seleccionados */}
              {Object.keys(seccionesSeleccionadas).length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={20} />
                    Secciones Seleccionadas
                    <span className="text-sm font-normal text-gray-600">({Object.keys(seccionesSeleccionadas).length})</span>
                  </h2>
                  <div className="space-y-2">
                    {Object.values(seccionesSeleccionadas).map((sel) => (
                      <div key={sel.codigo} className="border-2 border-blue-500 rounded-lg p-3 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-mono text-xs font-semibold">{sel.codigo}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getNivelColor(sel.nivel)}`}>
                                {getNivelTexto(sel.nivel)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                Sec. {sel.seccion}
                              </span>
                            </div>
                            <p className="font-semibold text-sm text-gray-800 mb-1.5">{sel.nombre}</p>
                            <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600">
                              <div>🕒 {sel.horario_inicio} - {sel.horario_fin}</div>
                              <div>📅 {sel.dias.join(', ')}</div>
                              <div>👨‍🏫 {sel.catedratico}</div>
                              <div>📍 {sel.modalidad}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSeccion({ codigo: sel.codigo, nombre: sel.nombre, nivel: sel.nivel }, sel)}
                            className="ml-3 text-red-500 hover:text-red-700 font-semibold text-lg"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seleccionar Cursos */}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BookOpen className="text-blue-600" size={20} />
                  Seleccionar Cursos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Buscar curso
                    </label>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Código o nombre..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Filtrar por nivel
                    </label>
                    <select
                      value={filtroNivel}
                      onChange={(e) => setFiltroNivel(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todos">Todos los niveles</option>
                      <option value="1">Fácil</option>
                      <option value="2">Medio</option>
                      <option value="3">Difícil</option>
                    </select>
                  </div>
                </div>

                {/* Filtros Avanzados */}
                <button
                  onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                  className="mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                >
                  <svg className={`w-4 h-4 transition-transform ${mostrarFiltrosAvanzados ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {mostrarFiltrosAvanzados ? 'Ocultar' : 'Mostrar'} Filtros Avanzados de Secciones
                </button>

                {mostrarFiltrosAvanzados && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horario (desde)
                        </label>
                        <input
                          type="time"
                          value={filtrosAvanzados.horaInicio}
                          onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, horaInicio: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horario (hasta)
                        </label>
                        <input
                          type="time"
                          value={filtrosAvanzados.horaFin}
                          onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, horaFin: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catedrático a Evitar
                      </label>
                      <input
                        type="text"
                        value={filtrosAvanzados.catedratico}
                        onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, catedratico: e.target.value})}
                        placeholder="Nombre del catedrático..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modalidad
                      </label>
                      <select
                        value={filtrosAvanzados.modalidad}
                        onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, modalidad: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="todos">Todas</option>
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                        <option value="híbrida">Híbrida</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Lista de Cursos */}
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                  {cursosFiltrados.map((curso) => (
                    <div key={curso.codigo}>
                      <div
                        className="p-4 border-2 rounded-lg cursor-pointer hover:border-blue-300 transition-all"
                        onClick={() => setCursoExpandido(cursoExpandido === curso.codigo ? null : curso.codigo)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-semibold">{curso.codigo}</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getNivelColor(curso.nivel)}`}>
                                {getNivelTexto(curso.nivel)}
                              </span>
                              <span className="text-xs text-gray-500">{curso.total_secciones} secciones</span>
                            </div>
                            <p className="text-gray-800 mt-1">{curso.nombre}</p>
                          </div>
                          <svg 
                            className={`w-5 h-5 transition-transform ${cursoExpandido === curso.codigo ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Secciones Expandidas */}
                      {cursoExpandido === curso.codigo && (
                        <div className="mt-2 ml-4 space-y-2 border-l-2 border-blue-200 pl-4">
                          {aplicarFiltrosAvanzados(curso.secciones).map((seccion) => (
                            <div
                              key={seccion.seccion}
                              onClick={() => toggleSeccion(curso, seccion)}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold text-blue-600">Sección {seccion.seccion}</span>
                                    <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                                      {seccion.modalidad}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div>🕒 {seccion.horario_inicio} - {seccion.horario_fin}</div>
                                    <div>📅 {seccion.dias.join(', ')}</div>
                                    <div className="col-span-2">👨‍🏫 {seccion.catedratico}</div>
                                    <div>🏢 {seccion.edificio} - {seccion.salon}</div>
                                  </div>
                                </div>
                                <button className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 rounded border border-blue-600 hover:bg-blue-100">
                                  Seleccionar
                                </button>
                              </div>
                            </div>
                          ))}
                          {aplicarFiltrosAvanzados(curso.secciones).length === 0 && (
                            <p className="text-gray-500 text-sm italic p-3">
                              No hay secciones que cumplan con los filtros avanzados
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={analizarCarga}
                    disabled={Object.keys(seccionesSeleccionadas).length === 0 || loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <TrendingUp size={18} />
                        Analizar Carga ({Object.keys(seccionesSeleccionadas).length})
                      </>
                    )}
                  </button>
                  <button
                    onClick={limpiarSeleccion}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Gráficos */}
              {resultado && graficos && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="text-blue-600" size={20} />
                    Visualización de Carga
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-center font-semibold text-gray-700 mb-3 text-sm">
                        Distribución por Nivel
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={graficos.pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, value}) => `${name}: ${value}`}
                            outerRadius={70}
                            dataKey="value"
                            strokeWidth={2}
                            stroke="#fff"
                          >
                            {graficos.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="text-center font-semibold text-gray-700 mb-3 text-sm">
                        Cantidad por Nivel
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={graficos.barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="nivel" 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
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
                            dataKey="cantidad" 
                            name="Cursos" 
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panel de Resultado */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-4 sticky top-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={20} />
                  Resultado del Análisis
                </h2>

                {mensajeConflicto ? (
                  <div className="space-y-3">
                    <div className={`rounded-lg p-3 border-l-4 ${
                      mensajeConflicto.tipo === 'conflicto' ? 'bg-orange-50 border-orange-500' :
                      'bg-red-50 border-red-500'
                    }`}>
                      {mensajeConflicto.tipo === 'conflicto' ? (
                        <div>
                          <h3 className="font-bold text-orange-800 mb-1.5 text-sm">⚠️ Conflicto de Horario</h3>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            <strong>{mensajeConflicto.curso}</strong> (Sec. {mensajeConflicto.seccion}) 
                            tiene conflicto con <strong>{mensajeConflicto.conflictoCon}</strong> (Sec. {mensajeConflicto.seccionConflicto})
                          </p>
                          <p className="text-xs text-gray-600 mt-1.5">
                            Deselecciona uno de los cursos o elige otra sección.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-bold text-red-800 mb-1.5 text-sm">❌ Error</h3>
                          <p className="text-xs text-gray-700">
                            {mensajeConflicto.mensaje}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !resultado ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Selecciona secciones y haz clic en "Analizar Carga"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-3">
                        <div className={`w-20 h-20 rounded-full ${getSemaforoColor(resultado.semaforo)} shadow-lg animate-pulse`}></div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 capitalize">
                        {resultado.semaforo}
                      </h3>
                    </div>

                    <div className={`rounded-lg p-3 border-l-4 ${
                      resultado.semaforo === 'rojo' ? 'bg-red-50 border-red-500' :
                      resultado.semaforo === 'amarillo' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-green-50 border-green-500'
                    }`}>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {resultado.mensaje}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b text-sm">
                        <span className="text-gray-600">Nivel Promedio:</span>
                        <span className="font-bold text-gray-800">
                          {resultado.nivel_promedio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b text-sm">
                        <span className="text-gray-600">Cursos Fáciles:</span>
                        <span className="font-bold text-green-600">
                          {resultado.cursos_por_nivel[1] || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b text-sm">
                        <span className="text-gray-600">Cursos Medios:</span>
                        <span className="font-bold text-yellow-600">
                          {resultado.cursos_por_nivel[2] || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b text-sm">
                        <span className="text-gray-600">Cursos Difíciles:</span>
                        <span className="font-bold text-red-600">
                          {resultado.cursos_por_nivel[3] || 0}
                        </span>
                      </div>
                    </div>
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

export default SemaforoCarga;

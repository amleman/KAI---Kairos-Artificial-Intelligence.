import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrafficCone, CheckCircle, BookOpen, BarChart3, TrendingUp, Loader2, Trash2, Calendar, Clock, Eye,
  X, AlertTriangle } from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from 'react-router-dom';

const SemaforoCarga = () => {

  // 1. Obtener ID del usuario para crear una clave única en el navegador
  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch { return {}; }
  };
  const userData = getUserData();
  // Clave única: si entra Juan, guarda en "progreso_Juan", si entra Pedro, "progreso_Pedro"
  const STORAGE_KEY = `sioha_progreso_${userData.carne || "invitado"}`;

  // 2. Función auxiliar para leer del LocalStorage al iniciar
  // Si existe dato guardado, lo usa. Si no, usa el valor por defecto (defaultValue)
  const cargarEstado = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificamos si la llave específica existe en lo guardado
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
  const navigate = useNavigate();
  
  // Estado para la respuesta del horario generado
  const [horarioGenerado, setHorarioGenerado] = useState(() => cargarEstado('horarioGenerado', null));
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  
  // Filtros para enviar al backend
  const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => cargarEstado('filtrosAvanzados', {
    horaInicioLV: "",
    horaFinLV: "",
    horaInicioSabado: "",
    horaFinSabado: "",
    catedratico: "",
    modalidad: "todos",
    dias: []
  }));

  // Este efecto vigila las variables. Si cambian, actualiza el LocalStorage.
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

  // Seleccionar/deseleccionar Curso (Nivel General)
  const toggleCurso = (curso) => {
    const codigo = curso.codigo;
    
    // Si ya está seleccionada, deseleccionar
    if (cursosSeleccionados[codigo]) {
      const nuevasSelecciones = { ...cursosSeleccionados };
      delete nuevasSelecciones[codigo];
      setCursosSeleccionados(nuevasSelecciones);
      return;
    }
    
    // Agregar selección (Solo datos del curso, sin secciones específicas)
    setCursosSeleccionados({
      ...cursosSeleccionados,
      [codigo]: {
        codigo: codigo,
        nombre: curso.nombre,
        nivel: curso.nivel
      }
    });
    
    // Limpiar mensaje de error si existía
    setMensajeError(null);
    // Reiniciar resultados si cambia la selección
    setResultado(null);
    setHorarioGenerado(null);
  };


  // Funcion para enviar los datos al analizador de carga
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
      const response = await fetch("http://127.0.0.1:8000/analizar_semaforo", {
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

  // Función auxiliar para convertir "HH:MM" a minutos
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const generarHorario = async () => {
    setLoadingHorario(true);
    setMensajeError(null); // Limpiamos errores previos
    setHorarioGenerado(null);
    try {
      const codigos = Object.keys(cursosSeleccionados);

      console.log(codigos)
      
      // Preparar payload
      const payload = {
        cursos: codigos,
        filtros: {
          // Filtros Lunes a Viernes (Default 7:00 - 21:00)
          hora_inicio_lv: timeToMinutes(filtrosAvanzados.horaInicioLV) || 420,
          hora_fin_lv: timeToMinutes(filtrosAvanzados.horaFinLV) || 1260,
          
          // Filtros Sábado (Default 7:00 - 21:00)
          hora_inicio_sabado: timeToMinutes(filtrosAvanzados.horaInicioSabado) || 420,
          hora_fin_sabado: timeToMinutes(filtrosAvanzados.horaFinSabado) || 1260,
          catedratico: filtrosAvanzados.catedratico || "",
          modalidad: filtrosAvanzados.modalidad === "todos" ? "TODAS" : filtrosAvanzados.modalidad.toUpperCase()
        }
      };

      const response = await fetch("http://127.0.0.1:8000/generar_horario_custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      // VERIFICACIÓN DE ERRORES HTTP
      if (!response.ok) {
        if (response.status === 500) {
           throw new Error("No se encontraron combinaciones válidas. Es probable que tus filtros (Horarios o Catedrático) sean muy estrictos y eliminen todas las secciones disponibles. Intenta relajar las restricciones.");
        }
        if (response.status === 404) {
           throw new Error("No existen combinaciones posibles con los filtros dados.");
        }
        // Fallback genérico
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }
      
      const data = await response.json();


      
      // Validación adicional por si el backend devuelve 200 pero con lista vacía
      if (!data.horarios || data.horarios.length === 0) {
         throw new Error("No se pudo generar ningún horario con los filtros actuales. Intenta seleccionar rangos de hora más amplios.");
      } else {
        const storageKey = `sioha_progreso_${userData.carne}`;
        localStorage.setItem(storageKey, JSON.stringify({
                horarios: data.horarios,
                fecha: new Date().toISOString()
            }));
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
      // Enviamos el objeto completo a la nueva ruta mediante el 'state' de history
      navigate('/resultado-horario', { 
        state: { datosHorario: horarioGenerado } 
      });
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
      modalidad: "todos"
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
    // Si el curso ya está seleccionado, no mostrarlo en la lista de disponibles
    if (cursosSeleccionados[curso.codigo]) return false;
    
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
              <p className="text-gray-600 text-sm">Selecciona tus cursos, analiza la dificultad y genera tu horario automáticamente.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Cursos Seleccionados (Antes Secciones Seleccionadas) */}
              {Object.keys(cursosSeleccionados).length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={20} />
                    Cursos Seleccionados
                    <span className="text-sm font-normal text-gray-600">({Object.keys(cursosSeleccionados).length})</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(cursosSeleccionados).map((curso) => (
                      <div key={curso.codigo} className="border-2 border-blue-500 rounded-lg p-2 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-mono text-xs font-semibold text-blue-900">{curso.codigo}</span>
                              <span className={`px-1 py-0.5 rounded text-xs font-medium border ${getNivelColor(curso.nivel)}`}>
                                {getNivelTexto(curso.nivel)}
                              </span>
                            </div>
                            <p className="font-semibold text-xs text-gray-800 line-clamp-2">{curso.nombre}</p>
                          </div>
                          <button
                            onClick={() => toggleCurso(curso)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors shrink-0"
                            title="Eliminar curso"
                          >
                            <Trash2 size={14} />
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

                {/* Filtros Avanzados (Para generación de horario) */}
                <button
                  onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                  className="mb-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                >
                  <Calendar size={16} />
                  {mostrarFiltrosAvanzados ? 'Ocultar' : 'Configurar'} Filtros para Generación de Horario
                </button>

                {mostrarFiltrosAvanzados && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-4 border border-blue-100 animate-fade-in">
                    <p className="text-xs text-blue-800 font-semibold mb-2">
                      Estos filtros se usarán únicamente al generar el horario automático.
                    </p>
                    
                    {/* Sección 1: Filtros de Hora Divididos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Lunes a Viernes */}
                      <div className="space-y-3 p-3 bg-white/50 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Lunes a Viernes
                        </h3>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Inicio (desde)</label>
                          <input
                            type="time"
                            value={filtrosAvanzados.horaInicioLV}
                            onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, horaInicioLV: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Fin (hasta)</label>
                          <input
                            type="time"
                            value={filtrosAvanzados.horaFinLV}
                            onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, horaFinLV: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Sábado */}
                      <div className="space-y-3 p-3 bg-white/50 rounded-lg border border-blue-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          Sábado
                        </h3>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Inicio (desde)</label>
                          <input
                            type="time"
                            value={filtrosAvanzados.horaInicioSabado}
                            onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, horaInicioSabado: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Fin (hasta)</label>
                          <input
                            type="time"
                            value={filtrosAvanzados.horaFinSabado}
                            onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, horaFinSabado: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Otros Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-blue-200 pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Catedrático a Buscar</label>
                        <input
                          type="text"
                          value={filtrosAvanzados.catedratico}
                          onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, catedratico: e.target.value})}
                          placeholder="Apellido del catedrático..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
                        <select
                          value={filtrosAvanzados.modalidad}
                          onChange={(e) => setFiltrosAvanzados({...filtrosAvanzados, modalidad: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="todos">Cualquiera</option>
                          <option value="presencial">Presencial</option>
                          <option value="virtual">Virtual</option>
                          <option value="híbrida">Híbrida</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Cursos Disponibles */}
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {cursosFiltrados.map((curso) => (
                      <div key={curso.codigo} className="p-2 border rounded-lg bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-mono text-xs font-semibold text-gray-600">{curso.codigo}</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getNivelColor(curso.nivel)}`}>
                                {getNivelTexto(curso.nivel)}
                              </span>
                            </div>
                            <p className="text-gray-800 text-xs font-medium line-clamp-2">{curso.nombre}</p>
                          </div>
                          
                          <button 
                            onClick={() => toggleCurso(curso)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0"
                          >
                            Seleccionar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cursosFiltrados.length === 0 && (
                     <p className="text-center text-gray-500 py-4 text-sm">No se encontraron cursos con los filtros actuales.</p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={analizarCarga}
                    disabled={Object.keys(cursosSeleccionados).length === 0 || loading}
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
                        Analizar Carga ({Object.keys(cursosSeleccionados).length})
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
              <div className="sticky top-6 space-y-4">
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="text-blue-600" size={20} />
                    Resultado del Análisis
                  </h2>

                  {mensajeError ? (
                    <div className="rounded-lg p-3 border-l-4 bg-red-50 border-red-500">
                        <h3 className="font-bold text-red-800 mb-1.5 text-sm">❌ Error</h3>
                        <p className="text-xs text-gray-700">{mensajeError}</p>
                    </div>
                  ) : !resultado ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm">
                        Selecciona cursos y haz clic en "Analizar Carga"
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
                          <span className="text-gray-600">Total Cursos:</span>
                          <span className="font-bold text-blue-600">
                              {Object.keys(cursosSeleccionados).length}
                          </span>
                        </div>
                      </div>

                      {/* Botón Generar Horario - Solo visible si hay resultado */}
                      <div className="pt-4 mt-2 border-t border-gray-100">
                        <button
                          onClick={generarHorario}
                          disabled={loadingHorario}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loadingHorario ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Generando...
                              </>
                          ) : (
                              <>
                                <Clock size={16} />
                                Generar Horario
                              </>
                          )}
                        </button>
                        <p className="text-xs text-center text-gray-500 mt-2">
                          Usará los filtros configurados en la sección de selección.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nueva Sección: Horario Generado */}
                {horarioGenerado && (
                  <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-green-100 animate-fade-in">
                    <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Calendar className="text-green-600" size={20} />
                        Horario Generado
                    </h2>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
                        <p className="text-sm text-green-800 font-medium">
                          ¡Se ha encontrado una combinación de horarios válida!
                        </p>
                    </div>
                    <button 
                        onClick={irAVerHorario}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        <Eye size={20} />
                        Ver Horario Completo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* MODAL DE ERROR */}
      {errorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
            {/* Cabecera del Modal */}
            <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertTriangle className="text-red-600 w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No se pudo generar el horario
              </h3>
            </div>
            
            {/* Cuerpo del Mensaje */}
            <div className="p-6">
              <p className="text-gray-600 text-center text-sm leading-relaxed">
                {errorModalMensaje}
              </p>
            </div>

            {/* Pie / Botón */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button
                onClick={() => setErrorModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Entendido, ajustaré los filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SemaforoCarga;
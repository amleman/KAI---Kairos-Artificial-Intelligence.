import { useState, useEffect, useCallback, useRef } from "react";
import Papa from "papaparse";
import { BookOpen, CheckCircle2, Calendar, FileText, Save, Eye, Award, AlertTriangle, BookCheck, TrendingUp, GraduationCap, List, User, CreditCard, Cake, Briefcase, LogOut } from "lucide-react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  /* ----------------------- Estados globales ----------------------- */
  // Inicializar desde localStorage directamente
  const getUserDataFromStorage = () => {
    const userDataGuardado = localStorage.getItem("userData");
    if (userDataGuardado) {
      try {
        return JSON.parse(userDataGuardado);
      } catch (e) {
        console.error("Error parseando userData:", e);
      }
    }
    return {
      nombre: "",
      carne: "",
      fechaNacimiento: "",
      carrera: "",
    };
  };

  const getInitialShowForm = () => {
    const usuarioGuardado = localStorage.getItem("usuario");
    const userDataGuardado = localStorage.getItem("userData");
    return !(usuarioGuardado && userDataGuardado);
  };

  const [showForm, setShowForm] = useState(getInitialShowForm);
  const [usuarioData, setUsuarioData] = useState(getUserDataFromStorage);

  const [tab, setTab] = useState(() => {
    // Si hay userData, default a aprobados, sino a pensum
    const userData = getUserDataFromStorage();
    return userData.carne ? "aprobados" : "pensum";
  });

  const [pensum, setPensum] = useState([]);
  const [aprobados, setAprobados] = useState([]);
  const [aprobadosDB, setAprobadosDB] = useState([]); // Cursos aprobados desde la DB
  
  const isInitialMount = useRef(true);

  /* ----------------------- Cargar aprobados desde DB con info completa ----------------------- */
  const cargarAprobadosDB = useCallback(async () => {
    if (!usuarioData.carne) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/aprobados/${usuarioData.carne}`);
      if (response.ok) {
        const data = await response.json();
        setAprobadosDB(data);
      }
    } catch (error) {
      console.error("Error cargando aprobados DB:", error);
    }
  }, [usuarioData.carne]);

  /* ----------------------- Cerrar sesión ----------------------- */
  const handleCerrarSesion = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("userData");
    window.location.href = "/";
  };

  /* ----------------------- Cambiar estado del form ----------------------- */
  const handleFormChange = (e) => {
    setUsuarioData({
      ...usuarioData,
      [e.target.name]: e.target.value,
    });
  };

  /* ----------------------- Guardar usuario ----------------------- */
  const handleGuardarUsuario = async () => {
    const usuarioGuardado = localStorage.getItem("usuario");
    
    const dataToSave = {
      ...usuarioData,
      usuario: usuarioGuardado
    };
    
    const response = await fetch("http://127.0.0.1:8000/guardar_usuario_info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    });

    if (response.ok) {
      alert("Información guardada correctamente");
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem("userData", JSON.stringify(usuarioData));
      setShowForm(false);
    } else {
      alert("Error al guardar la información");
    }
  };

  /* ----------------------- Normalización de CSV ----------------------- */
  const normalizarCurso = (curso) => {
    return {
      codigo: curso.codigo || curso.CODIGO || curso.Código || "",
      nombre_completo:
        curso.nombre_completo ||
        curso.Nombre ||
        curso.NOMBRE ||
        curso.nombre ||
        "",
      creditos: curso.creditos || curso.Créditos || curso.credito || "",
      semestre: curso.semestre || curso.Semestre || curso.SEMESTRE || "",
      pre_requisitos:
        curso.pre_requisitos ||
        curso.Prerrequisitos ||
        curso.Pre_Requisitos ||
        "",
    };
  };

  /* ----------------------- Cargar CSV del pensum ----------------------- */
  const cargarPensum = () => {
    fetch("http://127.0.0.1:8000/pensum")
      .then((res) => res.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("CSV CRUDO:", results.data);

            const normalizado = results.data.map((c) => normalizarCurso(c));

            console.log("CSV NORMALIZADO:", normalizado);

            setPensum(normalizado);
          },
        });
      });
  };

  /* ----------------------- Cargar cursos aprobados desde DB ----------------------- */
  useEffect(() => {
    const cargarAprobados = async () => {
      if (!usuarioData.carne) return;
      
      try {
        const response = await fetch(`http://127.0.0.1:8000/aprobados/${usuarioData.carne}`);
        if (response.ok) {
          const data = await response.json();
          const codigos = data.map(c => c.codigo);
          setAprobados(codigos);
          console.log("Aprobados cargados:", codigos);
        }
      } catch (error) {
        console.error("Error cargando aprobados:", error);
      }
    };

    cargarAprobados();
  }, [usuarioData.carne]);

  /* ----------------------- Cargar aprobadosDB al montar el componente ----------------------- */
  useEffect(() => {
    if (usuarioData.carne && !showForm && isInitialMount.current) {
      isInitialMount.current = false;
      // Usar setTimeout para evitar cascading renders
      setTimeout(() => {
        cargarAprobadosDB();
      }, 0);
    }
  }, [usuarioData.carne, showForm, cargarAprobadosDB]);

  /* ----------------------- Verificar prerrequisitos ----------------------- */
  const puedeLlevar = (curso) => {
    if (!curso.pre_requisitos) return true;

    const prereqs = curso.pre_requisitos
      .replaceAll('"', "")
      .split(",")
      .map((r) => r.trim());

    return prereqs.every((p) => aprobados.includes(p));
  };

  /* ----------------------- Marcar curso aprobado ----------------------- */
  const toggleAprobado = (codigo) => {
    if (aprobados.includes(codigo)) {
      setAprobados(aprobados.filter((c) => c !== codigo));
    } else {
      setAprobados([...aprobados, codigo]);
    }
  };

  /* ----------------------- Guardar aprobados ----------------------- */
  const guardarAprobados = async () => {
    const response = await fetch("http://127.0.0.1:8000/guardar_aprobados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carne: usuarioData.carne,
        aprobados,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Aprobados guardados");
    } else {
      alert("Error: " + data.error);
    }
  };

  /* ----------------------- Agrupar cursos por semestre ----------------------- */
  const semestresOrden = [
    "Primero",
    "Segundo",
    "Tercero",
    "Cuarto",
    "Quinto",
    "Sexto",
    "Séptimo",
    "Octavo",
    "Noveno",
    "Décimo",
  ];

  const pensumPorSemestre = semestresOrden.map((sem, index) => ({
    nombre: sem,
    numero: index + 1,
    cursos: pensum.filter((c) => c.semestre === sem),
  }));

  return (
    <>
      {!showForm && <Navbar />}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">

        {/* ----------------------- FORMULARIO INICIAL ----------------------- */}
        {showForm ? (
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-xl mx-auto border-t-4 border-blue-600 relative">
            {/* Botón cerrar sesión - posición absoluta */}
            <button
              onClick={handleCerrarSesion}
              className="absolute top-4 right-4 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-medium text-xs hover:bg-red-200 transition-colors flex items-center gap-1.5 border border-red-300"
            >
              <LogOut size={14} />
              Cerrar Sesión
            </button>

            {/* Header compacto */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                <User className="text-white" size={28} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Registro Inicial</h1>
              <p className="text-gray-600 text-sm">Completa tu información para comenzar</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User size={14} className="text-blue-600" />
                  Nombre Completo
                </label>
                <input
                  name="nombre"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ingresa tu nombre completo"
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-blue-600" />
                  Carné Universitario
                </label>
                <input
                  name="carne"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ej: 2024001"
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Cake size={14} className="text-blue-600" />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onChange={handleFormChange}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-blue-600" />
                  Carrera
                </label>
                <select
                  name="carrera"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                  onChange={handleFormChange}
                >
                  <option value="">Seleccione su carrera</option>
                  <option>Ing. Sistemas</option>
                  <option>Ing. Civil</option>
                  <option>Ing. Industrial</option>
                  <option>Ing. Mecánica</option>
                </select>
              </div>
            </div>

            <button
              className="w-full mt-5 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-semibold text-sm hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={handleGuardarUsuario}
            >
              Guardar y Continuar
            </button>
          </div>
        ) : (
          <>
            {/* ----------------------- HEADER CON SUB-NAVBAR ----------------------- */}
            <div className="bg-white rounded-lg shadow-lg mb-6">
              <div className="px-6 py-4 flex justify-between items-center">
                {/* Bienvenida */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    ¡Bienvenido, {usuarioData.nombre}!
                  </h1>
                  <p className="text-gray-600 text-sm">Carné: {usuarioData.carne} | {usuarioData.carrera}</p>
                </div>
                
                {/* Sub-navbar */}
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                      tab === "aprobados" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      cargarAprobadosDB();
                      setTab("aprobados");
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Ver Aprobados
                  </button>

                  <button
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                      tab === "pensum" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => {
                      cargarPensum();
                      setTab("pensum");
                    }}
                  >
                    <BookOpen size={16} />
                    Ver Pensum
                  </button>

                  <button 
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                      tab === "horario" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setTab("horario")}
                  >
                    <Calendar size={16} />
                    Ver Horario
                  </button>
                </div>
              </div>
            </div>

            {/* ----------------------- TAB: VER PENSUM ----------------------- */}
            {tab === "pensum" && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <GraduationCap className="text-blue-600" size={28} />
                  Pensum - Ingeniería en Sistemas
                </h2>

                <div className="space-y-6">

                {pensumPorSemestre.map((sem) => (
                  <div key={sem.nombre} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {sem.numero}
                      </span>
                      {sem.nombre} Semestre
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {sem.cursos.length === 0 && (
                        <p className="text-gray-500 col-span-4 text-center py-4">No hay cursos cargados.</p>
                      )}

                      {sem.cursos.map((curso) => {
                        const aprobado = aprobados.includes(curso.codigo);
                        const permitido = puedeLlevar(curso);

                        return (
                          <div
                            key={curso.codigo}
                            onClick={() => (permitido ? toggleAprobado(curso.codigo) : null)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              aprobado
                                ? "bg-green-50 border-green-500 shadow-md"
                                : permitido
                                ? "bg-white border-gray-300 hover:border-blue-400 hover:shadow-md cursor-pointer"
                                : "bg-red-50 border-red-300 opacity-60 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                aprobado ? "bg-green-200 text-green-800" :
                                permitido ? "bg-blue-100 text-blue-800" :
                                "bg-red-200 text-red-800"
                              }`}>
                                {curso.codigo}
                              </span>
                              {aprobado && <CheckCircle2 className="text-green-600" size={16} />}
                            </div>
                            <h4 className="font-bold text-xs text-gray-800 mb-1.5 line-clamp-2">{curso.nombre_completo}</h4>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Award size={12} />
                                {curso.creditos} créditos
                              </span>
                            </div>
                            {!permitido && (
                              <p className="text-xs text-red-700 mt-2 font-medium flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Falta prerrequisito
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={guardarAprobados}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    Guardar Aprobados
                  </button>
                  <button
                    onClick={() => {
                      cargarAprobadosDB();
                      setTab("aprobados");
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye size={18} />
                    Ver Aprobados
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------- TAB: VER APROBADOS ----------------------- */}
            {tab === "aprobados" && (
              <div>
                {aprobadosDB.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">No tienes cursos aprobados registrados</p>
                    <p className="text-gray-500 text-sm mb-6">Marca tus cursos aprobados en el pensum para ver tu progreso</p>
                    <button
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                      onClick={() => {
                        cargarPensum();
                        setTab("pensum");
                      }}
                    >
                      <BookOpen size={18} />
                      Ir a Ver Pensum
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Estadísticas */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <CheckCircle2 className="text-green-600" size={28} />
                            Cursos Aprobados
                          </h2>
                          <p className="text-gray-600 text-sm">Resumen de tu progreso académico</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center px-8 py-3 bg-blue-50 rounded-lg border-l-4 border-blue-500 min-w-[140px]">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <BookOpen className="text-blue-600" size={16} />
                              <p className="text-blue-600 text-xs font-medium">Total Cursos</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{aprobadosDB.length}</p>
                          </div>
                          <div className="text-center px-8 py-3 bg-green-50 rounded-lg border-l-4 border-green-500 min-w-[140px]">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <BookCheck className="text-green-600" size={16} />
                              <p className="text-green-600 text-xs font-medium">Créditos</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                              {aprobadosDB.reduce((sum, c) => sum + (parseInt(c.creditos) || 0), 0)}
                            </p>
                          </div>
                          <div className="text-center px-8 py-3 bg-purple-50 rounded-lg border-l-4 border-purple-500 min-w-[140px]">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <TrendingUp className="text-purple-600" size={16} />
                              <p className="text-purple-600 text-xs font-medium">Progreso</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                              {pensum.length > 0 ? Math.round((aprobadosDB.length / pensum.length) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      </div>

                      {/* Lista de cursos aprobados */}
                      <div className="border-t pt-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <List className="text-gray-600" size={20} />
                            Listado de Cursos
                          </h3>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {aprobadosDB.map((curso) => (
                              <div
                                key={curso.codigo}
                                className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <span className="px-2.5 py-1 bg-green-600 text-white rounded-md text-xs font-semibold">
                                        {curso.codigo}
                                      </span>
                                      <h4 className="font-bold text-gray-800 text-sm">{curso.nombre}</h4>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold">
                                      {curso.creditos} créditos
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;

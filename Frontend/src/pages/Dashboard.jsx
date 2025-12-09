import { useState, useEffect, useCallback, useRef } from "react";
import Papa from "papaparse";
import { BookOpen, CheckCircle2, Calendar, FileText, Save, Eye, Award, AlertTriangle, BookCheck, TrendingUp, GraduationCap, List, User, CreditCard, Cake, Briefcase, LogOut , Menu, X} from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loadingOptimizado, setLoadingOptimizado] = useState(false);
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Para verificar si existe horario custom
  const [existeCustom, setExisteCustom] = useState(false);
  // verifica que exista horario IA
  const [existeOptimizado, setExisteOptimizado] = useState(false);

  const [tab, setTab] = useState("aprobados");

  const [pensum, setPensum] = useState([]);
  const [aprobados, setAprobados] = useState([]);
  const [aprobadosDB, setAprobadosDB] = useState([]); // Cursos aprobados desde la DB
  
  // Estados para modal de notas
  const [showModalNotas, setShowModalNotas] = useState(false);
  const [cursosNuevos, setCursosNuevos] = useState([]);
  const [notasTemp, setNotasTemp] = useState({});
  const [errorNotas, setErrorNotas] = useState(""); // Para mostrar errores en el modal
  const [mensajeExito, setMensajeExito] = useState(""); // Para mostrar mensaje de éxito
  
  const isInitialMount = useRef(true);

  // --- EFECTO PARA VERIFICAR SI EXISTE HORARIO GUARDADO ---
  useEffect(() => {
    if (tab === "horario" && usuarioData.carne) {
      const keyCustom = `sioha_progreso_${usuarioData.carne}`;
      const savedCustom = localStorage.getItem(keyCustom);
      
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          // Verificamos si tiene datos reales
          if (parsed.horarioGenerado) {
            setExisteCustom(true);
          } else {
            setExisteCustom(false);
          }
        } catch (e) {
          console.error("Error leyendo storage:", e);
          setExisteCustom(false);
        }
      } else {
        setExisteCustom(false);
      }
    }
  }, [tab, usuarioData.carne]); // Se ejecuta al cambiar de pestaña

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
      setMensajeExito("Información guardada correctamente");
      setTimeout(() => setMensajeExito(""), 3000);
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem("userData", JSON.stringify(usuarioData));
      setShowForm(false);
    } else {
      setMensajeExito("Error al guardar la información");
      setTimeout(() => setMensajeExito(""), 3000);
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
            const normalizado = results.data.map((c) => normalizarCurso(c));
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
    if (usuarioData.carne && !showForm) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
      // Cargar cuando se cambia a la pestaña de aprobados
      if (tab === "aprobados") {
        cargarAprobadosDB();
      }
    }
  }, [usuarioData.carne, showForm, tab, cargarAprobadosDB]);

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
    // 1. Obtener cursos que ya tienen nota en DB
    const response = await fetch(`http://127.0.0.1:8000/aprobados/${usuarioData.carne}`);
    const cursosConNota = response.ok ? await response.json() : [];
    
    const codigosConNota = cursosConNota.map(c => c.codigo);
    
    // 2. Identificar cursos nuevos (sin nota en DB)
    const nuevos = aprobados.filter(codigo => !codigosConNota.includes(codigo));
    
    // 3. Si hay cursos nuevos, mostrar modal para ingresar notas
    if (nuevos.length > 0) {
      // Buscar info de cursos nuevos en el pensum
      const cursosNuevosInfo = nuevos.map(codigo => {
        const curso = pensum.find(c => c.codigo === codigo);
        return {
          codigo,
          nombre: curso ? curso.nombre_completo : "Curso",
          creditos: curso ? curso.creditos : 3
        };
      });
      
      setCursosNuevos(cursosNuevosInfo);
      setNotasTemp({});
      setShowModalNotas(true);
    } else {
      // No hay cursos nuevos, guardar directo
      await guardarEnDB([]);
    }
  };

  /* ----------------------- Guardar en DB (con o sin notas) ----------------------- */
  const guardarEnDB = async (cursosConNotas) => {
    const response = await fetch("http://127.0.0.1:8000/guardar_aprobados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carne: usuarioData.carne,
        cursos: cursosConNotas,
      }),
    });

    if (response.ok) {
      setShowModalNotas(false);
      setMensajeExito("Cursos guardados correctamente");
      setTimeout(() => setMensajeExito(""), 3000);
      cargarAprobadosDB();
    } else {
      const data = await response.json();
      setErrorNotas(data.error || "Error al guardar los cursos");
      setTimeout(() => setErrorNotas(""), 3000);
    }
  };

  /* ----------------------- Confirmar notas en modal ----------------------- */
  const confirmarNotas = () => {
    // Validar que todas las notas estén ingresadas
    const todasLasNotas = cursosNuevos.every(curso => 
      notasTemp[curso.codigo] && 
      notasTemp[curso.codigo] >= 0 && 
      notasTemp[curso.codigo] <= 100
    );
    
    if (!todasLasNotas) {
      setErrorNotas("Por favor completa todas las notas (0-100)");
      setTimeout(() => setErrorNotas(""), 3000);
      return;
    }
    
    // Crear array con cursos, notas Y nombres
    const cursosConNotas = cursosNuevos.map(curso => ({
      codigo: curso.codigo,
      nombre: curso.nombre,
      creditos: curso.creditos,
      nota: parseFloat(notasTemp[curso.codigo])
    }));
    
    guardarEnDB(cursosConNotas);
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


  /* ----------------------- FUNCIÓN PARA GENERAR HORARIO OPTIMIZADO (IA) ----------------------- */
  const handleGenerarOptimizado = async () => {
    setLoadingOptimizado(true);
    try {
      // 1. Llamar al backend
      const response = await fetch('http://127.0.0.1:8000/generar_horario', { // Endpoint del motor genético puro
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuarioData.carne }), 
      });

      const data = await response.json();

      if (response.ok) {
        // 2. GUARDAR EN LOCALSTORAGE DIFERENTE
        const storageKey = `sioha_optimizado_${usuarioData.carne}`;
        localStorage.setItem(storageKey, JSON.stringify({
           horarios: data.horarios,
           fecha: new Date().toISOString()
        }));

        // 3. Navegar indicando el TIPO
        navigate('/resultado-horario', { 
            state: { 
                tipo: 'optimizado', // <--- ESTO ES CLAVE
                datosHorario: { horarios: data.horarios }
            } 
        });
      } else {
        setMensajeExito("Error: " + (data.error || "No se pudo generar"));
        setTimeout(() => setMensajeExito(""), 3000);
      }
    } catch (error) {
      console.error(error);
      setMensajeExito("Error de conexión");
      setTimeout(() => setMensajeExito(""), 3000);
    } finally {
      setLoadingOptimizado(false);
    }
  };


  // --- Efecto para verificar si existe horario IA guardado ---
  useEffect(() => {
    if (tab === "horario" && usuarioData.carne) {
      // Nota la diferencia en la clave: _optimizado_
      const keyOptimizado = `sioha_optimizado_${usuarioData.carne}`; 
      const savedOpt = localStorage.getItem(keyOptimizado);
      
      if (savedOpt) {
        setExisteOptimizado(true); // Si existe el archivo, mostramos el botón
      } else {
        setExisteOptimizado(false);
      }
    }
  }, [tab, usuarioData.carne]);


  return (
    <>
      {!showForm && <Navbar />}
      
      {/* Toast de éxito */}
      {mensajeExito && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in text-sm sm:text-base">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-green-500 font-bold text-sm">✓</span>
          </div>
          <span className="font-medium">{mensajeExito}</span>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

        {/* ----------------------- FORMULARIO INICIAL (Responsive) ----------------------- */}
        {showForm ? (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-t-4 border-blue-600 relative">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="absolute top-4 right-4 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 flex items-center gap-2"
              >
                <LogOut size={16} />
                Cerrar sesión
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                  <User className="text-white" size={36} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Registro Inicial</h1>
                <p className="text-gray-600 mt-2">Completa tu información para comenzar</p>
              </div>

              <div className="space-y-5">
                {["nombre", "carné", "fechaNacimiento", "carrera"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {field === "nombre" && <User size={18} className="text-blue-600" />}
                      {field === "carné" && <CreditCard size={18} className="text-blue-600" />}
                      {field === "fechaNacimiento" && <Cake size={18} className="text-blue-600" />}
                      {field === "carrera" && <Briefcase size={18} className="text-blue-600" />}
                      {field === "nombre" && "Nombre Completo"}
                      {field === "carné" && "Carné Universitario"}
                      {field === "fechaNacimiento" && "Fecha de Nacimiento"}
                      {field === "carrera" && "Carrera"}
                    </label>
                    {field === "carrera" ? (
                      <select
                        name="carrera"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setUsuarioData({...usuarioData, carrera: e.target.value})}
                      >
                        <option value="">Seleccione su carrera</option>
                        <option>Ing. Sistemas</option>
                        <option>Ing. Civil</option>
                        <option>Ing. Industrial</option>
                        <option>Ing. Mecánica</option>
                      </select>
                    ) : field === "fechaNacimiento" ? (
                      <input
                        type="date"
                        name="fechaNacimiento"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => setUsuarioData({...usuarioData, fechaNacimiento: e.target.value})}
                      />
                    ) : (
                      <input
                        name={field === "carné" ? "carne" : "nombre"}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder={field === "carné" ? "Ej: 2024001" : "Tu nombre completo"}
                        onChange={(e) => setUsuarioData({...usuarioData, [field === "carné" ? "carne" : "nombre"]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg"
                onClick={handleGuardarUsuario}
              >
                Guardar y Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header con menú móvil */}
            <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      ¡Hola, {usuarioData.nombre.split(" ")[0]}!
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base mt-1">
                      {usuarioData.carne} • {usuarioData.carrera}
                    </p>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                  >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                  </button>
                </div>

                {/* Menú de pestañas - Móvil: vertical, Desktop: horizontal */}
                <div className={`flex flex-col lg:flex-row gap-3 ${mobileMenuOpen ? 'block' : 'hidden lg:flex'}`}>
                  {[
                    { id: "aprobados", icon: CheckCircle2, label: "Aprobados" },
                    { id: "pensum", icon: BookOpen, label: "Pensum" },
                    { id: "horario", icon: Calendar, label: "Horarios" },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setTab(id);
                        setMobileMenuOpen(false);
                        if (id === "aprobados") cargarAprobadosDB();
                        if (id === "pensum") cargarPensum();
                      }}
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all ${
                        tab === id
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Icon size={20} />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ====================== CONTENIDO DE CADA PESTAÑA ====================== */}

            {/* PENSUM */}
            {tab === "pensum" && (
              <div className="space-y-8">
                {pensumPorSemestre.map((sem) => (
                  <div key={sem.nombre} className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                        {sem.numero}
                      </span>
                      {sem.nombre} Semestre
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sem.cursos.map((curso) => {
                        const aprobado = aprobados.includes(curso.codigo);
                        const permitido = puedeLlevar(curso);

                        return (
                          <div
                            key={curso.codigo}
                            onClick={() => permitido && toggleAprobado(curso.codigo)}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                              aprobado
                                ? "bg-green-50 border-green-500 shadow-lg"
                                : permitido
                                ? "bg-white border-gray-300 hover:border-blue-500 hover:shadow-md"
                                : "bg-red-50 border-red-300 opacity-70 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className={`px-3 py-1 rounded text-xs font-bold ${
                                aprobado ? "bg-green-600 text-white" : "bg-blue-100 text-blue-800"
                              }`}>
                                {curso.codigo}
                              </span>
                              {aprobado && <CheckCircle2 className="text-green-600" size={20} />}
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 line-clamp-2 mb-2">
                              {curso.nombre_completo}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Award size={14} />
                              <span>{curso.creditos} créditos</span>
                            </div>
                            {!permitido && (
                              <p className="text-xs text-red-700 mt-3 font-medium flex items-center gap-1">
                                <AlertTriangle size={14} />
                                Falta prerrequisito
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={guardarAprobados}
                    className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-3 text-lg"
                  >
                    <Save size={22} />
                    Guardar Aprobados
                  </button>
                </div>
              </div>
            )}

            {/* APROBADOS */}
            {tab === "aprobados" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-2xl p-6 text-center border-l-4 border-blue-600">
                    <BookOpen className="text-blue-600 mx-auto mb-2" size={32} />
                    <p className="text-blue-600 font-medium">Cursos</p>
                    <p className="text-4xl font-bold text-gray-800">{aprobadosDB.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-6 text-center border-l-4 border-green-600">
                    <BookCheck className="text-green-600 mx-auto mb-2" size={32} />
                    <p className="text-green-600 font-medium">Créditos</p>
                    <p className="text-4xl font-bold text-gray-800">
                      {aprobadosDB.reduce((a, c) => a + (parseInt(c.creditos) || 0), 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6 text-center border-l-4 border-purple-600">
                    <TrendingUp className="text-purple-600 mx-auto mb-2" size={32} />
                    <p className="text-purple-600 font-medium">Progreso</p>
                    <p className="text-4xl font-bold text-gray-800">
                      {Math.round((aprobadosDB.reduce((a, c) => a + (parseInt(c.creditos) || 0), 0) / 300) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-2xl font-bold mb-6">Tus cursos aprobados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {aprobadosDB.map((c) => (
                      <div key={c.codigo} className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-l-4 border-green-600">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                            {c.codigo}
                          </span>
                          <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                            {c.creditos} cr
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{c.nombre}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* HORARIOS */}
            {tab === "horario" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Horario Inteligente */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                    <h3 className="text-2xl font-bold">Horario Inteligente (IA)</h3>
                    <p className="mt-2 opacity-90">Optimizado automáticamente según tu avance</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-gray-700">
                      La IA generará el mejor horario posible sin choques y con la ruta más rápida a graduarte.
                    </p>
                    <button
                      onClick={handleGenerarOptimizado}
                      disabled={loadingOptimizado}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-3"
                    >
                      {loadingOptimizado ? "Generando..." : "Generar con IA"}
                    </button>
                    {existeOptimizado && (
                      <button
                        onClick={() => navigate('/resultado-horario', { state: { tipo: 'optimizado' } })}
                        className="w-full border-2 border-blue-600 text-blue-600 py-4 rounded-xl font-bold hover:bg-blue-50 flex items-center justify-center gap-3"
                      >
                        <Eye size={20} />
                        Ver último generado
                      </button>
                    )}
                  </div>
                </div>

                {/* Horario Manual */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-8 text-white">
                    <h3 className="text-2xl font-bold">Horario Personalizado</h3>
                    <p className="mt-2 opacity-90">Tú eliges los cursos</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-gray-700">
                      Usa el semáforo para crear tu horario manual con alertas de carga y choques.
                    </p>
                    <button
                      onClick={() => navigate('/semaforo')}
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-3"
                    >
                      <Calendar size={20} />
                      Ir al Semáforo
                    </button>
                    {existeCustom && (
                      <button
                        onClick={() => navigate('/resultado-horario', { state: { tipo: 'custom' } })}
                        className="w-full border-2 border-green-600 text-green-600 py-4 rounded-xl font-bold hover:bg-green-50 flex items-center justify-center gap-3"
                      >
                        <Eye size={20} />
                        Ver último manual
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal de notas - totalmente responsive */}
        {showModalNotas && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <h3 className="text-xl font-bold">Ingresa las notas</h3>
                <p className="text-sm opacity-90 mt-1">Solo de los cursos nuevos</p>
              </div>
              <div className="p-6 space-y-4">
                {cursosNuevos.map((curso) => (
                  <div key={curso.codigo} className="bg-gray-50 p-4 rounded-xl border">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">
                        {curso.codigo}
                      </span>
                      <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">
                        {curso.creditos} créditos
                      </span>
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {curso.nombre}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Nota (0-100)"
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                      value={notasTemp[curso.codigo] || ""}
                      onChange={(e) => setNotasTemp({ ...notasTemp, [curso.codigo]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowModalNotas(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-xl font-medium hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarNotas}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold hover:from-blue-700"
                >
                  Guardar Notas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
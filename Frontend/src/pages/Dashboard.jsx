import { useState, useEffect, useCallback, useRef } from "react";
import Papa from "papaparse";
import { BookOpen, CheckCircle2, Calendar, FileText, Save, Eye, Award, AlertTriangle, BookCheck, TrendingUp, GraduationCap, List, User, CreditCard, Cake, Briefcase, LogOut , Menu, X, UploadCloud, Images} from "lucide-react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import formatoCursos from "../assets/formato_cursos.svg";
import HorarioVisualizer from "../components/HorarioVisualizer";
import Footer from "../components/Footer";

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
  const [horarioGuardadoDB, setHorarioGuardadoDB] = useState(null);

  // Para verificar si existe horario custom
  const [existeCustom, setExisteCustom] = useState(false);
  // verifica que exista horario IA
  const [existeOptimizado, setExisteOptimizado] = useState(false);

  const [tab, setTab] = useState("aprobados");

  const [pensum, setPensum] = useState([]);
  const [aprobados, setAprobados] = useState([]);
  const [aprobadosDB, setAprobadosDB] = useState([]); // Cursos aprobados desde la DB
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]);
  const [errorUpload, setErrorUpload] = useState("");
  const [procesandoImagenes, setProcesandoImagenes] = useState(false);
  
  // Estados para modal de notas
  const [showModalNotas, setShowModalNotas] = useState(false);
  const [cursosNuevos, setCursosNuevos] = useState([]);
  const [notasTemp, setNotasTemp] = useState({});
  const [errorNotas, setErrorNotas] = useState(""); // Para mostrar errores en el modal
  const [mensajeExito, setMensajeExito] = useState(""); // Para mostrar mensaje de éxito
  
  const isInitialMount = useRef(true);
  const inputImagenesRef = useRef(null);

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


  // ------------------------ Efecto para cargar horario guardado en la DB ------------------------
  useEffect(() => {
    const cargarHorarioDB = async () => {
      // CORRECCIÓN: Usamos 'usuario' (username) en lugar de 'carne'
      // Porque la DB relaciona por username, no por carnet.
      const usuarioActivo = usuarioData.nombre; 
      
      if (!usuarioActivo) return;

      try {
        const res = await fetch(`http://127.0.0.1:8000/obtener_horario_guardado/${usuarioActivo}`);
        const data = await res.json();

        if (res.ok && data.existe) {
          setHorarioGuardadoDB(data.horario);
        }
      } catch (error) {
        console.error("Error cargando horario DB:", error);
      }
    };

    cargarHorarioDB();
  }, [usuarioData.nombre]);

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

  /* ----------------------- Carga de imágenes aprobadas (OCR) ----------------------- */
  const handleSeleccionImagenes = (event) => {
    const files = Array.from(event.target.files || []);
    setImagenesSeleccionadas(files);
  };

  const procesarImagenesAprobados = async () => {
    setErrorUpload("");

    if (!usuarioData.carne) {
      setErrorUpload("Debes tener un carné registrado antes de procesar imágenes.");
      return;
    }

    if (!imagenesSeleccionadas.length) {
      setErrorUpload("Primero selecciona al menos una imagen.");
      return;
    }

    setProcesandoImagenes(true);
    const formData = new FormData();
    formData.append("carne", usuarioData.carne);
    imagenesSeleccionadas.forEach((img) => formData.append("imagenes", img));

    try {
      const response = await fetch("http://127.0.0.1:8000/cargar_aprobados_imagenes", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMensajeExito(data.message || "Cursos procesados desde imágenes");
        setShowUploadModal(false);
        setImagenesSeleccionadas([]);
        cargarAprobadosDB();
      } else {
        setErrorUpload(data.error || "No se pudieron procesar las imágenes");
      }
    } catch (error) {
      console.error(error);
      setErrorUpload("Error de conexión con el servidor");
    } finally {
      setProcesandoImagenes(false);
      setTimeout(() => setErrorUpload(""), 4000);
    }
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
      console.log(errorNotas)
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
                        console.log(Icon)
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

            {/* ----------------------- TAB: VER PENSUM ----------------------- */}
            {tab === "pensum" && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  <GraduationCap className="text-blue-600" size={28} />
                  Pensum - Ingeniería en Sistemas
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Aquí encontraras los cursos de tu carrera por semestre,
                  selecciona los cursos que ya has aprobado y guarda los cambios.
                </p>
                <br></br>

                <div className="flex flex-col sm:flex-row gap-3 mt-2 mb-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(true);
                      setErrorUpload("");
                    }}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <UploadCloud size={18} />
                    Cargar cursos aprobados con imágenes
                  </button>
                  <div className="flex-1 text-sm text-gray-600 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                    Envía las capturas con el formato indicado para que la IA extraiga código, nombre y nota sin contar los "Aprobado" en tu promedio.
                  </div>
                </div>

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

            {/* APROBADOS */}
            {tab === "aprobados" && (
              <div className="space-y-8">
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-6">
                  
                  {/* 1. Cursos (Horizontal) */}
                  <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-600 flex items-center justify-center gap-4">
                    <BookOpen className="text-blue-600" size={38} />
                    <div className="text-left">
                      <p className="text-blue-600 font-medium">Cursos</p>
                      <p className="text-3xl font-bold text-gray-800">{aprobadosDB.length}</p>
                    </div>
                  </div>

                  {/* 2. Créditos (Horizontal) */}
                  <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-600 flex items-center justify-center gap-4">
                    <BookCheck className="text-green-600" size={38} />
                    <div className="text-left">
                      <p className="text-green-600 font-medium">Créditos</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {aprobadosDB.reduce((a, c) => a + (parseInt(c.creditos) || 0), 0)}
                      </p>
                    </div>
                  </div>

                  {/* 3. Progreso (Horizontal) */}
                  <div className="bg-purple-50 rounded-2xl p-6 border-l-4 border-purple-600 flex items-center justify-center gap-4">
                    <TrendingUp className="text-purple-600" size={38} />
                    <div className="text-left">
                      <p className="text-purple-600 font-medium">Progreso</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {Math.round((aprobadosDB.reduce((a, c) => a + (parseInt(c.creditos) || 0), 0) / 300) * 100)}%
                      </p>
                    </div>
                  </div>

                </div>

                {/* --- NUEVA SECCIÓN: MI HORARIO GUARDADO --- */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="text-purple-600"/> 
                      Mi Horario Guardado (Próximo Semestre)
                  </h2>

                  {/* Aquí usamos el componente mágico */}
                  <HorarioVisualizer horario={horarioGuardadoDB} />
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-2xl font-bold mb-6">Tus cursos aprobados</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {aprobadosDB.map((c) => (
                      <div key={c.codigo} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-l-4 border-green-600">
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

            {/* ----------------------- TAB: VER TIPOS DE HORARIOS ----------------------- */}
            {tab === "horario" && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-left mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Gestión de Horarios
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Selecciona cómo deseas generar tu horario para el próximo semestre.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* OPCIÓN 1: HORARIO INTELIGENTE (IA) */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-1">Horario Inteligente</h3>
                          <p className="text-blue-100 text-sm">IA + Optimización de Pensum</p>
                        </div>
                        {/* Icono Sparkles (necesitas importarlo de lucide-react) */}
                        {/* <Sparkles size={32} className="text-blue-200" /> */}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6 text-sm">
                        El sistema analizará tu historial académico, prerrequisitos y promedio para sugerirte la 
                        <strong> ruta óptima de graduación</strong> sin choques.
                      </p>
                      
                      <div className="space-y-3">
                        <button
                          onClick={handleGenerarOptimizado}
                          disabled={loadingOptimizado}
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-md disabled:bg-gray-400"
                        >
                          {/* {loadingOptimizado ? <Loader2 className="animate-spin" /> : <Play size={18} />} */}
                          {loadingOptimizado ? "Generando..." : "Generar Automáticamente"}
                        </button>

                        {existeOptimizado && (
                          <button 
                            onClick={() => navigate('/resultado-horario', { state: { tipo: 'optimizado' } })}
                            className="w-full bg-white text-blue-700 border border-blue-200 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
                          >
                            <Eye size={18} />
                            Ver Último Generado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* OPCIÓN 2: HORARIO PERSONALIZADO (SEMÁFORO) */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100 hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-1">Horario Personalizado</h3>
                          <p className="text-green-100 text-sm">Control Manual + Semáforo</p>
                        </div>
                        {/* <List size={32} className="text-green-200" /> */}
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-6 text-sm">
                        Selecciona manualmente los cursos que deseas llevar. El <strong>Semáforo de Carga</strong> te alertará sobre la dificultad.
                      </p>
                      
                      <div className="space-y-3">
                        <button
                            onClick={() => navigate('/semaforo')}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2 shadow-md"
                        >
                            <Calendar size={18} />
                            Ir al Semáforo / Crear
                        </button>

                        {existeCustom && (
                          <button 
                            onClick={() => navigate('/resultado-horario', { state: { tipo: 'custom' } })}
                            className="w-full bg-white text-green-700 border border-green-200 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors flex justify-center items-center gap-2"
                          >
                            <Eye size={18} />
                            Ver Último Manual
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between p-6 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Carga de cursos con imágenes</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    Las imágenes serán analizadas con IA para extraer código, nombre y nota. Deben usar el siguiente formato:
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  aria-label="Cerrar modal de carga"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-indigo-700 font-semibold">
                      <Images size={18} />
                      <span>Formato esperado</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Columnas visibles de Código, Nombre, Créditos, Fecha de Aprobado, Nota y Observaciones. No importa si la fila de encabezado está recortada o si hay cursos repetidos: los deduplicamos automáticamente.
                    </p>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      <li>Solo se aceptan imágenes (PNG, JPG, JPEG).</li>
                      <li>Las notas con texto "Aprobado" no se usan para calcular promedio.</li>
                      <li>Imágenes fuera de este formato devolverán un error.</li>
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={formatoCursos} alt="Ejemplo de formato válido" className="w-full h-full max-h-80 object-contain p-3" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <input
                    ref={inputImagenesRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleSeleccionImagenes}
                  />
                  <button
                    onClick={() => inputImagenesRef.current?.click()}
                    className="flex-1 sm:flex-none px-4 py-3 bg-indigo-100 text-indigo-800 font-semibold rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Images size={18} /> Seleccionar imágenes
                  </button>
                  <button
                    onClick={procesarImagenesAprobados}
                    disabled={procesandoImagenes}
                    className="flex-1 sm:flex-none px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <UploadCloud size={18} /> {procesandoImagenes ? "Procesando..." : "Procesar"}
                  </button>
                </div>

                {!!imagenesSeleccionadas.length && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-gray-700">
                    <p className="font-semibold mb-2">Imágenes seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {imagenesSeleccionadas.map((file) => (
                        <span key={file.name} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-xs">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {errorUpload && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {errorUpload}
                  </div>
                )}
              </div>
            </div>
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

      <Footer />
    </>
  );
};

export default Dashboard;
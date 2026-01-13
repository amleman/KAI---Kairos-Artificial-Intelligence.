import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { GraduationCap, UploadCloud, CheckCircle2, Award, AlertTriangle, Save, Info, LayoutGrid, Network, HelpCircle, X, MousePointer2, Camera, Zap, Crown, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UploadModal from "../components/dashboard/UploadModal";
import GradesModal from "../components/dashboard/GradesModal";
import PensumGraph from "../components/PensumGraph";
import PricingModal from "../components/PricingModal";
import API_URL from "../api/apiConfig";

const HelpModal = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden relative border border-white/50 dark:border-slate-700/50"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Gradient */}
                        <div className="bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 h-2 w-full" />

                        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700">
                            <X size={20} />
                        </button>

                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                                    <HelpCircle size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Guía del Pensum</h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm text-balance">Todo lo que necesitas saber para gestionar tu progreso académico.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-balance">
                                {/* Section 1: Views */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <LayoutGrid size={18} className="text-purple-500 dark:text-purple-400" /> Modos de Vista
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform hover:scale-[1.02]">
                                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Grid (Cuadrícula)</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Vista tradicional organizada por semestres. Ideal para una revisión rápida y secuencial.</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform hover:scale-[1.02]">
                                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Grafo (Interactiva)</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Visualización dinámica de interconexiones. Los cursos se agrupan orgánicamente por sus dependencias.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Colors */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <Zap size={18} className="text-yellow-500 dark:text-yellow-400" /> Código de Colores
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">GANADO: Curso ya aprobado.</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-100 dark:border-sky-900/30">
                                            <div className="w-3 h-3 rounded-full bg-sky-500 dark:bg-sky-400" />
                                            <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300">DISPONIBLE: Puedes asignarlo ahora.</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-900/30">
                                            <div className="w-3 h-3 rounded-full bg-rose-400 dark:bg-rose-500" />
                                            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">BLOQUEADO: Faltan prerrequisitos.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: More features */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <Camera size={18} className="text-sky-500 dark:text-sky-400" /> Tips Rápidos
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 bg-white dark:bg-slate-700/50 rounded-full flex items-center justify-center border dark:border-slate-600 shadow-sm shrink-0 mt-0.5 text-[10px] font-black italic text-slate-600 dark:text-slate-300">1</div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Usa el botón de <b>Subir Notas (OCR)</b> para cargar fotos de tus certificaciones y actualizar todo tu pensum en segundos.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 bg-white dark:bg-slate-700/50 rounded-full flex items-center justify-center border dark:border-slate-600 shadow-sm shrink-0 mt-0.5 text-[10px] font-black italic text-slate-600 dark:text-slate-300">2</div>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">En el Grafo, haz <b>click</b> en un curso disponible (azul) para ingresar tu nota y guardarla permanentemente.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center border shadow-sm shrink-0 mt-0.5 text-[10px] font-black italic">3</div>
                                        <p className="text-xs text-slate-600">Usa el sistema de <b>Zoom y Arrastre</b> en el Grafo para explorar las rutas académicas a largo plazo.</p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const PensumPage = () => {
    const [pensum, setPensum] = useState([]);
    const [aprobados, setAprobados] = useState([]);
    const [aprobadosData, setAprobadosData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [showHelpModal, setShowHelpModal] = useState(false);

    // OCR & Upload State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]);
    const [procesandoImagenes, setProcesandoImagenes] = useState(false);
    const inputImagenesRef = useRef(null);
    const bottomRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [errorUpload, setErrorUpload] = useState("");

    // Grades Modal State
    const [showModalNotas, setShowModalNotas] = useState(false);
    const [cursosNuevos, setCursosNuevos] = useState([]);
    const [notasTemp, setNotasTemp] = useState({});

    const [usuarioData, setUsuarioData] = useState({ carne: "", carrera: "Ingeniería en Sistemas" });

    // OCR Limit State
    const [ocrUsageInfo, setOcrUsageInfo] = useState({ current: 0, limit: 2 });
    const [mostrarLimiteOCRModal, setMostrarLimiteOCRModal] = useState(false);
    const [mostrarPricingModal, setMostrarPricingModal] = useState(false);

    // Pensum Graph Access State
    const [tieneAccesoGrafo, setTieneAccesoGrafo] = useState(false);
    const [mostrarLimiteGrafoModal, setMostrarLimiteGrafoModal] = useState(false);

    // Helper to normalize course objects
    const normalizarCurso = (curso) => ({
        codigo: curso.codigo || curso.CODIGO || curso.Código || "",
        nombre_completo: curso.nombre_completo || curso.Nombre || curso.NOMBRE || curso.nombre || "",
        creditos: curso.creditos || curso.Créditos || curso.credito || "",
        semestre: curso.semestre || curso.Semestre || curso.SEMESTRE || "",
        pre_requisitos: curso.pre_requisitos || curso.Prerrequisitos || curso.Pre_Requisitos || "",
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUsuarioData(parsed);

            // Load Pensum
            const carreraQuery = parsed.carrera ? `?carrera=${encodeURIComponent(parsed.carrera)}` : "";
            fetch(`${API_URL}/pensum${carreraQuery}`)
                .then(res => res.text())
                .then(csv => {
                    Papa.parse(csv, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            setPensum(results.data.map(normalizarCurso));
                            setLoading(false);
                        }
                    });
                });

            // Load Aprobados
            if (parsed.carne) {
                fetch(`${API_URL}/aprobados/${parsed.carne}`)
                    .then(res => res.json())
                    .then(data => {
                        setAprobadosData(data);
                        const codigos = data.map(c => c.codigo);
                        setAprobados(codigos);
                    })
                    .catch(console.error);

                // Load OCR usage from plan
                fetch(`${API_URL}/plan/${parsed.carne}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.limites) {
                            setOcrUsageInfo({
                                current: data.limites.ocr_usado || 0,
                                limit: data.limites.ocr_total === -1 ? 999 : (data.limites.ocr_total || 2)
                            });
                        }
                        // Check graph access from features
                        if (data.features) {
                            setTieneAccesoGrafo(data.features.pensum_grafo === true);
                        }
                    })
                    .catch(console.error);
            }
        }
    }, []);

    const toggleAprobado = (codigo) => {
        setAprobados(prev =>
            prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
        );
    };

    const puedeLlevar = (curso) => {
        if (!curso.pre_requisitos || curso.pre_requisitos === "Ninguno") return true;
        const prereqs = curso.pre_requisitos.replaceAll('"', "").split(",").map((r) => r.trim());
        return prereqs.every((p) => aprobados.includes(p));
    };

    // --- Save Logic for Grid View (Batch) ---
    const guardarAprobadosBatch = async () => {
        // Detect newly approved courses (in current 'aprobados' but not in DB data)
        const newCoursesCodes = aprobados.filter(code => !aprobadosData.some(d => d.codigo === code));

        if (newCoursesCodes.length > 0) {
            // Prepare data for Grades Modal
            const newCoursesObjects = newCoursesCodes.map(code => {
                const info = pensum.find(p => p.codigo === code);
                return {
                    codigo: code,
                    nombre: info?.nombre_completo || "",
                    creditos: parseInt(info?.creditos) || 0
                };
            });

            setCursosNuevos(newCoursesObjects);

            // Initialize temp grades
            const initialGrades = {};
            newCoursesObjects.forEach(c => initialGrades[c.codigo] = 61);
            setNotasTemp(initialGrades);

            setShowModalNotas(true);
        } else {
            // No new additions, just removals or unchanged data -> Save directly
            const payloadCursos = aprobados.map(codigo => {
                const infoOriginal = aprobadosData.find(d => d.codigo === codigo);
                const infoPensum = pensum.find(p => p.codigo === codigo) || {};
                return {
                    codigo,
                    nombre: infoPensum.nombre_completo || "",
                    creditos: parseInt(infoPensum.creditos) || 0,
                    nota: infoOriginal ? infoOriginal.nota : 61
                };
            });
            await enviarPayloadBackend(payloadCursos);
        }
    };

    // --- Save Logic for Graph Modal (Single) ---
    const handleSaveSingleCourse = async (cursoPayload, isApproved) => {
        let nuevosAprobadosData = [...aprobadosData];
        let nuevosAprobadosCodigos = [...aprobados];

        if (isApproved) {
            if (!nuevosAprobadosCodigos.includes(cursoPayload.codigo)) {
                nuevosAprobadosCodigos.push(cursoPayload.codigo);
            }

            const existingIndex = nuevosAprobadosData.findIndex(c => c.codigo === cursoPayload.codigo);
            const fullCourseData = {
                ...cursoPayload,
                nombre: pensum.find(p => p.codigo === cursoPayload.codigo)?.nombre_completo || "",
                creditos: parseInt(pensum.find(p => p.codigo === cursoPayload.codigo)?.creditos) || 0
            };

            if (existingIndex >= 0) {
                nuevosAprobadosData[existingIndex] = fullCourseData;
            } else {
                nuevosAprobadosData.push(fullCourseData);
            }
        } else {
            nuevosAprobadosCodigos = nuevosAprobadosCodigos.filter(c => c !== cursoPayload.codigo);
            nuevosAprobadosData = nuevosAprobadosData.filter(c => c.codigo !== cursoPayload.codigo);
        }

        setAprobados(nuevosAprobadosCodigos);
        setAprobadosData(nuevosAprobadosData);
        await enviarPayloadBackend(nuevosAprobadosData);
    };

    const enviarPayloadBackend = async (listaCursos) => {
        try {
            const payload = {
                carne: usuarioData.carne,
                cursos: listaCursos
            };

            const response = await fetch(`${API_URL}/guardar_aprobados`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await fetch(`${API_URL}/aprobados/${usuarioData.carne}`).then(res => res.json());
                setAprobadosData(data);
            } else {
                alert("Error al guardar cambios.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al guardar.");
        }
    };

    // --- OCR Logic Proxies ---
    const confirmarNotasOCR = () => {
        // Validación de rango de notas (61-100)
        const notasInvalidas = cursosNuevos.some(c => {
            const nota = parseFloat(notasTemp[c.codigo]);
            return isNaN(nota) || nota < 61 || nota > 100;
        });

        if (notasInvalidas) {
            alert("Por favor, asegúrate de que todas las notas estén entre 61 y 100.");
            return;
        }

        const cursosConNotas = cursosNuevos.map(c => ({
            codigo: c.codigo,
            nota: parseFloat(notasTemp[c.codigo]) || 61,
            nombre: c.nombre,
            creditos: c.creditos
        }));

        const mergedData = [...aprobadosData];
        cursosConNotas.forEach(nuevo => {
            const idx = mergedData.findIndex(existing => existing.codigo === nuevo.codigo);
            if (idx >= 0) mergedData[idx] = nuevo;
            else mergedData.push(nuevo);
        });

        enviarPayloadBackend(mergedData).then(() => {
            const newCodes = mergedData.map(c => c.codigo);
            setAprobados(newCodes);
            setAprobadosData(mergedData);
            setShowModalNotas(false);
            setCursosNuevos([]);
        });
    };

    const handleSeleccionImagenes = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles = Array.from(files);
            setImagenesSeleccionadas(prev => [...prev, ...newFiles]);
            setErrorUpload("");
            // Clear input value to allow selecting the same file again if needed
            e.target.value = "";
        }
    };

    const procesarImagenesAprobados = async () => {
        if (imagenesSeleccionadas.length === 0) { setErrorUpload("Selecciona una imagen."); return; }

        // Solo se permite 1 imagen por petición
        const imagenAProcesar = imagenesSeleccionadas[0];

        // Verificar límite OCR ANTES de procesar
        if (ocrUsageInfo.limit < 999 && ocrUsageInfo.current >= ocrUsageInfo.limit) {
            setMostrarLimiteOCRModal(true);
            return;
        }

        setProcesandoImagenes(true);
        setErrorUpload("");

        const formData = new FormData();
        formData.append("files", imagenAProcesar);
        formData.append("usuario", usuarioData.carne);

        try {
            const response = await fetch(`${API_URL}/extraer_cursos`, { method: "POST", body: formData });
            if (!response.ok) throw new Error("Error procesando");
            const data = await response.json();

            if (data.cursos_extraidos?.length > 0) {
                const validos = data.cursos_extraidos.map(ext => {
                    const match = pensum.find(p => p.codigo === ext.codigo);
                    return match ? { ...match, nota: ext.nota || 61 } : null;
                }).filter(Boolean);

                if (validos.length) {
                    // Solo incrementar contador DESPUÉS de éxito
                    await fetch(`${API_URL}/plan/${usuarioData.carne}/usar/ocr`, { method: "POST" });
                    setOcrUsageInfo(prev => ({
                        ...prev,
                        current: prev.current + 1
                    }));

                    setCursosNuevos(validos);
                    const map = {}; validos.forEach(c => map[c.codigo] = c.nota);
                    setNotasTemp(map);
                    setShowUploadModal(false);
                    setShowModalNotas(true);
                    setImagenesSeleccionadas([]);
                } else { setErrorUpload("No se hallaron cursos válidos en la imagen."); }
            } else { setErrorUpload("No se pudo leer la imagen. Intenta con otra captura."); }
        } catch (e) { setErrorUpload(e.message); }
        finally { setProcesandoImagenes(false); }
    };


    const semestresOrden = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
    const pensumPorSemestre = semestresOrden.map((sem, index) => ({
        nombre: sem,
        numero: index + 1,
        cursos: pensum.filter((c) => c.semestre === sem),
    }));

    return (
        <div className="animate-fadeIn flex flex-col h-[calc(100dvh-100px)] md:h-[calc(100vh-120px)] space-y-4 md:space-y-6 relative overflow-hidden">
            {/* Header Area - Always Visible */}
            <div className="shrink-0 px-1">
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-6 border border-white/40 dark:border-slate-700/50 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center transition-all">
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl md:rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-sm border border-sky-200 dark:border-sky-800/30 shrink-0">
                            <GraduationCap size={20} className="md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">
                                Pensum
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-sm font-bold uppercase tracking-widest truncate">
                                {usuarioData.carrera}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200 dark:border-slate-700/50">
                        <div className="flex gap-1 md:gap-2 bg-slate-100/80 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                <LayoutGrid size={14} className="md:w-4 md:h-4" /> GRID
                            </button>
                            <button
                                onClick={() => {
                                    if (tieneAccesoGrafo) {
                                        setViewMode('graph');
                                    } else {
                                        setMostrarLimiteGrafoModal(true);
                                    }
                                }}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-xs font-black flex items-center gap-1.5 transition-all relative ${viewMode === 'graph' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                <Network size={14} className="md:w-4 md:h-4" /> GRAFO
                                {!tieneAccesoGrafo && (
                                    <Crown size={10} className="text-amber-500 absolute -top-1 -right-1" />
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => setShowHelpModal(true)}
                            className="w-9 h-9 md:w-11 md:h-11 bg-slate-800 dark:bg-slate-700 text-white rounded-xl flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-lg active:scale-95 shrink-0"
                        >
                            <HelpCircle size={18} className="md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Bar - Always Visible */}
            <div className="shrink-0 px-1 z-10">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-sky-500 text-white hover:bg-sky-600 rounded-xl font-black transition-all flex items-center justify-center gap-2 text-xs md:text-sm shadow-lg shadow-sky-100 dark:shadow-none uppercase tracking-widest active:scale-95"
                    >
                        <UploadCloud size={16} className="md:w-[18px]" />
                        <span className="truncate">Auto-Completar</span>
                    </button>

                    <div className="flex-1 flex gap-2">
                        {/* Scroll Down Button for Grid Mode */}
                        {viewMode === 'grid' && (
                            <button
                                onClick={() => {
                                    if (scrollContainerRef.current) {
                                        scrollContainerRef.current.scrollTo({
                                            top: scrollContainerRef.current.scrollHeight,
                                            behavior: 'smooth'
                                        });
                                    }
                                }}
                                className="px-4 py-2.5 bg-white/60 dark:bg-slate-800/40 text-sky-500 dark:text-sky-400 border border-white/40 dark:border-slate-700/50 rounded-xl font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 hover:bg-white dark:hover:bg-slate-700 transition-all"
                            >
                                <ArrowDown size={16} className="md:w-[18px]" />
                                <span className="hidden sm:inline text-xs uppercase tracking-wider">Ir Abajo</span>
                            </button>
                        )}

                        <div className="flex-1 flex items-center justify-center sm:justify-end gap-2 px-4 py-2.5 bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] md:text-xs border border-white/40 dark:border-slate-700/50 font-black shadow-sm uppercase tracking-wider min-w-0">
                            <Info size={14} className="text-sky-500 shrink-0" />
                            <span className="truncate">{aprobados.length} <span className="text-slate-400 font-medium">/ {pensum.length}</span> Cursos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Scrollable Independent */}
            <div className="flex-1 bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl rounded-t-3xl border-t border-x border-soft-blue dark:border-slate-700/50 shadow-[inset_0_0_30px_rgba(0,0,0,0.02)] overflow-hidden relative flex flex-col">
                {viewMode === 'grid' ? (
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative"
                    >
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 pb-[30vh]">
                            {pensumPorSemestre.map((sem) => (
                                <div key={sem.nombre} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/40 dark:border-slate-700/50 relative overflow-hidden transition-all hover:shadow-xl group">
                                    <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity font-black text-[8rem] md:text-[12rem] text-slate-900 dark:text-slate-100 select-none pointer-events-none">
                                        {sem.numero}
                                    </div>

                                    <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 md:gap-4 relative z-10 uppercase tracking-widest">
                                        <span className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-lg border border-sky-300 text-sm md:text-base">
                                            {sem.numero}
                                        </span>
                                        {sem.nombre} Semestre
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
                                        {sem.cursos.map((curso) => {
                                            const aprobado = aprobados.includes(curso.codigo);
                                            const permitido = puedeLlevar(curso);

                                            return (
                                                <div
                                                    key={curso.codigo}
                                                    onClick={() => (permitido ? toggleAprobado(curso.codigo) : null)}
                                                    className={`
                                                        p-4 rounded-xl md:rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden shadow-sm
                                                        ${aprobado
                                                            ? "bg-emerald-50/80 border-emerald-200 shadow-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:shadow-none"
                                                            : permitido
                                                                ? "bg-white border-slate-100 hover:border-sky-400 hover:shadow-sky-100 hover:-translate-y-1 dark:!bg-slate-800/60 dark:border-slate-700 dark:hover:border-sky-500 dark:hover:shadow-sky-900/20"
                                                                : "bg-slate-50/50 border-slate-100 italic opacity-60 cursor-not-allowed dark:bg-slate-800/30 dark:border-slate-700/30"
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2.5">
                                                        <span className={`text-[9px] md:text-[10px] font-black px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg uppercase tracking-wider ${aprobado ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                                                            {curso.codigo}
                                                        </span>
                                                        {aprobado && <CheckCircle2 size={16} className="md:w-[18px] text-emerald-500 dark:text-emerald-400" />}
                                                        {!permitido && <AlertTriangle size={14} className="md:w-4 text-rose-400 dark:text-rose-500" />}
                                                    </div>
                                                    <h4 className={`font-black text-xs md:text-sm leading-tight mb-2 md:mb-3 line-clamp-2 ${aprobado ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {curso.nombre_completo}
                                                    </h4>
                                                    <div className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                                        <Award size={12} className="text-sky-400 dark:text-sky-500" /> {curso.creditos} Créditos
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Save Button Area - Inside Scrollable Container */}
                            <div className="flex justify-center pt-8 pb-12">
                                <button
                                    ref={bottomRef}
                                    onClick={guardarAprobadosBatch}
                                    className="bg-sky-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-sky-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-sky-200 dark:shadow-none uppercase tracking-widest text-sm"
                                >
                                    <Save size={20} />
                                    Guardar Progreso
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <PensumGraph
                        pensum={pensum}
                        aprobados={aprobados}
                        aprobadosData={aprobadosData}
                        onSaveSingleCourse={handleSaveSingleCourse}
                    />
                )}
            </div>

            <HelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />

            <UploadModal
                showUploadModal={showUploadModal}
                setShowUploadModal={setShowUploadModal}
                imagenesSeleccionadas={imagenesSeleccionadas}
                handleSeleccionImagenes={handleSeleccionImagenes}
                procesarImagenesAprobados={procesarImagenesAprobados}
                errorUpload={errorUpload}
                procesandoImagenes={procesandoImagenes}
                inputImagenesRef={inputImagenesRef}
            />

            <GradesModal
                showModalNotas={showModalNotas}
                setShowModalNotas={setShowModalNotas}
                cursosNuevos={cursosNuevos}
                notasTemp={notasTemp}
                setNotasTemp={setNotasTemp}
                confirmarNotas={confirmarNotasOCR}
            />

            {/* Modal de Límite OCR Alcanzado */}
            {mostrarLimiteOCRModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:!bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />

                        <button
                            onClick={() => setMostrarLimiteOCRModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-amber-50 dark:ring-amber-900/20">
                            <Crown size={36} className="text-amber-500" />
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                            ¡Límite de OCR alcanzado!
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                            Has usado tu <span className="font-bold text-slate-700 dark:text-slate-300">escaneo gratuito</span> de este mes.
                            Actualiza a Premium para escaneos ilimitados.
                        </p>

                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-600">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Plan actual:</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">Gratuito</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-slate-500 dark:text-slate-400">Imágenes escaneadas:</span>
                                <span className="font-bold text-rose-500">{ocrUsageInfo.current}/{ocrUsageInfo.limit}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setMostrarLimiteOCRModal(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    setMostrarLimiteOCRModal(false);
                                    setMostrarPricingModal(true);
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Crown size={18} />
                                Ver Premium
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Límite Grafo Alcanzado */}
            {mostrarLimiteGrafoModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:!bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500" />

                        <button
                            onClick={() => setMostrarLimiteGrafoModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-purple-50 dark:ring-purple-900/20">
                            <Network size={36} className="text-purple-500" />
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                            Vista Grafo Premium
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                            La vista de <span className="font-bold text-slate-700 dark:text-slate-300">Pensum en Grafo</span> es una función exclusiva para usuarios Premium.
                            Visualiza las dependencias de tus cursos de forma interactiva.
                        </p>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 mb-6 border border-purple-100 dark:border-purple-800/30">
                            <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                                ✨ Explora tu carrera de forma visual
                                <br />
                                🔗 Observa las conexiones entre cursos
                                <br />
                                📊 Planifica tu ruta académica ideal
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setMostrarLimiteGrafoModal(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                            >
                                Usar Grid
                            </button>
                            <button
                                onClick={() => {
                                    setMostrarLimiteGrafoModal(false);
                                    setMostrarPricingModal(true);
                                }}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-200 dark:shadow-purple-900/30 transition-all flex items-center justify-center gap-2"
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
                currentPlan={tieneAccesoGrafo ? 'premium' : 'free'}
            />
        </div>
    );
};
export default PensumPage;

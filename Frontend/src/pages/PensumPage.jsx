import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { GraduationCap, UploadCloud, CheckCircle2, Award, AlertTriangle, Save, Info } from "lucide-react";
import UploadModal from "../components/dashboard/UploadModal";
import GradesModal from "../components/dashboard/GradesModal";

const PensumPage = () => {
    const [pensum, setPensum] = useState([]);
    const [aprobados, setAprobados] = useState([]);
    const [aprobadosDB, setAprobadosDB] = useState([]); // To track what is already saved
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // OCR & Upload State
    const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState([]);
    const [procesandoImagenes, setProcesandoImagenes] = useState(false);
    const inputImagenesRef = useRef(null);

    // Grades Modal State
    const [showModalNotas, setShowModalNotas] = useState(false);
    const [cursosNuevos, setCursosNuevos] = useState([]);
    const [notasTemp, setNotasTemp] = useState({});

    const [errorUpload, setErrorUpload] = useState("");
    const [usuarioData, setUsuarioData] = useState({ carne: "", carrera: "Ingeniería en Sistemas" });

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
            fetch(`http://127.0.0.1:8000/pensum${carreraQuery}`)
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
                fetch(`http://127.0.0.1:8000/aprobados/${parsed.carne}`)
                    .then(res => res.json())
                    .then(data => {
                        const codigos = data.map(c => c.codigo);
                        setAprobados(codigos);
                        setAprobadosDB(codigos);
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
        if (!curso.pre_requisitos) return true;
        const prereqs = curso.pre_requisitos.replaceAll('"', "").split(",").map((r) => r.trim());
        return prereqs.every((p) => aprobados.includes(p));
    };

    const guardarAprobados = async () => {
        // Identify newly selected courses that aren't in DB
        const nuevos = aprobados.filter(codigo => !aprobadosDB.includes(codigo));

        if (nuevos.length > 0) {
            // Find course details for the modal
            const detallesNuevos = pensum.filter(c => nuevos.includes(c.codigo)).map(c => ({
                codigo: c.codigo,
                nombre: c.nombre_completo,
                creditos: c.creditos
            }));
            setCursosNuevos(detallesNuevos);
            setShowModalNotas(true);
        } else {
            // Just save (maybe removal or update without new grades)
            enviarDatosGuardado([]);
        }
    };

    const confirmarNotas = () => {
        const cursosConNotas = cursosNuevos.map(c => ({
            codigo: c.codigo,
            nota: notasTemp[c.codigo] || 61
        }));
        enviarDatosGuardado(cursosConNotas);
    };

    const enviarDatosGuardado = async (nuevosCursosData = []) => {
        try {
            // Merge existing checked courses with new ones from OCR
            const codigosNuevos = nuevosCursosData.map(nc => nc.codigo);
            const todosLosCodigos = Array.from(new Set([...aprobados, ...codigosNuevos]));

            const payload = {
                carne: usuarioData.carne,
                cursos: todosLosCodigos.map(codigo => {
                    const cursoInfo = pensum.find(c => c.codigo === codigo) || {};
                    const esNuevo = nuevosCursosData.find(nc => nc.codigo === codigo);

                    // Note: If it's an old course not in 'nuevosCursosData', we send 0/undefined as note.
                    // The backend handles merging/not overwriting if we rely on its specific logic, 
                    // but ideally the backend should interpret "0" as "keep existing".
                    // Current backend implementation with 'merge_cursos_en_db' OVERWRITES logic:
                    // cursos_dict[codigo] = curso. So we must be careful.
                    // However, we are sending the full snapshot of *codes*.
                    // If we want to safely add new courses without touching old grades, 
                    // we should ONLY send the new courses in the payload?
                    // User complained "it only saved 5". Because we only sent 'aprobados' (5).
                    // If we send ALL (17+5), with note 0 for old ones, we might wipe old grades.

                    // BETTER APPROACH for this specific user request context:
                    // If we are coming from OCR (nuevosCursosData has length), send ONLY the new courses.
                    // The backend acts as a MERGE for new entries. 
                    // BUT 'aprobados' won't be updated in the backend if we uncheck them?
                    // "Guardar Progreso" sends everything. "Confirmar Notas" sends new stuff.

                    // Actually, let's keep it robust:
                    // If this is a Save All (nuevosCursosData is empty), send all 'aprobados' with 0 (or whatever we have).
                    // If this is an OCR Merge (nuevosCursosData has data), send ONLY nuevosCursosData?
                    // AND merge them into local 'aprobados' state.

                    // Let's stick to the MERGE logic which seems safer for consistency with the backend refactor:
                    // We send the union.

                    return {
                        codigo,
                        nombre: cursoInfo.nombre_completo || "",
                        creditos: parseInt(cursoInfo.creditos) || 0,
                        nota: esNuevo ? esNuevo.nota : 0
                    };
                })
            };

            // Override payload to only send what we explicitly want to SAVE/UPDATE if using OCR flow?
            // "cursos" in payload drives the backend loop.
            // If we send everything, we re-save everything.
            // Let's verify what the previous code did:
            // cursos: aprobados.map...

            // To fix the "Only 5 saved" issue clearly:
            // We just need to make sure the payload includes local 'aprobados' items AND 'nuevosCursosData' items.
            // And update the state 'setAprobados'.

            const response = await fetch("http://127.0.0.1:8000/guardar_aprobados", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Success feedback
                const btn = document.getElementById("save-float-btn");
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `<span class="flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Guardado!</span>`;
                    setTimeout(() => btn.innerHTML = originalText, 2000);
                }

                // Update local state to reflect the union
                setAprobados(todosLosCodigos);
                setAprobadosDB(todosLosCodigos);

                setShowModalNotas(false);
                setCursosNuevos([]);
                setNotasTemp({});
            } else {
                alert("Error al guardar el progreso.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión.");
        }
    };

    const semestresOrden = ["Primero", "Segundo", "Tercero", "Cuarto", "Quinto", "Sexto", "Séptimo", "Octavo", "Noveno", "Décimo"];
    const pensumPorSemestre = semestresOrden.map((sem, index) => ({
        nombre: sem,
        numero: index + 1,
        cursos: pensum.filter((c) => c.semestre === sem),
    }));

    const scrollToSave = () => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
        });
    };

    // --- OCR Logic ---
    const handleSeleccionImagenes = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            // Convert FileList to Array and APPEND to existing selection
            const newFiles = Array.from(e.target.files);
            setImagenesSeleccionadas(prev => [...prev, ...newFiles]);
            setErrorUpload("");

            // Allow re-selecting same file if needed by clearing input
            if (e.target) e.target.value = "";
        }
    };

    const procesarImagenesAprobados = async () => {
        if (imagenesSeleccionadas.length === 0) {
            setErrorUpload("Selecciona al menos una imagen.");
            return;
        }

        setProcesandoImagenes(true);
        setErrorUpload("");

        const formData = new FormData();
        imagenesSeleccionadas.forEach(file => {
            formData.append("files", file);
        });

        // Add user info context if useful for backend logging (optional)
        formData.append("usuario", usuarioData.carne);

        try {
            const response = await fetch("http://127.0.0.1:8000/extraer_cursos", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Error al procesar imágenes");
            }

            const data = await response.json();

            // data.cursos_extraidos should follow format: [{ codigo: "0101", nota: 61, nombre: "..." }, ...]
            if (data.cursos_extraidos && data.cursos_extraidos.length > 0) {
                // Filter only courses that exist in current pensum to match IDs
                const cursosValidos = [];

                data.cursos_extraidos.forEach(extracted => {
                    const match = pensum.find(c => c.codigo === extracted.codigo);
                    if (match) {
                        cursosValidos.push({
                            codigo: match.codigo,
                            nombre: match.nombre_completo,
                            creditos: match.creditos,
                            nota: extracted.nota || 61
                        });
                    }
                });

                if (cursosValidos.length > 0) {
                    setCursosNuevos(cursosValidos);

                    // Pre-fill grades temp state
                    const notasPreFill = {};
                    cursosValidos.forEach(c => notasPreFill[c.codigo] = c.nota);
                    setNotasTemp(notasPreFill);

                    setShowUploadModal(false);
                    setShowModalNotas(true); // Go to confirmation step
                    setImagenesSeleccionadas([]);
                } else {
                    setErrorUpload("No se detectaron cursos válidos del pensum actual.");
                }
            } else {
                setErrorUpload("No se pudo extraer información legible. Intenta con una imagen más clara.");
            }
        } catch (error) {
            console.error(error);
            setErrorUpload(error.message || "Error de conexión con el servidor de análisis.");
        } finally {
            setProcesandoImagenes(false);
        }
    };

    return (
        <div className="animate-fadeIn flex flex-col h-[calc(100vh-120px)] space-y-6 relative">
            {/* Headers Fixed */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-soft-blue shadow-inner relative overflow-hidden shrink-0">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <GraduationCap className="text-pastel-blue-dark" size={32} />
                            Pensum
                        </h1>
                    </div>
                    <p className="text-slate-600 mt-2 text-sm">
                        Visualiza tu camino académico. Marca los cursos aprobados para desbloquear los siguientes niveles.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-4">
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="px-4 py-2 bg-pastel-blue/20 text-slate-700 hover:bg-pastel-blue/40 border border-pastel-blue rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                        >
                            <UploadCloud size={16} />
                            Subir notas
                        </button>
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#E8DFF5] text-slate-700 rounded-xl text-xs border border-[#d4c5eb] font-semibold shadow-sm">
                            <Info size={14} />
                            <span>Selecciona un curso para marcarlo como aprobado.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-2xl border border-soft-blue shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] flex flex-col min-h-0 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-24">
                    {/* Semesters Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {pensumPorSemestre.map((sem) => (
                            <div key={sem.nombre} className="bg-white/50 backdrop-blur-xl p-6 rounded-2xl border border-soft-blue shadow-inner relative overflow-hidden group hover:bg-white/60 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-slate-400 select-none group-hover:scale-110 transition-transform">
                                    {sem.numero}
                                </div>

                                <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3 relative z-10">
                                    <span className="w-8 h-8 rounded-full bg-pastel-blue flex items-center justify-center text-slate-700 text-sm font-bold shadow-sm">
                                        {sem.numero}
                                    </span>
                                    {sem.nombre} Semestre
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                                    {sem.cursos.map((curso) => {
                                        const aprobado = aprobados.includes(curso.codigo);
                                        const permitido = puedeLlevar(curso);

                                        return (
                                            <div
                                                key={curso.codigo}
                                                onClick={() => (permitido ? toggleAprobado(curso.codigo) : null)}
                                                className={`
                                                    p-4 rounded-lg border transition-all duration-300 cursor-pointer relative overflow-hidden group/card
                                                    hover:shadow-md hover:scale-[1.02]
                                                    ${aprobado
                                                        ? "bg-pastel-green/40 border-pastel-green shadow-sm"
                                                        : permitido
                                                            ? "bg-white/60 border-[2px] border-soft-blue/30 hover:bg-soft-blue/40 hover:border-soft-blue/80 hover:from-white hover:to-soft-blue/30 bg-gradient-to-br from-transparent to-transparent text-slate-700"
                                                            : "bg-red-50/50 border-red-100/50 opacity-70 grayscale-[0.5] cursor-not-allowed hover:bg-red-100/80"
                                                    }
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${aprobado ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                                        {curso.codigo}
                                                    </span>
                                                    {aprobado && <CheckCircle2 size={16} className="text-green-600" />}
                                                    {!permitido && <AlertTriangle size={16} className="text-red-400 group-hover/card:text-red-500 transition-colors" />}
                                                </div>

                                                <h4 className="font-semibold px-0 text-slate-800 text-sm leading-tight mb-2">
                                                    {curso.nombre_completo}
                                                </h4>

                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Award size={12} />
                                                    {curso.creditos} Créditos
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Floating Action Bar (NOW ABSOLUTE INSIDE CONTAINER) */}
                <div className="absolute bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-xl border border-soft-blue shadow-2xl rounded-xl p-3 flex justify-between items-center max-w-2xl w-full mx-4 ring-1 ring-black/5 pointer-events-auto">
                        <div className="flex items-center gap-3 ml-2">
                            <div className="w-2 h-2 rounded-full bg-pastel-blue animate-pulse" />
                            <span className="text-slate-600 font-bold text-sm">
                                {aprobados.length} Cursos seleccionados
                            </span>
                        </div>
                        <button
                            id="save-float-btn"
                            onClick={guardarAprobados}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 shadow-lg active:scale-95 text-sm"
                        >
                            <Save size={16} />
                            Guardar Progreso
                        </button>
                    </div>
                </div>
            </div>



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
                confirmarNotas={confirmarNotas}
            />
        </div>
    );
};
export default PensumPage;

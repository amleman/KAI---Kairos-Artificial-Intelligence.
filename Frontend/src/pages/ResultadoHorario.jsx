import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, User, AlertCircle, LayoutGrid, List, Save, FileDown, TrendingUp, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import HorarioVisualizer from "../components/HorarioVisualizer";
import API_URL from "../api/apiConfig";

const ResultadoHorario = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getUserData = () => {
        try { return JSON.parse(localStorage.getItem("userData") || "{}"); }
        catch { return {}; }
    };
    const userData = getUserData();
    const carnet = userData.carne || "guest";

    const KEY_CUSTOM = `SIOA_progreso_${carnet}`;
    const KEY_OPTIMIZADO = `SIOA_optimizado_${carnet}`;
    const tipoHorario = location.state?.tipo || 'custom';

    const [datos] = useState(() => {
        if (location.state?.datosHorario) return location.state.datosHorario;
        try {
            const targetKey = tipoHorario === 'optimizado' ? KEY_OPTIMIZADO : KEY_CUSTOM;
            const saved = localStorage.getItem(targetKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (tipoHorario === 'optimizado') return parsed;
                return Array.isArray(parsed.horarioGenerado) ? { horarios: parsed.horarioGenerado } : parsed.horarioGenerado;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    });

    const [opcionSeleccionada, setOpcionSeleccionada] = useState(0);
    const [vista, setVista] = useState("calendario");
    const [guardando, setGuardando] = useState(false);
    const [mensajeExito, setMensajeExito] = useState("");
    const captureRef = useRef(null);

    useEffect(() => {
        if (!datos) navigate("/semaforo");
    }, [datos, navigate]);

    const parsearDias = (diasStr) => {
        try {
            if (!diasStr) return [];
            const limpio = diasStr.replace(/'/g, '"');
            return JSON.parse(limpio);
        } catch {
            return diasStr.replace(/[[\]']/g, "").split(",").map(d => d.trim());
        }
    };

    if (!datos) return null;
    const horariosDisponibles = datos.horarios || [];
    const seleccion = horariosDisponibles[opcionSeleccionada];
    const cursoActuales = Array.isArray(seleccion) ? seleccion : (seleccion?.horario || []);
    const analisisFinanciero = !Array.isArray(seleccion) ? seleccion?.analisis_financiero : null;

    const PALETA_COLORES = [
        { bg: "bg-blue-100/60", border: "border-blue-200", text: "text-blue-800" },
        { bg: "bg-purple-100/60", border: "border-purple-200", text: "text-purple-800" },
        { bg: "bg-emerald-100/60", border: "border-emerald-200", text: "text-emerald-800" },
        { bg: "bg-pink-100/60", border: "border-pink-200", text: "text-pink-800" },
        { bg: "bg-amber-100/60", border: "border-amber-200", text: "text-amber-800" },
    ];

    const getColorCurso = (codigo, index) => PALETA_COLORES[index % PALETA_COLORES.length];

    const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    const HORA_INICIO_DIA = 7 * 60;
    const ALTURA_HORA = 80;
    const PIXELES_POR_MINUTO = ALTURA_HORA / 60;

    const getEstilosEvento = (inicioMin, finMin) => {
        const top = (inicioMin - HORA_INICIO_DIA) * PIXELES_POR_MINUTO;
        const height = (finMin - inicioMin) * PIXELES_POR_MINUTO;
        return { top: `${top}px`, height: `${height}px` };
    };

    const handleDescargarPDF = async () => {
        if (!captureRef.current) return;
        try {
            const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 10, pageWidth, imgHeight, undefined, "FAST");
            pdf.save(`horario_opcion_${opcionSeleccionada + 1}.pdf`);
        } catch (err) { console.error(err); }
    };

    const handleGuardarHorario = async (horarioParaGuardar, index) => {
        if (!userData.carne || !horarioParaGuardar) return;
        setGuardando(true);
        try {
            const res = await fetch(`${API_URL}/guardar_horario_final`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario: userData.carne,
                    horario: horarioParaGuardar,
                    nombre: `Opción ${index + 1} - 2025`
                }),
            });
            if (res.ok) {
                setMensajeExito("¡Horario guardado con éxito!");
                setTimeout(() => setMensajeExito(""), 3000);
            } else {
                alert("Error al guardar el horario.");
            }
        } catch (error) { console.error(error); alert("Error de conexión"); }
        finally { setGuardando(false); }
    };

    return (
        <div className="animate-fadeIn space-y-8 pb-12">
            {/* Toast Notification */}
            {mensajeExito && (
                <div className="fixed top-24 right-8 z-50 bg-white/90 backdrop-blur-xl text-slate-800 px-6 py-4 rounded-xl shadow-xl border border-soft-blue flex items-center gap-3 animate-slide-in">
                    <div className="w-8 h-8 bg-pastel-green rounded-xl flex items-center justify-center text-green-600 font-bold">✓</div>
                    <span className="font-bold">{mensajeExito}</span>
                </div>
            )}

            {/* Header Glass Card */}
            <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-soft-blue dark:border-slate-700 shadow-inner relative overflow-hidden flex flex-col items-center md:items-stretch">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl border border-pastel-blue/30 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 hover:shadow-md transition-all">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <Calendar className="text-sky-600 dark:text-sky-400" size={32} />
                                {tipoHorario === 'optimizado' ? 'Horario Sugerido' : 'Horario Personalizado'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest bg-soft-blue/30 dark:bg-slate-700/50 px-3 py-1 rounded-lg">Visualizando {horariosDisponibles.length} combinaciones</p>
                        </div>
                    </div>

                </div>

                {/* Options Selector - Now Colorful */}
                <div className="mt-8 flex flex-wrap gap-3">
                    {horariosDisponibles.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setOpcionSeleccionada(index)}
                            className={`px-8 py-3 rounded-xl font-black text-sm transition-all border shadow-sm hover:scale-105 active:scale-95 ${opcionSeleccionada === index
                                ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-700 dark:border-indigo-400 shadow-indigo-200 dark:shadow-indigo-900/50"
                                : "bg-white dark:!bg-slate-950 text-slate-500 dark:!text-white border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                }`}
                        >
                            Opción {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Financial Analysis Section - Color Coded */}
            {analisisFinanciero && (
                <div className={`backdrop-blur-xl rounded-2xl border shadow-inner p-8 flex flex-col xl:flex-row items-center justify-between gap-8 relative overflow-hidden group transition-all ${analisisFinanciero.meses_atraso_estimado > 0
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    }`}>
                    {/* Background decoration */}
                    <div className={`absolute right-0 top-0 w-64 h-64 rounded-full blur-3xl opacity-40 pointer-events-none ${analisisFinanciero.meses_atraso_estimado > 0 ? "bg-orange-300" : "bg-emerald-300"
                        }`} />

                    <div className="flex-1 space-y-2 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${analisisFinanciero.meses_atraso_estimado > 0 ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                                }`}>
                                <TrendingUp size={20} />
                            </div>
                            <h3 className={`text-xl font-black ${analisisFinanciero.meses_atraso_estimado > 0 ? "text-orange-900 dark:text-orange-300" : "text-emerald-900 dark:text-emerald-300"
                                }`}>
                                Impacto en Graduación
                            </h3>
                        </div>
                        <p className={`font-medium ${analisisFinanciero.meses_atraso_estimado > 0 ? "text-orange-800" : "text-emerald-800"
                            }`}>
                            {analisisFinanciero.mensaje_alerta}
                        </p>
                    </div>

                    <div className="flex gap-6 relative z-10">
                        <div className="flex-1 bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-white/60 dark:border-slate-700 text-center shadow-sm backdrop-blur-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Atraso Estimado</p>
                            <p className={`text-3xl font-black ${analisisFinanciero.meses_atraso_estimado > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                                }`}>
                                {analisisFinanciero.meses_atraso_estimado} <span className="text-sm font-bold text-slate-400">meses</span>
                            </p>
                        </div>
                        <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl text-center min-w-[200px] shadow-xl border border-slate-700 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Proyectado</p>
                            <p className="text-3xl font-black text-white">Q{analisisFinanciero.costo_proyectado_total?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-soft-blue dark:border-slate-700 shadow-inner relative overflow-hidden flex flex-col">
                <div className="px-10 py-6 bg-white/40 dark:bg-slate-900/40 border-b-[3px] border-soft-blue/30 dark:border-slate-700 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Visualización de Horario</h2>
                        <span className="px-4 py-1.5 bg-pastel-blue/20 dark:bg-sky-900/30 text-pastel-blue-dark dark:text-sky-400 rounded-full text-xs font-black uppercase tracking-widest border border-pastel-blue/30 dark:border-sky-800">
                            {cursoActuales.length} CURSOS
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDescargarPDF} className="flex items-center gap-2 px-6 py-3 bg-white/60 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-[2px] border-soft-blue/30 dark:border-slate-600 rounded-xl font-bold hover:bg-white dark:hover:bg-slate-600 hover:shadow-md transition-all active:scale-95">
                            <FileDown size={18} /> PDF
                        </button>
                        <button onClick={() => handleGuardarHorario(seleccion, opcionSeleccionada)} disabled={guardando} className="flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-sky-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-sky-700 shadow-lg active:scale-95 disabled:opacity-50">
                            {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Guardar
                        </button>
                    </div>
                </div>

                <div ref={captureRef} className="p-10 flex-1 overflow-auto custom-scrollbar">
                    <div className="min-w-[1000px] border-[2px] border-soft-blue/20 dark:border-slate-700 rounded-2xl bg-white dark:!bg-slate-900 overflow-hidden shadow-inner">
                        {/* We use HorarioVisualizer with compact=true because this page has its own controls */}
                        <HorarioVisualizer
                            horario={{ horario: cursoActuales }}
                            vista={vista}
                            compact={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultadoHorario;
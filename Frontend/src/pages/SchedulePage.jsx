import { useState, useEffect } from "react";
import { Calendar, User, ArrowRight, Play, Eye, Settings, Briefcase, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api/apiConfig";

const SchedulePage = () => {
    const navigate = useNavigate();
    const [loadingOptimizado, setLoadingOptimizado] = useState(false);
    const [existeOptimizado, setExisteOptimizado] = useState(false);
    const [existeCustom, setExisteCustom] = useState(false);
    const [usuarioData, setUsuarioData] = useState({});

    // Configuración algoritmo genético
    const [configGen, setConfigGen] = useState(() => {
        const savedConfig = localStorage.getItem("configGen_IA");
        return savedConfig ? JSON.parse(savedConfig) : {
            salarioMeta: 0,
            trabaja: false,
            horaInicio: "",
            horaFin: ""
        };
    });

    useEffect(() => {
        localStorage.setItem("configGen_IA", JSON.stringify(configGen));
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUsuarioData(user);

            // Verificar existencia de horarios previos
            if (user.carne) {
                const opt = localStorage.getItem(`SIOA_optimizado_${user.carne}`);
                const cust = localStorage.getItem(`SIOA_progreso_${user.carne}`);
                setExisteOptimizado(!!opt);
                setExisteCustom(!!cust);
            }
        }
    }, [configGen]);

    const validateInputs = () => {
        // 1. Validar Salario
        const salario = parseFloat(configGen.salarioMeta);
        if (isNaN(salario) || salario < 0) {
            alert("El salario no puede ser negativo.");
            return false;
        }
        if (salario > 50000) {
            alert("El salario máximo permitido es 50,000.");
            return false;
        }

        // 2. Validar Horas (si trabaja)
        if (configGen.trabaja) {
            if (!configGen.horaInicio || !configGen.horaFin) {
                alert("Debes definir hora de entrada y salida.");
                return false;
            }
            // Validación simple de formato 24h
            const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
            if (!timeRegex.test(configGen.horaInicio) || !timeRegex.test(configGen.horaFin)) {
                alert("Formato de hora inválido. Usa formato 24h (HH:MM).");
                return false;
            }
        }

        // 3. Chequeo Anti-SQLi / XSS
        const dangerousChars = /[<>;'"/=\\]/;
        const dangerousKeywords = /\b(script|select|drop|delete|update|insert|alert)\b/i;

        const allValues = [configGen.salarioMeta, configGen.horaInicio, configGen.horaFin].join(" ");
        if (dangerousChars.test(allValues) || dangerousKeywords.test(allValues)) {
            alert("Entrada rechazada por caracteres de seguridad no permitidos.");
            return false;
        }

        return true;
    };

    const cleanNumberInput = (val) => {
        return val.replace(/[^0-9.]/g, '');
    };

    const handleGenerarOptimizado = async () => {
        if (!validateInputs()) return;

        setLoadingOptimizado(true);
        try {
            const timeToMin = (strTime) => {
                if (!strTime) return 0;
                const [h, m] = strTime.split(':').map(Number);
                return h * 60 + m;
            };

            const configPayload = {
                ...configGen,
                horaInicio: timeToMin(configGen.horaInicio),
                horaFin: timeToMin(configGen.horaFin)
            };

            const response = await fetch(`${API_URL}/generar_horario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario: usuarioData.carne,
                    configGen: configPayload
                }),
            });

            const data = await response.json();
            if (response.ok) {
                const storageKey = `SIOA_optimizado_${usuarioData.carne}`;
                localStorage.setItem(storageKey, JSON.stringify({ horarios: data.horarios, fecha: new Date().toISOString() }));
                navigate('/resultado-horario', {
                    state: { tipo: 'optimizado', datosHorario: { horarios: data.horarios } }
                });
            } else {
                alert("Error: " + (data.error || "No se pudo generar"));
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setLoadingOptimizado(false);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="text-center space-y-2 mb-12 bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-8 shadow-sm">
                <h1 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Diseña tu Próximo Semestre
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                    Elige entre la potencia de nuestra IA para optimizar tu tiempo y finanzas, o toma el control total manualmente.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* IA Generator Card */}
                <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-soft-blue dark:border-slate-700/50 shadow-inner overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <div className="h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                    <div className="p-8">
                        <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/30 rounded-xl flex items-center justify-center mb-6 text-violet-600 dark:text-violet-300 group-hover:scale-110 transition-transform">
                            <User size={28} />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Asistente Inteligente</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">
                            Nuestro algoritmo analiza tu progreso y costo de oportunidad para sugerirte la carga ideal.
                        </p>

                        {/* Config Form */}
                        <div className="bg-white/50 dark:bg-slate-700/40 rounded-xl p-6 border border-soft-blue/50 dark:border-slate-600/50 mb-8 space-y-4 shadow-inner">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Settings size={14} /> Configuración Base
                            </h3>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Meta Salarial (Q)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">Q</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50000"
                                        value={configGen.salarioMeta}
                                        onChange={(e) => {
                                            const val = cleanNumberInput(e.target.value);
                                            setConfigGen({ ...configGen, salarioMeta: val })
                                        }}
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        className="w-full pl-8 pr-4 py-2 bg-white/60 dark:bg-slate-800 border-[2px] border-soft-blue/50 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-200 dark:text-slate-200 shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">¿Trabajas actualmente?</label>
                                <input
                                    type="checkbox"
                                    checked={configGen.trabaja}
                                    onChange={(e) => setConfigGen({ ...configGen, trabaja: e.target.checked })}
                                    className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 dark:bg-slate-800 dark:border-slate-600"
                                />
                            </div>

                            {configGen.trabaja && (
                                <div className="grid grid-cols-2 gap-4 animate-slide-in">
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Entrada</label>
                                        <input type="time" className="w-full p-2 bg-white dark:!bg-slate-800 border border-pastel-blue/20 dark:border-slate-600 rounded-lg text-sm dark:text-white dark:color-scheme-dark"
                                            value={configGen.horaInicio}
                                            onChange={(e) => setConfigGen({ ...configGen, horaInicio: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Salida</label>
                                        <input type="time" className="w-full p-2 bg-white dark:!bg-slate-800 border border-pastel-blue/20 dark:border-slate-600 rounded-lg text-sm dark:text-white dark:color-scheme-dark"
                                            value={configGen.horaFin}
                                            onChange={(e) => setConfigGen({ ...configGen, horaFin: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleGenerarOptimizado}
                            disabled={loadingOptimizado}
                            className="w-full py-4 bg-slate-900 dark:bg-violet-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loadingOptimizado ? "Calculando Rutas..." : "Generar Rutas Óptimas"}
                            {!loadingOptimizado && <ArrowRight size={18} />}
                        </button>

                        {existeOptimizado && (
                            <button
                                onClick={() => navigate('/resultado-horario', { state: { tipo: 'optimizado' } })}
                                className="w-full py-3 mt-4 text-violet-600 dark:text-violet-400 font-medium hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <Eye size={16} /> Ver último horario generado
                            </button>
                        )}
                    </div>
                </div>

                {/* Manual Card */}
                <div className="bg-white/50 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-soft-blue dark:border-slate-700/50 shadow-inner overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col">
                    <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-300 group-hover:scale-110 transition-transform">
                            <Calendar size={28} />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Modo Manual</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 flex-1">
                            Utiliza nuestro Semáforo de Carga Académica para seleccionar cursos manualmente y validar la dificultad.
                        </p>

                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-6 border border-emerald-100/50 dark:border-emerald-800/30 mb-8 shadow-inner">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-emerald-100/80">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Control total de horarios
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-emerald-100/80">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Validación de prerrequisitos
                                </li>
                                <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-emerald-100/80">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Alertas de sobrecarga
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={() => navigate('/semaforo')}
                            className="w-full py-4 bg-white/60 dark:bg-slate-700 border border-soft-blue/50 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-black hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            Ir al Planificador Manual
                        </button>

                        {existeCustom && (
                            <button
                                onClick={() => navigate('/resultado-horario', { state: { tipo: 'custom' } })}
                                className="w-full py-3 mt-4 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors text-sm"
                            >
                                Ver último horario guardado
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulePage;

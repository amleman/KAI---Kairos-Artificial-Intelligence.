import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, BookOpen, HelpCircle, Sparkles, Trash2, User, Bot, X, AlertTriangle, Copy, Check, ArrowUp, Info, Zap, Lightbulb } from 'lucide-react';
import API_URL from '../api/apiConfig';

const EfectoMecanografia = ({ texto }) => {
    const [textoMostrado, setTextoMostrado] = useState('');

    useEffect(() => {
        const caracteres = Array.from(texto);
        let i = 0;
        setTextoMostrado('');
        const velocidad = caracteres.length > 100 ? 5 : 15;
        const timer = setInterval(() => {
            if (i < caracteres.length) {
                const char = caracteres[i];
                setTextoMostrado((prev) => prev + char);
                i++;
            } else {
                clearInterval(timer);
            }
        }, velocidad);
        return () => clearInterval(timer);
    }, [texto]);

    return <span className="whitespace-pre-wrap">{textoMostrado}</span>;
};

const ChatbotAcademico = () => {
    const mensajeInicial = {
        tipo: 'bot',
        texto: '👋 ¡Hola! Soy tu asistente académico de SIOA.\n\n✨ Puedo ayudarte con:\n\n📖 Información de cursos\n📋 Prerrequisitos\n🔍 Búsqueda de cursos\n📚 Cursos por semestre\n✅ Cursos sin prerequisitos\n⭐ Y mucho más...\n\n¿En qué puedo ayudarte? 😊',
        timestamp: new Date().toISOString()
    };

    const cargarMensajes = () => {
        try {
            const mensajesGuardados = localStorage.getItem('chatbot_mensajes');
            if (mensajesGuardados) {
                const mensajes = JSON.parse(mensajesGuardados);
                return mensajes.map(m => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
            }
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
        }
        return [mensajeInicial];
    };

    const [mensajes, setMensajes] = useState(cargarMensajes());
    const [inputMensaje, setInputMensaje] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarModalLimpiar, setMostrarModalLimpiar] = useState(false);
    const [mostrarModalAyuda, setMostrarModalAyuda] = useState(false);
    const [mensajeCopiado, setMensajeCopiado] = useState(null);
    const [mostrarScrollTop, setMostrarScrollTop] = useState(false);
    const mensajesContainerRef = useRef(null);
    const mensajesIniciales = useRef(cargarMensajes().length);

    useEffect(() => {
        try {
            const mensajesParaGuardar = mensajes.map(m => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
            }));
            localStorage.setItem('chatbot_mensajes', JSON.stringify(mensajesParaGuardar));
        } catch (error) {
            console.error('Error al guardar mensajes:', error);
        }
    }, [mensajes]);

    useEffect(() => {
        if (mensajes.length > mensajesIniciales.current && mensajesContainerRef.current) {
            mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight;
        }
    }, [mensajes]);

    useEffect(() => {
        const handleScroll = () => {
            if (mensajesContainerRef.current) {
                const scrollTop = mensajesContainerRef.current.scrollTop;
                setMostrarScrollTop(scrollTop > 300);
            }
        };
        const container = mensajesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const copiarMensaje = (texto, index) => {
        navigator.clipboard.writeText(texto).then(() => {
            setMensajeCopiado(index);
            setTimeout(() => setMensajeCopiado(null), 2000);
        });
    };

    const scrollToTop = () => {
        if (mensajesContainerRef.current) {
            mensajesContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const obtenerUsuarioActivo = () => {
        try {
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed.carne) return parsed.carne;
            }
            return localStorage.getItem('usuario') || '';
        } catch (e) {
            return localStorage.getItem('usuario') || '';
        }
    };

    const mostrarAyuda = async () => {
        setMostrarModalAyuda(false);
        const nuevoMensaje = { tipo: 'usuario', texto: 'ayuda', timestamp: new Date() };
        setMensajes(prev => [...prev, nuevoMensaje]);
        setCargando(true);
        try {
            const response = await fetch(`${API_URL}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pregunta: 'ayuda', usuario: obtenerUsuarioActivo() })
            });
            const data = await response.json();
            const mensajeBot = { tipo: 'bot', texto: data.respuesta, intent: data.intent, confianza: data.confianza, timestamp: new Date() };
            setMensajes(prev => [...prev, mensajeBot]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setCargando(false);
        }
    };

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!inputMensaje.trim()) return;
        const nuevoMensajeUsuario = { tipo: 'usuario', texto: inputMensaje, timestamp: new Date() };
        setMensajes(prev => [...prev, nuevoMensajeUsuario]);
        setInputMensaje('');
        setCargando(true);
        try {
            const response = await fetch(`${API_URL}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pregunta: inputMensaje, usuario: obtenerUsuarioActivo() })
            });
            const data = await response.json();
            await new Promise(resolve => setTimeout(resolve, 800)); // Ligeramente más rápido
            const mensajeBot = { tipo: 'bot', texto: data.respuesta, intent: data.intent, confianza: data.confianza, timestamp: new Date() };
            setMensajes(prev => [...prev, mensajeBot]);
        } catch (error) {
            console.error('Error:', error);
            const mensajeError = { tipo: 'bot', texto: '😅 Disculpa, hubo un error. Intenta de nuevo.', timestamp: new Date() };
            setMensajes(prev => [...prev, mensajeError]);
        } finally {
            setCargando(false);
        }
    };

    const confirmarLimpiar = () => {
        const nuevoMensajeInicial = { ...mensajeInicial, timestamp: new Date() };
        setMensajes([nuevoMensajeInicial]);
        mensajesIniciales.current = 1;
        localStorage.removeItem('chatbot_mensajes');
        setMostrarModalLimpiar(false);
    };

    const sugerirPregunta = (pregunta) => setInputMensaje(pregunta);

    const formatearHora = (timestamp) => {
        try {
            const fecha = timestamp instanceof Date ? timestamp : new Date(timestamp);
            return fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
        }
    };

    const preguntasSugeridas = [
        "Información de Estructura de datos",
        "Prerrequisitos de Física 2",
        "Cursos del quinto semestre",
        "¿Qué cursos puedo llevar?",
        "Mis cursos aprobados",
    ];

    const tipsRapidos = [
        "Usa el código del curso (Ej: 770) para búsquedas exactas.",
        "Puedes preguntar por 'prerrequisitos de [curso]'.",
        "Pregunta 'qué cursos puedo llevar' para ver sugerencias."
    ];

    return (
        <div className="animate-fadeIn w-full max-w-[1600px] mx-auto h-[calc(100vh-140px)] min-h-[600px] grid grid-cols-1 lg:grid-cols-4 gap-6 p-4">

            {/* --- COLUMN 1: Main Chat Area (3/4 width on large screens) --- */}
            <div className="lg:col-span-3 flex flex-col h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden relative transition-all duration-300">

                {/* Chat Header */}
                <div className="p-5 border-b border-white/40 dark:border-slate-700/50 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-500 rounded-2xl text-white shadow-lg shadow-sky-500/30">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                Asistente Académico
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] rounded-full font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">Online</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Resuelvo tus dudas sobre el pensum</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {mensajes.length > 1 && (
                            <button
                                onClick={() => setMostrarModalLimpiar(true)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Limpiar Chat"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages Container */}
                <div ref={mensajesContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-slate-50/50 dark:!bg-slate-900/50">
                    {mensajes.map((mensaje, index) => {
                        const esBot = mensaje.tipo === 'bot';
                        const esUltimo = index === mensajes.length - 1;
                        return (
                            <div key={index} className={`flex items-start gap-3 ${!esBot ? 'flex-row-reverse' : ''} animate-fadeIn`}>
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 ${esBot ? 'bg-sky-500 text-white' : 'bg-slate-800 dark:bg-slate-700 text-white'}`}>
                                    {esBot ? <Bot size={18} /> : <User size={18} />}
                                </div>
                                <div className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 rounded-2xl relative group shadow-sm text-sm md:text-base leading-relaxed ${esBot
                                    ? 'bg-white dark:!bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none'
                                    : 'bg-sky-600 dark:bg-sky-600 text-white rounded-tr-none shadow-sky-200/50 dark:shadow-none'
                                    }`}>

                                    {esBot && esUltimo ? <EfectoMecanografia texto={mensaje.texto} /> : <span className="whitespace-pre-wrap">{mensaje.texto}</span>}

                                    <div className={`text-[10px] mt-1.5 font-bold opacity-60 flex justify-end ${esBot ? 'text-slate-400 dark:text-slate-500' : 'text-sky-100'}`}>
                                        {formatearHora(mensaje.timestamp)}
                                    </div>

                                    {esBot && (
                                        <button
                                            onClick={() => copiarMensaje(mensaje.texto, index)}
                                            className="absolute -right-8 top-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-sky-600 dark:text-slate-500 dark:hover:text-sky-400 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700"
                                            title="Copiar"
                                        >
                                            {mensajeCopiado === index ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {cargando && (
                        <div className="flex items-start gap-3 animate-fadeIn">
                            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shadow-sm">
                                <Bot size={16} className="text-white" />
                            </div>
                            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                <div className="flex gap-1.5 pt-1">
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.5s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Container */}
                <div className="p-4 md:p-6 bg-white dark:!bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                    <form onSubmit={enviarMensaje} className="relative flex gap-3 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={inputMensaje}
                            onChange={(e) => setInputMensaje(e.target.value)}
                            placeholder="Escribe tu pregunta sobre cursos o requisitos..."
                            className="flex-1 pl-6 pr-4 py-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 focus:border-sky-400 dark:focus:border-sky-500 outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-inner"
                            disabled={cargando}
                        />
                        <button
                            type="submit"
                            disabled={cargando || !inputMensaje.trim()}
                            className="px-6 md:px-8 bg-sky-600 dark:bg-sky-500 text-white rounded-2xl font-bold hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-sky-200 dark:shadow-sky-900/30 active:scale-95 group"
                        >
                            {cargando ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />}
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-3 font-medium">
                        Tu asistente aprende constantemente. Verifica la información importante.
                    </p>
                </div>

                {mostrarScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="absolute bottom-28 right-8 p-3 bg-white dark:!bg-black text-sky-600 dark:text-white rounded-full shadow-lg border border-sky-100 dark:border-slate-800 hover:bg-sky-50 dark:hover:bg-slate-900 transition-all z-10"
                    >
                        <ArrowUp size={20} />
                    </button>
                )}
            </div>

            {/* --- COLUMN 2: Widgets & Info (1/4 width on large screens) --- */}
            <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pb-4">

                {/* Widget 1: Suggestions */}
                {/* Widget 1: Suggestions */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-4 border border-white/40 dark:border-slate-700/50 shadow-lg">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-sky-500 dark:text-sky-400" />
                        Sugerencias Rápidas
                    </h3>
                    <div className="flex flex-col gap-2">
                        {preguntasSugeridas.map((pregunta, idx) => (
                            <button
                                key={idx}
                                onClick={() => sugerirPregunta(pregunta)}
                                className="text-left px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600/50 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-200 dark:hover:border-sky-800 transition-all font-medium active:scale-98"
                            >
                                {pregunta}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Widget 2: Tips */}
                {/* Widget 2: Tips */}
                <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-sky-200 relative overflow-hidden min-h-[320px] flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none" />
                    <h3 className="text-sm font-black text-sky-100 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                        <Lightbulb size={16} />
                        Tips de búsqueda
                    </h3>
                    <ul className="space-y-4 relative z-10">
                        {tipsRapidos.map((tip, idx) => (
                            <li key={idx} className="text-xs md:text-sm font-medium opacity-90 leading-relaxed flex items-start gap-2">
                                <span className="mt-1 w-1.5 h-1.5 bg-sky-200 rounded-full shrink-0" />
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Widget 3: Help / About */}
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-slate-700/50 shadow-sm mt-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">IA Académica</h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Versión 2.0.0</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Este asistente utiliza información oficial de los pensums de ingeniería para responderte.
                    </p>
                    <button
                        onClick={() => setMostrarModalAyuda(true)}
                        className="mt-4 w-full py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
                    >
                        Ver Documentación
                    </button>
                </div>

            </div>

            {/* Modals (kept same logic, updated styles) */}
            {mostrarModalLimpiar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:!bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform scale-100 transition-all border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 dark:text-rose-400">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">¿Limpiar conversación?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Se borrará todo el historial actual. No podrás deshacerlo.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setMostrarModalLimpiar(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">Cancelar</button>
                            <button onClick={confirmarLimpiar} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/30 transition-all">Limpiar</button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarModalAyuda && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:!bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 to-blue-600" />
                        <button onClick={() => setMostrarModalAyuda(false)} className="absolute top-6 right-6 p-2 text-slate-300 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={24} /></button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400">
                                <Info size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">Guía de Uso</h3>
                                <p className="text-xs text-sky-600 dark:text-sky-400 font-bold uppercase tracking-wider">Capacidades del Bot</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-8">
                            {[
                                { icon: Sparkles, text: "Información detallada de cursos" },
                                { icon: BookOpen, text: "Consultar prerrequisitos" },
                                { icon: Zap, text: "Listar cursos por semestre" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                                    <item.icon size={16} className="text-sky-500 dark:text-sky-400" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-xl border border-sky-100 dark:border-sky-800 text-sky-800 dark:text-sky-300 text-xs font-medium leading-relaxed mb-6">
                            <strong>💡 Tip Pro:</strong> Intenta preguntar por códigos específicos para obtener respuestas más precisas al instante.
                        </div>

                        <button onClick={mostrarAyuda} className="w-full py-3.5 bg-sky-600 dark:bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-700 dark:hover:bg-sky-600 shadow-lg shadow-sky-200 dark:shadow-sky-900/30 transition-all active:scale-95">
                            Ver todos los comandos
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotAcademico;

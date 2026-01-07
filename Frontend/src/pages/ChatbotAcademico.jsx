import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, BookOpen, HelpCircle, Sparkles, Trash2, User, Bot, X, AlertTriangle, Copy, Check, ArrowUp, Info } from 'lucide-react';

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
            const response = await fetch('http://127.0.0.1:8000/chatbot', {
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
            const response = await fetch('http://127.0.0.1:8000/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pregunta: inputMensaje, usuario: obtenerUsuarioActivo() })
            });
            const data = await response.json();
            await new Promise(resolve => setTimeout(resolve, 1500));
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

    return (
        <div className="animate-fadeIn space-y-4 h-[calc(100vh-140px)] flex flex-col">
            {/* Header Glass Card */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-soft-blue shadow-inner px-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-pastel-blue rounded-xl text-slate-700 shadow-sm">
                            <MessageCircle size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Asistente Académico</h1>
                            <p className="text-slate-500 font-medium text-sm">Resuelvo tus dudas sobre el pensum y requisitos.</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMostrarModalAyuda(true)}
                            className="p-2.5 bg-white/60 text-slate-600 rounded-xl border-[2px] border-soft-blue/50 hover:bg-white hover:shadow-md transition-all"
                            title="Ayuda"
                        >
                            <HelpCircle size={20} />
                        </button>
                        {mensajes.length > 1 && (
                            <button
                                onClick={() => setMostrarModalLimpiar(true)}
                                className="p-2.5 bg-white/60 text-red-400 rounded-xl border-[2px] border-soft-blue/50 hover:bg-red-50 hover:text-red-500 hover:shadow-md transition-all"
                                title="Limpiar"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-2xl border border-soft-blue shadow-inner flex flex-col overflow-hidden relative mt-4">
                <div ref={mensajesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {mensajes.map((mensaje, index) => {
                        const esBot = mensaje.tipo === 'bot';
                        const esUltimo = index === mensajes.length - 1;
                        return (
                            <div key={index} className={`flex items-start gap-3 ${!esBot ? 'flex-row-reverse' : ''} animate-fadeIn`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${esBot ? 'bg-pastel-blue text-slate-700' : 'bg-slate-900 text-white'}`}>
                                    {esBot ? <Bot size={20} /> : <User size={20} />}
                                </div>
                                <div className={`max-w-[80%] lg:max-w-[70%] p-4 rounded-xl relative group shadow-sm ${esBot ? 'bg-white border-[2px] border-soft-blue/20 text-slate-800 rounded-tl-none'
                                    : 'bg-slate-900 text-white rounded-tr-none shadow-xl'
                                    }`}>
                                    <div className="text-sm leading-relaxed">
                                        {esBot && esUltimo ? <EfectoMecanografia texto={mensaje.texto} /> : <span className="whitespace-pre-wrap">{mensaje.texto}</span>}
                                    </div>
                                    <div className={`text-[10px] mt-2 font-bold opacity-40 ${esBot ? 'text-slate-400' : 'text-slate-300'}`}>
                                        {formatearHora(mensaje.timestamp)}
                                    </div>
                                    {esBot && (
                                        <button
                                            onClick={() => copiarMensaje(mensaje.texto, index)}
                                            className="absolute -right-10 top-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/60 rounded-lg border-[2px] border-soft-blue/30 text-slate-400 hover:text-slate-600"
                                        >
                                            {mensajeCopiado === index ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {cargando && (
                        <div className="flex items-start gap-3 animate-fadeIn">
                            <div className="w-10 h-10 rounded-xl bg-pastel-blue flex items-center justify-center shadow-sm">
                                <Bot size={20} className="text-slate-700" />
                            </div>
                            <div className="bg-white border-[2px] border-soft-blue/20 p-4 rounded-xl rounded-tl-none shadow-sm">
                                <div className="flex gap-1.5 pt-1">
                                    <div className="w-1.5 h-1.5 bg-pastel-blue-dark rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-pastel-blue-dark rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-pastel-blue-dark rounded-full animate-bounce [animation-delay:-0.5s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestions Bar */}
                {mensajes.length <= 2 && (
                    <div className="px-6 py-4 bg-white/20 border-t-[2px] border-soft-blue/20">
                        <div className="flex flex-wrap gap-2">
                            {preguntasSugeridas.map((pregunta, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sugerirPregunta(pregunta)}
                                    className="px-4 py-2 text-xs bg-white/60 border-[2px] border-soft-blue/30 text-slate-600 rounded-lg hover:bg-soft-blue/40 transition-all font-black uppercase tracking-tighter"
                                >
                                    {pregunta}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={enviarMensaje} className="p-6 bg-white/40 border-t-[3px] border-soft-blue/30 backdrop-blur-xl">
                    <div className="flex gap-4 relative">
                        <input
                            type="text"
                            value={inputMensaje}
                            onChange={(e) => setInputMensaje(e.target.value)}
                            placeholder="Hazme una pregunta sobre tus cursos..."
                            className="flex-1 px-6 py-4 bg-white/60 border-[2px] border-soft-blue/30 rounded-xl focus:ring-2 focus:ring-pastel-blue focus:border-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400 shadow-inner"
                            disabled={cargando}
                        />
                        <button
                            type="submit"
                            disabled={cargando || !inputMensaje.trim()}
                            className="px-8 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                        >
                            {cargando ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                            <span className="hidden sm:inline">Enviar</span>
                        </button>

                        {mostrarScrollTop && (
                            <button
                                onClick={scrollToTop}
                                type="button"
                                className="absolute -top-16 right-0 p-3 bg-white border-[2px] border-soft-blue/50 text-slate-600 rounded-xl shadow-xl hover:scale-110 transition-all"
                            >
                                <ArrowUp size={20} />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Modals */}
            {mostrarModalLimpiar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full border border-soft-blue shadow-2xl text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">¿Limpiar Chat?</h3>
                        <p className="text-slate-500 text-sm mb-8">Esta acción borrará todo el historial de esta conversación.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setMostrarModalLimpiar(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">No</button>
                            <button onClick={confirmarLimpiar} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all">Si, borrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ayuda */}
            {mostrarModalAyuda && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-soft-blue shadow-2xl relative">
                        <button onClick={() => setMostrarModalAyuda(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                        <div className="w-16 h-16 bg-pastel-blue rounded-xl flex items-center justify-center mb-6 text-slate-700 shadow-inner">
                            <Info size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Guía del Asistente</h3>
                        <div className="space-y-4 text-sm text-slate-600 mb-8">
                            <div className="p-4 bg-white/60 rounded-xl border-[2px] border-soft-blue/20">
                                <p className="font-black text-slate-800 mb-2 uppercase text-[10px] tracking-widest">📚 Puedes preguntarme:</p>
                                <ul className="space-y-2 font-medium">
                                    <li className="flex gap-2 items-center"><Sparkles size={14} className="text-pastel-blue-dark" /> Información de cursos</li>
                                    <li className="flex gap-2 items-center"><Sparkles size={14} className="text-pastel-blue-dark" /> Consultar prerrequisitos</li>
                                    <li className="flex gap-2 items-center"><Sparkles size={14} className="text-pastel-blue-dark" /> Cursos por semestre o créditos</li>
                                </ul>
                            </div>
                            <div className="bg-soft-blue/30 p-4 rounded-xl font-black italic border-[2px] border-soft-blue/50 text-blue-700 text-xs">
                                "Tip: Usa el código del curso (Ej: 0770) para respuestas más exactas."
                            </div>
                        </div>
                        <button onClick={mostrarAyuda} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-xl transition-all">Ver lista detallada</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotAcademico;

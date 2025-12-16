import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, BookOpen, HelpCircle, Sparkles, Trash2, User, Bot, X, AlertTriangle, Copy, Check, ArrowUp, Info } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const EfectoMecanografia = ({ texto }) => {
    const [textoMostrado, setTextoMostrado] = useState('');

    useEffect(() => {
        // Dividir el texto correctamente respetando emojis (pares sustitutos)
        const caracteres = Array.from(texto);
        let i = 0;
        setTextoMostrado('');

        // Velocidad de escritura
        const velocidad = caracteres.length > 100 ? 5 : 15;

        const timer = setInterval(() => {
            if (i < caracteres.length) {
                const char = caracteres[i]; // Capturar valor actual antes de incrementar
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
    // Cargar mensajes guardados o usar mensaje inicial
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
                // Convertir strings de fecha de vuelta a objetos Date
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

    // Guardar mensajes en localStorage cuando cambian
    useEffect(() => {
        try {
            const mensajesParaGuardar = mensajes.map(m => {
                // Asegurar que timestamp sea válido
                let timestampGuardar;
                if (m.timestamp instanceof Date) {
                    timestampGuardar = m.timestamp.toISOString();
                } else if (typeof m.timestamp === 'string') {
                    timestampGuardar = m.timestamp;
                } else {
                    timestampGuardar = new Date().toISOString();
                }

                return {
                    ...m,
                    timestamp: timestampGuardar
                };
            });
            localStorage.setItem('chatbot_mensajes', JSON.stringify(mensajesParaGuardar));
        } catch (error) {
            console.error('Error al guardar mensajes:', error);
        }
    }, [mensajes]);

    // Scroll automático
    useEffect(() => {
        if (mensajes.length > mensajesIniciales.current && mensajesContainerRef.current) {
            mensajesContainerRef.current.scrollTop = mensajesContainerRef.current.scrollHeight;
        }
    }, [mensajes]);

    // Detectar scroll para mostrar botón "scroll to top"
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

    // Función para copiar mensaje
    const copiarMensaje = (texto, index) => {
        navigator.clipboard.writeText(texto).then(() => {
            setMensajeCopiado(index);
            setTimeout(() => setMensajeCopiado(null), 2000);
        });
    };

    // Función para scroll to top
    const scrollToTop = () => {
        if (mensajesContainerRef.current) {
            mensajesContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    // Función helper para obtener usuario activo (carné)
    const obtenerUsuarioActivo = () => {
        try {
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsed = JSON.parse(userData);
                if (parsed.carne) return parsed.carne;
            }
            // Fallback a historial antiguo o usuario simple
            return localStorage.getItem('usuario') || '';
        } catch (e) {
            return localStorage.getItem('usuario') || '';
        }
    };

    // Función para mostrar ayuda rápida
    const mostrarAyuda = async () => {
        setMostrarModalAyuda(false);
        const nuevoMensaje = {
            tipo: 'usuario',
            texto: 'ayuda',
            timestamp: new Date()
        };
        setMensajes(prev => [...prev, nuevoMensaje]);
        setCargando(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pregunta: 'ayuda',
                    usuario: obtenerUsuarioActivo()
                })
            });

            const data = await response.json();
            const mensajeBot = {
                tipo: 'bot',
                texto: data.respuesta,
                intent: data.intent,
                confianza: data.confianza,
                timestamp: new Date()
            };
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

        const nuevoMensajeUsuario = {
            tipo: 'usuario',
            texto: inputMensaje,
            timestamp: new Date()
        };

        setMensajes(prev => [...prev, nuevoMensajeUsuario]);
        setInputMensaje('');
        setCargando(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pregunta: inputMensaje,
                    usuario: obtenerUsuarioActivo()
                })
            });

            const data = await response.json();

            // Simular delay de "escribiendo..." (1.5 segundos)
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mensajeBot = {
                tipo: 'bot',
                texto: data.respuesta,
                intent: data.intent,
                confianza: data.confianza,
                timestamp: new Date()
            };
            setMensajes(prev => [...prev, mensajeBot]);
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            const mensajeError = {
                tipo: 'bot',
                texto: '😅 Disculpa, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
                timestamp: new Date()
            };
            setMensajes(prev => [...prev, mensajeError]);
        } finally {
            setCargando(false);
        }
    };

    const confirmarLimpiar = () => {
        const nuevoMensajeInicial = {
            tipo: 'bot',
            texto: '👋 ¡Hola! Soy tu asistente académico de SIOA.\n\n✨ Puedo ayudarte con:\n\n📖 Información de cursos\n📋 Prerrequisitos\n🔍 Búsqueda de cursos\n📚 Cursos por semestre\n✅ Cursos sin prerequisitos\n⭐ Y mucho más...\n\n¿En qué puedo ayudarte? 😊',
            timestamp: new Date()
        };
        setMensajes([nuevoMensajeInicial]);
        mensajesIniciales.current = 1;
        localStorage.removeItem('chatbot_mensajes'); // Limpiar localStorage
        setMostrarModalLimpiar(false);
    };

    const sugerirPregunta = (pregunta) => {
        setInputMensaje(pregunta);
    };

    // Helper para formatear timestamp de manera segura
    const formatearHora = (timestamp) => {
        try {
            const fecha = timestamp instanceof Date ? timestamp : new Date(timestamp);
            return fecha.toLocaleTimeString('es-GT', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return new Date().toLocaleTimeString('es-GT', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const preguntasSugeridas = [
        "Información de Estructura de datos",
        "Prerrequisitos de Física 2",
        "Buscar cursos de programación",
        "Cursos del quinto semestre",
        "Cursos de 7 créditos",
        "¿Para qué sirve 0774?",
        "¿Qué cursos puedo llevar?",
        "Mi progreso",
        "Mis cursos aprobados",
        "Qué aprobé del tercer semestre",
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex flex-col">
            <Navbar />

            <div className="container mx-auto px-4 py-4 max-w-5xl flex-grow">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-3 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                                <MessageCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Asistente Académico</h1>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3" />
                                    Consulta información sobre cursos
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMostrarModalAyuda(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-200"
                                title="Ver ayuda"
                            >
                                <Info className="w-4 h-4" />
                                Ayuda
                            </button>
                            {mensajes.length > 1 && (
                                <button
                                    onClick={() => setMostrarModalLimpiar(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
                                    title="Limpiar conversación"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat */}
                <div className="bg-white rounded-2xl shadow-lg flex flex-col border border-gray-100" style={{ height: 'calc(100vh - 220px)', minHeight: '550px' }}>
                    <div ref={mensajesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {mensajes.map((mensaje, index) => {
                            const esBot = mensaje.tipo === 'bot';
                            const esUltimo = index === mensajes.length - 1;

                            return (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 w-full ${!esBot ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                                >
                                    {/* Avatar del Bot (Izquierda) */}
                                    {esBot && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-sm">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                    )}

                                    {/* Burbuja del Mensaje */}
                                    <div
                                        className={`max-w-[75%] px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed relative group ${esBot
                                            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-tr-none shadow-md'
                                            }`}
                                    >
                                        {/* Contenido (Typing solo en último mensaje del bot) */}
                                        {esBot && esUltimo ? (
                                            <EfectoMecanografia texto={mensaje.texto} />
                                        ) : (
                                            <span className="whitespace-pre-wrap">{mensaje.texto}</span>
                                        )}

                                        {/* Botón Copiar (Solo Bot) */}
                                        {esBot && (
                                            <button
                                                onClick={() => copiarMensaje(mensaje.texto, index)}
                                                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded"
                                                title="Copiar mensaje"
                                            >
                                                {mensajeCopiado === index ? (
                                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                )}
                                            </button>
                                        )}

                                        {/* Metadatos (Hora) */}
                                        <p className={`text-[10px] mt-1.5 text-right ${esBot ? 'text-gray-400' : 'text-blue-100'}`}>
                                            {formatearHora(mensaje.timestamp)}
                                        </p>
                                    </div>

                                    {/* Avatar del Usuario (Derecha) */}
                                    {!esBot && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center shadow-sm">
                                            <User className="w-5 h-5 text-gray-700" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {cargando && (
                            <div className="flex gap-3 justify-start animate-fadeIn">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {mensajes.length <= 2 && (
                        <div className="px-6 pb-3 border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-gray-600" />
                                <p className="text-xs font-medium text-gray-700">Sugerencias:</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {preguntasSugeridas.map((pregunta, index) => (
                                    <button
                                        key={index}
                                        onClick={() => sugerirPregunta(pregunta)}
                                        className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border border-blue-200 hover:scale-105 transform"
                                    >
                                        {pregunta}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botón Scroll to Top */}
                    {mostrarScrollTop && (
                        <button
                            onClick={scrollToTop}
                            className="absolute bottom-24 right-6 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 animate-fadeIn z-10"
                            title="Volver arriba"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    )}

                    <form onSubmit={enviarMensaje} className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputMensaje}
                                onChange={(e) => setInputMensaje(e.target.value)}
                                placeholder="Escribe tu pregunta aquí..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                disabled={cargando}
                            />
                            <button
                                type="submit"
                                disabled={cargando || !inputMensaje.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 hover:scale-105 transform"
                            >
                                {cargando ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                Enviar
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                            <strong>💡 Tip:</strong> Usa el código (ej: 0770) o nombre completo para mejor precisión.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />

            {/* Modal de confirmación amigable */}
            {
                mostrarModalLimpiar && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl transform animate-scaleIn">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">¿Limpiar conversación?</h3>
                                    <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                                </div>
                            </div>

                            <p className="text-gray-700 mb-6">
                                Se eliminará todo el historial de mensajes y comenzarás una nueva conversación.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMostrarModalLimpiar(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarLimpiar}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                                >
                                    Sí, limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Ayuda */}
            {mostrarModalAyuda && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl transform animate-scaleIn max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Info className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">¿Qué puedo hacer?</h3>
                            </div>
                            <button
                                onClick={() => setMostrarModalAyuda(false)}
                                className="p-1 hover:bg-gray-100 rounded transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="text-sm text-gray-700 space-y-3">
                            <div>
                                <p className="font-semibold mb-2">📚 Funcionalidades:</p>
                                <ul className="space-y-1 ml-4">
                                    <li>• Información completa de cursos</li>
                                    <li>• Consultar prerrequisitos</li>
                                    <li>• Buscar cursos por nombre</li>
                                    <li>• Ver cursos por semestre</li>
                                    <li>• Cursos sin prerrequisitos</li>
                                    <li>• Consultar créditos</li>
                                    <li>• Y mucho más...</li>
                                </ul>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="font-semibold mb-1">💡 Ejemplos:</p>
                                <p className="text-xs text-gray-600">- "Prerrequisitos de Inteligencia Artificial 1"</p>
                                <p className="text-xs text-gray-600">- "Cursos del quinto semestre"</p>
                                <p className="text-xs text-gray-600">- "Buscar programación"</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setMostrarModalAyuda(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={mostrarAyuda}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                            >
                                Ver lista completa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }

                .typing-indicator {
                    display: flex;
                    gap: 4px;
                }

                .typing-indicator span {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #9ca3af;
                    animation: typing 1.4s infinite;
                }

                .typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.7;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }
            `}</style>
        </div >
    );
};

export default ChatbotAcademico;

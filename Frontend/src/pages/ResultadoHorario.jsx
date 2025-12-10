import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, User, Monitor, AlertCircle, LayoutGrid, List, Save, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "../components/Navbar";

const ResultadoHorario = () => {
    const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Recuperar Usuario
  const getUserData = () => {
      try { return JSON.parse(localStorage.getItem("userData") || "{}"); } 
      catch { return {}; }
  };
  const userData = getUserData();
  const carnet = userData.carne || "guest";

  // 2. Definir claves de almacenamiento
  const KEY_CUSTOM = `sioha_progreso_${carnet}`;
  const KEY_OPTIMIZADO = `sioha_optimizado_${carnet}`;

  // 3. Determinar qué tipo de horario estamos viendo
  // Si viene en el state ('optimizado' o 'custom'), úsalo. Si no, default a 'custom'.
  const tipoHorario = location.state?.tipo || 'custom'; 

  // 4. Estado de Datos (Lógica Híbrida)
  const [datos] = useState(() => {
    // A. Si viene fresco por navegación, úsalo
    if (location.state?.datosHorario) {
      return location.state.datosHorario;
    }
    
    // B. Fallback: Leer del LocalStorage CORRECTO según el tipo
    try {
      const targetKey = tipoHorario === 'optimizado' ? KEY_OPTIMIZADO : KEY_CUSTOM;
      const saved = localStorage.getItem(targetKey);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Normalizar estructura
        if (tipoHorario === 'optimizado') {
            return parsed; // Guardamos { horarios: [...] }
        } else {
            // Estructura del semáforo
            return Array.isArray(parsed.horarioGenerado) 
                ? { horarios: parsed.horarioGenerado } 
                : parsed.horarioGenerado;
        }
      }
    } catch (e) {
      console.error("Error recuperando:", e);
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
    const cursoActuales = horariosDisponibles[opcionSeleccionada] || [];

    // --------------------------------------------------------------------------
    // CONFIGURACIÓN DE COLORES DINÁMICOS
    // --------------------------------------------------------------------------
    const PALETA_COLORES = [
        { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-800", hover: "hover:bg-blue-200" },
        { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-800", hover: "hover:bg-emerald-200" },
        { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-800", hover: "hover:bg-purple-200" },
        { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-800", hover: "hover:bg-orange-200" },
        { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-800", hover: "hover:bg-pink-200" },
        { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-800", hover: "hover:bg-indigo-200" },
        { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-800", hover: "hover:bg-teal-200" },
        { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-800", hover: "hover:bg-rose-200" },
        { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-800", hover: "hover:bg-cyan-200" },
        { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-800", hover: "hover:bg-amber-200" },
    ];

    // Mapa para mantener consistencia de color por código de curso en la vista actual
    const getColorCurso = (codigo, index) => {
        const colorIndex = index % PALETA_COLORES.length;
        return PALETA_COLORES[colorIndex];
    };

    // --------------------------------------------------------------------------
    // LÓGICA CALENDARIO
    // --------------------------------------------------------------------------
    const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
    const HORA_INICIO_DIA = 7 * 60; // 7:00 AM
    const HORA_FIN_DIA = 21 * 60;   // 9:00 PM
    // Altura en píxeles de una hora (60 min)
    const ALTURA_HORA = 80; 
    const PIXELES_POR_MINUTO = ALTURA_HORA / 60;

    const getEstilosEvento = (inicioMin, finMin) => {
        const top = (inicioMin - HORA_INICIO_DIA) * PIXELES_POR_MINUTO;
        const height = (finMin - inicioMin) * PIXELES_POR_MINUTO;
        return { top: `${top}px`, height: `${height}px` };
    };

    const handleDescargarPDF = async () => {
        if (!cursoActuales.length) {
            setMensajeExito("No hay cursos para exportar.");
            setTimeout(() => setMensajeExito(""), 2500);
            return;
        }

        if (!captureRef.current) {
            setMensajeExito("No se pudo capturar la vista.");
            setTimeout(() => setMensajeExito(""), 2500);
            return;
        }

        try {
            const canvas = await html2canvas(captureRef.current, {
                scale: 2, // mejor nitidez
                useCORS: true,
                windowWidth: captureRef.current.scrollWidth,
                windowHeight: captureRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Si la imagen es más alta que la página, escala para que quepa
            const finalWidth = imgHeight > pageHeight ? (pageHeight * canvas.width) / canvas.height : imgWidth;
            const finalHeight = imgHeight > pageHeight ? pageHeight : imgHeight;
            const offsetX = (pageWidth - finalWidth) / 2;
            const offsetY = 10; // pequeño margen superior

            pdf.addImage(imgData, "PNG", offsetX, offsetY, finalWidth, finalHeight, undefined, "FAST");
            pdf.save(`horario_opcion_${opcionSeleccionada + 1}.pdf`);
        } catch (err) {
            console.error(err);
            setMensajeExito("No se pudo generar el PDF.");
            setTimeout(() => setMensajeExito(""), 3000);
        }
    };

    const handleGuardarHorario = async () => {
        // 1. Obtener usuario (asegúrate que la key 'usuario' existe en localStorage)
        const usuarioActual = localStorage.getItem("usuario"); 
        
        if (!usuarioActual) {
        setMensajeExito("Error: No se detectó usuario logueado.");
        setTimeout(() => setMensajeExito(""), 3000);
        return;
        }

        setGuardando(true);

        // 2. Identificar cuál opción está viendo el usuario actualmente
        const horarioA_Guardar = horariosDisponibles[opcionSeleccionada];

        try {
        const response = await fetch("http://127.0.0.1:8000/guardar_horario_final", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            usuario: usuarioActual,
            horario: horarioA_Guardar,
            nombre: `Opción ${opcionSeleccionada + 1} - Semestre 2025` // Puedes personalizar esto
            }),
        });

        const result = await response.json();

        if (response.ok) {
            setMensajeExito("✅ " + result.message);
            setTimeout(() => setMensajeExito(""), 3000);
            // Opcional: Redirigir al dashboard
            // navigate("/dashboard");
        } else {
            setMensajeExito("❌ Error al guardar: " + result.error);
            setTimeout(() => setMensajeExito(""), 3000);
        }
        } catch (error) {
        console.error(error);
        setMensajeExito("Error de conexión con el servidor.");
        setTimeout(() => setMensajeExito(""), 3000);
        } finally {
        setGuardando(false);
        }
    };

    return (
        <>
        <Navbar />
        
        {/* Toast de notificación */}
        {mensajeExito && (
            <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-500 font-bold text-sm">✓</span>
            </div>
            <span className="font-medium">{mensajeExito}</span>
            </div>
        )}
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
            
            <div className="space-y-6">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <button 
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 shadow-md transition-all"
                    >
                    <ArrowLeft size={24} />
                    </button>
                    <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-indigo-600" />
                        {tipoHorario === 'optimizado' ? 'Horario Sugerido (IA)' : 'Horario Personalizado'}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Se encontraron {horariosDisponibles.length} combinaciones posibles
                    </p>
                    </div>
                </div>

                {/* CONTROLES */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                    {horariosDisponibles.map((_, index) => (
                        <button
                        key={index}
                        onClick={() => setOpcionSeleccionada(index)}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm border ${
                            opcionSeleccionada === index
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-indigo-300"
                        }`}
                        >
                        Opción {index + 1}
                        </button>
                    ))}
                    </div>

                    <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-200 flex">
                    <button
                        onClick={() => setVista("calendario")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        vista === "calendario" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        <LayoutGrid size={16} /> Calendario
                    </button>
                    <button
                        onClick={() => setVista("lista")}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        vista === "lista" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        <List size={16} /> Lista
                    </button>
                    </div>
                </div>

                {/* CONTENEDOR PRINCIPAL */}
                <div className="bg-white rounded-xl shadow-xl border border-indigo-50 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-800">
                    Detalle de la Opción {opcionSeleccionada + 1}
                    </h2>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full border border-indigo-200">
                    {cursoActuales.length} Cursos
                    </span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleDescargarPDF}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                    >
                        <FileDown size={18} />
                        Descargar PDF
                    </button>
                    <button 
                        onClick={handleGuardarHorario}
                        disabled={guardando}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            guardando 
                            ? "bg-gray-300 cursor-not-allowed text-gray-500"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                        }`}
                    >
                        <Save size={18} />
                        Guardar Horario
                    </button>
                </div>
                </div>

                <div ref={captureRef} className="p-6">
                <div className="text-2xl font-bold text-gray-800 mb-5 text-center">Opción {opcionSeleccionada + 1}</div>
                {vista === "calendario" ? (
                    // ---------------------------------------------------
                    // VISTA TIPO CALENDARIO CORREGIDA
                    // ---------------------------------------------------
                    <div className="overflow-x-auto">
                    <div className="min-w-[800px] border border-gray-200 rounded-lg bg-white flex flex-col">
                        
                        {/* 1. Header de Días (Fila Superior) */}
                        <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                        {/* Espacio para la columna de hora (ancho fijo w-16 = 4rem = 64px) */}
                        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-100"></div>
                        
                        {/* Grid de días */}
                        <div className="flex-1 grid grid-cols-6">
                            {DIAS_SEMANA.map(dia => (
                            <div key={dia} className="p-3 text-center text-sm font-bold text-gray-700 border-r border-gray-200 last:border-r-0">
                                {dia}
                            </div>
                            ))}
                        </div>
                        </div>

                        {/* 2. Cuerpo del Calendario (Flex Row: Horas + Grid Eventos) */}
                        <div className="flex relative" style={{ height: (15 * ALTURA_HORA) + 'px' }}>
                        
                        {/* A. Columna de Horas (Sidebar Fijo) */}
                        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col relative">
                            {Array.from({ length: 15 }).map((_, i) => {
                            const hora = 7 + i;
                            return (
                                <div 
                                key={i} 
                                className="w-full text-center text-xs font-semibold text-gray-500 relative border-b border-gray-100"
                                style={{ height: `${ALTURA_HORA}px` }}
                                >
                                {/* Texto posicionado arriba - 8px para centrarlo con la línea */}
                                <span className="absolute -top-2 left-0 right-0">{hora}:00</span>
                                </div>
                            );
                            })}
                        </div>

                        {/* B. Grid de Eventos y Líneas Guía */}
                        <div className="flex-1 relative">
                            {/* Líneas de fondo horizontales */}
                            {Array.from({ length: 15 }).map((_, i) => (
                            <div 
                                key={i}
                                className="absolute w-full border-b border-gray-100"
                                style={{ top: `${(i) * ALTURA_HORA}px`, height: '1px' }}
                            />
                            ))}

                            {/* Líneas verticales (separadores de días) */}
                            <div className="absolute inset-0 grid grid-cols-6 h-full pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="border-r border-gray-100 h-full last:border-r-0"></div>
                            ))}
                            </div>

                            {/* EVENTOS POSICIONADOS ABSOLUTAMENTE */}
                            {cursoActuales.map((curso, index) => {
                            const diasArray = parsearDias(curso.Dias_Lista);
                            const estiloPos = getEstilosEvento(curso.Inicio_Min, curso.Final_Min);
                            const colores = getColorCurso(curso.Codigo, index);

                            return diasArray.map((diaNombre, diaIdx) => {
                                const diaLimpio = diaNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                // Encontramos el índice de columna (0 = Lunes, 5 = Sábado)
                                const colIndex = DIAS_SEMANA.findIndex(d => 
                                d.toLowerCase().includes(diaLimpio.toLowerCase().substring(0, 3))
                                );

                                if (colIndex === -1) return null;

                                return (
                                <div
                                    key={`${curso.Codigo}-${index}-${diaIdx}`}
                                    className={`absolute m-1 p-2 rounded-md border text-xs shadow-sm cursor-pointer transition-all hover:z-20 hover:scale-[1.02] hover:shadow-lg flex flex-col justify-start overflow-hidden
                                    ${colores.bg} ${colores.border} ${colores.text} ${colores.hover}
                                    `}
                                    style={{
                                    left: `${(colIndex * 100) / 6}%`, // Ancho relativo a las 6 columnas de días
                                    width: `${100 / 6}%`,
                                    top: estiloPos.top,
                                    height: estiloPos.height
                                    }}
                                    title={`${curso.Nombre_Limpio} (${curso.Inicio} - ${curso.Final})`}
                                >
                                    <div className="font-bold leading-tight mb-1">
                                    {curso.Nombre_Limpio}
                                    </div>
                                    <div className="text-[10px] opacity-90 leading-tight">
                                    {curso.Edificio} - {curso.Salon}
                                    </div>
                                    <div className="text-[10px] mt-1 font-mono bg-white/30 rounded px-1 w-max">
                                    {curso.Inicio} - {curso.Final}
                                    </div>
                                </div>
                                );
                            });
                            })}
                        </div>
                        </div>
                    </div>
                    </div>

                ) : (
                    // ---------------------------------------------------
                    // VISTA TIPO LISTA (Manteniendo colores dinámicos)
                    // ---------------------------------------------------
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {cursoActuales.map((curso, idx) => {
                        const diasArray = parsearDias(curso.Dias_Lista);
                        const colores = getColorCurso(curso.Codigo, idx);

                        return (
                        <div 
                            key={`${curso.Codigo}-${idx}`} 
                            className={`flex flex-col bg-white border rounded-xl hover:shadow-md transition-all duration-300 relative overflow-hidden group ${colores.border}`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colores.bg.replace('bg-', 'bg-opacity-100 bg-').replace('100', '500')}`}></div>

                            <div className="p-5 pl-7 flex-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-gray-100 text-gray-600 font-mono text-xs px-2 py-1 rounded border border-gray-200">
                                {curso.Codigo}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${colores.bg} ${colores.text}`}>
                                {curso.Modalidad || "N/A"}
                                </span>
                            </div>

                            <h3 className="font-bold text-gray-800 text-lg leading-tight mb-4 group-hover:text-indigo-600 transition-colors">
                                {curso.Nombre_Limpio}
                            </h3>

                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-start gap-3">
                                <Clock size={18} className="text-indigo-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                    {curso.Inicio} - {curso.Final}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                    {diasArray.map((dia, i) => (
                                        <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                        {dia}
                                        </span>
                                    ))}
                                    </div>
                                </div>
                                </div>
                                <div className="flex items-center gap-3">
                                <MapPin size={18} className="text-green-500 shrink-0" />
                                <span>{curso.Edificio} - Salón {curso.Salon}</span>
                                </div>
                                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
                                <User size={18} className="text-gray-400 shrink-0" />
                                <span className="text-xs font-medium text-gray-700 line-clamp-1">
                                    {curso.Catedratico}
                                </span>
                                </div>
                            </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-xs text-gray-500">Sección</span>
                            <span className="font-bold text-gray-800 text-lg bg-white w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 shadow-sm">
                                {curso.Seccion}
                            </span>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                )}

                {cursoActuales.length === 0 && (
                    <div className="p-10 text-center text-gray-500 flex flex-col items-center">
                    <AlertCircle className="text-gray-300 mb-3" size={48} />
                    <p>No hay datos para visualizar en esta opción.</p>
                    </div>
                )}
                </div>
            </div>
            </div>
            </div>
        </div>
        </>
    );
};

export default ResultadoHorario;
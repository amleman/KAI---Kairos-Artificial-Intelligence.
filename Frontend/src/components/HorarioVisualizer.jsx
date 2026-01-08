import { useState, useMemo } from "react";
import { Calendar, List, Clock, MapPin, User, AlertCircle } from "lucide-react";

const HorarioVisualizer = ({ horario, compact = false, vista: vistaProp }) => {
  // 1. Hooks siempre arriba
  const [vistaInternal, setVistaInternal] = useState("calendario");
  const vista = vistaProp || vistaInternal;
  const setVista = vistaProp ? () => { } : setVistaInternal;

  // 2. Helpers (Funciones auxiliares)
  const getDato = (obj, keys) => {
    for (let k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return "";
  };

  const toMinutos = (valor) => {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    if (String(valor).includes(":")) {
      const [h, m] = valor.split(":").map(Number);
      return (h * 60) + m;
    }
    return parseInt(valor) || 0;
  };

  const formatearHora = (valor) => {
    const min = toMinutos(valor);
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Getters seguros
  const getInicio = (c) => formatearHora(getDato(c, ["Inicio", "inicio", "Inicio_Min"]));
  const getFinal = (c) => formatearHora(getDato(c, ["Final", "final", "Final_Min"]));
  const getNombre = (c) => getDato(c, ["Nombre_Limpio", "Nombre", "nombre", "Nombre de Curso"]);
  const getSeccion = (c) => getDato(c, ["Seccion", "seccion", "Salon"]);
  const getEdificio = (c) => getDato(c, ["Edificio", "edificio", "Lugar"]);
  const getProfe = (c) => getDato(c, ["Catedratico", "catedratico"]);

  const parsearDias = (c) => {
    const raw = getDato(c, ["Dias_Lista", "Dias", "dias"]);
    try {
      if (Array.isArray(raw)) return raw;
      if (!raw) return [];
      // Si viene como string de python lista "['Lunes']"
      const limpio = String(raw).replace(/'/g, '"');
      try {
        return JSON.parse(limpio);
      } catch {
        return String(raw).replace(/[[\]']/g, "").replace(/"/g, "").split(",").map(d => d.trim()).filter(d => d.length > 0 && d !== "None");
      }
    } catch { return []; }
  };

  /* ----------------------------------------------------------------------------------
   *  LÓGICA DE EXTRACCIÓN DE DATOS (Soporte estructura nueva y vieja)
   * ---------------------------------------------------------------------------------- */
  // Si viene de DB (data_json) usualmente trae {analisis_financiero:..., horario:[...]}
  // Si viene del generador custom, puede ser array directo o objeto.

  let rawData = horario;
  // Unwrap si viene dentro de "horario" otra vez (caso raro pero posible)
  if (horario?.horario && Array.isArray(horario.horario)) {
    rawData = horario;
  } else if (Array.isArray(horario)) {
    rawData = { horario: horario };
  }

  const listaHorario = rawData?.horario || (Array.isArray(rawData) ? rawData : []);
  const analisis = rawData?.analisis_financiero || null;
  const fechaGuardado = rawData?.fecha_guardado || horario?.fecha_guardado; // Pasado como prop si existe

  const [mostrarAnalisis, setMostrarAnalisis] = useState(false);

  // 3. useMemo (El Hook conflictivo) MOVIDO ARRIBA
  const rangoHorario = useMemo(() => {
    let minHora = 24;
    let maxHora = 0;

    const listaSegura = listaHorario || [];

    listaSegura.forEach(c => {
      const inicioM = toMinutos(getDato(c, ["Inicio", "inicio", "Inicio_Min"]));
      const finalM = toMinutos(getDato(c, ["Final", "final", "Final_Min"]));

      if (inicioM > 0) minHora = Math.min(minHora, Math.floor(inicioM / 60));
      if (finalM > 0) maxHora = Math.max(maxHora, Math.ceil(finalM / 60));
    });

    if (minHora >= maxHora) { minHora = 7; maxHora = 20; }

    return {
      start: Math.max(6, minHora - 1),
      end: Math.min(23, maxHora + 1)
    };
  }, [listaHorario]);

  // 4. AHORA SÍ: El Early Return (Validación de renderizado)
  // Esto debe ir DESPUÉS de todos los hooks
  if (!listaHorario || listaHorario.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 mt-4">
        <AlertCircle className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={32} />
        <p className="text-gray-500 dark:text-gray-400">No hay cursos en este horario guardado.</p>
      </div>
    );
  }

  // --- POSICIONAMIENTO CSS ---
  const getPosicionCalendario = (horaInicio, horaFin) => {
    const minInicio = toMinutos(horaInicio);
    const minFin = toMinutos(horaFin);

    const startOffset = minInicio - (rangoHorario.start * 60);
    const duracion = minFin - minInicio;
    const PIXELS_PER_HOUR = 5;

    return {
      top: `${(startOffset / 60) * PIXELS_PER_HOUR}rem`,
      height: `${(duracion / 60) * PIXELS_PER_HOUR}rem`
    };
  };

  const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const PALETA = [
    "bg-blue-100 border-l-4 border-blue-500 text-blue-900",
    "bg-green-100 border-l-4 border-green-500 text-green-900",
    "bg-purple-100 border-l-4 border-purple-500 text-purple-900",
    "bg-orange-100 border-l-4 border-orange-500 text-orange-900",
    "bg-pink-100 border-l-4 border-pink-500 text-pink-900",
  ];

  const horasAMostrar = Array.from(
    { length: rangoHorario.end - rangoHorario.start + 1 },
    (_, i) => i + rangoHorario.start
  );

  return (
    <div className="bg-white dark:!bg-black border-gray-200 dark:border-slate-800 rounded-xl shadow-lg border overflow-hidden flex flex-col h-full transition-colors duration-300">
      {/* Header */}
      {/* Header (Always Visible) */}
      <div className={`bg-gray-50 dark:!bg-black border-b border-gray-200 dark:border-slate-800 flex justify-between items-center shrink-0 ${compact ? 'px-4 py-2' : 'px-6 py-4'}`}>
        <div className="flex flex-col">
          <h3 className={`font-bold text-gray-700 dark:text-slate-200 flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
            <Calendar className="text-gray-500 dark:text-slate-400" size={compact ? 16 : 20} /> Visualización
          </h3>
          {fechaGuardado && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium ml-7">
              Guardado: {new Date(fechaGuardado).toLocaleDateString()} {new Date(fechaGuardado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex p-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
          <button
            onClick={() => setVista("calendario")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${vista === "calendario" ? "bg-slate-900 dark:bg-slate-700 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
          >
            <Calendar size={14} /> Calendario
          </button>
          <button
            onClick={() => setVista("lista")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${vista === "lista" ? "bg-slate-900 dark:bg-slate-700 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
          >
            <List size={14} /> Lista
          </button>
        </div>
      </div>

      <div className="p-6 overflow-auto bg-white dark:!bg-black">
        {vista === "lista" ? (
          /* --- VISTA LISTA --- */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listaHorario.map((curso, idx) => (
              <div key={idx} className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition bg-white dark:bg-slate-800 dark:border-slate-700 group`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm line-clamp-2 leading-tight group-hover:line-clamp-none transition-all">
                      {getNombre(curso)}
                    </h4>
                  </div>
                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-200 shrink-0">
                    Sec. {getSeccion(curso)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" />
                    <span className="font-mono font-medium">{getInicio(curso)} - {getFinal(curso)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-red-500" />
                    <span>{getEdificio(curso)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-green-500" />
                    <span className="truncate">{getProfe(curso)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-gray-400 flex gap-2">
                  <Calendar size={14} />
                  {parsearDias(curso).join(", ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- VISTA CUADRÍCULA (NUEVA ESTRUCTURA) --- */
          <div className="overflow-x-auto bg-white dark:!bg-black">
            <div className="min-w-[800px]">
              {/* Grid Header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                <div className="bg-slate-800 dark:bg-slate-900 text-white rounded-lg p-3 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center">
                  Horario
                </div>
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="bg-slate-800 dark:bg-slate-900 text-white rounded-lg p-3 text-center text-xs font-bold uppercase tracking-widest">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="space-y-2">
                {[
                  { start: "07:00", end: "07:50" },
                  { start: "07:50", end: "08:40" },
                  { start: "09:00", end: "09:50" },
                  { start: "09:50", end: "10:40" },
                  { start: "11:00", end: "11:50" },
                  { start: "11:50", end: "12:40" },
                  { start: "14:00", end: "14:50" },
                  { start: "14:50", end: "15:40" },
                  { start: "16:00", end: "16:50" },
                  { start: "16:50", end: "17:40" },
                  { start: "18:00", end: "18:50" },
                  { start: "18:50", end: "19:40" },
                ].map((bloque, idx) => (
                  <div key={idx} className="grid grid-cols-7 gap-2">
                    {/* Time Label */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center">
                      {bloque.start} - {bloque.end}
                    </div>

                    {/* Columns for Days */}
                    {DIAS_SEMANA.map((dia) => {
                      // Buscar curso que coincida con este día y bloque
                      const cursoFound = listaHorario.find((c) => {
                        const diasCurso = parsearDias(c).map(d => d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
                        const diaActual = dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().substring(0, 3);
                        // Chequear dia
                        const esDia = diasCurso.some(d => d.includes(diaActual));
                        if (!esDia) return false;

                        // Chequear intersección de tiempo
                        const inicioC = toMinutos(getInicio(c));
                        const finalC = toMinutos(getFinal(c));
                        const inicioB = toMinutos(bloque.start);
                        const finalB = toMinutos(bloque.end);

                        // Hay traslape significativo?
                        return (inicioC < finalB && finalC > inicioB);
                      });

                      if (cursoFound) {
                        const colorIndex = listaHorario.indexOf(cursoFound) % PALETA.length;
                        // Extraer color base para aplicar estilos
                        const colorClasses = PALETA[colorIndex]; // ej: "bg-blue-100 ..."
                        // Extraer solo clases de bg para tener más control si se requiere, o usar la paleta directo
                        // Usaremos la paleta directa pero con bordes redondeados consistentes

                        return (
                          <div key={dia} className={`rounded-xl p-3 flex flex-col justify-center relative group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${colorClasses}`}>
                            <h4 className="font-black text-[11px] leading-tight mb-1 line-clamp-2 md:line-clamp-none">
                              {getNombre(cursoFound)}
                            </h4>
                            <div className="flex justify-between items-center opacity-80">
                              <span className="text-[10px] font-bold">{getSeccion(cursoFound)}</span>
                              <span className="text-[9px] font-mono">{getInicio(cursoFound)}</span>
                            </div>

                            {/* Tooltip nativo o custom */}
                            <div className="absolute inset-0 z-10" title={`${getNombre(cursoFound)}\n${getEdificio(cursoFound)}\n${getProfe(cursoFound)}`} />
                          </div>
                        );
                      }

                      // Empty Slot
                      return (
                        <div key={dia} className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50" />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- FOOTER CON ANÁLISIS FINANCIERO (独立 / Independent) --- */}
      {analisis && !compact && (
        <div className="bg-gray-50 dark:!bg-black border-t border-gray-200 dark:border-slate-800">
          {mostrarAnalisis && (
            <div className={`px-6 py-4 animate-fadeIn ${compact ? 'text-xs' : ''}`}>
              <div className={`rounded-lg border-l-4 p-4 ${analisis.tipo_alerta === 'success' ? 'bg-green-50 dark:!bg-black border-green-500' : 'bg-red-50 dark:!bg-black border-red-500'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`font-bold ${analisis.tipo_alerta === 'success' ? 'text-green-800 dark:!text-green-300' : 'text-red-800 dark:!text-red-300'}`}>
                      {analisis.mensaje_alerta}
                    </h4>
                    <p className={`text-gray-600 dark:!text-gray-100 mt-1 ${compact ? 'text-[10px]' : 'text-sm'}`}>
                      {analisis.tipo_alerta === 'success'
                        ? "¡Gran elección! Esta combinación maximiza tus oportunidades académicas."
                        : `Impacto económico estimado: Q${analisis.costo_proyectado_total?.toLocaleString()} por retraso de ${analisis.meses_atraso_estimado} meses.`
                      }
                    </p>
                  </div>
                  <span className={compact ? 'text-lg' : 'text-2xl'}>
                    {analisis.tipo_alerta === 'success' ? '💰' : '📉'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setMostrarAnalisis(!mostrarAnalisis)}
            className={`w-full text-sm font-semibold text-gray-500 dark:!text-white hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-900 transition-colors border-t border-transparent hover:border-gray-200 dark:hover:border-slate-700 flex items-center justify-center gap-2 ${compact ? 'py-2 text-[11px]' : 'py-3'}`}
          >
            {mostrarAnalisis ? "Ocultar Análisis" : "Ver Impacto Económico (Costo de Oportunidad)"}
          </button>
        </div>
      )}

    </div>
  );
};

export default HorarioVisualizer;
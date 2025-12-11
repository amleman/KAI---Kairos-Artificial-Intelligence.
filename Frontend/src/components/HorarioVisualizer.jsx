import { useState, useMemo } from "react";
import { Calendar, List, Clock, MapPin, User, AlertCircle } from "lucide-react";

const HorarioVisualizer = ({ horario }) => {
  // 1. Hooks siempre arriba
  const [vista, setVista] = useState("calendario");

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
  const getNombre = (c) => getDato(c, ["Nombre_Limpio", "Nombre", "nombre"]);
  const getSeccion = (c) => getDato(c, ["Seccion", "seccion", "Salon"]);
  const getEdificio = (c) => getDato(c, ["Edificio", "edificio", "Lugar"]);
  const getProfe = (c) => getDato(c, ["Catedratico", "catedratico"]);

  const parsearDias = (c) => {
    const raw = getDato(c, ["Dias_Lista", "Dias", "dias"]);
    try {
      if (Array.isArray(raw)) return raw;
      if (!raw) return [];
      const limpio = String(raw).replace(/[[\]']/g, "").replace(/"/g, "");
      return limpio.split(",").map(d => d.trim()).filter(d => d.length > 0 && d !== "None");
    } catch { return []; }
  };

  // 3. useMemo (El Hook conflictivo) MOVIDO ARRIBA
  // Nota: Usamos (horario || []) para evitar error si horario es null dentro del hook
  const rangoHorario = useMemo(() => {
      let minHora = 24;
      let maxHora = 0;
      
      const listaSegura = horario || [];

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
  }, [horario]);

  // 4. AHORA SÍ: El Early Return (Validación de renderizado)
  // Esto debe ir DESPUÉS de todos los hooks
  if (!horario || horario.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-4">
        <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
        <p className="text-gray-500">No hay cursos en este horario guardado.</p>
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Calendar className="text-gray-500" size={20}/> Visualización
        </h3>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button onClick={() => setVista("calendario")} className={`p-2 rounded-md ${vista === "calendario" ? "bg-blue-100 text-blue-600" : "text-gray-400"}`} title="Calendario"><Calendar size={18} /></button>
          <button onClick={() => setVista("lista")} className={`p-2 rounded-md ${vista === "lista" ? "bg-blue-100 text-blue-600" : "text-gray-400"}`} title="Lista"><List size={18} /></button>
        </div>
      </div>

      <div className="p-6 overflow-auto">
        {vista === "lista" ? (
          /* --- VISTA LISTA --- */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {horario.map((curso, idx) => (
              <div key={idx} className={`p-4 rounded-xl border shadow-sm hover:shadow-md transition bg-white group`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight group-hover:line-clamp-none transition-all">
                            {getNombre(curso)}
                        </h4>
                    </div>
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded border border-blue-200 shrink-0">
                        Sec. {getSeccion(curso)}
                    </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-blue-500"/> 
                        <span className="font-mono font-medium">{getInicio(curso)} - {getFinal(curso)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-red-500"/> 
                        <span>{getEdificio(curso)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-green-500"/> 
                        <span className="truncate">{getProfe(curso)}</span>
                    </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 text-xs font-bold text-gray-500 flex gap-2">
                    <Calendar size={14} />
                    {parsearDias(curso).join(", ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- VISTA CALENDARIO --- */
          <div className="relative min-w-[700px]">
            <div className="pl-14"> 
              <div className="grid grid-cols-6 border-b-2 border-gray-200 mb-2 sticky top-0 bg-white z-20">
                {DIAS_SEMANA.map(d => (
                    <div key={d} className="py-2 text-center font-bold text-gray-700 text-sm uppercase tracking-wide">{d}</div>
                ))}
              </div>

              <div className="relative border-l border-gray-200" style={{ height: `${horasAMostrar.length * 5}rem` }}>
                {horasAMostrar.map((hora, i) => (
                    <div key={i} className="absolute w-full border-t border-gray-100" style={{ top: `${i * 5}rem` }}>
                        <span className="absolute -left-14 -top-2.5 text-xs font-bold text-gray-400 w-12 text-right">
                            {hora}:00
                        </span>
                    </div>
                ))}

                {horario.map((curso, idx) => {
                    const dias = parsearDias(curso);
                    const horaI = getInicio(curso);
                    const horaF = getFinal(curso);
                    const seccion = getSeccion(curso);
                    const estiloPosicion = getPosicionCalendario(horaI, horaF);
                    const colorClase = PALETA[idx % PALETA.length];

                    return dias.map((diaNombre, dIdx) => {
                        const diaNorm = diaNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); 
                        const colIndex = DIAS_SEMANA.findIndex(d => d.startsWith(diaNorm));

                        if (colIndex === -1) return null;

                        return (
                            <div
                                key={`${idx}-${dIdx}`}
                                className={`absolute rounded-md p-2 text-xs shadow-sm hover:shadow-xl hover:scale-[1.02] hover:z-50 transition-all cursor-pointer flex flex-col justify-start overflow-hidden ${colorClase}`}
                                style={{
                                    top: estiloPosicion.top,
                                    height: estiloPosicion.height,
                                    left: `${(colIndex / 6) * 100}%`,
                                    width: `${(1/6) * 96}%`, 
                                    marginLeft: '2%'
                                }}
                                title={`${getNombre(curso)}\nSección: ${seccion}\n${horaI} - ${horaF}\n${getEdificio(curso)}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold leading-tight line-clamp-2 text-[11px]">
                                        {getNombre(curso)}
                                    </span>
                                    <span className="bg-white/50 px-1 rounded text-[10px] font-bold border border-black/10">
                                        {seccion}
                                    </span>
                                </div>
                                <div className="mt-1 text-[10px] opacity-90 font-medium flex flex-col gap-0.5">
                                    <span className="flex items-center gap-1">
                                        <Clock size={10}/> {horaI}-{horaF}
                                    </span>
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin size={10}/> {getEdificio(curso)}
                                    </span>
                                </div>
                            </div>
                        );
                    });
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HorarioVisualizer;
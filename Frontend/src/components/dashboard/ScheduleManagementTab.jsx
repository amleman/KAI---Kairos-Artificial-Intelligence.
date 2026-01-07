import React from "react";
import { Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ScheduleManagementTab = ({
    configGen,
    setConfigGen,
    loadingOptimizado,
    handleGenerarOptimizado,
    existeOptimizado,
    existeCustom,
}) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-left mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-blue-600" />
                    Gestión de Horarios
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                    Selecciona cómo deseas generar tu horario para el próximo semestre.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* OPCIÓN 1: HORARIO INTELIGENTE (IA) */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-shadow flex flex-col h-full">
                    {/* Header de la Tarjeta */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold mb-1">Horario Inteligente</h3>
                                <p className="text-blue-100 text-sm">IA + Análisis Financiero</p>
                            </div>
                        </div>
                    </div>

                    {/* Cuerpo de la Tarjeta */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                            <p className="text-gray-600 mb-4 text-sm">
                                La IA analizará tus prerrequisitos, promedio y <strong>costo de oportunidad</strong>.
                                Configura tu perfil para obtener la mejor ruta:
                            </p>

                            {/* --- FORMULARIO DE CONFIGURACIÓN --- */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-5 space-y-3">

                                {/* Input Salario */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                        Salario Meta (Q)
                                    </label>
                                    <input
                                        type="number"
                                        value={configGen.salarioMeta}
                                        onChange={(e) => setConfigGen({ ...configGen, salarioMeta: e.target.value })}
                                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                        placeholder="Ej. 5000"
                                    />
                                </div>

                                {/* Check Trabajo */}
                                <div className="flex items-center pt-1">
                                    <input
                                        id="check-trabaja"
                                        type="checkbox"
                                        checked={configGen.trabaja}
                                        onChange={(e) => setConfigGen({ ...configGen, trabaja: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="check-trabaja" className="ml-2 block text-sm text-gray-800 font-medium">
                                        Trabajo actualmente
                                    </label>
                                </div>

                                {/* Inputs de Horario Laboral (Condicional) */}
                                {configGen.trabaja && (
                                    <div className="pt-2 grid grid-cols-2 gap-2 animate-fadeIn">
                                        <div>
                                            <label className="text-xs text-gray-600 block mb-1">Entrada</label>
                                            <input
                                                type="time"
                                                value={configGen.horaInicio}
                                                onChange={(e) => setConfigGen({ ...configGen, horaInicio: e.target.value })}
                                                className="w-full text-sm border rounded p-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 block mb-1">Salida</label>
                                            <input
                                                type="time"
                                                value={configGen.horaFin}
                                                onChange={(e) => setConfigGen({ ...configGen, horaFin: e.target.value })}
                                                className="w-full text-sm border rounded p-1"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="space-y-3 mt-2">
                            <button
                                onClick={handleGenerarOptimizado}
                                disabled={loadingOptimizado}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loadingOptimizado ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Analizando...</span>
                                    </>
                                ) : (
                                    <>
                                        {/* <Play size={18} /> */}
                                        Generar con IA
                                    </>
                                )}
                            </button>

                            {existeOptimizado && (
                                <button
                                    onClick={() => navigate('/resultado-horario', { state: { tipo: 'optimizado' } })}
                                    className="w-full bg-white text-blue-700 border border-blue-200 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
                                >
                                    {/* <Eye size={18} /> */}
                                    Ver Último Generado
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* OPCIÓN 2: HORARIO PERSONALIZADO (SEMÁFORO) */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100 hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold mb-1">Horario Personalizado</h3>
                                <p className="text-green-100 text-sm">Control Manual + Semáforo</p>
                            </div>
                            {/* <List size={32} className="text-green-200" /> */}
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-6 text-sm">
                            Selecciona manualmente los cursos que deseas llevar. El <strong>Semáforo de Carga</strong> te alertará sobre la dificultad.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/semaforo')}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex justify-center items-center gap-2 shadow-md"
                            >
                                <Calendar size={18} />
                                Ir al Semáforo / Crear
                            </button>

                            {existeCustom && (
                                <button
                                    onClick={() => navigate('/resultado-horario', { state: { tipo: 'custom' } })}
                                    className="w-full bg-white text-green-700 border border-green-200 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors flex justify-center items-center gap-2"
                                >
                                    <Eye size={18} />
                                    Ver Último Manual
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ScheduleManagementTab;

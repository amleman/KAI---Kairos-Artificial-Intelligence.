import React from "react";

const GradesModal = ({
    showModalNotas,
    setShowModalNotas,
    cursosNuevos,
    notasTemp,
    setNotasTemp,
    confirmarNotas
}) => {
    if (!showModalNotas) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/50 ring-1 ring-white/50">
                <div className="bg-pastel-blue/20 p-6 border-b border-pastel-blue/10">
                    <h3 className="text-xl font-bold text-slate-800">Ingresa las notas</h3>
                    <p className="text-sm text-slate-500 mt-1">Solo de los cursos nuevos marcados como aprobados.</p>
                </div>
                <div className="p-6 space-y-4">
                    {cursosNuevos.map((curso) => (
                        <div key={curso.codigo} className="bg-white/60 p-4 rounded-xl border border-white/60 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="bg-pastel-blue text-slate-700 px-2 py-0.5 rounded-md text-xs font-bold border border-pastel-blue-dark/10">
                                    {curso.codigo}
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    {curso.creditos} créditos
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 mb-3 leading-tight">
                                {curso.nombre}
                            </p>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    placeholder="Nota (0-100)"
                                    className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-pastel-blue/50 focus:border-pastel-blue transition-all"
                                    value={notasTemp[curso.codigo] || ""}
                                    onChange={(e) => setNotasTemp({ ...notasTemp, [curso.codigo]: e.target.value })}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50/50 backdrop-blur-md flex flex-col sm:flex-row gap-4 border-t border-slate-100">
                    <button
                        onClick={() => setShowModalNotas(false)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmarNotas}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        Guardar Notas
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradesModal;

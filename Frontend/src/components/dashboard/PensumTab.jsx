import React from "react";
import { GraduationCap, UploadCloud, CheckCircle2, Award, AlertTriangle, Save, Eye } from "lucide-react";

const PensumTab = ({
    usuarioData,
    pensumPorSemestre,
    aprobados, // Array of codes
    toggleAprobado,
    puedeLlevar,
    guardarAprobados,
    cargarAprobadosDB,
    setTab,
    setShowUploadModal,
    setErrorUpload
}) => {
    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <GraduationCap className="text-blue-600" size={28} />
                Pensum - {usuarioData.carrera || "Ingeniería en Sistemas"}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
                Aquí encontraras los cursos de tu carrera por semestre,
                selecciona los cursos que ya has aprobado y guarda los cambios.
            </p>
            <br />

            <div className="flex flex-col sm:flex-row gap-3 mt-2 mb-6">
                <button
                    onClick={() => {
                        setShowUploadModal(true);
                        if (setErrorUpload) setErrorUpload("");
                    }}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                    <UploadCloud size={18} />
                    Cargar cursos aprobados con imágenes
                </button>
                <div className="flex-1 text-sm text-gray-600 bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                    Envía las capturas con el formato indicado para que la IA extraiga código, nombre y nota sin contar los "Aprobado" en tu promedio.
                </div>
            </div>

            <div className="space-y-6">
                {pensumPorSemestre.map((sem) => (
                    <div key={sem.nombre} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                                {sem.numero}
                            </span>
                            {sem.nombre} Semestre
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {sem.cursos.length === 0 && (
                                <p className="text-gray-500 col-span-4 text-center py-4">No hay cursos cargados.</p>
                            )}

                            {sem.cursos.map((curso) => {
                                const aprobado = aprobados.includes(curso.codigo);
                                const permitido = puedeLlevar(curso);

                                return (
                                    <div
                                        key={curso.codigo}
                                        onClick={() => (permitido ? toggleAprobado(curso.codigo) : null)}
                                        className={`p-3 rounded-lg border-2 transition-all ${aprobado
                                            ? "bg-green-50 border-green-500 shadow-md"
                                            : permitido
                                                ? "bg-white border-gray-300 hover:border-blue-400 hover:shadow-md cursor-pointer"
                                                : "bg-red-50 border-red-300 opacity-60 cursor-not-allowed"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${aprobado ? "bg-green-200 text-green-800" :
                                                permitido ? "bg-blue-100 text-blue-800" :
                                                    "bg-red-200 text-red-800"
                                                }`}>
                                                {curso.codigo}
                                            </span>
                                            {aprobado && <CheckCircle2 className="text-green-600" size={16} />}
                                        </div>
                                        <h4 className="font-bold text-xs text-gray-800 mb-1.5 line-clamp-2">{curso.nombre_completo}</h4>
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Award size={12} />
                                                {curso.creditos} créditos
                                            </span>
                                        </div>
                                        {!permitido && (
                                            <p className="text-xs text-red-700 mt-2 font-medium flex items-center gap-1">
                                                <AlertTriangle size={12} />
                                                Falta prerrequisito
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex gap-3">
                <button
                    onClick={guardarAprobados}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    Guardar Aprobados
                </button>
                <button
                    onClick={() => {
                        cargarAprobadosDB();
                        setTab("aprobados");
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Eye size={18} />
                    Ver Aprobados
                </button>
            </div>
        </div>
    );
};

export default PensumTab;

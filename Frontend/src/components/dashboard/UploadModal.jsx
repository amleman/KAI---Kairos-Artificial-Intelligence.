import React from "react";
import { X, Images, UploadCloud } from "lucide-react";
import formatoCursos from "../../assets/formato_cursos.svg";

const UploadModal = ({
    showUploadModal,
    setShowUploadModal,
    imagenesSeleccionadas,
    handleSeleccionImagenes,
    procesarImagenesAprobados,
    errorUpload,
    procesandoImagenes,
    inputImagenesRef
}) => {
    if (!showUploadModal) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/50 ring-1 ring-white/50">
                <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-white/50">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">Carga de notas con IA</h3>
                        <p className="text-slate-500 mt-2 text-sm">
                            Sube una captura de tus cursos en el portal. Nuestra IA extraerá automáticamente tus cursos y notas.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(false)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        aria-label="Cerrar modal de carga"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-pastel-blue/5 border border-pastel-blue/20 rounded-xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-slate-700 font-bold uppercase tracking-wider">
                                <Images size={16} className="text-pastel-blue-dark" />
                                <span>Guía de Formato</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Asegúrate de que las columnas de <span className="font-bold text-slate-700">Código, Nombre, Créditos y Nota</span> sean visibles. No te preocupes por headers cortados o cursos repetidos.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pastel-blue"></div>Solo formato de imagen (PNG, JPG).</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pastel-blue"></div>Cursos "Aprobados" sin nota numérica se ignoran para promedio.</li>
                            </ul>
                        </div>
                        <div className="bg-white/80 rounded-xl overflow-hidden shadow-sm border border-white/60 flex items-center justify-center">
                            <img src={formatoCursos} alt="Ejemplo de formato válido" className="w-full h-full max-h-60 object-contain p-4 opacity-90 hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <input
                            ref={inputImagenesRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleSeleccionImagenes}
                        />
                        <button
                            onClick={() => inputImagenesRef.current?.click()}
                            className="flex-1 sm:flex-none px-6 py-4 bg-white border-2 border-dashed border-slate-300 text-slate-600 font-bold rounded-xl hover:border-pastel-blue hover:text-pastel-blue-dark hover:bg-pastel-blue/5 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Images size={20} className="group-hover:scale-110 transition-transform" />
                            Seleccionar imágenes
                        </button>
                        <button
                            onClick={procesarImagenesAprobados}
                            disabled={procesandoImagenes}
                            className="flex-1 sm:flex-none px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
                        >
                            <UploadCloud size={20} />
                            {procesandoImagenes ? "Analizando Kárdex..." : "Procesar Imágenes"}
                        </button>
                    </div>

                    {!!imagenesSeleccionadas.length && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600">
                            <p className="font-bold mb-3 text-slate-700">Archivos listos para procesar:</p>
                            <div className="flex flex-wrap gap-2">
                                {imagenesSeleccionadas.map((file) => (
                                    <span key={file.name} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm flex items-center gap-2">
                                        {file.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {errorUpload && (
                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-6 py-4 text-sm font-medium flex items-center gap-3">
                            <div className="p-1 bg-red-100 rounded-full"><X size={14} /></div>
                            {errorUpload}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadModal;

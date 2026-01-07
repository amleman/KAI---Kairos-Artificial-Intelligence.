import React from "react";
import { BookOpen, BookCheck, TrendingUp, Calendar } from "lucide-react";
import HorarioVisualizer from "../HorarioVisualizer";

const ApprovedCoursesTab = ({ aprobadosDB, horarioGuardadoDB }) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* 1. Cursos (Horizontal) */}
                <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-600 flex items-center justify-center gap-4">
                    <BookOpen className="text-blue-600" size={38} />
                    <div className="text-left">
                        <p className="text-blue-600 font-medium">Cursos</p>
                        <p className="text-3xl font-bold text-gray-800">{aprobadosDB.length}</p>
                    </div>
                </div>

                {/* 2. Créditos (Horizontal) */}
                <div className="bg-green-50 rounded-2xl p-6 border-l-4 border-green-600 flex items-center justify-center gap-4">
                    <BookCheck className="text-green-600" size={38} />
                    <div className="text-left">
                        <p className="text-green-600 font-medium">Créditos</p>
                        <p className="text-3xl font-bold text-gray-800">
                            {aprobadosDB.reduce((a, c) => a + (parseInt(c.creditos) || 0), 0)}
                        </p>
                    </div>
                </div>

                {/* 3. Progreso (Horizontal) */}
                <div className="bg-purple-50 rounded-2xl p-6 border-l-4 border-purple-600 flex items-center justify-center gap-4">
                    <TrendingUp className="text-purple-600" size={38} />
                    <div className="text-left">
                        <p className="text-purple-600 font-medium">Progreso</p>
                        <p className="text-3xl font-bold text-gray-800">
                            {Math.round((aprobadosDB.reduce((a, c) => a + (parseInt(c.creditos) || 0), 0) / 300) * 100)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: MI HORARIO GUARDADO --- */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="text-purple-600" />
                    Mi Horario Guardado (Próximo Semestre)
                </h2>

                {/* Aquí usamos el componente mágico */}
                <HorarioVisualizer horario={horarioGuardadoDB} />
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-2xl font-bold mb-6">Tus cursos aprobados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {aprobadosDB.map((c) => (
                        <div key={c.codigo} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-l-4 border-green-600">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                                    {c.codigo}
                                </span>
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                    {c.creditos} cr
                                </span>
                            </div>
                            <p className="font-semibold text-gray-800 text-sm">{c.nombre}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ApprovedCoursesTab;

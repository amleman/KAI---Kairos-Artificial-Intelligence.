import { useState, useEffect } from "react";
import { BookOpen, Award, TrendingUp, CheckCircle2 } from "lucide-react";

const ApprovedCoursesPage = () => {
    const [stats, setStats] = useState({ count: 0, credits: 0, progress: 0 });
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.carne) {
                fetch(`http://127.0.0.1:8000/aprobados/${user.carne}`)
                    .then(res => res.json())
                    .then(data => {
                        setCourses(data);
                        const totalCreditos = data.reduce((acc, curr) => acc + (parseInt(curr.creditos) || 0), 0);
                        setStats({
                            count: data.length,
                            credits: totalCreditos,
                            progress: Math.min(((totalCreditos / 250) * 100).toFixed(1), 100)
                        });
                    })
                    .catch(console.error);
            }
        }
    }, []);

    const formatCourseName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    return (
        <div className="animate-fadeIn flex flex-col h-[calc(100vh-120px)] space-y-6">
            {/* Header Stats Minimalist - Fixed at top */}
            <div className="flex flex-col md:flex-row gap-4 shrink-0">
                <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-soft-blue shadow-inner flex items-center gap-4">
                    <div className="p-3 bg-pastel-blue rounded-xl text-slate-700">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800">{stats.count}</h3>
                        <p className="text-slate-500 text-sm font-medium">Cursos Aprobados</p>
                    </div>
                </div>
                <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-soft-blue shadow-inner flex items-center gap-4">
                    <div className="p-3 bg-pastel-pink rounded-xl text-slate-700">
                        <Award size={24} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800">{stats.credits}</h3>
                        <p className="text-slate-500 text-sm font-medium">Créditos Totales</p>
                    </div>
                </div>
                <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-2xl p-6 border border-soft-blue shadow-inner flex items-center gap-4">
                    <div className="p-3 bg-pastel-yellow rounded-xl text-slate-700">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800">{stats.progress}%</h3>
                        <p className="text-slate-500 text-sm font-medium">Progreso de Carrera</p>
                    </div>
                </div>
            </div>

            {/* Historial Académico Container - Occupies the rest and scrolls */}
            <div className="flex-1 bg-white/50 backdrop-blur-xl rounded-2xl border border-soft-blue shadow-inner flex flex-col min-h-0 overflow-hidden">
                <div className="p-8 pb-4 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Historial Académico</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar">
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <div key={course.codigo} className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border-[2px] border-soft-blue/30 rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:bg-gradient-to-br hover:from-white/60 hover:to-soft-blue/20">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pastel-blue to-pastel-purple opacity-50 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-slate-800 text-base mb-2 truncate pr-2" title={formatCourseName(course.nombre)}>
                                                {formatCourseName(course.nombre)}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                                    #{course.codigo}
                                                </span>
                                                <span className="font-medium text-slate-500 bg-white/50 px-2 py-1 rounded-full border border-white/60">
                                                    {course.creditos} Créditos
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-sm group-hover:bg-green-100 transition-colors">
                                                <CheckCircle2 size={20} className="text-green-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            No hay cursos aprobados registrados aún.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ApprovedCoursesPage;

import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Book, Save, Edit3, Award, TrendingUp, Shield, Camera, Brain, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar } from 'recharts';

const Perfil = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        fecha_nacimiento: '',
        carrera: '',
        carne: ''
    });

    const [stats, setStats] = useState({
        creditosAprobados: 0,
        creditosTotales: 300,
        promedio: 0,
        cursosAprobados: 0,
        mejorNota: 0,
        mejorCurso: '-'
    });

    const [radarData, setRadarData] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const usuarioNombre = localStorage.getItem('usuario');
                if (!usuarioNombre) return;
                setUsuario({ usuario: usuarioNombre });

                const resPerfil = await fetch(`http://127.0.0.1:8000/api/perfil/${usuarioNombre}`);
                if (resPerfil.ok) {
                    const dataPerfil = await resPerfil.json();
                    setFormData({
                        nombre: dataPerfil.nombre || '',
                        email: dataPerfil.email || '',
                        fecha_nacimiento: dataPerfil.fecha_nacimiento || '',
                        carrera: dataPerfil.carrera || 'Ingeniería en Sistemas',
                        carne: dataPerfil.carne || usuarioNombre,
                        foto_perfil: dataPerfil.foto_perfil || null,
                        foto_banner: dataPerfil.foto_banner || null
                    });
                }

                const resCursos = await fetch('http://127.0.0.1:8000/cursos_aprobados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario: usuarioNombre })
                });

                if (resCursos.ok) {
                    const dataCursos = await resCursos.json();
                    const aprobados = dataCursos.aprobados || [];
                    const creditos = aprobados.reduce((acc, curr) => acc + (curr.creditos || 0), 0);
                    const sumaNotas = aprobados.reduce((acc, curr) => acc + (curr.nota || 0), 0);
                    const promedio = aprobados.length > 0 ? (sumaNotas / aprobados.length).toFixed(2) : 0;
                    const mejorCurso = aprobados.reduce((max, obj) => (obj.nota > max.nota ? obj : max), { nota: 0, nombre: '-' });

                    setStats({
                        creditosAprobados: creditos,
                        creditosTotales: 300,
                        promedio: promedio,
                        cursosAprobados: aprobados.length,
                        mejorNota: mejorCurso.nota,
                        mejorCurso: mejorCurso.nombre
                    });
                    if (dataCursos.competencias_ia && dataCursos.competencias_ia.length > 0) {
                        setRadarData(dataCursos.competencias_ia);
                    }
                }
            } catch (error) {
                console.error("Error cargando perfil:", error);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGuardar = async () => {
        if (!usuario) return;
        setGuardando(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/perfil/${usuario.usuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) setEditando(false);
        } catch (error) {
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    const fileInputPerfil = useRef(null);
    const fileInputBanner = useRef(null);

    const handleImageUpload = async (e, tipo) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('usuario', usuario.usuario);
        uploadData.append('tipo', tipo);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (res.ok && data.url) {
                setFormData(prev => ({
                    ...prev,
                    [tipo === 'perfil' ? 'foto_perfil' : 'foto_banner']: data.url
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const dataPie = [
        { name: 'Aprobados', value: stats.creditosAprobados, color: '#3b82f6' }, // Blue-500
        { name: 'Pendientes', value: Math.max(0, stats.creditosTotales - stats.creditosAprobados), color: '#cbd5e1' } // Slate-300
    ];

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-8 pb-12">
            {/* Profile Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                {/* Banner */}
                <div className="h-64 bg-slate-800 relative overflow-hidden">
                    {formData.foto_banner ? (
                        <img src={formData.foto_banner} alt="Banner" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-700" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600" />
                    )}
                    {editando && (
                        <button
                            onClick={() => fileInputBanner.current.click()}
                            className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-black/70 transition-all shadow-lg hover:scale-105"
                        >
                            <Camera size={20} />
                        </button>
                    )}
                    <input type="file" ref={fileInputBanner} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                </div>

                <div className="px-10 pb-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end -mt-20 relative z-10 gap-8">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div className="w-44 h-44 rounded-full border-[6px] border-white bg-slate-100 shadow-2xl overflow-hidden flex items-center justify-center transition-transform hover:scale-105 duration-500">
                                {formData.foto_perfil ? (
                                    <img src={formData.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-sky-50 flex items-center justify-center text-sky-400">
                                        <User size={80} strokeWidth={1} />
                                    </div>
                                )}
                            </div>
                            {editando && (
                                <button
                                    onClick={() => fileInputPerfil.current.click()}
                                    className="absolute bottom-2 right-2 bg-slate-900 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-all border-4 border-white"
                                >
                                    <Camera size={20} />
                                </button>
                            )}
                            <input type="file" ref={fileInputPerfil} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'perfil')} />
                        </div>

                        {/* Name & Title */}
                        <div className="flex-1 text-center md:text-left mb-2">
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-2">
                                {formData.nombre || 'Usuario'}
                            </h1>
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                                <span className="text-xl font-bold text-slate-500">@{usuario?.usuario}</span>
                                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{formData.carrera}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="md:mb-4 w-full md:w-auto">
                            {editando ? (
                                <div className="flex gap-3 justify-center">
                                    <button onClick={() => setEditando(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 font-bold hover:bg-slate-200 transition-all">Cancelar</button>
                                    <button onClick={handleGuardar} disabled={guardando} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1">{guardando ? 'Guardando...' : 'Guardar Cambios'}</button>
                                </div>
                            ) : (
                                <button onClick={() => setEditando(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 shadow-xl shadow-sky-200 hover:-translate-y-1 transition-all group/btn">
                                    <Edit3 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                                    Editar Perfil
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Information Column (8/12) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Info */}
                    <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-lg relative overflow-hidden hover:shadow-xl transition-shadow duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-16 -mt-16 z-0" />
                        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 relative z-10">
                            <Shield className="text-slate-900" /> Información Personal
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            {[
                                { label: 'Nombre Completo', icon: User, name: 'nombre', value: formData.nombre, color: 'text-sky-500' },
                                { label: 'Carné / ID', icon: TrendingUp, name: 'carne', value: formData.carne, disabled: true, color: 'text-emerald-500' },
                                { label: 'Correo Electrónico', icon: Mail, name: 'email', value: formData.email, color: 'text-blue-500' },
                                { label: 'Fecha de Nacimiento', icon: Calendar, name: 'fecha_nacimiento', value: formData.fecha_nacimiento, type: 'date', color: 'text-rose-500' },
                            ].map((field) => (
                                <div key={field.name} className="space-y-2 group/input">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 group-hover/input:text-slate-600 transition-colors">{field.label}</label>
                                    <div className="relative">
                                        <field.icon className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${editando && !field.disabled ? "text-slate-800" : field.color}`} size={20} />
                                        <input
                                            type={field.type || "text"}
                                            name={field.name}
                                            value={field.value}
                                            onChange={handleChange}
                                            disabled={field.disabled || !editando}
                                            className={`w-full pl-14 pr-6 py-4 rounded-xl font-bold transition-all ${editando && !field.disabled
                                                ? "bg-slate-50 border-2 border-slate-200 text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 shadow-inner"
                                                : "bg-slate-50 border-transparent text-slate-500 cursor-default"
                                                }`}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="md:col-span-2 space-y-2 group/input">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 group-hover/input:text-slate-600 transition-colors">Carrera</label>
                                <div className="relative">
                                    <Book className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${editando ? "text-slate-800" : "text-amber-500"}`} size={20} />
                                    <input
                                        type="text"
                                        name="carrera"
                                        value={formData.carrera}
                                        onChange={handleChange}
                                        disabled={!editando}
                                        className={`w-full pl-14 pr-6 py-4 rounded-xl font-bold transition-all ${editando
                                            ? "bg-slate-50 border-2 border-slate-200 text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-0 shadow-inner"
                                            : "bg-slate-50 border-transparent text-slate-500 cursor-default"
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <Brain className="text-emerald-600" /> Análisis de Competencias
                            </h2>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                                <Zap size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">AI Powered</span>
                            </div>
                        </div>
                        <div className="flex flex-col xl:flex-row items-center gap-12">
                            <div className="flex-1 w-full h-[320px]">
                                {radarData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Nivel" dataKey="A" stroke="#38bdf8" strokeWidth={3} fill="#38bdf8" fillOpacity={0.3} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 border-[3px] border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                        <Brain size={48} className="mb-3 opacity-20" />
                                        <p className="text-sm font-bold text-slate-400">Sin datos de análisis</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-full xl:w-72 space-y-5">
                                {radarData.map((item, idx) => (
                                    <div key={idx} className="space-y-2 group">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            <span className="group-hover:text-slate-800 transition-colors">{item.subject}</span>
                                            <span className="text-slate-900">{item.A}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <div
                                                className="h-full bg-slate-800 rounded-full transition-all duration-1000 ease-out group-hover:bg-sky-500"
                                                style={{ width: `${item.A}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Sidebar Column (4/12) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Progress Chart */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center hover:shadow-xl transition-all duration-500 group">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 group-hover:text-slate-600 transition-colors">Progreso de Carrera</h3>
                        <div className="h-64 relative transform group-hover:scale-105 transition-transform duration-500 ease-out">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dataPie}
                                        cx="50%" cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        cornerRadius={8}
                                        stroke="none"
                                    >
                                        {dataPie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#1e293b', color: 'white' }} itemStyle={{ color: 'white' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-6xl font-black text-slate-800 tracking-tighter">{stats.creditosAprobados}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase mt-2">Créditos Ganados</span>
                            </div>
                        </div>
                        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">
                                Faltan <span className="text-slate-900">{Math.max(0, stats.creditosTotales - stats.creditosAprobados)}</span> créditos
                            </p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${(stats.creditosAprobados / stats.creditosTotales) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Breakdown */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg space-y-8 hover:shadow-xl transition-shadow duration-500">
                        <div className="flex flex-col items-center text-center">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Promedio General</h3>
                            <div className="h-40 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: parseFloat(stats.promedio) }]} startAngle={180} endAngle={0}>
                                        <RadialBar dataKey="value" fill="#3b82f6" cornerRadius={100} background={{ fill: '#f1f5f9' }} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-8 flex flex-col items-center">
                                    <span className="text-6xl font-black text-slate-800 tracking-tighter">{stats.promedio}</span>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mt-2">Puntos</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center group hover:bg-white hover:border-slate-300 hover:shadow-md transition-all">
                                <span className="text-3xl font-black text-slate-800 mb-1 group-hover:scale-110 transition-transform">{stats.cursosAprobados}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Cursos</span>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center group hover:bg-white hover:border-slate-300 hover:shadow-md transition-all">
                                <span className="text-3xl font-black text-slate-800 mb-1 group-hover:scale-110 transition-transform">{stats.mejorNota}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Max Nota</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-sky-200 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Award className="text-yellow-300 mx-auto mb-3" size={28} />
                            <p className="text-[10px] font-black text-sky-100 uppercase tracking-widest mb-2">Curso Estrella</p>
                            <p className="text-lg font-black text-white leading-tight">{stats.mejorCurso}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Perfil;

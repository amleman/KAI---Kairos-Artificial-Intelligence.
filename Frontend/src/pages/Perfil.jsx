import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Book, Save, Edit3, Award, TrendingUp, Shield, Camera, Brain, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar } from 'recharts';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Perfil = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Datos del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        fecha_nacimiento: '',
        carrera: '',
        carne: ''
    });

    // Datos estadísticos
    const [stats, setStats] = useState({
        creditosAprobados: 0,
        creditosTotales: 300,
        promedio: 0,
        cursosAprobados: 0,
        mejorNota: 0,
        mejorCurso: '-'
    });

    // Datos para el Radar de Competencias (IA Analysis Backend)
    const [radarData, setRadarData] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // El usuario se guarda como string plano en Login.jsx
                const usuarioNombre = localStorage.getItem('usuario');

                if (!usuarioNombre) {
                    console.error("No hay usuario logueado");
                    return;
                }

                setUsuario({ usuario: usuarioNombre });

                // 1. Obtener Perfil
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

                // 2. Obtener Estadísticas (Incluye análisis IA)
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

                    // Usar datos procesados por IA en Backend
                    if (dataCursos.competencias_ia && dataCursos.competencias_ia.length > 0) {
                        setRadarData(dataCursos.competencias_ia);
                    } else {
                        // Fallback vacío si falla el backend NLP
                        setRadarData([]);
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
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
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

            if (res.ok) {
                setEditando(false);
            } else {
                alert("Error al guardar cambios");
            }
        } catch (error) {
            console.error("Error guardando:", error);
            alert("Error de conexión");
        } finally {
            setGuardando(false);
        }
    };

    // --- MANEJO DE IMÁGENES ---
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
            // Asumimos que la URL del backend es localhost:8000, ajustar si es variable
            const res = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();

            if (res.ok && data.url) {
                setFormData(prev => ({
                    ...prev,
                    [tipo === 'perfil' ? 'foto_perfil' : 'foto_banner']: data.url
                }));
            } else {
                console.error("Error subiendo imagen:", data.error);
                alert("Error al subir imagen");
            }
        } catch (error) {
            console.error("Error de red:", error);
            alert("Error de conexión al subir imagen");
        }
    };

    // Datos para gráficas
    const dataPie = [
        { name: 'Aprobados', value: stats.creditosAprobados, color: '#4F46E5' }, // Indigo-600
        { name: 'Pendientes', value: Math.max(0, stats.creditosTotales - stats.creditosAprobados), color: '#E5E7EB' } // Gray-200
    ];

    const dataBar = [
        { name: 'Mi Promedio', nota: stats.promedio, fill: '#8B5CF6' }, // Purple-500
        { name: 'Meta', nota: 85, fill: '#10B981' } // Emerald-500
    ];

    // Si está cargando mostrar spinner bonito
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />

            <div className="flex-grow pt-16 mt-2 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* HEADER DEL PERFIL (REDISEÑADO) */}
                    <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                        {/* Banner con Gradiente Animado */}
                        {/* Banner con Gradiente Animado o Imagen */}
                        <div className="h-48 bg-gray-200 relative overflow-hidden group/banner">
                            {formData.foto_banner ? (
                                <img
                                    src={formData.foto_banner}
                                    alt="Banner"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>
                            )}

                            {/* Input Banner Oculto */}
                            <input
                                type="file"
                                ref={fileInputBanner}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'banner')}
                            />

                            {/* Botón Editar Banner (Visible solo en modo edición) */}
                            {editando && (
                                <button
                                    onClick={() => fileInputBanner.current.click()}
                                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Camera size={18} />
                                    <span className="text-sm font-medium">Editar Portada</span>
                                </button>
                            )}
                        </div>

                        <div className="px-8 pb-6">
                            <div className="flex flex-col md:flex-row items-center md:items-end -mt-10 relative z-10 gap-6">

                                {/* Avatar Premium */}
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:scale-105">
                                        {formData.foto_perfil ? (
                                            <img
                                                src={formData.foto_perfil}
                                                alt="Perfil"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={64} strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Perfil Oculto */}
                                    <input
                                        type="file"
                                        ref={fileInputPerfil}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'perfil')}
                                    />

                                    {/* Botón flotante cámara (Visible solo en modo edición) */}
                                    {editando && (
                                        <button
                                            onClick={() => fileInputPerfil.current.click()}
                                            className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors z-20"
                                        >
                                            <Camera size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Información del Usuario (Alineado Izquierda) */}
                                <div className="flex-1 text-center md:text-left mb-2 md:mb-0">
                                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-none mb-1">
                                        {formData.nombre || usuario?.usuario || 'Estudiante'}
                                    </h1>
                                    <div className="flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 text-gray-500">
                                        <span className="font-medium text-lg">@{usuario?.usuario}</span>
                                        <span className="hidden md:inline text-gray-300">•</span>
                                        <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-0.5 rounded-full border border-indigo-100">
                                            <Award size={14} className="text-indigo-600" />
                                            <span className="text-sm font-semibold text-indigo-700">
                                                {formData.carrera || 'Ingeniería'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón Editar (Derecha) */}
                                <div className="flex-shrink-0 mb-4 md:mb-2">
                                    {editando ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditando(false)}
                                                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleGuardar}
                                                disabled={guardando}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
                                            >
                                                <Save size={18} />
                                                <span>{guardando ? 'Guardando...' : 'Guardar'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setEditando(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                        >
                                            <Edit3 size={18} />
                                            <span>Editar Perfil</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN GRID LAYOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* COLUMNA IZQUIERDA (Datos + Radar IA) */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Card Info Personal */}
                            <div className="bg-white rounded-3xl shadow-lg p-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    Información Personal
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-500 ml-1">Nombre Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="nombre"
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                disabled={!editando}
                                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${editando ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white' : 'border-transparent bg-gray-50 text-gray-700'} transition outline-none font-medium`}
                                                placeholder="Tu nombre"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-500 ml-1">Carné / ID</label>
                                        <div className="relative">
                                            <TrendingUp className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="carne"
                                                value={formData.carne}
                                                disabled={true}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-transparent bg-gray-100 text-gray-500 cursor-not-allowed transition outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-500 ml-1">Correo Electrónico</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                disabled={!editando}
                                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${editando ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white' : 'border-transparent bg-gray-50 text-gray-700'} transition outline-none font-medium`}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-500 ml-1">Fecha de Nacimiento</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="date"
                                                name="fecha_nacimiento"
                                                value={formData.fecha_nacimiento}
                                                onChange={handleChange}
                                                disabled={!editando}
                                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${editando ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white' : 'border-transparent bg-gray-50 text-gray-700'} transition outline-none font-medium`}
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-semibold text-gray-500 ml-1">Carrera</label>
                                        <div className="relative">
                                            <Book className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                name="carrera"
                                                value={formData.carrera}
                                                onChange={handleChange}
                                                disabled={!editando}
                                                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${editando ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white' : 'border-transparent bg-gray-50 text-gray-700'} transition outline-none font-medium`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nueva Sección: Radar de Competencias IA */}
                            <div className="bg-white rounded-3xl shadow-lg p-8">
                                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-indigo-600" />
                                    Análisis de Competencias
                                    <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> AI Powered
                                    </span>
                                </h2>
                                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                                    <div className="w-full md:w-2/3 h-[300px]" style={{ height: 300 }}>
                                        {radarData && radarData.length > 0 && radarData.some(d => d.A > 0) ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                    <PolarGrid />
                                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 600 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                                    <Radar
                                                        name="Nivel"
                                                        dataKey="A"
                                                        stroke="#8B5CF6"
                                                        strokeWidth={3}
                                                        fill="#8B5CF6"
                                                        fillOpacity={0.4}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                        itemStyle={{ color: '#8B5CF6', fontWeight: 600 }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                                                <Brain className="w-12 h-12 mb-3 opacity-20" />
                                                <p>Insuficientes datos para<br />generar matriz de habilidades</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="w-full md:w-1/3 space-y-4">
                                        <h4 className="font-bold text-gray-700 mb-2">Resumen de Habilidades</h4>
                                        {radarData.map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span className="text-gray-600">{item.subject}</span>
                                                    <span className={`${item.A >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>{item.A}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${item.A >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${item.A}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA (Estadísticas) */}
                        <div className="space-y-8">
                            {/* Card Créditos */}
                            <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Progreso de Créditos</h3>
                                <div className="w-full min-h-[260px]" style={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={dataPie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {dataPie.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-3xl font-extrabold text-blue-600">{stats.creditosAprobados}</span>
                                    <span className="text-gray-400 text-sm font-medium"> / {stats.creditosTotales} Créditos</span>
                                </div>
                            </div>

                            {/* Card Promedio (Rediseñado) */}
                            <div className="bg-white rounded-3xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Rendimiento Académico</h3>

                                <div className="flex flex-col gap-6">
                                    {/* Promedio Radial */}
                                    <div className="relative h-48 w-full flex items-center justify-center -mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadialBarChart
                                                innerRadius="75%"
                                                outerRadius="100%"
                                                data={[{ name: 'Promedio', value: parseFloat(stats.promedio), fill: '#8B5CF6' }]}
                                                startAngle={180}
                                                endAngle={0}
                                                barSize={20}
                                            >
                                                <RadialBar minAngle={15} background clockWise={true} dataKey="value" cornerRadius={30} />
                                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                            </RadialBarChart>
                                        </ResponsiveContainer>
                                        <div className="absolute top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
                                            <span className="text-5xl font-black text-gray-800">{stats.promedio}</span>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Promedio</p>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Total Cursos */}
                                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                                            <div className="bg-white p-2 rounded-full shadow-sm mb-2">
                                                <Book className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <span className="text-2xl font-bold text-indigo-700">{stats.cursosAprobados}</span>
                                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wide">Cursos Aprobados</span>
                                        </div>

                                        {/* Mejor Nota */}
                                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                                            <div className="bg-white p-2 rounded-full shadow-sm mb-2">
                                                <Award className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="text-2xl font-bold text-emerald-700">{stats.mejorNota} pts</span>
                                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wide w-full px-1 leading-tight mt-1">
                                                Mejor: {stats.mejorCurso}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    {/* FIN DEL GRID */}

                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Perfil;

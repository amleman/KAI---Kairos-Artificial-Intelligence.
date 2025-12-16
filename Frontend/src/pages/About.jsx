import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingChatButton from "../components/FloatingChatButton";
import { BrainCircuit, Clock, Users, Globe, ShieldAlert, Zap } from "lucide-react";

const About = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        
        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-4 py-1 rounded-full text-indigo-300 text-sm font-semibold mb-4">
              <BrainCircuit size={16} /> Innovación Educativa
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              ¿Qué es <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">SIOA</span>?
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light">
              Sistema Inteligente de Optimización Académica
            </p>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg leading-relaxed">
              Transformamos el caos de la asignación manual en una experiencia visual, 
              inteligente y libre de estrés.
            </p>
          </div>
        </div>

        {/* EL PROBLEMA */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Nacidos de la <span className="text-red-600">experiencia</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                SIOA fue diseñado para resolver un problema crítico en la Facultad de Ingeniería: 
                <strong className="text-gray-800"> la ansiedad de cada inicio de semestre.</strong>
              </p>
              <p className="text-gray-600 leading-relaxed">
                Actualmente, la asignación de cursos está desconectada de los horarios visuales. 
                Esto provoca un retraso en los servidores y una carrera contra el tiempo donde, 
                muchas veces, tu sección ideal se llena mientras intentas cuadrar manualmente tu horario. 
                El resultado: <span className="italic">un semestre desequilibrado donde el estudiante se ajusta al sistema, y no el sistema al estudiante.</span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                <ShieldAlert className="text-red-500 mb-3" size={32} />
                <h3 className="font-bold text-gray-800">Frustración</h3>
                <p className="text-sm text-gray-500 mt-2">Sistemas lentos y procesos manuales propensos a errores.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
                <Clock className="text-orange-500 mb-3" size={32} />
                <h3 className="font-bold text-gray-800">Ineficiencia</h3>
                <p className="text-sm text-gray-500 mt-2">Horas perdidas intentando cuadrar secciones y catedráticos.</p>
              </div>
            </div>
          </div>
        </div>

        {/* LA SOLUCIÓN & IMPACTO */}
        <div className="bg-white py-20 border-y border-gray-200">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              Impacto y Escalabilidad
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <Users className="text-blue-600 mx-auto mb-4" size={48} />
                <h3 className="text-4xl font-extrabold text-blue-900 mb-2">+5,000</h3>
                <p className="font-semibold text-blue-800">Estudiantes de Ingeniería</p>
                <p className="text-sm text-blue-600 mt-2">Público objetivo inicial activo por semestre.</p>
              </div>

              <div className="p-6 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <Globe className="text-indigo-600 mx-auto mb-4" size={48} />
                <h3 className="text-4xl font-extrabold text-indigo-900 mb-2">+40,000</h3>
                <p className="font-semibold text-indigo-800">Activos en Campus Central</p>
                <p className="text-sm text-indigo-600 mt-2">Potencial de expansión a otras facultades.</p>
              </div>

              <div className="p-6 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors">
                <Zap className="text-purple-600 mx-auto mb-4" size={48} />
                <h3 className="text-4xl font-extrabold text-purple-900 mb-2">105k+</h3>
                <p className="font-semibold text-purple-800">Población Estudiantil</p>
                <p className="text-sm text-purple-600 mt-2">Alcance total incluyendo sedes regionales.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ORIGEN */}
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Un Proyecto SIC Samsung</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            SIOA nació como parte del programa <strong>Samsung Innovation Campus (SIC) 2025</strong>, 
            donde aplicamos tecnologías de Inteligencia Artificial, algoritmos de optimización y desarrollo web moderno 
            para solucionar problemas reales de nuestra comunidad.
          </p>
          <div className="flex justify-center gap-4">
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">React + Python</span>
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">Machine Learning</span>
            <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-semibold">OCR</span>
          </div>
        </div>

      </div>
      <FloatingChatButton />
      <Footer />
    </>
  );
};

export default About;
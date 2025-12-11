import { Link } from "react-router-dom";
import { Github, Linkedin, Cpu } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Columna 1: Branding y Programa */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <Cpu className="text-indigo-500" />
              SIOA
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              Sistema Inteligente de Optimización Académica.
              Una solución diseñada por estudiantes, para estudiantes.
            </p>
            <div className="inline-block bg-blue-900/30 border border-blue-800 rounded-lg px-3 py-1.5 mt-2">
              <p className="text-xs font-semibold text-blue-300">
                Proyecto desarrollado en:<br/>
                <span className="text-white text-sm">Samsung Innovation Campus (SIC)</span>
              </p>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Explorar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-indigo-400 transition-colors">Inicio / Dashboard</Link>
              </li>
              <li>
                <Link to="/que-es-sioa" className="hover:text-indigo-400 transition-colors">¿Qué es SIOA?</Link>
              </li>
              {/* Agrega aquí otros enlaces si tienes */}
            </ul>
          </div>

          {/* Columna 3: Créditos del Equipo */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Equipo de Desarrollo</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              {/* REEMPLAZA CON LOS NOMBRES REALES */}
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Anthony A. (Líder / Fullstack / AI developer)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Daniel O. (Fullstack / AI developer)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Mariana . (Fullstack / AI developer)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Xavi DL. (Fullstack / AI developer)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Sebastian C. (Fullstack / AI developer)
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            © {year} SIOA - Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors"><Github size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
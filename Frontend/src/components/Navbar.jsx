import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Home, TrafficCone, Target, LogOut, Menu, X, GraduationCap, MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("userData");
    navigate("/");
  };

  const NAV_ITEMS = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/perfil", label: "Perfil", icon: User },
    { path: "/semaforo", label: "Semáforo", icon: TrafficCone },
    { path: "/optimizador", label: "Optimizador", icon: Target },
    { path: "/chatbot", label: "Chatbot", icon: MessageCircle },
  ];

  return (
    // CAMBIO 1: Fondo blanco con transparencia (Glass effect) y borde sutil
    <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200/60 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:shadow-indigo-300 transition-all duration-300">
                <GraduationCap className="text-white" size={20} />
              </div>
              {/* CAMBIO 2: Texto del logo oscuro para contrastar con blanco */}
              <span className="text-xl font-bold text-slate-800 tracking-wide group-hover:text-indigo-600 transition-colors">
                SIOA
              </span>
            </Link>
          </div>

          {/* MENU DESKTOP - ISLA DE NAVEGACIÓN */}
          {/* CAMBIO 3: La "Isla" ahora es gris muy suave (slate-100) en lugar de oscuro */}
          <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 backdrop-blur-sm relative">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 z-10 ${
                    // CAMBIO 4: Texto inactivo gris (slate-500), Activo blanco (para ir sobre la píldora azul)
                    isActive ? "text-white" : "text-slate-500 hover:text-indigo-600"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-pill"
                      // CAMBIO 5: La píldora activa mantiene el color de marca (Indigo-600)
                      className="absolute inset-0 bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/30"

                      // CAMBIO 6: Velocidad ajustada
                      transition={{
                        type: "spring",
                        stiffness: 230,
                        damping: 25
                      }}
                      initial={false}
                    />
                  )}

                  <item.icon size={16} className="relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Botón Salir */}
          <div className="hidden md:flex">
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-sm rounded-lg font-bold transition-all border border-red-100 flex items-center gap-2"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>

          {/* Menu Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {menuAbierto && (
          <div className="md:hidden py-4 space-y-2 border-t border-slate-100 animate-fade-in bg-white/95 backdrop-blur-xl">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuAbierto(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname === item.path
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100" // Activo en móvil: fondo pastel muy suave
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
              >
                <item.icon size={18} /> {item.label}
              </Link>
            ))}

            <div className="pt-4 mt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
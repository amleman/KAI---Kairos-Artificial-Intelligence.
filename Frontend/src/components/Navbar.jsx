import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Network,
  Target,
  TrafficCone,
  MessageCircle,
  User,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  Menu
} from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(true);
  const [isDark, setIsDark] = useState(false); // Placeholder for theme state

  const toggleTheme = () => setIsDark(!isDark);

  const onLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("userData");
    navigate("/");
  };

  const NavItem = ({ path, icon: Icon, label }) => {
    const isActive = location.pathname === path || (path.includes("?") && location.search.includes("tab=pensum"));

    return (
      <Link
        to={path}
        onClick={() => setIsSidebarOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
          ${isActive
            ? 'bg-pastel-blue text-slate-900 font-semibold shadow-sm'
            : 'text-slate-600 hover:bg-pastel-green hover:text-slate-900'
          }
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl bg-white/70 backdrop-blur-xl border border-pastel-blue shadow-sm text-slate-700"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed top-0 left-0 z-40 w-72 h-screen 
        bg-white/70 backdrop-blur-xl border-r border-pastel-blue 
        transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="w-10 h-10 rounded-xl bg-pastel-pink flex items-center justify-center text-slate-700 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              KAI
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {/* Dashboard Group */}
            <div>
              <button
                onClick={() => setDashboardOpen(!dashboardOpen)}
                className={`
                  w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors
                  ${location.pathname.includes('/dashboard') ||
                    location.pathname.includes('/aprobados') ||
                    location.pathname.includes('/pensum') ||
                    location.pathname.includes('/horarios')
                    ? 'bg-pastel-blue text-slate-900 font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-pastel-green hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </div>
                <div className={`transition-transform duration-200 ${dashboardOpen ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>

              {/* Submenu */}
              {dashboardOpen && (
                <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-1 animate-fadeIn">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/dashboard' ? 'text-slate-900 font-medium bg-white/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Resumen
                  </Link>
                  <Link
                    to="/aprobados"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/aprobados' ? 'text-slate-900 font-medium bg-white/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Cursos Aprobados
                  </Link>
                  <Link
                    to="/pensum"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/pensum' ? 'text-slate-900 font-medium bg-white/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Pensum
                  </Link>
                  <Link
                    to="/horarios"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/horarios' ? 'text-slate-900 font-medium bg-white/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Horarios
                  </Link>
                </div>
              )}
            </div>

            <NavItem path="/semaforo" icon={TrafficCone} label="Semáforo" />
            <NavItem path="/perfil" icon={User} label="Perfil" />
            <NavItem path="/optimizador" icon={Target} label="Optimizador" />
            <NavItem path="/chatbot" icon={MessageCircle} label="Chatbot" />
          </nav>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-pastel-blue space-y-3 mt-auto">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-pastel-yellow hover:text-slate-900 transition-colors border border-transparent"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-500" />}
              <span className="font-medium">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-pastel-pink hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
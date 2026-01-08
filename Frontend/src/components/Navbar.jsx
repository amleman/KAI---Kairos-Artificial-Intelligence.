import { useState, useEffect } from "react";
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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

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
            ? 'bg-pastel-blue dark:bg-white/10 text-slate-900 dark:text-sky-300 font-semibold shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-pastel-green dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
          }
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`} />
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
          className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-pastel-blue dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200"
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
        bg-white/70 dark:bg-[#0F172A]/90 backdrop-blur-xl border-r border-pastel-blue dark:border-white/10
        transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="w-10 h-10 rounded-xl bg-pastel-pink dark:bg-rose-900/50 flex items-center justify-center text-slate-700 dark:text-rose-200 shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
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
                    ? 'bg-pastel-blue dark:bg-white/10 text-slate-900 dark:text-sky-300 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-pastel-green dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
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
                <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 dark:border-white/10 space-y-1 animate-fadeIn">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/dashboard' ? 'text-slate-900 dark:text-sky-300 font-medium bg-white/50 dark:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    Resumen
                  </Link>
                  <Link
                    to="/aprobados"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/aprobados' ? 'text-slate-900 dark:text-sky-300 font-medium bg-white/50 dark:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    Cursos Aprobados
                  </Link>
                  <Link
                    to="/pensum"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/pensum' ? 'text-slate-900 dark:text-sky-300 font-medium bg-white/50 dark:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    Pensum
                  </Link>
                  <Link
                    to="/horarios"
                    onClick={() => setIsSidebarOpen(false)}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${location.pathname === '/horarios' ? 'text-slate-900 dark:text-sky-300 font-medium bg-white/50 dark:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
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
          <div className="pt-6 border-t border-pastel-blue dark:border-slate-800 space-y-3 mt-auto">
            <button
              onClick={toggleTheme}
              className="relative w-full h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-between cursor-pointer transition-colors shadow-inner"
              aria-label="Toggle Dark Mode"
            >
              {/* Icons Background */}
              <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                <Sun className="w-5 h-5 text-amber-500 opacity-60 dark:opacity-40" />
                <Moon className="w-5 h-5 text-indigo-400 opacity-40 dark:opacity-100" />
              </div>

              {/* Sliding Knob */}
              <div
                className={`
                    relative w-1/2 h-full rounded-xl bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600
                    transform transition-all duration-300 ease-out flex items-center justify-center pointer-events-none
                    ${isDark ? 'translate-x-full border-indigo-500/30' : 'translate-x-0 border-amber-500/30'}
                 `}
              >
                <div className={`transition-all duration-300 ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0 absolute'}`}>
                  <Moon className="w-5 h-5 text-indigo-400" fill="currentColor" />
                </div>
                <div className={`transition-all duration-300 ${!isDark ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0 absolute'}`}>
                  <Sun className="w-5 h-5 text-amber-500" fill="currentColor" />
                </div>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-pastel-pink dark:hover:bg-rose-900/30 hover:text-red-700 dark:hover:text-rose-100 transition-colors"
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
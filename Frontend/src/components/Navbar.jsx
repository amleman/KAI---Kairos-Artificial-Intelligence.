import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Home, TrafficCone, Target, LogOut, Menu, X, GraduationCap } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Limpiar sesión
    localStorage.removeItem("usuario");
    localStorage.removeItem("userData");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-800">SIOHA</span>
            </Link>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Home size={18} />
                Dashboard
              </div>
            </Link>

            <Link
              to="/semaforo"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("/semaforo")
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrafficCone size={18} />
                Semáforo
              </div>
            </Link>

            <Link
              to="/optimizador"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("/optimizador")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Target size={18} />
                Optimizador
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <LogOut size={18} />
                Salir
              </div>
            </button>
          </div>

          {/* Menu Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {menuAbierto && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/dashboard"
              onClick={() => setMenuAbierto(false)}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/semaforo"
              onClick={() => setMenuAbierto(false)}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("/semaforo")
                  ? "bg-green-100 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Semáforo de Carga
            </Link>

            <Link
              to="/optimizador"
              onClick={() => setMenuAbierto(false)}
              className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive("/optimizador")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Optimizador de Promedio
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API_URL from "../api/apiConfig";
import AuthBackground from "../components/auth/AuthBackground";

const Login = () => {
    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario,
                password
            })
        });

        if (response.ok) {
            const data = await response.json();

            // Guardar el username del usuario en localStorage
            localStorage.setItem("usuario", data.usuario);

            // Si el usuario tiene información completa, guardarla también
            if (data.tiene_info && data.carne) {
                localStorage.setItem("userData", JSON.stringify({
                    nombre: data.nombre,
                    carne: data.carne,
                    fechaNacimiento: data.fechaNacimiento,
                    carrera: data.carrera
                }));
            } else {
                // Limpiar userData si no tiene info completa
                localStorage.removeItem("userData");
            }

            navigate("/dashboard");
        } else {
            setError("Usuario o contraseña incorrectos");
        }
    };

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
            <AuthBackground />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-6">
                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
                                KAI USAC
                            </span>
                        </Link>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido de nuevo!</h2>
                        <p className="text-gray-400 text-sm">Ingresa tus credenciales para continuar</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 mb-6 rounded-xl flex items-center gap-3">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Usuario
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                placeholder="Ej. estudiante2024"
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-sky-400 hover:to-blue-500 transform hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-sky-900/20"
                        >
                            Iniciar Sesión
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <p className="text-gray-500 text-sm">
                            ¿Aún no tienes una cuenta?{" "}
                            <Link
                                to="/register"
                                className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                            >
                                Regístrate gratis
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
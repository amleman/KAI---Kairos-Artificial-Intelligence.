import React from "react";
import { User, CreditCard, Cake, Briefcase, LogOut } from "lucide-react";

const InitialRegistration = ({ usuarioData, setUsuarioData, handleGuardarUsuario }) => {
    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-t-4 border-blue-600 relative">
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = "/";
                    }}
                    className="absolute top-4 right-4 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm hover:bg-red-200 flex items-center gap-2"
                >
                    <LogOut size={16} />
                    Cerrar sesión
                </button>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg">
                        <User className="text-white" size={36} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Registro Inicial</h1>
                    <p className="text-gray-600 mt-2">Completa tu información para comenzar</p>
                </div>

                <div className="space-y-5">
                    {["nombre", "carné", "fechaNacimiento", "carrera"].map((field) => (
                        <div key={field}>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                {field === "nombre" && <User size={18} className="text-blue-600" />}
                                {field === "carné" && <CreditCard size={18} className="text-blue-600" />}
                                {field === "fechaNacimiento" && <Cake size={18} className="text-blue-600" />}
                                {field === "carrera" && <Briefcase size={18} className="text-blue-600" />}
                                {field === "nombre" && "Nombre Completo"}
                                {field === "carné" && "Carné Universitario"}
                                {field === "fechaNacimiento" && "Fecha de Nacimiento"}
                                {field === "carrera" && "Carrera"}
                            </label>
                            {field === "carrera" ? (
                                <select
                                    name="carrera"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => setUsuarioData({ ...usuarioData, carrera: e.target.value })}
                                    value={usuarioData.carrera || ""}
                                >
                                    <option value="">Seleccione su carrera</option>
                                    <option>Ing. Sistemas</option>
                                    <option>Ing. Civil</option>
                                    <option>Ing. Industrial</option>
                                    <option>Ing. Mecánica</option>
                                    <option>Ing. Electrónica</option>
                                    <option>Ing. Eléctrica</option>
                                    <option>Ing. Química</option>
                                </select>
                            ) : field === "fechaNacimiento" ? (
                                <input
                                    type="date"
                                    name="fechaNacimiento"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    onChange={(e) => setUsuarioData({ ...usuarioData, fechaNacimiento: e.target.value })}
                                    value={usuarioData.fechaNacimiento || ""}
                                />
                            ) : (
                                <input
                                    name={field === "carné" ? "carne" : "nombre"}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder={field === "carné" ? "Ej: 2024001" : "Tu nombre completo"}
                                    onChange={(e) => setUsuarioData({ ...usuarioData, [field === "carné" ? "carne" : "nombre"]: e.target.value })}
                                    value={field === "carné" ? usuarioData.carne : usuarioData.nombre || ""}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <button
                    className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg"
                    onClick={handleGuardarUsuario}
                >
                    Guardar y Continuar
                </button>
            </div>
        </div>
    );
};

export default InitialRegistration;

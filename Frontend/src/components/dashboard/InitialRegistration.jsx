import React, { useState, useEffect } from "react";
import { User, CreditCard, Cake, Briefcase, LogOut, AlertCircle } from "lucide-react";

const InitialRegistration = ({ usuarioData, setUsuarioData, handleGuardarUsuario }) => {
    const [localData, setLocalData] = useState(usuarioData);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setLocalData(usuarioData);
    }, [usuarioData]);

    const handleChange = (field, value) => {
        setLocalData(prev => ({ ...prev, [field]: value }));
        // Limpiar error al escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleBlur = () => {
        setUsuarioData(localData);
    };

    const validate = () => {
        const newErrors = {};

        // Validar Nombre
        if (!localData.nombre || localData.nombre.trim().length < 3) {
            newErrors.nombre = "El nombre debe tener al menos 3 caracteres.";
        } else {
            // Validación de seguridad (XSS / SQL Injection Check)
            const dangerousChars = /[<>;'"/=\\]/;
            if (dangerousChars.test(localData.nombre)) {
                newErrors.nombre = "Por seguridad, no se permiten los caracteres: < > ; ' \" / = \\";
            }

            // Palabras clave peligrosas
            const dangerousKeywords = /\b(script|select|drop|delete|update|insert|alert)\b/i;
            if (dangerousKeywords.test(localData.nombre)) {
                newErrors.nombre = "Entrada rechazada por contener palabras restringidas.";
            }

            // Permitir solo letras, espacios y puntos (Lista blanca estricta opcional, pero cumplimos con lo pedido primero de detectar inyecciones)
        }

        // Validar Carné
        if (!localData.carne || !/^\d+$/.test(localData.carne) || parseInt(localData.carne) <= 0) {
            newErrors.carne = "El carné debe ser un número positivo válido.";
        } else if (localData.carne.length > 9) {
            newErrors.carne = "El carné no puede tener más de 9 caracteres.";
        }

        // Validar Fecha
        if (!localData.fechaNacimiento) {
            newErrors.fechaNacimiento = "La fecha de nacimiento es requerida.";
        } else {
            const year = parseInt(localData.fechaNacimiento.split("-")[0]);
            if (year < 1960 || year > 2015) {
                newErrors.fechaNacimiento = "El año de nacimiento debe estar entre 1960 y 2015.";
            }
        }

        // Validar Carrera
        if (!localData.carrera) {
            newErrors.carrera = "Debes seleccionar una carrera.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const onSave = () => {
        if (!validate()) return;

        setUsuarioData(localData);
        handleGuardarUsuario();
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-t-4 border-sky-500 relative">
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
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
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
                                    onChange={(e) => handleChange("carrera", e.target.value)}
                                    onBlur={handleBlur}
                                    value={localData.carrera || ""}
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
                                    onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
                                    onBlur={handleBlur}
                                    value={localData.fechaNacimiento || ""}
                                />

                            ) : (
                                <input
                                    name={field === "carné" ? "carne" : "nombre"}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder={field === "carné" ? "Ej: 2024001" : "Tu nombre completo"}
                                    onChange={(e) => handleChange(field === "carné" ? "carne" : "nombre", e.target.value)}
                                    onBlur={handleBlur}
                                    value={field === "carné" ? localData.carne : localData.nombre || ""}
                                    maxLength={field === "carné" ? "9" : undefined}
                                />
                            )}

                            {errors[field === "carné" ? "carne" : field] && (
                                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs font-semibold animate-pulse">
                                    <AlertCircle size={12} />
                                    <span>{errors[field === "carné" ? "carne" : field]}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    className="w-full mt-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg"
                    onClick={onSave}
                >
                    Guardar y Continuar
                </button>
            </div>
        </div>
    );
};

export default InitialRegistration;

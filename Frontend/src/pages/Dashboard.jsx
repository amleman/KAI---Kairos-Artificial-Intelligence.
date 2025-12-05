import { useState } from 'react';

const Dashboard = () => {
  // Estado para guardar el horario que nos devuelve Python
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función que conecta con tu backend (main.py)
  const handleGenerarHorario = async () => {
    setLoading(true);
    setError(null);
    
    // OJO: Aquí deberías sacar el usuario real del Login. 
    // Por ahora lo dejamos harcodeado para probar.
    const usuarioActual = "test_user"; 

    try {
      // Petición a tu API Flask
      const response = await fetch('http://127.0.0.1:8000/generar_horario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario: usuarioActual }),
      });

      const data = await response.json();
      console.log("Pasa")

      if (response.ok) {
        console.log("Entra al if")
        setHorarios(data.horarios); // Guardamos las opciones recibidas
      } else {
        setError(data.error || "Error desconocido");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor Flask. ¿Está corriendo?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            
            {/* Header de Bienvenida (Tu diseño original) */}
            <div className="mb-8">
              <span className="text-6xl">🎉</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              ¡Bienvenido!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Has iniciado sesión correctamente. ¿Listo para armar tu semestre?
            </p>

            {/* Botón de Acción */}
            <div className="mb-8">
              <button
                onClick={handleGenerarHorario}
                disabled={loading}
                className={`text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg transform transition hover:scale-105
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600'
                  }`}
              >
                {loading ? "Calculando la mejor ruta..." : "🚀 Generar Mi Horario Inteligente"}
              </button>
            </div>

            {/* Mensajes de Error */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-left">
                <p className="font-bold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {/* Visualización de Resultados (Si ya hay horarios) */}
            {horarios.length > 0 && (
              <div className="mt-10 text-left">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Opciones Recomendadas:</h3>
                
                <div className="grid gap-6">
                  {horarios.map((opcion, index) => (
                    <div key={index} className="border-2 border-indigo-100 rounded-xl p-4 hover:border-indigo-300 transition">
                      <h4 className="font-bold text-indigo-600 mb-2">Opción #{index + 1}</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2">Curso</th>
                              <th className="px-4 py-2">Sección</th>
                              <th className="px-4 py-2">Horario</th>
                              <th className="px-4 py-2">Días</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Aquí iteramos sobre los cursos de cada opción */}
                            {opcion.map((curso, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-4 py-2 font-medium">{curso.Nombre_Limpio || curso.Codigo}</td>
                                <td className="px-4 py-2 text-center">{curso.Seccion}</td>
                                <td className="px-4 py-2 text-center">
                                  {/* Convertimos minutos a hora legible si es necesario, o mostramos el raw */}
                                  {curso.Inicio} - {curso.Final}
                                </td>
                                <td className="px-4 py-2 text-gray-500">
                                   {/* Ajusta esto según cómo venga tu JSON */}
                                   {String(curso.Dias_Lista).replace(/[[\]']/g, '')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
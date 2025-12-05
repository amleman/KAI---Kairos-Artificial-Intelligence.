import { useState, useEffect } from "react";
import Papa from "papaparse";

const Dashboard = () => {
  /* ----------------------- Estados globales ----------------------- */
  const [showForm, setShowForm] = useState(true);
  const [usuarioData, setUsuarioData] = useState({
    nombre: "",
    carne: "",
    fechaNacimiento: "",
    carrera: "",
  });

  const [tab, setTab] = useState("none");

  const [pensum, setPensum] = useState([]);
  const [aprobados, setAprobados] = useState([]);

  /* ----------------------- Cambiar estado del form ----------------------- */
  const handleFormChange = (e) => {
    setUsuarioData({
      ...usuarioData,
      [e.target.name]: e.target.value,
    });
  };

  /* ----------------------- Guardar usuario ----------------------- */
  const handleGuardarUsuario = async () => {
    const response = await fetch("http://127.0.0.1:8000/guardar_usuario_info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioData),
    });

    const data = await response.json();

    if (response.ok) {
      setShowForm(false);
    } else {
      alert("Error: " + data.error);
    }
  };

  /* ----------------------- Normalización de CSV ----------------------- */
  const normalizarCurso = (curso) => {
    return {
      codigo: curso.codigo || curso.CODIGO || curso.Código || "",
      nombre_completo:
        curso.nombre_completo ||
        curso.Nombre ||
        curso.NOMBRE ||
        curso.nombre ||
        "",
      creditos: curso.creditos || curso.Créditos || curso.credito || "",
      semestre: curso.semestre || curso.Semestre || curso.SEMESTRE || "",
      pre_requisitos:
        curso.pre_requisitos ||
        curso.Prerrequisitos ||
        curso.Pre_Requisitos ||
        "",
    };
  };

  /* ----------------------- Cargar CSV del pensum ----------------------- */
  const cargarPensum = () => {
    fetch("http://127.0.0.1:8000/pensum")
      .then((res) => res.text())
      .then((csv) => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log("CSV CRUDO:", results.data);

            const normalizado = results.data.map((c) => normalizarCurso(c));

            console.log("CSV NORMALIZADO:", normalizado);

            setPensum(normalizado);
          },
        });
      });
  };

  /* ----------------------- Verificar prerrequisitos ----------------------- */
  const puedeLlevar = (curso) => {
    if (!curso.pre_requisitos) return true;

    const prereqs = curso.pre_requisitos
      .replaceAll('"', "")
      .split(",")
      .map((r) => r.trim());

    return prereqs.every((p) => aprobados.includes(p));
  };

  /* ----------------------- Marcar curso aprobado ----------------------- */
  const toggleAprobado = (codigo) => {
    if (aprobados.includes(codigo)) {
      setAprobados(aprobados.filter((c) => c !== codigo));
    } else {
      setAprobados([...aprobados, codigo]);
    }
  };

  /* ----------------------- Guardar aprobados ----------------------- */
  const guardarAprobados = async () => {
    const response = await fetch("http://127.0.0.1:8000/guardar_aprobados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carne: usuarioData.carne,
        aprobados,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Aprobados guardados");
    } else {
      alert("Error: " + data.error);
    }
  };

  /* ----------------------- Agrupar cursos por semestre ----------------------- */
  const semestresOrden = [
    "Primero",
    "Segundo",
    "Tercero",
    "Cuarto",
    "Quinto",
    "Sexto",
    "Séptimo",
    "Octavo",
    "Noveno",
    "Décimo",
  ];

  const pensumPorSemestre = semestresOrden.map((sem) => ({
    nombre: sem,
    cursos: pensum.filter((c) => c.semestre === sem),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-10">
      <div className="bg-white shadow-2xl rounded-2xl p-10 max-w-6xl mx-auto">

        {/* ----------------------- FORMULARIO INICIAL ----------------------- */}
        {showForm ? (
          <div>
            <h1 className="text-3xl font-bold mb-6">Registro Inicial</h1>

            <div className="grid grid-cols-2 gap-4">
              <input
                name="nombre"
                className="p-3 border rounded"
                placeholder="Nombre completo"
                onChange={handleFormChange}
              />
              <input
                name="carne"
                className="p-3 border rounded"
                placeholder="Carné"
                onChange={handleFormChange}
              />
              <input
                type="date"
                name="fechaNacimiento"
                className="p-3 border rounded"
                onChange={handleFormChange}
              />
              <select
                name="carrera"
                className="p-3 border rounded"
                onChange={handleFormChange}
              >
                <option value="">Seleccione carrera</option>
                <option>Ing. Sistemas</option>
                <option>Ing. Civil</option>
                <option>Ing. Industrial</option>
                <option>Ing. Mecánica</option>
              </select>
            </div>

            <button
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl"
              onClick={handleGuardarUsuario}
            >
              Guardar y Continuar
            </button>
          </div>
        ) : (
          <>
            {/* ----------------------- BIENVENIDA ----------------------- */}
            <h1 className="text-4xl font-bold text-center mb-4">
              ¡Bienvenido {usuarioData.nombre}!
            </h1>

            {/* ----------------------- TABS ----------------------- */}
            <div className="flex gap-4 justify-center mb-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => {
                  cargarPensum();
                  setTab("pensum");
                }}
              >
                Ver Pensum
              </button>

              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setTab("horario")}>
                Hacer Horario
              </button>

              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setTab("promedio")}>
                Subir Promedio
              </button>

              <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => setTab("aprobados")}>
                Ver Aprobados
              </button>
            </div>

            {/* ----------------------- TAB: VER PENSUM ----------------------- */}
            {tab === "pensum" && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Pensum</h2>

                {pensumPorSemestre.map((sem) => (
                  <div key={sem.nombre} className="bg-gray-100 p-5 rounded-xl shadow mb-10">
                    <h3 className="text-2xl font-bold mb-4">{sem.nombre} semestre</h3>

                    <div className="grid grid-cols-3 gap-4">
                      {sem.cursos.length === 0 && (
                        <p className="text-gray-500 col-span-3">No hay cursos cargados.</p>
                      )}

                      {sem.cursos.map((curso) => {
                        const aprobado = aprobados.includes(curso.codigo);
                        const permitido = puedeLlevar(curso);

                        return (
                          <div
                            key={curso.codigo}
                            onClick={() => (permitido ? toggleAprobado(curso.codigo) : null)}
                            className={`p-4 rounded-lg shadow-lg cursor-pointer border
                              ${
                                aprobado
                                  ? "bg-green-300 border-green-600"
                                  : permitido
                                  ? "bg-white border-gray-300"
                                  : "bg-red-300 border-red-600"
                              }
                            `}
                          >
                            <h4 className="font-bold text-lg">{curso.nombre_completo}</h4>
                            <p className="text-sm text-gray-700">{curso.codigo}</p>
                            <p className="text-sm">Créditos: {curso.creditos}</p>
                            {!permitido && (
                              <p className="text-xs text-red-800 mt-2">
                                No cumple prerrequisitos
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={guardarAprobados}
                  className="mt-4 px-6 py-3 bg-green-600 text-white rounded-xl"
                >
                  Guardar Aprobados
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

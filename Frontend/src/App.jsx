import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SemaforoCarga from "./pages/SemaforoCarga";
import OptimizadorPromedio from "./pages/OptimizadorPromedio";
import ProtectedRoute from "./components/ProtectedRoute";
import ResultadoHorario from "./pages/ResultadoHorario";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/semaforo" 
          element={
            <ProtectedRoute>
              <SemaforoCarga />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/optimizador" 
          element={
            <ProtectedRoute>
              <OptimizadorPromedio />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/resultado-horario"
          element={<ResultadoHorario />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SemaforoCarga from "./pages/SemaforoCarga";
import OptimizadorPromedio from "./pages/OptimizadorPromedio";
import ProtectedRoute from "./components/ProtectedRoute";
import ResultadoHorario from "./pages/ResultadoHorario";
import About from './pages/About';
import ChatbotAcademico from './pages/ChatbotAcademico';
import Perfil from './pages/Perfil';

import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
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
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <ChatbotAcademico />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          }
        />
        <Route path="/que-es-sioa" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
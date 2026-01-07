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
import GlassDemo from "./pages/GlassDemo";
import PlatformLayout from "./components/ui/PlatformLayout";
import ApprovedCoursesPage from "./pages/ApprovedCoursesPage";
import PensumPage from "./pages/PensumPage";
import SchedulePage from "./pages/SchedulePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Platform Routes wrapped in Layout */}
        <Route element={<ProtectedRoute><PlatformLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/aprobados" element={<ApprovedCoursesPage />} />
          <Route path="/pensum" element={<PensumPage />} />
          <Route path="/horarios" element={<SchedulePage />} />
          <Route path="/semaforo" element={<SemaforoCarga />} />
          <Route path="/optimizador" element={<OptimizadorPromedio />} />
          <Route path="/resultado-horario" element={<ResultadoHorario />} />
          <Route path="/chatbot" element={<ChatbotAcademico />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>

        <Route path="/que-es-sioa" element={<About />} />
        <Route path="/glass-demo" element={<GlassDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
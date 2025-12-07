import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SemaforoCarga from "./pages/SemaforoCarga";
import OptimizadorPromedio from "./pages/OptimizadorPromedio";
import ProtectedRoute from "./components/ProtectedRoute";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
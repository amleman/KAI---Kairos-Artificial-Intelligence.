import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const usuario = localStorage.getItem("usuario");
  
  if (!usuario) {
    // Si no hay sesión, redirigir al login
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute;

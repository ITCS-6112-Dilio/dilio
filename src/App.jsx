// src/App.jsx
import { BrowserRouter as Router, Navigate, Route, Routes, } from "react-router-dom";
import SignUp from "./components/auth/SignUp";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import { useUser } from "./context/UserContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useUser();
  if (loading) return <div>Loading...</div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
};


function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignUp from "./components/auth/SignUp";
import Login from "./components/auth/Login";
import Dashboard from "./components/Dashboard";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./services/firebase";

// Protect dashboard, allow any logged-in user
const PrivateRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div>Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
};

// Prevent login/signup page if session/user is present
const PublicRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
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

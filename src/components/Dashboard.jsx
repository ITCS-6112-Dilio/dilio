// src/components/Dashboard.jsx
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import Button from "./Button";

const Dashboard = () => {
  const handleLogout = async () => {
    await signOut(auth);
    // The PrivateRoute will redirect them to login page after logout
  };

  return (
    <div style={{ maxWidth: 340, margin: "2rem auto", padding: "1rem" }}>
      <h2>Dashboard</h2>
      <p>Welcome! You are logged in.</p>
      <Button onClick={handleLogout}>Log Out</Button>
    </div>
  );
};

export default Dashboard;

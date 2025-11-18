// src/components/auth/Login.jsx
import { useState } from "react";
import { auth } from "../../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Card from "../Card";
import Input from "../Input";
import Button from "../Button";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Individual error states for real-time validation
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [generalError, setGeneralError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (value) => {
    if (!value.trim().endsWith(".edu")) {
      setEmailError("Only .edu emails are allowed.");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const validatePassword = (value) => {
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const onEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const onPasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setInfoMessage("");
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) {
      setGeneralError("Please fix the errors above before submitting.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);

      setInfoMessage("Login successful! Redirecting...");
      setEmail("");
      setPassword("");
      navigate("/dashboard");
    } catch (err) {
      setGeneralError("Login failed: " + err.message);
    }
    setLoading(false);
  };

  const isSubmitDisabled =
    loading || !email || !password || emailError || passwordError;

  return (
    <Card>
      <h2
        style={{
          fontSize: "1.25rem",
          marginBottom: "1rem",
          textAlign: "center",
        }}
      >
        Log In
      </h2>
      {generalError && (
        <p style={{ color: "red", marginBottom: 8 }} role="alert">
          {generalError}
        </p>
      )}
      {infoMessage && (
        <p style={{ color: "green", marginBottom: 8 }}>{infoMessage}</p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Campus Email"
          name="email"
          type="email"
          placeholder="Your .edu Email"
          value={email}
          onChange={onEmailChange}
          required
          error={emailError}
          autoFocus
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={onPasswordChange}
          required
          error={passwordError}
        />
        <Button type="submit" disabled={isSubmitDisabled}>
          {loading ? "Logging in..." : "Log In"}
        </Button>
      </form>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        Need an account? <Link to="/signup">Sign Up</Link>
      </div>
    </Card>
  );
};

export default Login;

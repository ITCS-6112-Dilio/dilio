// src/components/auth/SignUp.jsx
import { useState } from 'react';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Card from '../Card';
import Input from '../Input';
import Button from '../Button';
import { Link } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Individual error states for real-time validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => {
    if (!value.trim().endsWith('.edu')) {
      setEmailError('Only .edu emails are allowed.');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const validatePassword = (value) => {
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const validateConfirmPassword = (value) => {
    if (value !== password) {
      setConfirmError('Passwords do not match.');
      return false;
    } else {
      setConfirmError('');
      return true;
    }
  };

  // Change handlers that update value and validate
  const onEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const onPasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);

    // Re-validate confirm password as well
    if (confirmPassword) validateConfirmPassword(confirmPassword);
  };

  const onConfirmChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    validateConfirmPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError('');
    setSuccessMessage('');

    // Final validation before submit
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isEmailValid || !isPasswordValid || !isConfirmValid) {
      setGeneralError('Please fix the errors above before submitting.');
      return;
    }

    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCred.user.uid;

      // Create Firestore user profile with default role student
      await setDoc(doc(db, 'users', uid), {
        email,
        role: 'student',
        createdAt: Date.now(),
      });

      setSuccessMessage('Sign Up successful! You can now log in.');

      // Reset the form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setEmailError('');
      setPasswordError('');
      setConfirmError('');
      setGeneralError('');
    } catch (err) {
      console.log(err);
      setGeneralError(err.message);
    }

    setLoading(false);
  };

  // Disable submit if any error or empty fields
  const isSubmitDisabled =
    loading ||
    !email ||
    !password ||
    !confirmPassword ||
    emailError ||
    passwordError ||
    confirmError;

  return (
    <Card>
      <h2
        style={{
          fontSize: '1.25rem',
          marginBottom: '1rem',
          textAlign: 'center',
        }}
      >
        Sign Up
      </h2>
      {generalError && (
        <p style={{ color: 'red', marginBottom: 8 }} role="alert">
          {generalError}
        </p>
      )}
      {successMessage && (
        <p style={{ color: 'green', marginBottom: 8 }}>{successMessage}</p>
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
        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter Password"
          value={confirmPassword}
          onChange={onConfirmChange}
          required
          error={confirmError}
        />
        <Button type="submit" disabled={isSubmitDisabled}>
          {loading ? 'Creating...' : 'Sign Up'}
        </Button>
      </form>
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        Already have an account? <Link to="/login">Log In</Link>
      </div>
    </Card>
  );
};

export default SignUp;

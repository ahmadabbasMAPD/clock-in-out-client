import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginRequest, login, loginFailure } from './redux/authActions';
import api from './api';

const Login = ({ onLogin }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    dispatch(loginRequest());

    try {
      // Use api.post so that the baseURL is automatically applied.
      const response = await api.post('/api/auth/login', { username, password });
      const data = response.data;

      // Check if data contains a token; if so, save it.
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      dispatch(login(data));
      setError('');
      onLogin && onLogin(data); // Call the onLogin callback if provided
      navigate('/dashboard'); // Navigate to dashboard after login
    } catch (err) {
      console.error('Login failed:', err);
      dispatch(loginFailure(err.message));
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2 className="welcome-text">Welcome to Clock-In-Out App</h2>
      <div className="login-box">
        <h3 className="login-subtitle">Please sign in to continue</h3>
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="login-input"
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;

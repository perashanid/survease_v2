import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './AuthModal.css';

interface AuthModalProps {
  mode: 'login' | 'register' | 'forgot-password';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'register' | 'forgot-password') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSwitchMode }) => {
  const { login, register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Attempting authentication:', { mode, email: formData.email });
      
      if (mode === 'login') {
        await login(formData.email, formData.password);
        onClose();
      } else if (mode === 'register') {
        await register(formData.email, formData.password, formData.firstName, formData.lastName);
        onClose();
      } else if (mode === 'forgot-password') {
        const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiUrl}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to send reset email');
        }
        
        setSuccess('Password reset instructions have been sent to your email');
        setTimeout(() => onSwitchMode('login'), 3000);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>
            {mode === 'login' ? 'Login' : mode === 'register' ? 'Sign Up' : 'Reset Password'}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          {mode === 'register' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {mode !== 'forgot-password' && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input password-input"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => {
                    console.log('Password toggle clicked, current state:', showPassword);
                    setShowPassword(!showPassword);
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {mode === 'register' && (
                <div className="password-requirements">
                  <small>Password must contain:</small>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {mode === 'forgot-password' && (
            <p className="form-help-text">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Please wait...' : 
             mode === 'login' ? 'Login' : 
             mode === 'register' ? 'Sign Up' : 
             'Send Reset Link'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' && (
            <>
              <p>
                <button 
                  type="button" 
                  className="link-btn" 
                  onClick={() => onSwitchMode('forgot-password')}
                >
                  Forgot password?
                </button>
              </p>
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  className="link-btn" 
                  onClick={() => onSwitchMode('register')}
                >
                  Sign up
                </button>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p>
              Already have an account?{' '}
              <button 
                type="button" 
                className="link-btn" 
                onClick={() => onSwitchMode('login')}
              >
                Login
              </button>
            </p>
          )}
          {mode === 'forgot-password' && (
            <p>
              Remember your password?{' '}
              <button 
                type="button" 
                className="link-btn" 
                onClick={() => onSwitchMode('login')}
              >
                Back to login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

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

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-logo">
              <h1 className="logo-text">SurvEase</h1>
              <div className="logo-icon error-icon">⚠️</div>
            </div>
            <h2 className="reset-title">Invalid Reset Link</h2>
            <p className="error-message">This password reset link is invalid or has expired.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-card success-card">
            <div className="reset-password-logo">
              <h1 className="logo-text">SurvEase</h1>
            </div>
            <div className="success-icon">✓</div>
            <h2 className="reset-title">Password Reset Successful!</h2>
            <p className="success-message">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p className="redirect-message">Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-logo">
            <h1 className="logo-text">SurvEase</h1>
            <div className="logo-icon">🔐</div>
          </div>
          <h2 className="reset-title">Reset Your Password</h2>
          <p className="subtitle">Enter your new password below</p>

          <form onSubmit={handleSubmit} className="reset-password-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  minLength={8}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  minLength={8}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div className="password-requirements">
              <small>Password must contain:</small>
              <ul>
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <div className="back-to-login">
            <button onClick={() => navigate('/')} className="link-btn">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

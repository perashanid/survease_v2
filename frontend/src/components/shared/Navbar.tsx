import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AuthModal from '../auth/AuthModal';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getThemeIcon = (mode: string) => {
    switch (mode) {
      case 'light': return <FiSun />;
      case 'dark': return <FiMoon />;
      case 'system': return <FiMonitor />;
      default: return <FiMonitor />;
    }
  };

  const getThemeLabel = (mode: string) => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            Survey Platform
          </Link>
          
          <div className="navbar-menu">
            <div className="navbar-nav">
              <Link to="/" className="navbar-link"><span>Home</span></Link>
              <Link to="/surveys" className="navbar-link"><span>Public Surveys</span></Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="navbar-link"><span>Dashboard</span></Link>
                  <Link to="/create" className="navbar-link"><span>Create Survey</span></Link>
                  <Link to="/analytics" className="navbar-link"><span>Analytics</span></Link>
                </>
              )}
              
              <Link to="/contact" className="navbar-link"><span>Contact</span></Link>
              <Link to="/privacy" className="navbar-link"><span>Privacy</span></Link>
            </div>
            
            <div className="navbar-actions">
              {isAuthenticated ? (
                <div className="navbar-user">
                  <span className="user-email">{user?.email}</span>
                  <button onClick={handleLogout} className="btn btn-outline btn-sm">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="navbar-auth">
                  <button 
                    onClick={() => handleAuthClick('login')} 
                    className="btn btn-outline btn-sm"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => handleAuthClick('register')} 
                    className="btn btn-primary btn-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
              
              <div className="theme-selector" ref={themeMenuRef}>
                <button 
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="theme-toggle"
                  title={`Current: ${getThemeLabel(themeMode)} mode. Click to change.`}
                >
                  {getThemeIcon(themeMode)}
                </button>
                
                {showThemeMenu && (
                  <div className="theme-menu">
                    {(['light', 'dark', 'system'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setThemeMode(mode);
                          setShowThemeMenu(false);
                        }}
                        className={`theme-option ${themeMode === mode ? 'active' : ''}`}
                      >
                        <span className="theme-icon">{getThemeIcon(mode)}</span>
                        <span className="theme-label">{getThemeLabel(mode)}</span>
                        {mode === 'system' && (
                          <span className="theme-hint">({isDark ? 'Dark' : 'Light'})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </>
  );
};

export default Navbar;
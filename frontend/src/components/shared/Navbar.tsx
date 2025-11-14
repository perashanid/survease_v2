import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import AuthModal from '../auth/AuthModal';
import PointsBadge from '../reciprocal/PointsBadge';
import { 
  FiSun, 
  FiMoon, 
  FiMonitor, 
  FiList, 
  FiGrid, 
  FiPlusCircle, 
  FiBarChart2, 
  FiMail, 
  FiShield,
  FiBell,
  FiUser,
  FiZap
} from 'react-icons/fi';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { unreadCount } = useNotifications();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const navigate = useNavigate();

  // Force clear dark mode on mount if needed
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode');
    console.log('Navbar mounted, saved theme:', savedTheme);
    
    // If you want to force light mode, uncomment this:
    // if (savedTheme === 'dark') {
    //   console.log('Forcing light mode...');
    //   localStorage.setItem('theme-mode', 'light');
    //   setThemeMode('light');
    // }
  }, []);

  const handleAuthClick = (mode: 'login' | 'register' | 'forgot-password') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
            SurvEase
          </Link>
          
          <div className="navbar-menu">
            <div className="navbar-nav">
              <Link to="/surveys" className="navbar-link">
                <FiList className="nav-icon" />
                <span>Public Surveys</span>
              </Link>
              <Link to="/surveys/boosted" className="navbar-link">
                <FiZap className="nav-icon" />
                <span>Boosted Surveys</span>
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="navbar-link">
                    <FiGrid className="nav-icon" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/create" className="navbar-link">
                    <FiPlusCircle className="nav-icon" />
                    <span>Create Survey</span>
                  </Link>
                  <Link to="/analytics" className="navbar-link">
                    <FiBarChart2 className="nav-icon" />
                    <span>Analytics</span>
                  </Link>
                  <Link to="/notifications" className="navbar-link notification-link">
                    <FiBell className="nav-icon" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </Link>
                </>
              )}
              
              <Link to="/contact" className="navbar-link">
                <FiMail className="nav-icon" />
                <span>Contact</span>
              </Link>
              <Link to="/privacy" className="navbar-link">
                <FiShield className="nav-icon" />
                <span>Privacy</span>
              </Link>
            </div>
            
            <div className="navbar-actions">
              {isAuthenticated ? (
                <div className="navbar-user">
                  <PointsBadge />
                  <Link to="/profile" className="btn btn-outline btn-sm">
                    <FiUser />
                    <span>Profile</span>
                  </Link>
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
                    className="btn btn-outline btn-sm"
                  >
                    Sign Up
                  </button>
                </div>
              )}
              
              <div className="theme-selector">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Simple cycle: light -> dark -> system -> light
                    let nextMode: 'light' | 'dark' | 'system';
                    if (themeMode === 'light') {
                      nextMode = 'dark';
                    } else if (themeMode === 'dark') {
                      nextMode = 'system';
                    } else {
                      nextMode = 'light';
                    }
                    
                    console.log('Theme toggle clicked, changing from', themeMode, 'to', nextMode);
                    setThemeMode(nextMode);
                    
                    // Verify change
                    setTimeout(() => {
                      const currentTheme = document.documentElement.getAttribute('data-theme');
                      console.log('DOM theme after change:', currentTheme);
                    }, 100);
                  }}
                  className="theme-toggle"
                  title={`Current: ${getThemeLabel(themeMode)} mode. Click to cycle: Light → Dark → System`}
                  type="button"
                >
                  {getThemeIcon(themeMode)}
                </button>
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
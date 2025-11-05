
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import ConnectionStatus from './components/shared/ConnectionStatus';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/ToastContainer';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import SurveyCreator from './pages/SurveyCreator';
import SurveyResponse from './pages/SurveyResponse';
import PublicSurveys from './pages/PublicSurveys';
import Analytics from './pages/Analytics';
import SurveyAnalytics from './pages/SurveyAnalytics';
import PublicSurveyAnalytics from './pages/PublicSurveyAnalytics';

import BasicAnalyticsDashboard from './pages/BasicAnalyticsDashboard';
import EnhancedAnalyticsDashboard from './pages/EnhancedAnalyticsDashboard';
import AdvancedAnalyticsDashboard from './pages/AdvancedAnalyticsDashboard';
import ComprehensiveAnalyticsDashboard from './pages/ComprehensiveAnalyticsDashboard';
import AttentionAnalyticsDashboard from './pages/AttentionAnalyticsDashboard';
import AnalyticsSelector from './pages/AnalyticsSelector';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we need to redirect from 404 page
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && location.pathname === '/') {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  return null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="App">
                <RedirectHandler />
                <ScrollToTop />
                <Navbar />
                <ConnectionStatus />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create" element={<SurveyCreator />} />
                    <Route path="/surveys" element={<PublicSurveys />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/survey/:slug" element={<SurveyResponse />} />
                    <Route path="/survey-analytics/:surveyId" element={<SurveyAnalytics />} />
                    <Route path="/basic-analytics/:surveyId" element={<BasicAnalyticsDashboard />} />
                    <Route path="/enhanced-analytics/:surveyId" element={<EnhancedAnalyticsDashboard />} />
                    <Route path="/advanced-analytics/:surveyId" element={<AdvancedAnalyticsDashboard />} />
                    <Route path="/comprehensive-analytics/:surveyId" element={<ComprehensiveAnalyticsDashboard />} />
                    <Route path="/attention-analytics/:surveyId?" element={<AttentionAnalyticsDashboard />} />
                    <Route path="/analytics-selector/:surveyId" element={<AnalyticsSelector />} />
                    <Route path="/public-survey-analytics/:surveyId" element={<PublicSurveyAnalytics />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
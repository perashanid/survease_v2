
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import ConnectionStatus from './components/shared/ConnectionStatus';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import SurveyCreator from './pages/SurveyCreator';
import SurveyResponse from './pages/SurveyResponse';
import PublicSurveys from './pages/PublicSurveys';
import Analytics from './pages/Analytics';
import SurveyAnalytics from './pages/SurveyAnalytics';
import PublicSurveyAnalytics from './pages/PublicSurveyAnalytics';
import EnhancedSurveyAnalytics from './pages/EnhancedSurveyAnalytics';
import AdvancedAnalyticsDashboard from './pages/AdvancedAnalyticsDashboard';
import ComprehensiveAnalyticsDashboard from './pages/ComprehensiveAnalyticsDashboard';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <RedirectHandler />
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
                <Route path="/enhanced-analytics/:surveyId" element={<EnhancedSurveyAnalytics />} />
                <Route path="/advanced-analytics/:surveyId" element={<AdvancedAnalyticsDashboard />} />
                <Route path="/comprehensive-analytics/:surveyId" element={<ComprehensiveAnalyticsDashboard />} />
                <Route path="/public-survey-analytics/:surveyId" element={<PublicSurveyAnalytics />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
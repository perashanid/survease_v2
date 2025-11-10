
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import ConnectionStatus from './components/shared/ConnectionStatus';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/ToastContainer';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PointsProvider } from './contexts/PointsContext';
import './App.css';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SurveyCreator = lazy(() => import('./pages/SurveyCreator'));
const SurveyResponse = lazy(() => import('./pages/SurveyResponse'));
const PublicSurveys = lazy(() => import('./pages/PublicSurveys'));
const BoostedSurveys = lazy(() => import('./pages/BoostedSurveys'));
const PointsDashboard = lazy(() => import('./pages/PointsDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const SurveyAnalytics = lazy(() => import('./pages/SurveyAnalytics'));
const PublicSurveyAnalytics = lazy(() => import('./pages/PublicSurveyAnalytics'));
const BasicAnalyticsDashboard = lazy(() => import('./pages/BasicAnalyticsDashboard'));
const EnhancedAnalyticsDashboard = lazy(() => import('./pages/EnhancedAnalyticsDashboard'));
const AdvancedAnalyticsDashboard = lazy(() => import('./pages/AdvancedAnalyticsDashboard'));
const ComprehensiveAnalyticsDashboard = lazy(() => import('./pages/ComprehensiveAnalyticsDashboard'));
const AttentionAnalyticsDashboard = lazy(() => import('./pages/AttentionAnalyticsDashboard'));
const AnalyticsSelector = lazy(() => import('./pages/AnalyticsSelector'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '60vh' 
  }}>
    <div className="spinner"></div>
  </div>
);

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
    // Scroll to top immediately when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    
    // Also scroll document element and body to ensure it works everywhere
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PointsProvider>
              <ToastProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="App">
                <RedirectHandler />
                <ScrollToTop />
                <Navbar />
                <ConnectionStatus />
                <main className="main-content">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/create" element={<SurveyCreator />} />
                      <Route path="/surveys" element={<PublicSurveys />} />
                      <Route path="/surveys/boosted" element={<BoostedSurveys />} />
                      <Route path="/points" element={<PointsDashboard />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/survey/:slug" element={<SurveyResponse />} />
                      <Route path="/survey/custom/:token" element={<SurveyResponse />} />
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
                      <Route path="/x-admin-portal" element={<AdminDashboard />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
              </div>
            </Router>
            </ToastProvider>
          </PointsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/shared/Navbar';
import Footer from './components/shared/Footer';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import SurveyCreator from './pages/SurveyCreator';
import SurveyResponse from './pages/SurveyResponse';
import PublicSurveys from './pages/PublicSurveys';
import Analytics from './pages/Analytics';
import SurveyAnalytics from './pages/SurveyAnalytics';
import PublicSurveyAnalytics from './pages/PublicSurveyAnalytics';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/create" element={<SurveyCreator />} />
                <Route path="/surveys" element={<PublicSurveys />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/survey/:slug" element={<SurveyResponse />} />
                <Route path="/survey-analytics/:surveyId" element={<SurveyAnalytics />} />
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
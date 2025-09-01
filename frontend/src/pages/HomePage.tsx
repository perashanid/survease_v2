import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import './HomePage.css';

interface PlatformStats {
  totalSurveys: number;
  totalResponses: number;
  activeSurveys: number;
}

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/platform');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalSurveys: data.data.surveys.total,
          totalResponses: data.data.responses.total,
          activeSurveys: data.data.surveys.active
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Fallback to mock data
      setStats({
        totalSurveys: 1,
        totalResponses: 3,
        activeSurveys: 1
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      <section className="hero">
        <div className="hero-background">
          <div className="hero-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Create Powerful Surveys in <span className="gradient-text">Minutes</span>
            </h1>
            <p className="hero-subtitle">
              Build, share, and analyze surveys with our easy-to-use platform. 
              Collect responses from anywhere and get real-time insights with modern analytics.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/create" className="btn btn-primary btn-lg">
                    <span>✨ Create Survey</span>
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline btn-lg">
                    <span>📊 View Dashboard</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/surveys" className="btn btn-primary btn-lg">
                    <span>🚀 Browse Surveys</span>
                  </Link>
                  <button className="btn btn-outline btn-lg">
                    <span>💫 Get Started</span>
                  </button>
                </>
              )}
            </div>
            <div className="hero-image">
              <div className="dashboard-mockup">
                <div className="mockup-header">
                  <div className="mockup-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="mockup-content">
                  <div className="chart-bars">
                    <div className="bar" style={{height: '60%'}}></div>
                    <div className="bar" style={{height: '80%'}}></div>
                    <div className="bar" style={{height: '45%'}}></div>
                    <div className="bar" style={{height: '90%'}}></div>
                    <div className="bar" style={{height: '70%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">
                {loading ? '...' : stats.totalSurveys.toLocaleString()}
              </div>
              <div className="stat-label">Total Surveys</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {loading ? '...' : stats.totalResponses.toLocaleString()}
              </div>
              <div className="stat-label">Responses Collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {loading ? '...' : stats.activeSurveys.toLocaleString()}
              </div>
              <div className="stat-label">Active Surveys</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Our Platform?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Easy Survey Creation</h3>
              <p>Create surveys with multiple question types including text, multiple choice, checkboxes, and rating scales.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Easy Sharing</h3>
              <p>Share your surveys with custom URLs and collect responses from anywhere in the world.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Analytics</h3>
              <p>Get instant insights with real-time response tracking and comprehensive analytics dashboard.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy Options</h3>
              <p>Choose between anonymous and authenticated responses to match your privacy requirements.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Surveys work perfectly on all devices - desktop, tablet, and mobile phones.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Data Export</h3>
              <p>Export your survey data in multiple formats including JSON and CSV for further analysis.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">💬</div>
                <p>"This platform made survey creation so simple. The analytics are incredible and helped us make data-driven decisions."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-info">
                  <h4>Sarah Johnson</h4>
                  <span>Marketing Director</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">💬</div>
                <p>"The real-time responses and beautiful interface make this the best survey tool we've used. Highly recommended!"</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍💻</div>
                <div className="author-info">
                  <h4>Mike Chen</h4>
                  <span>Product Manager</span>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-icon">💬</div>
                <p>"Amazing platform! The mobile-friendly surveys and export features saved us hours of work. Perfect for our research."</p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍🔬</div>
                <div className="author-info">
                  <h4>Dr. Emily Rodriguez</h4>
                  <span>Research Scientist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2>Ready to Create Your First Survey?</h2>
              <p>Join thousands of users who trust our platform for their survey needs. Start collecting valuable insights today.</p>
            </div>
            <div className="cta-actions">
              {isAuthenticated ? (
                <Link to="/create" className="btn btn-primary btn-lg">
                  <span>🚀 Create Survey Now</span>
                </Link>
              ) : (
                <>
                  <Link to="/surveys" className="btn btn-primary btn-lg">
                    <span>🚀 Get Started Free</span>
                  </Link>
                  <Link to="/surveys" className="btn btn-outline btn-lg">
                    <span>📋 View Examples</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
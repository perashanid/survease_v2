import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  FiCheckCircle, FiUsers, FiBarChart2, FiLock, 
  FiSmartphone, FiDownload, FiArrowRight, FiStar,
  FiTrendingUp, FiZap, FiGlobe
} from 'react-icons/fi';
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
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/stats/platform`);
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalSurveys: data.data.surveys.total,
          totalResponses: data.data.responses.total,
          activeSurveys: data.data.surveys.active
        });
      }
    } catch (error) {
      setStats({
        totalSurveys: 1,
        totalResponses: 3,
        activeSurveys: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiCheckCircle />,
      title: 'Easy Survey Creation',
      description: 'Create surveys with multiple question types including text, multiple choice, checkboxes, and rating scales.'
    },
    {
      icon: <FiGlobe />,
      title: 'Easy Sharing',
      description: 'Share your surveys with custom URLs and collect responses from anywhere in the world.'
    },
    {
      icon: <FiBarChart2 />,
      title: 'Real-time Analytics',
      description: 'Get instant insights with real-time response tracking and comprehensive analytics dashboard.'
    },
    {
      icon: <FiLock />,
      title: 'Privacy Options',
      description: 'Choose between anonymous and authenticated responses to match your privacy requirements.'
    },
    {
      icon: <FiSmartphone />,
      title: 'Mobile Friendly',
      description: 'Surveys work perfectly on all devices - desktop, tablet, and mobile phones.'
    },
    {
      icon: <FiDownload />,
      title: 'Data Export',
      description: 'Export your survey data in multiple formats including JSON and CSV for further analysis.'
    }
  ];

  const testimonials = [
    {
      icon: <FiStar />,
      content: 'This survey platform transformed how we gather customer feedback. The analytics are incredibly detailed and easy to understand.',
      author: 'Sarah Johnson',
      role: 'Product Manager'
    },
    {
      icon: <FiTrendingUp />,
      content: 'The real-time response tracking has been a game-changer for our research team. We can make decisions faster than ever.',
      author: 'Michael Chen',
      role: 'Research Director'
    },
    {
      icon: <FiZap />,
      content: 'Simple, powerful, and reliable. Everything we needed in a survey platform without the complexity of enterprise tools.',
      author: 'Emily Rodriguez',
      role: 'Marketing Lead'
    }
  ];

  return (
    <div className="homepage">
      <section className="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <motion.div 
          className="container"
          style={{ opacity, scale }}
        >
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <h1 className="hero-title">
                <TypewriterText text="Create Powerful Surveys in " />
                <span className="gradient-text">Minutes</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              Build, share, and analyze surveys with our easy-to-use platform. 
              Collect responses from anywhere and get real-time insights with modern analytics.
            </motion.p>
            
            <motion.div 
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              {isAuthenticated ? (
                <>
                  <Link to="/create" className="btn btn-primary btn-lg">
                    <span>Create Survey</span>
                    <FiArrowRight />
                  </Link>
                  <Link to="/dashboard" className="btn btn-outline btn-lg">
                    <FiBarChart2 />
                    <span>View Dashboard</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/surveys" className="btn btn-primary btn-lg">
                    <span>Browse Surveys</span>
                    <FiArrowRight />
                  </Link>
                  <button className="btn btn-outline btn-lg">
                    <FiZap />
                    <span>Get Started</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <StatCard 
              number={loading ? '...' : stats.totalSurveys.toLocaleString()}
              label="Total Surveys"
              delay={0}
            />
            <StatCard 
              number={loading ? '...' : stats.totalResponses.toLocaleString()}
              label="Responses Collected"
              delay={0.1}
            />
            <StatCard 
              number={loading ? '...' : stats.activeSurveys.toLocaleString()}
              label="Active Surveys"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">
            Why Choose Our Platform?
          </h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">
            What Our Users Say
          </h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} delay={index * 0.1} />
            ))}
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
                  <span>Create Survey Now</span>
                  <FiArrowRight />
                </Link>
              ) : (
                <>
                  <Link to="/surveys" className="btn btn-primary btn-lg">
                    <span>Get Started Free</span>
                    <FiArrowRight />
                  </Link>
                  <Link to="/surveys" className="btn btn-outline btn-lg">
                    <FiCheckCircle />
                    <span>View Examples</span>
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

// Typewriter effect component
const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [text]);
  
  return <>{displayText}</>;
};

// Stat card component
const StatCard: React.FC<{ number: string; label: string; delay: number }> = ({ number, label, delay }) => {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
};

// Feature card component
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number }> = 
  ({ icon, title, description, delay }) => {
  return (
    <motion.div
      className="feature-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -12, transition: { duration: 0.2 } }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
};

// Testimonial card component
const TestimonialCard: React.FC<{ icon: React.ReactNode; content: string; author: string; role: string; delay: number }> = 
  ({ icon, content, author, role, delay }) => {
  return (
    <motion.div
      className="testimonial-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
    >
      <div className="testimonial-content">
        <div className="quote-icon">{icon}</div>
        <p>{content}</p>
      </div>
      <div className="testimonial-author">
        <div className="author-avatar">
          <FiUsers />
        </div>
        <div className="author-info">
          <h4>{author}</h4>
          <span>{role}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;

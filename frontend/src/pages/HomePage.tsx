import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckCircle, FiUsers, FiBarChart2, FiLock, 
  FiSmartphone, FiDownload, FiArrowRight,
  FiZap, FiGlobe, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import ScrollReveal from '../components/shared/ScrollReveal';
import './HomePage.css';

interface PlatformStats {
  totalSurveys: number;
  totalResponses: number;
  activeSurveys: number;
  totalUsers: number;
}

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<PlatformStats>({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  
  const heroRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleGetStarted = () => {
    // Scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Trigger the navbar login button after a short delay
    setTimeout(() => {
      const loginButton = document.querySelector('.navbar-actions button') as HTMLButtonElement;
      if (loginButton) {
        loginButton.click();
      }
    }, 300);
  };

  const fetchStats = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/stats/platform`);
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalSurveys: data.data.surveys.total,
          totalResponses: data.data.responses.total,
          activeSurveys: data.data.surveys.active,
          totalUsers: data.data.users.total
        });
      }
    } catch (error) {
      setStats({
        totalSurveys: 1,
        totalResponses: 3,
        activeSurveys: 1,
        totalUsers: 1
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
      content: 'SurvEase transformed how we gather customer feedback. The analytics are incredibly detailed and easy to understand.',
      author: 'Sarah Johnson',
      role: 'Product Manager',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      rating: 5
    },
    {
      content: 'The real-time response tracking has been a game-changer for our research team. We can make decisions faster than ever.',
      author: 'Michael Chen',
      role: 'Research Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      rating: 5
    },
    {
      content: 'Simple, powerful, and reliable. Everything we needed without the complexity of enterprise tools.',
      author: 'Emily Rodriguez',
      role: 'Marketing Lead',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
      rating: 5
    },
    {
      content: 'The best survey platform I\'ve used. Intuitive interface and powerful features that actually work.',
      author: 'David Kim',
      role: 'UX Researcher',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      rating: 5
    },
    {
      content: 'Outstanding customer support and a platform that keeps getting better. Highly recommended!',
      author: 'Lisa Anderson',
      role: 'Business Analyst',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop',
      rating: 5
    }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="homepage">
      <section className="hero" ref={heroRef}>
        <div className="hero-background">
          <div className="hero-bg-image"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <h1 className="hero-title">
                Create Powerful Surveys in Minutes
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
                  <button 
                    className="btn btn-outline btn-lg"
                    onClick={handleGetStarted}
                  >
                    <FiZap />
                    <span>Get Started</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
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
            <StatCard 
              number={loading ? '...' : stats.totalUsers.toLocaleString()}
              label="Registered Users"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="section-title">
              Why Choose Our Platform?
            </h2>
          </ScrollReveal>
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.08} />
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <ScrollReveal direction="up" delay={0.1}>
            <h2 className="section-title">
              What Our Users Say
            </h2>
          </ScrollReveal>
          <div className="testimonial-carousel">
            <button 
              className="carousel-btn carousel-btn-prev" 
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <FiChevronLeft />
            </button>
            
            <div className="carousel-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="carousel-slide"
                >
                  <TestimonialCarouselCard {...testimonials[currentTestimonial]} />
                </motion.div>
              </AnimatePresence>
            </div>

            <button 
              className="carousel-btn carousel-btn-next" 
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <FiChevronRight />
            </button>
          </div>

          <div className="carousel-indicators">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentTestimonial(index);
                }}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <ScrollReveal direction="up" delay={0.1}>
              <div className="cta-text">
                <h2>Ready to Create Your First Survey?</h2>
                <p>Join thousands of users who trust our platform for their survey needs. Start collecting valuable insights today.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.3}>
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
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
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
    <ScrollReveal direction="up" delay={delay}>
      <motion.div
        className="feature-card"
        whileHover={{ y: -12, transition: { duration: 0.2 } }}
      >
        <div className="feature-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </motion.div>
    </ScrollReveal>
  );
};

// Testimonial carousel card component
const TestimonialCarouselCard: React.FC<{ 
  content: string; 
  author: string; 
  role: string; 
  avatar: string;
  rating: number;
}> = ({ content, author, role, avatar }) => {
  return (
    <div className="testimonial-carousel-card">
      <div className="testimonial-content">
        <div className="quote-icon">❝</div>
        <p>{content}</p>
      </div>
      <div className="testimonial-author">
        <img 
          src={avatar} 
          alt={author}
          className="author-avatar-img"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="author-avatar-fallback hidden">
          <FiUsers />
        </div>
        <div className="author-info">
          <h4>{author}</h4>
          <span>{role}</span>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SurveyService, Survey } from '../services/surveyService';
import { useAuth } from '../contexts/AuthContext';
import { timeTrackingService } from '../services/timeTrackingService';
import AuthModal from '../components/auth/AuthModal';
import './SurveyResponse.css';

interface QuestionResponse {
  [questionId: string]: any;
}

const SurveyResponse: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Get invitation token from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('token');
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<QuestionResponse>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [respondentEmail, setRespondentEmail] = useState('');
  const [showProgress, setShowProgress] = useState(true);
  
  // New states for anonymous voting flow
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Timing tracking states
  const [, setCompletionTime] = useState<number | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSurvey();
    }
  }, [slug]);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      const surveyData = await SurveyService.getSurveyBySlug(slug!, invitationToken || undefined);
      setSurvey(surveyData);
      setShowProgress(surveyData.settings.show_results || false);
      
      // Start time tracking when survey is loaded
      if (slug && !timeTrackingService.isSurveyTracked(slug)) {
        timeTrackingService.startSurvey(slug);
      }
      
      // Show authentication choice for unauthenticated users
      // They can choose to login or proceed anonymously (if allowed)
      if (!isAuthenticated) {
        setShowAuthChoice(true);
      }
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message || 'Failed to load survey';
      
      if (errorCode === 'ALREADY_RESPONDED') {
        setSubmitted(true); // Show the "already responded" state
      } else if (errorCode === 'SURVEY_PRIVATE') {
        setError('This survey is private. You need a valid invitation link to access it.');
      } else if (errorCode === 'INVITATION_EXPIRED') {
        setError('This invitation has expired. Please contact the survey creator for a new invitation.');
      } else if (errorCode === 'INVITATION_USAGE_EXCEEDED') {
        setError('This invitation has reached its usage limit. Please contact the survey creator for a new invitation.');
      } else if (errorCode === 'SURVEY_NOT_FOUND') {
        setError('Survey not found. The survey may have been deleted or the link is incorrect.');
      } else if (errorCode === 'SURVEY_CLOSED') {
        setError('This survey is no longer accepting responses.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateCurrentQuestion = (): boolean => {
    if (!survey) return false;
    
    const currentQuestion = survey.questions[currentQuestionIndex];
    const response = responses[currentQuestion.id];
    
    if (currentQuestion.required && (response === undefined || response === null || response === '')) {
      setError(`Please answer the required question: "${currentQuestion.question}"`);
      return false;
    }
    
    setError('');
    return true;
  };

  const nextQuestion = () => {
    if (validateCurrentQuestion() && currentQuestionIndex < survey!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setError('');
    }
  };

  const handleAuthChoice = (choice: 'login' | 'anonymous') => {
    if (choice === 'login') {
      setShowAuthModal(true);
    }
    setShowAuthChoice(false);
  };



  const handleSubmit = async () => {
    if (!survey || !slug) return;
    
    // Check authentication requirements before submission
    if (!survey.settings.allow_anonymous && !isAuthenticated) {
      setShowAuthChoice(true);
      return;
    }
    
    // Validate all required questions
    for (const question of survey.questions) {
      const response = responses[question.id];
      if (question.required && (response === undefined || response === null || response === '')) {
        setError(`Please answer the required question: "${question.question}"`);
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      // Calculate completion time
      const calculatedCompletionTime = timeTrackingService.calculateCompletionTime(slug);
      const surveyStartTime = timeTrackingService.getStartTime(slug);
      
      setCompletionTime(calculatedCompletionTime);

      const submissionData = {
        responses,
        ...(respondentEmail && { respondent_email: respondentEmail }),
        ...(calculatedCompletionTime && { completion_time: calculatedCompletionTime }),
        ...(surveyStartTime && { started_at: surveyStartTime })
      };

      await SurveyService.submitResponse(slug, submissionData);
      
      // Clear tracking data after successful submission
      timeTrackingService.clearSurveyTracking(slug);
      
      setSubmitted(true);
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message || 'Failed to submit response';
      
      if (errorCode === 'ALREADY_RESPONDED') {
        // Clear tracking data even if already responded
        timeTrackingService.clearSurveyTracking(slug);
        setSubmitted(true); // Show success state even if already responded
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: any) => {
    const value = responses[question.id];

    switch (question.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={question.type}
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="form-input"
            placeholder="Enter your answer..."
            required={question.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="form-textarea"
            placeholder="Enter your answer..."
            rows={4}
            required={question.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="form-input"
            placeholder="Enter a number..."
            required={question.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="form-input"
            required={question.required}
          />
        );

      case 'multiple_choice':
      case 'dropdown':
        return (
          <div className="options-container">
            {question.type === 'dropdown' ? (
              <select
                value={value || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="form-input"
                required={question.required}
              >
                <option value="">Select an option...</option>
                {question.options?.map((option: string, index: number) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              question.options?.map((option: string, index: number) => (
                <label key={index} className="radio-label">
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    required={question.required}
                  />
                  <span className="radio-text">{option}</span>
                </label>
              ))
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="options-container">
            {question.options?.map((option: string, index: number) => (
              <label key={index} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleResponseChange(question.id, [...currentValues, option]);
                    } else {
                      handleResponseChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                />
                <span className="checkbox-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const minRating = question.min_rating || 1;
        const maxRating = question.max_rating || 5;
        return (
          <div className="rating-container">
            <div className="rating-scale">
              <span className="rating-label">
                {minRating} (Poor)
              </span>
              <div className="rating-buttons">
                {Array.from({ length: maxRating - minRating + 1 }, (_, i) => {
                  const ratingValue = minRating + i;
                  return (
                    <button
                      key={ratingValue}
                      type="button"
                      className={`rating-button ${value === ratingValue ? 'selected' : ''}`}
                      onClick={() => handleResponseChange(question.id, ratingValue)}
                    >
                      {ratingValue}
                    </button>
                  );
                })}
              </div>
              <span className="rating-label">
                {maxRating} (Excellent)
              </span>
            </div>
          </div>
        );

      default:
        return (
          <div className="error">
            Unsupported question type: {question.type}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="survey-response">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading survey...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !survey) {
    const isPrivateError = error.includes('private') || error.includes('invitation');
    
    return (
      <div className="survey-response">
        <div className="container">
          <div className="error-state">
            <h1>Survey Not Available</h1>
            <p>{error}</p>
            {isPrivateError && (
              <div className="error-help">
                <h3>Need access to this survey?</h3>
                <ul>
                  <li>Check that you're using the complete invitation link</li>
                  <li>Make sure the invitation hasn't expired</li>
                  <li>Contact the survey creator for a new invitation</li>
                </ul>
              </div>
            )}
            <div className="error-actions">
              <button onClick={() => navigate('/')} className="btn btn-primary">
                Go Home
              </button>
              <button onClick={() => navigate('/surveys')} className="btn btn-outline">
                Browse Public Surveys
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="survey-response">
        <div className="container">
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h1>Thank You!</h1>
            <p>Your response has been submitted successfully.</p>
            {survey?.settings.show_results && (
              <p>You can view the results once they are available.</p>
            )}
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Take Another Survey
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication choice modal
  if (showAuthChoice && survey) {
    return (
      <div className="survey-response">
        <div className="container">
          <div className="auth-choice-modal">
            <div className="auth-choice-content">
              <h1>{survey.title}</h1>
              {survey.description && (
                <p className="survey-description">{survey.description}</p>
              )}
              
              <div className="auth-choice-section">
                <h2>How would you like to participate?</h2>
                <p>
                  {survey.settings.allow_anonymous 
                    ? "This survey allows both authenticated and anonymous responses."
                    : "This survey requires authentication to participate."
                  }
                </p>
                
                <div className="auth-choice-buttons">
                  <button
                    onClick={() => handleAuthChoice('login')}
                    className="btn btn-primary auth-choice-btn"
                  >
                    <div className="choice-content">
                      <span className="choice-icon">👤</span>
                      <div className="choice-text">
                        <strong>Sign In</strong>
                        <small>Track your responses and get personalized features</small>
                      </div>
                    </div>
                  </button>
                  
                  {survey.settings.allow_anonymous && (
                    <button
                      onClick={() => handleAuthChoice('anonymous')}
                      className="btn btn-outline auth-choice-btn"
                    >
                      <div className="choice-content">
                        <span className="choice-icon">🕶️</span>
                        <div className="choice-text">
                          <strong>Continue Anonymously</strong>
                          <small>Participate without creating an account</small>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
                
                {!survey.settings.allow_anonymous && (
                  <div className="auth-requirement-note">
                    <p><strong>Note:</strong> This survey creator has chosen to require authentication for all responses.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {showAuthModal && (
          <AuthModal
            mode="login"
            onClose={() => setShowAuthModal(false)}
            onSwitchMode={(_mode) => {}}
          />
        )}
      </div>
    );
  }

  if (!survey) return null;

  const currentQuestion = survey.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  return (
    <div className="survey-response">
      <div className="container">
        <div className="survey-header">
          <h1>{survey.title}</h1>
          {survey.description && (
            <p className="survey-description">{survey.description}</p>
          )}
          
          {showProgress && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                Question {currentQuestionIndex + 1} of {survey.questions.length}
              </span>
            </div>
          )}
        </div>

        <div className="question-container">
          <div className="question-card">
            <div className="question-header">
              <h2 className="question-text">
                {currentQuestion.question}
                {currentQuestion.required && <span className="required">*</span>}
              </h2>
            </div>

            <div className="question-content">
              {renderQuestion(currentQuestion)}
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Email collection for last question if enabled */}
            {isLastQuestion && survey.settings.collect_email && (
              <div className="email-collection">
                <label className="form-label">
                  Email Address {survey.settings.collect_email && <span className="required">*</span>}
                </label>
                <input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email address..."
                  required={survey.settings.collect_email}
                />
              </div>
            )}

            <div className="question-actions">
              <div className="nav-buttons">
                {currentQuestionIndex > 0 && (
                  <button
                    type="button"
                    onClick={previousQuestion}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                )}
                
                {!isLastQuestion ? (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="btn btn-primary"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? 'Submitting...' : 'Submit Survey'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="survey-footer">
          <p className="survey-info">
            Responses: {survey.response_count} • 
            Created: {new Date(survey.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      {showAuthModal && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={(_mode) => {}}
        />
      )}
    </div>
  );
};

export default SurveyResponse;
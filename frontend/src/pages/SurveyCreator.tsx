import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePoints } from '../contexts/PointsContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { SurveyService } from '../services/surveyService';
import QuestionEditor, { Question } from '../components/survey/QuestionEditor';
import SurveyPreview from '../components/survey/SurveyPreview';
import { SUGGESTED_SURVEY_TAGS } from '../constants/surveyTags';
import { POINTS_COSTS } from '../constants/points';
import { motion } from 'framer-motion';
import { 
  FiSave, FiEye, FiEyeOff, FiType, FiCheckSquare, 
  FiList, FiStar, FiChevronDown, FiAlertCircle 
} from 'react-icons/fi';
import './SurveyCreator.css';

const SURVEY_CREATION_COST = POINTS_COSTS.SURVEY_CREATION;

interface SurveySettings {
  allowAnonymous: boolean;
  requireLogin: boolean;
  showProgress: boolean;
  customStyling?: {
    primaryColor?: string;
    backgroundColor?: string;
  };
}

const SurveyCreator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { points, refreshPoints } = usePoints();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<SurveySettings>({
    allowAnonymous: true,
    requireLogin: true,
    showProgress: true
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch points when component mounts
  useEffect(() => {
    refreshPoints();
  }, [refreshPoints]);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const hasEnoughPoints = points ? points.total_points >= SURVEY_CREATION_COST : true;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const generateQuestionId = () => {
    return `q${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  const addQuestion = (type: Question['type'] = 'text') => {
    const newQuestion: Question = {
      id: generateQuestionId(),
      type,
      title: '',
      required: false,
      options: type === 'rating' ? ['1', '2', '3', '4', '5'] : 
               ['multiple_choice', 'checkbox', 'dropdown'].includes(type) ? [''] : undefined
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion: Question = {
      ...questionToDuplicate,
      id: generateQuestionId(),
      title: `${questionToDuplicate.title} (Copy)`
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicatedQuestion);
    setQuestions(newQuestions);
  };



  const saveSurvey = async () => {
    if (!title.trim()) {
      setError('Survey title is required');
      return;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return;
    }

    // Check if user has enough points
    if (!hasEnoughPoints) {
      setError(`You need ${SURVEY_CREATION_COST} points to create a survey. You currently have ${points?.total_points || 0} points.`);
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.title.trim()) {
        setError(`Question ${i + 1} title is required`);
        return;
      }
      
      if (['multiple_choice', 'checkbox', 'dropdown'].includes(question.type)) {
        const validOptions = question.options?.filter(opt => opt.trim()) || [];
        if (validOptions.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options`);
          return;
        }
      }
    }

    setSaving(true);
    setError('');

    try {
      const surveyData = {
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags,
        questions: questions.map(q => ({
          id: q.id,
          type: q.type,
          question: q.title,
          required: q.required,
          options: q.options?.filter(opt => opt.trim()) || undefined,
          min_rating: q.type === 'rating' ? (q.minRating || 1) : undefined,
          max_rating: q.type === 'rating' ? (q.maxRating || 5) : undefined
        })),
        settings: {
          is_public: isPublic,
          allow_anonymous: settings.allowAnonymous,
          collect_email: false,
          one_response_per_user: settings.requireLogin,
          show_results: false,
          close_date: endDate ? new Date(endDate).toISOString() : undefined
        }
      };

      await SurveyService.createSurvey(surveyData);
      
      // Refresh points after successful creation
      await refreshPoints();
      
      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to create survey';
      setError(errorMessage);
      
      // If it's an insufficient points error, refresh points to show current balance
      if (err.response?.data?.error?.code === 'INSUFFICIENT_POINTS') {
        await refreshPoints();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="survey-creator">
      <div className="creator-container">
        <motion.div 
          className="creator-main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="creator-header">
            <div className="header-title">
              <h1>Create Survey</h1>
              <p>Build your survey with multiple question types</p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-outline"
              >
                {showPreview ? <><FiEyeOff /> Hide Preview</> : <><FiEye /> Show Preview</>}
              </button>
              <button
                type="button"
                onClick={saveSurvey}
                disabled={saving || !hasEnoughPoints}
                className="btn btn-primary"
                title={!hasEnoughPoints ? `You need ${SURVEY_CREATION_COST} points to create a survey` : ''}
              >
                {saving ? 'Saving...' : <><FiSave /> Save Survey (${SURVEY_CREATION_COST} points)</>}
              </button>
            </div>
          </div>

          {!hasEnoughPoints && (
            <motion.div 
              className="warning"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                background: '#fff3cd', 
                color: '#856404', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <FiAlertCircle size={20} />
              <span>
                You need {SURVEY_CREATION_COST} points to create a survey. 
                You currently have {points?.total_points || 0} points. 
                Complete surveys to earn more points!
              </span>
            </motion.div>
          )}

          {error && (
            <motion.div 
              className="error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="creator-content">
            <div className="creator-form">
              {/* Basic Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Basic Information</h3>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Survey Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter survey title..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                    placeholder="Enter survey description..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <div className="tags-container">
                    <div className="tags-list">
                      {tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setTags(tags.filter((_, i) => i !== index))}
                            className="tag-remove"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="tag-input-group">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
                              setTags([...tags, newTag.trim().toLowerCase()]);
                              setNewTag('');
                            }
                          }
                        }}
                        className="form-input"
                        placeholder="Add tags (e.g., student research, business survey)..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
                            setTags([...tags, newTag.trim().toLowerCase()]);
                            setNewTag('');
                          }
                        }}
                        className="btn btn-secondary"
                      >
                        Add Tag
                      </button>
                    </div>
                    <div className="suggested-tags">
                      <small>Suggested: </small>
                      {SUGGESTED_SURVEY_TAGS.slice(0, 8).map(suggestedTag => (
                        !tags.includes(suggestedTag) && (
                          <button
                            key={suggestedTag}
                            type="button"
                            onClick={() => setTags([...tags, suggestedTag])}
                            className="suggested-tag"
                          >
                            {suggestedTag}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Survey Settings */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Survey Settings</h3>
                </div>
                
                <div className="settings-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    Make survey public
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Survey is active
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.allowAnonymous}
                      onChange={(e) => setSettings({
                        ...settings,
                        allowAnonymous: e.target.checked
                      })}
                    />
                    Allow anonymous responses
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.showProgress}
                      onChange={(e) => setSettings({
                        ...settings,
                        showProgress: e.target.checked
                      })}
                    />
                    Show progress bar
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Questions</h3>
                </div>

                <div className="questions-list">
                  {questions.length === 0 ? (
                    <motion.div 
                      className="empty-questions"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiList className="empty-icon" />
                      <p>No questions added yet. Use the buttons below to add questions.</p>
                    </motion.div>
                  ) : (
                    questions.map((question, index) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <QuestionEditor
                          question={question}
                          onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                          onDelete={() => deleteQuestion(index)}
                          onDuplicate={() => duplicateQuestion(index)}
                        />
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Add Question Buttons - Moved to Bottom */}
                <div className="question-types-bottom">
                  <h4>Add Question</h4>
                  <div className="question-types">
                    <button
                      type="button"
                      onClick={() => addQuestion('text')}
                      className="btn btn-outline btn-sm"
                    >
                      <FiType /> Text
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('multiple_choice')}
                      className="btn btn-outline btn-sm"
                    >
                      <FiCheckSquare /> Multiple Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('checkbox')}
                      className="btn btn-outline btn-sm"
                    >
                      <FiCheckSquare /> Checkboxes
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('dropdown')}
                      className="btn btn-outline btn-sm"
                    >
                      <FiChevronDown /> Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('rating')}
                      className="btn btn-outline btn-sm"
                    >
                      <FiStar /> Rating
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <motion.div 
                className="creator-preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SurveyPreview
                  title={title}
                  description={description}
                  questions={questions}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SurveyCreator;
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { SurveyService } from '../services/surveyService';
import QuestionEditor, { Question } from '../components/survey/QuestionEditor';
import SurveyPreview from '../components/survey/SurveyPreview';
import './SurveyCreator.css';

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
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

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
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create survey');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="survey-creator">
      <div className="creator-container">
        <div className="creator-main">
          <div className="creator-header">
            <h1>Create Survey</h1>
            <div className="header-actions">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-outline"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                type="button"
                onClick={saveSurvey}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Survey'}
              </button>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

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
                  <div className="question-types">
                    <button
                      type="button"
                      onClick={() => addQuestion('text')}
                      className="btn btn-outline btn-sm"
                    >
                      + Text
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('multiple_choice')}
                      className="btn btn-outline btn-sm"
                    >
                      + Multiple Choice
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('checkbox')}
                      className="btn btn-outline btn-sm"
                    >
                      + Checkboxes
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('dropdown')}
                      className="btn btn-outline btn-sm"
                    >
                      + Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('rating')}
                      className="btn btn-outline btn-sm"
                    >
                      + Rating
                    </button>
                  </div>
                </div>

                <div className="questions-list">
                  {questions.length === 0 ? (
                    <div className="empty-questions">
                      <p>No questions added yet. Click the buttons above to add questions.</p>
                    </div>
                  ) : (
                    questions.map((question, index) => (
                      <QuestionEditor
                        key={question.id}
                        question={question}
                        onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                        onDelete={() => deleteQuestion(index)}
                        onDuplicate={() => duplicateQuestion(index)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="creator-preview">
                <SurveyPreview
                  title={title}
                  description={description}
                  questions={questions}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyCreator;
import React from 'react';
import { Question } from './QuestionEditor';
import './SurveyPreview.css';

interface SurveyPreviewProps {
  title: string;
  description?: string;
  questions: Question[];
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({
  title,
  description,
  questions
}) => {
  const renderQuestion = (question: Question, index: number) => {
    const questionNumber = index + 1;

    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-label">
              {questionNumber}. {question.title}
              {question.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              className="preview-input"
              placeholder="Your answer..."
              disabled
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-label">
              {questionNumber}. {question.title}
              {question.required && <span className="required">*</span>}
            </label>
            <div className="preview-options">
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} className="preview-option">
                  <input type="radio" name={`question-${question.id}`} disabled />
                  <span>{option || `Option ${optionIndex + 1}`}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-label">
              {questionNumber}. {question.title}
              {question.required && <span className="required">*</span>}
            </label>
            <div className="preview-options">
              {question.options?.map((option, optionIndex) => (
                <label key={optionIndex} className="preview-option">
                  <input type="checkbox" disabled />
                  <span>{option || `Option ${optionIndex + 1}`}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'dropdown':
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-label">
              {questionNumber}. {question.title}
              {question.required && <span className="required">*</span>}
            </label>
            <select className="preview-input" disabled>
              <option>Choose an option...</option>
              {question.options?.map((option, optionIndex) => (
                <option key={optionIndex}>
                  {option || `Option ${optionIndex + 1}`}
                </option>
              ))}
            </select>
          </div>
        );

      case 'rating':
        const scale = question.options?.length || 5;
        return (
          <div key={question.id} className="preview-question">
            <label className="preview-label">
              {questionNumber}. {question.title}
              {question.required && <span className="required">*</span>}
            </label>
            <div className="preview-rating">
              <span className="rating-label">1</span>
              {Array.from({ length: scale }, (_, i) => (
                <label key={i} className="rating-option">
                  <input type="radio" name={`rating-${question.id}`} disabled />
                  <span className="rating-number">{i + 1}</span>
                </label>
              ))}
              <span className="rating-label">{scale}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="survey-preview">
      <div className="preview-header">
        <h2 className="preview-title">{title || 'Untitled Survey'}</h2>
        {description && <p className="preview-description">{description}</p>}
      </div>

      <div className="preview-content">
        {questions.length === 0 ? (
          <div className="preview-empty">
            <p>No questions added yet. Add questions to see the preview.</p>
          </div>
        ) : (
          questions.map((question, index) => renderQuestion(question, index))
        )}

        {questions.length > 0 && (
          <div className="preview-submit">
            <button className="btn btn-primary" disabled>
              Submit Survey
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyPreview;
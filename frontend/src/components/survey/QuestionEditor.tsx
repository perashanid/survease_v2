import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCopy, FiTrash2, FiX, FiPlus } from 'react-icons/fi';
import './QuestionEditor.css';

export interface Question {
  id: string;
  type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'rating' | 'date' | 'email' | 'number';
  title: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFieldChange = (field: keyof Question, value: any) => {
    onUpdate({
      ...question,
      [field]: value
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[index] = value;
    handleFieldChange('options', newOptions);
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    handleFieldChange('options', newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = question.options?.filter((_, i) => i !== index) || [];
    handleFieldChange('options', newOptions);
  };

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'rating', label: 'Rating Scale' }
  ];

  const needsOptions = ['multiple_choice', 'checkbox', 'dropdown'].includes(question.type);
  const isRating = question.type === 'rating';

  return (
    <div className="question-editor">
      <div className="question-header">
        <button
          type="button"
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        <span className="question-title-preview">
          {question.title || 'Untitled Question'}
        </span>
        <div className="question-actions">
          <button type="button" onClick={onDuplicate} className="btn-icon" title="Duplicate">
            <FiCopy />
          </button>
          <button type="button" onClick={onDelete} className="btn-icon btn-icon-danger" title="Delete">
            <FiTrash2 />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="question-content">
          <div className="form-group">
            <label className="form-label">Question Title</label>
            <input
              type="text"
              value={question.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="form-input"
              placeholder="Enter your question..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Question Type</label>
              <select
                value={question.type}
                onChange={(e) => handleFieldChange('type', e.target.value)}
                className="form-input"
              >
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => handleFieldChange('required', e.target.checked)}
                />
                Required
              </label>
            </div>
          </div>

          {needsOptions && (
            <div className="form-group">
              <label className="form-label">Options</label>
              <div className="options-list">
                {question.options?.map((option, index) => (
                  <div key={index} className="option-item">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="form-input"
                      placeholder={`Option ${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="btn-icon btn-icon-danger"
                      title="Remove option"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="btn btn-outline btn-sm"
                >
                  <FiPlus /> Add Option
                </button>
              </div>
            </div>
          )}

          {isRating && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Rating Scale</label>
                <select
                  value={question.options?.[0] || '5'}
                  onChange={(e) => {
                    const scale = parseInt(e.target.value);
                    const options = Array.from({ length: scale }, (_, i) => (i + 1).toString());
                    handleFieldChange('options', options);
                  }}
                  className="form-input"
                >
                  <option value="3">1-3 Scale</option>
                  <option value="5">1-5 Scale</option>
                  <option value="7">1-7 Scale</option>
                  <option value="10">1-10 Scale</option>
                </select>
              </div>
            </div>
          )}

          {question.type === 'text' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Min Length</label>
                <input
                  type="number"
                  value={question.validation?.minLength || ''}
                  onChange={(e) => handleFieldChange('validation', {
                    ...question.validation,
                    minLength: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="form-input"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Length</label>
                <input
                  type="number"
                  value={question.validation?.maxLength || ''}
                  onChange={(e) => handleFieldChange('validation', {
                    ...question.validation,
                    maxLength: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="form-input"
                  min="1"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
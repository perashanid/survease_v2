import React, { useState, useEffect } from 'react';
import predictionsService from '../../services/predictionsService';
import './PredictiveAnalytics.css';

interface PredictiveAnalyticsProps {
  surveyId: string;
}

interface PredictionResult {
  questionId: string;
  questionText: string;
  predictedResponse: any;
  confidence: number;
  alternatives: Array<{ value: any; probability: number }>;
  reasoning: string;
}

interface ScenarioAnalysis {
  scenario: string;
  predictions: PredictionResult[];
  overallConfidence: number;
  insights: string[];
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ surveyId }) => {
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioAnalysis[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioAnalysis | null>(null);
  const [customInput, setCustomInput] = useState({
    deviceType: 'desktop',
    timeOfDay: 12,
    dayOfWeek: 1
  });
  const [completionPrediction, setCompletionPrediction] = useState<any>(null);
  const [partialResponses] = useState<Record<string, any>>({});

  useEffect(() => {
    loadDemoScenarios();
  }, [surveyId]);

  const loadDemoScenarios = async () => {
    try {
      setLoading(true);
      const scenarioData = await predictionsService.getDemoScenarios(surveyId);
      const analysis = await predictionsService.analyzeScenarios(surveyId, scenarioData);
      
      setScenarios(analysis);
      if (analysis.length > 0) {
        setSelectedScenario(analysis[0]);
      }
    } catch (error) {
      console.error('Error loading demo scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCustomPrediction = async () => {
    try {
      setLoading(true);
      const result = await predictionsService.predictSurvey(surveyId, customInput);
      
      const customScenario: ScenarioAnalysis = {
        scenario: 'Custom Scenario',
        predictions: result.predictions.map((pred: any) => ({
          questionId: pred.questionId,
          questionText: pred.questionText || 'Question',
          predictedResponse: pred.predictedResponse,
          confidence: pred.confidence,
          alternatives: pred.alternatives || [],
          reasoning: pred.reasoning || ''
        })),
        overallConfidence: result.averageConfidence,
        insights: [`Custom prediction with ${result.totalQuestions} questions`]
      };
      
      setScenarios([customScenario, ...scenarios]);
      setSelectedScenario(customScenario);
    } catch (error) {
      console.error('Error running custom prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  const predictCompletion = async () => {
    try {
      setLoading(true);
      const result = await predictionsService.predictCompletion(
        surveyId,
        partialResponses,
        customInput
      );
      setCompletionPrediction(result);
    } catch (error) {
      console.error('Error predicting completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return '#10b981';
    if (confidence >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  if (loading && scenarios.length === 0) {
    return (
      <div className="predictive-analytics">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="predictive-analytics">
      <div className="predictive-header">
        <h2>🔮 Predictive Analytics</h2>
        <p className="predictive-subtitle">
          AI-powered predictions based on historical response patterns
        </p>
      </div>

      <div className="predictive-content">
        {/* Scenario Selector */}
        <div className="scenario-section">
          <h3>Prediction Scenarios</h3>
          <div className="scenario-tabs">
            {scenarios.map((scenario, index) => (
              <button
                key={index}
                className={`scenario-tab ${selectedScenario === scenario ? 'active' : ''}`}
                onClick={() => setSelectedScenario(scenario)}
              >
                {scenario.scenario}
                <span className="confidence-badge" style={{ background: getConfidenceColor(scenario.overallConfidence) }}>
                  {(scenario.overallConfidence * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prediction Builder */}
        <div className="custom-prediction-section">
          <h3>Create Custom Prediction</h3>
          <div className="custom-inputs">
            <div className="input-group">
              <label>Device Type</label>
              <select
                value={customInput.deviceType}
                onChange={(e) => setCustomInput({ ...customInput, deviceType: e.target.value })}
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            <div className="input-group">
              <label>Time of Day</label>
              <select
                value={customInput.timeOfDay}
                onChange={(e) => setCustomInput({ ...customInput, timeOfDay: parseInt(e.target.value) })}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}:00 {i < 12 ? 'AM' : 'PM'}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Day of Week</label>
              <select
                value={customInput.dayOfWeek}
                onChange={(e) => setCustomInput({ ...customInput, dayOfWeek: parseInt(e.target.value) })}
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </div>

            <button
              className="predict-button"
              onClick={runCustomPrediction}
              disabled={loading}
            >
              {loading ? 'Predicting...' : 'Run Prediction'}
            </button>
          </div>
        </div>

        {/* Selected Scenario Details */}
        {selectedScenario && (
          <div className="scenario-details">
            <div className="scenario-header">
              <h3>{selectedScenario.scenario}</h3>
              <div className="overall-confidence">
                <span className="label">Overall Confidence:</span>
                <span
                  className="value"
                  style={{ color: getConfidenceColor(selectedScenario.overallConfidence) }}
                >
                  {(selectedScenario.overallConfidence * 100).toFixed(1)}% ({getConfidenceLabel(selectedScenario.overallConfidence)})
                </span>
              </div>
            </div>

            {/* Insights */}
            {selectedScenario.insights.length > 0 && (
              <div className="insights-section">
                <h4>💡 Insights</h4>
                <ul className="insights-list">
                  {selectedScenario.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Predictions Table */}
            <div className="predictions-table-container">
              <h4>Question Predictions</h4>
              <table className="predictions-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Predicted Response</th>
                    <th>Confidence</th>
                    <th>Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedScenario.predictions.map((prediction, index) => (
                    <tr key={index}>
                      <td className="question-cell">
                        <div className="question-text">{prediction.questionText}</div>
                      </td>
                      <td className="response-cell">
                        <div className="predicted-response">
                          {Array.isArray(prediction.predictedResponse)
                            ? prediction.predictedResponse.join(', ')
                            : String(prediction.predictedResponse)}
                        </div>
                        {prediction.alternatives.length > 0 && (
                          <div className="alternatives">
                            <small>Alternatives:</small>
                            {prediction.alternatives.slice(0, 2).map((alt, i) => (
                              <span key={i} className="alternative">
                                {String(alt.value)} ({(alt.probability * 100).toFixed(0)}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="confidence-cell">
                        <div
                          className="confidence-bar"
                          style={{
                            width: `${prediction.confidence * 100}%`,
                            background: getConfidenceColor(prediction.confidence)
                          }}
                        >
                          {(prediction.confidence * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="reasoning-cell">
                        <small>{prediction.reasoning}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Completion Prediction */}
        <div className="completion-prediction-section">
          <h3>Completion Likelihood Predictor</h3>
          <p className="section-description">
            Predict the likelihood of survey completion based on partial responses
          </p>
          
          <button
            className="predict-button secondary"
            onClick={predictCompletion}
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Predict Completion Likelihood'}
          </button>

          {completionPrediction && (
            <div className="completion-results">
              <div className="completion-likelihood">
                <h4>Completion Likelihood</h4>
                <div className="likelihood-meter">
                  <div
                    className="likelihood-fill"
                    style={{
                      width: `${completionPrediction.likelihood * 100}%`,
                      background: getConfidenceColor(completionPrediction.likelihood)
                    }}
                  >
                    {(completionPrediction.likelihood * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="factors-section">
                <h4>Contributing Factors</h4>
                <ul>
                  {completionPrediction.factors.map((factor: string, index: number) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>

              <div className="recommendations-section">
                <h4>Recommendations</h4>
                <ul>
                  {completionPrediction.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;

import React, { useState } from 'react';
import { boostSurvey, unboostSurvey, getUserPoints } from '../../services/api';
import './BoostSurveyDialog.css';

interface BoostSurveyDialogProps {
  surveyId: string;
  currentBoost?: {
    bonusPoints: number;
    expiresAt?: Date;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const BoostSurveyDialog: React.FC<BoostSurveyDialogProps> = ({
  surveyId,
  currentBoost,
  onClose,
  onSuccess
}) => {
  const [bonusPoints, setBonusPoints] = useState(currentBoost?.bonusPoints || 10);
  const [durationDays, setDurationDays] = useState(7);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  React.useEffect(() => {
    loadUserPoints();
  }, []);

  const loadUserPoints = async () => {
    try {
      const points = await getUserPoints();
      setUserPoints(points.balance);
    } catch (err) {
      console.error('Failed to load user points:', err);
    }
  };

  const totalCost = bonusPoints * durationDays;
  const canAfford = userPoints !== null && userPoints >= totalCost;

  const handleBoost = async () => {
    if (!canAfford) {
      alert('You do not have enough points to boost this survey.');
      return;
    }

    try {
      setLoading(true);
      await boostSurvey(surveyId, bonusPoints, durationDays);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to boost survey');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBoost = async () => {
    if (!confirm('Are you sure you want to remove the boost from this survey?')) return;

    try {
      setRemoving(true);
      await unboostSurvey(surveyId);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to remove boost');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="boost-dialog-overlay" onClick={onClose}>
      <div className="boost-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="boost-dialog-header">
          <h2>🚀 Boost Your Survey</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="boost-dialog-content">
          {currentBoost && (
            <div className="current-boost-info">
              <p>✓ This survey is currently boosted</p>
              <p>Bonus: {currentBoost.bonusPoints} points</p>
              {currentBoost.expiresAt && (
                <p>Expires: {new Date(currentBoost.expiresAt).toLocaleDateString()}</p>
              )}
            </div>
          )}

          <div className="boost-explanation">
            <p>
              Boosting your survey gives respondents bonus points, making it more attractive
              and increasing response rates!
            </p>
          </div>

          <div className="points-balance">
            <span>Your Points:</span>
            <strong>{userPoints !== null ? userPoints : '...'}</strong>
          </div>

          <div className="boost-config">
            <div className="config-field">
              <label htmlFor="bonusPoints">Bonus Points per Response:</label>
              <input
                id="bonusPoints"
                type="number"
                min="5"
                max="100"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(parseInt(e.target.value) || 5)}
              />
              <span className="field-hint">
                Respondents will earn {bonusPoints} extra points
              </span>
            </div>

            <div className="config-field">
              <label htmlFor="durationDays">Boost Duration (days):</label>
              <input
                id="durationDays"
                type="number"
                min="1"
                max="30"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
              />
              <span className="field-hint">
                Boost will last for {durationDays} {durationDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          <div className="boost-cost">
            <div className="cost-breakdown">
              <span>Cost per day:</span>
              <span>{bonusPoints} points</span>
            </div>
            <div className="cost-breakdown">
              <span>Duration:</span>
              <span>{durationDays} {durationDays === 1 ? 'day' : 'days'}</span>
            </div>
            <div className="cost-total">
              <span>Total Cost:</span>
              <strong className={canAfford ? 'affordable' : 'too-expensive'}>
                {totalCost} points
              </strong>
            </div>
          </div>

          {!canAfford && userPoints !== null && (
            <div className="insufficient-points">
              ⚠️ You need {totalCost - userPoints} more points to boost this survey
            </div>
          )}
        </div>

        <div className="boost-dialog-actions">
          {currentBoost && (
            <button
              className="remove-boost-button"
              onClick={handleRemoveBoost}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Remove Boost'}
            </button>
          )}
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="boost-button"
            onClick={handleBoost}
            disabled={loading || !canAfford}
          >
            {loading ? 'Boosting...' : currentBoost ? 'Update Boost' : 'Boost Survey'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoostSurveyDialog;

import React from 'react';

function DiagnosisCard({ predictionData, getDiseaseColor }) {
  if (!predictionData) {
    return <div>Loading prediction...</div>;
  }

  // Normalize disease name capitalization
  const prediction = predictionData.prediction || 'Unknown';
  const normalizedDisease = prediction.charAt(0).toUpperCase() + prediction.slice(1).toLowerCase();

  const confidence = predictionData.confidence || 0;

  return (
    <div className="card prediction-card">
      <h3><FaFlask /> AI Prediction Result</h3>
      <div
        className="disease-badge-large"
        style={{ backgroundColor: getDiseaseColor(normalizedDisease) }}
      >
        {normalizedDisease}
      </div>
      <div className="confidence-display">
        <div className="confidence-text">
          <span>Confidence Score</span>
          <strong>{confidence.toFixed(1)}%</strong>
        </div>
        <div className="confidence-bar-large">
          <div
            className="confidence-fill"
            style={{
              width: `${confidence}%`,
              backgroundColor: getDiseaseColor(normalizedDisease)
            }}
          />
        </div>
      </div>
      <div className="model-info">
        <small>Model: Gradient Boosting | Accuracy: 77.3%</small>
      </div>
    </div>
  );
}

export default DiagnosisCard;

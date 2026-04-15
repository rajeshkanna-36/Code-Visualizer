import React from 'react';
import { Info } from 'lucide-react';

export default function StepDescription({ snapshot }) {
  if (!snapshot) return null;

  return (
    <div className="step-description">
      <Info size={14} className="step-description__icon" />
      <span className="step-description__text">
        <strong>Line {snapshot.line}:</strong> {snapshot.description || 'Executing...'}
      </span>
    </div>
  );
}

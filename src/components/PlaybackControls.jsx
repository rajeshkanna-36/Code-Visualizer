import React from 'react';
import { useVisualizer } from '../context/VisualizerContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
} from 'lucide-react';

export default function PlaybackControls() {
  const { state, dispatch } = useVisualizer();
  const { snapshots, currentStep, isPlaying, speed } = state;

  const totalSteps = snapshots.length;
  const hasSteps = totalSteps > 0;
  const progress = totalSteps > 0 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  function handleProgressClick(e) {
    if (!hasSteps) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const step = Math.round(pct * (totalSteps - 1));
    dispatch({ type: 'SET_STEP', payload: Math.max(0, Math.min(step, totalSteps - 1)) });
  }

  return (
    <div className="playback">
      {/* Step info */}
      <div className="playback__step-info">
        {hasSteps ? `${currentStep + 1} / ${totalSteps}` : '— / —'}
      </div>

      {/* Controls */}
      <div className="playback__group">
        <button
          className="btn btn--ghost btn--icon"
          onClick={() => dispatch({ type: 'RESET' })}
          disabled={!hasSteps}
          title="Reset (Home)"
        >
          <RotateCcw size={16} />
        </button>

        <button
          className="btn btn--ghost btn--icon"
          onClick={() => dispatch({ type: 'STEP_BACKWARD' })}
          disabled={!hasSteps || currentStep <= 0}
          title="Step Back (←)"
        >
          <SkipBack size={16} />
        </button>

        <button
          className="btn btn--primary btn--icon-lg"
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
          disabled={!hasSteps}
          title="Play/Pause (Space)"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
        </button>

        <button
          className="btn btn--ghost btn--icon"
          onClick={() => dispatch({ type: 'STEP_FORWARD' })}
          disabled={!hasSteps || currentStep >= totalSteps - 1}
          title="Step Forward (→)"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="progress" onClick={handleProgressClick}>
        <div className="progress__fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Speed */}
      <div className="playback__speed">
        <Gauge size={12} />
        <input
          type="range"
          className="playback__speed-slider"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => dispatch({ type: 'SET_SPEED', payload: parseFloat(e.target.value) })}
        />
        <span>{speed}x</span>
      </div>
    </div>
  );
}

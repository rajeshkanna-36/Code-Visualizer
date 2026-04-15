import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';

const VisualizerContext = createContext(null);

const initialState = {
  snapshots: [],
  currentStep: 0,
  isPlaying: false,
  speed: 1,
  code: '',
  error: null,
  isRunning: false,
  consoleOutput: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SNAPSHOTS':
      return {
        ...state,
        snapshots: action.payload,
        currentStep: 0,
        isPlaying: false,
        error: null,
        isRunning: false,
      };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'STEP_FORWARD':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.snapshots.length - 1),
      };
    case 'STEP_BACKWARD':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'RESET':
      return { ...state, currentStep: 0, isPlaying: false };
    case 'SET_CODE':
      return { ...state, code: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isRunning: false, isPlaying: false };
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    case 'SET_CONSOLE_OUTPUT':
      return { ...state, consoleOutput: action.payload };
    case 'CLEAR':
      return { ...initialState, code: state.code, speed: state.speed };
    default:
      return state;
  }
}

export function VisualizerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timerRef = useRef(null);

  // Auto-play logic
  useEffect(() => {
    if (state.isPlaying && state.snapshots.length > 0) {
      const interval = Math.max(100, 800 / state.speed);
      timerRef.current = setTimeout(() => {
        if (state.currentStep < state.snapshots.length - 1) {
          dispatch({ type: 'STEP_FORWARD' });
        } else {
          dispatch({ type: 'PAUSE' });
        }
      }, interval);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.isPlaying, state.currentStep, state.snapshots.length, state.speed]);

  const value = { state, dispatch };

  return (
    <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
}

export function useVisualizer() {
  const context = useContext(VisualizerContext);
  if (!context) throw new Error('useVisualizer must be used within VisualizerProvider');
  return context;
}

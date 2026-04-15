import React, { useCallback, useEffect, useState, useRef } from 'react';
import { VisualizerProvider, useVisualizer } from './context/VisualizerContext';
import CodeEditor from './components/CodeEditor';
import VisualizationPanel from './components/VisualizationPanel';
import PlaybackControls from './components/PlaybackControls';
import { traceCode } from './engine/jsTracer';
import {
  Play,
  Code2,
  Trash2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

const JAVA_BACKEND = 'http://localhost:3001';

const DEFAULT_JS = `// Write your JavaScript code here
let arr = [64, 34, 25, 12, 22, 11, 90];
let n = arr.length;

for (let i = 0; i < n - 1; i++) {
  for (let j = 0; j < n - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
    }
  }
}

console.log("Sorted:", arr);`;

const DEFAULT_JAVA = `import java.util.*;

class Main {
    public static void main(String[] args) {
        int[] arr = {64, 34, 25, 12, 22, 11, 90};
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Sorted: " + Arrays.toString(arr));
    }
}`;

function AppContent() {
  const { state, dispatch } = useVisualizer();
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [editorWidth, setEditorWidth] = useState(45);
  const [javaOnline, setJavaOnline] = useState(false);
  const resizingRef = useRef(false);
  const containerRef = useRef(null);

  // Check Java backend health
  useEffect(() => {
    async function check() {
      try {
        const r = await fetch(`${JAVA_BACKEND}/api/health`);
        setJavaOnline(r.ok);
      } catch { setJavaOnline(false); }
    }
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  // Load default code on mount
  useEffect(() => {
    if (!state.code) dispatch({ type: 'SET_CODE', payload: DEFAULT_JS });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); return; }
      if (e.target.closest('.monaco-editor') || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === ' ' && state.snapshots.length > 0) { e.preventDefault(); dispatch({ type: 'TOGGLE_PLAY' }); }
      if (e.key === 'ArrowRight' && state.snapshots.length > 0) { e.preventDefault(); dispatch({ type: 'STEP_FORWARD' }); }
      if (e.key === 'ArrowLeft' && state.snapshots.length > 0) { e.preventDefault(); dispatch({ type: 'STEP_BACKWARD' }); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.snapshots.length, dispatch]);

  // Panel resize
  useEffect(() => {
    const onMove = (e) => {
      if (!resizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setEditorWidth(Math.max(25, Math.min(70, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    const onUp = () => { resizingRef.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const handleRun = useCallback(async () => {
    if (!state.code.trim()) return;
    setError(null);
    dispatch({ type: 'SET_RUNNING', payload: true });
    dispatch({ type: 'CLEAR' });

    try {
      if (language === 'java') {
        if (!javaOnline) { setError('Java backend not running. Open a new terminal and run:  npm run server'); dispatch({ type: 'SET_RUNNING', payload: false }); return; }
        const res = await fetch(`${JAVA_BACKEND}/api/trace-java`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: state.code }),
        });
        const result = await res.json();
        if (!result.success) { setError(`${result.error}: ${result.details || ''}`); dispatch({ type: 'SET_RUNNING', payload: false }); return; }
        if (!result.snapshots?.length) { setError('No steps captured.'); dispatch({ type: 'SET_RUNNING', payload: false }); return; }
        dispatch({ type: 'SET_SNAPSHOTS', payload: result.snapshots });
        dispatch({ type: 'SET_CONSOLE_OUTPUT', payload: result.consoleOutput || [] });
      } else {
        const { snapshots, consoleOutput } = await traceCode(state.code, 'javascript');
        if (!snapshots.length) { setError('No executable steps found.'); dispatch({ type: 'SET_RUNNING', payload: false }); return; }
        dispatch({ type: 'SET_SNAPSHOTS', payload: snapshots });
        dispatch({ type: 'SET_CONSOLE_OUTPUT', payload: consoleOutput });
      }
    } catch (err) {
      setError(err.message || 'Error tracing code.');
      dispatch({ type: 'SET_RUNNING', payload: false });
    }
  }, [state.code, language, javaOnline, dispatch]);

  function handleLang(lang) {
    setLanguage(lang);
    dispatch({ type: 'SET_CODE', payload: lang === 'java' ? DEFAULT_JAVA : DEFAULT_JS });
    dispatch({ type: 'CLEAR' });
    setError(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header__logo">
          <div className="header__logo-icon"><Zap size={16} /></div>
          AlgoViz
        </div>
        <div className="header__actions">
          <div className="lang-selector">
            <button className={`lang-selector__btn ${language === 'javascript' ? 'lang-selector__btn--active' : ''}`} onClick={() => handleLang('javascript')}>JS</button>
            <button className={`lang-selector__btn ${language === 'java' ? 'lang-selector__btn--active' : ''}`} onClick={() => handleLang('java')}>
              Java
              {language === 'java' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: javaOnline ? 'var(--accent-green)' : 'var(--accent-red)', display: 'inline-block', marginLeft: 4 }} />}
            </button>
          </div>
          <button className="btn btn--ghost btn--icon" onClick={() => { dispatch({ type: 'CLEAR' }); setError(null); }} title="Clear"><Trash2 size={15} /></button>
          <button className="btn btn--run" onClick={handleRun} disabled={state.isRunning || !state.code.trim()} style={{ paddingLeft: 12, paddingRight: 14 }}>
            <Play size={14} />{state.isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
      </header>

      <main className="main" ref={containerRef}>
        <div className="split-pane">
          <div className="pane pane--editor" style={{ width: `${editorWidth}%` }}>
            <div className="pane__header">
              <div className="pane__title"><Code2 size={13} />Editor<div className="pane__title-dot" /></div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{language === 'java' ? 'Java' : 'JavaScript'}</span>
            </div>
            <div className="pane__body"><CodeEditor language={language} /></div>
          </div>
          <div className={`resize-handle ${resizingRef.current ? 'resize-handle--active' : ''}`} onMouseDown={() => { resizingRef.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />
          <div className="pane pane--viz" style={{ width: `${100 - editorWidth}%` }}>
            <div className="pane__header">
              <div className="pane__title"><Zap size={13} />Visualization</div>
              {state.snapshots.length > 0 && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{state.snapshots.length} steps</span>}
            </div>
            <div className="pane__body">
              {error && <div style={{ padding: 'var(--space-lg)' }}><div className="error-display"><AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} /><span>{error}</span></div></div>}
              <VisualizationPanel />
            </div>
          </div>
        </div>
      </main>

      <PlaybackControls />
    </div>
  );
}

export default function App() {
  return (<VisualizerProvider><AppContent /></VisualizerProvider>);
}

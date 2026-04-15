import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useVisualizer } from '../context/VisualizerContext';

export default function CodeEditor({ language = 'javascript' }) {
  const { state, dispatch } = useVisualizer();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme('algo-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A6A8E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C792EA' },
        { token: 'string', foreground: 'C3E88D' },
        { token: 'number', foreground: 'F78C6C' },
        { token: 'type', foreground: 'FFCB6B' },
        { token: 'identifier', foreground: '82AAFF' },
        { token: 'delimiter', foreground: '89DDFF' },
      ],
      colors: {
        'editor.background': '#0d0d24',
        'editor.foreground': '#e8e8f0',
        'editor.lineHighlightBackground': '#1a1a3e',
        'editor.selectionBackground': '#3b3b8f55',
        'editorLineNumber.foreground': '#4a4a6a',
        'editorLineNumber.activeForeground': '#8888bb',
        'editorCursor.foreground': '#a855f7',
        'editor.inactiveSelectionBackground': '#2a2a5a33',
        'editorGutter.background': '#0a0a1f',
        'scrollbar.shadow': '#00000000',
        'editorScrollbar.background': '#0d0d2400',
      },
    });
    monaco.editor.setTheme('algo-dark');

    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 12, bottom: 12 },
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      renderLineHighlight: 'line',
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
    });
  }

  // Highlight current line from snapshot
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    if (state.snapshots.length === 0) {
      // Clear decorations
      if (decorationsRef.current.length > 0) {
        editorRef.current.removeDecorations(decorationsRef.current);
        decorationsRef.current = [];
      }
      return;
    }

    const snapshot = state.snapshots[state.currentStep];
    if (!snapshot || !snapshot.line) return;

    const monaco = monacoRef.current;
    const line = snapshot.line;

    // Remove old decorations and add new ones
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: new monaco.Range(line, 1, line, 1),
          options: {
            isWholeLine: true,
            className: 'editor-highlight-line',
            glyphMarginClassName: 'editor-highlight-line-gutter',
          },
        },
      ]
    );

    // Scroll to line
    editorRef.current.revealLineInCenter(line);
  }, [state.currentStep, state.snapshots]);

  function handleCodeChange(value) {
    dispatch({ type: 'SET_CODE', payload: value || '' });
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={state.code}
      onChange={handleCodeChange}
      onMount={handleEditorDidMount}
      loading={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
        }}>
          Loading editor...
        </div>
      }
    />
  );
}

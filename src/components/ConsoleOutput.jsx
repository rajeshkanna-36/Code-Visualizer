import React from 'react';

export default function ConsoleOutput({ lines }) {
  if (!lines || lines.length === 0) return null;

  return (
    <div className="console-output">
      <div className="console-output__title">Console Output</div>
      <div className="console-output__body">
        {lines.map((line, i) => (
          <div key={i} className="console-output__line">
            <span className="console-output__line-prefix">&gt;</span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

const HIDDEN = ['Math', 'JSON', 'console', 'Infinity', 'NaN', 'undefined', 'args'];

export default function VariableInspector({ snapshot }) {
  if (!snapshot) return null;

  const variables = snapshot.variables || {};
  const changed = snapshot.changed || [];

  const scalars = Object.entries(variables).filter(([key, val]) => {
    if (HIDDEN.includes(key)) return false;
    if (typeof val === 'function') return false;
    if (Array.isArray(val)) return false;
    if (val instanceof Map || val instanceof Set) return false;
    if (typeof val === 'object' && val !== null && (val.__type === 'Map' || val.__type === 'Set')) return false;
    return true;
  });

  if (scalars.length === 0) return null;

  return (
    <div className="ds-card">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--var">x</div>
        <div className="ds-card__label">Variables</div>
        <div className="ds-card__badge">{scalars.length} tracked</div>
      </div>
      <div className="ds-card__body" style={{ padding: 0 }}>
        <div className="var-table">
          {scalars.map(([key, val]) => {
            const isChanged = changed.includes(key);
            return (
              <motion.div
                key={key}
                className={`var-row ${isChanged ? 'var-row--changed' : ''}`}
                layout
                animate={isChanged ? { backgroundColor: ['rgba(99,102,241,0.25)', 'rgba(99,102,241,0.08)'] } : {}}
                transition={{ duration: 0.6 }}
              >
                <div className="var-row__name">{key}</div>
                <div className="var-row__eq">=</div>
                <div className="var-row__val">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${key}-${JSON.stringify(val)}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className={getValClass(val)}
                    >
                      {formatValue(val)}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getValClass(val) {
  if (val === null || val === undefined) return 'val--null';
  if (typeof val === 'number') return 'val--num';
  if (typeof val === 'string') return 'val--str';
  if (typeof val === 'boolean') return 'val--bool';
  return 'val--obj';
}

function formatValue(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Professional Map/HashMap visualizer with key-value bucket animation
export default function MapVisualizer({ name, map }) {
  const entries = map?.__type === 'Map' ? map.entries :
    map?.__type === 'Set' ? null :
    (typeof map === 'object' ? map : {});

  const isSet = map?.__type === 'Set';
  const setValues = isSet ? (map.values || []) : null;

  if (isSet) {
    return <SetVisualizer name={name} values={setValues} />;
  }

  const entryList = Object.entries(entries || {});

  return (
    <div className="ds-card">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--map">{ }</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Map · {entryList.length} entries</div>
      </div>
      <div className="ds-card__body">
        {entryList.length === 0 ? (
          <div className="ds-empty">Empty Map</div>
        ) : (
          <div className="map-grid">
            <AnimatePresence>
              {entryList.map(([key, value], i) => (
                <motion.div
                  key={key}
                  className="map-entry"
                  initial={{ opacity: 0, x: -12, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 12, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.03 }}
                >
                  <div className="map-entry__key">{formatVal(key)}</div>
                  <div className="map-entry__arrow">
                    <svg width="20" height="12" viewBox="0 0 20 12"><path d="M0 6h16M12 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="map-entry__value">{formatVal(value)}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function SetVisualizer({ name, values }) {
  return (
    <div className="ds-card">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--set">∅</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Set · {values.length} items</div>
      </div>
      <div className="ds-card__body">
        {values.length === 0 ? (
          <div className="ds-empty">Empty Set</div>
        ) : (
          <div className="set-container">
            <AnimatePresence>
              {values.map((v, i) => (
                <motion.div
                  key={`${v}-${i}`}
                  className="set-item"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, delay: i * 0.03 }}
                >
                  {formatVal(v)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function formatVal(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

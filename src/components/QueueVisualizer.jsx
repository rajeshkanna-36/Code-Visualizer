import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Queue Visualizer — compact horizontal flow
export default function QueueVisualizer({ name, queue }) {
  return (
    <div className="ds-card ds-card--compact">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--queue">⇢</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Queue · {queue.length}</div>
      </div>
      <div className="ds-card__body ds-card__body--compact">
        {queue.length === 0 ? (
          <div className="ds-empty">Empty Queue</div>
        ) : (
          <div className="queue-wrapper">
            <div className="queue-track">
              <span className="queue-endpoint queue-endpoint--front">◀ out</span>
              <AnimatePresence mode="popLayout">
                {queue.map((val, idx) => {
                  const isFront = idx === 0;
                  const isRear = idx === queue.length - 1;

                  return (
                    <motion.div
                      key={`${idx}-${val}`}
                      className={`queue-block ${isFront ? 'queue-block--front' : ''} ${isRear ? 'queue-block--rear' : ''}`}
                      initial={{ opacity: 0, x: 40, scale: 0.85 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.7, transition: { duration: 0.25 } }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      layout
                    >
                      <span className="queue-block__val">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <span className="queue-endpoint queue-endpoint--rear">in ▶</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

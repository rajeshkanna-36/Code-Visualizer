import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Stack Visualizer — clean rectangular blocks stacked vertically
// Like algomaster.io: neat boxes with "top" label, "Stack" title
export default function StackVisualizer({ name, stack }) {
  const prevLenRef = useRef(stack.length);

  useEffect(() => {
    prevLenRef.current = stack.length;
  }, [stack.length]);

  return (
    <div className="ds-card ds-card--compact">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--stack">⇵</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Stack · {stack.length}</div>
      </div>
      <div className="ds-card__body ds-card__body--compact">
        {stack.length === 0 ? (
          <div className="ds-empty">Empty Stack</div>
        ) : (
          <div className="stack-wrapper">
            <div className="stack-column">
              <AnimatePresence mode="popLayout">
                {[...stack].reverse().map((val, visualIdx) => {
                  const actualIdx = stack.length - 1 - visualIdx;
                  const isTop = visualIdx === 0;

                  return (
                    <motion.div
                      key={`${actualIdx}-${JSON.stringify(val)}`}
                      className={`stack-block ${isTop ? 'stack-block--top' : ''}`}
                      initial={{ opacity: 0, y: -30, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -35, scale: 0.6, transition: { duration: 0.25 } }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      layout
                    >
                      <span className="stack-block__val">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                      {isTop && <span className="stack-top-tag">top</span>}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

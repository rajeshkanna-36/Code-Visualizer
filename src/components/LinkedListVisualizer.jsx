import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Linked List Visualizer — compact node chain with arrows
export default function LinkedListVisualizer({ name, nodes }) {
  return (
    <div className="ds-card ds-card--compact">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--ll">→</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">LinkedList · {nodes.length}</div>
      </div>
      <div className="ds-card__body ds-card__body--compact">
        {nodes.length === 0 ? (
          <div className="ds-empty">Empty List</div>
        ) : (
          <div className="ll-chain">
            <span className="ll-label ll-label--head">HEAD</span>
            <AnimatePresence mode="popLayout">
              {nodes.map((node, idx) => {
                const isLast = idx === nodes.length - 1;
                const isCycle = node.isCycle;

                return (
                  <motion.div
                    key={`node-${idx}`}
                    className="ll-node-group"
                    initial={{ opacity: 0, scale: 0.7, x: -12 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28, delay: idx * 0.03 }}
                    layout
                  >
                    <div className={`ll-node ${isCycle ? 'll-node--cycle' : ''} ${idx === 0 ? 'll-node--head' : ''}`}>
                      <span className="ll-node__val">
                        {typeof node.val === 'object' ? JSON.stringify(node.val) : String(node.val)}
                      </span>
                    </div>
                    {!isLast && (
                      <svg className="ll-arrow-svg" width="20" height="10" viewBox="0 0 20 10">
                        <path d="M0 5H14M14 5L10 1.5M14 5L10 8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    {isLast && !isCycle && (
                      <span className="ll-null-tag">null</span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

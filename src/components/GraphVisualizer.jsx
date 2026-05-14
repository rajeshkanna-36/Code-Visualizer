import React, { useMemo } from 'react';
import { motion } from 'motion/react';

// Graph Visualizer — renders adjacency list as a compact visual
// Expects graph as: { adjList: { node: [neighbors] }, nodes: [nodeValues] } or just an adjacency object

export default function GraphVisualizer({ name, graph }) {
  // graph can be: { adjList: {...} } or just plain adjacency object { 0: [1,2], 1: [0,3] }
  const adjList = graph?.adjList || graph || {};
  const entries = Object.entries(adjList).filter(([k]) => !k.startsWith('__'));

  return (
    <div className="ds-card ds-card--compact">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--graph">◈</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Graph · {entries.length} nodes</div>
      </div>
      <div className="ds-card__body ds-card__body--compact">
        {entries.length === 0 ? (
          <div className="ds-empty">Empty Graph</div>
        ) : (
          <div className="graph-container">
            {entries.map(([node, neighbors], i) => {
              const neighborList = Array.isArray(neighbors) ? neighbors : [];
              return (
                <motion.div
                  key={node}
                  className="graph-row"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28, delay: i * 0.03 }}
                  layout
                >
                  <div className="graph-node">{node}</div>
                  <div className="graph-arrow">→</div>
                  <div className="graph-neighbors">
                    {neighborList.length === 0 ? (
                      <span className="graph-empty-neighbor">∅</span>
                    ) : (
                      neighborList.map((n, j) => (
                        <span key={j} className="graph-neighbor">{typeof n === 'object' ? JSON.stringify(n) : String(n)}</span>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

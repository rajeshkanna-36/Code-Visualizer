import React, { useMemo } from 'react';
import { motion } from 'motion/react';

// Tree Visualizer — renders binary tree with circular nodes and SVG connecting lines
// Like the algomaster.io style: clean circles with lines between parent-child

function buildLevelOrder(root, maxDepth = 6) {
  if (!root) return { levels: [], positions: new Map() };
  const levels = [];
  const positions = new Map(); // id -> { x, y, parentId }
  let id = 0;

  const queue = [{ node: root, depth: 0, pos: 0, parentId: null, side: null }];

  while (queue.length > 0) {
    const { node, depth, pos, parentId, side } = queue.shift();
    if (depth >= maxDepth || !node) continue;

    const nodeId = id++;
    if (!levels[depth]) levels[depth] = [];
    levels[depth].push({ val: node.val ?? node.value ?? '?', id: nodeId, pos, depth });
    positions.set(nodeId, { depth, pos, parentId, side });

    if (node.left) queue.push({ node: node.left, depth: depth + 1, pos: pos * 2, parentId: nodeId, side: 'left' });
    if (node.right) queue.push({ node: node.right, depth: depth + 1, pos: pos * 2 + 1, parentId: nodeId, side: 'right' });
    if (node.children) {
      node.children.forEach((child, i) => {
        queue.push({ node: child, depth: depth + 1, pos: pos * node.children.length + i, parentId: nodeId, side: i === 0 ? 'left' : 'right' });
      });
    }
  }
  return { levels, positions };
}

// Calculate x position for a node based on its level and position
function getNodeX(depth, pos, maxDepth, totalWidth) {
  const nodesAtLevel = Math.pow(2, depth);
  const spacing = totalWidth / (nodesAtLevel + 1);
  return spacing * (pos + 1);
}

export default function TreeVisualizer({ name, tree }) {
  const { levels, positions } = useMemo(() => buildLevelOrder(tree), [tree]);
  const maxDepth = levels.length;

  if (maxDepth === 0) {
    return (
      <div className="ds-card ds-card--compact">
        <div className="ds-card__header">
          <div className="ds-card__icon ds-card__icon--tree">🌳</div>
          <div className="ds-card__label">{name}</div>
          <div className="ds-card__badge">Tree · 0</div>
        </div>
        <div className="ds-card__body ds-card__body--compact">
          <div className="ds-empty">Empty Tree</div>
        </div>
      </div>
    );
  }

  const nodeSize = 32;
  const levelHeight = 52;
  const svgWidth = Math.max(200, Math.pow(2, maxDepth - 1) * 44);
  const svgHeight = maxDepth * levelHeight + 10;

  // Compute node positions
  const nodePositions = {};
  levels.forEach((level, depth) => {
    const nodesAtLevel = level.length;
    const maxNodesAtLevel = Math.pow(2, depth);
    level.forEach((node) => {
      const x = ((node.pos + 0.5) / maxNodesAtLevel) * svgWidth;
      const y = depth * levelHeight + nodeSize / 2 + 5;
      nodePositions[node.id] = { x, y, val: node.val, depth: node.depth };
    });
  });

  // Build edges
  const edges = [];
  positions.forEach((pos, nodeId) => {
    if (pos.parentId !== null && nodePositions[nodeId] && nodePositions[pos.parentId]) {
      edges.push({
        from: nodePositions[pos.parentId],
        to: nodePositions[nodeId],
      });
    }
  });

  return (
    <div className="ds-card ds-card--compact">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--tree">🌳</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Tree · {Object.keys(nodePositions).length} nodes</div>
      </div>
      <div className="ds-card__body ds-card__body--compact" style={{ overflow: 'auto' }}>
        <svg width={svgWidth} height={svgHeight} className="tree-svg" style={{ display: 'block', margin: '0 auto' }}>
          {/* Edges */}
          {edges.map((edge, i) => (
            <line
              key={`edge-${i}`}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              className="tree-edge"
            />
          ))}

          {/* Nodes */}
          {Object.entries(nodePositions).map(([id, pos]) => (
            <motion.g
              key={`node-${id}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28, delay: pos.depth * 0.08 }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeSize / 2}
                className={`tree-circle ${pos.depth === 0 ? 'tree-circle--root' : ''}`}
              />
              <text
                x={pos.x}
                y={pos.y}
                className="tree-text"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {typeof pos.val === 'object' ? JSON.stringify(pos.val) : String(pos.val)}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </div>
  );
}

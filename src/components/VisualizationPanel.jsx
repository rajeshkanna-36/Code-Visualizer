import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualizer } from '../context/VisualizerContext';
import ArrayVisualizer from './ArrayVisualizer';
import StackVisualizer from './StackVisualizer';
import QueueVisualizer from './QueueVisualizer';
import LinkedListVisualizer from './LinkedListVisualizer';
import TreeVisualizer from './TreeVisualizer';
import GraphVisualizer from './GraphVisualizer';
import MapVisualizer from './MapVisualizer';
import VariableInspector from './VariableInspector';
import StepDescription from './StepDescription';
import ConsoleOutput from './ConsoleOutput';
import { Play, Sparkles } from 'lucide-react';

export default function VisualizationPanel() {
  const { state } = useVisualizer();
  const { snapshots, currentStep } = state;
  const snapshot = snapshots[currentStep] || null;

  if (snapshots.length === 0) {
    return (
      <div className="viz-area">
        <div className="empty-state">
          <div className="empty-state__icon"><Sparkles size={28} /></div>
          <h2 className="empty-state__title">Write code, see it run</h2>
          <p className="empty-state__desc">
            Write code in the editor and click <strong>Run</strong> to visualize
            your code executing step by step with animated data structures.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', marginTop: '8px' }}>
            <Play size={12} /><span>Ctrl + Enter to run</span>
          </div>
        </div>
      </div>
    );
  }

  const structures = snapshot?.structures || { arrays: {}, maps: {}, stacks: {}, queues: {}, linkedLists: {}, trees: {}, graphs: {}, scalars: {} };
  const arrays = Object.entries(structures.arrays || {});
  const stacks = Object.entries(structures.stacks || {});
  const queues = Object.entries(structures.queues || {});
  const linkedLists = Object.entries(structures.linkedLists || {});
  const trees = Object.entries(structures.trees || {});
  const graphs = Object.entries(structures.graphs || {});
  const maps = Object.entries(structures.maps || {});

  return (
    <div className="viz-area">
      <StepDescription snapshot={snapshot} />
      <div className="viz-content">
        <AnimatePresence mode="wait">
          {/* Arrays */}
          {arrays.map(([name, arr]) => (
            <motion.div
              key={`arr-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <ArrayVisualizer name={name} array={arr} variables={snapshot?.variables || {}} changed={snapshot?.changed || []} />
            </motion.div>
          ))}

          {/* Stacks */}
          {stacks.map(([name, stack]) => (
            <motion.div
              key={`stack-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <StackVisualizer name={name} stack={stack} />
            </motion.div>
          ))}

          {/* Queues */}
          {queues.map(([name, queue]) => (
            <motion.div
              key={`queue-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <QueueVisualizer name={name} queue={queue} />
            </motion.div>
          ))}

          {/* Linked Lists */}
          {linkedLists.map(([name, nodes]) => (
            <motion.div
              key={`ll-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <LinkedListVisualizer name={name} nodes={nodes} />
            </motion.div>
          ))}

          {/* Trees */}
          {trees.map(([name, tree]) => (
            <motion.div
              key={`tree-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <TreeVisualizer name={name} tree={tree} />
            </motion.div>
          ))}

          {/* Graphs */}
          {graphs.map(([name, graph]) => (
            <motion.div
              key={`graph-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <GraphVisualizer name={name} graph={graph} />
            </motion.div>
          ))}

          {/* Maps / Sets */}
          {maps.map(([name, map]) => (
            <motion.div
              key={`map-${name}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <MapVisualizer name={name} map={map} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Variables */}
        <VariableInspector snapshot={snapshot} />

        {/* Console */}
        {snapshot?.consoleOutput?.length > 0 && (
          <ConsoleOutput lines={snapshot.consoleOutput} />
        )}
      </div>
    </div>
  );
}

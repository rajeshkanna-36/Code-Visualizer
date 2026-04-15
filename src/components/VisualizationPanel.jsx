import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVisualizer } from '../context/VisualizerContext';
import ArrayVisualizer from './ArrayVisualizer';
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

  const structures = snapshot?.structures || { arrays: {}, maps: {}, stacks: {}, scalars: {} };
  const arrays = Object.entries(structures.arrays);
  const maps = Object.entries(structures.maps);

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

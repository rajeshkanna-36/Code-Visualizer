import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Array/List Visualizer — premium bar chart with pointers, color-coded states, and labels
const POINTER_NAMES = ['i','j','k','left','right','mid','low','high','start','end','insertPos','minIdx','maxIdx','slow','fast','l','r','top','bottom','pivot','p','q'];

const POINTER_COLORS = {
  i: { bg: 'rgba(99,102,241,0.2)', fg: '#818cf8', border: 'rgba(99,102,241,0.5)' },
  j: { bg: 'rgba(168,85,247,0.2)', fg: '#c084fc', border: 'rgba(168,85,247,0.5)' },
  k: { bg: 'rgba(34,211,238,0.2)', fg: '#22d3ee', border: 'rgba(34,211,238,0.5)' },
  left: { bg: 'rgba(34,197,94,0.2)', fg: '#4ade80', border: 'rgba(34,197,94,0.5)' },
  l: { bg: 'rgba(34,197,94,0.2)', fg: '#4ade80', border: 'rgba(34,197,94,0.5)' },
  low: { bg: 'rgba(34,197,94,0.2)', fg: '#4ade80', border: 'rgba(34,197,94,0.5)' },
  start: { bg: 'rgba(34,197,94,0.2)', fg: '#4ade80', border: 'rgba(34,197,94,0.5)' },
  right: { bg: 'rgba(239,68,68,0.2)', fg: '#f87171', border: 'rgba(239,68,68,0.5)' },
  r: { bg: 'rgba(239,68,68,0.2)', fg: '#f87171', border: 'rgba(239,68,68,0.5)' },
  high: { bg: 'rgba(239,68,68,0.2)', fg: '#f87171', border: 'rgba(239,68,68,0.5)' },
  end: { bg: 'rgba(239,68,68,0.2)', fg: '#f87171', border: 'rgba(239,68,68,0.5)' },
  mid: { bg: 'rgba(234,179,8,0.2)', fg: '#fbbf24', border: 'rgba(234,179,8,0.5)' },
  pivot: { bg: 'rgba(234,179,8,0.2)', fg: '#fbbf24', border: 'rgba(234,179,8,0.5)' },
};

function getPointerStyle(name) {
  return POINTER_COLORS[name] || POINTER_COLORS.i;
}

export default function ArrayVisualizer({ name, array, variables, changed }) {
  const pointers = useMemo(() => {
    const map = {};
    for (const pName of POINTER_NAMES) {
      const val = variables[pName];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 0 && val < array.length) {
        if (!map[val]) map[val] = [];
        map[val].push(pName);
      }
    }
    return map;
  }, [variables, array.length]);

  const barStates = useMemo(() => {
    return array.map((val, idx) => {
      const ptrs = pointers[idx] || [];
      if (ptrs.length >= 2) return 'swapping';
      if (ptrs.some(p => ['i', 'j', 'k', 'p', 'q'].includes(p))) return 'active';
      if (ptrs.some(p => ['left', 'l', 'low', 'start', 'slow'].includes(p))) return 'left';
      if (ptrs.some(p => ['right', 'r', 'high', 'end', 'fast'].includes(p))) return 'right';
      if (ptrs.some(p => ['mid', 'pivot'].includes(p))) return 'mid';
      if (ptrs.some(p => ['insertPos', 'minIdx', 'maxIdx', 'top', 'bottom'].includes(p))) return 'highlight';
      return 'default';
    });
  }, [array, pointers]);

  const isNumeric = array.every(v => typeof v === 'number');
  const maxVal = isNumeric ? Math.max(...array.map(v => Math.abs(v)), 1) : 1;
  const useBarMode = array.length <= 25 && isNumeric;

  return (
    <div className="ds-card">
      <div className="ds-card__header">
        <div className="ds-card__icon ds-card__icon--array">[ ]</div>
        <div className="ds-card__label">{name}</div>
        <div className="ds-card__badge">Array · {array.length}</div>
      </div>
      <div className="ds-card__body">
        <div className="arr-container">
          {array.map((val, idx) => {
            const state = barStates[idx];
            const pts = pointers[idx] || [];
            const h = useBarMode ? Math.max(42, (Math.abs(Number(val)) / maxVal) * 130) : 44;

            return (
              <motion.div
                key={idx}
                className="arr-cell"
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {/* Pointer labels above */}
                <AnimatePresence>
                  {pts.length > 0 && (
                    <motion.div
                      className="arr-pointer-group"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      {pts.map(p => {
                        const ps = getPointerStyle(p);
                        return (
                          <motion.span
                            key={p}
                            className="arr-pointer"
                            style={{ background: ps.bg, color: ps.fg, borderColor: ps.border }}
                            layoutId={`ptr-${p}`}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          >
                            ▼ {p}
                          </motion.span>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bar */}
                <motion.div
                  className={`arr-bar arr-bar--${state}`}
                  style={{ height: useBarMode ? `${h}px` : '44px' }}
                  animate={{
                    scale: state === 'swapping' ? 1.1 : state !== 'default' ? 1.04 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <span className="arr-bar__val">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </motion.div>

                {/* Index below */}
                <span className="arr-idx">{idx}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

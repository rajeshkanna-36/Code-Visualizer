import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useVisualizer } from '../context/VisualizerContext';
import { templates, getCategories } from '../algorithms/templates';
import { javaTemplates } from '../algorithms/javaTemplates';
import { BookOpen, ChevronDown, Search } from 'lucide-react';

export default function TemplateSelector({ language = 'javascript', onLanguageChange }) {
  const { dispatch } = useVisualizer();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);

  const activeTemplates = language === 'java' ? javaTemplates : templates;
  const categories = useMemo(() => {
    const cats = {};
    activeTemplates.forEach(t => {
      if (!cats[t.category]) cats[t.category] = [];
      cats[t.category].push(t);
    });
    return cats;
  }, [activeTemplates]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function loadTemplate(template) {
    dispatch({ type: 'SET_CODE', payload: template.code });
    dispatch({ type: 'CLEAR' });
    setOpen(false);
    setSearch('');
  }

  const filtered = search.trim()
    ? activeTemplates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="template-selector" ref={menuRef}>
      <button
        className="btn btn--ghost"
        onClick={() => setOpen(!open)}
        style={{ gap: '6px' }}
      >
        <BookOpen size={14} />
        Templates
        <ChevronDown size={12} style={{
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms',
        }} />
      </button>

      {open && (
        <div className="template-selector__menu">
          {/* Search */}
          <div style={{
            padding: 'var(--space-xs) var(--space-sm)',
            position: 'sticky',
            top: 0,
            background: 'var(--bg-secondary)',
            zIndex: 1,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)',
            }}>
              <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search algorithms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  outline: 'none',
                  width: '100%',
                }}
                autoFocus
              />
            </div>
          </div>

          {filtered ? (
            // Search results
            filtered.map(t => (
              <button
                key={t.id}
                className="template-selector__item"
                onClick={() => loadTemplate(t)}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="template-selector__item-name">{t.name}</span>
                  <span className={`template-selector__badge template-selector__badge--${t.difficulty}`}>
                    {t.difficulty}
                  </span>
                </div>
                <span className="template-selector__item-desc">{t.category}</span>
              </button>
            ))
          ) : (
            // Categorized list
            Object.entries(categories).map(([cat, items]) => (
              <div key={cat}>
                <div style={{
                  padding: '6px 12px 4px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {cat}
                </div>
                {items.map(t => (
                  <button
                    key={t.id}
                    className="template-selector__item"
                    onClick={() => loadTemplate(t)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="template-selector__item-name">{t.name}</span>
                      <span className={`template-selector__badge template-selector__badge--${t.difficulty}`}>
                        {t.difficulty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * FormatToolbar.tsx
 *
 * Shows the current line's element type and lets the user force a type.
 * Keyboard shortcuts: Ctrl+Alt+1..7
 */
import { useEffect } from 'react';
import './FormatToolbar.css';
import type { ElementType } from '../../types/screenplay';

interface FormatBtn {
  type: ElementType;
  label: string;
  key: string;         // display hint
  accel: string;       // for tooltip
}

const BTNS: FormatBtn[] = [
  { type: 'scene_heading',  label: 'Scene Heading',  key: '1', accel: 'Ctrl+Alt+1' },
  { type: 'action',         label: 'Action',         key: '2', accel: 'Ctrl+Alt+2' },
  { type: 'character',      label: 'Character',      key: '3', accel: 'Ctrl+Alt+3' },
  { type: 'dialogue',       label: 'Dialogue',       key: '4', accel: 'Ctrl+Alt+4' },
  { type: 'parenthetical',  label: 'Parenthetical',  key: '5', accel: 'Ctrl+Alt+5' },
  { type: 'transition',     label: 'Transition',     key: '6', accel: 'Ctrl+Alt+6' },
  { type: 'note',           label: 'Note',           key: '7', accel: 'Ctrl+Alt+7' },
];

const TYPE_COLORS: Partial<Record<ElementType, string>> = {
  scene_heading: '#f5c842',
  action:        '#e2e8f0',
  character:     '#34d399',
  dialogue:      '#a78bfa',
  parenthetical: '#fb923c',
  transition:    '#f472b6',
  note:          '#94a3b8',
};

interface Props {
  currentType: ElementType;
  onForceType: (type: ElementType) => void;
}

export function FormatToolbar({ currentType, onForceType }: Props) {
  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.altKey) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < BTNS.length) {
        e.preventDefault();
        onForceType(BTNS[idx].type);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onForceType]);

  const color = TYPE_COLORS[currentType] ?? '#e2e8f0';
  const currentLabel = BTNS.find(b => b.type === currentType)?.label ?? currentType;

  return (
    <div className="fmt-bar">
      {/* Current type pill */}
      <div className="fmt-current" style={{ '--type-color': color } as React.CSSProperties}>
        <span className="fmt-current-dot" />
        <span className="fmt-current-label">{currentLabel}</span>
      </div>

      <div className="fmt-divider" />

      {/* Format buttons */}
      <div className="fmt-btns">
        {BTNS.map(btn => (
          <button
            key={btn.type}
            className={`fmt-btn ${currentType === btn.type ? 'active' : ''}`}
            style={{ '--type-color': TYPE_COLORS[btn.type] ?? '#e2e8f0' } as React.CSSProperties}
            onClick={() => onForceType(btn.type)}
            title={`Force ${btn.label} (${btn.accel})`}
          >
            <span className="fmt-btn-key">{btn.key}</span>
            <span className="fmt-btn-text">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Fountain syntax hint for current type */}
      <div className="fmt-divider" />
      <div className="fmt-hint">
        <SyntaxHint type={currentType} />
      </div>
    </div>
  );
}

function SyntaxHint({ type }: { type: ElementType }) {
  const hints: Partial<Record<ElementType, string>> = {
    scene_heading:  'INT./EXT. LOCATION – TIME  or  .Force heading',
    action:         'Any line that isn\'t another type  or  !Force action',
    character:      'ALL CAPS before dialogue  or  @Force character',
    dialogue:       'Any line after a character name',
    parenthetical:  '(wrap in parentheses)',
    transition:     'CUT TO: / FADE OUT.  or  >Force transition',
    note:           '[[double brackets]]',
  };
  return <>{hints[type] ?? ''}</>;
}

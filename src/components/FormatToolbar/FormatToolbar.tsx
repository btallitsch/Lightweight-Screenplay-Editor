/**
 * FormatToolbar.tsx — Element-type picker, shown below the main toolbar.
 * Detects current line type and lets user force a different type.
 */
import './FormatToolbar.css';
import type { ElementType } from '../../types/screenplay';

interface FormatButton {
  type: ElementType;
  label: string;
  shortcut: string;
  description: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { type: 'scene_heading',  label: 'Scene Heading', shortcut: '⌘1', description: 'INT./EXT. LOCATION - TIME' },
  { type: 'action',         label: 'Action',        shortcut: '⌘2', description: 'Scene description & stage direction' },
  { type: 'character',      label: 'Character',     shortcut: '⌘3', description: 'CHARACTER NAME (centered)' },
  { type: 'dialogue',       label: 'Dialogue',      shortcut: '⌘4', description: 'What the character says' },
  { type: 'parenthetical',  label: 'Parenthetical', shortcut: '⌘5', description: '(how they say it)' },
  { type: 'transition',     label: 'Transition',    shortcut: '⌘6', description: 'CUT TO: / FADE OUT.' },
  { type: 'note',           label: 'Note',          shortcut: '⌘7', description: '[[Hidden production note]]' },
];

interface Props {
  currentType: ElementType;
  onForceType: (type: ElementType) => void;
}

export function FormatToolbar({ currentType, onForceType }: Props) {
  return (
    <div className="format-toolbar">
      <span className="ft-label">FORMAT</span>
      <div className="ft-buttons">
        {FORMAT_BUTTONS.map(btn => (
          <button
            key={btn.type}
            className={`ft-btn ${currentType === btn.type ? 'active' : ''}`}
            onClick={() => onForceType(btn.type)}
            title={`${btn.description} (${btn.shortcut})`}
          >
            <span className="ft-btn-label">{btn.label}</span>
            <span className="ft-btn-key">{btn.shortcut}</span>
          </button>
        ))}
      </div>

      <div className="ft-divider" />

      {/* Current element indicator */}
      <div className="ft-current">
        <span className="ft-current-label">Current:</span>
        <span className={`ft-current-type type-${currentType}`}>
          {FORMAT_BUTTONS.find(b => b.type === currentType)?.label ?? currentType}
        </span>
      </div>

      {/* Fountain syntax hint */}
      <div className="ft-hint">
        <FountainHint type={currentType} />
      </div>
    </div>
  );
}

function FountainHint({ type }: { type: ElementType }) {
  const hints: Partial<Record<ElementType, string>> = {
    scene_heading:  'Starts with INT. / EXT. — or prefix with a dot (.)',
    character:      'ALL CAPS alone on a line, followed by dialogue',
    dialogue:       'Any line after a CHARACTER name',
    parenthetical:  '(wrap in parens) between character and dialogue',
    transition:     'Ends with colon: CUT TO: — or prefix with >',
    note:           'Wrap in double brackets: [[your note]]',
    action:         'Default — any line that isn\'t another type',
  };
  const hint = hints[type];
  if (!hint) return null;
  return <span>{hint}</span>;
}

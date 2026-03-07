# 🎬 Fade In — Screenplay Editor

A minimalist, browser-based screenplay editor with real-time Fountain syntax formatting.

## Features

- **Real-time Fountain Parsing** — Automatically detects and formats scene headings, action, character, dialogue, parentheticals, and transitions as you type.
- **Pace Meter** — Visual bar chart showing scene length and dialogue/action density per scene, with contextual pacing warnings (e.g., "Trim this exchange for tighter rhythm?").
- **Scene Panel** — Left sidebar listing all scenes for quick navigation.
- **Scene Isolation** — Click ⊞ on any scene to enter fullscreen editing mode for that scene only, without losing context.
- **Version History** — Auto-saves every 30 seconds with git-like diffs showing added/removed lines. Restore any version with one click.
- **Export** — Export as `.fountain` (Fountain format) or `.txt` (formatted plain text).
- **Offline Capable** — Works entirely in the browser with localStorage persistence.

## Fountain Syntax Quick Reference

| Element | How to Write |
|---|---|
| Scene Heading | `INT. LOCATION - DAY` |
| Action | Just write. Automatic if no other type detected. |
| Character | `ALL CAPS` on its own line, before dialogue |
| Dialogue | Any line after a character name |
| Parenthetical | `(text)` after character name |
| Transition | `CUT TO:` or `FADE OUT.` |
| Forced Scene | `.LOCATION` (dot prefix) |
| Forced Transition | `>SMASH CUT TO:` (angle bracket prefix) |
| Note | `[[Note text here]]` |
| Section | `# Act One` |
| Page Break | `===` |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Editor/          — Main WYSIWYG canvas + toolbar
│   ├── PaceMeter/       — Scene pacing visualization
│   ├── ScenePanel/      — Scene navigation sidebar
│   └── VersionHistory/  — Auto-save version browser
├── hooks/
│   ├── useScreenplay.ts — Core editor state management
│   └── useAutoSave.ts   — Version history + localStorage
├── parsers/
│   └── fountainParser.ts — Fountain syntax parser
├── types/
│   └── screenplay.ts    — TypeScript type definitions
└── utils/
    ├── diff.ts          — Line-level diff algorithm
    ├── export.ts        — Fountain/text export
    └── paceAnalyzer.ts  — Scene pacing analysis
```

## Customization

Formatting rules, element styles, and theme colors are all defined in CSS variables (`src/styles/globals.css`). You can remap any element color or adjust indentation by editing `DEFAULT_FORMATTING_RULES` in `src/types/screenplay.ts`.

## Tech Stack

- **React 18** + **TypeScript** — UI and type-safe state
- **Vite** — Zero-config bundler
- No external runtime dependencies beyond React

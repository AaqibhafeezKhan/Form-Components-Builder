# FormForge Enterprise

A production-ready, drag-and-drop form builder application built with Vanilla HTML5, CSS3, and ES6+ JavaScript. Runs entirely in the browser with no build step required.

---

## Features

### Component Palette
- 18 draggable component types organized in 3 collapsible groups (Basic, Advanced, Layout)
- Searchable component list with live filtering
- Click-to-add or drag-to-canvas placement
- Resizable panel with drag gutters

### Form Canvas
- Native HTML5 drag-and-drop reordering with visual drop indicators
- Shift+Click multi-element selection for bulk operations
- Per-element controls: Duplicate, Delete, Move Up, Move Down
- Live element ID badge for JSON reference
- Zoom controls: 75% / 100% / 125%
- Animated element entry (bounce) and deletion (shake)
- Keyboard-navigable: Tab, Arrow keys, Delete, Ctrl+D

### Properties Panel
- Context-sensitive panel with 4 tabs:
  - **General**: Label, Placeholder, Helper Text, Default Value, Required toggle, Options lists
  - **Validation**: Min/Max Length, Pattern (regex with live tester), Custom error messages
  - **Appearance**: Width selector (25/50/75/100%), Hide Label toggle, CSS class override
  - **Logic**: Conditional show/hide rules with AND/OR operator and multiple actions

### Form Settings
- Form title and description
- Submit button label customization
- Success message or redirect URL
- Validation mode: On Submit / On Blur / Real-time
- Multi-step form toggle with page management
- Progress bar style selector
- 4 built-in themes: Default, Dark, Minimal, Corporate
- Custom CSS textarea with live apply

### Preview Mode
- Full-screen preview with device frames: Desktop / Tablet / Mobile
- Live conditional logic execution
- Real-time or on-blur validation
- Test Data auto-fill button with realistic dummy data
- Reset/Clear form
- Submit triggers client-side validation summary

### Export and Import
- Export to JSON Schema (draft-07 compliant)
- Export to standalone self-contained HTML file
- Export to React JSX component
- Syntax-highlighted code viewer (via highlight.js CDN)
- Copy to Clipboard and Download as File
- QR code generation from form JSON (via qrcode.js CDN)
- Import JSON with schema validation and diff warning

### Template Gallery
- 7 built-in templates: Contact Form, Feedback Form, Registration, Job Application, Survey, Event RSVP, Order Form
- Save current form as custom template
- Load with overwrite confirmation

### Accessibility (WCAG 2.1 AA)
- Full keyboard navigation (Tab, Shift+Tab, Arrow keys)
- ARIA labels, roles, and live regions throughout
- Focus trapping in all modals
- High-contrast mode toggle
- Screen-reader announcements for add/delete/reorder

### State Management
- Redux-like reducer with unidirectional data flow
- Undo/Redo up to 50 steps
- Autosave to localStorage every 2 seconds when dirty
- Schema versioning with migration support
- Session restore on page reload

### Activity Log
- Timestamped action history for the current session
- Export session log as CSV

---

## Setup

No build step required. Open `index.html` directly in a browser, or serve from any static file server:

```bash
npx serve .
```

Or with Python:

```bash
python -m http.server 8080
```

Then open: `http://localhost:8080`

**Requirements:** Chrome 110+, Firefox 110+, Safari 16+

**CDN Dependencies (loaded automatically):**
- Inter font from Google Fonts
- highlight.js 11.9.0 (syntax highlighting in Export modal)
- qrcode.js 1.0.0 (QR code generation)

---

## Project Structure

```
FormForge/
  index.html                  Main HTML shell
  styles/
    base.css                  Design tokens, reset, utility classes
    layout.css                Three-panel layout, header, statusbar, modals
    components.css            Palette, canvas, properties, preview styles
    themes.css                4 themes + high-contrast + prefers-color-scheme
  src/
    main.js                   Bootstrap: wires all modules, dispatch loop
    state.js                  State schema, constants, initial state
    reducer.js                Pure reducer with all action handlers
    eventBus.js               Publish/subscribe event bus (Observer pattern)
    components/
      palette.js              Component palette panel + drag initialization
      canvas.js               Canvas render, element previews, controls
      propertiesPanel.js      Tabbed properties editor with debounced inputs
      preview.js              Full-screen preview, conditional logic, autofill
      toolbar.js              Header toolbar, keyboard shortcuts, zoom, contrast
      modals.js               Export, Import, Settings, Templates, History, Confirm
    utils/
      dragDrop.js             HTML5 DnD: palette-drop and canvas reorder
      validation.js           Field validation, conditional logic evaluation
      export.js               JSON Schema, HTML, React JSX generators + import parser
      storage.js              localStorage persistence with schema versioning
  README.md
  sample-contact-form.json    Sample 10-field Contact Us form
```

---

## Architecture

FormForge follows a **unidirectional data flow** pattern:

```
User Action
     |
     v
EventBus.emit('action', { type, payload })
     |
     v
dispatch() -> reducer(state, action) -> newState
     |
     v
renderCanvas(state) + renderPropertiesPanel(state) + updateToolbarUI(state)
     |
     v
scheduleAutosave() -> localStorage
```

**Design Patterns Used:**
- **Observer (Event Bus)**: Cross-module communication without tight coupling
- **Command (Undo/Redo)**: State snapshots pushed to undoStack/redoStack before mutations
- **Factory**: COMPONENT_DEFS array in palette.js defines all element types
- **Strategy**: Pluggable validation rules in validation.js (validateField, evaluateRule)
- **Reducer**: All state mutations are pure — `reducer(state, action) => newState`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Force save to localStorage |
| `Ctrl+A` | Select all elements |
| `Ctrl+P` | Open preview |
| `Delete` / `Backspace` | Delete selected canvas element |
| `Arrow Up` | Move selected element up |
| `Arrow Down` | Move selected element down |
| `Ctrl+D` | Duplicate selected element |
| `Escape` | Deselect element / Close modal |
| `F12` | Toggle high-contrast mode |
| `Tab` / `Shift+Tab` | Navigate between elements |
| `Enter` / `Space` | Select focused element |

---

## Data Model

Each form element conforms to this schema:

```json
{
  "id": "uuid-v4-string",
  "type": "text | textarea | dropdown | multiselect | checkbox | checkboxgroup | radio | date | time | file | rating | toggle | slider | divider | header | richtext | hidden | signature",
  "order": 0,
  "props": {
    "label": "string",
    "placeholder": "string",
    "helperText": "string",
    "defaultValue": "any",
    "required": false,
    "width": 100,
    "hideLabel": false,
    "cssClass": "",
    "validation": {
      "minLength": null,
      "maxLength": null,
      "pattern": null,
      "customMessage": null,
      "min": null,
      "max": null
    },
    "options": ["string"]
  },
  "conditionalLogic": {
    "enabled": false,
    "rules": [
      {
        "field": "element-id",
        "operator": "equals | not_equals | contains | is_empty | is_not_empty",
        "value": "any",
        "action": "show | hide | require | disable"
      }
    ],
    "logicOperator": "AND | OR",
    "action": "show | hide | require | disable"
  },
  "meta": {
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

### Supported Element Types

| Type | Description |
|---|---|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `dropdown` | Single-select dropdown |
| `multiselect` | Multi-checkbox select |
| `checkbox` | Single boolean checkbox |
| `checkboxgroup` | Group of checkboxes |
| `radio` | Radio button group |
| `date` | Date picker |
| `time` | Time picker |
| `file` | File upload input |
| `rating` | 1-5 star rating widget |
| `toggle` | On/off toggle switch |
| `slider` | Range slider |
| `divider` | Horizontal rule separator |
| `header` | Section heading text |
| `richtext` | Read-only text label |
| `hidden` | Hidden data field |
| `signature` | Canvas-based signature pad |

---

## localStorage Schema

```json
{
  "version": "1.0",
  "savedAt": "ISO 8601",
  "data": {
    "formConfig": { ... },
    "elements": [ ... ],
    "activeTheme": "default"
  }
}
```

The `migrateSchema()` function in `storage.js` handles future version upgrades transparently.

---

## Themes

| Theme | Primary | Background | Notes |
|---|---|---|---|
| Default | Indigo #4F46E5 | Light gray | Clean modern look |
| Dark | Purple #818CF8 | Dark #111827 | Full dark mode |
| Minimal | Black #111827 | Off-white | Typography-forward |
| Corporate | Blue #0EA5E9 | Slate | Dark header bar |
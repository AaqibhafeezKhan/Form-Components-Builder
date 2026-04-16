window.FF = window.FF || {};

FF.COMPONENT_DEFS = [
  {
    group: 'Basic',
    items: [
      { type: 'text',           label: 'Text Input',       icon: 'M4 6h16M4 12h10',                                          desc: 'Single-line text field' },
      { type: 'textarea',       label: 'Textarea',          icon: 'M4 6h16M4 10h16M4 14h10',                                  desc: 'Multi-line text area' },
      { type: 'email',          label: 'Email',             icon: 'M4 4h16v16H4V4zm8 4l-4 4h8l-4-4z',                         desc: 'Email address field' },
      { type: 'number',         label: 'Number',            icon: 'M7 8h3M7 12h3M7 16h3M13 8l2 2-2 2M15 10h-2',              desc: 'Numeric input field' },
      { type: 'dropdown',       label: 'Dropdown',          icon: 'M4 6h16M4 12h8m4 0l-4 4-4-4',                              desc: 'Single-select dropdown' },
      { type: 'checkbox',       label: 'Checkbox',          icon: 'M5 13l4 4L19 7',                                           desc: 'Single checkbox (boolean)' },
      { type: 'radio',          label: 'Radio Group',       icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M12 2v2M12 20v2', desc: 'Single-choice radio buttons' },
      { type: 'date',           label: 'Date Picker',       icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7H3v12a2 2 0 0 0 2 2z', desc: 'Calendar date picker' },
    ],
  },
  {
    group: 'Advanced',
    items: [
      { type: 'multi-select',   label: 'Multi-select',      icon: 'M4 8h16M4 13h8M4 18h12',                                  desc: 'Multiple selection dropdown' },
      { type: 'checkbox-group', label: 'Checkbox Group',    icon: 'M9 11l3 3L22 4M5 13l4 4L19 7',                             desc: 'Multiple checkbox choices' },
      { type: 'time',           label: 'Time Picker',       icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0',          desc: 'Time input field' },
      { type: 'file',           label: 'File Upload',       icon: 'M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', desc: 'File attachment upload' },
      { type: 'rating',         label: 'Rating',            icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.07 6.364h6.728c.969 0 1.371 1.24.588 1.81l-5.45 3.958 2.07 6.364c.3.921-.755 1.688-1.54 1.118L12 18.347l-5.418 3.294c-.784.57-1.838-.197-1.539-1.118l2.07-6.364-5.45-3.958c-.783-.57-.38-1.81.588-1.81h6.728l2.07-6.364z', desc: '1–5 star rating selector' },
      { type: 'toggle',         label: 'Toggle Switch',     icon: 'M9 12h6m-3-3v6',                                          desc: 'On/off toggle switch' },
      { type: 'slider',         label: 'Slider',            icon: 'M4 12h16M12 8v8',                                         desc: 'Range slider input' },
      { type: 'signature',      label: 'Signature Pad',     icon: 'M15.232 5.232l3.536 3.536M9 11l-6 6v3h3l6-6m3-3L9 11',   desc: 'Freehand signature canvas' },
      { type: 'tel',            label: 'Phone',             icon: 'M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498A1 1 0 0 1 21 17.72V19a2 2 0 0 1-2 2H17C7.163 21 3 16.837 3 7V5z', desc: 'Phone number input' },
      { type: 'url',            label: 'URL',               icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71', desc: 'URL/link input field' },
      { type: 'hidden',         label: 'Hidden Field',      icon: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22', desc: 'Hidden value field' },
    ],
  },
  {
    group: 'Layout',
    items: [
      { type: 'section-header', label: 'Section Header',   icon: 'M4 6h16M4 12h8',                                          desc: 'Section title heading' },
      { type: 'divider',        label: 'Divider',           icon: 'M3 12h18',                                                desc: 'Horizontal rule divider' },
      { type: 'rich-text',      label: 'Rich Text',         icon: 'M4 6h16M4 10h12M4 14h8',                                  desc: 'Read-only text/description label' },
    ],
  },
];

FF.ElementFactory = (() => {
  const DEFAULTS = {
    width: 100,
    required: false,
    label: 'Field Label',
    placeholder: '',
    helperText: '',
    defaultValue: '',
    validation: {},
    options: [],
  };

  const TYPE_OVERRIDES = {
    'dropdown':       { label: 'Dropdown',       options: ['Option 1', 'Option 2', 'Option 3'] },
    'multi-select':   { label: 'Multi-select',   options: ['Option A', 'Option B', 'Option C'] },
    'radio':          { label: 'Radio Group',    options: ['Option 1', 'Option 2', 'Option 3'] },
    'checkbox-group': { label: 'Checkbox Group', options: ['Choice A', 'Choice B', 'Choice C'] },
    'rating':         { label: 'Rating',         placeholder: '' },
    'slider':         { label: 'Slider',         validation: { min: 0, max: 100 } },
    'divider':        { label: 'Divider',        required: false },
    'section-header': { label: 'Section Heading', required: false },
    'rich-text':      { label: 'Enter your text here...', required: false },
    'hidden':         { label: 'Hidden Field',   required: false },
    'checkbox':       { label: 'I agree to the terms', placeholder: '' },
    'toggle':         { label: 'Enable option', placeholder: '' },
    'signature':      { label: 'Signature' },
    'file':           { label: 'Upload File' },
    'email':          { label: 'Email Address', placeholder: 'you@example.com', validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' } },
    'tel':            { label: 'Phone Number', placeholder: '+1 (555) 000-0000' },
    'url':            { label: 'Website URL',  placeholder: 'https://' },
    'date':           { label: 'Date' },
    'time':           { label: 'Time' },
    'number':         { label: 'Number', placeholder: '0' },
    'textarea':       { label: 'Message', placeholder: 'Type your message here...' },
    'text':           { label: 'Full Name', placeholder: 'Enter your name' },
  };

  function create(type) {
    const id = FF.Storage.generateId();
    const overrides = TYPE_OVERRIDES[type] || {};
    const props = Object.assign({}, DEFAULTS, overrides);
    if (props.validation === DEFAULTS.validation) props.validation = {};
    if (overrides.validation) props.validation = Object.assign({}, overrides.validation);

    return {
      id,
      type,
      order: 0,
      props,
      conditionalLogic: { enabled: false, rules: [], logicOperator: 'AND' },
      meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), cssClass: '' },
    };
  }

  return { create };
})();

FF.Palette = (() => {
  let searchInput = null;

  function renderIcon(pathData) {
    return `<svg class="palette-item__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${pathData}"/></svg>`;
  }

  function buildTile(item) {
    const tile = document.createElement('div');
    tile.className = 'palette-item';
    tile.setAttribute('role', 'listitem');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('data-type', item.type);
    tile.setAttribute('title', item.desc);
    tile.setAttribute('aria-label', item.label + ': ' + item.desc);
    tile.innerHTML = renderIcon(item.icon) + `<span class="palette-item__label">${item.label}</span>`;

    FF.DragDrop.initPaletteItem(tile, item.type);

    tile.addEventListener('click', () => {
      const el = FF.ElementFactory.create(item.type);
      FF.dispatch({ type: FF.ACTIONS.ADD_ELEMENT, element: el });
      announceAction('Added ' + item.label + ' to canvas');
    });

    tile.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tile.click();
      }
    });

    return tile;
  }

  function buildGroup(group) {
    const wrap = document.createElement('div');
    wrap.className = 'palette-group';
    wrap.setAttribute('data-group', group.group);

    const header = document.createElement('button');
    header.className = 'palette-group__header';
    header.setAttribute('aria-expanded', 'true');
    header.setAttribute('aria-controls', 'palette-group-' + group.group.toLowerCase());
    header.innerHTML = `<span>${group.group}</span><svg class="palette-group__chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

    const list = document.createElement('div');
    list.className = 'palette-group__items';
    list.setAttribute('role', 'list');
    list.id = 'palette-group-' + group.group.toLowerCase();

    group.items.forEach(item => list.appendChild(buildTile(item)));

    header.addEventListener('click', () => {
      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!expanded));
      list.classList.toggle('palette-group__items--collapsed', expanded);
      header.querySelector('.palette-group__chevron').style.transform = expanded ? 'rotate(-90deg)' : '';
    });

    wrap.appendChild(header);
    wrap.appendChild(list);
    return wrap;
  }

  function init() {
    const container = document.getElementById('palette-groups');
    if (!container) return;
    container.innerHTML = '';
    FF.COMPONENT_DEFS.forEach(group => container.appendChild(buildGroup(group)));

    searchInput = document.getElementById('palette-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.palette-item').forEach(tile => {
          const label = tile.getAttribute('data-type') + tile.querySelector('.palette-item__label').textContent.toLowerCase();
          tile.style.display = !q || label.includes(q) ? '' : 'none';
        });
        document.querySelectorAll('.palette-group').forEach(grp => {
          const hasVisible = [...grp.querySelectorAll('.palette-item')].some(t => t.style.display !== 'none');
          grp.style.display = hasVisible ? '' : 'none';
        });
      });
    }

    const collapseBtn = document.getElementById('palette-collapse-btn');
    const panel = document.getElementById('panel-palette');
    if (collapseBtn && panel) {
      collapseBtn.addEventListener('click', () => {
        const collapsed = panel.classList.toggle('panel--collapsed');
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));
      });
    }
  }

  function announceAction(msg) {
    const el = document.getElementById('sr-announcer');
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
  }

  return { init };
})();

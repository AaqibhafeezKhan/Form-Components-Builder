window.FF = window.FF || {};

FF.Toolbar = (() => {

  function updateUndoRedoState() {
    const state = FF.appState;
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = state.undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = state.redoStack.length === 0;
  }

  function updateChangesBadge() {
    const state = FF.appState;
    const badge = document.getElementById('changes-badge');
    if (!badge) return;
    if (state.changeCount > 0) {
      badge.hidden = false;
      badge.textContent = state.changeCount;
    } else {
      badge.hidden = true;
    }
  }

  function updateAutosaveIndicator() {
    const state = FF.appState;
    const indicator = document.getElementById('autosave-indicator');
    const dot = indicator && indicator.querySelector('.autosave-dot');
    const text = indicator && indicator.querySelector('.autosave-text');

    if (!indicator) return;
    if (state.isDirty) {
      indicator.classList.add('autosave--dirty');
      if (dot) dot.style.background = 'var(--color-warning)';
      if (text) text.textContent = 'Unsaved';
    } else {
      indicator.classList.remove('autosave--dirty');
      if (dot) dot.style.background = 'var(--color-success)';
      if (text) text.textContent = state.lastSaved ? 'Saved' : 'Not saved';
    }
  }

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    document.body.className = 'theme-' + theme;
  }

  function applyZoom() {
    const scrollWrap = document.getElementById('canvas-scroll-container');
    if (scrollWrap) {
      scrollWrap.style.setProperty('--canvas-zoom', (FF.appState.zoomLevel / 100).toString());
    }
  }

  function applyCustomCss() {
    let styleEl = document.getElementById('custom-css-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-css-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = FF.appState.formConfig.customCss || '';
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        FF.dispatch({ type: FF.ACTIONS.UNDO });
      }
      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        FF.dispatch({ type: FF.ACTIONS.REDO });
      }
      if (ctrl && e.key === 's') {
        e.preventDefault();
        FF.Storage.save(FF.appState);
        FF.dispatch({ type: FF.ACTIONS.MARK_SAVED });
        announce('Form saved');
      }
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        FF.Preview.open();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
        const state = FF.appState;
        if (state.multiSelectedIds && state.multiSelectedIds.size > 0) {
          e.preventDefault();
          FF.dispatch({ type: FF.ACTIONS.BULK_DELETE, ids: [...state.multiSelectedIds] });
        } else if (state.selectedElementId) {
          e.preventDefault();
          FF.dispatch({ type: FF.ACTIONS.REMOVE_ELEMENT, id: state.selectedElementId });
        }
      }
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        const state = FF.appState;
        if (state.selectedElementId) {
          FF.dispatch({ type: FF.ACTIONS.DUPLICATE_ELEMENT, id: state.selectedElementId });
        }
      }
      if (e.key === 'F12') {
        e.preventDefault();
        document.body.classList.toggle('high-contrast');
      }
    });
  }

  function initZoomControls() {
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
      FF.dispatch({ type: FF.ACTIONS.SET_ZOOM, direction: 'in' });
    });
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
      FF.dispatch({ type: FF.ACTIONS.SET_ZOOM, direction: 'out' });
    });
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
      FF.dispatch({ type: FF.ACTIONS.SET_ZOOM, level: 100 });
    });
  }

  function initUndoRedo() {
    document.getElementById('btn-undo')?.addEventListener('click', () => {
      FF.dispatch({ type: FF.ACTIONS.UNDO });
    });
    document.getElementById('btn-redo')?.addEventListener('click', () => {
      FF.dispatch({ type: FF.ACTIONS.REDO });
    });
  }

  function initFormTitleInput() {
    const input = document.getElementById('form-title-input');
    if (!input) return;
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        FF.dispatch({ type: FF.ACTIONS.UPDATE_FORM_CONFIG, config: { title: input.value }, silent: true });
      }, FF.PROP_DEBOUNCE);
    });
    FF.EventBus.on('state:changed', () => {
      if (document.activeElement !== input) {
        input.value = FF.appState.formConfig.title || '';
      }
    });
  }

  function initContrastToggle() {
    document.getElementById('btn-contrast')?.addEventListener('click', () => {
      document.body.classList.toggle('high-contrast');
    });
  }

  function initGutterResize() {
    initGutter('gutter-left', 'panel-palette', 'panel-canvas', false);
    initGutter('gutter-right', 'panel-canvas', 'panel-properties', true);
  }

  function initGutter(gutterId, leftId, rightId, rightSide) {
    const gutter = document.getElementById(gutterId);
    if (!gutter) return;
    let dragging = false;
    let startX = 0;
    let startLeftW = 0;
    let startRightW = 0;

    gutter.addEventListener('mousedown', e => {
      dragging = true;
      startX = e.clientX;
      const leftEl = document.getElementById(leftId);
      const rightEl = document.getElementById(rightId);
      startLeftW  = leftEl ? leftEl.offsetWidth  : 0;
      startRightW = rightEl ? rightEl.offsetWidth : 0;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const leftEl = document.getElementById(leftId);
      const rightEl = document.getElementById(rightId);
      const workspace = document.querySelector('.app-workspace');
      if (!leftEl || !rightEl || !workspace) return;
      const total = workspace.offsetWidth;
      const newLeft  = Math.max(120, Math.min(startLeftW  + dx, total - 200));
      const newRight = Math.max(120, Math.min(startRightW - dx, total - 200));
      leftEl.style.flex  = 'none';
      leftEl.style.width = newLeft + 'px';
      rightEl.style.flex  = 'none';
      rightEl.style.width = newRight + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  }

  function announce(msg) {
    const el = document.getElementById('sr-announcer');
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
  }

  function onStateChanged() {
    updateUndoRedoState();
    updateChangesBadge();
    updateAutosaveIndicator();
    applyZoom();
    applyCustomCss();
    applyTheme(FF.appState.activeTheme || 'default');
  }

  function init() {
    initUndoRedo();
    initZoomControls();
    initKeyboardShortcuts();
    initFormTitleInput();
    initContrastToggle();
    initGutterResize();

    FF.EventBus.on('state:changed', onStateChanged);
  }

  return { init, applyTheme, updateAutosaveIndicator };
})();

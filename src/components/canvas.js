window.FF = window.FF || {};

FF.Canvas = (() => {
  let canvasEl = null;
  let rafPending = false;

  function renderFieldPreview(el) {
    const { type, props } = el;
    const ph = props.placeholder || '';
    const opts = props.options || [];

    if (type === 'text' || type === 'email' || type === 'tel' || type === 'url') {
      return `<input type="${type}" placeholder="${ph}" class="preview-input" tabindex="-1" aria-hidden="true">`;
    }
    if (type === 'number') {
      return `<input type="number" placeholder="${ph}" class="preview-input" tabindex="-1" aria-hidden="true">`;
    }
    if (type === 'textarea') {
      return `<textarea placeholder="${ph}" class="preview-input preview-input--textarea" tabindex="-1" aria-hidden="true" rows="3"></textarea>`;
    }
    if (type === 'dropdown') {
      const os = opts.map(o => `<option>${o}</option>`).join('');
      return `<select class="preview-input" tabindex="-1" aria-hidden="true"><option>-- Select --</option>${os}</select>`;
    }
    if (type === 'multi-select') {
      const os = opts.map(o => `<option>${o}</option>`).join('');
      return `<select class="preview-input" multiple tabindex="-1" aria-hidden="true" size="3">${os}</select>`;
    }
    if (type === 'radio') {
      return opts.slice(0, 3).map((o, i) =>
        `<label class="preview-radio"><input type="radio" name="prev-${el.id}" ${i===0?'checked':''}> ${o}</label>`
      ).join('');
    }
    if (type === 'checkbox') {
      return `<label class="preview-radio"><input type="checkbox"> ${props.label}</label>`;
    }
    if (type === 'checkbox-group') {
      return opts.slice(0, 3).map((o, i) =>
        `<label class="preview-radio"><input type="checkbox" ${i===0?'checked':''}> ${o}</label>`
      ).join('');
    }
    if (type === 'date') return `<input type="date" class="preview-input" tabindex="-1" aria-hidden="true">`;
    if (type === 'time') return `<input type="time" class="preview-input" tabindex="-1" aria-hidden="true">`;
    if (type === 'file') return `<div class="preview-file-btn">Choose File</div>`;
    if (type === 'toggle') return `<label class="preview-toggle-wrap"><input type="checkbox" role="switch" tabindex="-1"> <span class="preview-toggle-label">${props.label}</span></label>`;
    if (type === 'slider') return `<input type="range" class="preview-slider" tabindex="-1" aria-hidden="true">`;
    if (type === 'rating') {
      return `<div class="preview-stars">${'★'.repeat(3)}${'☆'.repeat(2)}</div>`;
    }
    if (type === 'divider') return `<hr class="preview-divider">`;
    if (type === 'section-header') return '';
    if (type === 'rich-text') return `<p class="preview-rich-text">${props.label}</p>`;
    if (type === 'hidden') return `<span class="preview-hidden-badge">hidden value: "${props.defaultValue || ''}"</span>`;
    if (type === 'signature') return `<canvas class="preview-signature-pad" width="300" height="80"></canvas>`;
    return '';
  }

  function renderElement(el, index) {
    const state = FF.appState;
    const isSelected = state.selectedElementId === el.id;
    const isMultiSelected = state.multiSelectedIds && state.multiSelectedIds.has(el.id);

    const wrap = document.createElement('div');
    wrap.className = 'canvas-element' +
      (isSelected      ? ' canvas-element--selected'       : '') +
      (isMultiSelected ? ' canvas-element--multi-selected' : '') +
      (el.type === 'divider' || el.type === 'section-header' || el.type === 'rich-text' ? ' canvas-element--layout' : '');
    wrap.setAttribute('data-id', el.id);
    wrap.setAttribute('data-index', index);
    wrap.setAttribute('role', 'listitem');
    wrap.setAttribute('aria-label', el.props.label + ' (' + el.type + ')');
    wrap.style.width = '100%';

    const widthClass = 'canvas-element--w' + (el.props.width || 100);

    const isLayout = ['divider', 'section-header', 'rich-text', 'hidden'].includes(el.type);
    const showLabel = !isLayout && el.type !== 'checkbox' && el.type !== 'toggle' && el.type !== 'rich-text' && el.type !== 'divider';

    let inner = '';
    if (el.type === 'section-header') {
      inner = `<h3 class="canvas-section-heading">${el.props.label}</h3>`;
    } else if (el.type === 'divider') {
      inner = `<hr class="canvas-divider-line">`;
    } else {
      const labelHtml = showLabel
        ? `<div class="canvas-element__label">${el.props.label}${el.props.required ? ' <span class="canvas-element__required">*</span>' : ''}</div>`
        : '';
      const preview = renderFieldPreview(el);
      const helper = el.props.helperText ? `<div class="canvas-element__helper">${el.props.helperText}</div>` : '';
      inner = labelHtml + `<div class="canvas-element__preview">${preview}</div>` + helper;
    }

    const idBadge = `<span class="canvas-element__id-badge" title="Field ID: ${el.id}">${el.id.substring(0, 8)}</span>`;
    const controls = `<div class="canvas-element__controls" role="toolbar" aria-label="Element controls for ${el.props.label}">
      <button class="elem-ctrl-btn" data-action="move-up"   data-id="${el.id}" title="Move Up"   aria-label="Move ${el.props.label} up">&#8593;</button>
      <button class="elem-ctrl-btn" data-action="move-down" data-id="${el.id}" title="Move Down" aria-label="Move ${el.props.label} down">&#8595;</button>
      <button class="elem-ctrl-btn" data-action="duplicate" data-id="${el.id}" title="Duplicate" aria-label="Duplicate ${el.props.label}">&#9866;</button>
      <button class="elem-ctrl-btn elem-ctrl-btn--danger" data-action="delete" data-id="${el.id}" title="Delete" aria-label="Delete ${el.props.label}">&#10005;</button>
    </div>`;

    const conditionalBadge = el.conditionalLogic && el.conditionalLogic.enabled
      ? `<span class="canvas-element__logic-badge" title="Has conditional logic">&#9670; Logic</span>`
      : '';

    wrap.innerHTML = `<div class="canvas-element__inner ${widthClass}">
      <div class="canvas-element__top-bar">${idBadge}${conditionalBadge}${controls}</div>
      <div class="canvas-element__body">${inner}</div>
    </div>`;

    FF.DragDrop.initCanvasElement(wrap, el.id, index);

    wrap.addEventListener('click', e => {
      if (e.target.closest('.canvas-element__controls')) return;
      if (e.shiftKey) {
        FF.dispatch({ type: FF.ACTIONS.MULTI_SELECT, id: el.id });
      } else {
        FF.dispatch({ type: FF.ACTIONS.SELECT_ELEMENT, id: el.id });
      }
    });

    return wrap;
  }

  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      render();
    });
  }

  function render() {
    if (!canvasEl) return;
    const state = FF.appState;
    const emptyState = document.getElementById('canvas-empty-state');

    const existingIds = new Set([...canvasEl.querySelectorAll('.canvas-element')].map(el => el.dataset.id));
    const newIds = new Set(state.elements.map(el => el.id));

    existingIds.forEach(id => {
      if (!newIds.has(id)) {
        const domEl = canvasEl.querySelector(`[data-id="${id}"]`);
        if (domEl) {
          domEl.classList.add('canvas-element--removing');
          setTimeout(() => domEl.parentNode && domEl.parentNode.removeChild(domEl), 250);
        }
      }
    });

    state.elements.sort((a, b) => a.order - b.order).forEach((el, index) => {
      const existing = canvasEl.querySelector(`[data-id="${el.id}"]`);
      const newNode = renderElement(el, index);

      if (existing) {
        canvasEl.insertBefore(newNode, existing);
        if (existing.parentNode) existing.parentNode.removeChild(existing);
      } else {
        const indicator = canvasEl.querySelector('.canvas__drop-indicator');
        canvasEl.insertBefore(newNode, indicator || null);
        newNode.classList.add('canvas-element--added');
        setTimeout(() => newNode.classList.remove('canvas-element--added'), 400);
      }
    });

    if (emptyState) {
      emptyState.style.display = state.elements.length === 0 ? '' : 'none';
      emptyState.setAttribute('aria-hidden', state.elements.length > 0 ? 'true' : 'false');
    }

    updateStatusBar();
  }

  function updateStatusBar() {
    const state = FF.appState;
    const countEl = document.getElementById('status-element-count');
    const savedEl = document.getElementById('status-last-saved');
    const zoomEl = document.getElementById('status-zoom');
    const selEl = document.getElementById('status-selected');
    const zoomLbl = document.getElementById('zoom-label');
    const pageInd = document.getElementById('page-indicator');

    if (countEl) countEl.textContent = state.elements.length + ' element' + (state.elements.length !== 1 ? 's' : '');
    if (savedEl) savedEl.textContent = FF.Storage.formatSaveTime(state.lastSaved);
    if (zoomEl) zoomEl.textContent = 'Zoom: ' + state.zoomLevel + '%';
    if (zoomLbl) zoomLbl.textContent = state.zoomLevel + '%';
    if (selEl) {
      if (state.selectedElementId) {
        const el = state.elements.find(e => e.id === state.selectedElementId);
        selEl.textContent = el ? el.props.label + ' [' + el.id.substring(0, 8) + ']' : 'No element selected';
      } else if (state.multiSelectedIds && state.multiSelectedIds.size > 0) {
        selEl.textContent = state.multiSelectedIds.size + ' elements selected';
      } else {
        selEl.textContent = 'No element selected';
      }
    }
    const pages = state.formConfig.pages || [];
    const totalPages = pages.length || 1;
    const curPage = (state.formConfig.activePageIndex || 0) + 1;
    if (pageInd) pageInd.textContent = 'Page ' + curPage + ' of ' + totalPages;

    const scrollContainer = document.getElementById('canvas-scroll-container');
    if (scrollContainer) {
      scrollContainer.style.setProperty('--canvas-zoom', (state.zoomLevel / 100).toString());
    }
  }

  function initControlHandlers() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.elem-ctrl-btn[data-action]');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const A = FF.ACTIONS;

      if (action === 'delete') {
        FF.dispatch({ type: A.REMOVE_ELEMENT, id });
        announce('Element deleted');
      } else if (action === 'duplicate') {
        FF.dispatch({ type: A.DUPLICATE_ELEMENT, id });
        announce('Element duplicated');
      } else if (action === 'move-up') {
        FF.dispatch({ type: A.MOVE_ELEMENT, id, direction: 'up' });
      } else if (action === 'move-down') {
        FF.dispatch({ type: A.MOVE_ELEMENT, id, direction: 'down' });
      }
    });

    document.getElementById('btn-select-all')?.addEventListener('click', () => {
      FF.appState.elements.forEach(el => {
        FF.appState.multiSelectedIds.add(el.id);
      });
      FF.appState.selectedElementId = null;
      FF.EventBus.emit('state:changed', { action: 'SELECT_ALL' });
    });

    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
      FF.Modals.confirm('Are you sure you want to clear all elements from the canvas? This can be undone.', () => {
        FF.dispatch({ type: FF.ACTIONS.CLEAR_CANVAS });
        announce('Canvas cleared');
      });
    });

    document.getElementById('canvas')?.addEventListener('click', e => {
      if (e.target === canvasEl || e.target.closest('.canvas__empty-state')) {
        FF.dispatch({ type: FF.ACTIONS.CLEAR_SELECTION });
      }
    });
  }

  function announce(msg) {
    const el = document.getElementById('sr-announcer');
    if (el) { el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 50); }
  }

  function init() {
    canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    FF.DragDrop.initCanvas(canvasEl);
    initControlHandlers();

    FF.EventBus.on('state:changed', scheduleRender);
    FF.EventBus.on('canvas:element-drop-animation', ({ id }) => {
      requestAnimationFrame(() => {
        const el = canvasEl.querySelector(`[data-id="${id}"]`);
        if (el) { el.classList.add('canvas-element--drop-bounce'); setTimeout(() => el.classList.remove('canvas-element--drop-bounce'), 500); }
      });
    });

    scheduleRender();
  }

  return { init, render, updateStatusBar };
})();

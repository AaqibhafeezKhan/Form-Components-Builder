window.FF = window.FF || {};

FF.DragDrop = (() => {
  const DRAG_TYPE_PALETTE = 'ff/palette';
  const DRAG_TYPE_CANVAS  = 'ff/canvas';

  let dragState = {
    type: null,
    componentType: null,
    elementId: null,
    fromIndex: -1,
    ghostEl: null,
    dropIndicator: null,
  };

  function createDropIndicator() {
    const el = document.createElement('div');
    el.className = 'canvas__drop-indicator';
    el.setAttribute('aria-hidden', 'true');
    return el;
  }

  function getDropIndicator() {
    if (!dragState.dropIndicator || !dragState.dropIndicator.parentNode) {
      dragState.dropIndicator = createDropIndicator();
    }
    return dragState.dropIndicator;
  }

  function removeDropIndicator() {
    if (dragState.dropIndicator && dragState.dropIndicator.parentNode) {
      dragState.dropIndicator.parentNode.removeChild(dragState.dropIndicator);
    }
  }

  function getCanvasItems() {
    return Array.from(document.querySelectorAll('#canvas .canvas-element'));
  }

  function getInsertIndex(canvas, clientY) {
    const items = getCanvasItems();
    if (!items.length) return 0;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return items.length;
  }

  function showDropIndicator(canvas, clientY) {
    const indicator = getDropIndicator();
    const items = getCanvasItems();
    if (!items.length) {
      canvas.appendChild(indicator);
      return;
    }
    let targetNode = null;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        targetNode = items[i];
        break;
      }
    }
    if (targetNode) {
      canvas.insertBefore(indicator, targetNode);
    } else {
      canvas.appendChild(indicator);
    }
  }

  function initPaletteItem(tileEl, componentType) {
    tileEl.setAttribute('draggable', 'true');

    tileEl.addEventListener('dragstart', e => {
      dragState.type = DRAG_TYPE_PALETTE;
      dragState.componentType = componentType;
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', componentType);
      tileEl.classList.add('is-dragging');
    });

    tileEl.addEventListener('dragend', () => {
      dragState.type = null;
      dragState.componentType = null;
      tileEl.classList.remove('is-dragging');
      removeDropIndicator();
    });
  }

  function initCanvasElement(elementEl, elementId, index) {
    elementEl.setAttribute('draggable', 'true');

    elementEl.addEventListener('dragstart', e => {
      dragState.type = DRAG_TYPE_CANVAS;
      dragState.elementId = elementId;
      dragState.fromIndex = index;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', elementId);
      setTimeout(() => elementEl.classList.add('is-dragging'), 0);
    });

    elementEl.addEventListener('dragend', () => {
      dragState.type = null;
      dragState.elementId = null;
      dragState.fromIndex = -1;
      elementEl.classList.remove('is-dragging');
      removeDropIndicator();
      document.querySelectorAll('.canvas-element--drag-over').forEach(el => {
        el.classList.remove('canvas-element--drag-over');
      });
    });
  }

  function initCanvas(canvasEl) {
    canvasEl.addEventListener('dragover', e => {
      if (!dragState.type) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = dragState.type === DRAG_TYPE_PALETTE ? 'copy' : 'move';
      canvasEl.classList.add('canvas--drag-over');
      showDropIndicator(canvasEl, e.clientY);
    });

    canvasEl.addEventListener('dragleave', e => {
      if (!canvasEl.contains(e.relatedTarget)) {
        canvasEl.classList.remove('canvas--drag-over');
        removeDropIndicator();
      }
    });

    canvasEl.addEventListener('drop', e => {
      e.preventDefault();
      canvasEl.classList.remove('canvas--drag-over');
      removeDropIndicator();

      const insertIndex = getInsertIndex(canvasEl, e.clientY);

      if (dragState.type === DRAG_TYPE_PALETTE && dragState.componentType) {
        const newEl = FF.ElementFactory.create(dragState.componentType);
        FF.dispatch({ type: FF.ACTIONS.ADD_ELEMENT, element: newEl, insertIndex });
        FF.EventBus.emit('canvas:element-drop-animation', { id: newEl.id });
      } else if (dragState.type === DRAG_TYPE_CANVAS && dragState.fromIndex !== -1) {
        let toIndex = insertIndex;
        if (toIndex !== dragState.fromIndex && toIndex !== dragState.fromIndex + 1) {
          if (toIndex > dragState.fromIndex) toIndex -= 1;
          FF.dispatch({ type: FF.ACTIONS.REORDER_ELEMENTS, fromIndex: dragState.fromIndex, toIndex });
        }
      }

      dragState.type = null;
      dragState.componentType = null;
      dragState.elementId = null;
      dragState.fromIndex = -1;
    });
  }

  return { initPaletteItem, initCanvasElement, initCanvas };
})();

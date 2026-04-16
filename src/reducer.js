window.FF = window.FF || {};

FF.ACTIONS = {
  ADD_ELEMENT:        'ADD_ELEMENT',
  REMOVE_ELEMENT:     'REMOVE_ELEMENT',
  UPDATE_ELEMENT:     'UPDATE_ELEMENT',
  REORDER_ELEMENTS:   'REORDER_ELEMENTS',
  DUPLICATE_ELEMENT:  'DUPLICATE_ELEMENT',
  MOVE_ELEMENT:       'MOVE_ELEMENT',
  SELECT_ELEMENT:     'SELECT_ELEMENT',
  MULTI_SELECT:       'MULTI_SELECT',
  CLEAR_SELECTION:    'CLEAR_SELECTION',
  BULK_DELETE:        'BULK_DELETE',
  UPDATE_FORM_CONFIG: 'UPDATE_FORM_CONFIG',
  SET_THEME:          'SET_THEME',
  SET_ZOOM:           'SET_ZOOM',
  SET_PREVIEW_DEVICE: 'SET_PREVIEW_DEVICE',
  LOAD_TEMPLATE:      'LOAD_TEMPLATE',
  IMPORT_FORM:        'IMPORT_FORM',
  CLEAR_CANVAS:       'CLEAR_CANVAS',
  MARK_SAVED:         'MARK_SAVED',
  UNDO:               'UNDO',
  REDO:               'REDO',
};

FF.activityLog = [];

function logActivity(message) {
  FF.activityLog.unshift({ message, timestamp: new Date().toISOString() });
  if (FF.activityLog.length > 200) FF.activityLog.length = 200;
}

function cloneElements(elements) {
  return elements.map(el => JSON.parse(JSON.stringify(el, (k, v) => v instanceof Set ? [...v] : v)));
}

function pushUndo(state) {
  const snapshot = {
    elements: cloneElements(state.elements),
    formConfig: JSON.parse(JSON.stringify(state.formConfig)),
  };
  state.undoStack.push(snapshot);
  if (state.undoStack.length > FF.MAX_HISTORY) state.undoStack.shift();
  state.redoStack = [];
}

FF.dispatch = function dispatch(action) {
  const state = FF.appState;
  const A = FF.ACTIONS;

  switch (action.type) {

    case A.ADD_ELEMENT: {
      pushUndo(state);
      const el = action.element;
      const insertAt = action.insertIndex !== undefined ? action.insertIndex : state.elements.length;
      const newElements = [...state.elements];
      newElements.splice(insertAt, 0, el);
      newElements.forEach((e, i) => { e.order = i; });
      state.elements = newElements;
      state.selectedElementId = el.id;
      state.multiSelectedIds = new Set();
      state.isDirty = true;
      state.changeCount = (state.changeCount || 0) + 1;
      logActivity('Added element: ' + el.props.label + ' (' + el.type + ')');
      break;
    }

    case A.REMOVE_ELEMENT: {
      pushUndo(state);
      const idx = state.elements.findIndex(e => e.id === action.id);
      if (idx !== -1) {
        const removed = state.elements[idx];
        state.elements = state.elements.filter(e => e.id !== action.id);
        state.elements.forEach((e, i) => { e.order = i; });
        if (state.selectedElementId === action.id) state.selectedElementId = null;
        state.isDirty = true;
        state.changeCount = (state.changeCount || 0) + 1;
        logActivity('Removed element: ' + removed.props.label);
      }
      break;
    }

    case A.UPDATE_ELEMENT: {
      const elIdx = state.elements.findIndex(e => e.id === action.id);
      if (elIdx !== -1) {
        if (!action.silent) pushUndo(state);
        state.elements[elIdx] = Object.assign({}, state.elements[elIdx]);
        if (action.props) {
          state.elements[elIdx].props = Object.assign({}, state.elements[elIdx].props, action.props);
          if (action.props.validation !== undefined) {
            state.elements[elIdx].props.validation = Object.assign(
              {}, state.elements[elIdx].props.validation, action.props.validation
            );
          }
        }
        if (action.conditionalLogic !== undefined) {
          state.elements[elIdx].conditionalLogic = action.conditionalLogic;
        }
        if (action.meta !== undefined) {
          state.elements[elIdx].meta = Object.assign({}, state.elements[elIdx].meta, action.meta);
        }
        state.elements[elIdx].meta.updatedAt = new Date().toISOString();
        state.isDirty = true;
        logActivity('Updated element: ' + state.elements[elIdx].props.label);
      }
      break;
    }

    case A.REORDER_ELEMENTS: {
      pushUndo(state);
      const { fromIndex, toIndex } = action;
      const arr = [...state.elements];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      arr.forEach((e, i) => { e.order = i; });
      state.elements = arr;
      state.isDirty = true;
      logActivity('Reordered elements');
      break;
    }

    case A.DUPLICATE_ELEMENT: {
      pushUndo(state);
      const src = state.elements.find(e => e.id === action.id);
      if (src) {
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = FF.Storage.generateId();
        copy.props.label = src.props.label + ' (Copy)';
        copy.meta.createdAt = new Date().toISOString();
        copy.meta.updatedAt = new Date().toISOString();
        const srcIdx = state.elements.findIndex(e => e.id === action.id);
        state.elements.splice(srcIdx + 1, 0, copy);
        state.elements.forEach((e, i) => { e.order = i; });
        state.selectedElementId = copy.id;
        state.isDirty = true;
        state.changeCount = (state.changeCount || 0) + 1;
        logActivity('Duplicated element: ' + src.props.label);
      }
      break;
    }

    case A.MOVE_ELEMENT: {
      pushUndo(state);
      const { id, direction } = action;
      const idx = state.elements.findIndex(e => e.id === id);
      if (idx === -1) break;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= state.elements.length) break;
      const arr = [...state.elements];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      arr.forEach((e, i) => { e.order = i; });
      state.elements = arr;
      state.isDirty = true;
      logActivity('Moved element ' + direction);
      break;
    }

    case A.SELECT_ELEMENT: {
      state.selectedElementId = action.id;
      state.multiSelectedIds = new Set();
      break;
    }

    case A.MULTI_SELECT: {
      const ids = new Set(state.multiSelectedIds);
      if (ids.has(action.id)) { ids.delete(action.id); }
      else { ids.add(action.id); }
      state.multiSelectedIds = ids;
      state.selectedElementId = null;
      break;
    }

    case A.CLEAR_SELECTION: {
      state.selectedElementId = null;
      state.multiSelectedIds = new Set();
      break;
    }

    case A.BULK_DELETE: {
      pushUndo(state);
      const toDelete = action.ids || [...state.multiSelectedIds];
      if (!toDelete.length) break;
      state.elements = state.elements.filter(e => !toDelete.includes(e.id));
      state.elements.forEach((e, i) => { e.order = i; });
      state.selectedElementId = null;
      state.multiSelectedIds = new Set();
      state.isDirty = true;
      state.changeCount = (state.changeCount || 0) + toDelete.length;
      logActivity('Bulk deleted ' + toDelete.length + ' elements');
      break;
    }

    case A.UPDATE_FORM_CONFIG: {
      if (!action.silent) pushUndo(state);
      state.formConfig = Object.assign({}, state.formConfig, action.config);
      state.isDirty = true;
      logActivity('Updated form settings');
      break;
    }

    case A.SET_THEME: {
      state.activeTheme = action.theme;
      state.isDirty = true;
      logActivity('Changed theme to: ' + action.theme);
      break;
    }

    case A.SET_ZOOM: {
      const levels = FF.ZOOM_LEVELS;
      const cur = levels.indexOf(state.zoomLevel);
      if (action.level !== undefined) {
        state.zoomLevel = action.level;
      } else if (action.direction === 'in' && cur < levels.length - 1) {
        state.zoomLevel = levels[cur + 1];
      } else if (action.direction === 'out' && cur > 0) {
        state.zoomLevel = levels[cur - 1];
      }
      break;
    }

    case A.SET_PREVIEW_DEVICE: {
      state.previewDevice = action.device;
      break;
    }

    case A.LOAD_TEMPLATE:
    case A.IMPORT_FORM: {
      pushUndo(state);
      state.formConfig = Object.assign({}, FF.DEFAULT_FORM_CONFIG, action.formConfig || {});
      state.elements = (action.elements || []).map((e, i) => Object.assign({}, e, { order: i }));
      state.selectedElementId = null;
      state.multiSelectedIds = new Set();
      state.isDirty = true;
      state.changeCount = (state.changeCount || 0) + 1;
      if (action.theme) state.activeTheme = action.theme;
      logActivity(action.type === A.LOAD_TEMPLATE ? 'Loaded template: ' + (action.name || '') : 'Imported form');
      break;
    }

    case A.CLEAR_CANVAS: {
      pushUndo(state);
      state.elements = [];
      state.selectedElementId = null;
      state.multiSelectedIds = new Set();
      state.isDirty = true;
      logActivity('Cleared canvas');
      break;
    }

    case A.MARK_SAVED: {
      state.isDirty = false;
      state.lastSaved = new Date().toISOString();
      break;
    }

    case A.UNDO: {
      if (!state.undoStack.length) break;
      const snapshot = state.undoStack.pop();
      state.redoStack.push({
        elements: cloneElements(state.elements),
        formConfig: JSON.parse(JSON.stringify(state.formConfig)),
      });
      state.elements = snapshot.elements;
      state.formConfig = snapshot.formConfig;
      state.selectedElementId = null;
      state.multiSelectedIds = new Set();
      state.isDirty = true;
      logActivity('Undo');
      break;
    }

    case A.REDO: {
      if (!state.redoStack.length) break;
      const snapshot = state.redoStack.pop();
      state.undoStack.push({
        elements: cloneElements(state.elements),
        formConfig: JSON.parse(JSON.stringify(state.formConfig)),
      });
      state.elements = snapshot.elements;
      state.formConfig = snapshot.formConfig;
      state.selectedElementId = null;
      state.multiSelectedIds = new Set();
      state.isDirty = true;
      logActivity('Redo');
      break;
    }

    default:
      console.warn('[Reducer] Unknown action type:', action.type);
  }

  FF.EventBus.emit('state:changed', { action: action.type });
};

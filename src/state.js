window.FF = window.FF || {};

FF.SCHEMA_VERSION  = '1.0';
FF.MAX_HISTORY     = 50;
FF.AUTOSAVE_DELAY  = 2000;
FF.PROP_DEBOUNCE   = 300;
FF.ZOOM_LEVELS     = [75, 100, 125];

FF.DEFAULT_FORM_CONFIG = {
  title: 'Untitled Form',
  description: '',
  submitLabel: 'Submit',
  successMessage: 'Thank you! Your response has been recorded.',
  redirectUrl: '',
  validationMode: 'onSubmit',
  multiStep: false,
  pages: [{ id: 'page-1', title: 'Page 1' }],
  progressBarStyle: 'steps',
  activePageIndex: 0,
  customCss: '',
};

FF.createInitialState = function () {
  return {
    formConfig: Object.assign({}, FF.DEFAULT_FORM_CONFIG),
    elements: [],
    selectedElementId: null,
    multiSelectedIds: new Set(),
    undoStack: [],
    redoStack: [],
    activeTheme: 'default',
    previewDevice: 'desktop',
    isDirty: false,
    lastSaved: null,
    zoomLevel: 100,
    changeCount: 0,
  };
};

FF.appState = FF.createInitialState();

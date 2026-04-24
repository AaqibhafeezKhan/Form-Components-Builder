window.FF = window.FF || {};

FF.init = function () {
  if (FF._initialized) return;
  FF._initialized = true;

  const saved = FF.Storage.load();
  if (saved) {
    if (saved.formConfig) {
      FF.appState.formConfig = Object.assign({}, FF.DEFAULT_FORM_CONFIG, saved.formConfig);
    }
    if (saved.elements) {
      FF.appState.elements = saved.elements.map((e, i) => Object.assign({}, e, { order: i }));
    }
    if (saved.activeTheme) {
      FF.appState.activeTheme = saved.activeTheme;
    }
  }

  FF.Palette.init();
  FF.Canvas.init();
  FF.PropertiesPanel.init();
  FF.Toolbar.init();
  FF.Preview.init();
  FF.Modals.init();

  FF.Toolbar.applyTheme(FF.appState.activeTheme);

  let autosaveTimer = null;
  FF.EventBus.on('state:changed', () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      if (FF.appState.isDirty) {
        FF.Storage.save(FF.appState);
        FF.dispatch({ type: FF.ACTIONS.MARK_SAVED });
      }
    }, FF.AUTOSAVE_DELAY);
  });

  if (FF.appState.elements.length > 0) {
    FF.Canvas.render();
    FF.Toolbar.updateAutosaveIndicator();
  }

  console.log('[FormForge] Initialized successfully');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', FF.init);
} else {
  FF.init();
}

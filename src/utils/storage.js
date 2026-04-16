window.FF = window.FF || {};

FF.Storage = (() => {
  const STORAGE_KEY = 'formforge_enterprise_v1';

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function save(state) {
    try {
      const payload = {
        version: FF.SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        data: {
          formConfig: state.formConfig,
          elements: state.elements,
          activeTheme: state.activeTheme,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn('[Storage] Save failed:', err);
      return false;
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.version || !parsed.data) return null;
      return parsed.data;
    } catch (err) {
      console.warn('[Storage] Load failed:', err);
      return null;
    }
  }

  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function formatSaveTime(date) {
    if (!date) return 'Not saved yet';
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 5000) return 'Just saved';
    if (diff < 60000) return Math.floor(diff / 1000) + 's ago';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    return new Date(date).toLocaleTimeString();
  }

  return { generateId, save, load, clear, formatSaveTime };
})();

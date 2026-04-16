window.FF = window.FF || {};

FF.EventBus = (() => {
  const listeners = new Map();

  return {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => this.off(event, fn);
    },
    off(event, fn) {
      if (listeners.has(event)) listeners.get(event).delete(fn);
    },
    emit(event, payload) {
      if (!listeners.has(event)) return;
      listeners.get(event).forEach(fn => {
        try { fn(payload); }
        catch (err) { console.warn('[EventBus] Error in handler for "' + event + '":', err); }
      });
    },
    once(event, fn) {
      const wrapper = (payload) => { fn(payload); this.off(event, wrapper); };
      this.on(event, wrapper);
    },
  };
})();

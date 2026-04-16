window.FF = window.FF || {};

FF.PropertiesPanel = (() => {
  let activeTab = 'general';
  let debounceTimer = null;
  let currentElementId = null;

  function debounce(fn, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, delay || FF.PROP_DEBOUNCE);
  }

  function dispatch(id, props, extra) {
    const action = Object.assign({ type: FF.ACTIONS.UPDATE_ELEMENT, id, silent: true }, extra);
    if (props) action.props = props;
    FF.dispatch(action);
  }

  function tabBtn(id, label, active) {
    return `<button class="prop-tab-btn${active ? ' prop-tab-btn--active' : ''}" data-tab="${id}" aria-selected="${active}" role="tab">${label}</button>`;
  }

  function renderGeneralTab(el) {
    const { props, type } = el;
    const isLayout = ['divider', 'rich-text', 'section-header', 'hidden'].includes(type);
    const hasOptions = ['dropdown', 'multi-select', 'radio', 'checkbox-group'].includes(type);
    const hasPlaceholder = !['checkbox', 'toggle', 'rating', 'slider', 'divider', 'section-header', 'rich-text', 'hidden', 'file', 'signature', 'date', 'time'].includes(type);
    const hasDefault = !['file', 'signature', 'divider'].includes(type);

    let html = `<div class="prop-group" id="tab-general">`;

    html += `<div class="prop-field">
      <label class="prop-label" for="prop-label">Label</label>
      <input type="text" id="prop-label" class="prop-input" value="${escHtml(props.label || '')}" data-prop="label">
    </div>`;

    if (hasPlaceholder) {
      html += `<div class="prop-field">
        <label class="prop-label" for="prop-placeholder">Placeholder</label>
        <input type="text" id="prop-placeholder" class="prop-input" value="${escHtml(props.placeholder || '')}" data-prop="placeholder">
      </div>`;
    }

    if (hasDefault) {
      html += `<div class="prop-field">
        <label class="prop-label" for="prop-default">Default Value</label>
        <input type="text" id="prop-default" class="prop-input" value="${escHtml(String(props.defaultValue || ''))}" data-prop="defaultValue">
      </div>`;
    }

    if (!isLayout) {
      html += `<div class="prop-field">
        <label class="prop-label" for="prop-helper">Helper Text</label>
        <input type="text" id="prop-helper" class="prop-input" value="${escHtml(props.helperText || '')}" data-prop="helperText">
      </div>`;
    }

    if (!['divider', 'section-header', 'rich-text'].includes(type)) {
      html += `<div class="prop-field prop-field--toggle">
        <label class="prop-label" for="prop-required">Required</label>
        <label class="toggle-switch">
          <input type="checkbox" id="prop-required" data-prop="required" ${props.required ? 'checked' : ''}>
          <span class="toggle-switch__slider"></span>
        </label>
      </div>`;
    }

    if (hasOptions) {
      const optsText = (props.options || []).join('\n');
      html += `<div class="prop-field">
        <label class="prop-label" for="prop-options">Options <small>(one per line)</small></label>
        <textarea id="prop-options" class="prop-input prop-input--textarea" rows="5" data-prop="options">${escHtml(optsText)}</textarea>
      </div>`;
    }

    if (type === 'slider') {
      html += `<div class="prop-field prop-field--row">
        <div>
          <label class="prop-label" for="prop-slider-min">Min</label>
          <input type="number" id="prop-slider-min" class="prop-input" value="${(props.validation && props.validation.min) || 0}" data-validprop="min">
        </div>
        <div>
          <label class="prop-label" for="prop-slider-max">Max</label>
          <input type="number" id="prop-slider-max" class="prop-input" value="${(props.validation && props.validation.max) || 100}" data-validprop="max">
        </div>
      </div>`;
    }

    if (type === 'rating') {
      html += `<div class="prop-field">
        <label class="prop-label">Stars: 1–5 (fixed)</label>
        <div style="color:var(--color-warning);font-size:20px">★★★★★</div>
      </div>`;
    }

    html += `</div>`;
    return html;
  }

  function renderValidationTab(el) {
    const { props, type } = el;
    const v = props.validation || {};
    const hasLength = ['text', 'textarea', 'email', 'tel', 'url'].includes(type);
    const hasPattern = !['checkbox', 'checkbox-group', 'radio', 'dropdown', 'multi-select', 'date', 'time', 'file', 'signature', 'toggle', 'rating', 'slider', 'divider', 'section-header', 'rich-text'].includes(type);

    let html = `<div class="prop-group" id="tab-validation">`;

    if (['divider', 'section-header', 'rich-text', 'hidden'].includes(type)) {
      html += `<p class="prop-empty-note">No validation options for this element type.</p>`;
    } else {
      if (hasLength) {
        html += `<div class="prop-field prop-field--row">
          <div>
            <label class="prop-label" for="prop-minlength">Min Length</label>
            <input type="number" id="prop-minlength" class="prop-input" min="0" value="${v.minLength || ''}" data-validprop="minLength">
          </div>
          <div>
            <label class="prop-label" for="prop-maxlength">Max Length</label>
            <input type="number" id="prop-maxlength" class="prop-input" min="0" value="${v.maxLength || ''}" data-validprop="maxLength">
          </div>
        </div>`;
      }

      if (hasPattern) {
        html += `<div class="prop-field">
          <label class="prop-label" for="prop-pattern">Regex Pattern</label>
          <input type="text" id="prop-pattern" class="prop-input" value="${escHtml(v.pattern || '')}" data-validprop="pattern" placeholder="e.g. ^[A-Za-z]+$">
          <div class="prop-field prop-field--row" style="margin-top:8px">
            <input type="text" id="prop-pattern-test" class="prop-input" placeholder="Test value here...">
            <button class="btn btn--ghost btn--sm" id="btn-test-regex">Test</button>
          </div>
          <div id="pattern-test-result" class="prop-test-result" aria-live="polite"></div>
        </div>`;
      }

      html += `<div class="prop-field">
        <label class="prop-label" for="prop-custom-message">Custom Error Message</label>
        <input type="text" id="prop-custom-message" class="prop-input" value="${escHtml(v.customMessage || '')}" data-validprop="customMessage" placeholder="Leave blank for default message">
      </div>`;
    }

    html += `</div>`;
    return html;
  }

  function renderAppearanceTab(el) {
    const { props, meta } = el;
    const w = props.width || 100;

    let html = `<div class="prop-group" id="tab-appearance">
      <div class="prop-field">
        <label class="prop-label">Width</label>
        <div class="width-picker" role="group" aria-label="Field width">
          ${[25, 50, 75, 100].map(pct =>
            `<button class="width-btn${w === pct ? ' width-btn--active' : ''}" data-width="${pct}" aria-pressed="${w === pct}">${pct}%</button>`
          ).join('')}
        </div>
      </div>
      <div class="prop-field prop-field--toggle">
        <label class="prop-label" for="prop-hide-label">Hide Label</label>
        <label class="toggle-switch">
          <input type="checkbox" id="prop-hide-label" data-prop="hideLabel" ${props.hideLabel ? 'checked' : ''}>
          <span class="toggle-switch__slider"></span>
        </label>
      </div>
      <div class="prop-field">
        <label class="prop-label" for="prop-css-class">CSS Class Override</label>
        <input type="text" id="prop-css-class" class="prop-input" value="${escHtml((meta && meta.cssClass) || '')}" placeholder="e.g. my-custom-field" data-metaprop="cssClass">
      </div>
    </div>`;

    return html;
  }

  function renderLogicTab(el) {
    const state = FF.appState;
    const cl = el.conditionalLogic || { enabled: false, rules: [], logicOperator: 'AND' };
    const otherElements = state.elements.filter(e => e.id !== el.id && !['divider', 'section-header', 'rich-text'].includes(e.type));

    let html = `<div class="prop-group" id="tab-logic">
      <div class="prop-field prop-field--toggle">
        <label class="prop-label" for="logic-enabled">Enable Conditional Logic</label>
        <label class="toggle-switch">
          <input type="checkbox" id="logic-enabled" ${cl.enabled ? 'checked' : ''} data-logic="enabled">
          <span class="toggle-switch__slider"></span>
        </label>
      </div>`;

    if (cl.enabled) {
      html += `<div class="prop-field">
        <label class="prop-label" for="logic-operator">Logic Operator</label>
        <select id="logic-operator" class="prop-input" data-logic="operator">
          <option value="AND" ${cl.logicOperator === 'AND' ? 'selected' : ''}>ALL rules must match (AND)</option>
          <option value="OR"  ${cl.logicOperator === 'OR'  ? 'selected' : ''}>ANY rule must match (OR)</option>
        </select>
      </div>`;

      if (cl.rules && cl.rules.length) {
        cl.rules.forEach((rule, i) => {
          html += `<div class="logic-rule" data-rule-index="${i}">
            <div class="logic-rule__row">
              <label class="prop-label">IF field</label>
              <select class="prop-input prop-input--sm" data-rule="${i}" data-rule-prop="field">
                <option value="">-- Select field --</option>
                ${otherElements.map(e => `<option value="${e.id}" ${rule.field === e.id ? 'selected' : ''}>${e.props.label}</option>`).join('')}
              </select>
            </div>
            <div class="logic-rule__row">
              <select class="prop-input prop-input--sm" data-rule="${i}" data-rule-prop="operator">
                ${['equals','not_equals','contains','is_empty','is_not_empty'].map(op =>
                  `<option value="${op}" ${rule.operator === op ? 'selected' : ''}>${op.replace('_',' ')}</option>`
                ).join('')}
              </select>
              <input class="prop-input prop-input--sm" type="text" placeholder="value" value="${escHtml(rule.value || '')}" data-rule="${i}" data-rule-prop="value">
            </div>
            <div class="logic-rule__row">
              <label class="prop-label">THEN</label>
              <select class="prop-input prop-input--sm" data-rule="${i}" data-rule-prop="action">
                ${['show','hide','require','disable'].map(a =>
                  `<option value="${a}" ${rule.action === a ? 'selected' : ''}>${a}</option>`
                ).join('')}
              </select>
              <select class="prop-input prop-input--sm" data-rule="${i}" data-rule-prop="target">
                <option value="this" selected>this field</option>
              </select>
            </div>
            <button class="btn btn--ghost btn--sm btn--danger logic-rule__remove" data-remove-rule="${i}">Remove Rule</button>
          </div>`;
        });
      } else {
        html += `<p class="prop-empty-note">No rules yet. Add one below.</p>`;
      }

      html += `<button class="btn btn--ghost btn--sm" id="btn-add-logic-rule">+ Add Rule</button>`;
    }

    html += `</div>`;
    return html;
  }

  function renderPanel(el) {
    const panelContent = document.getElementById('properties-panel-content');
    const emptyState = document.getElementById('properties-empty-state');
    if (!panelContent) return;

    if (!el) {
      if (emptyState) emptyState.style.display = '';
      document.getElementById('properties-panel-title').textContent = 'Properties';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    document.getElementById('properties-panel-title').textContent = el.props && el.props.label ? el.props.label : 'Properties';

    const tabs = [
      { id: 'general',    label: 'General' },
      { id: 'validation', label: 'Validation' },
      { id: 'appearance', label: 'Appearance' },
      { id: 'logic',      label: 'Logic' },
    ];

    const tabNav = `<div class="prop-tabs" role="tablist" aria-label="Property tabs">
      ${tabs.map(t => tabBtn(t.id, t.label, activeTab === t.id)).join('')}
    </div>`;

    let tabContent = '';
    if (activeTab === 'general')    tabContent = renderGeneralTab(el);
    if (activeTab === 'validation') tabContent = renderValidationTab(el);
    if (activeTab === 'appearance') tabContent = renderAppearanceTab(el);
    if (activeTab === 'logic')      tabContent = renderLogicTab(el);

    panelContent.innerHTML = tabNav + `<div class="prop-content">${tabContent}</div>`;

    bindHandlers(el);
  }

  function bindHandlers(el) {
    const panelContent = document.getElementById('properties-panel-content');
    if (!panelContent) return;

    panelContent.querySelectorAll('.prop-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        renderPanel(el);
      });
    });

    panelContent.querySelectorAll('[data-prop]').forEach(input => {
      const prop = input.getAttribute('data-prop');
      const handler = () => {
        let val = input.type === 'checkbox' ? input.checked :
                  prop === 'options'        ? input.value.split('\n').map(s => s.trim()).filter(Boolean) :
                  input.value;
        debounce(() => dispatch(el.id, { [prop]: val }));
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    panelContent.querySelectorAll('[data-validprop]').forEach(input => {
      const prop = input.getAttribute('data-validprop');
      input.addEventListener('input', () => {
        const val = input.value === '' ? undefined : (['min','max','minLength','maxLength'].includes(prop) ? Number(input.value) : input.value);
        debounce(() => dispatch(el.id, { validation: { [prop]: val } }));
      });
    });

    panelContent.querySelectorAll('[data-metaprop]').forEach(input => {
      const prop = input.getAttribute('data-metaprop');
      input.addEventListener('input', () => {
        debounce(() => dispatch(el.id, null, { meta: { [prop]: input.value } }));
      });
    });

    panelContent.querySelectorAll('.width-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = Number(btn.getAttribute('data-width'));
        dispatch(el.id, { width: w });
      });
    });

    const testBtn = document.getElementById('btn-test-regex');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        const pattern = document.getElementById('prop-pattern')?.value;
        const testVal = document.getElementById('prop-pattern-test')?.value;
        const result = FF.Validation.testRegex(pattern, testVal);
        const resultEl = document.getElementById('pattern-test-result');
        if (resultEl) {
          if (result.error) {
            resultEl.textContent = 'Invalid regex: ' + result.error;
            resultEl.className = 'prop-test-result prop-test-result--error';
          } else {
            resultEl.textContent = result.valid ? 'Match!' : 'No match.';
            resultEl.className = 'prop-test-result ' + (result.valid ? 'prop-test-result--success' : 'prop-test-result--error');
          }
        }
      });
    }

    const logicEnabledEl = document.getElementById('logic-enabled');
    if (logicEnabledEl) {
      logicEnabledEl.addEventListener('change', () => {
        const cl = Object.assign({}, el.conditionalLogic, { enabled: logicEnabledEl.checked });
        FF.dispatch({ type: FF.ACTIONS.UPDATE_ELEMENT, id: el.id, conditionalLogic: cl, silent: true });
        renderPanel(FF.appState.elements.find(e => e.id === el.id));
      });
    }

    const logicOpEl = document.getElementById('logic-operator');
    if (logicOpEl) {
      logicOpEl.addEventListener('change', () => {
        const cl = Object.assign({}, el.conditionalLogic, { logicOperator: logicOpEl.value });
        FF.dispatch({ type: FF.ACTIONS.UPDATE_ELEMENT, id: el.id, conditionalLogic: cl, silent: true });
      });
    }

    panelContent.querySelectorAll('[data-rule-prop]').forEach(input => {
      input.addEventListener('change', () => {
        const ruleIdx = Number(input.getAttribute('data-rule'));
        const prop = input.getAttribute('data-rule-prop');
        const cl = JSON.parse(JSON.stringify(el.conditionalLogic || { rules: [] }));
        if (!cl.rules[ruleIdx]) cl.rules[ruleIdx] = { field: '', operator: 'equals', value: '', action: 'show' };
        cl.rules[ruleIdx][prop] = input.value;
        FF.dispatch({ type: FF.ACTIONS.UPDATE_ELEMENT, id: el.id, conditionalLogic: cl, silent: true });
      });
    });

    document.getElementById('btn-add-logic-rule')?.addEventListener('click', () => {
      const cl = JSON.parse(JSON.stringify(el.conditionalLogic || { enabled: true, rules: [], logicOperator: 'AND' }));
      cl.rules.push({ field: '', operator: 'equals', value: '', action: 'show' });
      FF.dispatch({ type: FF.ACTIONS.UPDATE_ELEMENT, id: el.id, conditionalLogic: cl, silent: true });
      renderPanel(FF.appState.elements.find(e => e.id === el.id));
    });

    panelContent.querySelectorAll('[data-remove-rule]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-remove-rule'));
        const cl = JSON.parse(JSON.stringify(el.conditionalLogic || { rules: [] }));
        cl.rules.splice(idx, 1);
        FF.dispatch({ type: FF.ACTIONS.UPDATE_ELEMENT, id: el.id, conditionalLogic: cl, silent: true });
        renderPanel(FF.appState.elements.find(e => e.id === el.id));
      });
    });
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function onStateChanged() {
    const state = FF.appState;
    const el = state.selectedElementId ? state.elements.find(e => e.id === state.selectedElementId) : null;

    if (!el) {
      const emptyState = document.getElementById('properties-empty-state');
      const panelContent = document.getElementById('properties-panel-content');
      if (emptyState) emptyState.style.display = '';
      if (panelContent) {
        const existing = panelContent.querySelector('.prop-tabs');
        if (existing) panelContent.innerHTML = '';
      }
      document.getElementById('properties-panel-title').textContent = 'Properties';
      return;
    }

    if (el.id !== currentElementId) {
      currentElementId = el.id;
      activeTab = 'general';
    }

    renderPanel(el);
  }

  function init() {
    FF.EventBus.on('state:changed', onStateChanged);

    const collapseBtn = document.getElementById('properties-collapse-btn');
    const panel = document.getElementById('panel-properties');
    if (collapseBtn && panel) {
      collapseBtn.addEventListener('click', () => {
        const collapsed = panel.classList.toggle('panel--collapsed');
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));
      });
    }
  }

  return { init };
})();

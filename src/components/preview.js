window.FF = window.FF || {};

FF.Preview = (() => {
  const TEST_DATA = {
    text:           () => 'John Doe',
    email:          () => 'john.doe@example.com',
    tel:            () => '+1 (555) 234-5678',
    url:            () => 'https://example.com',
    number:         () => String(Math.floor(Math.random() * 100)),
    textarea:       () => 'This is some sample text for testing purposes. It demonstrates how multi-line content would look in a textarea field.',
    dropdown:       (el) => (el.props.options && el.props.options[0]) || '',
    'multi-select': (el) => el.props.options ? [el.props.options[0]] : [],
    radio:          (el) => (el.props.options && el.props.options[0]) || '',
    checkbox:       () => true,
    'checkbox-group': (el) => el.props.options ? [el.props.options[0]] : [],
    date:           () => new Date().toISOString().split('T')[0],
    time:           () => '10:00',
    slider:         (el) => String(el.props.validation && el.props.validation.min !== undefined ? el.props.validation.min + 10 : 50),
    rating:         () => '4',
    toggle:         () => true,
    hidden:         (el) => el.props.defaultValue || 'hidden-value',
  };

  const formValues = new Map();
  let signaturePads = [];

  function getFieldValue(elId) {
    return formValues.get(elId);
  }

  function setFieldValue(elId, value) {
    formValues.set(elId, value);
  }

  function evaluateVisibility(el) {
    return FF.Validation.evaluateConditionalLogic(el, formValues);
  }

  function updateAllVisibility(previewForm) {
    const state = FF.appState;
    state.elements.forEach(el => {
      const fieldWrap = previewForm.querySelector(`[data-preview-id="${el.id}"]`);
      if (!fieldWrap) return;
      const logic = evaluateVisibility(el);
      fieldWrap.style.display = logic.visible ? '' : 'none';
      fieldWrap.setAttribute('aria-hidden', logic.visible ? 'false' : 'true');

      const input = fieldWrap.querySelector('input,select,textarea');
      if (input) {
        input.disabled = !!logic.disabled;
        if (logic.required !== undefined) input.required = logic.required;
      }
    });
  }

  function showFieldError(wrap, message) {
    let errEl = wrap.querySelector('.preview-field-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'preview-field-error';
      errEl.setAttribute('role', 'alert');
      wrap.appendChild(errEl);
    }
    errEl.textContent = message;
    wrap.classList.add('preview-field--invalid');
  }

  function clearFieldError(wrap) {
    const errEl = wrap.querySelector('.preview-field-error');
    if (errEl) errEl.textContent = '';
    wrap.classList.remove('preview-field--invalid');
  }

  function validateField(el, wrap, previewForm) {
    const logic = evaluateVisibility(el);
    if (!logic.visible) return true;

    const value = formValues.get(el.id);
    const effectiveEl = Object.assign({}, el, { props: Object.assign({}, el.props, { required: logic.required }) });
    const result = FF.Validation.validateField(effectiveEl, value);
    if (!result.valid) {
      showFieldError(wrap, result.message);
      return false;
    }
    clearFieldError(wrap);
    return true;
  }

  function buildPreviewField(el) {
    const { type, props, id } = el;
    const wrap = document.createElement('div');
    wrap.className = 'preview-field-wrap';
    wrap.setAttribute('data-preview-id', id);
    wrap.style.width = (props.width || 100) + '%';

    if (['divider', 'section-header', 'rich-text', 'hidden'].includes(type)) {
      if (type === 'divider')        wrap.innerHTML = `<hr class="preview-divider-line">`;
      if (type === 'section-header') wrap.innerHTML = `<h3 class="preview-section-heading">${props.label}</h3>`;
      if (type === 'rich-text')      wrap.innerHTML = `<p class="preview-rich-label">${props.label}</p>`;
      if (type === 'hidden')         wrap.style.display = 'none';
      return wrap;
    }

    const isCheckboxLike = type === 'checkbox' || type === 'toggle';
    const labelHtml = !props.hideLabel && !isCheckboxLike
      ? `<label class="preview-label" for="pv-${id}">${props.label}${props.required ? ' <span class="preview-required" aria-hidden="true">*</span>' : ''}</label>`
      : '';

    let fieldHtml = '';

    if (type === 'text' || type === 'email' || type === 'tel' || type === 'url') {
      fieldHtml = `<input type="${type}" id="pv-${id}" class="preview-input" placeholder="${props.placeholder || ''}" ${props.required ? 'required' : ''} autocomplete="off" data-pid="${id}">`;
    } else if (type === 'number') {
      const min = props.validation && props.validation.min !== undefined ? `min="${props.validation.min}"` : '';
      const max = props.validation && props.validation.max !== undefined ? `max="${props.validation.max}"` : '';
      fieldHtml = `<input type="number" id="pv-${id}" class="preview-input" placeholder="${props.placeholder || ''}" ${min} ${max} ${props.required ? 'required' : ''} data-pid="${id}">`;
    } else if (type === 'textarea') {
      fieldHtml = `<textarea id="pv-${id}" class="preview-input preview-input--textarea" placeholder="${props.placeholder || ''}" rows="4" ${props.required ? 'required' : ''} data-pid="${id}"></textarea>`;
    } else if (type === 'dropdown') {
      const opts = (props.options || []).map(o => `<option value="${escHtml(o)}">${escHtml(o)}</option>`).join('');
      fieldHtml = `<select id="pv-${id}" class="preview-input" ${props.required ? 'required' : ''} data-pid="${id}"><option value="">-- Select --</option>${opts}</select>`;
    } else if (type === 'multi-select') {
      const opts = (props.options || []).map(o => `<option value="${escHtml(o)}">${escHtml(o)}</option>`).join('');
      fieldHtml = `<select id="pv-${id}" class="preview-input" multiple size="4" ${props.required ? 'required' : ''} data-pid="${id}">${opts}</select>`;
    } else if (type === 'radio') {
      fieldHtml = `<fieldset class="preview-fieldset"><legend class="preview-legend">${props.label}${props.required ? ' *' : ''}</legend>` +
        (props.options || []).map((o, i) =>
          `<label class="preview-option-label"><input type="radio" name="pv-${id}" value="${escHtml(o)}" ${i === 0 && props.required ? 'required' : ''} data-pid="${id}"> ${escHtml(o)}</label>`
        ).join('') + `</fieldset>`;
    } else if (type === 'checkbox') {
      fieldHtml = `<label class="preview-check-label"><input type="checkbox" id="pv-${id}" class="preview-checkbox" ${props.required ? 'required' : ''} data-pid="${id}"> ${props.label}${props.required ? ' <span class="preview-required">*</span>' : ''}</label>`;
    } else if (type === 'checkbox-group') {
      fieldHtml = `<fieldset class="preview-fieldset"><legend class="preview-legend">${props.label}${props.required ? ' *' : ''}</legend>` +
        (props.options || []).map(o =>
          `<label class="preview-option-label"><input type="checkbox" name="pv-${id}" value="${escHtml(o)}" data-pid="${id}"> ${escHtml(o)}</label>`
        ).join('') + `</fieldset>`;
    } else if (type === 'date') {
      fieldHtml = `<input type="date" id="pv-${id}" class="preview-input" ${props.required ? 'required' : ''} data-pid="${id}">`;
    } else if (type === 'time') {
      fieldHtml = `<input type="time" id="pv-${id}" class="preview-input" ${props.required ? 'required' : ''} data-pid="${id}">`;
    } else if (type === 'file') {
      fieldHtml = `<input type="file" id="pv-${id}" class="preview-file-input" ${props.required ? 'required' : ''} data-pid="${id}">`;
    } else if (type === 'toggle') {
      fieldHtml = `<label class="preview-toggle-label"><input type="checkbox" id="pv-${id}" class="preview-toggle-input" role="switch" data-pid="${id}"> <span class="preview-toggle-text">${props.label}</span></label>`;
    } else if (type === 'slider') {
      const min = (props.validation && props.validation.min) || 0;
      const max = (props.validation && props.validation.max) || 100;
      fieldHtml = `<div class="preview-slider-wrap"><input type="range" id="pv-${id}" class="preview-slider-input" min="${min}" max="${max}" value="${min}" data-pid="${id}"><span class="preview-slider-val" id="pv-${id}-val">${min}</span></div>`;
    } else if (type === 'rating') {
      fieldHtml = `<div class="preview-rating" role="group" aria-label="${props.label}" data-pid="${id}">` +
        [1,2,3,4,5].map(n =>
          `<label class="preview-star-label" title="${n} star${n>1?'s':''}"><input type="radio" name="pv-${id}" value="${n}" aria-label="${n} star${n>1?'s':''}"> <span class="preview-star">&#9733;</span></label>`
        ).join('') + `</div>`;
    } else if (type === 'signature') {
      fieldHtml = `<div class="preview-sig-wrap">
        <canvas id="pv-${id}" class="preview-sig-canvas" width="600" height="120" data-pid="${id}" tabindex="0" aria-label="Signature pad"></canvas>
        <button type="button" class="btn btn--ghost btn--sm preview-sig-clear" data-clear-sig="${id}">Clear</button>
      </div>`;
    }

    const helperHtml = props.helperText
      ? `<p class="preview-helper" id="pv-${id}-helper">${props.helperText}</p>`
      : '';

    if (type === 'radio' || type === 'checkbox-group') {
      wrap.innerHTML = fieldHtml + helperHtml;
    } else {
      wrap.innerHTML = labelHtml + fieldHtml + helperHtml;
    }

    return wrap;
  }

  function attachFieldListeners(wrap, el, previewForm, validationMode) {
    const { type, id } = el;

    const collectValue = () => {
      if (type === 'checkbox') {
        const input = wrap.querySelector(`[data-pid="${id}"]`);
        return input ? input.checked : false;
      }
      if (type === 'toggle') {
        const input = wrap.querySelector(`[data-pid="${id}"]`);
        return input ? input.checked : false;
      }
      if (type === 'radio') {
        const checked = wrap.querySelector(`input[name="pv-${id}"]:checked`);
        return checked ? checked.value : '';
      }
      if (type === 'checkbox-group' || type === 'multi-select') {
        const inputs = type === 'checkbox-group'
          ? wrap.querySelectorAll(`input[name="pv-${id}"]:checked`)
          : [...(wrap.querySelector(`[data-pid="${id}"]`)?.selectedOptions || [])];
        return [...inputs].map(i => i.value || i.text);
      }
      if (type === 'rating') {
        const checked = wrap.querySelector(`input[name="pv-${id}"]:checked`);
        return checked ? checked.value : '';
      }
      if (type === 'slider') {
        const input = wrap.querySelector(`[data-pid="${id}"]`);
        return input ? input.value : '';
      }
      const input = wrap.querySelector(`[data-pid="${id}"]`);
      return input ? input.value : '';
    };

    const onChange = () => {
      setFieldValue(id, collectValue());
      updateAllVisibility(previewForm);
      if (validationMode === 'realtime') validateField(el, wrap, previewForm);
    };

    const onBlur = () => {
      setFieldValue(id, collectValue());
      updateAllVisibility(previewForm);
      if (validationMode === 'onBlur' || validationMode === 'realtime') validateField(el, wrap, previewForm);
    };

    wrap.querySelectorAll('input,select,textarea').forEach(input => {
      input.addEventListener('change', onChange);
      input.addEventListener('blur',   onBlur);
      input.addEventListener('input',  onChange);
    });

    if (type === 'slider') {
      const sliderInput = wrap.querySelector(`[data-pid="${id}"]`);
      const valDisplay = wrap.querySelector(`#pv-${id}-val`);
      if (sliderInput && valDisplay) {
        sliderInput.addEventListener('input', () => { valDisplay.textContent = sliderInput.value; });
      }
    }

    if (type === 'rating') {
      const stars = wrap.querySelectorAll('.preview-star');
      const updateStars = (activeVal) => {
        stars.forEach((star, i) => {
          star.classList.toggle('preview-star--active', i < activeVal);
        });
      };
      wrap.querySelectorAll('.preview-rating input').forEach((input, i) => {
        input.addEventListener('change', () => updateStars(i + 1));
      });
    }

    if (type === 'signature') {
      initSignaturePad(wrap, id);
    }

    wrap.querySelector(`[data-clear-sig="${id}"]`)?.addEventListener('click', () => {
      const canvas = wrap.querySelector(`#pv-${id}`);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setFieldValue(id, null);
      }
    });
  }

  function initSignaturePad(wrap, id) {
    const canvas = wrap.querySelector(`#pv-${id}`);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: src.clientX - rect.left, y: src.clientY - rect.top };
    };

    canvas.addEventListener('mousedown', e => {
      drawing = true;
      const pos = getPos(e);
      [lastX, lastY] = [pos.x, pos.y];
    });
    canvas.addEventListener('mousemove', e => {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      [lastX, lastY] = [pos.x, pos.y];
      setFieldValue(id, canvas.toDataURL());
    });
    canvas.addEventListener('mouseup',   () => { drawing = false; });
    canvas.addEventListener('mouseleave',() => { drawing = false; });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      drawing = true;
      const pos = getPos(e);
      [lastX, lastY] = [pos.x, pos.y];
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!drawing) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      [lastX, lastY] = [pos.x, pos.y];
      setFieldValue(id, canvas.toDataURL());
    }, { passive: false });
    canvas.addEventListener('touchend', () => { drawing = false; });

    signaturePads.push({ canvas, id });
  }

  function renderPreviewForm(modal) {
    const state = FF.appState;
    const frame = document.getElementById('preview-frame');
    if (!frame) return;

    formValues.clear();
    signaturePads = [];

    const previewForm = document.createElement('form');
    previewForm.className = 'preview-form';
    previewForm.id = 'preview-form';
    previewForm.setAttribute('novalidate', '');
    previewForm.setAttribute('aria-label', state.formConfig.title);
    previewForm.setAttribute('data-theme', state.activeTheme);

    const header = document.createElement('div');
    header.className = 'preview-form__header';
    header.innerHTML = `<h1 class="preview-form__title">${state.formConfig.title}</h1>` +
      (state.formConfig.description ? `<p class="preview-form__desc">${state.formConfig.description}</p>` : '');

    const fieldsWrap = document.createElement('div');
    fieldsWrap.className = 'preview-form__fields';

    const validationMode = state.formConfig.validationMode || 'onSubmit';

    state.elements.forEach(el => {
      const fieldWrap = buildPreviewField(el);
      fieldsWrap.appendChild(fieldWrap);
      attachFieldListeners(fieldWrap, el, previewForm, validationMode);
      if (el.props.defaultValue && el.props.defaultValue !== '') {
        formValues.set(el.id, el.props.defaultValue);
      }
    });

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn--primary preview-submit-btn';
    submitBtn.textContent = state.formConfig.submitLabel || 'Submit';

    const successMsg = document.createElement('div');
    successMsg.className = 'preview-success-msg';
    successMsg.id = 'preview-success-msg';
    successMsg.setAttribute('role', 'status');
    successMsg.setAttribute('aria-live', 'polite');
    successMsg.style.display = 'none';
    successMsg.textContent = state.formConfig.successMessage || 'Thank you! Your response has been recorded.';

    const errorSummary = document.createElement('div');
    errorSummary.className = 'preview-error-summary';
    errorSummary.id = 'preview-error-summary';
    errorSummary.setAttribute('role', 'alert');
    errorSummary.setAttribute('aria-live', 'assertive');
    errorSummary.style.display = 'none';

    previewForm.addEventListener('submit', e => {
      e.preventDefault();
      const errors = [];
      state.elements.forEach(el => {
        const fieldWrap = previewForm.querySelector(`[data-preview-id="${el.id}"]`);
        if (!fieldWrap) return;
        if (!validateField(el, fieldWrap, previewForm)) {
          errors.push(el.props.label || el.type);
        }
      });

      if (errors.length) {
        errorSummary.style.display = '';
        errorSummary.innerHTML = `<strong>Please fix the following errors:</strong><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
        errorSummary.focus();
      } else {
        errorSummary.style.display = 'none';
        previewForm.style.display = 'none';
        successMsg.style.display = '';
      }
    });

    previewForm.appendChild(header);
    previewForm.appendChild(errorSummary);
    previewForm.appendChild(fieldsWrap);
    previewForm.appendChild(submitBtn);

    frame.innerHTML = '';
    frame.appendChild(previewForm);
    frame.appendChild(successMsg);

    updateAllVisibility(previewForm);
  }

  function autoFill() {
    const state = FF.appState;
    const previewForm = document.getElementById('preview-form');
    if (!previewForm) return;

    state.elements.forEach(el => {
      const filler = TEST_DATA[el.type];
      if (!filler) return;
      const value = filler(el);
      setFieldValue(el.id, value);

      const { type, id } = el;
      const wrap = previewForm.querySelector(`[data-preview-id="${id}"]`);
      if (!wrap) return;

      if (type === 'checkbox' || type === 'toggle') {
        const input = wrap.querySelector(`[data-pid="${id}"]`);
        if (input) input.checked = Boolean(value);
      } else if (type === 'radio') {
        const radio = wrap.querySelector(`input[value="${value}"]`);
        if (radio) radio.checked = true;
      } else if (type === 'checkbox-group') {
        wrap.querySelectorAll(`input[name="pv-${id}"]`).forEach(cb => {
          cb.checked = Array.isArray(value) && value.includes(cb.value);
        });
      } else if (type === 'multi-select') {
        const select = wrap.querySelector(`[data-pid="${id}"]`);
        if (select) {
          [...select.options].forEach(opt => {
            opt.selected = Array.isArray(value) && value.includes(opt.value);
          });
        }
      } else if (type === 'rating') {
        const radio = wrap.querySelector(`input[value="${value}"]`);
        if (radio) {
          radio.checked = true;
          const stars = wrap.querySelectorAll('.preview-star');
          stars.forEach((star, i) => star.classList.toggle('preview-star--active', i < Number(value)));
        }
      } else if (type === 'slider') {
        const input = wrap.querySelector(`[data-pid="${id}"]`);
        const display = wrap.querySelector(`#pv-${id}-val`);
        if (input) { input.value = value; }
        if (display) display.textContent = value;
      } else {
        const input = wrap.querySelector(`[data-pid="${id}"]`);
        if (input) input.value = String(value);
      }
    });

    updateAllVisibility(previewForm);
  }

  function resetForm() {
    formValues.clear();
    signaturePads.forEach(({ canvas }) => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    const previewForm = document.getElementById('preview-form');
    const successMsg = document.getElementById('preview-success-msg');
    const errorSummary = document.getElementById('preview-error-summary');
    if (previewForm) {
      previewForm.reset();
      previewForm.style.display = '';
    }
    if (successMsg) successMsg.style.display = 'none';
    if (errorSummary) errorSummary.style.display = 'none';
    if (previewForm) updateAllVisibility(previewForm);
  }

  function setDevice(device) {
    const frame = document.getElementById('preview-frame');
    if (!frame) return;
    frame.className = 'preview-frame';
    if (device === 'tablet') frame.classList.add('preview-frame--tablet');
    else if (device === 'mobile') frame.classList.add('preview-frame--mobile');

    document.querySelectorAll('.preview-device-btn').forEach(btn => {
      const active = btn.getAttribute('data-device') === device;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function open() {
    const modal = document.getElementById('modal-preview');
    const overlay = document.getElementById('modal-overlay');
    if (!modal || !overlay) return;
    modal.hidden = false;
    overlay.classList.add('modal-overlay--visible');
    overlay.setAttribute('aria-hidden', 'false');
    renderPreviewForm(modal);
    setDevice(FF.appState.previewDevice || 'desktop');
    const firstFocusable = modal.querySelector('button,input,select,textarea');
    if (firstFocusable) firstFocusable.focus();
  }

  function close() {
    const modal = document.getElementById('modal-preview');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.hidden = true;
    if (overlay) {
      overlay.classList.remove('modal-overlay--visible');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function init() {
    document.getElementById('btn-preview')?.addEventListener('click', open);
    document.getElementById('modal-preview-close')?.addEventListener('click', close);
    document.getElementById('btn-preview-autofill')?.addEventListener('click', autoFill);
    document.getElementById('btn-preview-reset')?.addEventListener('click', resetForm);

    document.querySelectorAll('.preview-device-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const device = btn.getAttribute('data-device');
        FF.dispatch({ type: FF.ACTIONS.SET_PREVIEW_DEVICE, device });
        setDevice(device);
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modal-preview');
        if (modal && !modal.hidden) close();
      }
    });
  }

  return { init, open, close, resetForm, autoFill };
})();

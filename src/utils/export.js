window.FF = window.FF || {};

FF.Export = (() => {

  function buildJsonSchema(state) {
    const { formConfig, elements } = state;
    const props = {};
    const required = [];

    elements.forEach(el => {
      if (['divider', 'section-header', 'rich-text'].includes(el.type)) return;
      const schema = { type: 'string', title: el.props.label };
      if (el.props.helperText) schema.description = el.props.helperText;
      if (el.props.defaultValue !== undefined && el.props.defaultValue !== '') schema.default = el.props.defaultValue;

      if (el.type === 'number' || el.type === 'slider') schema.type = 'number';
      else if (el.type === 'checkbox') schema.type = 'boolean';
      else if (el.type === 'multi-select' || el.type === 'checkbox-group') {
        schema.type = 'array';
        schema.items = { type: 'string', enum: el.props.options || [] };
      } else if (['dropdown', 'radio'].includes(el.type)) {
        schema.enum = el.props.options || [];
      }

      if (el.props.validation) {
        if (el.props.validation.minLength) schema.minLength = el.props.validation.minLength;
        if (el.props.validation.maxLength) schema.maxLength = el.props.validation.maxLength;
        if (el.props.validation.pattern)   schema.pattern   = el.props.validation.pattern;
        if (el.props.validation.min !== undefined) schema.minimum = el.props.validation.min;
        if (el.props.validation.max !== undefined) schema.maximum = el.props.validation.max;
      }

      props[el.id] = schema;
      if (el.props.required) required.push(el.id);
    });

    return JSON.stringify({
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: formConfig.title,
      description: formConfig.description,
      type: 'object',
      properties: props,
      required,
    }, null, 2);
  }

  function renderPreviewField(el) {
    const { type, props, id } = el;
    const label = props.label || '';
    const ph = props.placeholder || '';
    const req = props.required ? ' required' : '';
    const reqMark = props.required ? '<span style="color:#EF4444">*</span>' : '';

    const wrap = (inner) => `<div style="margin-bottom:16px;width:${props.width || 100}%">
  <label for="${id}" style="display:block;font-weight:500;margin-bottom:4px;font-size:14px">${label} ${reqMark}</label>
  ${inner}
  ${props.helperText ? `<p style="font-size:12px;color:#6B7280;margin-top:4px">${props.helperText}</p>` : ''}
</div>`;

    if (type === 'text' || type === 'email' || type === 'tel' || type === 'url') {
      return wrap(`<input type="${type}" id="${id}" name="${id}" placeholder="${ph}"${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box">`);
    }
    if (type === 'textarea') {
      return wrap(`<textarea id="${id}" name="${id}" placeholder="${ph}" rows="4"${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box;resize:vertical"></textarea>`);
    }
    if (type === 'number' || type === 'slider') {
      const min = props.validation && props.validation.min !== undefined ? ` min="${props.validation.min}"` : '';
      const max = props.validation && props.validation.max !== undefined ? ` max="${props.validation.max}"` : '';
      if (type === 'slider') {
        return wrap(`<input type="range" id="${id}" name="${id}"${min}${max}${req} style="width:100%">`);
      }
      return wrap(`<input type="number" id="${id}" name="${id}" placeholder="${ph}"${min}${max}${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box">`);
    }
    if (type === 'dropdown') {
      const opts = (props.options || []).map(o => `  <option value="${o}">${o}</option>`).join('\n');
      return wrap(`<select id="${id}" name="${id}"${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box">
  <option value="">-- Select --</option>
${opts}
</select>`);
    }
    if (type === 'multi-select') {
      const opts = (props.options || []).map(o => `  <option value="${o}">${o}</option>`).join('\n');
      return wrap(`<select id="${id}" name="${id}" multiple${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box">
${opts}
</select>`);
    }
    if (type === 'radio') {
      const radios = (props.options || []).map((o, i) =>
        `<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><input type="radio" name="${id}" value="${o}"${i === 0 && req ? req : ''}> ${o}</label>`
      ).join('\n');
      return wrap(radios);
    }
    if (type === 'checkbox') {
      return `<div style="margin-bottom:16px;display:flex;align-items:center;gap:8px">
  <input type="checkbox" id="${id}" name="${id}"${req}>
  <label for="${id}" style="font-size:14px">${label}</label>
</div>`;
    }
    if (type === 'checkbox-group') {
      const checks = (props.options || []).map((o, i) =>
        `<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><input type="checkbox" name="${id}" value="${o}"> ${o}</label>`
      ).join('\n');
      return wrap(checks);
    }
    if (type === 'date') {
      return wrap(`<input type="date" id="${id}" name="${id}"${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box">`);
    }
    if (type === 'time') {
      return wrap(`<input type="time" id="${id}" name="${id}"${req} style="width:100%;padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;font-size:14px;box-sizing:border-box">`);
    }
    if (type === 'file') {
      return wrap(`<input type="file" id="${id}" name="${id}"${req} style="font-size:14px">`);
    }
    if (type === 'toggle') {
      return `<div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
  <input type="checkbox" id="${id}" name="${id}" role="switch"${req}>
  <label for="${id}" style="font-size:14px;font-weight:500">${label}</label>
</div>`;
    }
    if (type === 'rating') {
      return wrap(`<div style="display:flex;gap:8px">
  ${[1,2,3,4,5].map(n => `<label style="cursor:pointer;font-size:24px"><input type="radio" name="${id}" value="${n}" style="position:absolute;opacity:0"> &#9733;</label>`).join('')}
</div>`);
    }
    if (type === 'divider') {
      return `<hr style="margin:16px 0;border:none;border-top:1px solid #E5E7EB">`;
    }
    if (type === 'section-header') {
      return `<h3 style="font-size:18px;font-weight:600;margin:24px 0 8px">${props.label}</h3>`;
    }
    if (type === 'rich-text') {
      return `<div style="font-size:14px;color:#374151;margin-bottom:16px">${props.label}</div>`;
    }
    if (type === 'hidden') {
      return `<input type="hidden" id="${id}" name="${id}" value="${props.defaultValue || ''}">`;
    }
    if (type === 'signature') {
      return wrap(`<canvas id="${id}" width="400" height="120" style="border:1px solid #D1D5DB;border-radius:6px;cursor:crosshair;display:block"></canvas>`);
    }
    return '';
  }

  function buildHtml(state) {
    const { formConfig, elements } = state;
    const fieldsHtml = elements.map(el => renderPreviewField(el)).join('\n');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${formConfig.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #F3F4F6; color: #111827; padding: 40px 20px; }
    .form-wrap { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.08); padding: 40px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .form-desc { color: #6B7280; font-size: 14px; margin-bottom: 32px; }
    .form-fields { display: flex; flex-wrap: wrap; gap: 0; }
    .btn-submit { background: #4F46E5; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 24px; }
    .btn-submit:hover { background: #4338CA; }
    .success-msg { display:none; background:#D1FAE5; border:1px solid #6EE7B7; border-radius:8px; padding:16px; color:#065F46; font-weight:500; margin-top:16px; }
  </style>
</head>
<body>
  <div class="form-wrap">
    <h1>${formConfig.title}</h1>
    ${formConfig.description ? `<p class="form-desc">${formConfig.description}</p>` : ''}
    <form id="main-form" novalidate>
      <div class="form-fields">
        ${fieldsHtml}
      </div>
      <button type="submit" class="btn-submit">${formConfig.submitLabel || 'Submit'}</button>
      <div class="success-msg" id="success-msg">${formConfig.successMessage || 'Thank you!'}</div>
    </form>
  </div>
  <script>
    document.getElementById('main-form').addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('success-msg').style.display = 'block';
    });
  </script>
</body>
</html>`;
  }

  function buildReactJsx(state) {
    const { formConfig, elements } = state;

    const fieldJsx = elements.map(el => {
      const { type, props, id } = el;
      const label = props.label || '';
      const ph = props.placeholder || '';
      const req = props.required ? ' required' : '';

      if (type === 'text' || type === 'email' || type === 'tel' || type === 'url' || type === 'number') {
        return `      <div className="field-wrap">
        <label htmlFor="${id}">${label}${props.required ? ' *' : ''}</label>
        <input type="${type}" id="${id}" name="${id}" placeholder="${ph}"${req} />
        ${props.helperText ? `<p className="helper">${props.helperText}</p>` : ''}
      </div>`;
      }
      if (type === 'textarea') {
        return `      <div className="field-wrap">
        <label htmlFor="${id}">${label}${props.required ? ' *' : ''}</label>
        <textarea id="${id}" name="${id}" placeholder="${ph}" rows={4}${req} />
        ${props.helperText ? `<p className="helper">${props.helperText}</p>` : ''}
      </div>`;
      }
      if (type === 'dropdown') {
        const opts = (props.options || []).map(o => `          <option value="${o}">${o}</option>`).join('\n');
        return `      <div className="field-wrap">
        <label htmlFor="${id}">${label}${props.required ? ' *' : ''}</label>
        <select id="${id}" name="${id}"${req}>
          <option value="">-- Select --</option>
${opts}
        </select>
      </div>`;
      }
      if (type === 'checkbox') {
        return `      <div className="field-wrap field-wrap--check">
        <input type="checkbox" id="${id}" name="${id}"${req} />
        <label htmlFor="${id}">${label}</label>
      </div>`;
      }
      if (type === 'radio') {
        const radios = (props.options || []).map(o =>
          `          <label><input type="radio" name="${id}" value="${o}" /> ${o}</label>`
        ).join('\n');
        return `      <div className="field-wrap">
        <fieldset><legend>${label}</legend>
${radios}
        </fieldset>
      </div>`;
      }
      if (type === 'date') {
        return `      <div className="field-wrap">
        <label htmlFor="${id}">${label}${props.required ? ' *' : ''}</label>
        <input type="date" id="${id}" name="${id}"${req} />
      </div>`;
      }
      if (type === 'divider') return `      <hr />`;
      if (type === 'section-header') return `      <h3>${label}</h3>`;
      if (type === 'rich-text') return `      <p>${label}</p>`;
      return `      {/* ${type}: ${label} */}`;
    }).join('\n');

    return `import React, { useState } from 'react';

export default function ${formConfig.title.replace(/[^a-zA-Z0-9]/g, '')}Form() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return <div className="success">${formConfig.successMessage || 'Thank you!'}</div>;
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>${formConfig.title}</h2>
      ${formConfig.description ? `<p className="form-desc">${formConfig.description}</p>` : ''}
${fieldJsx}
      <button type="submit">${formConfig.submitLabel || 'Submit'}</button>
    </form>
  );
}`;
  }

  function buildFormJson(state) {
    return JSON.stringify({
      formConfig: state.formConfig,
      elements: state.elements,
      activeTheme: state.activeTheme,
      exportedAt: new Date().toISOString(),
      version: FF.SCHEMA_VERSION,
    }, null, 2);
  }

  return { buildJsonSchema, buildHtml, buildReactJsx, buildFormJson };
})();

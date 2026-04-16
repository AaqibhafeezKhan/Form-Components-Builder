window.FF = window.FF || {};

FF.Validation = (() => {

  function validateField(element, value) {
    const { props } = element;
    const { validation = {}, required, label } = props;
    const isEmpty = v => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

    if (required && isEmpty(value)) {
      return { valid: false, message: validation.customMessage || (label + ' is required.') };
    }

    if (!isEmpty(value)) {
      const strVal = String(value);

      if (validation.minLength && strVal.length < validation.minLength) {
        return { valid: false, message: validation.customMessage || (label + ' must be at least ' + validation.minLength + ' characters.') };
      }
      if (validation.maxLength && strVal.length > validation.maxLength) {
        return { valid: false, message: validation.customMessage || (label + ' must be at most ' + validation.maxLength + ' characters.') };
      }
      if (validation.pattern) {
        try {
          if (!new RegExp(validation.pattern).test(strVal)) {
            return { valid: false, message: validation.customMessage || (label + ' format is invalid.') };
          }
        } catch (e) { console.warn('[Validation] Bad regex:', validation.pattern); }
      }
      if (validation.min !== undefined && parseFloat(value) < validation.min) {
        return { valid: false, message: validation.customMessage || (label + ' must be at least ' + validation.min + '.') };
      }
      if (validation.max !== undefined && parseFloat(value) > validation.max) {
        return { valid: false, message: validation.customMessage || (label + ' must be no more than ' + validation.max + '.') };
      }
    }

    return { valid: true, message: '' };
  }

  function evaluateRule(rule, values) {
    const fieldVal = values.get ? values.get(rule.field) : values[rule.field];
    const isEmpty = v => v === undefined || v === null || v === '';
    switch (rule.operator) {
      case 'equals':       return String(fieldVal) === String(rule.value);
      case 'not_equals':   return String(fieldVal) !== String(rule.value);
      case 'contains':     return String(fieldVal).includes(String(rule.value));
      case 'is_empty':     return isEmpty(fieldVal);
      case 'is_not_empty': return !isEmpty(fieldVal);
      default:             return false;
    }
  }

  function evaluateConditionalLogic(element, values) {
    const result = { visible: true, required: element.props.required, disabled: false };
    const cl = element.conditionalLogic;
    if (!cl || !cl.enabled || !cl.rules || !cl.rules.length) return result;

    const results = cl.rules.map(r => evaluateRule(r, values));
    const passes = cl.logicOperator === 'OR' ? results.some(Boolean) : results.every(Boolean);

    const action = cl.action || (cl.rules[0] && cl.rules[0].action) || 'show';
    if (passes) {
      if (action === 'show')    result.visible  = true;
      if (action === 'hide')    result.visible  = false;
      if (action === 'require') result.required = true;
      if (action === 'disable') result.disabled = true;
    } else {
      if (action === 'show') result.visible = false;
      if (action === 'hide') result.visible = true;
    }
    return result;
  }

  function testRegex(pattern, value) {
    try {
      return { valid: new RegExp(pattern).test(value), error: null };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  function validateImport(parsed) {
    const errors = [];
    if (typeof parsed !== 'object' || parsed === null) { errors.push('Root must be a JSON object.'); return { valid: false, errors }; }
    if (!parsed.formConfig) errors.push('Missing: formConfig');
    if (!Array.isArray(parsed.elements)) {
      errors.push('Missing: elements (must be array)');
    } else {
      parsed.elements.forEach((el, i) => {
        if (!el.id)    errors.push('Element ' + i + ' missing id');
        if (!el.type)  errors.push('Element ' + i + ' missing type');
        if (!el.props) errors.push('Element ' + i + ' missing props');
      });
    }
    return { valid: errors.length === 0, errors };
  }

  return { validateField, evaluateRule, evaluateConditionalLogic, testRegex, validateImport };
})();

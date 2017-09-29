function _encode(name,value) {
  return '&' + encodeURIComponent(name) + '=' +
    encodeURIComponent(value).replace(/%20/g, '+');
}

function _getSelectMultiple(el) {
  const values = [];
  cash.each(el.options, opt => {
    if (opt.selected) {
      values.push(opt.value);
    }
  });
  return (values.length ? values : null);
}

function _getSelectSingle(el) {
  const selectedIndex = el.selectedIndex;
  return (selectedIndex >= 0 ? el.options[selectedIndex].value : null);
}

function _getValue(el) {
  const type = el.type;
  if (!type) {
    return null;
  }
  switch (type.toLowerCase()) {
    case 'select-one':
      return _getSelectSingle(el);
    case 'select-multiple':
      return _getSelectMultiple(el);
    case 'radio':
    case 'checkbox':
      return (el.checked ? el.value : null);
    default:
      return (el.value   ? el.value : null);
  }
}

cash.fn.extend({

  serialize() {
    let query = '';

    cash.each(this[0].elements || this, el => {
      if (el.disabled || el.tagName === 'FIELDSET') {
        return;
      }
      const name = el.name;
      switch (el.type.toLowerCase()) {
        case 'file':
        case 'reset':
        case 'submit':
        case 'button':
          break;
        case 'select-multiple':
          const values = _getValue(el);
          if (values !== null) {
            cash.each(values, value => {
              query += _encode(name, value);
            });
          }
          break;
        default:
          const value = _getValue(el);
          if (value !== null) {
            query += _encode(name, value);
          }
      }
    });

    return query.substr(1);
  },

  val(value) {
    if (value === undefined) {
      return _getValue(this[0]);
    } else {
      return this.each(el => el.value = value);
    }
  }

});

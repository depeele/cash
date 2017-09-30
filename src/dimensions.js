/* jshint laxbreak: true */
function _compute(el, prop) {
  return parseInt(win.getComputedStyle(el[0], null)[prop], 10) || 0;
}

cash.each(['Width','Height'], prop => {

  const lower = prop.toLowerCase();

  cash.fn[lower] = function(){
    const el  = this[0];
    return (cash.isWindow(el)
              ? el.document.documentElement['client'+ prop]
              : el.getBoundingClientRect()[lower]);
  };

  cash.fn['inner' + prop] = function(){
    const el  = this[0];
    return (cash.isWindow(el)
              ? el.document.documentElement['client'+ prop]
              : el['client' + prop]);
  };

  cash.fn['outer' + prop] = function(margins) {
    const el  = this[0];
    return (cash.isWindow(el)
              ? el['inner'+ prop]
              : el['offset' + prop] +
                ( margins
                  ?  _compute(this, 'margin' + ( prop === 'Width'
                                                  ? 'Left' : 'Top' )) +
                     _compute(this, 'margin' + ( prop === 'Width'
                                                  ? 'Right' : 'Bottom' ))
                  : 0 ));
  };

});

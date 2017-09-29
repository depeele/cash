/* jshint laxbreak: true */
function _compute(el, prop) {
  return parseInt(win.getComputedStyle(el[0], null)[prop], 10) || 0;
}

cash.each(['Width','Height'], prop => {

  const lower = prop.toLowerCase();

  fn[lower] = function(){ return this[0].getBoundingClientRect()[lower]; };

  fn['inner' + prop] = function(){ return this[0]['client' + prop]; };

  fn['outer' + prop] = function(margins) {
    return this[0]['offset' + prop] +
            ( margins
                ?  _compute(this, 'margin' + ( prop === 'Width'
                                                ? 'Left' : 'Top' )) +
                   _compute(this, 'margin' + ( prop === 'Width'
                                                ? 'Right' : 'Bottom' ))
                : 0 );
  };

});

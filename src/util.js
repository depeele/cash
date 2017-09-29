/* jshint laxbreak: true */
function _each(collection, callback) {
  const len   = collection.length;
  let   idex  = 0;

  for (; idex < len; idex++) {
    if ( callback.call(collection[idex], collection[idex], idex, collection)
                      === false ) {
      break;
    }
  }
}

function _matches( el, selector ) {
  const match = el && (
    el.matches ||
    el.webkitMatchesSelector ||
    el.mozMatchesSelector ||
    el.msMatchesSelector ||
    el.oMatchesSelector
  );
  return !!match && match.call(el, selector);
}

function _unique( collection ) {
  return cash(slice.call(collection).filter((item, index, self) => {
    return self.indexOf(item) === index;
  }));
}

function _selectComparator( selector ){
  return (
    /* Use browser's `matches` function if string */
    cash.isString(selector)
      ? cash.matches
      /* Match a cash element */
      : selector.cash
        ? el => { return selector.is(el); }
        /* Direct comparison */
        : function(el,selector){ return el === selector; }
  );
}


// Upgrade extend
cash.extend = cash.fn.extend = function(target) {
  target = target || {};

  const args    = slice.call(arguments);
  let   length  = args.length;
  let   idex    = 1;

  if ( args.length === 1) {
    target = this;
    idex   = 0;
  }

  for (; idex < length; idex++) {
    if (!args[idex]) { continue; }
    for (let key in args[idex]) {
      if ( args[idex].hasOwnProperty(key) ) { target[key] = args[idex][key]; }
    }
  }

  return target;
};

cash.extend({

  merge(first, second) {
    const len  = +second.length;
    let   idex = first.length;
    let   jdex = 0;

    for (; jdex < len; idex++, jdex++) {
      first[idex] = second[jdex];
    }

    first.length = idex;
    return first;
  },

  each            : _each,
  matches         : _matches,
  unique          : _unique,
  selectComparator: _selectComparator,

  isArray         : Array.isArray,
  isNumeric(num)    { return !isNaN(parseFloat(num)) && isFinite(num); },

});

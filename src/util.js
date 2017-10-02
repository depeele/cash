/* jshint laxbreak: true */
function _each(collection, callback) {
  const len   = collection.length;

  if (len === undefined) {
    // Object iteration
    for (let key in collection) {
      const el  = collection[key];
      /* Support jQuery's backwards parameter list for each over objects:
       *    callback( key, val )  vs ES6 callback( val, key )
       */
      if ( callback.call( el, key, el, collection) === false ) {
        break;
      }
    }

  } else {
    // Array iteration
    let idex  = 0;

    for (; idex < len; idex++) {
      const el  = collection[idex];
      if ( callback.call(el, el, idex, collection) === false ) {
        break;
      }
    }
  }
}

function _matches( el, selector ) {
  let match;
  if (el) {
    if (cash._pseudos && selector[0] === ':') {
      // Use a pseudo selector matcher
      const pseudoFn  = cash._pseudos[ selector.slice(1) ];
      if (! cash.isFunction(pseudoFn)) {
        console.error('unsupported pseudo: '+ selector);

      } else {
        match = pseudoFn;

      }

    } else {
      // Use a browser matcher
      match = (
        el.matches ||
        el.webkitMatchesSelector ||
        el.mozMatchesSelector ||
        el.msMatchesSelector ||
        el.oMatchesSelector
      );
    }
  }

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

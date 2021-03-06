/* jshint laxbreak: true */
const _noop       = function(){};
const _isWindow   = function(item) { return item === win; };
const _isFunction = function(item) {
        // @see https://crbug.com/568448
        return typeof item === typeof _noop && item.call;
      };
const _isString   = function(item) { return typeof item === typeof ''; };

const _idRe       = /^#[\w-]*$/;
const _classRe    = /^\.[\w-]*$/;
const _htmlRe     =  /<.+>/;
const _singletRe  = /^\w+$/;
const _tagRe      = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

function _find( selector, context ) {
  context = context || doc;
  const elems = (
        _classRe.test(selector)
          ?  context.getElementsByClassName( selector.slice(1) )
          : (_singletRe.test(selector)
              ? context.getElementsByTagName(selector)
              : context.querySelectorAll(selector))
      );
  return elems;
}

var _frag;
function _parseHTML(str) {
  if (!_frag) {
    _frag = doc.implementation.createHTMLDocument();
    const base = _frag.createElement('base');
    base.href = doc.location.href;
    _frag.head.appendChild(base);
  }

  const parsed  = _tagRe.exec( str );
  if (parsed) {
    // Single tag
    return [ _frag.createElement( parsed[1] ) ];
  }

  _frag.body.innerHTML = str;
  return _frag.body.childNodes;
}


function _contains( container, target ) {
  const containerEl   = (container.nodeType === 9
                          ? container.documentElement
                          : container);
  const targetParent  = (target && target.parentNode);

  return (container === targetParent ||
          !!( targetParent && targetParent.nodeType === 1 &&
              containerEl.contains( targetParent ) ) );
}

function _onReady(fn) {
  if ( doc.readyState !== 'loading' ) { fn(); }
  else { doc.addEventListener('DOMContentLoaded', fn); }
}

function Init(selector,context){

  if ( !selector ) { return this; }

  // If already a cash collection, don't do any further processing
  if ( selector.cash && selector !== win ) { return selector; }

  let elems = selector;
  let idex  = 0;
  let length;

  if ( _isString(selector) ) {
    elems = (
      // If an ID use the faster getElementById check
      _idRe.test(selector)
        ? doc.getElementById(selector.slice(1))
        // If HTML, parse it into real elements
        : _htmlRe.test(selector)
          ? _parseHTML(selector)
          // else use `find`
          : _find(selector,context)
    );

  } else if ( _isFunction(selector) ) {
    // If function, use as shortcut for DOM ready
    _onReady(selector);
    return this;
  }

  if ( !elems ) { return this; }

  // If a single DOM element is passed in or received via ID, return the single element
  if ( elems.nodeType || elems === win ) {
    this[0]     = elems;
    this.length = 1;
  } else {
    // Treat like an array and loop through each item.
    length = this.length = elems.length;
    for( ; idex < length; idex++ ) { this[idex] = elems[idex]; }
  }

  return this;
}

function cash(selector,context) {
  return new Init(selector,context);
}

Object.defineProperties( cash.prototype, {
  constructor : { value: cash },
  init        : { value: Init },

  push        : { value: push },
  splice      : { value: ArrayProto.splice },
  map         : { value: ArrayProto.map },

  cash        : { value: true, enumerable: true },
  length      : { value: 0,    enumerable: true, writable: true },

  ready       : _onReady,
});

function _proxy( fn, context ) {
  if (cash.isString(context)) {
    // Bind a named method
    const tmp = fn[ context ];
    context   = fn;
    fn        = tmp;
  }
  if (! cash.isFunction( fn )) {
    return undefined;
  }

  return fn.bind( context );
}

Object.defineProperties( cash, {
  uid         : { value: '_cash'+ Date.now() },
  fn          : { value: cash.prototype },
  parseHTML   : { value: _parseHTML },
  noop        : { value: _noop },
  isWindow    : { value: _isWindow },
  isFunction  : { value: _isFunction },
  isString    : { value: _isString },
  find        : { value: _find },
  proxy       : { value: _proxy },
  contains    : { value: _contains },
});

Init.prototype = cash.prototype;

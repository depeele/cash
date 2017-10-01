/*! cash-dom 1.3.5, https://github.com/kenwheeler/cash @license MIT */
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory();
  } else {
    root.cash = root.$ = factory();
  }
})(this, function() {

  const doc        = document;
  const win        = window;
  const ArrayProto = Array.prototype;
  const slice      = ArrayProto.slice;
  const filter     = ArrayProto.filter;
  const push       = ArrayProto.push;

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
  });
  
  Init.prototype = cash.prototype;
  
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
  
  /* jshint laxbreak: true */
  function _getDataCache(node) {
    return (node[cash.uid] = node[cash.uid] || {});
  }
  
  function _setData(node, key, value) {
    return (_getDataCache(node)[key] = value);
  }
  
  function _getData(node, key) {
    const cache = _getDataCache(node);
    if ( cache[key] === undefined ) {
      cache[key] = (node.dataset
                      ? node.dataset[key]
                      : cash(node).attr('data-'+key));
    }
    return cache[key];
  }
  
  function _removeData(node, key) {
    const cache = _getDataCache(node);
    if ( cache )             { delete cache[key]; }
    else if ( node.dataset ) { delete node.dataset[key]; }
    else                     { cash(node).removeAttr('data-' + name); }
  }
  
  cash.fn.extend({
  
    data(name, value) {
  
      if ( cash.isString(name) ) {
        return ( value === undefined
                  ?  _getData(this[0],name)
                  : this.each(el => _setData(el,name,value) )
        );
      }
  
      for (let key in name) {
        this.data( key, name[key] );
      }
  
      return this;
    },
  
    removeData(key) {
      return this.each(el => _removeData(el,key) );
    },
  });
  
  cash.getData = _getData;
  cash.setData = _setData;
  
  /* jshint laxbreak: true */
  const _notWhiteRe = /\S+/g;
  
  function _getClasses( cls ){
    return cash.isString(cls) && cls.match(_notWhiteRe);
  }
  
  function _hasClass( el, cls ) {
    return ( el.classList ?
      el.classList.contains(cls) :
      new RegExp('(^| )' + cls + '( |$)', 'gi').test(el.className)
    );
  }
  
  function _addClass( el, cls, spacedName ){
    if (el.classList) { el.classList.add(cls); }
    else if ( spacedName.indexOf(` ${cls} `) ) { el.className += ' ' + cls; }
  }
  
  function _removeClass( el, cls ){
    if (el.classList) { el.classList.remove(cls); }
    else { el.className = el.className.replace(cls,''); }
  }
  
  cash.fn.extend({
  
    addClass( cls ){
      const classes = _getClasses(cls);
  
      return (
        classes
          ? this.each(el => {
              const spacedName = ` ${el.className} `;
              cash.each( classes, cls => { _addClass(el,cls,spacedName); });
            })
          : this
      );
    },
  
    attr( name, value ) {
      if ( !name ) { return undefined; }
  
      if ( cash.isString(name) ) {
        if ( value === undefined ) {
          return this[0] ?
            this[0].getAttribute ? this[0].getAttribute(name) : this[0][name]
            : undefined;
        }
  
        return this.each(el => {
          if ( el.setAttribute ) { el.setAttribute(name, value); }
          else { el[name] = value; }
        });
      }
  
      for (let key in name) {
        this.attr(key,name[key]);
      }
  
      return this;
    },
  
    hasClass( cls ) {
      const classes = _getClasses(cls);
      let   check   = false;
  
      if ( classes && classes.length ) {
        this.each(el => {
          check = _hasClass(el,classes[0]);
          return !check;
        });
      }
      return check;
    },
  
    prop( name, value ) {
  
      if ( cash.isString(name) ) {
        return ( value === undefined ?
          this[0][name] :
          this.each(el => { el[name] = value; })
        );
      }
  
      for (let key in name) {
        this.prop(key,name[key]);
      }
  
      return this;
    },
  
    removeAttr( name ) {
      return this.each(el => {
        if ( el.removeAttribute ) { el.removeAttribute(name); }
        else { delete el[name]; }
      });
    },
  
    removeClass( cls ) {
      if(!arguments.length){
        return this.attr('class','');
      }
      const classes = _getClasses(cls);
      return (
        classes
          ? this.each(el => {
              cash.each(classes,cls => { _removeClass(el,cls); });
            })
          : this
      );
    },
  
    removeProp( name ) {
      return this.each(el => { delete el[name]; });
    },
  
    toggleClass( cls, state ) {
      if ( state !== undefined ) {
        return this[ state ? 'addClass' : 'removeClass' ](cls);
      }
      const classes = _getClasses(cls);
      return (
        classes
          ? this.each(el => {
              const spacedName  = ` ${el.className} `;
              cash.each(classes,cls => {
                if ( _hasClass(el,cls) ) {
                  _removeClass(el,cls);
                } else {
                  _addClass(el,cls,spacedName);
                }
              });
            })
          : this
      );
    },
  
  });
  
  /* jshint laxbreak: true */
  cash.fn.extend({
  
    add(selector, context) {
      return cash.unique(cash.merge(this, cash(selector, context)));
    },
  
    each(callback) {
      cash.each(this, callback);
      return this;
    },
  
    eq(index) {
      return cash(this.get(index));
    },
  
    filter(selector) {
      if ( !selector ) { return this; }
  
      const comparator = ( cash.isFunction(selector)
                            ? selector
                            : cash.selectComparator(selector ) );
  
      return cash( filter.call(this, el => comparator(el, selector) ) );
    },
  
    first() {
      return this.eq(0);
    },
  
    get(index) {
      if ( index === undefined ) { return slice.call(this); }
      return ( index < 0 ? this[index + this.length] : this[index] );
    },
  
    index(elem) {
      const child       = (elem ? cash(elem)[0] : this[0]);
      const collection  = (elem ? this : cash(child).parent().children());
      return slice.call( collection ).indexOf(child);
    },
  
    last() {
      return this.eq(-1);
    }
  
  });
  
  /* jshint laxbreak: true */
  const _camelCase  = (function(){
    const _camelRe  = /(?:^\w|[A-Z]|\b\w)/g;
    const _wsRe     = /[\s-_]+/g;
  
    return function(str) {
      return str.replace(_camelRe, (letter, index) => letter[index === 0
                                                              ? 'toLowerCase'
                                                              : 'toUpperCase']())
                .replace(_wsRe, '');
    };
  }());
  
  const _getPrefixedProp  = (function() {
    const cache     = {};
    const doc       = document;
    const div       = doc.createElement('div');
    const style     = div.style;
    const prefixes  = ['webkit', 'moz', 'ms', 'o'];
  
    return function(prop) {
      prop = _camelCase(prop);
      if ( cache[prop] ) { return cache[prop]; }
  
      const ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1);
      const props   = (prop + ' ' + (prefixes).join(ucProp + ' ') + ucProp)
                        .split(' ');
  
      cash.each(props, prop => {
        if ( prop in style ) {
          cache[prop] = prop = cache[prop] = prop;
          return false;
        }
      });
  
      return cache[prop];
    };
  }());
  
  const _parseStyle = (function() {
    const _propSepRe  = /\s*;\s*/;
    const _kvRe       = /\s*:\s*/;
  
    return function(str) {
      const css = {};
      if (cash.isString(str)) {
        str.split( _propSepRe )
          .forEach( kv => {
            if (! kv) { return; }
  
            const [key, val] = kv.split( _kvRe );
            css[key] = val;
          });
      }
  
      return css;
    };
  }());
  
  cash.prefixedProp = _getPrefixedProp;
  cash.camelCase    = _camelCase;
  cash.parseStyle   = _parseStyle;
  
  cash.fn.extend({
  
    css(prop,value){
      if ( cash.isString(prop) ) {
        prop = _getPrefixedProp(prop);
        return ( arguments.length > 1 ?
          this.each(el => el.style[prop] = value ) :
          win.getComputedStyle(this[0])[prop]
        );
      }
  
      for (let key in prop) {
        this.css(key,prop[key]);
      }
  
      return this;
    }
  
  });
  
  /* jshint laxbreak: true */
  function _compute(el, prop) {
    return parseInt(win.getComputedStyle(el[0], null)[prop], 10) || 0;
  }
  
  cash.each(['Width','Height'], prop => {
  
    const lower = prop.toLowerCase();
  
    cash.fn[lower] = function( val ) {
      const el  = this[0];
      if (cash.isWindow(el)) {
        return el.document.documentElement['client'+ prop];
  
      } else {
        if (val === undefined) {
          // get
          return el.getBoundingClientRect()[lower];
  
        } else {
          // set
          el.style[lower] = val;
          return this;
        }
      }
    };
  
    cash.fn['inner' + prop] = function() {
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
  
  /* jshint laxbreak: true, eqnull:true */
  function _registerEvent(node, eventName, callback) {
    const eventCache  = cash.getData(node,'_cashEvents') ||
                        cash.setData(node, '_cashEvents', {});
  
    eventCache[eventName] = eventCache[eventName] || [];
    eventCache[eventName].push(callback);
  
    const baseName    = eventName.split('.').shift();
    node.addEventListener(baseName, callback);
  }
  
  function _removeEvent(node, eventName, callback) {
    const events      = cash.getData(node,'_cashEvents');
    let   eventCache  = (events && events[eventName]);
  
    if ( !eventCache ) { return; }
  
    if (callback) {
      node.removeEventListener(eventName, callback);
  
      let index = eventCache.indexOf(callback);
      if ( index >= 0 ) { eventCache.splice( index, 1); }
    } else {
      cash.each(eventCache, event => {
        node.removeEventListener(eventName, event);
      });
      eventCache = [];
    }
  }
  
  function _returnTrue()  { return true; }
  function _returnFalse() { return false; }
  
  function _makeGetSetProperty( obj, target, key ) {
    Object.defineProperty( obj, key, {
      get()     { return target[key]; },
      set(val)  { target[key] = val; },
    });
  }
  
  cash.Event = function( src, props ) {
    // Allow instantiation without 'new'
    if ( !(this instanceof cash.Event) ) {
      return new cash.Event( src, props );
    }
  
    const srcEvent  = (src && src.type && src instanceof Event
                        ? src
                        : new CustomEvent( src ));
  
    // Mirror all properties of the source event
    for (let key in srcEvent) {
      if (props && key in props ||
          (key === 'target' || key === 'currentTarget')) {
        // Properties that need to be modifiable (and thus not directly mirrored)
        this[key] = srcEvent[key];
  
      } else {
        // Actually reference the source event
        _makeGetSetProperty( this, srcEvent, key );
      }
    }
  
    this.originalEvent = srcEvent;
  
    // The target should NOT be a text node
    if (srcEvent.target && srcEvent.target.nodeType === 3) {
      this.target = srcEvent.target.parentNode;
    }
  
    // Include explicitly provided properties
    if ( props ) {
      cash.extend( this, props );
    }
  
    // Include a jQuery-like isDefaultPrevented()'
    this.isDefaultPrevented = (srcEvent.defaultPrevented ||
                               (srcEvent.defaultPrevented === undefined &&
                                srcEvent.returnValue === false)
                                ? _returnTrue
                                : _returnFalse);
  
    // Create a timestamp if the incoming event doesn't have one
    if (this.timeStamp == null) { this.timeStamp = Date.now(); }
  
  
    // Mark this event as "fixed"
    this[ cash.uid ] = true;
  };
  
  cash.fn.extend({
  
    off(eventName, callback) {
      return this.each(el => _removeEvent(el, eventName, callback) );
    },
  
    on(eventName, delegate, callback, runOnce) { // jshint ignore:line
  
      if ( !cash.isString(eventName) ) {
        for (let key in eventName) {
          this.on(key,delegate,eventName[key]);
        }
        return this;
      }
  
      if ( cash.isFunction(delegate) ) {
        callback = delegate;
        delegate = null;
      }
  
      if ( eventName === 'ready' ) {
        cash.onReady(callback);
        return this;
      }
  
      if ( !cash.isFunction(callback) && delegate === false ) {
        // Handle on('event', false) to squelch an event
        callback = _returnFalse;
  
      } else if ( delegate ) {
        const originalCallback  = callback;
        callback = function( evt ) {
          let target = evt.target;
  
          while (!cash.matches(target, delegate)) {
            if (target === this) {
              return (target = false);
            }
            target = target.parentNode;
          }
  
          if (target) {
            // Make a writable Event adjusted for delegation
            const newEvent = cash.Event( evt, {
              delegateTarget : evt.currentTarget,
              currentTarget  : target,
            });
  
            originalCallback.call(target, newEvent);
          }
        };
      }
  
      return this.each(el => {
        let finalCallback = callback;
        if ( runOnce ) {
          finalCallback = function(){
            callback.apply(this,arguments);
            _removeEvent(el, eventName, finalCallback);
          };
        }
        _registerEvent(el, eventName, finalCallback);
      });
    },
  
    one(eventName, delegate, callback) {
      return this.on(eventName, delegate, callback, true);
    },
  
    trigger(eventName, data) {
      const evt = doc.createEvent('HTMLEvents');
  
      evt.data = data;
      evt.initEvent(eventName, true, false);
  
      return this.each(el => el.dispatchEvent(evt));
    },
  
    focus() {
      //return this;
      return this.each( el => el.focus() );
    },
  
    blur() {
      //return this;
      return this.each( el => el.blur() );
    }
  
  });
  
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
        return (cash.isString(el.value) ? el.value : null);
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
  
  /* jshint laxbreak: true */
  function _insertElement(el, child, prepend){
    if ( prepend ) {
      const first = el.childNodes[0];
      el.insertBefore( child, first );
  
    } else {
      el.appendChild(child);
    }
  }
  
  function _insertContent(parent, child, prepend){
    const str = cash.isString(child);
  
    if ( !str && child.length ) {
      cash.each(child, el => _insertContent(parent, el, prepend) );
      return;
    }
  
    cash.each(parent,
      (str
        ? el        => el.insertAdjacentHTML( (prepend
                                                ? 'afterbegin'
                                                : 'beforeend'), child)
        : (el,idex) => _insertElement( el,
                                       ( (idex === 0
                                                ? child
                                                : child.cloneNode(true) ) ),
                                       prepend )
      )
    );
  }
  
  cash.fn.extend({
  
    after(selector) {
      cash(selector).insertAfter(this);
      return this;
    },
  
    append(content) {
      _insertContent(this,content);
      return this;
    },
  
    appendTo(parent) {
      _insertContent(cash(parent),this);
      return this;
    },
  
    before(selector) {
      cash(selector).insertBefore(this);
      return this;
    },
  
    clone() {
      return cash(this.map(el => { return el.cloneNode(true); }));
    },
  
    empty() {
      this.html('');
      return this;
    },
  
    html(content) {
      if ( content === undefined ) { return this[0].innerHTML; }
      const source = ( content.nodeType ? content[0].outerHTML : content );
      return this.each(el => el.innerHTML = source);
    },
  
    insertAfter(selector) {
  
      cash(selector).each( (el, idex) => {
        const parent  = el.parentNode;
        const sibling = el.nextSibling;
        this.each(el => {
          parent.insertBefore( ( idex === 0
                                  ? el
                                  : el.cloneNode(true) ), sibling );
        });
      });
  
      return this;
    },
  
    insertBefore(selector) {
      cash(selector).each( (beforeEl, idex) => {
        const parent = beforeEl.parentNode;
        this.each(el => {
          parent.insertBefore( ( idex === 0
                                  ? el
                                  : el.cloneNode(true) ), beforeEl );
        });
      });
      return this;
    },
  
    prepend(content) {
      _insertContent(this,content,true);
      return this;
    },
  
    prependTo(parent) {
      _insertContent(cash(parent),this,true);
      return this;
    },
  
    remove() {
      return this.each(el => el.parentNode.removeChild(el));
    },
  
    text(content) {
      if ( content === undefined ) { return this[0].textContent; }
      return this.each(el => el.textContent = content);
    }
  
  });
  
  const docEl = doc.documentElement;
  
  cash.fn.extend({
  
    position(){
      const el = this[0];
      return {
        left: el.offsetLeft,
        top : el.offsetTop,
      };
    },
  
    offset(){
      const rect = this[0].getBoundingClientRect();
      return {
        top : rect.top  + win.pageYOffset - docEl.clientTop,
        left: rect.left + win.pageXOffset - docEl.clientLeft,
      };
    },
  
    offsetParent(){ return cash(this[0].offsetParent); }
  
  });
  

  /* jshint laxbreak: true, bitwise:false, maxstatements:23, maxcomplexity:13 */
  function _disabledMatcher( elem ) {
    return elem.disabled === true && ('form' in elem || 'label' in elem);
  }
  
  let   _done       = 0;
  function _disabledAncestor( elem, context, xml ) {
    const key       = 'legend';     // combinator.next
    const doneName  = _done++;
    const dirruns   = 0;
  
    const  newCache = [ dirruns, doneName ];
    let    oldCache;
    let    uniqueCache;
    let    outerCache;
  
    // We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
    if ( xml ) {
      while ( (elem = elem.parentNode) ) {
        if ( elem.nodeType === 1) {
          if ( _disabledMatcher( elem, context, xml ) ) {
            return true;
          }
        }
      }
    } else {
      while ( (elem = elem.parentNode) ) {
        if ( elem.nodeType === 1) {
          outerCache = elem[ cash.uid ] || (elem[ cash.uid ] = {});
  
          // Support: IE <9 only
          // Defend against cloned attroperties (jQuery gh-1709)
          uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});
  
          if ( key === elem.nodeName.toLowerCase() ) {
            elem = elem.parentNode || elem;
          } else if ( (oldCache = uniqueCache[ key ]) &&
            oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {
  
            // Assign to newCache so results back-propagate to previous elements
            return (newCache[ 2 ] = oldCache[ 2 ]);
          } else {
            // Reuse newcache so results back-propagate to previous elements
            uniqueCache[ key ] = newCache;
  
            // A match means we're done; a fail means we have to keep checking
            if ( (newCache[ 2 ] = _disabledMatcher( elem, context, xml )) ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
  
  /**
   * Handle both :enabled/:disabled pseudos
   * @param elem      The target element
   * @param disabled  true for :disabled; false for :enabled {Boolean};
   */
  function _checkDisabled( elem, disabled ) {
  
    // Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
  
    // Only certain elements can match :enabled or :disabled
    // https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
    // https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
    if ( 'form' in elem ) {
  
      // Check for inherited disabledness on relevant non-disabled elements:
      // * listed form-associated elements in a disabled fieldset
      //   https://html.spec.whatwg.org/multipage/forms.html#category-listed
      //   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
      // * option elements in a disabled optgroup
      //   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
      // All such elements have a 'form' property.
      if ( elem.parentNode && elem.disabled === false ) {
  
        // Option elements defer to a parent optgroup if present
        if ( 'label' in elem ) {
          if ( 'label' in elem.parentNode ) {
            return elem.parentNode.disabled === disabled;
          } else {
            return elem.disabled === disabled;
          }
        }
  
        // Support: IE 6 - 11
        // Use the isDisabled shortcut property to check for disabled fieldset ancestors
        return elem.isDisabled === disabled ||
  
          // Where there is no isDisabled, check manually
          /* jshint -W018 */
          elem.isDisabled !== !disabled &&
            _disabledAncestor( elem ) === disabled;
      }
  
      return elem.disabled === disabled;
  
    } else if ( 'label' in elem ) {
      // Try to winnow out elements that can't be disabled before trusting the
      // disabled property.
      //
      // Some victims get caught in our net (label, legend, menu, track), but
      // it shouldn't even exist on them, let alone have a boolean value.
      return elem.disabled === disabled;
    }
  
    // Remaining elements are neither :enabled nor :disabled
    return false;
  }
  
  cash._pseudos = {
    focus   : (el) => {
      return (el === document.activeElement &&
              (!document.hasFocus || document.hasFocus()) &&
              !!(el.type || el.href || ~(el.tabIndex) ));
    },
    enabled : (el) => { return _checkDisabled( el, false ); },
    disabled: (el) => { return _checkDisabled( el, true ); },
    checked : (el) => {
      // In CSS3, :checked should return both checked and selected elements
      // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
      const nodeName  = el.nodeName;
      return (nodeName === 'INPUT'  && !!el.checked) ||
             (nodeName === 'OPTION' && !!el.selected);
    },
    selected: (el) => {
      return (el.selected === true);
    },
    empty   : (el) => {
      // http://www.w3.org/TR/selectors/#empty-pseudo
      // :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
      //   but not by others (comment: 8; processing instruction: 7; etc.)
      // nodeType < 6 works because attributes (2) do not appear as children
      for ( el = el.firstChild; el; el = el.nextSibling ) {
        if ( el.nodeType < 6 ) {
          return false;
        }
      }
      return true;
    },
    input   : (el) => {
      return ['INPUT','SELECT','TEXTAREA','BUTTON']
                .includes( el.nodeName );
    },
    button  : (el) => {
      const name = el.nodeName;
      return (name === 'INPUT' && el.type === 'button' ||
              name === 'BUTTON');
    },
  };
  

  /* jshint laxbreak: true */
  cash.fn.extend({
  
    children(selector) {
      let elems = [];
      this.each(el => { elems.push.apply(elems, el.children); });
      elems = cash.unique(elems);
  
      return (
        !selector
          ? elems
          : elems.filter(el => {
              return cash.matches(el, selector);
            })
      );
    },
  
    closest(selector) {
      if ( !selector || this.length < 1 ) { return cash(); }
      if ( this.is(selector) ) { return this.filter(selector); }
      return this.parent().closest(selector);
    },
  
    is(selector) {
      if ( !selector ) { return false; }
  
      let comparator  = cash.selectComparator(selector);
  
      if (cash._pseudos && selector[0] === ':') {
        const pseudoFn  = cash._pseudos[ selector.slice(1) ];
        if (! cash.isFunction(pseudoFn)) {
          console.error('unsupported pseudo: '+ selector);
  
        } else {
          comparator = pseudoFn;
  
        }
      }
  
      let match = false;
      this.each(el => {
        match = comparator( el,selector );
        return !match;
      });
  
      return match;
    },
  
    find(selector) {
      if ( !selector || selector.nodeType ) {
        return cash( selector && this.has(selector).length ? selector : null );
      }
  
      let elems = [];
      if (cash._pseudos && selector[0] === ':') {
        const pseudoFn  = cash._pseudos[ selector.slice(1) ];
        if (! cash.isFunction(pseudoFn)) {
          console.error('unsupported pseudo: '+ selector);
  
        } else {
          elems = this.filter(el => pseudoFn( el ));
  
        }
  
      } else {
  
        this.each(el => {
          elems.push.apply( elems, cash.find(selector, el) );
        } );
      }
  
      return cash.unique(elems);
    },
  
    has(selector) {
  
      const comparator = (
        cash.isString(selector)
          ? el => { return cash.find(selector,el).length !== 0; }
          : el => { return el.contains(selector); }
      );
  
      return this.filter(comparator);
    },
  
    next() {
      return cash(this[0].nextElementSibling);
    },
  
    not(selector) {
      if ( !selector ) { return this; }
  
      const comparator = cash.selectComparator(selector);
  
      return this.filter(el => !comparator(el, selector));
    },
  
    parent() {
      const result = [];
  
      this.each(item => {
        if (item && item.parentNode) { result.push(item.parentNode); }
      });
  
      return cash.unique(result);
    },
  
    parents(selector) {
      const result = [];
      let   last;
  
      this.each(item => {
        last = item;
  
        while ( last && last.parentNode && last !== doc.body.parentNode ) {
          last = last.parentNode;
  
          if (!selector || (selector && cash.matches(last, selector))) {
            result.push(last);
          }
        }
      });
  
      return cash.unique(result);
    },
  
    prev() {
      return cash(this[0].previousElementSibling);
    },
  
    siblings() {
      const collection  = this.parent().children();
      const thisEl      = this[0];
  
      return collection.filter(el => el !== thisEl);
    }
  
  });
  

  /**
   *  Converted to ES6 for Electron from the excellent work by
   *    shshaw        : https://github.com/shshaw
   *    Tommie Hansen : https://github.com/tommiehansen
   *
   *****************************************************************************
   *
   * @todo: Convert % to px
   * @todo: Ensure compatibility between Element.animate & requestAnimationFrame
   *        version
   * @todo: Compatibility in ease functions & Element.animate
   * @todo: transform: rotate compatibility. Element.animate seems to rotate the
   *        quickest possible way, not the correct way.
   * @todo: support 'fill' property
   */
  /* jshint laxbreak:true, maxparams:6, eqnull:true, latedef:false */
  const _requestAnimationFrame = win.requestAnimationFrame ||
                                 win.webkitRequestAnimationFrame;
  
  /** Group all `requestAnimationFrame` calls into one for better performance. */
  const _animations = [];
  
  function __error( err, context, opts ) {
    console.warn('cash.animate:', err);
    if (cash.isFunction(opts.complete)) {
      opts.complete.call( context, context, {error: err} );
    }
  }
  
  /** One requestAnimationFrame function */
  function _animate(){
  
    let idex  = _animations.length;
    let el;
    let index;
  
    if ( !_animations.playing || idex === 0  ) {
      _animations.playing = false;
      _animations.frame   = null;
      return;
    }
  
    while( idex-- ){
      el = _animations[ idex ];
      if ( el && el() === false ) {
        index = _animations.indexOf(el);
        if ( index > -1 ) { _animations.splice(index, 1); }
      }
    }
  
    _animations.frame = _requestAnimationFrame( _animate );
  }
  
  _animations.play  = function(){
    /* Prevent calling `requestAnimationFrame` twice if a frame is already
     * requested.
     */
    _animations.frame   = _animations.frame ||
                          _requestAnimationFrame( _animate );
    _animations.playing = true;
  };
  cash.animations = _animations;
  
  ////////////////////////////////////////
  
  
  
  /**
   * Easing delta functions thanks to Nikolay Nemshilov
   * See https://st-on-it.blogspot.com/2011/05/calculating-cubic-bezier-function.html
   */
  const _cubicRe  = /cubic-bezier\(([\d\.]+),\s+?([\d\.]+),\s+?([\d\.]+),\s+?([\d\.]+)\)/i;
  let   _easings  = {
        'linear': function(t){ return t; },
      };
  
  function _bezier( p1, p2, p3, p4) {
  
    if ( arguments.length === 1 ) {
      if ( _easings[p1] ) { return _easings[p1]; }
  
      const cubicParsed = _cubicRe.exec(p1);
      return (_easings[p1] = ( cubicParsed
                                ? _bezier.apply(null, cubicParsed.slice(1,5) )
                                : null ));
    }
  
    // defining the bezier functions in the polynomial form
    let Cx = 3 * p1;
    let Bx = 3 * (p3 - p1) - Cx;
    let Ax = 1 - Cx - Bx;
  
    let Cy = 3 * p2;
    let By = 3 * (p4 - p2) - Cy;
    let Ay = 1 - Cy - By;
  
    function __bezierX(t) { return t * (Cx + t * (Bx + t * Ax)); }
    function __bezierY(t) { return t * (Cy + t * (By + t * Ay)); }
    // using Newton's method to aproximate the parametric value of x for t
    function _bezierXder(t) { return Cx + t * (2*Bx + 3*Ax * t); }
  
    function __findXfor(t) {
      let x = t;
      let i = 0;
      let z;
  
      while (i < 3) { // making 3 iterations max
        z = __bezierX(x) - t;
        if (Math.abs(z) < 1e-3) { break; }  // if already close enough
        x = x - z / _bezierXder(x);
        i++;
      }
  
      return x;
    }
  
    return function(t){ return __bezierY(__findXfor(t)); };
  }
  
  cash.extend(_easings, {
    'ease':        _bezier(0.25, 0.1, 0.25, 1.0),
    'ease-in':     _bezier(0.42, 0.0, 1.00, 1.0),
    'ease-out':    _bezier(0.00, 0.0, 0.58, 1.0),
    'ease-in-out': _bezier(0.42, 0.0, 0.58, 1.0)
  });
  cash.easings = _easings;
  
  
  ////////////////////////////////////////
  
  
  /** Build transform conversion functions with defaults values */
  
  const _transformProp  = cash.prefixedProp('transform');
  const _transforms     = {};
  
  function _makeTransformFn(name, defaultValue){
    return function(value, onlyValue) {
      value = ( value || value === 0 ? value : defaultValue );
      return ( onlyValue ? value : ' '+name+'('+value+')' );
    };
  }
  
  cash.each('rotate rotateX rotateY rotateZ skew skewX skewY'.split(' '),
            function( val ) {
              _transforms[val] = _makeTransformFn(val, '0deg');
            });
  
  cash.each('x y z'.split(' '), function( val ) {
    const fullName  = 'translate'+ val.toUpperCase();
    _transforms[fullName] = _transforms[val] = _makeTransformFn(fullName, 0);
  });
  
  cash.each('scale scaleX scaleY scaleZ'.split(' '), function( val ) {
    _transforms[val] = _makeTransformFn(val, 1);
  });
  
  
  ////////////////////////////////////////
  
  function _buildStyles(obj, end ) {
    const props = {
      // Set start & end as empty objects to be filled
      start: {},
      end  : {},
    };
  
    /** If it's an element, we have to get the current styles */
    const start = win.getComputedStyle(obj);
  
    // Use the existing transform style for the start.
    props.start[_transformProp] = start[_transformProp] || 'none';
    props.end[_transformProp]   = '';
  
    for (let key in end){
  
      let endValue  = end[key];
  
      if ( _transforms[key] ) {
  
        /** Since we're using Element.animate, flatten the transforms object to a
         * single transform string.
         */
        props.end[_transformProp] += _transforms[key](endValue);
  
      } else {
  
        /** Convert to vendor prefixed, camelCase property name */
        const propName    = cash.prefixedProp(key);
        let   startValue  = start[propName];
  
        props.start[propName] = startValue;
        props.end[propName]   = endValue;
  
      }
  
    }
    if (! props.end[_transformProp]) {
      props.end[_transformProp] = 'none';
    }
  
    return props;
  }
  
  ////////////////////////////////////////
  
  const _defaultOpts  = {
    iterations    : 1,
    duration      : 400,
    easing        : 'linear',
  
    delay         : 0,
    stagger       : 0,
  
    reversed      : false,
    direction     : 'normal',
    fill          : 'both',
  
    start         : cash.noop, // animation start
    complete      : cash.noop, // animation complete
  
    itemStart     : cash.noop, // an item's animation has started
    itemProgress  : cash.noop, /* an item's values have changed
                                * (currently only for requestAnimationFrame
                                *  animations)
                                */
  
    itemComplete  : cash.noop, // an item's animation has completed
  
    frameStart    : cash.noop, // a new keyframe has started
    frameComplete : cash.noop, // a keyframe has been completed
  };
  
  function _renderViaElementAnimate( opts ) {
    const frameOpts   = opts.frameOpts;
    const stagger     = frameOpts.stagger *  opts.idex;
    const direction   = frameOpts.direction;
    const iterations  = frameOpts.iterations;
    const localOpts   = cash.extend({}, frameOpts, {
                          delay : frameOpts.delay + stagger,
                        });
  
    /** Prevent issues with `fill: both` preventing animations of
     *  transforms from working
     */
    const endState  = ( (direction === 'alternate' && iterations % 2 ) ||
                        (direction === 'normal')
                          ? opts.endValues
                          : null );
  
    // Use Element.animate to tween the properties.
    const render  = opts.obj.animate( [opts.startValues, opts.endValues],
                                      localOpts );
  
    render.addEventListener('finish', function(){
  
      if ( endState ) {
        /** Apply the end state styles */
        for (let key in endState){
          opts.target[key] = endState[key];
        }
      }
      opts.onFinished( opts.obj, opts.idex );
  
    });
  
    return render;
  }
  
  function Animator( objects, keyframes, opts ) {
  
    objects   = objects.length   ? objects   : [objects];
    keyframes = keyframes.length ? keyframes : [keyframes];
    opts      = cash.extend({}, _defaultOpts, opts);
  
    const totalFrames         = keyframes.length;
    let   animationsRemaining = objects.length;
    let   currentFrame        = 0;
  
    opts.start.call( objects, objects );
  
    try {
      __runKeyframe( keyframes[currentFrame] );
    } catch(ex) {
      __error( ex, objects, opts );
    }
  
  
    /**********************************************************************
     * Context bound animation helpers {
     *
     */
    function __runKeyframe( keyframe ) {
  
      let frameOpts = opts;
      if ( keyframe.length ) {
        frameOpts = cash.extend({}, opts, keyframe[1]);
        keyframe  = keyframe[0];
      }
  
      frameOpts.frameStart.call(objects,objects);
  
      cash.each(objects, function(obj, idex) {
  
        const isElement       = obj.nodeType;
  
        /** Object to apply the animation to. If element, use the style,
         *  otherwise apply it to the target itself.
         */
        const target          = (isElement ? obj.style : obj);
  
        /** Properties to animate */
        let   props           = {};
        let   startValues     = {};
        let   endValues       = {};
  
        if ( isElement ) {
  
          props       = _buildStyles(obj, keyframe);
          startValues = props.start;
          endValues   = props.end;
  
        } else {
          /** If we're dealing with a plain object, just set the start & end
           *  values
           */
          for (let key in keyframe) {
            startValues[key] = target[key];
            endValues[key]   = keyframe[key];
          }
        }
  
        frameOpts.itemStart.call(obj,obj, idex);
  
        // Use element.animate
        return _renderViaElementAnimate( {
          target      : target,
          obj         : obj,
          idex        : idex,
          frameOpts   :  frameOpts,
          startValues : startValues,
          endValues   : endValues,
          onFinished  : __finished,
        });
      });
    }
  
    function __finished( obj,  idex ) {
  
      opts.itemComplete.call( obj, obj, idex );
  
      animationsRemaining--;
      if ( !animationsRemaining ) {
        opts.frameComplete.call( objects, objects );
  
        currentFrame++;
        if ( currentFrame < totalFrames ) {
          animationsRemaining = objects.length;
          __runKeyframe( keyframes[currentFrame] );
        } else {
          opts.complete.call( objects, objects );
        }
      }
    }
    /* Context bound animation helpers }
     **********************************************************************/
  }
  
  cash.animate = function( obj, end, opts ) {
    if (! obj || ! obj.length) {
      return __error( 'empty collection', obj, opts );
    }
  
    return new Animator( obj, end, opts );
  };
  
  cash.fn.animate = function( end, opts ) {
    if (! this.length) {
      return __error( 'empty collection', this, opts );
    }
  
    return new Animator( this, end, opts );
  };
  
  /***************************************************************
   * jQuery Animations {
   *
   */
  
  const DURATION_DEFAULT  = 400;
  
  /**
   *  Given optional 'duration' and 'complete' parameters, generate an options
   *  object with proper values.
   *  @method __createOpts
   *  @param  [duration]    The duration {String | Number};
   *  @param  [completion]  A callback to invoke upon completion of the animation
   *                        {Function};
   *
   *  `duration` may be a time in ms or one of the following strings:
   *    'fast'    : 100ms
   *    'normal'  : 400ms
   *    'slow'    : 800ms
   *
   *  @return A new animation options object {Object};
   *  @private
   */
  function __createOpts( duration, complete ) {
    const opts  = {
      duration: duration,
      complete: complete,
    };
    if (cash.isFunction(duration)) {
      opts.duration = DURATION_DEFAULT;
      opts.complete = duration;
  
    } else if (cash.isString(duration)) {
      switch(duration.toLowerCase()) {
      case 'fast':    opts.duration = 100;              break;
      case 'normal':  opts.duration = DURATION_DEFAULT; break;
      case 'slow':    opts.duration = 800;              break;
      default:
          // Remove any 'ms' suffix and default to 1.
          opts.duration = parseFloat( duration ) || 1;
          break;
      }
    }
    return opts;
  }
  
  /**
   *  SlideUp/Down
   *  @method __slide
   *  @param  direction     The slide direction (Up | Down) {String};
   *  @param  [duration]    The duration {String | Number};
   *  @param  [completion]  A callback to invoke upon completion of the animation
   *                        {Function};
   *
   *  @return The animation;
   *  @private
   */
  function __slide( direction, duration, complete ) {
    const opts      = __createOpts( duration, complete );
    const cStart    = opts.start;
    const cComplete = opts.complete;
    const inline    = {   // maintain explicit inline styles
      /* ensure that 'height', 'overflow' and 'transform' are removed on
       * animation completion if not explicitly set in an inline style
       */
      height    : null,
      overflow  : null,
      transform : null,
    };
    const end       = {}; // ending state
  
    opts.start = function( $el ) {
      if (cStart) { cStart.call( $el, $el ); }
  
      /* Establish the target 'end' state.
       *
       * But first, extract any inline styles, excluding 'display'
       */
      cash.extend( inline, cash.parseStyle( $el.attr('style') ) );
      delete inline.display; // exclude 'display' from the state
  
      if (direction === 'Down') {
        /* 'slideDown'
         *
         * Recover any end-state hints provided by 'slideUp'
         */
        const hints = $el.data('slideDown');
        if (hints) {
          $el.removeData('slideDown');
          cash.extend( end, hints );
        }
  
        if (! end.height) {
          /* No idea how tall this element should be so move the element
           * off-screen to get measurements so we can establish the
           * target end-state for 'height'.
           *
           * Since we're effecting 'display', remember the starting value.
           */
          const display = $el.css('display');
          if (display && display !== 'none') {
            end.display = display;
          }
  
          $el.css( {
            position: 'absolute',
            top     : '-99999px',
            left    : '-99999px',
            display : 'block',
          });
          end.height = $el.css('height');
        }
  
        /* Establish the initial starting state, possibly moving the element back
         * on-screen.
         */
        $el.css( {
          position: inline.position || null,
          top     : inline.top      || null,
          left    : inline.left     || null,
          display : (end.display === 'inline' ? 'inline-block' : 'block'),
          height  : 0,
          overflow: 'hidden',
        });
  
      } else {
        /* 'slideUp'
         *
         * Retrieve the current 'display' and 'height' to pass as hints to
         * 'slideDown'.
         */
        const hints = {
          display : $el.css('display'),
          height  : $el.css('height'),
        };
  
        // Establish the target end-state
        end.display = 'none';
        end.height  = 0;
  
        // Immediately change overflow
        $el.css('overflow', 'hidden');
  
        // Pass the collected hints to 'slideDown'
        $el.data('slideDown', hints);
      }
    };
  
    opts.complete = function( $el, err ) {
      // Resetting the element's inline styles to their pre-animation values.
      $el.css( inline );
  
      if (cComplete)  { cComplete.call( $el, $el, err ); }
    };
  
    return this.animate( end, opts );
  }
  
  /**
   *  FadeIn/To/Out
   *  @method __fade
   *  @param  opacity       The target opacity {Number};
   *  @param  [duration]    The duration {String | Number};
   *  @param  [completion]  A callback to invoke upon completion of the animation
   *                        {Function};
   *
   *  @return The animation;
   *  @private
   */
  function __fade( opacity, duration, complete ) {
    const opts      = __createOpts( duration, complete );
    const cStart    = opts.start;
    const cComplete = opts.complete;
    const inline    = {   // maintain explicit inline styles
      /* ensure that 'transform' is removed on animation completion if not
       * explicitly set in an inline style
       */
      transform : null,
    };
    const end       = { opacity: opacity };
  
    opts.start = function( $el ) {
      if (cStart) { cStart.call( $el, $el ); }
  
      /* Establish the target 'end' state.
       *
       * But first, extract any inline styles, excluding 'opacity'
       */
      cash.extend( inline, cash.parseStyle( $el.attr('style') ) );
      delete inline.opacity;
    };
  
    opts.complete = function( $el, err ) {
      // Resetting the element's inline styles to their pre-animation values.
      $el.css( inline );
  
      if (cComplete)  { cComplete.call( $el, $el, err ); }
    };
  
    return this.animate( end, opts );
  }
  
  cash.fn.extend({
    show(duration, complete) {
      if (duration == null && complete == null) {
        // Simple display change
        return this.css('display', null);
      }
  
      // AKA fadeIn()
      return __fade.call( this, 1, duration, complete );
    },
    hide(duration, complete) {
      if (duration == null && complete == null) {
        // Simple display change
        return this.css('display', 'none');
      }
  
      // AKA fadeOut()
      return __fade.call( this, 0, duration, complete );
    },
  
    fadeIn(duration, complete) {
      return __fade.call( this, 1, duration, complete );
    },
    fadeOut(duration, complete) {
      return __fade.call( this, 0, duration, complete );
    },
    fadeTo(duration, opacity, complete) {
      return __fade.call( this, opacity, duration, complete );
    },
  
    slideUp(duration, complete) {
      return __slide.call( this, 'Up', duration, complete );
    },
    slideDown(duration, complete) {
      return __slide.call( this, 'Down', duration, complete );
    }
  });
  
  /* jQuery Animations }
   ***************************************************************/
  
  /* jshint laxbreak:true, latedef:false */
  /* globals Buffer */
  const _extend = cash.extend;
  
  /**
   *  Identify objects that require special attention.
   *  @method _isSpecial
   *  @param  obj   The object in question {Object};
   *
   *  @return true | false
   */
  function _isSpecial( obj ) {
    return (
      obj instanceof Date       ||
      obj instanceof RegExp     ||
      (typeof(Buffer) !== 'undefined' && obj instanceof Buffer)
        ? true
        : false );
  }
  
  /**
   *  Clone an object that require special attention.
   *  @method _cloneSpecial
   *  @param  obj   The special object to clone {Object};
   *
   *  @return A deep clone of `obj` {Mixed};
   */
  function _cloneSpecial( obj ) {
    let clone = obj;
  
    if (obj instanceof Date) {
      clone = new Date( obj.getTime() );
  
    } else if (obj instanceof RegExp) {
      clone = new RegExp( obj );
  
    } else if (typeof(Buffer) !== 'undefined' && obj instanceof Buffer) {
      clone = new Buffer( obj.length );
      obj.copy( clone );
  
    } else {
      console.warn('$._cloneSpecial(): Unexpected object');
      clone = Object.assign( {}, obj );
    }
  
    return clone;
  }
  
  /**
   *  Recursively clone an array.
   *  @method _cloneArray
   *  @param  ar    The target array {Array};
   *
   *  @return A deep clone of `ar` {Array};
   */
  function _cloneArray( ar ) {
    return ar.map( val => {
      let res = val;
  
      if (val !== null && typeof(val) === 'object') {
        if (Array.isArray(val)) {
          res = _cloneArray( val );
  
        } else if (_isSpecial(val)) {
          res = _cloneSpecial( val );
  
        } else {
          res = _cloneDeep({}, val);
        }
      }
  
      return res;
    });
  }
  
  /**
   *  Perform a jQuery-like deep extend.
   *  @method _cloneDeep
   *  @param  target    The target of the extend {Object};
   *  @param  ...       Objects with which to extend `target` {Mixed};
   *
   *  @return `this` for a fluent interface {cash};
   */
  function _cloneDeep( target, ...args ) {
    const clone = target || {};
  
    args.forEach( arg => {
      if (arg === null || typeof(arg) !== 'object' || Array.isArray(arg)) {
        // Skip if this is null, an array, or not an object
        return;
      }
  
      Object.keys(arg).forEach( key => {
        const src = target[key];  // source value
        const val = arg[key];     // new value
  
        if (val === target) {
          // Abort infinite recursion
          return;
        }
  
        /* If the new value isn't an object, then just overwrite by the new
         * value.
         */
        if (val === null || typeof(val) !== 'object') {
          clone[key] = val;
          return;
        }
  
        // Recursively clone arrays.
        if (Array.isArray(val)) {
          clone[key] = _cloneArray( val );
          return;
        }
  
        // Custom cloning and overwrites for specific objects
        if (_isSpecial( val )) {
          clone[key] = _cloneSpecial( val );
          return;
        }
  
        // If the source isn't an object or array, simply overwrite
        if (src === null || typeof(src) !== 'object' || Array.isArray(src)) {
          clone[key] = _cloneDeep( {}, val );
          return;
        }
  
        // Source and new values are both objects.
        clone[key] = _cloneDeep( src, val );
      });
    });
  
    return clone;
  }
  
  // Upgrade extend to allow deep extend if first argument is true.
  cash.extend = cash.fn.extend = function(target) {
    if (target === true && arguments.length > 1) {
      // deep extend : extend(true, target, ...)
      return _cloneDeep.apply( this, slice.call( arguments, 1 ) );
    }
  
    return _extend.apply( this, arguments );
  };
  
  /* jshint laxbreak: true */
  
  // Create scrollLeft and scrollTop methods
  cash.each({scrollLeft:'pageXOffset',scrollTop:'pageYOffset'}, (method,prop)=> {
    const top   = (prop === 'pageYOffset');
  
    cash.fn[ method ] = function( val ) {
      this.each( function() {
        let elWin;
        if (cash.isWindow(this)) {
          elWin = this;
  
        } else if (this.nodeType === 9) {
          elWin = this.defaultView;
        }
  
        if (val === undefined) {
          return (elWin ? elWin[ prop ] : this[ method ]);
        }
  
        if (elWin) {
          elWin.scrollTo(
            (!top ? val : elWin.pageXOffset),
            ( top ? val : elWin.pageYOffset)
          );
  
        } else {
          this[ method ] = val;
  
        }
      });
  
      return this;
    };
  
  });
  

  return cash;
});

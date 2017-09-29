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
  const _isFunction = function(item) {
          // @see https://crbug.com/568448
          return typeof item === typeof _noop && item.call;
        };
  const _isString   = function(item) { return typeof item === typeof ''; };
  
  const _idRe       = /^#[\w-]*$/;
  const _classRe    = /^\.[\w-]*$/;
  const _htmlRe     =  /<.+>/;
  const _singletRe  = /^\w+$/;
  
  function _find(selector,context) {
    context = context || doc;
    const elems = (
          _classRe.test(selector) ?
            context.getElementsByClassName(selector.slice(1)) :
            _singletRe.test(selector) ?
              context.getElementsByTagName(selector) :
              context.querySelectorAll(selector)
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
  
  Object.defineProperties( cash, {
    fn          : { value: cash.prototype },
    parseHTML   : { value: _parseHTML },
    noop        : { value: _noop },
    isFunction  : { value: _isFunction },
    isString    : { value: _isString },
    find        : { value: _find },
  });
  
  Init.prototype = cash.prototype;
  
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
  
  /* jshint laxbreak: true */
  const uid = cash.uid = '_cash'+Date.now();
  
  function _getDataCache(node) {
    return (node[uid] = node[uid] || {});
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
    }
  
  });
  
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
              cash.each( (classes,cls) => { _addClass(el,cls,spacedName); });
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
      const child       = elem ? cash(elem)[0] : this[0];
      const collection  = elem ? this : cash(child).parent().children();
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
  
  cash.prefixedProp = _getPrefixedProp;
  cash.camelCase    = _camelCase;
  
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
  
  function _registerEvent(node, eventName, callback) {
    const eventCache  = getData(node,'_cashEvents') ||
                        setData(node, '_cashEvents', {});
  
    eventCache[eventName] = eventCache[eventName] || [];
    eventCache[eventName].push(callback);
    node.addEventListener(eventName, callback);
  }
  
  function _removeEvent(node, eventName, callback) {
    const events      = getData(node,'_cashEvents');
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
  
      if ( delegate ) {
        let originalCallback  = callback;
        callback = function( evt ) {
          let target = evt.target;
  
          while (!matches(target, delegate)) {
            if (target === this) {
              return (target = false);
            }
            target = target.parentNode;
          }
  
          if (target) {
            originalCallback.call(target, evt);
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
    }
  
  });
  
  function _encode(name,value) {
    return '&' + encodeURIComponent(name) + '=' +
      encodeURIComponent(value).replace(/%20/g, '+');
  }
  
  function _getSelectMultiple_(el) {
    const values = [];
    cash.each(el.options, opt => {
      if (opt.selected) {
        values.push(opt.value);
      }
    });
    return (values.length ? values : null);
  }
  
  function _getSelectSingle_(el) {
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
        return _getSelectSingle_(el);
      case 'select-multiple':
        return _getSelectMultiple_(el);
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
        const parent = el.parentNode;
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
      cash(selector).each((el,idex) => {
        const parent = el.parentNode;
        this.each(el => {
          parent.insertBefore( ( idex === 0
                                  ? el
                                  : el.cloneNode(true) ), el );
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
  
  /* jshint laxbreak: true */
  cash.fn.extend({
  
    children(selector) {
      const elems = cash.unique( this.map( el => el.children ) );
  
      return (
        !selector
          ? elems
          : elems.filter(el => {
              return matches(el, selector);
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
  
      const comparator  = cash.selectComparator(selector);
      let   match       = false;
  
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
  
      const elems = this.map(el => cash.find(selector, el) );
  
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
  
          if (!selector || (selector && matches(last, selector))) {
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
  

  return cash;
});

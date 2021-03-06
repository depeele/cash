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

// CSS properties that MAY be a number
cash.cssNumber    = {
  animationIterationCount : true,
  columnCount             : true,
  fillOpacity             : true,
  flexGrow                : true,
  flexShrink              : true,
  fontWeight              : true,
  lineHeight              : true,
  opacity                 : true,
  order                   : true,
  orphans                 : true,
  widows                  : true,
  zIndex                  : true,
  zoom                    : true,
};

cash.fn.extend({

  css(prop,value){
    if ( cash.isString(prop) ) {
      prop = _getPrefixedProp(prop);

      // If 'value' is a number and does NOT appear in cssNumber, append 'px'
      if (typeof(value) === 'number' && ! cash.cssNumber[prop]) {
        value = value +'px';
      }

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

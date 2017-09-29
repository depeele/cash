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

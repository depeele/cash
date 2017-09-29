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

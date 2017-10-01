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

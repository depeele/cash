/* jshint laxbreak:true, eqnull:true, maxstatements:31 */
const docEl = doc.documentElement;

cash.offset = {
  setOffset( elem, options, index ) {
    const curElem   = cash( elem );
    const position  = curElem.css('position');
    const props     = {};
    let   curPosition;
    let   curLeft;
    let   curCSSTop;
    let   curTop;
    let   curOffset;
    let   curCSSLeft;
    let   calculatePosition;

    // Set position first, in-case top/left are set even on static elem
    if ( position === 'static' ) {
      elem.style.position = 'relative';
    }

    curOffset         = curElem.offset();
    curCSSTop         = curElem.css( 'top' );
    curCSSLeft        = curElem.css( 'left' );
    calculatePosition = ( position === 'absolute' || position === 'fixed' ) &&
                        ( curCSSTop + curCSSLeft ).indexOf( 'auto' ) > -1;

    // Need to be able to calculate position if either
    // top or left is auto and position is either absolute or fixed
    if ( calculatePosition ) {
      curPosition = curElem.position();
      curTop      = curPosition.top;
      curLeft     = curPosition.left;

    } else {
      curTop  = parseFloat( curCSSTop ) || 0;
      curLeft = parseFloat( curCSSLeft ) || 0;
    }

    if ( cash.isFunction( options ) ) {

      /* Use cash.extend here to allow modification of coordinates argument
       * (gh-1848)
       */
      options = options.call( elem, index, cash.extend( {}, curOffset ) );
    }

    if ( options.top != null ) {
      props.top = ( options.top - curOffset.top ) + curTop;
    }
    if ( options.left != null ) {
      props.left = ( options.left - curOffset.left ) + curLeft;
    }

    if ( 'using' in options ) {
      options.using.call( elem, props );

    } else {
      curElem.css( props );
    }
  }
};

cash.fn.extend({

  position(){
    const el = this[0];
    return {
      left: el.offsetLeft,
      top : el.offsetTop,
    };
  },

  offset( options ){
    if ( arguments.length ) {
      // Preserve chaining for setters
      return (options === undefined
                ? this  // :XXX: Should this be 'this.offset()' ???
                : this.each( function(idex) {
                    cash.offset.setOffset( this, options, idex );
                  }) );
    }

    const rect = this[0].getBoundingClientRect();
    return {
      top : rect.top  + win.pageYOffset - docEl.clientTop,
      left: rect.left + win.pageXOffset - docEl.clientLeft,
    };
  },

  offsetParent(){ return cash(this[0].offsetParent); }

});


/* jshint laxbreak: true */

// Create scrollLeft and scrollTop methods
cash.each({scrollLeft:'pageXOffset',scrollTop:'pageYOffset'}, (method,prop)=> {
  const top   = (prop === 'pageYOffset');

  cash.fn[ method ] = function( val ) {
    let res = this;

    this.each( function() {
      let elWin;
      if (cash.isWindow(this)) {
        elWin = this;

      } else if (this.nodeType === 9) {
        elWin = this.defaultView;
      }

      if (val === undefined) {
        res = (elWin ? elWin[ prop ] : this[ method ]);
        return res;
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

    return res;
  };

});

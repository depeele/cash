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

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

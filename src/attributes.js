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

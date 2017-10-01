/* jshint laxbreak: true, eqnull:true */
function _registerEvent(node, eventName, callback) {
  const eventCache  = cash.getData(node,'_cashEvents') ||
                      cash.setData(node, '_cashEvents', {});

  eventCache[eventName] = eventCache[eventName] || [];
  eventCache[eventName].push(callback);

  const baseName    = eventName.split('.').shift();
  node.addEventListener(baseName, callback);
}

function _removeEvent(node, eventName, callback) {
  const events      = cash.getData(node,'_cashEvents');
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

function _returnTrue()  { return true; }
function _returnFalse() { return false; }

function _makeGetSetProperty( obj, target, key ) {
  Object.defineProperty( obj, key, {
    get()     { return target[key]; },
    set(val)  { target[key] = val; },
  });
}

cash.Event = function( src, props ) {
  // Allow instantiation without 'new'
  if ( !(this instanceof cash.Event) ) {
    return new cash.Event( src, props );
  }

  const srcEvent  = (src && src.type && src instanceof Event
                      ? src
                      : new CustomEvent( src ));

  // Mirror all properties of the source event
  for (let key in srcEvent) {
    if (props && key in props ||
        (key === 'target' || key === 'currentTarget')) {
      // Properties that need to be modifiable (and thus not directly mirrored)
      this[key] = srcEvent[key];

    } else {
      // Actually reference the source event
      _makeGetSetProperty( this, srcEvent, key );
    }
  }

  this.originalEvent = srcEvent;

  // The target should NOT be a text node
  if (srcEvent.target && srcEvent.target.nodeType === 3) {
    this.target = srcEvent.target.parentNode;
  }

  // Include explicitly provided properties
  if ( props ) {
    cash.extend( this, props );
  }

  // Include a jQuery-like isDefaultPrevented()'
  this.isDefaultPrevented = (srcEvent.defaultPrevented ||
                             (srcEvent.defaultPrevented === undefined &&
                              srcEvent.returnValue === false)
                              ? _returnTrue
                              : _returnFalse);

  // Create a timestamp if the incoming event doesn't have one
  if (this.timeStamp == null) { this.timeStamp = Date.now(); }


  // Mark this event as "fixed"
  this[ cash.uid ] = true;
};

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

    if ( !cash.isFunction(callback) && delegate === false ) {
      // Handle on('event', false) to squelch an event
      callback = _returnFalse;

    } else if ( delegate ) {
      const originalCallback  = callback;
      callback = function( evt ) {
        let target = evt.target;

        while (!cash.matches(target, delegate)) {
          if (target === this) {
            return (target = false);
          }
          target = target.parentNode;
        }

        if (target) {
          // Make a writable Event adjusted for delegation
          const newEvent = cash.Event( evt, {
            delegateTarget : evt.currentTarget,
            currentTarget  : target,
          });

          originalCallback.call(target, newEvent);
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
  },

  focus() {
    //return this;
    return this.each( el => el.focus() );
  },

  blur() {
    //return this;
    return this.each( el => el.blur() );
  }

});

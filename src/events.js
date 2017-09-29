function _registerEvent(node, eventName, callback) {
  const eventCache  = cash.getData(node,'_cashEvents') ||
                      cash.setData(node, '_cashEvents', {});

  eventCache[eventName] = eventCache[eventName] || [];
  eventCache[eventName].push(callback);
  node.addEventListener(eventName, callback);
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

    if ( delegate ) {
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
          originalCallback.call(target, evt);
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
  }

});

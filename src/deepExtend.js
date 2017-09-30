/* jshint laxbreak:true, latedef:false */
/* globals Buffer */
const _extend = cash.extend;

/**
 *  Identify objects that require special attention.
 *  @method _isSpecial
 *  @param  obj   The object in question {Object};
 *
 *  @return true | false
 */
function _isSpecial( obj ) {
  return (
    obj instanceof Date       ||
    obj instanceof RegExp     ||
    (typeof(Buffer) !== 'undefined' && obj instanceof Buffer)
      ? true
      : false );
}

/**
 *  Clone an object that require special attention.
 *  @method _cloneSpecial
 *  @param  obj   The special object to clone {Object};
 *
 *  @return A deep clone of `obj` {Mixed};
 */
function _cloneSpecial( obj ) {
  let clone = obj;

  if (obj instanceof Date) {
    clone = new Date( obj.getTime() );

  } else if (obj instanceof RegExp) {
    clone = new RegExp( obj );

  } else if (typeof(Buffer) !== 'undefined' && obj instanceof Buffer) {
    clone = new Buffer( obj.length );
    obj.copy( clone );

  } else {
    console.warn('$._cloneSpecial(): Unexpected object');
    clone = Object.assign( {}, obj );
  }

  return clone;
}

/**
 *  Recursively clone an array.
 *  @method _cloneArray
 *  @param  ar    The target array {Array};
 *
 *  @return A deep clone of `ar` {Array};
 */
function _cloneArray( ar ) {
  return ar.map( val => {
    let res = val;

    if (val !== null && typeof(val) === 'object') {
      if (Array.isArray(val)) {
        res = _cloneArray( val );

      } else if (_isSpecial(val)) {
        res = _cloneSpecial( val );

      } else {
        res = _cloneDeep({}, val);
      }
    }

    return res;
  });
}

/**
 *  Perform a jQuery-like deep extend.
 *  @method _cloneDeep
 *  @param  target    The target of the extend {Object};
 *  @param  ...       Objects with which to extend `target` {Mixed};
 *
 *  @return `this` for a fluent interface {cash};
 */
function _cloneDeep( target, ...args ) {
  const clone = target || {};

  args.forEach( arg => {
    if (arg === null || typeof(arg) !== 'object' || Array.isArray(arg)) {
      // Skip if this is null, an array, or not an object
      return;
    }

    Object.keys(arg).forEach( key => {
      const src = target[key];  // source value
      const val = arg[key];     // new value

      if (val === target) {
        // Abort infinite recursion
        return;
      }

      /* If the new value isn't an object, then just overwrite by the new
       * value.
       */
      if (val === null || typeof(val) !== 'object') {
        clone[key] = val;
        return;
      }

      // Recursively clone arrays.
      if (Array.isArray(val)) {
        clone[key] = _cloneArray( val );
        return;
      }

      // Custom cloning and overwrites for specific objects
      if (_isSpecial( val )) {
        clone[key] = _cloneSpecial( val );
        return;
      }

      // If the source isn't an object or array, simply overwrite
      if (src === null || typeof(src) !== 'object' || Array.isArray(src)) {
        clone[key] = _cloneDeep( {}, val );
        return;
      }

      // Source and new values are both objects.
      clone[key] = _cloneDeep( src, val );
    });
  });

  return clone;
}

// Upgrade extend to allow deep extend if first argument is true.
cash.extend = cash.fn.extend = function(target) {
  if (target === true && arguments.length > 1) {
    // deep extend : extend(true, target, ...)
    return _cloneDeep.apply( this, slice.call( arguments, 1 ) );
  }

  return _extend.apply( this, arguments );
};

/**
 *  Converted to ES6 for Electron from the excellent work by
 *    shshaw        : https://github.com/shshaw
 *    Tommie Hansen : https://github.com/tommiehansen
 *
 *****************************************************************************
 *
 * @todo: Convert % to px
 * @todo: Ensure compatibility between Element.animate & requestAnimationFrame
 *        version
 * @todo: Compatibility in ease functions & Element.animate
 * @todo: transform: rotate compatibility. Element.animate seems to rotate the
 *        quickest possible way, not the correct way.
 * @todo: support 'fill' property
 */
/* jshint laxbreak:true, maxparams:6, eqnull:true, latedef:false */
const _requestAnimationFrame = win.requestAnimationFrame ||
                               win.webkitRequestAnimationFrame;

/** Group all `requestAnimationFrame` calls into one for better performance. */
const _animations = [];

function __error( err, context, opts ) {
  console.warn('cash.animate:', err);
  if (cash.isFunction(opts.complete)) {
    opts.complete.call( context, context, {error: err} );
  }
}

/** One requestAnimationFrame function */
function _animate(){

  let idex  = _animations.length;
  let el;
  let index;

  if ( !_animations.playing || idex === 0  ) {
    _animations.playing = false;
    _animations.frame   = null;
    return;
  }

  while( idex-- ){
    el = _animations[ idex ];
    if ( el && el() === false ) {
      index = _animations.indexOf(el);
      if ( index > -1 ) { _animations.splice(index, 1); }
    }
  }

  _animations.frame = _requestAnimationFrame( _animate );
}

_animations.play  = function(){
  /* Prevent calling `requestAnimationFrame` twice if a frame is already
   * requested.
   */
  _animations.frame   = _animations.frame ||
                        _requestAnimationFrame( _animate );
  _animations.playing = true;
};
cash.animations = _animations;

////////////////////////////////////////



/**
 * Easing delta functions thanks to Nikolay Nemshilov
 * See https://st-on-it.blogspot.com/2011/05/calculating-cubic-bezier-function.html
 */
const _cubicRe  = /cubic-bezier\(([\d\.]+),\s+?([\d\.]+),\s+?([\d\.]+),\s+?([\d\.]+)\)/i;
let   _easings  = {
      'linear': function(t){ return t; },
    };

function _bezier( p1, p2, p3, p4) {

  if ( arguments.length === 1 ) {
    if ( _easings[p1] ) { return _easings[p1]; }

    const cubicParsed = _cubicRe.exec(p1);
    return (_easings[p1] = ( cubicParsed
                              ? _bezier.apply(null, cubicParsed.slice(1,5) )
                              : null ));
  }

  // defining the bezier functions in the polynomial form
  let Cx = 3 * p1;
  let Bx = 3 * (p3 - p1) - Cx;
  let Ax = 1 - Cx - Bx;

  let Cy = 3 * p2;
  let By = 3 * (p4 - p2) - Cy;
  let Ay = 1 - Cy - By;

  function __bezierX(t) { return t * (Cx + t * (Bx + t * Ax)); }
  function __bezierY(t) { return t * (Cy + t * (By + t * Ay)); }
  // using Newton's method to aproximate the parametric value of x for t
  function _bezierXder(t) { return Cx + t * (2*Bx + 3*Ax * t); }

  function __findXfor(t) {
    let x = t;
    let i = 0;
    let z;

    while (i < 3) { // making 3 iterations max
      z = __bezierX(x) - t;
      if (Math.abs(z) < 1e-3) { break; }  // if already close enough
      x = x - z / _bezierXder(x);
      i++;
    }

    return x;
  }

  return function(t){ return __bezierY(__findXfor(t)); };
}

cash.extend(_easings, {
  'ease':        _bezier(0.25, 0.1, 0.25, 1.0),
  'ease-in':     _bezier(0.42, 0.0, 1.00, 1.0),
  'ease-out':    _bezier(0.00, 0.0, 0.58, 1.0),
  'ease-in-out': _bezier(0.42, 0.0, 0.58, 1.0)
});
cash.easings = _easings;


////////////////////////////////////////


/** Build transform conversion functions with defaults values */

const _transformProp  = cash.prefixedProp('transform');
const _transforms     = {};

function _makeTransformFn(name, defaultValue){
  return function(value, onlyValue) {
    value = ( value || value === 0 ? value : defaultValue );
    return ( onlyValue ? value : ' '+name+'('+value+')' );
  };
}

cash.each('rotate rotateX rotateY rotateZ skew skewX skewY'.split(' '),
          function( val ) {
            _transforms[val] = _makeTransformFn(val, '0deg');
          });

cash.each('x y z'.split(' '), function( val ) {
  const fullName  = 'translate'+ val.toUpperCase();
  _transforms[fullName] = _transforms[val] = _makeTransformFn(fullName, 0);
});

cash.each('scale scaleX scaleY scaleZ'.split(' '), function( val ) {
  _transforms[val] = _makeTransformFn(val, 1);
});


////////////////////////////////////////

function _buildStyles(obj, end ) {
  const props = {
    // Set start & end as empty objects to be filled
    start: {},
    end  : {},
  };

  /** If it's an element, we have to get the current styles */
  const start = win.getComputedStyle(obj);

  // Use the existing transform style for the start.
  props.start[_transformProp] = start[_transformProp] || 'none';
  props.end[_transformProp]   = '';

  for (let key in end){

    let endValue  = end[key];

    if ( _transforms[key] ) {

      /** Since we're using Element.animate, flatten the transforms object to a
       * single transform string.
       */
      props.end[_transformProp] += _transforms[key](endValue);

    } else {

      /** Convert to vendor prefixed, camelCase property name */
      const propName    = cash.prefixedProp(key);
      let   startValue  = start[propName];

      props.start[propName] = startValue;
      props.end[propName]   = endValue;

    }

  }
  if (! props.end[_transformProp]) {
    props.end[_transformProp] = 'none';
  }

  return props;
}

////////////////////////////////////////

const _defaultOpts  = {
  iterations    : 1,
  duration      : 400,
  easing        : 'linear',

  delay         : 0,
  stagger       : 0,

  reversed      : false,
  direction     : 'normal',
  fill          : 'both',

  start         : cash.noop, // animation start
  complete      : cash.noop, // animation complete

  itemStart     : cash.noop, // an item's animation has started
  itemProgress  : cash.noop, /* an item's values have changed
                              * (currently only for requestAnimationFrame
                              *  animations)
                              */

  itemComplete  : cash.noop, // an item's animation has completed

  frameStart    : cash.noop, // a new keyframe has started
  frameComplete : cash.noop, // a keyframe has been completed
};

function _renderViaElementAnimate( opts ) {
  const frameOpts   = opts.frameOpts;
  const stagger     = frameOpts.stagger *  opts.idex;
  const direction   = frameOpts.direction;
  const iterations  = frameOpts.iterations;
  const localOpts   = cash.extend({}, frameOpts, {
                        delay : frameOpts.delay + stagger,
                      });

  /** Prevent issues with `fill: both` preventing animations of
   *  transforms from working
   */
  const endState  = ( (direction === 'alternate' && iterations % 2 ) ||
                      (direction === 'normal')
                        ? opts.endValues
                        : null );

  // Use Element.animate to tween the properties.
  const render  = opts.obj.animate( [opts.startValues, opts.endValues],
                                    localOpts );

  render.addEventListener('finish', function(){

    if ( endState ) {
      /** Apply the end state styles */
      for (let key in endState){
        opts.target[key] = endState[key];
      }
    }
    opts.onFinished( opts.obj, opts.idex );

  });

  return render;
}

function Animator( objects, keyframes, opts ) {

  objects   = objects.length   ? objects   : [objects];
  keyframes = keyframes.length ? keyframes : [keyframes];
  opts      = cash.extend({}, _defaultOpts, opts);

  const totalFrames         = keyframes.length;
  let   animationsRemaining = objects.length;
  let   currentFrame        = 0;

  opts.start.call( objects, objects );

  try {
    __runKeyframe( keyframes[currentFrame] );
  } catch(ex) {
    __error( ex, objects, opts );
  }


  /**********************************************************************
   * Context bound animation helpers {
   *
   */
  function __runKeyframe( keyframe ) {

    let frameOpts = opts;
    if ( keyframe.length ) {
      frameOpts = cash.extend({}, opts, keyframe[1]);
      keyframe  = keyframe[0];
    }

    frameOpts.frameStart.call(objects,objects);

    cash.each(objects, function(obj, idex) {

      const isElement       = obj.nodeType;

      /** Object to apply the animation to. If element, use the style,
       *  otherwise apply it to the target itself.
       */
      const target          = (isElement ? obj.style : obj);

      /** Properties to animate */
      let   props           = {};
      let   startValues     = {};
      let   endValues       = {};

      if ( isElement ) {

        props       = _buildStyles(obj, keyframe);
        startValues = props.start;
        endValues   = props.end;

      } else {
        /** If we're dealing with a plain object, just set the start & end
         *  values
         */
        for (let key in keyframe) {
          startValues[key] = target[key];
          endValues[key]   = keyframe[key];
        }
      }

      frameOpts.itemStart.call(obj,obj, idex);

      // Use element.animate
      return _renderViaElementAnimate( {
        target      : target,
        obj         : obj,
        idex        : idex,
        frameOpts   :  frameOpts,
        startValues : startValues,
        endValues   : endValues,
        onFinished  : __finished,
      });
    });
  }

  function __finished( obj,  idex ) {

    opts.itemComplete.call( obj, obj, idex );

    animationsRemaining--;
    if ( !animationsRemaining ) {
      opts.frameComplete.call( objects, objects );

      currentFrame++;
      if ( currentFrame < totalFrames ) {
        animationsRemaining = objects.length;
        __runKeyframe( keyframes[currentFrame] );
      } else {
        opts.complete.call( objects, objects );
      }
    }
  }
  /* Context bound animation helpers }
   **********************************************************************/
}

cash.animate = function( obj, end, opts ) {
  if (! obj || ! obj.length) {
    return __error( 'empty collection', obj, opts );
  }

  return new Animator( obj, end, opts );
};

cash.fn.animate = function( end, opts ) {
  if (! this.length) {
    return __error( 'empty collection', this, opts );
  }

  return new Animator( this, end, opts );
};

/***************************************************************
 * jQuery Animations {
 *
 */

const DURATION_DEFAULT  = 400;

function __createOpts( duration, complete ) {
  const opts  = {
    duration: duration,
    complete: complete,
  };
  if (cash.isFunction(duration)) {
    opts.duration = DURATION_DEFAULT;
    opts.complete = duration;

  } else if (cash.isString(duration)) {
    switch(duration.toLowerCase()) {
    case 'fast':    opts.duration = 100;              break;
    case 'normal':  opts.duration = DURATION_DEFAULT; break;
    case 'slow':    opts.duration = 800;              break;
    default:
        // Remove any 'ms' suffix and default to 1.
        opts.duration = parseFloat( duration ) || 1;
        break;
    }
  }
  return opts;
}

function __slide( direction, duration, complete ) {
  const opts      = __createOpts( duration, complete );
  const cStart    = opts.start;
  const cComplete = opts.complete;
  const start     = {   // starting state
    overflow  : null,
    height    : null,
    transform : null,
  };
  const xfer      = {}; // state to transfer from up to down
  const end       = {}; // ending state

  opts.start = function( $el ) {
    if (cStart) { cStart.call( $el, $el ); }

    // Establish the target 'end' state
    cash.extend( start, cash.parseStyle( $el.attr('style') ) );
    delete start.display; // exclude 'display' from the state

    if (direction === 'Down') {
      cash.extend( end, $el.data('slideDown') || {} );

      // Establish the initial starting state
      $el.css( {
        display : end.display || 'block',
        height  : 0,
        overflow: 'hidden',
      });

      $el.removeData('slideDown');

    } else {
      xfer.display = $el.css('display');
      xfer.height  = $el.css('height');

      end.display   = 'none';
      end.overflow  = 'hidden';
      end.height    = 0;

      // Immediately change overflow
      $el.css('overflow', 'hidden');

      // Pass the original 'display' and 'height' to slideDown.
      $el.data('slideDown', xfer);
    }
  };

  opts.complete = function( $el, err ) {
    // Resetting the element's inline styles to their pre-animation values.
    $el.css( start );

    if (cComplete)  { cComplete.call( $el, $el, err ); }
  };

  return this.animate( end, opts );
}

cash.fn.fadeIn = function(duration, complete) {
  const opts  = __createOpts( duration, complete );
  return this.animate( {opacity:1}, opts );
};
cash.fn.fadeOut = function(duration, complete) {
  const opts  = __createOpts( duration, complete );
  return this.animate( {opacity:0}, opts );
};
cash.fn.fadeTo = function(duration, opacity, complete) {
  const opts  = __createOpts( duration, complete );
  return this.animate( {opacity:opacity}, opts );
};

cash.fn.slideUp = function (duration, complete) {
  return __slide.call( this, 'Up', duration, complete );
};
cash.fn.slideDown = function (duration, complete) {
  return __slide.call( this, 'Down', duration, complete );
};
/* jQuery Animations }
 ***************************************************************/

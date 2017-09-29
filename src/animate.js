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
/* jshint laxbreak: true, maxparams: 6 */
const _requestAnimationFrame = win.requestAnimationFrame ||
                               win.webkitRequestAnimationFrame;

/** Group all `requestAnimationFrame` calls into one for better performance. */
const _animations = [];

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
    end: {}
  };

  /** If it's an element, we have to get the current styles */
  const start = win.getComputedStyle(obj);

  // Use the existing transform style for the start.
  props.start[_transformProp] = start[_transformProp];
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
  const render    = opts.obj.animate( [opts.startValues, opts.endValues],
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

  __runKeyframe( keyframes[currentFrame] );

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
  return new Animator( obj, end, opts );
};

cash.fn.animate = function( end, opts ) {
  return new Animator( this, end, opts );
};

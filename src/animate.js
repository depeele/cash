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

/** Split a string from the number and the unit to allow tweening the number. */
const _unitRe = /(-?[0-9]+(?:\.[0-9]+)?)([a-z%]+)?$/i;

function _getNumberUnit(val){
  let ret = _unitRe.exec( val );
  if ( !ret && ret !== 0 ) {
    ret = [0,'px'];
  } else {
    ret = ret.slice(1,3);
    ret[0] = parseFloat(ret[0]);
  }

  return ret;
}


/* http://stackoverflow.com/a/10624656/1012919
function _percentwidth(elem){
  const pa  = elem.offsetParent || elem;
  return ((elem.offsetWidth/pa.offsetWidth)*100).toFixed(2)+'%';
}
// */


////////////////////////////////////////


/** http://stackoverflow.com/a/30583749/1012919 */
function _decomposeMatrix(a, b, c, d, e, f) {

  // caching for readability below
  const acos    = Math.acos;
  const atan    = Math.atan;
  const sqrt    = Math.sqrt;
  const pi      = Math.PI;
  const determ  = a * d - b * c;

  let output = {};
  let scaleX = 1;
  let scaleY = 1;
  let skewX;
  let skewY;
  let rotation;
  let r;
  let s;

  // Apply the QR-like decomposition.
  if (a || b) {
    r = sqrt(a*a + b*b);
    rotation = b > 0 ? acos(a / r) : -acos(a / r);
    scaleX = r;
    scaleY = determ / r;
    skewX  = atan((a*c + b*d) / (r*r));
  } else if (c || d) {
    s = sqrt(c*c + d*d);
    rotation = pi * 0.5 - (d > 0 ? acos(-c / s) : -acos(c / s));
    scaleX = determ / s;
    scaleY = s;
    skewY = atan((a*c + b*d) / (s*s));
  }

  if ( e && e !== '0' ) { output.translateX = e; }
  if ( f && e !== '0' ) { output.translateY = f; }
  if ( scaleX !== 1 ) { output.scaleX = scaleX; }
  if ( scaleY !== 1 ) { output.scaleY = scaleY; }
  if ( skewX ) { output.skewX = skewX; }
  if ( skewY ) { output.skewY = skewY; }
  if ( rotation !== 0 ) { output.rotate = rotation * (180/pi) + 'deg'; }

  return output;
}

const _transformRe  = /([a-z]+)\((.*?)\)/ig;

function _getCurrentTransforms(obj) {

  /** Set translateZ for animationg speed boost. */
  const transformObj      = {
    start : { translateZ: 0 },
    end   : { translateZ: 0 },
  };
  const currentTransforms = obj[_transformProp];
  let   _transform        = _transformRe.exec(currentTransforms);
  let   tempObj           = {};

  if ( _transform ) {
    /** Crap. Did we get a matrix? Guess we gotta parse that. */
    if ( _transform[1] === 'matrix' ) {
      tempObj = _decomposeMatrix.apply(null, _transform[2].split(/[\s,]+/) );
    } else {
      /** Otherwise, we can just loop through all of those wonderfully easy properties */
      while ( _transform ){
        tempObj[_transform[1]] = _transform[2];
        _transform = _transformRe.exec(currentTransforms);
      }
    }
  }

  /** Set the start & end properties of the transform equally. The end
   * properties will be overridden later
   */
  for ( let key in tempObj ) {
    const val = _transforms[key](tempObj[key], true );
    transformObj.start[ key ] = val;
    transformObj.end[ key ]   = val;
  }

  return transformObj;
}


////////////////////////////////////////


function _getDeltaValue(delta,start,to) {
  let end     = to;
  let suffix  = 0;

  start = ( start && start.length === 2 ? start[0] : start );

  if ( to && to.length === 2 ) {
    end = to[0];
    suffix = to[1] || 0;
  }

  return (start + (end - start) * delta) + suffix;
}


////////////////////////////////////////


function _buildStyles(obj, end, supportAnimate) {
  const props = {
    // Set start & end as empty objects to be filled
    start: {},
    end: {}
  };

  /** If it's an element, we have to get the current styles */
  const start = win.getComputedStyle(obj);

  let   currentTransforms;

  if ( supportAnimate ) {
    // Use the existing transform style for the start.
    props.start[_transformProp] = start[_transformProp];
    props.end[_transformProp] = '';
  } else {
    /* Get current transform values if element to preserve existing transforms
     * and to animate smoothly to new transform values.
     */
    currentTransforms = _getCurrentTransforms(start);
    props.transforms = currentTransforms;
  }

  for (let key in end){

    let endValue  = end[key];

    if ( _transforms[key] ) {

      /** If using Element.animate, flatten the transforms object to a single
       *  transform string.
       */
      if ( supportAnimate ) {

        props.end[_transformProp] += _transforms[key](endValue);

      } else {

        currentTransforms.start[key] =
          _getNumberUnit( currentTransforms.start[key] ||
                          _transforms[key](null,true) );

        currentTransforms.end[key]   = _getNumberUnit(endValue);

      }

    } else {

      /** Convert to vendor prefixed, camelCase property name */
      const propName    = cash.prefixedProp(key);
      let   startValue  = start[propName];

      /** If not using Element.animate, split the values into an array
       *  containing the number and the unit, e.g. [100,'px']
       */

      if ( !supportAnimate ) {
        startValue = _getNumberUnit(startValue);
        endValue   = _getNumberUnit(endValue);
/*
        if ( start[1] !== end[1] ) {
          console.log('conversion needed!',start,end);
        }
*/
      }

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

function _useElementAnimate( opts ) {
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

function _manualAnimation( opts ) {
  const frameOpts       = opts.frameOpts;
  const stagger         = frameOpts.stagger *  opts.idex;
  const direction       = frameOpts.direction;
  const easing          = _bezier( frameOpts.easing ) || _easings.linear;
  const transformValues = opts.props.transforms;
  const isElement       = opts.obj.nodeType;
  let   now             = Date.now();
  let   startTime       = now + opts.delay + stagger;
  let   reversed        = ( direction === 'reverse' ||
                            direction === 'alternate-reverse' );
  let   iterations      = frameOpts.iterations;
  let   progress        = 0;

  function __render() {
    now = Date.now();

    /** Don't run the animation until after the start time in case a
     *  delay was set
     */
    if ( now < startTime ) { return; }

    progress = ( now - startTime ) / opts.duration;
    if ( progress > 1 ) { progress = 1; }

    const delta = easing( reversed ? 1 - progress : progress );

    /** Animate all normal properties or styles */
    for (let key in opts.endValues){
      opts.target[key] =
        _getDeltaValue(delta, opts.startValues[key], opts.endValues[key]);
    }

    /** Animate all transforms, grouped together. */
    if ( isElement && transformValues ) {
      let transform = '';

      for (let key in transformValues.end) {
        transform +=
          _transforms[key]( _getDeltaValue( delta,
                                            transformValues.start[key],
                                            transformValues.end[key] ) );
      }
      opts.target[_transformProp] = transform;
    }

    if ( frameOpts.itemProgress.call( opts.obj, opts.obj,  opts.idex)
                                                          === false ) {
      return false;
    }

    if ( progress >= 1 ) {
      if ( direction === 'alternate' ||
           direction === 'alternate-reverse' ) {
        reversed = !reversed;
      }

      if ( iterations <= 1 ) {
        opts.onFinished( opts.obj,  opts.idex);
        return false;
      } else {
        if ( iterations > 1 && iterations !== Infinity ) {
          iterations--;
        }
        startTime = now;
      }
    }

  }

  _animations.push( __render );
  _animations.play();

  return __render;
}


function Animator( objects, keyframes, opts ) {

  objects   = objects.length   ? objects   : [objects];
  keyframes = keyframes.length ? keyframes : [keyframes];
  opts      = cash.extend({}, _defaultOpts, opts);

  const totalFrames         = keyframes.length;
  let   animationsRemaining = objects.length;
  let   currentFrame        = 0;
  const __finished          = function( obj,  idex ) {

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
  };

  function __runKeyframe( keyframe ) {

    let frameOpts = opts;
    if ( keyframe.length ) {
      frameOpts = cash.extend({}, opts, keyframe[1]);
      keyframe  = keyframe[0];
    }

    frameOpts.frameStart.call(objects,objects);

    cash.each(objects, function(obj, idex) {

      const isElement       = obj.nodeType;
      const supportAnimate  = (isElement && (!frameOpts.disableAnimate &&
                                              obj.animate));

      /** Object to apply the animation to. If element, use the style,
       *  otherwise apply it to the target itself.
       */
      const target          = (isElement ? obj.style : obj);

      /** Properties to animate */
      let   props           = {};
      let   startValues     = {};
      let   endValues       = {};

      if ( isElement ) {

        props       = _buildStyles(obj, keyframe, supportAnimate);
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

      // Use element.animate if supported
      let render;
      if ( supportAnimate ) {
        render = _useElementAnimate( {
          target      : target,
          obj         : obj,
          idex        : idex,
          frameOpts   :  frameOpts,
          startValues : startValues,
          endValues   : endValues,
          onFinished  : __finished,
        });



      } else {
        render = _manualAnimation( {
          target      : target,
          obj         : obj,
          idex        : idex,
          frameOpts   :  frameOpts,
          props       : props,
          startValues : startValues,
          endValues   : endValues,
          onFinished  : __finished,
        });

      }

      return render;
    });
  }

  opts.start.call( objects, objects );

  __runKeyframe( keyframes[currentFrame] );
}

cash.animate = function( obj, end, opts ) {
  return new Animator( obj, end, opts );
};

cash.fn.animate = function( end, opts ) {
  return new Animator( this, end, opts );
};
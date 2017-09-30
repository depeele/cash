// @echo header
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory();
  } else {
    root.cash = root.$ = factory();
  }
})(this, function() {

  const doc        = document;
  const win        = window;
  const ArrayProto = Array.prototype;
  const slice      = ArrayProto.slice;
  const filter     = ArrayProto.filter;
  const push       = ArrayProto.push;

  // @include ./core.js
  // @include ./util.js
  // @include ./data.js
  // @include ./attributes.js
  // @include ./collection.js
  // @include ./css.js
  // @include ./dimensions.js
  // @include ./events.js
  // @include ./forms.js
  // @include ./manipulation.js
  // @include ./offset.js
  // @include ./traversal.js

  // @include ./animate.js
  // @include ./deepExtend.js

  return cash;
});

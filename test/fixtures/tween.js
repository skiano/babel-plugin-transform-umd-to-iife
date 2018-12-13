var TWEEN = { isModule: true };

(function(t){
  "function" == typeof define && define.amd
    ? define([], function(){ return TWEEN })
    : "undefined" != typeof module && "object"==typeof exports
      ? module.exports = TWEEN
      : void 0 !== t && (t.TWEEN=TWEEN)
}(this));

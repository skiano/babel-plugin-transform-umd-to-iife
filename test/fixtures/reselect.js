(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('Reselect', ['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.Reselect = mod.exports;
  }
})(this, function (exports) {
  'use strict';
  exports.isModule = true
});

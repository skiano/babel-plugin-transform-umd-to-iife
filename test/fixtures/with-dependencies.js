(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'library', 'other-library'], factory);
  } else if (typeof exports !== "undefined") {
    // who cares....
  } else {
    factory(global.Library, global.OtherLibrary);
  }
})(this, function () {
  return {}
});

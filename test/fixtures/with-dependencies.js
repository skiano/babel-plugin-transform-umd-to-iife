(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['library', 'other-library'], factory);
  } else if (typeof exports !== "undefined") {
    // who cares....
  } else {
    factory(global.Library, global.OtherLibrary);
  }
})(this, function () {
  const define = () => {}

  define()

  return {
    isModule: true,
  }
});

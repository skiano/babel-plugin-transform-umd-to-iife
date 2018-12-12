/** @license https://github.com/skiano/predication/blob/master/LICENSE */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.predication = global.predication || {})));
}(this, (function (exports) { 'use strict';

/** undefined should be false, not reversed! */
var not = function (v, predicate) { return predicate(v) === false ? true : false; };
var and = function (v, predicates) { return predicates.every(function (p) { return p(v); }); };
var or = function (v, predicates) { return predicates.some(function (p) { return p(v); }); };

var checkType = function (typ) { return function (v) { return typeof v === typ; }; };
var error = function (msg) { throw new Error(msg); };
var isArray = function (v) { return Array.isArray(v); };
var isOneOf = function () {
  var predicates = [], len = arguments.length;
  while ( len-- ) predicates[ len ] = arguments[ len ];

  return function (v) { return or(v, predicates); };
};
var isBool = checkType('boolean');
var isString = checkType('string');
var isNumber = checkType('number');
var isFunction = checkType('function');
var isUndefined = checkType('undefined');
var isNotUndefined = function (v) { return !isUndefined(v); };

var isArrayOfLength = function (len, validator) { return function (v) { return (
  isArray(v) &&
  (v.length === len) &&
  (validator ? v.every(validator) : true)
); }; };

var strIncludes = function (v, c) { return v.toLowerCase().includes(c.toLowerCase()); };
var includes = function (v, c) {
  if (isString(v)) { return strIncludes(v, c) }
  if (isArray(v)) { return v.includes(c) }
};

var mod = function (v, c) { return v % c === 0; };
var modR = function (v, ref) {
  var denom = ref[0];
  var remainder = ref[1];

  return v % denom === (remainder % denom);
};

var isDictionary = function (obj) {
  var type = typeof obj;
  return type === 'object' && !isArray(obj) && type !== 'function' && !!obj;
};

var objectIncludesString = function (o, str) { return (
  (isString(o) && strIncludes(o, str)) ||
  (isDictionary(o) && Object.keys(o).some(function (k) { return objectIncludesString(o[k], str); })) ||
  (isArray(o) && o.some(function (v) { return objectIncludesString(v, str); })) ||
  false
); };

var predicates = {};
var validators = {};
var isMissing = function (k, v, c) { return k !== 'exists' && (isUndefined(c) || isUndefined(v)); };

var listPredicates$$1 = function () { return Object.keys(predicates); };
var hasPredicate$$1 = function (key) { return predicates.hasOwnProperty(key); };
var removePredicate$$1 = function (key) {
  delete predicates[key];
  delete validators[key];
};

var registerPredicate$$1 = function (key, predicator, validator) {
  if (hasPredicate$$1(key)) {
    error(("Predicate \"" + key + "\" is already registered"));
  } else {
    validators[key] = validator;
    predicates[key] = function (config, value, getThis, getThat) {
      var v = getThis(value);
      var c = getThat ? getThat(value) : config;

      if (isMissing(key, v, c) || (getThat && validator && !validator(c))) { return undefined; }
      return predicator(v, c);
    };
  }
};

var getPredicate$$1 = function (key, config, thisValue) {
  if (!hasPredicate$$1(key)) {
    error(key ? ("Unregisterd predicate: \"" + key + "\"") : 'Empty predicate');
  } else {
    var isComplexConfig = isDictionary(config) && config.that;

    if (!isComplexConfig && validators[key] && !validators[key](config)) {
      error(("invalid config for \"" + key + "\": " + config));
    }

    var getThis = evaluation(thisValue);
    var getThat = isComplexConfig && evaluation(config.that);
    return function (v) { return predicates[key](config, v, getThis, getThat); };
  }
};

registerPredicate$$1('not', not);
registerPredicate$$1('and', and);
registerPredicate$$1('or', or);

// add intersect
// predication({ x: [3, 4, 5] })([1, 2, 3]) // true
// predication({ x: [4, 5, 6] })([1, 2, 3]) // false

registerPredicate$$1('exists', function (v, c) { return c === !isUndefined(v); },              isBool);
registerPredicate$$1('mod', function (v, c) { return (isArray(c) ? modR(v, c) : mod(v, c)); }, isOneOf(isNumber, isArrayOfLength(2, isNumber)));
registerPredicate$$1('in',  function (v, c) { return includes(v, c); },                        isNotUndefined);
registerPredicate$$1('nin', function (v, c) { return !includes(v, c); },                       isNotUndefined);
registerPredicate$$1('eq',  function (v, c) { return v === c; },                               isNotUndefined);
registerPredicate$$1('ne',  function (v, c) { return v !== c; },                               isNotUndefined);
registerPredicate$$1('lt',  function (v, c) { return v < c; },                                 isNumber);
registerPredicate$$1('gt',  function (v, c) { return v > c; },                                 isNumber);
registerPredicate$$1('lte', function (v, c) { return v <= c; },                                isNumber);
registerPredicate$$1('gte', function (v, c) { return v >= c; },                                isNumber);
registerPredicate$$1('rng', function (v, c) { return (v >= c[0] && v <= c[1]); },              isArrayOfLength(2, isNumber));
registerPredicate$$1('oi',  function (v, c) { return objectIncludesString(v, c); },            isString);
registerPredicate$$1('noi', function (v, c) { return !objectIncludesString(v, c); },           isString);

var TERM_RE = /^([^\[]*)\[(\-?\d*)\]$/;
var IDX_RE = /^(\-?)(\d)$/;

var getAtIdx = function (value, idx) {
  if (isArray(value)) { return value[idx]; }
  if (isString(value)) { return value.charAt(idx); }
};

var indexer = function (str) {
  var ref = IDX_RE.exec(str);
  var reverse = ref[1];
  var idx = ref[2];
  return function (arr) { return getAtIdx(
    arr, (reverse ? arr.length - idx - 1 : idx)
  ); };
};

/** make identity fn once */
var identity = function (v) { return v; };

/**
 * @param path {string} - path in object
 * example paths:
 *   "foo"
 *   "foo.bar"
 *   "foo[2]"
 *   "foo[-1]"
 *   "foo[2].bar"
 */
var evaluation = function (path) {
  if (isUndefined(path)) { return identity; }
  if (!isString(path) || !path) { error(("bad access path: " + path)); }

  var terms = path.split('.').reduce(function (terms, frag) {
    var parts = TERM_RE.exec(frag);
    if (parts) {
      return terms.concat(
        parts[1] ? [parts[1], indexer(parts[2])] : indexer(parts[2])
      )
    } else {
      return terms.concat([frag]);
    }
  }, []);

  if (terms.length === 0) { return identity; }

  return function (value) {
    if (isUndefined(value) || value === null) { return undefined; }

    var output = value;

    for (var i = 0; i < terms.length; i += 1) {
      if (isUndefined(output)) { return undefined; }
      output = isFunction(terms[i]) ? terms[i](output) : output[terms[i]];
    }

    return output;
  };
};

var removeThis = function (k) { return k !== 'this'; };
var IS_CHILD = true;

var predication$$1 = function (config, isChild) {
  if ( isChild === void 0 ) isChild = false;

  var keys = Object.keys(config).filter(removeThis);
  var key = keys[0];
  var thisVal = config.this;

  var predicate;
  var childPredication;

  switch (true) {
    case keys.length > 1:
      /** this object has multiple predicates, so join them by or */
      childPredication = function (k) { return predication$$1(( obj = {}, obj[k] = config[k], obj ), IS_CHILD)
        var obj; };
      predicate = getPredicate$$1('or', keys.map(childPredication), thisVal);
      break;

    case key === 'and' || key === 'or':
      if (config[key].length === 0) { error('Empty logic'); }
      childPredication = function (c) { return predication$$1(c, IS_CHILD); };
      predicate = getPredicate$$1(key, config[key].map(childPredication), thisVal);
      break;

    case key === 'not':
      predicate = getPredicate$$1(key, predication$$1(config[key], IS_CHILD), thisVal);
      break;

    default:
      predicate = getPredicate$$1(key, config[key], thisVal);
  }

  /*
   * for the root predicate,
   * convert undefined to false so it is a true predicate
   * (inside, undefined is used to designate missing values, which helps with "not")
   */
  return isChild ? predicate : function (v) { return !!predicate(v); };
};

exports.listPredicates = listPredicates$$1;
exports.hasPredicate = hasPredicate$$1;
exports.removePredicate = removePredicate$$1;
exports.registerPredicate = registerPredicate$$1;
exports.getPredicate = getPredicate$$1;
exports.evaluation = evaluation;
exports.predication = predication$$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));

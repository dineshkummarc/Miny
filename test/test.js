var fs = require('fs');
var path = require('path');
var assert = require('assert');

var Miny = require('../Miny');

var jsonh = require('./third_party/jsonh');
var cjson = require('./third_party/cjson');

var ENCODERS = {
  Miny: {
    encode: function(o) {
      return Miny.encode(JSON.stringify(o));
    },
    decode: function(o) {
      return JSON.parse(Miny.decode(o));
    }
  },
  JSONH: {encode: cjson.stringify, decode: cjson.parse},
  CJSON: {encode: jsonh.stringify, decode: jsonh.parse}
};

function toUnits(n, units) {
  var UNITS = ['n', 'u', 'm', null, 'K', 'M', 'G'];
  var exp = Math.floor(Math.log(n)/Math.log(10)/3);
  if (UNITS[exp + 3]) {
    return (n/Math.pow(10, exp*3)).toFixed(1) +
    UNITS[exp + 3] + (units || '');
  }
  return n;
}

function toPercentChange(after, before) {
  return ((before - after)/before*100).toFixed(2) + '%';
}

function toRate(n, t) {
  return toUnits(n / t * 1000) + '/sec'; //'
}

function log() {
  var args = Array.prototype.slice.apply(arguments);
  args.unshift('- ');
  console.log.apply(console, args);
}

function test(input, encoder) {
  var json = JSON.stringify(input);

  var tEncode = Date.now();
  try {
    var encoded = encoder.encode(input);
  } catch (e) {
    return log('ERROR: ' + e.message);
  }
  tEncode = Date.now() - tEncode;
  log('Encoded', toUnits(json.length),
    'in', tEncode.toFixed(0) + 'ms',
    '(' + toRate(json.length, tEncode) + ')');
  log('Compression:', toPercentChange(encoded.length, json.length),
    '(url-encoded:' + toPercentChange(encodeURIComponent(encoded).length,
      encodeURIComponent(json).length) + ')');

  var tDecode = Date.now();
  try {
    var decoded = encoder.decode(encoded);
  } catch (e) {
    return log('ERROR: ' + e.message);
  }
  tDecode = Date.now() - tDecode;
  log('Decoded in', tDecode.toFixed(0) + 'ms',
    '(' + toRate(json.length, tDecode) + ')');

  try {
    assert.deepEqual(input, decoded);
  } catch (e) {
    return log('ERROR: Decoded object != input object');
  }
}

// Test using each samples/*.json
var SAMPLES = path.join(__dirname, 'samples');
var files = fs.readdirSync(SAMPLES);

Object.keys(ENCODERS).forEach(function(encoder) {
  files.forEach(function(file) {
    // Skip non-json files
    if (!(/.json$/).test(file)) return;

    // Read and parse contents
    var filepath = path.join(SAMPLES, file);
    var json = fs.readFileSync(filepath, 'utf8');
    var sample = JSON.parse(json);

    console.log('\nTesting',  encoder, 'on', file);
    test(sample, ENCODERS[encoder]);
  }, this);
});

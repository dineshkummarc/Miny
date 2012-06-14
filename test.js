var fs = require('fs');
var path = require('path');
var assert = require('assert');

var Miny = require('./Miny');

var jsonh = require('./jsonh');

function displayCompression(before, after) {
  return (after / before * 100).toFixed(2) + '%';
}

function displayTime(n, t) {
  return (n / t * 1000).toFixed(0) + ' chars per sec';
}

function test(input, encode, decode) {
  function log() {
    var args = Array.prototype.slice.apply(arguments);
    args.unshift('- ');
    console.log.apply(console, args);
  }
  if (!input) {
    log('ERROR: Data can not be encoded');
    return;
  }

  var json = JSON.stringify(input);

  var tEncode = Date.now();
  var encoded = encode(input);
  tEncode = Date.now() - tEncode;

  var tDecode = Date.now();
  var decoded = decode(encoded);
  tDecode = Date.now() - tDecode;

  formEncoded = encodeURIComponent(encoded);

  try {
    assert.deepEqual(input, decoded);
  } catch (e) {
    log('ERROR: Decoded object != input object');
    return;
  }

  log('Compression (pre-form-encoding):',
    displayCompression(json.length, encoded.length));
  log('Compression (post-form-encoding):',
    displayCompression(encodeURIComponent(json).length,
      encodeURIComponent(encoded).length));
  log('Encoding time: ' + displayTime(json.length, tEncode));
  log('Decoding time: ' + displayTime(json.length, tDecode));
}

// Test using each samples/*.json
var SAMPLES = path.join(__dirname, 'samples');
var files = fs.readdirSync(SAMPLES);

files.forEach(function(file) {
  if (!(/.json$/).test(file)) return;

  var filepath = path.join(SAMPLES, file);

  var json = fs.readFileSync(filepath);
  var sample = JSON.parse(json);

  console.log('\nTESTING ', file, '(' + json.length + ' chars)');

  console.log('Miny results:');
  test(sample,
    function(o) {
      return Miny.encode(JSON.stringify(o));
    },
    function(o) {
      return JSON.parse(Miny.decode(o));
    }
  );

  // jsonh only works on arrays(?)
  if (sample.concat) {
    console.log('jsonh results:');
    test(sample.concat ? sample : null, jsonh.stringify, jsonh.parse);
  }
}, this);

//     Miny.js
//
//     Copyright (c) 2010 Robert Kieffer.
//     MIT license.
//     Documentation and details at https://github.com/broofa/Miny

(function() {
  var _global = this;

  var MAGIC = 'Miny1';

  // Build base-32 encoding table (on as-needed basis)
  var _indexMap = {encode: [], decode: {}};
  var LO = 'wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'.split('');
  function getIndexMap(length) {
    for (var i = _indexMap.encode.length; i < length; i++) {
      // Add termination bit to low-order digit
      s = i.toString(32).split('');
      s[s.length - 1] = LO[parseInt(s[s.length - 1], 32)];
      s = s.join('');

      _indexMap.encode[i] = s;
      _indexMap.decode[s] = i;
    }

    return _indexMap;
  }

  // Miny-encode a string
  function encode(s) {
    // Break string into parts that we create a dictionary for
    var parts = s.match(/\w+|\W+/g);

    // Create dictionary we'll use to encode, but initialize it to part counts
    // (for the moment) so we can sort by frequency below
    var dict = {};
    for (var i = 0; i < parts.length; i++) {
      dict[parts[i]] = (dict[parts[i]] || 0) + 1;
    }

    // Create array of part strings we'll use to decode, sort by frequency so
    // most common parts have smallest code
    var byCount = Object.keys(dict);
    byCount.sort(function(a,b) {
      return dict[a] < dict[b] ? 1 : (dict[b] < dict[a] ? -1 : 0);
    })

    // Set part codes in dictionary using our b32 encoding
    var encode = getIndexMap(byCount.length).encode;
    for (var i = 0; i < byCount.length; i++) {
      dict[byCount[i]] = encode[i];
    }

    // Encode parts
    var codes = [];
    for (var i = 0; i < parts.length; i++) {
      codes[i] = dict[parts[i]];
    }

    // Escape separator char in dict keys
    for (var i = 0; i < byCount.length; i++) {
      byCount[i] = byCount[i].replace(/'~'/g, '\\~');
    }

    return [MAGIC, byCount.length].
           concat(byCount).
           concat(codes.join('')).
           join('~');
  };

  // Miny-decode a string
  function decode(s) {
    fields = s.split('~');

    if (fields.shift() != MAGIC) {
      throw new Error('Not a Miny stream');
    }
    var nKeys = parseInt(fields.shift());
    var codes = fields.pop();
    codes = codes.match(/[0-9a-v]*[-w-zA-Z_]/g);

    // Patch up any place we split on an escaped '\~'
    var dict = fields;

    var decode = getIndexMap(nKeys).decode;
    var parts = [];
    for (var i = 0; i < codes.length; i++) {
      parts[i] = dict[decode[codes[i]]];
    }

    return parts.join('');
  };

  var Miny = {
    encode: encode,
    decode: decode
  };

  if (typeof(module) != 'undefined') {
    // Play nice with node.js
    module.exports = Miny;
  } else {
    // Play nice with browsers
    var _previousRoot = _global.Miny;

    // **`noConflict()` - (browser only) to reset global 'Miny' var**
    Miny.noConflict = function() {
      _global.Miny = _previousRoot;
      return Miny;
    };
    _global.Miny = Miny;
  }
}());

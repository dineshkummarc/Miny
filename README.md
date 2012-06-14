# jsonify
=====

A compression algorithm for sending text (read, "JSON") over HTTP.

## Installation

In browser:

```html
<script src="Miny.js"></script>
```

In node.js:

```
npm install Miny
```

```javascript
var Miny = require('Miny');
```

## Usage

```javascript
// Pack some data
var someJSON = JSON.stringify({"hello":"world","world":"hello"});
var packedJSON = Miny.encode(someJSON);

// Then later unpack it ...
var unpackedJSON = Miny.decode(packedJSON);
require('assert').equal(someJSON, unpackedJSON); // ==> true, we hope!!!
```

## Miny format (version 1)

A Miny stream consists of the following '~'-separated fields:

  1. *magick* - format and version
  1. *lookupLength* - # of entries in the lookup table (to follow)
  1. *[lookupTable]* - [tableLength] fields comprising the lookup table
  1. *contentCodes* - A single field of Miny-style indexes into lookupTable (see **Miny-style indexes** below)

For example the string `{"hello":"world","world":"hello"}` encodes as follows:

```
Miny1~6~hello~":"~world~{"~","~"}~zwxyAyxwB
```

### contentCodes field

The contentCodes field is expected to be the bulk of Miny streams. Because of this we represent these in as compact a form as possible, as follows:

  * Using the digits 0-9, a-z, A-Z, - and _ to represent base 64 digits ...
  * For each index ...
    * get base 32 representation of the index.  E.g. 4007 decimal in base 32 is '3t7'
    * For **just** the least-significant digit ('7'), add 32 ( becomes 39), and convert to base-64 (becomes 'D').  So 4007 encodes as 3t7.
  * Concatenate all indexes together (no separator)

Miny index streams are easily by simply looking for the low-order digits which, because of the offset-by-32, use a different set of characters than the higher-order digits.

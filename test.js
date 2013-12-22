var orbital = require('./orbital');
var assert = require('assert');
var through = require('through');
var fs = require('fs');


var trap = function(stream, fn) {
  var data = null;
  stream.pipe(through(function(d) {
    if (data === null) {
      data = d
    } else if (Buffer.isBuffer(data)) {
      data = data.concat(d);
    } else {
      data += d;
    }
  }, function() {
    fn(data);
  }));
  return stream;
}


describe('orbital', function() {

  it('should handle builtins', function(done) {
    trap(orbital([['Math.round']]), function(d) {
      assert.equal(5, d);
      done();
    }).end(5.243);
  });

  it('should error when accesing a non-existant built-in', function(d) {
    try {
      orbital([['Math.non-existant']])
    } catch (e) {
      d();
    }
  });

   it('should handle passed defines', function(done) {
    // Test basic structure
    var basic = [
      ['a', 'b', 'c']
    ];

    var f1 = orbital(basic, {
      a : through(function(d) { this.push(d + 'a'); } ),
      b : through(function(d) { this.push(d + 'b'); } ),
      c : through(function(d) { this.push(d + 'c'); } )
    });

    trap(f1, function(d) {
      assert.equal('goabc', d);
      done();
    }).end('go');
  });

  it('should fail when accessing a define that does not exist', function(d) {
    try {
      orbital(['non-existant']);
    } catch (e) {
      d();
    }
  });

  it('should handle constants', function(d) {
    trap(orbital([['process.title']]), function(data) {
      assert.equal(process.title, data);
      d();
    })
  });

  it('should handle be able to use core modules', function(d) {
    trap(orbital([
      [{ name : 'fs.createReadStream', args: [__filename] }]
    ]), function(data) {
      assert.equal(fs.readFileSync(__filename).toString(), data.toString());
      d();
    });
  });

});


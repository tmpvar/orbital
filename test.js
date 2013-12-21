var orbital = require('./orbital');
var assert = require('assert');
var through = require('through');

var trap = function(stream, fn) {
  stream.pipe(through(fn));
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
});

// Test nested structure


// Test streams



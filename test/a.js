module.exports = require('through')(function(i) {
  this.push(i.toUpperCase());
});
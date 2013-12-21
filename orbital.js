var through = require('through');
var Stream = require('stream').Stream;


// TODO: read through package-json and include packages

var availableNodes = {};

module.exports = function(flow, definitions) {

  if (definitions) {
    Object.keys(definitions).forEach(function(key) {
      availableNodes[key] = definitions[key];
    })
  }

  var head = null, tail = null;
  var ret = new Stream();

  flow.forEach(function(graph) {
    graph.forEach(function(node) {
      var parts = node.split('.');
      var base = parts[0];
      var n;

      if (global[base]) {
        if (typeof global[base][parts[1]] === 'function') {
          n = function(d) {
            this.push(global[base][parts[1]](d));
          };
        } else {
          throw new Error('builtin:' + base + '.' + parts[1] + ' does not exist');
        }
      } else if (!availableNodes[base]) {
        throw new Error('attempted to create non-existant node: ' + node);
      } else {
        n = availableNodes[base];
      }

      if (typeof n === 'function') {
        n = through(n);
      }


      if (!head) {
        tail = head = n;
      } else {
        tail.pipe(n);
        tail = n;
      }
    });

  });

  ret.end = head.end.bind(head);
  ret.write = head.write.bind(head);
  ret.pipe = tail.pipe.bind(tail);  
  return ret;
}
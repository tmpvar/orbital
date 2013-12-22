var through = require('through');
var Stream = require('stream').Stream;
var builtins = require('repl')._builtinLibs;

// TODO: read through package-json and include packages

var availableNodes = {};


// Core modules
builtins.forEach(function(name) {
  availableNodes[name] = require(name);
});

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
      var arguments = null;
      if (node.name) {
        arguments = node.args;
        node = node.name;
      }

      var parts = node.split('.');
      var base = parts[0];
      var n;
      var context;

      if (availableNodes[base]) {
        n = availableNodes[base];

        if (typeof n !== 'function' && parts.length > 1) {
          context = n;
          n = context[parts[1]];
        }
        
      } else if (base === 'process' && process[parts[1]]) {
        if (typeof process[parts[1]] === 'function') {
          n = through(function(d) {
            this.push(global[base][parts[1]](d));
          });
        } else if (typeof process[parts[1]] !== 'undefined') {
          n = through(function(d) {
            this.push(d);
          });

          process.nextTick(function() {
            n.end(process[parts[1]]);
          })

        } else {
          throw new Error('builtin:' + base + '.' + parts[1] + ' does not exist');
        }
      } else if (global[base]) {
        if (typeof global[base][parts[1]] === 'function') {
          n = through(function(d) {
            this.push(global[base][parts[1]](d));
          });
        } else {
          throw new Error('builtin:' + base + '.' + parts[1] + ' does not exist');
        }
      } else if (!availableNodes[base]) {
        throw new Error('attempted to create non-existant node: ' + node);
      }

      if (typeof n === 'function') {
        if (arguments) {
          n = n.apply(context, arguments);
        }
      }

      if (!head) {
        tail = head = n;
      } else {
        tail.pipe(n);
        tail = n;
      }
    });
  });

  if (head.end) {
    ret.end = head.end.bind(head);
  }

  if (head.write) {
    ret.write = head.write.bind(head);
  }

  ret.pipe = tail.pipe.bind(tail);  
  return ret;
}
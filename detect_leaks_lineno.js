// > node detect_leaks_lineno.js your_file.js

// Note: leaks with undefined names are probably false-positives, ignorable
// {leaks: [ { name: 'x', line: 9, column: 3 } ]
// {thisAssigns: [ { name: 'this.foo', line: 4, column: 0 } ]}
var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');

var filename = process.argv[2];
var ast = esprima.parse(fs.readFileSync(filename), {loc: true});
var scopeChain = [];
var assignments = [];
var leaks = []; //array of {name: "varname", line: 25}
var thisAssigns = []; //array of {name: "varnmae", line: 25}

estraverse.traverse(ast, {
  enter: enter,
  leave: leave
});

console.dir({leaks: leaks, thisAssigns: thisAssigns});

function enter(node){
  if (createsNewScope(node)){
    scopeChain.push([]);
  }
  var currentScope = scopeChain[scopeChain.length - 1];
  if (node.type === 'VariableDeclarator'){
    currentScope.push(node.id.name);
  }
  if (node.type === 'AssignmentExpression'){
    assignments.push(node);
    checkForThisAssignment(node)
  }
  if (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression'){
    node.params.forEach(function (param) {
      currentScope.push(param.name);
    });
  }
}

function leave(node){
  if (createsNewScope(node)){
    checkForLeaks(assignments, scopeChain);
    scopeChain.pop();
    assignments = [];
  }
}

function isVarDefined(varname, scopeChain){
  for (var i = 0; i < scopeChain.length; i++){
    var scope = scopeChain[i];
    if (scope.indexOf(varname) !== -1){
      return true;
    }
  }
  return false;
}

function checkForLeaks(assignments, scopeChain){
  for (var i = 0; i < assignments.length; i++){
    var assignment = assignments[i];
    var varname = assignment.left.name;
    if (!isVarDefined(varname, scopeChain)){
      leaks.push({name: varname, line: assignment.loc.start.line, column: assignment.loc.start.column});
    }
  }
}

function checkForThisAssignment (node) {
  if (node.type !== "AssignmentExpression") return;

  if(!node.left || !node.left.object || !node.left.object.type ||
      node.left.object.type !== "ThisExpression") return;

  if (node.loc.start.column > 0 ) return; //HACK lazy check for whether inside a function
  thisAssigns.push({name: "this."+node.left.property.name, line: node.loc.start.line, column: node.loc.start.column});
}

function createsNewScope(node){
  return node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'Program';
}

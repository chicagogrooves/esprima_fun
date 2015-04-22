// we ignore 'use strict' implications for now

// 'intentional' global leak via this, outside a function's scope
this.foo = {};

x = 3; // canonical global leak

// use a global
myglobal.foo = {};

function f (a, b) {
   y = 3; // global leak
   a = 1; // not a leak (but don't do this)
}

var f2 = function (a, b, a2, b2) {
   y = 3; // global leak
   a2 = 1; // not a leak (but don't do this)
}

function foo (a) {
  this.a = a;
}

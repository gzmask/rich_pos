var d = null;
function f(a) {
  var b = typeof a;
  if("object" == b) {
    if(a) {
      if(a instanceof Array) {
        return"array"
      }
      if(a instanceof Object) {
        return b
      }
      var c = Object.prototype.toString.call(a);
      if("[object Window]" == c) {
        return"object"
      }
      if("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) {
        return"array"
      }
      if("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if("function" == b && "undefined" == typeof a.call) {
      return"object"
    }
  }
  return b
}
Math.floor(2147483648 * Math.random()).toString(36);
function g(a, b) {
  var c = Array.prototype.slice.call(arguments), e = c.shift();
  if("undefined" == typeof e) {
    throw Error("[goog.string.format] Template required");
  }
  return e.replace(/%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g, function(a, b, e, s, I, t, J, K) {
    if("%" == t) {
      return"%"
    }
    var u = c.shift();
    if("undefined" == typeof u) {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = u;
    return g.a[t].apply(d, arguments)
  })
}
g.a = {};
g.a.s = function(a, b, c) {
  return isNaN(c) || "" == c || a.length >= c ? a : a = -1 < b.indexOf("-", 0) ? a + Array(c - a.length + 1).join(" ") : Array(c - a.length + 1).join(" ") + a
};
g.a.f = function(a, b, c, e, j) {
  e = a.toString();
  isNaN(j) || "" == j || (e = a.toFixed(j));
  var i;
  i = 0 > a ? "-" : 0 <= b.indexOf("+") ? "+" : 0 <= b.indexOf(" ") ? " " : "";
  0 <= a && (e = i + e);
  if(isNaN(c) || e.length >= c) {
    return e
  }
  e = isNaN(j) ? Math.abs(a).toString() : Math.abs(a).toFixed(j);
  a = c - e.length - i.length;
  return e = 0 <= b.indexOf("-", 0) ? i + e + Array(a + 1).join(" ") : i + Array(a + 1).join(0 <= b.indexOf("0", 0) ? "0" : " ") + e
};
g.a.d = function(a, b, c, e, j, i, F, s) {
  return g.a.f(parseInt(a, 10), b, c, e, 0, i, F, s)
};
g.a.i = g.a.d;
g.a.u = g.a.d;
function h(a) {
  return a
}
var k = ["cljs", "core", "set_print_fn_BANG_"], l = this;
!(k[0] in l) && l.execScript && l.execScript("var " + k[0]);
for(var m;k.length && (m = k.shift());) {
  var n;
  if(n = !k.length) {
    n = void 0 !== h
  }
  n ? l[m] = h : l = l[m] ? l[m] : l[m] = {}
}
function p(a) {
  var b = "string" == typeof a;
  return b ? "\ufdd0" !== a.charAt(0) : b
}
function q(a, b) {
  return a[f(b == d ? d : b)] ? !0 : a._ ? !0 : !1
}
function r(a) {
  return a == d ? d : a.constructor
}
function v(a, b) {
  var c = r.call(d, b), c = (c != d && !1 !== c ? c.k : c) != d && !1 !== (c != d && !1 !== c ? c.k : c) ? c.l : f(b);
  return Error(["No protocol method ", a, " defined for type ", c, ": ", b].join(""))
}
var w = {}, x, y = d;
function z(a, b) {
  if(a ? a.g : a) {
    return a.g(a, b)
  }
  var c;
  c = x[f(a == d ? d : a)];
  if(!c && (c = x._, !c)) {
    throw v.call(d, "ILookup.-lookup", a);
  }
  return c.call(d, a, b)
}
function A(a, b, c) {
  if(a ? a.h : a) {
    return a.h(a, b, c)
  }
  var e;
  e = x[f(a == d ? d : a)];
  if(!e && (e = x._, !e)) {
    throw v.call(d, "ILookup.-lookup", a);
  }
  return e.call(d, a, b, c)
}
y = function(a, b, c) {
  switch(arguments.length) {
    case 2:
      return z.call(this, a, b);
    case 3:
      return A.call(this, a, b, c)
  }
  throw Error("Invalid arity: " + arguments.length);
};
y.b = z;
y.c = A;
x = y;
var B, C = d;
function D(a, b) {
  var c;
  if(a == d) {
    c = d
  }else {
    if(c = a) {
      c = (c = a.j & 256) ? c : a.e
    }
    c = c ? x.call(d, a, b) : a instanceof Array ? b < a.length ? a[b] : d : p.call(d, a) ? b < a.length ? a[b] : d : q.call(d, w, a) ? x.call(d, a, b) : d
  }
  return c
}
function E(a, b, c) {
  if(a != d) {
    var e;
    if(e = a) {
      e = (e = a.j & 256) ? e : a.e
    }
    a = e ? x.call(d, a, b, c) : a instanceof Array ? b < a.length ? a[b] : c : p.call(d, a) ? b < a.length ? a[b] : c : q.call(d, w, a) ? x.call(d, a, b, c) : c
  }else {
    a = c
  }
  return a
}
C = function(a, b, c) {
  switch(arguments.length) {
    case 2:
      return D.call(this, a, b);
    case 3:
      return E.call(this, a, b, c)
  }
  throw Error("Invalid arity: " + arguments.length);
};
C.b = D;
C.c = E;
B = C;
var G = d, G = function(a, b, c) {
  switch(arguments.length) {
    case 2:
      return B.call(d, b, this.toString());
    case 3:
      return B.call(d, b, this.toString(), c)
  }
  throw Error("Invalid arity: " + arguments.length);
};
String.prototype.call = G;
String.prototype.apply = function(a, b) {
  return a.call.apply(a, [a].concat(b.slice()))
};
String.prototype.apply = function(a, b) {
  return 2 > b.length ? B.call(d, b[0], a) : B.call(d, b[0], a, b[1])
};
var H = document.getElementById("qr_str").value;
(new QRCode(document.getElementById("qrcode"), {width:250, height:250})).makeCode(H);

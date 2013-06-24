var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf(x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__5818__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__5818 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5818__delegate.call(this, array, i, idxs)
    };
    G__5818.cljs$lang$maxFixedArity = 2;
    G__5818.cljs$lang$applyTo = function(arglist__5819) {
      var array = cljs.core.first(arglist__5819);
      var i = cljs.core.first(cljs.core.next(arglist__5819));
      var idxs = cljs.core.rest(cljs.core.next(arglist__5819));
      return G__5818__delegate(array, i, idxs)
    };
    G__5818.cljs$lang$arity$variadic = G__5818__delegate;
    return G__5818
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto____5883 = this$;
      if(and__3941__auto____5883) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____5883
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3943__auto____5884 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5884) {
          return or__3943__auto____5884
        }else {
          var or__3943__auto____5885 = cljs.core._invoke["_"];
          if(or__3943__auto____5885) {
            return or__3943__auto____5885
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____5886 = this$;
      if(and__3941__auto____5886) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____5886
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3943__auto____5887 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5887) {
          return or__3943__auto____5887
        }else {
          var or__3943__auto____5888 = cljs.core._invoke["_"];
          if(or__3943__auto____5888) {
            return or__3943__auto____5888
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____5889 = this$;
      if(and__3941__auto____5889) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____5889
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3943__auto____5890 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5890) {
          return or__3943__auto____5890
        }else {
          var or__3943__auto____5891 = cljs.core._invoke["_"];
          if(or__3943__auto____5891) {
            return or__3943__auto____5891
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____5892 = this$;
      if(and__3941__auto____5892) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____5892
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3943__auto____5893 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5893) {
          return or__3943__auto____5893
        }else {
          var or__3943__auto____5894 = cljs.core._invoke["_"];
          if(or__3943__auto____5894) {
            return or__3943__auto____5894
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____5895 = this$;
      if(and__3941__auto____5895) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____5895
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3943__auto____5896 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5896) {
          return or__3943__auto____5896
        }else {
          var or__3943__auto____5897 = cljs.core._invoke["_"];
          if(or__3943__auto____5897) {
            return or__3943__auto____5897
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____5898 = this$;
      if(and__3941__auto____5898) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____5898
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3943__auto____5899 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5899) {
          return or__3943__auto____5899
        }else {
          var or__3943__auto____5900 = cljs.core._invoke["_"];
          if(or__3943__auto____5900) {
            return or__3943__auto____5900
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____5901 = this$;
      if(and__3941__auto____5901) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____5901
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3943__auto____5902 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5902) {
          return or__3943__auto____5902
        }else {
          var or__3943__auto____5903 = cljs.core._invoke["_"];
          if(or__3943__auto____5903) {
            return or__3943__auto____5903
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____5904 = this$;
      if(and__3941__auto____5904) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____5904
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3943__auto____5905 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5905) {
          return or__3943__auto____5905
        }else {
          var or__3943__auto____5906 = cljs.core._invoke["_"];
          if(or__3943__auto____5906) {
            return or__3943__auto____5906
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____5907 = this$;
      if(and__3941__auto____5907) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____5907
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3943__auto____5908 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5908) {
          return or__3943__auto____5908
        }else {
          var or__3943__auto____5909 = cljs.core._invoke["_"];
          if(or__3943__auto____5909) {
            return or__3943__auto____5909
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____5910 = this$;
      if(and__3941__auto____5910) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____5910
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3943__auto____5911 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5911) {
          return or__3943__auto____5911
        }else {
          var or__3943__auto____5912 = cljs.core._invoke["_"];
          if(or__3943__auto____5912) {
            return or__3943__auto____5912
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____5913 = this$;
      if(and__3941__auto____5913) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____5913
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3943__auto____5914 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5914) {
          return or__3943__auto____5914
        }else {
          var or__3943__auto____5915 = cljs.core._invoke["_"];
          if(or__3943__auto____5915) {
            return or__3943__auto____5915
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____5916 = this$;
      if(and__3941__auto____5916) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____5916
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3943__auto____5917 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5917) {
          return or__3943__auto____5917
        }else {
          var or__3943__auto____5918 = cljs.core._invoke["_"];
          if(or__3943__auto____5918) {
            return or__3943__auto____5918
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____5919 = this$;
      if(and__3941__auto____5919) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____5919
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3943__auto____5920 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5920) {
          return or__3943__auto____5920
        }else {
          var or__3943__auto____5921 = cljs.core._invoke["_"];
          if(or__3943__auto____5921) {
            return or__3943__auto____5921
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____5922 = this$;
      if(and__3941__auto____5922) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____5922
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3943__auto____5923 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5923) {
          return or__3943__auto____5923
        }else {
          var or__3943__auto____5924 = cljs.core._invoke["_"];
          if(or__3943__auto____5924) {
            return or__3943__auto____5924
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____5925 = this$;
      if(and__3941__auto____5925) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____5925
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3943__auto____5926 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5926) {
          return or__3943__auto____5926
        }else {
          var or__3943__auto____5927 = cljs.core._invoke["_"];
          if(or__3943__auto____5927) {
            return or__3943__auto____5927
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____5928 = this$;
      if(and__3941__auto____5928) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____5928
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3943__auto____5929 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5929) {
          return or__3943__auto____5929
        }else {
          var or__3943__auto____5930 = cljs.core._invoke["_"];
          if(or__3943__auto____5930) {
            return or__3943__auto____5930
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____5931 = this$;
      if(and__3941__auto____5931) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____5931
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3943__auto____5932 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5932) {
          return or__3943__auto____5932
        }else {
          var or__3943__auto____5933 = cljs.core._invoke["_"];
          if(or__3943__auto____5933) {
            return or__3943__auto____5933
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____5934 = this$;
      if(and__3941__auto____5934) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____5934
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3943__auto____5935 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5935) {
          return or__3943__auto____5935
        }else {
          var or__3943__auto____5936 = cljs.core._invoke["_"];
          if(or__3943__auto____5936) {
            return or__3943__auto____5936
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____5937 = this$;
      if(and__3941__auto____5937) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____5937
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3943__auto____5938 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5938) {
          return or__3943__auto____5938
        }else {
          var or__3943__auto____5939 = cljs.core._invoke["_"];
          if(or__3943__auto____5939) {
            return or__3943__auto____5939
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____5940 = this$;
      if(and__3941__auto____5940) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____5940
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3943__auto____5941 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5941) {
          return or__3943__auto____5941
        }else {
          var or__3943__auto____5942 = cljs.core._invoke["_"];
          if(or__3943__auto____5942) {
            return or__3943__auto____5942
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____5943 = this$;
      if(and__3941__auto____5943) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____5943
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3943__auto____5944 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3943__auto____5944) {
          return or__3943__auto____5944
        }else {
          var or__3943__auto____5945 = cljs.core._invoke["_"];
          if(or__3943__auto____5945) {
            return or__3943__auto____5945
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto____5949 = coll;
    if(and__3941__auto____5949) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____5949
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5950 = cljs.core._count[goog.typeOf(coll)];
      if(or__3943__auto____5950) {
        return or__3943__auto____5950
      }else {
        var or__3943__auto____5951 = cljs.core._count["_"];
        if(or__3943__auto____5951) {
          return or__3943__auto____5951
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto____5955 = coll;
    if(and__3941__auto____5955) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____5955
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5956 = cljs.core._empty[goog.typeOf(coll)];
      if(or__3943__auto____5956) {
        return or__3943__auto____5956
      }else {
        var or__3943__auto____5957 = cljs.core._empty["_"];
        if(or__3943__auto____5957) {
          return or__3943__auto____5957
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto____5961 = coll;
    if(and__3941__auto____5961) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____5961
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3943__auto____5962 = cljs.core._conj[goog.typeOf(coll)];
      if(or__3943__auto____5962) {
        return or__3943__auto____5962
      }else {
        var or__3943__auto____5963 = cljs.core._conj["_"];
        if(or__3943__auto____5963) {
          return or__3943__auto____5963
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto____5970 = coll;
      if(and__3941__auto____5970) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____5970
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3943__auto____5971 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3943__auto____5971) {
          return or__3943__auto____5971
        }else {
          var or__3943__auto____5972 = cljs.core._nth["_"];
          if(or__3943__auto____5972) {
            return or__3943__auto____5972
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____5973 = coll;
      if(and__3941__auto____5973) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____5973
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3943__auto____5974 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3943__auto____5974) {
          return or__3943__auto____5974
        }else {
          var or__3943__auto____5975 = cljs.core._nth["_"];
          if(or__3943__auto____5975) {
            return or__3943__auto____5975
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto____5979 = coll;
    if(and__3941__auto____5979) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____5979
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5980 = cljs.core._first[goog.typeOf(coll)];
      if(or__3943__auto____5980) {
        return or__3943__auto____5980
      }else {
        var or__3943__auto____5981 = cljs.core._first["_"];
        if(or__3943__auto____5981) {
          return or__3943__auto____5981
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____5985 = coll;
    if(and__3941__auto____5985) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____5985
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5986 = cljs.core._rest[goog.typeOf(coll)];
      if(or__3943__auto____5986) {
        return or__3943__auto____5986
      }else {
        var or__3943__auto____5987 = cljs.core._rest["_"];
        if(or__3943__auto____5987) {
          return or__3943__auto____5987
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto____5991 = coll;
    if(and__3941__auto____5991) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____5991
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____5992 = cljs.core._next[goog.typeOf(coll)];
      if(or__3943__auto____5992) {
        return or__3943__auto____5992
      }else {
        var or__3943__auto____5993 = cljs.core._next["_"];
        if(or__3943__auto____5993) {
          return or__3943__auto____5993
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto____6000 = o;
      if(and__3941__auto____6000) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____6000
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3943__auto____6001 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3943__auto____6001) {
          return or__3943__auto____6001
        }else {
          var or__3943__auto____6002 = cljs.core._lookup["_"];
          if(or__3943__auto____6002) {
            return or__3943__auto____6002
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____6003 = o;
      if(and__3941__auto____6003) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____6003
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3943__auto____6004 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3943__auto____6004) {
          return or__3943__auto____6004
        }else {
          var or__3943__auto____6005 = cljs.core._lookup["_"];
          if(or__3943__auto____6005) {
            return or__3943__auto____6005
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto____6009 = coll;
    if(and__3941__auto____6009) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____6009
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3943__auto____6010 = cljs.core._contains_key_QMARK_[goog.typeOf(coll)];
      if(or__3943__auto____6010) {
        return or__3943__auto____6010
      }else {
        var or__3943__auto____6011 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____6011) {
          return or__3943__auto____6011
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____6015 = coll;
    if(and__3941__auto____6015) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____6015
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3943__auto____6016 = cljs.core._assoc[goog.typeOf(coll)];
      if(or__3943__auto____6016) {
        return or__3943__auto____6016
      }else {
        var or__3943__auto____6017 = cljs.core._assoc["_"];
        if(or__3943__auto____6017) {
          return or__3943__auto____6017
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto____6021 = coll;
    if(and__3941__auto____6021) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____6021
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3943__auto____6022 = cljs.core._dissoc[goog.typeOf(coll)];
      if(or__3943__auto____6022) {
        return or__3943__auto____6022
      }else {
        var or__3943__auto____6023 = cljs.core._dissoc["_"];
        if(or__3943__auto____6023) {
          return or__3943__auto____6023
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto____6027 = coll;
    if(and__3941__auto____6027) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____6027
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6028 = cljs.core._key[goog.typeOf(coll)];
      if(or__3943__auto____6028) {
        return or__3943__auto____6028
      }else {
        var or__3943__auto____6029 = cljs.core._key["_"];
        if(or__3943__auto____6029) {
          return or__3943__auto____6029
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____6033 = coll;
    if(and__3941__auto____6033) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____6033
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6034 = cljs.core._val[goog.typeOf(coll)];
      if(or__3943__auto____6034) {
        return or__3943__auto____6034
      }else {
        var or__3943__auto____6035 = cljs.core._val["_"];
        if(or__3943__auto____6035) {
          return or__3943__auto____6035
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto____6039 = coll;
    if(and__3941__auto____6039) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____6039
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3943__auto____6040 = cljs.core._disjoin[goog.typeOf(coll)];
      if(or__3943__auto____6040) {
        return or__3943__auto____6040
      }else {
        var or__3943__auto____6041 = cljs.core._disjoin["_"];
        if(or__3943__auto____6041) {
          return or__3943__auto____6041
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto____6045 = coll;
    if(and__3941__auto____6045) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____6045
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6046 = cljs.core._peek[goog.typeOf(coll)];
      if(or__3943__auto____6046) {
        return or__3943__auto____6046
      }else {
        var or__3943__auto____6047 = cljs.core._peek["_"];
        if(or__3943__auto____6047) {
          return or__3943__auto____6047
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____6051 = coll;
    if(and__3941__auto____6051) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____6051
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6052 = cljs.core._pop[goog.typeOf(coll)];
      if(or__3943__auto____6052) {
        return or__3943__auto____6052
      }else {
        var or__3943__auto____6053 = cljs.core._pop["_"];
        if(or__3943__auto____6053) {
          return or__3943__auto____6053
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto____6057 = coll;
    if(and__3941__auto____6057) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____6057
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3943__auto____6058 = cljs.core._assoc_n[goog.typeOf(coll)];
      if(or__3943__auto____6058) {
        return or__3943__auto____6058
      }else {
        var or__3943__auto____6059 = cljs.core._assoc_n["_"];
        if(or__3943__auto____6059) {
          return or__3943__auto____6059
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto____6063 = o;
    if(and__3941__auto____6063) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____6063
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6064 = cljs.core._deref[goog.typeOf(o)];
      if(or__3943__auto____6064) {
        return or__3943__auto____6064
      }else {
        var or__3943__auto____6065 = cljs.core._deref["_"];
        if(or__3943__auto____6065) {
          return or__3943__auto____6065
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto____6069 = o;
    if(and__3941__auto____6069) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____6069
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3943__auto____6070 = cljs.core._deref_with_timeout[goog.typeOf(o)];
      if(or__3943__auto____6070) {
        return or__3943__auto____6070
      }else {
        var or__3943__auto____6071 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____6071) {
          return or__3943__auto____6071
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto____6075 = o;
    if(and__3941__auto____6075) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____6075
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6076 = cljs.core._meta[goog.typeOf(o)];
      if(or__3943__auto____6076) {
        return or__3943__auto____6076
      }else {
        var or__3943__auto____6077 = cljs.core._meta["_"];
        if(or__3943__auto____6077) {
          return or__3943__auto____6077
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto____6081 = o;
    if(and__3941__auto____6081) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____6081
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3943__auto____6082 = cljs.core._with_meta[goog.typeOf(o)];
      if(or__3943__auto____6082) {
        return or__3943__auto____6082
      }else {
        var or__3943__auto____6083 = cljs.core._with_meta["_"];
        if(or__3943__auto____6083) {
          return or__3943__auto____6083
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto____6090 = coll;
      if(and__3941__auto____6090) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____6090
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3943__auto____6091 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3943__auto____6091) {
          return or__3943__auto____6091
        }else {
          var or__3943__auto____6092 = cljs.core._reduce["_"];
          if(or__3943__auto____6092) {
            return or__3943__auto____6092
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____6093 = coll;
      if(and__3941__auto____6093) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____6093
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3943__auto____6094 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3943__auto____6094) {
          return or__3943__auto____6094
        }else {
          var or__3943__auto____6095 = cljs.core._reduce["_"];
          if(or__3943__auto____6095) {
            return or__3943__auto____6095
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto____6099 = coll;
    if(and__3941__auto____6099) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____6099
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3943__auto____6100 = cljs.core._kv_reduce[goog.typeOf(coll)];
      if(or__3943__auto____6100) {
        return or__3943__auto____6100
      }else {
        var or__3943__auto____6101 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____6101) {
          return or__3943__auto____6101
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto____6105 = o;
    if(and__3941__auto____6105) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____6105
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3943__auto____6106 = cljs.core._equiv[goog.typeOf(o)];
      if(or__3943__auto____6106) {
        return or__3943__auto____6106
      }else {
        var or__3943__auto____6107 = cljs.core._equiv["_"];
        if(or__3943__auto____6107) {
          return or__3943__auto____6107
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto____6111 = o;
    if(and__3941__auto____6111) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____6111
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6112 = cljs.core._hash[goog.typeOf(o)];
      if(or__3943__auto____6112) {
        return or__3943__auto____6112
      }else {
        var or__3943__auto____6113 = cljs.core._hash["_"];
        if(or__3943__auto____6113) {
          return or__3943__auto____6113
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto____6117 = o;
    if(and__3941__auto____6117) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____6117
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3943__auto____6118 = cljs.core._seq[goog.typeOf(o)];
      if(or__3943__auto____6118) {
        return or__3943__auto____6118
      }else {
        var or__3943__auto____6119 = cljs.core._seq["_"];
        if(or__3943__auto____6119) {
          return or__3943__auto____6119
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto____6123 = coll;
    if(and__3941__auto____6123) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____6123
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6124 = cljs.core._rseq[goog.typeOf(coll)];
      if(or__3943__auto____6124) {
        return or__3943__auto____6124
      }else {
        var or__3943__auto____6125 = cljs.core._rseq["_"];
        if(or__3943__auto____6125) {
          return or__3943__auto____6125
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6129 = coll;
    if(and__3941__auto____6129) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____6129
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3943__auto____6130 = cljs.core._sorted_seq[goog.typeOf(coll)];
      if(or__3943__auto____6130) {
        return or__3943__auto____6130
      }else {
        var or__3943__auto____6131 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____6131) {
          return or__3943__auto____6131
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6135 = coll;
    if(and__3941__auto____6135) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____6135
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3943__auto____6136 = cljs.core._sorted_seq_from[goog.typeOf(coll)];
      if(or__3943__auto____6136) {
        return or__3943__auto____6136
      }else {
        var or__3943__auto____6137 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____6137) {
          return or__3943__auto____6137
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____6141 = coll;
    if(and__3941__auto____6141) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____6141
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3943__auto____6142 = cljs.core._entry_key[goog.typeOf(coll)];
      if(or__3943__auto____6142) {
        return or__3943__auto____6142
      }else {
        var or__3943__auto____6143 = cljs.core._entry_key["_"];
        if(or__3943__auto____6143) {
          return or__3943__auto____6143
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____6147 = coll;
    if(and__3941__auto____6147) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____6147
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6148 = cljs.core._comparator[goog.typeOf(coll)];
      if(or__3943__auto____6148) {
        return or__3943__auto____6148
      }else {
        var or__3943__auto____6149 = cljs.core._comparator["_"];
        if(or__3943__auto____6149) {
          return or__3943__auto____6149
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto____6153 = o;
    if(and__3941__auto____6153) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____6153
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3943__auto____6154 = cljs.core._pr_seq[goog.typeOf(o)];
      if(or__3943__auto____6154) {
        return or__3943__auto____6154
      }else {
        var or__3943__auto____6155 = cljs.core._pr_seq["_"];
        if(or__3943__auto____6155) {
          return or__3943__auto____6155
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto____6159 = d;
    if(and__3941__auto____6159) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____6159
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3943__auto____6160 = cljs.core._realized_QMARK_[goog.typeOf(d)];
      if(or__3943__auto____6160) {
        return or__3943__auto____6160
      }else {
        var or__3943__auto____6161 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____6161) {
          return or__3943__auto____6161
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto____6165 = this$;
    if(and__3941__auto____6165) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____6165
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3943__auto____6166 = cljs.core._notify_watches[goog.typeOf(this$)];
      if(or__3943__auto____6166) {
        return or__3943__auto____6166
      }else {
        var or__3943__auto____6167 = cljs.core._notify_watches["_"];
        if(or__3943__auto____6167) {
          return or__3943__auto____6167
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____6171 = this$;
    if(and__3941__auto____6171) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____6171
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3943__auto____6172 = cljs.core._add_watch[goog.typeOf(this$)];
      if(or__3943__auto____6172) {
        return or__3943__auto____6172
      }else {
        var or__3943__auto____6173 = cljs.core._add_watch["_"];
        if(or__3943__auto____6173) {
          return or__3943__auto____6173
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____6177 = this$;
    if(and__3941__auto____6177) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____6177
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3943__auto____6178 = cljs.core._remove_watch[goog.typeOf(this$)];
      if(or__3943__auto____6178) {
        return or__3943__auto____6178
      }else {
        var or__3943__auto____6179 = cljs.core._remove_watch["_"];
        if(or__3943__auto____6179) {
          return or__3943__auto____6179
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto____6183 = coll;
    if(and__3941__auto____6183) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____6183
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6184 = cljs.core._as_transient[goog.typeOf(coll)];
      if(or__3943__auto____6184) {
        return or__3943__auto____6184
      }else {
        var or__3943__auto____6185 = cljs.core._as_transient["_"];
        if(or__3943__auto____6185) {
          return or__3943__auto____6185
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto____6189 = tcoll;
    if(and__3941__auto____6189) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____6189
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3943__auto____6190 = cljs.core._conj_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6190) {
        return or__3943__auto____6190
      }else {
        var or__3943__auto____6191 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____6191) {
          return or__3943__auto____6191
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6195 = tcoll;
    if(and__3941__auto____6195) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____6195
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3943__auto____6196 = cljs.core._persistent_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6196) {
        return or__3943__auto____6196
      }else {
        var or__3943__auto____6197 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____6197) {
          return or__3943__auto____6197
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto____6201 = tcoll;
    if(and__3941__auto____6201) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____6201
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3943__auto____6202 = cljs.core._assoc_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6202) {
        return or__3943__auto____6202
      }else {
        var or__3943__auto____6203 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____6203) {
          return or__3943__auto____6203
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto____6207 = tcoll;
    if(and__3941__auto____6207) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____6207
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3943__auto____6208 = cljs.core._dissoc_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6208) {
        return or__3943__auto____6208
      }else {
        var or__3943__auto____6209 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____6209) {
          return or__3943__auto____6209
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto____6213 = tcoll;
    if(and__3941__auto____6213) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____6213
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3943__auto____6214 = cljs.core._assoc_n_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6214) {
        return or__3943__auto____6214
      }else {
        var or__3943__auto____6215 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____6215) {
          return or__3943__auto____6215
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6219 = tcoll;
    if(and__3941__auto____6219) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____6219
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3943__auto____6220 = cljs.core._pop_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6220) {
        return or__3943__auto____6220
      }else {
        var or__3943__auto____6221 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____6221) {
          return or__3943__auto____6221
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto____6225 = tcoll;
    if(and__3941__auto____6225) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____6225
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3943__auto____6226 = cljs.core._disjoin_BANG_[goog.typeOf(tcoll)];
      if(or__3943__auto____6226) {
        return or__3943__auto____6226
      }else {
        var or__3943__auto____6227 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____6227) {
          return or__3943__auto____6227
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
void 0;
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto____6231 = x;
    if(and__3941__auto____6231) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____6231
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    return function() {
      var or__3943__auto____6232 = cljs.core._compare[goog.typeOf(x)];
      if(or__3943__auto____6232) {
        return or__3943__auto____6232
      }else {
        var or__3943__auto____6233 = cljs.core._compare["_"];
        if(or__3943__auto____6233) {
          return or__3943__auto____6233
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
void 0;
void 0;
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto____6237 = coll;
    if(and__3941__auto____6237) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____6237
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6238 = cljs.core._drop_first[goog.typeOf(coll)];
      if(or__3943__auto____6238) {
        return or__3943__auto____6238
      }else {
        var or__3943__auto____6239 = cljs.core._drop_first["_"];
        if(or__3943__auto____6239) {
          return or__3943__auto____6239
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto____6243 = coll;
    if(and__3941__auto____6243) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____6243
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6244 = cljs.core._chunked_first[goog.typeOf(coll)];
      if(or__3943__auto____6244) {
        return or__3943__auto____6244
      }else {
        var or__3943__auto____6245 = cljs.core._chunked_first["_"];
        if(or__3943__auto____6245) {
          return or__3943__auto____6245
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____6249 = coll;
    if(and__3941__auto____6249) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____6249
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6250 = cljs.core._chunked_rest[goog.typeOf(coll)];
      if(or__3943__auto____6250) {
        return or__3943__auto____6250
      }else {
        var or__3943__auto____6251 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____6251) {
          return or__3943__auto____6251
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto____6255 = coll;
    if(and__3941__auto____6255) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____6255
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    return function() {
      var or__3943__auto____6256 = cljs.core._chunked_next[goog.typeOf(coll)];
      if(or__3943__auto____6256) {
        return or__3943__auto____6256
      }else {
        var or__3943__auto____6257 = cljs.core._chunked_next["_"];
        if(or__3943__auto____6257) {
          return or__3943__auto____6257
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto____6259 = x === y;
    if(or__3943__auto____6259) {
      return or__3943__auto____6259
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6260__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6261 = y;
            var G__6262 = cljs.core.first.call(null, more);
            var G__6263 = cljs.core.next.call(null, more);
            x = G__6261;
            y = G__6262;
            more = G__6263;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6260 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6260__delegate.call(this, x, y, more)
    };
    G__6260.cljs$lang$maxFixedArity = 2;
    G__6260.cljs$lang$applyTo = function(arglist__6264) {
      var x = cljs.core.first(arglist__6264);
      var y = cljs.core.first(cljs.core.next(arglist__6264));
      var more = cljs.core.rest(cljs.core.next(arglist__6264));
      return G__6260__delegate(x, y, more)
    };
    G__6260.cljs$lang$arity$variadic = G__6260__delegate;
    return G__6260
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6265 = null;
  var G__6265__2 = function(o, k) {
    return null
  };
  var G__6265__3 = function(o, k, not_found) {
    return not_found
  };
  G__6265 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6265__2.call(this, o, k);
      case 3:
        return G__6265__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6265
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6266 = null;
  var G__6266__2 = function(_, f) {
    return f.call(null)
  };
  var G__6266__3 = function(_, f, start) {
    return start
  };
  G__6266 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6266__2.call(this, _, f);
      case 3:
        return G__6266__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6266
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6267 = null;
  var G__6267__2 = function(_, n) {
    return null
  };
  var G__6267__3 = function(_, n, not_found) {
    return not_found
  };
  G__6267 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6267__2.call(this, _, n);
      case 3:
        return G__6267__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6267
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6280 = cljs.core._count.call(null, cicoll);
    if(cnt__6280 === 0) {
      return f.call(null)
    }else {
      var val__6281 = cljs.core._nth.call(null, cicoll, 0);
      var n__6282 = 1;
      while(true) {
        if(n__6282 < cnt__6280) {
          var nval__6283 = f.call(null, val__6281, cljs.core._nth.call(null, cicoll, n__6282));
          if(cljs.core.reduced_QMARK_.call(null, nval__6283)) {
            return cljs.core.deref.call(null, nval__6283)
          }else {
            var G__6292 = nval__6283;
            var G__6293 = n__6282 + 1;
            val__6281 = G__6292;
            n__6282 = G__6293;
            continue
          }
        }else {
          return val__6281
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6284 = cljs.core._count.call(null, cicoll);
    var val__6285 = val;
    var n__6286 = 0;
    while(true) {
      if(n__6286 < cnt__6284) {
        var nval__6287 = f.call(null, val__6285, cljs.core._nth.call(null, cicoll, n__6286));
        if(cljs.core.reduced_QMARK_.call(null, nval__6287)) {
          return cljs.core.deref.call(null, nval__6287)
        }else {
          var G__6294 = nval__6287;
          var G__6295 = n__6286 + 1;
          val__6285 = G__6294;
          n__6286 = G__6295;
          continue
        }
      }else {
        return val__6285
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6288 = cljs.core._count.call(null, cicoll);
    var val__6289 = val;
    var n__6290 = idx;
    while(true) {
      if(n__6290 < cnt__6288) {
        var nval__6291 = f.call(null, val__6289, cljs.core._nth.call(null, cicoll, n__6290));
        if(cljs.core.reduced_QMARK_.call(null, nval__6291)) {
          return cljs.core.deref.call(null, nval__6291)
        }else {
          var G__6296 = nval__6291;
          var G__6297 = n__6290 + 1;
          val__6289 = G__6296;
          n__6290 = G__6297;
          continue
        }
      }else {
        return val__6289
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6310 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6311 = arr[0];
      var n__6312 = 1;
      while(true) {
        if(n__6312 < cnt__6310) {
          var nval__6313 = f.call(null, val__6311, arr[n__6312]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6313)) {
            return cljs.core.deref.call(null, nval__6313)
          }else {
            var G__6322 = nval__6313;
            var G__6323 = n__6312 + 1;
            val__6311 = G__6322;
            n__6312 = G__6323;
            continue
          }
        }else {
          return val__6311
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6314 = arr.length;
    var val__6315 = val;
    var n__6316 = 0;
    while(true) {
      if(n__6316 < cnt__6314) {
        var nval__6317 = f.call(null, val__6315, arr[n__6316]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6317)) {
          return cljs.core.deref.call(null, nval__6317)
        }else {
          var G__6324 = nval__6317;
          var G__6325 = n__6316 + 1;
          val__6315 = G__6324;
          n__6316 = G__6325;
          continue
        }
      }else {
        return val__6315
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6318 = arr.length;
    var val__6319 = val;
    var n__6320 = idx;
    while(true) {
      if(n__6320 < cnt__6318) {
        var nval__6321 = f.call(null, val__6319, arr[n__6320]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6321)) {
          return cljs.core.deref.call(null, nval__6321)
        }else {
          var G__6326 = nval__6321;
          var G__6327 = n__6320 + 1;
          val__6319 = G__6326;
          n__6320 = G__6327;
          continue
        }
      }else {
        return val__6319
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6328 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6329 = this;
  if(this__6329.i + 1 < this__6329.a.length) {
    return new cljs.core.IndexedSeq(this__6329.a, this__6329.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6330 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6331 = this;
  var c__6332 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6332 > 0) {
    return new cljs.core.RSeq(coll, c__6332 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6333 = this;
  var this__6334 = this;
  return cljs.core.pr_str.call(null, this__6334)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6335 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6335.a)) {
    return cljs.core.ci_reduce.call(null, this__6335.a, f, this__6335.a[this__6335.i], this__6335.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6335.a[this__6335.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6336 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6336.a)) {
    return cljs.core.ci_reduce.call(null, this__6336.a, f, start, this__6336.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6337 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6338 = this;
  return this__6338.a.length - this__6338.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6339 = this;
  return this__6339.a[this__6339.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6340 = this;
  if(this__6340.i + 1 < this__6340.a.length) {
    return new cljs.core.IndexedSeq(this__6340.a, this__6340.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6341 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6342 = this;
  var i__6343 = n + this__6342.i;
  if(i__6343 < this__6342.a.length) {
    return this__6342.a[i__6343]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6344 = this;
  var i__6345 = n + this__6344.i;
  if(i__6345 < this__6344.a.length) {
    return this__6344.a[i__6345]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6346 = null;
  var G__6346__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6346__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6346 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6346__2.call(this, array, f);
      case 3:
        return G__6346__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6346
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6347 = null;
  var G__6347__2 = function(array, k) {
    return array[k]
  };
  var G__6347__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6347 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6347__2.call(this, array, k);
      case 3:
        return G__6347__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6347
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6348 = null;
  var G__6348__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6348__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6348 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6348__2.call(this, array, n);
      case 3:
        return G__6348__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6348
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6349 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6350 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6351 = this;
  var this__6352 = this;
  return cljs.core.pr_str.call(null, this__6352)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6353 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6354 = this;
  return this__6354.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6355 = this;
  return cljs.core._nth.call(null, this__6355.ci, this__6355.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6356 = this;
  if(this__6356.i > 0) {
    return new cljs.core.RSeq(this__6356.ci, this__6356.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6357 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6358 = this;
  return new cljs.core.RSeq(this__6358.ci, this__6358.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6359 = this;
  return this__6359.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6363__6364 = coll;
      if(G__6363__6364) {
        if(function() {
          var or__3943__auto____6365 = G__6363__6364.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____6365) {
            return or__3943__auto____6365
          }else {
            return G__6363__6364.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6363__6364.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6363__6364)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6363__6364)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6370__6371 = coll;
      if(G__6370__6371) {
        if(function() {
          var or__3943__auto____6372 = G__6370__6371.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6372) {
            return or__3943__auto____6372
          }else {
            return G__6370__6371.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6370__6371.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6370__6371)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6370__6371)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6373 = cljs.core.seq.call(null, coll);
      if(s__6373 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6373)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6378__6379 = coll;
      if(G__6378__6379) {
        if(function() {
          var or__3943__auto____6380 = G__6378__6379.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6380) {
            return or__3943__auto____6380
          }else {
            return G__6378__6379.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6378__6379.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6378__6379)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6378__6379)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6381 = cljs.core.seq.call(null, coll);
      if(!(s__6381 == null)) {
        return cljs.core._rest.call(null, s__6381)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6385__6386 = coll;
      if(G__6385__6386) {
        if(function() {
          var or__3943__auto____6387 = G__6385__6386.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____6387) {
            return or__3943__auto____6387
          }else {
            return G__6385__6386.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6385__6386.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6385__6386)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6385__6386)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6389 = cljs.core.next.call(null, s);
    if(!(sn__6389 == null)) {
      var G__6390 = sn__6389;
      s = G__6390;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6391__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6392 = conj.call(null, coll, x);
          var G__6393 = cljs.core.first.call(null, xs);
          var G__6394 = cljs.core.next.call(null, xs);
          coll = G__6392;
          x = G__6393;
          xs = G__6394;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6391 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6391__delegate.call(this, coll, x, xs)
    };
    G__6391.cljs$lang$maxFixedArity = 2;
    G__6391.cljs$lang$applyTo = function(arglist__6395) {
      var coll = cljs.core.first(arglist__6395);
      var x = cljs.core.first(cljs.core.next(arglist__6395));
      var xs = cljs.core.rest(cljs.core.next(arglist__6395));
      return G__6391__delegate(coll, x, xs)
    };
    G__6391.cljs$lang$arity$variadic = G__6391__delegate;
    return G__6391
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6398 = cljs.core.seq.call(null, coll);
  var acc__6399 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6398)) {
      return acc__6399 + cljs.core._count.call(null, s__6398)
    }else {
      var G__6400 = cljs.core.next.call(null, s__6398);
      var G__6401 = acc__6399 + 1;
      s__6398 = G__6400;
      acc__6399 = G__6401;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6408__6409 = coll;
        if(G__6408__6409) {
          if(function() {
            var or__3943__auto____6410 = G__6408__6409.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6410) {
              return or__3943__auto____6410
            }else {
              return G__6408__6409.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6408__6409.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6408__6409)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6408__6409)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6411__6412 = coll;
        if(G__6411__6412) {
          if(function() {
            var or__3943__auto____6413 = G__6411__6412.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6413) {
              return or__3943__auto____6413
            }else {
              return G__6411__6412.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6411__6412.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6411__6412)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6411__6412)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6416__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6415 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6417 = ret__6415;
          var G__6418 = cljs.core.first.call(null, kvs);
          var G__6419 = cljs.core.second.call(null, kvs);
          var G__6420 = cljs.core.nnext.call(null, kvs);
          coll = G__6417;
          k = G__6418;
          v = G__6419;
          kvs = G__6420;
          continue
        }else {
          return ret__6415
        }
        break
      }
    };
    var G__6416 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6416__delegate.call(this, coll, k, v, kvs)
    };
    G__6416.cljs$lang$maxFixedArity = 3;
    G__6416.cljs$lang$applyTo = function(arglist__6421) {
      var coll = cljs.core.first(arglist__6421);
      var k = cljs.core.first(cljs.core.next(arglist__6421));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6421)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6421)));
      return G__6416__delegate(coll, k, v, kvs)
    };
    G__6416.cljs$lang$arity$variadic = G__6416__delegate;
    return G__6416
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6424__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6423 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6425 = ret__6423;
          var G__6426 = cljs.core.first.call(null, ks);
          var G__6427 = cljs.core.next.call(null, ks);
          coll = G__6425;
          k = G__6426;
          ks = G__6427;
          continue
        }else {
          return ret__6423
        }
        break
      }
    };
    var G__6424 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6424__delegate.call(this, coll, k, ks)
    };
    G__6424.cljs$lang$maxFixedArity = 2;
    G__6424.cljs$lang$applyTo = function(arglist__6428) {
      var coll = cljs.core.first(arglist__6428);
      var k = cljs.core.first(cljs.core.next(arglist__6428));
      var ks = cljs.core.rest(cljs.core.next(arglist__6428));
      return G__6424__delegate(coll, k, ks)
    };
    G__6424.cljs$lang$arity$variadic = G__6424__delegate;
    return G__6424
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6432__6433 = o;
    if(G__6432__6433) {
      if(function() {
        var or__3943__auto____6434 = G__6432__6433.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____6434) {
          return or__3943__auto____6434
        }else {
          return G__6432__6433.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6432__6433.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6432__6433)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6432__6433)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6437__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6436 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6438 = ret__6436;
          var G__6439 = cljs.core.first.call(null, ks);
          var G__6440 = cljs.core.next.call(null, ks);
          coll = G__6438;
          k = G__6439;
          ks = G__6440;
          continue
        }else {
          return ret__6436
        }
        break
      }
    };
    var G__6437 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6437__delegate.call(this, coll, k, ks)
    };
    G__6437.cljs$lang$maxFixedArity = 2;
    G__6437.cljs$lang$applyTo = function(arglist__6441) {
      var coll = cljs.core.first(arglist__6441);
      var k = cljs.core.first(cljs.core.next(arglist__6441));
      var ks = cljs.core.rest(cljs.core.next(arglist__6441));
      return G__6437__delegate(coll, k, ks)
    };
    G__6437.cljs$lang$arity$variadic = G__6437__delegate;
    return G__6437
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6443 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6443;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6443
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6445 = cljs.core.string_hash_cache[k];
  if(!(h__6445 == null)) {
    return h__6445
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto____6447 = goog.isString(o);
      if(and__3941__auto____6447) {
        return check_cache
      }else {
        return and__3941__auto____6447
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6451__6452 = x;
    if(G__6451__6452) {
      if(function() {
        var or__3943__auto____6453 = G__6451__6452.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____6453) {
          return or__3943__auto____6453
        }else {
          return G__6451__6452.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6451__6452.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6451__6452)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6451__6452)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6457__6458 = x;
    if(G__6457__6458) {
      if(function() {
        var or__3943__auto____6459 = G__6457__6458.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____6459) {
          return or__3943__auto____6459
        }else {
          return G__6457__6458.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6457__6458.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6457__6458)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6457__6458)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6463__6464 = x;
  if(G__6463__6464) {
    if(function() {
      var or__3943__auto____6465 = G__6463__6464.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____6465) {
        return or__3943__auto____6465
      }else {
        return G__6463__6464.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6463__6464.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6463__6464)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6463__6464)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6469__6470 = x;
  if(G__6469__6470) {
    if(function() {
      var or__3943__auto____6471 = G__6469__6470.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____6471) {
        return or__3943__auto____6471
      }else {
        return G__6469__6470.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6469__6470.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6469__6470)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6469__6470)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6475__6476 = x;
  if(G__6475__6476) {
    if(function() {
      var or__3943__auto____6477 = G__6475__6476.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____6477) {
        return or__3943__auto____6477
      }else {
        return G__6475__6476.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6475__6476.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6475__6476)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6475__6476)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6481__6482 = x;
  if(G__6481__6482) {
    if(function() {
      var or__3943__auto____6483 = G__6481__6482.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____6483) {
        return or__3943__auto____6483
      }else {
        return G__6481__6482.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6481__6482.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6481__6482)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6481__6482)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6487__6488 = x;
  if(G__6487__6488) {
    if(function() {
      var or__3943__auto____6489 = G__6487__6488.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____6489) {
        return or__3943__auto____6489
      }else {
        return G__6487__6488.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6487__6488.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6487__6488)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6487__6488)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6493__6494 = x;
    if(G__6493__6494) {
      if(function() {
        var or__3943__auto____6495 = G__6493__6494.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____6495) {
          return or__3943__auto____6495
        }else {
          return G__6493__6494.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6493__6494.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6493__6494)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6493__6494)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6499__6500 = x;
  if(G__6499__6500) {
    if(function() {
      var or__3943__auto____6501 = G__6499__6500.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____6501) {
        return or__3943__auto____6501
      }else {
        return G__6499__6500.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6499__6500.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6499__6500)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6499__6500)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6505__6506 = x;
  if(G__6505__6506) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____6507 = null;
      if(cljs.core.truth_(or__3943__auto____6507)) {
        return or__3943__auto____6507
      }else {
        return G__6505__6506.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6505__6506.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6505__6506)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6505__6506)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6508__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6508 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6508__delegate.call(this, keyvals)
    };
    G__6508.cljs$lang$maxFixedArity = 0;
    G__6508.cljs$lang$applyTo = function(arglist__6509) {
      var keyvals = cljs.core.seq(arglist__6509);
      return G__6508__delegate(keyvals)
    };
    G__6508.cljs$lang$arity$variadic = G__6508__delegate;
    return G__6508
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6511 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6511.push(key)
  });
  return keys__6511
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6515 = i;
  var j__6516 = j;
  var len__6517 = len;
  while(true) {
    if(len__6517 === 0) {
      return to
    }else {
      to[j__6516] = from[i__6515];
      var G__6518 = i__6515 + 1;
      var G__6519 = j__6516 + 1;
      var G__6520 = len__6517 - 1;
      i__6515 = G__6518;
      j__6516 = G__6519;
      len__6517 = G__6520;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6524 = i + (len - 1);
  var j__6525 = j + (len - 1);
  var len__6526 = len;
  while(true) {
    if(len__6526 === 0) {
      return to
    }else {
      to[j__6525] = from[i__6524];
      var G__6527 = i__6524 - 1;
      var G__6528 = j__6525 - 1;
      var G__6529 = len__6526 - 1;
      i__6524 = G__6527;
      j__6525 = G__6528;
      len__6526 = G__6529;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6533__6534 = s;
    if(G__6533__6534) {
      if(function() {
        var or__3943__auto____6535 = G__6533__6534.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____6535) {
          return or__3943__auto____6535
        }else {
          return G__6533__6534.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6533__6534.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6533__6534)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6533__6534)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6539__6540 = s;
  if(G__6539__6540) {
    if(function() {
      var or__3943__auto____6541 = G__6539__6540.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____6541) {
        return or__3943__auto____6541
      }else {
        return G__6539__6540.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6539__6540.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6539__6540)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6539__6540)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto____6544 = goog.isString(x);
  if(and__3941__auto____6544) {
    return!function() {
      var or__3943__auto____6545 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____6545) {
        return or__3943__auto____6545
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____6544
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____6547 = goog.isString(x);
  if(and__3941__auto____6547) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____6547
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____6549 = goog.isString(x);
  if(and__3941__auto____6549) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____6549
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____6554 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____6554) {
    return or__3943__auto____6554
  }else {
    var G__6555__6556 = f;
    if(G__6555__6556) {
      if(function() {
        var or__3943__auto____6557 = G__6555__6556.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____6557) {
          return or__3943__auto____6557
        }else {
          return G__6555__6556.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6555__6556.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6555__6556)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6555__6556)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____6559 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____6559) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____6559
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3941__auto____6562 = coll;
    if(cljs.core.truth_(and__3941__auto____6562)) {
      var and__3941__auto____6563 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____6563) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____6563
      }
    }else {
      return and__3941__auto____6562
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__6572__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__6568 = cljs.core.set([y, x]);
        var xs__6569 = more;
        while(true) {
          var x__6570 = cljs.core.first.call(null, xs__6569);
          var etc__6571 = cljs.core.next.call(null, xs__6569);
          if(cljs.core.truth_(xs__6569)) {
            if(cljs.core.contains_QMARK_.call(null, s__6568, x__6570)) {
              return false
            }else {
              var G__6573 = cljs.core.conj.call(null, s__6568, x__6570);
              var G__6574 = etc__6571;
              s__6568 = G__6573;
              xs__6569 = G__6574;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6572 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6572__delegate.call(this, x, y, more)
    };
    G__6572.cljs$lang$maxFixedArity = 2;
    G__6572.cljs$lang$applyTo = function(arglist__6575) {
      var x = cljs.core.first(arglist__6575);
      var y = cljs.core.first(cljs.core.next(arglist__6575));
      var more = cljs.core.rest(cljs.core.next(arglist__6575));
      return G__6572__delegate(x, y, more)
    };
    G__6572.cljs$lang$arity$variadic = G__6572__delegate;
    return G__6572
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__6579__6580 = x;
            if(G__6579__6580) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____6581 = null;
                if(cljs.core.truth_(or__3943__auto____6581)) {
                  return or__3943__auto____6581
                }else {
                  return G__6579__6580.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__6579__6580.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6579__6580)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6579__6580)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__6586 = cljs.core.count.call(null, xs);
    var yl__6587 = cljs.core.count.call(null, ys);
    if(xl__6586 < yl__6587) {
      return-1
    }else {
      if(xl__6586 > yl__6587) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__6586, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__6588 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____6589 = d__6588 === 0;
        if(and__3941__auto____6589) {
          return n + 1 < len
        }else {
          return and__3941__auto____6589
        }
      }()) {
        var G__6590 = xs;
        var G__6591 = ys;
        var G__6592 = len;
        var G__6593 = n + 1;
        xs = G__6590;
        ys = G__6591;
        len = G__6592;
        n = G__6593;
        continue
      }else {
        return d__6588
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__6595 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__6595)) {
        return r__6595
      }else {
        if(cljs.core.truth_(r__6595)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__6597 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__6597, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__6597)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto____6603 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____6603) {
      var s__6604 = temp__4090__auto____6603;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__6604), cljs.core.next.call(null, s__6604))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__6605 = val;
    var coll__6606 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__6606) {
        var nval__6607 = f.call(null, val__6605, cljs.core.first.call(null, coll__6606));
        if(cljs.core.reduced_QMARK_.call(null, nval__6607)) {
          return cljs.core.deref.call(null, nval__6607)
        }else {
          var G__6608 = nval__6607;
          var G__6609 = cljs.core.next.call(null, coll__6606);
          val__6605 = G__6608;
          coll__6606 = G__6609;
          continue
        }
      }else {
        return val__6605
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
void 0;
cljs.core.shuffle = function shuffle(coll) {
  var a__6611 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__6611);
  return cljs.core.vec.call(null, a__6611)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__6618__6619 = coll;
      if(G__6618__6619) {
        if(function() {
          var or__3943__auto____6620 = G__6618__6619.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____6620) {
            return or__3943__auto____6620
          }else {
            return G__6618__6619.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__6618__6619.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6618__6619)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6618__6619)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__6621__6622 = coll;
      if(G__6621__6622) {
        if(function() {
          var or__3943__auto____6623 = G__6621__6622.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____6623) {
            return or__3943__auto____6623
          }else {
            return G__6621__6622.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__6621__6622.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6621__6622)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6621__6622)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__6624 = this;
  return this__6624.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__6625__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__6625 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6625__delegate.call(this, x, y, more)
    };
    G__6625.cljs$lang$maxFixedArity = 2;
    G__6625.cljs$lang$applyTo = function(arglist__6626) {
      var x = cljs.core.first(arglist__6626);
      var y = cljs.core.first(cljs.core.next(arglist__6626));
      var more = cljs.core.rest(cljs.core.next(arglist__6626));
      return G__6625__delegate(x, y, more)
    };
    G__6625.cljs$lang$arity$variadic = G__6625__delegate;
    return G__6625
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__6627__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__6627 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6627__delegate.call(this, x, y, more)
    };
    G__6627.cljs$lang$maxFixedArity = 2;
    G__6627.cljs$lang$applyTo = function(arglist__6628) {
      var x = cljs.core.first(arglist__6628);
      var y = cljs.core.first(cljs.core.next(arglist__6628));
      var more = cljs.core.rest(cljs.core.next(arglist__6628));
      return G__6627__delegate(x, y, more)
    };
    G__6627.cljs$lang$arity$variadic = G__6627__delegate;
    return G__6627
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__6629__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__6629 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6629__delegate.call(this, x, y, more)
    };
    G__6629.cljs$lang$maxFixedArity = 2;
    G__6629.cljs$lang$applyTo = function(arglist__6630) {
      var x = cljs.core.first(arglist__6630);
      var y = cljs.core.first(cljs.core.next(arglist__6630));
      var more = cljs.core.rest(cljs.core.next(arglist__6630));
      return G__6629__delegate(x, y, more)
    };
    G__6629.cljs$lang$arity$variadic = G__6629__delegate;
    return G__6629
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__6631__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__6631 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6631__delegate.call(this, x, y, more)
    };
    G__6631.cljs$lang$maxFixedArity = 2;
    G__6631.cljs$lang$applyTo = function(arglist__6632) {
      var x = cljs.core.first(arglist__6632);
      var y = cljs.core.first(cljs.core.next(arglist__6632));
      var more = cljs.core.rest(cljs.core.next(arglist__6632));
      return G__6631__delegate(x, y, more)
    };
    G__6631.cljs$lang$arity$variadic = G__6631__delegate;
    return G__6631
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__6633__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__6634 = y;
            var G__6635 = cljs.core.first.call(null, more);
            var G__6636 = cljs.core.next.call(null, more);
            x = G__6634;
            y = G__6635;
            more = G__6636;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6633 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6633__delegate.call(this, x, y, more)
    };
    G__6633.cljs$lang$maxFixedArity = 2;
    G__6633.cljs$lang$applyTo = function(arglist__6637) {
      var x = cljs.core.first(arglist__6637);
      var y = cljs.core.first(cljs.core.next(arglist__6637));
      var more = cljs.core.rest(cljs.core.next(arglist__6637));
      return G__6633__delegate(x, y, more)
    };
    G__6633.cljs$lang$arity$variadic = G__6633__delegate;
    return G__6633
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__6638__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6639 = y;
            var G__6640 = cljs.core.first.call(null, more);
            var G__6641 = cljs.core.next.call(null, more);
            x = G__6639;
            y = G__6640;
            more = G__6641;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6638 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6638__delegate.call(this, x, y, more)
    };
    G__6638.cljs$lang$maxFixedArity = 2;
    G__6638.cljs$lang$applyTo = function(arglist__6642) {
      var x = cljs.core.first(arglist__6642);
      var y = cljs.core.first(cljs.core.next(arglist__6642));
      var more = cljs.core.rest(cljs.core.next(arglist__6642));
      return G__6638__delegate(x, y, more)
    };
    G__6638.cljs$lang$arity$variadic = G__6638__delegate;
    return G__6638
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__6643__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__6644 = y;
            var G__6645 = cljs.core.first.call(null, more);
            var G__6646 = cljs.core.next.call(null, more);
            x = G__6644;
            y = G__6645;
            more = G__6646;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6643 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6643__delegate.call(this, x, y, more)
    };
    G__6643.cljs$lang$maxFixedArity = 2;
    G__6643.cljs$lang$applyTo = function(arglist__6647) {
      var x = cljs.core.first(arglist__6647);
      var y = cljs.core.first(cljs.core.next(arglist__6647));
      var more = cljs.core.rest(cljs.core.next(arglist__6647));
      return G__6643__delegate(x, y, more)
    };
    G__6643.cljs$lang$arity$variadic = G__6643__delegate;
    return G__6643
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__6648__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__6649 = y;
            var G__6650 = cljs.core.first.call(null, more);
            var G__6651 = cljs.core.next.call(null, more);
            x = G__6649;
            y = G__6650;
            more = G__6651;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6648 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6648__delegate.call(this, x, y, more)
    };
    G__6648.cljs$lang$maxFixedArity = 2;
    G__6648.cljs$lang$applyTo = function(arglist__6652) {
      var x = cljs.core.first(arglist__6652);
      var y = cljs.core.first(cljs.core.next(arglist__6652));
      var more = cljs.core.rest(cljs.core.next(arglist__6652));
      return G__6648__delegate(x, y, more)
    };
    G__6648.cljs$lang$arity$variadic = G__6648__delegate;
    return G__6648
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__6653__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__6653 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6653__delegate.call(this, x, y, more)
    };
    G__6653.cljs$lang$maxFixedArity = 2;
    G__6653.cljs$lang$applyTo = function(arglist__6654) {
      var x = cljs.core.first(arglist__6654);
      var y = cljs.core.first(cljs.core.next(arglist__6654));
      var more = cljs.core.rest(cljs.core.next(arglist__6654));
      return G__6653__delegate(x, y, more)
    };
    G__6653.cljs$lang$arity$variadic = G__6653__delegate;
    return G__6653
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__6655__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__6655 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6655__delegate.call(this, x, y, more)
    };
    G__6655.cljs$lang$maxFixedArity = 2;
    G__6655.cljs$lang$applyTo = function(arglist__6656) {
      var x = cljs.core.first(arglist__6656);
      var y = cljs.core.first(cljs.core.next(arglist__6656));
      var more = cljs.core.rest(cljs.core.next(arglist__6656));
      return G__6655__delegate(x, y, more)
    };
    G__6655.cljs$lang$arity$variadic = G__6655__delegate;
    return G__6655
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__6658 = n % d;
  return cljs.core.fix.call(null, (n - rem__6658) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__6660 = cljs.core.quot.call(null, n, d);
  return n - d * q__6660
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__6663 = v - (v >> 1 & 1431655765);
  var v__6664 = (v__6663 & 858993459) + (v__6663 >> 2 & 858993459);
  return(v__6664 + (v__6664 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__6665__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6666 = y;
            var G__6667 = cljs.core.first.call(null, more);
            var G__6668 = cljs.core.next.call(null, more);
            x = G__6666;
            y = G__6667;
            more = G__6668;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6665 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6665__delegate.call(this, x, y, more)
    };
    G__6665.cljs$lang$maxFixedArity = 2;
    G__6665.cljs$lang$applyTo = function(arglist__6669) {
      var x = cljs.core.first(arglist__6669);
      var y = cljs.core.first(cljs.core.next(arglist__6669));
      var more = cljs.core.rest(cljs.core.next(arglist__6669));
      return G__6665__delegate(x, y, more)
    };
    G__6665.cljs$lang$arity$variadic = G__6665__delegate;
    return G__6665
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__6673 = n;
  var xs__6674 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____6675 = xs__6674;
      if(and__3941__auto____6675) {
        return n__6673 > 0
      }else {
        return and__3941__auto____6675
      }
    }())) {
      var G__6676 = n__6673 - 1;
      var G__6677 = cljs.core.next.call(null, xs__6674);
      n__6673 = G__6676;
      xs__6674 = G__6677;
      continue
    }else {
      return xs__6674
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__6678__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6679 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__6680 = cljs.core.next.call(null, more);
            sb = G__6679;
            more = G__6680;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__6678 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6678__delegate.call(this, x, ys)
    };
    G__6678.cljs$lang$maxFixedArity = 1;
    G__6678.cljs$lang$applyTo = function(arglist__6681) {
      var x = cljs.core.first(arglist__6681);
      var ys = cljs.core.rest(arglist__6681);
      return G__6678__delegate(x, ys)
    };
    G__6678.cljs$lang$arity$variadic = G__6678__delegate;
    return G__6678
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__6682__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6683 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__6684 = cljs.core.next.call(null, more);
            sb = G__6683;
            more = G__6684;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__6682 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6682__delegate.call(this, x, ys)
    };
    G__6682.cljs$lang$maxFixedArity = 1;
    G__6682.cljs$lang$applyTo = function(arglist__6685) {
      var x = cljs.core.first(arglist__6685);
      var ys = cljs.core.rest(arglist__6685);
      return G__6682__delegate(x, ys)
    };
    G__6682.cljs$lang$arity$variadic = G__6682__delegate;
    return G__6682
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__6688 = cljs.core.seq.call(null, x);
    var ys__6689 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__6688 == null) {
        return ys__6689 == null
      }else {
        if(ys__6689 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__6688), cljs.core.first.call(null, ys__6689))) {
            var G__6690 = cljs.core.next.call(null, xs__6688);
            var G__6691 = cljs.core.next.call(null, ys__6689);
            xs__6688 = G__6690;
            ys__6689 = G__6691;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__6692_SHARP_, p2__6693_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__6692_SHARP_, cljs.core.hash.call(null, p2__6693_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__6697 = 0;
  var s__6698 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__6698) {
      var e__6699 = cljs.core.first.call(null, s__6698);
      var G__6700 = (h__6697 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__6699)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__6699)))) % 4503599627370496;
      var G__6701 = cljs.core.next.call(null, s__6698);
      h__6697 = G__6700;
      s__6698 = G__6701;
      continue
    }else {
      return h__6697
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__6705 = 0;
  var s__6706 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__6706) {
      var e__6707 = cljs.core.first.call(null, s__6706);
      var G__6708 = (h__6705 + cljs.core.hash.call(null, e__6707)) % 4503599627370496;
      var G__6709 = cljs.core.next.call(null, s__6706);
      h__6705 = G__6708;
      s__6706 = G__6709;
      continue
    }else {
      return h__6705
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__6730__6731 = cljs.core.seq.call(null, fn_map);
  if(G__6730__6731) {
    var G__6733__6735 = cljs.core.first.call(null, G__6730__6731);
    var vec__6734__6736 = G__6733__6735;
    var key_name__6737 = cljs.core.nth.call(null, vec__6734__6736, 0, null);
    var f__6738 = cljs.core.nth.call(null, vec__6734__6736, 1, null);
    var G__6730__6739 = G__6730__6731;
    var G__6733__6740 = G__6733__6735;
    var G__6730__6741 = G__6730__6739;
    while(true) {
      var vec__6742__6743 = G__6733__6740;
      var key_name__6744 = cljs.core.nth.call(null, vec__6742__6743, 0, null);
      var f__6745 = cljs.core.nth.call(null, vec__6742__6743, 1, null);
      var G__6730__6746 = G__6730__6741;
      var str_name__6747 = cljs.core.name.call(null, key_name__6744);
      obj[str_name__6747] = f__6745;
      var temp__4092__auto____6748 = cljs.core.next.call(null, G__6730__6746);
      if(temp__4092__auto____6748) {
        var G__6730__6749 = temp__4092__auto____6748;
        var G__6750 = cljs.core.first.call(null, G__6730__6749);
        var G__6751 = G__6730__6749;
        G__6733__6740 = G__6750;
        G__6730__6741 = G__6751;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6752 = this;
  var h__2087__auto____6753 = this__6752.__hash;
  if(!(h__2087__auto____6753 == null)) {
    return h__2087__auto____6753
  }else {
    var h__2087__auto____6754 = cljs.core.hash_coll.call(null, coll);
    this__6752.__hash = h__2087__auto____6754;
    return h__2087__auto____6754
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6755 = this;
  if(this__6755.count === 1) {
    return null
  }else {
    return this__6755.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6756 = this;
  return new cljs.core.List(this__6756.meta, o, coll, this__6756.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__6757 = this;
  var this__6758 = this;
  return cljs.core.pr_str.call(null, this__6758)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6759 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6760 = this;
  return this__6760.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6761 = this;
  return this__6761.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6762 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6763 = this;
  return this__6763.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6764 = this;
  if(this__6764.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__6764.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6765 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6766 = this;
  return new cljs.core.List(meta, this__6766.first, this__6766.rest, this__6766.count, this__6766.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6767 = this;
  return this__6767.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6768 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6769 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6770 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6771 = this;
  return new cljs.core.List(this__6771.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__6772 = this;
  var this__6773 = this;
  return cljs.core.pr_str.call(null, this__6773)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6774 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6775 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6776 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6777 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6778 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6779 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6780 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6781 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6782 = this;
  return this__6782.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6783 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__6787__6788 = coll;
  if(G__6787__6788) {
    if(function() {
      var or__3943__auto____6789 = G__6787__6788.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____6789) {
        return or__3943__auto____6789
      }else {
        return G__6787__6788.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__6787__6788.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6787__6788)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6787__6788)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__6790__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__6790 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6790__delegate.call(this, x, y, z, items)
    };
    G__6790.cljs$lang$maxFixedArity = 3;
    G__6790.cljs$lang$applyTo = function(arglist__6791) {
      var x = cljs.core.first(arglist__6791);
      var y = cljs.core.first(cljs.core.next(arglist__6791));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6791)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6791)));
      return G__6790__delegate(x, y, z, items)
    };
    G__6790.cljs$lang$arity$variadic = G__6790__delegate;
    return G__6790
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6792 = this;
  var h__2087__auto____6793 = this__6792.__hash;
  if(!(h__2087__auto____6793 == null)) {
    return h__2087__auto____6793
  }else {
    var h__2087__auto____6794 = cljs.core.hash_coll.call(null, coll);
    this__6792.__hash = h__2087__auto____6794;
    return h__2087__auto____6794
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6795 = this;
  if(this__6795.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__6795.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6796 = this;
  return new cljs.core.Cons(null, o, coll, this__6796.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__6797 = this;
  var this__6798 = this;
  return cljs.core.pr_str.call(null, this__6798)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6799 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6800 = this;
  return this__6800.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6801 = this;
  if(this__6801.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__6801.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6802 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6803 = this;
  return new cljs.core.Cons(meta, this__6803.first, this__6803.rest, this__6803.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6804 = this;
  return this__6804.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6805 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6805.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____6810 = coll == null;
    if(or__3943__auto____6810) {
      return or__3943__auto____6810
    }else {
      var G__6811__6812 = coll;
      if(G__6811__6812) {
        if(function() {
          var or__3943__auto____6813 = G__6811__6812.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6813) {
            return or__3943__auto____6813
          }else {
            return G__6811__6812.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6811__6812.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6811__6812)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6811__6812)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__6817__6818 = x;
  if(G__6817__6818) {
    if(function() {
      var or__3943__auto____6819 = G__6817__6818.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____6819) {
        return or__3943__auto____6819
      }else {
        return G__6817__6818.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__6817__6818.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6817__6818)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6817__6818)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__6820 = null;
  var G__6820__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__6820__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__6820 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6820__2.call(this, string, f);
      case 3:
        return G__6820__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6820
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__6821 = null;
  var G__6821__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__6821__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__6821 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6821__2.call(this, string, k);
      case 3:
        return G__6821__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6821
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__6822 = null;
  var G__6822__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__6822__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__6822 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6822__2.call(this, string, n);
      case 3:
        return G__6822__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6822
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function(this_sym6825, coll) {
  var this__6826 = this;
  var this_sym6825__6827 = this;
  var ___6828 = this_sym6825__6827;
  if(coll == null) {
    return null
  }else {
    var strobj__6829 = coll.strobj;
    if(strobj__6829 == null) {
      return cljs.core._lookup.call(null, coll, this__6826.k, null)
    }else {
      return strobj__6829[this__6826.k]
    }
  }
};
cljs.core.Keyword.prototype.apply = function(this_sym6823, args6824) {
  var this__6830 = this;
  return this_sym6823.call.apply(this_sym6823, [this_sym6823].concat(args6824.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__6839 = null;
  var G__6839__2 = function(this_sym6833, coll) {
    var this_sym6833__6835 = this;
    var this__6836 = this_sym6833__6835;
    return cljs.core._lookup.call(null, coll, this__6836.toString(), null)
  };
  var G__6839__3 = function(this_sym6834, coll, not_found) {
    var this_sym6834__6837 = this;
    var this__6838 = this_sym6834__6837;
    return cljs.core._lookup.call(null, coll, this__6838.toString(), not_found)
  };
  G__6839 = function(this_sym6834, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6839__2.call(this, this_sym6834, coll);
      case 3:
        return G__6839__3.call(this, this_sym6834, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6839
}();
String.prototype.apply = function(this_sym6831, args6832) {
  return this_sym6831.call.apply(this_sym6831, [this_sym6831].concat(args6832.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__6841 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__6841
  }else {
    lazy_seq.x = x__6841.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6842 = this;
  var h__2087__auto____6843 = this__6842.__hash;
  if(!(h__2087__auto____6843 == null)) {
    return h__2087__auto____6843
  }else {
    var h__2087__auto____6844 = cljs.core.hash_coll.call(null, coll);
    this__6842.__hash = h__2087__auto____6844;
    return h__2087__auto____6844
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6845 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6846 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__6847 = this;
  var this__6848 = this;
  return cljs.core.pr_str.call(null, this__6848)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6849 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6850 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6851 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6852 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6853 = this;
  return new cljs.core.LazySeq(meta, this__6853.realized, this__6853.x, this__6853.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6854 = this;
  return this__6854.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6855 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6855.meta)
};
cljs.core.LazySeq;
void 0;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6856 = this;
  return this__6856.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__6857 = this;
  var ___6858 = this;
  this__6857.buf[this__6857.end] = o;
  return this__6857.end = this__6857.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__6859 = this;
  var ___6860 = this;
  var ret__6861 = new cljs.core.ArrayChunk(this__6859.buf, 0, this__6859.end);
  this__6859.buf = null;
  return ret__6861
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6862 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__6862.arr[this__6862.off], this__6862.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6863 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__6863.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__6864 = this;
  if(this__6864.off === this__6864.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__6864.arr, this__6864.off + 1, this__6864.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__6865 = this;
  return this__6865.arr[this__6865.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__6866 = this;
  if(function() {
    var and__3941__auto____6867 = i >= 0;
    if(and__3941__auto____6867) {
      return i < this__6866.end - this__6866.off
    }else {
      return and__3941__auto____6867
    }
  }()) {
    return this__6866.arr[this__6866.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6868 = this;
  return this__6868.end - this__6868.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__6869 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6870 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6871 = this;
  return cljs.core._nth.call(null, this__6871.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6872 = this;
  if(cljs.core._count.call(null, this__6872.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__6872.chunk), this__6872.more, this__6872.meta)
  }else {
    if(this__6872.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__6872.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__6873 = this;
  if(this__6873.more == null) {
    return null
  }else {
    return this__6873.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6874 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__6875 = this;
  return new cljs.core.ChunkedCons(this__6875.chunk, this__6875.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6876 = this;
  return this__6876.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__6877 = this;
  return this__6877.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__6878 = this;
  if(this__6878.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__6878.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__6882__6883 = s;
    if(G__6882__6883) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____6884 = null;
        if(cljs.core.truth_(or__3943__auto____6884)) {
          return or__3943__auto____6884
        }else {
          return G__6882__6883.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__6882__6883.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__6882__6883)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__6882__6883)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__6887 = [];
  var s__6888 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__6888)) {
      ary__6887.push(cljs.core.first.call(null, s__6888));
      var G__6889 = cljs.core.next.call(null, s__6888);
      s__6888 = G__6889;
      continue
    }else {
      return ary__6887
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__6893 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__6894 = 0;
  var xs__6895 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__6895) {
      ret__6893[i__6894] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__6895));
      var G__6896 = i__6894 + 1;
      var G__6897 = cljs.core.next.call(null, xs__6895);
      i__6894 = G__6896;
      xs__6895 = G__6897;
      continue
    }else {
    }
    break
  }
  return ret__6893
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__6905 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6906 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6907 = 0;
      var s__6908 = s__6906;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____6909 = s__6908;
          if(and__3941__auto____6909) {
            return i__6907 < size
          }else {
            return and__3941__auto____6909
          }
        }())) {
          a__6905[i__6907] = cljs.core.first.call(null, s__6908);
          var G__6912 = i__6907 + 1;
          var G__6913 = cljs.core.next.call(null, s__6908);
          i__6907 = G__6912;
          s__6908 = G__6913;
          continue
        }else {
          return a__6905
        }
        break
      }
    }else {
      var n__2426__auto____6910 = size;
      var i__6911 = 0;
      while(true) {
        if(i__6911 < n__2426__auto____6910) {
          a__6905[i__6911] = init_val_or_seq;
          var G__6914 = i__6911 + 1;
          i__6911 = G__6914;
          continue
        }else {
        }
        break
      }
      return a__6905
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__6922 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6923 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6924 = 0;
      var s__6925 = s__6923;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____6926 = s__6925;
          if(and__3941__auto____6926) {
            return i__6924 < size
          }else {
            return and__3941__auto____6926
          }
        }())) {
          a__6922[i__6924] = cljs.core.first.call(null, s__6925);
          var G__6929 = i__6924 + 1;
          var G__6930 = cljs.core.next.call(null, s__6925);
          i__6924 = G__6929;
          s__6925 = G__6930;
          continue
        }else {
          return a__6922
        }
        break
      }
    }else {
      var n__2426__auto____6927 = size;
      var i__6928 = 0;
      while(true) {
        if(i__6928 < n__2426__auto____6927) {
          a__6922[i__6928] = init_val_or_seq;
          var G__6931 = i__6928 + 1;
          i__6928 = G__6931;
          continue
        }else {
        }
        break
      }
      return a__6922
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__6939 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6940 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6941 = 0;
      var s__6942 = s__6940;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____6943 = s__6942;
          if(and__3941__auto____6943) {
            return i__6941 < size
          }else {
            return and__3941__auto____6943
          }
        }())) {
          a__6939[i__6941] = cljs.core.first.call(null, s__6942);
          var G__6946 = i__6941 + 1;
          var G__6947 = cljs.core.next.call(null, s__6942);
          i__6941 = G__6946;
          s__6942 = G__6947;
          continue
        }else {
          return a__6939
        }
        break
      }
    }else {
      var n__2426__auto____6944 = size;
      var i__6945 = 0;
      while(true) {
        if(i__6945 < n__2426__auto____6944) {
          a__6939[i__6945] = init_val_or_seq;
          var G__6948 = i__6945 + 1;
          i__6945 = G__6948;
          continue
        }else {
        }
        break
      }
      return a__6939
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__6953 = s;
    var i__6954 = n;
    var sum__6955 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____6956 = i__6954 > 0;
        if(and__3941__auto____6956) {
          return cljs.core.seq.call(null, s__6953)
        }else {
          return and__3941__auto____6956
        }
      }())) {
        var G__6957 = cljs.core.next.call(null, s__6953);
        var G__6958 = i__6954 - 1;
        var G__6959 = sum__6955 + 1;
        s__6953 = G__6957;
        i__6954 = G__6958;
        sum__6955 = G__6959;
        continue
      }else {
        return sum__6955
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__6964 = cljs.core.seq.call(null, x);
      if(s__6964) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__6964)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__6964), concat.call(null, cljs.core.chunk_rest.call(null, s__6964), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__6964), concat.call(null, cljs.core.rest.call(null, s__6964), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__6968__delegate = function(x, y, zs) {
      var cat__6967 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__6966 = cljs.core.seq.call(null, xys);
          if(xys__6966) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__6966)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__6966), cat.call(null, cljs.core.chunk_rest.call(null, xys__6966), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__6966), cat.call(null, cljs.core.rest.call(null, xys__6966), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__6967.call(null, concat.call(null, x, y), zs)
    };
    var G__6968 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6968__delegate.call(this, x, y, zs)
    };
    G__6968.cljs$lang$maxFixedArity = 2;
    G__6968.cljs$lang$applyTo = function(arglist__6969) {
      var x = cljs.core.first(arglist__6969);
      var y = cljs.core.first(cljs.core.next(arglist__6969));
      var zs = cljs.core.rest(cljs.core.next(arglist__6969));
      return G__6968__delegate(x, y, zs)
    };
    G__6968.cljs$lang$arity$variadic = G__6968__delegate;
    return G__6968
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__6970__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__6970 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6970__delegate.call(this, a, b, c, d, more)
    };
    G__6970.cljs$lang$maxFixedArity = 4;
    G__6970.cljs$lang$applyTo = function(arglist__6971) {
      var a = cljs.core.first(arglist__6971);
      var b = cljs.core.first(cljs.core.next(arglist__6971));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6971)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6971))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6971))));
      return G__6970__delegate(a, b, c, d, more)
    };
    G__6970.cljs$lang$arity$variadic = G__6970__delegate;
    return G__6970
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7013 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7014 = cljs.core._first.call(null, args__7013);
    var args__7015 = cljs.core._rest.call(null, args__7013);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7014)
      }else {
        return f.call(null, a__7014)
      }
    }else {
      var b__7016 = cljs.core._first.call(null, args__7015);
      var args__7017 = cljs.core._rest.call(null, args__7015);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7014, b__7016)
        }else {
          return f.call(null, a__7014, b__7016)
        }
      }else {
        var c__7018 = cljs.core._first.call(null, args__7017);
        var args__7019 = cljs.core._rest.call(null, args__7017);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7014, b__7016, c__7018)
          }else {
            return f.call(null, a__7014, b__7016, c__7018)
          }
        }else {
          var d__7020 = cljs.core._first.call(null, args__7019);
          var args__7021 = cljs.core._rest.call(null, args__7019);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7014, b__7016, c__7018, d__7020)
            }else {
              return f.call(null, a__7014, b__7016, c__7018, d__7020)
            }
          }else {
            var e__7022 = cljs.core._first.call(null, args__7021);
            var args__7023 = cljs.core._rest.call(null, args__7021);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7014, b__7016, c__7018, d__7020, e__7022)
              }else {
                return f.call(null, a__7014, b__7016, c__7018, d__7020, e__7022)
              }
            }else {
              var f__7024 = cljs.core._first.call(null, args__7023);
              var args__7025 = cljs.core._rest.call(null, args__7023);
              if(argc === 6) {
                if(f__7024.cljs$lang$arity$6) {
                  return f__7024.cljs$lang$arity$6(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024)
                }else {
                  return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024)
                }
              }else {
                var g__7026 = cljs.core._first.call(null, args__7025);
                var args__7027 = cljs.core._rest.call(null, args__7025);
                if(argc === 7) {
                  if(f__7024.cljs$lang$arity$7) {
                    return f__7024.cljs$lang$arity$7(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026)
                  }else {
                    return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026)
                  }
                }else {
                  var h__7028 = cljs.core._first.call(null, args__7027);
                  var args__7029 = cljs.core._rest.call(null, args__7027);
                  if(argc === 8) {
                    if(f__7024.cljs$lang$arity$8) {
                      return f__7024.cljs$lang$arity$8(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028)
                    }else {
                      return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028)
                    }
                  }else {
                    var i__7030 = cljs.core._first.call(null, args__7029);
                    var args__7031 = cljs.core._rest.call(null, args__7029);
                    if(argc === 9) {
                      if(f__7024.cljs$lang$arity$9) {
                        return f__7024.cljs$lang$arity$9(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030)
                      }else {
                        return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030)
                      }
                    }else {
                      var j__7032 = cljs.core._first.call(null, args__7031);
                      var args__7033 = cljs.core._rest.call(null, args__7031);
                      if(argc === 10) {
                        if(f__7024.cljs$lang$arity$10) {
                          return f__7024.cljs$lang$arity$10(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032)
                        }else {
                          return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032)
                        }
                      }else {
                        var k__7034 = cljs.core._first.call(null, args__7033);
                        var args__7035 = cljs.core._rest.call(null, args__7033);
                        if(argc === 11) {
                          if(f__7024.cljs$lang$arity$11) {
                            return f__7024.cljs$lang$arity$11(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034)
                          }else {
                            return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034)
                          }
                        }else {
                          var l__7036 = cljs.core._first.call(null, args__7035);
                          var args__7037 = cljs.core._rest.call(null, args__7035);
                          if(argc === 12) {
                            if(f__7024.cljs$lang$arity$12) {
                              return f__7024.cljs$lang$arity$12(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036)
                            }else {
                              return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036)
                            }
                          }else {
                            var m__7038 = cljs.core._first.call(null, args__7037);
                            var args__7039 = cljs.core._rest.call(null, args__7037);
                            if(argc === 13) {
                              if(f__7024.cljs$lang$arity$13) {
                                return f__7024.cljs$lang$arity$13(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038)
                              }else {
                                return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038)
                              }
                            }else {
                              var n__7040 = cljs.core._first.call(null, args__7039);
                              var args__7041 = cljs.core._rest.call(null, args__7039);
                              if(argc === 14) {
                                if(f__7024.cljs$lang$arity$14) {
                                  return f__7024.cljs$lang$arity$14(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040)
                                }else {
                                  return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040)
                                }
                              }else {
                                var o__7042 = cljs.core._first.call(null, args__7041);
                                var args__7043 = cljs.core._rest.call(null, args__7041);
                                if(argc === 15) {
                                  if(f__7024.cljs$lang$arity$15) {
                                    return f__7024.cljs$lang$arity$15(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042)
                                  }else {
                                    return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042)
                                  }
                                }else {
                                  var p__7044 = cljs.core._first.call(null, args__7043);
                                  var args__7045 = cljs.core._rest.call(null, args__7043);
                                  if(argc === 16) {
                                    if(f__7024.cljs$lang$arity$16) {
                                      return f__7024.cljs$lang$arity$16(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044)
                                    }else {
                                      return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044)
                                    }
                                  }else {
                                    var q__7046 = cljs.core._first.call(null, args__7045);
                                    var args__7047 = cljs.core._rest.call(null, args__7045);
                                    if(argc === 17) {
                                      if(f__7024.cljs$lang$arity$17) {
                                        return f__7024.cljs$lang$arity$17(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046)
                                      }else {
                                        return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046)
                                      }
                                    }else {
                                      var r__7048 = cljs.core._first.call(null, args__7047);
                                      var args__7049 = cljs.core._rest.call(null, args__7047);
                                      if(argc === 18) {
                                        if(f__7024.cljs$lang$arity$18) {
                                          return f__7024.cljs$lang$arity$18(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046, r__7048)
                                        }else {
                                          return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046, r__7048)
                                        }
                                      }else {
                                        var s__7050 = cljs.core._first.call(null, args__7049);
                                        var args__7051 = cljs.core._rest.call(null, args__7049);
                                        if(argc === 19) {
                                          if(f__7024.cljs$lang$arity$19) {
                                            return f__7024.cljs$lang$arity$19(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046, r__7048, s__7050)
                                          }else {
                                            return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046, r__7048, s__7050)
                                          }
                                        }else {
                                          var t__7052 = cljs.core._first.call(null, args__7051);
                                          var args__7053 = cljs.core._rest.call(null, args__7051);
                                          if(argc === 20) {
                                            if(f__7024.cljs$lang$arity$20) {
                                              return f__7024.cljs$lang$arity$20(a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046, r__7048, s__7050, t__7052)
                                            }else {
                                              return f__7024.call(null, a__7014, b__7016, c__7018, d__7020, e__7022, f__7024, g__7026, h__7028, i__7030, j__7032, k__7034, l__7036, m__7038, n__7040, o__7042, p__7044, q__7046, r__7048, s__7050, t__7052)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7068 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7069 = cljs.core.bounded_count.call(null, args, fixed_arity__7068 + 1);
      if(bc__7069 <= fixed_arity__7068) {
        return cljs.core.apply_to.call(null, f, bc__7069, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7070 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7071 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7072 = cljs.core.bounded_count.call(null, arglist__7070, fixed_arity__7071 + 1);
      if(bc__7072 <= fixed_arity__7071) {
        return cljs.core.apply_to.call(null, f, bc__7072, arglist__7070)
      }else {
        return f.cljs$lang$applyTo(arglist__7070)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7070))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7073 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7074 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7075 = cljs.core.bounded_count.call(null, arglist__7073, fixed_arity__7074 + 1);
      if(bc__7075 <= fixed_arity__7074) {
        return cljs.core.apply_to.call(null, f, bc__7075, arglist__7073)
      }else {
        return f.cljs$lang$applyTo(arglist__7073)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7073))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7076 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7077 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7078 = cljs.core.bounded_count.call(null, arglist__7076, fixed_arity__7077 + 1);
      if(bc__7078 <= fixed_arity__7077) {
        return cljs.core.apply_to.call(null, f, bc__7078, arglist__7076)
      }else {
        return f.cljs$lang$applyTo(arglist__7076)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7076))
    }
  };
  var apply__6 = function() {
    var G__7082__delegate = function(f, a, b, c, d, args) {
      var arglist__7079 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7080 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7081 = cljs.core.bounded_count.call(null, arglist__7079, fixed_arity__7080 + 1);
        if(bc__7081 <= fixed_arity__7080) {
          return cljs.core.apply_to.call(null, f, bc__7081, arglist__7079)
        }else {
          return f.cljs$lang$applyTo(arglist__7079)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7079))
      }
    };
    var G__7082 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7082__delegate.call(this, f, a, b, c, d, args)
    };
    G__7082.cljs$lang$maxFixedArity = 5;
    G__7082.cljs$lang$applyTo = function(arglist__7083) {
      var f = cljs.core.first(arglist__7083);
      var a = cljs.core.first(cljs.core.next(arglist__7083));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7083)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7083))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7083)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7083)))));
      return G__7082__delegate(f, a, b, c, d, args)
    };
    G__7082.cljs$lang$arity$variadic = G__7082__delegate;
    return G__7082
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7084) {
    var obj = cljs.core.first(arglist__7084);
    var f = cljs.core.first(cljs.core.next(arglist__7084));
    var args = cljs.core.rest(cljs.core.next(arglist__7084));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7085__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7085 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7085__delegate.call(this, x, y, more)
    };
    G__7085.cljs$lang$maxFixedArity = 2;
    G__7085.cljs$lang$applyTo = function(arglist__7086) {
      var x = cljs.core.first(arglist__7086);
      var y = cljs.core.first(cljs.core.next(arglist__7086));
      var more = cljs.core.rest(cljs.core.next(arglist__7086));
      return G__7085__delegate(x, y, more)
    };
    G__7085.cljs$lang$arity$variadic = G__7085__delegate;
    return G__7085
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7087 = pred;
        var G__7088 = cljs.core.next.call(null, coll);
        pred = G__7087;
        coll = G__7088;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto____7090 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____7090)) {
        return or__3943__auto____7090
      }else {
        var G__7091 = pred;
        var G__7092 = cljs.core.next.call(null, coll);
        pred = G__7091;
        coll = G__7092;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7093 = null;
    var G__7093__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7093__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7093__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7093__3 = function() {
      var G__7094__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7094 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7094__delegate.call(this, x, y, zs)
      };
      G__7094.cljs$lang$maxFixedArity = 2;
      G__7094.cljs$lang$applyTo = function(arglist__7095) {
        var x = cljs.core.first(arglist__7095);
        var y = cljs.core.first(cljs.core.next(arglist__7095));
        var zs = cljs.core.rest(cljs.core.next(arglist__7095));
        return G__7094__delegate(x, y, zs)
      };
      G__7094.cljs$lang$arity$variadic = G__7094__delegate;
      return G__7094
    }();
    G__7093 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7093__0.call(this);
        case 1:
          return G__7093__1.call(this, x);
        case 2:
          return G__7093__2.call(this, x, y);
        default:
          return G__7093__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7093.cljs$lang$maxFixedArity = 2;
    G__7093.cljs$lang$applyTo = G__7093__3.cljs$lang$applyTo;
    return G__7093
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7096__delegate = function(args) {
      return x
    };
    var G__7096 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7096__delegate.call(this, args)
    };
    G__7096.cljs$lang$maxFixedArity = 0;
    G__7096.cljs$lang$applyTo = function(arglist__7097) {
      var args = cljs.core.seq(arglist__7097);
      return G__7096__delegate(args)
    };
    G__7096.cljs$lang$arity$variadic = G__7096__delegate;
    return G__7096
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7104 = null;
      var G__7104__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7104__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7104__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7104__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7104__4 = function() {
        var G__7105__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7105 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7105__delegate.call(this, x, y, z, args)
        };
        G__7105.cljs$lang$maxFixedArity = 3;
        G__7105.cljs$lang$applyTo = function(arglist__7106) {
          var x = cljs.core.first(arglist__7106);
          var y = cljs.core.first(cljs.core.next(arglist__7106));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7106)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7106)));
          return G__7105__delegate(x, y, z, args)
        };
        G__7105.cljs$lang$arity$variadic = G__7105__delegate;
        return G__7105
      }();
      G__7104 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7104__0.call(this);
          case 1:
            return G__7104__1.call(this, x);
          case 2:
            return G__7104__2.call(this, x, y);
          case 3:
            return G__7104__3.call(this, x, y, z);
          default:
            return G__7104__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7104.cljs$lang$maxFixedArity = 3;
      G__7104.cljs$lang$applyTo = G__7104__4.cljs$lang$applyTo;
      return G__7104
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7107 = null;
      var G__7107__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7107__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7107__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7107__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7107__4 = function() {
        var G__7108__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7108 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7108__delegate.call(this, x, y, z, args)
        };
        G__7108.cljs$lang$maxFixedArity = 3;
        G__7108.cljs$lang$applyTo = function(arglist__7109) {
          var x = cljs.core.first(arglist__7109);
          var y = cljs.core.first(cljs.core.next(arglist__7109));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7109)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7109)));
          return G__7108__delegate(x, y, z, args)
        };
        G__7108.cljs$lang$arity$variadic = G__7108__delegate;
        return G__7108
      }();
      G__7107 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7107__0.call(this);
          case 1:
            return G__7107__1.call(this, x);
          case 2:
            return G__7107__2.call(this, x, y);
          case 3:
            return G__7107__3.call(this, x, y, z);
          default:
            return G__7107__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7107.cljs$lang$maxFixedArity = 3;
      G__7107.cljs$lang$applyTo = G__7107__4.cljs$lang$applyTo;
      return G__7107
    }()
  };
  var comp__4 = function() {
    var G__7110__delegate = function(f1, f2, f3, fs) {
      var fs__7101 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7111__delegate = function(args) {
          var ret__7102 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7101), args);
          var fs__7103 = cljs.core.next.call(null, fs__7101);
          while(true) {
            if(fs__7103) {
              var G__7112 = cljs.core.first.call(null, fs__7103).call(null, ret__7102);
              var G__7113 = cljs.core.next.call(null, fs__7103);
              ret__7102 = G__7112;
              fs__7103 = G__7113;
              continue
            }else {
              return ret__7102
            }
            break
          }
        };
        var G__7111 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7111__delegate.call(this, args)
        };
        G__7111.cljs$lang$maxFixedArity = 0;
        G__7111.cljs$lang$applyTo = function(arglist__7114) {
          var args = cljs.core.seq(arglist__7114);
          return G__7111__delegate(args)
        };
        G__7111.cljs$lang$arity$variadic = G__7111__delegate;
        return G__7111
      }()
    };
    var G__7110 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7110__delegate.call(this, f1, f2, f3, fs)
    };
    G__7110.cljs$lang$maxFixedArity = 3;
    G__7110.cljs$lang$applyTo = function(arglist__7115) {
      var f1 = cljs.core.first(arglist__7115);
      var f2 = cljs.core.first(cljs.core.next(arglist__7115));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7115)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7115)));
      return G__7110__delegate(f1, f2, f3, fs)
    };
    G__7110.cljs$lang$arity$variadic = G__7110__delegate;
    return G__7110
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7116__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7116 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7116__delegate.call(this, args)
      };
      G__7116.cljs$lang$maxFixedArity = 0;
      G__7116.cljs$lang$applyTo = function(arglist__7117) {
        var args = cljs.core.seq(arglist__7117);
        return G__7116__delegate(args)
      };
      G__7116.cljs$lang$arity$variadic = G__7116__delegate;
      return G__7116
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7118__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7118 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7118__delegate.call(this, args)
      };
      G__7118.cljs$lang$maxFixedArity = 0;
      G__7118.cljs$lang$applyTo = function(arglist__7119) {
        var args = cljs.core.seq(arglist__7119);
        return G__7118__delegate(args)
      };
      G__7118.cljs$lang$arity$variadic = G__7118__delegate;
      return G__7118
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7120__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7120 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7120__delegate.call(this, args)
      };
      G__7120.cljs$lang$maxFixedArity = 0;
      G__7120.cljs$lang$applyTo = function(arglist__7121) {
        var args = cljs.core.seq(arglist__7121);
        return G__7120__delegate(args)
      };
      G__7120.cljs$lang$arity$variadic = G__7120__delegate;
      return G__7120
    }()
  };
  var partial__5 = function() {
    var G__7122__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7123__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7123 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7123__delegate.call(this, args)
        };
        G__7123.cljs$lang$maxFixedArity = 0;
        G__7123.cljs$lang$applyTo = function(arglist__7124) {
          var args = cljs.core.seq(arglist__7124);
          return G__7123__delegate(args)
        };
        G__7123.cljs$lang$arity$variadic = G__7123__delegate;
        return G__7123
      }()
    };
    var G__7122 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7122__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7122.cljs$lang$maxFixedArity = 4;
    G__7122.cljs$lang$applyTo = function(arglist__7125) {
      var f = cljs.core.first(arglist__7125);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7125));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7125)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7125))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7125))));
      return G__7122__delegate(f, arg1, arg2, arg3, more)
    };
    G__7122.cljs$lang$arity$variadic = G__7122__delegate;
    return G__7122
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7126 = null;
      var G__7126__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7126__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7126__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7126__4 = function() {
        var G__7127__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7127 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7127__delegate.call(this, a, b, c, ds)
        };
        G__7127.cljs$lang$maxFixedArity = 3;
        G__7127.cljs$lang$applyTo = function(arglist__7128) {
          var a = cljs.core.first(arglist__7128);
          var b = cljs.core.first(cljs.core.next(arglist__7128));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7128)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7128)));
          return G__7127__delegate(a, b, c, ds)
        };
        G__7127.cljs$lang$arity$variadic = G__7127__delegate;
        return G__7127
      }();
      G__7126 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7126__1.call(this, a);
          case 2:
            return G__7126__2.call(this, a, b);
          case 3:
            return G__7126__3.call(this, a, b, c);
          default:
            return G__7126__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7126.cljs$lang$maxFixedArity = 3;
      G__7126.cljs$lang$applyTo = G__7126__4.cljs$lang$applyTo;
      return G__7126
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7129 = null;
      var G__7129__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7129__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7129__4 = function() {
        var G__7130__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7130 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7130__delegate.call(this, a, b, c, ds)
        };
        G__7130.cljs$lang$maxFixedArity = 3;
        G__7130.cljs$lang$applyTo = function(arglist__7131) {
          var a = cljs.core.first(arglist__7131);
          var b = cljs.core.first(cljs.core.next(arglist__7131));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7131)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7131)));
          return G__7130__delegate(a, b, c, ds)
        };
        G__7130.cljs$lang$arity$variadic = G__7130__delegate;
        return G__7130
      }();
      G__7129 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7129__2.call(this, a, b);
          case 3:
            return G__7129__3.call(this, a, b, c);
          default:
            return G__7129__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7129.cljs$lang$maxFixedArity = 3;
      G__7129.cljs$lang$applyTo = G__7129__4.cljs$lang$applyTo;
      return G__7129
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7132 = null;
      var G__7132__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7132__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7132__4 = function() {
        var G__7133__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7133 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7133__delegate.call(this, a, b, c, ds)
        };
        G__7133.cljs$lang$maxFixedArity = 3;
        G__7133.cljs$lang$applyTo = function(arglist__7134) {
          var a = cljs.core.first(arglist__7134);
          var b = cljs.core.first(cljs.core.next(arglist__7134));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7134)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7134)));
          return G__7133__delegate(a, b, c, ds)
        };
        G__7133.cljs$lang$arity$variadic = G__7133__delegate;
        return G__7133
      }();
      G__7132 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7132__2.call(this, a, b);
          case 3:
            return G__7132__3.call(this, a, b, c);
          default:
            return G__7132__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7132.cljs$lang$maxFixedArity = 3;
      G__7132.cljs$lang$applyTo = G__7132__4.cljs$lang$applyTo;
      return G__7132
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7150 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7158 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7158) {
        var s__7159 = temp__4092__auto____7158;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7159)) {
          var c__7160 = cljs.core.chunk_first.call(null, s__7159);
          var size__7161 = cljs.core.count.call(null, c__7160);
          var b__7162 = cljs.core.chunk_buffer.call(null, size__7161);
          var n__2426__auto____7163 = size__7161;
          var i__7164 = 0;
          while(true) {
            if(i__7164 < n__2426__auto____7163) {
              cljs.core.chunk_append.call(null, b__7162, f.call(null, idx + i__7164, cljs.core._nth.call(null, c__7160, i__7164)));
              var G__7165 = i__7164 + 1;
              i__7164 = G__7165;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7162), mapi.call(null, idx + size__7161, cljs.core.chunk_rest.call(null, s__7159)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7159)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7159)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7150.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7175 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7175) {
      var s__7176 = temp__4092__auto____7175;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7176)) {
        var c__7177 = cljs.core.chunk_first.call(null, s__7176);
        var size__7178 = cljs.core.count.call(null, c__7177);
        var b__7179 = cljs.core.chunk_buffer.call(null, size__7178);
        var n__2426__auto____7180 = size__7178;
        var i__7181 = 0;
        while(true) {
          if(i__7181 < n__2426__auto____7180) {
            var x__7182 = f.call(null, cljs.core._nth.call(null, c__7177, i__7181));
            if(x__7182 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7179, x__7182)
            }
            var G__7184 = i__7181 + 1;
            i__7181 = G__7184;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7179), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7176)))
      }else {
        var x__7183 = f.call(null, cljs.core.first.call(null, s__7176));
        if(x__7183 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7176))
        }else {
          return cljs.core.cons.call(null, x__7183, keep.call(null, f, cljs.core.rest.call(null, s__7176)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7210 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7220 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7220) {
        var s__7221 = temp__4092__auto____7220;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7221)) {
          var c__7222 = cljs.core.chunk_first.call(null, s__7221);
          var size__7223 = cljs.core.count.call(null, c__7222);
          var b__7224 = cljs.core.chunk_buffer.call(null, size__7223);
          var n__2426__auto____7225 = size__7223;
          var i__7226 = 0;
          while(true) {
            if(i__7226 < n__2426__auto____7225) {
              var x__7227 = f.call(null, idx + i__7226, cljs.core._nth.call(null, c__7222, i__7226));
              if(x__7227 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7224, x__7227)
              }
              var G__7229 = i__7226 + 1;
              i__7226 = G__7229;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7224), keepi.call(null, idx + size__7223, cljs.core.chunk_rest.call(null, s__7221)))
        }else {
          var x__7228 = f.call(null, idx, cljs.core.first.call(null, s__7221));
          if(x__7228 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7221))
          }else {
            return cljs.core.cons.call(null, x__7228, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7221)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7210.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7315 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7315)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____7315
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7316 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7316)) {
            var and__3941__auto____7317 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7317)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____7317
            }
          }else {
            return and__3941__auto____7316
          }
        }())
      };
      var ep1__4 = function() {
        var G__7386__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7318 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7318)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____7318
            }
          }())
        };
        var G__7386 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7386__delegate.call(this, x, y, z, args)
        };
        G__7386.cljs$lang$maxFixedArity = 3;
        G__7386.cljs$lang$applyTo = function(arglist__7387) {
          var x = cljs.core.first(arglist__7387);
          var y = cljs.core.first(cljs.core.next(arglist__7387));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7387)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7387)));
          return G__7386__delegate(x, y, z, args)
        };
        G__7386.cljs$lang$arity$variadic = G__7386__delegate;
        return G__7386
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7330 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7330)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____7330
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7331 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7331)) {
            var and__3941__auto____7332 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7332)) {
              var and__3941__auto____7333 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7333)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____7333
              }
            }else {
              return and__3941__auto____7332
            }
          }else {
            return and__3941__auto____7331
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7334 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7334)) {
            var and__3941__auto____7335 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7335)) {
              var and__3941__auto____7336 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____7336)) {
                var and__3941__auto____7337 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____7337)) {
                  var and__3941__auto____7338 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7338)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____7338
                  }
                }else {
                  return and__3941__auto____7337
                }
              }else {
                return and__3941__auto____7336
              }
            }else {
              return and__3941__auto____7335
            }
          }else {
            return and__3941__auto____7334
          }
        }())
      };
      var ep2__4 = function() {
        var G__7388__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7339 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7339)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7185_SHARP_) {
                var and__3941__auto____7340 = p1.call(null, p1__7185_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7340)) {
                  return p2.call(null, p1__7185_SHARP_)
                }else {
                  return and__3941__auto____7340
                }
              }, args)
            }else {
              return and__3941__auto____7339
            }
          }())
        };
        var G__7388 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7388__delegate.call(this, x, y, z, args)
        };
        G__7388.cljs$lang$maxFixedArity = 3;
        G__7388.cljs$lang$applyTo = function(arglist__7389) {
          var x = cljs.core.first(arglist__7389);
          var y = cljs.core.first(cljs.core.next(arglist__7389));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7389)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7389)));
          return G__7388__delegate(x, y, z, args)
        };
        G__7388.cljs$lang$arity$variadic = G__7388__delegate;
        return G__7388
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7359 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7359)) {
            var and__3941__auto____7360 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7360)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____7360
            }
          }else {
            return and__3941__auto____7359
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7361 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7361)) {
            var and__3941__auto____7362 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7362)) {
              var and__3941__auto____7363 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7363)) {
                var and__3941__auto____7364 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7364)) {
                  var and__3941__auto____7365 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7365)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____7365
                  }
                }else {
                  return and__3941__auto____7364
                }
              }else {
                return and__3941__auto____7363
              }
            }else {
              return and__3941__auto____7362
            }
          }else {
            return and__3941__auto____7361
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7366 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7366)) {
            var and__3941__auto____7367 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7367)) {
              var and__3941__auto____7368 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7368)) {
                var and__3941__auto____7369 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7369)) {
                  var and__3941__auto____7370 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7370)) {
                    var and__3941__auto____7371 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____7371)) {
                      var and__3941__auto____7372 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____7372)) {
                        var and__3941__auto____7373 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____7373)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____7373
                        }
                      }else {
                        return and__3941__auto____7372
                      }
                    }else {
                      return and__3941__auto____7371
                    }
                  }else {
                    return and__3941__auto____7370
                  }
                }else {
                  return and__3941__auto____7369
                }
              }else {
                return and__3941__auto____7368
              }
            }else {
              return and__3941__auto____7367
            }
          }else {
            return and__3941__auto____7366
          }
        }())
      };
      var ep3__4 = function() {
        var G__7390__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7374 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7374)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7186_SHARP_) {
                var and__3941__auto____7375 = p1.call(null, p1__7186_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7375)) {
                  var and__3941__auto____7376 = p2.call(null, p1__7186_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____7376)) {
                    return p3.call(null, p1__7186_SHARP_)
                  }else {
                    return and__3941__auto____7376
                  }
                }else {
                  return and__3941__auto____7375
                }
              }, args)
            }else {
              return and__3941__auto____7374
            }
          }())
        };
        var G__7390 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7390__delegate.call(this, x, y, z, args)
        };
        G__7390.cljs$lang$maxFixedArity = 3;
        G__7390.cljs$lang$applyTo = function(arglist__7391) {
          var x = cljs.core.first(arglist__7391);
          var y = cljs.core.first(cljs.core.next(arglist__7391));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7391)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7391)));
          return G__7390__delegate(x, y, z, args)
        };
        G__7390.cljs$lang$arity$variadic = G__7390__delegate;
        return G__7390
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7392__delegate = function(p1, p2, p3, ps) {
      var ps__7377 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7187_SHARP_) {
            return p1__7187_SHARP_.call(null, x)
          }, ps__7377)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7188_SHARP_) {
            var and__3941__auto____7382 = p1__7188_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7382)) {
              return p1__7188_SHARP_.call(null, y)
            }else {
              return and__3941__auto____7382
            }
          }, ps__7377)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7189_SHARP_) {
            var and__3941__auto____7383 = p1__7189_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7383)) {
              var and__3941__auto____7384 = p1__7189_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____7384)) {
                return p1__7189_SHARP_.call(null, z)
              }else {
                return and__3941__auto____7384
              }
            }else {
              return and__3941__auto____7383
            }
          }, ps__7377)
        };
        var epn__4 = function() {
          var G__7393__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____7385 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____7385)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7190_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7190_SHARP_, args)
                }, ps__7377)
              }else {
                return and__3941__auto____7385
              }
            }())
          };
          var G__7393 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7393__delegate.call(this, x, y, z, args)
          };
          G__7393.cljs$lang$maxFixedArity = 3;
          G__7393.cljs$lang$applyTo = function(arglist__7394) {
            var x = cljs.core.first(arglist__7394);
            var y = cljs.core.first(cljs.core.next(arglist__7394));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7394)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7394)));
            return G__7393__delegate(x, y, z, args)
          };
          G__7393.cljs$lang$arity$variadic = G__7393__delegate;
          return G__7393
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7392 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7392__delegate.call(this, p1, p2, p3, ps)
    };
    G__7392.cljs$lang$maxFixedArity = 3;
    G__7392.cljs$lang$applyTo = function(arglist__7395) {
      var p1 = cljs.core.first(arglist__7395);
      var p2 = cljs.core.first(cljs.core.next(arglist__7395));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7395)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7395)));
      return G__7392__delegate(p1, p2, p3, ps)
    };
    G__7392.cljs$lang$arity$variadic = G__7392__delegate;
    return G__7392
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto____7476 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7476)) {
          return or__3943__auto____7476
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____7477 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7477)) {
          return or__3943__auto____7477
        }else {
          var or__3943__auto____7478 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7478)) {
            return or__3943__auto____7478
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7547__delegate = function(x, y, z, args) {
          var or__3943__auto____7479 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7479)) {
            return or__3943__auto____7479
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7547 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7547__delegate.call(this, x, y, z, args)
        };
        G__7547.cljs$lang$maxFixedArity = 3;
        G__7547.cljs$lang$applyTo = function(arglist__7548) {
          var x = cljs.core.first(arglist__7548);
          var y = cljs.core.first(cljs.core.next(arglist__7548));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7548)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7548)));
          return G__7547__delegate(x, y, z, args)
        };
        G__7547.cljs$lang$arity$variadic = G__7547__delegate;
        return G__7547
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto____7491 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7491)) {
          return or__3943__auto____7491
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____7492 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7492)) {
          return or__3943__auto____7492
        }else {
          var or__3943__auto____7493 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7493)) {
            return or__3943__auto____7493
          }else {
            var or__3943__auto____7494 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7494)) {
              return or__3943__auto____7494
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____7495 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7495)) {
          return or__3943__auto____7495
        }else {
          var or__3943__auto____7496 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7496)) {
            return or__3943__auto____7496
          }else {
            var or__3943__auto____7497 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____7497)) {
              return or__3943__auto____7497
            }else {
              var or__3943__auto____7498 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____7498)) {
                return or__3943__auto____7498
              }else {
                var or__3943__auto____7499 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7499)) {
                  return or__3943__auto____7499
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7549__delegate = function(x, y, z, args) {
          var or__3943__auto____7500 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7500)) {
            return or__3943__auto____7500
          }else {
            return cljs.core.some.call(null, function(p1__7230_SHARP_) {
              var or__3943__auto____7501 = p1.call(null, p1__7230_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7501)) {
                return or__3943__auto____7501
              }else {
                return p2.call(null, p1__7230_SHARP_)
              }
            }, args)
          }
        };
        var G__7549 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7549__delegate.call(this, x, y, z, args)
        };
        G__7549.cljs$lang$maxFixedArity = 3;
        G__7549.cljs$lang$applyTo = function(arglist__7550) {
          var x = cljs.core.first(arglist__7550);
          var y = cljs.core.first(cljs.core.next(arglist__7550));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7550)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7550)));
          return G__7549__delegate(x, y, z, args)
        };
        G__7549.cljs$lang$arity$variadic = G__7549__delegate;
        return G__7549
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto____7520 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7520)) {
          return or__3943__auto____7520
        }else {
          var or__3943__auto____7521 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7521)) {
            return or__3943__auto____7521
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____7522 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7522)) {
          return or__3943__auto____7522
        }else {
          var or__3943__auto____7523 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7523)) {
            return or__3943__auto____7523
          }else {
            var or__3943__auto____7524 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7524)) {
              return or__3943__auto____7524
            }else {
              var or__3943__auto____7525 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7525)) {
                return or__3943__auto____7525
              }else {
                var or__3943__auto____7526 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7526)) {
                  return or__3943__auto____7526
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____7527 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7527)) {
          return or__3943__auto____7527
        }else {
          var or__3943__auto____7528 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7528)) {
            return or__3943__auto____7528
          }else {
            var or__3943__auto____7529 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7529)) {
              return or__3943__auto____7529
            }else {
              var or__3943__auto____7530 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7530)) {
                return or__3943__auto____7530
              }else {
                var or__3943__auto____7531 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7531)) {
                  return or__3943__auto____7531
                }else {
                  var or__3943__auto____7532 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____7532)) {
                    return or__3943__auto____7532
                  }else {
                    var or__3943__auto____7533 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____7533)) {
                      return or__3943__auto____7533
                    }else {
                      var or__3943__auto____7534 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____7534)) {
                        return or__3943__auto____7534
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7551__delegate = function(x, y, z, args) {
          var or__3943__auto____7535 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7535)) {
            return or__3943__auto____7535
          }else {
            return cljs.core.some.call(null, function(p1__7231_SHARP_) {
              var or__3943__auto____7536 = p1.call(null, p1__7231_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7536)) {
                return or__3943__auto____7536
              }else {
                var or__3943__auto____7537 = p2.call(null, p1__7231_SHARP_);
                if(cljs.core.truth_(or__3943__auto____7537)) {
                  return or__3943__auto____7537
                }else {
                  return p3.call(null, p1__7231_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7551 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7551__delegate.call(this, x, y, z, args)
        };
        G__7551.cljs$lang$maxFixedArity = 3;
        G__7551.cljs$lang$applyTo = function(arglist__7552) {
          var x = cljs.core.first(arglist__7552);
          var y = cljs.core.first(cljs.core.next(arglist__7552));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7552)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7552)));
          return G__7551__delegate(x, y, z, args)
        };
        G__7551.cljs$lang$arity$variadic = G__7551__delegate;
        return G__7551
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7553__delegate = function(p1, p2, p3, ps) {
      var ps__7538 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7232_SHARP_) {
            return p1__7232_SHARP_.call(null, x)
          }, ps__7538)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7233_SHARP_) {
            var or__3943__auto____7543 = p1__7233_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7543)) {
              return or__3943__auto____7543
            }else {
              return p1__7233_SHARP_.call(null, y)
            }
          }, ps__7538)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7234_SHARP_) {
            var or__3943__auto____7544 = p1__7234_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7544)) {
              return or__3943__auto____7544
            }else {
              var or__3943__auto____7545 = p1__7234_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7545)) {
                return or__3943__auto____7545
              }else {
                return p1__7234_SHARP_.call(null, z)
              }
            }
          }, ps__7538)
        };
        var spn__4 = function() {
          var G__7554__delegate = function(x, y, z, args) {
            var or__3943__auto____7546 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____7546)) {
              return or__3943__auto____7546
            }else {
              return cljs.core.some.call(null, function(p1__7235_SHARP_) {
                return cljs.core.some.call(null, p1__7235_SHARP_, args)
              }, ps__7538)
            }
          };
          var G__7554 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7554__delegate.call(this, x, y, z, args)
          };
          G__7554.cljs$lang$maxFixedArity = 3;
          G__7554.cljs$lang$applyTo = function(arglist__7555) {
            var x = cljs.core.first(arglist__7555);
            var y = cljs.core.first(cljs.core.next(arglist__7555));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7555)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7555)));
            return G__7554__delegate(x, y, z, args)
          };
          G__7554.cljs$lang$arity$variadic = G__7554__delegate;
          return G__7554
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7553 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7553__delegate.call(this, p1, p2, p3, ps)
    };
    G__7553.cljs$lang$maxFixedArity = 3;
    G__7553.cljs$lang$applyTo = function(arglist__7556) {
      var p1 = cljs.core.first(arglist__7556);
      var p2 = cljs.core.first(cljs.core.next(arglist__7556));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7556)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7556)));
      return G__7553__delegate(p1, p2, p3, ps)
    };
    G__7553.cljs$lang$arity$variadic = G__7553__delegate;
    return G__7553
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7575 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7575) {
        var s__7576 = temp__4092__auto____7575;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7576)) {
          var c__7577 = cljs.core.chunk_first.call(null, s__7576);
          var size__7578 = cljs.core.count.call(null, c__7577);
          var b__7579 = cljs.core.chunk_buffer.call(null, size__7578);
          var n__2426__auto____7580 = size__7578;
          var i__7581 = 0;
          while(true) {
            if(i__7581 < n__2426__auto____7580) {
              cljs.core.chunk_append.call(null, b__7579, f.call(null, cljs.core._nth.call(null, c__7577, i__7581)));
              var G__7593 = i__7581 + 1;
              i__7581 = G__7593;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7579), map.call(null, f, cljs.core.chunk_rest.call(null, s__7576)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__7576)), map.call(null, f, cljs.core.rest.call(null, s__7576)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7582 = cljs.core.seq.call(null, c1);
      var s2__7583 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____7584 = s1__7582;
        if(and__3941__auto____7584) {
          return s2__7583
        }else {
          return and__3941__auto____7584
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7582), cljs.core.first.call(null, s2__7583)), map.call(null, f, cljs.core.rest.call(null, s1__7582), cljs.core.rest.call(null, s2__7583)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7585 = cljs.core.seq.call(null, c1);
      var s2__7586 = cljs.core.seq.call(null, c2);
      var s3__7587 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____7588 = s1__7585;
        if(and__3941__auto____7588) {
          var and__3941__auto____7589 = s2__7586;
          if(and__3941__auto____7589) {
            return s3__7587
          }else {
            return and__3941__auto____7589
          }
        }else {
          return and__3941__auto____7588
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7585), cljs.core.first.call(null, s2__7586), cljs.core.first.call(null, s3__7587)), map.call(null, f, cljs.core.rest.call(null, s1__7585), cljs.core.rest.call(null, s2__7586), cljs.core.rest.call(null, s3__7587)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__7594__delegate = function(f, c1, c2, c3, colls) {
      var step__7592 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__7591 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7591)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__7591), step.call(null, map.call(null, cljs.core.rest, ss__7591)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7396_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7396_SHARP_)
      }, step__7592.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__7594 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7594__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7594.cljs$lang$maxFixedArity = 4;
    G__7594.cljs$lang$applyTo = function(arglist__7595) {
      var f = cljs.core.first(arglist__7595);
      var c1 = cljs.core.first(cljs.core.next(arglist__7595));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7595)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7595))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7595))));
      return G__7594__delegate(f, c1, c2, c3, colls)
    };
    G__7594.cljs$lang$arity$variadic = G__7594__delegate;
    return G__7594
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto____7598 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7598) {
        var s__7599 = temp__4092__auto____7598;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__7599), take.call(null, n - 1, cljs.core.rest.call(null, s__7599)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__7605 = function(n, coll) {
    while(true) {
      var s__7603 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____7604 = n > 0;
        if(and__3941__auto____7604) {
          return s__7603
        }else {
          return and__3941__auto____7604
        }
      }())) {
        var G__7606 = n - 1;
        var G__7607 = cljs.core.rest.call(null, s__7603);
        n = G__7606;
        coll = G__7607;
        continue
      }else {
        return s__7603
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__7605.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__7610 = cljs.core.seq.call(null, coll);
  var lead__7611 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__7611) {
      var G__7612 = cljs.core.next.call(null, s__7610);
      var G__7613 = cljs.core.next.call(null, lead__7611);
      s__7610 = G__7612;
      lead__7611 = G__7613;
      continue
    }else {
      return s__7610
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__7619 = function(pred, coll) {
    while(true) {
      var s__7617 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____7618 = s__7617;
        if(and__3941__auto____7618) {
          return pred.call(null, cljs.core.first.call(null, s__7617))
        }else {
          return and__3941__auto____7618
        }
      }())) {
        var G__7620 = pred;
        var G__7621 = cljs.core.rest.call(null, s__7617);
        pred = G__7620;
        coll = G__7621;
        continue
      }else {
        return s__7617
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__7619.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7624 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7624) {
      var s__7625 = temp__4092__auto____7624;
      return cljs.core.concat.call(null, s__7625, cycle.call(null, s__7625))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7630 = cljs.core.seq.call(null, c1);
      var s2__7631 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____7632 = s1__7630;
        if(and__3941__auto____7632) {
          return s2__7631
        }else {
          return and__3941__auto____7632
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__7630), cljs.core.cons.call(null, cljs.core.first.call(null, s2__7631), interleave.call(null, cljs.core.rest.call(null, s1__7630), cljs.core.rest.call(null, s2__7631))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__7634__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__7633 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7633)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__7633), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__7633)))
        }else {
          return null
        }
      }, null)
    };
    var G__7634 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7634__delegate.call(this, c1, c2, colls)
    };
    G__7634.cljs$lang$maxFixedArity = 2;
    G__7634.cljs$lang$applyTo = function(arglist__7635) {
      var c1 = cljs.core.first(arglist__7635);
      var c2 = cljs.core.first(cljs.core.next(arglist__7635));
      var colls = cljs.core.rest(cljs.core.next(arglist__7635));
      return G__7634__delegate(c1, c2, colls)
    };
    G__7634.cljs$lang$arity$variadic = G__7634__delegate;
    return G__7634
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__7645 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____7643 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____7643) {
        var coll__7644 = temp__4090__auto____7643;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__7644), cat.call(null, cljs.core.rest.call(null, coll__7644), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__7645.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__7646__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__7646 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7646__delegate.call(this, f, coll, colls)
    };
    G__7646.cljs$lang$maxFixedArity = 2;
    G__7646.cljs$lang$applyTo = function(arglist__7647) {
      var f = cljs.core.first(arglist__7647);
      var coll = cljs.core.first(cljs.core.next(arglist__7647));
      var colls = cljs.core.rest(cljs.core.next(arglist__7647));
      return G__7646__delegate(f, coll, colls)
    };
    G__7646.cljs$lang$arity$variadic = G__7646__delegate;
    return G__7646
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7657 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7657) {
      var s__7658 = temp__4092__auto____7657;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7658)) {
        var c__7659 = cljs.core.chunk_first.call(null, s__7658);
        var size__7660 = cljs.core.count.call(null, c__7659);
        var b__7661 = cljs.core.chunk_buffer.call(null, size__7660);
        var n__2426__auto____7662 = size__7660;
        var i__7663 = 0;
        while(true) {
          if(i__7663 < n__2426__auto____7662) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__7659, i__7663)))) {
              cljs.core.chunk_append.call(null, b__7661, cljs.core._nth.call(null, c__7659, i__7663))
            }else {
            }
            var G__7666 = i__7663 + 1;
            i__7663 = G__7666;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7661), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__7658)))
      }else {
        var f__7664 = cljs.core.first.call(null, s__7658);
        var r__7665 = cljs.core.rest.call(null, s__7658);
        if(cljs.core.truth_(pred.call(null, f__7664))) {
          return cljs.core.cons.call(null, f__7664, filter.call(null, pred, r__7665))
        }else {
          return filter.call(null, pred, r__7665)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__7669 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__7669.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__7667_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__7667_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__7673__7674 = to;
    if(G__7673__7674) {
      if(function() {
        var or__3943__auto____7675 = G__7673__7674.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____7675) {
          return or__3943__auto____7675
        }else {
          return G__7673__7674.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__7673__7674.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__7673__7674)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__7673__7674)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__7676__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__7676 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7676__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7676.cljs$lang$maxFixedArity = 4;
    G__7676.cljs$lang$applyTo = function(arglist__7677) {
      var f = cljs.core.first(arglist__7677);
      var c1 = cljs.core.first(cljs.core.next(arglist__7677));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7677)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7677))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7677))));
      return G__7676__delegate(f, c1, c2, c3, colls)
    };
    G__7676.cljs$lang$arity$variadic = G__7676__delegate;
    return G__7676
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7684 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7684) {
        var s__7685 = temp__4092__auto____7684;
        var p__7686 = cljs.core.take.call(null, n, s__7685);
        if(n === cljs.core.count.call(null, p__7686)) {
          return cljs.core.cons.call(null, p__7686, partition.call(null, n, step, cljs.core.drop.call(null, step, s__7685)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7687 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7687) {
        var s__7688 = temp__4092__auto____7687;
        var p__7689 = cljs.core.take.call(null, n, s__7688);
        if(n === cljs.core.count.call(null, p__7689)) {
          return cljs.core.cons.call(null, p__7689, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__7688)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__7689, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__7694 = cljs.core.lookup_sentinel;
    var m__7695 = m;
    var ks__7696 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__7696) {
        var m__7697 = cljs.core._lookup.call(null, m__7695, cljs.core.first.call(null, ks__7696), sentinel__7694);
        if(sentinel__7694 === m__7697) {
          return not_found
        }else {
          var G__7698 = sentinel__7694;
          var G__7699 = m__7697;
          var G__7700 = cljs.core.next.call(null, ks__7696);
          sentinel__7694 = G__7698;
          m__7695 = G__7699;
          ks__7696 = G__7700;
          continue
        }
      }else {
        return m__7695
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__7701, v) {
  var vec__7706__7707 = p__7701;
  var k__7708 = cljs.core.nth.call(null, vec__7706__7707, 0, null);
  var ks__7709 = cljs.core.nthnext.call(null, vec__7706__7707, 1);
  if(cljs.core.truth_(ks__7709)) {
    return cljs.core.assoc.call(null, m, k__7708, assoc_in.call(null, cljs.core._lookup.call(null, m, k__7708, null), ks__7709, v))
  }else {
    return cljs.core.assoc.call(null, m, k__7708, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__7710, f, args) {
    var vec__7715__7716 = p__7710;
    var k__7717 = cljs.core.nth.call(null, vec__7715__7716, 0, null);
    var ks__7718 = cljs.core.nthnext.call(null, vec__7715__7716, 1);
    if(cljs.core.truth_(ks__7718)) {
      return cljs.core.assoc.call(null, m, k__7717, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__7717, null), ks__7718, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__7717, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__7717, null), args))
    }
  };
  var update_in = function(m, p__7710, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__7710, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__7719) {
    var m = cljs.core.first(arglist__7719);
    var p__7710 = cljs.core.first(cljs.core.next(arglist__7719));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7719)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7719)));
    return update_in__delegate(m, p__7710, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7722 = this;
  var h__2087__auto____7723 = this__7722.__hash;
  if(!(h__2087__auto____7723 == null)) {
    return h__2087__auto____7723
  }else {
    var h__2087__auto____7724 = cljs.core.hash_coll.call(null, coll);
    this__7722.__hash = h__2087__auto____7724;
    return h__2087__auto____7724
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7725 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7726 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7727 = this;
  var new_array__7728 = this__7727.array.slice();
  new_array__7728[k] = v;
  return new cljs.core.Vector(this__7727.meta, new_array__7728, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__7759 = null;
  var G__7759__2 = function(this_sym7729, k) {
    var this__7731 = this;
    var this_sym7729__7732 = this;
    var coll__7733 = this_sym7729__7732;
    return coll__7733.cljs$core$ILookup$_lookup$arity$2(coll__7733, k)
  };
  var G__7759__3 = function(this_sym7730, k, not_found) {
    var this__7731 = this;
    var this_sym7730__7734 = this;
    var coll__7735 = this_sym7730__7734;
    return coll__7735.cljs$core$ILookup$_lookup$arity$3(coll__7735, k, not_found)
  };
  G__7759 = function(this_sym7730, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7759__2.call(this, this_sym7730, k);
      case 3:
        return G__7759__3.call(this, this_sym7730, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7759
}();
cljs.core.Vector.prototype.apply = function(this_sym7720, args7721) {
  var this__7736 = this;
  return this_sym7720.call.apply(this_sym7720, [this_sym7720].concat(args7721.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7737 = this;
  var new_array__7738 = this__7737.array.slice();
  new_array__7738.push(o);
  return new cljs.core.Vector(this__7737.meta, new_array__7738, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__7739 = this;
  var this__7740 = this;
  return cljs.core.pr_str.call(null, this__7740)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__7741 = this;
  return cljs.core.ci_reduce.call(null, this__7741.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__7742 = this;
  return cljs.core.ci_reduce.call(null, this__7742.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7743 = this;
  if(this__7743.array.length > 0) {
    var vector_seq__7744 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__7743.array.length) {
          return cljs.core.cons.call(null, this__7743.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__7744.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7745 = this;
  return this__7745.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7746 = this;
  var count__7747 = this__7746.array.length;
  if(count__7747 > 0) {
    return this__7746.array[count__7747 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7748 = this;
  if(this__7748.array.length > 0) {
    var new_array__7749 = this__7748.array.slice();
    new_array__7749.pop();
    return new cljs.core.Vector(this__7748.meta, new_array__7749, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7750 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7751 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7752 = this;
  return new cljs.core.Vector(meta, this__7752.array, this__7752.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7753 = this;
  return this__7753.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7754 = this;
  if(function() {
    var and__3941__auto____7755 = 0 <= n;
    if(and__3941__auto____7755) {
      return n < this__7754.array.length
    }else {
      return and__3941__auto____7755
    }
  }()) {
    return this__7754.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7756 = this;
  if(function() {
    var and__3941__auto____7757 = 0 <= n;
    if(and__3941__auto____7757) {
      return n < this__7756.array.length
    }else {
      return and__3941__auto____7757
    }
  }()) {
    return this__7756.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7758 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7758.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2205__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__7761 = pv.cnt;
  if(cnt__7761 < 32) {
    return 0
  }else {
    return cnt__7761 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__7767 = level;
  var ret__7768 = node;
  while(true) {
    if(ll__7767 === 0) {
      return ret__7768
    }else {
      var embed__7769 = ret__7768;
      var r__7770 = cljs.core.pv_fresh_node.call(null, edit);
      var ___7771 = cljs.core.pv_aset.call(null, r__7770, 0, embed__7769);
      var G__7772 = ll__7767 - 5;
      var G__7773 = r__7770;
      ll__7767 = G__7772;
      ret__7768 = G__7773;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__7779 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__7780 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__7779, subidx__7780, tailnode);
    return ret__7779
  }else {
    var child__7781 = cljs.core.pv_aget.call(null, parent, subidx__7780);
    if(!(child__7781 == null)) {
      var node_to_insert__7782 = push_tail.call(null, pv, level - 5, child__7781, tailnode);
      cljs.core.pv_aset.call(null, ret__7779, subidx__7780, node_to_insert__7782);
      return ret__7779
    }else {
      var node_to_insert__7783 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__7779, subidx__7780, node_to_insert__7783);
      return ret__7779
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____7787 = 0 <= i;
    if(and__3941__auto____7787) {
      return i < pv.cnt
    }else {
      return and__3941__auto____7787
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__7788 = pv.root;
      var level__7789 = pv.shift;
      while(true) {
        if(level__7789 > 0) {
          var G__7790 = cljs.core.pv_aget.call(null, node__7788, i >>> level__7789 & 31);
          var G__7791 = level__7789 - 5;
          node__7788 = G__7790;
          level__7789 = G__7791;
          continue
        }else {
          return node__7788.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__7794 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__7794, i & 31, val);
    return ret__7794
  }else {
    var subidx__7795 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__7794, subidx__7795, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__7795), i, val));
    return ret__7794
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__7801 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7802 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__7801));
    if(function() {
      var and__3941__auto____7803 = new_child__7802 == null;
      if(and__3941__auto____7803) {
        return subidx__7801 === 0
      }else {
        return and__3941__auto____7803
      }
    }()) {
      return null
    }else {
      var ret__7804 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__7804, subidx__7801, new_child__7802);
      return ret__7804
    }
  }else {
    if(subidx__7801 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__7805 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__7805, subidx__7801, null);
        return ret__7805
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7808 = this;
  return new cljs.core.TransientVector(this__7808.cnt, this__7808.shift, cljs.core.tv_editable_root.call(null, this__7808.root), cljs.core.tv_editable_tail.call(null, this__7808.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7809 = this;
  var h__2087__auto____7810 = this__7809.__hash;
  if(!(h__2087__auto____7810 == null)) {
    return h__2087__auto____7810
  }else {
    var h__2087__auto____7811 = cljs.core.hash_coll.call(null, coll);
    this__7809.__hash = h__2087__auto____7811;
    return h__2087__auto____7811
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7812 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7813 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7814 = this;
  if(function() {
    var and__3941__auto____7815 = 0 <= k;
    if(and__3941__auto____7815) {
      return k < this__7814.cnt
    }else {
      return and__3941__auto____7815
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__7816 = this__7814.tail.slice();
      new_tail__7816[k & 31] = v;
      return new cljs.core.PersistentVector(this__7814.meta, this__7814.cnt, this__7814.shift, this__7814.root, new_tail__7816, null)
    }else {
      return new cljs.core.PersistentVector(this__7814.meta, this__7814.cnt, this__7814.shift, cljs.core.do_assoc.call(null, coll, this__7814.shift, this__7814.root, k, v), this__7814.tail, null)
    }
  }else {
    if(k === this__7814.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__7814.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__7864 = null;
  var G__7864__2 = function(this_sym7817, k) {
    var this__7819 = this;
    var this_sym7817__7820 = this;
    var coll__7821 = this_sym7817__7820;
    return coll__7821.cljs$core$ILookup$_lookup$arity$2(coll__7821, k)
  };
  var G__7864__3 = function(this_sym7818, k, not_found) {
    var this__7819 = this;
    var this_sym7818__7822 = this;
    var coll__7823 = this_sym7818__7822;
    return coll__7823.cljs$core$ILookup$_lookup$arity$3(coll__7823, k, not_found)
  };
  G__7864 = function(this_sym7818, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7864__2.call(this, this_sym7818, k);
      case 3:
        return G__7864__3.call(this, this_sym7818, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7864
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym7806, args7807) {
  var this__7824 = this;
  return this_sym7806.call.apply(this_sym7806, [this_sym7806].concat(args7807.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__7825 = this;
  var step_init__7826 = [0, init];
  var i__7827 = 0;
  while(true) {
    if(i__7827 < this__7825.cnt) {
      var arr__7828 = cljs.core.array_for.call(null, v, i__7827);
      var len__7829 = arr__7828.length;
      var init__7833 = function() {
        var j__7830 = 0;
        var init__7831 = step_init__7826[1];
        while(true) {
          if(j__7830 < len__7829) {
            var init__7832 = f.call(null, init__7831, j__7830 + i__7827, arr__7828[j__7830]);
            if(cljs.core.reduced_QMARK_.call(null, init__7832)) {
              return init__7832
            }else {
              var G__7865 = j__7830 + 1;
              var G__7866 = init__7832;
              j__7830 = G__7865;
              init__7831 = G__7866;
              continue
            }
          }else {
            step_init__7826[0] = len__7829;
            step_init__7826[1] = init__7831;
            return init__7831
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__7833)) {
        return cljs.core.deref.call(null, init__7833)
      }else {
        var G__7867 = i__7827 + step_init__7826[0];
        i__7827 = G__7867;
        continue
      }
    }else {
      return step_init__7826[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7834 = this;
  if(this__7834.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__7835 = this__7834.tail.slice();
    new_tail__7835.push(o);
    return new cljs.core.PersistentVector(this__7834.meta, this__7834.cnt + 1, this__7834.shift, this__7834.root, new_tail__7835, null)
  }else {
    var root_overflow_QMARK___7836 = this__7834.cnt >>> 5 > 1 << this__7834.shift;
    var new_shift__7837 = root_overflow_QMARK___7836 ? this__7834.shift + 5 : this__7834.shift;
    var new_root__7839 = root_overflow_QMARK___7836 ? function() {
      var n_r__7838 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__7838, 0, this__7834.root);
      cljs.core.pv_aset.call(null, n_r__7838, 1, cljs.core.new_path.call(null, null, this__7834.shift, new cljs.core.VectorNode(null, this__7834.tail)));
      return n_r__7838
    }() : cljs.core.push_tail.call(null, coll, this__7834.shift, this__7834.root, new cljs.core.VectorNode(null, this__7834.tail));
    return new cljs.core.PersistentVector(this__7834.meta, this__7834.cnt + 1, new_shift__7837, new_root__7839, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7840 = this;
  if(this__7840.cnt > 0) {
    return new cljs.core.RSeq(coll, this__7840.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__7841 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__7842 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__7843 = this;
  var this__7844 = this;
  return cljs.core.pr_str.call(null, this__7844)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__7845 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__7846 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7847 = this;
  if(this__7847.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7848 = this;
  return this__7848.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7849 = this;
  if(this__7849.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__7849.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7850 = this;
  if(this__7850.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__7850.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7850.meta)
    }else {
      if(1 < this__7850.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__7850.meta, this__7850.cnt - 1, this__7850.shift, this__7850.root, this__7850.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__7851 = cljs.core.array_for.call(null, coll, this__7850.cnt - 2);
          var nr__7852 = cljs.core.pop_tail.call(null, coll, this__7850.shift, this__7850.root);
          var new_root__7853 = nr__7852 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__7852;
          var cnt_1__7854 = this__7850.cnt - 1;
          if(function() {
            var and__3941__auto____7855 = 5 < this__7850.shift;
            if(and__3941__auto____7855) {
              return cljs.core.pv_aget.call(null, new_root__7853, 1) == null
            }else {
              return and__3941__auto____7855
            }
          }()) {
            return new cljs.core.PersistentVector(this__7850.meta, cnt_1__7854, this__7850.shift - 5, cljs.core.pv_aget.call(null, new_root__7853, 0), new_tail__7851, null)
          }else {
            return new cljs.core.PersistentVector(this__7850.meta, cnt_1__7854, this__7850.shift, new_root__7853, new_tail__7851, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7856 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7857 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7858 = this;
  return new cljs.core.PersistentVector(meta, this__7858.cnt, this__7858.shift, this__7858.root, this__7858.tail, this__7858.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7859 = this;
  return this__7859.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7860 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7861 = this;
  if(function() {
    var and__3941__auto____7862 = 0 <= n;
    if(and__3941__auto____7862) {
      return n < this__7861.cnt
    }else {
      return and__3941__auto____7862
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7863 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7863.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__7868 = xs.length;
  var xs__7869 = no_clone === true ? xs : xs.slice();
  if(l__7868 < 32) {
    return new cljs.core.PersistentVector(null, l__7868, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__7869, null)
  }else {
    var node__7870 = xs__7869.slice(0, 32);
    var v__7871 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__7870, null);
    var i__7872 = 32;
    var out__7873 = cljs.core._as_transient.call(null, v__7871);
    while(true) {
      if(i__7872 < l__7868) {
        var G__7874 = i__7872 + 1;
        var G__7875 = cljs.core.conj_BANG_.call(null, out__7873, xs__7869[i__7872]);
        i__7872 = G__7874;
        out__7873 = G__7875;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__7873)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__7876) {
    var args = cljs.core.seq(arglist__7876);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7877 = this;
  if(this__7877.off + 1 < this__7877.node.length) {
    var s__7878 = cljs.core.chunked_seq.call(null, this__7877.vec, this__7877.node, this__7877.i, this__7877.off + 1);
    if(s__7878 == null) {
      return null
    }else {
      return s__7878
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7879 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7880 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7881 = this;
  return this__7881.node[this__7881.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7882 = this;
  if(this__7882.off + 1 < this__7882.node.length) {
    var s__7883 = cljs.core.chunked_seq.call(null, this__7882.vec, this__7882.node, this__7882.i, this__7882.off + 1);
    if(s__7883 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__7883
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7884 = this;
  var l__7885 = this__7884.node.length;
  var s__7886 = this__7884.i + l__7885 < cljs.core._count.call(null, this__7884.vec) ? cljs.core.chunked_seq.call(null, this__7884.vec, this__7884.i + l__7885, 0) : null;
  if(s__7886 == null) {
    return null
  }else {
    return s__7886
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7887 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7888 = this;
  return cljs.core.chunked_seq.call(null, this__7888.vec, this__7888.node, this__7888.i, this__7888.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__7889 = this;
  return this__7889.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7890 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7890.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7891 = this;
  return cljs.core.array_chunk.call(null, this__7891.node, this__7891.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7892 = this;
  var l__7893 = this__7892.node.length;
  var s__7894 = this__7892.i + l__7893 < cljs.core._count.call(null, this__7892.vec) ? cljs.core.chunked_seq.call(null, this__7892.vec, this__7892.i + l__7893, 0) : null;
  if(s__7894 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__7894
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7897 = this;
  var h__2087__auto____7898 = this__7897.__hash;
  if(!(h__2087__auto____7898 == null)) {
    return h__2087__auto____7898
  }else {
    var h__2087__auto____7899 = cljs.core.hash_coll.call(null, coll);
    this__7897.__hash = h__2087__auto____7899;
    return h__2087__auto____7899
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7900 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7901 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__7902 = this;
  var v_pos__7903 = this__7902.start + key;
  return new cljs.core.Subvec(this__7902.meta, cljs.core._assoc.call(null, this__7902.v, v_pos__7903, val), this__7902.start, this__7902.end > v_pos__7903 + 1 ? this__7902.end : v_pos__7903 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__7929 = null;
  var G__7929__2 = function(this_sym7904, k) {
    var this__7906 = this;
    var this_sym7904__7907 = this;
    var coll__7908 = this_sym7904__7907;
    return coll__7908.cljs$core$ILookup$_lookup$arity$2(coll__7908, k)
  };
  var G__7929__3 = function(this_sym7905, k, not_found) {
    var this__7906 = this;
    var this_sym7905__7909 = this;
    var coll__7910 = this_sym7905__7909;
    return coll__7910.cljs$core$ILookup$_lookup$arity$3(coll__7910, k, not_found)
  };
  G__7929 = function(this_sym7905, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7929__2.call(this, this_sym7905, k);
      case 3:
        return G__7929__3.call(this, this_sym7905, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7929
}();
cljs.core.Subvec.prototype.apply = function(this_sym7895, args7896) {
  var this__7911 = this;
  return this_sym7895.call.apply(this_sym7895, [this_sym7895].concat(args7896.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7912 = this;
  return new cljs.core.Subvec(this__7912.meta, cljs.core._assoc_n.call(null, this__7912.v, this__7912.end, o), this__7912.start, this__7912.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__7913 = this;
  var this__7914 = this;
  return cljs.core.pr_str.call(null, this__7914)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7915 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7916 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7917 = this;
  var subvec_seq__7918 = function subvec_seq(i) {
    if(i === this__7917.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__7917.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__7918.call(null, this__7917.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7919 = this;
  return this__7919.end - this__7919.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7920 = this;
  return cljs.core._nth.call(null, this__7920.v, this__7920.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7921 = this;
  if(this__7921.start === this__7921.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__7921.meta, this__7921.v, this__7921.start, this__7921.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7922 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7923 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7924 = this;
  return new cljs.core.Subvec(meta, this__7924.v, this__7924.start, this__7924.end, this__7924.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7925 = this;
  return this__7925.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7926 = this;
  return cljs.core._nth.call(null, this__7926.v, this__7926.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7927 = this;
  return cljs.core._nth.call(null, this__7927.v, this__7927.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7928 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7928.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__7931 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__7931, 0, tl.length);
  return ret__7931
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__7935 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__7936 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__7935, subidx__7936, level === 5 ? tail_node : function() {
    var child__7937 = cljs.core.pv_aget.call(null, ret__7935, subidx__7936);
    if(!(child__7937 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__7937, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__7935
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__7942 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__7943 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7944 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__7942, subidx__7943));
    if(function() {
      var and__3941__auto____7945 = new_child__7944 == null;
      if(and__3941__auto____7945) {
        return subidx__7943 === 0
      }else {
        return and__3941__auto____7945
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__7942, subidx__7943, new_child__7944);
      return node__7942
    }
  }else {
    if(subidx__7943 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__7942, subidx__7943, null);
        return node__7942
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____7950 = 0 <= i;
    if(and__3941__auto____7950) {
      return i < tv.cnt
    }else {
      return and__3941__auto____7950
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__7951 = tv.root;
      var node__7952 = root__7951;
      var level__7953 = tv.shift;
      while(true) {
        if(level__7953 > 0) {
          var G__7954 = cljs.core.tv_ensure_editable.call(null, root__7951.edit, cljs.core.pv_aget.call(null, node__7952, i >>> level__7953 & 31));
          var G__7955 = level__7953 - 5;
          node__7952 = G__7954;
          level__7953 = G__7955;
          continue
        }else {
          return node__7952.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__7995 = null;
  var G__7995__2 = function(this_sym7958, k) {
    var this__7960 = this;
    var this_sym7958__7961 = this;
    var coll__7962 = this_sym7958__7961;
    return coll__7962.cljs$core$ILookup$_lookup$arity$2(coll__7962, k)
  };
  var G__7995__3 = function(this_sym7959, k, not_found) {
    var this__7960 = this;
    var this_sym7959__7963 = this;
    var coll__7964 = this_sym7959__7963;
    return coll__7964.cljs$core$ILookup$_lookup$arity$3(coll__7964, k, not_found)
  };
  G__7995 = function(this_sym7959, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7995__2.call(this, this_sym7959, k);
      case 3:
        return G__7995__3.call(this, this_sym7959, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7995
}();
cljs.core.TransientVector.prototype.apply = function(this_sym7956, args7957) {
  var this__7965 = this;
  return this_sym7956.call.apply(this_sym7956, [this_sym7956].concat(args7957.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7966 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7967 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7968 = this;
  if(this__7968.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7969 = this;
  if(function() {
    var and__3941__auto____7970 = 0 <= n;
    if(and__3941__auto____7970) {
      return n < this__7969.cnt
    }else {
      return and__3941__auto____7970
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7971 = this;
  if(this__7971.root.edit) {
    return this__7971.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__7972 = this;
  if(this__7972.root.edit) {
    if(function() {
      var and__3941__auto____7973 = 0 <= n;
      if(and__3941__auto____7973) {
        return n < this__7972.cnt
      }else {
        return and__3941__auto____7973
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__7972.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__7978 = function go(level, node) {
          var node__7976 = cljs.core.tv_ensure_editable.call(null, this__7972.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__7976, n & 31, val);
            return node__7976
          }else {
            var subidx__7977 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__7976, subidx__7977, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__7976, subidx__7977)));
            return node__7976
          }
        }.call(null, this__7972.shift, this__7972.root);
        this__7972.root = new_root__7978;
        return tcoll
      }
    }else {
      if(n === this__7972.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__7972.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__7979 = this;
  if(this__7979.root.edit) {
    if(this__7979.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__7979.cnt) {
        this__7979.cnt = 0;
        return tcoll
      }else {
        if((this__7979.cnt - 1 & 31) > 0) {
          this__7979.cnt = this__7979.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__7980 = cljs.core.editable_array_for.call(null, tcoll, this__7979.cnt - 2);
            var new_root__7982 = function() {
              var nr__7981 = cljs.core.tv_pop_tail.call(null, tcoll, this__7979.shift, this__7979.root);
              if(!(nr__7981 == null)) {
                return nr__7981
              }else {
                return new cljs.core.VectorNode(this__7979.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____7983 = 5 < this__7979.shift;
              if(and__3941__auto____7983) {
                return cljs.core.pv_aget.call(null, new_root__7982, 1) == null
              }else {
                return and__3941__auto____7983
              }
            }()) {
              var new_root__7984 = cljs.core.tv_ensure_editable.call(null, this__7979.root.edit, cljs.core.pv_aget.call(null, new_root__7982, 0));
              this__7979.root = new_root__7984;
              this__7979.shift = this__7979.shift - 5;
              this__7979.cnt = this__7979.cnt - 1;
              this__7979.tail = new_tail__7980;
              return tcoll
            }else {
              this__7979.root = new_root__7982;
              this__7979.cnt = this__7979.cnt - 1;
              this__7979.tail = new_tail__7980;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7985 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__7986 = this;
  if(this__7986.root.edit) {
    if(this__7986.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__7986.tail[this__7986.cnt & 31] = o;
      this__7986.cnt = this__7986.cnt + 1;
      return tcoll
    }else {
      var tail_node__7987 = new cljs.core.VectorNode(this__7986.root.edit, this__7986.tail);
      var new_tail__7988 = cljs.core.make_array.call(null, 32);
      new_tail__7988[0] = o;
      this__7986.tail = new_tail__7988;
      if(this__7986.cnt >>> 5 > 1 << this__7986.shift) {
        var new_root_array__7989 = cljs.core.make_array.call(null, 32);
        var new_shift__7990 = this__7986.shift + 5;
        new_root_array__7989[0] = this__7986.root;
        new_root_array__7989[1] = cljs.core.new_path.call(null, this__7986.root.edit, this__7986.shift, tail_node__7987);
        this__7986.root = new cljs.core.VectorNode(this__7986.root.edit, new_root_array__7989);
        this__7986.shift = new_shift__7990;
        this__7986.cnt = this__7986.cnt + 1;
        return tcoll
      }else {
        var new_root__7991 = cljs.core.tv_push_tail.call(null, tcoll, this__7986.shift, this__7986.root, tail_node__7987);
        this__7986.root = new_root__7991;
        this__7986.cnt = this__7986.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7992 = this;
  if(this__7992.root.edit) {
    this__7992.root.edit = null;
    var len__7993 = this__7992.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__7994 = cljs.core.make_array.call(null, len__7993);
    cljs.core.array_copy.call(null, this__7992.tail, 0, trimmed_tail__7994, 0, len__7993);
    return new cljs.core.PersistentVector(null, this__7992.cnt, this__7992.shift, this__7992.root, trimmed_tail__7994, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7996 = this;
  var h__2087__auto____7997 = this__7996.__hash;
  if(!(h__2087__auto____7997 == null)) {
    return h__2087__auto____7997
  }else {
    var h__2087__auto____7998 = cljs.core.hash_coll.call(null, coll);
    this__7996.__hash = h__2087__auto____7998;
    return h__2087__auto____7998
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7999 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8000 = this;
  var this__8001 = this;
  return cljs.core.pr_str.call(null, this__8001)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8002 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8003 = this;
  return cljs.core._first.call(null, this__8003.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8004 = this;
  var temp__4090__auto____8005 = cljs.core.next.call(null, this__8004.front);
  if(temp__4090__auto____8005) {
    var f1__8006 = temp__4090__auto____8005;
    return new cljs.core.PersistentQueueSeq(this__8004.meta, f1__8006, this__8004.rear, null)
  }else {
    if(this__8004.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8004.meta, this__8004.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8007 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8008 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8008.front, this__8008.rear, this__8008.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8009 = this;
  return this__8009.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8010 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8010.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8011 = this;
  var h__2087__auto____8012 = this__8011.__hash;
  if(!(h__2087__auto____8012 == null)) {
    return h__2087__auto____8012
  }else {
    var h__2087__auto____8013 = cljs.core.hash_coll.call(null, coll);
    this__8011.__hash = h__2087__auto____8013;
    return h__2087__auto____8013
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8014 = this;
  if(cljs.core.truth_(this__8014.front)) {
    return new cljs.core.PersistentQueue(this__8014.meta, this__8014.count + 1, this__8014.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____8015 = this__8014.rear;
      if(cljs.core.truth_(or__3943__auto____8015)) {
        return or__3943__auto____8015
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8014.meta, this__8014.count + 1, cljs.core.conj.call(null, this__8014.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8016 = this;
  var this__8017 = this;
  return cljs.core.pr_str.call(null, this__8017)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8018 = this;
  var rear__8019 = cljs.core.seq.call(null, this__8018.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____8020 = this__8018.front;
    if(cljs.core.truth_(or__3943__auto____8020)) {
      return or__3943__auto____8020
    }else {
      return rear__8019
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8018.front, cljs.core.seq.call(null, rear__8019), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8021 = this;
  return this__8021.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8022 = this;
  return cljs.core._first.call(null, this__8022.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8023 = this;
  if(cljs.core.truth_(this__8023.front)) {
    var temp__4090__auto____8024 = cljs.core.next.call(null, this__8023.front);
    if(temp__4090__auto____8024) {
      var f1__8025 = temp__4090__auto____8024;
      return new cljs.core.PersistentQueue(this__8023.meta, this__8023.count - 1, f1__8025, this__8023.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8023.meta, this__8023.count - 1, cljs.core.seq.call(null, this__8023.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8026 = this;
  return cljs.core.first.call(null, this__8026.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8027 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8028 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8029 = this;
  return new cljs.core.PersistentQueue(meta, this__8029.count, this__8029.front, this__8029.rear, this__8029.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8030 = this;
  return this__8030.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8031 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8032 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8035 = array.length;
  var i__8036 = 0;
  while(true) {
    if(i__8036 < len__8035) {
      if(k === array[i__8036]) {
        return i__8036
      }else {
        var G__8037 = i__8036 + incr;
        i__8036 = G__8037;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8040 = cljs.core.hash.call(null, a);
  var b__8041 = cljs.core.hash.call(null, b);
  if(a__8040 < b__8041) {
    return-1
  }else {
    if(a__8040 > b__8041) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8049 = m.keys;
  var len__8050 = ks__8049.length;
  var so__8051 = m.strobj;
  var out__8052 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8053 = 0;
  var out__8054 = cljs.core.transient$.call(null, out__8052);
  while(true) {
    if(i__8053 < len__8050) {
      var k__8055 = ks__8049[i__8053];
      var G__8056 = i__8053 + 1;
      var G__8057 = cljs.core.assoc_BANG_.call(null, out__8054, k__8055, so__8051[k__8055]);
      i__8053 = G__8056;
      out__8054 = G__8057;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8054, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8063 = {};
  var l__8064 = ks.length;
  var i__8065 = 0;
  while(true) {
    if(i__8065 < l__8064) {
      var k__8066 = ks[i__8065];
      new_obj__8063[k__8066] = obj[k__8066];
      var G__8067 = i__8065 + 1;
      i__8065 = G__8067;
      continue
    }else {
    }
    break
  }
  return new_obj__8063
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8070 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8071 = this;
  var h__2087__auto____8072 = this__8071.__hash;
  if(!(h__2087__auto____8072 == null)) {
    return h__2087__auto____8072
  }else {
    var h__2087__auto____8073 = cljs.core.hash_imap.call(null, coll);
    this__8071.__hash = h__2087__auto____8073;
    return h__2087__auto____8073
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8074 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8075 = this;
  if(function() {
    var and__3941__auto____8076 = goog.isString(k);
    if(and__3941__auto____8076) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8075.keys) == null)
    }else {
      return and__3941__auto____8076
    }
  }()) {
    return this__8075.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8077 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____8078 = this__8077.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____8078) {
        return or__3943__auto____8078
      }else {
        return this__8077.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8077.keys) == null)) {
        var new_strobj__8079 = cljs.core.obj_clone.call(null, this__8077.strobj, this__8077.keys);
        new_strobj__8079[k] = v;
        return new cljs.core.ObjMap(this__8077.meta, this__8077.keys, new_strobj__8079, this__8077.update_count + 1, null)
      }else {
        var new_strobj__8080 = cljs.core.obj_clone.call(null, this__8077.strobj, this__8077.keys);
        var new_keys__8081 = this__8077.keys.slice();
        new_strobj__8080[k] = v;
        new_keys__8081.push(k);
        return new cljs.core.ObjMap(this__8077.meta, new_keys__8081, new_strobj__8080, this__8077.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8082 = this;
  if(function() {
    var and__3941__auto____8083 = goog.isString(k);
    if(and__3941__auto____8083) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8082.keys) == null)
    }else {
      return and__3941__auto____8083
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8105 = null;
  var G__8105__2 = function(this_sym8084, k) {
    var this__8086 = this;
    var this_sym8084__8087 = this;
    var coll__8088 = this_sym8084__8087;
    return coll__8088.cljs$core$ILookup$_lookup$arity$2(coll__8088, k)
  };
  var G__8105__3 = function(this_sym8085, k, not_found) {
    var this__8086 = this;
    var this_sym8085__8089 = this;
    var coll__8090 = this_sym8085__8089;
    return coll__8090.cljs$core$ILookup$_lookup$arity$3(coll__8090, k, not_found)
  };
  G__8105 = function(this_sym8085, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8105__2.call(this, this_sym8085, k);
      case 3:
        return G__8105__3.call(this, this_sym8085, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8105
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8068, args8069) {
  var this__8091 = this;
  return this_sym8068.call.apply(this_sym8068, [this_sym8068].concat(args8069.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8092 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8093 = this;
  var this__8094 = this;
  return cljs.core.pr_str.call(null, this__8094)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8095 = this;
  if(this__8095.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8058_SHARP_) {
      return cljs.core.vector.call(null, p1__8058_SHARP_, this__8095.strobj[p1__8058_SHARP_])
    }, this__8095.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8096 = this;
  return this__8096.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8097 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8098 = this;
  return new cljs.core.ObjMap(meta, this__8098.keys, this__8098.strobj, this__8098.update_count, this__8098.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8099 = this;
  return this__8099.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8100 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8100.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8101 = this;
  if(function() {
    var and__3941__auto____8102 = goog.isString(k);
    if(and__3941__auto____8102) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8101.keys) == null)
    }else {
      return and__3941__auto____8102
    }
  }()) {
    var new_keys__8103 = this__8101.keys.slice();
    var new_strobj__8104 = cljs.core.obj_clone.call(null, this__8101.strobj, this__8101.keys);
    new_keys__8103.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8103), 1);
    cljs.core.js_delete.call(null, new_strobj__8104, k);
    return new cljs.core.ObjMap(this__8101.meta, new_keys__8103, new_strobj__8104, this__8101.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8109 = this;
  var h__2087__auto____8110 = this__8109.__hash;
  if(!(h__2087__auto____8110 == null)) {
    return h__2087__auto____8110
  }else {
    var h__2087__auto____8111 = cljs.core.hash_imap.call(null, coll);
    this__8109.__hash = h__2087__auto____8111;
    return h__2087__auto____8111
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8112 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8113 = this;
  var bucket__8114 = this__8113.hashobj[cljs.core.hash.call(null, k)];
  var i__8115 = cljs.core.truth_(bucket__8114) ? cljs.core.scan_array.call(null, 2, k, bucket__8114) : null;
  if(cljs.core.truth_(i__8115)) {
    return bucket__8114[i__8115 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8116 = this;
  var h__8117 = cljs.core.hash.call(null, k);
  var bucket__8118 = this__8116.hashobj[h__8117];
  if(cljs.core.truth_(bucket__8118)) {
    var new_bucket__8119 = bucket__8118.slice();
    var new_hashobj__8120 = goog.object.clone(this__8116.hashobj);
    new_hashobj__8120[h__8117] = new_bucket__8119;
    var temp__4090__auto____8121 = cljs.core.scan_array.call(null, 2, k, new_bucket__8119);
    if(cljs.core.truth_(temp__4090__auto____8121)) {
      var i__8122 = temp__4090__auto____8121;
      new_bucket__8119[i__8122 + 1] = v;
      return new cljs.core.HashMap(this__8116.meta, this__8116.count, new_hashobj__8120, null)
    }else {
      new_bucket__8119.push(k, v);
      return new cljs.core.HashMap(this__8116.meta, this__8116.count + 1, new_hashobj__8120, null)
    }
  }else {
    var new_hashobj__8123 = goog.object.clone(this__8116.hashobj);
    new_hashobj__8123[h__8117] = [k, v];
    return new cljs.core.HashMap(this__8116.meta, this__8116.count + 1, new_hashobj__8123, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8124 = this;
  var bucket__8125 = this__8124.hashobj[cljs.core.hash.call(null, k)];
  var i__8126 = cljs.core.truth_(bucket__8125) ? cljs.core.scan_array.call(null, 2, k, bucket__8125) : null;
  if(cljs.core.truth_(i__8126)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8151 = null;
  var G__8151__2 = function(this_sym8127, k) {
    var this__8129 = this;
    var this_sym8127__8130 = this;
    var coll__8131 = this_sym8127__8130;
    return coll__8131.cljs$core$ILookup$_lookup$arity$2(coll__8131, k)
  };
  var G__8151__3 = function(this_sym8128, k, not_found) {
    var this__8129 = this;
    var this_sym8128__8132 = this;
    var coll__8133 = this_sym8128__8132;
    return coll__8133.cljs$core$ILookup$_lookup$arity$3(coll__8133, k, not_found)
  };
  G__8151 = function(this_sym8128, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8151__2.call(this, this_sym8128, k);
      case 3:
        return G__8151__3.call(this, this_sym8128, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8151
}();
cljs.core.HashMap.prototype.apply = function(this_sym8107, args8108) {
  var this__8134 = this;
  return this_sym8107.call.apply(this_sym8107, [this_sym8107].concat(args8108.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8135 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8136 = this;
  var this__8137 = this;
  return cljs.core.pr_str.call(null, this__8137)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8138 = this;
  if(this__8138.count > 0) {
    var hashes__8139 = cljs.core.js_keys.call(null, this__8138.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8106_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8138.hashobj[p1__8106_SHARP_]))
    }, hashes__8139)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8140 = this;
  return this__8140.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8141 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8142 = this;
  return new cljs.core.HashMap(meta, this__8142.count, this__8142.hashobj, this__8142.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8143 = this;
  return this__8143.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8144 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8144.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8145 = this;
  var h__8146 = cljs.core.hash.call(null, k);
  var bucket__8147 = this__8145.hashobj[h__8146];
  var i__8148 = cljs.core.truth_(bucket__8147) ? cljs.core.scan_array.call(null, 2, k, bucket__8147) : null;
  if(cljs.core.not.call(null, i__8148)) {
    return coll
  }else {
    var new_hashobj__8149 = goog.object.clone(this__8145.hashobj);
    if(3 > bucket__8147.length) {
      cljs.core.js_delete.call(null, new_hashobj__8149, h__8146)
    }else {
      var new_bucket__8150 = bucket__8147.slice();
      new_bucket__8150.splice(i__8148, 2);
      new_hashobj__8149[h__8146] = new_bucket__8150
    }
    return new cljs.core.HashMap(this__8145.meta, this__8145.count - 1, new_hashobj__8149, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8152 = ks.length;
  var i__8153 = 0;
  var out__8154 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8153 < len__8152) {
      var G__8155 = i__8153 + 1;
      var G__8156 = cljs.core.assoc.call(null, out__8154, ks[i__8153], vs[i__8153]);
      i__8153 = G__8155;
      out__8154 = G__8156;
      continue
    }else {
      return out__8154
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8160 = m.arr;
  var len__8161 = arr__8160.length;
  var i__8162 = 0;
  while(true) {
    if(len__8161 <= i__8162) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8160[i__8162], k)) {
        return i__8162
      }else {
        if("\ufdd0'else") {
          var G__8163 = i__8162 + 2;
          i__8162 = G__8163;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8166 = this;
  return new cljs.core.TransientArrayMap({}, this__8166.arr.length, this__8166.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8167 = this;
  var h__2087__auto____8168 = this__8167.__hash;
  if(!(h__2087__auto____8168 == null)) {
    return h__2087__auto____8168
  }else {
    var h__2087__auto____8169 = cljs.core.hash_imap.call(null, coll);
    this__8167.__hash = h__2087__auto____8169;
    return h__2087__auto____8169
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8170 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8171 = this;
  var idx__8172 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8172 === -1) {
    return not_found
  }else {
    return this__8171.arr[idx__8172 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8173 = this;
  var idx__8174 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8174 === -1) {
    if(this__8173.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8173.meta, this__8173.cnt + 1, function() {
        var G__8175__8176 = this__8173.arr.slice();
        G__8175__8176.push(k);
        G__8175__8176.push(v);
        return G__8175__8176
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8173.arr[idx__8174 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8173.meta, this__8173.cnt, function() {
          var G__8177__8178 = this__8173.arr.slice();
          G__8177__8178[idx__8174 + 1] = v;
          return G__8177__8178
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8179 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8211 = null;
  var G__8211__2 = function(this_sym8180, k) {
    var this__8182 = this;
    var this_sym8180__8183 = this;
    var coll__8184 = this_sym8180__8183;
    return coll__8184.cljs$core$ILookup$_lookup$arity$2(coll__8184, k)
  };
  var G__8211__3 = function(this_sym8181, k, not_found) {
    var this__8182 = this;
    var this_sym8181__8185 = this;
    var coll__8186 = this_sym8181__8185;
    return coll__8186.cljs$core$ILookup$_lookup$arity$3(coll__8186, k, not_found)
  };
  G__8211 = function(this_sym8181, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8211__2.call(this, this_sym8181, k);
      case 3:
        return G__8211__3.call(this, this_sym8181, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8211
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8164, args8165) {
  var this__8187 = this;
  return this_sym8164.call.apply(this_sym8164, [this_sym8164].concat(args8165.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8188 = this;
  var len__8189 = this__8188.arr.length;
  var i__8190 = 0;
  var init__8191 = init;
  while(true) {
    if(i__8190 < len__8189) {
      var init__8192 = f.call(null, init__8191, this__8188.arr[i__8190], this__8188.arr[i__8190 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8192)) {
        return cljs.core.deref.call(null, init__8192)
      }else {
        var G__8212 = i__8190 + 2;
        var G__8213 = init__8192;
        i__8190 = G__8212;
        init__8191 = G__8213;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8193 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8194 = this;
  var this__8195 = this;
  return cljs.core.pr_str.call(null, this__8195)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8196 = this;
  if(this__8196.cnt > 0) {
    var len__8197 = this__8196.arr.length;
    var array_map_seq__8198 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8197) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8196.arr[i], this__8196.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8198.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8199 = this;
  return this__8199.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8200 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8201 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8201.cnt, this__8201.arr, this__8201.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8202 = this;
  return this__8202.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8203 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8203.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8204 = this;
  var idx__8205 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8205 >= 0) {
    var len__8206 = this__8204.arr.length;
    var new_len__8207 = len__8206 - 2;
    if(new_len__8207 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8208 = cljs.core.make_array.call(null, new_len__8207);
      var s__8209 = 0;
      var d__8210 = 0;
      while(true) {
        if(s__8209 >= len__8206) {
          return new cljs.core.PersistentArrayMap(this__8204.meta, this__8204.cnt - 1, new_arr__8208, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8204.arr[s__8209])) {
            var G__8214 = s__8209 + 2;
            var G__8215 = d__8210;
            s__8209 = G__8214;
            d__8210 = G__8215;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8208[d__8210] = this__8204.arr[s__8209];
              new_arr__8208[d__8210 + 1] = this__8204.arr[s__8209 + 1];
              var G__8216 = s__8209 + 2;
              var G__8217 = d__8210 + 2;
              s__8209 = G__8216;
              d__8210 = G__8217;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8218 = cljs.core.count.call(null, ks);
  var i__8219 = 0;
  var out__8220 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8219 < len__8218) {
      var G__8221 = i__8219 + 1;
      var G__8222 = cljs.core.assoc_BANG_.call(null, out__8220, ks[i__8219], vs[i__8219]);
      i__8219 = G__8221;
      out__8220 = G__8222;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8220)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8223 = this;
  if(cljs.core.truth_(this__8223.editable_QMARK_)) {
    var idx__8224 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8224 >= 0) {
      this__8223.arr[idx__8224] = this__8223.arr[this__8223.len - 2];
      this__8223.arr[idx__8224 + 1] = this__8223.arr[this__8223.len - 1];
      var G__8225__8226 = this__8223.arr;
      G__8225__8226.pop();
      G__8225__8226.pop();
      G__8225__8226;
      this__8223.len = this__8223.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8227 = this;
  if(cljs.core.truth_(this__8227.editable_QMARK_)) {
    var idx__8228 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8228 === -1) {
      if(this__8227.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8227.len = this__8227.len + 2;
        this__8227.arr.push(key);
        this__8227.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8227.len, this__8227.arr), key, val)
      }
    }else {
      if(val === this__8227.arr[idx__8228 + 1]) {
        return tcoll
      }else {
        this__8227.arr[idx__8228 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8229 = this;
  if(cljs.core.truth_(this__8229.editable_QMARK_)) {
    if(function() {
      var G__8230__8231 = o;
      if(G__8230__8231) {
        if(function() {
          var or__3943__auto____8232 = G__8230__8231.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8232) {
            return or__3943__auto____8232
          }else {
            return G__8230__8231.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8230__8231.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8230__8231)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8230__8231)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8233 = cljs.core.seq.call(null, o);
      var tcoll__8234 = tcoll;
      while(true) {
        var temp__4090__auto____8235 = cljs.core.first.call(null, es__8233);
        if(cljs.core.truth_(temp__4090__auto____8235)) {
          var e__8236 = temp__4090__auto____8235;
          var G__8242 = cljs.core.next.call(null, es__8233);
          var G__8243 = tcoll__8234.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8234, cljs.core.key.call(null, e__8236), cljs.core.val.call(null, e__8236));
          es__8233 = G__8242;
          tcoll__8234 = G__8243;
          continue
        }else {
          return tcoll__8234
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8237 = this;
  if(cljs.core.truth_(this__8237.editable_QMARK_)) {
    this__8237.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8237.len, 2), this__8237.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8238 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8239 = this;
  if(cljs.core.truth_(this__8239.editable_QMARK_)) {
    var idx__8240 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8240 === -1) {
      return not_found
    }else {
      return this__8239.arr[idx__8240 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8241 = this;
  if(cljs.core.truth_(this__8241.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8241.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8246 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8247 = 0;
  while(true) {
    if(i__8247 < len) {
      var G__8248 = cljs.core.assoc_BANG_.call(null, out__8246, arr[i__8247], arr[i__8247 + 1]);
      var G__8249 = i__8247 + 2;
      out__8246 = G__8248;
      i__8247 = G__8249;
      continue
    }else {
      return out__8246
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2205__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8254__8255 = arr.slice();
    G__8254__8255[i] = a;
    return G__8254__8255
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8256__8257 = arr.slice();
    G__8256__8257[i] = a;
    G__8256__8257[j] = b;
    return G__8256__8257
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8259 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8259, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8259, 2 * i, new_arr__8259.length - 2 * i);
  return new_arr__8259
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8262 = inode.ensure_editable(edit);
    editable__8262.arr[i] = a;
    return editable__8262
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8263 = inode.ensure_editable(edit);
    editable__8263.arr[i] = a;
    editable__8263.arr[j] = b;
    return editable__8263
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8270 = arr.length;
  var i__8271 = 0;
  var init__8272 = init;
  while(true) {
    if(i__8271 < len__8270) {
      var init__8275 = function() {
        var k__8273 = arr[i__8271];
        if(!(k__8273 == null)) {
          return f.call(null, init__8272, k__8273, arr[i__8271 + 1])
        }else {
          var node__8274 = arr[i__8271 + 1];
          if(!(node__8274 == null)) {
            return node__8274.kv_reduce(f, init__8272)
          }else {
            return init__8272
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8275)) {
        return cljs.core.deref.call(null, init__8275)
      }else {
        var G__8276 = i__8271 + 2;
        var G__8277 = init__8275;
        i__8271 = G__8276;
        init__8272 = G__8277;
        continue
      }
    }else {
      return init__8272
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8278 = this;
  var inode__8279 = this;
  if(this__8278.bitmap === bit) {
    return null
  }else {
    var editable__8280 = inode__8279.ensure_editable(e);
    var earr__8281 = editable__8280.arr;
    var len__8282 = earr__8281.length;
    editable__8280.bitmap = bit ^ editable__8280.bitmap;
    cljs.core.array_copy.call(null, earr__8281, 2 * (i + 1), earr__8281, 2 * i, len__8282 - 2 * (i + 1));
    earr__8281[len__8282 - 2] = null;
    earr__8281[len__8282 - 1] = null;
    return editable__8280
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8283 = this;
  var inode__8284 = this;
  var bit__8285 = 1 << (hash >>> shift & 31);
  var idx__8286 = cljs.core.bitmap_indexed_node_index.call(null, this__8283.bitmap, bit__8285);
  if((this__8283.bitmap & bit__8285) === 0) {
    var n__8287 = cljs.core.bit_count.call(null, this__8283.bitmap);
    if(2 * n__8287 < this__8283.arr.length) {
      var editable__8288 = inode__8284.ensure_editable(edit);
      var earr__8289 = editable__8288.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8289, 2 * idx__8286, earr__8289, 2 * (idx__8286 + 1), 2 * (n__8287 - idx__8286));
      earr__8289[2 * idx__8286] = key;
      earr__8289[2 * idx__8286 + 1] = val;
      editable__8288.bitmap = editable__8288.bitmap | bit__8285;
      return editable__8288
    }else {
      if(n__8287 >= 16) {
        var nodes__8290 = cljs.core.make_array.call(null, 32);
        var jdx__8291 = hash >>> shift & 31;
        nodes__8290[jdx__8291] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8292 = 0;
        var j__8293 = 0;
        while(true) {
          if(i__8292 < 32) {
            if((this__8283.bitmap >>> i__8292 & 1) === 0) {
              var G__8346 = i__8292 + 1;
              var G__8347 = j__8293;
              i__8292 = G__8346;
              j__8293 = G__8347;
              continue
            }else {
              nodes__8290[i__8292] = !(this__8283.arr[j__8293] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8283.arr[j__8293]), this__8283.arr[j__8293], this__8283.arr[j__8293 + 1], added_leaf_QMARK_) : this__8283.arr[j__8293 + 1];
              var G__8348 = i__8292 + 1;
              var G__8349 = j__8293 + 2;
              i__8292 = G__8348;
              j__8293 = G__8349;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8287 + 1, nodes__8290)
      }else {
        if("\ufdd0'else") {
          var new_arr__8294 = cljs.core.make_array.call(null, 2 * (n__8287 + 4));
          cljs.core.array_copy.call(null, this__8283.arr, 0, new_arr__8294, 0, 2 * idx__8286);
          new_arr__8294[2 * idx__8286] = key;
          new_arr__8294[2 * idx__8286 + 1] = val;
          cljs.core.array_copy.call(null, this__8283.arr, 2 * idx__8286, new_arr__8294, 2 * (idx__8286 + 1), 2 * (n__8287 - idx__8286));
          added_leaf_QMARK_.val = true;
          var editable__8295 = inode__8284.ensure_editable(edit);
          editable__8295.arr = new_arr__8294;
          editable__8295.bitmap = editable__8295.bitmap | bit__8285;
          return editable__8295
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8296 = this__8283.arr[2 * idx__8286];
    var val_or_node__8297 = this__8283.arr[2 * idx__8286 + 1];
    if(key_or_nil__8296 == null) {
      var n__8298 = val_or_node__8297.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8298 === val_or_node__8297) {
        return inode__8284
      }else {
        return cljs.core.edit_and_set.call(null, inode__8284, edit, 2 * idx__8286 + 1, n__8298)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8296)) {
        if(val === val_or_node__8297) {
          return inode__8284
        }else {
          return cljs.core.edit_and_set.call(null, inode__8284, edit, 2 * idx__8286 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8284, edit, 2 * idx__8286, null, 2 * idx__8286 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8296, val_or_node__8297, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8299 = this;
  var inode__8300 = this;
  return cljs.core.create_inode_seq.call(null, this__8299.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8301 = this;
  var inode__8302 = this;
  var bit__8303 = 1 << (hash >>> shift & 31);
  if((this__8301.bitmap & bit__8303) === 0) {
    return inode__8302
  }else {
    var idx__8304 = cljs.core.bitmap_indexed_node_index.call(null, this__8301.bitmap, bit__8303);
    var key_or_nil__8305 = this__8301.arr[2 * idx__8304];
    var val_or_node__8306 = this__8301.arr[2 * idx__8304 + 1];
    if(key_or_nil__8305 == null) {
      var n__8307 = val_or_node__8306.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8307 === val_or_node__8306) {
        return inode__8302
      }else {
        if(!(n__8307 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8302, edit, 2 * idx__8304 + 1, n__8307)
        }else {
          if(this__8301.bitmap === bit__8303) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8302.edit_and_remove_pair(edit, bit__8303, idx__8304)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8305)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8302.edit_and_remove_pair(edit, bit__8303, idx__8304)
      }else {
        if("\ufdd0'else") {
          return inode__8302
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8308 = this;
  var inode__8309 = this;
  if(e === this__8308.edit) {
    return inode__8309
  }else {
    var n__8310 = cljs.core.bit_count.call(null, this__8308.bitmap);
    var new_arr__8311 = cljs.core.make_array.call(null, n__8310 < 0 ? 4 : 2 * (n__8310 + 1));
    cljs.core.array_copy.call(null, this__8308.arr, 0, new_arr__8311, 0, 2 * n__8310);
    return new cljs.core.BitmapIndexedNode(e, this__8308.bitmap, new_arr__8311)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8312 = this;
  var inode__8313 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8312.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8314 = this;
  var inode__8315 = this;
  var bit__8316 = 1 << (hash >>> shift & 31);
  if((this__8314.bitmap & bit__8316) === 0) {
    return not_found
  }else {
    var idx__8317 = cljs.core.bitmap_indexed_node_index.call(null, this__8314.bitmap, bit__8316);
    var key_or_nil__8318 = this__8314.arr[2 * idx__8317];
    var val_or_node__8319 = this__8314.arr[2 * idx__8317 + 1];
    if(key_or_nil__8318 == null) {
      return val_or_node__8319.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8318)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8318, val_or_node__8319], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8320 = this;
  var inode__8321 = this;
  var bit__8322 = 1 << (hash >>> shift & 31);
  if((this__8320.bitmap & bit__8322) === 0) {
    return inode__8321
  }else {
    var idx__8323 = cljs.core.bitmap_indexed_node_index.call(null, this__8320.bitmap, bit__8322);
    var key_or_nil__8324 = this__8320.arr[2 * idx__8323];
    var val_or_node__8325 = this__8320.arr[2 * idx__8323 + 1];
    if(key_or_nil__8324 == null) {
      var n__8326 = val_or_node__8325.inode_without(shift + 5, hash, key);
      if(n__8326 === val_or_node__8325) {
        return inode__8321
      }else {
        if(!(n__8326 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8320.bitmap, cljs.core.clone_and_set.call(null, this__8320.arr, 2 * idx__8323 + 1, n__8326))
        }else {
          if(this__8320.bitmap === bit__8322) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8320.bitmap ^ bit__8322, cljs.core.remove_pair.call(null, this__8320.arr, idx__8323))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8324)) {
        return new cljs.core.BitmapIndexedNode(null, this__8320.bitmap ^ bit__8322, cljs.core.remove_pair.call(null, this__8320.arr, idx__8323))
      }else {
        if("\ufdd0'else") {
          return inode__8321
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8327 = this;
  var inode__8328 = this;
  var bit__8329 = 1 << (hash >>> shift & 31);
  var idx__8330 = cljs.core.bitmap_indexed_node_index.call(null, this__8327.bitmap, bit__8329);
  if((this__8327.bitmap & bit__8329) === 0) {
    var n__8331 = cljs.core.bit_count.call(null, this__8327.bitmap);
    if(n__8331 >= 16) {
      var nodes__8332 = cljs.core.make_array.call(null, 32);
      var jdx__8333 = hash >>> shift & 31;
      nodes__8332[jdx__8333] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8334 = 0;
      var j__8335 = 0;
      while(true) {
        if(i__8334 < 32) {
          if((this__8327.bitmap >>> i__8334 & 1) === 0) {
            var G__8350 = i__8334 + 1;
            var G__8351 = j__8335;
            i__8334 = G__8350;
            j__8335 = G__8351;
            continue
          }else {
            nodes__8332[i__8334] = !(this__8327.arr[j__8335] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8327.arr[j__8335]), this__8327.arr[j__8335], this__8327.arr[j__8335 + 1], added_leaf_QMARK_) : this__8327.arr[j__8335 + 1];
            var G__8352 = i__8334 + 1;
            var G__8353 = j__8335 + 2;
            i__8334 = G__8352;
            j__8335 = G__8353;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8331 + 1, nodes__8332)
    }else {
      var new_arr__8336 = cljs.core.make_array.call(null, 2 * (n__8331 + 1));
      cljs.core.array_copy.call(null, this__8327.arr, 0, new_arr__8336, 0, 2 * idx__8330);
      new_arr__8336[2 * idx__8330] = key;
      new_arr__8336[2 * idx__8330 + 1] = val;
      cljs.core.array_copy.call(null, this__8327.arr, 2 * idx__8330, new_arr__8336, 2 * (idx__8330 + 1), 2 * (n__8331 - idx__8330));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8327.bitmap | bit__8329, new_arr__8336)
    }
  }else {
    var key_or_nil__8337 = this__8327.arr[2 * idx__8330];
    var val_or_node__8338 = this__8327.arr[2 * idx__8330 + 1];
    if(key_or_nil__8337 == null) {
      var n__8339 = val_or_node__8338.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8339 === val_or_node__8338) {
        return inode__8328
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8327.bitmap, cljs.core.clone_and_set.call(null, this__8327.arr, 2 * idx__8330 + 1, n__8339))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8337)) {
        if(val === val_or_node__8338) {
          return inode__8328
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8327.bitmap, cljs.core.clone_and_set.call(null, this__8327.arr, 2 * idx__8330 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8327.bitmap, cljs.core.clone_and_set.call(null, this__8327.arr, 2 * idx__8330, null, 2 * idx__8330 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8337, val_or_node__8338, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8340 = this;
  var inode__8341 = this;
  var bit__8342 = 1 << (hash >>> shift & 31);
  if((this__8340.bitmap & bit__8342) === 0) {
    return not_found
  }else {
    var idx__8343 = cljs.core.bitmap_indexed_node_index.call(null, this__8340.bitmap, bit__8342);
    var key_or_nil__8344 = this__8340.arr[2 * idx__8343];
    var val_or_node__8345 = this__8340.arr[2 * idx__8343 + 1];
    if(key_or_nil__8344 == null) {
      return val_or_node__8345.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8344)) {
        return val_or_node__8345
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8361 = array_node.arr;
  var len__8362 = 2 * (array_node.cnt - 1);
  var new_arr__8363 = cljs.core.make_array.call(null, len__8362);
  var i__8364 = 0;
  var j__8365 = 1;
  var bitmap__8366 = 0;
  while(true) {
    if(i__8364 < len__8362) {
      if(function() {
        var and__3941__auto____8367 = !(i__8364 === idx);
        if(and__3941__auto____8367) {
          return!(arr__8361[i__8364] == null)
        }else {
          return and__3941__auto____8367
        }
      }()) {
        new_arr__8363[j__8365] = arr__8361[i__8364];
        var G__8368 = i__8364 + 1;
        var G__8369 = j__8365 + 2;
        var G__8370 = bitmap__8366 | 1 << i__8364;
        i__8364 = G__8368;
        j__8365 = G__8369;
        bitmap__8366 = G__8370;
        continue
      }else {
        var G__8371 = i__8364 + 1;
        var G__8372 = j__8365;
        var G__8373 = bitmap__8366;
        i__8364 = G__8371;
        j__8365 = G__8372;
        bitmap__8366 = G__8373;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8366, new_arr__8363)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8374 = this;
  var inode__8375 = this;
  var idx__8376 = hash >>> shift & 31;
  var node__8377 = this__8374.arr[idx__8376];
  if(node__8377 == null) {
    var editable__8378 = cljs.core.edit_and_set.call(null, inode__8375, edit, idx__8376, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8378.cnt = editable__8378.cnt + 1;
    return editable__8378
  }else {
    var n__8379 = node__8377.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8379 === node__8377) {
      return inode__8375
    }else {
      return cljs.core.edit_and_set.call(null, inode__8375, edit, idx__8376, n__8379)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8380 = this;
  var inode__8381 = this;
  return cljs.core.create_array_node_seq.call(null, this__8380.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8382 = this;
  var inode__8383 = this;
  var idx__8384 = hash >>> shift & 31;
  var node__8385 = this__8382.arr[idx__8384];
  if(node__8385 == null) {
    return inode__8383
  }else {
    var n__8386 = node__8385.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8386 === node__8385) {
      return inode__8383
    }else {
      if(n__8386 == null) {
        if(this__8382.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8383, edit, idx__8384)
        }else {
          var editable__8387 = cljs.core.edit_and_set.call(null, inode__8383, edit, idx__8384, n__8386);
          editable__8387.cnt = editable__8387.cnt - 1;
          return editable__8387
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8383, edit, idx__8384, n__8386)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8388 = this;
  var inode__8389 = this;
  if(e === this__8388.edit) {
    return inode__8389
  }else {
    return new cljs.core.ArrayNode(e, this__8388.cnt, this__8388.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8390 = this;
  var inode__8391 = this;
  var len__8392 = this__8390.arr.length;
  var i__8393 = 0;
  var init__8394 = init;
  while(true) {
    if(i__8393 < len__8392) {
      var node__8395 = this__8390.arr[i__8393];
      if(!(node__8395 == null)) {
        var init__8396 = node__8395.kv_reduce(f, init__8394);
        if(cljs.core.reduced_QMARK_.call(null, init__8396)) {
          return cljs.core.deref.call(null, init__8396)
        }else {
          var G__8415 = i__8393 + 1;
          var G__8416 = init__8396;
          i__8393 = G__8415;
          init__8394 = G__8416;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8394
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8397 = this;
  var inode__8398 = this;
  var idx__8399 = hash >>> shift & 31;
  var node__8400 = this__8397.arr[idx__8399];
  if(!(node__8400 == null)) {
    return node__8400.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8401 = this;
  var inode__8402 = this;
  var idx__8403 = hash >>> shift & 31;
  var node__8404 = this__8401.arr[idx__8403];
  if(!(node__8404 == null)) {
    var n__8405 = node__8404.inode_without(shift + 5, hash, key);
    if(n__8405 === node__8404) {
      return inode__8402
    }else {
      if(n__8405 == null) {
        if(this__8401.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8402, null, idx__8403)
        }else {
          return new cljs.core.ArrayNode(null, this__8401.cnt - 1, cljs.core.clone_and_set.call(null, this__8401.arr, idx__8403, n__8405))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8401.cnt, cljs.core.clone_and_set.call(null, this__8401.arr, idx__8403, n__8405))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8402
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8406 = this;
  var inode__8407 = this;
  var idx__8408 = hash >>> shift & 31;
  var node__8409 = this__8406.arr[idx__8408];
  if(node__8409 == null) {
    return new cljs.core.ArrayNode(null, this__8406.cnt + 1, cljs.core.clone_and_set.call(null, this__8406.arr, idx__8408, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8410 = node__8409.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8410 === node__8409) {
      return inode__8407
    }else {
      return new cljs.core.ArrayNode(null, this__8406.cnt, cljs.core.clone_and_set.call(null, this__8406.arr, idx__8408, n__8410))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8411 = this;
  var inode__8412 = this;
  var idx__8413 = hash >>> shift & 31;
  var node__8414 = this__8411.arr[idx__8413];
  if(!(node__8414 == null)) {
    return node__8414.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8419 = 2 * cnt;
  var i__8420 = 0;
  while(true) {
    if(i__8420 < lim__8419) {
      if(cljs.core.key_test.call(null, key, arr[i__8420])) {
        return i__8420
      }else {
        var G__8421 = i__8420 + 2;
        i__8420 = G__8421;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8422 = this;
  var inode__8423 = this;
  if(hash === this__8422.collision_hash) {
    var idx__8424 = cljs.core.hash_collision_node_find_index.call(null, this__8422.arr, this__8422.cnt, key);
    if(idx__8424 === -1) {
      if(this__8422.arr.length > 2 * this__8422.cnt) {
        var editable__8425 = cljs.core.edit_and_set.call(null, inode__8423, edit, 2 * this__8422.cnt, key, 2 * this__8422.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8425.cnt = editable__8425.cnt + 1;
        return editable__8425
      }else {
        var len__8426 = this__8422.arr.length;
        var new_arr__8427 = cljs.core.make_array.call(null, len__8426 + 2);
        cljs.core.array_copy.call(null, this__8422.arr, 0, new_arr__8427, 0, len__8426);
        new_arr__8427[len__8426] = key;
        new_arr__8427[len__8426 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8423.ensure_editable_array(edit, this__8422.cnt + 1, new_arr__8427)
      }
    }else {
      if(this__8422.arr[idx__8424 + 1] === val) {
        return inode__8423
      }else {
        return cljs.core.edit_and_set.call(null, inode__8423, edit, idx__8424 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8422.collision_hash >>> shift & 31), [null, inode__8423, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8428 = this;
  var inode__8429 = this;
  return cljs.core.create_inode_seq.call(null, this__8428.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8430 = this;
  var inode__8431 = this;
  var idx__8432 = cljs.core.hash_collision_node_find_index.call(null, this__8430.arr, this__8430.cnt, key);
  if(idx__8432 === -1) {
    return inode__8431
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8430.cnt === 1) {
      return null
    }else {
      var editable__8433 = inode__8431.ensure_editable(edit);
      var earr__8434 = editable__8433.arr;
      earr__8434[idx__8432] = earr__8434[2 * this__8430.cnt - 2];
      earr__8434[idx__8432 + 1] = earr__8434[2 * this__8430.cnt - 1];
      earr__8434[2 * this__8430.cnt - 1] = null;
      earr__8434[2 * this__8430.cnt - 2] = null;
      editable__8433.cnt = editable__8433.cnt - 1;
      return editable__8433
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8435 = this;
  var inode__8436 = this;
  if(e === this__8435.edit) {
    return inode__8436
  }else {
    var new_arr__8437 = cljs.core.make_array.call(null, 2 * (this__8435.cnt + 1));
    cljs.core.array_copy.call(null, this__8435.arr, 0, new_arr__8437, 0, 2 * this__8435.cnt);
    return new cljs.core.HashCollisionNode(e, this__8435.collision_hash, this__8435.cnt, new_arr__8437)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8438 = this;
  var inode__8439 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8438.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8440 = this;
  var inode__8441 = this;
  var idx__8442 = cljs.core.hash_collision_node_find_index.call(null, this__8440.arr, this__8440.cnt, key);
  if(idx__8442 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8440.arr[idx__8442])) {
      return cljs.core.PersistentVector.fromArray([this__8440.arr[idx__8442], this__8440.arr[idx__8442 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8443 = this;
  var inode__8444 = this;
  var idx__8445 = cljs.core.hash_collision_node_find_index.call(null, this__8443.arr, this__8443.cnt, key);
  if(idx__8445 === -1) {
    return inode__8444
  }else {
    if(this__8443.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8443.collision_hash, this__8443.cnt - 1, cljs.core.remove_pair.call(null, this__8443.arr, cljs.core.quot.call(null, idx__8445, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8446 = this;
  var inode__8447 = this;
  if(hash === this__8446.collision_hash) {
    var idx__8448 = cljs.core.hash_collision_node_find_index.call(null, this__8446.arr, this__8446.cnt, key);
    if(idx__8448 === -1) {
      var len__8449 = this__8446.arr.length;
      var new_arr__8450 = cljs.core.make_array.call(null, len__8449 + 2);
      cljs.core.array_copy.call(null, this__8446.arr, 0, new_arr__8450, 0, len__8449);
      new_arr__8450[len__8449] = key;
      new_arr__8450[len__8449 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8446.collision_hash, this__8446.cnt + 1, new_arr__8450)
    }else {
      if(cljs.core._EQ_.call(null, this__8446.arr[idx__8448], val)) {
        return inode__8447
      }else {
        return new cljs.core.HashCollisionNode(null, this__8446.collision_hash, this__8446.cnt, cljs.core.clone_and_set.call(null, this__8446.arr, idx__8448 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8446.collision_hash >>> shift & 31), [null, inode__8447])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8451 = this;
  var inode__8452 = this;
  var idx__8453 = cljs.core.hash_collision_node_find_index.call(null, this__8451.arr, this__8451.cnt, key);
  if(idx__8453 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8451.arr[idx__8453])) {
      return this__8451.arr[idx__8453 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8454 = this;
  var inode__8455 = this;
  if(e === this__8454.edit) {
    this__8454.arr = array;
    this__8454.cnt = count;
    return inode__8455
  }else {
    return new cljs.core.HashCollisionNode(this__8454.edit, this__8454.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8460 = cljs.core.hash.call(null, key1);
    if(key1hash__8460 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8460, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8461 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8460, key1, val1, added_leaf_QMARK___8461).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8461)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8462 = cljs.core.hash.call(null, key1);
    if(key1hash__8462 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8462, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8463 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8462, key1, val1, added_leaf_QMARK___8463).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8463)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8464 = this;
  var h__2087__auto____8465 = this__8464.__hash;
  if(!(h__2087__auto____8465 == null)) {
    return h__2087__auto____8465
  }else {
    var h__2087__auto____8466 = cljs.core.hash_coll.call(null, coll);
    this__8464.__hash = h__2087__auto____8466;
    return h__2087__auto____8466
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8467 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8468 = this;
  var this__8469 = this;
  return cljs.core.pr_str.call(null, this__8469)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8470 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8471 = this;
  if(this__8471.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8471.nodes[this__8471.i], this__8471.nodes[this__8471.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8471.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8472 = this;
  if(this__8472.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8472.nodes, this__8472.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8472.nodes, this__8472.i, cljs.core.next.call(null, this__8472.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8473 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8474 = this;
  return new cljs.core.NodeSeq(meta, this__8474.nodes, this__8474.i, this__8474.s, this__8474.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8475 = this;
  return this__8475.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8476 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8476.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8483 = nodes.length;
      var j__8484 = i;
      while(true) {
        if(j__8484 < len__8483) {
          if(!(nodes[j__8484] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8484, null, null)
          }else {
            var temp__4090__auto____8485 = nodes[j__8484 + 1];
            if(cljs.core.truth_(temp__4090__auto____8485)) {
              var node__8486 = temp__4090__auto____8485;
              var temp__4090__auto____8487 = node__8486.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____8487)) {
                var node_seq__8488 = temp__4090__auto____8487;
                return new cljs.core.NodeSeq(null, nodes, j__8484 + 2, node_seq__8488, null)
              }else {
                var G__8489 = j__8484 + 2;
                j__8484 = G__8489;
                continue
              }
            }else {
              var G__8490 = j__8484 + 2;
              j__8484 = G__8490;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8491 = this;
  var h__2087__auto____8492 = this__8491.__hash;
  if(!(h__2087__auto____8492 == null)) {
    return h__2087__auto____8492
  }else {
    var h__2087__auto____8493 = cljs.core.hash_coll.call(null, coll);
    this__8491.__hash = h__2087__auto____8493;
    return h__2087__auto____8493
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8494 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8495 = this;
  var this__8496 = this;
  return cljs.core.pr_str.call(null, this__8496)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8497 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8498 = this;
  return cljs.core.first.call(null, this__8498.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8499 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8499.nodes, this__8499.i, cljs.core.next.call(null, this__8499.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8500 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8501 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8501.nodes, this__8501.i, this__8501.s, this__8501.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8502 = this;
  return this__8502.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8503 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8503.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8510 = nodes.length;
      var j__8511 = i;
      while(true) {
        if(j__8511 < len__8510) {
          var temp__4090__auto____8512 = nodes[j__8511];
          if(cljs.core.truth_(temp__4090__auto____8512)) {
            var nj__8513 = temp__4090__auto____8512;
            var temp__4090__auto____8514 = nj__8513.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____8514)) {
              var ns__8515 = temp__4090__auto____8514;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8511 + 1, ns__8515, null)
            }else {
              var G__8516 = j__8511 + 1;
              j__8511 = G__8516;
              continue
            }
          }else {
            var G__8517 = j__8511 + 1;
            j__8511 = G__8517;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8520 = this;
  return new cljs.core.TransientHashMap({}, this__8520.root, this__8520.cnt, this__8520.has_nil_QMARK_, this__8520.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8521 = this;
  var h__2087__auto____8522 = this__8521.__hash;
  if(!(h__2087__auto____8522 == null)) {
    return h__2087__auto____8522
  }else {
    var h__2087__auto____8523 = cljs.core.hash_imap.call(null, coll);
    this__8521.__hash = h__2087__auto____8523;
    return h__2087__auto____8523
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8524 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8525 = this;
  if(k == null) {
    if(this__8525.has_nil_QMARK_) {
      return this__8525.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8525.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8525.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8526 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____8527 = this__8526.has_nil_QMARK_;
      if(and__3941__auto____8527) {
        return v === this__8526.nil_val
      }else {
        return and__3941__auto____8527
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8526.meta, this__8526.has_nil_QMARK_ ? this__8526.cnt : this__8526.cnt + 1, this__8526.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8528 = new cljs.core.Box(false);
    var new_root__8529 = (this__8526.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8526.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8528);
    if(new_root__8529 === this__8526.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8526.meta, added_leaf_QMARK___8528.val ? this__8526.cnt + 1 : this__8526.cnt, new_root__8529, this__8526.has_nil_QMARK_, this__8526.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8530 = this;
  if(k == null) {
    return this__8530.has_nil_QMARK_
  }else {
    if(this__8530.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8530.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8553 = null;
  var G__8553__2 = function(this_sym8531, k) {
    var this__8533 = this;
    var this_sym8531__8534 = this;
    var coll__8535 = this_sym8531__8534;
    return coll__8535.cljs$core$ILookup$_lookup$arity$2(coll__8535, k)
  };
  var G__8553__3 = function(this_sym8532, k, not_found) {
    var this__8533 = this;
    var this_sym8532__8536 = this;
    var coll__8537 = this_sym8532__8536;
    return coll__8537.cljs$core$ILookup$_lookup$arity$3(coll__8537, k, not_found)
  };
  G__8553 = function(this_sym8532, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8553__2.call(this, this_sym8532, k);
      case 3:
        return G__8553__3.call(this, this_sym8532, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8553
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8518, args8519) {
  var this__8538 = this;
  return this_sym8518.call.apply(this_sym8518, [this_sym8518].concat(args8519.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8539 = this;
  var init__8540 = this__8539.has_nil_QMARK_ ? f.call(null, init, null, this__8539.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8540)) {
    return cljs.core.deref.call(null, init__8540)
  }else {
    if(!(this__8539.root == null)) {
      return this__8539.root.kv_reduce(f, init__8540)
    }else {
      if("\ufdd0'else") {
        return init__8540
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8541 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8542 = this;
  var this__8543 = this;
  return cljs.core.pr_str.call(null, this__8543)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8544 = this;
  if(this__8544.cnt > 0) {
    var s__8545 = !(this__8544.root == null) ? this__8544.root.inode_seq() : null;
    if(this__8544.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8544.nil_val], true), s__8545)
    }else {
      return s__8545
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8546 = this;
  return this__8546.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8547 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8548 = this;
  return new cljs.core.PersistentHashMap(meta, this__8548.cnt, this__8548.root, this__8548.has_nil_QMARK_, this__8548.nil_val, this__8548.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8549 = this;
  return this__8549.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8550 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8550.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8551 = this;
  if(k == null) {
    if(this__8551.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8551.meta, this__8551.cnt - 1, this__8551.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8551.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8552 = this__8551.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8552 === this__8551.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8551.meta, this__8551.cnt - 1, new_root__8552, this__8551.has_nil_QMARK_, this__8551.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8554 = ks.length;
  var i__8555 = 0;
  var out__8556 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8555 < len__8554) {
      var G__8557 = i__8555 + 1;
      var G__8558 = cljs.core.assoc_BANG_.call(null, out__8556, ks[i__8555], vs[i__8555]);
      i__8555 = G__8557;
      out__8556 = G__8558;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8556)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8559 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8560 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8561 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8562 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8563 = this;
  if(k == null) {
    if(this__8563.has_nil_QMARK_) {
      return this__8563.nil_val
    }else {
      return null
    }
  }else {
    if(this__8563.root == null) {
      return null
    }else {
      return this__8563.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8564 = this;
  if(k == null) {
    if(this__8564.has_nil_QMARK_) {
      return this__8564.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8564.root == null) {
      return not_found
    }else {
      return this__8564.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8565 = this;
  if(this__8565.edit) {
    return this__8565.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__8566 = this;
  var tcoll__8567 = this;
  if(this__8566.edit) {
    if(function() {
      var G__8568__8569 = o;
      if(G__8568__8569) {
        if(function() {
          var or__3943__auto____8570 = G__8568__8569.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8570) {
            return or__3943__auto____8570
          }else {
            return G__8568__8569.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8568__8569.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8568__8569)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8568__8569)
      }
    }()) {
      return tcoll__8567.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8571 = cljs.core.seq.call(null, o);
      var tcoll__8572 = tcoll__8567;
      while(true) {
        var temp__4090__auto____8573 = cljs.core.first.call(null, es__8571);
        if(cljs.core.truth_(temp__4090__auto____8573)) {
          var e__8574 = temp__4090__auto____8573;
          var G__8585 = cljs.core.next.call(null, es__8571);
          var G__8586 = tcoll__8572.assoc_BANG_(cljs.core.key.call(null, e__8574), cljs.core.val.call(null, e__8574));
          es__8571 = G__8585;
          tcoll__8572 = G__8586;
          continue
        }else {
          return tcoll__8572
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__8575 = this;
  var tcoll__8576 = this;
  if(this__8575.edit) {
    if(k == null) {
      if(this__8575.nil_val === v) {
      }else {
        this__8575.nil_val = v
      }
      if(this__8575.has_nil_QMARK_) {
      }else {
        this__8575.count = this__8575.count + 1;
        this__8575.has_nil_QMARK_ = true
      }
      return tcoll__8576
    }else {
      var added_leaf_QMARK___8577 = new cljs.core.Box(false);
      var node__8578 = (this__8575.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8575.root).inode_assoc_BANG_(this__8575.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8577);
      if(node__8578 === this__8575.root) {
      }else {
        this__8575.root = node__8578
      }
      if(added_leaf_QMARK___8577.val) {
        this__8575.count = this__8575.count + 1
      }else {
      }
      return tcoll__8576
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__8579 = this;
  var tcoll__8580 = this;
  if(this__8579.edit) {
    if(k == null) {
      if(this__8579.has_nil_QMARK_) {
        this__8579.has_nil_QMARK_ = false;
        this__8579.nil_val = null;
        this__8579.count = this__8579.count - 1;
        return tcoll__8580
      }else {
        return tcoll__8580
      }
    }else {
      if(this__8579.root == null) {
        return tcoll__8580
      }else {
        var removed_leaf_QMARK___8581 = new cljs.core.Box(false);
        var node__8582 = this__8579.root.inode_without_BANG_(this__8579.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___8581);
        if(node__8582 === this__8579.root) {
        }else {
          this__8579.root = node__8582
        }
        if(cljs.core.truth_(removed_leaf_QMARK___8581[0])) {
          this__8579.count = this__8579.count - 1
        }else {
        }
        return tcoll__8580
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__8583 = this;
  var tcoll__8584 = this;
  if(this__8583.edit) {
    this__8583.edit = null;
    return new cljs.core.PersistentHashMap(null, this__8583.count, this__8583.root, this__8583.has_nil_QMARK_, this__8583.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__8589 = node;
  var stack__8590 = stack;
  while(true) {
    if(!(t__8589 == null)) {
      var G__8591 = ascending_QMARK_ ? t__8589.left : t__8589.right;
      var G__8592 = cljs.core.conj.call(null, stack__8590, t__8589);
      t__8589 = G__8591;
      stack__8590 = G__8592;
      continue
    }else {
      return stack__8590
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8593 = this;
  var h__2087__auto____8594 = this__8593.__hash;
  if(!(h__2087__auto____8594 == null)) {
    return h__2087__auto____8594
  }else {
    var h__2087__auto____8595 = cljs.core.hash_coll.call(null, coll);
    this__8593.__hash = h__2087__auto____8595;
    return h__2087__auto____8595
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8596 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__8597 = this;
  var this__8598 = this;
  return cljs.core.pr_str.call(null, this__8598)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8599 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8600 = this;
  if(this__8600.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__8600.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__8601 = this;
  return cljs.core.peek.call(null, this__8601.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__8602 = this;
  var t__8603 = cljs.core.first.call(null, this__8602.stack);
  var next_stack__8604 = cljs.core.tree_map_seq_push.call(null, this__8602.ascending_QMARK_ ? t__8603.right : t__8603.left, cljs.core.next.call(null, this__8602.stack), this__8602.ascending_QMARK_);
  if(!(next_stack__8604 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__8604, this__8602.ascending_QMARK_, this__8602.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8605 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8606 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__8606.stack, this__8606.ascending_QMARK_, this__8606.cnt, this__8606.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8607 = this;
  return this__8607.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto____8609 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____8609) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____8609
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto____8611 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____8611) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____8611
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__8615 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__8615)) {
    return cljs.core.deref.call(null, init__8615)
  }else {
    var init__8616 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__8615) : init__8615;
    if(cljs.core.reduced_QMARK_.call(null, init__8616)) {
      return cljs.core.deref.call(null, init__8616)
    }else {
      var init__8617 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__8616) : init__8616;
      if(cljs.core.reduced_QMARK_.call(null, init__8617)) {
        return cljs.core.deref.call(null, init__8617)
      }else {
        return init__8617
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8620 = this;
  var h__2087__auto____8621 = this__8620.__hash;
  if(!(h__2087__auto____8621 == null)) {
    return h__2087__auto____8621
  }else {
    var h__2087__auto____8622 = cljs.core.hash_coll.call(null, coll);
    this__8620.__hash = h__2087__auto____8622;
    return h__2087__auto____8622
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__8623 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__8624 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__8625 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__8625.key, this__8625.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__8673 = null;
  var G__8673__2 = function(this_sym8626, k) {
    var this__8628 = this;
    var this_sym8626__8629 = this;
    var node__8630 = this_sym8626__8629;
    return node__8630.cljs$core$ILookup$_lookup$arity$2(node__8630, k)
  };
  var G__8673__3 = function(this_sym8627, k, not_found) {
    var this__8628 = this;
    var this_sym8627__8631 = this;
    var node__8632 = this_sym8627__8631;
    return node__8632.cljs$core$ILookup$_lookup$arity$3(node__8632, k, not_found)
  };
  G__8673 = function(this_sym8627, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8673__2.call(this, this_sym8627, k);
      case 3:
        return G__8673__3.call(this, this_sym8627, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8673
}();
cljs.core.BlackNode.prototype.apply = function(this_sym8618, args8619) {
  var this__8633 = this;
  return this_sym8618.call.apply(this_sym8618, [this_sym8618].concat(args8619.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__8634 = this;
  return cljs.core.PersistentVector.fromArray([this__8634.key, this__8634.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__8635 = this;
  return this__8635.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__8636 = this;
  return this__8636.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__8637 = this;
  var node__8638 = this;
  return ins.balance_right(node__8638)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__8639 = this;
  var node__8640 = this;
  return new cljs.core.RedNode(this__8639.key, this__8639.val, this__8639.left, this__8639.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__8641 = this;
  var node__8642 = this;
  return cljs.core.balance_right_del.call(null, this__8641.key, this__8641.val, this__8641.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__8643 = this;
  var node__8644 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__8645 = this;
  var node__8646 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__8646, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__8647 = this;
  var node__8648 = this;
  return cljs.core.balance_left_del.call(null, this__8647.key, this__8647.val, del, this__8647.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__8649 = this;
  var node__8650 = this;
  return ins.balance_left(node__8650)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__8651 = this;
  var node__8652 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__8652, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__8674 = null;
  var G__8674__0 = function() {
    var this__8653 = this;
    var this__8655 = this;
    return cljs.core.pr_str.call(null, this__8655)
  };
  G__8674 = function() {
    switch(arguments.length) {
      case 0:
        return G__8674__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8674
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__8656 = this;
  var node__8657 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__8657, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__8658 = this;
  var node__8659 = this;
  return node__8659
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__8660 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__8661 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__8662 = this;
  return cljs.core.list.call(null, this__8662.key, this__8662.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__8663 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__8664 = this;
  return this__8664.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__8665 = this;
  return cljs.core.PersistentVector.fromArray([this__8665.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__8666 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__8666.key, this__8666.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8667 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__8668 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__8668.key, this__8668.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__8669 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__8670 = this;
  if(n === 0) {
    return this__8670.key
  }else {
    if(n === 1) {
      return this__8670.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__8671 = this;
  if(n === 0) {
    return this__8671.key
  }else {
    if(n === 1) {
      return this__8671.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__8672 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8677 = this;
  var h__2087__auto____8678 = this__8677.__hash;
  if(!(h__2087__auto____8678 == null)) {
    return h__2087__auto____8678
  }else {
    var h__2087__auto____8679 = cljs.core.hash_coll.call(null, coll);
    this__8677.__hash = h__2087__auto____8679;
    return h__2087__auto____8679
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__8680 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__8681 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__8682 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__8682.key, this__8682.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__8730 = null;
  var G__8730__2 = function(this_sym8683, k) {
    var this__8685 = this;
    var this_sym8683__8686 = this;
    var node__8687 = this_sym8683__8686;
    return node__8687.cljs$core$ILookup$_lookup$arity$2(node__8687, k)
  };
  var G__8730__3 = function(this_sym8684, k, not_found) {
    var this__8685 = this;
    var this_sym8684__8688 = this;
    var node__8689 = this_sym8684__8688;
    return node__8689.cljs$core$ILookup$_lookup$arity$3(node__8689, k, not_found)
  };
  G__8730 = function(this_sym8684, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8730__2.call(this, this_sym8684, k);
      case 3:
        return G__8730__3.call(this, this_sym8684, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8730
}();
cljs.core.RedNode.prototype.apply = function(this_sym8675, args8676) {
  var this__8690 = this;
  return this_sym8675.call.apply(this_sym8675, [this_sym8675].concat(args8676.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__8691 = this;
  return cljs.core.PersistentVector.fromArray([this__8691.key, this__8691.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__8692 = this;
  return this__8692.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__8693 = this;
  return this__8693.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__8694 = this;
  var node__8695 = this;
  return new cljs.core.RedNode(this__8694.key, this__8694.val, this__8694.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__8696 = this;
  var node__8697 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__8698 = this;
  var node__8699 = this;
  return new cljs.core.RedNode(this__8698.key, this__8698.val, this__8698.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__8700 = this;
  var node__8701 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__8702 = this;
  var node__8703 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__8703, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__8704 = this;
  var node__8705 = this;
  return new cljs.core.RedNode(this__8704.key, this__8704.val, del, this__8704.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__8706 = this;
  var node__8707 = this;
  return new cljs.core.RedNode(this__8706.key, this__8706.val, ins, this__8706.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__8708 = this;
  var node__8709 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8708.left)) {
    return new cljs.core.RedNode(this__8708.key, this__8708.val, this__8708.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__8708.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8708.right)) {
      return new cljs.core.RedNode(this__8708.right.key, this__8708.right.val, new cljs.core.BlackNode(this__8708.key, this__8708.val, this__8708.left, this__8708.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__8708.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__8709, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__8731 = null;
  var G__8731__0 = function() {
    var this__8710 = this;
    var this__8712 = this;
    return cljs.core.pr_str.call(null, this__8712)
  };
  G__8731 = function() {
    switch(arguments.length) {
      case 0:
        return G__8731__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8731
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__8713 = this;
  var node__8714 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8713.right)) {
    return new cljs.core.RedNode(this__8713.key, this__8713.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__8713.left, null), this__8713.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8713.left)) {
      return new cljs.core.RedNode(this__8713.left.key, this__8713.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__8713.left.left, null), new cljs.core.BlackNode(this__8713.key, this__8713.val, this__8713.left.right, this__8713.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__8714, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__8715 = this;
  var node__8716 = this;
  return new cljs.core.BlackNode(this__8715.key, this__8715.val, this__8715.left, this__8715.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__8717 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__8718 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__8719 = this;
  return cljs.core.list.call(null, this__8719.key, this__8719.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__8720 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__8721 = this;
  return this__8721.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__8722 = this;
  return cljs.core.PersistentVector.fromArray([this__8722.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__8723 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__8723.key, this__8723.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8724 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__8725 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__8725.key, this__8725.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__8726 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__8727 = this;
  if(n === 0) {
    return this__8727.key
  }else {
    if(n === 1) {
      return this__8727.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__8728 = this;
  if(n === 0) {
    return this__8728.key
  }else {
    if(n === 1) {
      return this__8728.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__8729 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__8735 = comp.call(null, k, tree.key);
    if(c__8735 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__8735 < 0) {
        var ins__8736 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__8736 == null)) {
          return tree.add_left(ins__8736)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__8737 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__8737 == null)) {
            return tree.add_right(ins__8737)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__8740 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__8740)) {
            return new cljs.core.RedNode(app__8740.key, app__8740.val, new cljs.core.RedNode(left.key, left.val, left.left, app__8740.left, null), new cljs.core.RedNode(right.key, right.val, app__8740.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__8740, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__8741 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__8741)) {
              return new cljs.core.RedNode(app__8741.key, app__8741.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__8741.left, null), new cljs.core.BlackNode(right.key, right.val, app__8741.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__8741, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__8747 = comp.call(null, k, tree.key);
    if(c__8747 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__8747 < 0) {
        var del__8748 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____8749 = !(del__8748 == null);
          if(or__3943__auto____8749) {
            return or__3943__auto____8749
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__8748, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__8748, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__8750 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____8751 = !(del__8750 == null);
            if(or__3943__auto____8751) {
              return or__3943__auto____8751
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__8750)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__8750, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__8754 = tree.key;
  var c__8755 = comp.call(null, k, tk__8754);
  if(c__8755 === 0) {
    return tree.replace(tk__8754, v, tree.left, tree.right)
  }else {
    if(c__8755 < 0) {
      return tree.replace(tk__8754, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__8754, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8758 = this;
  var h__2087__auto____8759 = this__8758.__hash;
  if(!(h__2087__auto____8759 == null)) {
    return h__2087__auto____8759
  }else {
    var h__2087__auto____8760 = cljs.core.hash_imap.call(null, coll);
    this__8758.__hash = h__2087__auto____8760;
    return h__2087__auto____8760
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8761 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8762 = this;
  var n__8763 = coll.entry_at(k);
  if(!(n__8763 == null)) {
    return n__8763.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8764 = this;
  var found__8765 = [null];
  var t__8766 = cljs.core.tree_map_add.call(null, this__8764.comp, this__8764.tree, k, v, found__8765);
  if(t__8766 == null) {
    var found_node__8767 = cljs.core.nth.call(null, found__8765, 0);
    if(cljs.core._EQ_.call(null, v, found_node__8767.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__8764.comp, cljs.core.tree_map_replace.call(null, this__8764.comp, this__8764.tree, k, v), this__8764.cnt, this__8764.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__8764.comp, t__8766.blacken(), this__8764.cnt + 1, this__8764.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8768 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__8802 = null;
  var G__8802__2 = function(this_sym8769, k) {
    var this__8771 = this;
    var this_sym8769__8772 = this;
    var coll__8773 = this_sym8769__8772;
    return coll__8773.cljs$core$ILookup$_lookup$arity$2(coll__8773, k)
  };
  var G__8802__3 = function(this_sym8770, k, not_found) {
    var this__8771 = this;
    var this_sym8770__8774 = this;
    var coll__8775 = this_sym8770__8774;
    return coll__8775.cljs$core$ILookup$_lookup$arity$3(coll__8775, k, not_found)
  };
  G__8802 = function(this_sym8770, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8802__2.call(this, this_sym8770, k);
      case 3:
        return G__8802__3.call(this, this_sym8770, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8802
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym8756, args8757) {
  var this__8776 = this;
  return this_sym8756.call.apply(this_sym8756, [this_sym8756].concat(args8757.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8777 = this;
  if(!(this__8777.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__8777.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8778 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8779 = this;
  if(this__8779.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8779.tree, false, this__8779.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__8780 = this;
  var this__8781 = this;
  return cljs.core.pr_str.call(null, this__8781)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__8782 = this;
  var coll__8783 = this;
  var t__8784 = this__8782.tree;
  while(true) {
    if(!(t__8784 == null)) {
      var c__8785 = this__8782.comp.call(null, k, t__8784.key);
      if(c__8785 === 0) {
        return t__8784
      }else {
        if(c__8785 < 0) {
          var G__8803 = t__8784.left;
          t__8784 = G__8803;
          continue
        }else {
          if("\ufdd0'else") {
            var G__8804 = t__8784.right;
            t__8784 = G__8804;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8786 = this;
  if(this__8786.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8786.tree, ascending_QMARK_, this__8786.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8787 = this;
  if(this__8787.cnt > 0) {
    var stack__8788 = null;
    var t__8789 = this__8787.tree;
    while(true) {
      if(!(t__8789 == null)) {
        var c__8790 = this__8787.comp.call(null, k, t__8789.key);
        if(c__8790 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__8788, t__8789), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__8790 < 0) {
              var G__8805 = cljs.core.conj.call(null, stack__8788, t__8789);
              var G__8806 = t__8789.left;
              stack__8788 = G__8805;
              t__8789 = G__8806;
              continue
            }else {
              var G__8807 = stack__8788;
              var G__8808 = t__8789.right;
              stack__8788 = G__8807;
              t__8789 = G__8808;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__8790 > 0) {
                var G__8809 = cljs.core.conj.call(null, stack__8788, t__8789);
                var G__8810 = t__8789.right;
                stack__8788 = G__8809;
                t__8789 = G__8810;
                continue
              }else {
                var G__8811 = stack__8788;
                var G__8812 = t__8789.left;
                stack__8788 = G__8811;
                t__8789 = G__8812;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__8788 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__8788, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8791 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8792 = this;
  return this__8792.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8793 = this;
  if(this__8793.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8793.tree, true, this__8793.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8794 = this;
  return this__8794.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8795 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8796 = this;
  return new cljs.core.PersistentTreeMap(this__8796.comp, this__8796.tree, this__8796.cnt, meta, this__8796.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8797 = this;
  return this__8797.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8798 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__8798.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8799 = this;
  var found__8800 = [null];
  var t__8801 = cljs.core.tree_map_remove.call(null, this__8799.comp, this__8799.tree, k, found__8800);
  if(t__8801 == null) {
    if(cljs.core.nth.call(null, found__8800, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__8799.comp, null, 0, this__8799.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__8799.comp, t__8801.blacken(), this__8799.cnt - 1, this__8799.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__8815 = cljs.core.seq.call(null, keyvals);
    var out__8816 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__8815) {
        var G__8817 = cljs.core.nnext.call(null, in__8815);
        var G__8818 = cljs.core.assoc_BANG_.call(null, out__8816, cljs.core.first.call(null, in__8815), cljs.core.second.call(null, in__8815));
        in__8815 = G__8817;
        out__8816 = G__8818;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8816)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__8819) {
    var keyvals = cljs.core.seq(arglist__8819);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__8820) {
    var keyvals = cljs.core.seq(arglist__8820);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__8823 = cljs.core.seq.call(null, keyvals);
    var out__8824 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__8823) {
        var G__8825 = cljs.core.nnext.call(null, in__8823);
        var G__8826 = cljs.core.assoc.call(null, out__8824, cljs.core.first.call(null, in__8823), cljs.core.second.call(null, in__8823));
        in__8823 = G__8825;
        out__8824 = G__8826;
        continue
      }else {
        return out__8824
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__8827) {
    var keyvals = cljs.core.seq(arglist__8827);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__8830 = cljs.core.seq.call(null, keyvals);
    var out__8831 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__8830) {
        var G__8832 = cljs.core.nnext.call(null, in__8830);
        var G__8833 = cljs.core.assoc.call(null, out__8831, cljs.core.first.call(null, in__8830), cljs.core.second.call(null, in__8830));
        in__8830 = G__8832;
        out__8831 = G__8833;
        continue
      }else {
        return out__8831
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__8834) {
    var comparator = cljs.core.first(arglist__8834);
    var keyvals = cljs.core.rest(arglist__8834);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__8835_SHARP_, p2__8836_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____8838 = p1__8835_SHARP_;
          if(cljs.core.truth_(or__3943__auto____8838)) {
            return or__3943__auto____8838
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__8836_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__8839) {
    var maps = cljs.core.seq(arglist__8839);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__8847 = function(m, e) {
        var k__8845 = cljs.core.first.call(null, e);
        var v__8846 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__8845)) {
          return cljs.core.assoc.call(null, m, k__8845, f.call(null, cljs.core._lookup.call(null, m, k__8845, null), v__8846))
        }else {
          return cljs.core.assoc.call(null, m, k__8845, v__8846)
        }
      };
      var merge2__8849 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__8847, function() {
          var or__3943__auto____8848 = m1;
          if(cljs.core.truth_(or__3943__auto____8848)) {
            return or__3943__auto____8848
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__8849, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__8850) {
    var f = cljs.core.first(arglist__8850);
    var maps = cljs.core.rest(arglist__8850);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__8855 = cljs.core.ObjMap.EMPTY;
  var keys__8856 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__8856) {
      var key__8857 = cljs.core.first.call(null, keys__8856);
      var entry__8858 = cljs.core._lookup.call(null, map, key__8857, "\ufdd0'user/not-found");
      var G__8859 = cljs.core.not_EQ_.call(null, entry__8858, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__8855, key__8857, entry__8858) : ret__8855;
      var G__8860 = cljs.core.next.call(null, keys__8856);
      ret__8855 = G__8859;
      keys__8856 = G__8860;
      continue
    }else {
      return ret__8855
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8864 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__8864.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8865 = this;
  var h__2087__auto____8866 = this__8865.__hash;
  if(!(h__2087__auto____8866 == null)) {
    return h__2087__auto____8866
  }else {
    var h__2087__auto____8867 = cljs.core.hash_iset.call(null, coll);
    this__8865.__hash = h__2087__auto____8867;
    return h__2087__auto____8867
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8868 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8869 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8869.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__8890 = null;
  var G__8890__2 = function(this_sym8870, k) {
    var this__8872 = this;
    var this_sym8870__8873 = this;
    var coll__8874 = this_sym8870__8873;
    return coll__8874.cljs$core$ILookup$_lookup$arity$2(coll__8874, k)
  };
  var G__8890__3 = function(this_sym8871, k, not_found) {
    var this__8872 = this;
    var this_sym8871__8875 = this;
    var coll__8876 = this_sym8871__8875;
    return coll__8876.cljs$core$ILookup$_lookup$arity$3(coll__8876, k, not_found)
  };
  G__8890 = function(this_sym8871, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8890__2.call(this, this_sym8871, k);
      case 3:
        return G__8890__3.call(this, this_sym8871, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8890
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym8862, args8863) {
  var this__8877 = this;
  return this_sym8862.call.apply(this_sym8862, [this_sym8862].concat(args8863.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8878 = this;
  return new cljs.core.PersistentHashSet(this__8878.meta, cljs.core.assoc.call(null, this__8878.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__8879 = this;
  var this__8880 = this;
  return cljs.core.pr_str.call(null, this__8880)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8881 = this;
  return cljs.core.keys.call(null, this__8881.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8882 = this;
  return new cljs.core.PersistentHashSet(this__8882.meta, cljs.core.dissoc.call(null, this__8882.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8883 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8884 = this;
  var and__3941__auto____8885 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____8885) {
    var and__3941__auto____8886 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____8886) {
      return cljs.core.every_QMARK_.call(null, function(p1__8861_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8861_SHARP_)
      }, other)
    }else {
      return and__3941__auto____8886
    }
  }else {
    return and__3941__auto____8885
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8887 = this;
  return new cljs.core.PersistentHashSet(meta, this__8887.hash_map, this__8887.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8888 = this;
  return this__8888.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8889 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__8889.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__8908 = null;
  var G__8908__2 = function(this_sym8894, k) {
    var this__8896 = this;
    var this_sym8894__8897 = this;
    var tcoll__8898 = this_sym8894__8897;
    if(cljs.core._lookup.call(null, this__8896.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__8908__3 = function(this_sym8895, k, not_found) {
    var this__8896 = this;
    var this_sym8895__8899 = this;
    var tcoll__8900 = this_sym8895__8899;
    if(cljs.core._lookup.call(null, this__8896.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__8908 = function(this_sym8895, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8908__2.call(this, this_sym8895, k);
      case 3:
        return G__8908__3.call(this, this_sym8895, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8908
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym8892, args8893) {
  var this__8901 = this;
  return this_sym8892.call.apply(this_sym8892, [this_sym8892].concat(args8893.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__8902 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__8903 = this;
  if(cljs.core._lookup.call(null, this__8903.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8904 = this;
  return cljs.core.count.call(null, this__8904.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__8905 = this;
  this__8905.transient_map = cljs.core.dissoc_BANG_.call(null, this__8905.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8906 = this;
  this__8906.transient_map = cljs.core.assoc_BANG_.call(null, this__8906.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8907 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__8907.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8911 = this;
  var h__2087__auto____8912 = this__8911.__hash;
  if(!(h__2087__auto____8912 == null)) {
    return h__2087__auto____8912
  }else {
    var h__2087__auto____8913 = cljs.core.hash_iset.call(null, coll);
    this__8911.__hash = h__2087__auto____8913;
    return h__2087__auto____8913
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8914 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8915 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8915.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__8941 = null;
  var G__8941__2 = function(this_sym8916, k) {
    var this__8918 = this;
    var this_sym8916__8919 = this;
    var coll__8920 = this_sym8916__8919;
    return coll__8920.cljs$core$ILookup$_lookup$arity$2(coll__8920, k)
  };
  var G__8941__3 = function(this_sym8917, k, not_found) {
    var this__8918 = this;
    var this_sym8917__8921 = this;
    var coll__8922 = this_sym8917__8921;
    return coll__8922.cljs$core$ILookup$_lookup$arity$3(coll__8922, k, not_found)
  };
  G__8941 = function(this_sym8917, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8941__2.call(this, this_sym8917, k);
      case 3:
        return G__8941__3.call(this, this_sym8917, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8941
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym8909, args8910) {
  var this__8923 = this;
  return this_sym8909.call.apply(this_sym8909, [this_sym8909].concat(args8910.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8924 = this;
  return new cljs.core.PersistentTreeSet(this__8924.meta, cljs.core.assoc.call(null, this__8924.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8925 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__8925.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__8926 = this;
  var this__8927 = this;
  return cljs.core.pr_str.call(null, this__8927)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8928 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__8928.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8929 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__8929.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8930 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8931 = this;
  return cljs.core._comparator.call(null, this__8931.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8932 = this;
  return cljs.core.keys.call(null, this__8932.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8933 = this;
  return new cljs.core.PersistentTreeSet(this__8933.meta, cljs.core.dissoc.call(null, this__8933.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8934 = this;
  return cljs.core.count.call(null, this__8934.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8935 = this;
  var and__3941__auto____8936 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____8936) {
    var and__3941__auto____8937 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____8937) {
      return cljs.core.every_QMARK_.call(null, function(p1__8891_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8891_SHARP_)
      }, other)
    }else {
      return and__3941__auto____8937
    }
  }else {
    return and__3941__auto____8936
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8938 = this;
  return new cljs.core.PersistentTreeSet(meta, this__8938.tree_map, this__8938.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8939 = this;
  return this__8939.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8940 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__8940.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in__8944 = cljs.core.seq.call(null, coll);
  var out__8945 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.seq.call(null, in__8944)) {
      var G__8946 = cljs.core.next.call(null, in__8944);
      var G__8947 = cljs.core.conj_BANG_.call(null, out__8945, cljs.core.first.call(null, in__8944));
      in__8944 = G__8946;
      out__8945 = G__8947;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8945)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__8948) {
    var keys = cljs.core.seq(arglist__8948);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__8950) {
    var comparator = cljs.core.first(arglist__8950);
    var keys = cljs.core.rest(arglist__8950);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__8956 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____8957 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____8957)) {
        var e__8958 = temp__4090__auto____8957;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__8958))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__8956, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__8949_SHARP_) {
      var temp__4090__auto____8959 = cljs.core.find.call(null, smap, p1__8949_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____8959)) {
        var e__8960 = temp__4090__auto____8959;
        return cljs.core.second.call(null, e__8960)
      }else {
        return p1__8949_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__8990 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__8983, seen) {
        while(true) {
          var vec__8984__8985 = p__8983;
          var f__8986 = cljs.core.nth.call(null, vec__8984__8985, 0, null);
          var xs__8987 = vec__8984__8985;
          var temp__4092__auto____8988 = cljs.core.seq.call(null, xs__8987);
          if(temp__4092__auto____8988) {
            var s__8989 = temp__4092__auto____8988;
            if(cljs.core.contains_QMARK_.call(null, seen, f__8986)) {
              var G__8991 = cljs.core.rest.call(null, s__8989);
              var G__8992 = seen;
              p__8983 = G__8991;
              seen = G__8992;
              continue
            }else {
              return cljs.core.cons.call(null, f__8986, step.call(null, cljs.core.rest.call(null, s__8989), cljs.core.conj.call(null, seen, f__8986)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__8990.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__8995 = cljs.core.PersistentVector.EMPTY;
  var s__8996 = s;
  while(true) {
    if(cljs.core.next.call(null, s__8996)) {
      var G__8997 = cljs.core.conj.call(null, ret__8995, cljs.core.first.call(null, s__8996));
      var G__8998 = cljs.core.next.call(null, s__8996);
      ret__8995 = G__8997;
      s__8996 = G__8998;
      continue
    }else {
      return cljs.core.seq.call(null, ret__8995)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____9001 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____9001) {
        return or__3943__auto____9001
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9002 = x.lastIndexOf("/");
      if(i__9002 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9002 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto____9005 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____9005) {
      return or__3943__auto____9005
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9006 = x.lastIndexOf("/");
    if(i__9006 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9006)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9013 = cljs.core.ObjMap.EMPTY;
  var ks__9014 = cljs.core.seq.call(null, keys);
  var vs__9015 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____9016 = ks__9014;
      if(and__3941__auto____9016) {
        return vs__9015
      }else {
        return and__3941__auto____9016
      }
    }()) {
      var G__9017 = cljs.core.assoc.call(null, map__9013, cljs.core.first.call(null, ks__9014), cljs.core.first.call(null, vs__9015));
      var G__9018 = cljs.core.next.call(null, ks__9014);
      var G__9019 = cljs.core.next.call(null, vs__9015);
      map__9013 = G__9017;
      ks__9014 = G__9018;
      vs__9015 = G__9019;
      continue
    }else {
      return map__9013
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9022__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9007_SHARP_, p2__9008_SHARP_) {
        return max_key.call(null, k, p1__9007_SHARP_, p2__9008_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9022 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9022__delegate.call(this, k, x, y, more)
    };
    G__9022.cljs$lang$maxFixedArity = 3;
    G__9022.cljs$lang$applyTo = function(arglist__9023) {
      var k = cljs.core.first(arglist__9023);
      var x = cljs.core.first(cljs.core.next(arglist__9023));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9023)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9023)));
      return G__9022__delegate(k, x, y, more)
    };
    G__9022.cljs$lang$arity$variadic = G__9022__delegate;
    return G__9022
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9024__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9020_SHARP_, p2__9021_SHARP_) {
        return min_key.call(null, k, p1__9020_SHARP_, p2__9021_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9024 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9024__delegate.call(this, k, x, y, more)
    };
    G__9024.cljs$lang$maxFixedArity = 3;
    G__9024.cljs$lang$applyTo = function(arglist__9025) {
      var k = cljs.core.first(arglist__9025);
      var x = cljs.core.first(cljs.core.next(arglist__9025));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9025)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9025)));
      return G__9024__delegate(k, x, y, more)
    };
    G__9024.cljs$lang$arity$variadic = G__9024__delegate;
    return G__9024
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9028 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9028) {
        var s__9029 = temp__4092__auto____9028;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9029), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9029)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9032 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9032) {
      var s__9033 = temp__4092__auto____9032;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9033)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9033), take_while.call(null, pred, cljs.core.rest.call(null, s__9033)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9035 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9035.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9047 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____9048 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____9048)) {
        var vec__9049__9050 = temp__4092__auto____9048;
        var e__9051 = cljs.core.nth.call(null, vec__9049__9050, 0, null);
        var s__9052 = vec__9049__9050;
        if(cljs.core.truth_(include__9047.call(null, e__9051))) {
          return s__9052
        }else {
          return cljs.core.next.call(null, s__9052)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9047, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9053 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____9053)) {
      var vec__9054__9055 = temp__4092__auto____9053;
      var e__9056 = cljs.core.nth.call(null, vec__9054__9055, 0, null);
      var s__9057 = vec__9054__9055;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9056)) ? s__9057 : cljs.core.next.call(null, s__9057))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9069 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____9070 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____9070)) {
        var vec__9071__9072 = temp__4092__auto____9070;
        var e__9073 = cljs.core.nth.call(null, vec__9071__9072, 0, null);
        var s__9074 = vec__9071__9072;
        if(cljs.core.truth_(include__9069.call(null, e__9073))) {
          return s__9074
        }else {
          return cljs.core.next.call(null, s__9074)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9069, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9075 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____9075)) {
      var vec__9076__9077 = temp__4092__auto____9075;
      var e__9078 = cljs.core.nth.call(null, vec__9076__9077, 0, null);
      var s__9079 = vec__9076__9077;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9078)) ? s__9079 : cljs.core.next.call(null, s__9079))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9080 = this;
  var h__2087__auto____9081 = this__9080.__hash;
  if(!(h__2087__auto____9081 == null)) {
    return h__2087__auto____9081
  }else {
    var h__2087__auto____9082 = cljs.core.hash_coll.call(null, rng);
    this__9080.__hash = h__2087__auto____9082;
    return h__2087__auto____9082
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9083 = this;
  if(this__9083.step > 0) {
    if(this__9083.start + this__9083.step < this__9083.end) {
      return new cljs.core.Range(this__9083.meta, this__9083.start + this__9083.step, this__9083.end, this__9083.step, null)
    }else {
      return null
    }
  }else {
    if(this__9083.start + this__9083.step > this__9083.end) {
      return new cljs.core.Range(this__9083.meta, this__9083.start + this__9083.step, this__9083.end, this__9083.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9084 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9085 = this;
  var this__9086 = this;
  return cljs.core.pr_str.call(null, this__9086)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9087 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9088 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9089 = this;
  if(this__9089.step > 0) {
    if(this__9089.start < this__9089.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9089.start > this__9089.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9090 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9090.end - this__9090.start) / this__9090.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9091 = this;
  return this__9091.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9092 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9092.meta, this__9092.start + this__9092.step, this__9092.end, this__9092.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9093 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9094 = this;
  return new cljs.core.Range(meta, this__9094.start, this__9094.end, this__9094.step, this__9094.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9095 = this;
  return this__9095.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9096 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9096.start + n * this__9096.step
  }else {
    if(function() {
      var and__3941__auto____9097 = this__9096.start > this__9096.end;
      if(and__3941__auto____9097) {
        return this__9096.step === 0
      }else {
        return and__3941__auto____9097
      }
    }()) {
      return this__9096.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9098 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9098.start + n * this__9098.step
  }else {
    if(function() {
      var and__3941__auto____9099 = this__9098.start > this__9098.end;
      if(and__3941__auto____9099) {
        return this__9098.step === 0
      }else {
        return and__3941__auto____9099
      }
    }()) {
      return this__9098.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9100 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9100.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9103 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9103) {
      var s__9104 = temp__4092__auto____9103;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9104), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9104)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9111 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9111) {
      var s__9112 = temp__4092__auto____9111;
      var fst__9113 = cljs.core.first.call(null, s__9112);
      var fv__9114 = f.call(null, fst__9113);
      var run__9115 = cljs.core.cons.call(null, fst__9113, cljs.core.take_while.call(null, function(p1__9105_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9114, f.call(null, p1__9105_SHARP_))
      }, cljs.core.next.call(null, s__9112)));
      return cljs.core.cons.call(null, run__9115, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9115), s__9112))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____9130 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____9130) {
        var s__9131 = temp__4090__auto____9130;
        return reductions.call(null, f, cljs.core.first.call(null, s__9131), cljs.core.rest.call(null, s__9131))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9132 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9132) {
        var s__9133 = temp__4092__auto____9132;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9133)), cljs.core.rest.call(null, s__9133))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9136 = null;
      var G__9136__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9136__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9136__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9136__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9136__4 = function() {
        var G__9137__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9137 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9137__delegate.call(this, x, y, z, args)
        };
        G__9137.cljs$lang$maxFixedArity = 3;
        G__9137.cljs$lang$applyTo = function(arglist__9138) {
          var x = cljs.core.first(arglist__9138);
          var y = cljs.core.first(cljs.core.next(arglist__9138));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9138)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9138)));
          return G__9137__delegate(x, y, z, args)
        };
        G__9137.cljs$lang$arity$variadic = G__9137__delegate;
        return G__9137
      }();
      G__9136 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9136__0.call(this);
          case 1:
            return G__9136__1.call(this, x);
          case 2:
            return G__9136__2.call(this, x, y);
          case 3:
            return G__9136__3.call(this, x, y, z);
          default:
            return G__9136__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9136.cljs$lang$maxFixedArity = 3;
      G__9136.cljs$lang$applyTo = G__9136__4.cljs$lang$applyTo;
      return G__9136
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9139 = null;
      var G__9139__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9139__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9139__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9139__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9139__4 = function() {
        var G__9140__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9140 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9140__delegate.call(this, x, y, z, args)
        };
        G__9140.cljs$lang$maxFixedArity = 3;
        G__9140.cljs$lang$applyTo = function(arglist__9141) {
          var x = cljs.core.first(arglist__9141);
          var y = cljs.core.first(cljs.core.next(arglist__9141));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9141)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9141)));
          return G__9140__delegate(x, y, z, args)
        };
        G__9140.cljs$lang$arity$variadic = G__9140__delegate;
        return G__9140
      }();
      G__9139 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9139__0.call(this);
          case 1:
            return G__9139__1.call(this, x);
          case 2:
            return G__9139__2.call(this, x, y);
          case 3:
            return G__9139__3.call(this, x, y, z);
          default:
            return G__9139__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9139.cljs$lang$maxFixedArity = 3;
      G__9139.cljs$lang$applyTo = G__9139__4.cljs$lang$applyTo;
      return G__9139
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9142 = null;
      var G__9142__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9142__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9142__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9142__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9142__4 = function() {
        var G__9143__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9143 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9143__delegate.call(this, x, y, z, args)
        };
        G__9143.cljs$lang$maxFixedArity = 3;
        G__9143.cljs$lang$applyTo = function(arglist__9144) {
          var x = cljs.core.first(arglist__9144);
          var y = cljs.core.first(cljs.core.next(arglist__9144));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9144)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9144)));
          return G__9143__delegate(x, y, z, args)
        };
        G__9143.cljs$lang$arity$variadic = G__9143__delegate;
        return G__9143
      }();
      G__9142 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9142__0.call(this);
          case 1:
            return G__9142__1.call(this, x);
          case 2:
            return G__9142__2.call(this, x, y);
          case 3:
            return G__9142__3.call(this, x, y, z);
          default:
            return G__9142__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9142.cljs$lang$maxFixedArity = 3;
      G__9142.cljs$lang$applyTo = G__9142__4.cljs$lang$applyTo;
      return G__9142
    }()
  };
  var juxt__4 = function() {
    var G__9145__delegate = function(f, g, h, fs) {
      var fs__9135 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9146 = null;
        var G__9146__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9116_SHARP_, p2__9117_SHARP_) {
            return cljs.core.conj.call(null, p1__9116_SHARP_, p2__9117_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9135)
        };
        var G__9146__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9118_SHARP_, p2__9119_SHARP_) {
            return cljs.core.conj.call(null, p1__9118_SHARP_, p2__9119_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9135)
        };
        var G__9146__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9120_SHARP_, p2__9121_SHARP_) {
            return cljs.core.conj.call(null, p1__9120_SHARP_, p2__9121_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9135)
        };
        var G__9146__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9122_SHARP_, p2__9123_SHARP_) {
            return cljs.core.conj.call(null, p1__9122_SHARP_, p2__9123_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9135)
        };
        var G__9146__4 = function() {
          var G__9147__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9124_SHARP_, p2__9125_SHARP_) {
              return cljs.core.conj.call(null, p1__9124_SHARP_, cljs.core.apply.call(null, p2__9125_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9135)
          };
          var G__9147 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9147__delegate.call(this, x, y, z, args)
          };
          G__9147.cljs$lang$maxFixedArity = 3;
          G__9147.cljs$lang$applyTo = function(arglist__9148) {
            var x = cljs.core.first(arglist__9148);
            var y = cljs.core.first(cljs.core.next(arglist__9148));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9148)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9148)));
            return G__9147__delegate(x, y, z, args)
          };
          G__9147.cljs$lang$arity$variadic = G__9147__delegate;
          return G__9147
        }();
        G__9146 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9146__0.call(this);
            case 1:
              return G__9146__1.call(this, x);
            case 2:
              return G__9146__2.call(this, x, y);
            case 3:
              return G__9146__3.call(this, x, y, z);
            default:
              return G__9146__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9146.cljs$lang$maxFixedArity = 3;
        G__9146.cljs$lang$applyTo = G__9146__4.cljs$lang$applyTo;
        return G__9146
      }()
    };
    var G__9145 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9145__delegate.call(this, f, g, h, fs)
    };
    G__9145.cljs$lang$maxFixedArity = 3;
    G__9145.cljs$lang$applyTo = function(arglist__9149) {
      var f = cljs.core.first(arglist__9149);
      var g = cljs.core.first(cljs.core.next(arglist__9149));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9149)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9149)));
      return G__9145__delegate(f, g, h, fs)
    };
    G__9145.cljs$lang$arity$variadic = G__9145__delegate;
    return G__9145
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9152 = cljs.core.next.call(null, coll);
        coll = G__9152;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____9151 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____9151) {
          return n > 0
        }else {
          return and__3941__auto____9151
        }
      }())) {
        var G__9153 = n - 1;
        var G__9154 = cljs.core.next.call(null, coll);
        n = G__9153;
        coll = G__9154;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9156 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9156), s)) {
    if(cljs.core.count.call(null, matches__9156) === 1) {
      return cljs.core.first.call(null, matches__9156)
    }else {
      return cljs.core.vec.call(null, matches__9156)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9158 = re.exec(s);
  if(matches__9158 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9158) === 1) {
      return cljs.core.first.call(null, matches__9158)
    }else {
      return cljs.core.vec.call(null, matches__9158)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9163 = cljs.core.re_find.call(null, re, s);
  var match_idx__9164 = s.search(re);
  var match_str__9165 = cljs.core.coll_QMARK_.call(null, match_data__9163) ? cljs.core.first.call(null, match_data__9163) : match_data__9163;
  var post_match__9166 = cljs.core.subs.call(null, s, match_idx__9164 + cljs.core.count.call(null, match_str__9165));
  if(cljs.core.truth_(match_data__9163)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9163, re_seq.call(null, re, post_match__9166))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9173__9174 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9175 = cljs.core.nth.call(null, vec__9173__9174, 0, null);
  var flags__9176 = cljs.core.nth.call(null, vec__9173__9174, 1, null);
  var pattern__9177 = cljs.core.nth.call(null, vec__9173__9174, 2, null);
  return new RegExp(pattern__9177, flags__9176)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9167_SHARP_) {
    return print_one.call(null, p1__9167_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____9187 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____9187)) {
            var and__3941__auto____9191 = function() {
              var G__9188__9189 = obj;
              if(G__9188__9189) {
                if(function() {
                  var or__3943__auto____9190 = G__9188__9189.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____9190) {
                    return or__3943__auto____9190
                  }else {
                    return G__9188__9189.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9188__9189.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9188__9189)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9188__9189)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____9191)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____9191
            }
          }else {
            return and__3941__auto____9187
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____9192 = !(obj == null);
          if(and__3941__auto____9192) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____9192
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9193__9194 = obj;
          if(G__9193__9194) {
            if(function() {
              var or__3943__auto____9195 = G__9193__9194.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____9195) {
                return or__3943__auto____9195
              }else {
                return G__9193__9194.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9193__9194.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9193__9194)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9193__9194)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__9210 = cljs.core.first.call(null, objs);
  var sb__9211 = new goog.string.StringBuffer;
  var G__9212__9213 = cljs.core.seq.call(null, objs);
  if(G__9212__9213) {
    var obj__9214 = cljs.core.first.call(null, G__9212__9213);
    var G__9212__9215 = G__9212__9213;
    while(true) {
      if(obj__9214 === first_obj__9210) {
      }else {
        sb__9211.append(" ")
      }
      var G__9216__9217 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9214, opts));
      if(G__9216__9217) {
        var string__9218 = cljs.core.first.call(null, G__9216__9217);
        var G__9216__9219 = G__9216__9217;
        while(true) {
          sb__9211.append(string__9218);
          var temp__4092__auto____9220 = cljs.core.next.call(null, G__9216__9219);
          if(temp__4092__auto____9220) {
            var G__9216__9221 = temp__4092__auto____9220;
            var G__9224 = cljs.core.first.call(null, G__9216__9221);
            var G__9225 = G__9216__9221;
            string__9218 = G__9224;
            G__9216__9219 = G__9225;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9222 = cljs.core.next.call(null, G__9212__9215);
      if(temp__4092__auto____9222) {
        var G__9212__9223 = temp__4092__auto____9222;
        var G__9226 = cljs.core.first.call(null, G__9212__9223);
        var G__9227 = G__9212__9223;
        obj__9214 = G__9226;
        G__9212__9215 = G__9227;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9211
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9229 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9229.append("\n");
  return[cljs.core.str(sb__9229)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__9243 = cljs.core.first.call(null, objs);
  var G__9244__9245 = cljs.core.seq.call(null, objs);
  if(G__9244__9245) {
    var obj__9246 = cljs.core.first.call(null, G__9244__9245);
    var G__9244__9247 = G__9244__9245;
    while(true) {
      if(obj__9246 === first_obj__9243) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__9248__9249 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9246, opts));
      if(G__9248__9249) {
        var string__9250 = cljs.core.first.call(null, G__9248__9249);
        var G__9248__9251 = G__9248__9249;
        while(true) {
          cljs.core.string_print.call(null, string__9250);
          var temp__4092__auto____9252 = cljs.core.next.call(null, G__9248__9251);
          if(temp__4092__auto____9252) {
            var G__9248__9253 = temp__4092__auto____9252;
            var G__9256 = cljs.core.first.call(null, G__9248__9253);
            var G__9257 = G__9248__9253;
            string__9250 = G__9256;
            G__9248__9251 = G__9257;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9254 = cljs.core.next.call(null, G__9244__9247);
      if(temp__4092__auto____9254) {
        var G__9244__9255 = temp__4092__auto____9254;
        var G__9258 = cljs.core.first.call(null, G__9244__9255);
        var G__9259 = G__9244__9255;
        obj__9246 = G__9258;
        G__9244__9247 = G__9259;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9260) {
    var objs = cljs.core.seq(arglist__9260);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9261) {
    var objs = cljs.core.seq(arglist__9261);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9262) {
    var objs = cljs.core.seq(arglist__9262);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9263) {
    var objs = cljs.core.seq(arglist__9263);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9264) {
    var objs = cljs.core.seq(arglist__9264);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9265) {
    var objs = cljs.core.seq(arglist__9265);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9266) {
    var objs = cljs.core.seq(arglist__9266);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9267) {
    var objs = cljs.core.seq(arglist__9267);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9268 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9268, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9269 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9269, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9270 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9270, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto____9271 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____9271)) {
        var nspc__9272 = temp__4092__auto____9271;
        return[cljs.core.str(nspc__9272), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____9273 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____9273)) {
          var nspc__9274 = temp__4092__auto____9273;
          return[cljs.core.str(nspc__9274), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9275 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9275, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9277 = function(n, len) {
    var ns__9276 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9276) < len) {
        var G__9279 = [cljs.core.str("0"), cljs.core.str(ns__9276)].join("");
        ns__9276 = G__9279;
        continue
      }else {
        return ns__9276
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9277.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9277.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9277.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9277.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9277.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9277.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9278 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9278, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9280 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9281 = this;
  var G__9282__9283 = cljs.core.seq.call(null, this__9281.watches);
  if(G__9282__9283) {
    var G__9285__9287 = cljs.core.first.call(null, G__9282__9283);
    var vec__9286__9288 = G__9285__9287;
    var key__9289 = cljs.core.nth.call(null, vec__9286__9288, 0, null);
    var f__9290 = cljs.core.nth.call(null, vec__9286__9288, 1, null);
    var G__9282__9291 = G__9282__9283;
    var G__9285__9292 = G__9285__9287;
    var G__9282__9293 = G__9282__9291;
    while(true) {
      var vec__9294__9295 = G__9285__9292;
      var key__9296 = cljs.core.nth.call(null, vec__9294__9295, 0, null);
      var f__9297 = cljs.core.nth.call(null, vec__9294__9295, 1, null);
      var G__9282__9298 = G__9282__9293;
      f__9297.call(null, key__9296, this$, oldval, newval);
      var temp__4092__auto____9299 = cljs.core.next.call(null, G__9282__9298);
      if(temp__4092__auto____9299) {
        var G__9282__9300 = temp__4092__auto____9299;
        var G__9307 = cljs.core.first.call(null, G__9282__9300);
        var G__9308 = G__9282__9300;
        G__9285__9292 = G__9307;
        G__9282__9293 = G__9308;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9301 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9301.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9302 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9302.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9303 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9303.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9304 = this;
  return this__9304.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9305 = this;
  return this__9305.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9306 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9320__delegate = function(x, p__9309) {
      var map__9315__9316 = p__9309;
      var map__9315__9317 = cljs.core.seq_QMARK_.call(null, map__9315__9316) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9315__9316)) : map__9315__9316;
      var validator__9318 = cljs.core._lookup.call(null, map__9315__9317, "\ufdd0'validator", null);
      var meta__9319 = cljs.core._lookup.call(null, map__9315__9317, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9319, validator__9318, null)
    };
    var G__9320 = function(x, var_args) {
      var p__9309 = null;
      if(goog.isDef(var_args)) {
        p__9309 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9320__delegate.call(this, x, p__9309)
    };
    G__9320.cljs$lang$maxFixedArity = 1;
    G__9320.cljs$lang$applyTo = function(arglist__9321) {
      var x = cljs.core.first(arglist__9321);
      var p__9309 = cljs.core.rest(arglist__9321);
      return G__9320__delegate(x, p__9309)
    };
    G__9320.cljs$lang$arity$variadic = G__9320__delegate;
    return G__9320
  }();
  atom = function(x, var_args) {
    var p__9309 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto____9325 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____9325)) {
    var validate__9326 = temp__4092__auto____9325;
    if(cljs.core.truth_(validate__9326.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6394, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__9327 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9327, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9328__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9328 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9328__delegate.call(this, a, f, x, y, z, more)
    };
    G__9328.cljs$lang$maxFixedArity = 5;
    G__9328.cljs$lang$applyTo = function(arglist__9329) {
      var a = cljs.core.first(arglist__9329);
      var f = cljs.core.first(cljs.core.next(arglist__9329));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9329)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9329))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9329)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9329)))));
      return G__9328__delegate(a, f, x, y, z, more)
    };
    G__9328.cljs$lang$arity$variadic = G__9328__delegate;
    return G__9328
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9330) {
    var iref = cljs.core.first(arglist__9330);
    var f = cljs.core.first(cljs.core.next(arglist__9330));
    var args = cljs.core.rest(cljs.core.next(arglist__9330));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9331 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9331.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9332 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9332.state, function(p__9333) {
    var map__9334__9335 = p__9333;
    var map__9334__9336 = cljs.core.seq_QMARK_.call(null, map__9334__9335) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9334__9335)) : map__9334__9335;
    var curr_state__9337 = map__9334__9336;
    var done__9338 = cljs.core._lookup.call(null, map__9334__9336, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9338)) {
      return curr_state__9337
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9332.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9367__9368 = options;
    var map__9367__9369 = cljs.core.seq_QMARK_.call(null, map__9367__9368) ? clojure.lang.PersistentHashMap.create.call(null, cljs.core.seq.call(null, map__9367__9368)) : map__9367__9368;
    var keywordize_keys__9370 = cljs.core._lookup.call(null, map__9367__9369, "\ufdd0'keywordize-keys", null);
    var keyfn__9371 = cljs.core.truth_(keywordize_keys__9370) ? cljs.core.keyword : cljs.core.str;
    var f__9394 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2361__auto____9393 = function iter__9383(s__9384) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9384__9389 = s__9384;
                    while(true) {
                      var temp__4092__auto____9390 = cljs.core.seq.call(null, s__9384__9389);
                      if(temp__4092__auto____9390) {
                        var xs__4579__auto____9391 = temp__4092__auto____9390;
                        var k__9392 = cljs.core.first.call(null, xs__4579__auto____9391);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9371.call(null, k__9392), thisfn.call(null, x[k__9392])], true), iter__9383.call(null, cljs.core.rest.call(null, s__9384__9389)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2361__auto____9393.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9394.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9395) {
    var x = cljs.core.first(arglist__9395);
    var options = cljs.core.rest(arglist__9395);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9400 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9404__delegate = function(args) {
      var temp__4090__auto____9401 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9400), args, null);
      if(cljs.core.truth_(temp__4090__auto____9401)) {
        var v__9402 = temp__4090__auto____9401;
        return v__9402
      }else {
        var ret__9403 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9400, cljs.core.assoc, args, ret__9403);
        return ret__9403
      }
    };
    var G__9404 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9404__delegate.call(this, args)
    };
    G__9404.cljs$lang$maxFixedArity = 0;
    G__9404.cljs$lang$applyTo = function(arglist__9405) {
      var args = cljs.core.seq(arglist__9405);
      return G__9404__delegate(args)
    };
    G__9404.cljs$lang$arity$variadic = G__9404__delegate;
    return G__9404
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9407 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9407)) {
        var G__9408 = ret__9407;
        f = G__9408;
        continue
      }else {
        return ret__9407
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9409__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9409 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9409__delegate.call(this, f, args)
    };
    G__9409.cljs$lang$maxFixedArity = 1;
    G__9409.cljs$lang$applyTo = function(arglist__9410) {
      var f = cljs.core.first(arglist__9410);
      var args = cljs.core.rest(arglist__9410);
      return G__9409__delegate(f, args)
    };
    G__9409.cljs$lang$arity$variadic = G__9409__delegate;
    return G__9409
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9412 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9412, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9412, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto____9421 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____9421) {
      return or__3943__auto____9421
    }else {
      var or__3943__auto____9422 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____9422) {
        return or__3943__auto____9422
      }else {
        var and__3941__auto____9423 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____9423) {
          var and__3941__auto____9424 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____9424) {
            var and__3941__auto____9425 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____9425) {
              var ret__9426 = true;
              var i__9427 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____9428 = cljs.core.not.call(null, ret__9426);
                  if(or__3943__auto____9428) {
                    return or__3943__auto____9428
                  }else {
                    return i__9427 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9426
                }else {
                  var G__9429 = isa_QMARK_.call(null, h, child.call(null, i__9427), parent.call(null, i__9427));
                  var G__9430 = i__9427 + 1;
                  ret__9426 = G__9429;
                  i__9427 = G__9430;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____9425
            }
          }else {
            return and__3941__auto____9424
          }
        }else {
          return and__3941__auto____9423
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6678, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6682, "\ufdd0'column", 12))))].join(""));
    }
    var tp__9439 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9440 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9441 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9442 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____9443 = cljs.core.contains_QMARK_.call(null, tp__9439.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9441.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9441.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9439, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__9442.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9440, parent, ta__9441), "\ufdd0'descendants":tf__9442.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9441, tag, td__9440)})
    }();
    if(cljs.core.truth_(or__3943__auto____9443)) {
      return or__3943__auto____9443
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9448 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9449 = cljs.core.truth_(parentMap__9448.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9448.call(null, tag), parent) : cljs.core.set([]);
    var newParents__9450 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9449)) ? cljs.core.assoc.call(null, parentMap__9448, tag, childsParents__9449) : cljs.core.dissoc.call(null, parentMap__9448, tag);
    var deriv_seq__9451 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9431_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9431_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9431_SHARP_), cljs.core.second.call(null, p1__9431_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9450)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9448.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9432_SHARP_, p2__9433_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9432_SHARP_, p2__9433_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9451))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9459 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____9461 = cljs.core.truth_(function() {
    var and__3941__auto____9460 = xprefs__9459;
    if(cljs.core.truth_(and__3941__auto____9460)) {
      return xprefs__9459.call(null, y)
    }else {
      return and__3941__auto____9460
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____9461)) {
    return or__3943__auto____9461
  }else {
    var or__3943__auto____9463 = function() {
      var ps__9462 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9462) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9462), prefer_table))) {
          }else {
          }
          var G__9466 = cljs.core.rest.call(null, ps__9462);
          ps__9462 = G__9466;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____9463)) {
      return or__3943__auto____9463
    }else {
      var or__3943__auto____9465 = function() {
        var ps__9464 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9464) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9464), y, prefer_table))) {
            }else {
            }
            var G__9467 = cljs.core.rest.call(null, ps__9464);
            ps__9464 = G__9467;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____9465)) {
        return or__3943__auto____9465
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____9469 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____9469)) {
    return or__3943__auto____9469
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9487 = cljs.core.reduce.call(null, function(be, p__9479) {
    var vec__9480__9481 = p__9479;
    var k__9482 = cljs.core.nth.call(null, vec__9480__9481, 0, null);
    var ___9483 = cljs.core.nth.call(null, vec__9480__9481, 1, null);
    var e__9484 = vec__9480__9481;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9482)) {
      var be2__9486 = cljs.core.truth_(function() {
        var or__3943__auto____9485 = be == null;
        if(or__3943__auto____9485) {
          return or__3943__auto____9485
        }else {
          return cljs.core.dominates.call(null, k__9482, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9484 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9486), k__9482, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9482), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9486)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9486
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9487)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9487));
      return cljs.core.second.call(null, best_entry__9487)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto____9491 = mf;
    if(and__3941__auto____9491) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____9491
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9492 = cljs.core._reset[goog.typeOf(mf)];
      if(or__3943__auto____9492) {
        return or__3943__auto____9492
      }else {
        var or__3943__auto____9493 = cljs.core._reset["_"];
        if(or__3943__auto____9493) {
          return or__3943__auto____9493
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____9497 = mf;
    if(and__3941__auto____9497) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____9497
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3943__auto____9498 = cljs.core._add_method[goog.typeOf(mf)];
      if(or__3943__auto____9498) {
        return or__3943__auto____9498
      }else {
        var or__3943__auto____9499 = cljs.core._add_method["_"];
        if(or__3943__auto____9499) {
          return or__3943__auto____9499
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9503 = mf;
    if(and__3941__auto____9503) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____9503
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3943__auto____9504 = cljs.core._remove_method[goog.typeOf(mf)];
      if(or__3943__auto____9504) {
        return or__3943__auto____9504
      }else {
        var or__3943__auto____9505 = cljs.core._remove_method["_"];
        if(or__3943__auto____9505) {
          return or__3943__auto____9505
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____9509 = mf;
    if(and__3941__auto____9509) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____9509
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3943__auto____9510 = cljs.core._prefer_method[goog.typeOf(mf)];
      if(or__3943__auto____9510) {
        return or__3943__auto____9510
      }else {
        var or__3943__auto____9511 = cljs.core._prefer_method["_"];
        if(or__3943__auto____9511) {
          return or__3943__auto____9511
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9515 = mf;
    if(and__3941__auto____9515) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____9515
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3943__auto____9516 = cljs.core._get_method[goog.typeOf(mf)];
      if(or__3943__auto____9516) {
        return or__3943__auto____9516
      }else {
        var or__3943__auto____9517 = cljs.core._get_method["_"];
        if(or__3943__auto____9517) {
          return or__3943__auto____9517
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____9521 = mf;
    if(and__3941__auto____9521) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____9521
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9522 = cljs.core._methods[goog.typeOf(mf)];
      if(or__3943__auto____9522) {
        return or__3943__auto____9522
      }else {
        var or__3943__auto____9523 = cljs.core._methods["_"];
        if(or__3943__auto____9523) {
          return or__3943__auto____9523
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____9527 = mf;
    if(and__3941__auto____9527) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____9527
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3943__auto____9528 = cljs.core._prefers[goog.typeOf(mf)];
      if(or__3943__auto____9528) {
        return or__3943__auto____9528
      }else {
        var or__3943__auto____9529 = cljs.core._prefers["_"];
        if(or__3943__auto____9529) {
          return or__3943__auto____9529
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____9533 = mf;
    if(and__3941__auto____9533) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____9533
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3943__auto____9534 = cljs.core._dispatch[goog.typeOf(mf)];
      if(or__3943__auto____9534) {
        return or__3943__auto____9534
      }else {
        var or__3943__auto____9535 = cljs.core._dispatch["_"];
        if(or__3943__auto____9535) {
          return or__3943__auto____9535
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__9538 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__9539 = cljs.core._get_method.call(null, mf, dispatch_val__9538);
  if(cljs.core.truth_(target_fn__9539)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__9538)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__9539, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9540 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__9541 = this;
  cljs.core.swap_BANG_.call(null, this__9541.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9541.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9541.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9541.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__9542 = this;
  cljs.core.swap_BANG_.call(null, this__9542.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__9542.method_cache, this__9542.method_table, this__9542.cached_hierarchy, this__9542.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__9543 = this;
  cljs.core.swap_BANG_.call(null, this__9543.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__9543.method_cache, this__9543.method_table, this__9543.cached_hierarchy, this__9543.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__9544 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__9544.cached_hierarchy), cljs.core.deref.call(null, this__9544.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__9544.method_cache, this__9544.method_table, this__9544.cached_hierarchy, this__9544.hierarchy)
  }
  var temp__4090__auto____9545 = cljs.core.deref.call(null, this__9544.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____9545)) {
    var target_fn__9546 = temp__4090__auto____9545;
    return target_fn__9546
  }else {
    var temp__4090__auto____9547 = cljs.core.find_and_cache_best_method.call(null, this__9544.name, dispatch_val, this__9544.hierarchy, this__9544.method_table, this__9544.prefer_table, this__9544.method_cache, this__9544.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____9547)) {
      var target_fn__9548 = temp__4090__auto____9547;
      return target_fn__9548
    }else {
      return cljs.core.deref.call(null, this__9544.method_table).call(null, this__9544.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__9549 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__9549.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__9549.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__9549.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__9549.method_cache, this__9549.method_table, this__9549.cached_hierarchy, this__9549.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__9550 = this;
  return cljs.core.deref.call(null, this__9550.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__9551 = this;
  return cljs.core.deref.call(null, this__9551.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__9552 = this;
  return cljs.core.do_dispatch.call(null, mf, this__9552.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__9554__delegate = function(_, args) {
    var self__9553 = this;
    return cljs.core._dispatch.call(null, self__9553, args)
  };
  var G__9554 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__9554__delegate.call(this, _, args)
  };
  G__9554.cljs$lang$maxFixedArity = 1;
  G__9554.cljs$lang$applyTo = function(arglist__9555) {
    var _ = cljs.core.first(arglist__9555);
    var args = cljs.core.rest(arglist__9555);
    return G__9554__delegate(_, args)
  };
  G__9554.cljs$lang$arity$variadic = G__9554__delegate;
  return G__9554
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__9556 = this;
  return cljs.core._dispatch.call(null, self__9556, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2204__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9557 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_9559, _) {
  var this__9558 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__9558.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__9560 = this;
  return this__9560.uuid === other.uuid
};
cljs.core.UUID.prototype.toString = function() {
  var this__9561 = this;
  var this__9562 = this;
  return cljs.core.pr_str.call(null, this__9562)
};
cljs.core.UUID;
goog.provide("r0_rich.app");
goog.require("cljs.core");
console.log("yoyo");

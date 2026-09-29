(function () {
  // Home Assistant ingress serves the app under /api/hassio_ingress/<token>; take it from the address bar
  // so this text needs no build-time placeholder (the server payload length must not change).
  var m = /^(.*?\/api\/hassio_ingress\/[^\/]+)/.exec(location.pathname);
  var B = m ? m[1] : "";
  var O = location.origin;
  function fix(u) {
    if (typeof u !== "string") return u;
    if (u.charCodeAt(0) === 47 && u.charCodeAt(1) !== 47) return u === B || u.indexOf(B + "/") === 0 ? u : B + u;
    if (u.indexOf(O + "/") === 0) {
      var p = u.slice(O.length);
      return p.indexOf(B + "/") === 0 || p === B ? u : O + B + p;
    }
    return u;
  }
  var f = window.fetch;
  window.fetch = function (i, o) {
    if (typeof i === "string") i = fix(i);
    else if (i instanceof URL) i = fix(i.href);
    else if (i && i.url) {
      var u = fix(i.url);
      if (u !== i.url) i = new Request(u, i);
    }
    return f.call(this, i, o);
  };
  var x = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u) {
    arguments[1] = fix(String(u));
    return x.apply(this, arguments);
  };
  function patchSrc(proto) {
    var d = Object.getOwnPropertyDescriptor(proto, "src");
    if (!d || !d.set) return;
    Object.defineProperty(proto, "src", {
      configurable: true,
      enumerable: d.enumerable,
      get: d.get,
      set: function (v) { d.set.call(this, fix(String(v))); }
    });
  }
  [HTMLImageElement.prototype, HTMLMediaElement.prototype, HTMLSourceElement.prototype].forEach(patchSrc);
  var sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) {
    if ((n === "src" || n === "poster") && typeof v === "string" && /^(IMG|SOURCE|AUDIO|VIDEO)$/.test(this.tagName)) v = fix(v);
    else if (n === "href" && typeof v === "string" && this.tagName === "LINK") v = fix(v);
    return sa.call(this, n, v);
  };
  var W = window.Worker;
  if (W) window.Worker = function (u, o) { return new W(fix(String(u)), o); };
  var E = window.EventSource;
  if (E) window.EventSource = function (u, o) { return new E(fix(String(u)), o); };
})();

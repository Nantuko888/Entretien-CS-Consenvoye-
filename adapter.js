// ====== CONFIG : colle ici l'URL /exec du projet API (celle que tu viens de déployer) ======
const API_EXEC = "https://script.google.com/macros/s/AKfycbwTo8mKf9yDCmFDZbT03-nbxv5QVLcMjNEGuvlL25alCktBLX9P-G3i4NTVMw048DE/exec";
                  
// Appel RPC en JSONP : /exec?mode=rpc&fn=...&args=...&callback=...
function rpcCall(fn, args) {
  return new Promise((resolve, reject) => {
    const cb = "cb_" + Math.random().toString(36).slice(2);
    window[cb] = (payload) => { cleanup(); resolve(payload); };

    const s = document.createElement("script");
    s.onerror = () => { cleanup(); reject(new Error("load_error")); };

    function cleanup() {
      delete window[cb];
      s.remove();
    }

    const qs = new URLSearchParams({
      mode: "rpc",
      fn: String(fn),
      args: JSON.stringify(args || []),
      callback: cb
    });

    s.src = API_EXEC + "?" + qs.toString();
    document.head.appendChild(s);
  });
}

// Emule google.script.run.withSuccessHandler().withFailureHandler().apiXxx(...)
(function () {
  const chain = (handlers = {}) => new Proxy({}, {
    get(_t, prop) {
      if (prop === "withSuccessHandler") return (fn) => chain({ ...handlers, success: fn });
      if (prop === "withFailureHandler") return (fn) => chain({ ...handlers, failure: fn });

      return (...fnArgs) => {
        rpcCall(String(prop), fnArgs)
          .then(res => {
  // ✅ cas 1: RPC enveloppé {ok:true, result:...}
  // ✅ cas 2: réponse directe {ok:true}
  // ✅ cas 3: réponse booléenne true/false (on encapsule)
  if (res === true) {
    handlers.success && handlers.success({ ok: true });
    return;
  }
  if (res === false) {
    handlers.success && handlers.success({ ok: false });
    return;
  }

  if (res && res.ok === true) {
    const payload = (typeof res.result !== "undefined") ? res.result : res;
    handlers.success && handlers.success(payload);
  } else {
    handlers.failure ? handlers.failure(res) : console.error(res);
  }
})

          .catch(err => handlers.failure ? handlers.failure(err) : console.error(err));
      };
    }
  });

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = chain();
})();

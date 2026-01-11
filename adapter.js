// ====== CONFIG : colle ici l'URL /exec du projet API (celle que tu viens de déployer) ======
const API_EXEC = "https://script.google.com/macros/s/AKfycbzMUix_H0xDuvV4bE5yMIPyZOKtYX0-3U0YNg1rReryNXXcgZSa4VpgSaFS81XP0Y39/exec";

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
            if (res && res.ok) handlers.success && handlers.success(res.result);
            else handlers.failure ? handlers.failure(res) : console.error(res);
          })
          .catch(err => handlers.failure ? handlers.failure(err) : console.error(err));
      };
    }
  });

  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = chain();
})();

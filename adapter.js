// adapter.js — JSONP propre (pas de eval), compatible GitHub Pages
(function(){
  function escQS(v){
    return encodeURIComponent(String(v ?? ""));
  }

  // baseUrl = URL /exec
  // params = { action, ... }
  window.jsonpRequest = function(baseUrl, params){
    return new Promise((resolve, reject) => {
      if(!baseUrl || baseUrl.includes("https://script.google.com/macros/s/AKfycbwTo8mKf9yDCmFDZbT03-nbxv5QVLcMjNEGuvlL25alCktBLX9P-G3i4NTVMw048DE/exec")){
        reject(new Error("missing_api_exec"));
        return;
      }

      const cb = "cb_" + Math.random().toString(36).slice(2) + "_" + Date.now();
      const safeCb = cb.replace(/[^a-zA-Z0-9_]/g, "");

      const q = [];
      for(const k in (params||{})){
        q.push(escQS(k) + "=" + escQS(params[k]));
      }
      q.push("callback=" + escQS(safeCb));

      const url = baseUrl + (baseUrl.includes("?") ? "&" : "?") + q.join("&");

      const s = document.createElement("script");
      s.async = true;
      s.defer = true;

      window[safeCb] = (data) => {
        try { delete window[safeCb]; } catch(e){}
        try { s.remove(); } catch(e){}
        resolve(data);
      };

      s.onerror = () => {
        try { delete window[safeCb]; } catch(e){}
        try { s.remove(); } catch(e){}
        reject(new Error("load_error"));
      };

      s.src = url;
      document.head.appendChild(s);
    });
  };
})();

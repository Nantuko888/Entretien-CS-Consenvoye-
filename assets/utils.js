/* ===============================
   UTILITAIRES GÉNÉRAUX
================================ */

/** Sélecteur rapide */
function $(id) {
  return document.getElementById(id);
}

/** Échappe du texte (sécurité) */
function esc(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

/** Affiche une vue (agents / admins) */
function showView(name) {
  $("viewAgents").style.display = name === "agents" ? "block" : "none";
  $("viewAdmins").style.display = name === "admins" ? "block" : "none";
}

/** Change l’état d’un bouton (chargement) */
function setLoading(btn, state) {
  if (!btn) return;
  if (state) {
    btn.dataset.oldText = btn.textContent;
    btn.textContent = "⏳";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.oldText || btn.textContent;
    btn.disabled = false;
  }
}

/** Met à jour une pastille (pill) */
function setPill(id, text, type) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.classList.remove("ok", "bad");
  if (type === "ok") el.classList.add("ok");
  if (type === "bad") el.classList.add("bad");
}

/* ===============================
   TOASTS
================================ */

function showToast(id, msg, ok = true) {
  const el = $(id);
  if (!el) return;

  el.textContent = msg;
  el.classList.add("show");
  el.style.borderColor = ok ? "#1fd36b" : "#ff3b30";

  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.classList.remove("show");
  }, 2500);
}

function hideToast(id) {
  const el = $(id);
  if (el) el.classList.remove("show");
}

/* ===============================
   API CALL
================================ */

async function apiCall(action, data = {}) {
  try {
    const res = await fetch("api.php?action=" + encodeURIComponent(action), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    return await res.json();
  } catch (e) {
    console.error("API error:", e);
    return { ok: false, message: "Erreur réseau" };
  }
}

/* ===============================
   BIND ENTER
================================ */

function bindEnter(inputId, fn, opts = {}) {
  const el = $(inputId);
  if (!el) return;

  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (opts.ctrl && !e.ctrlKey) return;
    if (opts.shift && !e.shiftKey) return;

    e.preventDefault();
    fn(e);
  });
}

/* ===============================
   REFRESH DOUX
================================ */

function softRefresh(ev) {
  const btn = ev?.target;
  if (btn) setLoading(btn, true);

  try {
    const isAdminsView = $("viewAdmins").style.display === "block";

    if (isAdminsView) showView("admins");
    else showView("agents");

    if (STATE?.admins?.ok) showToast("toastAdminsLogin", "Rafraîchi", true);
    if (STATE?.agents?.ok) showToast("toastAgentsLogin", "Rafraîchi", true);

  } catch (e) {
    if (STATE?.admins?.ok) showToast("toastAdminsLogin", "Erreur refresh", false);
    if (STATE?.agents?.ok) showToast("toastAgentsLogin", "Erreur refresh", false);
  } finally {
    if (btn) setLoading(btn, false);
  }
}

/* ===============================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", () => {
  bindEnter("agentCode", agentsLogin);
  bindEnter("adminsCode", adminsLogin);

  bindEnter("adminsNewAgentName", adminsAddAgent);
  bindEnter("adminsNewAgentCode", adminsAddAgent);
  bindEnter("adminsNewMissionLib", adminsAddMission);

  bindEnter("periodeSel", () => $("btnLoadPeriod")?.click());
  bindEnter("btnSaveActiveMissions", () => $("btnSaveActiveMissions")?.click(), { ctrl: true });
});


/* ===============================
   ADMIN — ÉTAT GLOBAL
================================ */

const STATE = {
  admins: {
    ok: false,
    code: "",
    missions: [],
    agents: [],
    periods: [],
    activePeriod: null
  }
};


/* ===============================
   ADMIN — LOGIN
================================ */

async function adminsLogin(ev) {
  const btn = ev?.target;
  setLoading(btn, true);

  const code = $("adminsCode").value.trim();
  if (!code) {
    showToast("toastAdminsLogin", "Code requis", false);
    setLoading(btn, false);
    return;
  }

  const res = await apiCall("adminsLogin", { code });

  if (!res.ok) {
    showToast("toastAdminsLogin", res.message || "Code incorrect", false);
    setLoading(btn, false);
    return;
  }

  // Connexion OK
  STATE.admins.ok = true;
  STATE.admins.code = code;

  showToast("toastAdminsLogin", "Connecté", true);

  // Affiche la vue admin
  showView("admins");

  // Charge les données admin
  await adminsLoadAll();

  setLoading(btn, false);
}


/* ===============================
   ADMIN — CHARGEMENT GLOBAL
================================ */

async function adminsLoadAll() {
  await Promise.all([
    adminsLoadAgents(),
    adminsLoadMissions(),
    adminsLoadPeriods()
  ]);
}


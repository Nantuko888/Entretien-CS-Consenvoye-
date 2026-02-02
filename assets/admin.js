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

/* ===============================
   ADMIN — GESTION DES AGENTS
================================ */

async function adminsLoadAgents() {
  const res = await apiCall("adminsListAgents");

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur chargement agents", false);
    return;
  }

  STATE.admins.agents = res.agents || [];
  adminsRenderAgents();
}

function adminsRenderAgents() {
  const box = $("adminsAgentsList");
  box.innerHTML = "";

  STATE.admins.agents.forEach(agent => {
    const row = document.createElement("div");
    row.className = "checkRow";

    row.innerHTML = `
      <div class="title">${esc(agent.name)}</div>
      <button onclick="adminsToggleAgent(${agent.id})">
        ${agent.active ? "Désactiver" : "Activer"}
      </button>
    `;

    box.appendChild(row);
  });
}

async function adminsToggleAgent(id) {
  const res = await apiCall("adminsToggleAgent", { id });

  if (!res.ok) {
    showToast("toastAdminsLogin", res.message || "Erreur", false);
    return;
  }

  await adminsLoadAgents();
}

async function adminsAddAgent() {
  const name = $("adminsNewAgentName").value.trim();
  const code = $("adminsNewAgentCode").value.trim();

  if (!name || !code) {
    showToast("toastAdminsLogin", "Nom + code requis", false);
    return;
  }

  const res = await apiCall("adminsAddAgent", { name, code });

  if (!res.ok) {
    showToast("toastAdminsLogin", res.message || "Erreur ajout", false);
    return;
  }

  $("adminsNewAgentName").value = "";
  $("adminsNewAgentCode").value = "";

  await adminsLoadAgents();
  showToast("toastAdminsLogin", "Agent ajouté", true);
}

/* ===============================
   ADMIN — GESTION DES MISSIONS
================================ */

async function adminsLoadMissions() {
  const res = await apiCall("adminsListMissions");

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur chargement missions", false);
    return;
  }

  STATE.admins.missions = res.missions || [];
  adminsRenderMissions();
}

function adminsRenderMissions() {
  const box = $("adminsMissionsList");
  box.innerHTML = "";

  STATE.admins.missions.forEach(m => {
    const row = document.createElement("div");
    row.className = "checkRow";

    row.innerHTML = `
      <div class="title">${esc(m.lib)}</div>
      <button onclick="adminsToggleMission(${m.id})">
        ${m.active ? "Désactiver" : "Activer"}
      </button>
    `;

    box.appendChild(row);
  });
}

async function adminsToggleMission(id) {
  const res = await apiCall("adminsToggleMission", { id });

  if (!res.ok) {
    showToast("toastAdminsLogin", res.message || "Erreur", false);
    return;
  }

  await adminsLoadMissions();
}

async function adminsAddMission() {
  const lib = $("adminsNewMissionLib").value.trim();

  if (!lib) {
    showToast("toastAdminsLogin", "Libellé requis", false);
    return;
  }

  const res = await apiCall("adminsAddMission", { lib });

  if (!res.ok) {
    showToast("toastAdminsLogin", res.message || "Erreur ajout", false);
    return;
  }

  $("adminsNewMissionLib").value = "";
  await adminsLoadMissions();
  showToast("toastAdminsLogin", "Mission ajoutée", true);
}

/* ===============================
   ADMIN — GESTION DES PÉRIODES
================================ */

async function adminsLoadPeriods() {
  const res = await apiCall("adminsListPeriods");

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur chargement périodes", false);
    return;
  }

  STATE.admins.periods = res.periods || [];
  adminsRenderPeriods();
}

function adminsRenderPeriods() {
  const sel = $("adminsPeriodsSel");
  sel.innerHTML = "";

  STATE.admins.periods.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
}

async function adminsLoadPeriod(ev) {
  const btn = ev?.target;
  setLoading(btn, true);

  const id = $("adminsPeriodsSel").value;
  const res = await apiCall("adminsLoadPeriod", { id });

  if (!res.ok) {
    showToast("toastAdminsPeriod", res.message || "Erreur", false);
    setLoading(btn, false);
    return;
  }

  STATE.admins.activePeriod = res.period;
  adminsRenderPeriodContent();

  showToast("toastAdminsPeriod", "Période chargée", true);
  setLoading(btn, false);
}

function adminsRenderPeriodContent() {
  const box = $("adminsPeriodContent");
  const p = STATE.admins.activePeriod;

  if (!p) {
    box.innerHTML = "<div>Aucune période chargée</div>";
    return;
  }

  box.innerHTML = `
    <h4>État</h4>
    <div class="pill ${p.validated ? "ok" : "bad"}">
      ${p.validated ? "Validée" : "En attente"}
    </div>

    <h4>Missions actives</h4>
    <div>${p.missions.map(m => `<div>- ${esc(m.lib)}</div>`).join("")}</div>

    <h4>Remarques agents</h4>
    <div>${esc(p.remark || "Aucune")}</div>
  `;
}

/* ===============================
   ADMIN — RETOURS & UI
================================ */

async function adminsLoadRetours() {
  const res = await apiCall("adminsListRetours");

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur retours", false);
    return;
  }

  const box = $("adminsRetoursList");
  if (!box) return;

  box.innerHTML = res.retours.map(r => `
    <div class="panel">
      <h4>${esc(r.agent)}</h4>
      <div>${esc(r.text)}</div>
    </div>
  `).join("");
}

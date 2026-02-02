/* ===============================
   ADMIN — ÉTAT GLOBAL
================================ */

const STATE = {
  admin: {
    ok: false,
    code: "",
    agents: [],
    missions: [],
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

  const res = await apiCall("adminLogin", { code });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Code incorrect", false);
    setLoading(btn, false);
    return;
  }

  STATE.admin.ok = true;
  STATE.admin.code = code;

  showView("admins");
  await adminsLoadAll();

  showToast("toastAdminsLogin", "Connecté", true);
  setLoading(btn, false);
}

/* ===============================
   ADMIN — CHARGEMENT GLOBAL
================================ */

async function adminsLoadAll() {
  await adminsLoadAgents();
  await adminsLoadMissions();
  await adminsLoadPeriods();
}

/* ===============================
   ADMIN — AGENTS
================================ */

async function adminsLoadAgents() {
  const res = await apiCall("adminListAgents", { admin_code: STATE.admin.code });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur chargement agents", false);
    return;
  }

  STATE.admin.agents = res.agents;
  adminsRenderAgents();
}

function adminsRenderAgents() {
  const box = $("adminsAgentsList");
  box.innerHTML = "";

  STATE.admin.agents.forEach(a => {
    const row = document.createElement("div");
    row.className = "checkRow";

    row.innerHTML = `
      <div class="title">${esc(a.nom)}</div>
      <button onclick="adminsToggleAgent('${a.agent_id}')">
        ${a.actif ? "Désactiver" : "Activer"}
      </button>
    `;

    box.appendChild(row);
  });
}

async function adminsToggleAgent(agent_id) {
  const res = await apiCall("adminToggleAgent", {
    admin_code: STATE.admin.code,
    agent_id
  });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur", false);
    return;
  }

  await adminsLoadAgents();
}

async function adminsAddAgent() {
  const name = $("adminsNewAgentName").value.trim();
  const code = $("adminsNewAgentCode").value.trim();

  if (!name) {
    showToast("toastAdminsLogin", "Nom requis", false);
    return;
  }

  const res = await apiCall("adminAddAgent", {
    admin_code: STATE.admin.code,
    name,
    code
  });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur ajout", false);
    return;
  }

  $("adminsNewAgentName").value = "";
  $("adminsNewAgentCode").value = "";

  await adminsLoadAgents();
  showToast("toastAdminsLogin", "Agent ajouté", true);
}

/* ===============================
   ADMIN — MISSIONS
================================ */

async function adminsLoadMissions() {
  const res = await apiCall("adminListCatalog", { admin_code: STATE.admin.code });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur chargement missions", false);
    return;
  }

  STATE.admin.missions = res.catalog;
  adminsRenderMissions();
}

function adminsRenderMissions() {
  const box = $("adminsMissionsList");
  box.innerHTML = "";

  STATE.admin.missions.forEach(m => {
    const row = document.createElement("div");
    row.className = "checkRow";

    row.innerHTML = `
      <div class="title">${esc(m.libelle)}</div>
      <button onclick="adminsToggleMission('${m.mission_id}')">
        ${m.actif ? "Désactiver" : "Activer"}
      </button>
    `;

    box.appendChild(row);
  });
}

async function adminsToggleMission(mission_id) {
  const res = await apiCall("adminToggleMission", {
    admin_code: STATE.admin.code,
    mission_id
  });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur", false);
    return;
  }

  await adminsLoadMissions();
}

async function adminsAddMission() {
  const libelle = $("adminsNewMissionLib").value.trim();

  if (!libelle) {
    showToast("toastAdminsLogin", "Libellé requis", false);
    return;
  }

  const res = await apiCall("adminAddMission", {
    admin_code: STATE.admin.code,
    libelle
  });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur ajout", false);
    return;
  }

  $("adminsNewMissionLib").value = "";
  await adminsLoadMissions();
  showToast("toastAdminsLogin", "Mission ajoutée", true);
}

/* ===============================
   ADMIN — PÉRIODES
================================ */

async function adminsLoadPeriods() {
  const res = await apiCall("adminListPeriodes", { admin_code: STATE.admin.code });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur chargement périodes", false);
    return;
  }

  STATE.admin.periods = res.periodes;
  adminsRenderPeriods();
}

function adminsRenderPeriods() {
  const sel = $("adminsPeriodsSel");
  sel.innerHTML = "";

  STATE.admin.periods.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.period_id;
    opt.textContent = p.libelle;
    sel.appendChild(opt);
  });
}

async function adminsLoadPeriod() {
  const period_id = $("adminsPeriodsSel").value;

  const res = await apiCall("adminLoadPeriod", {
    admin_code: STATE.admin.code,
    period_id
  });

  if (!res.ok) {
    showToast("toastAdminsPeriod", "Erreur", false);
    return;
  }

  STATE.admin.activePeriod = res;
  adminsRenderPeriodContent();
}

function adminsRenderPeriodContent() {
  const box = $("adminsPeriodContent");
  const p = STATE.admin.activePeriod;

  if (!p) {
    box.innerHTML = "<div>Aucune période chargée</div>";
    return;
  }

  box.innerHTML = `
    <h4>Responsable</h4>
    <div>${p.responsable ? esc(p.responsable.nom) : "Aucun"}</div>

    <h4>Équipe</h4>
    <div>${p.group.map(a => `<div>- ${esc(a.nom)}</div>`).join("")}</div>
  `;
}

/* ===============================
   ADMIN — RETOURS
================================ */

async function adminsLoadRetours() {
  const period_id = $("adminsPeriodsSel").value;

  const res = await apiCall("adminGetRetours", {
    admin_code: STATE.admin.code,
    period_id
  });

  if (!res.ok) {
    showToast("toastAdminsLogin", "Erreur retours", false);
    return;
  }

  const box = $("adminsRetoursList");
  box.innerHTML = res.items.map(r => `
    <div class="panel">
      <h4>${esc(r.agent)}</h4>
      <div>${esc(r.mission)} : ${esc(r.declaration)}</div>
      <div>${esc(r.justificatif)}</div>
      <div>${esc(r.remark)}</div>
    </div>
  `).join("");
}

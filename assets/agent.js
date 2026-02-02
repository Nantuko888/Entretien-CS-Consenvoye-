/* ===============================
   AGENT — ÉTAT GLOBAL
================================ */

STATE.agents = {
  ok: false,
  id: null,
  code: "",
  name: "",
  periods: [],
  activePeriod: null,
  missions: [],
  team: [],
  remark: ""
};


/* ===============================
   AGENT — LOGIN
================================ */

async function agentsLogin(ev) {
  const btn = ev?.target;
  setLoading(btn, true);

  const id = $("agentsSel").value;
  const code = $("agentsCode").value.trim();

  if (!id || !code) {
    showToast("toastAgentsLogin", "Sélection + code requis", false);
    setLoading(btn, false);
    return;
  }

  const res = await apiCall("agentsLogin", { id, code });

  if (!res.ok) {
    showToast("toastAgentsLogin", res.message || "Code incorrect", false);
    setLoading(btn, false);
    return;
  }

  STATE.agents.ok = true;
  STATE.agents.id = id;
  STATE.agents.code = code;
  STATE.agents.name = res.name;

  $("agentsAgentBadge").textContent = res.name;
  $("agentsAgentBadge").style.display = "block";

  showToast("toastAgentsLogin", "Connecté", true);

  await agentsLoadPeriods();

  setLoading(btn, false);
}
/* ===============================
   AGENT — PÉRIODES
================================ */

async function agentsLoadPeriods() {
  const res = await apiCall("agentsListPeriods", { id: STATE.agents.id });

  if (!res.ok) {
    showToast("toastAgentsLogin", "Erreur périodes", false);
    return;
  }

  STATE.agents.periods = res.periods || [];
  agentsRenderPeriods();
}

function agentsRenderPeriods() {
  const sel = $("agentsPeriodsSel");
  sel.innerHTML = "";

  STATE.agents.periods.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    sel.appendChild(opt);
  });
}

async function agentsLoadPeriod(ev) {
  const btn = ev?.target;
  setLoading(btn, true);

  const id = $("agentsPeriodsSel").value;
  const res = await apiCall("agentsLoadPeriod", {
    agent: STATE.agents.id,
    period: id
  });

  if (!res.ok) {
    showToast("toastAgentsLoad", res.message || "Erreur", false);
    setLoading(btn, false);
    return;
  }

  STATE.agents.activePeriod = res.period;
  STATE.agents.missions = res.missions || [];
  STATE.agents.team = res.team || [];
  STATE.agents.remark = res.remark || "";

  agentsRenderWork();

  showToast("toastAgentsLoad", "Période chargée", true);
  setLoading(btn, false);
}
/* ===============================
   AGENT — AFFICHAGE DU TRAVAIL
================================ */

function agentsRenderWork() {
  $("boxAgentsAfterLoad").style.display = "block";

  // Remarque
  $("agentsRemark").value = STATE.agents.remark || "";

  // Missions
  const box = $("boxAgentsMissions");
  box.innerHTML = "";

  STATE.agents.missions.forEach(m => {
    const row = document.createElement("div");
    row.className = "panel";

    row.innerHTML = `
      <div class="checkRow">
        <div class="title">${esc(m.lib)}</div>
        <select class="decSel" id="dec_${m.id}">
          <option value="0">Non fait</option>
          <option value="1">Fait</option>
          <option value="2">Partiel</option>
        </select>
      </div>

      <div class="justifRow">
        <input class="justifInp" id="just_${m.id}" placeholder="Justification (si nécessaire)">
      </div>
    `;

    box.appendChild(row);

    // Valeurs existantes
    $("dec_" + m.id).value = m.dec;
    $("just_" + m.id).value = m.justif || "";
  });

  // Équipe
  const teamBox = $("agentsTeamList");
  teamBox.innerHTML = STATE.agents.team.map(t =>
    `<div>- ${esc(t.name)} (${t.resp ? "Responsable" : "Membre"})</div>`
  ).join("");

  const resp = STATE.agents.team.find(t => t.resp);
  $("agentsResponsable").textContent = resp ? `Responsable : ${resp.name}` : "Aucun responsable";
}
/* ===============================
   AGENT — SAUVEGARDE
================================ */

async function agentsSave(ev) {
  const btn = ev?.target;
  setLoading(btn, true);

  const data = {
    agent: STATE.agents.id,
    period: STATE.agents.activePeriod.id,
    remark: $("agentsRemark").value.trim(),
    missions: []
  };

  STATE.agents.missions.forEach(m => {
    data.missions.push({
      id: m.id,
      dec: $("dec_" + m.id).value,
      justif: $("just_" + m.id).value.trim()
    });
  });

  const res = await apiCall("agentsSave", data);

  if (!res.ok) {
    showToast("toastAgentsSave", res.message || "Erreur", false);
    setLoading(btn, false);
    return;
  }

  showToast("toastAgentsSave", "Enregistré", true);
  setLoading(btn, false);
}
/* ===============================
   AGENT — VALIDATION
================================ */

async function agentsValidate(ev) {
  const btn = ev?.target;
  setLoading(btn, true);

  const res = await apiCall("agentsValidate", {
    agent: STATE.agents.id,
    period: STATE.agents.activePeriod.id
  });

  if (!res.ok) {
    showToast("toastAgentsSave", res.message || "Erreur validation", false);
    setLoading(btn, false);
    return;
  }

  showToast("toastAgentsSave", "Validé ✔️", true);

  // Affiche l’overlay "Bravo"
  $("doneOverlay").classList.add("show");
  setTimeout(() => $("doneOverlay").classList.remove("show"), 2000);

  setLoading(btn, false);
}


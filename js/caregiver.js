
/* Caretaker (Professional) view - demo interactions */

(function(){
  const qs = (s, r=document) => r.querySelector(s);
  const esc = (str) => String(str ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const jobsBody = qs("#jobsBody");
  const careStatus = qs("#careStatus");
  const toggleOnline = qs("#toggleOnline");
  const refreshJobs = qs("#refreshJobs");

  const sessionState = qs("#sessionState");
  const otpNeed = qs("#otpNeed");
  const otpInput = qs("#otpInput");
  const verifyOtp = qs("#verifyOtp");
  const endSession = qs("#endSession");
  const geoStatus = qs("#geoStatus");

  const vitals = qs("#vitals2");
  const meds = qs("#meds2");
  const notes = qs("#notes2");
  const postNote = qs("#postNote");
  const clearNotes = qs("#clearNotes");
  const notesList = qs("#notesList");
  const exportNotes = qs("#exportNotes");

  let online = true;
  let activeJob = null;
  let requiredOtp = null;
  let arrived = false;

  const sampleJobs = () => ([
    { id:"J-1421", client:"Layla H.", service:"Post-surgery care", distance:"1.1 km", eta:"9 min", risk:"ok" },
    { id:"J-1422", client:"Ahmed S.", service:"Home nursing", distance:"2.3 km", eta:"14 min", risk:"ok" },
    { id:"J-1423", client:"Mona A.", service:"Elderly care", distance:"0.8 km", eta:"6 min", risk:"warn" },
    { id:"J-1424", client:"Khaled R.", service:"Physiotherapy", distance:"3.0 km", eta:"18 min", risk:"ok" },
  ]);

  function setStatus(text, tone="neutral"){
    if (!careStatus) return;
    careStatus.textContent = text;
    careStatus.style.borderColor =
      tone === "ok" ? "rgba(43,242,159,.26)" :
      tone === "warn" ? "rgba(255,77,109,.26)" :
      "rgba(255,255,255,.10)";
  }

  function renderJobs(){
    if (!jobsBody) return;
    jobsBody.innerHTML = "";
    const jobs = sampleJobs().sort(()=>Math.random()-0.5);
    jobs.forEach(j=>{
      const tr = document.createElement("tr");
      const riskPill = j.risk === "warn"
        ? '<span class="pill2 pill2--warn">Needs review</span>'
        : '<span class="pill2 pill2--ok">Verified</span>';
      tr.innerHTML = `
        <td><strong>${esc(j.client)}</strong><div class="muted" style="margin-top:4px">${esc(j.id)}</div></td>
        <td>${esc(j.service)}</td>
        <td>${esc(j.distance)}</td>
        <td>${esc(j.eta)}</td>
        <td>${riskPill}</td>
        <td><button class="btn btn--primary" data-accept="${esc(j.id)}">Accept</button></td>
      `;
      jobsBody.appendChild(tr);
    });

    jobsBody.querySelectorAll("[data-accept]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-accept");
        const row = btn.closest("tr");
        const client = row?.children?.[0]?.querySelector("strong")?.textContent || "Client";
        const service = row?.children?.[1]?.textContent || "Service";

        activeJob = { id, client, service };
        requiredOtp = String(Math.floor(1000 + Math.random()*9000));
        arrived = false;

        otpNeed.textContent = requiredOtp.split("").join(" ");
        sessionState.textContent = "Awaiting arrival OTP";
        sessionState.className = "pill2 pill2--info";
        geoStatus.textContent = "Geo-fence: pending arrival";
        setStatus(`Job accepted: ${client} • ${service}. Ask the client for the OTP when you arrive.`, "ok");
        window.SHCToast?.("Job accepted", "Arrival requires OTP verification.");
      });
    });
  }

  function syncOnlineBtn(){
    if (!toggleOnline) return;
    toggleOnline.textContent = online ? "● Online" : "○ Offline";
    toggleOnline.style.borderColor = online ? "rgba(43,242,159,.26)" : "rgba(255,255,255,.12)";
  }

  if (toggleOnline){
    toggleOnline.addEventListener("click", ()=>{
      online = !online;
      syncOnlineBtn();
      setStatus(online ? "You are online and can receive jobs." : "You are offline. You won't receive new jobs.", online ? "ok":"neutral");
    });
    syncOnlineBtn();
  }

  if (refreshJobs){
    refreshJobs.addEventListener("click", ()=>{
      renderJobs();
      window.SHCToast?.("Refreshed", "Job queue updated.");
    });
  }

  if (verifyOtp){
    verifyOtp.addEventListener("click", ()=>{
      if (!activeJob){
        setStatus("Select and accept a job first.", "warn");
        return;
      }
      const val = (otpInput?.value || "").trim();
      if (val.length !== 4){
        setStatus("Enter the 4-digit OTP shared by the client.", "warn");
        return;
      }
      if (val !== requiredOtp){
        setStatus("OTP mismatch. Please try again.", "warn");
        return;
      }
      arrived = true;
      sessionState.textContent = "Session verified";
      sessionState.className = "pill2 pill2--ok";
      geoStatus.textContent = "Geo-fence: active within 120m radius";
      setStatus("Arrival verified. Session is now geo-verified and time-stamped updates can be posted.", "ok");
      window.SHCToast?.("Arrival verified", "Geo-fence tracking enabled.");
    });
  }

  if (endSession){
    endSession.addEventListener("click", ()=>{
      activeJob = null;
      requiredOtp = null;
      arrived = false;
      if (otpNeed) otpNeed.textContent = "— — — —";
      if (otpInput) otpInput.value = "";
      sessionState.textContent = "No active session";
      sessionState.className = "pill2 pill2--info";
      geoStatus.textContent = "Geo-fence: inactive";
      setStatus("Session ended. You can accept a new job.", "neutral");
      window.SHCToast?.("Session ended", "Audit trail saved (demo).");
    });
  }

  const nowStamp = () => new Date().toLocaleString(undefined, { hour:"2-digit", minute:"2-digit", month:"short", day:"2-digit" });

  function addNote(v, m, n){
    const el = document.createElement("div");
    el.className = "update";
    el.innerHTML = `
      <div class="update__time">${nowStamp()} • <span class="badgeOk">✅ Verified session</span></div>
      <div class="update__line"><strong>Vitals:</strong> ${esc(v || "—")}</div>
      <div class="update__line"><strong>Medication:</strong> ${esc(m || "—")}</div>
      <div class="update__line"><strong>Observations:</strong> ${esc(n || "—")}</div>
    `;
    notesList.prepend(el);
  }

  if (postNote){
    postNote.addEventListener("click", ()=>{
      if (!activeJob){
        setStatus("Accept a job first.", "warn");
        return;
      }
      if (!arrived){
        setStatus("Verify arrival with OTP before posting notes.", "warn");
        return;
      }
      addNote(vitals?.value, meds?.value, notes?.value);
      if (vitals) vitals.value = "";
      if (meds) meds.value = "";
      if (notes) notes.value = "";
      setStatus("Care note posted and time-stamped.", "ok");
      window.SHCToast?.("Note posted", "Visible to client and admin (demo).");
    });
  }

  if (clearNotes){
    clearNotes.addEventListener("click", ()=>{
      if (notesList) notesList.innerHTML = "";
      window.SHCToast?.("Cleared", "Notes list cleared.");
    });
  }

  if (exportNotes){
    exportNotes.addEventListener("click", ()=>{
      // simple client-side export of current notes as txt
      const lines = [];
      notesList?.querySelectorAll(".update").forEach(u=>{
        const t = u.querySelector(".update__time")?.textContent?.trim() || "";
        const items = Array.from(u.querySelectorAll(".update__line")).map(x=>x.textContent.trim());
        lines.push([t, ...items].join("\n"));
        lines.push("\n---\n");
      });
      const blob = new Blob([lines.join("\n") || "No notes yet."], { type:"text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "care-notes.txt";
      a.click();
      URL.revokeObjectURL(a.href);
      window.SHCToast?.("Exported", "care-notes.txt downloaded.");
    });
  }

  // init
  renderJobs();
  setStatus("Ready. Select a job to begin.", "neutral");
})();

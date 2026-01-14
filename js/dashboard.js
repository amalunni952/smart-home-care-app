
/* Admin dashboard - simulated data + filters + exports */

(function(){
  const qs = (s, r=document) => r.querySelector(s);

  const kpiBookings = qs("#kpiBookings");
  const kpiOtp = qs("#kpiOtp");
  const kpiGeo = qs("#kpiGeo");
  const kpiEsc = qs("#kpiEsc");

  const bars = qs("#bars");
  const riskList = qs("#riskList");
  const sessionsBody = qs("#sessionsBody");
  const filter = qs("#filter");
  const exportCsv = qs("#exportCsv");
  const resolveAll = qs("#resolveAll");
  const verifyBody = qs("#verifyBody");
  const approveNext = qs("#approveNext");

  const rnd = (min, max) => Math.floor(min + Math.random()*(max-min+1));

  const sessions = [
    { client:"Ayesha S.", pro:"Noura R.", service:"Post-surgery", otp:true, geo:true, duration:"01:42", status:"ok" },
    { client:"Khaled R.", pro:"Verified Nurse", service:"Home nursing", otp:true, geo:false, duration:"00:58", status:"warn" },
    { client:"Mona A.", pro:"Caregiver", service:"Elderly care", otp:true, geo:true, duration:"03:10", status:"ok" },
    { client:"Ahmed S.", pro:"Physio Specialist", service:"Physio", otp:false, geo:false, duration:"—", status:"warn" },
    { client:"Layla H.", pro:"Verified Nurse", service:"Wound care", otp:true, geo:true, duration:"01:05", status:"ok" },
  ];

  const verifications = [
    { name:"Sara M.", role:"Nurse", docs:"ID + License", dup:"No match", status:"pending" },
    { name:"Omar N.", role:"Caregiver", docs:"ID + Training", dup:"Possible match", status:"pending" },
    { name:"Huda A.", role:"Physio", docs:"ID + Degree", dup:"No match", status:"pending" },
  ];

  function setKpis(){
    const bookings = rnd(42, 68);
    const otpPct = rnd(86, 97);
    const geoPct = rnd(82, 95);
    const escalations = rnd(2, 9);
    kpiBookings.textContent = String(bookings);
    kpiOtp.textContent = `${otpPct}%`;
    kpiGeo.textContent = `${geoPct}%`;
    kpiEsc.textContent = String(escalations);
  }

  function renderBars(){
    if (!bars) return;
    bars.innerHTML = "";
    const data = Array.from({length: 6}, ()=>rnd(35, 95));
    data.forEach(v=>{
      const el = document.createElement("div");
      el.className = "bar";
      el.style.setProperty("--h", `${v}%`);
      bars.appendChild(el);
    });
  }

  function pill(ok, text){
    if (ok === "ok") return `<span class="pill2 pill2--ok">${text}</span>`;
    if (ok === "warn") return `<span class="pill2 pill2--warn">${text}</span>`;
    return `<span class="pill2 pill2--info">${text}</span>`;
  }

  function renderRisks(){
    if (!riskList) return;
    const items = [
      { t:"Geo-fence anomaly", p:"Session exceeded 120m radius for 6 minutes.", s:"warn" },
      { t:"OTP missing", p:"Professional attempted to start session without OTP.", s:"warn" },
      { t:"Late arrival", p:"Arrival ETA exceeded by 18 minutes.", s:"info" },
    ];
    riskList.innerHTML = "";
    items.forEach(it=>{
      const el = document.createElement("div");
      el.className = "update";
      el.innerHTML = `
        <div class="update__time">${pill(it.s, it.t)}</div>
        <div class="update__line">${it.p}</div>
      `;
      riskList.appendChild(el);
    });
  }

  function renderSessions(){
    if (!sessionsBody) return;
    const f = filter?.value || "all";
    sessionsBody.innerHTML = "";
    sessions
      .filter(s => f==="all" ? true : s.status===f)
      .forEach(s=>{
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${s.client}</strong></td>
          <td>${s.pro}</td>
          <td>${s.service}</td>
          <td>${s.otp ? pill("ok","Verified") : pill("warn","Missing")}</td>
          <td>${s.geo ? pill("ok","Compliant") : pill("warn","Anomaly")}</td>
          <td>${s.duration}</td>
          <td>${s.status === "ok" ? pill("ok","Verified") : pill("warn","Needs review")}</td>
        `;
        sessionsBody.appendChild(tr);
      });
  }

  function renderVerification(){
    if (!verifyBody) return;
    verifyBody.innerHTML = "";
    verifications.forEach((v, idx)=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${v.name}</strong></td>
        <td>${v.role}</td>
        <td>${v.docs}</td>
        <td>${v.dup.includes("Possible") ? pill("warn", v.dup) : pill("ok", v.dup)}</td>
        <td><button class="btn btn--primary" data-approve="${idx}">Approve</button></td>
      `;
      verifyBody.appendChild(tr);
    });

    verifyBody.querySelectorAll("[data-approve]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const idx = Number(btn.getAttribute("data-approve"));
        const name = verifications[idx]?.name || "Professional";
        verifications.splice(idx, 1);
        renderVerification();
        window.SHCToast?.("Approved", `${name} is now verified.`);
      });
    });
  }

  function exportCSV(){
    const rows = [
      ["Client","Professional","Service","OTP","GeoFence","Duration","Status"],
      ...sessions.map(s=>[
        s.client, s.pro, s.service,
        s.otp ? "Verified":"Missing",
        s.geo ? "Compliant":"Anomaly",
        s.duration,
        s.status === "ok" ? "Verified":"Needs review"
      ])
    ];
    const csv = rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sessions.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    window.SHCToast?.("Export ready", "sessions.csv downloaded.");
  }

  if (filter) filter.addEventListener("change", renderSessions);
  if (exportCsv) exportCsv.addEventListener("click", exportCSV);
  if (resolveAll) resolveAll.addEventListener("click", ()=>{
    if (riskList) riskList.innerHTML = "";
    window.SHCToast?.("Resolved", "All risk signals cleared (demo).");
  });
  if (approveNext) approveNext.addEventListener("click", ()=>{
    if (!verifications.length){
      window.SHCToast?.("Queue empty", "No pending verifications.");
      return;
    }
    const name = verifications[0].name;
    verifications.shift();
    renderVerification();
    window.SHCToast?.("Approved", `${name} is now verified.`);
  });

  // init
  setKpis();
  renderBars();
  renderRisks();
  renderSessions();
  renderVerification();
})();

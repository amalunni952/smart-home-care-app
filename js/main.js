
/* Smart Home Care Homepage - Interactions (no framework) */

(function () {
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Year
  const year = qs("#year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile nav
  const toggle = qs(".nav__toggle");
  const menu = qs("#navMenu");
  if (toggle && menu) {
    const close = () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    qsa(".nav__link, .nav__actions a", menu).forEach(a => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  // Smooth scroll (native supported, but add fallback-ish)
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = qs(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });
  });

  // Reveal on scroll
  const revealEls = qsa("[data-reveal]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("revealed");
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // Trust score animate (simple counter)
  const meterValue = qs("#meterValue");
  if (meterValue) {
    const target = Number(meterValue.textContent || "92");
    meterValue.textContent = "0";
    let current = 0;
    const tick = () => {
      current += Math.max(1, Math.floor((target - current) / 10));
      meterValue.textContent = String(Math.min(current, target));
      if (current < target) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 500);
  }

  // Accordion
  qsa("[data-accordion] .acc").forEach(btn => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      // close others for a cleaner UX
      qsa("[data-accordion] .acc").forEach(b => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", String(!expanded));
    });
  });

  // Reviews slider (Swiper)
  const swiperEl = qs("#reviewsSwiper");
  if (swiperEl && window.Swiper) {
    const paginationEl = qs(".reviews__pagination", swiperEl);
    const swiper = new Swiper(swiperEl, {
      loop: true,
      spaceBetween: 14,
      slidesPerView: 1,
      speed: 700,
      autoplay: { delay: 3800, disableOnInteraction: false },
      breakpoints: {
        860: { slidesPerView: 2 },
      },
      on: {
        slideChange: function () {
          if (!paginationEl) return;
          const total = this.slides.length - (this.params.loop ? 2 : 0);
          const current = (this.realIndex + 1);
          paginationEl.textContent = `${String(current).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
        },
        init: function () {
          if (!paginationEl) return;
          const total = this.slides.length - (this.params.loop ? 2 : 0);
          const current = (this.realIndex + 1);
          paginationEl.textContent = `${String(current).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
        }
      }
    });

    const prev = qs("#prevReview");
    const next = qs("#nextReview");
    if (prev) prev.addEventListener("click", () => swiper.slidePrev());
    if (next) next.addEventListener("click", () => swiper.slideNext());
  }

  // Demo logic
  const generateOtpBtn = qs("#generateOtp");
  const simulateArrivalBtn = qs("#simulateArrival");
  const postUpdateBtn = qs("#postUpdate");
  const clearUpdatesBtn = qs("#clearUpdates");

  const status = qs("#bookingStatus");
  const otpOut = qs("#otpOut");
  const updates = qs("#updates");

  const vitals = qs("#vitals");
  const meds = qs("#meds");
  const notes = qs("#notes");

  let otp = null;
  let arrived = false;

  const makeOtp = () => String(Math.floor(1000 + Math.random() * 9000));
  const nowStamp = () => {
    const d = new Date();
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month:"short", day:"2-digit" });
  };

  function setStatus(text, tone="neutral"){
    if (!status) return;
    status.textContent = text;
    status.style.borderColor =
      tone === "ok" ? "rgba(43,242,159,.26)" :
      tone === "warn" ? "rgba(255,77,109,.26)" :
      "rgba(255,255,255,.10)";
  }

  if (generateOtpBtn) {
    generateOtpBtn.addEventListener("click", () => {
      otp = makeOtp();
      arrived = false;
      if (otpOut) otpOut.textContent = otp.split("").join(" ");
      setStatus("OTP generated. Share it only after the caregiver arrives.", "ok");
    });
  }

  if (simulateArrivalBtn) {
    simulateArrivalBtn.addEventListener("click", () => {
      if (!otp) {
        setStatus("Generate an OTP first.", "warn");
        return;
      }
      arrived = true;
      setStatus("Caregiver arrival simulated. OTP can be shared now. Session verification active.", "ok");
    });
  }

  function addUpdate({v, m, n}){
    if (!updates) return;
    const el = document.createElement("div");
    el.className = "update";
    el.innerHTML = `
      <div class="update__time">${nowStamp()} • <span class="badgeOk">✅ Verified session</span></div>
      <div class="update__line"><strong>Vitals:</strong> ${escapeHtml(v || "—")}</div>
      <div class="update__line"><strong>Medication:</strong> ${escapeHtml(m || "—")}</div>
      <div class="update__line"><strong>Observations:</strong> ${escapeHtml(n || "—")}</div>
    `;
    updates.prepend(el);
  }

  if (postUpdateBtn) {
    postUpdateBtn.addEventListener("click", () => {
      if (!otp) {
        setStatus("Generate an OTP to start a booking session.", "warn");
        return;
      }
      if (!arrived) {
        setStatus("Simulate arrival first to verify presence (OTP shared after arrival).", "warn");
        return;
      }
      addUpdate({ v: vitals?.value, m: meds?.value, n: notes?.value });
      if (vitals) vitals.value = "";
      if (meds) meds.value = "";
      if (notes) notes.value = "";
      setStatus("Care update posted and time-stamped.", "ok");
    });
  }

  if (clearUpdatesBtn) {
    clearUpdatesBtn.addEventListener("click", () => {
      if (updates) updates.innerHTML = "";
      setStatus("Updates cleared.", "neutral");
    });
  }

  // helpers
  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Respect reduced motion
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    // stop marquee by removing animation
    qsa(".marquee__track").forEach(el => el.style.animation = "none");
    qsa(".dot--pulse").forEach(el => el.style.animation = "none");
    qsa(".meter__ring").forEach(el => el.style.animation = "none");
    qsa(".orbit__ring").forEach(el => el.style.animation = "none");
    qsa(".floating").forEach(el => el.style.animation = "none");
    qsa(".map__pulse").forEach(el => el.style.animation = "none");
  }
})();

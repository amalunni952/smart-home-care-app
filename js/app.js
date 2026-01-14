
/* Shared UI utilities for Smart Home Care prototype */

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

  // Reveal on scroll
  const revealEls = qsa("[data-reveal]");
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("revealed");
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  // Smooth scroll for on-page anchors
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

  // Toast helper
  window.SHCToast = function(title, msg){
    const toast = qs("#toast");
    const t = qs("#toastT");
    const p = qs("#toastP");
    if (!toast || !t || !p) return;
    t.textContent = title;
    p.textContent = msg;
    toast.classList.add("show");
    clearTimeout(window.__shc_toast);
    window.__shc_toast = setTimeout(()=>toast.classList.remove("show"), 3200);
  };

  // Reduced motion
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    qsa(".dot--pulse,.meter__ring,.orbit__ring,.floating,.map__pulse").forEach(el => el.style.animation = "none");
    qsa(".marquee__track").forEach(el => el.style.animation = "none");
  }
})();

/* KonaClaw site interactions. Vanilla, bundled by Astro — no external requests.
   Progressive enhancement: without JS every pane and card renders normally. */

document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- Scroll progress bar (under the sticky nav) ---- */
const progress = document.querySelector(".scroll-progress");
if (progress) {
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--p", max > 0 ? String(window.scrollY / max) : "0");
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ---- Nav shadow once scrolled off the top ---- */
const nav = document.querySelector("header.nav-glass");
if (nav) {
  const onScroll = () => nav.classList.toggle("nav-scrolled", window.scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---- Mobile nav disclosure ---- */
const navToggle = document.querySelector(".nav-toggle");
const navHeader = document.querySelector("header.nav-glass");
const navMenu = document.getElementById("nav-menu");
if (navToggle && navHeader && navMenu) {
  const setOpen = (open) => {
    navHeader.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  };
  navToggle.addEventListener("click", () => setOpen(!navHeader.classList.contains("nav-open")));
  navMenu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  // Desktop breakpoint: undo the collapsed state so links show again.
  const mq = matchMedia("(min-width: 640px)");
  const sync = () => { if (mq.matches) setOpen(false); };
  mq.addEventListener("change", sync);
}

/* ---- Scroll reveals: sections and cards rise into view ---- */
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length) {
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    revealEls.forEach((el, i) => {
      if (!el.style.transitionDelay) el.style.transitionDelay = `${Math.min(i % 3, 2) * 90}ms`;
      io.observe(el);
    });
  }
}

/* ---- Pointer parallax on the hero aurora ---- */
const glow = document.querySelector(".hero-glow");
const hero = document.querySelector("[data-hero]");
if (glow && hero && !reduceMotion) {
  let gx = 0, gy = 0, raf = 0;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    gx = ((e.clientX - r.left) / r.width - 0.5) * 44;
    gy = ((e.clientY - r.top) / r.height - 0.5) * 28;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      glow.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
    });
  }, { passive: true });
}

/* ---- 3D tilt + cursor glare on screenshots ---- */
if (!reduceMotion) {
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    const max = 5;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    }, { passive: true });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    }, { passive: true });
  });
}

/* ---- Spotlight glow on cards (assurance cards + capability feature cards) ---- */
if (!reduceMotion) {
  document.querySelectorAll("[data-spotlight], [data-glow]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    }, { passive: true });
  });
}

/* ---- Hero screenshot stack: tabs + auto crossfade ---- */
const stack = document.querySelector("[data-stack]");
if (stack) {
  const panes = [...stack.querySelectorAll(".shot-pane")];
  const tabs = [...stack.querySelectorAll(".shot-tab")];
  let active = 0;
  let timer = 0;

  const select = (i) => {
    panes[active].classList.remove("is-active");
    panes[active].setAttribute("inert", "");
    tabs[active].setAttribute("aria-selected", "false");
    tabs[active].tabIndex = -1;
    active = (i + panes.length) % panes.length;
    panes[active].classList.add("is-active");
    panes[active].removeAttribute("inert");
    tabs[active].setAttribute("aria-selected", "true");
    tabs[active].tabIndex = 0;
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
  const start = () => { stop(); if (!reduceMotion) timer = setInterval(() => select(active + 1), 5200); };

  panes[0].classList.add("is-active");
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { select(i); start(); });
  });
  stack.addEventListener("pointerenter", stop);
  stack.addEventListener("pointerleave", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  /* arrow-key support on the tablist */
  const tablist = stack.querySelector("[role='tablist']");
  tablist?.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + panes.length) % panes.length;
    select(next);
    tabs[next].focus();
    start();
  });

  start();
}

/* ---- Capabilities page: count-up, sticky-rail scrollspy, smooth jumps ----
   Guarded — no-op on every other page. */
(function () {
  const counter = document.querySelector("[data-count]");
  if (counter) {
    const target = parseInt(counter.dataset.count, 10) || 0;
    if (reduceMotion) {
      counter.textContent = String(target);
    } else {
      const cio = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        cio.disconnect();
        const t0 = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - t0) / 700);
          counter.textContent = String(Math.round((1 - (1 - t) ** 3) * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.4 });
      cio.observe(counter);
    }
  }

  const sections = [...document.querySelectorAll("[data-cap-section]")];
  const chips = [...document.querySelectorAll("[data-cap-jump]")];
  if (!sections.length || !chips.length) return;

  const byId = new Map(chips.map((c) => [c.dataset.capJump, c]));
  const setActive = (id) => {
    for (const c of chips) c.classList.toggle("is-active", c === byId.get(id));
  };
  const sio = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
  }, { rootMargin: "-140px 0px -60% 0px" });
  for (const s of sections) sio.observe(s);

  /* The 1.1 section can be filtered away; hide its chip then too. */
  const soon = document.getElementById("coming-in-1-1");
  const soonChip = byId.get("coming-in-1-1");
  if (soon && soonChip) {
    const sync = () => {
      const gone = document.documentElement.dataset.capFilter === "shipped";
      soonChip.hidden = gone;
      if (gone && soonChip.classList.contains("is-active")) setActive(sections[0].id);
    };
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["data-cap-filter"] });
    sync();
  }

  if (!reduceMotion) {
    for (const c of chips) {
      c.addEventListener("click", (ev) => {
        const el = document.getElementById(c.getAttribute("href").slice(1));
        if (!el) return;
        ev.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }
})();

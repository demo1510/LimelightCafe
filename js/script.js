/* ============================================================
   Limelight with Sheesha — site interactions
   Each block is guarded so one failure never breaks the rest.
   Depends (optionally) on: GSAP, ScrollTrigger, Lenis, Swiper.
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ready = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();

  ready(init);

  function init() {
    safe(currentYear, "currentYear");
    safe(headerScroll, "headerScroll");
    safe(mobileNav, "mobileNav");
    safe(spotlightGlow, "spotlightGlow");
    safe(smoothScroll, "smoothScroll");
    safe(scrollSpy, "scrollSpy");
    safe(revealOnScroll, "revealOnScroll");
    safe(counters, "counters");
    safe(menuFilters, "menuFilters");
    safe(galleryLightbox, "galleryLightbox");
    safe(testimonialSlider, "testimonialSlider");
    safe(reservationForm, "reservationForm");
    safe(particles, "particles");
  }

  function safe(fn, name) {
    try {
      fn();
    } catch (err) {
      console.error(`[Limelight] "${name}" failed:`, err);
    }
  }

  /* ---------- 1. Footer year ---------- */
  function currentYear() {
    const el = $("#currentYear");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- 2. Header background on scroll ---------- */
  function headerScroll() {
    const header = $("#siteHeader");
    if (!header) return;
    const onScroll = () =>
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 3. Mobile navigation ---------- */
  function mobileNav() {
    const btn = $("#hamburgerBtn");
    const nav = $("#mobileNav");
    if (!btn || !nav) return;

    const setOpen = (open) => {
      nav.setAttribute("data-state", open ? "open" : "closed");
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.style.overflow = open ? "hidden" : "";
    };

    btn.addEventListener("click", () =>
      setOpen(nav.getAttribute("data-state") !== "open")
    );

    $$(".mobile-nav-link, .mobile-nav-footer a", nav).forEach((link) =>
      link.addEventListener("click", () => setOpen(false))
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---------- 4. Spotlight cursor glow ---------- */
  function spotlightGlow() {
    const glow = $("#spotlightGlow");
    if (!glow || prefersReduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = null;
    window.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        glow.classList.add("is-active");
        raf = null;
      });
    });
    document.addEventListener("mouseleave", () =>
      glow.classList.remove("is-active")
    );
  }

  /* ---------- 5. Smooth scrolling (Lenis if available) ---------- */
  function smoothScroll() {
    let lenis = null;
    const header = $("#siteHeader");
    const headerH = () => (header ? header.offsetHeight : 78);

    if (window.Lenis && !prefersReduced) {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);

      if (window.gsap && window.ScrollTrigger) {
        lenis.on("scroll", window.ScrollTrigger.update);
      }
      window.__lenis = lenis;
    }

    $$('a[href^="#"]').forEach((link) => {
      const id = link.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      link.addEventListener("click", (e) => {
        const target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        const top =
          target.getBoundingClientRect().top + window.scrollY - headerH() + 1;
        if (lenis) lenis.scrollTo(top);
        else
          window.scrollTo({
            top,
            behavior: prefersReduced ? "auto" : "smooth",
          });
      });
    });
  }

  /* ---------- 6. Scroll-spy: active nav link ---------- */
  function scrollSpy() {
    const sections = $$("main section[id]");
    const links = $$(".primary-nav .nav-link");
    if (!sections.length || !links.length) return;

    const byId = new Map(
      links.map((l) => [l.getAttribute("href")?.slice(1), l])
    );

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((l) => l.classList.remove("is-active"));
          const active = byId.get(entry.target.id);
          if (active) active.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => obs.observe(s));
  }

  /* ---------- 7. Reveal on scroll ---------- */
  function revealOnScroll() {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    items.forEach((el) => obs.observe(el));
  }

  /* ---------- 8. Animated counters ---------- */
  function counters() {
    const els = $$(".counter-number[data-count]");
    if (!els.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || "";
      if (prefersReduced) {
        el.textContent = target.toLocaleString() + suffix;
        return;
      }
      const dur = 1600;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent =
          Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      els.forEach(run);
      return;
    }
    const obs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => obs.observe(el));
  }

  /* ---------- 9. Menu category filters ---------- */
  function menuFilters() {
    const pills = $$(".filter-pill");
    const cards = $$("#foodGrid .food-card");
    if (!pills.length || !cards.length) return;

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          p.classList.remove("is-active");
          p.setAttribute("aria-selected", "false");
        });
        pill.classList.add("is-active");
        pill.setAttribute("aria-selected", "true");

        const filter = pill.dataset.filter;
        cards.forEach((card) => {
          const show = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  /* ---------- 10. Gallery lightbox ---------- */
  function galleryLightbox() {
    const box = $("#lightbox");
    const stageImg = $("#lightboxImage");
    const caption = $("#lightboxCaption");
    const closeBtn = $("#lightboxClose");
    const items = $$(".masonry-item");
    if (!box || !items.length) return;

    const open = (item) => {
      const icon = item.querySelector("i");
      if (stageImg) {
        stageImg.innerHTML = icon
          ? `<i class="${icon.className}" aria-hidden="true"></i>`
          : "";
      }
      if (caption) caption.textContent = item.dataset.caption || "";
      box.setAttribute("data-state", "open");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      box.setAttribute("data-state", "closed");
      document.body.style.overflow = "";
    };

    items.forEach((item) => item.addEventListener("click", () => open(item)));
    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && box.getAttribute("data-state") === "open")
        close();
    });
  }

  /* ---------- 11. Testimonials slider (Swiper) ---------- */
  function testimonialSlider() {
    const el = $(".testimonial-swiper");
    if (!el || !window.Swiper) return;
    new window.Swiper(el, {
      loop: true,
      speed: 600,
      spaceBetween: 24,
      autoplay: prefersReduced
        ? false
        : { delay: 5000, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      slidesPerView: 1,
      breakpoints: {
        768: { slidesPerView: 2 },
        1100: { slidesPerView: 3 },
      },
    });
  }

  /* ---------- 12. Reservation form ---------- */
  function reservationForm() {
    const form = $("#reserveForm");
    const note = $("#formNote");
    if (!form) return;

    const dateInput = $("#resDate");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    const setNote = (msg, ok) => {
      if (!note) return;
      note.textContent = msg;
      note.style.color = ok
        ? "var(--c-gold, #d4af37)"
        : "var(--c-danger, #e57373)";
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        setNote("Please complete all fields correctly.", false);
        return;
      }
      const name = (form.elements["name"]?.value || "").trim();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      setNote(
        `Thank you${name ? ", " + name : ""}! Your table request has been received — we'll confirm by phone shortly.`,
        true
      );
      form.reset();
      if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];
      setTimeout(() => {
        if (btn) btn.disabled = false;
      }, 1200);
    });
  }

  /* ---------- 13. Hero particles ---------- */
  function particles() {
    const canvas = $("#particlesCanvas");
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w, h, dots;
    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      const count = Math.min(70, Math.floor((w * h) / 22000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.8 + 0.4,
        vy: Math.random() * 0.35 + 0.1,
        vx: (Math.random() - 0.5) * 0.25,
        a: Math.random() * 0.5 + 0.2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y -= d.vy;
        d.x += d.vx;
        if (d.y < -5) {
          d.y = h + 5;
          d.x = Math.random() * w;
        }
        if (d.x < -5) d.x = w + 5;
        if (d.x > w + 5) d.x = -5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${d.a})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  }
})();

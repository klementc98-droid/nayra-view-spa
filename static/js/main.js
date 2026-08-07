/* ==========================================================================
   Nayra — View & Spa

   ►►► EVERYTHING YOU NEED TO EDIT IS IN THE CONFIG BLOCK BELOW. ◄◄◄

   Leave a value as an empty string ("") and the site hides that element
   rather than showing a dead link. Fill it in and the element appears.
   ========================================================================== */

const CONFIG = {

  /* 1. Platform listing ----------------------------------------------------
     Paste the full listing URL from your browser's address bar.
     While this is empty, its buttons/card stay hidden rather than dead.    */
  bookingUrl: "https://www.booking.com/hotel/gr/thygaterra-view-amp-spa.html",

  /* Optional: only set this if the reviews live somewhere other than the
     listing's own #tab-reviews. Left empty, it is derived from bookingUrl. */
  bookingReviewsUrl: "",

  /* 1b. Calendar sync ------------------------------------------------------
     Booked dates are pulled from Booking.com's iCal feed by a serverless
     function, so the form can refuse dates that are already taken.

     The feed URL is NOT set here — it holds a private token and must live in
     an environment variable. Set ICAL_URLS in your Netlify dashboard; see
     netlify/functions/availability.mjs for exactly where to find it.

     Set to "" to switch the check off entirely.                            */
  availabilityUrl: "/api/availability",

  /* 2. Direct booking ------------------------------------------------------
     bookingEmbed: paste the embed code from Lodgify / Smoobu / Hospitable.
     As soon as this has a value it REPLACES the request form with the live
     calendar, and guests can book and pay instantly.

     Leave it empty and the dated request form is used instead — that still
     works, the owner just confirms each booking by hand.                   */
  bookingEmbed: "",

  /* Where the request form sends to.
       ""                       → Netlify Forms (automatic, if you host on
                                  Netlify — nothing else to set up)
       "https://formspree.io/f/xxxxxxx"
                                → Formspree, for Vercel / GitHub Pages     */
  formEndpoint: "",

  /* 3. Contact details -----------------------------------------------------
     Only filled-in values appear in the footer.
     whatsapp: digits only, including country code, no + or spaces.         */
  email:     "",
  whatsapp:  "",
  phone:     "",
  instagram: "",

  /* 4. Minimum stay in nights. Set to 1 if there isn't one.                */
  minNights: 1,

  /* 5. Map --------------------------------------------------------------
     What Google Maps searches for. CHECK THIS POINTS AT THE RIGHT BUILDING
     before launch — paste it into maps.google.com and look.
     No iframe loads until a visitor presses "Show map", so no Google cookies
     are set on page view.                                                  */
  mapQuery: "7is Merarchias 129, Kavala 65403, Greece",
};

/* ==========================================================================
   Below this line is site machinery — you shouldn't need to change it.
   ========================================================================== */

(function () {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Runtime strings for the current language. build.py writes window.I18N into
     each page; the English fallbacks keep things working if it is ever absent. */
  const STR = window.I18N || {};
  const t = (key, vars = {}, fallback = "") =>
    Object.entries(vars).reduce(
      (out, [k, v]) => out.replaceAll("{" + k + "}", v),
      STR[key] || fallback
    );
  const LOCALE = STR.locale || "en-GB";

  /* ---------- Year ---------- */
  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Platform links ---------- */
  const wireLinks = (sel, url, cardSel, label) => {
    $$(sel).forEach((a) => {
      if (url) {
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else {
        a.hidden = true;
      }
    });
    /* Hide the whole card too, so an empty URL leaves no orphaned heading. */
    if (!url) {
      $$(cardSel).forEach((c) => { c.hidden = true; });
      console.warn(`[Nayra] ${label} URL is empty — that card is hidden.`);
    }
  };
  wireLinks("[data-booking]", CONFIG.bookingUrl, "[data-booking-card]", "CONFIG.bookingUrl");

  /* Reviews CTA — the same listing, opened on its reviews tab. Derived from
     bookingUrl so there is only ever one URL to keep correct. */
  const reviewsUrl = CONFIG.bookingReviewsUrl ||
    (CONFIG.bookingUrl ? CONFIG.bookingUrl.split("#")[0] + "#tab-reviews" : "");
  wireLinks("[data-booking-reviews]", reviewsUrl, "[data-booking-reviews]", "reviews");

  /* ---------- Contact links ---------- */
  const contacts = {
    email:     CONFIG.email     && { href: "mailto:" + CONFIG.email, text: CONFIG.email },
    whatsapp:  CONFIG.whatsapp  && { href: "https://wa.me/" + CONFIG.whatsapp, text: "WhatsApp", ext: true },
    phone:     CONFIG.phone     && { href: "tel:" + CONFIG.phone.replace(/\s/g, ""), text: CONFIG.phone },
    instagram: CONFIG.instagram && {
      href: "https://instagram.com/" + CONFIG.instagram.replace(/^@/, ""),
      text: "@" + CONFIG.instagram.replace(/^@/, ""), ext: true,
    },
  };

  let anyContact = false;
  Object.entries(contacts).forEach(([key, c]) => {
    const el = $(`[data-contact="${key}"]`);
    if (!el || !c) return;
    el.href = c.href;
    el.textContent = c.text;
    if (c.ext) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
    el.hidden = false;
    anyContact = true;
  });
  const emptyNote = $("[data-contact-empty]");
  if (emptyNote && anyContact) emptyNote.hidden = true;

  /* ---------- Sticky nav ---------- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-stuck", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $(".nav__burger");
  const mobile = $("#mobilenav");
  if (burger && mobile) {
    const setMenu = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      mobile.hidden = !open;
      burger.setAttribute("aria-label",
        open ? t("menuClose", {}, "Close menu") : t("menuOpen", {}, "Open menu"));
    };
    burger.addEventListener("click", () =>
      setMenu(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", mobile).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealables = $$(".sect .wrap > *, .spa__head, .spa__grid, .book__grid");
  if (!reduced && "IntersectionObserver" in window) {
    revealables.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealables.forEach((el) => io.observe(el));
  }

  /* ---------- Lightbox ---------- */
  const lb   = $("#lb");
  const lbi  = $("#lbi");
  const lbc  = $("#lbc");
  const shots = $$(".gal__i");
  let idx = 0;
  let lastFocus = null;

  const show = (i) => {
    idx = (i + shots.length) % shots.length;
    const btn = shots[idx];
    const img = $("img", btn);
    lbi.src = btn.dataset.full;
    lbi.alt = img.alt;
    lbc.textContent = img.alt;
  };

  const open = (i) => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbx").focus();
  };

  const close = () => {
    lb.hidden = true;
    lbi.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  shots.forEach((b, i) => b.addEventListener("click", () => open(i)));
  $("#lbx").addEventListener("click", close);
  $("#lbp").addEventListener("click", () => show(idx - 1));
  $("#lbn").addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape")     close();
    if (e.key === "ArrowLeft")  show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "Tab") {
      const f = $$("button", lb);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Swipe */
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 55) show(dx > 0 ? idx - 1 : idx + 1);
    touchX = null;
  }, { passive: true });

  /* ---------- Map (facade — nothing from Google until asked) ---------- */
  const mapFrame = $("#mapframe");
  const mapLoad  = $("#mapload");
  const mapQ = encodeURIComponent(CONFIG.mapQuery || "");

  $$("[data-mapopen]").forEach((a) => {
    if (mapQ) a.href = `https://www.google.com/maps/search/?api=1&query=${mapQ}`;
    else a.hidden = true;
  });

  if (mapFrame && mapLoad && mapQ) {
    mapLoad.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.google.com/maps?q=${mapQ}&output=embed`;
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      f.title = CONFIG.mapQuery;
      f.allowFullscreen = true;
      mapFrame.replaceChildren(f);
    });
  } else if (mapFrame && !mapQ) {
    mapFrame.hidden = true;
  }

  /* ---------- Spa clips ----------
     Placed above the booking block on purpose: that block returns early when a
     channel-manager embed is configured, which would skip everything after it. */
  const films = $$(".film");
  if (films.length) {
    const saveData = navigator.connection && navigator.connection.saveData;
    /* Ambient autoplay only where it's actually welcome: a wide screen, motion
       allowed, and no data-saver. Everywhere else it stays tap-to-play. */
    const ambient = !reduced && !saveData && matchMedia("(min-width: 760px)").matches;

    films.forEach((fig) => {
      const v   = $(".film__v", fig);
      const btn = $(".film__btn", fig);

      const play = () => {
        v.preload = "auto";
        const p = v.play();
        if (p) p.then(() => { btn.hidden = true; }).catch(() => { btn.hidden = false; });
      };

      btn.addEventListener("click", () => {
        if (v.paused) play();
        else { v.pause(); btn.hidden = false; }
      });

      /* Let a playing clip be paused by clicking it. */
      v.addEventListener("click", () => { v.pause(); btn.hidden = false; });

      if (!ambient || !("IntersectionObserver" in window)) return;

      const io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          if (e.isIntersecting) play();
          else if (!v.paused) { v.pause(); btn.hidden = false; }
        }),
        { threshold: 0.4 }
      );
      io.observe(fig);
    });
  }

  /* ---------- Booking ---------- */
  const widget = $("#booking-widget");
  const form   = $("#bform");

  /* A channel-manager embed takes over completely when one is configured. */
  if (CONFIG.bookingEmbed && widget && form) {
    widget.innerHTML = CONFIG.bookingEmbed;
    widget.hidden = false;
    form.hidden = true;
    /* Embeds delivered as <script> tags need re-injecting to execute. */
    $$("script", widget).forEach((old) => {
      const s = document.createElement("script");
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
    return;
  }

  if (!form) return;

  const cin  = $("#cin");     // hidden inputs — these carry the real form values
  const cout = $("#cout");
  const sum  = $("#bsum");
  const err  = $("#berr");
  const done = $("#bdone");
  const sync = $("#bsync");

  /* Local-date ISO. Never toISOString() here: it converts to UTC first, so
     anyone east of Greenwich gets yesterday's date after midnight local. */
  const iso = (d) =>
    d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
  const parse = (v) => { const p = v.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const TODAY = iso(today);

  const nights = () => {
    if (!cin.value || !cout.value) return 0;
    return Math.round((parse(cout.value) - parse(cin.value)) / 864e5);
  };

  /* ---------- Availability from Booking.com ----------
     Ranges are {from, to} with `to` EXCLUSIVE — the checkout day, which is
     bookable again, so back-to-back stays stay allowed. */
  let booked = null;                    // null = not loaded / feed unavailable
  const busyNights = new Set();

  const fmtDay = (v) => parse(v).toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
  const isBusy = (v) => busyNights.has(v);

  const clash = (from, to) => {
    if (!booked) return null;
    return booked.find((r) => from < r.to && to > r.from) || null;
  };

  const expandBooked = () => {
    busyNights.clear();
    (booked || []).forEach((r) => {
      for (let d = parse(r.from); iso(d) < r.to; d = addDays(d, 1)) busyNights.add(iso(d));
    });
  };

  const fail = (msg) => { err.textContent = msg; err.hidden = false; return false; };

  const check = () => {
    err.hidden = true;
    const n = nights();
    if (!n) return false;
    if (n < 0) return fail(t("errCheckout", {}, "Check-out needs to be after check-in."));
    if (n < CONFIG.minNights) {
      sum.textContent = "";
      return fail(t("errMinNights", { n: CONFIG.minNights },
        "Minimum stay is " + CONFIG.minNights + " night" + (CONFIG.minNights > 1 ? "s" : "") + "."));
    }
    const hit = clash(cin.value, cout.value);
    if (hit) {
      sum.textContent = "";
      const lastNight = iso(addDays(parse(hit.to), -1));
      return fail(t("errBooked", { from: fmtDay(hit.from), to: fmtDay(lastNight) },
        "Already booked " + fmtDay(hit.from) + " – " + fmtDay(lastNight) + ". Please pick other dates."));
    }
    sum.textContent = t("nights", { n }, n + " night" + (n > 1 ? "s" : "")) +
      " · " + fmtDay(cin.value) + " – " + fmtDay(cout.value);
    return true;
  };

  /* ---------- Range calendar ----------
     Replaces <input type="date">, which rendered the browser's own widget:
     locale-dependent placeholders, no typing, and no way to show which nights
     are already taken. */
  const cal      = $("#cal");
  const toggle   = $("#calToggle");
  const panel    = $("#calPanel");
  const monthsEl = $("#calMonths");
  const inVal    = $("#calIn");
  const outVal   = $("#calOut");
  const nightsEl = $("#calNights");
  const prevBtn  = $("#calPrev");
  const nextBtn  = $("#calNext");
  const clearBtn = $("#calClear");

  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let hoverEnd = null;

  /* Monday-first weekday initials, in the page language. */
  const dowNames = () => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      out.push(new Date(2024, 0, 1 + i).toLocaleDateString(LOCALE, { weekday: "narrow" }));
    }
    return out;
  };

  /* Would [a,b) jump over somebody else's booking? */
  const spansBusy = (a, b) => {
    for (let d = parse(a); iso(d) < b; d = addDays(d, 1)) if (isBusy(iso(d))) return true;
    return false;
  };

  const renderMonth = (base) => {
    const y = base.getFullYear(), m = base.getMonth();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7;      // Monday = 0
    const total = new Date(y, m + 1, 0).getDate();

    let h = '<div><p class="cal__mtitle">' +
      base.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }) + "</p>";
    h += '<div class="cal__dow" aria-hidden="true">' +
      dowNames().map((d) => "<span>" + d + "</span>").join("") + "</div>";
    h += '<div class="cal__grid">';
    for (let i = 0; i < lead; i++) h += '<span class="cal__day cal__day--pad"></span>';

    for (let day = 1; day <= total; day++) {
      const v = iso(new Date(y, m, day));
      const past = v < TODAY;
      const busy = isBusy(v);
      const isIn = v === cin.value;
      const isOut = v === cout.value;
      const end = cout.value || (cin.value && hoverEnd) || null;
      const mid = cin.value && end && v > cin.value && v < end;

      const cls = ["cal__day"];
      if (busy) cls.push("cal__day--busy");
      if (v === TODAY) cls.push("cal__day--today");
      if (isIn) cls.push("cal__day--in");
      if (isOut) cls.push("cal__day--out");
      if (mid) cls.push("cal__day--mid");

      /* A booked night is never selectable, either end. The check-out day of an
         existing booking is NOT in busyNights — DTEND is exclusive — so
         back-to-back stays still work without special-casing anything here.
         An earlier version allowed any booked night as a check-out once a
         check-in was set, which let a guest pick a date mid-booking. */
      const ok = !past && !busy;
      h += '<button type="button" class="' + cls.join(" ") + '" data-d="' + v + '"' +
           (ok ? "" : " disabled") +
           ' aria-label="' + parse(v).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" }) + '"' +
           (isIn || isOut ? ' aria-current="date"' : "") + ">" + day + "</button>";
    }
    return h + "</div></div>";
  };

  /* Repaint selection state on the EXISTING buttons.

     This must never rebuild innerHTML. The hover preview runs on mouseover,
     and re-rendering there destroys and recreates the button under the cursor
     — a click only fires when mousedown and mouseup hit the same element, so
     rebuilding mid-hover silently swallowed every second click and made it
     impossible to pick a check-out date. */
  const paint = () => {
    if (!monthsEl) return;
    const end = cout.value || (cin.value && hoverEnd) || null;
    $$(".cal__day[data-d]", monthsEl).forEach((b) => {
      const v = b.dataset.d;
      const isIn = v === cin.value;
      const isOut = v === cout.value;
      b.classList.toggle("cal__day--in", isIn);
      b.classList.toggle("cal__day--out", isOut);
      b.classList.toggle("cal__day--mid",
        Boolean(cin.value && end && v > cin.value && v < end));
      if (isIn || isOut) b.setAttribute("aria-current", "date");
      else b.removeAttribute("aria-current");
    });
    inVal.textContent  = cin.value ? fmtDay(cin.value) : "";
    outVal.textContent = cout.value ? fmtDay(cout.value) : "";
    const n = nights();
    nightsEl.textContent = n > 0 ? t("nights", { n }, n + " night" + (n > 1 ? "s" : "")) : "";
  };

  /* Full rebuild — only for month changes, resize, and availability arriving. */
  const render = () => {
    if (!monthsEl) return;
    monthsEl.innerHTML = renderMonth(view);
    prevBtn.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    paint();
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (open) render();
  };

  if (cal && toggle && panel) {
    toggle.addEventListener("click", () => setOpen(panel.hidden));
    prevBtn.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render();
    });
    nextBtn.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render();
    });
    clearBtn.addEventListener("click", () => {
      cin.value = ""; cout.value = ""; hoverEnd = null;
      err.hidden = true; sum.textContent = ""; paint();
    });

    monthsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".cal__day");
      if (!b || b.disabled) return;
      const v = b.dataset.d;

      if (!cin.value || cout.value || v <= cin.value) {
        cin.value = v; cout.value = ""; hoverEnd = null;
        err.hidden = true;
        sum.textContent = t("calPickOut", {}, "Now choose your check-out date.");
      } else if (spansBusy(cin.value, v)) {
        cin.value = v; cout.value = "";
        sum.textContent = t("calPickOut", {}, "Now choose your check-out date.");
      } else {
        cout.value = v;
        if (check()) setTimeout(() => setOpen(false), 200);
      }
      paint();
    });

    monthsEl.addEventListener("mouseover", (e) => {
      const b = e.target.closest(".cal__day");
      if (!b || b.disabled || !cin.value || cout.value) return;
      if (hoverEnd === b.dataset.d) return;      // nothing changed
      hoverEnd = b.dataset.d; paint();
    });
    monthsEl.addEventListener("mouseleave", () => {
      if (hoverEnd) { hoverEnd = null; paint(); }
    });

    document.addEventListener("click", (e) => {
      if (!panel.hidden && !cal.contains(e.target)) setOpen(false);
    });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
    });
    render();
  }

  const loadAvailability = async () => {
    if (!CONFIG.availabilityUrl) return;
    try {
      const res = await fetch(CONFIG.availabilityUrl, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      /* Not configured, or feed down: leave `booked` null rather than claiming
         everything is free. */
      if (!data.configured || data.ok === false) return;
      booked = data.ranges || [];
      expandBooked();
      if (sync) {
        sync.textContent = booked.length
          ? t("syncBooked", {}, "Live availability from Booking.com — booked dates are blocked.")
          : t("syncFree", {}, "Live availability from Booking.com — nothing booked right now.");
        sync.hidden = false;
      }
      render();
      check();
    } catch { /* silent — the owner confirms every request by hand anyway */ }
  };
  loadAvailability();


  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!check()) {
      if (!nights()) fail(t("errPickDates", {}, "Please choose your check-in and check-out dates."));
      return;
    }

    const btn = $("button[type=submit]", form);
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = t("sending", {}, "Sending…");

    const data = new FormData(form);
    data.append("nights", String(nights()));

    try {
      const res = CONFIG.formEndpoint
        ? await fetch(CONFIG.formEndpoint, {
            method: "POST", body: data, headers: { Accept: "application/json" },
          })
        : await fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(data).toString(),
          });

      if (!res.ok) throw new Error(res.status);
      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    } catch {
      btn.disabled = false;
      btn.textContent = label;
      fail(
        CONFIG.email
          ? t("errSendEmail", { email: CONFIG.email },
              `Something went wrong sending that. Please email ${CONFIG.email} instead.`)
          : t("errSend", {}, "Something went wrong sending that. Please try again in a moment.")
      );
    }
  });
})();

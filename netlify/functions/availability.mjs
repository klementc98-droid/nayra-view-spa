/**
 * Availability feed.
 *
 * Fetches the property's iCal calendar(s) server-side and returns the booked
 * date ranges as JSON, so the booking form can refuse dates that are already
 * taken on Booking.com.
 *
 * WHY THIS RUNS ON THE SERVER AND NOT IN THE BROWSER:
 *   1. ical.booking.com sends no CORS headers, so a browser fetch is blocked.
 *   2. The iCal URL contains a private token. In client-side JS it would be
 *      readable by anyone viewing source. It belongs in an env var.
 *
 * SETUP — set this environment variable in your Netlify dashboard
 * (Site configuration -> Environment variables):
 *
 *   ICAL_URLS = https://ical.booking.com/v1/export?t=XXXXXXXX
 *
 * Comma-separate to add more channels later:
 *   ICAL_URLS = https://ical.booking.com/...,https://www.airbnb.com/calendar/ical/...
 *
 * Where to find it on Booking.com:
 *   Extranet -> Rates & Availability -> Sync calendars -> Export calendar
 */

const TIMEOUT_MS = 8000;

/** iCal folds long lines by starting continuations with a space or tab. */
function unfold(text) {
  return text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

/** "20260810" or "20260810T140000Z" -> "2026-08-10" */
function toISO(raw) {
  const d = raw.trim().slice(0, 8);
  if (!/^\d{8}$/.test(d)) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function parseICal(text) {
  const out = [];
  const events = unfold(text).split(/BEGIN:VEVENT/).slice(1);

  for (const ev of events) {
    const body = ev.split(/END:VEVENT/)[0];
    const start = body.match(/^DTSTART[^:]*:(.+)$/m);
    const end = body.match(/^DTEND[^:]*:(.+)$/m);
    if (!start || !end) continue;

    const from = toISO(start[1]);
    const to = toISO(end[1]);
    if (!from || !to || to <= from) continue;

    /* DTEND is exclusive: it is the checkout day, which is bookable again.
       Keeping it exclusive means back-to-back stays are still allowed. */
    out.push({ from, to });
  }
  return out;
}

/** Merge overlapping/adjacent ranges so the client has less to check. */
function merge(ranges) {
  const sorted = [...ranges].sort((a, b) => a.from.localeCompare(b.from));
  const merged = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.from <= last.to) {
      if (r.to > last.to) last.to = r.to;
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

export default async () => {
  const urls = (process.env.ICAL_URLS || "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "content-type": "application/json",
        /* Booking.com refreshes its export every few hours, so polling it
           harder than this achieves nothing but rate limiting. */
        "cache-control": "public, max-age=900, stale-while-revalidate=3600",
      },
    });

  if (!urls.length) {
    return json({ configured: false, ranges: [], updated: null });
  }

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(url, { signal: ctl.signal });
        if (!res.ok) throw new Error(`${res.status} from calendar feed`);
        return parseICal(await res.text());
      } finally {
        clearTimeout(timer);
      }
    })
  );

  const ranges = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const failed = results.filter((r) => r.status === "rejected").length;

  /* If every feed failed, say so rather than reporting "everything is free" —
     an empty list would let the form accept dates that are actually booked. */
  if (failed === urls.length) {
    return json({ configured: true, ok: false, ranges: [], updated: null }, 502);
  }

  return json({
    configured: true,
    ok: true,
    partial: failed > 0,
    updated: new Date().toISOString(),
    ranges: merge(ranges),
  });
};

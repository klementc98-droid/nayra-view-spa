# Nayra — View & Spa

One-page site for the sea-view apartment in Kavala, Greece.
English, Greek and Bulgarian. Plain HTML, CSS and JavaScript — no npm, no
framework. A small Python build script generates the three language pages, and
one serverless function handles Booking.com calendar sync.

```
build.py                     generates the pages — run after editing text
templates/page.html          layout (edit for structure)
locale/en.json el.json bg.json   all site text (edit for wording)

index.html  el/index.html  bg/index.html   GENERATED — do not edit
sitemap.xml                                GENERATED

static/css/style.css
static/js/main.js            settings live in CONFIG at the top
netlify/functions/availability.mjs   pulls booked dates from Booking.com
netlify.toml                 Netlify build + redirect config
media/                       optimised photos + video
photos-inbox/                drop new originals here
favicon.svg  robots.txt
QUESTIONS-FOR-OWNER.md       what is still missing
```

---

## ⚠ Before this goes live

The site is built but **four things are still missing**, and it should not be
published until they're in. Each one is a visible hole:

| # | Missing | What's affected right now |
|---|---|---|
| 1 | **Which property this is** | The Booking.com paste carried three names — Nayra (title, matches the logo), *thygaterra* (URL slug), *Amphitrite* (description). Confirm the listing URL is Nayra's, since it's a live button. |
| 2 | **Contact details** | Footer reads "Contact details not yet added." |
| 3 | **Real domain** | `example.com` in `build.py` (`SITE`), `robots.txt` — social sharing and SEO break |
| 4 | **Guest review quotes** | The 10/10 score shows; individual quotes don't |

Amenities, address, landmarks and the rating all came from the property's own
Booking.com listing and are live on the site.

Nothing is faked or placeheld with invented text. Anything unknown either
hides itself or says plainly that it's missing.

---

## ⚠ Editing content — read this first

The site is in **three languages: English, Greek, Bulgarian.** The HTML files
are **generated**. Editing `index.html`, `el/index.html` or `bg/index.html`
directly is pointless — the next build overwrites them.

```
templates/page.html   layout and markup      ← edit for STRUCTURE
locale/en.json        English text
locale/el.json        Greek text             ← edit for WORDS
locale/bg.json        Bulgarian text
build.py              generates all 3 pages + sitemap.xml
```

**To change any wording:** edit the same key in all three locale files, then:

```bash
python build.py
```

That writes `index.html`, `el/index.html`, `bg/index.html` and `sitemap.xml`.
Netlify runs it automatically on deploy.

If a key is missing from any locale file, **the build fails and tells you
which one**. That's on purpose — the alternative is quietly shipping a Greek
page with one English sentence in the middle of it.

### ⚠ The translations need a native check

I wrote the Greek and Bulgarian myself. They're careful, but they are not a
professional translation.

- **Greek** — the hosts speak Greek, so ask them to read it.
- **Bulgarian** — **nobody on your side may be able to check this.** Get a
  Bulgarian speaker to read it before launch. It's ~130 short strings, about
  fifteen minutes' work. One awkward phrase on a booking page costs more than
  that.

An automated check confirms no mixed-script typos (Latin letters spliced into
Cyrillic or Greek words) — it caught one, which is fixed. That catches
mechanical errors, not clumsy phrasing.

---

## Step 1 — Contact details and the listing link

Open `static/js/main.js`. Everything editable is in the `CONFIG` block at the
very top:

```js
const CONFIG = {
  bookingUrl: "https://www.booking.com/hotel/gr/...",
  email:     "hello@nayra.gr",
  whatsapp:  "306912345678",   // digits only, country code, no + or spaces
  phone:     "+30 691 234 5678",
  instagram: "nayra.kavala",
  minNights: 2,
};
```

**Leave any value as `""` and that element hides itself** rather than showing a
dead link. Fill it in and it appears. That's the whole system — no other file
needs touching for contact info.

## Step 2 — Calendar sync with Booking.com

**You must do this on Netlify.** It needs a serverless function, so the
drag-and-drop deploy won't run it and GitHub Pages can't do it at all.

1. **Get the feed URL.** Booking.com Extranet →
   **Rates & Availability → Sync calendars → Export calendar**.
   Copy the `https://ical.booking.com/...` URL.

2. **Put it in an environment variable**, never in the code — the URL contains
   a private token, and anything in `main.js` is readable by any visitor.
   Netlify → **Site configuration → Environment variables**:

   ```
   ICAL_URLS = https://ical.booking.com/v1/export?t=YOUR-TOKEN
   ```

   Comma-separate to add more channels later.

3. **Deploy.** That's it. The form now greys out clashing dates and shows
   "Live availability from Booking.com".

### ⚠ What this does and does not do

**One-way only: Booking.com → your site.** A booking made on Booking.com stops
your site accepting those dates. A booking made on *your* site does **not**
appear on Booking.com.

**It is not instant.** Booking.com regenerates its export every few hours, and
the function caches for 15 minutes on top. There is a window — possibly hours —
where a fresh Booking.com reservation is not yet reflected here.

**So this reduces double-booking risk; it does not eliminate it.** That's
tolerable right now only because the direct form sends a *request* that you
confirm by hand — you're the final check. **The moment you switch on instant
payment (Step 3), this is no longer enough.**

For true two-way sync you need either:

- your site to publish its own iCal feed for Booking.com to import — which
  means storing bookings somewhere, so a database and real backend; or
- **a channel manager** (Smoobu / Lodgify / Hospitable), which does both
  directions properly and is the reason Step 3 recommends one.

If the feed is unreachable, the site fails *safe*: the check silently switches
off and the form behaves as it did before, rather than claiming every date is
free.

## Step 3 — Turn on real online booking

Right now the booking form sends a **dated request**: the guest picks dates and
submits, you confirm availability and send a payment link by hand. It works
today with no account and no monthly fee.

**To upgrade to instant booking**, sign up with a channel manager — Lodgify,
Smoobu or Hospitable — and paste its embed code into `bookingEmbed`:

```js
bookingEmbed: `<div id="lodgify-book-now-box"></div><script src="..."></script>`,
```

The moment that has a value, the live calendar **replaces the request form**
automatically. Nothing else to change.

> **Why a channel manager and not a custom Stripe form?**
> The apartment is already on Booking.com. A channel manager syncs both
> calendars **two-way** — which the iCal feed in Step 2 does not. Build it
> custom and you own that sync, and the failure mode is selling a weekend
> Booking.com already sold. The monthly fee buys exactly that guarantee.

### Where the request form sends to

| Host | What to do |
|---|---|
| **Netlify** | Nothing. Netlify Forms picks it up automatically — submissions appear under **Forms** in your dashboard. |
| **Vercel / GitHub Pages** | Netlify Forms won't work. Create a free [Formspree](https://formspree.io) form and put its URL in `formEndpoint`. |

The form already validates dates client-side: no past dates, check-out always
after check-in, and it enforces `minNights`.

## Step 4 — Set the real domain

Set it in **one place** — `SITE` at the top of `build.py`:

```python
SITE = "https://nayra-kavala.gr"
```

Then `python build.py`. That fixes the canonical links, all the hreflang
alternates, Open Graph, JSON-LD and `sitemap.xml` across all three languages.
Also update `robots.txt` by hand — it isn't generated.

The Open Graph tags are what make the link show a photo when it's shared on
WhatsApp — with `example.com` in there, shared links show nothing.

## Step 5 — Add real reviews

In `index.html`, find the `REVIEWS` section. Copy the commented `<figure>`
once per review, fill in the quote, the guest's first name and the month/year,
then delete the `.rev__empty` block above it.

**Use real Booking.com reviews only.** No placeholder quotes are included on purpose.

---

## Photos

Current gallery: **14 photos** — the apartment (marble floors, green kitchen,
sea-view balcony) and the spa room (jacuzzi + sauna).

### Adding or swapping photos

1. Drop originals into `photos-inbox/` — any filename, **JPG not HEIC**.
2. Re-run the resizer:

```bash
python prep_images.py
```

It writes two sizes of each into `media/`: a full version (1800px, for the
lightbox) and a `-thumb` (900px, for the grid).

3. Add a `<button class="gal__i">` block in `index.html`, copying an existing
   one. **Set `width` and `height` on every `<img>`** — that's what stops the
   page jumping around while images load.
4. **Write real alt text.** Describe what's actually in the frame. Every image
   on the site has proper alt text; keep it that way.

### Photos that would improve this a lot

Currently missing entirely:

- **The building from outside** — there isn't a single exterior shot
- **Kavala itself** — old town, castle, aqueduct, harbour, beach. The "Around"
  section is built from Booking.com's distances, but has no photography
- **The spa lit at night** — it's the best asset and every shot is flat daylight
- **Sunset from the balcony** — would make a far stronger hero

Also: 9 of the photos are professional, the rest are phone snaps. If the
photographer's full set exists, it's worth getting.

### Video

Two of the seven supplied clips are used, in the spa section: the jacuzzi with
the sauna beside it, and water poured over the sauna stones.

**They are portrait, 320×568.** This trips people up: the files store the frame
as 568×320 with a 90° rotation flag, so `ffprobe` reports them as *landscape*.
They aren't. Anything that trusts the reported dimensions will put a tall video
in a wide box and crop most of it away.

That resolution is the constraint that shaped everything else. The panels are
capped at 320px wide and sit three-across in the spa section, so the footage is
never scaled beyond its native size. A full-bleed desktop hero is off the table
— portrait footage in a 16:9 hero means discarding roughly two-thirds of the
frame *and* upscaling the rest.

Encoding: audio stripped, re-encoded h264 CRF 27, `+faststart`.
**8.1 MB → 644 KB.** WebM was also generated and then dropped — VP9 came out
*larger* than h264 at this resolution, so it was pure overhead.

Behaviour: `preload="none"`, so none of that 644 KB downloads unless someone
plays a clip. On screens ≥760px, with motion allowed and no data-saver, clips
autoplay silently when scrolled into view and pause when they leave. On phones,
with `prefers-reduced-motion`, or with data-saver on, they stay tap-to-play.

To re-encode after adding clips (needs ffmpeg — `winget install Gyan.FFmpeg`):

```bash
ffmpeg -i input.mp4 -an -c:v libx264 -crf 27 -preset slow \
       -pix_fmt yuv420p -movflags +faststart media/name.mp4
ffmpeg -ss 4 -i input.mp4 -frames:v 1 -q:v 4 media/name-poster.jpg
```

**A poster frame is not optional.** Without one the panel renders as a black
box until data arrives.

The other four clips are unused — say if you want them looked at.

---

## Deploying

Zero config on any of these — there's no build step.

**Netlify** — drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
Best choice, because the booking form then works with no extra setup.

**Vercel** — `vercel` in this folder, or connect the repo. Set `formEndpoint` first.

**GitHub Pages** — push, then Settings → Pages → deploy from branch root.
Set `formEndpoint` first.

Worth running `git init` — both Netlify and Vercel redeploy automatically on
push, which is much easier than re-dragging the folder every time.

---

## Design notes

The palette is sampled from the actual photographs, not chosen from a template:

| | Hex | Where it's from |
|---|---|---|
| Ground | `#D4D3CE` | the logo's background |
| Ink | `#1B1B19` | the logo wordmark |
| Petrol | `#1F292A` | kitchen cabinetry in shadow — used for the spa section and footer |
| Teal | `#3F4E4D` | the same cabinetry in daylight — booking section and accents |
| Sea | `#7F90A5` | the bay |
| Stone | `#9D978E` | spa-room microcement |

Type is **Playfair Display** (a high-contrast Didone, chosen to sit with the
existing logo) over **Inter**.

Built in: responsive from 320px up, visible keyboard focus states, full
keyboard support in the lightbox (arrows, Escape, focus trap), swipe on mobile,
`prefers-reduced-motion` respected throughout, lazy-loaded images with explicit
dimensions so nothing shifts as the page loads, and schema.org `LodgingBusiness`
structured data containing only confirmed facts.

---

## Sending someone a preview

```bash
python pack_preview.py
```

Writes three **self-contained** files into `preview/`:

```
preview/nayra-preview-en.html    6.8 MB
preview/nayra-preview-el.html    6.8 MB
preview/nayra-preview-bg.html    6.8 MB
```

Each is the entire site in one file — CSS, JavaScript, all 33 images and both
videos embedded as data URIs. No server, no folder of assets. The recipient
double-clicks it and it opens.

**Send all three together** if you want the language switcher to work; they
link to each other by filename. Any one of them works alone otherwise.

### What is different in a preview file

- A bar along the bottom says it is a preview. It can be dismissed.
- **The booking form does not send.** There is no server behind a local file,
  so submitting says so plainly instead of failing with an error.
- **Live availability is off** — that needs the serverless function, so no
  dates are greyed out. The calendar itself works normally.
- The lightbox uses the 900px images rather than the 1800px ones. That roughly
  halves the file and is indistinguishable at preview sizes.
- **Fonts need internet.** Playfair Display and Inter still load from Google,
  because font files cannot be embedded the way images can. Offline, the page
  falls back to Georgia and looks noticeably different — worth knowing before
  someone opens it on a plane.

Rerun `pack_preview.py` after any change; the files are snapshots, not live.

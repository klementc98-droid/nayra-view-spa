# Nayra — what's still needed

Everything below ends up as visible text, a live link, or structured data
Google reads. Nothing on this site is invented: anything unknown either hides
itself or says plainly that it's missing.

**Already answered and live on the site:** address, full amenity list, no
parking, pets on request, free Wi-Fi, washing machine, sofa bed, non-smoking,
Greek + English spoken, the 10/10 rating from 11 guests, real landmark
distances, and that the island across the water is **Thassos**.

---

## 1. ⚠ BLOCKING — three names, which property is this?

The Booking.com paste carried three different property names:

| Where it appeared | Name |
|---|---|
| Listing title | **Nayra** View & Spa — matches the logo |
| URL slug | **thygaterra**-view-amp-spa |
| Description text | **Amphitrite** View & Spa |

The site is built as **Nayra** because the title and the logo agree. But that
means the description probably belongs to a *different unit* — which fits the
three visibly different interiors in the photos.

- [ ] **Is `thygaterra-view-amp-spa` actually Nayra's listing?** It is the live
      "Book on Booking.com" button. If it points at a sibling property, guests
      book the wrong apartment.

**Not used, because it came from the "Amphitrite" text** — confirm whether any
of it applies to Nayra:

- [ ] 115 m² floor area
- [ ] Two bedrooms, one sea-facing and one mountain-facing
- [ ] 65" TV

If it doesn't apply, I need Nayra's own size, bedroom count and max guests.

## 2. Contact details

The footer currently reads "Contact details not yet added." Any value left
blank simply hides itself — no dead links.

- [ ] Email
- [ ] WhatsApp number (with country code)
- [ ] Phone
- [ ] Instagram handle
- [ ] Preferred contact method for guests

## 3. Domain

- [ ] Registered already, or does one need buying?

`example.com` is in `build.py` (`SITE`) and `robots.txt`. Until it's real,
links shared on WhatsApp show no preview image.

## 4. Reviews

The panel shows five stars, 10/10, "11 verified guest reviews" and a Location
bar — all real. Booking also scores these categories, and only Location was
supplied, so the rest are deliberately absent rather than estimated:

- [ ] Cleanliness   - [ ] Comfort   - [ ] Facilities
- [ ] Staff         - [ ] Value     - [ ] Free WiFi

Each is one line to add, and six bars reads as a real trust signal where one
looks like an afterthought.

- [ ] **3–5 real review quotes** — text, guest first name, month/year.

## 5. Map — check the pin

The map loads only when a visitor presses "Show map", so no Google cookies are
set on arrival. That matters for an EU property.

- [ ] Search `7is Merarchias 129, Kavala 65403, Greece` on maps.google.com —
      **does the pin land on the right building?** If not, send the correct pin
      or coordinates; it's `mapQuery` in `static/js/main.js`.
- [ ] Happy for the exact address to be public? It already is on Booking.com,
      so this is consistent — say if you'd rather show the neighbourhood only.

## 6. Bulgarian translation

- [ ] **Get a Bulgarian speaker to read `locale/bg.json`.** I wrote it; nobody
      on your side may be able to check it. ~130 short strings, fifteen minutes.
      Greek can be checked by the hosts.

## 7. The spa

The best thing on the property, and the listing undersells it — the sauna
wasn't mentioned in the original brief at all.

- [ ] Included in the nightly rate, or charged separately?
- [ ] Any time limits or booking slots?
- [ ] House rules — max occupancy, alcohol, children?
- [ ] Available year-round?

## 8. Money and rules

- [ ] Show a nightly price, or not? If yes — what, and does it change by season?
- [ ] Minimum stay (currently set to 1 night in `CONFIG.minNights`)
- [ ] Check-in / check-out times. Self check-in, or met in person?
- [ ] Cleaning fee, deposit, city tax
- [ ] Cancellation policy
- [ ] **Does the direct price undercut Booking.com, and by how much?** This is
      the only real reason a guest books direct instead of through the platform.

## 9. Better local recommendations

The "Coffee" column is Booking's auto-generated list — Coffee Island is a
chain. Nobody picks a holiday apartment because of a chain coffee shop.

- [ ] **Two or three tavernas or restaurants the owner actually recommends.**
- [ ] A reason attached to a beach or two ("Kalamitsa for swimming, Batis for
      lunch") — worth more than five names with distances.

## 10. Photography and video

Currently missing entirely:

- [ ] **The building from outside** — not one exterior shot
- [ ] **Kavala itself** — old town, castle, aqueduct, harbour, beach
- [ ] **The spa lit at night** — best asset, every shot is flat daylight
- [ ] **Sunset from the balcony** — would make a far stronger hero
- [ ] **The photographer's full set**, if it exists. Nine professional images is
      an unusually small delivery; the rest are phone snaps.
- [ ] **The original video files.** The clips supplied are 320×568 — heavily
      compressed copies. The phone originals are almost certainly 1080×1920,
      nine times the pixels, which would allow a full-screen mobile hero loop.
- [ ] A vector version of the logo (SVG/AI/PDF) if one exists.

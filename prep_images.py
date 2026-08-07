"""Resize + compress the confirmed photo set into media/."""
from PIL import Image, ImageOps
from pathlib import Path

SRC = Path(r"C:\Users\Welcome\Desktop\Airbnb tzon")
OUT = Path(r"c:\Users\Welcome\Documents\GitHub\villa-site\media")
OUT.mkdir(parents=True, exist_ok=True)

# source stem -> output slug
MAP = {
    "1000006110": "bedroom-sea-view",
    "1000006121": "balcony-panorama",
    "1000006107": "living-room-balcony-door",
    "1000006109": "living-room-wide",
    "1000006112": "living-room-kitchen",
    "1000006122": "living-room-sofa",
    "1000006108": "kitchen-island",
    "1000006111": "kitchen-detail",
    "1000006113": "kitchen-sea-window",
    "1000006124": "spa-jacuzzi-open-door",
    "1000006119": "spa-jacuzzi-window",
    "1000006123": "spa-jacuzzi-bay",
    "1000006125": "spa-sauna",
    "1000006117": "spa-room",
}

FULL_W, THUMB_W = 1800, 900


def save(im, path, q):
    im.save(path, "JPEG", quality=q, optimize=True, progressive=True)
    return path.stat().st_size // 1024


def fit(im, w):
    if im.width <= w:
        return im.copy()
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


total = 0
for stem, slug in MAP.items():
    src = SRC / f"{stem}.jpg"
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    total += save(fit(im, FULL_W), OUT / f"{slug}.jpg", 82)
    total += save(fit(im, THUMB_W), OUT / f"{slug}-thumb.jpg", 78)
    print(f"{slug:<26} {im.width}x{im.height}")

# Hero: widest available landscape, full quality
hero = ImageOps.exif_transpose(Image.open(SRC / "1000006110.jpg")).convert("RGB")
total += save(fit(hero, 2048), OUT / "hero.jpg", 84)

# Open Graph card: 1200x630 centre crop of the hero
og = ImageOps.fit(hero, (1200, 630), Image.LANCZOS, centering=(0.5, 0.45))
total += save(og, OUT / "og-cover.jpg", 85)

# Logo, trimmed of its flat background margin
logo = Image.open(SRC / "1000006106.jpg").convert("RGB")
total += save(fit(logo.crop((150, 330, 900, 700)), 900), OUT / "logo.jpg", 88)

print(f"\n{len(list(OUT.glob('*.jpg')))} files, {total/1024:.1f} MB total")

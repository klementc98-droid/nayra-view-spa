"""Build the site in every language.

    python build.py

Reads  templates/page.html  +  locale/{en,el,bg}.json
Writes index.html (English), el/index.html, bg/index.html, sitemap.xml

Edit CONTENT in the locale files, never in the generated HTML — the generated
files are overwritten on every build. Edit LAYOUT in templates/page.html.

Every {{placeholder}} in the template must exist in every locale file, or the
build fails. That is deliberate: a missing key would otherwise ship a page with
one stray English sentence in it.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).parent
SITE = "https://example.com"          # TODO: real domain before launch
DEFAULT = "en"

LANGS = {
    "en": {"dir": "",   "label": "EN", "name": "English",   "ogLocale": "en_GB"},
    "el": {"dir": "el", "label": "ΕΛ", "name": "Ελληνικά",  "ogLocale": "el_GR"},
    "bg": {"dir": "bg", "label": "БГ", "name": "Български", "ogLocale": "bg_BG"},
}

# Placeholders the build fills in itself rather than the locale files.
BUILTIN = {"lang", "oglocale", "siteurl", "alternates", "langswitch", "i18njs"}


def url_for(code):
    d = LANGS[code]["dir"]
    return f"{SITE}/" + (f"{d}/" if d else "")


def alternates(code):
    lines = [f'<link rel="canonical" href="{url_for(code)}">']
    for c in LANGS:
        lines.append(f'<link rel="alternate" hreflang="{c}" href="{url_for(c)}">')
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{url_for(DEFAULT)}">')
    return "\n".join(lines)


def langswitch(code):
    out = ['    <div class="langs" role="group" aria-label="Language">']
    for c, meta in LANGS.items():
        href = "/" + (f'{meta["dir"]}/' if meta["dir"] else "")
        cur = ' aria-current="true"' if c == code else ""
        out.append(
            f'      <a href="{href}" hreflang="{c}" lang="{c}" '
            f'title="{meta["name"]}"{cur}>{meta["label"]}</a>'
        )
    out.append("    </div>")
    return "\n".join(out)


def main():
    tpl = (ROOT / "templates" / "page.html").read_text(encoding="utf-8")
    keys = set(re.findall(r"\{\{(\w+)\}\}", tpl)) - BUILTIN

    strings = {}
    for code in LANGS:
        data = json.loads((ROOT / "locale" / f"{code}.json").read_text(encoding="utf-8"))
        missing = sorted(keys - data.keys())
        if missing:
            sys.exit(f"BUILD FAILED — locale/{code}.json is missing: {missing}")
        strings[code] = data

    for code, meta in LANGS.items():
        page = tpl
        s = strings[code]

        # Runtime strings for main.js (form errors, availability banner).
        js = {k[3:]: v for k, v in s.items() if k.startswith("js_")}
        page = page.replace("{{i18njs}}",
                            "<script>window.I18N=" + json.dumps(js, ensure_ascii=False) + ";</script>")
        page = page.replace("{{lang}}", code)
        page = page.replace("{{oglocale}}", meta["ogLocale"])
        page = page.replace("{{siteurl}}", url_for(code))
        page = page.replace("{{alternates}}", alternates(code))
        page = page.replace("{{langswitch}}", langswitch(code))
        for k, v in s.items():
            page = page.replace("{{%s}}" % k, v)

        left = re.findall(r"\{\{(\w+)\}\}", page)
        if left:
            sys.exit(f"BUILD FAILED — unfilled placeholders in {code}: {sorted(set(left))}")

        out = ROOT / meta["dir"] / "index.html" if meta["dir"] else ROOT / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
        print(f"  {out.relative_to(ROOT).as_posix():<16} {len(page)//1024} KB  ({code})")

    sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
               '        xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for code in LANGS:
        sitemap.append("  <url>")
        sitemap.append(f"    <loc>{url_for(code)}</loc>")
        for c in LANGS:
            sitemap.append(f'    <xhtml:link rel="alternate" hreflang="{c}" href="{url_for(c)}"/>')
        sitemap.append("    <changefreq>monthly</changefreq>")
        sitemap.append(f"    <priority>{'1.0' if code == DEFAULT else '0.9'}</priority>")
        sitemap.append("  </url>")
    sitemap.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(sitemap) + "\n", encoding="utf-8")
    print("  sitemap.xml      3 URLs")


if __name__ == "__main__":
    print(f"Building {len(LANGS)} languages...")
    main()
    print("Done.")

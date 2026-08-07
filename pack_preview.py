"""Bundle the site into one self-contained .html per language.

Everything except the web fonts is embedded as a data: URI, so the file works
by double-clicking with no server and no folder of assets beside it.
"""
import base64, mimetypes, re, os
from pathlib import Path

ROOT = Path(r"c:\Users\Welcome\Documents\GitHub\villa-site")
OUT = ROOT / "preview"
OUT.mkdir(exist_ok=True)

PAGES = {"en": "index.html", "el": "el/index.html", "bg": "bg/index.html"}

NOTE = {
 "en": ("Preview", "Design preview. Booking requests are not sent and live availability is off."),
 "el": ("Προεπισκόπηση", "Προεπισκόπηση σχεδίασης. Τα αιτήματα κράτησης δεν αποστέλλονται."),
 "bg": ("Преглед", "Преглед на дизайна. Заявките за резервация не се изпращат."),
}

cache = {}
def data_uri(rel):
    """/media/x.jpg -> data:image/jpeg;base64,..."""
    if rel in cache:
        return cache[rel]
    p = ROOT / rel.lstrip("/").replace("../", "")
    if not p.exists():
        return None
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    uri = "data:%s;base64,%s" % (mime, base64.b64encode(p.read_bytes()).decode())
    cache[rel] = uri
    return uri

css = (ROOT / "static/css/style.css").read_text(encoding="utf-8")
js  = (ROOT / "static/js/main.js").read_text(encoding="utf-8")
favicon = data_uri("/favicon.svg")

for lang, page in PAGES.items():
    h = (ROOT / page).read_text(encoding="utf-8")

    # lightbox opens the 1800px original; the 900px version is ample for a
    # preview and roughly halves the finished file
    h = re.sub(r'data-full="((?:\.\./)?media/)([^"]+?)\.jpg"',
               lambda m: 'data-full="%s%s-thumb.jpg"' % (m.group(1), m.group(2)), h)

    # preload/apple-touch just point at bytes we are about to inline
    h = re.sub(r'\s*<link rel="preload" as="image"[^>]*>', "", h)
    h = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', "", h)

    # Matched by regex rather than exact string: build.py emits a relative
    # prefix that differs per language ("" at the root, "../" under el/ and bg/).
    h, n1 = re.subn(r'<link rel="stylesheet" href="[^"]*style\.css">',
                    lambda _: "<style>\n" + css + "\n</style>", h)
    h, n2 = re.subn(r'<script src="[^"]*main\.js" defer></script>',
                    lambda _: "<script>\n" + js + "\n</script>", h)
    h, n3 = re.subn(r'<link rel="icon" href="[^"]*favicon\.svg"',
                    lambda _: '<link rel="icon" href="%s"' % favicon, h)
    assert n1 == n2 == n3 == 1, "inline failed: css=%s js=%s icon=%s" % (n1, n2, n3)

    # every remaining local asset
    missing = []
    def sub(m):
        attr, path = m.group(1), m.group(2)
        u = data_uri(path)
        if not u:
            missing.append(path)
            return m.group(0)
        return '%s="%s"' % (attr, u)
    h = re.sub(r'(src|poster|data-full)="((?:\.\./)?media/[^"]+)"', sub, h)

    # the switcher points at /el/ and /bg/, which mean nothing beside a loose
    # file — repoint at the sibling previews so all three work in one folder
    for href, fname in (('href="./"', "nayra-preview-en.html"),
                        ('href="../"', "nayra-preview-en.html"),
                        ('href="el/"', "nayra-preview-el.html"),
                        ('href="../el/"', "nayra-preview-el.html"),
                        ('href="bg/"', "nayra-preview-bg.html"),
                        ('href="../bg/"', "nayra-preview-bg.html")):
        h = h.replace(href + ' hreflang', 'href="%s" hreflang' % fname)

    title, body = NOTE[lang]
    banner = """
<div id="previewBar" style="position:fixed;left:0;right:0;bottom:0;z-index:9999;
 background:#1F292A;color:#D4D3CE;font:13px/1.5 system-ui,sans-serif;
 padding:10px 46px 10px 16px;text-align:center">
 <strong style="letter-spacing:.14em;text-transform:uppercase;font-size:11px">__T__</strong>
 &nbsp;__B__
 <button onclick="document.getElementById('previewBar').remove()"
  style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;
  border:0;color:inherit;font-size:20px;cursor:pointer;line-height:1" aria-label="Close">&times;</button>
</div>
<script>
/* Preview only: no server, so the form must not fire a request that will fail
   and surface a scary error. Say plainly that it is inert. */
document.addEventListener("submit", function (e) {
  e.preventDefault(); e.stopImmediatePropagation();
  var err = document.getElementById("berr");
  if (err) { err.textContent = "__B__"; err.hidden = false; }
}, true);
</script>
""".replace("__T__", title).replace("__B__", body)
    h = h.replace("</body>", banner + "</body>", 1)

    dest = OUT / ("nayra-preview-%s.html" % lang)
    dest.write_text(h, encoding="utf-8")
    left = re.findall(r'(?:src|href|poster|data-full)="((?:\.\./)?(?:media|static)/[^"]*)"', h)
    print("%-28s %6.2f MB   unresolved=%s  missing=%s"
          % (dest.name, dest.stat().st_size / 1024 / 1024, left or "none", missing or "none"))

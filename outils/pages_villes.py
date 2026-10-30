#!/usr/bin/env python3
"""Pages Google « Les lieux à découvrir à <commune> » pour toutes les communes de France (5 lieux ou plus).

Usage : python3 outils/pages_villes.py            (lit data/fr/, écrit ville/, sitemap.xml et robots.txt)

Chaque page est légère et sans JavaScript : titre, liste des lieux par type, bouton « Jouer à <commune> »
qui ouvre l'appli directement sur la commune (/?ville=fr<INSEE>), et liens vers les communes voisines.
"""
import html, json, math, os, re, shutil, unicodedata
from collections import Counter, defaultdict

SITE = 'https://monuverse.fr'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data', 'fr')
OUT = os.path.join(ROOT, 'ville')
MIN_LIEUX = 5
MAX_LISTE = 40

LABEL = {
    'mairie': ('Mairie', 'mairies'), 'cathedrale': ('Cathédrale', 'cathédrales'), 'culte': ('Lieu de culte', 'lieux de culte'),
    'fontaine': ('Fontaine', 'fontaines'), 'statue': ('Statue', 'statues'), 'oeuvre': ("Œuvre d'art", "œuvres d'art"),
    'fresque': ('Fresque', 'fresques'), 'aux_morts': ('Monument aux morts', 'monuments aux morts'), 'memorial': ('Mémorial', 'mémoriaux'),
    'plaque': ('Plaque commémorative', 'plaques commémoratives'), 'monument': ('Monument', 'monuments'), 'musee': ('Musée', 'musées'),
    'chateau': ('Château', 'châteaux'), 'ruines': ('Vestiges', 'vestiges'), 'porte': ('Porte de ville', 'portes de ville'),
    'croix': ('Calvaire', 'calvaires'), 'phare': ('Phare', 'phares'), 'moulin': ('Moulin', 'moulins'),
    'chateau_eau': ("Château d'eau", "châteaux d'eau"), 'belvedere': ('Point de vue', 'points de vue'), 'attraction': ('Site à voir', 'sites à voir'),
    'parc': ('Parc', 'parcs'), 'patrimoine': ('Patrimoine', 'lieux de patrimoine'), 'bibliotheque': ('Bibliothèque', 'bibliothèques'),
    'culture': ('Lieu de culture', 'lieux de culture'), 'gare': ('Gare', 'gares'), 'marche': ('Marché', 'marchés'), 'kiosque': ('Kiosque', 'kiosques'),
    'horloge': ('Horloge', 'horloges'), 'jeux': ('Aire de jeux', 'aires de jeux'), 'sport': ('Équipement sportif', 'équipements sportifs'),
    'salle': ('Lieu de vie', 'lieux de vie'),
}
RAR = {'commune': 0, 'rare': 1, 'epique': 2, 'legendaire': 3}
RAR_TXT = {'rare': 'Rare', 'epique': 'Épique', 'legendaire': 'Légendaire'}
e = lambda t: html.escape(str(t), quote=True)


def slug(t):
    t = unicodedata.normalize('NFD', t.lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn').replace('œ', 'oe').replace('æ', 'ae')
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def dist(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[2], a[3], b[2], b[3]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def de(nom):
    """« de Paris », « d'Orléans », « du Havre », « des Mureaux », « de La Rochelle »"""
    if re.match(r'Le ', nom): return 'du ' + nom[3:]
    if re.match(r'Les ', nom): return 'des ' + nom[4:]
    if re.match(r"[AEIOUYÀÂÉÈÊÎÏÔÛHaeiouyh]", nom): return "d'" + nom
    return 'de ' + nom


def a(nom):
    """« à Paris », « au Havre », « aux Mureaux »"""
    if re.match(r'Le ', nom): return 'au ' + nom[3:]
    if re.match(r'Les ', nom): return 'aux ' + nom[4:]
    return 'à ' + nom


def nb(n, k):
    s, p = LABEL[k]
    return f"{n} {p if n > 1 else s.lower()}"


HEAD = """<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}">
<meta property="og:image" content="{site}/icons/icon-512.png"><meta property="og:type" content="website"><meta property="og:locale" content="fr_FR">
<link rel="icon" href="/icons/icon-192.png"><link rel="stylesheet" href="/ville/ville.css">
{extra}</head><body>
<header><a class="home" href="/"><img src="/icons/icon-192.png" width="36" height="36" alt="">Monuverse</a></header>
<main>
"""
FOOT = """</main>
<footer><p>Lieux © contributeurs <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap</a> (ODbL). Il manque un lieu ? Ajoute-le sur OpenStreetMap : il arrivera dans Monuverse.</p>
<p>© 2026 Monuverse · <a href="/">Jouer</a> · <a href="/ville/">Toutes les communes</a></p></footer>
</body></html>
"""

CSS = """:root{--bg:#070C1A;--panel:#10192D;--line:#22304F;--ink:#EEF2FA;--muted:#8F9CB7;--gold:#F5B841;--sea:#4FE0CF}
@media (prefers-color-scheme:light){:root{--bg:#F3F5FA;--panel:#fff;--line:#D8DFEB;--ink:#0E1628;--muted:#56647E;--gold:#B87A12;--sea:#0E8F82}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header,main,footer{max-width:760px;margin:0 auto;padding:0 16px}header{padding-top:14px}
.home{display:inline-flex;gap:10px;align-items:center;color:var(--ink);text-decoration:none;font-weight:800;font-size:18px}.home img{border-radius:9px}
h1{font-size:clamp(26px,6vw,36px);line-height:1.15;margin:22px 0 8px}h2{font-size:18px;margin:28px 0 10px}
.sub{color:var(--muted);margin:0 0 18px}a{color:var(--sea)}
.cta{display:block;text-align:center;background:var(--gold);color:#1b1305;font-weight:800;text-decoration:none;border-radius:14px;padding:15px;margin:18px 0 8px;font-size:17px}
.note{color:var(--muted);font-size:14px;margin:0}
.types{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0;list-style:none}.types li{background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:14px}
.places{list-style:none;padding:0;margin:0;display:grid;gap:8px}.places li{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px;display:flex;justify-content:space-between;gap:10px}
.places small{color:var(--muted);white-space:nowrap}.places .r{color:var(--gold)}
.near{columns:2;padding-left:18px}.near li{margin:3px 0}
.deps{columns:2;padding-left:18px}@media (min-width:640px){.deps,.near{columns:3}}
footer{color:var(--muted);font-size:13px;margin-top:36px;padding-bottom:30px;border-top:1px solid var(--line)}
"""


def main():
    j = json.load(open(os.path.join(DATA, 'communes.json'), encoding='utf8'))
    deps = j['deps']
    rows = [r for r in j['communes'] if r[6] >= MIN_LIEUX and r[4] in deps]
    path = {r[0]: f"{slug(r[1])}-{r[0].lower()}" for r in rows}
    by_dep = defaultdict(list)
    for r in rows: by_dep[r[4]].append(r)

    if os.path.isdir(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)
    with open(os.path.join(OUT, 'ville.css'), 'w', encoding='utf8') as f: f.write(CSS)

    urls, total = [], 0
    for r in rows:
        insee, nom, dep = r[0], r[1], r[4]
        try:
            places = json.load(open(os.path.join(DATA, insee + '.json'), encoding='utf8'))['places']
        except (OSError, ValueError):
            continue
        places = [p for p in places if p.get('k') in LABEL and p.get('n')]
        if len(places) < MIN_LIEUX: continue
        n = len(places)
        cnt = Counter(p['k'] for p in places)
        top = sorted(places, key=lambda p: (-RAR.get(p['r'], 0), not p.get('named'), p['n']))
        VEDETTE = ['cathedrale', 'chateau', 'musee', 'monument', 'culte', 'porte', 'phare', 'ruines', 'fontaine', 'statue', 'parc', 'mairie']
        star = [p['n'] for p in sorted((p for p in places if p.get('named') and p['k'] in VEDETTE), key=lambda p: (VEDETTE.index(p['k']), -RAR.get(p['r'], 0)))][:3]
        nn = f"plus de {n}" if n >= 600 else str(n)
        url = f"{SITE}/ville/{path[insee]}/"
        depnom = deps[dep]
        title = f"{nom} ({dep}) : {nn} monuments et lieux à découvrir | Monuverse"
        desc = (', '.join(star) + ' : d' if star else 'D') + f"écouvre les {nn} lieux {de(nom)} et collectionne-les en t'y rendant. Monuverse, le jeu gratuit pour explorer ta ville."
        ld = {'@context': 'https://schema.org', '@type': 'ItemList', 'name': f"Lieux à découvrir {a(nom)}",
              'numberOfItems': n, 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': p['n']} for i, p in enumerate(top[:MAX_LISTE])]}
        extra = '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') + '</script>\n'
        voisins = sorted((v for v in by_dep[dep] if v[0] != insee), key=lambda v: dist(r, v))[:8]
        body = [f"<h1>{'Plus de ' + str(n) if n >= 600 else 'Les ' + str(n)} lieux à découvrir {e(a(nom))}</h1>",
                f'<p class="sub">{e(depnom)} ({e(dep)}) · Statues, fontaines, églises, monuments : Monuverse a trouvé {nn} lieux à collectionner {e(a(nom))}. Approche-toi de chacun pour débloquer sa carte.</p>',
                f'<a class="cta" href="/?ville=fr{e(insee)}">Jouer {e(a(nom))}</a>',
                '<p class="note">Gratuit, sans inscription, directement dans le navigateur de ton téléphone.</p>',
                '<h2>Par type</h2><ul class="types">' + ''.join(f"<li>{e(nb(c, k))}</li>" for k, c in cnt.most_common()) + '</ul>',
                f"<h2>Les lieux {e(de(nom))}</h2><ul class=\"places\">"
                + ''.join(f"<li><span>{e(p['n'])}</span><small>{e(LABEL[p['k']][0])}{' · <span class=r>' + RAR_TXT[p['r']] + '</span>' if p['r'] in RAR_TXT else ''}</small></li>" for p in top[:MAX_LISTE])
                + '</ul>' + (f'<p class="note">… et {n - MAX_LISTE} autres lieux à découvrir dans l\'appli.</p>' if n > MAX_LISTE else ''),
                f'<a class="cta" href="/?ville=fr{e(insee)}">Collectionner les lieux {e(de(nom))}</a>']
        if voisins:
            body.append('<h2>Communes voisines</h2><ul class="near">' + ''.join(f'<li><a href="/ville/{path[v[0]]}/">{e(v[1])}</a></li>' for v in voisins) + '</ul>')
        body.append(f'<p><a href="/ville/d-{dep.lower()}/">Toutes les communes : {e(depnom)}</a></p>')
        d = os.path.join(OUT, path[insee]); os.makedirs(d)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf8') as f:
            f.write(HEAD.format(title=e(title), desc=e(desc), url=e(url), site=SITE, extra=extra) + '\n'.join(body) + '\n' + FOOT)
        urls.append(url); total += 1

    # pages des départements, puis l'index
    for dep, lst in by_dep.items():
        lst = sorted(lst, key=lambda r: r[1])
        url = f"{SITE}/ville/d-{dep.lower()}/"
        body = [f"<h1>Monuments et lieux à découvrir : {e(deps[dep])} ({e(dep)})</h1>",
                f'<p class="sub">{len(lst)} communes {e(deps[dep])} à explorer avec Monuverse.</p>',
                '<ul class="deps">' + ''.join(f'<li><a href="/ville/{path[r[0]]}/">{e(r[1])}</a> <small>({r[6]})</small></li>' for r in lst) + '</ul>']
        d = os.path.join(OUT, f"d-{dep.lower()}"); os.makedirs(d)
        with open(os.path.join(d, 'index.html'), 'w', encoding='utf8') as f:
            f.write(HEAD.format(title=e(f"{deps[dep]} ({dep}) : les communes à explorer | Monuverse"), desc=e(f"Monuments, statues, fontaines et églises de {len(lst)} communes : {deps[dep]}. Collectionne-les avec Monuverse."), url=e(url), site=SITE, extra='') + '\n'.join(body) + '\n' + FOOT)
        urls.append(url)
    order = sorted(by_dep, key=lambda k: (len(k.lstrip('0')) > 2, k))
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf8') as f:
        f.write(HEAD.format(title='Toutes les communes de France à explorer | Monuverse', desc=e("Les monuments, statues, fontaines et églises de chaque commune de France et d'outre-mer, à collectionner avec Monuverse."), url=f"{SITE}/ville/", site=SITE, extra='')
                + '<h1>Explore les monuments de chaque commune</h1><p class="sub">Choisis un département.</p><ul class="deps">'
                + ''.join(f'<li><a href="/ville/d-{k.lower()}/">{e(deps[k])} ({e(k)})</a></li>' for k in order) + '</ul>\n' + FOOT)
    urls = [f"{SITE}/", f"{SITE}/ville/"] + urls

    # plan du site (50 000 adresses maximum par fichier) et robots.txt
    for fn in os.listdir(ROOT):
        if re.fullmatch(r'sitemap(-\d+)?\.xml', fn): os.remove(os.path.join(ROOT, fn))
    parts = [urls[i:i + 45000] for i in range(0, len(urls), 45000)]
    for i, part in enumerate(parts, 1):
        with open(os.path.join(ROOT, f'sitemap-{i}.xml'), 'w', encoding='utf8') as f:
            f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                    + ''.join(f'<url><loc>{e(u)}</loc></url>\n' for u in part) + '</urlset>\n')
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                + ''.join(f'<sitemap><loc>{SITE}/sitemap-{i}.xml</loc></sitemap>\n' for i in range(1, len(parts) + 1)) + '</sitemapindex>\n')
    with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf8') as f:
        f.write(f"User-agent: *\nAllow: /\nDisallow: /data/\nDisallow: /outils/\n\nSitemap: {SITE}/sitemap.xml\n")
    print(f'{total} pages de communes, {len(by_dep)} départements, {len(urls)} adresses dans le plan du site')


if __name__ == '__main__':
    main()

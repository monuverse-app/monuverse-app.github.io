#!/usr/bin/env python3
"""Construit data/<pays>/ pour un pays : l'index des communes et un fichier de lieux par commune.

Usage : construire_pays.py FICHIER.osm.pbf CODE_PAYS NIVEAU_COMMUNE DOSSIER_SORTIE
NIVEAU_COMMUNE est le admin_level OpenStreetMap des communes du pays (8 en Espagne, 7 au Portugal…).
Les règles de tri des lieux sont celles de construire_france.py et de app.js.
"""
import json, math, os, re, subprocess, sys
from collections import defaultdict
from urllib.parse import quote
from shapely.geometry import shape
from shapely.strtree import STRtree
from shapely.prepared import prep
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nettoyage import tidy

PBF, CC, LEVEL, OUT = sys.argv[1], sys.argv[2].upper(), sys.argv[3], sys.argv[4]
TMP = os.path.join(os.path.dirname(os.path.abspath(PBF)), 'work-' + CC.lower()); os.makedirs(TMP, exist_ok=True)

FILTRES = [
    'nwr/amenity=townhall,fountain,place_of_worship,library,theatre,arts_centre,cinema,marketplace,clock,community_centre',
    'nwr/building=cathedral', 'nwr/historic',
    'nwr/tourism=museum,artwork,attraction,viewpoint,gallery',
    'nwr/man_made=lighthouse,windmill,watermill,water_tower,obelisk',
    'nwr/leisure=park,garden,bandstand,playground,sports_centre,stadium,swimming_pool',
    'nwr/railway=station',
]

# [libellé, rareté de base, rayon en m] — doit rester aligné avec KINDS dans app.js
KINDS = {
    'mairie': ('commune', 60), 'cathedrale': ('epique', 90), 'culte': ('rare', 60), 'fontaine': ('commune', 40),
    'statue': ('commune', 40), 'oeuvre': ('commune', 40), 'fresque': ('commune', 50), 'aux_morts': ('rare', 50),
    'memorial': ('rare', 50), 'plaque': ('commune', 30), 'monument': ('rare', 50), 'musee': ('epique', 70),
    'chateau': ('epique', 120), 'ruines': ('rare', 80), 'porte': ('rare', 60), 'croix': ('commune', 30),
    'phare': ('epique', 90), 'moulin': ('rare', 60), 'chateau_eau': ('commune', 60), 'belvedere': ('rare', 60),
    'attraction': ('rare', 80), 'parc': ('commune', 150), 'patrimoine': ('rare', 60), 'bibliotheque': ('rare', 50),
    'culture': ('rare', 60), 'gare': ('rare', 90), 'marche': ('commune', 70), 'kiosque': ('rare', 40),
    'horloge': ('commune', 30), 'jeux': ('commune', 40), 'sport': ('commune', 100), 'salle': ('commune', 50),
}
LABEL = {'mairie': 'Mairie', 'fontaine': 'Fontaine', 'statue': 'Statue', 'oeuvre': "Œuvre d'art", 'fresque': 'Fresque',
         'aux_morts': 'Monument aux morts', 'croix': 'Calvaire', 'plaque': 'Plaque commémorative', 'memorial': 'Mémorial',
         'chateau_eau': "Château d'eau", 'moulin': 'Moulin', 'kiosque': 'Kiosque', 'horloge': 'Horloge', 'jeux': 'Aire de jeux',
         'marche': 'Marché'}
RAR = ['commune', 'rare', 'epique', 'legendaire']
NEEDS_NAME_Q = {('amenity', 'place_of_worship'), ('leisure', 'park'), ('leisure', 'garden'), ('railway', 'station'),
                ('leisure', 'sports_centre'), ('leisure', 'stadium'), ('leisure', 'swimming_pool')}

def classify(t):
    h, art, name = t.get('historic', ''), t.get('artwork_type', ''), t.get('name', '')
    a, lei, mm, tour = t.get('amenity', ''), t.get('leisure', ''), t.get('man_made', ''), t.get('tourism', '')
    if a == 'townhall': return 'mairie'
    if t.get('building') == 'cathedral' or (a == 'place_of_worship' and re.search(r'cath[ée]dral', name, re.I)): return 'cathedrale'
    if a == 'place_of_worship': return 'culte'
    if a == 'fountain': return 'fontaine'
    if a == 'library': return 'bibliotheque'
    if a in ('theatre', 'arts_centre', 'cinema'): return 'culture'
    if a == 'marketplace': return 'marche'
    if a == 'clock': return 'horloge'
    if a == 'community_centre': return 'salle'
    if t.get('railway') == 'station' or t.get('public_transport') == 'station': return 'gare'
    if lei == 'bandstand': return 'kiosque'
    if tour == 'museum': return 'musee'
    if h == 'memorial':
        m = t.get('memorial', '')
        if m == 'war_memorial': return 'aux_morts'
        if m in ('statue', 'bust'): return 'statue'
        if m in ('plaque', 'blue_plaque'): return 'plaque'
        return 'memorial'
    if h == 'monument': return 'monument'
    if tour == 'artwork':
        if art in ('statue', 'sculpture', 'bust'): return 'statue'
        if art in ('mural', 'graffiti'): return 'fresque'
        return 'oeuvre'
    if h in ('castle', 'palace', 'manor', 'fort'): return 'chateau'
    if h in ('ruins', 'archaeological_site'): return 'ruines'
    if h == 'city_gate': return 'porte'
    if h in ('wayside_cross', 'wayside_shrine'): return 'croix'
    if h in ('church', 'chapel', 'monastery'): return 'culte'
    if mm == 'lighthouse': return 'phare'
    if mm in ('windmill', 'watermill'): return 'moulin'
    if mm == 'water_tower': return 'chateau_eau'
    if tour == 'viewpoint': return 'belvedere'
    if tour in ('attraction', 'gallery'): return 'attraction'
    if lei in ('park', 'garden'): return 'parc'
    if lei == 'playground': return 'jeux'
    if lei in ('sports_centre', 'stadium', 'swimming_pool'): return 'sport'
    if mm == 'obelisk': return 'monument'
    if h: return 'patrimoine'
    return None


def run(*a):
    print('$', ' '.join(a), flush=True); subprocess.run(a, check=True)

def dist(a, b):
    R = 6371000; la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def features(path):
    with open(path, encoding='utf8') as f:
        for line in f:
            line = line.strip().lstrip('\x1e')
            if line: yield json.loads(line)

def nom(p):
    return (p.get('name:fr') or p.get('name') or p.get('name:en') or '').strip()

# 1) Communes et régions
run('osmium', 'tags-filter', '--overwrite', '-o', TMP + '/bnd.pbf', PBF, 'r/boundary=administrative')
run('osmium', 'export', '--overwrite', '-f', 'geojsonseq', '--geometry-types=polygon', '-a', 'type,id', '-o', TMP + '/bnd.geojsonseq', TMP + '/bnd.pbf')
lvl = int(LEVEL)
communes, regions = [], []
for f in features(TMP + '/bnd.geojsonseq'):
    p = f['properties']
    try: al = int(p.get('admin_level', '0'))
    except ValueError: continue
    if al != lvl and not (3 <= al < lvl): continue
    name = nom(p)
    if not name: continue
    try:
        g = shape(f['geometry'])
        if not g.is_valid: g = g.buffer(0)
    except Exception: continue
    if g.is_empty: continue
    rid = 'r' + str(p.get('@id'))
    if al == lvl:
        c = g.centroid if g.contains(g.centroid) else g.representative_point()
        try: pop = int(re.sub(r'\D', '', p.get('population', '') or '0') or 0)
        except ValueError: pop = 0
        communes.append({'id': rid, 'name': name, 'geom': g, 'lat': round(c.y, 5), 'lon': round(c.x, 5), 'pop': pop})
    else:
        regions.append({'name': name, 'al': al, 'geom': prep(g), 'raw': g, 'id': p.get('@id'), 'names': [p.get(k) for k in ('name', 'name:fr', 'name:en', 'official_name', 'short_name') if p.get(k)]})
print(len(communes), 'communes,', len(regions), 'régions', flush=True)
if len(communes) < 50: sys.exit(f'{CC} : trop peu de communes au niveau {LEVEL}, vérifie le niveau administratif.')

# 1 bis) Grandes villes enregistrées comme « villes-régions » (Berlin, Munich, Vienne, Londres, Zagreb, New York…) :
# elles n'ont pas de commune au niveau {LEVEL}. On les ajoute quand une limite de niveau 4 à {LEVEL}-1
# porte le nom d'une ville (nœud place=city/town situé dedans) et n'est presque pas couverte par des communes.
from shapely.geometry import Point
import unicodedata
def _key(t):
    t = unicodedata.normalize('NFD', (t or '').lower()); t = ''.join(ch for ch in t if unicodedata.category(ch) != 'Mn')
    return ' '.join(w for w in re.split(r"[\s\-'’,]+", t) if w and w not in VILLE_MOTS)
VILLE_MOTS = {'greater', 'grad', 'stadt', 'city', 'of', 'municipio', 'municipality', 'de', 'del', 'town', 'kreisfreie', 'landeshauptstadt', 'statutarstadt',
              'citta', 'di', 'ville', 'la', 'le', 'the', 'metropolitan', 'metropolitana', 'capital', 'capitale'}
run('osmium', 'tags-filter', '--overwrite', '-o', TMP + '/villes.pbf', PBF, 'n/place=city,town')
run('osmium', 'export', '--overwrite', '-f', 'geojsonseq', '-a', 'type,id', '-o', TMP + '/villes.geojsonseq', TMP + '/villes.pbf')
villes = []
for f in features(TMP + '/villes.geojsonseq'):
    p = f['properties']
    if f['geometry']['type'] != 'Point': continue
    keys = {_key(p.get(k)) for k in ('name', 'name:fr', 'name:en', 'official_name') if p.get(k)} - {''}
    if not keys: continue
    try: pop = int(re.sub(r'\D', '', p.get('population', '') or '0') or 0)
    except ValueError: pop = 0
    villes.append({'pt': Point(f['geometry']['coordinates']), 'keys': keys, 'name': nom(p), 'pop': pop})
par_nom = defaultdict(list)
for v in villes:
    for k in v['keys']: par_nom[k].append(v)
ctree = STRtree([c['geom'] for c in communes])
deja = {_key(c['name']) for c in communes}
def _match(r):
    # la ville dont le nom est celui de la limite (« Grad Zagreb » ↔ « Zagreb »), ou contenu dedans (« Ville de Zagreb »)
    rks = {_key(n) for n in r['names']} - {''}
    for rk in rks:
        v = next((v for v in par_nom.get(rk, ()) if r['geom'].contains(v['pt'])), None)
        if v: return v, True
    for v in (v for i in vtree.query(r['raw']) for v in [villes[int(i)]]):
        if v['pop'] < 20000 or not r['geom'].contains(v['pt']): continue
        if any(f' {k} ' in f' {rk} ' for k in v['keys'] for rk in rks if len(k) > 3) and not (v['keys'] & deja): return v, False
    return None, False
vtree = STRtree([v['pt'] for v in villes]) if villes else None
ajout, trace = [], []
cands = []
for r in (r for r in regions if 4 <= r['al'] < lvl):
    if vtree is None: break
    v, exact = _match(r)
    if v: cands.append((not exact, -r['al'], r, v))
# d'abord les noms identiques (« New York » avant « New York County »), puis du plus fin au plus large
for _, _, r, v in sorted(cands, key=lambda t: (t[0], t[1])):
    if v['keys'] & deja: trace.append((v['pop'], f"{r['name']} : existe déjà")); continue
    g = r['raw']; area = g.area or 1
    couvert = sum(g.intersection(communes[int(i)]['geom']).area for i in ctree.query(g)) / area
    trace.append((v['pop'], f"{r['name']} (niv. {r['al']}, couvert {couvert:.0%})"))
    if couvert > 0.5: continue                              # déjà découpée en communes (cas normal)
    if any(a['geom'].intersection(g).area > 0.5 * min(area, a['geom'].area) for a in ajout): continue   # pas deux fois la même ville
    c = v['pt'] if g.contains(v['pt']) else g.representative_point()
    ajout.append({'id': 'r' + str(r['id']), 'name': v['name'] or r['name'], 'geom': g, 'lat': round(c.y, 5), 'lon': round(c.x, 5),
                  'pop': v['pop'], 'al': r['al']})
print(len(ajout), 'grandes villes ajoutées :', ', '.join(a['name'] for a in sorted(ajout, key=lambda a: -a['pop'])[:40]), flush=True)
# rapport lisible dans les annotations de GitHub Actions
print(f"::notice title={CC} villes-régions::{len(villes)} villes, {sum(1 for r in regions if 4 <= r['al'] < lvl)} limites 4-{lvl - 1} ; "
      f"ajoutées ({len(ajout)}) : {', '.join(a['name'] for a in sorted(ajout, key=lambda a: -a['pop'])[:25])} ; "
      f"candidates : {' | '.join(t for _, t in sorted(trace, reverse=True)[:15])}", flush=True)
communes += ajout
del villes, par_nom, ctree, vtree

# région affichée : la plus fine des limites (niveaux 4 à {LEVEL}-1) qui contient la commune
rtree = STRtree([r['raw'] for r in regions]) if regions else None
for c in communes:
    best = None
    if rtree is not None:
        from shapely.geometry import Point
        pt = Point(c['lon'], c['lat'])
        for i in rtree.query(pt):
            r = regions[int(i)]
            if r['al'] >= 4 and r['al'] < c.get('al', lvl) and r['geom'].contains(pt) and (best is None or r['al'] > best['al']): best = r
    c['region'] = best['name'] if best else ''
del regions, rtree

# 2) Lieux, traités au fil de l'eau pour limiter la mémoire
tree = STRtree([c['geom'] for c in communes]); prepared = [prep(c['geom']) for c in communes]
run('osmium', 'tags-filter', '--overwrite', '-o', TMP + '/poi.pbf', PBF, *FILTRES)
run('osmium', 'export', '--overwrite', '-f', 'geojsonseq', '-a', 'type,id', '-o', TMP + '/poi.geojsonseq', TMP + '/poi.pbf')
per = defaultdict(list); total = 0
for f in features(TMP + '/poi.geojsonseq'):
    p = f['properties']; key = p.get('@type', 'x')[0] + str(p.get('@id'))
    t = {k: v for k, v in p.items() if not k.startswith('@')}
    kind = classify(t)
    if not kind: continue
    if any(t.get(a) == b for a, b in NEEDS_NAME_Q) and not t.get('name'): continue
    try: g = shape(f['geometry'])
    except Exception: continue
    pt = g if g.geom_type == 'Point' else g.representative_point()
    name = nom(t)
    if not name:
        if kind not in LABEL: continue
        name = LABEL[kind] + (f" · {t['addr:street']}" if t.get('addr:street') else '')
    r = RAR.index(KINDS[kind][0])
    if t.get('wikidata') or t.get('wikipedia') or t.get('heritage'): r = min(3, r + 1)
    wiki = ''
    m = re.match(r'^([a-z\-]+):(.+)$', t.get('wikipedia', ''))
    if m: wiki = f'https://{m.group(1)}.wikipedia.org/wiki/{quote(m.group(2).replace(" ", "_"))}'
    big = key[0] != 'n' and kind in ('parc', 'chateau', 'ruines', 'attraction', 'sport', 'gare')
    rec = {'id': key, 'n': name, 'k': kind, 'r': RAR[r], 'lat': round(pt.y, 6), 'lon': round(pt.x, 6), 'rad': KINDS[kind][1] + (60 if big else 0), 'w': wiki, 'named': bool(t.get('name'))}
    best = None
    for i in tree.query(pt):
        i = int(i)
        if prepared[i].contains(pt) and (best is None or communes[i].get('al', lvl) > communes[best].get('al', lvl)): best = i
    if best is not None: per[best].append(rec); total += 1
print(total, 'lieux rattachés', flush=True)

# 3) Fichiers
os.makedirs(OUT, exist_ok=True)
for fn in os.listdir(OUT):
    if fn.endswith('.json'): os.remove(os.path.join(OUT, fn))
index = []
for i, c in enumerate(communes):
    kept = tidy(per.get(i, []), c['name'])[:600]   # orthographe, une seule mairie, doublons, lieux sans nom (outils/nettoyage.py)
    if kept:
        with open(os.path.join(OUT, c['id'] + '.json'), 'w', encoding='utf8') as fo:
            json.dump({'v': 2, 'places': kept}, fo, ensure_ascii=False, separators=(',', ':'))
    index.append([c['id'], c['name'], c['lat'], c['lon'], c['region'], c['pop'], len(kept)])
index.sort(key=lambda r: -r[5])
with open(os.path.join(OUT, 'communes.json'), 'w', encoding='utf8') as fo:
    json.dump({'v': 2, 'cc': CC, 'level': lvl, 'communes': index}, fo, ensure_ascii=False, separators=(',', ':'))
print(f'{CC} : {len(index)} communes, {sum(r[6] for r in index)} lieux', flush=True)

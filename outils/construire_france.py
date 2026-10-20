#!/usr/bin/env python3
"""Construit data/fr/ : l'index des communes et un fichier de lieux par commune.

Usage : construire_france.py DOSSIER_PBF DOSSIER_SORTIE
Le dossier PBF contient les extraits Geofabrik (France + outre-mer).
Les règles de tri des lieux reprennent celles de app.js (classify, toPlaces).
"""
import json, math, os, re, subprocess, sys, unicodedata
from collections import defaultdict
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
from shapely.prepared import prep

SRC, OUT = sys.argv[1], sys.argv[2]
TMP = os.path.join(SRC, 'work'); os.makedirs(TMP, exist_ok=True)

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

DEPS = {'01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes',
 '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados',
 '15': 'Cantal', '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
 '21': "Côte-d'Or", '22': "Côtes-d'Armor", '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs', '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir',
 '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '36': 'Indre',
 '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura', '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire',
 '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire', '50': 'Manche',
 '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle',
 '58': 'Nièvre', '59': 'Nord', '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
 '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhône', '70': 'Haute-Saône',
 '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne',
 '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse', '85': 'Vendée',
 '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine',
 '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise", '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
 '974': 'La Réunion', '976': 'Mayotte'}
def dep_of(insee): return insee[:3] if insee.startswith('97') else insee[:2]

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

pbfs = sorted(os.path.join(SRC, f) for f in os.listdir(SRC) if f.endswith('.osm.pbf'))
communes, seen_insee = [], set()
pois = {}
for pbf in pbfs:
    base = os.path.join(TMP, os.path.basename(pbf).split('-latest')[0])
    run('osmium', 'tags-filter', '--overwrite', '-o', base + '-bnd.pbf', pbf, 'r/boundary=administrative')
    run('osmium', 'export', '--overwrite', '-f', 'geojsonseq', '--geometry-types=polygon', '-a', 'type,id', '-o', base + '-bnd.geojsonseq', base + '-bnd.pbf')
    for f in features(base + '-bnd.geojsonseq'):
        p = f['properties']; insee = p.get('ref:INSEE', '')
        if p.get('admin_level') != '8' or not re.fullmatch(r'(\d{5}|2[AB]\d{3})', insee) or insee in seen_insee: continue
        if dep_of(insee) not in DEPS: continue
        try: g = shape(f['geometry'])
        except Exception: continue
        if g.is_empty: continue
        if not g.is_valid: g = g.buffer(0)
        seen_insee.add(insee)
        c = g.representative_point() if not g.contains(g.centroid) else g.centroid
        try: pop = int(re.sub(r'\D', '', p.get('population', '') or '0') or 0)
        except ValueError: pop = 0
        communes.append({'insee': insee, 'name': p.get('name', insee), 'geom': g, 'lat': round(c.y, 5), 'lon': round(c.x, 5), 'pop': pop})
    run('osmium', 'tags-filter', '--overwrite', '-o', base + '-poi.pbf', pbf, *FILTRES)
    run('osmium', 'export', '--overwrite', '-f', 'geojsonseq', '-a', 'type,id', '-o', base + '-poi.geojsonseq', base + '-poi.pbf')
    for f in features(base + '-poi.geojsonseq'):
        p = f['properties']; key = p.get('@type', 'x')[0] + str(p.get('@id'))
        if key in pois: continue
        pois[key] = f
print(len(communes), 'communes,', len(pois), 'objets', flush=True)

tree = STRtree([c['geom'] for c in communes])
prepared = [prep(c['geom']) for c in communes]
per = defaultdict(list)
for key, f in pois.items():
    t = {k: v for k, v in f['properties'].items() if not k.startswith('@')}
    kind = classify(t)
    if not kind: continue
    if any(t.get(a) == b for a, b in NEEDS_NAME_Q) and not t.get('name'): continue
    try: g = shape(f['geometry'])
    except Exception: continue
    pt = g if g.geom_type == 'Point' else g.representative_point()
    name = (t.get('name:fr') or t.get('name') or '').strip()
    if not name:
        if kind not in LABEL: continue
        name = LABEL[kind] + (f" · {t['addr:street']}" if t.get('addr:street') else '')
    r = RAR.index(KINDS[kind][0])
    if t.get('wikidata') or t.get('wikipedia') or t.get('heritage'): r = min(3, r + 1)
    wiki = ''
    m = re.match(r'^([a-z\-]+):(.+)$', t.get('wikipedia', ''))
    if m:
        from urllib.parse import quote
        wiki = f'https://{m.group(1)}.wikipedia.org/wiki/{quote(m.group(2).replace(" ", "_"))}'
    big = key[0] != 'n' and kind in ('parc', 'chateau', 'ruines', 'attraction', 'sport', 'gare')
    rec = {'id': key, 'n': name, 'k': kind, 'r': RAR[r], 'lat': round(pt.y, 6), 'lon': round(pt.x, 6), 'rad': KINDS[kind][1] + (60 if big else 0), 'w': wiki, 'named': bool(t.get('name'))}
    for i in tree.query(pt):
        if prepared[i].contains(pt): per[i].append(rec); break

os.makedirs(OUT, exist_ok=True)
for fn in os.listdir(OUT):
    if fn.endswith('.json'): os.remove(os.path.join(OUT, fn))
index = []
for i, c in enumerate(communes):
    lst = sorted(per.get(i, []), key=lambda p: (-RAR.index(p['r']), not p['named']))
    kept = []
    for p in lst:
        if any(q['k'] == p['k'] and q['n'] == p['n'] and dist((p['lat'], p['lon']), (q['lat'], q['lon'])) < 40 for q in kept): continue
        kept.append(p)
        if len(kept) >= 600: break
    if kept:
        with open(os.path.join(OUT, c['insee'] + '.json'), 'w', encoding='utf8') as f:
            json.dump({'v': 2, 'places': kept}, f, ensure_ascii=False, separators=(',', ':'))
    index.append([c['insee'], c['name'], c['lat'], c['lon'], dep_of(c['insee']), c['pop'], len(kept)])
index.sort(key=lambda r: -r[5])
with open(os.path.join(OUT, 'communes.json'), 'w', encoding='utf8') as f:
    json.dump({'v': 2, 'deps': DEPS, 'communes': index}, f, ensure_ascii=False, separators=(',', ':'))
tot = sum(r[6] for r in index)
print(f'{len(index)} communes, {tot} lieux, {sum(1 for r in index if r[6])} communes avec au moins un lieu', flush=True)
if len(index) < 30000: sys.exit('Trop peu de communes : construction interrompue pour ne pas publier des données incomplètes.')

"""Toilettage des lieux d'une commune : orthographe des noms, une seule mairie, doublons, lieux sans nom.

Mêmes règles que tidyPlaces() dans app.js, plus une seule différence : ici, un lieu sans nom
reçoit le nom du lieu connu le plus proche (« Aire de jeux · près de l'Église Saint-Martin »).
"""
import math, re, unicodedata

RAR = ['commune', 'rare', 'epique', 'legendaire']
SMALL = {'de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'sur', 'sous', 'à', 'a', 'von', 'van', 'der', 'den',
         'di', 'da', 'del', 'della', 'y', 'e', 'o', 'of', 'the', 'and'}
ACCENTS = {'eglise': 'église', 'ecole': 'école', 'etang': 'étang', 'hotel': 'hôtel', 'chateau': 'château', 'theatre': 'théâtre',
           'cimetiere': 'cimetière', 'musee': 'musée', 'riviere': 'rivière', 'cathedrale': 'cathédrale', 'etablissement': 'établissement',
           'marche': 'marché', 'mediatheque': 'médiathèque', 'bibliotheque': 'bibliothèque', 'college': 'collège', 'lycee': 'lycée',
           'creche': 'crèche', 'prefecture': 'préfecture'}
ACCENTS_RE = re.compile(r"\b(Eglise|Ecole|Etang|Chateau|Cimetiere|Musee|Riviere|Cathedrale|Etablissement|Mediatheque|Bibliotheque|Prefecture"
                        r"|Hotel(?= de [Vv]ille)|Theatre(?= (?:de|du|des|municipal))|Marche(?= (?:couvert|aux|de|du|des))|College(?= (?:de|du|des))|Lycee|Creche)\b")
TOWNHALL = re.compile(r'mairie|h[oô]tel de ville|town ?hall|city hall|rathaus|gemeinde|stadtamt|marktgemeinde|ayuntamiento|municipio|comune|municipal'
                      r'|c[aâ]mara|prefeitura|belediye|gemeentehuis|stadhuis|δημαρχ|市役所|町役場|村役場|政府|ศาลา', re.I)
FORMER = re.compile(r'\b(ancien(ne)?|ehem(alig\w*)?\.?|former|old|antigu[oa]|vecchi[oa]|alte[sr]?|eski)\b', re.I)
LETTER = r'[^\W\d_]'
DELEGUEE = re.compile(r'd[ée]l[ée]gu[ée]e|annexe|ortsverwaltung|ortsamt|bezirksamt|junta vecinal', re.I)
GENERIC_HALL = {'mairie', 'hotel de ville', 'rathaus', 'gemeindeamt', 'town hall', 'city hall', 'ayuntamiento', 'municipio', 'gemeentehuis', 'stadhuis', 'comune', 'municipalite'}


def nrm(t):
    t = unicodedata.normalize('NFD', (t or '').lower())
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r"[-'’\s]+", ' ', t).strip()


def dist(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a['lat'], a['lon'], b['lat'], b['lon']))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(h))


def _is_roman(w):
    return len(w) <= 4 and re.fullmatch(r'[IVXLC]+', w.upper()) and w.lower() not in ('di', 'mi', 'li', 'ci', 'vi', 'il', 'lc')


def title_case(t):
    low = t.lower()
    out, first, last = [], True, 0
    for m in re.finditer(r'[^\W_]+', low):
        out.append(low[last:m.start()])
        w, i = m.group(0), m.start()
        prev = low[i - 1] if i else ' '
        nxt = low[m.end()] if m.end() < len(low) else ''
        if _is_roman(w):
            w = w.upper()
        elif not first and w in SMALL and prev != '-':
            pass
        elif not first and w in ('d', 'l') and nxt in "'’":
            pass
        else:
            w = w[:1].upper() + w[1:]
        out.append(w); first = False; last = m.end()
    out.append(low[last:])
    return ''.join(out)


def fix_text(n):
    n = re.sub(r'\s+', ' ', n or '').strip()
    q = re.fullmatch(r'["“„«‘\'‹]\s*(.+?)\s*["”“»’\'›]', n)
    if q: n = q.group(1)
    n = re.sub(r'\s*\|\s*', ' · ', n)
    n = re.sub(r'\b(de|des|du|la|le|les|di|da|del|von|van)\s+\1\b', r'\1', n, flags=re.I)
    letters = re.findall(LETTER, n)
    latin = [c for c in letters if re.match(r'[A-Za-zÀ-ɏ]', c)]
    if len(latin) > 4 and len(latin) >= len(letters) * .8 and all(c.isupper() for c in latin) and (' ' in n or len(latin) > 8):
        n = title_case(n)
    elif re.match(r'[a-zà-ÿ]', n):
        n = n[0].upper() + n[1:]

    def acc(m):
        w = m.group(0); r = ACCENTS.get(w.lower())
        return (r[0].upper() + r[1:]) if r and w[0].isupper() else (r or w)
    n = ACCENTS_RE.sub(acc, n)
    return re.sub(r'\bMonument aux Morts\b', 'Monument aux morts', n)


def city_variant(n, city):
    words = [w for w in re.split(r"[-'’\s]+", city or '') if w]
    if len(words) < 2: return n
    pat = re.compile(r"(^|[^\w])(" + r"[-'’\s]+".join(map(re.escape, words)) + r")(?!\w)", re.I)
    return pat.sub(lambda m: m.group(1) + city, n, count=1)


MASC = {'parc', 'stade', 'square', 'jardin', 'monument', 'marché', 'musée', 'moulin', 'château', 'calvaire', 'lavoir', 'pont', 'mémorial',
        'cimetière', 'collège', 'lycée', 'gymnase', 'kiosque', 'temple', 'théâtre', 'centre', 'complexe', 'terrain', 'bois', 'quai',
        'boulodrome', 'gîte', 'manoir', 'phare', 'belvédère', 'site', 'domaine', 'couvent', 'prieuré', 'presbytère', 'oratoire',
        'christ', 'buste', 'obélisque', 'canon', 'puits', 'four', 'jet'}
FEM = {'mairie', 'place', 'fontaine', 'chapelle', 'croix', 'statue', 'gare', 'bibliothèque', 'médiathèque', 'piscine', 'salle', 'maison',
       'tour', 'porte', 'plaque', 'fresque', 'basilique', 'cathédrale', 'halle', 'résidence', 'ferme', 'villa', 'stèle', 'mosquée',
       'synagogue', 'pagode', 'base', 'aire', 'plage', 'promenade', 'école',
       'vierge', 'grotte', 'source', 'borne', 'colonne', 'arche', 'citadelle', 'abbaye', 'église'}


def pres_de(name):
    """« près du Parc X », « près de la Mairie », « près de l'Église X », « près des Halles »"""
    if re.match(r"(De|Het|Der|Die|Das|Den|El|Il|Lo|Los|Las|The|Un|Une|Des|Du)\s", name):
        return f"près de « {name} »"   # nom qui commence lui-même par un article : « près de « De Melkster » »
    m = re.match(r"(Les|Le|La|L['’])\s*(.*)", name)
    if m:
        art, rest = m.group(1), m.group(2)
        return {'Les': 'près des ', 'Le': 'près du ', 'La': 'près de la '}.get(art, "près de l'") + rest
    first = name.split(' ')[0].split('-')[0].lower()
    if re.match(r'[aeiouyàâéèêëîïôûüh]', first): return "près de l'" + name
    if first in MASC: return 'près du ' + name
    if first in FEM: return 'près de la ' + name
    return 'près de ' + name


def tidy(places, city, limit=2500):
    """places : liste de dicts {id, n, k, r, lat, lon, rad, w, named}. Retourne la liste nettoyée, triée par intérêt."""
    ps = [dict(p, n=city_variant(fix_text(p['n']), city)) for p in places]
    # une seule mairie par commune
    halls = [p for p in ps if p['k'] == 'mairie']
    if len(halls) > 1:
        head = nrm(re.split(r"[-\s]", city or '')[0]) if city else ''
        def score(p):
            v = nrm(p['n'])
            return ((4 if TOWNHALL.search(p['n']) else 0) + (3 if city and nrm(city) in v else 0) + (2 if head and len(head) > 2 and head in v else 0)
                    + (1 if p['named'] else 0) - (10 if FORMER.search(p['n']) else 0) - (4 if DELEGUEE.search(p['n']) else 0))
        best = max(halls, key=score)
        for h in halls:
            if h is best: continue
            v = nrm(h['n'])
            same = (not h['named']) or nrm(h['n']) == nrm(best['n']) or (city and nrm(city) in v) or v in GENERIC_HALL
            if same and not FORMER.search(h['n']) and not DELEGUEE.search(h['n']): h['drop'] = True   # doublon de la mairie
            else: h['k'] = 'patrimoine'          # autre bâtiment réel : ancienne mairie, mairie déléguée ou annexe
    ps = [p for p in ps if not p.get('drop')]
    ps.sort(key=lambda p: (-RAR.index(p['r']), not p['named'], not p['w']))
    ps = ps[:limit]                      # les plus intéressants d'abord : borne le temps de calcul des grandes villes
    kept, by_name = [], {}
    for p in ps:
        v = nrm(p['n'])
        twin = next((q for q in by_name.get(v, ()) if (
            (dist(p, q) < 400 if q['k'] == p['k'] else dist(p, q) < 100) if (p['named'] and q['named']) else dist(p, q) < 30)), None)
        if twin:
            if not twin['w'] and p['w']: twin['w'] = p['w']
            continue
        kept.append(p); by_name.setdefault(v, []).append(p)
    # lieux sans nom : nommés d'après le lieu connu le plus proche (moins de 400 m), recherche par grille
    grid = {}
    for q in kept:
        if q['named']: grid.setdefault((int(q['lat'] / .004), int(q['lon'] / .006)), []).append(q)
    for p in kept:
        if p['named'] or '·' in p['n']: continue
        gy, gx = int(p['lat'] / .004), int(p['lon'] / .006)
        cand = [q for dy in (-1, 0, 1) for dx in (-1, 0, 1) for q in grid.get((gy + dy, gx + dx), ())]
        near = min(cand, key=lambda q: dist(p, q), default=None)
        if near and dist(p, near) < 400 and nrm(near['n']) != nrm(p['n']):
            p['n'] = f"{p['n']} · {pres_de(near['n'])}"
    # même nom affiché pour des lieux différents : numérotation stable
    groups = {}
    for p in kept: groups.setdefault(nrm(p['n']), []).append(p)
    for g in groups.values():
        if len(g) > 1:
            for i, p in enumerate(sorted(g, key=lambda p: p['id'])):
                if i: p['n'] = f"{p['n']} n°{i + 1}"
    return kept

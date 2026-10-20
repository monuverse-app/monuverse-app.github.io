'use strict';
/* Monuverse v1 — une seule boucle : ta ville, ses vrais lieux, un scan par GPS, une série quotidienne, un classement local. */

const CFG = window.MONUVERSE_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('fr-FR');
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* ---------- Icônes ---------- */
const SHAPES = {
  tower: '<path d="M30 4l2.6 14h-5.2zM26.6 18h6.8l3.4 18h-13.6zM22.6 36h14.8l6.6 20h-7l-4-10h-6l-4 10h-7z M21 35h18v3H21z M25 17h10v2.5H25z"/>',
  spire: '<path d="M30 3l5 22H25z M23 25h14v31H23z M10 34l6-8 6 8v22H10z M38 34l6-8 6 8v22H38z"/><circle cx="30" cy="36" r="4" fill="#0B1322"/>',
  arch: '<path d="M7 56V12h46v44H41V36a11 11 0 0 0-22 0v20z M5 8h50v5H5z"/>',
  dome: '<path d="M10 56V40h40v16z M13 40a17 17 0 0 1 34 0z M28 12h4v12h-4z M8 56h44v-3H8z"/>',
  columns: '<path d="M5 22L30 8l25 14z M7 24h46v4H7z M10 30h5v22h-5z M20.5 30h5v22h-5z M34.5 30h5v22h-5z M45 30h5v22h-5z M5 52h50v4H5z"/>',
  wall: '<path d="M2 28h56v28H2z M2 22h6v6H2z M14 22h6v6h-6z M26 22h8v6h-8z M40 22h6v6h-6z M52 22h6v6h-6z"/><path d="M24 56V44a6 6 0 0 1 12 0v12z" fill="#0B1322"/>',
  place: '<path d="M4 50l10-14h32l10 14z" opacity=".55"/><path d="M28.5 8h3l1.5 30h-6z M22 38h16v6H22z M2 50h56v6H2z"/>',
  statue: '<path d="M26 56V32h8v24z M20 56h20v-5H20z M25 32a5 5 0 1 1 10 0z M33 26l6-18 3 1-6 18z M24 21l-3-6 2-1 3 6z"/>',
  wheel: '<path d="M28 20h4v36h-4z M18 56h24v-4H18z"/><path d="M30 4l3 16h-6z M30 20L46 8l2 3-16 12z M30 20L14 8l-2 3 16 12z M30 20l-3 16h6z" opacity=".85"/>',
  fountain: '<path d="M6 46h48v6H6z M10 52h40v4H10z M22 40h16v6H22z M28 22h4v18h-4z"/><path d="M30 6c-6 6-14 8-18 18 4-4 9-6 14-6M30 6c6 6 14 8 18 18-4-4-9-6-14-6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  tree: '<path d="M28 38h4v18h-4z M18 56h24v-3H18z"/><path d="M30 4c-12 0-20 9-20 19 0 9 8 16 20 16s20-7 20-16C50 13 42 4 30 4z"/>',
  cross: '<path d="M27 6h6v12h12v6H33v26h-6V24H15v-6h12z M18 50h24v6H18z"/>',
  fresco: '<path d="M4 10h52v40H4z" opacity=".35"/><path d="M8 44l12-16 9 10 7-8 16 14z M40 22a5 5 0 1 1 0-.1z"/>',
  sky: '<path d="M24 56V14h12v42z M28.5 14V4h3v10z M12 56V30h11v26z M37 56V22h11v34z"/>'
};
const shape = k => `<svg viewBox="0 0 60 60" fill="currentColor" aria-hidden="true">${SHAPES[k] || SHAPES.columns}</svg>`;
const FLAME = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.2 4.8 5.6 4.8 10.3A4.8 4.8 0 0 1 12 17a4.8 4.8 0 0 1-4.8-4.7c0-1.9.8-3.3 1.9-4.4.2 1.5.9 2.6 2 3.1C10.6 8 11.2 4.6 12 2z"/><path d="M12 22a6.5 6.5 0 0 1-6.5-6.4c0-1 .2-1.9.6-2.7.8 2.6 3.1 4.6 5.9 4.6s5.1-2 5.9-4.6c.4.8.6 1.7.6 2.7A6.5 6.5 0 0 1 12 22z" opacity=".55"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l7 18-7-4-7 4z" fill="currentColor"/></svg>';

/* ---------- Types de lieux : [libellé, icône, rareté de base, rayon de validation en m, anecdote] ---------- */
const KINDS = {
  mairie: ['Mairie', 'columns', 'commune', 60, "Le lieu où se décide la vie de la ville : conseil municipal, mariages, état civil."],
  cathedrale: ['Cathédrale', 'spire', 'epique', 90, "L'église de l'évêque, souvent le plus grand bâtiment de la ville pendant des siècles."],
  culte: ['Lieu de culte', 'spire', 'rare', 60, "Église, temple, mosquée ou synagogue : souvent l'un des plus vieux bâtiments du quartier."],
  fontaine: ['Fontaine', 'fountain', 'commune', 40, "Avant l'eau courante, les habitants venaient y puiser l'eau chaque jour."],
  statue: ['Statue', 'statue', 'commune', 40, "Elle rend hommage à une personne ou à une idée qui compte pour la ville."],
  oeuvre: ["Œuvre d'art", 'statue', 'commune', 40, "Une œuvre installée dans l'espace public, visible par tous."],
  fresque: ['Fresque', 'fresco', 'commune', 50, "Un mur transformé en tableau géant par des artistes."],
  aux_morts: ['Monument aux morts', 'statue', 'rare', 50, "On y lit les noms des habitants morts pendant les guerres. On s'y rassemble chaque 11 novembre et 8 mai."],
  memorial: ['Mémorial', 'statue', 'rare', 50, "Il garde la mémoire d'un événement ou d'une personne."],
  plaque: ['Plaque commémorative', 'cross', 'commune', 30, "Une plaque rappelle qu'un fait ou une personne a marqué cet endroit."],
  monument: ['Monument', 'statue', 'rare', 50, "Un ouvrage élevé pour marquer l'histoire de la ville."],
  musee: ['Musée', 'dome', 'epique', 70, "Les trésors et l'histoire du lieu, rassemblés pour tous."],
  chateau: ['Château', 'wall', 'epique', 120, "Demeure de seigneurs ou forteresse, il a vu passer des siècles d'histoire."],
  ruines: ['Vestiges', 'arch', 'rare', 80, "Les restes d'une construction ancienne, témoins d'une autre époque."],
  porte: ['Porte de ville', 'arch', 'rare', 60, "Autrefois, on entrait dans la ville par ses portes, fermées la nuit."],
  croix: ['Calvaire', 'cross', 'commune', 30, "Les croix et oratoires marquaient les chemins et les carrefours."],
  phare: ['Phare', 'tower', 'epique', 90, "Sa lumière guide les bateaux la nuit."],
  moulin: ['Moulin', 'wheel', 'rare', 60, "On y moulait le grain grâce au vent ou à l'eau."],
  chateau_eau: ["Château d'eau", 'tower', 'commune', 60, "Il garde l'eau en hauteur pour qu'elle coule dans les robinets."],
  belvedere: ['Point de vue', 'sky', 'rare', 60, "D'ici, la vue sur les environs vaut le détour."],
  attraction: ['Site à voir', 'place', 'rare', 80, "Un lieu que les habitants recommandent aux visiteurs."],
  parc: ['Parc', 'tree', 'commune', 150, "Un poumon vert pour se promener et respirer."],
  patrimoine: ['Patrimoine', 'columns', 'rare', 60, "Un élément du patrimoine historique de la ville."],
  bibliotheque: ['Bibliothèque', 'dome', 'rare', 50, "Livres, films, jeux : la culture ouverte à tous les habitants."],
  culture: ['Lieu de culture', 'columns', 'rare', 60, "Théâtre, centre culturel ou salle de spectacle : la scène de la ville."],
  gare: ['Gare', 'arch', 'rare', 90, "La porte d'entrée des voyageurs depuis l'arrivée du train."],
  marche: ['Marché', 'place', 'commune', 70, "Le rendez-vous des habitants pour faire leurs courses et se croiser."],
  kiosque: ['Kiosque', 'dome', 'rare', 40, "Autrefois, la fanfare y jouait le dimanche."],
  horloge: ['Horloge', 'tower', 'commune', 30, "Elle donne l'heure aux passants depuis des années."],
  jeux: ['Aire de jeux', 'tree', 'commune', 40, "Le terrain d'aventure des enfants du quartier."],
  sport: ['Équipement sportif', 'place', 'commune', 100, "Stade, gymnase ou piscine : là où la ville fait du sport."],
  salle: ['Lieu de vie', 'columns', 'commune', 50, "Un lieu de rencontre pour les associations et les habitants."]
};
const RAR = { commune: ['Commune', 10], rare: ['Rare', 25], epique: ['Épique', 50], legendaire: ['Légendaire', 100] };
const RAR_ORDER = ['commune', 'rare', 'epique', 'legendaire'];
const UNNAMED_OK = new Set(['fontaine', 'statue', 'oeuvre', 'fresque', 'aux_morts', 'croix', 'plaque', 'memorial', 'mairie', 'chateau_eau', 'moulin', 'kiosque', 'horloge', 'jeux', 'marche']);

function classify(t) {
  const h = t.historic, art = t.artwork_type, name = t.name || '';
  if (t.amenity === 'townhall') return 'mairie';
  if (t.building === 'cathedral' || (t.amenity === 'place_of_worship' && /cath[ée]dral/i.test(name))) return 'cathedrale';
  if (t.amenity === 'place_of_worship') return 'culte';
  if (t.amenity === 'fountain') return 'fontaine';
  if (t.amenity === 'library') return 'bibliotheque';
  if (/^(theatre|arts_centre|cinema)$/.test(t.amenity)) return 'culture';
  if (t.amenity === 'marketplace') return 'marche';
  if (t.amenity === 'clock') return 'horloge';
  if (t.amenity === 'community_centre') return 'salle';
  if (t.railway === 'station' || t.public_transport === 'station') return 'gare';
  if (t.leisure === 'bandstand') return 'kiosque';
  if (t.tourism === 'museum') return 'musee';
  if (h === 'memorial') {
    if (t.memorial === 'war_memorial') return 'aux_morts';
    if (t.memorial === 'statue' || t.memorial === 'bust') return 'statue';
    if (t.memorial === 'plaque' || t.memorial === 'blue_plaque') return 'plaque';
    return 'memorial';
  }
  if (h === 'monument') return 'monument';
  if (t.tourism === 'artwork') {
    if (/^(statue|sculpture|bust)$/.test(art)) return 'statue';
    if (/^(mural|graffiti)$/.test(art)) return 'fresque';
    return 'oeuvre';
  }
  if (/^(castle|palace|manor|fort)$/.test(h)) return 'chateau';
  if (/^(ruins|archaeological_site)$/.test(h)) return 'ruines';
  if (h === 'city_gate') return 'porte';
  if (/^(wayside_cross|wayside_shrine)$/.test(h)) return 'croix';
  if (/^(church|chapel|monastery)$/.test(h)) return 'culte';
  if (t.man_made === 'lighthouse') return 'phare';
  if (/^(windmill|watermill)$/.test(t.man_made)) return 'moulin';
  if (t.man_made === 'water_tower') return 'chateau_eau';
  if (t.tourism === 'viewpoint') return 'belvedere';
  if (/^(attraction|gallery)$/.test(t.tourism)) return 'attraction';
  if (t.leisure === 'park' || t.leisure === 'garden') return 'parc';
  if (t.leisure === 'playground') return 'jeux';
  if (/^(sports_centre|stadium|swimming_pool)$/.test(t.leisure)) return 'sport';
  if (t.man_made === 'obelisk') return 'monument';
  if (h) return 'patrimoine';
  return null;
}

/* ---------- Données OpenStreetMap ---------- */
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

function cityFromNominatim(r) {
  const a = r.address || {};
  const name = r.name || a.city || a.town || a.village || a.municipality || a.hamlet || (r.display_name || '').split(',')[0];
  return {
    id: (r.osm_type || 'x')[0] + r.osm_id, osmType: r.osm_type, osmId: r.osm_id,
    name, lat: +r.lat, lon: +r.lon,
    dep: a.county || a.state_district || a.state || '', region: a.state || '', country: a.country || '', cc: (a.country_code || '').toUpperCase()
  };
}
async function searchCities(q) {
  const u = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=6&featureType=settlement&accept-language=fr`;
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('search ' + r.status);
  return (await r.json()).map(cityFromNominatim);
}
async function cityAt(lat, lon) {
  const u = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10&addressdetails=1&accept-language=fr`;
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('reverse ' + r.status);
  const j = await r.json();
  if (!j || j.error) throw new Error('no city');
  return cityFromNominatim(j);
}
function overpassQuery(city) {
  let scope, filt;
  if (city.osmType === 'relation' || city.osmType === 'way') {
    const area = (city.osmType === 'relation' ? 3600000000 : 2400000000) + Number(city.osmId);
    scope = `area(${area})->.a;`; filt = '(area.a)';
  } else { scope = ''; filt = `(around:1500,${city.lat},${city.lon})`; }
  const sel = [
    `[amenity~"^(townhall|fountain)$"]`,
    `[amenity=place_of_worship][name]`,
    `[building=cathedral]`,
    `[historic~"^(monument|memorial|castle|palace|manor|fort|ruins|archaeological_site|city_gate|wayside_cross|wayside_shrine|church|chapel|monastery|boundary_stone|milestone|tower|building|heritage)$"]`,
    `[tourism~"^(museum|artwork|attraction|viewpoint|gallery)$"]`,
    `[man_made~"^(lighthouse|windmill|watermill|water_tower)$"]`,
    `[leisure~"^(park|garden)$"][name]`,
    `[historic]`,
    `[amenity~"^(library|theatre|arts_centre|cinema|marketplace|clock|community_centre)$"]`,
    `[railway=station][name]`,
    `[leisure~"^(bandstand|playground)$"]`,
    `[leisure~"^(sports_centre|stadium|swimming_pool)$"][name]`,
    `[man_made=obelisk]`
  ];
  return `[out:json][timeout:60];${scope}(${sel.map(s => `nwr${filt}${s};`).join('')});out center tags 1500;`;
}
async function fetchPlaces(city) {
  const body = 'data=' + encodeURIComponent(overpassQuery(city));
  let last;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) throw new Error('overpass ' + r.status);
      return toPlaces(await r.json());
    } catch (e) { last = e; }
  }
  throw last;
}
function toPlaces(json) {
  const out = [];
  for (const el of json.elements || []) {
    const t = el.tags || {};
    const kind = classify(t); if (!kind) continue;
    const lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;
    let name = (t['name:fr'] || t.name || '').trim();
    if (!name) {
      if (!UNNAMED_OK.has(kind)) continue;
      name = KINDS[kind][0] + (t['addr:street'] ? ` · ${t['addr:street']}` : '');
    }
    let r = RAR_ORDER.indexOf(KINDS[kind][2]);
    if (t.wikidata || t.wikipedia || t.heritage) r = Math.min(3, r + 1);
    let wiki = '';
    if (t.wikipedia) { const m = /^([a-z\-]+):(.+)$/.exec(t.wikipedia); if (m) wiki = `https://${m[1]}.wikipedia.org/wiki/${encodeURIComponent(m[2].replace(/ /g, '_'))}`; }
    const big = el.type !== 'node' && /^(parc|chateau|ruines|attraction|sport|gare)$/.test(kind);
    out.push({ id: el.type[0] + el.id, n: name, k: kind, r: RAR_ORDER[r], lat: +lat.toFixed(6), lon: +lon.toFixed(6), rad: KINDS[kind][3] + (big ? 60 : 0), w: wiki, named: !!t.name });
  }
  // Doublons : même nom et même type à moins de 40 m
  const kept = [];
  for (const p of out.sort((a, b) => RAR_ORDER.indexOf(b.r) - RAR_ORDER.indexOf(a.r) || b.named - a.named)) {
    if (kept.some(q => q.k === p.k && q.n === p.n && dist(p, q) < 40)) continue;
    kept.push(p);
  }
  return kept.slice(0, 600);
}

/* ---------- Géométrie ---------- */
function dist(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a, b) {
  const toR = Math.PI / 180, y = Math.sin((b.lon - a.lon) * toR) * Math.cos(b.lat * toR);
  const x = Math.cos(a.lat * toR) * Math.sin(b.lat * toR) - Math.sin(a.lat * toR) * Math.cos(b.lat * toR) * Math.cos((b.lon - a.lon) * toR);
  return (Math.atan2(y, x) / toR + 360) % 360;
}
const distTxt = m => m < 1000 ? `${Math.round(m / 5) * 5} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`;
const CARD = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest'];
const cardinal = b => CARD[Math.round(b / 45) % 8];

/* ---------- État et sauvegarde ---------- */
const KEY = 'monuverse-v1';
const DATA_VER = 2;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayBefore = s => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let S = { v: 1, current: null, cities: {}, pseudo: '', streak: { n: 0, last: '' }, xp: 0, dailyBonus: {}, theme: 'auto' };
function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 1) S = Object.assign(S, d); } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Ton téléphone n'a plus de place pour sauvegarder.", true); } }
const city = () => S.cities[S.current];
const got = (c, p) => !!c.scanned[p.id];
const nGot = c => Object.keys(c.scanned).length;
const pct = c => c.places.length ? Math.round(100 * nGot(c) / c.places.length) : 0;
const level = () => 1 + Math.floor(S.xp / 250);
const streakNow = () => (S.streak.last === today() || S.streak.last === dayBefore(today())) ? S.streak.n : 0;
const scannedToday = () => S.streak.last === today();
const totalPlaces = () => Object.values(S.cities).reduce((s, c) => s + nGot(c), 0);
const pseudo = () => S.pseudo || 'Explorateur';

/* Lieu du jour : choisi chaque jour parmi les lieux pas encore débloqués, le plus proche du centre en priorité */
function dailyPlace(c) {
  const left = c.places.filter(p => !got(c, p));
  if (!left.length) return null;
  let h = 0; for (const ch of today() + c.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = left.filter(p => p.named).slice(0, 40);
  const list = pool.length ? pool : left;
  return list[h % list.length];
}

/* ---------- Photos (IndexedDB) ---------- */
const PhotoDB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('monuverse-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('p');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('p', mode); const q = fn(t.objectStore('p')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  const urls = {};
  return {
    put: (k, blob) => { delete urls[k]; return tx('readwrite', s => s.put(blob, k)); },
    url: async k => { if (k in urls) return urls[k]; try { const b = await tx('readonly', s => s.get(k)); urls[k] = b ? URL.createObjectURL(b) : null; } catch (e) { urls[k] = null; } return urls[k]; },
    clear: () => tx('readwrite', s => s.clear())
  };
})();
function shrink(file, max = 1100) {
  return new Promise((res, rej) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(u); cv.toBlob(b => b ? res(b) : rej(new Error('photo')), 'image/jpeg', .82);
    };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('photo')); };
    img.src = u;
  });
}
function askPhoto() {
  return new Promise(res => {
    const inp = $('#photo-in'); inp.value = '';
    const done = () => { window.removeEventListener('focus', onFocus); res(inp.files && inp.files[0] || null); };
    const onFocus = () => setTimeout(() => { if (!inp.files || !inp.files.length) { inp.onchange = null; res(null); } }, 900);
    inp.onchange = done; window.addEventListener('focus', onFocus, { once: true });
    inp.click();
  });
}

/* ---------- GPS ---------- */
const GPS = { pos: null, err: null, watch: null, subs: new Set() };
function startGPS() {
  if (GPS.watch !== null || !('geolocation' in navigator)) { if (!('geolocation' in navigator)) GPS.err = 'none'; return; }
  GPS.watch = navigator.geolocation.watchPosition(p => {
    GPS.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }; GPS.err = null;
    GPS.subs.forEach(f => f());
  }, e => { GPS.err = e.code === 1 ? 'denied' : 'unavailable'; GPS.subs.forEach(f => f()); }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
}
function stopGPS() { if (GPS.watch !== null) { navigator.geolocation.clearWatch(GPS.watch); GPS.watch = null; } }
const fresh = () => GPS.pos && Date.now() - GPS.pos.t < 60000;
const inRange = (p, pos = GPS.pos) => pos && pos.acc <= 100 && dist(pos, p) <= p.rad + Math.min(pos.acc, 30);

/* ---------- Classement (Supabase, facultatif) ---------- */
const LB = (() => {
  const on = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  const base = (CFG.supabaseUrl || '').replace(/\/$/, '');
  const SK = 'monuverse-session';
  let ses = null; try { ses = JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) {}
  const keep = j => { ses = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000, uid: j.user && j.user.id }; try { localStorage.setItem(SK, JSON.stringify(ses)); } catch (e) {} };
  const hdr = extra => Object.assign({ apikey: CFG.supabaseAnonKey, 'Content-Type': 'application/json' }, extra || {});
  async function session() {
    if (ses && ses.exp > Date.now()) return ses;
    if (ses && ses.refresh) {
      const r = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: hdr(), body: JSON.stringify({ refresh_token: ses.refresh }) });
      if (r.ok) { keep(await r.json()); return ses; }
    }
    const r = await fetch(`${base}/auth/v1/signup`, { method: 'POST', headers: hdr(), body: JSON.stringify({ data: {} }) });
    if (!r.ok) throw new Error('auth ' + r.status);
    keep(await r.json()); return ses;
  }
  let timer = null;
  async function push() {
    if (!on || !S.pseudo) return;
    const c = city(); if (!c) return;
    try {
      const s = await session();
      const row = { id: s.uid, pseudo: S.pseudo.slice(0, 20), ville: c.name, ville_id: c.id, departement: `${c.dep}|${c.cc}`, pays: c.cc, points: S.xp, lieux: totalPlaces(), updated_at: new Date().toISOString() };
      const r = await fetch(`${base}/rest/v1/joueurs?on_conflict=id`, { method: 'POST', headers: hdr({ Authorization: 'Bearer ' + s.access, Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(row) });
      if (!r.ok) throw new Error('upsert ' + r.status);
    } catch (e) { console.warn('classement', e); }
  }
  return {
    on,
    uid: () => ses && ses.uid,
    sync: () => { clearTimeout(timer); timer = setTimeout(push, 1500); },
    async top(field, value) {
      const r = await fetch(`${base}/rest/v1/joueurs?select=id,pseudo,ville,points,lieux&${field}=eq.${encodeURIComponent(value)}&order=points.desc&limit=20`, { headers: hdr() });
      if (!r.ok) throw new Error('top ' + r.status);
      return r.json();
    },
    async forget() {
      if (!on || !ses) return;
      try { const s = await session(); await fetch(`${base}/rest/v1/joueurs?id=eq.${s.uid}`, { method: 'DELETE', headers: hdr({ Authorization: 'Bearer ' + s.access }) }); } catch (e) {}
      ses = null; try { localStorage.removeItem(SK); } catch (e) {}
    }
  };
})();

/* ---------- Interface : vues, feuilles, toasts ---------- */
function show(view) { $$('.view').forEach(v => { v.hidden = v.id !== 'v-' + view; }); }
let tab = 'ville';
function go(t) {
  tab = t;
  $$('.screen').forEach(s => { s.hidden = s.id !== 's-' + t; });
  $$('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
  if (t === 'scan') { startGPS(); renderScan(); } else if (t === 'rank') renderRank(); else if (t === 'globe') renderGlobe(); else if (t === 'moi') renderMoi(); else renderVille();
  $('#s-' + t).scrollTop = 0;
}
function sheet(html, onClose) {
  closeSheets();
  const s = document.createElement('div');
  s.className = 'sheet';
  s.innerHTML = `<div class="sheet-body" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) { s.remove(); onClose && onClose(); } });
  $('#app').appendChild(s);
  return s;
}
const closeSheets = () => $$('.sheet').forEach(s => s.remove());
function toast(msg, err) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.setAttribute('role', 'status'); t.textContent = msg;
  $('#app').appendChild(t); setTimeout(() => t.remove(), 3800);
}
function header() {
  const c = city();
  $('#t-cityname').textContent = c ? c.name : 'Ma ville';
  const n = streakNow();
  $('#t-streak').className = 'streak-chip' + (scannedToday() ? '' : ' cold');
  $('#t-streak').innerHTML = `${FLAME}${n}`;
  $('#t-streak').title = `${n} jour${n > 1 ? 's' : ''} de suite`;
  $('#t-me').textContent = pseudo().slice(0, 1).toUpperCase();
}

/* ---------- Écran : Ma ville ---------- */
let filter = 'tous', listMax = 40;
function ringSVG(p, size = 112) {
  const r = 46, C = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 112 112" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#C8862A"/><stop offset=".6" stop-color="#F5B841"/><stop offset="1" stop-color="#FFE2A0"/></linearGradient></defs>
    <circle class="tr" cx="56" cy="56" r="${r}"/><circle class="pr" cx="56" cy="56" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p / 100)}" transform="rotate(-90 56 56)"/>
    <text x="56" y="52">${p}%</text><text class="sm" x="56" y="74">complétée</text></svg>`;
}
function placeRow(c, p, here) {
  const g = got(c, p), d = here ? dist(here, p) : null, isDaily = dailyPlace(c) === p;
  return `<button class="pl r-${p.r} ${g ? 'got' : 'locked'} ${isDaily && !g ? 'today' : ''}" data-p="${p.id}">
    <span class="ic" data-ph="${g ? p.id : ''}">${shape(KINDS[p.k][1])}</span>
    <div><b>${esc(p.n)}</b><span>${KINDS[p.k][0]}${isDaily && !g ? ' · lieu du jour ×2' : ''}${g ? ' · débloqué' : ''}</span></div>
    <span class="rt">${d !== null ? `<span class="dist">${distTxt(d)}</span>` : ''}<span class="gem">${RAR[p.r][0]}</span></span></button>`;
}
async function fillPhotos(root) {
  for (const el of root.querySelectorAll('[data-ph]')) {
    const k = el.dataset.ph; if (!k) continue;
    const u = await PhotoDB.url(k); if (u) el.innerHTML = `<img src="${u}" alt="">`;
  }
}
function renderVille() {
  const c = city(); if (!c) return;
  header();
  const p = pct(c), n = nGot(c), N = c.places.length, here = fresh() ? GPS.pos : null;
  const daily = dailyPlace(c), doneToday = scannedToday();
  const lvl = level(), into = S.xp % 250;
  const kinds = [...new Set(c.places.map(x => x.k))];
  const order = (a, b) => here ? dist(here, a) - dist(here, b) : RAR_ORDER.indexOf(b.r) - RAR_ORDER.indexOf(a.r) || a.n.localeCompare(b.n, 'fr');
  const list = c.places.filter(x => filter === 'tous' ? true : filter === 'got' ? got(c, x) : filter === 'todo' ? !got(c, x) : x.k === filter).sort(order);
  $('#s-ville').innerHTML = `
    <div class="hero">${ringSVG(p)}
      <div><h2>${n} lieu${n > 1 ? 'x' : ''} sur ${N}</h2>
        <p>${N - n ? `Encore ${N - n} à découvrir à ${esc(c.name)}.` : `Tu as complété ${esc(c.name)}. Bravo !`}</p>
        <div class="xp"><span>Niveau ${lvl} · ${fmt(S.xp)} XP</span><div class="bar"><i style="width:${into / 2.5}%"></i></div></div></div></div>
    <div class="daily ${doneToday ? 'done' : ''}">
      <span class="ic">${doneToday ? FLAME : shape(daily ? KINDS[daily.k][1] : 'statue')}</span>
      <div><span class="eyebrow">${doneToday ? 'Série gardée' : "Défi du jour"}</span>
        <b>${doneToday ? `${streakNow()} jour${streakNow() > 1 ? 's' : ''} de suite. Reviens demain !` : daily ? `Débloque « ${esc(daily.n)} » : XP doublée` : 'Débloque un lieu aujourd\'hui'}</b>
        <span>${doneToday ? (daily ? `Demain, un nouveau lieu du jour.` : '') : `Un lieu par jour garde ta série${streakNow() ? ` de ${streakNow()} jour${streakNow() > 1 ? 's' : ''}` : ''}.`}</span></div>
      ${!doneToday && daily ? `<button class="go" data-p="${daily.id}">Voir</button>` : ''}</div>
    <div class="share-row"><button class="btn gold" id="v-story">Partager ma ville</button><button class="btn ghost" id="v-explore">Explorer</button></div>
    <div class="sec"><h3>Les lieux de ${esc(c.name)}</h3><span>${here ? 'du plus proche au plus loin' : 'active le GPS pour les distances'}</span></div>
    <div class="chips" role="group" aria-label="Filtrer">
      ${[['tous', 'Tous'], ['todo', 'À découvrir'], ['got', 'Débloqués']].concat(kinds.map(k => [k, KINDS[k][0]])).map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join('')}
    </div>
    <div class="places">${list.slice(0, listMax).map(x => placeRow(c, x, here)).join('') || '<div class="empty">Aucun lieu dans ce filtre.</div>'}</div>
    ${list.length > listMax ? `<button class="btn ghost more" id="v-more">Afficher ${Math.min(40, list.length - listMax)} lieux de plus</button>` : ''}
    <p class="fine" style="margin-top:18px">Lieux © contributeurs <a class="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>. Il manque un lieu ? Ajoute-le sur OpenStreetMap : il apparaîtra dans Monuverse.</p>`;
  $$('#s-ville [data-p]').forEach(b => b.onclick = () => openPlace(b.dataset.p));
  $$('#s-ville [data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; listMax = 40; renderVille(); });
  if ($('#v-more')) $('#v-more').onclick = () => { listMax += 40; renderVille(); };
  $('#v-story').onclick = shareStory;
  $('#v-explore').onclick = () => go('scan');
  fillPhotos($('#s-ville'));
}

/* ---------- Fiche d'un lieu ---------- */
function cardHTML(c, p, photo, reveal) {
  const i = c.places.indexOf(p) + 1;
  return `<div class="card r-${p.r} ${p.r} ${reveal ? 'reveal' : ''}"><div class="card-in">
    <div class="ct"><span>#${String(i).padStart(3, '0')}</span><span>${esc(c.name.toUpperCase())}</span></div>
    <div class="art">${photo ? `<img src="${photo}" alt="Ta photo de ${esc(p.n)}">` : shape(KINDS[p.k][1])}</div>
    <div class="rar">${RAR[p.r][0]} · +${RAR[p.r][1]} XP</div>
    <div class="nm">${esc(p.n)}</div>
    <div class="fact">${KINDS[p.k][4]}</div></div></div>`;
}
async function openPlace(id) {
  const c = city(), p = c.places.find(x => x.id === id); if (!p) return;
  const g = got(c, p), here = fresh() ? GPS.pos : null, photo = g ? await PhotoDB.url(p.id) : null;
  const d = here ? dist(here, p) : null, near = here && inRange(p, here);
  const maps = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=walking`;
  const s = sheet(`<div class="tag">${g ? 'Dans ta collection' : 'À découvrir'}</div>
    ${cardHTML(c, p, photo)}
    ${g ? `<p>Débloqué le ${new Date(c.scanned[p.id].t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>`
      : `<p>${d !== null ? `À ${distTxt(d)}, vers le ${cardinal(bearing(here, p))}. ` : ''}Approche-toi à moins de ${p.rad} m pour le débloquer.</p>`}
    ${!g && near ? `<button class="btn sea" id="pl-scan">Débloquer ce lieu</button>` : ''}
    ${g && !photo ? `<button class="btn ghost" id="pl-photo">Ajouter ma photo souvenir</button>` : ''}
    <div class="row2"><a class="btn ghost" href="${maps}" target="_blank" rel="noopener">Y aller</a>${p.w ? `<a class="btn ghost" href="${p.w}" target="_blank" rel="noopener">En savoir plus</a>` : '<button class="btn ghost" data-close>Fermer</button>'}</div>`);
  if ($('#pl-scan')) $('#pl-scan').onclick = () => unlock(p);
  if ($('#pl-photo')) $('#pl-photo').onclick = async () => { const f = await askPhoto(); if (!f) return; try { await PhotoDB.put(p.id, await shrink(f)); s.remove(); openPlace(p.id); refresh(); } catch (e) { toast("La photo n'a pas pu être enregistrée.", true); } };
}

/* ---------- Débloquer : GPS obligatoire, photo souvenir facultative ---------- */
async function unlock(p, gift = false) {
  const c = city();
  if (got(c, p)) return;
  if (!gift && !(fresh() && inRange(p))) { toast(`Rapproche-toi de « ${p.n} » pour le débloquer.`, true); return; }
  let photo = null;
  if (!gift) {
    const s = sheet(`<div class="tag">Tu y es !</div><h3>${esc(p.n)}</h3><p>Prends une photo souvenir : elle deviendra l'image de ta carte.</p>
      <button class="btn gold" id="u-photo">Prendre la photo</button><button class="btn ghost" id="u-skip">Débloquer sans photo</button>`);
    photo = await new Promise(res => {
      $('#u-photo').onclick = async () => { const f = await askPhoto(); res(f || null); };
      $('#u-skip').onclick = () => res(null);
    });
    s.remove();
    if (photo) { try { await PhotoDB.put(p.id, await shrink(photo)); } catch (e) { photo = null; } }
  }
  const daily = !gift && dailyPlace(c) === p && !S.dailyBonus[today()];
  let xp = RAR[p.r][1] * (daily ? 2 : 1);
  const lv0 = level(), had = scannedToday();
  c.scanned[p.id] = { t: Date.now(), gift: gift || undefined, photo: !!photo || undefined };
  if (daily) S.dailyBonus = { [today()]: true };
  if (!gift) {
    if (!had) { S.streak = { n: S.streak.last === dayBefore(today()) ? S.streak.n + 1 : 1, last: today() }; }
  }
  const p0 = pct(c);
  const extra = [];
  if (p0 >= 50 && Math.round(100 * (nGot(c) - 1) / c.places.length) < 50) { xp += 100; extra.push('Moitié de la ville : +100 XP'); }
  if (p0 === 100) { xp += 300; extra.push('Ville complétée : +300 XP'); }
  S.xp += xp; save(); LB.sync();
  buzz([30, 40, 60]);
  const url = await PhotoDB.url(p.id);
  const burst = calm() ? '' : `<div class="burst" aria-hidden="true">${Array.from({ length: 22 }, (_, k) => `<i style="--a:${k * 360 / 22}deg;--r:${110 + (k * 37) % 70}px;--c:${['#F5B841', '#4FE0CF', '#B07CF2', '#FFE2A0'][k % 4]}"></i>`).join('')}</div>`;
  sheet(`<div class="tag">${gift ? 'Cadeau de bienvenue' : 'Nouveau lieu débloqué'}</div>${burst}
    ${cardHTML(c, p, url, true)}
    <div class="rewards"><span class="hi">+${xp} XP</span>${daily ? '<span>Lieu du jour ×2</span>' : ''}${!gift && !had ? `<span>Série : ${S.streak.n} jour${S.streak.n > 1 ? 's' : ''}</span>` : ''}${level() > lv0 ? `<span class="hi">Niveau ${level()} !</span>` : ''}${extra.map(e => `<span class="hi">${e}</span>`).join('')}</div>
    <p>${nGot(c)} lieu${nGot(c) > 1 ? 'x' : ''} sur ${c.places.length} à ${esc(c.name)} · ${p0} %</p>
    <div class="row2"><button class="btn ghost" id="r-share">Partager</button><button class="btn gold" data-close>Continuer</button></div>`, refresh);
  $('#r-share').onclick = shareStory;
  refresh();
}
function refresh() { header(); ({ ville: renderVille, scan: renderScan, rank: renderRank, globe: renderGlobe, moi: renderMoi })[tab](); }

/* ---------- Écran : Explorer (radar + lieu le plus proche) ---------- */
let scanSub = null;
function renderScan() {
  const c = city(); if (!c) return;
  header();
  if (!scanSub) { let lastR = 0; scanSub = () => { nearBadge(); if (tab === 'scan' && !document.querySelector('.sheet') && Date.now() - lastR > 2500) { lastR = Date.now(); renderScan(); } }; GPS.subs.add(scanSub); }
  const el = $('#s-scan');
  if (GPS.err === 'denied' || GPS.err === 'none') {
    el.innerHTML = `<div class="gps bad"><i></i><div><b>GPS désactivé</b><br><span>Monuverse a besoin de ta position pour vérifier que tu es devant un lieu.</span></div></div>
      <div class="note"><b>Pour l'activer</b><span>Sur iPhone : Réglages › Confidentialité › Service de localisation › ton navigateur › « Lorsque l'app est active ». Sur Android : touche le cadenas à gauche de l'adresse › Autorisations › Position.</span><span>Puis recharge la page.</span></div>`;
    return;
  }
  if (!GPS.pos) {
    el.innerHTML = `<div class="gps"><i></i><div><b>Recherche de ta position…</b><br><span>Autorise la localisation si ton téléphone te le demande.</span></div></div><div class="spinner" style="margin:40px auto"></div>`;
    return;
  }
  const me = GPS.pos, acc = Math.round(me.acc);
  const left = c.places.filter(p => !got(c, p)).map(p => ({ p, d: dist(me, p) })).sort((a, b) => a.d - b.d);
  const near = left[0];
  const daily = dailyPlace(c);
  const R = 600, around = c.places.map(p => ({ p, d: dist(me, p), b: bearing(me, p) })).filter(x => x.d <= R);
  const dots = around.map(({ p, d, b }) => {
    const rr = d / R * 130, a = (b - 90) * Math.PI / 180, x = 150 + rr * Math.cos(a), y = 150 + rr * Math.sin(a);
    return `<g class="dot ${got(c, p) ? 'got' : ''} ${daily === p ? 'today' : ''}" data-p="${p.id}" role="button" tabindex="0" aria-label="${esc(p.n)}, ${distTxt(d)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${got(c, p) ? 5 : 7}" fill="var(--r-${p.r})"/></g>`;
  }).join('');
  const ir = near && inRange(near.p, me);
  el.innerHTML = `
    <div class="gps ${acc <= 30 ? 'ok' : acc <= 100 ? 'warn' : 'bad'}"><i></i><div><b>${acc <= 100 ? 'Position trouvée' : 'Position imprécise'}</b> <span>· précision ${acc} m${acc > 100 ? ' : sors à découvert' : ''}</span></div></div>
    <div class="radar"><svg viewBox="0 0 300 300" aria-label="Radar des lieux autour de toi">
      <defs><radialGradient id="radar-g"><stop offset="0" stop-color="rgba(79,224,207,.14)"/><stop offset="1" stop-color="${document.documentElement.dataset.theme === 'light' ? 'rgba(255,255,255,.95)' : 'rgba(16,25,45,.9)'}"/></radialGradient>
      <linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="rgba(79,224,207,0)"/><stop offset="1" stop-color="rgba(79,224,207,.35)"/></linearGradient></defs>
      <circle class="bg" cx="150" cy="150" r="140"/>
      <circle class="rg" cx="150" cy="150" r="43"/><circle class="rg" cx="150" cy="150" r="87"/><circle class="rg" cx="150" cy="150" r="130"/>
      <text class="lbl" x="150" y="22" text-anchor="middle">N</text><text class="lbl" x="154" y="104">200 m</text><text class="lbl" x="154" y="61">400 m</text>
      ${calm() ? '' : '<path class="sweep" d="M150 150 L150 20 A130 130 0 0 1 242 58 Z" fill="url(#sw)"/>'}
      ${dots}<circle class="me-dot" cx="150" cy="150" r="7"/></svg></div>
    ${near ? `<div class="target r-${near.p.r} ${ir ? 'inrange' : ''}">
      <div class="row"><span class="ic">${shape(KINDS[near.p.k][1])}</span><div><span class="eyebrow">${ir ? 'Tu y es' : 'Le plus proche'}</span><b>${esc(near.p.n)}</b><span>${KINDS[near.p.k][0]} · ${RAR[near.p.r][0]}${daily === near.p ? ' · lieu du jour ×2' : ''}</span></div></div>
      ${ir ? `<button class="btn sea" id="sc-go">Débloquer ce lieu</button>`
        : `<div class="dir"><span style="display:inline-flex;transform:rotate(${bearing(me, near.p).toFixed(0)}deg)">${ARROW}</span><div><b>${distTxt(near.d)}</b> vers le ${cardinal(bearing(me, near.p))}<br><span>Débloquable à moins de ${near.p.rad} m</span></div></div>
           <a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${near.p.lat},${near.p.lon}&travelmode=walking" target="_blank" rel="noopener">Itinéraire à pied</a>`}
    </div>` : `<div class="empty">Tu as débloqué tous les lieux de ${esc(c.name)} ! Change de ville pour continuer.</div>`}
    ${near && near.d > 20000 ? `<p class="fine" style="margin-top:12px">Tu sembles loin de ${esc(c.name)}. Touche le nom de la ville en haut pour collectionner la ville où tu te trouves.</p>` : ''}`;
  if ($('#sc-go')) $('#sc-go').onclick = () => unlock(near.p);
  $$('#s-scan [data-p]').forEach(g => { g.onclick = () => openPlace(g.dataset.p); g.onkeydown = e => { if (e.key === 'Enter') openPlace(g.dataset.p); }; });
}
function nearBadge() {
  const c = city(); const t = $('.tab.scan'); if (!c || !t) return;
  t.classList.toggle('near', !!(fresh() && c.places.some(p => !got(c, p) && inRange(p))));
}

/* ---------- Écran : Classement ---------- */
let rankScope = 'ville';
async function renderRank() {
  const c = city(); if (!c) return;
  header();
  const el = $('#s-rank');
  const dep = c.dep || c.region || c.country;
  const top = `<div class="seg" role="group"><button data-sc="ville" aria-pressed="${rankScope === 'ville'}">${esc(c.name)}</button><button data-sc="dep" aria-pressed="${rankScope === 'dep'}">${esc(dep)}</button></div>`;
  const mine = `<div class="note"><b>${esc(pseudo())} · ${fmt(S.xp)} points</b><span>${totalPlaces()} lieu${totalPlaces() > 1 ? 'x' : ''} débloqué${totalPlaces() > 1 ? 's' : ''} · niveau ${level()} · série de ${streakNow()} jour${streakNow() > 1 ? 's' : ''}</span></div>`;
  const bind = () => $$('#s-rank [data-sc]').forEach(b => b.onclick = () => { rankScope = b.dataset.sc; renderRank(); });
  if (!S.pseudo) {
    el.innerHTML = top + `<div class="note" style="margin-bottom:12px"><b>Choisis ton pseudo pour entrer au classement</b><span>Il sera visible par les autres joueurs. Pas ton vrai nom de famille !</span>
      <form id="rk-form" class="search-row"><input id="rk-ps" maxlength="20" minlength="2" required placeholder="Ton pseudo" aria-label="Ton pseudo"><button class="btn gold small">Valider</button></form></div>` + mine;
    bind();
    $('#rk-form').onsubmit = e => { e.preventDefault(); setPseudo($('#rk-ps').value); renderRank(); };
    return;
  }
  if (!LB.on) {
    el.innerHTML = top + mine + `<div class="note" style="margin-top:12px"><b>Le classement en ligne ouvre bientôt</b><span>Continue à collectionner : tes points comptent déjà et apparaîtront dès l'ouverture.</span></div>`;
    bind(); return;
  }
  el.innerHTML = top + `<div class="lb" id="lb"><div class="spinner" style="margin:30px auto"></div></div>` + mine;
  bind();
  try {
    LB.sync();
    const rows = rankScope === 'ville' ? await LB.top('ville_id', c.id) : await LB.top('departement', `${c.dep}|${c.cc}`);
    const me = LB.uid();
    $('#lb').innerHTML = rows.length ? rows.map((r, i) => `<div class="lb-row ${r.id === me ? 'me' : ''} ${i < 3 ? 'top' : ''}"><span class="rk">${i + 1}</span><span>${esc(r.pseudo)}${rankScope === 'dep' ? `<small>${esc(r.ville)}</small>` : ''}</span><span class="pts">${fmt(r.points)}</span></div>`).join('')
      : `<div class="empty">Personne encore ici. Débloque un lieu et deviens le premier collectionneur de ${esc(rankScope === 'ville' ? c.name : dep)} !</div>`;
  } catch (e) {
    $('#lb').innerHTML = `<div class="empty">Le classement n'a pas pu être chargé. Vérifie ta connexion.</div>`;
  }
}
function setPseudo(v) {
  v = String(v || '').trim().replace(/\s+/g, ' ').slice(0, 20);
  if (v.length < 2) { toast('Ton pseudo doit faire au moins 2 caractères.', true); return false; }
  S.pseudo = v; save(); LB.sync(); header(); return true;
}

/* ---------- Story à partager (1080 × 1920) ---------- */
async function storyBlob() {
  const c = city(), W = 1080, H = 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  try { await Promise.all(['800 64px Unbounded', '700 40px Unbounded', '600 40px Figtree', '700 40px JetBrains Mono'].map(f => document.fonts.load(f))); } catch (e) {}
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1430'); g.addColorStop(.55, '#070C1A'); g.addColorStop(1, '#1A1240'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const glow = (cx, cy, r, col) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); };
  glow(900, 160, 520, 'rgba(139,124,246,.30)'); glow(120, 900, 600, 'rgba(79,224,207,.12)'); glow(540, 1900, 700, 'rgba(245,184,65,.16)');
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  x.fillStyle = '#fff'; for (let i = 0; i < 140; i++) { x.globalAlpha = .25 + rnd() * .6; x.beginPath(); x.arc(rnd() * W, rnd() * H * .7, rnd() * 2.2 + .4, 0, 7); x.fill(); } x.globalAlpha = 1;
  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = '800 52px Unbounded, sans-serif'; x.fillStyle = '#EEF2FA'; x.fillText('MONU', W / 2 - 92, 150); x.fillStyle = '#F5B841'; x.fillText('VERSE', W / 2 + 112, 150);
  x.font = '600 38px Figtree, sans-serif'; x.fillStyle = '#8F9CB7'; x.fillText('Je collectionne', W / 2, 270);
  // nom de la ville sur 1 ou 2 lignes
  let fs = 104; x.font = `800 ${fs}px Unbounded, sans-serif`;
  const words = c.name.split(/(?<=[\s-])/); const lines = []; let cur = '';
  for (const w of words) { if (x.measureText(cur + w).width > W - 140 && cur) { lines.push(cur); cur = w; } else cur += w; }
  lines.push(cur); while (lines.length > 2) { fs -= 10; x.font = `800 ${fs}px Unbounded, sans-serif`; lines.splice(0, lines.length, c.name); }
  while (x.measureText(lines.reduce((a, b) => a.length > b.length ? a : b)).width > W - 120 && fs > 50) { fs -= 6; x.font = `800 ${fs}px Unbounded, sans-serif`; }
  x.fillStyle = '#EEF2FA'; lines.forEach((l, i) => x.fillText(l.trim(), W / 2, 390 + i * (fs + 14)));
  const top = 390 + (lines.length - 1) * (fs + 14);
  // anneau
  const cx = W / 2, cy = top + 330, r = 210, p = pct(c);
  x.lineWidth = 34; x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
  const rg = x.createLinearGradient(cx - r, 0, cx + r, 0); rg.addColorStop(0, '#C8862A'); rg.addColorStop(.6, '#F5B841'); rg.addColorStop(1, '#FFE2A0');
  x.strokeStyle = rg; x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.max(.02, p / 100) * Math.PI * 2); x.stroke();
  x.fillStyle = '#EEF2FA'; x.font = '800 120px Unbounded, sans-serif'; x.fillText(`${p}%`, cx, cy + 40);
  x.font = '600 36px Figtree, sans-serif'; x.fillStyle = '#8F9CB7'; x.fillText(`${nGot(c)} lieux sur ${c.places.length}`, cx, cy + 100);
  // stats
  const sy = cy + r + 120, stats = [[`${streakNow()}`, 'jours de suite'], [fmt(S.xp), 'XP'], [`${level()}`, 'niveau']];
  stats.forEach(([v, l], i) => { const sx = W / 2 + (i - 1) * 320; x.fillStyle = '#F5B841'; x.font = '700 70px "JetBrains Mono", monospace'; x.fillText(v, sx, sy); x.fillStyle = '#8F9CB7'; x.font = '600 30px Figtree, sans-serif'; x.fillText(l, sx, sy + 48); });
  // 3 dernières cartes
  const last = Object.entries(c.scanned).sort((a, b) => b[1].t - a[1].t).slice(0, 3).map(([id]) => c.places.find(q => q.id === id)).filter(Boolean);
  const cw = 280, ch = 360, gap = 40, y0 = sy + 120, x0 = W / 2 - (last.length * cw + (last.length - 1) * gap) / 2;
  const col = { commune: '#A9B6CC', rare: '#5B9DF0', epique: '#B07CF2', legendaire: '#F5B841' };
  const rrect = (X, Y, w, h, rad) => { x.beginPath(); x.moveTo(X + rad, Y); x.arcTo(X + w, Y, X + w, Y + h, rad); x.arcTo(X + w, Y + h, X, Y + h, rad); x.arcTo(X, Y + h, X, Y, rad); x.arcTo(X, Y, X + w, Y, rad); x.closePath(); };
  for (let i = 0; i < last.length; i++) {
    const q = last[i], X = x0 + i * (cw + gap), Y = y0 + (i === 1 ? -20 : 10);
    x.save(); x.translate(X + cw / 2, Y + ch / 2); x.rotate((i - 1) * .05); x.translate(-cw / 2, -ch / 2);
    x.fillStyle = col[q.r]; rrect(0, 0, cw, ch, 28); x.fill();
    x.fillStyle = '#10192D'; rrect(6, 6, cw - 12, ch - 12, 23); x.fill();
    const u = await PhotoDB.url(q.id);
    const img = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u || ('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -10 90 80" width="270" height="240"><g fill="${col[q.r]}">${SHAPES[KINDS[q.k][1]]}</g></svg>`)); });
    x.save(); rrect(18, 18, cw - 36, 230, 16); x.clip(); x.fillStyle = '#0B1322'; x.fillRect(18, 18, cw - 36, 230);
    if (img) { const k = Math.max((cw - 36) / img.width, 230 / img.height); x.drawImage(img, 18 + (cw - 36 - img.width * k) / 2, 18 + (230 - img.height * k) / 2, img.width * k, img.height * k); }
    x.restore();
    x.textAlign = 'left'; x.fillStyle = col[q.r]; x.font = '700 20px "JetBrains Mono", monospace'; x.fillText(RAR[q.r][0].toUpperCase(), 22, 282);
    x.fillStyle = '#EEF2FA'; x.font = '700 26px Figtree, sans-serif'; let t = q.n; while (x.measureText(t).width > cw - 44 && t.length > 4) t = t.slice(0, -2); if (t !== q.n) t = t.trim() + '…'; x.fillText(t, 22, 322);
    x.textAlign = 'center'; x.restore();
  }
  x.fillStyle = '#EEF2FA'; x.font = '700 40px Figtree, sans-serif'; x.fillText('Et toi, tu as combien de lieux dans ta ville ?', W / 2, H - 170);
  x.fillStyle = '#4FE0CF'; x.font = '700 32px "JetBrains Mono", monospace'; x.fillText((location.host + location.pathname).replace(/\/$/, '').replace(/index\.html$/, '') || 'monuverse', W / 2, H - 110);
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function shareStory() {
  const s = sheet(`<div class="tag">Ta story</div><div class="story-prev"><div class="spinner" style="margin:120px auto"></div></div>
    <div class="row2"><button class="btn gold" id="st-share" disabled>Partager</button><button class="btn ghost" data-close>Fermer</button></div>`);
  const blob = await storyBlob(); if (!blob) { toast("L'image n'a pas pu être créée.", true); return; }
  const url = URL.createObjectURL(blob);
  s.querySelector('.story-prev').innerHTML = `<img src="${url}" alt="Ta story Monuverse">`;
  const file = new File([blob], `monuverse-${city().name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, { type: 'image/png' });
  const btn = $('#st-share'); btn.disabled = false;
  const canFiles = navigator.canShare && navigator.canShare({ files: [file] });
  btn.textContent = canFiles ? 'Partager' : 'Enregistrer l\'image';
  btn.onclick = async () => {
    if (canFiles) { try { await navigator.share({ files: [file], text: `Je collectionne ${city().name} sur Monuverse : ${pct(city())} % !` }); } catch (e) {} return; }
    const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  };
}

/* ---------- Thème clair / sombre ---------- */
const darkQ = matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const t = S.theme === 'light' || S.theme === 'dark' ? S.theme : (darkQ.matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = t;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#F3F5FA' : '#070C1A';
}
darkQ.addEventListener && darkQ.addEventListener('change', () => { if (S.theme === 'auto') { applyTheme(); if (tab === 'globe') renderGlobe(); } });

/* ---------- Écran : Moi ---------- */
function renderMoi() {
  header();
  const cities = Object.values(S.cities).sort((a, b) => nGot(b) - nGot(a));
  const ncc = new Set(cities.filter(c => nGot(c)).map(c => c.cc)).size;
  $('#s-moi').innerHTML = `
    <div class="note" style="margin-top:6px"><b>${esc(pseudo())} · ${fmt(S.xp)} XP · niveau ${level()}</b><span>${totalPlaces()} lieu${totalPlaces() > 1 ? 'x' : ''} dans ${cities.length} ville${cities.length > 1 ? 's' : ''} et ${ncc} pays · série en cours : ${streakNow()} jour${streakNow() > 1 ? 's' : ''}</span></div>
    <form id="pf-form" class="field" style="margin-top:14px"><label for="pf-ps">Pseudo (visible au classement)</label><div class="search-row"><input id="pf-ps" maxlength="20" minlength="2" value="${esc(S.pseudo)}" placeholder="Ton pseudo"><button class="btn ghost small">Enregistrer</button></div></form>
    <div class="sec"><h3>Mes villes</h3><span>${cities.length}</span></div>
    <div class="places">${cities.map(c => `<button class="pl ${c.id === S.current ? 'got' : 'locked'}" data-c="${c.id}"><span class="ic">${shape('columns')}</span><div><b>${esc(c.name)}</b><span>${esc(c.dep || c.country)}</span></div><span class="rt"><span class="dist">${pct(c)} %</span><span class="gem">${nGot(c)}/${c.places.length}</span></span></button>`).join('')}</div>
    <div class="row2" style="margin-top:10px"><button class="btn gold" id="ct-here">La ville où je suis</button><button class="btn ghost" id="ct-add">Chercher une ville</button></div>
    <div class="sec"><h3>Réglages</h3></div>
    <div class="field"><span>Apparence</span><div class="seg three" role="group" aria-label="Apparence">${[['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button data-th="${k}" aria-pressed="${(S.theme || 'auto') === k}">${l}</button>`).join('')}</div></div>
    <div style="display:grid;gap:8px">
      <button class="btn ghost" id="pf-refresh">Mettre à jour les lieux de ${esc(city().name)}</button>
      <button class="btn ghost" id="pf-wipe">Effacer toutes mes données</button>
    </div>
    <p class="fine" style="margin-top:14px">Tes collections et tes photos restent sur ce téléphone. Seuls ton pseudo, ta ville et tes points sont envoyés au classement. Lieux © contributeurs OpenStreetMap (ODbL).</p>`;
  $('#pf-form').onsubmit = e => { e.preventDefault(); if (setPseudo($('#pf-ps').value)) { toast('Pseudo enregistré.'); renderMoi(); } };
  $$('#s-moi [data-c]').forEach(b => b.onclick = () => { S.current = b.dataset.c; save(); filter = 'tous'; go('ville'); });
  $$('#s-moi [data-th]').forEach(b => b.onclick = () => { S.theme = b.dataset.th; save(); applyTheme(); renderMoi(); });
  $('#ct-here').onclick = gpsCity;
  $('#ct-add').onclick = () => welcome(true);
  $('#pf-refresh').onclick = () => loadCity(city(), { force: true });
  $('#pf-wipe').onclick = () => {
    const b = $('#pf-wipe');
    if (b.dataset.sure) { LB.forget(); PhotoDB.clear(); try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); return; }
    b.dataset.sure = '1'; b.textContent = 'Touche encore pour tout effacer'; b.style.borderColor = 'var(--danger)'; b.style.color = 'var(--danger)';
  };
}
const openCities = () => go('moi');

/* ---------- Écran : Globe ---------- */
let worldP = null;
const loadWorld = () => worldP || (worldP = fetch('world.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => j.features.map(fixWinding)).catch(e => { worldP = null; throw e; }));
/* Un contour mal orienté remplirait tout le globe : on retourne les polygones plus grands qu'une demi-sphère */
function fixWinding(f) {
  if (typeof d3 === 'undefined') return f;
  const g = f.geometry, flip = poly => d3.geoArea({ type: 'Polygon', coordinates: poly }) > 2 * Math.PI ? poly.map(r => r.slice().reverse()) : poly;
  if (g.type === 'Polygon') g.coordinates = flip(g.coordinates); else if (g.type === 'MultiPolygon') g.coordinates = g.coordinates.map(flip);
  return f;
}
const GL = { proj: null, k: 1, timer: null, idle: 0, focus: null, vx: 0, vy: 0 };
const GMAX = 40;
async function renderGlobe() {
  header();
  const cities = Object.values(S.cities), started = cities.filter(c => nGot(c));
  const ccs = new Set(started.map(c => c.cc));
  $('#s-globe').innerHTML = `
    <div class="gstats"><div><b>${ccs.size}</b><span>pays</span></div><div><b>${started.length}</b><span>ville${started.length > 1 ? 's' : ''}</span></div><div><b>${totalPlaces()}</b><span>lieu${totalPlaces() > 1 ? 'x' : ''}</span></div></div>
    <div class="globe-wrap"><svg id="globe" role="img" aria-label="Globe de tes villes et pays"></svg>
      <div class="zoom"><button id="gz-in" aria-label="Zoomer">+</button><button id="gz-out" aria-label="Dézoomer">−</button><button id="gz-home" aria-label="Revenir sur ma ville"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button></div>
      <span class="ghint" id="ghint">Fais glisser ton doigt pour tourner la Terre</span></div>
    <div id="gfocus"></div>
    <p class="fine">Chaque ville que tu commences allume son pays en or. Voyage, collectionne, et remplis ton globe.</p>
    <button class="btn ghost" id="g-add" style="margin-top:12px">Ajouter une ville</button>`;
  $('#g-add').onclick = () => go('moi');
  let land;
  try { land = await loadWorld(); } catch (e) { $('#ghint').textContent = "Le globe n'a pas pu se charger. Vérifie ta connexion."; return; }
  if (tab !== 'globe' || typeof d3 === 'undefined') return;
  drawGlobe(land, ccs);
}
function drawGlobe(land, ccs) {
  const el = $('#globe'); if (!el) return;
  const w = el.clientWidth || 380, h = 380, base = Math.min(w, h) / 2 - 16;
  const c0 = city();
  const rot = GL.proj ? GL.proj.rotate() : [-(c0 ? c0.lon : 2), -(c0 ? c0.lat : 45) * .6, 0];
  const proj = d3.geoOrthographic().translate([w / 2, h / 2]).rotate(rot).clipAngle(90).precision(.6);
  GL.proj = proj;
  const path = d3.geoPath(proj);
  const svg = d3.select(el).attr('viewBox', `0 0 ${w} ${h}`);
  svg.selectAll('*').remove();
  const lightT = document.documentElement.dataset.theme === 'light';
  const oc = lightT ? ['#E3F0FB', '#BFD8F0', '#9DBFE3'] : ['#1B3A6E', '#0E2047', '#081430'];
  svg.append('defs').html(`<radialGradient id="g-ocean" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${oc[0]}"/><stop offset=".6" stop-color="${oc[1]}"/><stop offset="1" stop-color="${oc[2]}"/></radialGradient>
    <radialGradient id="g-atmo"><stop offset=".86" stop-color="#4FE0CF" stop-opacity="0"/><stop offset=".9" stop-color="#4FE0CF" stop-opacity=".35"/><stop offset="1" stop-color="#4FE0CF" stop-opacity="0"/></radialGradient>
    <radialGradient id="g-shade" cx="35%" cy="30%" r="80%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0A1A3A" stop-opacity="${lightT ? '.18' : '.45'}"/></radialGradient>`);
  const atmo = svg.append('circle').attr('class', 'atmo').attr('cx', w / 2).attr('cy', h / 2);
  const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('class', 'sphere');
  const grat = svg.append('path').datum(d3.geoGraticule10()).attr('class', 'grat');
  const lands = svg.append('g').selectAll('path').data(land).join('path').attr('class', d => 'land' + (ccs.has(d.properties.cc) ? ' visited' : ''));
  const shade = svg.append('path').datum({ type: 'Sphere' }).attr('class', 'shade');
  const cities = Object.values(S.cities);
  const R = 11, C = 2 * Math.PI * R;
  const pins = svg.append('g').selectAll('g').data(cities).join('g').attr('class', c => 'pin' + (c.id === S.current ? ' cur' : ''))
    .attr('role', 'button').attr('tabindex', 0).attr('aria-label', c => `${c.name}, ${pct(c)} %`);
  pins.append('circle').attr('class', 'bg').attr('r', 15);
  pins.append('circle').attr('class', 'tr').attr('r', R);
  pins.append('circle').attr('class', 'pr').attr('r', R).attr('transform', 'rotate(-90)').attr('stroke-dasharray', c => `${C * pct(c) / 100} ${C}`).attr('visibility', c => pct(c) ? null : 'hidden');
  pins.append('text').attr('class', 'pc').text(c => pct(c));
  pins.append('text').attr('class', 'lb').attr('x', 19).attr('y', 4).text(c => c.name);
  const me = svg.append('circle').attr('class', 'me').attr('r', 5);
  const update = () => {
    proj.scale(base * GL.k);
    atmo.attr('r', base * GL.k * 1.12);
    sphere.attr('d', path); grat.attr('d', path); lands.attr('d', path); shade.attr('d', path);
    const ctr = [-proj.rotate()[0], -proj.rotate()[1]];
    pins.attr('display', c => d3.geoDistance(ctr, [c.lon, c.lat]) < 1.5 ? null : 'none')
      .attr('transform', c => { const p = proj([c.lon, c.lat]); return p ? `translate(${p[0]},${p[1]})` : null; });
    pins.select('.lb').attr('display', GL.k >= 2.5 || cities.length < 4 ? null : 'none');
    const pos = GPS.pos;
    if (pos && d3.geoDistance(ctr, [pos.lon, pos.lat]) < 1.5) { const p = proj([pos.lon, pos.lat]); me.attr('display', null).attr('cx', p[0]).attr('cy', p[1]); } else me.attr('display', 'none');
  };
  GL.update = update;
  update();
  pins.on('click', (e, c) => { e.stopPropagation(); focusCity(c); }).on('keydown', (e, c) => { if (e.key === 'Enter') focusCity(c); });
  bindGlobe(el);
  $('#gz-in').onclick = () => zoomGlobe(GL.k * 2);
  $('#gz-out').onclick = () => zoomGlobe(GL.k / 2);
  $('#gz-home').onclick = () => { const c = city(); if (c) flyGlobe(c, 8); };
  if (GL.timer) GL.timer.stop();
  GL.timer = d3.timer(() => {
    if (tab !== 'globe' || !document.contains(el)) { GL.timer.stop(); GL.timer = null; return; }
    if (GL.drag || GL.flying) return;
    const r = proj.rotate();
    if (Math.abs(GL.vx) > .02 || Math.abs(GL.vy) > .02) { proj.rotate([r[0] + GL.vx, Math.max(-85, Math.min(85, r[1] + GL.vy)), 0]); GL.vx *= .94; GL.vy *= .94; update(); return; }
    if (GL.k > 1.3 || Date.now() - GL.idle < 2500) return;
    proj.rotate([r[0] + (calm() ? .06 : .15), r[1], 0]); update();
  });
  if (GL.focus && S.cities[GL.focus]) focusCity(S.cities[GL.focus], true);
}
function bindGlobe(el) {
  const pts = new Map(); let pinch = null, moved = 0;
  // Safari iOS : empêcher la page de défiler pendant qu'on tourne le globe
  ['touchstart', 'touchmove'].forEach(t => el.addEventListener(t, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
  el.addEventListener('gesturestart', e => e.preventDefault());
  el.addEventListener('wheel', e => { e.preventDefault(); GL.idle = Date.now(); setGZoom(GL.k * Math.exp(-e.deltaY * .0025)); }, { passive: false });
  el.addEventListener('pointerdown', e => { try { el.setPointerCapture(e.pointerId); } catch (x) {} pts.set(e.pointerId, [e.clientX, e.clientY]); GL.drag = true; GL.vx = GL.vy = 0; moved = 0; if (pts.size === 2) pinch = { d: spread(), k: GL.k }; });
  const spread = () => { const [a, b] = [...pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; };
  el.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const [px, py] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) { setGZoom(pinch.k * spread() / pinch.d); return; }
    const dx = e.clientX - px, dy = e.clientY - py; moved += Math.abs(dx) + Math.abs(dy);
    const r = GL.proj.rotate(), f = .3 / GL.k;
    GL.vx = dx * f; GL.vy = -dy * f;
    GL.proj.rotate([r[0] + dx * f, Math.max(-85, Math.min(85, r[1] - dy * f)), 0]); GL.update();
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { GL.drag = false; GL.idle = Date.now(); if (pinch !== null || moved < 4) GL.vx = GL.vy = 0; } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function setGZoom(k) { GL.k = Math.max(1, Math.min(GMAX, k)); GL.update && GL.update(); }
function zoomGlobe(k) {
  const k0 = GL.k, k1 = Math.max(1, Math.min(GMAX, k)); GL.idle = Date.now(); GL.flying = true;
  d3.select('#globe').transition().duration(calm() ? 0 : 500).tween('z', () => t => setGZoom(k0 * Math.pow(k1 / k0, t))).on('end interrupt', () => { GL.flying = false; });
}
function flyGlobe(c, k1) {
  const r0 = GL.proj.rotate(), k0 = GL.k, r1 = [r0[0] + ((-c.lon - r0[0] + 540) % 360 - 180), -c.lat, 0], ir = d3.interpolate(r0, r1);
  GL.flying = true;
  d3.select('#globe').transition().duration(calm() ? 0 : 1100).ease(d3.easeCubicInOut)
    .tween('f', () => t => { GL.proj.rotate(ir(t)); setGZoom(k0 * Math.pow(k1 / k0, t)); }).on('end interrupt', () => { GL.flying = false; GL.idle = Date.now(); });
}
function focusCity(c, silent) {
  GL.focus = c.id;
  if (!silent) flyGlobe(c, Math.max(GL.k, 8));
  const f = $('#gfocus'); if (!f) return;
  f.innerHTML = `<div class="gfocus"><b>${esc(c.name)}</b><span>${esc(c.country || c.dep)} · ${nGot(c)}/${c.places.length} lieux · ${pct(c)} %</span><button id="gf-open">${c.id === S.current ? 'Ouvrir' : 'Y jouer'}</button></div>`;
  $('#gf-open').onclick = () => { S.current = c.id; save(); filter = 'tous'; go('ville'); };
}

/* ---------- Accueil et chargement d'une ville ---------- */
function welcome(back) {
  show('welcome');
  $('#w-res').innerHTML = back ? `<button class="link" id="w-back">Revenir à ${esc(city().name)}</button>` : '';
  if (back) $('#w-back').onclick = () => show('main');
}
function gpsCity() {
  if (!('geolocation' in navigator)) { show('welcome'); $('#w-res').innerHTML = '<p class="msg err">Ton navigateur ne donne pas accès à la position. Cherche ta ville par son nom.</p>'; return; }
  show('loading'); $('#l-title').textContent = 'Où es-tu ?'; $('#l-sub').textContent = 'Autorise la localisation si ton téléphone te le demande.';
  navigator.geolocation.getCurrentPosition(async p => {
    GPS.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
    try { await loadCity(await cityAt(p.coords.latitude, p.coords.longitude)); }
    catch (e) { show('welcome'); $('#w-res').innerHTML = '<p class="msg err">Impossible de trouver ta ville. Vérifie ta connexion, ou cherche-la par son nom.</p>'; }
  }, e => {
    show('welcome');
    $('#w-res').innerHTML = `<p class="msg err">${e.code === 1 ? 'La localisation est refusée. Cherche ta ville par son nom, ou autorise la position dans les réglages de ton navigateur.' : 'Ta position est introuvable pour le moment. Cherche ta ville par son nom.'}</p>`;
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
}
async function loadCity(c, { force = false } = {}) {
  const old = S.cities[c.id];
  if (old && !force && old.places.length && old.ver === DATA_VER && Date.now() - (old.fetched || 0) < 14 * 864e5) { S.current = c.id; save(); filter = 'tous'; show('main'); go('ville'); return; }
  show('loading'); $('#l-title').textContent = `Recherche des lieux de ${c.name}…`; $('#l-sub').textContent = 'Statues, fontaines, églises, fresques, monuments : on parcourt la carte.';
  let places;
  try { places = await fetchPlaces(c); }
  catch (e) {
    if (old) { show('main'); go('ville'); toast("Les lieux n'ont pas pu être mis à jour. Réessaie plus tard.", true); return; }
    show('welcome'); $('#w-res').innerHTML = `<p class="msg err">La carte de ${esc(c.name)} n'a pas pu être chargée. Vérifie ta connexion et réessaie dans une minute.</p>`; return;
  }
  if (!places.length) { show('welcome'); $('#w-res').innerHTML = `<p class="msg err">Aucun lieu trouvé à ${esc(c.name)} pour le moment. Essaie la ville voisine, ou ajoute des lieux sur OpenStreetMap.</p>`; return; }
  const scanned = old ? Object.fromEntries(Object.entries(old.scanned).filter(([id]) => places.some(p => p.id === id))) : {};
  // garde les lieux déjà débloqués même s'ils ont disparu de la carte
  if (old) old.places.filter(p => old.scanned[p.id] && !places.some(q => q.id === p.id)).forEach(p => { places.push(p); scanned[p.id] = old.scanned[p.id]; });
  S.cities[c.id] = Object.assign({}, c, { places, scanned, fetched: Date.now(), ver: DATA_VER });
  S.current = c.id; save(); filter = 'tous';
  show('main'); go('ville');
  if (!old) welcomeGift();
}
/* Premier plaisir immédiat : un lieu offert dès l'arrivée */
function welcomeGift() {
  const c = city();
  const gift = c.places.find(p => p.k === 'mairie') || c.places.find(p => p.r === 'commune' && p.named) || c.places[0];
  const s = sheet(`<div class="tag">Bienvenue à ${esc(c.name)}</div>
    <h3>${esc(c.name)} contient ${c.places.length} lieu${c.places.length > 1 ? 'x' : ''} à collectionner</h3>
    <p>Pour bien commencer, on t'offre ta première carte.</p>
    <button class="btn gold" id="g-open">Ouvrir ma première carte</button>`);
  $('#g-open').onclick = () => { s.remove(); unlock(gift, true); };
}

/* ---------- Démarrage ---------- */
$('#w-gps').onclick = gpsCity;
$('#w-form').onsubmit = async e => {
  e.preventDefault();
  const q = $('#w-q').value.trim(); if (q.length < 2) return;
  const res = $('#w-res'); res.innerHTML = '<p class="msg">Recherche…</p>';
  try {
    const list = await searchCities(q);
    res.innerHTML = list.length ? list.map((c, i) => `<button class="res" data-i="${i}"><b>${esc(c.name)}</b><span>${esc([c.dep, c.region !== c.dep ? c.region : '', c.country].filter(Boolean).join(' · '))}</span></button>`).join('')
      : '<p class="msg">Aucune ville trouvée. Vérifie l\'orthographe ou ajoute le pays, par exemple « Sainte-Rose Guadeloupe ».</p>';
    $$('#w-res [data-i]').forEach(b => b.onclick = () => loadCity(list[+b.dataset.i]));
  } catch (err) { res.innerHTML = '<p class="msg err">La recherche ne répond pas. Vérifie ta connexion et réessaie.</p>'; }
};
$$('.tab').forEach(b => b.onclick = () => go(b.dataset.tab));
$('#t-city').onclick = openCities;
$('#t-me').onclick = () => go('moi');
document.addEventListener('visibilitychange', () => { if (document.hidden) stopGPS(); else if (tab === 'scan') startGPS(); });

load();
applyTheme();
if (city() && city().ver !== DATA_VER && navigator.onLine !== false) loadCity(city());
else if (city()) { show('main'); go('ville'); } else show('welcome');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

/* © 2026 Monuverse. Tous droits réservés. Reproduction interdite sans autorisation (voir LICENSE.md). */
'use strict';
/* Anti-clickjacking : Monuverse ne fonctionne jamais à l'intérieur d'une autre page */
if (window.top !== window.self) {
  document.documentElement.innerHTML = '<body style="margin:0;font:16px system-ui;background:#070C1A;color:#EEF2FA;display:grid;place-items:center;height:100vh;text-align:center;padding:20px"><p>Pour ta sécurité, Monuverse s\'ouvre uniquement sur son propre site.<br>For your safety, Monuverse only opens on its own website.<br><br><a href="https://monuverse.fr/" target="_top" rel="noopener" style="color:#4FE0CF">Ouvrir Monuverse · Open Monuverse</a></p></body>';
  throw new Error('Monuverse ne peut pas être affiché dans un cadre.');
}
/* Monuverse v1 — une seule boucle : ta ville, ses vrais lieux, un scan par GPS, une série quotidienne, un classement local. */

const CFG = window.MONUVERSE_CONFIG || {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* ---------- Langue : français ou anglais selon le téléphone, modifiable dans « Moi » ---------- */
let LANG = 'fr';
const L = (fr, en) => LANG === 'en' ? en : fr;
const LOC = () => LANG === 'en' ? 'en-GB' : 'fr-FR';
const fmt = n => Math.round(n).toLocaleString(LOC());
const nPl = n => LANG === 'en' ? `${n} place${n !== 1 ? 's' : ''}` : `${n} lieu${n > 1 ? 'x' : ''}`;
const nDays = n => LANG === 'en' ? `${n} day${n !== 1 ? 's' : ''}` : `${n} jour${n > 1 ? 's' : ''}`;
const nCities = n => LANG === 'en' ? `${n} cit${n !== 1 ? 'ies' : 'y'}` : `${n} ville${n > 1 ? 's' : ''}`;
const STATIC = {
  h1: ['Ta ville est une collection.', 'Your city is a collection.'],
  intro: ["Statues, fontaines, églises, fresques, monuments : approche-toi d'un lieu pour débloquer sa carte. Complète ta ville, garde ta série, grimpe au classement.", 'Statues, fountains, churches, murals, monuments: get close to a place to unlock its card. Complete your city, keep your streak, climb the leaderboard.'],
  gps: ['Trouver ma ville avec ma position', 'Find my city with my location'], or: ['ou', 'or'], q: ['Nom de ta ville ou de ton village', 'Name of your city, town or village'],
  search: ['Chercher', 'Search'],
  privacy: ["Les lieux viennent d'OpenStreetMap, la carte libre du monde. Ta position sert seulement à vérifier que tu es devant un lieu ; elle ne quitte pas ton téléphone.", "Places come from OpenStreetMap, the free map of the world. Your location is only used to check that you are at a place; it never leaves your phone."],
  copy: ['© 2026 Monuverse. Tous droits réservés.', '© 2026 Monuverse. All rights reserved.'],
  cities: ['Les monuments de toutes les communes de France', 'Landmarks of every town in France'],
  loading: ['Recherche des lieux…', 'Looking for places…'], loadsub: ['On parcourt la carte de ta ville.', 'Scanning the map of your city.'],
  tville: ['Ma ville', 'My city'], tglobe: ['Globe', 'Globe'], tscan: ['Explorer', 'Explore'], trank: ['Classement', 'Ranking'], tmoi: ['Moi', 'Me']
};
const KINDS_EN = {
  mairie: ['Town hall', 'Where the life of the town is decided: council, weddings, civil records.'],
  cathedrale: ['Cathedral', "The bishop's church, often the largest building in town for centuries."],
  culte: ['Place of worship', 'Church, temple, mosque or synagogue: often one of the oldest buildings in the area.'],
  fontaine: ['Fountain', 'Before running water, people came here every day to draw water.'],
  statue: ['Statue', 'It honours a person or an idea that matters to the town.'],
  oeuvre: ['Artwork', 'A work of art installed in public space, for everyone to see.'],
  fresque: ['Mural', 'A wall turned into a giant painting by artists.'],
  aux_morts: ['War memorial', 'It bears the names of the townspeople who died in the wars. People gather here on remembrance days.'],
  memorial: ['Memorial', 'It keeps alive the memory of an event or a person.'],
  plaque: ['Memorial plaque', 'A plaque recalls that an event or a person left their mark here.'],
  monument: ['Monument', "A structure built to mark the town's history."],
  musee: ['Museum', 'The treasures and history of the place, gathered for all.'],
  chateau: ['Castle', 'Home of lords or a fortress, it has seen centuries of history.'],
  ruines: ['Ruins', 'Remains of an ancient building, witnesses of another era.'],
  porte: ['City gate', 'In the past, you entered the town through its gates, closed at night.'],
  croix: ['Wayside cross', 'Crosses and shrines marked roads and crossroads.'],
  phare: ['Lighthouse', 'Its light guides ships at night.'],
  moulin: ['Mill', 'Grain was ground here using wind or water.'],
  chateau_eau: ['Water tower', 'It keeps water up high so that it flows from the taps.'],
  belvedere: ['Viewpoint', 'The view of the surroundings is worth the trip.'],
  attraction: ['Sight', 'A place locals recommend to visitors.'],
  parc: ['Park', 'A green lung to walk and breathe.'],
  patrimoine: ['Heritage', "A piece of the town's historic heritage."],
  bibliotheque: ['Library', 'Books, films, games: culture open to everyone.'],
  culture: ['Cultural venue', "Theatre, arts centre or concert hall: the town's stage."],
  gare: ['Station', 'The gateway for travellers since the arrival of the railway.'],
  marche: ['Market', 'Where locals meet to shop and chat.'],
  kiosque: ['Bandstand', 'In the past, the brass band played here on Sundays.'],
  horloge: ['Clock', 'It has been telling passers-by the time for years.'],
  jeux: ['Playground', "The neighbourhood children's adventure ground."],
  sport: ['Sports facility', 'Stadium, gym or pool: where the town plays sport.'],
  salle: ['Community place', 'A meeting place for local groups and residents.']
};
const kindLabel = k => (LANG === 'en' && KINDS_EN[k] ? KINDS_EN[k][0] : KINDS[k][0]);
const kindFact = k => (LANG === 'en' && KINDS_EN[k] ? KINDS_EN[k][1] : KINDS[k][4]);
const RAR_EN = { commune: 'Common', rare: 'Rare', epique: 'Epic', legendaire: 'Legendary' };
const rarLabel = r => (LANG === 'en' ? RAR_EN[r] : RAR[r][0]);
/* Nom affiché : les noms génériques créés par Monuverse (« Aire de jeux · près de l'Église… ») sont traduits */
function pname(p) {
  let n = p.n;
  if (LANG !== 'en') return n;
  n = n.replace(/ n°(\d+)$/, ' no. $1');
  if (!p.named) {
    for (const k of Object.keys(KINDS)) if (n.startsWith(KINDS[k][0])) { n = KINDS_EN[k][0] + n.slice(KINDS[k][0].length); break; }
    n = n.replace(/ · près (?:de l'|du |de la |des |de )/, ' · near ').replace(/^Mairie\b/, 'Town hall');
  }
  return n;
}
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

/* ---------- Contrôle des données extérieures ----------
   Fichiers de données, réponses d'OpenStreetMap et sauvegarde du téléphone sont traités comme non fiables :
   chaque champ est vérifié, et tout ce qui ne correspond pas au format attendu est écarté. */
const OK_ID = /^[nwr]\d{1,12}$/, OK_CITY = /^([nwr]\d{1,12}|fr[0-9AB]{5}|x\d{1,12})$/, OK_WIKI = /^https:\/\/[a-z-]{2,12}\.wikipedia\.org\/wiki\/[^\s"'<>`]{1,300}$/;
const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
const txt = (v, max) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '').trim().slice(0, max) : '';
function cleanPlace(p) {
  if (!p || typeof p !== 'object' || !OK_ID.test(p.id) || !KINDS[p.k] || !RAR[p.r] || !num(p.lat, -90, 90) || !num(p.lon, -180, 180)) return null;
  const n = txt(p.n, 120); if (!n) return null;
  return { id: p.id, n, k: p.k, r: p.r, lat: p.lat, lon: p.lon, rad: num(p.rad, 10, 400) ? p.rad : KINDS[p.k][3], w: OK_WIKI.test(p.w || '') ? p.w : '', named: !!p.named };
}
const cleanPlaces = list => (Array.isArray(list) ? list : []).slice(0, 2000).map(cleanPlace).filter(Boolean);

/* ---------- Toilettage des noms et des doublons (même règles que outils/nettoyage.py) ---------- */
const SMALL = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'sur', 'sous', 'à', 'a', 'von', 'van', 'der', 'den', 'di', 'da', 'del', 'della', 'y', 'e', 'o', 'of', 'the', 'and']);
const ROMAN = /^[IVXLC]+$/;
function titleCase(t) {
  let first = true;
  return t.toLowerCase().replace(/[\p{L}\p{N}]+/gu, (w, i) => {
    const prev = t[i - 1] || ' ';
    let out;
    if (ROMAN.test(w.toUpperCase()) && w.length <= 4 && !/^(di|mi|li|ci|vi|il|lc)$/i.test(w)) out = w.toUpperCase();
    else if (!first && SMALL.has(w) && prev !== '-') out = w;
    else if (!first && (w === 'd' || w === 'l') && t[i + 1] && /['’]/.test(t[i + 1])) out = w;
    else out = w.charAt(0).toUpperCase() + w.slice(1);
    first = false;
    return out;
  });
}
function fixText(n) {
  n = n.replace(/\s+/g, ' ').trim();
  const q = /^["“„«‘'‹]\s*(.+?)\s*["”“»’'›]$/u.exec(n); if (q) n = q[1];
  n = n.replace(/\s*\|\s*/g, ' · ').replace(/\b(de|des|du|la|le|les|di|da|del|von|van)\s+\1\b/giu, '$1');
  const letters = n.match(/\p{L}/gu) || [];
  const latin = letters.filter(c => /[A-Za-zÀ-ɏ]/.test(c));
  if (latin.length > 4 && latin.length >= letters.length * .8 && latin.every(c => c === c.toUpperCase() && c !== c.toLowerCase()) && (/\s/.test(n) || latin.length > 8)) n = titleCase(n);
  else if (/^[a-zà-ÿ]/.test(n)) n = n.charAt(0).toUpperCase() + n.slice(1);
  return n.replace(ACCENTS_RE, w => ACCENTS[w.toLowerCase()] ? (w[0] === w[0].toUpperCase() ? ACCENTS[w.toLowerCase()][0].toUpperCase() + ACCENTS[w.toLowerCase()].slice(1) : ACCENTS[w.toLowerCase()]) : w)
    .replace(/\bMonument aux Morts\b/g, 'Monument aux morts');
}
/* Accents perdus dans les noms écrits en majuscules (mots propres au français) */
const ACCENTS = { eglise: 'église', ecole: 'école', etang: 'étang', hotel: 'hôtel', chateau: 'château', theatre: 'théâtre', cimetiere: 'cimetière', musee: 'musée', riviere: 'rivière', fontaine: 'fontaine', cathedrale: 'cathédrale', chapelle: 'chapelle', calvaire: 'calvaire', etablissement: 'établissement', societe: 'société', notre: 'notre', place: 'place', marche: 'marché', mediatheque: 'médiathèque', bibliotheque: 'bibliothèque', college: 'collège', lycee: 'lycée', stade: 'stade', creche: 'crèche', prefecture: 'préfecture', sous: 'sous', gymnase: 'gymnase' };
const ACCENTS_RE = /\b(Eglise|Ecole|Etang|Chateau|Cimetiere|Musee|Riviere|Cathedrale|Etablissement|Mediatheque|Bibliotheque|Prefecture|Hotel(?= de [Vv]ille)|Theatre(?= (?:de|du|des|municipal))|Marche(?= (?:couvert|aux|de|du|des))|College(?= (?:de|du|des))|Lycee|Creche)\b/g;
/* « Mairie de Grand-Rivière » dans la commune « Grand'Rivière » : on reprend l'orthographe officielle de la commune */
function cityVariant(n, city) {
  if (!city) return n;
  const words = city.split(/[-'’\s]+/).filter(Boolean); if (words.length < 2) return n;
  const re = new RegExp('(^|[^\\p{L}])(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("[-'’\\s]+") + ')(?![\\p{L}])', 'iu');
  return n.replace(re, (m, a) => a + city);
}
const TOWNHALL = /mairie|h[oô]tel de ville|town ?hall|city hall|rathaus|gemeinde|stadtamt|marktgemeinde|ayuntamiento|municipio|comune|municipal|c[aâ]mara|prefeitura|belediye|gemeentehuis|stadhuis|δημαρχ|市役所|町役場|村役場|政府|ศาลา/i;
const DELEGUEE = /d[ée]l[ée]gu[ée]e|annexe|ortsverwaltung|ortsamt|bezirksamt|junta vecinal/i;
const GENERIC_HALL = new Set(['mairie', 'hotel de ville', 'rathaus', 'gemeindeamt', 'town hall', 'city hall', 'ayuntamiento', 'municipio', 'gemeentehuis', 'stadhuis', 'comune', 'municipalite']);
const FORMER = /\b(ancien(ne)?|ehem(alig\w*)?\.?|former|old|antigu[oa]|vecchi[oa]|alte[sr]?|eski)\b/i;
function tidyPlaces(list, city, scanned = {}) {
  const ps = list.map(p => Object.assign({}, p, { n: cityVariant(fixText(p.n), city) }));
  // une seule mairie par commune : la plus probable ; une « ancienne mairie » devient du patrimoine
  const halls = ps.filter(p => p.k === 'mairie');
  if (halls.length > 1) {
    const head = city ? nrm(city.split(/[-\s]/)[0]) : '';
    const score = p => { const v = nrm(p.n); return (scanned[p.id] ? 100 : 0) + (TOWNHALL.test(p.n) ? 4 : 0) + (city && v.includes(nrm(city)) ? 3 : 0) + (head.length > 2 && v.includes(head) ? 2 : 0)
      + (p.named ? 1 : 0) - (FORMER.test(p.n) ? 10 : 0) - (DELEGUEE.test(p.n) ? 4 : 0); };
    const best = halls.slice().sort((a, b) => score(b) - score(a))[0];
    for (const h of halls) {
      if (h === best) continue;
      const v = nrm(h.n), same = !h.named || v === nrm(best.n) || (city && v.includes(nrm(city))) || GENERIC_HALL.has(v);
      if (same && !FORMER.test(h.n) && !DELEGUEE.test(h.n) && !scanned[h.id]) h.drop = true;   // doublon de la mairie
      else h.k = 'patrimoine';                                                                     // autre bâtiment réel
    }
  }
  // doublons : même nom (nommé) à moins de 400 m pour le même type ou 100 m pour tout type ; lieux sans nom : à moins de 30 m
  const kept = [];
  const order = ps.filter(p => !p.drop).sort((a, b) => (!!scanned[b.id] - !!scanned[a.id]) || RAR_ORDER.indexOf(b.r) - RAR_ORDER.indexOf(a.r) || (b.named - a.named) || (!!b.w - !!a.w));
  for (const p of order) {
    const v = nrm(p.n);
    const twin = kept.find(q => nrm(q.n) === v && (p.named && q.named ? (q.k === p.k ? dist(p, q) < 400 : dist(p, q) < 100) : dist(p, q) < 30));
    if (twin && !scanned[p.id]) { if (!twin.w && p.w) twin.w = p.w; continue; }
    kept.push(p);
  }
  // même nom affiché pour des lieux différents : on les numérote (ordre stable par identifiant)
  const groups = {};
  kept.forEach(p => { (groups[nrm(p.n)] = groups[nrm(p.n)] || []).push(p); });
  Object.values(groups).forEach(g => { if (g.length > 1) g.sort((a, b) => a.id.localeCompare(b.id)).forEach((p, i) => { if (i) p.n = `${p.n} n°${i + 1}`; }); });
  return kept;
}
function cleanCity(c) {
  if (!c || typeof c !== 'object' || !OK_CITY.test(c.id) || !num(c.lat, -90, 90) || !num(c.lon, -180, 180)) return null;
  const out = { id: c.id, name: txt(c.name, 80) || 'Ma ville', lat: c.lat, lon: c.lon, dep: txt(c.dep, 80), region: txt(c.region, 80), country: txt(c.country, 60),
    cc: /^[A-Z]{2}$/.test(c.cc) ? c.cc : '', osmType: /^(node|way|relation)$/.test(c.osmType) ? c.osmType : undefined, osmId: num(c.osmId, 1, 1e13) ? c.osmId : undefined,
    insee: /^[0-9AB]{5}$/.test(c.insee || '') ? c.insee : undefined, n: num(c.n, 0, 1e6) ? c.n : undefined };
  if (Array.isArray(c.places)) out.places = tidyPlaces(cleanPlaces(c.places), out.name, out.scanned || (c.scanned && typeof c.scanned === 'object' ? c.scanned : {}));
  if (c.scanned && typeof c.scanned === 'object') out.scanned = Object.fromEntries(Object.entries(c.scanned).filter(([k, v]) => OK_ID.test(k) && v && num(v.t, 0, 1e14)).map(([k, v]) => [k, { t: v.t, gift: v.gift === true || undefined, photo: v.photo === true || undefined }]));
  if (num(c.fetched, 0, 1e14)) out.fetched = c.fetched;
  if (num(c.ver, 0, 99)) out.ver = c.ver;
  return out;
}

/* ---------- Données OpenStreetMap ---------- */
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

function cityFromNominatim(r) { return cleanCity(cityFromNominatimRaw(r)); }
function cityFromNominatimRaw(r) {
  const a = r.address || {};
  const name = r.name || a.city || a.town || a.village || a.municipality || a.hamlet || (r.display_name || '').split(',')[0];
  return {
    id: (r.osm_type || 'x')[0] + r.osm_id, osmType: r.osm_type, osmId: r.osm_id,
    name, lat: +r.lat, lon: +r.lon,
    dep: a.county || a.state_district || a.state || '', region: a.state || '', country: a.country || '', cc: (a.country_code || '').toUpperCase()
  };
}
/* ---------- France et outre-mer : données préparées à l'avance (data/fr), sans limite de serveur ---------- */
const nrm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-'’\s]+/g, ' ').trim();
let frP = null;
const loadFR = () => frP || (frP = fetch('data/fr/communes.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(j => { j.norm = j.communes.map(c => nrm(c[1])); return j; }).catch(e => { frP = null; throw e; }));
const frCity = (j, row) => cleanCity({ id: 'fr' + row[0], insee: row[0], name: row[1], lat: row[2], lon: row[3], dep: j.deps[row[4]] || '', region: '', country: 'France', cc: 'FR', n: row[6] });
async function searchFR(q, max = 8) {
  const j = await loadFR(), v = nrm(q); if (v.length < 2) return [];
  const out = [];
  for (let i = 0; i < j.norm.length && out.length < max; i++) if (j.norm[i].startsWith(v)) out.push(i);
  if (out.length < max && v.length >= 3) for (let i = 0; i < j.norm.length && out.length < max; i++) if (!out.includes(i) && j.norm[i].includes(v)) out.push(i);
  return out.map(i => frCity(j, j.communes[i]));
}
const FR_BOX = [[41.2, 51.2, -5.6, 9.7], [15.8, 16.6, -61.9, -60.9], [14.3, 15, -61.3, -60.7], [2, 5.9, -54.7, -51.5], [-21.5, -20.8, 55.1, 55.9], [-13.1, -12.5, 44.9, 45.4]];
const inFR = (lat, lon) => FR_BOX.some(([a, b, c, d]) => lat >= a && lat <= b && lon >= c && lon <= d);
async function nearestFR(lat, lon) {
  const j = await loadFR(); let best = null, bd = Infinity;
  for (const r of j.communes) { const d = dist({ lat, lon }, { lat: r[2], lon: r[3] }); if (d < bd) { bd = d; best = r; } }
  return best && bd < 15000 ? frCity(j, best) : null;
}
async function searchCities(q) {
  const u = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=6&featureType=settlement&accept-language=${LANG}`;
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('search ' + r.status);
  return (await r.json()).map(cityFromNominatim).filter(Boolean);
}
async function cityAt(lat, lon) {
  if (inFR(lat, lon)) { try { const c = await nearestFR(lat, lon); if (c) return c; } catch (e) {} }
  const u = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10&addressdetails=1&accept-language=${LANG}`;
  const r = await fetch(u, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('reverse ' + r.status);
  const j = await r.json();
  if (!j || j.error) throw new Error('no city');
  const c = cityFromNominatim(j); if (!c) throw new Error('bad city');
  return c;
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
/* Pays préparés à l'avance (data/<pays>/) : on retrouve la commune, sinon on cherche en direct */
const idxP = {};
const loadIdx = cc => idxP[cc] || (idxP[cc] = fetch(`data/${cc.toLowerCase()}/communes.json`).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(j => { j.norm = j.communes.map(c => nrm(c[1])); return j; }).catch(e => { delete idxP[cc]; throw e; }));
async function preparedFile(c) {
  if (c.insee) return { path: `data/fr/${c.insee}.json`, check: () => loadFR() };
  if (!c.cc || c.cc === 'FR') return null;
  let j; try { j = await loadIdx(c.cc); } catch (e) { return null; }
  const rid = c.osmType === 'relation' ? 'r' + c.osmId : null, v = nrm(c.name);
  let row = rid && j.communes.find(r => r[0] === rid);
  if (!row) row = j.communes.filter((r, i) => j.norm[i] === v).sort((a, b) => dist(c, { lat: a[2], lon: a[3] }) - dist(c, { lat: b[2], lon: b[3] }))[0];
  if (row && dist(c, { lat: row[2], lon: row[3] }) > 25000) row = null;
  return row ? { path: `data/${c.cc.toLowerCase()}/${row[0]}.json`, empty: !row[6], region: row[4] } : null;
}
async function fetchPlaces(city) {
  const pf = await preparedFile(city);
  if (pf) {
    try {
      const r = await fetch(pf.path);
      if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.places)) { if (pf.region && !city.dep) city.dep = txt(pf.region, 80); return tidyPlaces(cleanPlaces(j.places), city.name); } }
      if (r.status === 404 && (pf.empty || (pf.check && await pf.check().then(() => true, () => false)))) return [];
    } catch (e) {}
  }
  const body = 'data=' + encodeURIComponent(overpassQuery(city));
  let last;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!r.ok) throw new Error('overpass ' + r.status);
      return tidyPlaces(cleanPlaces(toPlaces(await r.json())), city.name);
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
const distTxt = m => m < 1000 ? `${Math.round(m / 5) * 5} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', LANG === 'en' ? '.' : ',')} km`;
const CARD = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest'];
const CARD_EN = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const cardinal = b => (LANG === 'en' ? CARD_EN : CARD)[Math.round(b / 45) % 8];
const toward = b => L(`vers le ${cardinal(b)}`, `to the ${cardinal(b)}`);

/* ---------- État et sauvegarde ---------- */
const KEY = 'monuverse-v1';
const DATA_VER = 2;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayBefore = s => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let S = { v: 1, current: null, cities: {}, pseudo: '', streak: { n: 0, last: '' }, xp: 0, dailyBonus: {}, theme: 'auto', pending: [], week: null, badges: [], albums: {}, amis: [], parrain: '' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let albumsFresh = true;   // première ouverture depuis l'arrivée des albums : ceux déjà finis sont cochés sans bonus
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!d || d.v !== 1) return;
    const cities = {};
    for (const c of Object.values(d.cities || {})) { const x = cleanCity(c); if (x && x.places) { x.scanned = x.scanned || {}; cities[x.id] = x; } }
    S.cities = cities;
    S.current = cities[d.current] ? d.current : (Object.keys(cities)[0] || null);
    S.pseudo = txt(d.pseudo, 20);
    S.xp = num(d.xp, 0, 1e7) ? Math.floor(d.xp) : 0;
    S.streak = d.streak && num(d.streak.n, 0, 1e5) && /^\d{4}-\d{2}-\d{2}$/.test(d.streak.last || '') ? { n: d.streak.n, last: d.streak.last } : { n: 0, last: '' };
    S.dailyBonus = d.dailyBonus && typeof d.dailyBonus === 'object' ? Object.fromEntries(Object.keys(d.dailyBonus).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).slice(0, 3).map(k => [k, true])) : {};
    S.theme = ['auto', 'light', 'dark'].includes(d.theme) ? d.theme : 'auto';
    S.nav = ['plans', 'google', 'waze'].includes(d.nav) ? d.nav : undefined;
    S.lang = ['auto', 'fr', 'en'].includes(d.lang) ? d.lang : 'auto';
    S.pending = Array.isArray(d.pending) ? d.pending.filter(x => x && /^pd\d{10,14}$/.test(x.id) && num(x.lat, -90, 90) && num(x.lon, -180, 180) && num(x.acc, 0, 5000) && num(x.t, 1.6e12, 4e12))
      .map(x => ({ id: x.id, lat: x.lat, lon: x.lon, acc: x.acc, t: x.t })).slice(-20) : [];
    S.week = cleanWeek(d.week);
    S.amis = Array.isArray(d.amis) ? [...new Set(d.amis.filter(x => typeof x === 'string' && UUID.test(x)))].slice(-200) : [];
    S.parrain = typeof d.parrain === 'string' && UUID.test(d.parrain) ? d.parrain : '';
    S.badges = Array.isArray(d.badges) ? d.badges.filter(b => typeof b === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b)).slice(-200) : [];
    if (d.albums && typeof d.albums === 'object') { albumsFresh = false; S.albums = Object.fromEntries(Object.entries(d.albums).filter(([k, v]) => /^[\w:.\-]{1,140}$/.test(k) && num(v, 0, 4e12)).slice(0, 2000)); }
  } catch (e) {}
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast(L("Ton téléphone n'a plus de place pour sauvegarder.", 'Your phone is out of storage space.'), true); } }
const city = () => S.cities[S.current];
const got = (c, p) => !!c.scanned[p.id];
const nGot = c => Object.keys(c.scanned).length;
const pct = c => c.places.length ? Math.round(100 * nGot(c) / c.places.length) : 0;
const level = () => 1 + Math.floor(S.xp / 250);
const streakNow = () => (S.streak.last === today() || S.streak.last === dayBefore(today())) ? S.streak.n : 0;
const scannedToday = () => S.streak.last === today();
const totalPlaces = () => Object.values(S.cities).reduce((s, c) => s + nGot(c), 0);
const pseudo = () => S.pseudo || L('Explorateur', 'Explorer');

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
    get: k => tx('readonly', s => s.get(k)),
    del: k => { delete urls[k]; return tx('readwrite', s => s.delete(k)); },
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
  /* Le serveur limite la progression (anti-triche) : le score est envoyé par paliers jusqu'à rattraper le vrai score. */
  let retry = null;
  async function push() {
    if (!on || !S.pseudo) return;
    const c = city(); if (!c) return;
    clearTimeout(retry);
    try {
      const s = await session(), auth = hdr({ Authorization: 'Bearer ' + s.access });
      const cur = await fetch(`${base}/rest/v1/joueurs?select=points,lieux&id=eq.${s.uid}`, { headers: auth }).then(r => r.ok ? r.json() : []).catch(() => []);
      const was = cur[0] || null, wantL = totalPlaces(), wantP = Math.floor(S.xp);
      const lieux = Math.min(wantL, was ? was.lieux + 5 : 10);
      const points = Math.min(wantP, was ? was.points + 1000 : 1000, lieux * 300 + 2000);
      const row = { id: s.uid, ...(S.parrain && S.parrain !== s.uid ? { parrain: S.parrain } : {}), pseudo: S.pseudo.slice(0, 20), ville: c.name.slice(0, 80), ville_id: c.id, departement: `${c.dep}|${c.cc}`.slice(0, 140), pays: c.cc, points: Math.max(points, was ? was.points : 0), lieux: Math.max(lieux, was ? was.lieux : 0) };
      const send = body => fetch(`${base}/rest/v1/joueurs?on_conflict=id`, { method: 'POST', headers: hdr({ Authorization: 'Bearer ' + s.access, Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(body) });
      let r = await send(row);
      if (!r.ok && r.status === 400 && row.parrain) { delete row.parrain; r = await send(row); }   // base pas encore mise à jour pour les amis
      if (!r.ok) { retry = setTimeout(push, 10 * 60000); throw new Error('upsert ' + r.status); }
      if (row.points < wantP || row.lieux < wantL) retry = setTimeout(push, 20000);
    } catch (e) { console.warn('classement', e); }
  }
  return {
    on,
    uid: () => ses && ses.uid,
    sync: () => { clearTimeout(timer); timer = setTimeout(push, 1500); },
    async myId() { if (!on) return null; const s = await session(); return s.uid; },
    async friends() {
      const s = await session();
      const r = await fetch(`${base}/rest/v1/rpc/mes_amis`, { method: 'POST', headers: hdr({ Authorization: 'Bearer ' + s.access }), body: JSON.stringify({ ids: S.amis.filter(x => x !== s.uid) }) });
      if (!r.ok) throw new Error('amis ' + r.status);
      return r.json();
    },
    async who(id) {
      if (!on || !UUID.test(id)) return null;
      const r = await fetch(`${base}/rest/v1/joueurs?select=pseudo&id=eq.${id}`, { headers: hdr() });
      const j = r.ok ? await r.json() : [];
      return j[0] ? txt(j[0].pseudo, 20) : null;
    },
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
  $('#t-cityname').textContent = c ? c.name : L('Ma ville', 'My city');
  const n = streakNow();
  $('#t-streak').className = 'streak-chip' + (scannedToday() ? '' : ' cold');
  $('#t-streak').innerHTML = `${FLAME}${n}`;
  $('#t-streak').title = `${n} jour${n > 1 ? 's' : ''} de suite`;
  $('#t-me').textContent = pseudo().slice(0, 1).toUpperCase();
}


/* ---------- Photos libres des lieux (Wikipédia → Wikimedia Commons) ----------
   Seules les images libres de Commons sont utilisées (jamais les images « fair use » d'un Wikipédia local).
   L'auteur et la licence sont affichés sur la fiche du lieu. Les adresses trouvées sont gardées sur le téléphone. */
const Wiki = (() => {
  const KEYW = 'monuverse-wiki2';
  try { localStorage.removeItem('monuverse-wiki'); } catch (e) {}   // ancien cache (ancienne adresse des images Wikimedia)
  let m = {}; try { m = JSON.parse(localStorage.getItem(KEYW) || '{}') || {}; } catch (e) {}
  if (typeof m !== 'object' || Array.isArray(m)) m = {};
  const IMG = /^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/[\w\-.\/%()!,~']{6,400}$/;
  const PAGE = /^https:\/\/([a-z][a-z\-]{1,11})\.wikipedia\.org\/wiki\/([^?#\s\/]{1,300})$/;
  for (const k of Object.keys(m)) if (!PAGE.test(k) || (m[k] && !IMG.test(m[k]))) delete m[k];
  let timer = null;
  const persist = () => { clearTimeout(timer); timer = setTimeout(() => { try { const ks = Object.keys(m); ks.slice(0, Math.max(0, ks.length - 4000)).forEach(k => delete m[k]); localStorage.setItem(KEYW, JSON.stringify(m)); } catch (e) {} }, 500); };
  let running = 0; const queue = [];
  const slot = () => new Promise(res => { if (running < 6) { running++; res(); } else queue.push(res); });
  const free = () => { const n = queue.shift(); if (n) n(); else running--; };
  const pend = {};
  function thumb(p) {
    if (!p || !p.w) return Promise.resolve(null);
    const mm = PAGE.exec(p.w); if (!mm) return Promise.resolve(null);
    const k = p.w;
    if (k in m) return Promise.resolve(m[k] || null);
    if (pend[k]) return pend[k];
    if (navigator.onLine === false) return Promise.resolve(null);
    return pend[k] = (async () => {
      await slot();
      try {
        const r = await fetch(`https://${mm[1]}.wikipedia.org/api/rest_v1/page/summary/${mm[2]}`, { headers: { Accept: 'application/json' } });
        if (r.status === 404) { m[k] = ''; persist(); return null; }
        if (!r.ok) return null;
        const j = await r.json();
        let u = (j && j.thumbnail && typeof j.thumbnail.source === 'string') ? j.thumbnail.source.split('?')[0] : '';
        if (u && !IMG.test(u)) u = '';
        // vignette plus nette quand l'image d'origine est assez grande (Wikimedia n'accepte que des tailles standard : 330, 500, 960…)
        if (u && j.originalimage && j.originalimage.width >= 500 && /\/thumb\/.+\/\d+px-[^/]+$/.test(u)) u = u.replace(/\/\d+px-([^/]+)$/, '/500px-$1');
        m[k] = u; persist();
        return u || null;
      } catch (e) { return null; } finally { free(); delete pend[k]; }
    })();
  }
  const credits = {};
  async function credit(u) {
    const mm = /\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/]+)/.exec(u || ''); if (!mm) return null;
    let file; try { file = decodeURIComponent(mm[1]); } catch (e) { return null; }
    if (file in credits) return credits[file];
    const plain = h => txt(new DOMParser().parseFromString(String(h || ''), 'text/html').body.textContent || '', 90);   // DOMParser n'exécute rien
    try {
      const r = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=extmetadata&titles=${encodeURIComponent('File:' + file)}`);
      const j = await r.json();
      const pg = j && j.query && j.query.pages && Object.values(j.query.pages)[0];
      const md = (pg && pg.imageinfo && pg.imageinfo[0] && pg.imageinfo[0].extmetadata) || {};
      return credits[file] = { artist: plain(md.Artist && md.Artist.value), lic: plain(md.LicenseShortName && md.LicenseShortName.value).slice(0, 40), page: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file.replace(/ /g, '_')) };
    } catch (e) { return credits[file] = null; }
  }
  return { thumb, credit };
})();
/* Remplit les vignettes [data-wk] avec la photo Wikimedia ; une photo souvenir du joueur reste toujours prioritaire */
function fillWiki(root, c) {
  if (!root || !c) return;
  root.querySelectorAll('[data-wk]').forEach(el => {
    const p = c.places.find(x => x.id === el.dataset.wk); if (!p) return;
    Wiki.thumb(p).then(u => {
      if (!u || !el.isConnected || el.querySelector('img')) return;
      const img = new Image(); img.alt = ''; img.decoding = 'async'; img.referrerPolicy = 'no-referrer'; img.className = 'wk';
      img.onload = () => { if (el.isConnected && !el.querySelector('img')) { el.textContent = ''; el.appendChild(img); } };
      img.src = u;
    });
  });
}

/* ---------- Écran : Ma ville ---------- */
let filter = 'tous', listMax = 40;
function ringSVG(p, size = 112) {
  const r = 46, C = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 112 112" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#C8862A"/><stop offset=".6" stop-color="#F5B841"/><stop offset="1" stop-color="#FFE2A0"/></linearGradient></defs>
    <circle class="tr" cx="56" cy="56" r="${r}"/><circle class="pr" cx="56" cy="56" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p / 100)}" transform="rotate(-90 56 56)"/>
    <text x="56" y="52">${p}%</text><text class="sm" x="56" y="74">${L('complétée', 'complete')}</text></svg>`;
}
function placeRow(c, p, here) {
  const g = got(c, p), d = here ? dist(here, p) : null, isDaily = dailyPlace(c) === p;
  return `<button class="pl r-${p.r} ${g ? 'got' : 'locked'} ${isDaily && !g ? 'today' : ''}" data-p="${p.id}">
    <span class="ic" data-ph="${g ? p.id : ''}"${p.w ? ` data-wk="${p.id}"` : ''}>${shape(KINDS[p.k][1])}</span>
    <div><b>${esc(pname(p))}</b><span>${kindLabel(p.k)}${isDaily && !g ? L(' · lieu du jour ×2', ' · place of the day ×2') : ''}${g ? L(' · débloqué', ' · unlocked') : ''}</span></div>
    <span class="rt">${d !== null ? `<span class="dist">${distTxt(d)}</span>` : ''}<span class="gem">${rarLabel(p.r)}</span></span></button>`;
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
      <div><h2>${L(`${nPl(n)} sur ${N}`, `${n} of ${nPl(N)}`)}</h2>
        <p>${N - n ? L(`Encore ${N - n} à découvrir à ${esc(c.name)}.`, `${N - n} more to discover in ${esc(c.name)}.`) : L(`Tu as complété ${esc(c.name)}. Bravo !`, `You completed ${esc(c.name)}. Well done!`)}</p>
        <div class="xp"><span>${L('Niveau', 'Level')} ${lvl} · ${fmt(S.xp)} XP</span><div class="bar"><i style="width:${into / 2.5}%"></i></div></div></div></div>
    <div class="daily ${doneToday ? 'done' : ''}">
      <span class="ic">${doneToday ? FLAME : shape(daily ? KINDS[daily.k][1] : 'statue')}</span>
      <div><span class="eyebrow">${doneToday ? L('Série gardée', 'Streak kept') : L('Défi du jour', "Today's challenge")}</span>
        <b>${doneToday ? L(`${nDays(streakNow())} de suite. Reviens demain !`, `${nDays(streakNow())} in a row. Come back tomorrow!`) : daily ? L(`Débloque « ${esc(pname(daily))} » : XP doublée`, `Unlock “${esc(pname(daily))}”: double XP`) : L('Débloque un lieu aujourd\'hui', 'Unlock a place today')}</b>
        <span>${doneToday ? (daily ? L('Demain, un nouveau lieu du jour.', 'Tomorrow, a new place of the day.') : '') : L(`Un lieu par jour garde ta série${streakNow() ? ` de ${nDays(streakNow())}` : ''}.`, `One place a day keeps your${streakNow() ? ` ${nDays(streakNow())}` : ''} streak alive.`)}</span></div>
      ${!doneToday && daily ? `<button class="go" data-p="${daily.id}">${L('Voir', 'View')}</button>` : ''}</div>
    ${weekHTML()}
    <div class="share-row"><button class="btn gold" id="v-story">${L('Partager ma ville', 'Share my city')}</button><button class="btn ghost" id="v-explore">${L('Explorer', 'Explore')}</button></div>
    <div class="sec"><h3>${L('Les lieux de', 'Places in')} ${esc(c.name)}</h3><span>${here ? L('du plus proche au plus loin', 'nearest first') : L('active le GPS pour les distances', 'turn on GPS to see distances')}</span></div>
    <div class="chips" role="group" aria-label="Filtrer">
      ${[['tous', L('Tous', 'All')], ['todo', L('À découvrir', 'To discover')], ['got', L('Débloqués', 'Unlocked')]].concat(kinds.map(k => [k, kindLabel(k)])).map(([k, l]) => `<button class="chip" data-f="${k}" aria-pressed="${filter === k}">${l}</button>`).join('')}
    </div>
    <div class="places">${list.slice(0, listMax).map(x => placeRow(c, x, here)).join('') || `<div class="empty">${L('Aucun lieu dans ce filtre.', 'No places in this filter.')}</div>`}</div>
    ${list.length > listMax ? `<button class="btn ghost more" id="v-more">${L(`Afficher ${Math.min(40, list.length - listMax)} lieux de plus`, `Show ${Math.min(40, list.length - listMax)} more places`)}</button>` : ''}
    <p class="fine" style="margin-top:18px">${L('Lieux © contributeurs', 'Places © contributors of')} <a class="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>. ${L('Il manque un lieu ? Ajoute-le sur OpenStreetMap : il apparaîtra dans Monuverse.', 'A place is missing? Add it on OpenStreetMap and it will appear in Monuverse.')}</p>`;
  $$('#s-ville [data-p]').forEach(b => b.onclick = () => openPlace(b.dataset.p));
  $$('#s-ville [data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; listMax = 40; renderVille(); });
  if ($('#v-more')) $('#v-more').onclick = () => { listMax += 40; renderVille(); };
  $('#v-story').onclick = shareStory;
  $('#v-explore').onclick = () => go('scan');
  $$('#s-ville [data-wk]').forEach(b => b.onclick = () => { filter = b.dataset.wk; listMax = 40; renderVille(); $('#s-ville .chips').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' }); });
  fillPhotos($('#s-ville'));
  fillWiki($('#s-ville'), c);
}

/* ---------- Fiche d'un lieu ---------- */
function cardHTML(c, p, photo, reveal) {
  const i = c.places.indexOf(p) + 1;
  return `<div class="card r-${p.r} ${p.r} ${reveal ? 'reveal' : ''} ${got(c, p) ? '' : 'locked-art'}"><div class="card-in">
    <div class="ct"><span>#${String(i).padStart(3, '0')}</span><span>${esc(c.name.toUpperCase())}</span></div>
    <div class="art"${!photo && p.w ? ` data-wk="${p.id}"` : ''}>${photo ? `<img src="${photo}" alt="${L('Ta photo de', 'Your photo of')} ${esc(pname(p))}">` : shape(KINDS[p.k][1])}</div>
    <div class="rar">${rarLabel(p.r)} · +${RAR[p.r][1]} XP</div>
    <div class="nm">${esc(pname(p))}</div>
    <div class="fact">${kindFact(p.k)}</div></div></div>`;
}
/* ---------- Itinéraire : Plans (iPhone), Google Maps ou Waze ---------- */
const IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function navApps(p) {
  const ll = `${p.lat},${p.lon}`;
  const apps = [
    ['plans', 'Plans', `https://maps.apple.com/?daddr=${ll}&dirflg=w`],
    ['google', 'Google Maps', `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=walking`],
    ['waze', 'Waze', `https://waze.com/ul?ll=${ll}&navigate=yes`]
  ];
  const order = IOS ? ['plans', 'google', 'waze'] : ['google', 'waze', 'plans'];
  if (S.nav && order.includes(S.nav)) order.sort((a, b) => (b === S.nav) - (a === S.nav));
  return order.map(k => apps.find(a => a[0] === k));
}
function navHTML(p, label = L('Y aller', 'Go there')) {
  return `<button class="btn ghost nav-toggle" type="button" aria-expanded="false">${label}</button>
    <div class="nav-pick" hidden>${navApps(p).map(([k, l, u]) => `<a class="btn ghost" data-nav="${k}" href="${u}" target="_blank" rel="noopener">${l}</a>`).join('')}</div>`;
}
function bindNav(root) {
  root.querySelectorAll('.nav-toggle').forEach(b => b.onclick = () => { const pick = b.nextElementSibling; pick.hidden = !pick.hidden; b.setAttribute('aria-expanded', !pick.hidden); });
  root.querySelectorAll('[data-nav]').forEach(a => a.addEventListener('click', () => { S.nav = a.dataset.nav; save(); }));
}

async function openPlace(id) {
  const c = city(), p = c.places.find(x => x.id === id); if (!p) return;
  const g = got(c, p), here = fresh() ? GPS.pos : null, photo = g ? await PhotoDB.url(p.id) : null;
  const d = here ? dist(here, p) : null, near = here && inRange(p, here);
  const s = sheet(`<div class="tag">${g ? L('Dans ta collection', 'In your collection') : L('À découvrir', 'To discover')}</div>
    ${cardHTML(c, p, photo)}
    <p class="credit" hidden></p>
    ${g ? `<p>${L('Débloqué le', 'Unlocked on')} ${new Date(c.scanned[p.id].t).toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' })}.</p>`
      : near ? `<p>${L('Tu y es : débloque-le !', "You're here: unlock it!")}</p>`
      : `<p>${d !== null ? L(`À ${distTxt(d)}, ${toward(bearing(here, p))}. `, `${distTxt(d)} away, ${toward(bearing(here, p))}. `) : ''}${L(`Approche-toi à moins de ${p.rad} m pour le débloquer.`, `Get within ${p.rad} m to unlock it.`)}</p>`}
    ${!g && near ? `<button class="btn sea" id="pl-scan">${L('Débloquer ce lieu', 'Unlock this place')}</button>` : ''}
    ${g && !photo ? `<button class="btn ghost" id="pl-photo">${L('Ajouter ma photo souvenir', 'Add my souvenir photo')}</button>` : ''}
    <div class="nav-wrap">${navHTML(p)}</div>
    <div class="row2">${p.w ? `<a class="btn ghost" href="${p.w}" target="_blank" rel="noopener">${L('En savoir plus', 'Learn more')}</a>` : ''}<button class="btn ghost" data-close ${p.w ? '' : 'style="grid-column:1/-1"'}>${L('Fermer', 'Close')}</button></div>`);
  bindNav(s);
  if (!photo && p.w) {
    fillWiki(s, c);
    Wiki.thumb(p).then(async u => {
      if (!u || !s.isConnected) return;
      const cr = await Wiki.credit(u), el = s.querySelector('.credit'); if (!el) return;
      el.innerHTML = `${L('Photo', 'Photo')} : <a href="${esc(cr ? cr.page : p.w)}" target="_blank" rel="noopener">${esc((cr && cr.artist) || 'Wikimedia Commons')}</a>${cr && cr.lic ? ` · ${esc(cr.lic)}` : ''} · Wikimedia Commons`;
      el.hidden = false;
    });
  }
  if ($('#pl-scan')) $('#pl-scan').onclick = () => unlock(p);
  if ($('#pl-photo')) $('#pl-photo').onclick = async () => { const f = await askPhoto(); if (!f) return; try { await PhotoDB.put(p.id, await shrink(f)); s.remove(); openPlace(p.id); refresh(); } catch (e) { toast(L("La photo n'a pas pu être enregistrée.", 'The photo could not be saved.'), true); } };
}

/* ---------- Débloquer : GPS obligatoire, photo souvenir facultative ---------- */
async function unlock(p, gift = false, o = {}) {
  const c = o.cid ? S.cities[o.cid] : city();
  if (!c || got(c, p)) return;
  if (!gift && !o.verified && !(fresh() && inRange(p))) { toast(L(`Rapproche-toi de « ${pname(p)} » pour le débloquer.`, `Get closer to “${pname(p)}” to unlock it.`), true); return; }
  let photo = null;
  const at = o.t || Date.now(), day = dayKey(at), late = day !== today();
  if (o.photo) { try { await PhotoDB.put(p.id, o.photo); photo = true; } catch (e) {} }
  else if (!gift && !o.verified) {
    const s = sheet(`<div class="tag">${L('Tu y es !', "You're here!")}</div><h3>${esc(pname(p))}</h3><p>${L("Prends une photo souvenir : elle deviendra l'image de ta carte.", 'Take a souvenir photo: it will become the picture on your card.')}</p>
      <button class="btn gold" id="u-photo">${L('Prendre la photo', 'Take the photo')}</button><button class="btn ghost" id="u-skip">${L('Débloquer sans photo', 'Unlock without a photo')}</button>`);
    photo = await new Promise(res => {
      $('#u-photo').onclick = async () => { const f = await askPhoto(); res(f || null); };
      $('#u-skip').onclick = () => res(null);
    });
    s.remove();
    if (photo) { try { await PhotoDB.put(p.id, await shrink(photo)); } catch (e) { photo = null; } }
  }
  const daily = !gift && !late && dailyPlace(c) === p && !S.dailyBonus[today()];
  let xp = RAR[p.r][1] * (daily ? 2 : 1);
  const lv0 = level(), had = scannedToday(), streak0 = streakNow();
  c.scanned[p.id] = { t: at, gift: gift || undefined, photo: !!photo || undefined };
  if (daily) S.dailyBonus = { [today()]: true };
  if (!gift) {
    if (late) recomputeStreak();           // photo prise un autre jour : la série compte ce jour-là
    else if (!had) { S.streak = { n: S.streak.last === dayBefore(today()) ? S.streak.n + 1 : 1, last: today() }; }
  }
  const p0 = pct(c);
  const extra = [];
  if (p0 >= 50 && Math.round(100 * (nGot(c) - 1) / c.places.length) < 50) { xp += 100; extra.push(L('Moitié de la ville : +100 XP', 'Half the city: +100 XP')); }
  if (p0 === 100) { xp += 300; extra.push(L('Ville complétée : +300 XP', 'City completed: +300 XP')); }
  S.xp += xp;
  const rw = claimRewards(); xp += rw.xp; extra.push(...rw.out);
  save(); LB.sync();
  buzz([30, 40, 60]);
  const url = await PhotoDB.url(p.id);
  const burst = calm() ? '' : `<div class="burst" aria-hidden="true">${Array.from({ length: 22 }, (_, k) => `<i style="--a:${k * 360 / 22}deg;--r:${110 + (k * 37) % 70}px;--c:${['#F5B841', '#4FE0CF', '#B07CF2', '#FFE2A0'][k % 4]}"></i>`).join('')}</div>`;
  const when = new Date(at).toLocaleDateString(LOC(), { day: 'numeric', month: 'long' });
  const rs = sheet(`<div class="tag">${gift ? L('Cadeau de bienvenue', 'Welcome gift') : o.verified ? L(`Ta photo du ${when} · lieu débloqué`, `Your photo from ${when} · place unlocked`) : L('Nouveau lieu débloqué', 'New place unlocked')}</div>${burst}
    ${cardHTML(c, p, url, true)}
    <div class="rewards"><span class="hi">+${xp} XP</span>${daily ? `<span>${L('Lieu du jour ×2', 'Place of the day ×2')}</span>` : ''}${!gift && (late ? streakNow() > streak0 : !had) ? `<span>${L('Série : ', 'Streak: ')}${nDays(streakNow())}</span>` : ''}${level() > lv0 ? `<span class="hi">${L(`Niveau ${level()} !`, `Level ${level()}!`)}</span>` : ''}${extra.map(e => `<span class="hi">${e}</span>`).join('')}</div>
    <p>${L(`${nPl(nGot(c))} sur ${c.places.length} à ${esc(c.name)}`, `${nGot(c)} of ${nPl(c.places.length)} in ${esc(c.name)}`)} · ${p0}${L(' %', '%')}</p>
    <div class="row2"><button class="btn ghost" id="r-share">${L('Partager', 'Share')}</button><button class="btn gold" data-close>${L('Continuer', 'Continue')}</button></div>`, () => { refresh(); if (o.after) o.after(); });
  $('#r-share').onclick = shareStory;
  if (!url) fillWiki(rs, c);
  refresh();
}
function refresh() { header(); ({ ville: renderVille, scan: renderScan, rank: renderRank, globe: renderGlobe, moi: renderMoi })[tab](); }

/* ---------- Défis de la semaine, albums et photos en attente ---------- */
const KPL = {
  mairie: ['mairies', 'town halls'], cathedrale: ['cathédrales', 'cathedrals'], culte: ['lieux de culte', 'places of worship'],
  fontaine: ['fontaines', 'fountains'], statue: ['statues', 'statues'], oeuvre: ["œuvres d'art", 'artworks'], fresque: ['fresques', 'murals'],
  aux_morts: ['monuments aux morts', 'war memorials'], memorial: ['mémoriaux', 'memorials'], plaque: ['plaques commémoratives', 'memorial plaques'],
  monument: ['monuments', 'monuments'], musee: ['musées', 'museums'], chateau: ['châteaux', 'castles'], ruines: ['vestiges', 'ruins'],
  porte: ['portes de ville', 'city gates'], croix: ['calvaires', 'wayside crosses'], phare: ['phares', 'lighthouses'], moulin: ['moulins', 'mills'],
  chateau_eau: ["châteaux d'eau", 'water towers'], belvedere: ['points de vue', 'viewpoints'], attraction: ['sites à voir', 'sights'],
  parc: ['parcs', 'parks'], patrimoine: ['lieux de patrimoine', 'heritage sites'], bibliotheque: ['bibliothèques', 'libraries'],
  culture: ['lieux de culture', 'cultural venues'], gare: ['gares', 'stations'], marche: ['marchés', 'markets'], kiosque: ['kiosques', 'bandstands'],
  horloge: ['horloges', 'clocks'], jeux: ['aires de jeux', 'playgrounds'], sport: ['équipements sportifs', 'sports facilities'], salle: ['lieux de vie', 'community places']
};
const kindN = (k, n) => n > 1 ? KPL[k][LANG === 'en' ? 1 : 0] : kindLabel(k).toLowerCase();
const capF = t => t.charAt(0).toUpperCase() + t.slice(1);
const pad2 = n => String(n).padStart(2, '0');
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const hsh = t => { let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
function weekStart(t = Date.now()) { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); }
function weekEnd(t = Date.now()) { const d = new Date(weekStart(t)); d.setDate(d.getDate() + 7); return d.getTime(); }
function weekNum(t = Date.now()) {
  const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}
const WK_TYPES = ['kind', 'rare', 'any', 'city', 'days'];
function cleanWeek(w) {
  if (!w || typeof w !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(w.key || '') || !Array.isArray(w.list) || typeof w.cid !== 'string' || w.cid.length > 80) return null;
  const list = w.list.slice(0, 3).filter(c => c && WK_TYPES.includes(c.type) && num(c.n, 1, 10) && num(c.xp, 0, 500) && (c.type !== 'kind' || KINDS[c.k]))
    .map(c => ({ type: c.type, k: c.type === 'kind' ? c.k : undefined, n: Math.floor(c.n), xp: Math.floor(c.xp) }));
  if (!list.length) return null;
  const done = Array.isArray(w.done) ? [...new Set(w.done.filter(i => Number.isInteger(i) && i >= 0 && i < list.length))] : [];
  return { key: w.key, cid: w.cid, list, done, badge: w.badge === true };
}
/* Lieux débloqués (hors cadeau de bienvenue) entre deux dates, dans toutes les villes */
function scansBetween(t0, t1) {
  const out = [];
  for (const c of Object.values(S.cities)) {
    const by = new Map(c.places.map(p => [p.id, p]));
    for (const [id, x] of Object.entries(c.scanned)) if (!x.gift && x.t >= t0 && x.t < t1 && by.has(id)) out.push({ c, p: by.get(id), t: x.t });
  }
  return out;
}
/* Les 3 défis de la semaine : tirés au sort à partir de la ville (mêmes pour tous ses joueurs), adaptés si tu as déjà tout un type */
function weekChallenges() {
  const wk = dayKey(weekStart());
  if (S.week && S.week.key === wk) return S.week;
  const c = city(); if (!c) return null;
  const h = hsh(wk + c.id);
  const all = {}, left = {};
  for (const p of c.places) { all[p.k] = (all[p.k] || 0) + 1; if (!got(c, p)) left[p.k] = (left[p.k] || 0) + 1; }
  const kinds = Object.keys(all).filter(k => all[k] >= 2 && k !== 'mairie').sort();
  const order = kinds.map((_, i) => kinds[(i + h) % kinds.length]);
  const k = order.find(x => left[x] >= 2) || order.find(x => left[x] >= 1);
  const nLeft = c.places.filter(p => !got(c, p)).length;
  const list = [];
  list.push(k ? { type: 'kind', k, n: Math.min(2, left[k]), xp: 50 } : { type: 'city', n: 1, xp: 100 });
  list.push(c.places.some(p => !got(c, p) && p.r !== 'commune') ? { type: 'rare', n: 1, xp: 100 } : { type: 'any', n: nLeft ? Math.min(3, nLeft) : 3, xp: 100 });
  list.push({ type: 'days', n: 3, xp: 150 });
  S.week = { key: wk, cid: c.id, list, done: [], badge: false };
  save();
  return S.week;
}
function weekProgress(w) {
  const sc = scansBetween(weekStart(), weekEnd());
  return w.list.map(ch => {
    const v = ch.type === 'kind' ? sc.filter(x => x.p.k === ch.k).length
      : ch.type === 'rare' ? sc.filter(x => x.p.r !== 'commune').length
      : ch.type === 'city' ? sc.filter(x => x.c.id !== w.cid).length
      : ch.type === 'days' ? new Set(sc.map(x => dayKey(x.t))).size
      : sc.length;
    return Math.min(v, ch.n);
  });
}
function chLabel(ch) {
  if (ch.type === 'kind') return L(`Débloque ${ch.n} ${kindN(ch.k, ch.n)}`, `Unlock ${ch.n} ${kindN(ch.k, ch.n)}`);
  if (ch.type === 'rare') return L('Débloque 1 lieu rare ou mieux', 'Unlock 1 rare place or better');
  if (ch.type === 'city') return L('Débloque 1 lieu dans une autre ville', 'Unlock 1 place in another city');
  if (ch.type === 'days') return L(`Débloque des lieux ${ch.n} jours différents`, `Unlock places on ${ch.n} different days`);
  return L(`Débloque ${nPl(ch.n)}`, `Unlock ${nPl(ch.n)}`);
}
function weekHTML() {
  const w = weekChallenges(); if (!w) return '';
  const pr = weekProgress(w), nd = pr.filter((v, i) => v >= w.list[i].n).length;
  const daysLeft = Math.max(1, Math.round((weekEnd() - Date.now()) / 864e5));
  return `<div class="week ${w.badge ? 'done' : ''}">
    <div class="wk-h"><span class="eyebrow">${L('Défis de la semaine', 'Weekly challenges')}</span><span>${nd}/${w.list.length} · ${daysLeft <= 1 ? L('dernier jour', 'last day') : L(`encore ${daysLeft} jours`, `${daysLeft} days left`)}</span></div>
    ${w.list.map((ch, i) => { const ok = pr[i] >= ch.n; return `<div class="wk-r ${ok ? 'ok' : ''}" ${ch.type === 'kind' && !ok ? `data-wk="${ch.k}" role="button" tabindex="0"` : ''}>
      <span class="ck" aria-hidden="true">${ok ? '✓' : ''}</span>
      <div><b>${chLabel(ch)}</b><div class="bar sea"><i style="width:${Math.round(100 * pr[i] / ch.n)}%"></i></div></div>
      <span class="wx">${ok ? `${pr[i]}/${ch.n}` : `+${ch.xp} XP`}</span></div>`; }).join('')}
    <p class="wk-f">${w.badge ? L(`Badge « Semaine ${weekNum(weekStart())} » gagné ! Nouveaux défis lundi.`, `“Week ${weekNum(weekStart())}” badge earned! New challenges on Monday.`) : L(`Les ${w.list.length} réussis : badge « Semaine ${weekNum(weekStart())} » et +100 XP`, `All ${w.list.length} done: “Week ${weekNum(weekStart())}” badge and +100 XP`)}</p>
  </div>`;
}
/* Albums : chaque famille de lieux d'une ville (3 lieux ou plus), et de grands albums sur toutes tes villes */
function cityAlbums(c) {
  const byK = {};
  for (const p of c.places) (byK[p.k] = byK[p.k] || []).push(p);
  return Object.entries(byK).filter(([, ps]) => ps.length >= 3).map(([k, ps]) => {
    const n = ps.filter(p => got(c, p)).length;
    return { id: `c:${c.id}:${k}`, k, cid: c.id, title: capF(KPL[k][LANG === 'en' ? 1 : 0]), sub: c.name, n, N: ps.length, done: n === ps.length, xp: Math.min(200, 20 * ps.length) };
  });
}
function globalAlbums() {
  const cs = Object.values(S.cities);
  let places = 0, rare = 0, cath = 0, mus = 0;
  for (const c of cs) for (const p of c.places) if (got(c, p)) { places++; if (p.r !== 'commune') rare++; if (p.k === 'cathedrale') cath++; if (p.k === 'musee') mus++; }
  const cities = cs.filter(c => nGot(c)).length, ccs = new Set(cs.filter(c => nGot(c)).map(c => c.cc)).size;
  const G = [
    ['g:places10', 10, places, 100, L('10 lieux', '10 places'), L('où tu veux', 'anywhere')],
    ['g:places50', 50, places, 200, L('50 lieux', '50 places'), L('où tu veux', 'anywhere')],
    ['g:places200', 200, places, 300, L('200 lieux', '200 places'), L('où tu veux', 'anywhere')],
    ['g:rare10', 10, rare, 150, L('10 lieux rares', '10 rare places'), L('rares, épiques ou légendaires', 'rare, epic or legendary')],
    ['g:cities3', 3, cities, 150, L('3 villes', '3 cities'), L('au moins un lieu dans chacune', 'at least one place in each')],
    ['g:cities10', 10, cities, 300, L('10 villes', '10 cities'), L('au moins un lieu dans chacune', 'at least one place in each')],
    ['g:countries3', 3, ccs, 300, L('3 pays', '3 countries'), L('remplis ton globe', 'fill your globe')],
    ['g:cath5', 5, cath, 200, L('5 cathédrales', '5 cathedrals'), L('dans le monde entier', 'anywhere in the world')],
    ['g:museum5', 5, mus, 150, L('5 musées', '5 museums'), L('dans le monde entier', 'anywhere in the world')]
  ];
  return G.map(([id, N, v, xp, title, sub]) => ({ id, N, n: Math.min(v, N), done: v >= N, xp, title, sub, k: null }));
}
const allAlbums = () => Object.values(S.cities).flatMap(cityAlbums).concat(globalAlbums());
/* Bonus gagnés : défis de la semaine, badge, albums complétés. Chaque bonus n'est donné qu'une fois. */
function claimRewards() {
  const out = []; let xp = 0;
  const w = weekChallenges();
  if (w) {
    const pr = weekProgress(w);
    w.list.forEach((ch, i) => { if (pr[i] >= ch.n && !w.done.includes(i)) { w.done.push(i); xp += ch.xp; out.push(L(`Défi réussi : +${ch.xp} XP`, `Challenge done: +${ch.xp} XP`)); } });
    if (!w.badge && w.done.length === w.list.length) {
      w.badge = true; S.badges = S.badges.filter(b => b !== w.key).concat(w.key).slice(-200); xp += 100;
      out.push(L(`Badge « Semaine ${weekNum(weekStart())} » : +100 XP`, `“Week ${weekNum(weekStart())}” badge: +100 XP`));
    }
  }
  for (const a of allAlbums()) if (a.done && !S.albums[a.id]) {
    S.albums[a.id] = Date.now(); xp += a.xp;
    out.push(L(`Album « ${a.title}${a.k ? ` · ${a.sub}` : ''} » complet : +${a.xp} XP`, `“${a.title}${a.k ? ` · ${a.sub}` : ''}” album complete: +${a.xp} XP`));
  }
  S.xp += xp;
  return { xp, out };
}
let albumsAll = false;
function albumsHTML() {
  const c = city();
  const mine = c ? cityAlbums(c) : [];
  const g = globalAlbums();
  const sortA = (a, b) => (a.done - b.done) || (b.n / b.N - a.n / a.N) || a.title.localeCompare(b.title);
  const open = mine.filter(a => !a.done).sort(sortA), full = mine.filter(a => a.done);
  // grands albums : le prochain palier de chaque famille, plus ceux déjà finis
  const fam = {}; const gOpen = g.filter(a => !a.done && !fam[a.id.replace(/\d+$/, '')] && (fam[a.id.replace(/\d+$/, '')] = 1)); const gDone = g.filter(a => a.done);
  const row = a => `<button class="pl al ${a.done ? 'got' : 'locked'}" ${a.k ? `data-al="${a.k}"` : 'disabled'}>
      <span class="ic">${a.k ? shape(KINDS[a.k][1]) : shape(a.id.startsWith('g:countries') || a.id.startsWith('g:cities') ? 'sky' : 'columns')}</span>
      <div><b>${esc(a.title)}</b><span>${esc(a.sub)}</span><div class="bar ${a.done ? '' : 'sea'}"><i style="width:${Math.round(100 * a.n / a.N)}%"></i></div></div>
      <span class="rt"><span class="dist">${a.done ? '✓' : `${a.n}/${a.N}`}</span><span class="gem">${a.done ? L('complet', 'complete') : `+${a.xp} XP`}</span></span></button>`;
  const show = albumsAll ? open : open.slice(0, 4);
  const nDone = full.length + gDone.length;
  return `<div class="sec"><h3>${L('Albums', 'Albums')}</h3><span>${L(`${nDone} complété${nDone > 1 ? 's' : ''}`, `${nDone} complete`)}</span></div>
    ${c ? `<div class="places">${show.map(row).join('') || `<div class="empty">${L(`Pas encore d'album à ${esc(c.name)} : il faut au moins 3 lieux du même type.`, `No album in ${esc(c.name)} yet: it takes at least 3 places of the same type.`)}</div>`}</div>
    ${!albumsAll && open.length > 4 ? `<button class="btn ghost more" id="al-more">${L(`Voir les ${open.length - 4} autres albums de ${esc(c.name)}`, `See ${open.length - 4} more albums in ${esc(c.name)}`)}</button>` : ''}` : ''}
    <div class="places" style="margin-top:8px">${gOpen.concat(albumsAll ? full.concat(gDone) : gDone.slice(-2)).map(row).join('')}</div>`;
}

/* Photo prise sur place. Avec un lieu connu à portée : déblocage normal. Sinon (ville jamais ouverte, pas de réseau) :
   la photo, la position et l'heure sont gardées sur le téléphone, et vérifiées dès que le réseau revient. */
function knownAt(pos, withGot) {
  let best = null;
  for (const c of Object.values(S.cities)) for (const p of c.places) {
    if (!inRange(p, pos) || (!withGot && got(c, p))) continue;
    const d = dist(pos, p), score = (got(c, p) ? 1e6 : 0) + d;
    if (!best || score < best.score) best = { c, p, d, score };
  }
  return best;
}
async function photoHere() {
  const me = GPS.pos;
  if (!me || !fresh()) { toast(L('On cherche encore ta position. Sors à découvert quelques secondes, puis réessaie.', 'Still finding your location. Step outside for a few seconds, then try again.'), true); return; }
  if (me.acc > 100) { toast(L(`Ta position est trop imprécise (${Math.round(me.acc)} m). Sors à découvert, puis réessaie.`, `Your location is too imprecise (${Math.round(me.acc)} m). Step outside, then try again.`), true); return; }
  const pos = { lat: me.lat, lon: me.lon, acc: me.acc, t: Date.now() };
  const hit = knownAt(pos, false);
  if (hit) { unlock(hit.p, false, { cid: hit.c.id }); return; }
  const f = await askPhoto(); if (!f) return;
  let blob; try { blob = await shrink(f); } catch (e) { toast(L("La photo n'a pas pu être enregistrée.", 'The photo could not be saved.'), true); return; }
  const id = 'pd' + pos.t;
  try { await PhotoDB.put('pend:' + id, blob); } catch (e) { toast(L("La photo n'a pas pu être enregistrée.", 'The photo could not be saved.'), true); return; }
  S.pending = S.pending.concat({ id, lat: pos.lat, lon: pos.lon, acc: pos.acc, t: pos.t }).slice(-20); save();
  if (navigator.onLine !== false) {
    sheet(`<div class="tag">${L('Photo prise', 'Photo taken')}</div><h3>${L('On regarde quel lieu se trouve ici…', 'Checking which place is here…')}</h3><div class="spinner" style="margin:18px auto"></div>`);
    resolvePending(true);
  } else {
    sheet(`<div class="tag">${L('Photo gardée', 'Photo saved')}</div><h3>${L('Pas de réseau pour le moment', 'No network right now')}</h3>
      <p>${L("Ta photo, ta position et l'heure sont gardées sur ce téléphone. Dès que tu retrouves du réseau, Monuverse vérifie le lieu et débloque la carte, datée du jour de ta photo.", "Your photo, location and time are saved on this phone. As soon as you are back online, Monuverse checks the place and unlocks the card, dated the day of your photo.")}</p>
      <button class="btn gold" data-close>${L('Compris', 'Got it')}</button>`);
  }
  refresh();
}
function pendingHTML() {
  const n = S.pending.length; if (!n) return '';
  return `<div class="note pend"><b>${L(`${n} photo${n > 1 ? 's' : ''} en attente`, `${n} photo${n > 1 ? 's' : ''} waiting`)}</b><span>${L('Elles seront vérifiées dès que tu retrouves du réseau.', 'They will be checked as soon as you are back online.')}</span>
    ${navigator.onLine !== false ? `<button class="btn ghost small" id="pd-check">${L('Vérifier maintenant', 'Check now')}</button>` : ''}</div>`;
}
/* Ajoute une ville sans changer d'écran (pour vérifier une photo prise ailleurs) */
async function addCityQuiet(c) {
  const old = S.cities[c.id];
  if (old && old.places.length && old.ver === DATA_VER) return old;
  const places = tidyPlaces(await fetchPlaces(c), c.name, old ? old.scanned : {});
  S.cities[c.id] = Object.assign({}, c, { places, scanned: old ? old.scanned : {}, fetched: Date.now(), ver: DATA_VER });
  if (!S.current) S.current = c.id;
  save();
  return S.cities[c.id];
}
let pendBusy = false;
async function resolvePending(manual) {
  if (pendBusy || !S.pending.length) { if (manual && !S.pending.length) closeSheets(); return; }
  if (navigator.onLine === false) { if (manual) toast(L('Toujours pas de réseau. On réessaiera tout seuls.', 'Still offline. We will try again automatically.'), true); return; }
  pendBusy = true;
  const it = S.pending[0], pos = { lat: it.lat, lon: it.lon, acc: it.acc };
  let hit = knownAt(pos, true);
  if (!hit) {
    try { await addCityQuiet(await cityAt(it.lat, it.lon)); hit = knownAt(pos, true); }
    catch (e) { pendBusy = false; if (manual) { closeSheets(); toast(L('Le réseau ne répond pas. On réessaiera tout seuls.', 'The network is not responding. We will try again automatically.'), true); } return; }
  }
  let blob = null; try { blob = await PhotoDB.get('pend:' + it.id); } catch (e) {}
  S.pending = S.pending.filter(x => x.id !== it.id); save();
  pendBusy = false;
  const next = () => setTimeout(resolvePending, 400);
  const when = new Date(it.t).toLocaleDateString(LOC(), { day: 'numeric', month: 'long' });
  if (hit && !got(hit.c, hit.p)) {
    try { await PhotoDB.del('pend:' + it.id); } catch (e) {}
    closeSheets();
    unlock(hit.p, false, { cid: hit.c.id, photo: blob, t: it.t, verified: true, after: next });
    return;
  }
  if (hit) {
    try { if (blob && !(await PhotoDB.url(hit.p.id))) { await PhotoDB.put(hit.p.id, blob); hit.c.scanned[hit.p.id].photo = true; save(); } await PhotoDB.del('pend:' + it.id); } catch (e) {}
    closeSheets(); toast(L(`Ta photo du ${when} : « ${pname(hit.p)} » était déjà dans ta collection.`, `Your photo from ${when}: “${pname(hit.p)}” was already in your collection.`));
    refresh(); next(); return;
  }
  const url = blob ? URL.createObjectURL(blob) : null;
  sheet(`<div class="tag">${L(`Ta photo du ${when}`, `Your photo from ${when}`)}</div>
    ${url ? `<div class="pend-img"><img src="${url}" alt=""></div>` : ''}
    <h3>${L("Aucun lieu Monuverse à l'endroit de cette photo", 'No Monuverse place where this photo was taken')}</h3>
    <p>${L("Aucune carte ne se débloque. Tu peux garder la photo sur ton téléphone. Il manque un lieu ? Ajoute-le sur OpenStreetMap : il arrivera dans Monuverse.", 'No card unlocks. You can keep the photo on your phone. A place is missing? Add it on OpenStreetMap and it will come to Monuverse.')}</p>
    ${url ? `<a class="btn ghost" href="${url}" download="monuverse-${dayKey(it.t)}.jpg">${L('Enregistrer la photo', 'Save the photo')}</a>` : ''}
    <button class="btn gold" data-close>OK</button>`, async () => { try { await PhotoDB.del('pend:' + it.id); } catch (e) {} if (url) URL.revokeObjectURL(url); refresh(); next(); });
  refresh();
}
function recomputeStreak() {
  const days = new Set();
  for (const c of Object.values(S.cities)) for (const x of Object.values(c.scanned)) if (!x.gift && x.t) days.add(dayKey(x.t));
  if (!days.size) return;
  const last = [...days].sort().pop();
  let n = 1, d = last; while (days.has(dayBefore(d))) { n++; d = dayBefore(d); }
  if (last > S.streak.last || (last === S.streak.last && n > S.streak.n)) S.streak = { n, last };
}

/* ---------- Écran : Explorer (radar + lieu le plus proche) ---------- */
let scanSub = null;
function renderScan() {
  const c = city(); if (!c) return;
  header();
  if (!scanSub) { let lastR = 0; scanSub = () => { nearBadge(); if (tab === 'scan' && !document.querySelector('.sheet') && !document.querySelector('#s-scan .nav-pick:not([hidden])') && Date.now() - lastR > 2500) { lastR = Date.now(); renderScan(); } }; GPS.subs.add(scanSub); }
  const el = $('#s-scan');
  if (GPS.err === 'denied' || GPS.err === 'none') {
    el.innerHTML = `<div class="gps bad"><i></i><div><b>${L('GPS désactivé', 'GPS is off')}</b><br><span>${L('Monuverse a besoin de ta position pour vérifier que tu es devant un lieu.', 'Monuverse needs your location to check that you are at a place.')}</span></div></div>
      <div class="note"><b>${L("Pour l'activer", 'To turn it on')}</b><span>${L("Sur iPhone : Réglages › Confidentialité › Service de localisation › ton navigateur › « Lorsque l'app est active ». Sur Android : touche le cadenas à gauche de l'adresse › Autorisations › Position.", 'On iPhone: Settings › Privacy › Location Services › your browser › “While Using the App”. On Android: tap the padlock left of the address › Permissions › Location.')}</span><span>${L('Puis recharge la page.', 'Then reload the page.')}</span></div>`;
    return;
  }
  if (!GPS.pos) {
    el.innerHTML = `<div class="gps"><i></i><div><b>${L('Recherche de ta position…', 'Finding your location…')}</b><br><span>${L('Autorise la localisation si ton téléphone te le demande.', 'Allow location access if your phone asks.')}</span></div></div><button class="btn ghost what-btn" id="sc-what">${L("Qu'est-ce qu'il y a ici ?", "What's here?")}</button>${pendingHTML()}<div class="spinner" style="margin:40px auto"></div>`;
    $('#sc-what').onclick = whatHere;
    if ($('#pd-check')) $('#pd-check').onclick = () => resolvePending(true);
    return;
  }
  const me = GPS.pos, acc = Math.round(me.acc);
  const left = c.places.filter(p => !got(c, p)).map(p => ({ p, d: dist(me, p) })).sort((a, b) => a.d - b.d);
  const near = left[0];
  const daily = dailyPlace(c);
  const R = 600, around = c.places.map(p => ({ p, d: dist(me, p), b: bearing(me, p) })).filter(x => x.d <= R);
  const dots = around.map(({ p, d, b }) => {
    const rr = d / R * 130, a = (b - 90) * Math.PI / 180, x = 150 + rr * Math.cos(a), y = 150 + rr * Math.sin(a);
    return `<g class="dot ${got(c, p) ? 'got' : ''} ${daily === p ? 'today' : ''}" data-p="${p.id}" role="button" tabindex="0" aria-label="${esc(pname(p))}, ${distTxt(d)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${got(c, p) ? 5 : 7}" fill="var(--r-${p.r})"/></g>`;
  }).join('');
  const ir = near && inRange(near.p, me);
  el.innerHTML = `
    <div class="gps ${acc <= 30 ? 'ok' : acc <= 100 ? 'warn' : 'bad'}"><i></i><div><b>${acc <= 100 ? L('Position trouvée', 'Location found') : L('Position imprécise', 'Imprecise location')}</b> <span>· ${L('précision', 'accuracy')} ${acc} m${acc > 100 ? L(' : sors à découvert', ': move into the open') : ''}</span></div></div>
    <div class="row2 what-row"><button class="btn sea" id="sc-photo">${L('Prendre en photo', 'Take a photo')}</button><button class="btn ghost" id="sc-what">${L("Qu'est-ce qu'il y a ici ?", "What's here?")}</button></div>
    ${pendingHTML()}
    <div class="radar"><svg viewBox="0 0 300 300" aria-label="Radar des lieux autour de toi">
      <defs><radialGradient id="radar-g"><stop offset="0" stop-color="rgba(79,224,207,.14)"/><stop offset="1" stop-color="${document.documentElement.dataset.theme === 'light' ? 'rgba(255,255,255,.95)' : 'rgba(16,25,45,.9)'}"/></radialGradient>
      <linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="rgba(79,224,207,0)"/><stop offset="1" stop-color="rgba(79,224,207,.35)"/></linearGradient></defs>
      <circle class="bg" cx="150" cy="150" r="140"/>
      <circle class="rg" cx="150" cy="150" r="43"/><circle class="rg" cx="150" cy="150" r="87"/><circle class="rg" cx="150" cy="150" r="130"/>
      <text class="lbl" x="150" y="22" text-anchor="middle">N</text><text class="lbl" x="154" y="104">200 m</text><text class="lbl" x="154" y="61">400 m</text>
      ${calm() ? '' : '<path class="sweep" d="M150 150 L150 20 A130 130 0 0 1 242 58 Z" fill="url(#sw)"/>'}
      ${dots}<circle class="me-dot" cx="150" cy="150" r="7"/></svg></div>
    ${near ? `<div class="target r-${near.p.r} ${ir ? 'inrange' : ''}">
      <div class="row"><span class="ic">${shape(KINDS[near.p.k][1])}</span><div><span class="eyebrow">${ir ? L('Tu y es', "You're here") : L('Le plus proche', 'Nearest')}</span><b>${esc(pname(near.p))}</b><span>${kindLabel(near.p.k)} · ${rarLabel(near.p.r)}${daily === near.p ? L(' · lieu du jour ×2', ' · place of the day ×2') : ''}</span></div></div>
      ${ir ? `<button class="btn sea" id="sc-go">${L('Débloquer ce lieu', 'Unlock this place')}</button>`
        : `<div class="dir"><span style="display:inline-flex;transform:rotate(${bearing(me, near.p).toFixed(0)}deg)">${ARROW}</span><div><b>${distTxt(near.d)}</b> ${toward(bearing(me, near.p))}<br><span>${L(`Débloquable à moins de ${near.p.rad} m`, `Unlockable within ${near.p.rad} m`)}</span></div></div>
           <div class="nav-wrap">${navHTML(near.p, L('Itinéraire à pied', 'Walking directions'))}</div>`}
    </div>` : `<div class="empty">${L(`Tu as débloqué tous les lieux de ${esc(c.name)} ! Change de ville pour continuer.`, `You unlocked every place in ${esc(c.name)}! Switch city to keep going.`)}</div>`}
    ${near && near.d > 20000 ? `<p class="fine" style="margin-top:12px">${L(`Tu sembles loin de ${esc(c.name)}. Touche le nom de la ville en haut pour collectionner la ville où tu te trouves.`, `You seem far from ${esc(c.name)}. Tap the city name at the top to collect the city you are in.`)}</p>` : ''}`;
  if ($('#sc-go')) $('#sc-go').onclick = () => unlock(near.p);
  $('#sc-what').onclick = whatHere;
  $('#sc-photo').onclick = photoHere;
  if ($('#pd-check')) $('#pd-check').onclick = () => resolvePending(true);
  bindNav(el);
  $$('#s-scan [data-p]').forEach(g => { g.onclick = () => openPlace(g.dataset.p); g.onkeydown = e => { if (e.key === 'Enter') openPlace(g.dataset.p); }; });
}
/* « Qu'est-ce qu'il y a ici ? » : les lieux connus autour de toi, avec le GPS seul (marche sans réseau
   pour toutes les villes déjà ouvertes sur ce téléphone). Le nom et le type ; la petite histoire viendra avec Monuverse+. */
function whatHere() {
  const me = GPS.pos;
  if (!me) { toast(L('On cherche encore ta position. Sors à découvert quelques secondes, puis réessaie.', 'Still finding your location. Step outside for a few seconds, then try again.'), true); return; }
  const all = [];
  for (const [cid, c] of Object.entries(S.cities)) for (const p of c.places) all.push({ p, c, cid, d: dist(me, p) });
  all.sort((a, b) => a.d - b.d);
  let list = all.filter(x => x.d <= 250).slice(0, 8);
  const far = !list.length;
  if (far) list = all.filter(x => x.d <= 2000).slice(0, 3);
  const row = ({ p, c, cid, d }) => `<button class="pl r-${p.r} ${got(c, p) ? 'got' : 'locked'}" data-w="${esc(cid)}|${esc(p.id)}">
      <span class="ic">${shape(KINDS[p.k][1])}</span>
      <div><b>${esc(pname(p))}</b><span>${kindLabel(p.k)}${cid !== S.current ? ` · ${esc(c.name)}` : ''}${got(c, p) ? L(' · débloqué', ' · unlocked') : ''}</span></div>
      <span class="rt"><span class="dist">${inRange(p, me) ? L('ici', 'here') : distTxt(d)}</span><span class="gem">${inRange(p, me) ? '' : cardinal(bearing(me, p))}</span></span></button>`;
  const online = navigator.onLine !== false;
  const s = sheet(`<div class="tag">${L('Autour de toi', 'Around you')}</div>
    <h3>${list.length ? (far ? L('Rien de connu juste ici. Les lieux les plus proches :', 'Nothing known right here. Nearest places:') : L("Qu'est-ce qu'il y a ici ?", "What's here?")) : L('Aucun lieu connu autour de toi', 'No known places around you')}</h3>
    ${list.length ? `<div class="places">${list.map(row).join('')}</div>` : `<p>${online
      ? L("Tu n'as pas encore ouvert la ville où tu te trouves. Charge-la pour voir ses lieux.", "You haven't opened the city you are in yet. Load it to see its places.")
      : L("Sans réseau, Monuverse ne connaît que les villes déjà ouvertes sur ce téléphone. Ouvre la ville où tu es dès que tu retrouves du réseau.", 'Offline, Monuverse only knows the cities already opened on this phone. Open the city you are in as soon as you are back online.')}</p>`}
    ${online && (!list.length || far) ? `<button class="btn gold" id="wh-city">${L('Charger la ville où je suis', 'Load the city I am in')}</button>` : ''}
    <button class="btn ghost" data-close>${L('Fermer', 'Close')}</button>`);
  if (s.querySelector('#wh-city')) s.querySelector('#wh-city').onclick = () => { closeSheets(); gpsCity(); };
  s.querySelectorAll('[data-w]').forEach(b => b.onclick = () => {
    const [cid, pid] = b.dataset.w.split('|');
    if (!S.cities[cid]) return;
    if (cid !== S.current) { S.current = cid; save(); refresh(); }
    openPlace(pid);
  });
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
  const top = `<div class="seg three rank-seg" role="group"><button data-sc="ville" aria-pressed="${rankScope === 'ville'}">${esc(c.name)}</button><button data-sc="dep" aria-pressed="${rankScope === 'dep'}">${esc(dep)}</button><button data-sc="amis" aria-pressed="${rankScope === 'amis'}">${L('Amis', 'Friends')}</button></div>`;
  const inviteBtn = `<button class="btn gold invite-btn" id="rk-invite">${L('Inviter des amis', 'Invite friends')}</button>`;
  const mine = `<div class="note"><b>${esc(pseudo())} · ${fmt(S.xp)} points</b><span>${L(`${nPl(totalPlaces())} débloqué${totalPlaces() > 1 ? 's' : ''} · niveau ${level()} · série de ${nDays(streakNow())}`, `${nPl(totalPlaces())} unlocked · level ${level()} · ${nDays(streakNow())} streak`)}</span></div>`;
  const bind = () => { $$('#s-rank [data-sc]').forEach(b => b.onclick = () => { rankScope = b.dataset.sc; renderRank(); }); if ($('#rk-invite')) $('#rk-invite').onclick = inviteFriends; };
  if (!S.pseudo) {
    el.innerHTML = top + `<div class="note" style="margin-bottom:12px"><b>${L('Choisis ton pseudo pour entrer au classement', 'Pick a nickname to join the leaderboard')}</b><span>${L('Il sera visible par les autres joueurs. Pas ton vrai nom de famille !', 'Other players will see it. Not your real surname!')}</span>
      <form id="rk-form" class="search-row"><input id="rk-ps" maxlength="20" minlength="2" required placeholder="${L('Ton pseudo', 'Your nickname')}" aria-label="${L('Ton pseudo', 'Your nickname')}"><button class="btn gold small">${L('Valider', 'OK')}</button></form></div>` + mine;
    bind();
    $('#rk-form').onsubmit = e => { e.preventDefault(); setPseudo($('#rk-ps').value); renderRank(); };
    return;
  }
  if (!LB.on) {
    el.innerHTML = top + mine + `<div class="note" style="margin-top:12px"><b>${L('Le classement en ligne ouvre bientôt', 'The online leaderboard opens soon')}</b><span>${L("Continue à collectionner : tes points comptent déjà et apparaîtront dès l'ouverture.", 'Keep collecting: your points already count and will show up as soon as it opens.')}</span></div>`;
    bind(); return;
  }
  el.innerHTML = top + `<div class="lb" id="lb"><div class="spinner" style="margin:30px auto"></div></div>` + mine + inviteBtn;
  bind();
  try {
    LB.sync();
    const rows = rankScope === 'ville' ? await LB.top('ville_id', c.id) : rankScope === 'dep' ? await LB.top('departement', `${c.dep}|${c.cc}`) : await LB.friends();
    const me = LB.uid();
    if (rankScope === 'amis' && rows.filter(r => r.id !== me).length === 0) {
      $('#lb').innerHTML = `<div class="empty">${L('Pas encore d\'amis ici. Envoie ton lien d\'invitation : chaque ami qui le suit apparaît dans ce classement, et toi dans le sien.', 'No friends here yet. Send your invite link: every friend who follows it shows up here, and you in theirs.')}</div>`;
      return;
    }
    $('#lb').innerHTML = rows.length ? rows.map((r, i) => `<div class="lb-row ${r.id === me ? 'mine' : ''} ${i < 3 ? 'top' : ''}"><span class="rk">${i + 1}</span><span>${esc(txt(r.pseudo, 20))}${rankScope !== 'ville' ? `<small>${esc(txt(r.ville, 80))}</small>` : ''}</span><span class="pts">${fmt(num(r.points, 0, 1e7) ? r.points : 0)}</span></div>`).join('')
      : `<div class="empty">${L(`Personne encore ici. Débloque un lieu et deviens le premier collectionneur de ${esc(rankScope === 'ville' ? c.name : dep)} !`, `Nobody here yet. Unlock a place and become the first collector in ${esc(rankScope === 'ville' ? c.name : dep)}!`)}</div>`;
  } catch (e) {
    $('#lb').innerHTML = `<div class="empty">${L("Le classement n'a pas pu être chargé. Vérifie ta connexion.", 'The leaderboard could not be loaded. Check your connection.')}</div>`;
  }
}
/* Lien d'invitation : monuverse.fr/?ami=<identifiant>. L'ami qui le suit et toi apparaissez dans vos classements « Amis ». */
async function inviteFriends() {
  if (!LB.on) { toast(L('Le classement en ligne ouvre bientôt.', 'The online leaderboard opens soon.'), true); return; }
  if (!S.pseudo) { rankScope = 'amis'; go('rank'); toast(L("Choisis d'abord ton pseudo : c'est lui que tes amis verront.", 'Pick a nickname first: that is what your friends will see.'), true); return; }
  let id; try { id = await LB.myId(); } catch (e) {}
  if (!id) { toast(L("Pas de réseau pour créer ton lien d'invitation. Réessaie dans un instant.", 'No network to create your invite link. Try again in a moment.'), true); return; }
  LB.sync();
  const url = `https://monuverse.fr/?ami=${id}`;
  const text = L(`${S.pseudo} t'invite sur Monuverse : collectionne les monuments de ta ville et défie-moi au classement !`, `${S.pseudo} invites you to Monuverse: collect the landmarks of your city and challenge me on the leaderboard!`);
  try { if (navigator.share) { await navigator.share({ title: 'Monuverse', text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); toast(L('Lien copié : colle-le dans un message à tes amis.', 'Link copied: paste it in a message to your friends.')); }
  catch (e) { sheet(`<div class="tag">${L("Ton lien d'invitation", 'Your invite link')}</div><p style="word-break:break-all"><b>${esc(url)}</b></p><button class="btn gold" data-close>OK</button>`); }
}
/* Arrivée par un lien : ?ami=… (invitation) ou ?ville=fr12345 (page d'une ville) */
const ARRIVAL = (() => {
  let q; try { q = new URLSearchParams(location.search); } catch (e) { return {}; }
  const out = { ami: (q.get('ami') || '').toLowerCase(), ville: q.get('ville') || '' };
  if (!UUID.test(out.ami)) out.ami = '';
  if (!/^fr[0-9AB]{5}$/.test(out.ville)) out.ville = '';
  if (q.has('ami') || q.has('ville')) try { history.replaceState(null, '', location.pathname); } catch (e) {}
  return out;
})();
async function welcomeInvite() {
  if (!ARRIVAL.ami) return;
  const me = LB.uid();
  if (ARRIVAL.ami === me) return;
  if (!S.parrain) S.parrain = ARRIVAL.ami;   // le premier qui t'invite : vous vous voyez l'un l'autre (le parrain ne change plus ensuite)
  if (!S.amis.includes(ARRIVAL.ami)) S.amis = S.amis.concat(ARRIVAL.ami).slice(-200);
  save(); LB.sync();
  let who = null; try { who = await LB.who(ARRIVAL.ami); } catch (e) {}
  const msg = who ? L(`${who} t'invite à collectionner les monuments de ta ville !`, `${who} invites you to collect the landmarks of your city!`) : L('Un ami t\'invite à collectionner les monuments de ta ville !', 'A friend invites you to collect the landmarks of your city!');
  if (!$('#v-welcome').hidden) { const b = document.createElement('div'); b.className = 'note invite-note'; b.innerHTML = `<b>${esc(msg)}</b><span>${L('Vous serez dans le classement « Amis » l\'un de l\'autre.', 'You will be in each other\'s “Friends” leaderboard.')}</span>`; $('#v-welcome .wel-card').prepend(b); }
  else toast(who ? L(`${who} est maintenant dans tes amis.`, `${who} is now in your friends.`) : L('Ami ajouté.', 'Friend added.'));
}
function setPseudo(v) {
  v = String(v || '').trim().replace(/\s+/g, ' ').slice(0, 20);
  if (v.length < 2) { toast(L('Ton pseudo doit faire au moins 2 caractères.', 'Your nickname must be at least 2 characters.'), true); return false; }
  if (!/^[\p{L}\p{N} _.'-]{2,20}$/u.test(v)) { toast(L('Ton pseudo peut contenir des lettres, des chiffres, des espaces et . _ \' - uniquement.', 'Your nickname can only contain letters, numbers, spaces and . _ \' -'), true); return false; }
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
  const logo = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'icons/logo.jpg'; });
  const rr0 = (X, Y, w, h, rad) => { x.beginPath(); x.moveTo(X + rad, Y); x.arcTo(X + w, Y, X + w, Y + h, rad); x.arcTo(X + w, Y + h, X, Y + h, rad); x.arcTo(X, Y + h, X, Y, rad); x.arcTo(X, Y, X + w, Y, rad); x.closePath(); };
  if (logo) { const lw = 250, lh = lw * logo.height / logo.width, lx = (W - lw - 36) / 2; x.fillStyle = '#fff'; rr0(lx, 56, lw + 36, lh + 28, 34); x.fill(); x.drawImage(logo, lx + 18, 70, lw, lh); }
  else { x.font = '800 52px Unbounded, sans-serif'; x.fillStyle = '#EEF2FA'; x.fillText('MONUVERSE', W / 2, 150); }
  x.font = '600 38px Figtree, sans-serif'; x.fillStyle = '#8F9CB7'; x.fillText(L('Je collectionne', "I'm collecting"), W / 2, 400);
  // nom de la ville sur 1 ou 2 lignes
  let fs = 104; x.font = `800 ${fs}px Unbounded, sans-serif`;
  const words = c.name.split(/(?<=[\s-])/); const lines = []; let cur = '';
  for (const w of words) { if (x.measureText(cur + w).width > W - 140 && cur) { lines.push(cur); cur = w; } else cur += w; }
  lines.push(cur); while (lines.length > 2) { fs -= 10; x.font = `800 ${fs}px Unbounded, sans-serif`; lines.splice(0, lines.length, c.name); }
  while (x.measureText(lines.reduce((a, b) => a.length > b.length ? a : b)).width > W - 120 && fs > 50) { fs -= 6; x.font = `800 ${fs}px Unbounded, sans-serif`; }
  x.fillStyle = '#EEF2FA'; lines.forEach((l, i) => x.fillText(l.trim(), W / 2, 515 + i * (fs + 14)));
  const top = 515 + (lines.length - 1) * (fs + 14);
  // anneau
  const cx = W / 2, cy = top + 330, r = 210, p = pct(c);
  x.lineWidth = 34; x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,.08)'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
  const rg = x.createLinearGradient(cx - r, 0, cx + r, 0); rg.addColorStop(0, '#C8862A'); rg.addColorStop(.6, '#F5B841'); rg.addColorStop(1, '#FFE2A0');
  x.strokeStyle = rg; x.beginPath(); x.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.max(.02, p / 100) * Math.PI * 2); x.stroke();
  x.fillStyle = '#EEF2FA'; x.font = '800 120px Unbounded, sans-serif'; x.fillText(`${p}%`, cx, cy + 40);
  x.font = '600 36px Figtree, sans-serif'; x.fillStyle = '#8F9CB7'; x.fillText(L(`${nGot(c)} lieux sur ${c.places.length}`, `${nGot(c)} of ${c.places.length} places`), cx, cy + 100);
  // stats
  const sy = cy + r + 120, stats = [[`${streakNow()}`, L('jours de suite', 'day streak')], [fmt(S.xp), 'XP'], [`${level()}`, L('niveau', 'level')]];
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
    x.textAlign = 'left'; x.fillStyle = col[q.r]; x.font = '700 20px "JetBrains Mono", monospace'; x.fillText(rarLabel(q.r).toUpperCase(), 22, 282);
    x.fillStyle = '#EEF2FA'; x.font = '700 26px Figtree, sans-serif'; const qn = pname(q); let t = qn; while (x.measureText(t).width > cw - 44 && t.length > 4) t = t.slice(0, -2); if (t !== qn) t = t.trim() + '…'; x.fillText(t, 22, 322);
    x.textAlign = 'center'; x.restore();
  }
  x.fillStyle = '#EEF2FA'; x.font = '700 40px Figtree, sans-serif'; x.fillText(L('Et toi, tu as combien de lieux dans ta ville ?', 'How many places can you collect in your city?'), W / 2, H - 170);
  x.fillStyle = '#4FE0CF'; x.font = '700 32px "JetBrains Mono", monospace'; x.fillText((location.host + location.pathname).replace(/\/$/, '').replace(/index\.html$/, '') || 'monuverse', W / 2, H - 110);
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function shareStory() {
  const s = sheet(`<div class="tag">${L('Ta story', 'Your story')}</div><div class="story-prev"><div class="spinner" style="margin:120px auto"></div></div>
    <div class="row2"><button class="btn gold" id="st-share" disabled>${L('Partager', 'Share')}</button><button class="btn ghost" data-close>${L('Fermer', 'Close')}</button></div>`);
  const blob = await storyBlob(); if (!blob) { toast(L("L'image n'a pas pu être créée.", 'The image could not be created.'), true); return; }
  const url = URL.createObjectURL(blob);
  s.querySelector('.story-prev').innerHTML = `<img src="${url}" alt="${L('Ta story Monuverse', 'Your Monuverse story')}">`;
  const file = new File([blob], `monuverse-${city().name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, { type: 'image/png' });
  const btn = $('#st-share'); btn.disabled = false;
  const canFiles = navigator.canShare && navigator.canShare({ files: [file] });
  btn.textContent = canFiles ? L('Partager', 'Share') : L('Enregistrer l\'image', 'Save image');
  btn.onclick = async () => {
    if (canFiles) { try { await navigator.share({ files: [file], text: L(`Je collectionne ${city().name} sur Monuverse : ${pct(city())} % !`, `I'm collecting ${city().name} on Monuverse: ${pct(city())}%!`) }); } catch (e) {} return; }
    const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  };
}

/* ---------- Langue ---------- */
function applyLang() {
  const want = S.lang === 'fr' || S.lang === 'en' ? S.lang : ((navigator.languages || [navigator.language || 'fr']).find(l => /^(fr|en)/i.test(l)) || 'en').slice(0, 2).toLowerCase();
  LANG = want === 'fr' ? 'fr' : 'en';
  document.documentElement.lang = LANG;
  $$('[data-i18n]').forEach(e => { const t = STATIC[e.dataset.i18n]; if (t) e.textContent = L(t[0], t[1]); });
  $$('[data-i18n-ph]').forEach(e => { const t = STATIC[e.dataset.i18nPh]; if (t) { e.placeholder = L(t[0], t[1]); e.setAttribute('aria-label', L(t[0], t[1])); } });
  $('#t-city').setAttribute('aria-label', L('Changer de ville', 'Change city'));
  document.title = L('Monuverse : collectionne les monuments de ta ville', 'Monuverse: collect the landmarks of your city');
  if (city() && !$('#v-main').hidden) refresh();
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
    <div class="note" style="margin-top:6px"><b>${esc(pseudo())} · ${fmt(S.xp)} XP · ${L('niveau', 'level')} ${level()}${S.badges.length ? ` · ${S.badges.length} badge${S.badges.length > 1 ? 's' : ''}` : ''}</b><span>${L(`${nPl(totalPlaces())} dans ${nCities(cities.length)} et ${ncc} pays · série en cours : ${nDays(streakNow())}`, `${nPl(totalPlaces())} in ${nCities(cities.length)} and ${ncc} countr${ncc !== 1 ? 'ies' : 'y'} · current streak: ${nDays(streakNow())}`)}</span></div>
    ${albumsHTML()}
    <form id="pf-form" class="field" style="margin-top:14px"><label for="pf-ps">${L('Pseudo (visible au classement)', 'Nickname (shown on the leaderboard)')}</label><div class="search-row"><input id="pf-ps" maxlength="20" minlength="2" value="${esc(S.pseudo)}" placeholder="${L('Ton pseudo', 'Your nickname')}"><button class="btn ghost small">${L('Enregistrer', 'Save')}</button></div></form>
    <div class="sec"><h3>${L('Mes villes', 'My cities')}</h3><span>${cities.length}</span></div>
    <div class="places">${cities.map(c => `<button class="pl ${c.id === S.current ? 'got' : 'locked'}" data-c="${c.id}"><span class="ic">${shape('columns')}</span><div><b>${esc(c.name)}</b><span>${esc(c.dep || c.country)}</span></div><span class="rt"><span class="dist">${pct(c)} %</span><span class="gem">${nGot(c)}/${c.places.length}</span></span></button>`).join('')}</div>
    <button class="btn ghost" id="pf-invite" style="margin-top:14px">${L('Inviter des amis', 'Invite friends')}</button>
    <div class="row2" style="margin-top:10px"><button class="btn gold" id="ct-here">${L('La ville où je suis', 'The city I am in')}</button><button class="btn ghost" id="ct-add">${L('Chercher une ville', 'Find a city')}</button></div>
    <div class="sec"><h3>${L('Réglages', 'Settings')}</h3></div>
    <div class="field"><span>${L('Langue', 'Language')}</span><div class="seg three" role="group" aria-label="${L('Langue', 'Language')}">${[['auto', 'Auto'], ['fr', 'Français'], ['en', 'English']].map(([k, l]) => `<button data-lg="${k}" aria-pressed="${(S.lang || 'auto') === k}">${l}</button>`).join('')}</div></div>
    <div class="field"><span>${L('Apparence', 'Appearance')}</span><div class="seg three" role="group" aria-label="${L('Apparence', 'Appearance')}">${[['auto', 'Auto'], ['light', L('Clair', 'Light')], ['dark', L('Sombre', 'Dark')]].map(([k, l]) => `<button data-th="${k}" aria-pressed="${(S.theme || 'auto') === k}">${l}</button>`).join('')}</div></div>
    <div style="display:grid;gap:8px">
      <button class="btn ghost" id="pf-refresh">${L('Mettre à jour les lieux de', 'Refresh the places of')} ${esc(city().name)}</button>
      <button class="btn ghost" id="pf-wipe">${L('Effacer toutes mes données', 'Delete all my data')}</button>
    </div>
    <p class="fine" style="margin-top:14px">${L('Tes collections et tes photos restent sur ce téléphone. Seuls ton pseudo, ta ville et tes points sont envoyés au classement. Lieux © contributeurs OpenStreetMap (ODbL). Photos des lieux : Wikimedia Commons, auteurs crédités sur chaque fiche.', 'Your collections and photos stay on this phone. Only your nickname, city and points are sent to the leaderboard. Places © OpenStreetMap contributors (ODbL). Place photos: Wikimedia Commons, authors credited on each card.')}</p>
    <p class="fine copy">${L('© 2026 Monuverse. Tous droits réservés. Le nom, le logo, le code et le design de Monuverse sont protégés ; toute copie est interdite sans autorisation.', '© 2026 Monuverse. All rights reserved. The Monuverse name, logo, code and design are protected; copying without permission is prohibited.')}</p>`;
  $('#pf-form').onsubmit = e => { e.preventDefault(); if (setPseudo($('#pf-ps').value)) { toast(L('Pseudo enregistré.', 'Nickname saved.')); renderMoi(); } };
  $$('#s-moi [data-c]').forEach(b => b.onclick = () => { S.current = b.dataset.c; save(); filter = 'tous'; go('ville'); });
  $$('#s-moi [data-al]').forEach(b => b.onclick = () => { filter = b.dataset.al; listMax = 40; go('ville'); });
  if ($('#al-more')) $('#al-more').onclick = () => { albumsAll = true; renderMoi(); };
  $$('#s-moi [data-th]').forEach(b => b.onclick = () => { S.theme = b.dataset.th; save(); applyTheme(); renderMoi(); });
  $$('#s-moi [data-lg]').forEach(b => b.onclick = () => { S.lang = b.dataset.lg; save(); applyLang(); renderMoi(); });
  $('#ct-here').onclick = gpsCity;
  $('#pf-invite').onclick = inviteFriends;
  $('#ct-add').onclick = () => welcome(true);
  $('#pf-refresh').onclick = () => loadCity(city(), { force: true });
  $('#pf-wipe').onclick = () => {
    const b = $('#pf-wipe');
    if (b.dataset.sure) { LB.forget(); PhotoDB.clear(); try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); return; }
    b.dataset.sure = '1'; b.textContent = L('Touche encore pour tout effacer', 'Tap again to delete everything'); b.style.borderColor = 'var(--danger)'; b.style.color = 'var(--danger)';
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
    <div class="gstats"><div><b>${ccs.size}</b><span>${L('pays', ccs.size > 1 ? 'countries' : 'country')}</span></div><div><b>${started.length}</b><span>${nCities(started.length).replace(/^\d+ /, '')}</span></div><div><b>${totalPlaces()}</b><span>${nPl(totalPlaces()).replace(/^\d+ /, '')}</span></div></div>
    <div class="globe-wrap"><div id="globe" role="img" aria-label="Globe de tes villes et pays"><canvas aria-hidden="true"></canvas><svg class="gpins"></svg></div>
      <div class="zoom"><button id="gz-in" aria-label="${L('Zoomer', 'Zoom in')}">+</button><button id="gz-out" aria-label="${L('Dézoomer', 'Zoom out')}">−</button><button id="gz-home" aria-label="${L('Revenir sur ma ville', 'Back to my city')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button></div>
      <span class="ghint" id="ghint">${L('Fais glisser ton doigt pour tourner la Terre', 'Drag your finger to spin the Earth')}</span></div>
    <div id="gfocus"></div>
    <p class="fine">${L('Chaque ville que tu commences allume son pays en or. Voyage, collectionne, et remplis ton globe.', 'Every city you start lights up its country in gold. Travel, collect and fill your globe.')}</p>
    <button class="btn ghost" id="g-add" style="margin-top:12px">${L('Ajouter une ville', 'Add a city')}</button>`;
  $('#g-add').onclick = () => go('moi');
  let land;
  try { land = await loadWorld(); } catch (e) { $('#ghint').textContent = L("Le globe n'a pas pu se charger. Vérifie ta connexion.", 'The globe could not load. Check your connection.'); return; }
  if (tab !== 'globe' || typeof d3 === 'undefined') return;
  drawGlobe(land, ccs);
}
const DEG = Math.PI / 180, HALF = Math.PI / 2;
let partsCache = null;
function globeParts(land) {
  if (partsCache && partsCache.land === land) return partsCache.parts;
  const parts = [];
  for (const f of land) {
    const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      const pg = { type: 'Polygon', coordinates: poly }, c = d3.geoCentroid(pg);
      let r = 0; for (const pt of poly[0]) r = Math.max(r, d3.geoDistance(c, pt));
      const rings = poly.map(ring => { const a = new Float64Array(ring.length * 3); ring.forEach(([lo, la], i) => { a[i * 3] = lo * DEG; a[i * 3 + 1] = Math.sin(la * DEG); a[i * 3 + 2] = Math.cos(la * DEG); }); return a; });
      parts.push({ g: pg, cc: f.properties.cc, lon: c[0] * DEG, sl: Math.sin(c[1] * DEG), cl: Math.cos(c[1] * DEG), r, rings });
    }
  }
  partsCache = { land, parts };
  return parts;
}
/* Le globe est peint sur un canvas (rapide, même sur iPhone) ; seules les épingles des villes sont en SVG par-dessus. */
function drawGlobe(land, ccs) {
  const el = $('#globe'); if (!el) return;
  const cv = el.querySelector('canvas'), ov = el.querySelector('svg');
  const w = el.clientWidth || 380, h = el.clientHeight || 380, base = Math.min(w, h) / 2 - 16;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const c0 = city();
  const rot = GL.proj ? GL.proj.rotate() : [-(c0 ? c0.lon : 2), -(c0 ? c0.lat : 45) * .6, 0];
  const proj = d3.geoOrthographic().translate([w / 2, h / 2]).rotate(rot).clipAngle(90).precision(0);
  GL.proj = proj;
  const path = d3.geoPath(proj, ctx);
  const css = getComputedStyle(document.documentElement), v = n => css.getPropertyValue(n).trim();
  const light = document.documentElement.dataset.theme === 'light';
  const COL = light
    ? { o0: '#E3F0FB', o1: '#BFD8F0', o2: '#9DBFE3', land: '#F7F9FC', edge: '#A9BAD3', grat: 'rgba(20,50,100,.10)', shade: 'rgba(10,26,58,.18)', vis: v('--gold') || '#E8A526', visEdge: '#B57C0B', atmo: 'rgba(18,168,153,' }
    : { o0: '#1B3A6E', o1: '#0E2047', o2: '#081430', land: '#2A3B5C', edge: '#3B4F75', grat: 'rgba(160,190,255,.07)', shade: 'rgba(0,0,0,.45)', vis: '#F5B841', visEdge: '#FFE2A0', atmo: 'rgba(79,224,207,' };
  const grat = d3.geoGraticule10(), sphere = { type: 'Sphere' };
  const parts = globeParts(land);
  const cities = Object.values(S.cities);
  d3.select(ov).attr('viewBox', `0 0 ${w} ${h}`).selectAll('*').remove();
  const R = 11, C = 2 * Math.PI * R;
  const pins = d3.select(ov).append('g').selectAll('g').data(cities).join('g').attr('class', c => 'pin' + (c.id === S.current ? ' cur' : ''))
    .attr('role', 'button').attr('tabindex', 0).attr('aria-label', c => `${c.name}, ${pct(c)} %`);
  pins.append('circle').attr('class', 'bg').attr('r', 15);
  pins.append('circle').attr('class', 'tr').attr('r', R);
  pins.append('circle').attr('class', 'pr').attr('r', R).attr('transform', 'rotate(-90)').attr('stroke-dasharray', c => `${C * pct(c) / 100} ${C}`).attr('visibility', c => pct(c) ? null : 'hidden');
  pins.append('text').attr('class', 'pc').text(c => pct(c));
  pins.append('text').attr('class', 'lb').attr('x', 19).attr('y', 4).text(c => c.name);
  const me = d3.select(ov).append('circle').attr('class', 'me').attr('r', 5);
  let queued = false;
  const paint = () => {
    queued = false;
    const s = base * GL.k; proj.scale(s);
    ctx.clearRect(0, 0, w, h);
    const ga = ctx.createRadialGradient(w / 2, h / 2, s * .9, w / 2, h / 2, s * 1.14);
    ga.addColorStop(0, COL.atmo + '0)'); ga.addColorStop(.25, COL.atmo + '.35)'); ga.addColorStop(1, COL.atmo + '0)');
    ctx.fillStyle = ga; ctx.beginPath(); ctx.arc(w / 2, h / 2, s * 1.14, 0, 7); ctx.fill();
    const go = ctx.createRadialGradient(w / 2 - s * .3, h / 2 - s * .35, s * .1, w / 2, h / 2, s);
    go.addColorStop(0, COL.o0); go.addColorStop(.6, COL.o1); go.addColorStop(1, COL.o2);
    ctx.fillStyle = go; ctx.beginPath(); path(sphere); ctx.fill();
    ctx.strokeStyle = COL.grat; ctx.lineWidth = .6; ctx.beginPath(); path(grat); ctx.stroke();
    const rt = proj.rotate(), lon0 = -rt[0] * DEG, s0 = Math.sin(-rt[1] * DEG), c0 = Math.cos(-rt[1] * DEG), cx = w / 2, cy = h / 2;
    for (const vis of [false, true]) {
      ctx.beginPath(); let any = false;
      for (const p of parts) {
        if (ccs.has(p.cc) !== vis) continue;
        const d = Math.acos(Math.max(-1, Math.min(1, s0 * p.sl + c0 * p.cl * Math.cos(p.lon - lon0))));
        if (d - p.r > HALF) continue;
        any = true;
        if (d + p.r > HALF - .02 && p.r > .6) { path(p.g); continue; }   // grands pays à cheval sur l'horizon : découpage exact
        for (const a of p.rings) {
          for (let i = 0; i < a.length; i += 3) {
            const dl = a[i] - lon0, sl = a[i + 1], cl = a[i + 2], cdl = Math.cos(dl);
            let x = cl * Math.sin(dl), y = c0 * sl - s0 * cl * cdl;
            if (s0 * sl + c0 * cl * cdl < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; }   // face cachée : ramené sur le bord
            const X = cx + s * x, Y = cy - s * y;
            if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
          }
          ctx.closePath();
        }
      }
      if (!any) continue;
      if (vis) { ctx.fillStyle = COL.vis; ctx.strokeStyle = COL.visEdge; ctx.globalAlpha = .92; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = .5; ctx.stroke(); }
      else { ctx.fillStyle = COL.land; ctx.strokeStyle = COL.edge; ctx.lineWidth = .4; ctx.fill(); ctx.stroke(); }
    }
    const gs = ctx.createRadialGradient(w / 2 - s * .35, h / 2 - s * .4, s * .2, w / 2, h / 2, s);
    gs.addColorStop(0, 'rgba(0,0,0,0)'); gs.addColorStop(.6, 'rgba(0,0,0,0)'); gs.addColorStop(1, COL.shade);
    ctx.fillStyle = gs; ctx.beginPath(); path(sphere); ctx.fill();
    const ctr = [-proj.rotate()[0], -proj.rotate()[1]];
    pins.attr('display', c => d3.geoDistance(ctr, [c.lon, c.lat]) < 1.5 ? null : 'none')
      .attr('transform', c => { const p = proj([c.lon, c.lat]); return p ? `translate(${p[0].toFixed(1)},${p[1].toFixed(1)})` : null; });
    pins.select('.lb').attr('display', GL.k >= 2.5 || cities.length < 4 ? null : 'none');
    const pos = GPS.pos;
    if (pos && d3.geoDistance(ctr, [pos.lon, pos.lat]) < 1.5) { const p = proj([pos.lon, pos.lat]); me.attr('display', null).attr('cx', p[0]).attr('cy', p[1]); } else me.attr('display', 'none');
  };
  const update = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  GL.update = update; GL.paint = paint;
  paint();
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
  f.innerHTML = `<div class="gfocus"><b>${esc(c.name)}</b><span>${esc(c.country || c.dep)} · ${nGot(c)}/${nPl(c.places.length)} · ${pct(c)} %</span><button id="gf-open">${c.id === S.current ? L('Ouvrir', 'Open') : L('Y jouer', 'Play here')}</button></div>`;
  $('#gf-open').onclick = () => { S.current = c.id; save(); filter = 'tous'; go('ville'); };
}

/* ---------- Accueil et chargement d'une ville ---------- */
function welcome(back) {
  show('welcome');
  $('#w-res').innerHTML = back ? `<button class="link" id="w-back">${L('Revenir à', 'Back to')} ${esc(city().name)}</button>` : '';
  if (back) $('#w-back').onclick = () => show('main');
}
function gpsCity() {
  if (!('geolocation' in navigator)) { show('welcome'); $('#w-res').innerHTML = `<p class="msg err">${L('Ton navigateur ne donne pas accès à la position. Cherche ta ville par son nom.', 'Your browser does not give access to your location. Search for your city by name.')}</p>`; return; }
  show('loading'); $('#l-title').textContent = L('Où es-tu ?', 'Where are you?'); $('#l-sub').textContent = L('Autorise la localisation si ton téléphone te le demande.', 'Allow location access if your phone asks.');
  navigator.geolocation.getCurrentPosition(async p => {
    GPS.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
    try { await loadCity(await cityAt(p.coords.latitude, p.coords.longitude)); }
    catch (e) { show('welcome'); $('#w-res').innerHTML = `<p class="msg err">${L('Impossible de trouver ta ville. Vérifie ta connexion, ou cherche-la par son nom.', 'Could not find your city. Check your connection, or search for it by name.')}</p>`; }
  }, e => {
    show('welcome');
    $('#w-res').innerHTML = `<p class="msg err">${e.code === 1 ? L('La localisation est refusée. Cherche ta ville par son nom, ou autorise la position dans les réglages de ton navigateur.', 'Location access was denied. Search for your city by name, or allow location in your browser settings.') : L('Ta position est introuvable pour le moment. Cherche ta ville par son nom.', 'Your location cannot be found right now. Search for your city by name.')}</p>`;
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 });
}
async function loadCity(c, { force = false } = {}) {
  const twin = Object.values(S.cities).find(x => x.id !== c.id && x.cc === c.cc && nrm(x.name) === nrm(c.name) && dist(x, c) < 8000);
  if (twin && !S.cities[c.id]) { S.cities[c.id] = Object.assign({}, twin, c, { ver: 0 }); delete S.cities[twin.id]; if (S.current === twin.id) S.current = c.id; save(); }
  const old = S.cities[c.id];
  if (old && !force && old.places.length && old.ver === DATA_VER && Date.now() - (old.fetched || 0) < 14 * 864e5) { S.current = c.id; save(); filter = 'tous'; show('main'); go('ville'); return; }
  show('loading'); $('#l-title').textContent = L(`Recherche des lieux de ${c.name}…`, `Looking for places in ${c.name}…`); $('#l-sub').textContent = L('Statues, fontaines, églises, fresques, monuments : on parcourt la carte.', 'Statues, fountains, churches, murals, monuments: scanning the map.');
  let places;
  try { places = await fetchPlaces(c); }
  catch (e) {
    if (old) { show('main'); go('ville'); toast(L("Les lieux n'ont pas pu être mis à jour. Réessaie plus tard.", 'Places could not be updated. Try again later.'), true); return; }
    show('welcome'); $('#w-res').innerHTML = `<p class="msg err">${L(`La carte de ${esc(c.name)} n'a pas pu être chargée. Vérifie ta connexion et réessaie dans une minute.`, `The map of ${esc(c.name)} could not be loaded. Check your connection and try again in a minute.`)}</p>`; return;
  }
  if (!places.length) { show('welcome'); $('#w-res').innerHTML = `<p class="msg err">${L(`Aucun lieu trouvé à ${esc(c.name)} pour le moment. Essaie la ville voisine, ou ajoute des lieux sur OpenStreetMap.`, `No places found in ${esc(c.name)} yet. Try a neighbouring town, or add places on OpenStreetMap.`)}</p>`; return; }
  const scanned = old ? Object.fromEntries(Object.entries(old.scanned).filter(([id]) => places.some(p => p.id === id))) : {};
  // garde les lieux déjà débloqués même s'ils ont disparu de la carte
  if (old) old.places.filter(p => old.scanned[p.id] && !places.some(q => q.id === p.id)).forEach(p => { places.push(p); scanned[p.id] = old.scanned[p.id]; });
  places = tidyPlaces(places, c.name, scanned);
  S.cities[c.id] = Object.assign({}, c, { places, scanned, fetched: Date.now(), ver: DATA_VER });
  S.current = c.id; save(); filter = 'tous';
  show('main'); go('ville');
  if (!old) welcomeGift();
}
/* Premier plaisir immédiat : un lieu offert dès l'arrivée */
function welcomeGift() {
  const c = city();
  const gift = c.places.find(p => p.k === 'mairie') || c.places.find(p => p.r === 'commune' && p.named) || c.places[0];
  const s = sheet(`<div class="tag">${L('Bienvenue à', 'Welcome to')} ${esc(c.name)}</div>
    <h3>${L(`${esc(c.name)} contient ${nPl(c.places.length)} à collectionner`, `${esc(c.name)} has ${nPl(c.places.length)} to collect`)}</h3>
    <p>${L("Pour bien commencer, on t'offre ta première carte.", 'To get you started, here is your first card.')}</p>
    <button class="btn gold" id="g-open">${L('Ouvrir ma première carte', 'Open my first card')}</button>`);
  $('#g-open').onclick = () => { s.remove(); unlock(gift, true); };
}

/* ---------- Démarrage ---------- */
$('#w-gps').onclick = gpsCity;
const resRow = (c, i) => `<button class="res" data-i="${i}"><b>${esc(c.name)}</b><span>${esc([c.dep, c.region && c.region !== c.dep ? c.region : '', c.country].filter(Boolean).join(' · '))}${c.n ? ` · ${nPl(c.n)}` : ''}</span></button>`;
function showResults(list, q, world) {
  const res = $('#w-res');
  res.innerHTML = (list.length ? list.map(resRow).join('') : `<p class="msg">${world ? L("Aucune ville trouvée. Vérifie l'orthographe ou ajoute le pays, par exemple « Kingston Jamaïque ».", 'No city found. Check the spelling or add the country, e.g. “Kingston Jamaica”.') : L('Aucune commune de France trouvée.', 'No French town found.')}</p>`)
    + (world ? '' : `<button class="link" id="w-world">${L("Ma ville n'est pas en France : chercher dans le monde", 'My city is not in France: search worldwide')}</button>`);
  $$('#w-res [data-i]').forEach(b => b.onclick = () => loadCity(list[+b.dataset.i]));
  if ($('#w-world')) $('#w-world').onclick = () => searchWorld(q);
}
async function searchWorld(q) {
  $('#w-res').innerHTML = `<p class="msg">${L('Recherche dans le monde…', 'Searching worldwide…')}</p>`;
  try { showResults(await searchCities(q), q, true); }
  catch (err) { $('#w-res').innerHTML = `<p class="msg err">${L('La recherche ne répond pas. Vérifie ta connexion et réessaie.', 'Search is not responding. Check your connection and try again.')}</p>`; }
}
let qTimer = null;
async function searchLocal(q, submit) {
  if (q.length < 2) { if (!submit) $('#w-res').innerHTML = ''; return; }
  try { const list = await searchFR(q); if ($('#w-q').value.trim() !== q) return; if (list.length || !submit) showResults(list, q, false); else searchWorld(q); }
  catch (e) { if (submit) searchWorld(q); }
}
$('#w-q').addEventListener('input', () => { clearTimeout(qTimer); const q = $('#w-q').value.trim(); qTimer = setTimeout(() => searchLocal(q, false), 150); });
$('#w-form').onsubmit = e => { e.preventDefault(); clearTimeout(qTimer); searchLocal($('#w-q').value.trim(), true); };
$$('.tab').forEach(b => b.onclick = () => go(b.dataset.tab));
$('#t-city').onclick = openCities;
$('#t-me').onclick = () => go('moi');
document.addEventListener('visibilitychange', () => { if (document.hidden) stopGPS(); else if (tab === 'scan') startGPS(); });

load();
applyTheme();
applyLang();
if (albumsFresh) { for (const a of allAlbums()) if (a.done) S.albums[a.id] = Date.now(); albumsFresh = false; }
window.addEventListener('online', () => resolvePending());
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(resolvePending, 1200); });
setTimeout(resolvePending, 2500);
(async () => {
  setTimeout(welcomeInvite, 0);
  if (ARRIVAL.ville) {
    try {
      const j = await loadFR(), row = j.communes.find(r => 'fr' + r[0] === ARRIVAL.ville);
      if (row) { await loadCity(frCity(j, row)); return; }
    } catch (e) {}
  }
  const c = city();
  if (!c) { show('welcome'); return; }
  // Une ville de France enregistrée avant les données préparées : on la rattache à sa commune
  if (c.cc === 'FR' && !c.insee) {
    try {
      const j = await loadFR(), v = nrm(c.name);
      const row = j.communes.filter((r, i) => j.norm[i] === v).sort((a, b) => dist(c, { lat: a[2], lon: a[3] }) - dist(c, { lat: b[2], lon: b[3] }))[0];
      if (row && dist(c, { lat: row[2], lon: row[3] }) < 8000) { await loadCity(frCity(j, row)); return; }
    } catch (e) {}
  }
  if (c.ver !== DATA_VER && navigator.onLine !== false) loadCity(c);
  else { show('main'); go('ville'); }
})();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

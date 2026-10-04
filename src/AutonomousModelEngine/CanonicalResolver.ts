// src/AutonomousModelEngine/CanonicalResolver.ts
// Resolves a free-text query ("v8 engine", "heart", "show me the solar system") to a real
// SPATIAL_LIBRARY canonical object, so typing anything recognisable ALWAYS surfaces a real,
// fully-detailed model instead of falling through to a blank AI-generated placeholder.
//
// Two passes:
//   1. Keyword/alias lookup across every single canonical id (not a partial subset).
//   2. If nothing matches, a fuzzy token-overlap fallback that picks the closest canonical
//      object to the query rather than returning null -- "no match" should be rare, and when
//      it happens the result should still be the nearest real thing in the library.

import { ObjectMetadata, SPATIAL_LIBRARY } from '../SpatialLibrary';

// Order matters: more specific / higher-priority entries are checked first within a tier, and
// the precision digital-twin entries are listed ahead of the older "_scientific" simulation
// duplicates so a generic query ("heart", "v8") lands on the detailed model by default. The
// "_scientific" variants stay reachable via their own, more specific phrasing.
const KEYWORDS: Array<{ id: string; words: string[] }> = [
  // --- Anatomy (precision models) ---
  { id: 'human_heart', words: ['heart', 'cardiac', 'human heart', 'heart anatomy', 'cardiovascular system'] },
  { id: 'human_brain', words: ['brain', 'human brain', 'cerebrum', 'cerebral', 'neuroanatomy'] },
  { id: 'human_lungs', words: ['lung', 'lungs', 'respiratory system', 'human lungs', 'pulmonary'] },
  { id: 'human_eye', words: ['eye', 'human eye', 'eyeball', 'ocular', 'retina'] },
  { id: 'human_skeleton', words: ['skeleton', 'bones', 'skeletal system', 'human skeleton', 'bone structure'] },
  // --- Anatomy (legacy simplified simulation duplicates — specific phrasing only) ---
  { id: 'human_anatomy_scientific', words: ['cardiovascular atlas', 'respiratory atlas', 'biological systems atlas', 'physiological simulation'] },

  // --- Automotive / mechanical (precision + premium-detail models) ---
  { id: 'v12_engine', words: ['v12', 'v-12', '12 cylinder engine', 'v12 engine'] },
  { id: 'v8_engine', words: ['v8', 'v-8', '8 cylinder engine', 'v8 engine'] },
  { id: 'v8_engine_scientific', words: ['v8 scientific', 'v8 simulation', 'v8 thermodynamic'] },
  { id: 'inline4_engine', words: ['inline 4', 'inline-4', 'i4 engine', 'straight 4', '4 cylinder engine', 'inline4'] },
  { id: 'rotary_engine', words: ['rotary engine', 'wankel', 'rotary motor'] },
  { id: 'turbocharger', words: ['turbocharger', 'turbo', 'turbine charger'] },
  { id: 'differential', words: ['differential', 'limited slip differential', 'lsd', 'diff'] },
  { id: 'gearbox', words: ['gearbox', 'transmission', 'manual gearbox'] },
  { id: 'suspension', words: ['suspension', 'macpherson strut', 'strut assembly', 'shock absorber'] },
  { id: 'brake_disc', words: ['brake disc', 'brake rotor', 'brake caliper', 'carbon ceramic brake', 'brakes'] },
  { id: 'steering_assembly', words: ['steering', 'rack and pinion', 'steering rack', 'steering assembly'] },
  { id: 'planetary_gearset', words: ['planetary gearset', 'planetary gear', 'epicyclic gear'] },
  { id: 'hydraulic_pump', words: ['hydraulic pump', 'hydraulics'] },
  { id: 'jet_engine_core', words: ['jet engine', 'turbofan', 'turbojet', 'jet engine core', 'aircraft engine'] },

  // --- Motors / power electronics ---
  { id: 'pmsm_motor', words: ['pmsm', 'permanent magnet synchronous motor'] },
  { id: 'tesla_motor', words: ['tesla motor', 'induction motor', 'ev motor', 'electric car motor'] },
  { id: 'brushless_motor', words: ['brushless motor', 'bldc', 'brushless dc motor', 'drone motor'] },
  { id: 'stepper_motor', words: ['stepper motor', 'stepper', 'nema motor'] },
  { id: 'dc_motor', words: ['dc motor', 'brushed motor', 'brushed dc motor'] },
  { id: 'servo_motor', words: ['servo motor', 'servo'] },
  { id: 'sg90_servo', words: ['sg90', 'sg90 servo', 'micro servo'] },
  { id: 'li_ion_battery', words: ['li-ion battery', 'lithium ion battery', 'li ion battery', '18650', 'battery cell'] },

  // --- Electronics / boards / components ---
  { id: 'arduino_uno', words: ['arduino', 'arduino uno', 'uno r3', 'atmega328'] },
  { id: 'esp32', words: ['esp32', 'esp-32', 'esp wroom', 'esp32 wroom'] },
  { id: 'raspberry_pi', words: ['raspberry pi', 'raspberry', 'rpi', 'pi board'] },
  { id: 'breadboard', words: ['breadboard', 'prototyping board'] },
  { id: 'relay_module', words: ['relay', 'relay module'] },
  { id: 'ultrasonic_sensor', words: ['ultrasonic sensor', 'hc-sr04', 'distance sensor'] },
  { id: 'lcd_display', words: ['lcd', 'lcd display', 'liquid crystal display', '16x2 lcd'] },
  { id: 'ldr_sensor', words: ['ldr', 'light dependent resistor', 'photoresistor'] },
  { id: 'resistor_10k', words: ['resistor', '10k resistor', 'through hole resistor'] },

  // --- Solar / semiconductor ---
  { id: 'solar_panel', words: ['solar panel', 'photovoltaic panel', 'pv panel'] },
  { id: 'heliomotion', words: ['heliomotion', 'solar tracker', 'sun tracker'] },
  { id: 'silicon_pv_cell', words: ['silicon pv cell', 'solar cell', 'photovoltaic cell'] },
  { id: 'solar_semiconductor', words: ['solar semiconductor', 'pn junction', 'semiconductor junction'] },

  // --- Biology / chemistry / physics ---
  { id: 'dna_helix', words: ['dna', 'dna helix', 'double helix', 'genetic code'] },
  { id: 'quantum_particle', words: ['quantum particle', 'quantum mechanics', 'wave function'] },
  { id: 'electron', words: ['electron'] },
  { id: 'hydrogen_atom', words: ['hydrogen atom', 'hydrogen', 'atomic orbital'] },
  { id: 'atomic_nucleus', words: ['atomic nucleus', 'nucleus', 'protons and neutrons'] },
  { id: 'magnetic_field', words: ['magnetic field', 'magnetism', 'field lines'] },

  // --- Space ---
  { id: 'earth', words: ['earth', 'planet earth', 'globe'] },
  { id: 'moon', words: ['moon', 'lunar', 'earth\'s moon'] },
  { id: 'solar_system', words: ['solar system', 'planets', 'our solar system'] },
  { id: 'iss', words: ['iss', 'international space station', 'space station'] },
  { id: 'satellite', words: ['satellite', 'communications satellite', 'orbital satellite'] },

  // --- Misc ---
  { id: 'iron_man_suit', words: ['iron man', 'iron man suit', 'mark suit', 'power armor', 'power armour'] },
];

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Exact/substring keyword pass across the FULL catalog. A single-word keyword (e.g. "turbo")
 * must match a WHOLE token in the query -- plain substring matching would let "turbo" wrongly
 * match inside "turbofan" and misroute a jet-engine query to the turbocharger. A multi-word
 * keyword phrase (e.g. "rack and pinion") is checked as a substring, since false hits from a
 * multi-word phrase are far less likely than from a single short word.
 */
function keywordMatch(query: string): ObjectMetadata | null {
  const q = normalize(query);
  if (!q) return null;
  const qTokens = q.split(' ');
  for (const { id, words } of KEYWORDS) {
    for (const w of words) {
      const isSingleWord = !w.includes(' ');
      const hit = isSingleWord ? qTokens.includes(w) : (q === w || q.includes(w));
      if (hit) {
        const obj = SPATIAL_LIBRARY[id];
        if (obj) return obj;
      }
    }
  }
  return null;
}

function tokenize(s: string): Set<string> {
  return new Set(normalize(s).split(' ').filter((t) => t.length > 2));
}

/**
 * Fuzzy fallback: score every canonical object's id/name/keywords/category against the query by
 * token overlap and return the best match above a low threshold. This is deliberately generous
 * -- the point is "closest real model found" rather than "nothing found", per the product
 * requirement that a query should always surface *something* real whenever it plausibly can.
 */
function fuzzyMatch(query: string): ObjectMetadata | null {
  const qTokens = tokenize(query);
  if (qTokens.size === 0) return null;

  let best: { obj: ObjectMetadata; score: number } | null = null;
  const seen = new Set<string>();

  const scoreAgainst = (obj: ObjectMetadata, extraWords: string[]) => {
    const candidateTokens = tokenize([obj.id, obj.name, obj.category, ...extraWords].join(' '));
    let overlap = 0;
    for (const t of qTokens) {
      if (candidateTokens.has(t)) overlap++;
      else {
        // partial/substring credit (e.g. "cylinder" vs "cylinders", "esp" vs "esp32")
        for (const c of candidateTokens) {
          if (c.includes(t) || t.includes(c)) { overlap += 0.5; break; }
        }
      }
    }
    const score = overlap / Math.max(qTokens.size, 1);
    if (score > 0 && (!best || score > best.score)) best = { obj, score };
  };

  for (const { id, words } of KEYWORDS) {
    const obj = SPATIAL_LIBRARY[id];
    if (!obj || seen.has(id)) continue;
    seen.add(id);
    scoreAgainst(obj, words);
  }
  // Also sweep any catalog entries not represented in KEYWORDS, so the fallback still covers
  // the whole library even if this list drifts out of sync with SPATIAL_LIBRARY in the future.
  for (const id of Object.keys(SPATIAL_LIBRARY)) {
    if (seen.has(id)) continue;
    seen.add(id);
    scoreAgainst(SPATIAL_LIBRARY[id], []);
  }

  // Require only a genuine, nonzero overlap -- a query with ANY real signal toward a catalog
  // entry should surface that entry rather than fall through to a blank placeholder, per the
  // product requirement that a recognisable query always shows a real, detailed model. A query
  // with truly zero overlap against the entire catalog (score stays exactly 0) still returns
  // null here, which is the only case that should fall through to open-ended AI generation.
  return best !== null ? (best as { obj: ObjectMetadata; score: number }).obj : null;
}

export function resolveCanonicalQuery(query: string): ObjectMetadata | null {
  return keywordMatch(query) ?? fuzzyMatch(query);
}

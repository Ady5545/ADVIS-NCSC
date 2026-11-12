/**
 * ADVIS Local Knowledge + Keyless Web Search
 * Local answers are curated educational references. Web search is a retrieval layer,
 * not a claim that ADVIS has independently verified every page.
 */

const LOCAL_KNOWLEDGE = [
  {
    title: "Water (H2O)",
    terms: ["water molecule", "h2o", "water"],
    category: "chemistry",
    reply: "Water (H₂O) has a bent molecular shape. Oxygen has two O–H bonding pairs and two lone pairs; the stronger lone-pair repulsions compress the H–O–H bond angle to about 104.5°. The electron-pair arrangement is approximately tetrahedral."
  },
  {
    title: "Carbon dioxide (CO2)",
    terms: ["carbon dioxide", "co2"],
    category: "chemistry",
    reply: "Carbon dioxide (CO₂) is linear. The central carbon has two electron domains (two C=O double bonds) and no lone pairs, so the O=C=O bond angle is 180°."
  },
  {
    title: "VSEPR theory",
    terms: ["vsepr", "electron pair repulsion", "molecular geometry", "shape of molecules"],
    category: "chemistry",
    reply: "VSEPR theory predicts molecular shape by treating electron domains around a central atom as regions that repel one another. They arrange themselves to reduce repulsion. Lone pairs generally repel more strongly than bonding pairs, which can compress bond angles. VSEPR predicts shapes; it is not a detailed quantum-mechanical model."
  },
  {
    title: "Hybridization",
    terms: ["hybridization", "sp3", "sp2", "sp hybridization"],
    category: "chemistry",
    reply: "In the introductory valence-bond model, hybridization describes combining atomic orbitals on the same atom to form a set of directional orbitals used to describe bonding. Common textbook labels are sp (often linear, 180°), sp² (often trigonal planar, 120°), and sp³ (often tetrahedral electron-domain arrangement, about 109.5°). Actual molecular geometry can be altered by lone pairs and other effects."
  },
  {
    title: "Oxidation and reduction",
    terms: ["redox", "oxidation reduction", "oxidation number", "oxidation state", "oxidising agent", "reducing agent"],
    category: "chemistry",
    reply: "A redox reaction involves electron transfer or a change in oxidation numbers. Oxidation is loss of electrons (oxidation number increases); reduction is gain of electrons (oxidation number decreases). The oxidising agent is reduced, while the reducing agent is oxidised."
  },
  {
    title: "Chemical equilibrium",
    terms: ["chemical equilibrium", "equilibrium constant", "le chatelier", "le chatelier principle", "kc", "kp", "reaction quotient"],
    category: "chemistry",
    reply: "At dynamic chemical equilibrium, the forward and reverse reaction rates are equal, so the concentrations remain constant (not necessarily equal). The equilibrium constant K describes the equilibrium composition at a given temperature. Le Chatelier’s principle says a system at equilibrium shifts in the direction that partially opposes an imposed change in concentration, pressure, or temperature."
  },
  {
    title: "Acids, bases and pH",
    terms: ["acid base", "acids and bases", "ph scale", "what is ph", "ph value"],
    category: "chemistry",
    reply: "In the Brønsted–Lowry model, an acid donates a proton (H⁺) and a base accepts a proton. At 25°C in dilute aqueous solution, pH is defined as −log₁₀[H₃O⁺]; values below 7 are acidic, 7 is neutral, and above 7 are basic under these conditions."
  },
  {
    title: "Atomic structure",
    terms: ["atom", "atomic structure", "proton neutron electron", "subatomic particles"],
    category: "chemistry",
    reply: "An atom has a small, dense nucleus containing positively charged protons and neutral neutrons, with electrons occupying quantum states around it. Nearly all the atom’s mass is in the nucleus. A neutral atom has equal numbers of protons and electrons; the proton count is its atomic number."
  },
  {
    title: "Periodic table",
    terms: ["periodic table", "periodic trends", "atomic number"],
    category: "chemistry",
    reply: "The periodic table arranges elements by increasing atomic number (number of protons). Elements in the same group often have similar valence-electron patterns and related chemical properties. Across a period, effective nuclear charge generally increases; down a group, additional electron shells are added."
  },
  {
    title: "Newton's laws of motion",
    terms: ["newton's laws", "newtons laws", "laws of motion", "first law of motion", "second law of motion", "third law of motion"],
    category: "physics",
    reply: "Newton’s three laws describe classical motion: (1) an object maintains rest or uniform straight-line motion unless acted on by a net external force; (2) the net force equals the rate of change of momentum, and for constant mass F = ma; (3) interacting bodies exert equal and opposite forces on each other. The laws are applied in inertial reference frames."
  },
  {
    title: "Force, mass and acceleration",
    terms: ["force", "f=ma", "mass and acceleration"],
    category: "physics",
    reply: "A net force changes an object's momentum. For constant mass, Newton’s second law is F = ma, where force is measured in newtons (N), mass in kilograms (kg), and acceleration in metres per second squared (m/s²). One newton is 1 kg·m/s²."
  },
  {
    title: "Speed and velocity",
    terms: ["speed", "velocity", "difference between speed and velocity"],
    category: "physics",
    reply: "Speed is the rate of distance travelled and is a scalar quantity. Velocity is the rate of change of displacement and includes direction, so it is a vector. Average speed uses total distance divided by elapsed time; average velocity uses total displacement divided by elapsed time."
  },
  {
    title: "Acceleration",
    terms: ["acceleration", "uniform acceleration", "retardation"],
    category: "physics",
    reply: "Acceleration is the rate of change of velocity with time: a = Δv/Δt for average acceleration. Its SI unit is m/s². An object can accelerate by changing its speed, its direction, or both."
  },
  {
    title: "Work, energy and power",
    terms: ["work energy power", "work in physics", "kinetic energy", "potential energy", "power in physics"],
    category: "physics",
    reply: "In mechanics, work is energy transferred by a force acting through a displacement; for a constant force, W = F s cos θ. Kinetic energy is K = ½mv². Near Earth's surface, gravitational potential energy change is ΔU = mgΔh. Power is the rate of doing work or transferring energy, P = W/t."
  },
  {
    title: "Gravitation",
    terms: ["gravity", "gravitation", "law of universal gravitation", "gravitational force"],
    category: "physics",
    reply: "Newton’s law of universal gravitation states that two point masses attract with force F = Gm₁m₂/r², along the line joining them. Near Earth’s surface, the gravitational acceleration is approximately 9.8 m/s², though it varies slightly with location and altitude."
  },
  {
    title: "Ohm's law",
    terms: ["ohm's law", "ohms law", "voltage current resistance", "v=ir"],
    category: "physics",
    reply: "For an ohmic conductor at constant physical conditions, voltage is proportional to current: V = IR. Voltage is measured in volts, current in amperes, and resistance in ohms. This relation does not describe every component under every condition."
  },
  {
    title: "Electric current",
    terms: ["electric current", "current electricity", "voltage", "resistance", "electric circuit"],
    category: "physics",
    reply: "Electric current is the rate of flow of electric charge, I = ΔQ/Δt, measured in amperes. Voltage is energy transferred per unit charge, and resistance describes how strongly a component opposes current. In circuit diagrams, conventional current is defined in the direction positive charge would flow."
  },
  {
    title: "Series and parallel circuits",
    terms: ["series circuit", "parallel circuit", "series and parallel", "resistors in series", "resistors in parallel"],
    category: "physics",
    reply: "In a series circuit, the same current passes through each component and the potential differences add. For resistors, Rₑq = R₁ + R₂ + … . In a parallel circuit, each branch has the same voltage and currents add; for resistors, 1/Rₑq = 1/R₁ + 1/R₂ + … ."
  },
  {
    title: "Photosynthesis",
    terms: ["photosynthesis", "how plants make food", "photosynthesis equation"],
    category: "biology",
    reply: "Photosynthesis converts light energy into chemical energy. In plants, chlorophyll-containing chloroplasts capture light; light-dependent reactions produce ATP and NADPH, and the Calvin cycle uses them to fix carbon dioxide into carbohydrates. A simplified overall equation is 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂."
  },
  {
    title: "Cell structure",
    terms: ["cell", "cell organelles", "cell membrane", "nucleus of a cell"],
    category: "biology",
    reply: "The cell is the basic structural and functional unit of life. The cell membrane controls exchange with the surroundings; the cytoplasm contains cellular components; DNA stores hereditary information. In eukaryotic cells, the nucleus houses most of the DNA, while organelles such as mitochondria perform specialised functions."
  },
  {
    title: "DNA and genes",
    terms: ["dna", "gene", "genes", "genetic information", "double helix"],
    category: "biology",
    reply: "DNA (deoxyribonucleic acid) is a molecule that stores hereditary information. Its two strands form a double helix, with complementary base pairing: A pairs with T, and C pairs with G. A gene is a DNA sequence that contributes to a functional product, such as an RNA or protein."
  },
  {
    title: "Respiration",
    terms: ["cellular respiration", "aerobic respiration", "respiration in cells"],
    category: "biology",
    reply: "Cellular respiration transfers energy from nutrients into ATP. In aerobic respiration, glucose is oxidised using oxygen, producing carbon dioxide and water. A simplified equation is C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O, with energy captured in ATP and released as heat."
  },
  {
    title: "Human heart and circulation",
    terms: ["human heart", "heart", "blood circulation", "circulatory system"],
    category: "biology",
    reply: "The human heart is a four-chambered muscular pump. The right side sends blood to the lungs for gas exchange; the left side sends oxygenated blood to the body. Valves help keep blood moving in one direction, while arteries carry blood away from the heart and veins carry blood toward it."
  },
  {
    title: "Arduino Uno",
    terms: ["arduino uno", "arduino"],
    category: "engineering",
    reply: "Arduino Uno is a microcontroller development board commonly built around the ATmega328P. It provides digital input/output pins, analogue input pins, timers, serial communication, and a USB interface for programming and power. Check the exact board revision and pin-voltage limits before connecting external hardware."
  },
  {
    title: "ESP32",
    terms: ["esp32", "esp 32", "espressif esp32"],
    category: "engineering",
    reply: "ESP32 is a family of microcontrollers and system-on-chips from Espressif, commonly used in connected embedded projects. Many variants provide Wi‑Fi, Bluetooth, GPIO, ADC, timers, and serial interfaces, but features and pin limits vary by exact model. ESP32 GPIO is generally 3.3 V logic and should not be assumed 5 V tolerant."
  },
  {
    title: "Electric motors",
    terms: ["electric motor", "dc motor", "motor working principle"],
    category: "engineering",
    reply: "An electric motor converts electrical energy into mechanical motion. In a DC motor, current in conductors placed in a magnetic field experiences force, producing torque. The motor’s speed and torque depend on its construction, supply, load, and control electronics."
  },
  {
    title: "Four-stroke engine",
    terms: ["four stroke engine", "4 stroke engine", "four-stroke cycle", "otto cycle"],
    category: "engineering",
    reply: "A conventional four-stroke spark-ignition engine completes one cycle in four piston strokes (two crankshaft revolutions): intake, compression, power, and exhaust. The intake valve admits the charge, compression raises its pressure and temperature, combustion drives the power stroke, and the exhaust stroke expels burnt gases. Real engine timing and valve layouts vary."
  },
  {
    title: "Solar photovoltaic cells",
    terms: ["solar cell", "photovoltaic", "solar panel", "pv cell"],
    category: "engineering",
    reply: "A photovoltaic cell converts light into electrical energy using a semiconductor junction. Photons can create electron–hole pairs; the cell’s internal electric field helps separate these charges, producing a usable voltage and current through an external circuit. Panel output depends on illumination, temperature, orientation, shading, and the cell design."
  },
  {
    title: "Earth and the solar system",
    terms: ["solar system", "earth orbit", "planets", "planetary system"],
    category: "space",
    reply: "The Solar System consists of the Sun and the objects gravitationally bound to it, including eight recognised planets, dwarf planets, moons, asteroids, and comets. Planets orbit the Sun on paths that are approximately elliptical. Earth's seasons are caused mainly by its axial tilt, not by its changing distance from the Sun."
  },
  {
    title: "Artificial intelligence",
    terms: ["artificial intelligence", "machine learning", "ai", "neural network"],
    category: "computing",
    reply: "Artificial intelligence (AI) is a broad field focused on systems that perform tasks associated with capabilities such as perception, language, prediction, and decision-making. Machine learning is a subset of AI in which models learn patterns from data. A model's output can be incorrect, so important claims should be checked against reliable evidence."
  }
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/₀/g, "0").replace(/₁/g, "1").replace(/₂/g, "2")
    .replace(/₃/g, "3").replace(/₄/g, "4").replace(/₅/g, "5")
    .replace(/₆/g, "6").replace(/₇/g, "7").replace(/₈/g, "8").replace(/₉/g, "9")
    .replace(/[^a-z0-9+.'-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isKnowledgeQuestion(message) {
  const text = normalize(message);
  if (!text || text.length < 4) return false;
  if (/\b(what do you think|what is your opinion|should i|can you build|can you make|write me|draft me|design me)\b/.test(text)) return false;
  return /^(what|why|how|explain|define|describe|tell me|difference|compare|give me|can you explain|is|are|does|do|who|when|where)\b/.test(text);
}

function getLocalKnowledgeReply(message) {
  if (!isKnowledgeQuestion(message)) return null;
  const text = " " + normalize(message) + " ";
  const ranked = LOCAL_KNOWLEDGE
    .map((entry) => ({
      entry,
      score: entry.terms.reduce((best, rawTerm) => {
        const term = normalize(rawTerm);
        return text.includes(" " + term + " ") ? Math.max(best, term.length) : best;
      }, 0)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;
  const entry = ranked[0].entry;
  return {
    title: entry.title,
    category: entry.category,
    reply: entry.reply,
    source: "ADVIS local knowledge base"
  };
}

function shouldSearchWeb(message) {
  const text = normalize(message);
  return /\b(search|look up|find online|search online|web search|find sources|latest|current|today|yesterday|tomorrow|this week|this month|recent|breaking|news|weather|live|stock price|exchange rate|who won|results today)\b/.test(text);
}

function cleanXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function readXmlTag(block, tag) {
  const match = String(block).match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">", "i"));
  return match ? cleanXml(match[1]) : "";
}

function parseBingRss(xml) {
  const blocks = String(xml || "").match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
  return blocks.slice(0, 5).map((block) => {
    const title = readXmlTag(block, "title");
    const url = readXmlTag(block, "link");
    const snippet = readXmlTag(block, "description");
    const source = readXmlTag(block, "source");
    if (!title || !/^https?:\/\//i.test(url)) return null;
    return { title: title.slice(0, 220), url: url.slice(0, 700), snippet: snippet.slice(0, 500), source: source.slice(0, 100) || "Bing search" };
  }).filter(Boolean);
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 6500);
  try {
    return await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/rss+xml, application/xml, application/json, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "ADVIS-Educational-Search/1.0"
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function searchBing(query) {
  const url = "https://www.bing.com/search?format=rss&q=" + encodeURIComponent(query);
  const response = await fetchWithTimeout(url, 6500);
  if (!response.ok) throw new Error("Bing search returned HTTP " + response.status);
  return parseBingRss(await response.text());
}

async function searchWikipedia(query) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "5");
  url.searchParams.set("srprop", "snippet");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const response = await fetchWithTimeout(url.toString(), 6500);
  if (!response.ok) throw new Error("Wikipedia search returned HTTP " + response.status);
  const data = await response.json();
  const rows = data && data.query && Array.isArray(data.query.search) ? data.query.search : [];
  return rows.slice(0, 5).map((item) => ({
    title: String(item.title || "").slice(0, 220),
    snippet: cleanXml(item.snippet || "").slice(0, 500),
    url: item.pageid ? "https://en.wikipedia.org/?curid=" + encodeURIComponent(String(item.pageid)) : "https://en.wikipedia.org/wiki/" + encodeURIComponent(String(item.title || "").replace(/ /g, "_")),
    source: "Wikipedia"
  })).filter((item) => item.title && item.url);
}

async function searchWeb(message) {
  const query = String(message || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (!query) return { provider: null, results: [], error: "empty_query" };

  try {
    const results = await searchBing(query);
    if (results.length) return { provider: "Bing RSS", results, error: null };
  } catch (error) {
    console.warn("[ADVIS Web Search] Bing search unavailable:", error && error.message ? error.message : error);
  }

  try {
    const results = await searchWikipedia(query);
    if (results.length) return { provider: "Wikipedia", results, error: null };
  } catch (error) {
    console.warn("[ADVIS Web Search] Wikipedia fallback unavailable:", error && error.message ? error.message : error);
  }

  return { provider: null, results: [], error: "search_unavailable" };
}

function formatWebSearchReply(query, searchResult) {
  const results = searchResult && Array.isArray(searchResult.results) ? searchResult.results : [];
  if (!results.length) {
    return "I couldn't retrieve web results just now. No live information has been verified, so I won't guess. Please try the search again in a moment.";
  }

  const lines = [
    "I searched the web for: " + String(query || "").trim(),
    "Search provider: " + (searchResult.provider || "Web search"),
    "",
    "Here are the most relevant results. These are search-result summaries; open the source links to check the full context:"
  ];
  results.slice(0, 5).forEach((result, index) => {
    lines.push("");
    lines.push((index + 1) + ". " + result.title);
    if (result.snippet) lines.push(result.snippet);
    lines.push("Source: " + result.url);
  });
  return lines.join("\n").slice(0, 5200);
}

module.exports = {
  LOCAL_KNOWLEDGE,
  isKnowledgeQuestion,
  getLocalKnowledgeReply,
  shouldSearchWeb,
  parseBingRss,
  searchWeb,
  formatWebSearchReply
};

const workerSeed = [
  { id: "w1", name: "Meera Kumari", village: "Rampur" },
  { id: "w2", name: "Poonam Devi", village: "Bairiya" },
  { id: "w3", name: "Gurpreet Kaur", village: "Chandpur" },
];

const patientNames = [
  "Sunita Devi", "Rekha Kumari", "Asha Yadav", "Kavita Singh", "Pooja Devi",
  "Suman Patel", "Rani Kumari", "Neha Sharma", "Anita Devi", "Meena Yadav",
  "Ritu Singh", "Geeta Kumari", "Sakshi Devi", "Nisha Patel", "Mamta Yadav",
  "Priya Kumari", "Sita Devi", "Komal Singh", "Jyoti Sharma", "Shanti Devi",
];

export const workers = workerSeed;

export const patients = patientNames.map((name, index) => ({
  id: `p${index + 1}`,
  name,
  age: [24, 28, 19, 32, 26, 30, 22, 27, 35, 21][index % 10],
  village: workerSeed[index % workerSeed.length].village,
}));

const day = 86_400_000;
const now = Date.now();
const types = ["pregnancy", "newborn", "immunization", "general"];
const symptoms = ["", "हल्का बुखार", "कोई शिकायत नहीं", "सिर दर्द", "खांसी"];

export const seedVisits = Array.from({ length: 30 }, (_, index) => {
  const patient = patients[index % patients.length];
  const worker = workerSeed[index % workerSeed.length];
  const type = types[index % types.length];
  const highBp = type === "pregnancy" && index % 7 === 0;
  const createdAt = new Date(now - (index % 9) * day - (index % 7) * 3_600_000).toISOString();
  return {
    id: `v${index + 1}`,
    workerId: worker.id,
    workerName: worker.name,
    patientId: patient.id,
    patientName: patient.name,
    type,
    age: patient.age,
    vitals: { bp: highBp ? "140/90" : index % 3 === 0 ? "118/76" : null, weight: index % 4 === 0 ? `${48 + index % 12} kg` : null, temperature: index % 5 === 0 ? "37.2 °C" : null },
    symptoms: symptoms[index % symptoms.length],
    riskFlag: highBp ? "needs review" : "",
    followUpDate: new Date(now + (index % 5 + 1) * day).toISOString().slice(0, 10),
    transcript: "",
    confirmed: true,
    createdAt,
    syncStatus: index % 8 === 0 ? "pending" : "synced",
    village: worker.village,
  };
});

export function parseVisit(transcript, workerId = "w1") {
  const raw = transcript.trim();
  const normalized = normalizeNumbers(raw);
  const lower = normalized.toLowerCase();
  const patient = fuzzyPatient(raw);
  const bpMatch = normalized.match(/(?:bp|blood pressure|बीपी)\s*(?:is|था|है|:)?\s*(\d{2,3})\s*(?:\/|by|और|से)\s*(\d{2,3})/i)
    || normalized.match(/\b(1[0-9]{2}|[89]\d)\s*(?:\/|by)\s*(\d{2,3})\b/i);
  const ageMatch = normalized.match(/(\d{1,2})\s*(?:months?|mahine|महिने|महीने|साल|years?|वर्ष)/i);
  const worker = workers.find((item) => item.id === workerId) || workers[0];
  const type = /pregnan|garbh|गर्भ|mahin[e]? ki pregnancy/i.test(lower) ? "pregnancy"
    : /newborn|नवजात|new born/i.test(lower) ? "newborn"
      : /vaccin|टीका|immuniz/i.test(lower) ? "immunization"
        : /general|सामान्य/i.test(lower) ? "general" : null;
  const followUpDate = /agle hafte|अगले हफ्ते|next week/i.test(lower)
    ? new Date(Date.now() + 7 * day).toISOString().slice(0, 10)
    : null;
  const patientName = patient?.name || (raw.split(/[,.،]/)[0].split(/\s+/).slice(0, 2).join(" ") || null);
  return {
    id: `v-${crypto.randomUUID()}`,
    workerId: worker.id,
    workerName: worker.name,
    patientId: patient?.id || null,
    patientName,
    patientMatch: patient ? patient.name : null,
    type,
    age: ageMatch ? Number(ageMatch[1]) : null,
    vitals: {
      bp: bpMatch ? `${bpMatch[1]}/${bpMatch[2]}` : null,
      weight: normalized.match(/(\d{2,3}(?:\.\d+)?)\s*(?:kg|kilo|किलो)/i)?.[1] ? `${normalized.match(/(\d{2,3}(?:\.\d+)?)\s*(?:kg|kilo|किलो)/i)[1]} kg` : null,
      temperature: normalized.match(/(\d{2,3}(?:\.\d+)?)\s*(?:°?c|degree|डिग्री)/i)?.[1] ? `${normalized.match(/(\d{2,3}(?:\.\d+)?)\s*(?:°?c|degree|डिग्री)/i)[1]} °C` : null,
    },
    symptoms: /sir dard|सिर दर्द|headache/i.test(lower) ? "सिर दर्द"
      : /bukhar|बुखार|fever/i.test(lower) ? "बुखार"
        : /khansi|खांसी|cough/i.test(lower) ? "खांसी" : null,
    riskFlag: type === "pregnancy" && bpMatch && (Number(bpMatch[1]) >= 140 || Number(bpMatch[2]) >= 90) ? "needs review" : "",
    followUpDate,
    transcript: raw,
    confirmed: false,
    createdAt: new Date().toISOString(),
    syncStatus: "pending",
    village: worker.village,
  };
}

function normalizeNumbers(text) {
  const words = {
    "ek sau chalis": "140", "ek sau assi": "180", "ek sau bees": "120",
    "ek sau tees": "130", "ek sau pachaas": "150", "nabbe": "90",
    "assi": "80", "pachasi": "85", "sattar": "70", "saath": "60",
  };
  let result = text.toLowerCase();
  for (const [spoken, digits] of Object.entries(words)) {
    result = result.replace(new RegExp(spoken, "gi"), digits);
  }
  return result.replace(/\s+by\s+/gi, "/");
}

function fuzzyPatient(transcript) {
  const normalized = transcript.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2);
  let best = null;
  let bestScore = 0;
  for (const patient of patients) {
    const nameTokens = patient.name.toLowerCase().split(/\s+/);
    const score = nameTokens.reduce((sum, token) => sum + (tokens.some((heard) => heard.startsWith(token.slice(0, 4)) || token.startsWith(heard.slice(0, 4))) ? 1 : 0), 0);
    if (score > bestScore) { best = patient; bestScore = score; }
  }
  return bestScore >= 1 ? best : null;
}

const DB_NAME = "asha-voice";
const DB_VERSION = 1;
let dbPromise;

export function openDb() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("visits")) db.createObjectStore("visits", { keyPath: "id" });
      if (!db.objectStoreNames.contains("patients")) db.createObjectStore("patients", { keyPath: "id" });
      if (!db.objectStoreNames.contains("recordings")) db.createObjectStore("recordings", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

export async function loadVisits() {
  try {
    const db = await openDb();
    if (!db) throw new Error("IndexedDB unavailable");
    const stored = await transactionRequest(db, "visits", "readonly", (store) => store.getAll());
    if (stored.length) return stored;
    await replaceAll("visits", seedVisits);
    await replaceAll("patients", patients);
    return seedVisits;
  } catch (error) {
    console.error("Could not load local visit records", error);
    return JSON.parse(localStorage.getItem("asha-visits") || "null") || seedVisits;
  }
}

export async function saveVisit(visit) {
  const visits = await loadVisits();
  const next = [visit, ...visits.filter((item) => item.id !== visit.id)];
  try {
    await replaceAll("visits", next);
    localStorage.setItem("asha-visits", JSON.stringify(next));
  } catch (error) {
    console.error("Could not save visit in IndexedDB", error);
    localStorage.setItem("asha-visits", JSON.stringify(next));
  }
  return next;
}

export async function deleteVisit(id) {
  const visits = (await loadVisits()).filter((visit) => visit.id !== id);
  const db = await openDb();
  if (db) await replaceAll("visits", visits);
  localStorage.setItem("asha-visits", JSON.stringify(visits));
  return visits;
}

export async function saveRecording(id, audio) {
  const db = await openDb();
  if (!db || !audio) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction("recordings", "readwrite");
    tx.objectStore("recordings").put({ id, audio, savedAt: new Date().toISOString() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function replaceAll(storeName, records) {
  return openDb().then((db) => {
    if (!db) throw new Error("IndexedDB unavailable");
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.clear();
      records.forEach((record) => store.put(record));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  });
}

function transactionRequest(db, storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(storeName, mode).objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB-lagring för Provningsprotokoll CCTV
 *
 * Stödjer multipla protokoll. Varje protokoll har ett unikt ID.
 *
 * Object stores:
 *   - "protocols" : Projektinfo per protokoll. Key = protocolId (string).
 *     Värde = { projectName, facilityName, address, postalCity, installer, comments, createdAt, updatedAt }
 *
 *   - "cameras" : Kameradata. Key = "protocolId_cameraNumber" (string).
 *     Värde = { placement, model, ip, mac, rack, panel, panelPort, switchName, switchPort,
 *               checkboxes, notes, date, signature, image }
 */

const DB_NAME = 'ProvningsprotokollCCTV';
const DB_VERSION = 3;

let _db = null;

/**
 * Öppnar (eller skapar/uppgraderar) databasen.
 */
function openDB() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

            // Rensa gamla stores från v1 om de finns
            if (db.objectStoreNames.contains('project')) {
                db.deleteObjectStore('project');
            }
            if (db.objectStoreNames.contains('cameras')) {
                db.deleteObjectStore('cameras');
            }

            // Skapa nya stores
            if (!db.objectStoreNames.contains('protocols')) {
                db.createObjectStore('protocols');
            }
            if (!db.objectStoreNames.contains('cameras')) {
                db.createObjectStore('cameras');
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings');
            }
        };

        request.onsuccess = (e) => {
            _db = e.target.result;
            resolve(_db);
        };

        request.onerror = (e) => {
            console.error('IndexedDB-fel:', e.target.error);
            reject(e.target.error);
        };
    });
}

// =============================================
// Generiska hjälpare
// =============================================

async function dbPut(storeName, key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function dbGet(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function dbGetAll(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const keys = [];
        const values = [];
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                keys.push(cursor.key);
                values.push(cursor.value);
                cursor.continue();
            } else {
                resolve({ keys, values });
            }
        };
        cursorReq.onerror = (e) => reject(e.target.error);
    });
}

async function dbGetAllKeys(storeName) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAllKeys();
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function dbDelete(storeName, key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

// =============================================
// Protokoll
// =============================================

/**
 * Genererar ett unikt protokoll-ID.
 */
function generateProtocolId() {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/**
 * Sparar protokollinfo (metadata / sida 1).
 */
async function saveProtocolInfo(protocolId, data) {
    data.updatedAt = new Date().toISOString();
    if (!data.createdAt) {
        data.createdAt = data.updatedAt;
    }
    return dbPut('protocols', protocolId, data);
}

/**
 * Läser ett protokoll.
 */
async function loadProtocolInfo(protocolId) {
    return dbGet('protocols', protocolId);
}

/**
 * Listar alla protokoll med id och data.
 */
async function listAllProtocols() {
    return dbGetAll('protocols');
}

/**
 * Tar bort ett protokoll och alla dess kameror.
 */
async function deleteProtocol(protocolId) {
    // Ta bort alla kameror som tillhör protokollet
    const allKeys = await dbGetAllKeys('cameras');
    const prefix = protocolId + '_';
    for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith(prefix)) {
            await dbDelete('cameras', key);
        }
    }
    // Ta bort själva protokollet
    return dbDelete('protocols', protocolId);
}

// =============================================
// Kamerainfo (scopad per protokoll)
// =============================================

function cameraKey(protocolId, cameraNumber) {
    return `${protocolId}_${cameraNumber}`;
}

/**
 * Sparar data för en enskild kamera inom ett protokoll.
 */
async function saveCameraData(protocolId, cameraNumber, data) {
    return dbPut('cameras', cameraKey(protocolId, cameraNumber), data);
}

/**
 * Läser en enskild kamera.
 */
async function loadCameraData(protocolId, cameraNumber) {
    return dbGet('cameras', cameraKey(protocolId, cameraNumber));
}

/**
 * Hämtar alla kameranummer för ett protokoll.
 */
async function getSavedCameraNumbers(protocolId) {
    const allKeys = await dbGetAllKeys('cameras');
    const prefix = protocolId + '_';
    return allKeys
        .filter(k => typeof k === 'string' && k.startsWith(prefix))
        .map(k => parseInt(k.substring(prefix.length), 10))
        .sort((a, b) => a - b);
}

/**
 * Tar bort en sparad kamera.
 */
async function deleteCameraData(protocolId, cameraNumber) {
    return dbDelete('cameras', cameraKey(protocolId, cameraNumber));
}

// =============================================
// Export / Import
// =============================================

/**
 * Hämtar ALL data för ett protokoll inkl. kameror och bilder.
 * Används för export.
 */
async function getCompleteProtocolData(protocolId) {
    const info = await loadProtocolInfo(protocolId);
    if (!info) return null;

    const cameraNumbers = await getSavedCameraNumbers(protocolId);
    const cameras = [];
    for (const num of cameraNumbers) {
        const cam = await loadCameraData(protocolId, num);
        if (cam) cameras.push({ number: num, data: cam });
    }

    return { info, cameras };
}

/**
 * Räknar kameror per protokoll för en lista av protokoll-ID:n.
 * Returnerar ett objekt { protocolId: count }.
 */
async function getCameraCountsForProtocols(protocolIds) {
    if (!protocolIds.length) return {};
    const allKeys = await dbGetAllKeys('cameras');
    const counts = {};
    protocolIds.forEach(id => { counts[id] = 0; });
    for (const key of allKeys) {
        if (typeof key !== 'string') continue;
        for (const id of protocolIds) {
            if (key.startsWith(id + '_')) {
                counts[id]++;
                break;
            }
        }
    }
    return counts;
}

/**
 * Duplicerar ett protokoll inkl. alla kameror. Returnerar det nya protokoll-ID:t.
 */
async function duplicateProtocol(sourceId) {
    const data = await getCompleteProtocolData(sourceId);
    if (!data) return null;
    data.info.projectName = (data.info.projectName || 'Namnlöst') + ' – Kopia';
    return importCompleteProtocolData(data);
}

/**
 * Importerar ett protokoll. Skapar ett helt NYTT ID för att undvika krockar.
 */
async function importCompleteProtocolData(fullData) {
    const newId = generateProtocolId();
    const now = new Date().toISOString();

    // Spara metadata (med nytt ID och uppdaterade tider)
    const info = { ...fullData.info };
    info.createdAt = now;
    info.updatedAt = now;
    await saveProtocolInfo(newId, info);

    // Spara alla kameror
    if (fullData.cameras && Array.isArray(fullData.cameras)) {
        for (const cam of fullData.cameras) {
            await saveCameraData(newId, cam.number, cam.data);
        }
    }

    return newId;
}

// =============================================
// Standardvärden för metodbeskrivning
// =============================================

/**
 * Standardvärden för metodbeskrivningen.
 * Används som fallback om ingen metodbeskrivning finns sparad i IndexedDB.
 * Dessa värden sparas ALDRIG automatiskt – de används bara som läsfallback.
 */
const defaultMethodSettings = {
    intro: "Denna bilaga beskriver tillvägagångssättet för verifiering av systemets funktion och installation. Varje punkt ska utföras och dokumenteras enligt nedan.",
    m1: "Syfte: Säkerställa att kameran är monterad enligt projekteringsritning och täcker det tänkta bevakningsområdet.\nMetod: Kontrollera fysisk position mot ritning. Verifiera att montagehöjd och vinkel medger avsedd identifieringsgrad (t.ex. enligt EN 62676-4).\nKriterium: Kameran sitter på angiven plats utan skymd sikt från fasta installationer (skyltar, belysning etc.).",
    m2: "Syfte: Verifiera att kamerans synfält (FOV) är optimerat.\nMetod: Kontrollera bildutsnittet i VMS (Video Management System). Justera panorering, lutning och zoom.\nKriterium: Horisonten ska vara rak och onödig information (t.ex. för mycket himmel eller närliggande väggar) ska minimeras.",
    m3: "Syfte: Säkerställa maximal detaljåtergivning i prioriterat område.\nMetod: Fokus ställs mot den definierade fokuspunkten (markerad med gul ruta i protokollet). Kontrollera skärpan vid både full vidvinkel och inzoomat läge om relevant.\nKriterium: Text eller ansikten i fokusområdet ska vara knivskarpa utan digitalt brus.",
    m4: "Syfte: Förebygga bildstörningar och reflexer.\nMetod: Okulär besiktning av kamerans frontglas eller kupol efter slutfört montage.\nKriterium: Inga fingeravtryck, byggdamm eller repor får förekomma. Rengöring ska ske med mikrofiberduk och anpassat rengöringsmedel.",
    m5: "Syfte: Garantera att bildmaterialet lagras korrekt.\nMetod: Utför en manuell triggning eller vänta på schemalagd inspelning. Gå in i arkivet och gör en playback av sekvensen.\nKriterium: Video kan spelas upp utan avbrott med korrekt bildhastighet (fps) och upplösning.",
    m6: "Syfte: Optimera lagring och larmhantering.\nMetod: Utför ett \"gångtest\" i det aktuella området. Kontrollera att systemet indikerar larm/inspelning.\nKriterium: Detektering sker i hela det önskade området, men exkluderar störningskällor som träd eller flaggor.",
    m7: "Syfte: Verifiera intelligenta funktioner (t.ex. linjepassage eller staketlarm).\nMetod: Provgå de uppsatta reglerna i analysmjukvaran.\nKriterium: Larm genereras i VMS vid regelbrott med korrekt metadata-taggning.",
    m8: "Syfte: Säkerställa bildkvalitet under dygnets mörka timmar.\nMetod: Forcera kameran i nattläge (täck ljussensorn) eller kontrollera loggar från nattetid.\nKriterium: IR-belysningen ska täcka hela bildvyn utan \"hotspots\" (överexponering i mitten) eller reflexer från kupolen.",
    m9: "Syfte: Juridisk giltighet vid bevisföring.\nMetod: Kontrollera att kamerans interna klocka matchar serverns och referenstid.\nKriterium: Tidstämplen får inte avvika mer än ±1 sekund från systemtiden.",
    m10: "Syfte: Cybersäkerhet.\nMetod: Försök logga in med tillverkarens standarduppgifter (t.ex. admin/admin).\nKriterium: Inloggning med standarduppgifter nekas. Unikt, starkt lösenord är applicerat enligt gällande säkerhetspolicy."
};

// =============================================
// Settings
// =============================================

/**
 * Sparar konfiguration / inställningar
 */
async function saveSettings(key, data) {
    return dbPut('settings', key, data);
}

/**
 * Läser konfiguration / inställningar
 */
async function loadSettings(key) {
    return dbGet('settings', key);
}

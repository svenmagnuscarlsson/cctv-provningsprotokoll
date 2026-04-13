/**
 * Dashboard – listar alla provningsprotokoll och hanterar skapa/öppna/ta bort/kopiera.
 */

let _deleteTargetId = null;
let _allProtocols = []; // Cachat för sökning

window.onload = async () => {
    await renderProtocolList();
};

/**
 * Skapar ett nytt protokoll och navigerar till editorn.
 */
async function createNewProtocol() {
    const id = generateProtocolId();

    await saveProtocolInfo(id, {
        projectName: '',
        facilityName: '',
        address: '',
        postalCity: '',
        installer: '',
        comments: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    window.location.href = `protocol.html?id=${id}`;
}

/**
 * Öppnar ett befintligt protokoll i editorn.
 */
function openProtocol(id) {
    window.location.href = `protocol.html?id=${id}`;
}

/**
 * Renderar listan med protokoll i DOM.
 */
async function renderProtocolList() {
    const { keys, values } = await listAllProtocols();
    const listEl = document.getElementById('protocols-list');
    const emptyEl = document.getElementById('empty-state');
    const searchWrapper = document.getElementById('search-wrapper');

    listEl.innerHTML = '';

    if (keys.length === 0) {
        emptyEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        searchWrapper.style.display = 'none';
        _allProtocols = [];
        return;
    }

    emptyEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    searchWrapper.style.display = keys.length >= 3 ? '' : 'none';

    // Sortera med senast uppdaterade först
    const items = keys.map((k, i) => ({ id: k, data: values[i] }));
    items.sort((a, b) => (b.data.updatedAt || '').localeCompare(a.data.updatedAt || ''));

    // Hämta kameroranta för alla protokoll på en gång
    const cameraCounts = await getCameraCountsForProtocols(keys);

    _allProtocols = items.map(item => ({
        ...item,
        cameraCount: cameraCounts[item.id] || 0
    }));

    renderCards(_allProtocols);
}

/**
 * Renders protocol cards and appends them to the list element.
 * @param {Array<Object>} items - Array of protocol item objects.
 */
function renderCards(items) {
    const listEl = document.getElementById('protocols-list');
    listEl.innerHTML = '';
    for (const item of items) {
        const card = createProtocolCard(item.id, item.data, item.cameraCount);
        listEl.appendChild(card);
    }
}

/**
 * Filtrerar listan efter sökord.
 */
function filterProtocols(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        renderCards(_allProtocols);
        return;
    }
    const filtered = _allProtocols.filter(item => {
        const d = item.data;
        return (
            (d.projectName || '').toLowerCase().includes(q) ||
            (d.facilityName || '').toLowerCase().includes(q) ||
            (d.address || '').toLowerCase().includes(q) ||
            (d.installer || '').toLowerCase().includes(q)
        );
    });
    renderCards(filtered);
}

/**
 * Skapar ett kort-element för ett protokoll.
 */
function createProtocolCard(id, data, cameraCount) {
    const card = document.createElement('div');
    card.className = 'protocol-card bg-white rounded-xl border border-gray-200 p-5 cursor-pointer flex items-center gap-4';
    card.onclick = (e) => {
        if (e.target.closest('.delete-btn') || e.target.closest('.action-btn')) return;
        openProtocol(id);
    };

    const title = data.projectName || 'Namnlöst protokoll';
    const facility = data.facilityName || '';
    const address = [data.address, data.postalCity].filter(Boolean).join(', ');
    const dateStr = formatDate(data.updatedAt);
    const camLabel = cameraCount === 1 ? '1 kamera' : `${cameraCount} kameror`;

    card.innerHTML = `
        <div class="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
        </div>
        <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">${escapeHtml(title)}</h3>
            <p class="text-sm text-gray-500 truncate">${escapeHtml(facility)}${facility && address ? ' — ' : ''}${escapeHtml(address)}</p>
            ${cameraCount > 0 ? `<p class="text-xs text-gray-400 mt-0.5">${camLabel}</p>` : ''}
        </div>
        <div class="text-right flex-shrink-0 hidden sm:block">
            <p class="text-xs text-gray-400">Senast ändrad</p>
            <p class="text-sm text-gray-600 font-medium">${dateStr}</p>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Duplicera-knapp -->
            <button class="action-btn p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Duplicera"
                onclick="event.stopPropagation(); handleDuplicate('${id}', '${escapeHtml(title).replace(/'/g, "\\'")}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
            <!-- Exportera-knapp -->
            <button class="action-btn p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Exportera"
                onclick="event.stopPropagation(); exportProtocol('${id}', '${escapeHtml(title).replace(/'/g, "\\'")}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
            <!-- Ta bort-knapp -->
            <button class="delete-btn p-2 rounded-lg text-gray-400 hover:text-red-600 flex-shrink-0" title="Ta bort"
                onclick="event.stopPropagation(); showDeleteModal('${id}', '${escapeHtml(title).replace(/'/g, "\\'")}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;

    return card;
}

// =============================================
// Delete modal
// =============================================

/**
 * Shows the delete confirmation modal for a specific protocol.
 * @param {string} id - The protocol ID.
 * @param {string} title - The title of the protocol.
 */
function showDeleteModal(id, title) {
    _deleteTargetId = id;
    document.getElementById('delete-modal-text').textContent =
        `Är du säker på att du vill ta bort "${title}"? Alla kameror och bilder raderas permanent.`;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('delete-confirm-btn').onclick = confirmDelete;
}

/**
 * Closes the delete confirmation modal.
 */
function closeDeleteModal() {
    _deleteTargetId = null;
    document.getElementById('delete-modal').classList.add('hidden');
}

/**
 * Confirms and executes the deletion of the selected protocol.
 * @returns {Promise<void>}
 */
async function confirmDelete() {
    if (!_deleteTargetId) return;
    await deleteProtocol(_deleteTargetId);
    closeDeleteModal();
    await renderProtocolList();
}

// =============================================
// Method Modal
// =============================================

// defaultMethodSettings definieras i db.js och är tillgänglig som global variabel.

let methodSaveTimeout = null;

/**
 * Opens the methodology settings modal and populates textareas with current settings.
 * @returns {Promise<void>}
 */
async function openMethodModal() {
    document.getElementById('method-modal').classList.remove('hidden');
    
    // Läs in sparade inställningar, använd defaultvärden som fallback utan att spara dem
    let settings = await loadSettings('methodDescription');
    if (!settings) {
        settings = defaultMethodSettings;
    }
    
    // Populate textareas
    Object.keys(settings).forEach(key => {
        const textarea = document.querySelector(`textarea[data-method-id="${key}"]`);
        if (textarea) {
            textarea.value = settings[key];
        }
    });
}

/**
 * Closes the methodology settings modal and saves any pending changes immediately.
 */
function closeMethodModal() {
    document.getElementById('method-modal').classList.add('hidden');
    // Force immediate save on close
    if (methodSaveTimeout) {
        clearTimeout(methodSaveTimeout);
        methodSaveTimeout = null;
    }
    saveMethodSettings();
}

/**
 * Debounced save to reduce DB writes during typing
 */
function debounceSaveMethodSettings() {
    if (methodSaveTimeout) {
        clearTimeout(methodSaveTimeout);
    }
    methodSaveTimeout = setTimeout(() => {
        saveMethodSettings();
    }, 1000); // 1 sekunds fördröjning
}

/**
 * Gather data from textareas and save to indexedDB
 */
async function saveMethodSettings() {
    const textareas = document.querySelectorAll('textarea[data-method-id]');
    const data = {};
    textareas.forEach(t => {
        data[t.getAttribute('data-method-id')] = t.value;
    });
    
    try {
        await saveSettings('methodDescription', data);
        console.log('Metodbeskrivningsinställningar sparade.');
    } catch (error) {
        console.error('Kunde inte spara metodbeskrivning:', error);
    }
}

/**
 * AI generation using Google Gemini (stores key in localStorage)
 */
async function generateMethodText(methodId, theme) {
    let apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        apiKey = prompt('Ange din Gemini API-nyckel (finns i Google AI Studio) för att generera text:');
        if (!apiKey) return;
        localStorage.setItem('gemini_api_key', apiKey.trim());
    }

    const textarea = document.querySelector(`textarea[data-method-id="${methodId}"]`);
    if (!textarea) return;

    const originalText = textarea.value;
    textarea.value = "Genererar AI-text...";
    textarea.disabled = true;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: "Du är en expert på systematiskt säkerhetsarbete och CCTV (kameraövervakning). Din uppgift är att skriva en kort och koncis metodbeskrivning per kontrollpunkt." }]
                },
                contents: [{
                    parts: [{ text: `Skriv en metodbeskrivning för kontrollpunkten "${theme}" för en CCTV-installation. Svaret MÅSTE exakt följa detta format, med tre rader, utan inledning eller avslutning.\nSyfte: [text]\nMetod: [text]\nKriterium: [text]` }]
                }],
                generationConfig: {
                    temperature: 0.7
                }
            })
        });

        if (response.status === 400 || response.status === 401 || response.status === 403) {
            localStorage.removeItem('gemini_api_key');
            throw new Error("Ogiltig API-nyckel eller otillräcklig behörighet. Kontrollera din nyckel i Google AI Studio. Försök igen.");
        }

        if (!response.ok) {
            throw new Error(`Ett fel uppstod vid kommunikation med AI (Statuskod: ${response.status}).`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text.trim();
        textarea.value = generatedText;
        
        // Trigger save
        debounceSaveMethodSettings();

    } catch (error) {
        console.error("AI Generation Error:", error);
        alert(error.message);
        textarea.value = originalText;
    } finally {
        textarea.disabled = false;
    }
}

// =============================================
// Duplicate
// =============================================

/**
 * Handles the duplication of a protocol.
 * @param {string} id - The default protocol ID to duplicate.
 * @param {string} title - The display title of the protocol.
 * @returns {Promise<void>}
 */
async function handleDuplicate(id, title) {
    try {
        await duplicateProtocol(id);
        await renderProtocolList();
        showToast(`"${title}" duplicerades`);
    } catch (err) {
        console.error('Dupliceringsfel:', err);
        showToast('Kunde inte duplicera protokollet', 'error');
    }
}

// =============================================
// Export / Import
// =============================================

/**
 * Exports a protocol as a downloadable JSON file.
 * @param {string} id - The protocol ID.
 * @param {string} projectName - The project's name used for the file name.
 * @returns {Promise<void>}
 */
async function exportProtocol(id, projectName) {
    try {
        const data = await getCompleteProtocolData(id);
        if (!data) {
            showToast('Kunde inte hitta protokolldata', 'error');
            return;
        }

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const safeFileName = (projectName || 'Namnlöst').replace(/[<>:"/\\|?*]/g, '_');
        const fileName = `Protokoll_${safeFileName}.json`;
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Protokollet exporterades');
    } catch (err) {
        console.error('Exportfel:', err);
        showToast('Ett fel uppstod vid export', 'error');
    }
}

/**
 * Opens the file browser for importing a protocol JSON file.
 */
function handleImportClick() {
    document.getElementById('import-input').click();
}

/**
 * Processes the selected JSON file and imports the protocol data.
 * @param {Event} event - The file input change event.
 * @returns {Promise<void>}
 */
async function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.info || !data.cameras) {
            throw new Error('Ogiltigt filformat: Saknar metadata eller kameradata.');
        }

        await importCompleteProtocolData(data);
        event.target.value = '';

        await renderProtocolList();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        showToast('Protokollet importerades');
    } catch (err) {
        console.error('Importfel:', err);
        showToast('Kunde inte importera filen: ' + err.message, 'error');
        event.target.value = '';
    }
}

// =============================================
// Toast-notiser
// =============================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const isSuccess = type === 'success';
    const colors = isSuccess
        ? 'bg-gray-900 text-white'
        : 'bg-red-600 text-white';
    const icon = isSuccess
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

    toast.className = `toast pointer-events-auto ${colors} px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 text-sm font-medium max-w-xs`;
    toast.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 250);
    }, 3000);
}

// =============================================
// Hjälpfunktioner
// =============================================

/**
 * Formats an ISO date string into a local swedish date string format.
 * @param {string} isoString - The ISO date string.
 * @returns {string} The formatted date string or a dash if invalid.
 */
function formatDate(isoString) {
    if (!isoString) return '—';
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

/**
 * Escapes characters in a string to safe HTML entities to prevent XSS.
 * @param {string} str - The unescaped string.
 * @returns {string} The escaped safe HTML string.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
